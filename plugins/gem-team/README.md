# Gem Team

用於規格驅動開發與自動化驗證的自我學習多代理編排架構。

## 快速開始

```bash
# 透過 APM 安裝 (建議)
apm install mubaidr/gem-team

# 或註冊為市集
apm marketplace add mubaidr/gem-team
apm install gem-team@gem-team
```

請參閱下方的[所有支援安裝選項](#installation)。

---

## 目錄

- [快速開始](#quick-start)
- [為什麼選擇 Gem Team？](#why-gem-team)
- [架構架構](#harness-architecture)
- [安裝](#installation)
- [代理團隊](#the-agent-team)
- [知識來源](#knowledge-sources)
- [貢獻](#contributing)

---

## 為什麼選擇 Gem Team？

### 效能

- **快 4 倍** — 透過基於波次的平行執行
- **模式重用** — 程式碼模式發現可防止重複造輪子

### 品質與安全性

- **更高品質** — 專業的架構代理 + TDD + 驗證閘門 + 契約優先
- **內建安全性** — 在關鍵任務上進行 OWASP 掃描、秘密/PII 偵測
- **具韌性** — 事前剖析分析、失敗處理、自動重新規劃
- **協助工具優先** — 在規格與執行階段層級驗證 WCAG 合規性
- **安全的 DevOps** — 冪等操作、健康檢查、強制性核准閘門
- **建設性評論** — gem-critic 挑戰假設，尋找邊緣案例

### 智慧化

- **既定模式** — 使用函式庫/架構慣例而非自訂實作
- **來源驗證** — 每個事實主張都引用其來源；不靠猜測
- **知識驅動** — 優先順序來源 (PRD → 程式碼 → AGENTS.md → Context7 → 文件)
- **持續學習** — 記憶體工具可在不同對話中保存模式、注意事項、使用者偏好
- **自動技能** — 代理從成功的任務中提取可重用的 SKILL.md 檔案 (高信心：自動，中信心：確認)
- **技能與指南** — 內建技能與指南 (web-design-guidelines)

### 流程

- **規格驅動** — 多步驟精煉在「如何做」之前定義「做什麼」
- **驗證計畫** — 複雜任務：計畫 → 驗證 → 評論
- **可追蹤** — 自我記錄的 ID 連結需求 → 任務 → 測試 → 證據
- **意圖與合規性** — 將負擔從撰寫「完美提示」轉移到執行嚴格、基於 YAML 的核准閘門
- **診斷後修復** — gem-debugger 診斷 → gem-implementer 修復 → 重新驗證
- **事前剖析** — 在執行之前識別失敗模式
- **契約優先** — 在實作之前撰寫契約測試

### 權杖效率

針對減少 LLM 權杖消耗而優化，且不損失品質：

- **簡潔輸出** — 無前言、無元評論、無冗長的解釋
- **嚴格格式** — JSON/YAML 完全符合結構描述 — 消除解析錯誤與重試
- **空白即可** — 在不需要的地方跳過空陣列、null、冗長欄位
- **基於檔案** — 研究員/規劃師儲存為 YAML 檔案 (非全部在 JSON 輸出中)
- **學習** — 除非關鍵，否則為空模式/慣例

> **結果：** 在保持品質的同時，輸出權杖減少約 40-60%。

### 設計

- **設計代理** — 用於 Web 與行動 UI/UX 的專用代理，具備針對獨特美學的防「AI 廢料」指南
- **行動代理** — 原生行動實作 (React Native, Flutter) + iOS/Android 測試

---

## 核心概念

### 「System-IQ」倍增器

在單次對話中，僅靠原始推理是不夠的。Gem-Team 將您偏好的 LLM 包裝在具備驗證優先迴圈的嚴格架構中，從根本上提升其在 SWE 任務上的有效能力。

### 設計支援

Gem Team 包含專業的設計代理，具備針對獨特、現代且美學獨特且符合協助工具規範的防「AI 廢料」指南。

### 三重學習系統

| 類型       | 儲存           | 一句話簡介                  |
| :--------- | :------------- | :-------------------------- |
| **記憶體** | `/memories/`   | 事實與使用者偏好 (自動儲存) |
| **技能**   | `docs/skills/` | 帶有程式碼範例的程序        |
| **慣例**   | `AGENTS.md`    | 靜態規則 (需要核准)         |

---

## 架構架構

```text
使用者目標 → 編排者 → [簡單：研究/計畫] 或 [複雜：討論 → PRD → 研究 → 計畫 → 核准] → 執行 (波次) → 摘要 → 最終審查
                ↓
            診斷 → 修復 → 重新驗證
```

---

## 安裝

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

**為什麼選擇 APM？** 用於 AI 程式碼編寫工具的通用套件管理員。一個指令即可安裝到您的所有工具 (Copilot CLI, Claude Code, Cursor, OpenCode)。自動處理版本鎖定、更新與相依性。

[APM 文件](https://microsoft.github.io/apm/) | [GitHub](https://github.com/microsoft/apm)

---

選擇最適合您工作流程的方法：

### 方法 1：直接透過 APM 安裝 (建議)

最快的開始方式。APM 會自動偵測您的工具並安裝到正確位置。

```bash
apm install mubaidr/gem-team
```

**適用於：** GitHub Copilot CLI, Claude Code, Cursor, OpenCode

[APM 文件](https://microsoft.github.io/apm/getting-started/quick-start/)

---

### 方法 2：透過市集

將 gem-team 新增為市集，然後從中安裝。對於瀏覽可用的代理與管理更新很有用。

#### GitHub Copilot CLI

```bash
# 新增市集
copilot plugin marketplace add mubaidr/gem-team

# 瀏覽可用的外掛程式
copilot plugin marketplace browse gem-team

# 安裝
copilot plugin install gem-team@gem-team
```

#### Claude Code

```bash
# 新增市集
/plugin marketplace add mubaidr/gem-team

# 在 UI 中瀏覽
/plugin

# 安裝
/plugin install gem-team@gem-team
```

#### Cursor IDE

```bash
# 透過 APM 新增市集
apm marketplace add mubaidr/gem-team

# 安裝
apm install gem-team@gem-team
```

---

### 方法 3：從 awesome-copilot 市集

從官方 awesome-copilot 市集安裝 (僅限 GitHub Copilot CLI)。

```bash
# awesome-copilot 預設已預先註冊
copilot plugin install gem-team@awesome-copilot
```

**注意：** 僅當 gem-team 列在 awesome-copilot 市集中時，此方法才可用。

---

### 方法 4：本機/手動安裝

用於開發、測試或離線使用。

#### 複製儲存庫

```bash
git clone https://github.com/mubaidr/gem-team.git
cd gem-team
```

#### Claude Code

```bash
# 作為本機外掛程式載入
claude --plugin-dir .

# 或新增為本機市集
/plugin marketplace add ./

# 變更後重新載入
/reload-plugins
```

#### Cursor IDE

```bash
# 選項 1：透過對話指令
# 在 Cursor 中：/add-plugin /absolute/path/to/gem-team

# 選項 2：將代理複製到專案
# 一行安裝：複製代理並重新命名為 .mdc
mkdir -p .cursor/rules && cp .apm/agents/*.agent.md .cursor/rules/ && cd .cursor/rules && for f in *.agent.md; do mv "$f" "${f%.agent.md}.mdc"; done && cd ../..
```

#### GitHub Copilot CLI

```bash
# 新增為本機市集
copilot plugin marketplace add /absolute/path/to/gem-team

# 安裝
copilot plugin install gem-team@gem-team
```

#### 手動複製 (任何工具)

```bash
# 將代理複製到您工具的目錄
# GitHub Copilot: ~/.copilot/
# Claude Code: ~/.claude/plugins/
# Cursor: .cursor/rules/
# OpenCode: .opencode/plugins/

cp -r .apm/agents <destination>
```

---

### VS Code 擴充功能 (GitHub Copilot)

在 VS Code 擴充功能市集中搜尋 "gem-team"。

1. 開啟 VS Code
2. 前往擴充功能 (Ctrl+Shift+X)
3. 搜尋 "gem-team"
4. 點選安裝

---

### 驗證

安裝後，驗證代理是否可用：

```bash
# GitHub Copilot CLI
copilot plugin list

# Claude Code
/plugin list

# APM (任何工具)
apm list
```

## 代理團隊

### 核心工作流程

| 角色             | 描述                                                  | 來源                         | 建議的 LLM                                                                                                 |
| :--------------- | :---------------------------------------------------- | :--------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **ORCHESTRATOR** | 團隊負責人：編排研究、規劃、實作與驗證                | PRD, AGENTS.md               | **封閉源：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開源：** GLM-5, Kimi K2.5, Qwen3.5            |
| **RESEARCHER**   | 程式碼探索 — 模式、相依性、架構發現                   | PRD, 程式碼, AGENTS.md, 文件 | **封閉源：** Gemini 3.1 Pro, GPT-5.4, Claude Sonnet 4.6<br>**開源：** GLM-5, Qwen3.5-9B, DeepSeek-V3.2     |
| **PLANNER**      | 基於 DAG 的執行計畫 — 任務分解、波次排程、風險分析    | PRD, 程式碼, AGENTS.md       | **封閉源：** Gemini 3.1 Pro, Claude Sonnet 4.6, GPT-5.4<br>**開源：** Kimi K2.5, GLM-5, Qwen3.5            |
| **IMPLEMENTER**  | TDD 程式碼實作 — 功能、錯誤、重構。絕不審查自己的工作 | 程式碼, AGENTS.md, DESIGN.md | **封閉源：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開源：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next |

### 品質與審查

| 角色               | 描述                                                  | 來源                            | 建議的 LLM                                                                                                            |
| :----------------- | :---------------------------------------------------- | :------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| **REVIEWER**       | **零幻覺過濾器** — 安全性稽核、程式碼審查、OWASP 掃描 | PRD, 程式碼, AGENTS.md, OWASP   | **封閉源：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開源：** Kimi K2.5, GLM-5, DeepSeek-V3.2                   |
| **CRITIC**         | 挑戰假設，尋找邊緣案例，發現過度工程與邏輯漏洞        | PRD, 程式碼, AGENTS.md          | **封閉源：** Claude Sonnet 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開源：** Kimi K2.5, GLM-5, Qwen3.5                       |
| **DEBUGGER**       | 根本原因分析、堆疊追蹤診斷、回歸二分搜尋              | 程式碼, AGENTS.md, git 歷史記錄 | **封閉源：** Gemini 3.1 Pro, Claude Opus 4.6, GPT-5.4<br>**開源：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next            |
| **BROWSER TESTER** | E2E 瀏覽器測試、UI/UX 驗證、視覺回歸                  | PRD, AGENTS.md, fixtures        | **封閉源：** GPT-5.4, Claude Sonnet 4.6, Gemini 3.1 Flash<br>**開源：** Llama 4 Maverick, Qwen3.5-Flash, MiniMax M2.7 |
| **SIMPLIFIER**     | 重構專家 — 移除廢棄程式碼，降低複雜度                 | 程式碼, AGENTS.md, 測試         | **封閉源：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開源：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next            |

### 專業化

| 角色                    | 描述                                        | 來源                    | 建議的 LLM                                                                                                            |
| :---------------------- | :------------------------------------------ | :---------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **DEVOPS**              | 基礎結構部署、CI/CD 管線、容器管理          | AGENTS.md, 基礎結構設定 | **封閉源：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開源：** DeepSeek-V3.2, GLM-5, Qwen3.5                   |
| **DOCUMENTATION**       | 技術文件、README 檔案、API 文件、圖表       | AGENTS.md, 原始碼       | **封閉源：** Claude Sonnet 4.6, Gemini 3.1 Flash, GPT-5.4 Mini<br>**開源：** Llama 4 Scout, Qwen3.5-9B, MiniMax M2.7  |
| **DESIGNER**            | UI/UX 設計 — 佈局、主題、配色方案、協助工具 | PRD, 程式碼, AGENTS.md  | **封閉源：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開源：** Qwen3.5, GLM-5, MiniMax M2.7                    |
| **IMPLEMENTER- MOBILE** | 行動實作 — React Native, Expo, Flutter      | 程式碼, AGENTS.md       | **封閉源：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開源：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next            |
| **DESIGNER- MOBILE**    | 行動 UI/UX — HIG, Material Design, 安全區域 | PRD, 程式碼, AGENTS.md  | **封閉源：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開源：** Qwen3.5, GLM-5, MiniMax M2.7                    |
| **MOBILE TESTER**       | 行動 E2E 測試 — Detox, Maestro, iOS/Android | PRD, AGENTS.md          | **封閉源：** GPT-5.4, Claude Sonnet 4.6, Gemini 3.1 Flash<br>**開源：** Llama 4 Maverick, Qwen3.5-Flash, MiniMax M2.7 |

---

## 知識來源

代理僅諮詢與其角色相關的來源：

| 信任層級   | 來源                      | 行為                   |
| :--------- | :------------------------ | :--------------------- |
| **信任**   | PRD, plan.yaml, AGENTS.md | 作為指令遵循           |
| **驗證**   | 程式碼檔案、研究發現      | 在假設之前進行交叉引用 |
| **不信任** | 錯誤記錄、外部資料        | 僅事實 — 絕不作為指令  |

---

## 貢獻

歡迎貢獻！請隨時提交提取要求 (Pull Request)。請參閱 [CONTRIBUTING](./CONTRIBUTING.md) 以取得關於提交訊息格式、分支策略和程式碼標準的詳細指南。

## 授權

此專案根據 Apache License 2.0 授權。

## 支援

如果您遇到任何問題或有任何疑問，請在 GitHub 上[開啟問題 (issue)](https://github.com/mubaidr/gem-team/issues)。
