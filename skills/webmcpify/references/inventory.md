# 盤點 — 將程式碼庫對應至工具資訊清單

## 偵測（階段 0 詳細資訊）

依此順序確立：

1.
**安全驗證來源（硬性閘門）**：僅讀取足以啟動應用程式的啟動設定，


















接著在
Chromium
中開啟候選來源並斷言
`window.isSecureContext
===
true`。若未通過，請修正來源或憑證；
切勿在不安全的來源上繼續執行。

## 建立區域對應 (Area map)

區域對應是迴圈反覆項目的基本單位。
來源依偏好順序如下：路由器設定（React
Router、Next
`app/`/`pages`、Vue
Router）、主導覽列、頁尾連結、網站地圖。

## 何者算作候選工具

巡訪各個區域的 UI 程式碼並列出**使用者動作**，而非函式：

| UI 模式 | 候選工具 | `mutating` | `readOnlyHint` | `consequentialHint` |
|---|---|---|---|---|
| Search/filter form or input | `search_<noun>` | false | true | false |
| Data list/detail currently rendered | `list_<noun>` / `get_<noun>` | false | true | false |
| Create/edit form with submit → API call | `create_<noun>` / `update_<noun>` | "server" | — | classify by effect |
| Button triggering a server state change | `<verb>_<noun>` | "server" | — | classify by effect |
| Preference/theme/localStorage toggle | `<verb>_<noun>` | "client" | — | false |
| Multi-step flow (wizard, checkout) | `start_<noun>_flow` (initiation) | false* | **never** | false* |
| Contact/booking form (static sites) | declarative form annotation | "server" | — | true |

*起始工具僅導覽/開啟流程
—
由人類完成。
它們歸類為非異動型（無資料變更）。*

`mutating`
為三態：`false` |
`"client"`（僅限瀏覽器本機：偏好設定、
佈景主題、localStorage
— 無任何內容離開瀏覽器）|
`"server"`（變更後端狀態）。

`consequentialHint`
是一個獨立的風險維度，而非
`mutating`
的同義詞。僅在執行具有重大、
不可逆或高風險的現實世界影響時設定它。

**原則閘門 —
使用這些確切的類別。
**排除身分驗證/登入/工作階段/密碼/MFA/SSO；



註冊/登記/付款/計費/信用卡；破壞性帳戶刪除；
以及任何需要未經授權的跨租戶存取的項目。

## 涵蓋範圍目標、工具預算、重疊與優先順序

`curated`
選取高價值動作並可延
後較低價值
的互動類別，
但仍會產生列
舉的路由→區
域清單以進行
涵蓋範圍審核。

沒有任何公開來源或已測量的用戶端
執行確立了每頁普遍安全的工具數量。
路由範圍的註冊有助於將作用中集合保持在安全界限之內。


當許多相似的工具競爭時，代理人的效能會下降。草擬時請強制執行：

-
**精選預算**：目標
在任何應用程式狀態下有
≤15
個作用中工具（全應用程式
+
目前檢視表）。
若一個區域產生更多候選項目，
請依影響力進行挑選並將其餘項目延後。





## 命名與結構描述慣例（Google 規格，精簡版）

-
**動詞優先、
誠實區分執行與
起始**
：`cre
ate_e
vent`
立即採取動作；
`start_
event_cr
eation_
process`
僅開啟建立表
單或對話方塊。

## 選擇 `kind`

- `declarative`
— 任何標準
`<form>`，其欄位與動作輸入
1:1 對應：純
HTML、SSG
發出、伺服器轉譯或輕量級用戶端表單。
- `imperative` — 富用戶端狀態、複雜驗證、非同步步驟或自訂 UI 元件。

## 撰寫資訊清單項目

填寫 v4 結構描述的每個欄位：

- `route` +
`auth`（對應至
`app.authFixtures`
的角色陣列；驗證時每個角色執行一次）。
-
`annotations`
—
`readOnlyHint`、`consequentialHint`、`openWorldHint`。
- 完整的
`expect` 與
`cleanup` 區塊。

驗證階段必須能夠僅根據資訊清單執行，而無需重新讀取程式碼庫
— 這就是使執行可重複且隔離的原因。

對於每個區域，保留目前的
`policyFingerprint`
加上每個原則排除作為 `{ gate, reason }`；零工具檢視表亦必須記錄在案。

在兩種模式下皆填入
`routeCoverage`。完整性階段會啟動應用程式，
在每個記錄的角色下巡訪每個路由，並在即時
DOM 中驗證已註冊的工具。
