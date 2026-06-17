# Gem Team

<p align="center">
  <img src="https://img.shields.io/badge/APM-mubaidr/gem--team-blue?style=flat-square" alt="APM package: mubaidr/gem-team">
  <img src="https://img.shields.io/github/v/release/mubaidr/gem-team?style=flat-square&color=important" alt="最新版本">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="Apache-2.0 授權">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="歡迎 Pull Request">
</p>

將 AI 編碼轉化為精心策劃的循環：規劃、構建、審查、調試。

> 用於軟體開發、驗證、調試和可重複使用專案知識的規範驅動多智能體編排。

**簡而言之 (TL;DR)：** Gem Team 安裝了一套協調的專家 AI 代理，用於規劃、實作、審查、調試、測試、文件撰寫、設計、DevOps 和技能提取。它專為結構化軟體交付而設計：釐清目標、發現現有模式、規劃工作、以受控波次執行、驗證結果，並保留有用的學習。

## 快速開始

首先安裝 [APM](https://microsoft.github.io/apm/)：

```bash
# macOS / Linux
curl -sSL https://aka.ms/apm-unix | sh

# Windows PowerShell
irm https://aka.ms/apm-windows | iex

# 驗證
apm --version
```

在當前專案中安裝 Gem Team：

```bash
apm install mubaidr/gem-team --target copilot,claude,cursor,opencode,codex,gemini,windsurf
```

或僅為單一目標安裝：

```bash
apm install mubaidr/gem-team --target copilot
```

首次安裝後，提交屬於您儲存庫的生成 APM 檔案，特別是 `apm.yml`、`apm.lock.yaml` 以及生成的 harness 目錄，例如 `.github/`、`.claude/`、`.cursor/`、`.opencode/`、`.codex/`、`.gemini/` 或 `.windsurf/`。**請勿** 提交 `apm_modules/`。

> APM 可以從現有的 harness 目錄自動偵測目標，但建議使用明確的 `--target` 以獲得可預測的安裝和全新儲存庫。

## 目錄

- [為什麼選擇 Gem Team？](#why-gem-team)
- [比較](#comparison)
- [核心概念](#core-concepts)
- [工作流程](#workflow)
- [代理團隊](#the-agent-team)
- [安裝](#installation)
- [相容工具](#compatible-tools)
- [配置](#configuration)
- [操作說明](#operational-notes)
- [貢獻](#contributing)
- [授權](#license)
- [支援](#support)

## 為什麼選擇 Gem Team？

### 更好的交付流程

- **規範驅動執行** — 將目標轉化為有範疇的計劃、任務、檢查和證據。
- **波次執行** — 平行執行獨立工作，同時序列化真實的依賴關係。
- **驗證循環** — 在最終輸出前使用審查者、測試者、批評者和調試者。
- **可恢復的計劃** — 計劃 ID、任務構件和內容檔案使長任務更易於暫停、檢查和繼續。

### 更好的程式碼品質

- **專家代理** — 規劃、實作、調試、審查、測試、文件撰寫、設計和 DevOps 由專注的角色處理。
- **模式重用** — 研究者首先檢查程式碼庫，以便代理遵循現有架構，而不是發明新模式。
- **合約優先心態** — 在實作前鼓勵需求、API 合約、測試和驗收標準。
- **具備安全意識的審查** — 審查者和 DevOps 角色會檢查常見的安全、秘密、PII 和部署風險。

### 更好的內容管理

- **內容包絡 (Context envelope)** — 儲存當前專案摘要、約束、架構筆記、任務註冊、先前決策和可重複使用的發現。
- **基於檔案的知識** — 重要的輸出被寫入持久檔案，而不是被困在單個對話輪次中。
- **技能提取** — 高信心的重複工作流程可以成為可重複使用的 `SKILL.md` 指南。
- **記憶紀律** — 持久的學習僅在有用且足夠可靠時才被保留。

### 更好的成本控制

- **模型路由** — 常規代理可以使用快速且具成本效益的模型，而規劃者、調試者、批評者和審查者角色可以使用更強大的推理模型。
- **減少冗餘讀取** — 內容包絡和研究摘要可防止重複的原始碼讀取。
- **簡潔的代理輸出** — 代理被指示返回可操作的構件，而不是冗長的評論。

## 比較

gem-team 並非試圖取代 Copilot、Cursor、Claude Code、Cline 或 Roo Code。

它專注於缺失的工作流程層：

- 規劃
- 多代理委派優先策略（用於平行工作）
- 用於避免重複原始碼讀取的內容包絡
- 審查者/調試者循環
- 專家代理
- 可重複的執行構件

當您希望 AI 編碼遵循工程流程而非單個聊天提示時，請使用 gem-team。

體驗自信、結構化的交付和持久的知識，而非臨時的一次性輸出。

## 核心概念

### 系統 IQ 倍增器

Gem Team 使用紀律嚴明的交付系統封裝您選擇的模型：任務分類、規劃、委派、驗證、調試和學習。目標是在不依賴單個長提示的情況下，提高代理化軟體工作的可靠性。

### 知識層

| 層級 | 位置 | 用途 |
| :----------------- | :------------------------------- | :------------------------------------------------------------------------- |
| **PRD** | `docs/PRD.yaml` | 產品需求和核准的決策。 |
| **AGENTS.md** | `AGENTS.md` | 穩定的專案慣例、規則和代理指令。 |
| **計劃構件** | `docs/plan/{plan_id}/` | 每個任務的計劃、內容包絡、任務註冊、證據和結果。 |
| **記憶** | 記憶工具 / 配置的後端 | 持久的事實、決策、陷阱、模式和失敗模式。 |
| **技能** | `docs/skills/` | 從成功的重複工作流程中提取的可重複使用程序。 |
| **衍生文件** | `docs/knowledge/` | 參考筆記、外部文件、摘要和研究輸出。 |

## 工作流程

### 架構流程

### 執行模型

Gem Team 根據任務複雜度調整工作流程深度：

- **微不足道 (TRIVIAL)：** 使用微型檢查清單直接執行。
- **低 (LOW)：** 輕量級記憶體內規劃和執行。
- **中/高 (MEDIUM/HIGH)：** 持久規劃、內容包絡、驗證、波次執行和整合審查。

系統批量處理獨立工作，僅序列化真實的依賴關係，並為將來的運行保留高信心的學習。

```text
使用者輸入
    ↓
階段 0：初始化與釐清
    • 讀取提供的內容
    • 載入配置和相關記憶
    • 偵測意圖和計劃狀態
    • 分類複雜度
    • 僅針對阻塞性釐清進行提問
    ↓
階段 1：路由
    • 繼續現有計劃
    • 修訂現有計劃
    • 開始新任務
    ↓
階段 2：計劃
    • 微不足道 → 微型檢查清單
    • 低 → 輕量級記憶體內計劃
    • 中/高 → 規劃者生成的持久計劃
    • 在執行前驗證高風險計劃
    ↓
階段 3：執行
    • 根據複雜度準備內容
    • 分波次執行未阻塞的工作
    • 將任務委派給合適的代理
    • 尊重依賴關係和衝突
    • 審查/整合高風險波次
    ↓
學習與持久化
    • 儲存可重複使用的決策、模式、陷阱和技能
    • 根據需要更新記憶、文件、PRD、AGENTS.md 或技能
    ↓
循環 / 重新規劃
    • 繼續下一波次
    • 如果範疇改變則重新規劃
    • 如果被阻塞則呈報
    ↓
階段 4：輸出
    • 使用配置的輸出格式呈現最終狀態
```

## 代理團隊

### 推薦的模型路由

預設使用快速且具成本效益的模型，並為需要深度分析的任務保留更強大的推理模型。

| 角色 | 範例模型 | 推薦用途 |
| :-------------------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------- |
| **預設代理** | `mimoi-2.5/deepseek-v4-flash` | 常規實作、文件撰寫、研究摘要和簡單檢查。 |
| **規劃者、調試者、批評者、審查者** | `mimoi-2.5-pro/deepseek-v4-pro` | 規劃、根源分析、合規檢查、關鍵審查和高風險驗證。 |

如果需要，請將其替換為您自己供應商的同等模型。

### 核心代理

| 代理 | 描述 |
| :--------------- | :--------------------------------------------------------------------------------------- |
| **編排者 (ORCHESTRATOR)** | 協調工作流程、委派工作、跟蹤計劃並執行驗證閘門。 |
| **研究者 (RESEARCHER)** | 探索程式碼庫、依賴關係、架構、現有模式和相關文件。 |
| **規劃者 (PLANNER)** | 建立基於 DAG 的執行計劃、任務波次、風險筆記和驗收標準。 |
| **實作者 (IMPLEMENTER)** | 根據核准的計劃實作功能、修復、重構和測試。 |

### 品質與審查

| 代理 | 描述 |
| :------------------ | :------------------------------------------------------------------------------------------ |
| **審查者 (REVIEWER)** | 審查實品質、安全性、可維護性、合約和測試覆蓋率。 |
| **批評者 (CRITIC)** | 質疑假設、發現邊緣情況，並標記過度工程或遺漏的約束。 |
| **調試者 (DEBUGGER)** | 進行根源分析、回歸追蹤和有針對性的修復計劃。 |
| **瀏覽器測試者 (BROWSER TESTER)** | 執行瀏覽器/E2E 檢查，驗證 UI 行為，並捕捉視覺證據。 |
| **程式碼簡化者 (CODE SIMPLIFIER)** | 移除死程式碼、減少複雜性並提高可維護性。 |

### 專業代理

| 代理 | 描述 |
| :--------------------- | :-------------------------------------------------------------------------------------------- |
| **DEVOPS** | 處理部署、CI/CD、基礎設施、容器、健康檢查和回滾計劃。 |
| **文件 (DOCUMENTATION)** | 撰寫技術文件、README、API 文件、圖表和計劃構件。 |
| **設計師 (DESIGNER)** | 提供 UI/UX 指導、佈局、互動筆記、視覺潤色和無障礙檢查。 |
| **實作者-行動端 (IMPLEMENTER-MOBILE)** | 為 React Native、Expo、Flutter、iOS 或 Android 實作原生行動端工作。 |
| **設計師-行動端 (DESIGNER-MOBILE)** | 使用平台慣例、安全區域和無障礙要求審查行動端 UX。 |
| **行動端測試者 (MOBILE TESTER)** | 執行行動端 E2E 和設備測試工作流程，例如 Detox、Maestro、iOS 或 Android 檢查。 |
| **技能創作者 (SKILL CREATOR)** | 從重複的高信心工作流程中提取可重複使用的 `SKILL.md` 檔案。 |

## 安裝

### 1. 安裝 APM

```bash
# macOS / Linux
curl -sSL https://aka.ms/apm-unix | sh

# Windows PowerShell
irm https://aka.ms/apm-windows | iex

# 驗證
apm --version
```

### 2. 安裝 Gem Team

專案範疇安裝，建議團隊使用：

```bash
apm install mubaidr/gem-team --target copilot,claude,cursor,opencode,codex,gemini,windsurf
```

全域使用者範疇安裝，適用於個人使用：

```bash
apm install -g mubaidr/gem-team
```

為可重複安裝固定發行版本：

```bash
apm install mubaidr/gem-team#v1.20.0 --target copilot
```

### 3. 驗證安裝

```bash
apm list
apm view mubaidr/gem-team
apm audit
```

特定工具檢查：

```bash
copilot plugin list   # 如果使用 GitHub Copilot CLI
/plugin list          # 在 Claude Code 中，於 Claude Code 內部
```

### 有用的 APM 旗標

```bash
# 預覽而不寫入檔案
apm install mubaidr/gem-team --target copilot --dry-run

# 僅安裝選定的目標
apm install mubaidr/gem-team --target claude,cursor

# 安裝所有支援的 harness 目標
apm install mubaidr/gem-team --target all

# 從自動偵測中排除一個目標
apm install mubaidr/gem-team --exclude codex

# 從現有的 apm.yml 清單重新安裝
apm install
```

## 相容工具

APM 根據選定的目標和套件中包含的原語寫入不同的檔案。

| APM 目標 | 工具 / harness | 典型輸出 |
| :--------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------ |
| `copilot` | VS Code Copilot / GitHub Copilot CLI | `.github/agents/`、`.github/instructions/`、`.github/prompts/`，以及適用時的 VS Code MCP 配置。 |
| `claude` | Claude Code | `.claude/agents/`、`.claude/rules/`、指令、技能、掛鉤，以及適用時的 MCP 配置。 |
| `cursor` | Cursor | `.cursor/agents/`、`.cursor/rules/`、技能、指令、掛鉤，以及適用時的 MCP 配置。 |
| `opencode` | OpenCode | `.opencode/agents/`、指令、技能、MCP 以及編譯後的指令。 |
| `codex` | Codex CLI | `.codex/agents/`、`AGENTS.md`，以及適用時的 Codex 配置。 |
| `gemini` | Gemini CLI | `GEMINI.md`、支援處的技能/指令，以及適用時的 Gemini 配置。 |
| `windsurf` | Windsurf / Cascade | `.windsurf/rules/`、技能、指令、掛鉤，以及支援處的 MCP 配置。 |

> 某些 harness 不支援所有原語。例如，並非所有工具都有原生代理、掛鉤或專案範疇的 MCP。APM 根據目標編譯或跳過不受支援的原語。

## 市場安裝

APM 是推薦的安裝路徑。直接從市場安裝是可選的，且需要此儲存庫為目標工具發布正確的市場元數據。

### GitHub Copilot CLI

```bash
copilot plugin marketplace add mubaidr/gem-team
copilot plugin marketplace browse gem-team
copilot plugin install gem-team@gem-team
```

GitHub Copilot CLI 還包含預設市場，如 `awesome-copilot`；如果 Gem Team 在那裡發布，請使用以下指令安裝：

```bash
copilot plugin install gem-team@awesome-copilot
```

### Claude Code

```bash
/plugin marketplace add mubaidr/gem-team
/plugin
/plugin install gem-team@gem-team
/reload-plugins
```

## 本地開發

克隆儲存庫並將其安裝到測試專案中：

```bash
git clone https://github.com/mubaidr/gem-team.git
cd gem-team
apm install . --target claude,cursor --dry-run
```

然後從本地路徑執行實際安裝：

```bash
apm install /absolute/path/to/gem-team --target claude,cursor
```

用於套件撰寫和發布驗證：

```bash
apm audit
apm compile --target copilot,claude,cursor --validate
apm pack
```

## 配置

Gem Team 可通過專案根目錄中的 `.gem-team.yaml` 進行配置。

```yaml
orchestrator:
  max_concurrent_agents: 2
  default_complexity_threshold: auto # auto | TRIVIAL | LOW | MEDIUM | HIGH

planning:
  enable_critic_for: [HIGH]

quality:
  visual_regression_enabled: true
  visual_diff_threshold: 0.95
  a11y_audit_level: basic # none | basic | full

devops:
  approval_required_for: [production]
  auto_rollback_on_failure: false

testing:
  screenshot_on_failure: true
```

### 設定參考

#### 編排者 (Orchestrator)

| 設定 | 類型 | 預設值 | 描述 |
| :------------------------------------------ | :----- | :------ | :----------------------------------------------------------------------- |
| `orchestrator.max_concurrent_agents` | 數字 | `2` | 最大平行代理執行數。 |
| `orchestrator.default_complexity_threshold` | 枚舉 | `auto` | 強制複雜度路由：`auto`、`TRIVIAL`、`LOW`、`MEDIUM` 或 `HIGH`。 |

#### 規劃 (Planning)

| 設定 | 類型 | 預設值 | 描述 |
| :--------------------------- | :----- | :------- | :------------------------------------------------ |
| `planning.enable_critic_for` | 枚舉[] | `[HIGH]` | 需要批評者驗證的複雜度級別。 |

#### 品質 (Quality)

| 設定 | 類型 | 預設值 | 描述 |
| :---------------------------------- | :------ | :------ | :----------------------------------------------------- |
| `quality.visual_regression_enabled` | 布林值 | `true` | 啟用截圖比較檢查。 |
| `quality.visual_diff_threshold` | 數字 | `0.95` | 視覺比較閾值，範圍從 `0.0` 到 `1.0`。 |
| `quality.a11y_audit_level` | 枚舉 | `basic` | 無障礙審計深度：`none`、`basic` 或 `full`。 |

#### DevOps

| 設定 | 類型 | 預設值 | 描述 |
| :-------------------------------- | :------ | :------------- | :------------------------------------------- |
| `devops.approval_required_for` | 枚舉[] | `[production]` | 需要明確核准的環境。 |
| `devops.auto_rollback_on_failure` | 布林值 | `false` | 部署失敗後嘗試回退。 |

#### 測試 (Testing)

| 設定 | 類型 | 預設值 | 描述 |
| :------------------------------ | :------ | :------ | :---------------------------------------------- |
| `testing.screenshot_on_failure` | 布林值 | `true` | 當瀏覽器/UI 測試失敗時捕捉截圖。 |

完整註解的預設檔案可在 [`.gem-team.yaml`](.gem-team.yaml) 獲得。

## 操作說明

- 建議團隊使用專案範疇安裝，以便 `apm.yml` 和 `apm.lock.yaml` 使設定可重複。
- 請將 `apm_modules/` 排除在 git 之外；它是安裝快取。
- 為穩定的 CI 和團隊入職，使用 `#vX.Y.Z` 固定發行版本。
- 在發布前和 CI 中執行 `apm audit`。
- 在提交大型更新前審查生成的檔案。
- 將 DevOps、生產部署、數據遷移和破壞性操作視為需要核准的工作。
- 將專案規則保留在 `AGENTS.md` 中；將任務特定的內容保留在 `docs/plan/{plan_id}/` 中。

## 貢獻

歡迎貢獻。請在開啟 Pull Request 前閱讀 [CONTRIBUTING.md](./CONTRIBUTING.md)。

推薦的貢獻流程：

1. 開啟或選擇一個議題。
2. 建立一個專注的分支。
3. 保持更改微小且易於審查。
4. 在相關處新增或更新測試/文件。
5. 在開啟 PR 前執行驗證。

## 授權

Gem Team 採用 [Apache License 2.0](./LICENSE) 授權。

## 支援

如果您遇到錯誤或有功能請求，請 [開啟議題](https://github.com/mubaidr/gem-team/issues)。
