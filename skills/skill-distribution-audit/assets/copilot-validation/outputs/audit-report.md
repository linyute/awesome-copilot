# 歷史技能發佈稽核

## 結果

在兩次擷取中，集合發佈資訊清單皆與作用中來源集合相符。直接 `skills` 探索在變更前（before）修訂版與該來源集合不相符，但在變更後（after）修訂版則完全相符。比較是基於身份進行，且保留重複項目。未發現重複或具歧義的來源名稱。

| 擷取 / 來源修訂版 | 取用者 | 作用中來源身份 | Marketplace 路徑 | 擷取的探索名稱 | 來源↔marketplace | 來源↔探索 |
|---|---|---:|---:|---:|---|---|
| 變更前 — `3641911a4540686b02900c7c49a14d021286e3ee` | `skills` 1.7.4 | 1,093 | 1,093 | 1,076 | 完全相符；結束碼 0 | 不相符；結束碼 1 |
| 變更後 — `d696ae529a83ecdd83d2ae69d5a3a221b0209541` | `skills` 1.7.4 | 1,093 | 1,093 | 1,093 | 完全相符；結束碼 0 | 完全相符；結束碼 0 |

兩個來源索引皆包含 1,114 個身份，其中包含 21 個標記為已棄用（deprecated）的項目。兩個修訂版所提供的 `scripts/build-index.mjs` 發佈原則證據具有相同的 SHA-256（`693e4ba6bba90384e8ac35bc5f67f08267bb18b1153a6361e297a328f87c9e6b`）：第 13–18 行排除了 `_template`、`INDEX`、`node_modules`、`.git`、`scripts`、`assets` 與 `en`；第 703–708 行將狀態非 `deprecated` 的項目放入發佈磁區。這定義了此處使用的預期作用中集合。Marketplace 是一個獨立的發佈管道：其技能目錄路徑是與作用中來源路徑（移除 `SKILL.md` 後綴的來源路徑）進行比較，而非作為直接儲存庫探索的輸入。

## 確切差異

在變更前修訂版中，探索遺漏了以下 38 個作用中來源名稱：

```text
accessibility-wcag-audit, agent-payment-x402, agentmail-email-infra,
algolia-search-integration, astro-content-sites, azure-functions-serverless,
bats-shell-testing, bullmq-job-queue, bun-runtime-development, bwa-mem2-dna-aligner,
claude-api, convex-reactive-backend, electron-desktop-development, firebase-backend,
javascript-testing-patterns, jetpack-compose-expert, julia-scientific-pro,
modern-angular-expert, neon-serverless-postgres, nestjs-expert, nextjs-supabase-auth,
odoo-automated-tests, playwright-e2e-testing, pydantic-ai-agents,
shopify-app-development, slack-message-formatter, spline-3d-web-integration,
swift-concurrency, swiftui-best-practices, tailwind-css-patterns, tanstack-query,
threejs-3d-web, transformers-js, varlock-env-secrets-guard, vercel-ai-sdk,
websocket-realtime-engineer, zoom-meeting-bot-builder, zoom-rtms-realtime-media
```

它同時探索到了以下 20 個在來源索引中標記為已棄用的身份，以及在該索引中沒有身份的 `your-skill-name`：

```text
astronomy-data-toolkit, azure-container-apps-deploy, codetour-walkthrough-builder,
data-strategy-review, dpa-clause-reviewer, first-principles-assumption-auditor,
hardware-doc-generator, imessage-claude-bridge, llm-coding-mistake-guardrails,
market-sizing-analyst, mlops-model-productionizer, molecular-dynamics-simulation,
multi-framework-compliance-orchestrator, property-auction-legal-analysis,
release-manager, security-antipattern-hook, seo-traffic-drop-forensics,
tax-loss-harvesting, technical-change-tracker, x-twitter-automation, your-skill-name
```

此比較的任一方皆無重複身份。每個遺漏／非預期身份的來源路徑與來源索引行號皆記錄於 `discovery-finding-paths.json`；`your-skill-name` 沒有來源索引路徑。路徑-索引對應與歧義計數位於 `before-source-identity-map.json` 與 `after-source-identity-map.json`。在任一修訂版中，marketplace 比較皆無遺漏、非預期或重複路徑。

## 觀察到的證據與原因評估

- **觀察結果：** `before-discovery-stderr.txt` 包含 39 個 `YAML parse error` 警告。它們對應到 38 個遺漏的作用中身份加上 `09-verticals/defi-natural-language-agent/SKILL.md`（該項目已棄用，因此不在預期內）。大多數範例是在流程清單中未加上引號的 `@` 值；`astro-content-sites` 則回報了精簡對應中的巢狀對應錯誤。這些錯誤合理解釋了作用中項目的遺漏，但無法解釋已棄用身份或 `your-skill-name`。
- **觀察結果：** 變更後的 stderr 擷取為空，且變更後的探索清單與作用中來源身份清單完全相符。證據並未確立是哪些個別編輯或其他變更移除了早期的警告。
- **取用者實作證據：** `inputs/consumer-policy-source.json` 識別了快取的 `skills` 1.7.4 `dist/cli.mjs`（回報的 SHA-256 為 `b7d92e2a619e8982d38390572750efb8c2ec81cdf23c33aed2fa426d080a1e4e`）。第 21、1017–1027 與 1258–1277 行的摘錄顯示了 `yaml` 剖析器、frontmatter 剖析、必要的字串 `name` 與 `description` 檢查，以及對 `metadata.internal === true` 的排除（除非要求內部技能）。變更前擷取中探索到已棄用名稱，證實這些名稱在該擷取中未被排除；該摘錄並未確立所有取用者篩選行為。提供的來源出處說明該套件為本機快取；它也指出未獨立重新計算 tarball 完整性。未執行全新的取用者執行。

## 重現產物與指令

衍生的陣列為 `*-expected-manifest.json`、`*-manifest-paths.json`、`*-expected-discovery.json` 與 `*-discovered-names.json`。`derived-counts-and-ambiguities.json` 記錄了衍生的計數與路徑／名稱歧義檢查。四個完整的隨附輔助程式報告為 `before-manifest-comparison.json`、`before-discovery-comparison.json`、`after-manifest-comparison.json` 與 `after-discovery-comparison.json`；其結束代碼位於對應的 `.exitcode.txt` 檔案中。輔助程式相對於儲存庫根目錄的位置為 `.github\skills\skill-distribution-audit\scripts\compare-discovery.mjs`。

實際執行的指令：

```powershell
node --version
node .\outputs\derive-audit-inputs.mjs
node .\outputs\run-comparisons.mjs
node .\outputs\annotate-findings.mjs
node -e "const fs=require('node:fs'); for(const s of ['before-manifest','before-discovery','after-manifest','after-discovery']) { const r=JSON.parse(fs.readFileSync('outputs/'+s+'-comparison.json','utf8')); const c=Number(fs.readFileSync('outputs/'+s+'-comparison.exitcode.txt','utf8')); if(c!==(r.match?0:1)) throw Error(s+' result/exit mismatch'); console.log(s+': exit '+c+', match '+r.match+', '+r.counts.expected+' expected / '+r.counts.observed+' observed'); }"
```

已安裝的 Node 版本為 `v24.19.0`；最後一個指令根據輔助程式的比對結果驗證了每個保留的 JSON 報告與結束代碼。

`run-comparisons.mjs` 依 before-manifest、before-discovery、after-manifest、after-discovery 的順序，使用以下引數對呼叫隨附的輔助程式：

```text
before-expected-manifest.json  before-manifest-paths.json
before-expected-discovery.json  before-discovered-names.json
after-expected-manifest.json  after-manifest-paths.json
after-expected-discovery.json  after-discovered-names.json
```

擷取 Metadata 將指令識別為 `skills add findscripter/everything-skills --list`，套件版本 1.7.4。變更前擷取沒有時間戳記或記錄的取用者結束代碼／觀察到的簽出修訂版；其來源修訂版僅為 Metadata 值。變更後擷取記錄了 `2026-11-02T09:41:54.651Z`、結束代碼 0，以及與其來源修訂版相同的觀察前後修訂版。兩個擷取 Metadata 皆提供 stdout 雜湊值，並描述了從完整 `allDiscovered` 輸出中擷取名稱的方式。擷取的清單為歷史資料；此稽核僅執行了本機比較輔助程式，而非取用者或安裝程式。

## 限制

這些比較僅確立了所提供來源索引投影、資訊清單與歷史擷取探索的身份涵蓋率。僅包含名稱的探索輸出無法支援對來源索引中不存在的身份進行路徑歸屬；名稱衝突也將無法解決，儘管在提供的索引中未發現衝突。未執行獨立且詳盡的 frontmatter／結構描述稽核。快取的取用者摘錄及其陳述的來源出處並非對完整套件的全新驗證。結果並不確立即時 Copilot 載入、技能主體／輔助程式行為，或外部服務與認證可用性。未修改任何輸入或已安裝的技能檔案；未使用任何安裝程式、網路請求、認證存取、GitHub 變更或集合技能主體。