---
description: 'GitHub Copilot Agent Skill 建立高品質指南'
applyTo: '**/skills/**/SKILL.md'
---

# 代理技能 (Agent Skills) 檔案準則

建立有效且具備移植性的代理技能指南，增強 GitHub Copilot 的專業能力、工作流程與配套資源。

## 什麼是代理技能？

代理技能是包含指令與配套資源的獨立資料夾，能賦予 AI 代理專屬能力。與定義編碼標準的自訂指令不同，技能可啟用特定任務的工作流程，包括指令碼、範例、範本與參考資料。

關鍵特性：
- **可移植**：適用於 VS Code、Copilot CLI 與 Copilot 編碼代理
- **漸進式載入**：僅在與使用者要求相關時載入
- **資源綁定**：可將指令碼、範本、範例與指令打包在一起
- **按需啟用**：根據提示 (prompt) 的相關性自動啟用

## 目錄結構

技能儲存於特定位置：

| 位置 | 範圍 | 建議 |
|----------|-------|----------------|
| `.github/skills/<skill-name>/` | 專案/儲存庫 | 建議用於專案技能 |
| `.claude/skills/<skill-name>/` | 專案/儲存庫 | 舊版，用於向後相容 |
| `~/.github/skills/<skill-name>/` | 個人 (全域) | 建議用於個人技能 |
| `~/.claude/skills/<skill-name>/` | 個人 (全域) | 舊版，用於向後相容 |

每個技能**必須**擁有自己的子目錄，並至少包含一個 `SKILL.md` 檔案。

## 必要的 SKILL.md 格式

### 前言 (Frontmatter，必填)

```yaml
---
name: webapp-testing
description: '使用 Playwright 測試本機應用程式的工具組。當使用者要求驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖、檢查視覺回歸或檢視瀏覽器主控台紀錄時使用。支援 Chrome、Firefox 與 WebKit 瀏覽器。'
license: 完整條款請見 LICENSE.txt
---
```

| 欄位 | 必填 | 約束 |
|-------|----------|-------------|
| `name` | 是 | 小寫，空格以連字號取代，最多 64 字元 (例如：`webapp-testing`) |
| `description` | 是 | 10–1024 字元，清楚說明功能與使用情境，需以單引號括起 |
| `license` | 否 | 參考 LICENSE.txt (例如：`完整條款請見 LICENSE.txt`) 或 SPDX 識別碼 |

### 描述的最佳實務

**關鍵**：`description` 欄位是自動技能探索的主要機制。Copilot 僅讀取 `name` 與 `description` 來決定是否載入技能。若描述模糊，技能將永遠無法啟用。

**描述中應包含：**
1. 技能的 **做什麼** (功能)
2. **何時使用** (觸發條件、情境、檔案類型或使用者要求)
3. 使用者提示中可能出現的 **關鍵字**

**好的描述：**
```yaml
description: '使用 Playwright 測試本機應用程式的工具組。當使用者要求驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖、檢查視覺回歸或檢視瀏覽器主控台紀錄時使用。支援 Chrome、Firefox 與 WebKit 瀏覽器。'
```

**差的描述：**
```yaml
description: '網頁測試協助工具'
```

差的描述失敗原因：
- 沒有特定觸發條件 (Copilot 何時該載入？)
- 沒有關鍵字 (哪些使用者提示會符合？)
- 沒有功能說明 (它實際能做什麼？)

### 本體內容

本體包含 Copilot 在技能啟用後載入的詳細指令。建議區段：

| 區段 | 目的 |
|---------|---------|
| `# 標題` | 技能功能的簡短概述 |
| `## 何時使用此技能` | 情境清單 (強化描述中的觸發條件) |
| `## 先決條件` | 必要工具、相依性、環境設定 (若適用) |
| `## 逐步工作流程` | 可重複程序的編號步驟 (建構、部署、設定) |
| `## 注意事項 (Gotchas)` | 關於非明顯行為的主動警告 ("因為 Y，所以絕不要做 X") |
| `## 疑難排解` | 已知問題的被動修正 ("若看到 X，請嘗試 Y") |
| `## 參考資料` | 連結至綁定的文件或外部資源 |

並非每個技能都需要所有區段。若無外部相依性，可跳過 `## 先決條件`。若技能純屬建議性質，可跳過 `## 逐步工作流程`。若技能涉及外部工具、API 或平台特定行為，請務必包含 `## 注意事項`。

關於內容品質原則，請參閱下方的 [撰寫高影響力技能](#writing-high-impact-skills)。

### 撰寫各區段

**`# 標題`** — 一句話說明此技能賦予的能力。避免泛泛之詞，需具體說明領域。

**`## 何時使用此技能`** — 具體情境的條列清單，強化描述中的觸發條件。這有助於 Copilot 確認載入正確的技能。

```markdown
## 何時使用此技能

- 使用者要求在瀏覽器中測試網頁應用程式
- 使用者需要擷取螢幕截圖進行視覺回歸測試
- 使用者想要使用瀏覽器主控台紀錄偵錯前端行為
```

**`## 先決條件`** — 僅在技能需要 Copilot 無法預設為可用的工具、服務或設定時包含。列出精確的安裝指令。

```markdown
## 先決條件

- 安裝 [Playwright](https://playwright.dev/)：`npm install -D @playwright/test`
- 安裝至少一個瀏覽器引擎：`npx playwright install chromium`
```

**`## 逐步工作流程`** — 需要重複執行的程序編號步驟。描述每個階段要 **達成什麼目標**，而非硬編碼的檔案路徑或行號 — 步驟應能適應不同的專案結構。對於複雜的工作流程 (>5 步驟)，建議拆分為 `references/` 檔案並連結。

```markdown
## 逐步工作流程

### 部署至預備環境 (Staging)

1. 建構專案：`npm run build`
2. 執行部署前驗證：`npm run validate`
3. 部署至預備環境：`npm run deploy -- --env staging`
4. 驗證健康狀態端點回傳 200
```

**`## 注意事項 (Gotchas)`** — 防止錯誤的主動警告。記錄非明顯的預設值、API 特性、版本特定行為與常見陷阱。**粗體**標示關鍵約束，並說明原因。

```markdown
## 注意事項

- **絕不要**在未先檢查 `user.hasPaymentMethod` 的情況下呼叫 `billing.charge()` —
  該 SDK 會拋出無法復原的錯誤，而非回傳失敗。
- `currency` 欄位預期 ISO 4217 代碼，而非顯示名稱。
  Copilot 常會寫成 "dollars" 而非 "USD"。
```

**`## 疑難排解`** — 已知問題的被動修正，以「症狀 → 解決方案」表格呈現。每一列應為獨立且可執行的。

```markdown
## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 外掛程式無法連線 | 檢查伺服器是否執行中 (`npm run start:all`) |
| 瀏覽器封鎖 localhost | 允許本機網路存取，或嘗試其他瀏覽器 |
| 工具執行逾時 | 確保外掛程式 UI 已開啟並顯示 "Connected" |
```

**`## 參考資料`** — 連結至 `references/` 中的綁定文件、外部文件或相關技能。資源參考請使用相對路徑。

## 綁定資源

技能可包含 Copilot 隨需存取的額外檔案：

### 支援的資源類型

| 資料夾 | 目的 | 是否載入至 Context？ | 範例檔案 |
|--------|---------|---------------------|---------------|
| `scripts/` | 執行特定操作的可執行自動化工具 | 執行時 | `helper.py`, `validate.sh`, `build.ts` |
| `references/` | AI 代理讀取以輔助決策的文件 | 是 (參考時) | `api_reference.md`, `schema.md`, `workflow_guide.md` |
| `assets/` | 輸出中 **原樣使用** 的靜態檔案 (不被 AI 代理修改) | 否 | `logo.png`, `brand-template.pptx`, `custom-font.ttf` |
| `templates/` | **AI 代理 MODIFIES 並擴充** 的啟動程式碼/鷹架 | 是 (參考時) | `viewer.html` (插入演算法), `hello-world/` (擴充) |

### 目錄結構範例

```
.github/skills/my-skill/
├── SKILL.md              # 必填：主要指令
├── LICENSE.txt           # 建議：授權條款 (通常為 Apache 2.0)
├── scripts/              # 選填：可執行自動化
│   ├── helper.py         # Python 指令碼
│   └── helper.ps1        # PowerShell 指令碼
├── references/           # 選填：載入至 Context 的文件
│   ├── api_reference.md
│   ├── workflow-setup.md     # 詳細工作流程 (>5 步驟)
│   └── workflow-deployment.md
├── assets/               # 選填：輸出中原樣使用的靜態檔案
│   ├── baseline.png      # 比較用的基準圖像
│   └── report-template.html
└── templates/            # 選填：AI 代理修改的啟動程式碼
    ├── scaffold.py       # AI 代理自訂的程式碼鷹架
    └── config.template   # AI 代理填入值的設定範本
```

> **LICENSE.txt**：建立技能時，從 https://www.apache.org/licenses/LICENSE-2.0.txt 下載 Apache 2.0 授權文字並存為 `LICENSE.txt`。更新附錄區段的著作權年份與持有者。

### 資產 (Assets) 與範本 (Templates) 的關鍵區別

**資產** 是輸出中 **原樣使用** 的靜態資源：
- 嵌入生成文件的 `logo.png`
- 複製為輸出格式的 `report-template.html`
- 套用於文字渲染的 `custom-font.ttf`

**範本** 是 **AI 代理主動修改** 的啟動程式碼/鷹架：
- AI 代理插入邏輯的 `scaffold.py`
- AI 代理根據使用者需求填入值的 `config.template`
- AI 代理以新功能擴充的 `hello-world/` 專案目錄

**經驗法則**：若 AI 代理讀取並建構於檔案內容之上 → `templates/`。若檔案在輸出中原樣使用 → `assets/`。

### 在 SKILL.md 中參考資源

使用相對路徑來參考技能目錄內的檔案：

```markdown
## 可用指令碼

執行 [helper 指令碼](./scripts/helper.py) 來自動化常見任務。

請參閱 [API 參考資料](./references/api_reference.md) 以取得詳細文件。

使用 [鷹架](./templates/scaffold.py) 作為起點。
```

## 漸進式載入架構

技能使用三層載入以提升效率：

| 層級 | 載入內容 | 時間 |
|-------|------------|------|
| 1. 發現 | 僅 `name` 與 `description` | 總是 (輕量級 Metadata) |
| 2. 指令 | 完整 `SKILL.md` 本體 | 要求符合描述時 |
| 3. 資源 | 指令碼、範例、文件 | Copilot 明確參考時 |

這意味著：
- 安裝眾多技能而不會消耗 Context
- 每個任務僅載入相關內容
- 資源僅在明確需要時才載入

## 內容指南

### 寫作風格

- 使用祈使語氣：「執行」、「建立」、「設定」(而非「你應該執行」)
- 具體且可執行
- 包含帶參數的精確指令
- 視需要顯示預期輸出
- 保持區段聚焦且易於掃描

### 指令碼需求

包含指令碼時，請優先使用跨平台語言：

| 語言 | 使用情境 |
|----------|----------|
| Python | 複雜自動化、資料處理 |
| pwsh | PowerShell Core 指令碼 |
| Node.js | 基於 JavaScript 的工具 |
| Bash/Shell | 簡單自動化任務 |

最佳實務：
- 包含說明文件 (`--help` 旗標)
- 透過清晰的訊息優雅地處理錯誤
- 避免儲存憑證或祕密
- 盡可能使用相對路徑

### 何時綁定指令碼

在下列情況下，將指令碼包含在技能中：
- 代理會重複重寫相同的程式碼
- 確定性可靠性至關重要 (例如：檔案操作、API 呼叫)
- 複雜邏輯受益於預先測試，而非每次動態生成
- 操作具有可獨立演進的封裝目的
- 可測試性很重要 — 指令碼可進行單元測試與驗證
- 預測行為優於動態生成

指令碼能啟用演進：即使是簡單的操作，當其複雜度增長、需要跨調用的一致行為，或需要未來擴充性時，實作為指令碼也能獲益。

### 安全考量

- 指令碼依賴現有的憑證協助工具 (無憑證儲存)
- 僅在破壞性操作包含 `--force` 旗標
- 在不可逆的操作前警告使用者
- 記錄任何網路操作或外部呼叫

## 撰寫高影響力技能

### 專注於 Copilot 不知道的事

不要包含 Copilot 已從訓練資料中獲知的資訊 — 標準語言語法、常見函式庫用法或有完善文件紀錄的 API 行為。技能中的每一行都應教授 Copilot 否則會弄錯或錯過的資訊。若資訊位於官方文件首頁，請省略它。請專注於內部慣例、非明顯的預設值、版本特定特性，以及改變 Copilot 行為的領域特定工作流程。

### Context 預算意識

所有技能描述在發現階段會共享有限的 Context 視窗。你的描述會與所有其他安裝的技能爭奪 Copilot 的注意力。保持描述簡潔且充滿關鍵字 — 目標是成為溝通 WHAT (做什麼)、WHEN (何時) 與相關關鍵字的最短文字。冗長的描述不僅浪費你自己的預算，還會降低系統中其他技能的可見度。

### 注意事項 (Gotchas) 是你最高訊號的內容

`## 注意事項` 區段始終是任何技能中最有價值的部分 — 防止錯誤於未然的主動警告。這不同於 `## 疑難排解`，後者提供錯誤發生後的被動修正。將注意事項視為活的文件：每當 Copilot 產出錯誤結果，就增加一條注意事項。**粗體**標示關鍵約束並說明原因 (例如：「**絕不要**在未先檢查 Y 的情況下呼叫 X() — 該 SDK 會拋出無法復原的錯誤」)。

### 優先考慮靈活指引而非僵化步驟

僅對具體、可重複的程序 (建構、部署、環境設定) 使用編號步驟，因為順序確實至關重要。對於開放式任務 (偵錯、重構、程式碼審查)，請改為提供決策標準與參考資料 — Copilot 需要靈活性來適應使用者的特定情境。

```markdown
# ❌ 太僵化
1. 開啟 src/api/handlers.ts
2. 尋找名為 processOrder 的函式
3. 在 45-60 行周圍新增 try-catch 區塊

# ✅ 靈活
修正 API 處理常式中的錯誤處理時：
- 確保所有資料庫操作皆有適當的錯誤處理
- 使用專案的 ErrorHandler 公用程式 (請參閱 ./references/error-handling.md)
- 記錄錯誤並包含足夠的 Context 以利生產環境偵錯
```

### 對大型技能使用漸進式揭露

若你的 `SKILL.md` 超過 ~200 行，請考慮將詳細內容拆分為子目錄。這能減少 Context 消耗 — Copilot 最初僅載入核心指令，並在有需要時按需讀取參考資料。

```markdown
## 參考檔案

- `references/api.md` — 完整的函式簽章與回傳型別
- `references/error-codes.md` — 此服務可回傳的所有錯誤代碼
- `scripts/validate.sh` — 變更後執行此檔案以驗證正確性

按需閱讀這些檔案以完成當前任務。不要一次全部讀取。
```

## 常見模式

### 參數表格模式

清晰記錄參數：

```markdown
| 參數 | 必填 | 預設 | 描述 |
|-----------|----------|---------|-------------|
| `--input` | 是 | - | 要處理的輸入檔案或 URL |
| `--action` | 是 | - | 要執行的動作 |
| `--verbose` | 否 | `false` | 啟用詳細輸出 |
```

### 工作流程執行模式

執行多步驟工作流程時，建立 TODO 清單，每個步驟皆參考相關文件：

```markdown
## TODO
- [ ] 步驟 1：設定環境 - 請參閱 [workflow-setup.md](./references/workflow-setup.md#environment)
- [ ] 步驟 2：建構專案 - 請參閱 [workflow-setup.md](./references/workflow-setup.md#build)
- [ ] 步驟 3：部署至預備環境 - 請參閱 [workflow-deployment.md](./references/workflow-deployment.md#staging)
- [ ] 步驟 4：執行驗證 - 請參閱 [workflow-deployment.md](./references/workflow-deployment.md#validation)
- [ ] 步驟 5：部署至生產環境 - 請參閱 [workflow-deployment.md](./references/workflow-deployment.md#production)
```

這確保了可追蹤性，並允許在中斷時恢復工作流程。

## 驗證檢查清單

發佈技能前：

- [ ] `SKILL.md` 具有帶有 `name` 與 `description` 的有效前言
- [ ] `name` 為小寫並含連字號，≤ 64 字元
- [ ] `description` 清楚說明 **做什麼**、**何時使用** 與相關 **關鍵字**
- [ ] `description` 簡潔且充滿關鍵字 (尊重 Context 預算)
- [ ] 本體專注於 Copilot 無法從訓練資料獲得的資訊
- [ ] 本體包含何時使用、先決條件 (若適用) 與核心指令
- [ ] 若技能涉及非明顯行為、API 特性或常見陷阱，則必須包含 `## 注意事項` 區段
- [ ] `SKILL.md` 本體不超過 500 行 (建議在約 200 行時拆分為 `references/`；500 行為硬上限)
- [ ] 大型工作流程 (>5 步驟) 拆分為 `references/` 資料夾，並從 `SKILL.md` 清楚連結
- [ ] 指令碼包含說明文件與錯誤處理
- [ ] 所有資源參考皆使用相對路徑
- [ ] 無硬編碼憑證或祕密

## 相關資源

- [代理技能規範 (Agent Skills Specification)](https://agentskills.io/)
- [VS Code 代理技能文件](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [參考技能儲存庫](https://github.com/anthropics/skills)
- [Awesome Copilot Skills](https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md)
