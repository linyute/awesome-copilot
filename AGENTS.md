# AGENTS.md

## 專案概觀

Awesome GitHub Copilot 儲存機制是一個社群驅動的自訂代理人與指示集合，旨在增強跨各領域、語言與使用案例的 GitHub Copilot 體驗。此專案包括：

- **代理人 (Agents)** - 與 MCP 伺服器整合的專門 GitHub Copilot 代理人
- **指示 (Instructions)** - 套用至特定檔案模式的編碼標準與最佳做法
- **技能 (Skills)** - 包含指示與隨附資源的獨立資料夾，用於專門任務
- **Hook (Hooks)** - 在開發期間由特定事件觸發的自動化工作流程
- **工作流程 (Workflows)** - 用於 GitHub Actions 中 AI 驅動儲存機制自動化的 [Agentic Workflows](https://github.github.com/gh-aw)
- **外掛程式 (Plugins)** - 圍繞特定主題將相關代理人、Hook 與技能分組的可安裝套件

## 儲存機制結構

```
.
├── agents/           # 自訂 GitHub Copilot 代理人定義 (.agent.md 檔案)
├── instructions/     # 編碼標準與指引 (.instructions.md 檔案)
├── skills/           # 代理人技能資料夾 (每個包含 SKILL.md 與選用的隨附資產)
├── hooks/            # 自動化工作流程 Hook (包含 README.md + hooks.json 的資料夾)
├── workflows/        # Agentic Workflows (用於 GitHub Actions 自動化的 .md 檔案)
├── plugins/          # 可安裝外掛程式套件 (包含 plugin.json 的資料夾)
├── extensions/       # 可重複使用的畫布擴充功能原始碼 (extension.mjs 與資產)
├── docs/             # 不同資源類型的文件
├── eng/              # 建置與自動化指令碼
└── scripts/          # 公用程式指令碼
```

## 設定命令

```bash
# 安裝相依性
npm ci

# 建置專案 (產生 README.md 與 marketplace.json)
npm run build

# 驗證外掛程式資訊清單
npm run plugin:validate

# 僅產生 marketplace.json
npm run plugin:generate-marketplace

# 建立新外掛程式
npm run plugin:create -- --name <plugin-name>

# 驗證代理人技能
npm run skill:validate

# 建立新技能
npm run skill:create -- --name <skill-name>
```

## 開發工作流程

### 使用代理人、指示、技能與 Hook

所有代理人檔案 (`*.agent.md`) 與指示檔案 (`*.instructions.md`) 必須包含正確的 Markdown Front Matter。代理人技能是包含帶有 Frontmatter 的 `SKILL.md` 檔案與選用隨附資產的資料夾。Hook 是包含帶有 Frontmatter 的 `README.md` 與 `hooks.json` 組態檔案的資料夾：

#### 代理人檔案 (\*.agent.md)

- 必須具有 `description` 欄位 (以單引號包裹)
- 檔案名稱應為小寫，單字間以連字號分隔
- 建議包含 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### 指示檔案 (\*.instructions.md)

- 必須具有 `description` 欄位 (以單引號包裹，不可為空)
- 必須具有指定檔案模式的 `applyTo` 欄位 (例如 `'**.js, **.ts'`)
- 檔案名稱應為小寫，單字間以連字號分隔

#### 代理人技能 (skills/\*/SKILL.md)

- 每個技能都是包含 `SKILL.md` 檔案的資料夾
- SKILL.md 必須具有 `name` 欄位 (小寫帶連字號，符合資料夾名稱，最多 64 個字元)
- SKILL.md 必須具有 `description` 欄位 (以單引號包裹，10-1024 個字元)
- 資料夾名稱應為小寫，單字間以連字號分隔
- 技能可以包含隨附資產 (指令碼、範本、資料檔案)
- 隨附資產應在 SKILL.md 指示中引用
- 資產檔案大小應合理 (每個檔案小於 5MB)
- 技能遵循 [Agent Skills 規範](https://agentskills.io/specification)

#### 畫布擴充功能 (extensions/\*)

- 每個擴充功能資料夾必須包含 `extension.mjs`
- 擴充功能是可重複使用的原始碼元件，而非獨立外掛程式
- 可發布的擴充功能外掛程式由相符的 `plugins/<extension-id>/plugin.json` 註冊
- 外掛程式可透過在 `extensions.com.github.awesome-copilot.extensions` 中列出 `./extensions/<name>` 路徑來搭售額外的可重複使用擴充功能
- 每個擴充功能必須具備 `assets/preview.png` 作為主要視覺資產
- 擴充功能中繼資料 (metadata) 來自 `plugins/` 中相符的外掛程式資訊清單

#### Hook 資料夾 (hooks/\*/README.md)

- 每個 Hook 都是包含帶有 Frontmatter 的 `README.md` 檔案的資料夾
- README.md 必須具有 `name` 欄位 (人類可讀的名稱)
- README.md 必須具有 `description` 欄位 (以單引號包裹，不可為空)
- 必須包含具備 Hook 組態的 `hooks.json` 檔案 (Hook 事件從此檔案擷取)
- 資料夾名稱應為小寫，單字間以連字號分隔
- 可以包含隨附資產 (指令碼、公用程式、組態檔案)
- 隨附指令碼應在 README.md 與 hooks.json 中引用
- 遵循 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- 選用包含用於分類的 `tags` 欄位

#### 工作流程檔案 (workflows/\*.md)

- 每個工作流程都是 `workflows/` 目錄中的獨立 `.md` 檔案
- 必須具有 `name` 欄位 (人類可讀的名稱)
- 必須具有 `description` 欄位 (以單引號包裹，不可為空)
- 包含 Agentic Workflow Frontmatter (`on`、`permissions`、`safe-outputs`) 與自然語言指示
- 檔案名稱應為小寫，單字間以連字號分隔
- 僅接受 `.md` 檔案 — `.yml`、`.yaml` 與 `.lock.yml` 檔案將被 CI 阻擋
- 遵循 [GitHub Agentic Workflows 規範](https://github.github.com/gh-aw/reference/workflow-structure/)

#### 外掛程式資料夾 (plugins/\*)

- 每個外掛程式都是包含根目錄 `plugin.json` 檔案 (含中繼資料) 的資料夾
- plugin.json **必須**具備 `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"` (Agent Plugins v1.0.0)
- plugin.json 必須具有 `name` 欄位 (符合資料夾名稱)
- plugin.json 必須具有 `description` 欄位 (描述外掛程式的用途)
- plugin.json 必須具有 `version` 欄位 (語意化版本，例如 "1.0.0")
- 外掛程式內容在 plugin.json 中以宣告方式定義於 `extensions.com.github.awesome-copilot` 下，使用僅限原始碼的組合欄位 (`agents`、`hooks`、`skills` 與 `extensions`)。原始碼檔案位於最上層目錄，並由 CI 具體化為外掛程式。此命名空間會從提供的資訊清單中移除 — 技能使用標準的 `skills/` 目錄，而 Copilot 專用內容使用 `com.github.copilot/`。
- MCP 伺服器**不是**組合欄位。根據 Agent Plugins 規範，MCP 伺服器應在外掛程式根目錄的 `mcp.json` 檔案中宣告，並與 `plugin.json` 一同提交及原樣發佈。請勿將 `mcpServers` 新增至 `plugin.json`，也不要使用舊版的 `.mcp.json` 檔案名稱。
- `marketplace.json` 檔案在建置期間由所有外掛程式自動產生
- 外掛程式可透過 GitHub Copilot CLI 探索與安裝

### 新增資源

新增代理人、指示、技能、Hook、工作流程或外掛程式時：

**對於代理人與指示：**

1. 建立具有正確 Front Matter 的檔案
2. 將檔案新增至適當目錄
3. 執行：`npm run build` 更新 README.md
4. 驗證該資源出現在產生的 README 中

**對於 Hook：**

1. 在 `hooks/` 中建立具有描述性名稱的新資料夾
2. 建立具有正確 Frontmatter 的 `README.md` (name, description, hooks, tags)
3. 建立符合 GitHub Copilot hooks 規範的 `hooks.json`
4. 將任何隨附指令碼或資產新增至資料夾中
5. 使指令碼可執行：`chmod +x script.sh`
6. 執行：`npm run build` 更新 README.md
7. 驗證該 Hook 出現在產生的 README 中

**對於工作流程：**

1. 在 `workflows/` 中建立具有描述性名稱的新 `.md` 檔案 (例如 `daily-issues-report.md`)
2. 包含帶有 `name` 與 `description` 的 Frontmatter，加上 Agentic Workflow 欄位 (`on`、`permissions`、`safe-outputs`)
3. 使用 `gh aw compile --validate` 進行編譯以驗證其有效性
4. 執行：`npm run build` 更新 README.md
5. 驗證工作流程出現在產生的 README 中

**對於技能：**

1. 執行 `npm run skill:create` 搭架新的技能資料夾
2. 編輯產生的 SKILL.md 檔案以填入指示
3. 將任何隨附資產 (指令碼、範本、資料) 新增至技能資料夾
4. 執行 `npm run skill:validate` 驗證技能結構
5. 執行：`npm run build` 更新 README.md
6. 驗證技能出現在產生的 README 中

**對於外掛程式：**

1. 執行 `npm run plugin:create -- --name <plugin-name>` 搭架新外掛程式
2. 在 `plugin.json` 的 `extensions.com.github.awesome-copilot` 下定義代理人、Hook、技能與可重複使用的擴充功能
3. 編輯產生的 `plugin.json` 填入中繼資料
4. 執行 `npm run plugin:validate` 驗證外掛程式結構
5. 執行 `npm run build` 更新 README.md 與 marketplace.json
6. 驗證外掛程式出現在 `.github/plugin/marketplace.json` 中

**對於畫布擴充功能：**

1. 在 `extensions/<extension-id>/` 中建立/更新擴充功能與 `extension.mjs`
2. 在 `plugins/<extension-id>/plugin.json` 下新增相符的外掛程式資訊清單：
   ```json
   {
     "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
     "name": "<extension-id>",
     "description": "...",
     "version": "1.0.0",
     "extensions": {
       "com.github.copilot": {
         "logo": "assets/preview.png"
       }
     }
   }
   ```
3. 確保 `assets/preview.png` 存在作為主要視覺資產
4. 執行 `npm run plugin:validate` 驗證外掛程式與擴充功能中繼資料
5. 執行 `npm run build` 重新產生網站資料與 marketplace 輸出

若要將擴充功能搭售至另一個外掛程式中而無需建立第二份原始碼複本，請在 `plugins/<plugin-id>/plugin.json` 的 `extensions.com.github.awesome-copilot.extensions` 下新增已排序的 `./extensions/<name>` 路徑。

**對於外部外掛程式：**

1. 對於公開的第三方外掛程式提交，不要開啟直接編輯 `plugins/external.json` 的 PR
2. 公開的外部外掛程式提交使用 [CONTRIBUTING.md](CONTRIBUTING.md#adding-external-plugins) 中記載的外部外掛程式 Issue 工作流程
3. 在 v1 中，僅接受託管於 GitHub 上的外掛程式進行公開提交，使用公開儲存機制加上不可變的 `ref`、`sha` 或兩者
4. `eng/external-plugin-validation.mjs` 中的共用驗證器是外部外掛程式資料規則的權威事實來源；請重複使用它，而非在指令碼或工作流程中重複檢查
5. 提交 Issue 依序經過 `external-plugin` + `awaiting-review`，然後根據自動化品質關卡轉為 `ready-for-review` 或 `requires-submitter-fixes`
6. 提交 Issue 開啟期間，Issue 作者或維護者可以留言 `/rerun-intake`，重新執行自動接收流程與品質關卡。遭維護者拒絕的 Issue 為終止狀態；處理拒絕回饋的貢獻者必須開啟新的提交 Issue
7. 維護者可以使用 `/mark-ready-for-review [optional reason]` 明確覆寫品質關卡阻礙，將 Issue 移至 `ready-for-review`
8. 一旦 Issue 處於 `ready-for-review` 狀態，維護者可透過 `/approve` 或 `/reject <reason>` 的 Issue 留言做出決定；核准的 Issue 會被關閉並作為六個月重新審查的基準錨點
9. 核准自動化會建立或更新針對 `main` 的 PR、更新 `plugins/external.json` 並重新產生 marketplace 輸出
10. 每夜重新審查自動化會尋找至少已六個月的已關閉 `external-plugin` + `approved` Issue，套用 `re-review-due` 標籤，並為維護者開啟或更新追蹤 Issue
11. 維護者在原始已核准的提交 Issue 上使用 `/re-review-keep`、`/re-review-needs-changes` 或 `/re-review-remove` 完成重新審查；keep 會重設 Issue 的 `closed_at`，而 remove 會開啟針對 `main` 的 PR

### 測試指示

```bash
# 執行所有驗證檢查
npm run plugin:validate
npm run skill:validate

# 建置並驗證 README 產生
npm run build

# 修正換行字元 (提交前必備)
bash eng/fix-line-endings.sh
```

提交之前：

- 確保所有 Markdown Front Matter 格式正確
- 驗證檔案名稱遵循小寫帶連字號慣例
- 執行 `npm run build` 更新 README
- **務必執行 `bash eng/fix-line-endings.sh`** 以正規化換行字元 (CRLF → LF)
- 檢查您的新資源是否正確出現在 README 中

## 程式碼風格指引

### Markdown 檔案

- 使用包含必填欄位的正確 Front Matter
- 保持描述簡潔且具資訊量
- 將 description 欄位值包裹在單引號中
- 使用小寫檔案名稱並以連字號作為分隔符號

### JavaScript/Node.js 指令碼

- 位於 `eng/` 與 `scripts/` 目錄中
- 遵循 Node.js ES 模組慣例 (`.mjs` 副檔名)
- 使用清晰、具描述性的函式與變數名稱

## Pull Request 指引

建立 Pull Request 時：

> **重要事項：** 所有 Pull Request 應以 **`main`** 分支為目標，而非 `staged`。

1. **README 更新**：當您執行 `npm run build` 時，新檔案應自動新增至 README
2. **Front Matter 驗證**：確保所有 Markdown 檔案具有必要的 Front Matter 欄位
3. **檔案命名**：驗證所有新檔案遵循小寫帶連字號命名慣例
4. **建置檢查**：提交前執行 `npm run build` 以驗證 README 產生
5. **換行字元**：**務必執行 `bash eng/fix-line-endings.sh`** 將換行字元正規化為 LF (Unix 風格)
6. **描述**：為您的代理人/指示提供清晰的用途說明
7. **測試**：若新增外掛程式，請執行 `npm run plugin:validate` 以確保有效性

### 提交前檢查清單

在提交 PR 之前，請確保您已：

- [ ] 執行 `npm install` (或 `npm ci`) 安裝相依性
- [ ] 執行 `npm run build` 產生更新後的 README.md
- [ ] 執行 `bash eng/fix-line-endings.sh` 正規化換行字元
- [ ] 驗證所有新檔案具有正確的 Front Matter
- [ ] 測試您的貢獻可與 GitHub Copilot 一同運作
- [ ] 檢查檔案名稱符合命名慣例

### 程式碼審查檢查清單

對於指示檔案 (\*.instructions.md)：

- [ ] 具有 Markdown Front Matter
- [ ] 具有包裹在單引號中的非空 `description` 欄位
- [ ] 具有帶有檔案模式的 `applyTo` 欄位
- [ ] 檔案名稱為小寫帶連字號

對於代理人檔案 (\*.agent.md)：

- [ ] 具有 Markdown Front Matter
- [ ] 具有包裹在單引號中的非空 `description` 欄位
- [ ] 具有包含人類可讀名稱的 `name` 欄位 (例如 "Address Comments" 而非 "address-comments")
- [ ] 檔案名稱為小寫帶連字號
- [ ] 包含 `model` 欄位 (強烈建議)
- [ ] 考慮使用 `tools` 欄位

對於技能 (skills/\*/)：

- [ ] 資料夾包含 SKILL.md 檔案
- [ ] SKILL.md 具有 Markdown Front Matter
- [ ] 具有符合資料夾名稱的 `name` 欄位 (小寫帶連字號，最多 64 個字元)
- [ ] 具有包裹在單引號中的非空 `description` 欄位 (10-1024 個字元)
- [ ] 資料夾名稱為小寫帶連字號
- [ ] 任何隨附資產均在 SKILL.md 中引用
- [ ] 隨附資產每個檔案小於 5MB

對於 Hook 資料夾 (hooks/\*/)：

- [ ] 資料夾包含帶有 Markdown Front Matter 的 README.md 檔案
- [ ] 具有包含人類可讀名稱的 `name` 欄位
- [ ] 具有包裹在單引號中的非空 `description` 欄位
- [ ] 具有包含有效 Hook 組態的 `hooks.json` 檔案 (Hook 事件從此檔案擷取)
- [ ] 資料夾名稱為小寫帶連字號
- [ ] 任何隨附指令碼皆可執行且在 README.md 中引用
- [ ] 遵循 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- [ ] 選用包含用於分類的 `tags` 陣列欄位

對於工作流程檔案 (workflows/\*.md)：

- [ ] 檔案具有 Markdown Front Matter
- [ ] 具有包含人類可讀名稱的 `name` 欄位
- [ ] 具有包裹在單引號中的非空 `description` 欄位
- [ ] 檔案名稱為小寫帶連字號
- [ ] Frontmatter 中包含 `on` 與 `permissions`
- [ ] 工作流程使用最低權限與安全輸出
- [ ] 未包含 `.yml`、`.yaml` 或 `.lock.yml` 檔案
- [ ] 遵循 [GitHub Agentic Workflows 規範](https://github.github.com/gh-aw/reference/workflow-structure/)

對於外掛程式 (plugins/\*/)：

- [ ] 目錄包含根目錄 `plugin.json` 檔案
- [ ] 目錄包含 `README.md` 檔案
- [ ] `plugin.json` 具有 `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`
- [ ] `plugin.json` 具有符合目錄名稱的 `name` 欄位 (小寫帶連字號)
- [ ] `plugin.json` 具有非空的 `description` 欄位
- [ ] `plugin.json` 具有 `version` 欄位 (語意化版本，例如 "1.0.0")
- [ ] 目錄名稱為小寫帶連字號
- [ ] 若存在 `keywords`，它是一個由小寫帶連字號字串組成的陣列
- [ ] 若 `extensions.com.github.awesome-copilot` 下存在組合陣列，每個項目都是有效的相對路徑
- [ ] 若外掛程式包含 MCP 伺服器，則必須在外掛程式根目錄的 `mcp.json` 中宣告 (包含 `mcp.schema.json` 的 `$schema`)，而非在 `plugin.json` 或 `.mcp.json` 中宣告
- [ ] 外掛程式未參照不存在的檔案
- [ ] 執行 `npm run plugin:validate` 與 `npm run build` 驗證外掛程式通過所有檢查

## 貢獻

這是一個社群驅動的專案。歡迎貢獻！請參閱：

- [CONTRIBUTING.md](CONTRIBUTING.md) 了解貢獻指引
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 了解社群標準
- [SECURITY.md](SECURITY.md) 了解安全性政策

## MCP 伺服器

儲存機制包含一個 MCP (Model Context Protocol) 伺服器，用於直接從此儲存機制搜尋與安裝資源。執行伺服器需要 Docker。

## 授權條款

MIT 授權條款 - 詳見 [LICENSE](LICENSE)
