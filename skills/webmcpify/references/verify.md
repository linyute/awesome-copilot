# 驗證 — 證明每個工具在真實瀏覽器中運作

在重用先前的測試通過結果之前，套用
[重新驗證](reverify.md)。在成功的檢查後，將其輸入記錄在工具資訊清單項目的 `verifiedAgainst` 中。

## 環境

-
**目前版本
Chrome**（API
在試用期間有所變更；驗證會探測
`document.modelContext`，
絕不探測
`navigator.modelContext`）。







-
**安全來源**（HTTPS
或
`localhost`）；
`window.isSecureContext`
必須為
true。

## 列舉/執行介面（探測，而非假設）

在頁面上下文中，探測目前的生產介面：

```js
const mc = document.modelContext;
if (!window.isSecureContext || !mc) throw new Error('insecure origin or unsupported test environment');
const tools = await mc.getTools();
```

產生的斷言必須尊重的契約事實：

-
列舉的
`in
put
Sch
ema`
可能是
字串化
格式（
較舊的
Chr
ome
）或物
件（目
前的實
作/規
格虛設
常式）—
在斷言之
前先進行
`ty
peof
s
===
'str
ing'
?
JSON.p
ars
e(s)
:
s`。

### LLM 執行程式 — 處理兩種外觀（400 處方）

當 LLM 代理人迴圈取用 `getTools` -> OpenAI 相容的 `tools` -> `executeTool` 時：

- 原生 `inputSchema`
在較舊組建上可能經過字串化，或在目前組建上為物件外觀 — 進行 `typeof
s === "string" ? JSON.parse(s) : s`，且絕不要將未剖析的 JSON 字串傳回給期望物件的模型。

對於**宣告式**工具，同時驗證*合成的*結構描述：表單控制項
→ 結構描述的對應僅由目前的 Chrome
組建部分指定；手動探測其外觀。

## 每個工具的檢查項目

1.
已註冊（輪詢
—
註冊為非同步）
具有預期的名稱、
（經剖析的）結構描述**以及






**資訊清單中的
`annotations`。
2.
在給予有效輸入時成功執行，
傳回符合預期的結構化結果。
3.
在給予無效輸入時失敗
並提供明確的錯誤訊息。

## 測試載具

具現化
`templates/webmcp.spec.ts`、
`templates/web
mcp-compat.js`
以及
`templates/mutatio
n-journal.{ts,js}`
組（使用 `fsync`
的有界耐久日誌）。

**沒有測試設定的儲存庫 —
獨立測試載具處方。** 規格檔案保留在
`.webmcpify/webmcp.spec.ts`（單一事實來源），
但在臨時目錄中執行測試載具：

```sh
mkdir -p /tmp/webmcpify-harness && cd /tmp/webmcpify-harness
npm init -y && npm i -D --save-exact @playwright/test@1.61.1 typescript@5.9.3 @types/node@22.20.1
cat > playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: process.env.WEBMCP_SPEC_DIR,   // → <target-repo>/.webmcpify
  workers: 1,                              // one shared headed Chrome — never parallelize
  retries: 0,                              // never replay a possibly-mutating call
});
EOF
WEBMCP_SPEC_DIR=<target-repo>/.webmcpify \
WEBMCP_BASE_URL=<recorded-app.verificationOrigin> \
WEBMCP_PROFILE_DIR=<dedicated-writable-profile-dir> \
NODE_PATH=/tmp/webmcpify-harness/node_modules ./node_modules/.bin/playwright test
```

測試載具版本是本技能經過測試的版本，且
`@playwright/test`
與工作台的
Playwright 相符合。

`NODE_PATH`
讓儲存庫外的規格能夠解析
`@playwright/test`；
若目標的工具鏈忽略
`NODE_PATH`，請建立符號連結。

**替代方案：** Puppeteer
提供了第一流的實驗性 WebMCP
API
(https://pptr.dev/guides/webmcp)
— 當目標專案已經使用 Puppeteer 時建議優先採用。

## 異動發送先決條件

在使用規格範本、Puppeteer、
工作台、冒煙或模型執行程式之前，請閱讀
[耐久日誌通訊協定](reverify.md)。











未經鎖定與日誌記錄的異動會被測試載具拒絕。

## 代理人評估（建議；SaaS 規模就緒聲明所需的實證）

結構描述層級的驗證證明工具*可以運作*，但不能證明
LLM 會*選擇*它們或完成歷程。請明確區分這兩個層級。

在執行評估程式之前，
請使用來自目標專案已審查的確切版本，




或取得安裝評估程式的核准。

1. 執行
Google
的實驗性
**WebMCP
Evals
CLI**（GoogleChromeLabs/webmcp-tools，






套件
`webmcp-evals`）於
`smoke`
模式進行結構描述健全性檢查，或於完整模式進行多步驟代理人歷程驗證。

使用 `local`
進行快速的結構描述/選擇反覆運算，並使用
`browser`
針對真實暴露的工具。在驗證報告中記錄案例層級的成功與嘗試次數。

## 異動的效果界限

針對每個經核准的異動，透過獨立的
UI/讀取路徑斷言其預期效果，
接著斷言相關的相鄰狀態未被意外修改。






執行程式參考：[Google WebMCP Evals](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals)。

## 手動 QA（在報告中告知人類）

-
DevTools
→
**Application
→ WebMCP
面板**：即時工具清單、呼叫日誌、具有可編輯參數的「Run
tool」。 -
**模型主控台**（若支援）：在真實對話中測試代理人的選取。




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


