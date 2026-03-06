# AGENTS.md

## 專案總覽

Awesome GitHub Copilot 存放區是一個由社群驅動的自定義代理程式與指引集合，旨在增強不同領域、語言和使用情境下的 GitHub Copilot 體驗。本專案包含：

- **代理程式 (Agents)** — 與 MCP 伺服器整合的專門 GitHub Copilot 代理程式
- **指引 (Instructions)** — 套用於特定檔案模式的編碼標準與最佳實踐
- **技能 (Skills)** — 包含專門任務指引與隨附資源的獨立資料夾
- **勾點 (Hooks)** — 開發期間由特定事件觸發的自動化工作流程
- **工作流程 (Workflows)** — 用於 GitHub Actions 中 AI 驅動之存放區自動化的 [代理型工作流程 (Agentic Workflows)](https://github.github.com/gh-aw)
- **外掛程式 (Plugins)** — 將相關代理程式、命令與技能圍繞特定主題進行分組的可安裝套件

## 存放區結構

```
.
├── agents/           # 自定義 GitHub Copilot 代理程式定義 (.agent.md 檔案)
├── instructions/     # 編碼標準與指引 (.instructions.md 檔案)
├── skills/           # 代理程式技能資料夾 (各含 SKILL.md 及選用的隨附資產)
├── hooks/            # 自動化工作流程勾點 (包含 README.md + hooks.json 的資料夾)
├── workflows/        # 代理型工作流程 (用於 GitHub Actions 自動化的 .md 檔案)
├── plugins/          # 可安裝的外掛程式套件 (包含 plugin.json 的資料夾)
├── docs/             # 不同資源類型的文件
├── eng/              # 建構與自動化指令碼
└── scripts/          # 工具指令碼
```

## 設定命令

```bash
# 安裝相依性
npm ci

# 建構專案 (產生 README.md 和 marketplace.json)
npm run build

# 驗證外掛程式資訊清單
npm run plugin:validate

# 僅產生 marketplace.json
npm run plugin:generate-marketplace

# 建立新外掛程式
npm run plugin:create -- --name <plugin-name>

# 驗證代理程式技能
npm run skill:validate

# 建立新技能
npm run skill:create -- --name <skill-name>
```

## 開發工作流程

### 使用代理程式、指引、技能與勾點

所有代理程式檔案 (`*.agent.md`) 和指引檔案 (`*.instructions.md`) 必須包含正確的 Markdown Front Matter。代理程式技能是包含 `SKILL.md` 檔案 (含 Front Matter) 及選用隨附資產的資料夾。勾點是包含 `README.md` (含 Front Matter) 及 `hooks.json` 設定檔的資料夾：

#### 代理程式檔案 (*.agent.md)
- 必須具有 `description` 欄位 (以單引號括起來)
- 檔案名稱應為小寫，單字間以連字號分隔
- 建議包含 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### 指引檔案 (*.instructions.md)
- 必須具有 `description` 欄位 (以單引號括起來，不得為空)
- 必須具有 `applyTo` 欄位以指定檔案模式 (例如：`'**.js, **.ts'`)
- 檔案名稱應為小寫，單字間以連字號分隔

#### 代理程式技能 (skills/*/SKILL.md)
- 每個技能都是一個包含 `SKILL.md` 檔案的資料夾
- `SKILL.md` 必須具有 `name` 欄位 (小寫加連字號，與資料夾名稱相符，最多 64 個字元)
- `SKILL.md` 必須具有 `description` 欄位 (以單引號括起來，10-1024 個字元)
- 資料夾名稱應為小寫，單字間以連字號分隔
- 技能可以包含隨附資產 (指令碼、範本、資料檔案)
- 隨附資產應在 `SKILL.md` 指引中引用
- 資產檔案大小應適中 (每個檔案小於 5MB)
- 技能遵循 [代理程式技能規格 (Agent Skills specification)](https://agentskills.io/specification)

#### 勾點資料夾 (hooks/*/README.md)
- 每個勾點都是一個包含 `README.md` 檔案 (含 Front Matter) 的資料夾
- `README.md` 必須具有 `name` 欄位 (人類可讀的名稱)
- `README.md` 必須具有 `description` 欄位 (以單引號括起來，不得為空)
- 必須包含一個 `hooks.json` 檔案，其中包含勾點設定 (從此檔案提取勾點事件)
- 資料夾名稱應為小寫，單字間以連字號分隔
- 可以包含隨附資產 (指令碼、工具、設定檔)
- 隨附指令碼應在 `README.md` 和 `hooks.json` 中引用
- 遵循 [GitHub Copilot 勾點規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- 選用 `tags` 欄位進行分類

#### 工作流程檔案 (workflows/*.md)
- 每個工作流程都是 `workflows/` 目錄中的獨立 `.md` 檔案
- 必須具有 `name` 欄位 (人類可讀的名稱)
- 必須具有 `description` 欄位 (以單引號括起來，不得為空)
- 包含代理型工作流程 Front Matter (`on`, `permissions`, `safe-outputs`) 和自然語言指引
- 檔案名稱應為小寫，單字間以連字號分隔
- 僅接受 `.md` 檔案 — `.yml`、`.yaml` 和 `.lock.yml` 檔案會被 CI 封鎖
- 遵循 [GitHub 代理型工作流程規格](https://github.github.com/gh-aw/reference/workflow-structure/)

#### 外掛程式資料夾 (plugins/*)
- 每個外掛程式都是一個包含 `.github/plugin/plugin.json` 檔案 (含 Metadata) 的資料夾
- `plugin.json` 必須具有 `name` 欄位 (與資料夾名稱相符)
- `plugin.json` 必須具有 `description` 欄位 (描述外掛程式的用途)
- `plugin.json` 必須具有 `version` 欄位 (語義化版本，例如 "1.0.0")
- 外掛程式內容是在 `plugin.json` 中使用 Claude Code 規格欄位 (`agents`, `commands`, `skills`) 宣告定義的。原始檔案位於頂層目錄，並由 CI 實體化為外掛程式。
- `marketplace.json` 檔案在建構期間從所有外掛程式自動產生
- 外掛程式可透過 GitHub Copilot CLI 探索與安裝

### 新增資源

新增代理程式、指引、技能、勾點、工作流程或外掛程式時：

**針對代理程式與指引：**
1. 建立具有正確 Front Matter 的檔案
2. 將檔案加入適當的目錄
3. 執行：`npm run build` 以更新 `README.md`
4. 驗證資源是否出現在產生的 README 中

**針對勾點：**
1. 在 `hooks/` 中建立一個具有描述性名稱的新資料夾
2. 建立具備正確 Front Matter 的 `README.md` (name, description, hooks, tags)
3. 建立遵循 GitHub Copilot 勾點規格之勾點設定的 `hooks.json`
4. 將任何隨附指令碼或資產加入資料夾
5. 使指令碼具備執行權限：`chmod +x script.sh`
6. 執行：`npm run build` 以更新 `README.md`
7. 驗證勾點是否出現在產生的 README 中

**針對工作流程：**
1. 在 `workflows/` 中建立一個具有描述性名稱的新 `.md` 檔案 (例如：`daily-issues-report.md`)
2. 包含含有 `name` 和 `description` 的 Front Matter，以及代理型工作流程欄位 (`on`, `permissions`, `safe-outputs`)
3. 使用 `gh aw compile --validate` 進行編譯以驗證其有效性
4. 執行：`npm run build` 以更新 `README.md`
5. 驗證工作流程是否出現在產生的 README 中

**針對技能：**
1. 執行 `npm run skill:create` 以建置新技能資料夾的基礎結構
2. 編輯產生的 `SKILL.md` 檔案並填入您的指引
3. 將任何隨附資產 (指令碼、範本、資料) 加入技能資料夾
4. 執行 `npm run skill:validate` 以驗證技能結構
5. 執行：`npm run build` 以更新 `README.md`
6. 驗證技能是否出現在產生的 README 中

**針對外掛程式：**
1. 執行 `npm run plugin:create -- --name <plugin-name>` 以建置新外掛程式的基礎結構
2. 在 `plugin.json` 中使用 Claude Code 規格欄位定義代理程式、命令與技能
3. 編輯產生的 `plugin.json` 並填入您的 Metadata
4. 執行 `npm run plugin:validate` 以驗證外掛程式結構
5. 執行 `npm run build` 以更新 `README.md` 和 `marketplace.json`
6. 驗證外掛程式是否出現在 `.github/plugin/marketplace.json` 中

**針對外部外掛程式：**
1. 編輯 `plugins/external.json`，新增一個包含 `name`、`source`、`description` 與 `version` 的條目
2. `source` 欄位應為一個物件，指定 GitHub 倉庫、git URL、npm 套件或 pip 套件（請參閱 [CONTRIBUTING.md](CONTRIBUTING.md#adding-external-plugins)）
3. 執行 `npm run build` 以重新產生 `marketplace.json`
4. 驗證該外部外掛程式是否出現在 `.github/plugin/marketplace.json` 中

### 測試指引

```bash
# 執行所有驗證檢查
npm run plugin:validate
npm run skill:validate

# 建構並驗證 README 產生
npm run build

# 修復行尾換行符號 (提交前必須執行)
bash scripts/fix-line-endings.sh
```

提交前：
- 確保所有 Markdown Front Matter 格式正確
- 驗證檔案名稱遵循小寫加連字號的慣例
- 執行 `npm run build` 以更新 README
- **務必執行 `bash scripts/fix-line-endings.sh`** 以正規化行尾換行符號 (CRLF → LF)
- 檢查您的新資源是否正確出現在 README 中

## 程式碼風格指引

### Markdown 檔案
- 使用具備必要欄位的正確 Front Matter
- 保持說明簡潔且具資訊性
- 將說明欄位的值以單引號括起來
- 使用小寫檔案名稱並以連字號作為分隔符

### JavaScript/Node.js 指令碼
- 位於 `eng/` 和 `scripts/` 目錄中
- 遵循 Node.js ES 模組慣例 (`.mjs` 副檔名)
- 使用清晰、具描述性的函式與變數名稱

## 提取要求 (Pull Request) 指引

建立提取要求時：

> **重要提示：** 所有提取要求應針對 **`staged`** 分支，而非 `main`。

1. **README 更新**：當您執行 `npm run build` 時，新檔案應會自動加入 README
2. **Front Matter 驗證**：確保所有 Markdown 檔案皆具備必要的 Front Matter 欄位
3. **檔案命名**：驗證所有新檔案皆遵循小寫加連字號的命名慣例
4. **建構檢查**：提交前執行 `npm run build` 以驗證 README 產生
5. **行尾換行符號**：**務必執行 `bash scripts/fix-line-endings.sh`** 以將行尾換行符號正規化為 LF (Unix 樣式)
6. **說明**：針對您的代理程式/指引功能提供清晰的說明
7. **測試**：若新增外掛程式，請執行 `npm run plugin:validate` 以確保有效性

### 提交前檢核表

提交 PR 之前，請確保您已：
- [ ] 執行 `npm install` (或 `npm ci`) 以安裝相依性
- [ ] 執行 `npm run build` 以產生更新後的 `README.md`
- [ ] 執行 `bash scripts/fix-line-endings.sh` 以正規化行尾換行符號
- [ ] 驗證所有新檔案皆具備正確的 Front Matter
- [ ] 測試您的貢獻可與 GitHub Copilot 共同運作
- [ ] 檢查檔案名稱是否遵循命名慣例

### 程式碼檢閱檢核表

針對指引檔案 (*.instructions.md)：
- [ ] 具備 Markdown Front Matter
- [ ] 具備以單引號括起來的非空 `description` 欄位
- [ ] 具備帶有檔案模式的 `applyTo` 欄位
- [ ] 檔案名稱為小寫加連字號

針對代理程式檔案 (*.agent.md)：
- [ ] 具備 Markdown Front Matter
- [ ] 具備以單引號括起來的非空 `description` 欄位
- [ ] 具備帶有人類可讀名稱的 `name` 欄位 (例如 "Address Comments" 而非 "address-comments")
- [ ] 檔案名稱為小寫加連字號
- [ ] 包含 `model` 欄位 (強烈建議)
- [ ] 考慮使用 `tools` 欄位

針對技能 (skills/*/):
- [ ] 資料夾包含 `SKILL.md` 檔案
- [ ] `SKILL.md` 具備 Markdown Front Matter
- [ ] 具備與資料夾名稱相符的 `name` 欄位 (小寫加連字號，最多 64 個字元)
- [ ] 具備以單引號括起來的非空 `description` 欄位 (10-1024 個字元)
- [ ] 資料夾名稱為小寫加連字號
- [ ] 任何隨附資產皆已在 `SKILL.md` 中引用
- [ ] 隨附資產每個檔案小於 5MB

針對勾點資料夾 (hooks/*/):
- [ ] 資料夾包含具備 Markdown Front Matter 的 `README.md` 檔案
- [ ] 具備帶有人類可讀名稱的 `name` 欄位
- [ ] 具備以單引號括起來的非空 `description` 欄位
- [ ] 具備含有有效勾點設定的 `hooks.json` 檔案 (從此檔案提取勾點事件)
- [ ] 資料夾名稱為小寫加連字號
- [ ] 任何隨附指令碼皆具備執行權限且已在 `README.md` 中引用
- [ ] 遵循 [GitHub Copilot 勾點規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- [ ] 選用 `tags` 陣列欄位進行分類

針對工作流程檔案 (workflows/*.md)：
- [ ] 檔案具備 Markdown Front Matter
- [ ] 具備帶有人類可讀名稱的 `name` 欄位
- [ ] 具備以單引號括起來的非空 `description` 欄位
- [ ] 檔案名稱為小寫加連字號
- [ ] Front Matter 包含 `on` 和 `permissions`
- [ ] 工作流程使用最小權限與安全輸出
- [ ] 未包含 `.yml`、`.yaml` 或 `.lock.yml` 檔案
- [ ] 遵循 [GitHub 代理型工作流程規格](https://github.github.com/gh-aw/reference/workflow-structure/)

針對外掛程式 (plugins/*/):
- [ ] 目錄包含 `.github/plugin/plugin.json` 檔案
- [ ] 目錄包含 `README.md` 檔案
- [ ] `plugin.json` 具有與目錄名稱相符的 `name` 欄位 (小寫加連字號)
- [ ] `plugin.json` 具有非空的 `description` 欄位
- [ ] `plugin.json` 具有 `version` 欄位 (語義化版本，例如 "1.0.0")
- [ ] 目錄名稱為小寫加連字號
- [ ] 若存在 `keywords`，則應為小寫加連字號的字串陣列
- [ ] 若存在 `agents`、`commands` 或 `skills` 陣列，則每個項目應為有效的相對路徑
- [ ] 外掛程式未引用不存在的檔案
- [ ] 執行 `npm run build` 以驗證 `marketplace.json` 已正確更新

## 貢獻

這是一個社群驅動的專案。歡迎各界貢獻！請參閱：
- [CONTRIBUTING.md](CONTRIBUTING.md) 獲取貢獻指引
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 獲取社群準則
- [SECURITY.md](SECURITY.md) 獲取安全性政策

## MCP 伺服器

本存放區包含一個 MCP (Model Context Protocol) 伺服器，用於直接從本存放區搜尋與安裝資源。執行該伺服器需要安裝 Docker。

## 授權條款

MIT 授權 — 詳情請參閱 [LICENSE](LICENSE)
