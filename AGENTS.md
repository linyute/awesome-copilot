# AGENTS.md

## 專案概述

Awesome GitHub Copilot 存放庫是一個社群驅動的自訂 Agent 和說明（instructions）集合，旨在增強跨多個領域、語言和使用情境的 GitHub Copilot 體驗。該專案包括：

- **Agent** - 與 MCP 伺服器整合的專用 GitHub Copilot Agent
- **說明** - 套用於特定檔案模式的程式碼標準與最佳實踐
- **技能** - 包含說明和適用於特殊工作之綑綁資源的獨立資料夾
- **Hook** - 在開發期間由特定事件觸發的自動化工作流程
- **工作流程** - 用於 GitHub Actions 中 AI 驅動之存放庫自動化的 [Agentic Workflows](https://github.github.com/gh-aw)
- **外掛程式** - 將特定主題的相關 Agent、指令 and 技能進行分組的可安裝套件

## 存放庫結構

```
.
├── agents/           # 自訂 GitHub Copilot Agent 定義（.agent.md 檔案）
├── instructions/     # 程式碼標準與指引（.instructions.md 檔案）
├── skills/           # Agent 技能資料夾（各包含 SKILL.md 及選用的綑綁資產）
├── hooks/            # 自動化工作流程 Hook（包含 README.md + hooks.json 的資料夾）
├── workflows/        # Agentic Workflows（用於 GitHub Actions 自動化的 .md 檔案）
├── plugins/          # 可安裝的外掛套件（包含 plugin.json 的資料夾）
├── extensions/       # Canvas 延伸模組（各包含 extension.mjs 與外掛程式 Metadata）
├── docs/             # 不同資源類型的文件
├── eng/              # 建構與自動化指令碼
└── scripts/          # 工具程式指令碼
```

## 設定指令

```bash
# 安裝相依性
npm ci

# 建構專案（產生 README.md 和 marketplace.json）
npm run build

# 驗證外掛程式 Manifest
npm run plugin:validate

# 僅產生 marketplace.json
npm run plugin:generate-marketplace

# 建立新的外掛程式
npm run plugin:create -- --name <plugin-name>

# 驗證 Agent 技能
npm run skill:validate

# 建立新的技能
npm run skill:create -- --name <skill-name>
```

## 開發工作流程

### 使用 Agent、說明、技能和 Hook

所有 Agent 檔案 (`*.agent.md`) 和說明檔案 (`*.instructions.md`) 都必須包含正確的 markdown front matter。Agent 技能是包含 `SKILL.md` 檔案（帶有 frontmatter）以及選用之綑綁資產的資料夾。Hook 是包含 `README.md`（帶有 frontmatter）和 `hooks.json` 組態檔案的資料夾：

#### Agent 檔案 (\*.agent.md)

- 必須具有 `description` 欄位（以單引號括起來）
- 檔案名稱應為小寫，並以連字號分隔單字
- 建議包含 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### 說明檔案 (\*.instructions.md)

- 必須具有 `description` 欄位（以單引號括起來，且不得為空）
- 必須具有指定檔案模式的 `applyTo` 欄位（例如 `'**.js, **.ts'`）
- 檔案名稱應為小寫，並以連字號分隔單字

#### Agent 技能 (skills/\*/SKILL.md)

- 每個技能都是一個包含 `SKILL.md` 檔案的資料夾
- SKILL.md 必須具有 `name` 欄位（小寫並帶有連字號，與資料夾名稱相符，最多 64 個字元）
- SKILL.md 必須具有 `description` 欄位（以單引號括起來，10-1024 個字元）
- 資料夾名稱應為小寫，並以連字號分隔單字
- 技能可以包含綑綁的資產（指令碼、範本、資料檔案）
- 綑綁的資產應在 SKILL.md 說明中進行引用
- 資產檔案大小應適中（每個檔案小於 5MB）
- 技能遵循 [Agent Skills 規格](https://agentskills.io/specification)

#### Canvas 延伸模組 (extensions/\*)

- 每個延伸模組資料夾都必須包含 `extension.mjs`
- 延伸模組 Metadata 必須位於 `.github/plugin/plugin.json`
- 延伸模組 `plugin.json` **必須**遵循以下慣例：
  - `name`、`description`、`version` 是必要的
  - `logo` **必須**正好是 `"assets/preview.png"`（強制慣例）
  - `extensions` **必須**正好是 `"."`（根據 [copilot-agent-runtime#9929](https://github.com/github/copilot-agent-runtime/pull/9929)）
  - 選用：`author`、`keywords` 欄位
  - **不得**包含 `x-awesome-copilot` 欄位（僅使用基於慣例的 `assets/preview.png`）
- 每個延伸模組都必須有 `assets/preview.png` 作為主要視覺資產
- 不要新增 `canvas.json`；網站 Metadata 來源自 `.github/plugin/plugin.json`

#### Hook 資料夾 (hooks/\*/README.md)

- 每個 Hook 都是一個包含帶有 frontmatter 之 `README.md` 檔案的資料夾
- README.md 必須具有 `name` 欄位（人類可讀的名稱）
- README.md 必須具有 `description` 欄位（以單引號括起來，且不得為空）
- 必須包含一個帶有 Hook 組態的 `hooks.json` 檔案（從該檔案中擷取 Hook 事件）
- 資料夾名稱應為小寫，並以連字號分隔單字
- 可以包含綑綁的資產（指令碼、公用程式、組態檔案）
- 綑綁的指令碼應在 README.md 和 hooks.json 中進行引用
- 遵循 [GitHub Copilot Hook 規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- 選用包含用於分類的 `tags` 陣列欄位

#### 工作流程檔案 (workflows/\*.md)

- 每個工作流程都是 `workflows/` 目錄中的一個獨立 `.md` 檔案
- 必須具有 `name` 欄位（人類可讀的名稱）
- 必須具有 `description` 欄位（以單引號括起來，且不得為空）
- 包含 Agentic Workflow frontmatter（`on`、`permissions`、`safe-outputs`）和自然語言說明
- 檔案名稱應為小寫，並以連字號分隔單字
- 僅接受 `.md` 檔案 — `.yml`、`.yaml` 和 `.lock.yml` 檔案將被 CI 封鎖
- 遵循 [GitHub Agentic Workflows 規格](https://github.github.com/gh-aw/reference/workflow-structure/)

#### 外掛程式資料夾 (plugins/\*)

- 每個外掛程式都是一個包含帶有 Metadata 之 `.github/plugin/plugin.json` 檔案的資料夾
- plugin.json 必須具有 `name` 欄位（與資料夾名稱相符）
- plugin.json 必須具有 `description` 欄位（說明外掛程式的目的）
- plugin.json 必須具有 `version` 欄位（語意化版本，例如 "1.0.0"）
- 外掛程式內容是在 plugin.json 中使用 Claude Code 規格欄位（`agents`、`commands`、`skills`）以宣告方式定義的。來源檔案位於頂層目錄中，並由 CI 實體化為外掛程式。
- `marketplace.json` 檔案是在建構期間從所有外掛程式自動產生的
- 外掛程式可透過 GitHub Copilot CLI 進行搜尋和安裝

### 新增資源

新增 Agent、說明、技能、Hook、工作流程或外掛程式時：

**對於 Agent 和說明：**

1. 建立具有正確 front matter 的檔案
2. 將檔案新增至適當的目錄
3. 執行以下指令更新 README.md：`npm run build`
4. 驗證該資源是否出現在產生的 README 中

**對於 Hook：**

1. 在 `hooks/` 中建立一個具有描述性名稱的新資料夾
2. 建立具有正確 front matter 的 `README.md`（name、description、hooks、tags）
3. 建立遵循 GitHub Copilot Hook 規格具有 Hook 組態的 `hooks.json`
4. 將任何綑綁的指令碼或資產新增至該資料夾中
5. 使指令碼可執行：`chmod +x script.sh`
6. 執行以下指令更新 README.md：`npm run build`
7. 驗證該 Hook 是否出現在產生的 README 中

**對於工作流程：**

1. 在 `workflows/` 中建立一個具有描述性名稱的新 `.md` 檔案（例如 `daily-issues-report.md`）
2. 包含帶有 `name` 和 `description` 的 frontmatter，加上 Agentic Workflow 欄位（`on`、`permissions`、`safe-outputs`）
3. 使用 `gh aw compile --validate` 進行編譯以驗證其有效性
4. 執行以下指令更新 README.md：`npm run build`
5. 驗證工作流程是否出現在產生的 README 中

**對於技能：**

1. 執行 `npm run skill:create` 以建立新技能資料夾的基礎結構
2. 編輯產生的 `SKILL.md` 檔案並填入您的說明
3. 將任何綑綁的資產（指令碼、範本、資料）新增至該技能資料夾
4. 執行 `npm run skill:validate` 以驗證技能結構
5. 執行以下指令更新 README.md：`npm run build`
6. 驗證該技能是否出現在產生的 README 中

**對於外掛程式：**

1. 執行 `npm run plugin:create -- --name <plugin-name>` 以建立新外掛程式的基礎結構
2. 使用 Claude Code 規格欄位在 `plugin.json` 中定義 Agent、指令和技能
3. 編輯產生的 `plugin.json` 並填入您的 Metadata
4. 執行 `npm run plugin:validate` 以驗證外掛程式結構
5. 執行 `npm run build` 以更新 README.md 和 marketplace.json
6. 驗證外掛程式是否出現在 `.github/plugin/marketplace.json` 中

**對於 Canvas 延伸模組：**

1. 在 `extensions/<extension-id>/` 中使用 `extension.mjs` 建立/更新延伸模組
2. 新增 `.github/plugin/plugin.json` Metadata（必要：`name`、`description`、`version`、`logo: "assets/preview.png"`、`extensions: "."`；選用：`author`、`keywords`）
3. 確保 `assets/preview.png` 存在並作為主要視覺資產
4. 執行 `npm run plugin:validate` 以驗證外掛程式與延伸模組 Metadata
5. 執行 `npm run build` 以重新產生網站資料與市集輸出

**對於 外部外掛程式：**

1. 請勿針對公開的第三方外掛程式提交直接開啟編輯 `plugins/external.json` 的 PR
2. 公開的外部外掛程式提交會使用 [CONTRIBUTING.md](CONTRIBUTING.md#adding-external-plugins) 中記載的外部外掛程式 issue 工作流程
3. 在 v1 中，公開提交僅接受 GitHub 代管的外掛程式，使用公開存放庫加上不可變的 `ref`、`sha` 或兩者皆有
4. `eng/external-plugin-validation.mjs` 中的共用驗證器是外部外掛程式資料規則的標準事實來源；請重用它，而不是在指令碼或工作流程中重複進行檢查
5. 提交的 issue 會歷經 `external-plugin` + `awaiting-review`，然後根據自動化品質關卡，進入 `ready-for-review` 或 `requires-submitter-fixes`
6. 編輯 issue 後，issue 作者或維護者可以留言 `/rerun-intake` 以重新執行自動化接案與品質關卡，而無需開啟新的提交 issue
7. 維護者可以使用 `/mark-ready-for-review [選填原因]` 顯式覆寫品質關卡封鎖，這會將 issue 移至 `ready-for-review`
8. 一旦 issue 處於 `ready-for-review` 狀態，維護者便會透過 `/approve` 或 `/reject <原因>` 的 issue 留言做出決定；核准的 issue 會被關閉，並作為六個月重新審查的基準點
9. 核准自動化會針對 `main` 建立或更新 PR、更新 `plugins/external.json` 並重新產生市集輸出
10. 每晚重新審查自動化會尋找已關閉且符合 `external-plugin` + `approved` 且至少有六個月歷史的 issue，套用 `re-review-due`，並為維護者開啟或更新一個追蹤的 issue
11. 維護者在原始已核准的提交 issue 上使用 `/re-review-keep`、`/re-review-needs-changes` 或 `/re-review-remove` 來完成重新審查；keep 會重設 issue 的 `closed_at`，而 remove 則會針對 `main` 開啟一個 PR

### 測試說明

```bash
# 執行所有驗證檢查
npm run plugin:validate
npm run skill:validate

# 建構並驗證 README 產生
npm run build

# 修正換行符號（在提交前為必要步驟）
bash eng/fix-line-endings.sh
```

在提交之前：

- 確保所有 markdown front matter 格式正確
- 驗證檔案名稱是否遵循小寫並以連字號分隔的慣例
- 執行 `npm run build` 以更新 README
- **務必執行 `bash eng/fix-line-endings.sh`** 以將換行符號標準化（CRLF → LF）
- 檢查您的新資源是否正確出現在 README 中

## 程式碼樣式指引

### Markdown 檔案

- 使用包含必要欄位的正確 front matter
- 保持說明簡潔且具備資訊性
- 將 description 欄位的值以單引號括起來
- 使用小寫且以連字號作為分隔符號的檔案名稱

### JavaScript/Node.js 指令碼

- 位於 `eng/` 和 `scripts/` 目錄中
- 遵循 Node.js ES 模組慣例（`.mjs` 擴充副檔名）
- 使用清晰且具描述性的函式與變數名稱

## Pull Request 指引

建立 Pull Request 時：

> **重要：** 所有 Pull Request 都應以 **`main`** 分支為目標，而非 `staged`。

1. **README 更新**：當您執行 `npm run build` 時，新檔案應會自動新增至 README
2. **Front matter 驗證**：確保所有 markdown 檔案都包含必要的 front matter 欄位
3. **檔案命名**：驗證所有新檔案都遵循小寫並以連字號分隔的命名慣例
4. **建構檢查**：在認可之前執行 `npm run build` 以驗證 README 的產生
5. **換行符號**：**務必執行 `bash eng/fix-line-endings.sh`** 以將換行符號標準化為 LF（Unix 樣式）
6. **描述**：清楚描述您的 Agent/說明的作用
7. **測試**：若新增外掛程式，請執行 `npm run plugin:validate` 以確保其有效性

### 提交前檢查清單

在提交您的 PR 之前，請確保您已：

- [ ] 執行 `npm install` (或 `npm ci`) 以安裝相依性
- [ ] 執行 `npm run build` 以產生更新後的 README.md
- [ ] 執行 `bash eng/fix-line-endings.sh` 以將換行符號標準化
- [ ] 驗證所有新檔案是否都具有正確的 front matter
- [ ] 測試您的貢獻是否可與 GitHub Copilot 正常運作
- [ ] 檢查檔案名稱是否遵循命名慣例

### 程式碼審查檢查清單

針對說明檔案 (\*.instructions.md)：

- [ ] 具有 markdown front matter
- [ ] 具有非空的 `description` 欄位（以單引號括起來）
- [ ] 具有帶有檔案模式的 `applyTo` 欄位
- [ ] 檔案名稱為小寫且帶有連字號

針對 Agent 檔案 (\*.agent.md)：

- [ ] 具有 markdown front matter
- [ ] 具有非空的 `description` 欄位（以單引號括起來）
- [ ] 具有包含人類可讀名稱的 `name` 欄位（例如 "Address Comments"，而非 "address-comments"）
- [ ] 檔案名稱為小寫且帶有連字號
- [ ] 包含 `model` 欄位（強烈建議）
- [ ] 考量使用 `tools` 欄位

針對技能 (skills/\*/)：

- [ ] 資料夾包含一個 SKILL.md 檔案
- [ ] SKILL.md 具有 markdown front matter
- [ ] 具有與資料夾名稱相符的 `name` 欄位（小寫並帶有連字號，與資料夾名稱相符，最多 64 個字元）
- [ ] 具有非空的 `description` 欄位，以單引號括起來（10-1024 個字元）
- [ ] 資料夾名稱為小寫且帶有連字號
- [ ] 任何綑綁的資產都在 SKILL.md 中進行引用
- [ ] 每個綑綁資產檔案大小在 5MB 以下

針對 Hook 資料夾 (hooks/\*/)：

- [ ] 資料夾包含一個帶有 markdown front matter 的 README.md 檔案
- [ ] 具有人類可讀名稱的 `name` 欄位
- [ ] 具有非空的 `description` 欄位（以單引號括起來）
- [ ] 具有帶有有效 Hook 組態的 `hooks.json` 檔案（從此檔案擷取 Hook 事件）
- [ ] 資料夾名稱為小寫且帶有連字號
- [ ] 任何綑綁的指令碼都是可執行的，且在 README.md 中進行引用
- [ ] 遵循 [GitHub Copilot Hook 規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- [ ] 選用包含用於分類的 `tags` 陣列欄位

針對工作流程檔案 (workflows/\*.md)：

- [ ] 檔案具有 markdown front matter
- [ ] 具有人類可讀名稱的 `name` 欄位
- [ ] 具有非空的 `description` 欄位（以單引號括起來）
- [ ] 檔案名稱為小寫且帶有連字號
- [ ] 在 frontmatter 中包含 `on` 和 `permissions`
- [ ] 工作流程使用最少權限與安全輸出
- [ ] 不包含 `.yml`、`.yaml` 或 `.lock.yml` 檔案
- [ ] 遵循 [GitHub Agentic Workflows 規格](https://github.github.com/gh-aw/reference/workflow-structure/)

針對外掛程式 (plugins/\*/)：

- [ ] 目錄包含一個 `.github/plugin/plugin.json` 檔案
- [ ] 目錄包含一個 `README.md` 檔案
- [ ] `plugin.json` 具有與目錄名稱相符的 `name` 欄位（小寫並帶有連字號）
- [ ] `plugin.json` 具有非空的 `description` 欄位
- [ ] `plugin.json` 具有 `version` 欄位（語意化版本，例如 "1.0.0"）
- [ ] 目錄名稱為小寫且帶有連字號
- [ ] 若存在 `keywords`，則它是一個由小寫且帶有連字號之字串組成的陣列
- [ ] 若存在 `agents`、`commands` 或 `skills` 陣列，則每個項目都是一個有效的相對路徑
- [ ] 外掛程式未引用不存在的檔案
- [ ] 執行 `npm run build` 以驗證 marketplace.json 是否正確更新

## 貢獻

這是一個社群驅動的專案。歡迎您的貢獻！請參閱：

- [CONTRIBUTING.md](CONTRIBUTING.md) 以取得貢獻指引
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 以取得社群標準
- [SECURITY.md](SECURITY.md) 以取得安全性原則

## MCP 伺服器

本存放庫包含一個 MCP (Model Context Protocol) 伺服器，可用於直接從此存放庫搜尋和安裝資源。執行此伺服器需要 Docker。

## 授權條款

MIT 授權條款 - 詳情請參閱 [LICENSE](LICENSE)
