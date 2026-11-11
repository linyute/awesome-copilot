# RBAC 預檢 (RBAC pre-flight)

`foundry-agentic-loop` skill 的參考資料：在 agentic loop 執行中於**任何佈建之前**執行的權限關卡，使得遺漏的角色指派能在建立任何內容*之前*作為一份完整清單回報 -- 絕不在佈建途中一次發現一個失敗。

> **為什麼存在此檢查。** 某個 agentic loop 執行在訂用帳戶、接著在資源群組、隨後在 Foundry 專案上陸續遇到 RBAC 失敗。每次皆在部分資源已存在的佈建途中浮現，且每次都必須分開追查：請求授權、重新執行、遇到下一個問題。整組遺漏的指派原本在事前就完全可得知。此步驟使其在事前即可得知。

此步驟刻意維持自給自足 -- 僅需要呼叫者身分識別與參與作用的範圍 -- 因此快速原型製作、SDD Specify 與 Deploy 預檢皆可原封不動重複使用。

## 檢查內容

[執行階段矩陣](rbac-contract.md#runtime-matrix-service-managed-identities) 描述了解決方案的**受控識別** -- 在佈建前尚不存在的主體。預檢則檢查契約的另一半：[**部署者必備條件**](rbac-contract.md#deployer-prerequisites-pre-flight)，即**呼叫者**建立資源以及寫入產生的 Bicep 所將建立的每個角色指派所需的權限。

具體而言：

1. 從部署者必備條件表格中**列舉必要**指派。
2. 為呼叫者在參與作用的每個範圍（訂用帳戶、資源群組、Foundry AI 帳戶與 Foundry 專案）**解析有效**指派 -- 包含**繼承**與**衍生自群組**者。
3. 比對必要與有效指派的**差異 (Diff)**，套用角色對等性（見下方說明）。
4. 以 `principal → scope → role` 形式**一次回報所有缺口**，並附帶訂用帳戶擁有者可直接執行的補救區塊。
5. 出現任何缺口即**快速失敗 (Fail fast)**。此時尚未佈建任何內容，因此沒有需要倒回復原的部分狀態。

### 範圍 (Scopes)

| 範圍 | 解析來源 | 備註 |
| --- | --- | --- |
| 訂用帳戶 | `AZURE_SUBSCRIPTION_ID` / `--subscription` | 當沒有現有的資源群組參與作用時檢查：該執行將建立該群組。 |
| 資源群組 | `AZURE_RESOURCE_GROUP` / `--resource-group` | 當群組**存在**時，其各列會取代訂用帳戶列；訂用帳戶授權仍可透過繼承計入。尚不存在的指定群組會降級回退至訂用帳戶列。 |
| Foundry AI 帳戶 | `AZURE_AI_ACCOUNT_ID` / `--ai-account` | 當執行在現有帳戶中建立模型部署或其他帳戶資源時傳入。 |
| Foundry 專案 | `AZURE_AI_PROJECT_ID` / `--ai-project` | 針對現有專案的每次執行（例如快速原型製作）皆需傳入。 |

綠地 (Greenfield) SDD 執行會建立資源群組、帳戶與專案，因此僅適用訂用帳戶列。棕地 (Brownfield) 執行亦會檢查具體範圍，這正是個別資源授權與訂用帳戶層級授權分歧之處。

### 角色對等性 (Role equivalence)

角色依**內建角色定義 ID** 比對，而非顯示名稱。Azure AI 角色已被重新命名 (Azure AI User → **Foundry User**, Azure AI Project Manager → **Foundry Project Manager**, Azure AI Account Owner → **Foundry Account Owner**, Azure AI Owner → **Foundry Owner**)，且舊名稱在 `az role assignment create` 中已無法解析。`--from-file` 輸入仍接受舊版名稱。自訂角色不進行評估：請手動確認並記錄例外狀況。

需求可由**同等或更廣泛**的指派滿足，因此具備完整權限的呼叫者不會產生任何發現項目，避免大量誤報：

| 需求 | 滿足條件 |
| --- | --- |
| 部署資源 (訂用帳戶或現有資源群組) | Contributor, Owner |
| 寫入角色指派 (相同範圍) | Role Based Access Control Administrator, Owner, User Access Administrator |
| Foundry 帳戶控制平面 | Foundry Account Owner, Foundry Owner, Owner, Contributor, Cognitive Services Contributor |
| Foundry 專案：agents、skills、toolboxes、連線 | Foundry Project Manager, Foundry Owner, 或 Foundry User (或 Cognitive Services User) **加上** 帳戶控制平面角色 |

從較廣泛範圍**繼承**的指派亦可滿足較狹窄範圍的需求：訂用帳戶 Contributor 可滿足資源群組 Contributor 需求。

> **控制平面與資料平面彼此獨立。** Owner、Contributor、Foundry Account Owner 與 Cognitive Services Contributor 授與 `Microsoft.CognitiveServices/*` *actions* 但不授與 `dataActions`，因此單憑它們無法建立 agents、skills 或 toolboxes。Foundry User 授與 `dataActions` 但不授與寫入 actions，因此單憑它無法建立專案連線。因此訂用帳戶 Owner 仍需要在專案上擁有 Foundry User：這個缺口在訂用帳戶與資源群組缺口修復後，曾*單獨*浮現。

## 執行方式

```bash
# 參考檢查 — 將 foundry-agentic-loop skill 的 references/check_rbac_preflight.py 複製到 ./scripts/
# SDD (綠地)：僅訂用帳戶
python ./scripts/check_rbac_preflight.py --subscription "$AZURE_SUBSCRIPTION_ID"
# 快速原型製作 (現有專案)：新增群組與專案，若該執行會建立部署則加上帳戶
python ./scripts/check_rbac_preflight.py --subscription "$AZURE_SUBSCRIPTION_ID" \
  --resource-group "$RESOURCE_GROUP" --ai-project "$FOUNDRY_PROJECT"
```

即時模式呼叫 **Azure CLI** -- `az ad signed-in-user show` 用於解析呼叫者，`az group exists` 用於具名資源群組，接著依每個範圍呼叫 `az role assignment list --assignee <id> --scope <scope> --include-inherited --include-groups`。無需額外的 Python 相依性，且 `az` 在任何由 azd 驅動的執行中皆已存在。傳入 `--assignee` 以檢查已登入使用者以外的主體（服務主體或 CI 身分識別）。

`--from-file <observed.json>` 重播記錄的一組指派（或原始 `az role assignment list` 輸出）而非呼叫 Azure；原始輸出不指名主體，因此需與 `--assignee` 一併傳入。格式錯誤的輸入為 ERROR，絕非 PASS。通過與失敗路徑皆可在沒有訂用帳戶的情況下進行演練。

## 判定結果 (Verdicts)

| 判定結果 | 結束代碼 | 意義 |
| --- | --- | --- |
| `PASS` | `0` | 每個必要的指派皆已滿足。印出**一行**摘要（`--quiet` 不印出任何內容）-- 具備完整權限的執行不會在迴圈輸出中增添雜音。 |
| `BLOCKED` | `2` | 遺漏一或多個必要的指派。印出完整清單。**請勿開始佈建。** |
| `ERROR` | `1` | 無法評估檢查（無呼叫者身分識別、`az` 無法使用、CLI 失敗）。請解決問題而非略過關卡。 |

`BLOCKED` 並非修復迴圈 -- 與[託管整合檢查點](hosted-integration-checkpoint.md#diagnostic-decision-tree)不同，迴圈無法自行授與權限。正確的回應是將報告交給有權限的人員，然後重新執行預檢。

## 報告契約 (Report contract)

印出**每個**遺漏的指派，而非僅印出第一個 -- 一次性取得完整集合正是此設計的核心目的：

```text
RBAC pre-flight: BLOCKED -- 2 required role assignments are missing.

  principal: sara@contoso.com (b3f1...c2a9)

  MISSING  sara@contoso.com -> /subscriptions/<sub-id>/resourceGroups/rg-app
           grant:   Role Based Access Control Administrator (f58310d9-a9f6-439a-9e8d-f62e7b41a168)
           accepts: Role Based Access Control Administrator | Owner | User Access Administrator
           why:     Microsoft.Authorization/roleAssignments/write - create the runtime matrix rows in the resource group
  MISSING  sara@contoso.com -> /subscriptions/<sub-id>/resourceGroups/rg-app/providers/Microsoft.CognitiveServices/accounts/aif-app/projects/proj
           grant:   Foundry User (53ca6127-db72-4b80-b1b0-d745d6d5456d)
           accepts: Foundry Project Manager | Foundry Owner | Foundry User (or Cognitive Services User) plus Foundry Account Owner, Owner, Contributor or Cognitive Services Contributor
           why:     Create and publish hosted agents, skills, toolboxes (data plane) and project connections (control plane)

Ask a subscription owner to run (role definition IDs are stable across renames):

  az role assignment create --assignee "b3f1...c2a9" --role "f58310d9-a9f6-439a-9e8d-f62e7b41a168" --scope "/subscriptions/<sub-id>/resourceGroups/rg-app"
  az role assignment create --assignee "b3f1...c2a9" --role "53ca6127-db72-4b80-b1b0-d745d6d5456d" --scope "/subscriptions/<sub-id>/resourceGroups/rg-app/providers/Microsoft.CognitiveServices/accounts/aif-app/projects/proj"

reference: skills/foundry-agentic-loop/references/rbac-contract.md#deployer-prerequisites-pre-flight
No resources have been created. Re-run this check once the assignments are in place.
```

保留所有四個部分 -- 主體、每個缺口一個註明**範圍、最小授權與接受的替代方案**的 `MISSING` 區塊、現成可執行的補救措施，以及未建立任何內容的陳述。此授權是在考量呼叫者既有權限下完成需求所需的最小角色（在範例中為針對已有 Contributor 的呼叫者提供 Foundry User）。補救區塊將此報告轉化為向訂用帳戶擁有者提出的單一請求，而非反覆溝通對話。

## 在迴圈中的位置

在已知目標訂用帳戶/範圍之後，且在任何 `azd provision`、資源建立或 Bicep 部署之前的**佈建之前**執行。可選在 `azure.yaml` 中將相同指令碼佈線為 `preprovision` 攔截勾點，以便直接執行的 `azd up` 也能受到把關。

在兩種模式下皆將判定結果記錄於 `./.azure/deployment-plan.md`，使稍後的失敗能與已接受並繞過的權限缺口區分開來。

## 重複使用 (Reuse)

該步驟僅依賴呼叫者身分識別與參與作用的範圍，不涉及任何特定模式的狀態 -- 因此兩種 agentic loop 模式皆可繼承使用而無需額外佈線。

## 來源

- [Azure 內建角色](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)
- [角色型存取控制管理員 (Role Based Access Control Administrator)](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/privileged#role-based-access-control-administrator)
- [使用 Azure CLI 列出角色指派](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-list-cli)
- [Microsoft Foundry 角色型存取控制](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/rbac-azure-ai-foundry)
