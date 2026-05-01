---
description: '編寫安全、快速且清晰的掛鉤 (hook) 及可重複使用掛鉤範例的攜帶式指引'
applyTo: '.github/hooks/**, hooks/**'
---

# 掛鉤編寫指南

掛鉤是**小型、確定性的指令或指令碼**，在特定的生命週期事件中執行。
一個優秀的掛鉤應該執行一項明確的工作、快速執行並使其副作用明確化。

## 資料夾結構

GitHub Copilot 掛鉤位於存放庫中的 `.github/hooks/`：

```text
.github/
└── hooks/
    ├── block-dangerous-commands.json   ← 掛鉤設定 (哪個事件、哪個指令碼、選項)
    └── scripts/
        ├── block-dangerous-commands.sh  ← Bash 實作
        └── block-dangerous-commands.ps1 ← PowerShell 實作 (若僅限 Bash 則為選填)
```

您可以有多個 `.json` 檔案 — 每個檔案註冊一個或多個事件的掛鉤。主機 (host) 會載入所有檔案。

## 設定檔

每個 `.json` 檔案將事件映射到掛鉤項目陣列。

- **指令掛鉤** (`type: "command"`): 執行本機指令碼。主機會在 stdin 上傳遞事件 JSON，您的指令碼透過結束代碼和 stdout 進行回應。

### 設定範例

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "matcher": "bash",
        "type": "command",
        "bash": "./.github/hooks/scripts/block-dangerous-commands.sh",
        "powershell": "./.github/hooks/scripts/block-dangerous-commands.ps1",
        "cwd": ".",
        "timeoutSec": 5,
        "env": {
          "BLOCK_MODE": "deny"
        }
      }
    ]
  }
}
```

### 設定欄位

| 欄位 | 必填 | 功能 |
| ---- | ---- | ---- |
| `type` | 是 | 指令碼為 `"command"` |
| `matcher` | 否 | 主機層級篩選器 — 僅當工具名稱符合此值 (例如 `"bash"`, `"powershell"`, `"edit"`, `"create"`) 時，掛鉤才會觸發。已在 Copilot CLI v1.0.36 本機驗證可運作；尚未在存放庫掛鉤範例中使用。 |
| `bash` | 其中之一或兩者 | 在 Unix / 具備 Bash 能力的主機上呼叫的命令列 |
| `powershell` | 其中之一或兩者 | 在 Windows / 具備 PowerShell 能力的主機上呼叫的命令列 |
| `cwd` | 否 | 工作目錄，相對於存放庫根目錄 |
| `timeoutSec` | 否 | 主機終止程序前的最大秒數 (預設為 30) |
| `env` | 否 | 傳遞給指令碼的額外程序環境變數 |

### 為什麼比對器 (matcher) 很重要

如果沒有比對器，每個 `preToolUse` 掛鉤都會在**每個**工具呼叫時觸發。您的指令碼會以樣板程式碼開始，例如：

```bash
tool_name="$(printf '%s' "$payload" | jq -r '.toolName')"
[[ "$tool_name" != "bash" ]] && exit 0
```

有了比對器，主機會為您執行此篩選 — 無需樣板，也無需為不相關的工具衍生程序。一旦此功能穩定，這可能會成為標準模式。

如果您的掛鉤必須在 CLI 和雲端代理程式 (或舊版 CLI) 上都能運作，即使使用比對器，也請保留指令碼內篩選作為備援。

### `env` — 指令碼的靜態設定

`env` 是**標準主機欄位**。其中的鍵是**作者定義的變數** — 您可以自行選擇名稱和值。

它們以**程序環境變數**的形式抵達，而非在 stdin JSON 酬載中。請將它們用於不應寫死的靜態設定：

| 模式 | 範例 |
| ---- | ---- |
| 模式旗標 | `"BLOCK_MODE": "deny"` — 同一個指令碼在一個存放庫中記錄記錄檔，在另一個存放庫中封鎖 |
| 閾值 | `"MAX_CHANGED_FILES": "20"` |
| 路徑 | `"AUDIT_LOG_PATH": ".github/logs/hooks.log"` |
| 功能切換 | `"ENABLE_NOTIFICATIONS": "false"` |

### `bash` 和 `powershell` — 何時提供其中之一或兩者

主機會選擇與當前環境相符的項目。它不會同時執行兩者，也不會從一個項目備援到另一個。

| 情況 | 提供 |
| ---- | ---- |
| 私有掛鉤，已知單一平台 | 僅提供該平台的項目 |
| 已發布的掛鉤，宣稱支援跨平台 | 兩者皆提供 |
| 單一跨平台執行階段 (Python, Node, pwsh) | 透過這兩個項目公開相同的指令碼 |
| 僅限 Bash 的相依性 | 僅提供 `bash` |
| 僅限 Windows 的相依性 | 僅提供 `powershell` |

使用 Python 透過這兩個項目的跨平台範例：

```json
{
  "type": "command",
  "bash": "python3 ./.github/hooks/scripts/check.py",
  "powershell": "python .\\.github\\hooks\\scripts\\check.py"
}
```

## 指令碼合約

每個掛鉤指令碼都遵循相同的基本合約：從 stdin 讀取 JSON、執行工作，並透過結束代碼、stdout 和 stderr 進行回應。

**重要**：`toolArgs` 是 **JSON 字串**，而非巢狀物件。您必須對其進行第二次解析才能存取其欄位。

### 讀取 stdin 並回應 — Bash 和 PowerShell

**Bash**:

```bash
#!/usr/bin/env bash
set -euo pipefail
payload="$(cat)"
tool_name="$(printf '%s' "$payload" | jq -r '.toolName')"
tool_args="$(printf '%s' "$payload" | jq -r '.toolArgs')"
command="$(printf '%s' "$tool_args" | jq -r '.command // ""')"
```

**PowerShell**:

```powershell
Set-StrictMode -Version Latest
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$toolArgs = $payload.toolArgs | ConvertFrom-Json
$command = $toolArgs.command
```

要在 `preToolUse` 中拒絕 (PowerShell)：

```powershell
@{ permissionDecision = 'deny'; permissionDecisionReason = '已被原則封鎖' } |
    ConvertTo-Json -Compress
exit 0
```

### 指令碼接收的內容

| 輸入 | 攜帶內容 |
| ---- | ---- |
| `stdin` | 一個描述當前事件的 JSON 酬載 |
| 程序環境 | 標準環境變數加上您在設定中 `env` 下定義的變數 |
| 工作目錄 | 設定中的 `cwd`，或主機預設值 |

### 指令碼如何回應

| 管道 | 用途 |
| ---- | ---- |
| 結束代碼 `0` | 指令碼執行成功 — 除非 stdout 攜帶結構化拒絕，否則主機將繼續執行 |
| 非零結束代碼 | **封鎖觸發操作**並發出掛鉤失敗訊號 |
| `stdout` | 結構化機器可讀輸出 — 僅用於記錄了 stdout 結構描述 (schema) 的事件 (例如 `preToolUse`) |
| `stderr` | 用於記錄檔的人類可讀診斷資訊 |

### 結束代碼與拒絕：全貌

拒絕機制**取決於事件**：

| 事件類型 | 如何允許 | 如何拒絕 / 封鎖 |
| ---- | ---- | ---- |
| `preToolUse` | 結束代碼 `0`，stdout 為空或 `{"permissionDecision":"allow"}` | **偏好方式**：結束代碼 `0` + stdout 為 `{"permissionDecision":"deny","permissionDecisionReason":"..."}` — 提供主機顯示理由。**同樣有效**：非零結束代碼會封鎖工具呼叫，但沒有結構化理由。 |
| `userPromptSubmitted` | 結束代碼 `0` | 非零結束代碼封鎖提示 (此事件忽略 stdout) |
| `agentStop` | 結束代碼 `0` | 非零結束代碼封鎖操作 |
| 其他事件 (`sessionStart`, `sessionEnd`, `postToolUse`, `errorOccurred`) | 結束代碼 `0` | 非零結束代碼表示失敗；主機可能會略過該事件的後續掛鉤 |

**經驗法則**：如果事件具有結構化 stdout 結構描述 (如 `preToolUse`)，請使用它 — 它能提供清晰的理由，且是官方文件的拒絕路徑。對於沒有結構化 stdout 的事件，非零結束代碼是實際的封鎖機制 — 這已透過存放庫範例和學習中心文件確認，儘管官方 GitHub 參考資料並未明確記錄「非零 = 封鎖」作為合約保證。

### 範例 1：提交入口 — 在 lint、型別檢查和測試通過之前封鎖提交

**為什麼此模式很重要**：拒絕理由包含實際錯誤，因此代理程式 (agent) 可以看到問題所在並在重新嘗試之前修復它。這建立了一個自我糾正的回饋迴圈 — 這是掛鉤能做的最強大的事情。

**事件**：`preToolUse` — 在代理程式執行 `git commit` 之前觸發

**設定** — `.github/hooks/commit-gate.json`：

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/scripts/commit-gate.sh",
        "cwd": ".",
        "timeoutSec": 120
      }
    ]
  }
}
```

**指令碼** — `.github/hooks/scripts/commit-gate.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
tool_name="$(printf '%s' "$payload" | jq -r '.toolName')"

# 僅入口守衛是 git commit 的 bash 指令
if [[ "$tool_name" != "bash" ]]; then exit 0; fi
command="$(printf '%s' "$payload" | jq -r '.toolArgs' | jq -r '.command // ""')"
if ! printf '%s' "$command" | grep -q "git commit"; then exit 0; fi

CWD="$(printf '%s' "$payload" | jq -r '.cwd')"
ERRORS=""

# 1. TypeScript 型別檢查
if [[ -f "$CWD/tsconfig.json" ]]; then
  TSC_OUT=$(cd "$CWD" && npx tsc --noEmit 2>&1) || ERRORS="${ERRORS}
=== TypeScript 錯誤 ===
$(echo "$TSC_OUT" | head -30)"
fi

# 2. Lint
if [[ -f "$CWD/package.json" ]]; then
  HAS_LINT=$(jq -r '.scripts.lint // empty' "$CWD/package.json" 2>/dev/null)
  if [[ -n "$HAS_LINT" ]]; then
    LINT_OUT=$(cd "$CWD" && npm run lint --silent 2>&1) || ERRORS="${ERRORS}
=== Lint 錯誤 ===
$(echo "$LINT_OUT" | tail -30)"
  fi

  # 3. 測試
  HAS_TEST=$(jq -r '.scripts.test // empty' "$CWD/package.json" 2>/dev/null)
  if [[ -n "$HAS_TEST" ]]; then
    TEST_OUT=$(cd "$CWD" && CI=true npm test -- --watchAll=false 2>&1) || ERRORS="${ERRORS}
=== 測試失敗 ===
$(echo "$TEST_OUT" | tail -30)"
  fi
fi

if [[ -n "$ERRORS" ]]; then
  jq -nc --arg reason "無法提交 — 請先修復這些問題：
$ERRORS" \
    '{permissionDecision:"deny",permissionDecisionReason:$reason}'
fi
exit 0
```

**執行階段發生的情況：**

| 情境 | stdout | 結束代碼 | 主機操作 |
| ---- | ---- | ---- | ---- |
| 所有檢查皆通過 | 空 | `0` | 繼續執行提交 |
| Lint 失敗 | `{"permissionDecision":"deny","permissionDecisionReason":"無法提交 — 請先修復這些問題：\n=== Lint 錯誤 ===\n..."}` | `0` | 封鎖提交；代理程式會看到錯誤並修復它們 |
| 缺少 jq | 空 | 非零 | 掛鉤失敗 |

### 範例 2：編輯檔案後自動格式化

**為什麼此模式很重要**：代理程式編寫程式碼，而您的格式化程式 (formatter) 會立即在其後執行 — 無需手動步驟。代理程式下一次讀取該檔案時，會看到已格式化的版本。

**事件**：`postToolUse` — 在 `edit` 或 `create` 工具呼叫後觸發

**設定** — `.github/hooks/format-on-save.json`：

```json
{
  "version": 1,
  "hooks": {
    "postToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/scripts/format-on-save.sh",
        "cwd": ".",
        "timeoutSec": 15
      }
    ]
  }
}
```

**指令碼** — `.github/hooks/scripts/format-on-save.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
tool_name="$(printf '%s' "$payload" | jq -r '.toolName')"
result_type="$(printf '%s' "$payload" | jq -r '.toolResult.resultType // ""')"

# 僅在檔案寫入成功後進行格式化
case "$tool_name" in
  edit|create) ;;
  *) exit 0 ;;
esac
[[ "$result_type" != "success" ]] && exit 0

file_path="$(printf '%s' "$payload" | jq -r '.toolArgs' | jq -r '.path // ""')"
[[ -z "$file_path" || ! -f "$file_path" ]] && exit 0

# 執行專案的格式化程式 — 根據您的技術棧進行調整
if command -v npx >/dev/null 2>&1 && [[ -f "package.json" ]]; then
  npx prettier --write "$file_path" 2>/dev/null || true
elif command -v dotnet >/dev/null 2>&1 && [[ "$file_path" == *.cs ]]; then
  dotnet format --include "$file_path" 2>/dev/null || true
fi
exit 0
```

**執行階段發生的情況：**

| 情境 | 掛鉤執行內容 | 結束代碼 |
| ---- | ---- | ---- |
| 代理程式成功編輯 `src/app.ts` | 執行 `prettier --write src/app.ts` | `0` |
| 代理程式執行 `bash ls` | 略過 (非檔案寫入工具) | `0` |
| 未安裝 Prettier | 以靜默方式略過格式化 | `0` |

### 範例 3：使用結構化拒絕封鎖危險指令

**為什麼此模式很重要**：最簡單的護欄 (guardrail) — 在毀滅性的 shell 指令執行之前封鎖它們，並提供代理程式可以讀取的清晰理由。

**事件**：`preToolUse` — 在任何工具呼叫之前觸發

**設定** — `.github/hooks/block-dangerous.json`：

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/scripts/block-dangerous.sh",
        "cwd": ".",
        "timeoutSec": 5,
        "env": {
          "BLOCK_MODE": "deny"
        }
      }
    ]
  }
}
```

**指令碼** — `.github/hooks/scripts/block-dangerous.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
block_mode="${BLOCK_MODE:-log}"
tool_name="$(printf '%s' "$payload" | jq -r '.toolName')"

[[ "$tool_name" != "bash" ]] && exit 0

command="$(printf '%s' "$payload" | jq -r '.toolArgs' | jq -r '.command // ""')"

if printf '%s' "$command" | grep -qE 'rm -rf /|git reset --hard|git clean -fd|git push.*--force'; then
  # 截斷指令以避免在拒絕理由或記錄檔中洩漏秘密
  short_cmd="$(printf '%.80s' "$command")"
  if [[ "$block_mode" == "deny" ]]; then
    jq -cn --arg reason "毀滅性指令已被封鎖：${short_cmd}..." \
      '{permissionDecision:"deny",permissionDecisionReason:$reason}'
  else
    echo "將會封鎖：${short_cmd}..." >&2
  fi
fi
exit 0
```

**執行階段發生的情況：**

| 情境 | BLOCK_MODE | stdout | 結束代碼 | 主機操作 |
| ---- | ---- | ---- | ---- | ---- |
| 安全指令 | 任意 | 空 | `0` | 繼續執行 |
| `git push --force` | `deny` | `{"permissionDecision":"deny",...}` | `0` | 封鎖並顯示理由 |
| `git push --force` | `log` | 空 | `0` | 繼續執行 (僅記錄記錄檔) |

## 事件類型

完整的掛鉤參考資料具有權威性。在編寫掛鉤之前，**請務必查看其最新的酬載格式**：

- [掛鉤設定參考](https://docs.github.com/en/copilot/reference/hooks-configuration)
- [關於掛鉤](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-hooks)

| 事件 | stdout | 典型用途 |
| ---- | ---- | ---- |
| `sessionStart` | **已解析** — stdout 中的 `additionalContext` 會被插入至工作階段中 | 設定、驗證、內容插入、記錄記錄檔 |
| `sessionEnd` | 已忽略 | 清理、摘要 |
| `userPromptSubmitted` | 已忽略 | 稽核、提示封鎖 |
| `preToolUse` | **已解析** — `permissionDecision`, `modifiedArgs`/`updatedInput`, `additionalContext` | 護欄、拒絕/封鎖、引數修改 |
| `postToolUse` | 已忽略 | 記錄記錄檔、格式化 |
| `postToolUseFailure` | — | 工具執行失敗後的復原 |
| `agentStop` | — | 最終驗證 |
| `subagentStart` | — | 子代理程式稽核 |
| `subagentStop` | — | 子代理程式輸出驗證 |
| `errorOccurred` | 已忽略 | 診斷、警示 |
| `preCompact` | — | 預壓縮工作 |
| `permissionRequest` | — | 核准工作流程 |

### 常見事件的酬載結構描述

以下是來自掛鉤參考資料的酬載格式。請務必對照[官方參考資料](https://docs.github.com/en/copilot/reference/hooks-configuration)以獲取最新欄位。

**`sessionStart`**

```json
{
  "timestamp": 1704614400000,
  "cwd": "/path/to/project",
  "source": "new",
  "initialPrompt": "Create a new feature"
}
```

`source` 為 `"new"`、`"resume"` 或 `"startup"`。`initialPrompt` 是使用者提供的第一個提示 (若有提供)。

**`sessionStart` stdout 輸出** — 主機解析 stdout 內容：

```json
{
  "additionalContext": "Current branch: main. Deploy target: staging."
}
```

`additionalContext` 會直接插入到工作階段交談中，讓掛鉤能夠動態提供環境特定的內容。

**`sessionEnd`**

```json
{
  "timestamp": 1704618000000,
  "cwd": "/path/to/project",
  "reason": "complete"
}
```

`reason` 為 `"complete"`、`"error"`、`"abort"`、`"timeout"` 或 `"user_exit"`。

**`userPromptSubmitted`**

```json
{
  "timestamp": 1704614500000,
  "cwd": "/path/to/project",
  "prompt": "Fix the authentication bug"
}
```

欄位為 `prompt` — 使用者提交的確切文字。

**`preToolUse`**

```json
{
  "timestamp": 1704614600000,
  "cwd": "/path/to/project",
  "toolName": "bash",
  "toolArgs": "{\"command\":\"rm -rf dist\",\"description\":\"Clean build directory\"}"
}
```

`toolArgs` 是 **JSON 字串** — 請對其進行第二次解析以存取其欄位。

**`preToolUse` stdout 輸出** — 主機解析 stdout 內容：

| 欄位 | 功能 |
| ---- | ---- |
| `permissionDecision` | `"deny"` 會封鎖工具呼叫。也接受 `"allow"` 和 `"ask"`；目前僅處理 `"deny"`。 |
| `permissionDecisionReason` | 顯示給使用者的人類可讀理由 |
| `modifiedArgs` 或 `updatedInput` | 替代工具引數 — 用於取代原始引數 |
| `additionalContext` | 在本輪中插入代理程式內容的文字 |

**`postToolUse`**

```json
{
  "timestamp": 1704614700000,
  "cwd": "/path/to/project",
  "toolName": "bash",
  "toolArgs": "{\"command\":\"npm test\"}",
  "toolResult": {
    "resultType": "success",
    "textResultForLlm": "All tests passed (15/15)"
  }
}
```

`resultType` 為 `"success"`、`"failure"` 或 `"denied"`。

**`errorOccurred`**

```json
{
  "timestamp": 1704614800000,
  "cwd": "/path/to/project",
  "error": {
    "message": "Network timeout",
    "name": "TimeoutError",
    "stack": "TimeoutError: Network timeout\n    at ..."
  }
}
```

**`agentStop`**

```json
{
  "timestamp": 1704618000000,
  "cwd": "/path/to/project"
}
```

最小酬載 — 用於觸發工作階段結束動作，例如執行 `git diff --stat` 或最終驗證。

## 何時不適合使用掛鉤

| 避免將掛鉤用於 | 更適合的方案 |
| ---- | ---- |
| 開放式推理或風格指引 | 指令、提示或代理程式 |
| 包含記憶、重試或分支的長期多步驟工作流程 | 代理程式、指令碼或工作流程引擎 |
| 背景精靈 (daemon)、監控程式 (watcher)、去彈跳 (debounce) 迴圈或非同步工作 | 專用的自動化程式、服務或 CI |
| 繁重的全存放庫驗證 | CI、排程工作或專用的自動化程式 |

## 通用設計規則

| 規則 | 為什麼重要 |
| ---- | ---- |
| 一個掛鉤，一個責任 | 小型掛鉤更容易信任與偵錯 |
| 預設為**先觀察** | 封鎖或變更應是明確的選擇 |
| 保持掛鉤同步、有界限且非互動式 | 掛鉤運行在關鍵路徑上 |
| 使掛鉤具備確定性與等冪性 | 重新執行不應導致偏移 |
| 預設情況下不要變更分支、索引或工作樹狀態 | 毀滅性的 Git 行為具有高風險 |
| 將提示、工具引數和工具輸出視為不可信且敏感的內容 | 輸入可能是惡意的或私有的 |
| 從記錄檔中遮蓋秘密、認證、權杖和私有內容 | 記錄檔的生命週期通常長於掛鉤執行時間 |

## 指令碼編寫規則

- 驗證您實際使用的 JSON 欄位
- 為 shell 變數加上引號，絕不要從原始輸入建構指令
- 除非主機要求結構化輸出，否則保持 stdout 乾淨
- 使用嚴格模式：Bash `set -euo pipefail`，PowerShell `Set-StrictMode -Version Latest`
- 儘早檢查相依性，如果缺少則明確回報失敗
- 在執行期間避免提示、隱藏安裝或環境變更
- 透過手動將代表性的 JSON 酬載管線傳輸至指令碼來測試指令碼

## 選擇最小的可行實作

1. **PowerShell 7**、**Node.js** 或 **Python**，用於廣泛可移植的掛鉤
2. 在明確要求或安全假設下使用 **Bash**
3. 當存放庫已相依於**現有的專案 CLI** 時，使用該 CLI

**不要**僅為了實作一個普通掛鉤而引入新的編譯執行階段。

## 包裝可重複使用的掛鉤

- 將設定、指令碼和文件包裝在一起
- 記錄觸發事件、用途、副作用、相依性和停用路徑
- 說明掛鉤讀取什麼、寫入什麼以及封鎖什麼

## 反模式

- 長時間執行的掛鉤、監控程式、背景精靈或發送後不理的非同步工作
- 在每個事件上執行繁重的掃描 (本可以使用更窄的觸發器)
- 在關鍵路徑中進行隱藏的網路呼叫或上傳
- 預設情況下靜默變更 Git 狀態 (checkout, reset, clean, stash, stage, commit, push 或重寫歷程記錄)
- 互動式提示或隱含的核准步驟
- 吵雜的 stdout、臨時計劃的輸出格式，或混合的機器/人類輸出
- 記錄原始提示、秘密、認證或大型工具輸出
- 混合了無關責任的單體掛鉤

## 可移植性

### GitHub Copilot：CLI、VS Code 與雲端代理程式

相同的 `.github/hooks/*.json` 設定、相同的酬載結構描述以及相同的指令碼合約適用於 CLI、VS Code 和雲端代理程式。事件名稱接受小駝峰式命名 (`preToolUse`) 和大駝峰式命名 (`PreToolUse`)。工具引數的文件酬載欄位為 `toolArgs` (一個 JSON 字串)。

需要注意的一點：雲端代理程式僅從存放庫的**預設分支**載入掛鉤。如果您的 hooks.json 僅存在於功能分支上，雲端代理程式將看不到它。

### Claude Code

Claude Code 使用不同的掛鉤系統：

- 設定位於 `~/.claude/settings.json` 和 `.claude/settings.json`
- 不同的事件名稱與比對器語法 (正則表達式、`if` 條件)
- 結束代碼 2 = 封鎖，結束代碼 1 = 非封鎖錯誤 (與 GitHub Copilot 不同)
- 5 種掛鉤類型 (command, http, mcp_tool, prompt, agent)
- 超過 29 種事件，包括 `FileChanged`、`CwdChanged`、`ConfigChange`

共享的最佳實務是相同的：保持掛鉤小型、具備確定性、對 I/O 明確，並且對副作用保持嚴格。
