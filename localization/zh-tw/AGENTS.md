# AGENTS.md

## 專案概述

Awesome GitHub Copilot 儲存庫是一個由社群驅動的自訂代理程式、提示和指令的集合，旨在增強 GitHub Copilot 在各種領域、語言和使用案例中的體驗。該專案包括：

- **代理程式** - 與 MCP 伺服器整合的專用 GitHub Copilot 代理程式
- **提示** - 用於程式碼產生和問題解決的特定任務提示
- **指令** - 應用於特定檔案模式的程式碼標準和最佳實踐
- **技能** - 包含指令和專門任務的捆綁資源的獨立資料夾
- **Hooks** - 在開發期間由特定事件觸發的自動化工作流程
- **集合** - 圍繞特定主題和工作流程組織的精選集合

## 儲存庫結構

```
.
├── agents/           # 自訂 GitHub Copilot 代理程式定義（.agent.md 檔案）
├── prompts/          # 特定任務提示（.prompt.md 檔案）
├── instructions/     # 程式碼標準和指南（.instructions.md 檔案）
├── skills/           # 代理程式技能資料夾（每個包含 SKILL.md 和可選的捆綁資產）
├── hooks/            # 自動化工作流程 Hooks（資料夾內含 README.md + hooks.json）
├── collections/      # 精選資源集合（.md 檔案）
├── docs/             # 不同資源類型的文件
├── eng/              # 建構和自動化腳本
└── scripts/          # 公用程式腳本
```

## 設定指令

```bash
# 安裝依賴項
npm ci

# 建構專案（產生 README.md 和 marketplace.json）
npm run build

# 產生 marketplace.json
npm run plugin:generate-marketplace

# 驗證集合清單
npm run collection:validate

# 建立新的集合
npm run collection:create -- --id <collection-id> --tags <tags>

# 驗證代理程式技能
npm run skill:validate

# 建立新的技能
npm run skill:create -- --name <skill-name>
```

## 開發工作流程

### 與代理程式、提示、指令、技能和 Hooks 的協作

所有代理程式檔案（`*.agent.md`）、提示檔案（`*.prompt.md`）和指令檔案（`*.instructions.md`）都必須包含正確的 Markdown front matter。代理程式技能（skills）是包含 `SKILL.md`（附有 front matter）和可選捆綁資產的資料夾。Hooks 是包含具有 front matter 的 `README.md` 與 `hooks.json` 設定檔的資料夾：

#### 代理程式檔案 (*.agent.md)
- 必須有 `description` 欄位（用單引號包裝）
- 檔案名稱應為小寫，單詞之間用連字號分隔
- 建議包含 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### 提示檔案 (*.prompt.md)
- 必須有 `agent` 欄位（值應為用單引號包裝的 `'agent'`）
- 必須有 `description` 欄位（用單引號包裝，不為空）
- 檔案名稱應為小寫，單詞之間用連字號分隔
- 如果適用，建議指定 `tools`
- 強烈建議指定 `model` 欄位

#### 指令檔案 (*.instructions.md)
- 必須有 `description` 欄位（用單引號包裝，不為空）
- 必須有 `applyTo` 欄位指定檔案模式（例如 `'**.js, **.ts'`）
- 檔案名稱應為小寫，單詞之間用連字號分隔

#### 代理程式技能 (skills/*/SKILL.md)
- 每個技能是一個包含 `SKILL.md` 檔案的資料夾
- SKILL.md 必須有 `name` 欄位（小寫，帶連字號，與資料夾名稱匹配，最大 64 個字元）
- SKILL.md 必須有 `description` 欄位（用單引號包裝，10-1024 個字元）
- 資料夾名稱應為小寫，單詞之間用連字號分隔
- 技能可以包含捆綁資產（腳本、模板、資料檔案）
- 捆綁資產應在 SKILL.md 指令中引用
- 資產檔案大小應合理（每個檔案小於 5MB）
- 技能遵循 [代理程式技能規範](https://agentskills.io/specification)

#### Hook 資料夾 (hooks/*/README.md)

- 每個 Hook 都是一個資料夾，該資料夾包含具有 frontmatter 的 `README.md` 檔案
- `README.md` 必須具有 `name` 欄位（人類可閱讀的名稱）
- `README.md` 必須具有 `description` 欄位（用單引號包裹，且不可為空）
- 必須包含一個 `hooks.json` 檔案，內含 Hook 的設定（從此檔案擷取 Hook 事件）
- 資料夾名稱應為小寫，單詞以連字號分隔
- 可包含捆綁資產（腳本、工具、設定檔）
- 捆綁的腳本應在 `README.md` 與 `hooks.json` 中被引用
- 遵循 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- 可選地包含 `tags` 欄位以便分類

#### 插件資料夾 (plugins/*)

- 每個插件資料夾應包含一個 `.github/plugin/plugin.json` 檔案以提供元資料
- `plugin.json` 必須包含 `name` 欄位（與資料夾名稱相符）
- `plugin.json` 必須包含 `description` 欄位（描述插件用途）
- `plugin.json` 必須包含 `version` 欄位（採用語義化版本，例如 "1.0.0"）
- 插件資料夾可以包含任意組合的代理程式、提示、指令、技能與 Hooks
- `marketplace.json` 檔案會在建構期間自動從所有插件產生
- 插件可由 GitHub Copilot CLI 被發現並安裝

### 新增資源

新增代理程式、提示、指令、技能、Hook 或插件時：

**對於代理程式、提示和指令：**
1. 建立具有正確 front matter 的檔案
2. 將檔案新增到適當的目錄
3. 執行 `npm run build` 更新 README.md
4. 驗證資源是否出現在產生的 README 中

**關於 Hooks：**
1. 在 `hooks/` 中建立一個具描述性的資料夾名稱
2. 建立 `README.md`，並加入正確的 front matter（name、description、hooks、tags）
3. 建立 `hooks.json`，其中包含符合 GitHub Copilot hooks 規範的 Hook 設定
4. 將任何捆綁的腳本或資產新增到該資料夾
5. 使腳本可執行：`chmod +x script.sh`
6. 執行 `npm run build` 以更新 README.md
7. 確認該 Hook 是否出現在產生的 README 中

**對於技能：**
1. 執行 `npm run skill:create` 以建立新的技能資料夾
2. 編輯產生的 SKILL.md 檔案，其中包含您的指令
3. 將任何捆綁資產（腳本、模板、資料）新增到技能資料夾
4. 執行 `npm run skill:validate` 以驗證技能結構
5. 執行 `npm run build` 更新 README.md
6. 驗證技能是否出現在產生的 README 中

**對於插件：**
1. 在 `plugins/` 中建立一個具描述性的資料夾名稱（小寫，使用連字號）
2. 建立 `.github/plugin/plugin.json`，包含元資料（name、description、version）
3. 將代理程式、提示、指令、技能或 Hooks 新增到該插件資料夾
4. 執行 `npm run build` 以更新 README.md 與 marketplace.json
5. 驗證該插件是否出現在 `.github/plugin/marketplace.json` 中
6. 測試插件安裝：`copilot plugin install <plugin-name>@awesome-copilot`

### 測試指令

```bash
# 執行所有驗證檢查
npm run collection:validate
npm run skill:validate

# 建構並驗證 README 產生
npm run build

# 修正行尾（提交前必須）
bash scripts/fix-line-endings.sh
```

提交前：
- 確保所有 Markdown front matter 格式正確
- 驗證檔案名稱遵循小寫帶連字號的慣例
- 執行 `npm run build` 以更新 README
- **務必執行 `bash scripts/fix-line-endings.sh`** 以標準化行尾（CRLF → LF）
- 檢查您的新資源是否正確出現在 README 中

## 程式碼樣式指南

### Markdown 檔案
- 使用包含必要欄位的正確 front matter
- 保持描述簡潔且資訊豐富
- 將描述欄位的值用單引號包裝
- 使用小寫檔案名稱，並用連字號作為分隔符

### JavaScript/Node.js 腳本
- 位於 `eng/` 和 `scripts/` 目錄中
- 遵循 Node.js ES 模組慣例（`.mjs` 副檔名）
- 使用清晰、描述性的函式和變數名稱

## Pull Request 指南

建立 pull request 時：

1. **README 更新**：執行 `npm run build` 時，新檔案應自動新增到 README
2. **Front matter 驗證**：確保所有 Markdown 檔案都具有必要的 front matter 欄位
3. **檔案命名**：驗證所有新檔案都遵循小寫帶連字號的命名慣例
4. **建構檢查**：提交前執行 `npm run build` 以驗證 README 產生
5. **行尾**：**務必執行 `bash scripts/fix-line-endings.sh`** 以標準化行尾為 LF（Unix 樣式）
6. **描述**：提供關於您的代理程式/提示/指令的清晰描述
7. **測試**：如果新增集合，執行 `npm run collection:validate` 以確保有效性

### 預提交清單

提交 PR 之前，請確保您已：
- [ ] 執行 `npm install` (或 `npm ci`) 以安裝依賴項
- [ ] 執行 `npm run build` 以產生更新的 README.md
- [ ] 執行 `bash scripts/fix-line-endings.sh` 以標準化行尾
- [ ] 驗證所有新檔案都具有正確的 front matter
- [ ] 測試您的貢獻與 GitHub Copilot 協同工作
- [ ] 檢查檔案名稱是否遵循命名慣例

### 程式碼審查清單

對於提示檔案 (*.prompt.md)：
- [ ] 具有 Markdown front matter
- [ ] 具有 `agent` 欄位（值應為用單引號包裝的 `'agent'`）
- [ ] 具有非空且用單引號包裝的 `description` 欄位
- [ ] 檔案名稱為小寫，單詞之間用連字號分隔
- [ ] 包含 `model` 欄位（強烈建議）

對於指令檔案 (*.instructions.md)：
- [ ] 具有 Markdown front matter
- [ ] 具有非空且用單引號包裝的 `description` 欄位
- [ ] 具有指定檔案模式的 `applyTo` 欄位
- [ ] 檔案名稱為小寫，單詞之間用連字號分隔

對於代理程式檔案 (*.agent.md)：
- [ ] 具有 Markdown front matter
- [ ] 具有非空且用單引號包裝的 `description` 欄位
- [ ] 具有 `name` 欄位，且為可讀的人類名稱（例如："Address Comments"，而非 "address-comments"）
- [ ] 檔案名稱為小寫，單詞之間用連字號分隔
- [ ] 包含 `model` 欄位（強烈建議）
- [ ] 考慮使用 `tools` 欄位

對於技能 (skills/*/)：
- [ ] 資料夾包含 SKILL.md 檔案
- [ ] SKILL.md 具有 Markdown front matter
- [ ] 具有 `name` 欄位，與資料夾名稱匹配（小寫，帶連字號，最大 64 個字元）
- [ ] 具有非空且用單引號包裝的 `description` 欄位（10-1024 個字元）
- [ ] 資料夾名稱為小寫，單詞之間用連字號分隔
- [ ] 任何捆綁資產都在 SKILL.md 中引用
- [ ] 捆綁資產每個檔案小於 5MB

對於 hook 資料夾 (hooks/*/):
- [ ] 資料夾包含帶有 Markdown front matter 的 `README.md` 檔案
- [ ] 具有 `name` 欄位，為可讀的人類名稱
- [ ] 具有非空且用單引號包裹的 `description` 欄位
- [ ] 具有 `hooks.json` 檔案，包含有效的 Hook 設定（從此檔案擷取 Hook 事件）
- [ ] 資料夾名稱為小寫，使用連字號分隔
- [ ] 所有捆綁的腳本為可執行，且在 `README.md` 中被引用
- [ ] 遵循 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- [ ] 可選地包含 `tags` 陣列欄位以便分類

對於插件資料夾 (plugins/*/):
- [ ] 資料夾包含 `.github/plugin/plugin.json` 檔案以提供元資料
- [ ] plugin.json 含有 `name` 欄位，與資料夾名稱相符（小寫並以連字號分隔）
- [ ] plugin.json 含有非空的 `description` 欄位
- [ ] plugin.json 含有 `version` 欄位（語義化版本，例如 "1.0.0"）
- [ ] 資料夾名稱為小寫，使用連字號分隔
- [ ] 插件資源（代理程式、提示等）遵循各自的指南
- [ ] 執行 `npm run build` 以驗證 marketplace.json 已正確更新

## 貢獻

這是一個社群驅動的專案。歡迎貢獻！請參閱：
- [CONTRIBUTING.md](CONTRIBUTING.md) 貢獻指南
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 社群標準
- [SECURITY.md](SECURITY.md) 安全策略

## MCP 伺服器

儲存庫包含一個 MCP (模型上下文協定) 伺服器，它提供用於直接從此儲存庫搜尋和安裝資源的提示。運行伺服器需要 Docker。

## 授權

MIT 授權 - 有關詳細資訊，請參閱 [LICENSE](LICENSE)
