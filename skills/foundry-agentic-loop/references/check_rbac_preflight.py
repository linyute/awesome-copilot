"""在 foundry-agentic-loop 執行中進行佈建前檢查呼叫者的 RBAC。

`foundry-agentic-loop` skill 的 RBAC 預檢參考實作
（請參閱 references/rbac-preflight.md）。複製至所產生存放庫的 ./scripts/
並在任何佈建*之前*執行它，可選擇作為 `azd` preprovision 攔截勾點 (hook)。

此檢查所防範的失敗是在佈建途中、部分資源已存在後，
才逐一範圍浮現的 RBAC 缺口。因此此檢查會一次回報
*所有*遺漏的指派，形式為 principal -> scope -> role，並附上
可直接提供給訂用帳戶擁有者執行的補救區塊。

必要的指派來自 references/rbac-contract.md 中的 deployer-prerequisites 表格。
有效指派會使用 Azure CLI 讀取
(`az role assignment list --include-inherited --include-groups`)，因此繼承與
衍生自群組的授權均計入。角色透過其內建角色定義 ID 進行比對，因此重新命名
(Azure AI * -> Foundry *) 不會中斷檢查，且需求可由同等或更廣泛的角色滿足
(Owner 可滿足 Contributor)，這就是具備完整權限的執行不會回報任何項目的原因。
不會評估自訂角色。

判定結果 (Verdicts)：
    PASS     所有必要的指派皆已滿足。印出一行摘要
             （若指定 --quiet 則完全不印出）。
    BLOCKED  至少遺漏一項。印出完整清單。請勿開始佈建。
    ERROR    無法評估該檢查 -- 請解決它，不要跳過。

用法：
    python check_rbac_preflight.py --subscription <sub-id>
    python check_rbac_preflight.py --subscription <sub-id> --resource-group rg-app
    python check_rbac_preflight.py --from-file observed.json --subscription <sub-id>

環境變數（皆有對應的旗標）：
    AZURE_SUBSCRIPTION_ID  目標訂用帳戶 (必要)
    AZURE_RESOURCE_GROUP   預先存在的資源群組，若執行以其為目標
    AZURE_AI_ACCOUNT_ID    現有的 Foundry AI 帳戶資源識別碼，若為棕地 (brownfield)
    AZURE_AI_PROJECT_ID    現有的 Foundry 專案資源識別碼，若為棕地 (brownfield)

結束代碼：PASS 為 0，BLOCKED 為 2，ERROR 為 1。
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

REFERENCE = (
    "skills/foundry-agentic-loop/references/rbac-contract.md#deployer-prerequisites-pre-flight"
)

# 範圍類型，依回報順序排列。
SUBSCRIPTION = "subscription"
RESOURCE_GROUP = "resource_group"
AI_ACCOUNT = "ai_account"
AI_PROJECT = "ai_project"

# 內建角色定義 ID 是穩定的；顯示名稱則不是。Microsoft
# 將 Azure AI 角色重新命名為 Foundry 角色，因此請依 ID 比對，並在
# 回報中保留目前的名稱。舊版名稱仍可解析用於 --from-file 輸入。
ROLES: dict[str, tuple[str, str]] = {
    "owner": ("8e3af657-a8ff-443c-a75c-2fe8c4bcb635", "Owner"),
    "contributor": ("b24988ac-6180-42a0-ab88-20f7382dd24c", "Contributor"),
    "user_access_admin": ("18d7d88d-d35e-4fb5-a5c3-7773c20a72d9", "User Access Administrator"),
    "rbac_admin": ("f58310d9-a9f6-439a-9e8d-f62e7b41a168", "Role Based Access Control Administrator"),
    "cs_contributor": ("25fbc0a9-bd7c-42a3-aa1a-3b75d497ee68", "Cognitive Services Contributor"),
    "foundry_owner": ("c883944f-8b7b-4483-af10-35834be79c4a", "Foundry Owner"),
    "foundry_account_owner": ("e47c6f54-e4a2-4754-9501-8e0985b135e1", "Foundry Account Owner"),
    "foundry_project_manager": ("eadc314b-1a2d-4efa-be10-5d325db5065e", "Foundry Project Manager"),
    "foundry_user": ("53ca6127-db72-4b80-b1b0-d745d6d5456d", "Foundry User"),
    "cs_user": ("a97b65f3-24c7-4388-baec-2e87135dc908", "Cognitive Services User"),
}
LEGACY_NAMES = {
    "Azure AI Owner": "foundry_owner",
    "Azure AI Account Owner": "foundry_account_owner",
    "Azure AI Project Manager": "foundry_project_manager",
    "Azure AI User": "foundry_user",
}
_BY_ID = {guid: key for key, (guid, _) in ROLES.items()}
_BY_NAME = {name.lower(): key for key, (_, name) in ROLES.items()} | {
    name.lower(): key for name, key in LEGACY_NAMES.items()
}

# Foundry 控制平面 (Microsoft.CognitiveServices/* actions) 與資料平面
# (Microsoft.CognitiveServices/* dataActions)。Owner、Contributor、Foundry Account
# Owner 和 Cognitive Services Contributor 不包含任何 dataActions，因此都無法
# 單獨建立 agent；Foundry User 與 Cognitive Services User 僅包含
# dataActions，因此都無法單獨建立專案連線。
ACCOUNT_CONTROL = ["foundry_account_owner", "foundry_owner", "owner", "contributor", "cs_contributor"]
DATA_PLANE = ["foundry_user", "cs_user"]
DEPLOY = [{"contributor"}, {"owner"}]
ASSIGN = [{"rbac_admin"}, {"owner"}, {"user_access_admin"}]

# 每個範圍類型的必要指派 -- 部署者必備條件表格。
# 當任何一個替代方案中的所有角色在該範圍皆有效時，即滿足需求。
# 補救措施會依序嘗試，並回報第一個能完成替代方案的措施，
# 因此補救措施是能發揮作用的最小授權。
REQUIREMENTS: list[dict] = [
    {
        "kind": SUBSCRIPTION,
        "why": "建立資源群組以及參考架構中的所有資源",
        "alternatives": DEPLOY,
        "accepts": "Contributor | Owner",
        "remedies": [{"contributor"}],
    },
    {
        "kind": SUBSCRIPTION,
        "why": "Microsoft.Authorization/roleAssignments/write - Bicep 會建立執行階段矩陣的每一列",
        "alternatives": ASSIGN,
        "accepts": "Role Based Access Control Administrator | Owner | User Access Administrator",
        "remedies": [{"rbac_admin"}],
    },
    {
        "kind": RESOURCE_GROUP,
        "why": "在現有資源群組中建立解決方案的所有資源",
        "alternatives": DEPLOY,
        "accepts": "Contributor | Owner",
        "remedies": [{"contributor"}],
    },
    {
        "kind": RESOURCE_GROUP,
        "why": "Microsoft.Authorization/roleAssignments/write - 在資源群組中建立執行階段矩陣列",
        "alternatives": ASSIGN,
        "accepts": "Role Based Access Control Administrator | Owner | User Access Administrator",
        "remedies": [{"rbac_admin"}],
    },
    {
        "kind": AI_ACCOUNT,
        "why": "建立專案、模型部署和帳戶資源 (控制平面)",
        "alternatives": [{role} for role in ACCOUNT_CONTROL],
        "accepts": "Foundry Account Owner | Foundry Owner | Owner | Contributor | "
        "Cognitive Services Contributor",
        "remedies": [{"foundry_account_owner"}],
    },
    {
        "kind": AI_PROJECT,
        "why": "建立與發佈託管的 agent、skill、toolbox (資料平面) 以及專案連線 (控制平面)",
        "alternatives": [{"foundry_project_manager"}, {"foundry_owner"}]
        + [{data, control} for data in DATA_PLANE for control in ACCOUNT_CONTROL],
        "accepts": "Foundry Project Manager | Foundry Owner | Foundry User (or Cognitive "
        "Services User) plus Foundry Account Owner, Owner, Contributor or Cognitive "
        "Services Contributor",
        "remedies": [{"foundry_user"}, {"foundry_project_manager"}],
    },
]


class PreflightError(Exception):
    """無法評估檢查 (判定為 ERROR)。"""


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--subscription",
        default=os.environ.get("AZURE_SUBSCRIPTION_ID"),
        help="目標訂用帳戶識別碼 (預設值：$AZURE_SUBSCRIPTION_ID)。",
    )
    parser.add_argument(
        "--resource-group",
        default=os.environ.get("AZURE_RESOURCE_GROUP"),
        help=(
            "預先存在的資源群組名稱 (預設值：$AZURE_RESOURCE_GROUP)。"
            "若為綠地 (greenfield) 執行請省略，該情況下部署將會建立它。"
        ),
    )
    parser.add_argument(
        "--ai-account",
        default=os.environ.get("AZURE_AI_ACCOUNT_ID"),
        help="現有的 Foundry AI 帳戶資源識別碼 (預設值：$AZURE_AI_ACCOUNT_ID)。",
    )
    parser.add_argument(
        "--ai-project",
        default=os.environ.get("AZURE_AI_PROJECT_ID"),
        help="現有的 Foundry 專案資源識別碼 (預設值：$AZURE_AI_PROJECT_ID)。",
    )
    parser.add_argument(
        "--assignee",
        help=(
            "要檢查的主體 (物件識別碼或 UPN)。預設為已登入的使用者，"
            "或 --from-file 承載中的 'principal'。"
        ),
    )
    parser.add_argument(
        "--from-file",
        help=(
            "從 JSON 檔案讀取觀察到的指派，而非呼叫 Azure。"
            "結構：{'principal': {'id': ..., 'display': ...}, "
            "'assignments': [{'scope': ..., 'role': <name or definition id>}, ...]}. "
            "亦接受原始的 'az role assignment list' 輸出。"
        ),
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="PASS 時不印出任何內容。BLOCKED 回報則一律印出。",
    )
    return parser.parse_args(argv)


def _az(args: list[str]) -> object:
    """執行 `az` 命令並傳回其剖析後的 JSON 輸出。"""
    if shutil.which("az") is None:
        raise PreflightError(
            "在 PATH 上找不到 Azure CLI ('az') -- 除非使用 --from-file，否則為必要。"
        )
    completed = subprocess.run(
        ["az", *args, "-o", "json"],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip().splitlines()
        raise PreflightError(
            f"az {' '.join(args)} 失敗：{detail[-1] if detail else '未知的錯誤'}"
        )
    try:
        return json.loads(completed.stdout or "null")
    except json.JSONDecodeError as exc:
        raise PreflightError(f"az {' '.join(args)} 傳回非 JSON 輸出：{exc}") from exc


def build_scopes(args: argparse.Namespace) -> list[tuple[str, str]]:
    """依回報順序傳回參與作用的 (scope kind, scope id) 配對。

    現有的資源群組負責承載部署，因此其列會取代
    訂用帳戶列（訂用帳戶授權仍可透過繼承滿足這些列）。
    若沒有資源群組，則會檢查訂用帳戶列，因為此執行將建立
    該群組。當執行以現有範圍為目標時，會檢查 Foundry 範圍。
    """
    if not args.subscription:
        raise PreflightError(
            "沒有訂用帳戶：請設定 AZURE_SUBSCRIPTION_ID 或傳入 --subscription。"
        )

    subscription_scope = f"/subscriptions/{args.subscription}"
    if args.resource_group:
        group = args.resource_group
        scopes = [
            (
                RESOURCE_GROUP,
                group
                if group.startswith("/subscriptions/")
                else f"{subscription_scope}/resourceGroups/{group}",
            )
        ]
    else:
        scopes = [(SUBSCRIPTION, subscription_scope)]
    if args.ai_account:
        scopes.append((AI_ACCOUNT, args.ai_account))
    if args.ai_project:
        scopes.append((AI_PROJECT, args.ai_project))
    return scopes


def drop_missing_group(scopes: list[tuple[str, str]], subscription: str) -> list[tuple[str, str]]:
    """當資源群組尚不存在時，改為檢查訂用帳戶列。"""
    for index, (kind, scope) in enumerate(scopes):
        if kind != RESOURCE_GROUP:
            continue
        name = scope.rstrip("/").rsplit("/", 1)[-1]
        sub = scope.split("/")[2] if scope.startswith("/subscriptions/") else subscription
        if _az(["group", "exists", "--name", name, "--subscription", sub]) is False:
            scopes[index] = (SUBSCRIPTION, f"/subscriptions/{sub}")
    return scopes


def _role_key(item: dict) -> str:
    """依定義 ID 將指派對應至 ROLES 索引鍵，若無則降級為依其名稱對應。"""
    for field in ("roleDefinitionId", "role", "roleDefinitionName"):
        value = str(item.get(field) or "").strip()
        if not value:
            continue
        guid = value.rstrip("/").rsplit("/", 1)[-1].lower()
        if guid in _BY_ID:
            return _BY_ID[guid]
        if value.lower() in _BY_NAME:
            return _BY_NAME[value.lower()]
    return ""


def _normalize(assignments: object) -> list[dict[str, str]]:
    """僅保留已知角色；自訂角色和不相關的角色在此無法滿足任何條件。"""
    records = []
    for item in assignments or []:
        if not isinstance(item, dict):
            continue
        scope = item.get("scope")
        role = _role_key(item)
        if scope and role:
            records.append({"scope": str(scope), "role": role})
    return records


def load_from_file(path: str, assignee: str | None) -> tuple[dict[str, str], list[dict[str, str]]]:
    """載入記錄的快照：{"principal": {"id", "display"}, "assignments": [...]}。

    純指派清單不包含主體，因此需要 --assignee；
    報告絕不會為未知的主體印出補救命令。
    """
    try:
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
    except json.JSONDecodeError as exc:
        raise PreflightError(f"{path} 不是有效的 JSON：{exc}") from exc
    if isinstance(payload, list):
        payload = {"assignments": payload}
    if not isinstance(payload, dict):
        raise PreflightError(f"{path} 必須包含物件或指派清單。")
    principal = payload.get("principal") or {}
    assignments = payload.get("assignments")
    if not isinstance(principal, dict) or not isinstance(assignments, list):
        raise PreflightError(
            f"{path} 必須將 'principal' 包含為物件，並將 'assignments' 包含為清單。"
        )
    principal_id = str(assignee or principal.get("id") or "").strip()
    if not principal_id:
        raise PreflightError(f"{path} 未指定主體 -- 請傳入 --assignee。")
    resolved = {
        "id": principal_id,
        "display": str(principal.get("display") or principal_id),
    }
    return resolved, _normalize(assignments)


def resolve_principal(assignee: str | None) -> dict[str, str]:
    if assignee:
        return {"id": assignee, "display": assignee}
    user = _az(["ad", "signed-in-user", "show"])
    if not isinstance(user, dict) or not user.get("id"):
        raise PreflightError(
            "無法解析已登入的使用者 -- 請執行 'az login' 或傳入 --assignee。"
        )
    return {
        "id": str(user["id"]),
        "display": str(user.get("userPrincipalName") or user.get("displayName") or user["id"]),
    }


def resolve_assignments(principal_id: str, scopes: list[tuple[str, str]]) -> list[dict[str, str]]:
    """讀取有效指派 -- 包含繼承與衍生自群組者。"""
    records: list[dict[str, str]] = []
    for _, scope in scopes:
        listed = _az(
            [
                "role",
                "assignment",
                "list",
                "--assignee",
                principal_id,
                "--scope",
                scope,
                "--include-inherited",
                "--include-groups",
            ]
        )
        if not isinstance(listed, list):
            raise PreflightError(f"az role assignment list 未傳回 {scope} 的清單。")
        records.extend(_normalize(listed))
    return records


def _covers(assignment_scope: str, scope: str) -> bool:
    """當 `assignment_scope` 處的指派適用於 `scope` 時傳回 True。

    指派會向下繼承，因此訂用帳戶範圍的授權
    可滿足其下資源群組或 Foundry 專案上的需求。
    """
    a = assignment_scope.rstrip("/").lower()
    s = scope.rstrip("/").lower()
    return s == a or s.startswith(f"{a}/")


def find_missing(
    scopes: list[tuple[str, str]], assignments: list[dict[str, str]]
) -> list[dict[str, object]]:
    """比對必要指派與有效指派，套用角色與範圍對等性。"""
    missing = []
    for kind, scope in scopes:
        effective = {
            record["role"] for record in assignments if _covers(record["scope"], scope)
        }
        for req in REQUIREMENTS:
            alternatives = req["alternatives"]
            if req["kind"] != kind or any(alt <= effective for alt in alternatives):
                continue
            remedy = next(
                (
                    grant
                    for grant in req["remedies"]
                    if any(alt <= effective | grant for alt in alternatives)
                ),
                req["remedies"][-1],
            )
            missing.append(
                {
                    "scope": scope,
                    "grant": sorted(remedy - effective),
                    "accepts": req["accepts"],
                    "why": req["why"],
                }
            )
    return missing


def report_blocked(principal: dict[str, str], missing: list[dict[str, object]]) -> None:
    count = len(missing)
    plural = "" if count == 1 else "s"
    print(
        f"RBAC pre-flight: BLOCKED -- {count} required role assignment{plural} "
        f"{'is' if count == 1 else 'are'} missing."
    )
    print()
    print(f"  principal: {principal['display']} ({principal['id']})")
    print()
    for gap in missing:
        grant = ", ".join(f"{ROLES[key][1]} ({ROLES[key][0]})" for key in gap["grant"])
        print(f"  MISSING  {principal['display']} -> {gap['scope']}")
        print(f"           grant:   {grant}")
        print(f"           accepts: {gap['accepts']}")
        print(f"           why:     {gap['why']}")
    print()
    print("Ask a subscription owner to run (role definition IDs are stable across renames):")
    print()
    for gap in missing:
        for key in gap["grant"]:
            print(
                f'  az role assignment create --assignee "{principal["id"]}" '
                f'--role "{ROLES[key][0]}" --scope "{gap["scope"]}"'
            )
    print()
    print(f"reference: {REFERENCE}")
    print("No resources have been created. Re-run this check once the assignments are in place.")


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    try:
        scopes = build_scopes(args)
        if args.from_file:
            principal, assignments = load_from_file(args.from_file, args.assignee)
        else:
            scopes = drop_missing_group(scopes, args.subscription)
            principal = resolve_principal(args.assignee)
            assignments = resolve_assignments(principal["id"], scopes)
    except (PreflightError, OSError) as exc:
        print(f"RBAC pre-flight: ERROR -- {exc}", file=sys.stderr)
        return 1
    except (TypeError, ValueError, KeyError, AttributeError) as exc:
        print(f"RBAC pre-flight: ERROR -- unexpected input shape: {exc}", file=sys.stderr)
        return 1

    missing = find_missing(scopes, assignments)
    if missing:
        report_blocked(principal, missing)
        return 2

    if not args.quiet:
        required = sum(1 for kind, _ in scopes for req in REQUIREMENTS if req["kind"] == kind)
        checked = ", ".join(kind.replace("_", " ") for kind, _ in scopes)
        print(
            f"RBAC pre-flight: PASS -- {required} required role assignments satisfied "
            f"({checked})."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
