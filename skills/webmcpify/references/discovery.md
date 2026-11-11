# 探索 — 在頁面外發布工具介面

WebMCP
工具僅在頁面執行時存在。
檢索器、目錄與
瀏覽器擴充功能希望在瀏
覽*之前*得知這些工具。

## 草案、實驗性實作與慣例 — 於 2026-10-12 檢查

| 介面 | 狀態 | 來源 |
|---|---|---|
| `document.modelContext` (imperative) | **CG draft**, not a finalized standard (Chrome origin trial) | [webmcp explainer](https://webmachinelearning.github.io/webmcp/) |
| `navigator.modelContext` | **Deprecated** compatibility surface from the Chrome 149 trial — probe it as a fallback, never target it | same |
| `toolname`, `tooldescription`, `toolautosubmit` on the `<form>`; `toolparamdescription` on the form **control** (or enclosing `<fieldset>`) | **Chrome experimental implementation / separate explainer** | [declarative-api-explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md) |
| `toolactivated` / `toolcancel` events, `:tool-form-active` / `:tool-submit-active` | **Chrome experimental implementation / separate explainer** | [Chrome declarative guide](https://developer.chrome.com/docs/ai/webmcp/declarative-api) |
| `/.well-known/webmcp` manifest | **Not specified.** Chrome discussed pre-visit discovery; nothing shipped. De-facto convention pushed by third-party checkers/registries | community |
| `<link rel="webmcp">`, `Link: </.well-known/webmcp>; rel="webmcp"` | **Not specified** (RFC 8288 is, the `webmcp` relation is not registered) | community |
| `llms.txt`, `AGENTS.md`, robots.txt AI-bot rules | Conventions, widely read | community |

CG 草案專注於命令式 API：[上游 PR
#338](https://github.com/webma
chinelearning/webmcp/pull/338)，
模型上下文命名空間正在討論中。

絕不要為了迎合檢查程式而臆造屬性（請參閱下方的*第三方稽核*）。

## 規則 0 — 在撰寫任何內容前先記錄核准

閘門唯有在經歷上下文重設後仍然存留時才是真實的。一旦人工核准，請在
`.webmcpify/manifest.json` 中寫入 `pipeline.discovery`：

```json
"discovery": { "at": "2026-08-06", "publishedTools": ["get_faq"],
               "paths": [], "complete": false }
```

`publish
edTools`
是確切核准的子集
—
發布未列於該處的工具屬於
人工審查者從
未授權的洩漏。

`discovery:
null`（或不存在）=
未核准：不要撰寫、不要更新，
並標記任何由**此管線建立或在未經
核准時修改的資訊清單**為未受保護。

## 規則 1 — 資訊清單是鏡像，絕非來源

執行階段註冊具有權威性。資訊清單為檢索器重複其子集。
若它們可能產生分歧，它們就一定會產生分歧。

- 從核准的
`.webmcpify/manifest.json`
項目產生資訊清單，而非手動撰寫。
- 新增測試，當發布的
JSON
與即時註冊在結構描述或工具名稱上產生分歧時失敗。

## 規則 2 — 發布中繼資料是公開揭露的決策

`.well-known`
檔案永遠對全世界可讀，並且會被檢索、快取與編製索引。在撰寫之前，請取得明確的人工核准，僅限於：

-
在**公開**路由上**無需驗證**即可存取的工具；
- 已經屬於公開知識的名稱、說明與輸入結構描述。

絕不要列出：需要登入的工具、
角色範圍或管理員工具、
內部主機名稱、尚未公開的
API
路徑、暫存端點或個人資料。

## 規則 3 — 外觀與格式

從
`templates/well-known-webmcp.json`
開始。檢查程式實際讀取的欄位為 `name`、`description`、`version` 與 `tools`。

- 在
`/.well-known/webmcp`
提供服務，帶有 `Content-Type:
application/json`、HTTP 200，且無重定向（檢查程式將 301/302 視為失敗）。

  ```nginx
  location = /.well-known/webmcp {
      alias /srv/app/.well-known/webmcp.json;
      default_type application/json;
      add_header Access-Control-Allow-Origin "*" always;
      # Under nginx's default (legacy) semantics an add_header here CANCELS every
      # inherited one — repeat the site's security headers or this response ships
      # without them. Under `add_header_inherit merge` (nginx 1.29.3+) they are
      # inherited instead, and repeating them emits DUPLICATES. Check first.
      add_header Strict-Transport-Security "max-age=31536000" always;
      # …plus CSP / X-Content-Type-Options / any other server-level header.
  }
  ```

因此：在寫入
區塊前先檢查
`nginx
-v`
並在設定中搜尋
`add_
heade
r_inh
erit`，
讀取現有的
伺服器區塊，
絕不要破壞其他
`.well
-known`
路徑。

## 第三方稽核 — 依據規格評分，而非計分板

擴充功能與 Web
檢查程式會根據規格功能、慣例與自行發明的項目的混合清單對頁面評分。請參閱
`references/security.md`。

-
`window.ai`
/ 內建 AI 存在
—
**瀏覽器**能力。沒有任何網站可以提供它。絕不要「修復」此項目。
-
`toolaction`
屬性 —
尚未成為標準的提案語意；切勿捏造屬性。

在回應之前先對每項發現進行分類 — **規格 / 慣例 / 臆造**：

-
**規格。**親自根據說明文件或
Chrome
文件檢查。若它是指定行為的真實違規，請修復。
-
**慣例/臆造。**若檢查程式堅持使用非規格屬性，請予以記錄並維持現狀。

絕不要讓*分數*主導工作：紅色的叉號只是一個問題，
而答案有時是「該檢查本身是錯誤的」。
