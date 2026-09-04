#!/usr/bin/env python3
"""防呆（poka-yoke）危害的啟發式偵測器，找出程式碼中容易引發錯誤的結構。

這是一個快速的初步掃描工具，而非全知神諭。它能找出可透過文字偵測的危害，
讓審查人員能將注意力集中在正規表示式無法詢問的介面層級問題上。
請預期會出現真正的誤報；每個偵測到的項目都是一項提問，而不是定論。

危害 ID 對應至 references/hazard-catalog.md。僅使用標準函式庫。

範例：
    detect_hazards.py --diff                  # 尚未認可的變更，僅限已變更的行
    detect_hazards.py --staged                # 暫存的變更
    detect_hazards.py --since HEAD~10         # 最近 10 次認可
    detect_hazards.py --paths src/ lib/       # 明確指定的路徑
    detect_hazards.py --diff --severity high  # 僅限影響最嚴重的項目
    detect_hazards.py --paths . --json        # 機器可讀格式
"""

from __future__ import annotations

import argparse
import ast
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

# --------------------------------------------------------------------------------------
# 規則定義
# --------------------------------------------------------------------------------------

PY = {".py", ".pyi"}
TS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
GO = {".go"}
RS = {".rs"}
SQL = {".sql"}
ALL_EXTS = PY | TS | GO | RS | SQL

LENS = {"C": "contact", "F": "fixed-value", "M": "motion-step", "X": "removed-device"}


@dataclass(frozen=True)
class Rule:
    id: str
    name: str
    severity: str  # high | medium | low
    exts: frozenset
    pattern: re.Pattern
    device: str
    negate: re.Pattern | None = None  # 若此規則亦符合該行，則略過


def R(id, name, severity, exts, pattern, device, negate=None, flags=0):
    return Rule(
        id=id,
        name=name,
        severity=severity,
        exts=frozenset(exts),
        pattern=re.compile(pattern, flags),
        device=device,
        negate=re.compile(negate, flags) if negate else None,
    )


RULES: list[Rule] = [
    # ---- X: 已移除的機制 -------------------------------------------------
    R("X1", "Swallowed error", "high", TS,
      r"catch\s*(\([^)]*\))?\s*\{\s*\}",
      "處理它或讓它傳遞；捕捉錯誤後什麼都不做會讓顯著的失敗變成無聲無息。"),
    R("X1", "Swallowed error", "high", TS,
      r"\.catch\s*\(\s*\(\s*\)\s*=>\s*(\{\s*\}|null|undefined)\s*\)",
      "處理此拒絕（rejection）或讓它傳遞。"),
    R("X1", "Bare except", "high", PY,
      r"^\s*except\s*:",
      "捕捉特定的例外；無指明的 bare except 也會吞掉 KeyboardInterrupt/SystemExit。"),
    R("X1", "Discarded error return", "high", GO,
      r",\s*_\s*:?=\s*\w|^\s*_\s*=\s*\w[\w.]*\(",
      "檢查錯誤。在 golangci-lint 中啟用 errcheck 以使此情況在建構時失敗。"),
    R("X2", "Unwrap / expect on a fallible value", "medium", RS,
      r"\.(unwrap|expect)\s*\(",
      "使用 ? 向上傳遞或處理該錯誤；禁用 clippy::unwrap_used。"),
    R("X2", "Silent default on error", "medium", RS,
      r"\.unwrap_or_default\s*\(\s*\)",
      "在錯誤路徑上使用預設值會掩蓋失敗；請明確針對錯誤進行分支處理。"),
    R("X2", "parseInt without radix", "medium", TS,
      r"parseInt\s*\(\s*[^,)]+\)",
      "傳遞基數（radix）並檢查 NaN，或在邊界處使用結構描述（schema）剖析。"),
    R("X3", "Focused test disables the suite", "high", TS,
      r"\b(it|test|describe|context)\.only\s*\(|\bfdescribe\s*\(|\bfit\s*\(",
      "在合併前移除；若有聚焦測試（focused test）則使 CI 失敗。"),
    R("X3", "Skipped test", "medium", PY,
      r"@pytest\.mark\.skip|@unittest\.skip",
      "跳過的測試等同於已關閉的偵測機制。修復它或刪除它。"),
    R("X3", "Skipped test", "medium", TS,
      r"\b(it|test|describe)\.skip\s*\(|\bxit\s*\(|\bxdescribe\s*\(",
      "跳過的測試等同於已關閉的偵測機制。修復它或刪除它。"),
    R("X3", "Skipped test", "medium", GO, r"\bt\.Skip\s*\(",
      "跳過的測試等同於已關閉的偵測機制。修復它或刪除它。"),
    R("X3", "Skipped test", "medium", RS, r"^\s*#\[ignore\]",
      "跳過的測試等同於已關閉的偵測機制。修復它或刪除它。"),
    R("X4", "Type-checker suppression", "medium", TS,
      r"@ts-ignore|@ts-nocheck|\bas\s+unknown\s+as\b|eslint-disable(?!-next-line\s+\S+\s+--)",
      "每次抑制都是保證上的漏洞。必須要求理由與 Issue 連結。"),
    R("X4", "Explicit any", "medium", TS,
      r":\s*any\b|<any>|Array<any>|as\s+any\b",
      "any 會在最需要保證的地方停用型別系統。請在邊界處進行剖析。"),
    R("X4", "Type-checker suppression", "medium", PY,
      r"#\s*type:\s*ignore(?!\[)",
      "請將其限縮至特定錯誤代碼並新增理由。"),
    R("X4", "Untyped container", "low", GO,
      r"\binterface\{\}|\bany\b\s*[,)\]]",
      "建議改用具體型別或受約束的泛型（constrained generic）。"),
    R("X4", "unsafe block", "medium", RS, r"\bunsafe\s*\{",
      "必須要求 // SAFETY: 註解說明維持的不變性（invariant）。"),
    R("X5", "Mutable default argument", "high", PY,
      r"def\s+\w+\s*\([^)]*=\s*(\[\s*\]|\{\s*\}|set\s*\(\s*\))",
      "請使用 None 並在函式內部建構；預設值會在所有呼叫之間共用。"),

    # ---- F: 固定值（fixed-value） ---------------------------------------------------------------
    R("F2", "Unbounded DELETE", "high", SQL | PY | TS | GO | RS,
      r"\bDELETE\s+FROM\b(?!.*\bWHERE\b)",
      "必須包含 WHERE 子句；拒絕空條件述詞。", flags=re.I),
    R("F2", "Unbounded UPDATE", "high", SQL | PY | TS | GO | RS,
      r"\bUPDATE\s+[\w.\"`\[\]]+\s+SET\b(?!.*\bWHERE\b)",
      "必須包含 WHERE 子句；拒絕空條件述詞。", flags=re.I),
    R("F2", "Destructive DDL", "high", SQL | PY | TS | GO | RS,
      r"\b(DROP\s+(TABLE|COLUMN|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)\b",
      "請使用擴展/收縮（expand/contract）模式；破壞性 DDL 需經明確的 CI 確認把關。",
      flags=re.I),
    R("F2", "Bulk delete", "high", TS | PY,
      r"\.(deleteMany|delete_many|destroy_all|delete_all|drop_all|removeMany)\s*\(\s*\)",
      "拒絕空的篩選條件；限制受影響的數量，超過上限時要求確認。"),
    R("F2", "Recursive force remove", "high", ALL_EXTS,
      r"rm\s+-[a-zA-Z]*[rR][a-zA-Z]*f|rm\s+-[a-zA-Z]*f[a-zA-Z]*[rR]",
      "在刪除前驗證路徑非空且位於預期的根目錄內。"),
    R("F4", "Config read away from startup", "medium", PY,
      r"os\.(getenv|environ)",
      "在啟動時將整個設定剖析為具型別的物件，讓缺少的索引鍵能在部署時立即失敗。",
      negate=r"(settings|config|conf|env)\.py"),
    R("F4", "Config read away from startup", "medium", TS,
      r"process\.env\.\w+",
      "在啟動時將整個設定剖析為具型別的物件，讓缺少的索引鍵能在部署時立即失敗。",
      negate=r"(config|env|settings)\.(ts|js)"),
    R("F7", "Unbounded read", "low", PY | TS,
      r"\.read\s*\(\s*\)|\.readAll\s*\(|ioutil\.ReadAll",
      "在邊界處限制大小；無限制的讀取可能導致資源耗盡事故。"),

    # ---- C: 接觸（contact） -------------------------------------------------------------------
    R("C2", "Boolean flag parameter", "medium", TS,
      r"\b\w+\s*:\s*boolean\s*[,)]",
      "使用列舉（enum）、具名選項物件或拆成兩個函式；布林值在呼叫處缺乏可讀性。"),
    R("C2", "Boolean flag parameter", "medium", GO,
      r"func\s+\w+\s*\([^)]*\bbool\b[^)]*\)",
      "使用具名選項型別；獨立的 bool 在呼叫處缺乏可讀性。"),
    R("C2", "Boolean default parameter", "medium", PY,
      r"def\s+\w+\s*\([^)]*\b\w+\s*(:\s*bool\s*)?=\s*(True|False)",
      "使用列舉，或至少將其設為僅限關鍵字引數，使名稱能在呼叫處顯示。"),
    R("C5", "Duration without a unit", "medium", TS | GO | PY,
      r"\b(timeout|delay|interval|ttl|expiry|duration|retryAfter|retry_after)\s*:?\s*(number|int|float|=\s*\d+)",
      "在型別中編碼單位（Duration）或在名稱中指定（timeoutMs）。單位不符往往難以察覺。"),
    R("C6", "Money as a float", "high", PY | TS | GO | RS,
      r"\b(price|amount|total|balance|cost|fee|subtotal|revenue)\w*\s*:\s*(float|number|f32|f64)\b"
      r"|\bfloat\s*\(\s*\w*(price|amount|total|balance)",
      "在帶有幣別的 Money 型別中使用整數最小貨幣單位（minor units），或使用 Decimal 型別。"),
    R("C7", "Unvalidated parse", "high", TS,
      r"JSON\.parse\s*\(",
      "在邊界處剖析至結構描述（zod/valibot）；JSON.parse 會回傳 any。"),
    R("C7", "Unvalidated request body", "high", PY,
      r"(request|req)\.(json|get_json)\s*\(\s*\)(?!\s*\))",
      "剖析為 extra='forbid' 的 Pydantic 模型，使未知或缺少的欄位能明確報錯。"),
    R("C9", "Naive datetime", "medium", PY,
      r"datetime\.utcnow\s*\(\s*\)|datetime\.now\s*\(\s*\)",
      "使用 datetime.now(timezone.utc)，並插入時鐘以便於測試時間。"),

    # ---- M: 動作步驟（motion-step） ---------------------------------------------------------------
    R("M4", "Unmanaged resource", "medium", PY,
      r"^\s*(\w+\s*=\s*)?open\s*\(",
      "請使用環境定義管理員（context manager）；否則發生錯誤時會造成外洩。",
      negate=r"\bwith\b"),
    R("M6", "Dangling async task", "high", PY,
      r"^\s*(await\s+)?asyncio\.create_task\s*\(",
      "保留參照；未被參照的任務可能會在執行途中被垃圾回收（ruff RUF006）。",
      negate=r"=\s*(await\s+)?asyncio\.create_task"),
    R("M6", "Unawaited promise-returning call", "low", TS,
      r"^\s*\w+\.(save|update|create|delete|insert|write|send|publish|commit)\s*\(",
      "若此呼叫回傳 promise，請使用 await：未等待的寫入會無聲無息地遺失。"
      "請啟用 @typescript-eslint/no-floating-promises。",
      negate=r"\b(await|return|yield|void)\b|\.then\(|=\s"),
    R("M2", "Retryable effect without an idempotency key", "high", ALL_EXTS,
      r"\b(def|func|function|fn|async\s+function)\s+\w*(charge|refund|capture|payout|transfer|"
      r"sendEmail|send_email|publish|notify)\w*\s*[(<]",
      "要求冪等性金鑰（idempotency key）參數，並在 (entity, key) 上加上唯一限制條件支援。",
      negate=r"idempot", flags=re.I),
    R("M1", "Two-phase construction", "medium", ALL_EXTS,
      r"\b(def|func|function|fn)\s+(init|initialize|connect|setup|configure|start)\s*[(<]",
      "讓建構函式或處理站回傳就緒的物件，或使用型別狀態（typestate）；"
      "「先呼叫此函式」是無法強制約束的。",
      negate=r"__init__|func\s+init\s*\(\s*\)\s*\{"),

    # ---- F1: 窮舉性（exhaustiveness） -----------------------------------------------------------
    R("F1", "Wildcard match arm", "medium", RS,
      r"^\s*_\s*=>",
      "在領域邏輯中，萬用字元會讓未來的編譯錯誤變成無聲的遞補執行（fallthrough）。"),
    R("F1", "Switch without exhaustiveness check", "low", TS,
      r"^\s*switch\s*\(",
      "新增一個呼叫 assertNever(x: never) 的 default 分支，使新增變體時能中斷建構。"),
    R("F1", "Switch without a default", "low", GO,
      r"^\s*switch\s+\w+\s*\{",
      "啟用具有 default-signifies-exhaustive: false 的「exhaustive」linter。"),
]

# 真正 linter 已經做得更好的規則。這些規則在 --all 底下仍可供未執行那些
# linter 的存放庫使用，但預設為關閉：一個做好八件其他工具沒做之事的工具，
# 比做不好四十件事的工具更有用。這裡的價值在於指引，知道該啟用哪個 linter
# 比自己做出二流的重新實作更好。
COVERED_BY: dict[tuple[str, str], str] = {
    ("X1", "Swallowed error"): "eslint no-empty",
    ("X1", "Bare except"): "ruff E722",
    ("X1", "Discarded error return"): "golangci-lint errcheck",
    ("X2", "Unwrap / expect on a fallible value"): "clippy::unwrap_used",
    ("X2", "Silent default on error"): "clippy",
    ("X2", "parseInt without radix"): "eslint radix",
    ("X3", "Focused test disables the suite"): "eslint jest/no-focused-tests",
    ("X3", "Skipped test"): "eslint jest/no-disabled-tests",
    ("X4", "Type-checker suppression"): "@typescript-eslint/ban-ts-comment, mypy --strict",
    ("X4", "Explicit any"): "@typescript-eslint/no-explicit-any",
    ("X4", "Untyped container"): "golangci-lint",
    ("X4", "unsafe block"): "clippy",
    ("X5", "Mutable default argument"): "ruff B006",
    ("C9", "Naive datetime"): "ruff DTZ",
    ("M4", "Unmanaged resource"): "ruff SIM115",
    ("M6", "Dangling async task"): "ruff RUF006",
    ("F1", "Wildcard match arm"): "clippy::wildcard_enum_match_arm",
    ("F7", "Unbounded read"): "",
    ("F3", "assert used for validation"): "ruff S101",
    ("C6", "Equality comparison on a float"): "ruff PLR0133",
}


def covered(rule_id: str, name: str) -> str:
    return COVERED_BY.get((rule_id, name), "")


# --------------------------------------------------------------------------------------
# AST 階段（僅限 Python），捕捉正規表示式無法識別的內容
# --------------------------------------------------------------------------------------


def python_ast_findings(path: Path, source: str) -> list[dict]:
    """需要真正剖析的結構性檢查：相鄰同型別參數、使用 assert 進行驗證，
    以及浮點數的相等性比較。"""
    out = []
    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError:
        return out

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            args = node.args.posonlyargs + node.args.args
            # 略過 self/cls
            if args and args[0].arg in ("self", "cls"):
                args = args[1:]
            annotated = [(a.arg, ast.unparse(a.annotation)) for a in args if a.annotation]
            for i in range(len(annotated) - 1):
                (n1, t1), (n2, t2) = annotated[i], annotated[i + 1]
                if t1 == t2 and t1 in ("str", "int", "float", "bytes", "bool", "UUID"):
                    out.append({
                        "id": "C1",
                        "name": "Adjacent same-type parameters",
                        "severity": "high",
                        "line": node.lineno,
                        "snippet": f"def {node.name}(..., {n1}: {t1}, {n2}: {t2}, ...)",
                        "device": f"'{n1}' 與 '{n2}' 皆為 {t1}，可能在無意間被互換。"
                                  "請為每個概念使用 NewType，或將其設為僅限關鍵字引數。",
                    })
            # 寬簽章上的位置引數
            if len(args) >= 4 and not node.args.kwonlyargs:
                out.append({
                    "id": "C1",
                    "name": "Wide positional signature",
                    "severity": "low",
                    "line": node.lineno,
                    "snippet": f"def {node.name}({len(args)} positional params)",
                    "device": "使用 '*' 將參數設為僅限關鍵字引數，使名稱能在呼叫處顯示。",
                })

        elif isinstance(node, ast.Assert):
            out.append({
                "id": "F3",
                "name": "assert used for validation",
                "severity": "medium",
                "line": node.lineno,
                "snippet": ast.unparse(node)[:100],
                "device": "assert 會在 python -O 下被移除。請改為明確引發例外。",
            })

        elif isinstance(node, ast.Compare):
            for op in node.ops:
                if isinstance(op, (ast.Eq, ast.NotEq)):
                    src = ast.unparse(node)
                    if re.search(r"\d+\.\d+", src):
                        out.append({
                            "id": "C6",
                            "name": "Equality comparison on a float",
                            "severity": "medium",
                            "line": node.lineno,
                            "snippet": src[:100],
                            "device": "請使用 math.isclose，或使用 Decimal/整數最小貨幣單位型別。",
                        })
    return out


# --------------------------------------------------------------------------------------
# 檔案與 diff 收集
# --------------------------------------------------------------------------------------

SKIP_DIRS = {
    ".git", "node_modules", "vendor", "dist", "build", "target", "__pycache__",
    ".venv", "venv", ".tox", ".mypy_cache", ".pytest_cache", ".next", "coverage",
    ".terraform", "site-packages",
}


def git(*args: str, cwd: Path) -> str:
    try:
        r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, timeout=30)
        return r.stdout if r.returncode == 0 else ""
    except (subprocess.SubprocessError, FileNotFoundError):
        return ""


def changed_files_and_lines(cwd: Path, mode: str, since: str | None):
    """回傳 {path: set(changed_line_numbers)}。空集合代表「整個檔案」。"""
    if mode == "staged":
        diff_args = ["diff", "--cached", "-U0"]
    elif mode == "since":
        diff_args = ["diff", f"{since}..HEAD", "-U0"]
    else:
        diff_args = ["diff", "HEAD", "-U0"]

    raw = git(*diff_args, cwd=cwd)
    if not raw.strip() and mode == "diff":
        # 乾淨的工作區樹狀結構，回退至最近的認可，這通常是使用者的本意。
        raw = git("diff", "HEAD~5..HEAD", "-U0", cwd=cwd)

    result: dict[str, set[int]] = {}
    current = None
    for line in raw.splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
            result.setdefault(current, set())
        elif line.startswith("@@") and current:
            m = re.search(r"\+(\d+)(?:,(\d+))?", line)
            if m:
                start = int(m.group(1))
                count = int(m.group(2) or 1)
                result[current].update(range(start, start + count))
    return {k: v for k, v in result.items() if v}


def collect_paths(roots: list[str]) -> list[Path]:
    out = []
    for root in roots:
        p = Path(root)
        if p.is_file():
            if p.suffix in ALL_EXTS:
                out.append(p)
        elif p.is_dir():
            for dirpath, dirnames, filenames in os.walk(p):
                dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
                for fn in filenames:
                    fp = Path(dirpath) / fn
                    if fp.suffix in ALL_EXTS:
                        out.append(fp)
    return out


# --------------------------------------------------------------------------------------
# 掃描
# --------------------------------------------------------------------------------------

COMMENT_ONLY = re.compile(r"^\s*(//|#|/\*|\*|--)")


def scan_file(path: Path, only_lines: set[int] | None) -> list[dict]:
    try:
        source = path.read_text(encoding="utf-8", errors="replace")
    except (OSError, UnicodeDecodeError):
        return []
    if len(source) > 2_000_000:
        return []

    findings = []
    ext = path.suffix
    lines = source.splitlines()

    for lineno, line in enumerate(lines, 1):
        if only_lines and lineno not in only_lines:
            continue
        if COMMENT_ONLY.match(line) or len(line) > 500:
            continue
        for rule in RULES:
            if ext not in rule.exts:
                continue
            if not INCLUDE_COVERED and covered(rule.id, rule.name):
                continue
            if rule.negate and (rule.negate.search(line) or rule.negate.search(str(path))):
                continue
            if rule.pattern.search(line):
                findings.append({
                    "id": rule.id,
                    "name": rule.name,
                    "severity": rule.severity,
                    "line": lineno,
                    "snippet": line.strip()[:120],
                    "device": rule.device,
                })

    if ext in PY:
        for f in python_ast_findings(path, source):
            if not INCLUDE_COVERED and covered(f["id"], f["name"]):
                continue
            if not only_lines or f["line"] in only_lines:
                findings.append(f)

    for f in findings:
        f["file"] = str(path)
        f["lens"] = LENS.get(f["id"][0], "unknown")
    return findings


# --------------------------------------------------------------------------------------
# 輸出
# --------------------------------------------------------------------------------------

INCLUDE_COVERED = False

SEV_ORDER = {"high": 0, "medium": 1, "low": 2}
COLOR = {"high": "\033[31m", "medium": "\033[33m", "low": "\033[90m"}
RESET = "\033[0m"


def render(findings: list[dict], scope: str, use_color: bool) -> str:
    if not findings:
        return f"在 {scope} 中未偵測到危害。\n\n這些視角（lenses）仍然適用，可手動執行檢查：\n" \
               "  contact（接觸）:     錯誤的東西是否可能放入？\n" \
               "  fixed-value（固定值）: 不完整或大小不正確的集合是否可能通過？\n" \
               "  motion-step（動作步驟）: 步驟是否可能以錯誤的順序發生？"

    findings.sort(key=lambda f: (SEV_ORDER[f["severity"]], f["file"], f["line"]))
    counts = {"high": 0, "medium": 0, "low": 0}
    for f in findings:
        counts[f["severity"]] += 1

    out = [
        f"防呆（Poka-yoke）危害掃描，{scope}",
        f"{counts['high']} high · {counts['medium']} medium · {counts['low']} low",
        "",
        "具有實際誤報的啟發式判斷。採取行動前請先閱讀周圍程式碼。",
        "",
    ]

    grouped: dict[str, list[dict]] = {}
    for f in findings:
        grouped.setdefault(f"{f['id']} {f['name']}", []).append(f)

    for key, group in sorted(grouped.items(), key=lambda kv: SEV_ORDER[kv[1][0]["severity"]]):
        sev = group[0]["severity"]
        tag = f"{COLOR[sev]}{sev.upper():<6}{RESET}" if use_color else f"{sev.upper():<6}"
        out.append(f"{tag} {key}  ({group[0]['lens']} lens, {len(group)} 個處所)")
        out.append(f"       device: {group[0]['device']}")
        for f in group[:8]:
            out.append(f"       {f['file']}:{f['line']}  {f['snippet']}")
        if len(group) > 8:
            out.append(f"       … 還有其他 {len(group) - 8} 個")
        out.append("")

    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(
        description="偵測防呆（poka-yoke）危害，找出程式碼中容易引發錯誤的結構。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split("範例：")[-1],
    )
    src = ap.add_mutually_exclusive_group()
    src.add_argument("--diff", action="store_true",
                     help="掃描尚未認可的變更（若乾淨則回退至 HEAD~5..HEAD）")
    src.add_argument("--staged", action="store_true", help="掃描暫存的變更")
    src.add_argument("--since", metavar="REF", help="掃描自 REF 以來的變更（例如 HEAD~10）")
    src.add_argument("--paths", nargs="+", metavar="PATH", help="掃描這些檔案或目錄")
    ap.add_argument("--severity", choices=["high", "medium", "low"], default="low",
                    help="回報的最低嚴重程度（預設：low）")
    ap.add_argument("--id", nargs="+", metavar="ID",
                    help="僅回報這些危害 ID（例如 --id C1 F2 M2）")
    ap.add_argument("--all", action="store_true", dest="include_covered",
                    help="一併執行真正 linter 做得更好的規則（預設關閉）")
    ap.add_argument("--json", action="store_true", help="輸出 JSON 格式")
    ap.add_argument("--repo", default=".", help="存放庫根目錄（預設：.）")
    args = ap.parse_args()

    global INCLUDE_COVERED
    INCLUDE_COVERED = args.include_covered
    repo = Path(args.repo).resolve()
    findings: list[dict] = []

    # 防呆：空的掃描應回報自身狀態，而非顯示為完全正常的健康狀態 [control]
    scanned = 0

    if args.paths:
        scope = f"路徑: {', '.join(args.paths)}"
        for p in collect_paths(args.paths):
            scanned += 1
            findings += scan_file(p, None)
        if scanned == 0:
            # 掃描 0 個檔案產生 0 個發現不代表完全沒問題，過去它曾與完全沒問題難以區分。
            # 以非零狀態碼結束：未能執行工作不應看起來像執行了工作且沒有任何發現。
            msg = ("掃描了 0 個檔案。這不代表完全無危害。\n"
                   f"在 {', '.join(args.paths)} 下沒有支援副檔名的檔案。\n"
                   f"支援的副檔名: {', '.join(sorted(ALL_EXTS))}")
            print(json.dumps({"scope": scope, "files_scanned": 0, "count": 0,
                              "findings": [], "error": msg}, indent=2)
                  if args.json else msg, file=sys.stdout if args.json else sys.stderr)
            return 2
    else:
        mode = "staged" if args.staged else ("since" if args.since else "diff")
        scope = {"staged": "暫存的變更",
                 "since": f"自 {args.since} 以來的變更",
                 "diff": "尚未認可的變更"}[mode]
        changed = changed_files_and_lines(repo, mode, args.since)
        if not changed:
            msg = ("找不到變更的檔案。樹狀結構可能很乾淨且沒有近期的認可，"
                   "或者這不是一個 git 存放庫。\n請使用 --paths 進行明確掃描，"
                   "例如 detect_hazards.py --paths src/")
            print(json.dumps({"findings": [], "note": msg}) if args.json else msg)
            return 0
        for rel, lines in changed.items():
            fp = repo / rel
            if fp.suffix in ALL_EXTS and fp.exists():
                scanned += 1
                findings += scan_file(fp, lines)

    threshold = SEV_ORDER[args.severity]
    findings = [f for f in findings if SEV_ORDER[f["severity"]] <= threshold]
    if args.id:
        wanted = {i.upper() for i in args.id}
        findings = [f for f in findings if f["id"] in wanted]

    if args.json:
        print(json.dumps({"scope": scope, "files_scanned": scanned,
                          "count": len(findings), "findings": findings}, indent=2))
    else:
        print(render(findings, scope, use_color=sys.stdout.isatty()))
        print(f"\n已掃描 {scanned} 個檔案。")
        if not INCLUDE_COVERED:
            tools = sorted({v.split(",")[0].split()[0] for v in COVERED_BY.values() if v})
            # len(COVERED_BY) 計算的是項目（ENTRIES），而單一項目可抑制多個
            # 語言專用規則，因此之前少算了三個。此處計算實際規則數。
            n_suppressed = sum(1 for r in RULES if (r.id, r.name) in COVERED_BY)
            print(f"\n此處未檢查，還有 {n_suppressed} 條危害規則由 "
                  f"{', '.join(tools)} 處理得更好。\n建議啟用那些工具，而非依賴此腳本："
                  f"請參閱 assets/devices/lint/。使用 --all 仍可執行它們。")

    return 0


if __name__ == "__main__":
    sys.exit(main())
