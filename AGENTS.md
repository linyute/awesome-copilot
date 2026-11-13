# AGENTS.md

## 專案概覽

Awesome GitHub Copilot 儲存庫是一個由社群驅動的集合，包含用於提升 GitHub Copilot 在各領域、各語言與各使用情境下體驗的自訂代理（agents）與指示（instructions）。本專案包含：

- **Agents** - 與 MCP 伺服器整合的專業化 GitHub Copilot 代理
- **Instructions** - 套用至特定檔案模式的編碼標準與最佳實務
- **Skills** - 包含指示與捆綁資源的自包含資料夾，用於專業化任務
- **Hooks** - 由開發期間特定事件觸發的自動化工作流
- **Workflows** - 用於 GitHub Actions 中 AI 驅動儲存庫自動化的 [Agentic Workflows](https://github.github.com/gh-aw)
- **Plugins** - 以特定主題為中心，將相關代理、hooks 與 skills 分組的可安裝套件

## 儲存庫結構

```
.
├── agents/           # 自訂 GitHub Copilot 代理定義（.agent.md 檔案）
├── instructions/     # 編碼標準與指引（.instructions.md 檔案）
├── skills/           # Agent Skills 資料夾（各含 SKILL.md 與選用的捆綁資產）
├── hooks/            # 自動化工作流 hooks（含 README.md + hooks.json 的資料夾）
├── workflows/        # Agentic Workflows（用於 GitHub Actions 自動化的 .md 檔案）
├── plugins/          # 可安裝的 plugin 套件（含 plugin.json 的資料夾）
├── extensions/       # 可重複使用的 canvas 延伸來源（extension.mjs 與資產）
├── docs/             # 不同資源類型的文件
└── .github/scripts/  # 依用途分類的建置、驗證與儲存庫自動化指令碼
```

## 設定指令

```bash
# 安裝相依套件
npm ci

# 建構專案（產生類別 README 與 marketplace.json）
npm run build

# 驗證 plugin 資訊清單
npm run plugin:validate

# 僅產生 marketplace.json
npm run plugin:generate-marketplace

# 建立新的 plugin
npm run plugin:create -- --name <plugin-name>

# 驗證 agent skills
npm run skill:validate

# 建立新的 skill
npm run skill:create -- --name <skill-name>
```

## 開發工作流

### 處理 Agents、Instructions、Skills 與 Hooks

所有代理檔案（`*.agent.md`）與指示檔案（`*.instructions.md`）都必須包含正確的 markdown front matter。Agent Skills 是包含 `SKILL.md` 檔案（含 frontmatter 與選用的捆綁資產）的資料夾。Hooks 是包含 `README.md`（含 frontmatter）與 `hooks.json` 設定檔的資料夾：

Frontmatter 必須是有效的 YAML，並符合下列中繼資料要求。任何有效的 YAML 標量樣式皆可接受；不強制要求使用單引號。

#### Agent 檔案（\*.agent.md）

- 必須有 `description` 欄位
- 檔名應為小寫，字詞以連字號分隔
- 建議包含 `tools` 欄位
- 強烈建議指定 `model` 欄位

#### Instruction 檔案（\*.instructions.md）

- 必須有 `description` 欄位（不可為空）
- 必須有 `applyTo` 欄位，指定檔案模式（例如 `'**.js, **.ts'`）
- 檔名應為小寫，字詞以連字號分隔

#### Agent Skills（skills/\*/SKILL.md）

- 每個 skill 是包含 `SKILL.md` 檔案的資料夾
- SKILL.md 必須有 `name` 欄位（小寫並以連字號分隔，與資料夾名稱相符，最多 64 個字元）
- SKILL.md 必須有 `description` 欄位（10 至 1024 個字元）
- 資料夾名稱應為小寫，字詞以連字號分隔
- Skills 可包含捆綁資產（腳本、範本、資料檔）
- 捆綁資產應在 SKILL.md 指示中引用
- 資產檔案大小應合理（每個檔案小於 5MB）
- Skills 遵循 [Agent Skills 規格](https://agentskills.io/specification)

#### Canvas 延伸（extensions/\*）

- 每個延伸資料夾必須包含 `extension.mjs`
- 延伸是可重複使用的來源元件，非獨立 plugin
- 可交付的延伸 plugin 由相符的 `plugins/<extension-id>/plugin.json` 註冊
- Plugin 可透過在 `extensions.com.github.awesome-copilot.extensions` 中列出 `./extensions/<name>` 路徑來捆綁其他可重複使用的延伸
- 每個延伸必須有 `assets/preview.png` 作為主要視覺資產
- 延伸的中繼資料取自 `plugins/` 中相符的 plugin 資訊清單

#### Hook 資料夾（hooks/\*/README.md）

- 每個 hook 是包含 `README.md` 檔案（含 frontmatter）的資料夾
- README.md 必須有 `name` 欄位（人類可讀的名稱）
- README.md 必須有 `description` 欄位（不可為空）
- 必須包含 `hooks.json` 檔案，內含 hook 設定（hook 事件從此檔案擷取）
- 資料夾名稱應為小寫，字詞以連字號分隔
- 可包含捆綁資產（腳本、工具、設定檔）
- 捆綁腳本應在 README.md 與 hooks.json 中引用
- 遵循 [GitHub Copilot hooks 規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- 選配包含 `tags` 欄位用於分類

#### Workflow 檔案（workflows/\*.md）

- 每個 workflow 是 `workflows/` 目錄中的獨立 `.md` 檔案
- 必須有 `name` 欄位（人類可讀的名稱）
- 必須有 `description` 欄位（不可為空）
- 包含 agentic workflow frontmatter（`on`、`permissions`、`safe-outputs`）與自然語言指示
- 檔名應為小寫，字詞以連字號分隔
- 僅接受 `.md` 檔案 — `.yml`、`.yaml` 與 `.lock.yml` 檔案會被 CI 封鎖
- 遵循 [GitHub Agentic Workflows 規格](https://github.github.com/gh-aw/reference/workflow-structure/)

#### Plugin 資料夾（plugins/\*）

- 每個 plugin 是包含根 `plugin.json` 檔案（含中繼資料）的資料夾
- plugin.json **必須**有 `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`（Agent Plugins v1.0.0）
- plugin.json 必須有 `name` 欄位（與資料夾名稱相符）
- plugin.json 必須有 `description` 欄位（描述 plugin 的用途）
- plugin.json 必須有 `version` 欄位（語意化版本，例如 "1.0.0"）
- Plugin 內容以宣告式方式定義在 plugin.json 的 `extensions.com.github.awesome-copilot` 之下，使用僅來源的組合欄位（`agents`、`hooks`、`skills` 與 `extensions`）。來源檔案位於頂層目錄，並由 CI 實體化到 plugins 中。此命名空間會從提供的資訊清單中移除 — skills 使用標準的 `skills/` 目錄，Copilot 專屬內容使用 `com.github.copilot/`。
- MCP 伺服器**不是**組合欄位。依據 Agent Plugins 規格，它們在 plugin 根目錄的 `mcp.json` 檔案中宣告，該檔案與 `plugin.json` 一起提交並原樣交付。不要將 `mcpServers` 加入 `plugin.json`，也不要使用舊版的 `.mcp.json` 檔名。
- `marketplace.json` 檔案會在建構期間從所有 plugins 自動產生
- Plugins 可透過 GitHub Copilot CLI 發現與安裝

### 新增資源

新增新的 agent、instruction、skill、hook、workflow 或 plugin 時：

**Agents 與 Instructions：**

1. 建立檔案並附上正確的 front matter
2. 將檔案加入適當的目錄
3. 執行 `npm run build` 來更新 `docs/README.agents.md` 或 `docs/README.instructions.md`
4. 確認資源出現在產生的 README 中

**Hooks：**

1. 在 `hooks/` 中建立具描述性的新資料夾
2. 建立 `README.md` 並附上正確的 frontmatter（name、description、hooks、tags）
3. 建立 `hooks.json`，內含遵循 GitHub Copilot hooks 規格的 hook 設定
4. 將任何捆綁腳本或資產加入資料夾
5. 讓腳本可執行：`chmod +x script.sh`
6. 執行 `npm run build` 來更新 `docs/README.hooks.md`
7. 確認 hook 出現在產生的 README 中

**Workflows：**

1. 在 `workflows/` 中建立具描述性名稱的新 `.md` 檔案（例如 `daily-issues-report.md`）
2. 包含 `name` 與 `description` 的 frontmatter，加上 agentic workflow 欄位（`on`、`permissions`、`safe-outputs`）
3. 使用 `gh aw compile --validate` 編譯以驗證其有效性
4. 執行 `npm run build` 來更新 `docs/README.workflows.md`
5. 確認 workflow 出現在產生的 README 中

**Skills：**

1. 執行 `npm run skill:create` 來產生新的 skill 資料夾骨架
2. 編輯產生的 SKILL.md 檔案並填入你的指示
3. 將任何捆綁資產（腳本、範本、資料）加入 skill 資料夾
4. 執行 `npm run skill:validate` 來驗證 skill 結構
5. 執行 `npm run build` 來更新 `docs/README.skills.md`
6. 確認 skill 出現在產生的 README 中

**Plugins：**

1. 執行 `npm run plugin:create -- --name <plugin-name>` 來產生新的 plugin 骨架
2. 在 `plugin.json` 的 `extensions.com.github.awesome-copilot` 之下定義 agents、hooks、skills 與可重複使用的延伸
3. 編輯產生的 `plugin.json` 並填入你的中繼資料
4. 執行 `npm run plugin:validate` 來驗證 plugin 結構
5. 執行 `npm run build` 來更新 `docs/README.plugins.md` 與 marketplace.json
6. 確認 plugin 出現在 `.github/plugin/marketplace.json` 中

**Canvas 延伸：**

1. 在 `extensions/<extension-id>/` 中建立/更新延伸，並附上 `extension.mjs`
2. 在 `plugins/<extension-id>/plugin.json` 下加入相符的 plugin 資訊清單：
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
3. 確認 `assets/preview.png` 存在，作為主要視覺資產
4. 執行 `npm run plugin:validate` 來驗證 plugin 與延伸的中繼資料
5. 執行 `npm run build` 來重新產生類別 README 與 marketplace 輸出

若要將延伸捆綁到另一個 plugin 而不製作第二份來源副本，請將排序後的 `./extensions/<name>` 路徑加入 `plugins/<plugin-id>/plugin.json` 的 `extensions.com.github.awesome-copilot.extensions` 之下。

**外部 Plugins：**

1. 不要開啟直接編輯 `plugins/external.json` 的 PR 來提交公開的第三方 plugin
2. 公開的外部 plugin 提交使用 [CONTRIBUTING.md](CONTRIBUTING.md#adding-external-plugins) 中記載的外部 plugin issue 工作流
3. 在 v1 中，公開提交僅接受 GitHub 託管的 plugins，使用公開儲存庫加上不可變的 `ref`、`sha` 或兩者
4. `.github/scripts/external-plugins/external-plugin-validation.mjs` 中的共用驗證器是外部 plugin 資料規則的正式來源；重複使用它，而不是在腳本或工作流中重複檢查
5. 提交 issue 會經過 `external-plugin` + `awaiting-review`，然後根據自動化品質閘門移至 `ready-for-review` 或 `requires-submitter-fixes`
6. 在提交 issue 開啟期間，issue 作者或維護者可留言 `/rerun-intake` 來重新執行自動化的接收與品質閘門。被維護者拒絕的 issue 是終止狀態；處理拒絕回饋的貢獻者必須開啟新的提交 issue
7. 維護者可透過 `/mark-ready-for-review [optional reason]` 明確覆寫品質閘門阻擋，將 issue 移至 `ready-for-review`
8. 當 issue 進入 `ready-for-review` 後，維護者以 `/approve` 或 `/reject <reason>` issue 留言做出決定；核准的 issue 會被关闭，並作為六個月重新審查的錨點
9. 核准自動化會針對 `main` 建立或更新 PR、更新 `plugins/external.json`，並重新產生 marketplace 輸出
10. 夜間重新審查自動化會尋找已關閉且至少六個月前的 `external-plugin` + `approved` issues，套用 `re-review-due`，並為維護者開啟或更新追蹤 issue
11. 維護者在原始核准的提交 issue 上以 `/re-review-keep`、`/re-review-needs-changes` 或 `/re-review-remove` 完成重新審查；keep 會重設 issue 的 `closed_at`，remove 會針對 `main` 開啟 PR

### 測試指示

```bash
# 執行所有驗證檢查
npm run plugin:validate
npm run skill:validate

# 建構並驗證 README 產生
npm run build

# 修正換行字元（提交前必要）
bash .github/scripts/maintenance/fix-line-endings.sh
```

提交前：

- 確認所有 markdown front matter 格式正確
- 確認檔名遵循小寫加連字號的慣例
- 執行 `npm run build` 來更新 README
- **務必執行 `bash .github/scripts/maintenance/fix-line-endings.sh`** 來正規化換行字元（CRLF → LF）
- 檢查你的新資源是否正確出現在 `docs/README.<type>.md` 中

## 程式碼風格指引

### Markdown 檔案

- 使用含必要欄位的正確 front matter
- 保持描述簡潔且資訊充足
- 使用有效的 YAML 標量樣式作為 frontmatter 值
- 使用小寫檔名，以連字號作為分隔符

### JavaScript/Node.js 腳本

- 位於 `.github/scripts/` 目錄
- 遵循 Node.js ES module 慣例（`.mjs` 副檔名）
- 使用清晰、具描述性的函式與變數名稱

## Pull Request 指引

建立 pull request 時：

> **重要：** 所有 pull request 都應指向 **`main`** 分支，而非 `staged`。

1. **README 更新**：執行 `npm run build` 時，新檔案會自動加入 `docs/README.<type>.md`
2. **Front matter 驗證**：確認所有 markdown 檔案都有必要的 front matter 欄位
3. **檔案命名**：確認所有新檔案遵循小寫加連字號的命名慣例
4. **建構檢查**：提交前執行 `npm run build` 以驗證 README 產生
5. **換行字元**：**務必執行 `bash .github/scripts/maintenance/fix-line-endings.sh`** 來將換行字元正規化為 LF（Unix 風格）
6. **描述**：提供清晰的描述，說明你的 agent/instruction 的作用
7. **測試**：若新增 plugin，執行 `npm run plugin:validate` 以確保有效性

### 提交前檢查清單

提交 PR 前，確認你已：

- [ ] 執行 `npm install`（或 `npm ci`）來安裝相依套件
- [ ] 執行 `npm run build` 來產生更新後的 `docs/README.<type>.md`
- [ ] 執行 `bash .github/scripts/maintenance/fix-line-endings.sh` 來正規化換行字元
- [ ] 確認所有新檔案都有正確的 front matter
- [ ] 測試你的貢獻可與 GitHub Copilot 正常運作
- [ ] 確認檔名遵循命名慣例

### 程式碼審查檢查清單

針對 instruction 檔案（\*.instructions.md）：

- [ ] 有 markdown front matter
- [ ] 有非空的 `description` 欄位
- [ ] 有含檔案模式的 `applyTo` 欄位
- [ ] 檔名為小寫並以連字號分隔

針對 agent 檔案（\*.agent.md）：

- [ ] 有 markdown front matter
- [ ] 有非空的 `description` 欄位
- [ ] 有人類可讀名稱的 `name` 欄位（例如 "Address Comments" 而非 "address-comments"）
- [ ] 檔名為小寫並以連字號分隔
- [ ] 包含 `model` 欄位（強烈建議）
- [ ] 考慮使用 `tools` 欄位

針對 skills（skills/\*/）：

- [ ] 資料夾包含 SKILL.md 檔案
- [ ] SKILL.md 有 markdown front matter
- [ ] 有與資料夾名稱相符的 `name` 欄位（小寫並以連字號分隔，最多 64 個字元）
- [ ] 有非空的 `description` 欄位（10 至 1024 個字元）
- [ ] 資料夾名稱為小寫並以連字號分隔
- [ ] 任何捆綁資產都在 SKILL.md 中引用
- [ ] 捆綁資產每個檔案小於 5MB

針對 hook 資料夾（hooks/\*/）：

- [ ] 資料夾包含有 markdown front matter 的 README.md 檔案
- [ ] 有人類可讀名稱的 `name` 欄位
- [ ] 有非空的 `description` 欄位
- [ ] 有含有效 hook 設定的 `hooks.json` 檔案（hook 事件從此檔案擷取）
- [ ] 資料夾名稱為小寫並以連字號分隔
- [ ] 任何捆綁腳本都可執行且在 README.md 中引用
- [ ] 遵循 [GitHub Copilot hooks 規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- [ ] 選配包含 `tags` 陣列欄位用於分類

針對 workflow 檔案（workflows/\*.md）：

- [ ] 檔案有 markdown front matter
- [ ] 有人類可讀名稱的 `name` 欄位
- [ ] 有非空的 `description` 欄位
- [ ] 檔名為小寫並以連字號分隔
- [ ] frontmatter 包含 `on` 與 `permissions`
- [ ] Workflow 使用最小權限的 permissions 與安全的 outputs
- [ ] 未包含 `.yml`、`.yaml` 或 `.lock.yml` 檔案
- [ ] 遵循 [GitHub Agentic Workflows 規格](https://github.github.com/gh-aw/reference/workflow-structure/)

針對 plugins（plugins/\*/）：

- [ ] 目錄包含根 `plugin.json` 檔案
- [ ] 目錄包含 `README.md` 檔案
- [ ] `plugin.json` 有 `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`
- [ ] `plugin.json` 有與目錄名稱相符的 `name` 欄位（小寫並以連字號分隔）
- [ ] `plugin.json` 有非空的 `description` 欄位
- [ ] `plugin.json` 有 `version` 欄位（語意化版本，例如 "1.0.0"）
- [ ] 目錄名稱為小寫並以連字號分隔
- [ ] 若存在 `keywords`，它是小寫連字號字串的陣列
- [ ] 若 `extensions.com.github.awesome-copilot` 之下存在組合陣列，每個項目都是有效的相對路徑
- [ ] 若 plugin 交付 MCP 伺服器，它們在 plugin 根目錄的 `mcp.json` 中宣告（含 `mcp.schema.json` 的 `$schema`），而非在 `plugin.json` 或 `.mcp.json` 中
- [ ] Plugin 未引用不存在的檔案
- [ ] 執行 `npm run plugin:validate` 與 `npm run build` 以驗證 plugin 通過所有檢查

## 貢獻

這是一個由社群驅動的專案。歡迎貢獻！請參閱：

- [CONTRIBUTING.md](CONTRIBUTING.md) 貢獻指引
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 社群標準
- [SECURITY.md](SECURITY.md) 安全性政策

## MCP 伺服器

本儲存庫包含一個 MCP（Model Context Protocol）伺服器，可從本儲存庫直接搜尋與安裝資源。執行伺服器需要 Docker。

## 授權

MIT License - 詳細資訊請參閱 [LICENSE](LICENSE)
