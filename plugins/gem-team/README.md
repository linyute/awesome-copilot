# Gem Team

<p align="center">
  <img src="https://img.shields.io/badge/APM-mubaidr/gem--team-blue?style=flat-square" alt="APM 套件：mubaidr/gem-team">
  <img src="https://img.shields.io/github/v/release/mubaidr/gem-team?style=flat-square&color=important" alt="最新發佈版本">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="Apache-2.0 授權條款">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="歡迎提交 Pull Request">
</p>

將 AI 程式開發轉化為有組織的循環流程：規劃、建構、審查、除錯、學習——搭配更智慧的工具呼叫與精簡的上下文管理。

> 以規格驅動的多代理人協作編排，用於軟體開發、驗證、除錯、可重複使用知識，以及無上下文膨脹的執行。

**TL;DR：** Gem Team 安裝了 16 個專業代理人，將 AI 程式開發轉化為工程流程。透過結構化的波次執行、依賴關係解析、整合閘門及漸進式上下文管理進行規劃、實作與審查——同時避免上下文膨脹、透過輸出整潔與探索深度縮放節省 token，並透過模型路由與針對性的上下文快照提升工具呼叫精準度。支援 Copilot、Claude Code、Cursor、OpenCode、Codex、Gemini CLI 及 Windsurf。

## 為何選擇 Gem Team？

Gem Team 以嚴格的工程交付系統包覆您的 AI：規劃、建構、審查、除錯、學習。下方的[功能特色](#功能特色)章節詳細介紹了每項能力。以下是重點摘要：

- **更好的交付流程**：以規格驅動的執行、基於波次的平行處理、驗證閘門、可恢復的計畫。
- **更好的程式碼品質**：16 個專業代理人、預設採用 TDD、先診斷後修復、安全性與無障礙審查。
- **更好的上下文管理**：漸進式上下文封包、三層記憶體、技能擷取、PRD 管理——上下文膨脹防護已內建。
- **更好的成本控制**：模型路由、輸出整潔、上下文剪除、探索深度縮放——更少 token，相同成果。
- **更好的工具呼叫**：每個代理人擁有針對性的上下文快照，搭配輸出整潔規則——精準而不浪費提示詞。

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

將 Gem Team 安裝至您目前的專案：

```bash
apm install mubaidr/gem-team --target copilot,claude,cursor,opencode,codex,gemini,windsurf
```

或僅安裝至單一目標：

```bash
apm install mubaidr/gem-team --target copilot
```

完成首次安裝後，請提交屬於您儲存庫的已產生 APM 檔案，尤其是 `apm.yml`、`apm.lock.yaml`，以及已產生的固定目錄，例如 `.github/`、`.claude/`、`.cursor/`、`.opencode/`、`.codex/`、`.gemini/` 或 `.windsurf/`。**請勿**提交 `apm_modules/`。

> APM 可從現有的固定目錄自動偵測目標，但建議明確指定 `--target`，以確保可預測的安裝結果及全新儲存庫的正確設定。

## 目錄

- [為何選擇 Gem Team？](#為何選擇-gem-team)
- [功能特色](#功能特色)
- [比較](#比較)
- [核心概念](#核心概念)
- [工作流程](#工作流程)
- [代理人團隊](#代理人團隊)
- [安裝](#安裝)
- [相容工具](#相容工具)
- [設定](#設定)
- [操作注意事項](#操作注意事項)
- [貢獻](#貢獻)
- [授權條款](#授權條款)
- [支援](#支援)

## 功能特色

### 智慧型工作流程引擎

- **以階段為基礎的可預測管線**：初始化 → 路由 → 規劃 → 執行 → 輸出。
- **複雜度自適應路由**：TRIVIAL 任務採用單次委派。LOW 採用記憶體內規劃。MEDIUM/HIGH 採用持久計畫、驗證閘門及基於 DAG 的波次執行。
- **整合閘門**：審查員在繼續執行前檢查波次輸出。MEDIUM 根據風險設閘門；HIGH 每個波次都設閘門。
- **可恢復的計畫**：計畫 ID、以檔案為基礎的成品，以及上下文封包，使長時間任務可以暫停、檢查並乾淨地繼續執行。

### 專業代理人團隊

- **16 個專注的代理人**：規劃師、研究員、實作者、行動實作者、審查員、批評者、除錯器、瀏覽器測試員、行動測試員、DevOps、文件撰寫者、設計師、行動設計師、程式碼簡化器、技能建立者，以及協調所有人的協調者。
- **預設採用 TDD**：實作者遵循紅燈-綠燈-重構原則，涵蓋 6 個類別的測試（正常路徑、不變量、邊界條件、錯誤路徑、輸入變化、狀態轉換）。錯誤修復模式要求在修改程式碼前先進行除錯器診斷。
- **先診斷後修復**：除錯器診斷 → 實作者修復 → 審查員重新驗證。在規劃師、協調者、實作者和審查員層級強制執行。

### 上下文與知識管理

- **上下文封包**：所有代理人共享的漸進式快取。技術堆疊、慣例、限制、架構快照、研究摘要、先前決策：每個波次後都會豐富。
- **三層記憶體**：儲存庫層（工作區範圍）、工作階段層（對話範圍）、全域層（使用者範圍）。以信心值（≥0.85）為門檻的持久化。
- **穩定快取**：高信心事實（≥0.90、穩定、≥3 次使用）晉升為持久快取。90 天未使用後自動逐出。
- **重複使用注意事項**：代理人跳過重新驗證的可信任檔案路徑和模式。
- **技能擷取**：高信心工作流程透過 gem-skill-creator 成為可重複使用的 `SKILL.md` 操作手冊。
- **PRD 管理**：包含 EARS 語法、驗收標準、決策和變更歷史的結構化產品需求。

### 品質與驗證

- **計畫驗證**：審查員檢查計畫的正確性、時間悖論、波次排序及契約完整性。
- **批評者審查**：挑戰假設、找出邊界案例、標記過度工程——用於 HIGH 複雜度和影響架構的變更。
- **每波次整合檢查**：審查員在每個波次後驗證契約、衝突和整合點。
- **安全性審查**：OWASP 掃描、機密/PII 偵測、行動 8 向量掃描（金鑰鏈、憑證固定、深度連結、生物識別驗證、網路安全）。
- **無障礙審查**：WCAG 2.1 AA 對比度檢查、ARIA 標籤、焦點指示器、觸控目標、支援減少動態效果。
- **視覺回歸**：具可設定閾值的截圖比較。
- **可設定的審查深度**：`none`、`basic` 或 `full` 無障礙掃描。

### 🔧 測試

- **E2E 瀏覽器測試**：以流程為基礎的情境，包含設定、斷言、視覺證據、控制台/網路擷取。
- **行動 E2E 測試**：iOS + Android，使用 Detox、Maestro、Appium。手勢測試、生命週期測試、推播通知、裝置農場支援。
- **效能測試**：冷啟動 TTI、記憶體分析、幀率分析、套件大小追蹤。
- **平台特定測試**：安全區域、鍵盤行為、系統權限、深色模式、震動、返回按鈕、電池最佳化。

### 設計

- **UI/UX 設計系統建立**：調色板、字體排版比例、間距、陰影、設計風格（野蠻主義、玻璃擬態、極簡主義、新野蠻主義、黏土擬態、復古未來主義、最大主義）。
- **行動平台設計**：iOS HIG、Android Material 3、安全區域、動態島、觸控目標（44pt/48dp）、platform-select 模式。
- **無障礙優先**：對比度 4.5:1、觸控目標、減少動態效果、語意化 HTML/ARIA。
- **設計輸出**：包含 token、元件規格、響應式行為、代理人提示指南的 9 節 `DESIGN.md`。

### DevOps 與部署

- **基礎架構佈建**：Docker、Kubernetes、雲端（AWS/GCP/Azure）。
- **CI/CD 管線管理**：PR → 預備環境 → 煙霧測試 → 生產環境流程。
- **核准閘門**：每個環境可設定的核准需求。
- **健康檢查**：端點驗證、資源監控、回滾策略（滾動式、藍綠部署、金絲雀）。
- **行動部署**：EAS Build/Update、Fastlane、TestFlight、Google Play 分階段推出。
- **冪等操作**：所有操作設計為可安全重複執行。

### 成本控制

- **模型路由**：例行工作（實作者、文件）使用廉價模型。規劃、除錯、審查、批評使用強大的推理模型。
- **輸出整潔**：代理人限制為使用原生工具旗標、管線截斷、搜尋的 maxResults。
- **上下文重複使用**：封包按代理人過濾（僅相關章節）。
- **預算控制**：研究員每項任務有 `max_searches`、`max_files_to_read`、`max_depth`。

### 學習與重複使用

- **持久化高信心學習成果**：信心值 ≥0.95 的事實、模式、陷阱、失敗模式、決策，自動持久化。
- **批次委派**：產品決策 → PRD。技術決策 → AGENTS.md/架構文件。模式 → 記憶體/封包。工作流程 → 技能。
- **Git 檢查點**：整合閘門通過後可選擇的波次級提交，以提供清晰的審計軌跡和回滾診斷。

## 比較

gem-team 並非要取代 Copilot、Cursor、Claude Code、Cline 或 Roo Code。

它專注於缺失的工作流程層：

- 規劃
- 以子代理人委派優先進行平行工作的策略
- 避免重複讀取原始碼的上下文封包
- 審查員/除錯器循環
- 專業代理人
- 可重複的執行成品

當您希望 AI 程式開發遵循工程流程而非單一對話提示時，請使用 gem-team。

以自信、結構化的交付和持久知識取代臨時的一次性輸出。

## 核心概念

### 系統智能倍增器

Gem Team 以嚴格的交付系統包覆您選擇的模型：任務分類、規劃、委派、驗證、除錯和學習。目標是在不依賴單一長提示詞的情況下，提高代理式軟體工作的可靠性。

### 知識層

| 層級              | 位置                             | 用途                                                                     |
| :----------------- | :------------------------------- | :----------------------------------------------------------------------- |
| **PRD**            | `docs/PRD.yaml`                  | 產品需求和已核准的決策。                                                 |
| **AGENTS.md**      | `AGENTS.md`                      | 穩定的專案慣例、規則和代理人指令。                                       |
| **計畫成品**       | `docs/plan/{plan_id}/`           | 每項任務的計畫、上下文封包、任務登錄、證據和結果。                       |
| **記憶體**         | 記憶體工具 / 已設定的後端        | 持久化的事實、決策、陷阱、模式和失敗模式。                               |
| **技能**           | `docs/skills/`                   | 從成功的重複工作流程中擷取的可重複使用程序。                             |
| **衍生文件**       | `docs/knowledge/`                | 參考注意事項、外部文件、摘要和研究輸出。                                 |

## 工作流程

### 架構流程

### 執行模型

Gem Team 根據任務複雜度調整工作流程深度：

- **TRIVIAL：** 附帶小型檢查清單的直接執行。
- **LOW：** 輕量級的記憶體內規劃和執行。
- **MEDIUM/HIGH：** 持久規劃、上下文封包、驗證、波次執行和整合審查。

系統批次處理獨立工作，僅序列化真正的依賴關係，並持久化高信心的學習成果以供未來執行使用。

```text
使用者輸入
    ↓
階段 0：初始化與釐清
    • 讀取提供的上下文
    • 載入設定和相關記憶體
    • 偵測意圖和計畫狀態
    • 分類複雜度
    • 僅詢問阻塞性釐清問題
    ↓
階段 1：路由
    • 繼續現有計畫
    • 修訂現有計畫
    • 開始新任務
    ↓
階段 2：規劃
    • TRIVIAL → 小型檢查清單
    • LOW → 輕量級記憶體內計畫
    • MEDIUM/HIGH → 規劃師產生的持久計畫
    • 分析需求中的不一致性（MEDIUM/HIGH）
    • 在執行前驗證較高風險的計畫
    ↓
階段 3：執行
    • 根據複雜度準備上下文
    • 以波次執行未阻塞的工作
    • 將任務委派給合適的代理人
    • 遵守依賴關係和衝突
    • 審查/整合較高風險的波次
    ↓
學習與持久化
    • 儲存可重複使用的決策、模式、陷阱和技能
    • 適當地更新記憶體、文件、PRD、AGENTS.md 或技能
    ↓
循環 / 重新規劃
    • 繼續下一個波次
    • 若範圍變更則重新規劃
    • 若遭到阻塞則升級
    ↓
階段 4：輸出
    • 使用已設定的輸出格式呈現最終狀態
```

## 代理人團隊

### 建議的模型路由

使用快速且具成本效益的模型作為預設，並保留更強大的推理模型用於需要更深入分析的任務。

| 角色                                    | 範例模型                        | 建議用途                                                                                       |
| :-------------------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------- |
| **預設代理人**                          | `mimoi-2.5/deepseek-v4-flash`   | 例行實作、文件、研究摘要和簡單檢查。                                                           |
| **規劃師、除錯器、批評者、審查員**      | `mimoi-2.5-pro/deepseek-v4-pro` | 規劃、根本原因分析、合規性檢查、關鍵審查和高風險驗證。                                         |

如有需要，請以您自己供應商的同等模型取代。

### 核心代理人

| 代理人           | 說明                                                                                                                                            |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **ORCHESTRATOR** | 協調工作流程、委派工作、追蹤計畫並執行驗證閘門。執行第 0–4 階段管線。絕不直接執行工作。                                                        |
| **RESEARCHER**   | 探索程式碼庫模式、依賴關係、架構和文件。支援 5 種模式（scan、deep、audit、trace、question），並附有預算控制。                                   |
| **PLANNER**      | 建立以 DAG 為基礎的執行計畫，包含任務分解、波次排程、依賴關係映射、風險分析和驗收標準。                                                         |
| **IMPLEMENTER**  | 使用 TDD（紅燈-綠燈-重構）實作功能、修復和重構。錯誤修復模式需要除錯器診斷。僅進行外科手術式編輯。                                             |

### 品質與審查

| 代理人              | 說明                                                                                                                                                                                                                                             |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REVIEWER**        | 審查實作品質、安全性、可維護性、契約和測試覆蓋率。計畫驗證（輕量級/完整）。波次整合檢查。OWASP + 機密 + 行動 8 向量安全掃描。無障礙審查（none/basic/full）。                                                                                    |
| **CRITIC**          | 審查 PRD 需求中的不一致性和歧義。挑戰假設、找出邊界案例、標記過度工程或遺漏的限制。評估分解、依賴關係、複雜度、耦合和未來擴展性。提供替代方案。                                                                                                  |
| **DEBUGGER**        | 根本原因分析、堆疊追蹤診斷、回歸二分法、錯誤重現。當輸入不足時詢問釐清問題。Prove-It 模式（先建立重現測試）。絕不實作修復。                                                                                                                     |
| **BROWSER TESTER**  | E2E 瀏覽器檢查、UI 流程驗證、視覺回歸（截圖比較）、控制台/網路擷取、無障礙審查。可設定閾值。                                                                                                                                                    |
| **CODE SIMPLIFIER** | 移除死程式碼、降低循環複雜度、整合重複項、改善命名。保留行為：每次變更後執行測試。切斯特頓柵欄原則。                                                                                                                                             |

### 專業代理人

| 代理人                 | 說明                                                                                                                                                                   |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEVOPS**             | 基礎架構部署、CI/CD 管線、容器管理（Docker/K8s）。生產環境的核准閘門。健康檢查、回滾（滾動式/藍綠部署/金絲雀）。行動部署（EAS、Fastlane、TestFlight/Play Store）。   |
| **DOCUMENTATION**      | 技術文件、README、API 文件、圖表、操作說明。PRD 撰寫和維護。上下文封包更新。AGENTS.md 管理。覆蓋率矩陣。                                                               |
| **DESIGNER**           | UI/UX 版面配置、主題、配色方案、設計系統。建立/驗證模式。設計風格（野蠻主義、玻璃擬態、極簡主義等）。9 節 `DESIGN.md` 輸出。WCAG 2.1 AA。                            |
| **IMPLEMENTER-MOBILE** | React Native、Expo、Flutter 的行動 TDD。使用 Platform.select 的平台特定程式碼。SafeAreaView、FlatList、Reanimated。錯誤修復模式。                                       |
| **DESIGNER-MOBILE**    | iOS（HIG）和 Android（Material 3）的行動 UI/UX。安全區域、觸控目標（44pt/48dp）、動態島、平台特定規格。                                                               |
| **MOBILE TESTER**      | 使用 Detox、Maestro、Appium 的行動 E2E。iOS + Android。手勢、生命週期、推播通知、裝置農場測試。效能（冷啟動、記憶體、幀率）。                                          |
| **SKILL CREATOR**      | 從高信心（≥0.95、≥2 次使用）的模式中擷取可重複使用的 `SKILL.md` 檔案。建立腳本、參考資料和交叉連結的資產。                                                            |

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

專案範圍安裝，建議用於團隊：

```bash
apm install mubaidr/gem-team --target copilot,claude,cursor,opencode,codex,gemini,windsurf
```

全域使用者範圍安裝，適合個人使用：

```bash
apm install -g mubaidr/gem-team
```

固定發佈版本以確保可重現的安裝：

```bash
apm install mubaidr/gem-team#v1.20.0 --target copilot
```

### 3. 驗證安裝

```bash
apm list
apm view mubaidr/gem-team
apm audit
```

工具特定檢查：

```bash
copilot plugin list   # GitHub Copilot CLI，若使用
/plugin list          # Claude Code，在 Claude Code 內部
```

### 實用的 APM 旗標

```bash
# 預覽而不寫入檔案
apm install mubaidr/gem-team --target copilot --dry-run

# 僅安裝選定的目標
apm install mubaidr/gem-team --target claude,cursor

# 安裝所有支援的固定目標
apm install mubaidr/gem-team --target all

# 從自動偵測中排除一個目標
apm install mubaidr/gem-team --exclude codex

# 從現有的 apm.yml 清單重新安裝
apm install
```

## 相容工具

APM 會根據所選目標和套件中包含的基本元素寫入不同的檔案。

| APM 目標   | 工具 / 固定環境                      | 典型輸出                                                                                                |
| :--------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------ |
| `copilot`  | VS Code Copilot / GitHub Copilot CLI | `.github/agents/`、`.github/instructions/`、`.github/prompts/`，以及適用時的 VS Code MCP 設定。        |
| `claude`   | Claude Code                          | `.claude/agents/`、`.claude/rules/`、命令、技能、鉤子，以及適用時的 MCP 設定。                         |
| `cursor`   | Cursor                               | `.cursor/agents/`、`.cursor/rules/`、技能、命令、鉤子，以及適用時的 MCP 設定。                         |
| `opencode` | OpenCode                             | `.opencode/agents/`、命令、技能、MCP 及已編譯的指令。                                                  |
| `codex`    | Codex CLI                            | `.codex/agents/`、`AGENTS.md`，以及適用時的 Codex 設定。                                               |
| `gemini`   | Gemini CLI                           | `GEMINI.md`、支援的地方的技能/指令，以及適用時的 Gemini 設定。                                         |
| `windsurf` | Windsurf / Cascade                   | `.windsurf/rules/`、技能、命令、鉤子，以及支援的地方的 MCP 設定。                                     |

> 部分固定環境不支援每一種基本元素。例如，並非每個工具都有原生代理人、鉤子或專案範圍的 MCP。APM 會根據目標編譯或略過不支援的基本元素。

## Marketplace 安裝

APM 是建議的安裝路徑。直接從 marketplace 安裝為選用項目，且需要此儲存庫為目標工具發佈正確的 marketplace 中繼資料。

### GitHub Copilot CLI

```bash
copilot plugin marketplace add mubaidr/gem-team
copilot plugin marketplace browse gem-team
copilot plugin install gem-team@gem-team
```

GitHub Copilot CLI 也包含預設的 marketplace，例如 `awesome-copilot`；若 Gem Team 已在該處發佈，請使用以下指令安裝：

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

## 本機開發

複製儲存庫並將其安裝至測試專案：

```bash
git clone https://github.com/mubaidr/gem-team.git
cd gem-team
apm install . --target claude,cursor --dry-run
```

然後從本機路徑執行實際安裝：

```bash
apm install /absolute/path/to/gem-team --target claude,cursor
```

用於套件撰寫和發佈驗證：

```bash
apm audit
apm compile --target copilot,claude,cursor --validate
apm pack
```

## 設定

Gem Team 可以使用專案根目錄中的 `.gem-team.yaml` 進行設定。

```yaml
orchestrator:
  max_concurrent_agents: 2
  default_complexity_threshold: auto # auto | TRIVIAL | LOW | MEDIUM | HIGH
  git_commit_on_gate_pass: true

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

#### Orchestrator

| 設定                                        | 類型   | 預設值  | 說明                                                                       |
| :------------------------------------------ | :----- | :------ | :------------------------------------------------------------------------- |
| `orchestrator.max_concurrent_agents`        | number | `2`     | 最大平行代理人執行數。                                                     |
| `orchestrator.default_complexity_threshold` | enum   | `auto`  | 強制複雜度路由：`auto`、`TRIVIAL`、`LOW`、`MEDIUM` 或 `HIGH`。            |
| `orchestrator.git_commit_on_gate_pass`      | bool   | `true`  | 整合閘門通過時，提交波次輸出。                                             |

#### Planning

| 設定                         | 類型   | 預設值   | 說明                                             |
| :--------------------------- | :----- | :------- | :----------------------------------------------- |
| `planning.enable_critic_for` | enum[] | `[HIGH]` | 需要批評者驗證的複雜度等級。                     |

#### Quality

| 設定                                | 類型    | 預設值  | 說明                                                   |
| :---------------------------------- | :------ | :------ | :----------------------------------------------------- |
| `quality.visual_regression_enabled` | boolean | `true`  | 啟用截圖比較檢查。                                     |
| `quality.visual_diff_threshold`     | number  | `0.95`  | 視覺比較閾值，從 `0.0` 到 `1.0`。                      |
| `quality.a11y_audit_level`          | enum    | `basic` | 無障礙審查深度：`none`、`basic` 或 `full`。            |

#### DevOps

| 設定                              | 類型    | 預設值         | 說明                                         |
| :-------------------------------- | :------ | :------------- | :------------------------------------------- |
| `devops.approval_required_for`    | enum[]  | `[production]` | 需要明確核准的環境。                         |
| `devops.auto_rollback_on_failure` | boolean | `false`        | 部署失敗後嘗試回滾。                         |

#### Testing

| 設定                            | 類型    | 預設值  | 說明                                               |
| :------------------------------ | :------ | :------ | :------------------------------------------------- |
| `testing.screenshot_on_failure` | boolean | `true`  | 瀏覽器/UI 測試失敗時擷取截圖。                     |

完整帶注解的預設檔案可在 [`.gem-team.yaml`](.gem-team.yaml) 取得。

## 操作注意事項

- 建議團隊使用專案範圍安裝，以便 `apm.yml` 和 `apm.lock.yaml` 使設定可重現。
- 將 `apm_modules/` 排除在 git 之外；它是安裝快取。
- 使用 `#vX.Y.Z` 固定發佈版本，以確保穩定的 CI 和團隊上線流程。
- 在發佈前和 CI 中執行 `apm audit`。
- 在提交大型更新前審查已產生的檔案。
- 將 DevOps、生產環境部署、資料遷移和破壞性操作視為需要核准閘門的任務。
- 將專案規則保存在 `AGENTS.md` 中；將任務特定的上下文保存在 `docs/plan/{plan_id}/` 中。

## 貢獻

歡迎貢獻。開啟 pull request 前，請先閱讀 [CONTRIBUTING.md](./CONTRIBUTING.md)。

建議的貢獻流程：

1. 開啟或選擇一個議題。
2. 建立一個專注的分支。
3. 保持變更的小型且可審查性。
4. 在相關處新增或更新測試/文件。
5. 開啟 PR 前執行驗證。

## 授權條款

Gem Team 依 [Apache License 2.0](./LICENSE) 授權。

## 支援

若您遇到錯誤或有功能請求，請[開啟議題](https://github.com/mubaidr/gem-team/issues)。
