# 在 Windows 上張貼長留言與內文

在 Windows 上，`az` 命令會解析為 `az.cmd`，這是由 `cmd.exe` 呼叫的批次包裝器。整個命令列的上限約為 8191 個字元，因此較長的 `--discussion`、`--description` 或 `--content` 值可能會被靜默截斷或失敗。在組合長參數之前，請先偵測 shell 並據此選擇對應的方式。跳過此步驟是 agent 浪費 3-5 次回合，最終退回到原始 token 擷取與 REST 呼叫的最常見原因。

## 先偵測 shell

| 環境 | 判斷訊號 | 處理方式 |
|---|---|---|
| Windows 上的 PowerShell | `$IsWindows -eq $true` 且 `$PSVersionTable.PSVersion` 已設定 | 使用 `azps.ps1`（見下方） |
| macOS / Linux 上的 PowerShell | `$IsWindows -eq $false` | 直接使用 `az`，無 cmd.exe 包裝器 |
| bash / zsh / sh | `$BASH_VERSION` 或 `$ZSH_VERSION` 已設定，或 `uname` 可正常執行 | 直接使用 `az`，無 cmd.exe 包裝器 |
| Windows `cmd.exe` | `%ComSpec%` 以 `cmd.exe` 結尾，且無 `$PSVersionTable` | 若已安裝 PowerShell，使用 `azps.ps1`；否則請參閱下方 `az devops invoke` 備用方案 |

## 選項 1：`azps.ps1`（Windows 上的 PowerShell）

`azps.ps1` 隨 Azure CLI 安裝程式一同提供，可直接呼叫 Python 進入點，不受 `cmd.exe` 的長度限制。

```powershell
# 將長內文讀入變數後傳入，無需處理引號問題。
$body = Get-Content -Raw .\comment.md
azps.ps1 boards work-item update --id 1234 --discussion $body
```

## 選項 2：在 Azure CLI 支援的命令中使用專用的 `--file-path` 旗標

部分命令提供原生的檔案旗標，應優先使用，而非將內容直接內嵌至命令列：

- `az devops wiki page create` 與 `az devops wiki page update` 支援 `--file-path`（可選用 `--encoding`）。
- 適用於任何 shell，包括 Windows。

```bash
az devops wiki page create --path 'My page' --wiki myproject --file-path ./page.md --encoding utf-8
```

## 選項 3：`az devops invoke` 備用方案

當不存在 `--file-path`（如工作項目的 `--discussion`、PR 的 `--description`），且您並非在 PowerShell 環境中時，可透過底層 REST API 發送內文。`az devops invoke` 在 Python 進入點內執行，因此不受 `cmd.exe` 的字元上限限制，並可透過 `--in-file` 從檔案讀取請求本體：

```bash
# 向工作項目 1234 張貼長討論留言。
# REST: POST /{project}/_apis/wit/workItems/{id}/comments?api-version=7.0-preview.3
az devops invoke \
  --area wit --resource comments \
  --route-parameters project={project} workItemId=1234 \
  --api-version 7.0-preview.3 \
  --http-method POST \
  --in-file ./comment.json
```

其中 `comment.json` 的內容為 `{ "text": "<長 Markdown 內文>" }`。這是當 `azps.ps1` 與 `--file-path` 皆不可用時的通用解決方案。`az devops invoke` 本身原生支援 `--in-file`。

## 不要依賴 `@<file>` 來傳遞純字串參數

Azure CLI 的 `@<file>` 慣例是針對 JSON 參數所記載的（請參閱[官方引號使用指南](https://learn.microsoft.com/en-us/cli/azure/use-azure-cli-successfully-quoting)）。它並不保證能展開純字串參數（如 `--discussion` 或 `--description`），因此不應將其作為上述三種選項的替代方案。
