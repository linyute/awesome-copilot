# AGENTS.md

## 專案概覽

Awesome GitHub Copilot 存放庫是一個由社群驅動的自訂代理、提示與指引集合，旨在加強各領域、語言與使用情境下的 GitHub Copilot 體驗。專案包含：

- **Agents（代理）** - 整合至 MCP 伺服器的專門 GitHub Copilot 代理
- **Prompts（提示）** - 用於程式碼產生與問題解決的任務專用提示
- **Instructions（指引）** - 適用於特定檔案模式的程式碼標準與最佳實務
- **Collections（集合）** - 圍繞特定主題與工作流程精心策劃的資源集合

## 存放庫結構

```
.
├── agents/           # 自訂 GitHub Copilot 代理定義（.agent.md 檔案）
├── prompts/          # 任務專用提示（.prompt.md 檔案）
├── instructions/     # 程式碼標準與指引（.instructions.md 檔案）
├── collections/      # 精選資源集合（.md 檔案）
├── docs/             # 各類資源的文件
├── eng/              # 建置與自動化腳本
└── scripts/          # 工具腳本
```

## 設定指令

```bash
# 安裝相依套件
npm ci

# 建構專案（會產生 README.md）
npm run build

# 驗證集合描述檔
npm run collection:validate

# 建立新的集合
npm run collection:create -- --id <collection-id> --tags <tags>
```

## 開發工作流程

### 使用代理、提示與指引

所有代理檔（`*.agent.md`）、提示檔（`*.prompt.md`）與指引檔（`*.instructions.md`）都必須包含正確的 markdown front matter：

#### 代理檔（*.agent.md）
- 必須有 `description` 欄位（以單引號包覆）
- 檔名應使用小寫並以連字號分隔
- 建議包含 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### 提示檔（*.prompt.md）
- 必須有 `agent` 欄位（值應為 `'agent'`，以單引號包覆）
- 必須有 `description` 欄位（以單引號包覆，且不可為空）
- 檔名應使用小寫並以連字號分隔
- 如適用，建議指定 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### 指引檔（*.instructions.md）
- 必須有 `description` 欄位（以單引號包覆，且不可為空）
- 必須有 `applyTo` 欄位以指定檔案模式（例如：`'**.js, **.ts'`）
- 檔名應使用小寫並以連字號分隔

### 新增資源時

新增代理、提示或指引檔時：

1. 建立檔案並包含正確的 front matter
2. 將檔案加入對應目錄
3. 透過執行：`npm run build` 更新 README.md
4. 驗證該資源是否出現在產生的 README 中

### 測試指令

```bash
# 執行所有驗證檢查
npm run collection:validate

# 建構並驗證 README 產生
npm run build

# 修正行尾（提交前必須執行）
bash scripts/fix-line-endings.sh
```

提交前：
- 確認所有 markdown front matter 格式正確
- 驗證檔名遵循小寫與連字號規範
- 執行 `npm run build` 更新 README
- **務必執行 `bash scripts/fix-line-endings.sh`** 以將行尾統一為 LF（CRLF → LF）
- 檢查你的新資源是否正確出現在 README 中

## 程式碼風格指南

### Markdown 檔案
- 使用正確的 front matter 並包含必要欄位
- 保持描述簡潔且具資訊性
- 將 description 欄位值以單引號包覆
- 檔名使用小寫並以連字號作為分隔

### JavaScript/Node.js 腳本
- 位於 `eng/` 與 `scripts/` 目錄下
- 遵循 Node.js ES 模組慣例（使用 `.mjs` 副檔名）
- 使用清晰、具描述性的函式與變數名稱

## Pull Request 指南

在建立 Pull Request 時：

1. **README 更新**：新增檔案應在執行 `npm run build` 後自動新增至 README
2. **Front matter 驗證**：確保所有 markdown 檔案包含必要的 front matter 欄位
3. **檔名規範**：確認所有新增檔案符合小寫與連字號命名規則
4. **建置檢查**：在提交前執行 `npm run build` 以驗證 README 產生
5. **行尾**：**務必執行 `bash scripts/fix-line-endings.sh`** 以統一行尾為 LF（Unix 風格）
6. **描述**：清楚說明你的代理/提示/指引的用途
7. **測試**：若新增集合，執行 `npm run collection:validate` 確保有效性

### 提交前檢查清單

在提交 PR 前，請確認你已：
- [ ] 執行 `npm install`（或 `npm ci`）安裝相依套件
- [ ] 執行 `npm run build` 產生更新後的 README.md
- [ ] 執行 `bash scripts/fix-line-endings.sh` 統一行尾
- [ ] 驗證所有新增檔案具有正確的 front matter
- [ ] 測試你的貢獻是否能與 GitHub Copilot 一同運作
- [ ] 確認檔名遵循命名規範

### 程式碼審查檢查表

對於提示檔（*.prompt.md）：
- [ ] 含有 markdown front matter
- [ ] 含有 `agent` 欄位（值應為 `'agent'`，以單引號包覆）
- [ ] 含有非空的 `description` 欄位，並以單引號包覆
- [ ] 檔名為小寫並以連字號分隔
- [ ] 包含 `model` 欄位（強烈建議）

對於指引檔（*.instructions.md）：
- [ ] 含有 markdown front matter
- [ ] 含有非空的 `description` 欄位，並以單引號包覆
- [ ] 含有 `applyTo` 欄位並指定檔案模式
- [ ] 檔名為小寫並以連字號分隔

對於代理檔（*.agent.md）：
- [ ] 含有 markdown front matter
- [ ] 含有非空的 `description` 欄位，並以單引號包覆
- [ ] 檔名為小寫並以連字號分隔
- [ ] 包含 `model` 欄位（強烈建議）
- [ ] 考慮使用 `tools` 欄位

## 貢獻

這是一個由社群驅動的專案，歡迎貢獻！請參閱：
- [CONTRIBUTING.md](CONTRIBUTING.md) 以獲得貢獻指南
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 以了解社群規範
- [SECURITY.md](SECURITY.md) 以了解資安政策

## MCP 伺服器

此存放庫包含一個 MCP（Model Context Protocol）伺服器，可提供從本存放庫直接搜尋與安裝資源的提示。執行該伺服器需要 Docker。

## 授權

MIT 授權 - 詳情請見 [LICENSE](LICENSE)
