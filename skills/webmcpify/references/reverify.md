# 應用程式或環境變更後的重新驗證

在繼續執行、明確的
`verify`
或現有整合的發行檢查時閱讀此文件。成功的執行證明註冊與
行為在目前的環境與程式碼庫修訂版下仍然正確。

## 記錄成功檢查的輸入

在每個工具通過原生驗證後，在其資訊清單項目上儲存
`verifiedAgainst`（選用的 Manifest v4 欄位）：

```json
{
  "at": "2026-09-14T12:00:00Z",
  "contractRevision": 1,
  "appRevision": "git-sha-or-build-id",
  "files": {"src/webmcp/tools.ts": "sha256:..."},
  "environment": {
    "origin": "https://app.example.test",
    "browser": "Chrome 150.0.7871.186",
    "harness": "playwright-page-context",
    "inputMode": "json-string",
    "roles": ["member"],
    "fixtureRevision": "seed-v2"
  },
  "evidence": "local-redacted-report-path"
}
```

`files`
涵蓋工具實作、共享執行階段、
產生的測試載具與
相容性輔助函式，
加上此工具相依的處理常式/路由/儲存庫。





## 耐久性異動執行日誌

Manifest
v4
在每個工具上新增了
`mutationE
xecutions:
[]`。
這是新異動執行所需
的繁重工作流程日誌，
而非簡單的計數器。

輔助函式在不追蹤符
號連結的情況下開啟
Sidecar
一次，
拒絕非常規或多重連結的檔案，




並傳遞檔案描述項以防止
TOC/TOU
競爭。

每個項目具有
`executionId`、`tool`、
`contractRevision`、
`origin`、`role`、`fixtureRevision`、
`argumentsFingerprint`（SHA-256）、`state`、
`startedAt`、`settledAt`、`cleanup`
與 `evidence`。

1.
在任何具備執行能力的執行程式掃描或讀取資訊清單之前，



































開啟/建立標準的
`.webmcpify/manifest.lock`
並取得獨佔鎖定。

在釋放所有權之前，
持久化確認每個已完成的項目，fsync
資訊清單目錄，選用性記錄
`releasedAt`，然後釋放鎖定。

將此套用於
VERIFY、HEAL
重試、
Playwright
/Puppeteer
測試載具以及冒煙/模型評估。
工作台完全阻擋異動。

遷移：遺失的陣列
表示歷史實證未知，
**而非**進行中的呼叫。
在下一次具備執
行能力的執行中，
將其初始化為
`[]`。

## 具備有界失效的繼續執行

1.
`status`
讀取並回報計數加上實證存留時間/未知數；
















它絕不啟動瀏覽器、變更狀態或執行工具。

執行一般的確定性斷言與清理。
當名稱、說明、可用工具或
UI
進入點變更時，
重新執行選取/歷程評估。

於 2026-09-14 檢查的來源界限：[Chrome
WebMCP](https://developer.chrome.com/docs/ai/webmcp)
是實驗性的；[Chrome
旗標](https://developer.chrome.com/docs/ai/model-context-protocol) 記載了命令式和宣告式 API。

## 不支援的主機與工作台後備方案

沒有
`flock(1)` 或
`lockf(1)` 的
Windows
無法執行此隨附的異動日誌；它會以失敗關閉。不要略過鎖定。

工作台在原生和
模擬傳輸中永遠是唯讀
的：僅能列出觀察到的、
未被排除且已核准的資訊清單工具。


