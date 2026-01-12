---
description: '建立高品質 GitHub Copilot Agent Skills 的指南'
applyTo: '**/.github/skills/**/SKILL.md, **/.claude/skills/**/SKILL.md'
---

# Agent Skills 檔案指南

建立有效且可移植的 Agent Skills 之指示，透過專業化能力、工作流和配套資源來增強 GitHub Copilot。

## 什麼是 Agent Skills？

Agent Skills 是包含指示和配套資源的自包含資料夾，用於教導 AI agent 專業化能力。與自訂指示（定義撰寫程式碼標準）不同，Skills 支援特定任務的工作流，其中可以包含指令碼、範例、模板和參考資料。

關鍵特性：
- **可移植**：適用於 VS Code、Copilot CLI 和 Copilot 撰寫程式碼 agent
- **漸進式載入**：僅在與使用者請求相關時載入
- **資源綁定**：可包含指令碼、模板、範例以及指示
- **隨選即用**：根據 Prompt 相關性自動啟用

## 目錄結構

Skills 儲存在特定位置：

| 位置 | 範圍 | 建議 |
|----------|-------|----------------|
| `.github/skills/<skill-name>/` | 專案/儲存庫 | 專案 Skills 的推薦做法 |
| `.claude/skills/<skill-name>/` | 專案/儲存庫 | 舊版，用於向後相容 |
| `~/.github/skills/<skill-name>/` | 個人（全域使用者） | 個人 Skills 的推薦做法 |
| `~/.claude/skills/<skill-name>/` | 個人（全域使用者） | 舊版，用於向後相容 |

每個 Skill **必須** 擁有自己的子目錄，且至少包含一個 `SKILL.md` 檔案。

## 必要的 SKILL.md 格式

### Frontmatter（必要）

```yaml
---
name: webapp-testing
description: 使用 Playwright 測試本地端網頁應用程式的工具包。當被要求驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖、檢查視覺迴歸或檢視瀏覽器主控台記錄時使用。支援 Chrome、Firefox 和 WebKit 瀏覽器。
license: 完整條款請參閱 LICENSE.txt
---
```

| 欄位 | 必要 | 限制 |
|-------|----------|-------------|
| `name` | 是 | 小寫，使用連字號代替空格，最多 64 個字元（例如：`webapp-testing`） |
| `description` | 是 | 能力與使用情境的清晰描述，最多 1024 個字元 |
| `license` | 否 | 參考 LICENSE.txt（例如：`完整條款請參閱 LICENSE.txt`）或 SPDX 識別碼 |

### 描述的最佳實踐

**至關重要**：`description` 欄位是自動偵測 Skill 的主要機制。Copilot 僅閱讀 `name` 和 `description` 來決定是否載入 Skill。如果您的描述模糊不清，該 Skill 將永遠不會被啟用。

**描述中應包含的內容：**
1. Skill 的 **功能**（能力）
2. **何時** 使用它（特定的觸發條件、情境、檔案類型或使用者請求）
3. 使用者可能在 Prompt 中提到的 **關鍵字**

**好的描述：**
```yaml
description: 使用 Playwright 測試本地端網頁應用程式的工具包。當被要求驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖、檢查視覺迴歸或檢視瀏覽器主控台記錄時使用。支援 Chrome、Firefox 和 WebKit 瀏覽器。
```

**差的描述：**
```yaml
description: 網頁測試輔助工具
```

差的描述失敗原因在於：
- 沒有特定的觸發條件（Copilot 何時應載入此內容？）
- 沒有關鍵字（哪些使用者 Prompt 會匹配？）
- 沒有能力描述（它實際上能做什麼？）

### 內容正文

正文包含 Copilot 在 Skill 啟用後載入的詳細指示。建議章節：

| 章節 | 用途 |
|---------|---------|
| `# 標題` | 此 Skill 啟用的功能簡述 |
| `## 何時使用此 Skill` | 情境列表（強化描述中的觸發條件） |
| `## 前提條件` | 必要的工具、相依項目、環境設定 |
| `## 逐步工作流` | 常見任務的編號步驟 |
| `## 疑難排解` | 常見問題與解決方案對照表 |
| `## 參考資料` | 綁定的文件或外部資源連結 |

## 綁定資源

Skills 可以包含 Copilot 隨選存取的額外檔案：

### 支援的資源類型

| 資料夾 | 用途 | 是否載入到 Context？ | 範例檔案 |
|--------|---------|---------------------|---------------|
| `scripts/` | 執行特定操作的可執行自動化程式碼 | 執行時載入 | `helper.py`, `validate.sh`, `build.ts` |
| `references/` | AI agent 閱讀以做出決策的文件 | 是，當被引用時 | `api_reference.md`, `schema.md`, `workflow_guide.md` |
| `assets/` | **按原樣使用的靜態檔案**（不被 AI agent 修改） | 否 | `logo.png`, `brand-template.pptx`, `custom-font.ttf` |
| `templates/` | **AI agent 修改** 並以此為基礎建構的入門程式碼/架構 | 是，當被引用時 | `viewer.html`（插入演算法）, `hello-world/`（延伸） |

### 目錄結構範例

```
.github/skills/my-skill/
├── SKILL.md              # 必要：主要指示
├── LICENSE.txt           # 推薦：授權條款（通常為 Apache 2.0）
├── scripts/              # 選用：可執行自動化
│   ├── helper.py         # Python 指令碼
│   └── helper.ps1        # PowerShell 指令碼
├── references/           # 選用：載入到 Context 的文件
│   ├── api_reference.md
│   ├── workflow-setup.md     # 詳細工作流（>5 步驟）
│   └── workflow-deployment.md
├── assets/               # 選用：在輸出中按原樣使用的靜態檔案
│   ├── baseline.png      # 用於比較的參考圖像
│   └── report-template.html
└── templates/            # 選用：AI agent 修改的入門程式碼
    ├── scaffold.py       # AI agent 定製的程式碼架構
    └── config.template   # AI agent 填寫的配置模板
```

> **LICENSE.txt**：建立 Skill 時，從 https://www.apache.org/licenses/LICENSE-2.0.txt 下載 Apache 2.0 授權文字並儲存為 `LICENSE.txt`。更新附錄章節中的著作權年份和擁有者。

### Assets 與 Templates：關鍵區別

**Assets** 是在輸出中 **未經更改即被使用** 的靜態資源：
- 嵌入到產出文件中的 `logo.png`
- 作為輸出格式複製的 `report-template.html`
- 應用於文字呈現的 `custom-font.ttf`

**Templates** 是 **AI agent 會主動修改** 的入門程式碼/架構：
- AI agent 在其中插入邏輯的 `scaffold.py`
- AI agent 根據使用者需求填寫數值的 `config.template`
- AI agent 使用新功能延伸的 `hello-world/` 專案目錄

**經驗法則**：如果 AI agent 閱讀並以檔案內容為基礎進行建構 → `templates/`。如果檔案在輸出中按原樣使用 → `assets/`。

### 在 SKILL.md 中引用資源

使用相對路徑引用 Skill 目錄內的檔案：

```markdown
## 可用的指令碼

執行 [輔助指令碼](./scripts/helper.py) 以自動化常見任務。

參閱 [API 參考](./references/api_reference.md) 以取得詳細文件。

使用 [架構](./templates/scaffold.py) 作為起點。
```

## 漸進式載入架構

Skills 使用三層載入以提高效率：

| 層級 | 載入內容 | 何時載入 |
|-------|------------|------|
| 1. 偵測 | 僅限 `name` 和 `description` | 始終（輕量級 Metadata） |
| 2. 指示 | 完整 `SKILL.md` 正文 | 當請求與描述匹配時 |
| 3. 資源 | 指令碼、範例、文件 | 僅當 Copilot 引用它們時 |

這意味著：
- 可以在不消耗 Context 的情況下安裝多個 Skills
- 每個任務僅載入相關內容
- 資源直到明確需要時才載入

## 內容指南

### 撰寫風格

- 使用命令語氣：「執行」、「建立」、「設定」（而非「你應該執行」）
- 具體且可操作
- 包含帶有參數的準確指令
- 在有幫助的地方顯示預期輸出
- 保持章節聚焦且易於掃描

### 指令碼要求

包含指令碼時，優先選擇跨平台語言：

| 語言 | 使用情境 |
|----------|----------|
| Python | 複雜自動化、資料處理 |
| pwsh | PowerShell Core 腳本編寫 |
| Node.js | 基於 JavaScript 的工具 |
| Bash/Shell | 簡單的自動化任務 |

最佳實踐：
- 包含幫助/使用文件（`--help` 標記）
- 使用清晰的訊息優雅地處理錯誤
- 避免儲存憑證或秘密
- 儘可能使用相對路徑

### 何時綁定指令碼

在以下情況於 Skill 中包含指令碼：
- 相同的程式碼會被 agent 重複重寫
- 確定性的可靠性至關重要（例如：檔案操作、API 呼叫）
- 複雜邏輯受益於預先測試，而非每次都動態生成
- 操作具有可以獨立演進的自包含目的
- 測試重要性高 —— 指令碼可以進行單元測試和驗證
- 偏好可預測行為而非動態生成

指令碼支援演進：即使是簡單的操作，當它們可能增加複雜性、需要在呼叫之間保持一致行為或需要未來的擴充性時，將其作為指令碼實作也會受益。

### 安全考量

- 指令碼依賴現有的憑證輔助工具（不儲存憑證）
- 僅在破壞性操作中使用 `--force` 標記
- 在不可逆的操作前警告使用者
- 記錄任何網路操作或外部呼叫

## 常見模式

### 參數表模式

清晰地記錄參數：

```markdown
| 參數 | 必要 | 預設值 | 描述 |
|-----------|----------|---------|-------------|
| `--input` | 是 | - | 要處理的輸入檔案或 URL |
| `--action` | 是 | - | 要執行的操作 |
| `--verbose` | 否 | `false` | 啟用詳細輸出 |
```

## 驗證清單

在發佈 Skill 之前：

- [ ] `SKILL.md` 具有包含 `name` 和 `description` 的有效 Frontmatter
- [ ] `name` 為帶有連字號的小寫字母，且 ≤64 個字元
- [ ] `description` 清晰說明 **功能**、**何時** 使用，以及相關的 **關鍵字**
- [ ] 正文包含何時使用、前提條件和逐步工作流
- [ ] SKILL.md 正文保持在 500 行以下（將大型內容拆分到 `references/` 資料夾）
- [ ] 將大型工作流（>5 步驟）拆分到 `references/` 資料夾，並從 SKILL.md 提供清晰連結
- [ ] 指令碼包含說明文件和錯誤處理
- [ ] 所有資源引用均使用相對路徑
- [ ] 無硬編碼的憑證或秘密

## 工作流執行模式

執行多步驟工作流時，建立一個 TODO 列表，其中每個步驟都引用相關文件：

```markdown
## TODO
- [ ] 步驟 1：設定環境 - 參閱 [workflow-setup.md](./references/workflow-setup.md#environment)
- [ ] 步驟 2：建構專案 - 參閱 [workflow-setup.md](./references/workflow-setup.md#build)
- [ ] 步驟 3：部署到預發佈環境 - 參閱 [workflow-deployment.md](./references/workflow-deployment.md#staging)
- [ ] 步驟 4：執行驗證 - 參閱 [workflow-deployment.md](./references/workflow-deployment.md#validation)
- [ ] 步驟 5：部署到生產環境 - 參閱 [workflow-deployment.md](./references/workflow-deployment.md#production)
```

這確保了可追蹤性，並允許在工作中斷時恢復工作流。

## 相關資源

- [Agent Skills 規範](https://agentskills.io/)
- [VS Code Agent Skills 文件](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [參考 Skills 儲存庫](https://github.com/anthropics/skills)
- [Awesome Copilot Skills](https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md)
