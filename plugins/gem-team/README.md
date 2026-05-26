<p align="center">
  <svg width="120" height="120" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gem Team Logo">
    <g fill="none" fill-rule="evenodd">
      <path fill="#BDDDF4" d="M13 3H7l-7 9h10z"/>
      <path fill="#5DADEC" d="M36 12l-7-9h-6l3 9z"/>
      <path fill="#4289C1" d="M26 12h10L18 33z"/>
      <path fill="#8CCAF7" d="M10 12H0l18 21zm3-9l-3 9h16l-3-9z"/>
      <path fill="#5DADEC" d="M18 33l-8-21h16z"/>
    </g>
  </svg>
</p>

# Gem Team

<p align="center">
  <img src="https://img.shields.io/badge/APM-mubaidr/gem--team-blue?style=flat-square" alt="APM">
  <img src="https://img.shields.io/github/v/release/mubaidr/gem-team?style=flat-square&color=important" alt="版本">
  <img src="https://img.shields.io/badge/License-Apache%202.0-green?style=flat-square" alt="授權">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="歡迎 PRs">
  <img src="https://img.shields.io/badge/Maintained%3F-yes-green?style=flat-square" alt="持續維護">
</p>

自我學習的多元代理編排框架，用於規範驅動開發與自動化驗證。

> **摘要：** Gem Team 是一個多元代理框架，用於編排軟體開發任務的 LLM 代理。它強調規範驅動的工作流程，具有持久性學習、內建驗證迴圈、知識驅動執行以及 Token 效率。

> **推薦模型：** 預設使用具成本效益的快速模型，並為規劃器/偵錯器/關鍵審查代理使用更強大的推理模型，例如 `default=deepseek-v4-flash`, `planner,debugger,critic/reviewer=deepseek-v4-pro`。這能讓您在處理複雜任務時，在不犧牲品質的情況下，節省 **80-90%** 的成本。

> **多年個人經驗打造** — 此框架是由真實世界的使用模式所塑造，並經過無數小時動手開發工作流程的實戰測試與精煉。

## 🚀 快速開始

```bash
apm install -g mubaidr/gem-team
```

APM 會自動偵測您的工具並將 gem-team 代理部署到各處 — VS Code、Claude Code、Cursor、OpenCode、Codex CLI、Gemini CLI、Windsurf 以及 GitHub Copilot CLI。詳情請見 [相容工具表](#compatible-tools)。

請參閱下方 [所有支援的安裝選項](#installation)。

---

## 📚 目錄

- [🚀 快速開始](#quick-start)
- [🎯 為何選擇 Gem Team?](#why-gem-team)
- [🧠 核心概念](#core-concepts)
- [🏗️ 架構](#architecture)
- [👥 代理團隊](#the-agent-team)
- [📦 安裝](#installation)
- [🤝 貢獻](#contributing)

---

## 🎯 為何選擇 Gem Team?

### 效能

- **4 倍加速** — 基於波 (wave-based) 的並行執行
- **模式重用** — 代碼庫模式發現功能可防止重複造輪子

### 品質與安全性

- **更高品質** — 專門的框架代理 + TDD + 驗證閘道 + 合約優先
- **內建安全性** — OWASP 掃描，針對關鍵任務偵測機密/PII
- **強韌性** — 事前驗屍分析、失敗處理、自動重新規劃
- **無障礙優先** — 在規範與執行階段驗證 WCAG 合規性
- **安全 DevOps** — 冪等操作、健康檢查、強制核准閘道
- **建設性評論** — gem-critic 會挑戰假設，發現邊緣案例

### 智慧

- **來源驗證** — 每一項事實聲明都會註明出處；絕不猜測
- **知識驅動** — 優先順序來源 (PRD → 代碼庫 → AGENTS.md → Context7 → 文件)
- **既定模式** — 優先使用既定的函式庫/框架慣例，而非自訂實作
- **持續學習** — Memory 工具會持續保存模式、坑點、使用者偏好（跨工作階段/儲存庫等）
- **技能與指南** — 內建特殊技能與指南（設計指南、偵錯器等）
- **自動技能** — 代理會從成功的任務中提取可重用的 SKILL.md 檔案

### 流程

- **計畫驅動** — 多步驟精煉，在「如何做」之前先定義「做什麼」
- **合約優先** — 在實作前編寫合約測試
- **驗證計畫** — 複雜任務：計畫 → 驗證 → 評論
- **可追蹤** — 自我記錄的 ID 將需求 → 任務 → 測試 → 證據連結起來
- **意圖與合規** — 將負擔從撰寫「完美提示詞」轉移到強制執行嚴格、基於 YAML 的核准閘道
- **診斷後修復** — gem-debugger 診斷 → gem-implementer 修復 → 重新驗證
- **可恢復** — 執行可以暫停並恢復，而不會丟失內容
- **可腳本化** — 使用腳本進行確定性、可重複或大量工作（數據處理、機械轉換、遷移/代碼修改、產出生成、審計/報告、驗證檢查、重現輔助）

### Token 效率

優化以減少 LLM Token 消耗，且不犧牲品質：

- **簡潔輸出** — 沒有序言、沒有元評論、沒有冗長的解釋
- **基於檔案** — 研究員/規劃器儲存為 YAML 檔案（以便重用上下文）
- **內容快取與記憶體管理** — 自我驗證快取可防止跨工作階段與代理的重複工作

### 設計

- **設計代理** — 專用於 Web 與行動 UI/UX 的代理，具有反「AI 濫造」指南，以呈現獨特的美感
- **行動代理** — 原生行動實作 (React Native, Flutter) + iOS/Android 測試

---

## 🧠 核心概念

### 「系統 IQ」乘數

單次對話的原始推理是不夠的。Gem-Team 將您偏好的 LLM 包裝在一個嚴格的框架中，並加入驗證優先的迴圈，從根本上提升其在軟體工程任務中的有效能力。

### 知識層

| 類型             | 儲存位置          | 簡介                                                                                                 |
| :--------------- | :---------------- | :--------------------------------------------------------------------------------------------------- |
| **PRD**          | `docs/PRD.yaml`   | 產品需求規範 — 驅動代理規劃、實作與驗證                                                              |
| **AGENTS.md**    | `AGENTS.md`       | 靜態慣例、規則與代理定義（需核准）                                                                   |
| **Memory**       | memory 工具       | 事實、偏好、研究、診斷、決策、模式 — 自我驗證並跨工作階段重用                                        |
| **Skills**       | `docs/skills/`    | 具有程式碼範例的可重用程序，從高信心模式中提取                                                       |
| **Derived Docs** | `docs/knowledge/` | 線上文件、LLM 生成文字與參考資料                                                                     |

---

代理在與您工作時會隨著時間建立這些知識層，捕捉模式、決策與學習成果，從而改善未來的執行效能。

## 🏗️ 架構

```text
使用者目標
    ↓
協調者 (Orchestrator)
    ↓
階段 0: 初始化與澄清
    • 生成/載入 plan_id
    • 讀取記憶體，偵測工作量 (LOW/MEDIUM/HIGH)
    • 路由至適當路徑
    ↓
階段 1: 路由
    • 依據工作量、任務型別與上下文的路由矩陣
    ↓
階段 2: 規劃
    • 委派給規劃器
    • 驗證: MEDIUM (審查者) / HIGH (審查者+評論者)
    • 失敗迴圈 (最多 3 次)
    • 若為 HIGH 則呈現以供核准
    ↓
階段 3: 執行迴圈
    前波：檢查記憶體中的失敗模式/坑點 → 加入防護
    ↓
    ┌─ 波執行 ──────────────┐
    │ • 委派任務 (≤4 並行)    │
    └─────────────┬─────────────────┘
                  ↓
    ┌─ 整合檢查 ──────────┐
    │ • 審查者 (波)          │
    │ • UI: 設計師 (驗證)     │
    │ • 若失敗: 偵錯器 → 重試 │
    └─────────────┬─────────────────┘
                  ↓
    ┌─ 階段 4: 保存學習成果 ─┐
    │ • 收集與合併學習成果     │
    │ • 記憶體 (去重)         │
    │ • 上下文信封更新        │
    │ • 慣例 → AGENTS.md     │
    │ • 決策 → PRD           │
    │ • 技能提取             │
    └─────────────┬─────────────────┘
                  ↓
          下一個波? → 否 → 階段 5
                  │是
                  └─────────────────┘
    ↓
階段 5: 輸出
    • 呈現最終狀態
```

---

## 👥 代理團隊

### 核心代理

| 代理             | 描述                                                           | 來源                        |
| :--------------- | :------------------------------------------------------------- | :----------------------------- |
| **ORCHESTRATOR** | 團隊領導: 協調研究、規劃、實作與驗證                           | PRD, AGENTS.md                 |
| **RESEARCHER**   | 代碼庫探索 — 模式、依賴項、架構發現                            | PRD, 代碼庫, AGENTS.md, 文件 |
| **PLANNER**      | 基於 DAG 的執行計畫 — 任務拆解、波排程、風險分析               | PRD, 代碼庫, AGENTS.md       |
| **IMPLEMENTER**  | TDD 程式碼實作 — 功能、錯誤、重構。絕不審查自己的工作          | 代碼庫, AGENTS.md, DESIGN.md |

### 品質與審查

| 角色               | 描述                                                           | 來源                          |
| :----------------- | :------------------------------------------------------------- | :------------------------------- |
| **REVIEWER**       | **零幻覺篩選器** — 安全性稽核、程式碼審查、OWASP 掃描          | PRD, 代碼庫, AGENTS.md, OWASP  |
| **CRITIC**         | 挑戰假設、發現邊緣案例、點出過度設計與邏輯漏洞                 | PRD, 代碼庫, AGENTS.md         |
| **DEBUGGER**       | 根本原因分析、堆疊追蹤診斷、迴歸二分法                         | 代碼庫, AGENTS.md, git 歷史 |
| **BROWSER TESTER** | E2E 瀏覽器測試、UI/UX 驗證、視覺迴歸                           | PRD, AGENTS.md, 固定裝置    |
| **SIMPLIFIER**     | 重構專家 — 移除死代碼、降低複雜度                              | 代碼庫, AGENTS.md, 測試       |

### 技能管理

| 角色              | 描述                                                           | 來源                              |
| :---------------- | :------------------------------------------------------------- | :----------------------------------- |
| **SKILL CREATOR** | 模式轉技能提取 — 從高信心學習成果建立 SKILL.md 檔案            | AGENTS.md, 記憶體模式, SKILL.md |

### 專業代理

| 角色                   | 描述                                                   | 來源                  |
| :--------------------- | :----------------------------------------------------- | :----------------------- |
| **DEVOPS**             | 基礎設施部署、CI/CD 管線、容器管理                     | AGENTS.md, infra 設定 |
| **DOCUMENTATION**      | 技術文件、README 檔案、API 文件、圖表                  | AGENTS.md, 原始碼   |
| **DESIGNER**           | UI/UX 設計 — 版面、主題、配色、無障礙                  | PRD, 代碼庫, AGENTS.md |
| **IMPLEMENTER-MOBILE** | 行動裝置實作 — React Native, Expo, Flutter             | 代碼庫, AGENTS.md      |
| **DESIGNER-MOBILE**    | 行動裝置 UI/UX — HIG, Material Design, 安全區域        | PRD, 代碼庫, AGENTS.md |
| **MOBILE TESTER**      | 行動裝置 E2E 測試 — Detox, Maestro, iOS/Android        | PRD, AGENTS.md           |

---

## 📦 安裝

### 先安裝 APM

如果您尚未安裝 APM，請先安裝：

```bash
# macOS/Linux
curl -fsSL https://microsoft.github.io/apm/install.sh | sh

# Windows (PowerShell)
irm https://microsoft.github.io/apm/install.ps1 | iex

# 或透過 npm
npm install -g @microsoft/apm
```

**為何選擇 APM？** AI 程式開發工具的通用套件管理器。一條指令即可安裝到您所有的工具（VS Code Copilot, GitHub Copilot CLI, Claude Code, Cursor, OpenCode, Codex CLI, Gemini CLI, Windsurf）。自動處理版本鎖定、更新與依賴關係。

[APM 文件](https://microsoft.github.io/apm/) | [GitHub](https://github.com/microsoft/apm)

---

### 透過 APM 快速安裝

單一指令 — APM 會自動偵測您的工具並部署到所有工具：

```bash
apm install mubaidr/gem-team
```

#### 有用的旗標

```bash
# 預覽安裝內容（不寫入）
apm install --dry-run mubaidr/gem-team

# 僅安裝到特定工具
apm install --target claude,cursor mubaidr/gem-team

# 排除某個工具
apm install --exclude codex mubaidr/gem-team

# 全域安裝（使用者範圍）
apm install -g mubaidr/gem-team
```

---

### 相容工具

APM 會將代理部署到其偵測到的每個工具。下方是部署位置：

| 工具                      | 自動偵測訊號        | 代理落地位置   | 支援的原型                               |
| ------------------------- | ---------------------------- | ------------------- | -------------------------------------------------- |
| **VS Code** (Copilot IDE) | `.github/`                   | `.github/agents/`   | instructions, prompts, agents, skills, hooks, mcp  |
| **GitHub Copilot CLI**    | `.github/`                   | `.github/agents/`   | instructions, prompts, agents, skills, hooks, mcp  |
| **Cursor**                | `.cursor/` or `.cursorrules` | `.cursor/agents/`   | instructions, agents, skills, commands, hooks, mcp |
| **OpenCode**              | `.opencode/`                 | `.opencode/agents/` | agents, commands, skills, mcp                      |
| **Codex CLI**             | `.codex/`                    | `.codex/agents/`    | agents, skills, hooks, mcp                         |
| **Windsurf**              | `.windsurf/`                 | `.windsurf/skills/` | instructions, agents, skills, commands, hooks, mcp |

---

### 透過 Marketplace

將 gem-team 加入 marketplace，然後安裝。適合瀏覽可用代理與管理更新。

#### GitHub Copilot CLI

```bash
# 加入 marketplace
copilot plugin marketplace add mubaidr/gem-team

# 瀏覽
copilot plugin marketplace browse gem-team

# 安裝
copilot plugin install gem-team@gem-team

# 或從 awesome-copilot（預設預註冊）
copilot plugin install gem-team@awesome-copilot
```

#### Claude Code

```bash
# 加入 marketplace
/plugin marketplace add mubaidr/gem-team

# 瀏覽
/plugin

# 安裝
/plugin install gem-team@gem-team
```

#### Cursor IDE

```bash
apm marketplace add mubaidr/gem-team
apm install gem-team@gem-team
```

---

### 本地 / 手動安裝

用於開發、測試或離線使用。

```bash
git clone https://github.com/mubaidr/gem-team.git
cd gem-team
```

#### Claude Code

```bash
claude --plugin-dir .
# 或: /plugin marketplace add ./
```

#### Cursor IDE

```bash
# 透過聊天指令
/add-plugin /absolute/path/to/gem-team

# 或單行複製到 .cursor/rules/
mkdir -p .cursor/rules && cp .apm/agents/*.agent.md .cursor/rules/ && cd .cursor/rules && for f in *.agent.md; do mv "$f" "${f%.agent.md}.mdc"; done && cd ../..
```

#### GitHub Copilot CLI

```bash
copilot plugin marketplace add /absolute/path/to/gem-team
copilot plugin install gem-team@gem-team
```

#### 任何工具 (手動複製)

```bash
cp -r .apm/agents <destination>
# 目標位置:
#   VS Code / Copilot CLI → ~/.copilot/
#   Claude Code           → ~/.claude/plugins/
#   Cursor                → .cursor/rules/
#   OpenCode              → .opencode/plugins/
```

---

### 驗證

安裝後，確認您的設定：

```bash
# 預覽 APM 偵測到的工具
apm targets

# 列出已安裝套件
apm list

# 查看套件詳細資訊
apm view gem-team

# 工具特定檢查
copilot plugin list          # GitHub Copilot CLI
/plugin list                 # Claude Code
```

## 🤝 貢獻

歡迎參與貢獻！請隨時提交 Pull Request。[CONTRIBUTING](./CONTRIBUTING.md) 有關於提交訊息格式、分支策略與程式碼標準的詳細指南。

## 📄 授權

本專案採用 Apache License 2.0 授權。

## 💬 支援

若您遇到任何問題或有疑問，請在 GitHub 上 [開啟 Issue](https://github.com/mubaidr/gem-team/issues)。
