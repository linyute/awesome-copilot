---
name: 'Fix Broken Links'
description: '在每次 Copilot 工具使用後，檢查變更的網頁檔案中是否存在損壞的超連結和 SEO 錨點問題。'
tags: ['links', 'seo', 'html', 'markdown', 'post-tool-use']
---

# 修復損壞連結 Hook

在每次 GitHub Copilot 工具使用後，掃描最近變更的網頁檔案以尋找損壞的超連結。對於每個損壞的 URL，此 hook 會嘗試常見的拼字變形，然後將連結提交給 Copilot CLI 代理程式以取得建議的替代方案，並顯示互動式修復選單。通用錨點文字（`click here`、`read more` 等）會被標記為 SEO 問題。

## 概觀

網頁專案中常會默默累積損壞的連結。此 hook 在 `postToolUse` 事件上執行，會在每次變更後立即檢查代理程式剛剛編輯的網頁檔案（且僅限這些檔案），因此您可以在同一個終端機工作階段中修復、替換或移除每個損壞的連結。

此 hook 有兩種模式：

- **含有檔案路徑**（從 hook 承載資料（payload）中傳入的已編輯檔案，或是命令列上傳遞的路徑）：它會檢查每個連結、尋找替代候選，並顯示互動式修復選單。
- **不含檔案參數**：它僅簡單列出找到的損壞連結 — 不會尋找替代方案，也沒有提示。

## 功能特色

- **獨立核心**：Bash 和 PowerShell 版本 — 無需安裝執行期環境（選用的代理程式交接可重複使用您已有的 Copilot CLI）
- **已編輯檔案範圍**：作為 `postToolUse` hook，它只檢查代理程式剛剛變更的檔案 — 絕不進行整個存放庫掃描
- **不受格式限制的連結掃描**：使用 `grep` 擷取每個 `http(s)` URL，一次涵蓋 HTML、Markdown、JS/TS、JSON、CSS、SQL 和範本
- **自動 URL 修復**：嘗試 www、https 和結尾斜線變形
- **代理程式協助建議**：將損壞的連結提交給 Copilot CLI 代理程式（一個輕量、低 token 且無工具的 `gpt-5-mini` 提示詞）以尋找替代候選；如果缺少 CLI 或發生錯誤，則不提供任何建議
- **SEO 稽核**：標記因太過通用而無法提供搜尋排名的錨點文字
- **大檔案防護**：在檢查含有超過 50 個連結的檔案之前進行提示
- **互動式修復選單**：使用建議取代、輸入自訂 URL、清除標籤並保留文字，或跳過
- **僅使用標準工具**：`curl`、`grep`、`sed` — 存在於任何 POSIX 系統中

## 安裝

1. 複製 hook 資料夾到您的存放庫：

   ```bash
   cp -r hooks/fix-broken-links .github/hooks/
   ```

2. 設定腳本為可執行：

   ```bash
   chmod +x .github/hooks/fix-broken-links/link-fix.sh
   ```

3. 提交 hook 組態至您的存放庫預設分支。

## 組態

此 hook 在 `hooks.json` 中配置為在 `postToolUse` 事件上執行：

```json
{
  "version": 1,
  "hooks": {
    "postToolUse": [
      {
        "type": "command",
        "bash": ".github/hooks/fix-broken-links/link-fix.sh",
        "powershell": ".github/hooks/fix-broken-links/link-fix.ps1",
        "cwd": ".",
        "timeoutSec": 120
      }
    ]
  }
}
```

## 支援的來源類型

連結是透過掃描每個檔案中的 `http(s)://` URL 來尋找的，因此相同的邏輯適用於每個嵌入絕對 URL 的格式：

| 來源 | 匹配範例 |
| --- | --- |
| HTML | `<a href>`, `<img src>`, `<script src>`, `<link href>`, `<iframe src>` |
| Markdown | `[text](url)`, `[text][ref]`, bare `<url>` |
| JS / TS / Vue / Svelte | `fetch()`, `XMLHttpRequest.open()`, jQuery, axios, `href:`/`url:` props |
| JSON / JSONL | 任何做為絕對 URL 的字串值 |
| CSS | `url(...)` |
| SQL | 查詢字串中的 URL 常值 |
| 範本 | Jinja2, ERB, EJS, Handlebars, Pug |

特別是，`d` (移除) 動作可識別 HTML `<a>` 包裝程式和 Markdown `[text](url)` 連結，並保留可見文字。其他來源類型則支援透過字面 URL 替換進行 `r` (替換) 和 `c` (自訂)。

## 修復選項

對於每個損壞的連結：

| 按鍵 | 動作 |
| --- | --- |
| `r` | 使用建議的 URL 替換（有效的變形或代理程式提議的替代方案） |
| `d` | 清除連結包裝，將可見文字保留為純文字 |
| `c` | 輸入自訂的替換 URL |
| `s` | 跳過 |

## 範例輸出

```text
  Checking 2 link(s) in docs/guide.md ...
    BROKEN (404) https://example.com/old-page

------------------------------------------------------------
  SEO anchor issues (consider descriptive link text)
    docs/guide.md: <a href="https://example.com/old-page">click here</a>

============================================================
  fix-broken-links report
============================================================

  [1] docs/guide.md
    URL : https://example.com/old-page
    HTTP: 404

    r  Replace -> https://example.com/docs/install
    1  Replace -> https://example.com/docs/getting-started
    d  Remove link, keep text
    c  Custom replacement URL
    s  Skip
  > r
    replaced

  1 file(s) updated:
    docs/guide.md
```

在沒有檔案參數（或編輯的檔案中不包含可檢查連結）的情況下，此 hook 會在損壞連結列表後停止 — 系統會跳過上述選單。

## 系統需求

- `curl` — HTTP 狀態檢查（如果不存在，hook 會靜默退出）
- `grep`, `sed` — 連結擷取（任何 POSIX 系統上的標準配備）
- `jq` — Bash hook 用於剖析 postToolUse JSON 承載資料（payload）並探索已編輯檔案的必備工具
- Bash 4+（適用於 `link-fix.sh`）；在 Windows 上請使用 Git Bash 或 WSL，或執行 PowerShell 7+ 版本 `link-fix.ps1`
- `copilot` (GitHub Copilot CLI) — 選用；用於提供代理程式建議的替代方案。若沒有它，則僅提供已驗證的拼字變形
- `git` 用於變更檔案的探索；如果沒有安裝，此 hook 會回復為完整的存放庫掃描

## 檔案結構

```
.github/hooks/fix-broken-links/
├── hooks.json      GitHub Copilot hook 組態
├── link-fix.sh     Bash hook 實作
├── link-fix.ps1    PowerShell 7+ 版本
└── README.md       本檔案
```

## 限制

- 僅檢查絕對 `http://` 和 `https://` URL；相對路徑需要執行中的伺服器
- 無法僅從原始碼中偵測資料庫查詢於執行期動態產生的連結
- 啟用 `copilot` 建議後，損壞的 URL 將會傳送到 Copilot 服務做為提示詞輸入
- 代理程式建議的替代方案是模型提案，且未經即時驗證；在接受前請確認每一個建議
- `d` (移除) 動作以 HTML 和 Markdown 連結語法為目標；程式碼中的純 URL 最好使用 `r` 或 `c` 來處理
