# Gem Team

用於規格驅動開發與自動驗證的自學習多代理程式協調框架。

[![Support Me](https://img.shields.io/badge/patreon-000000?logo=patreon&logoColor=FFFFFF&style=flat)](https://patreon.com/mubaidr)

## 快速開始

請參閱下方的[所有支援的安裝選項](#安裝)。

---

## 目錄

- [快速開始](#快速開始)
- [為什麼選擇 Gem Team？](#為什麼選擇-gem-team)
- [框架架構](#框架架構)
- [安裝](#安裝)
- [代理程式團隊](#代理程式團隊)
- [知識來源](#知識來源)
- [貢獻](#貢獻)

---

## 為什麼選擇 Gem Team？

### 效能

- **快 4 倍** — 透過基於波次的平行執行
- **模式重複使用** — 程式碼庫模式探索，防止重複造輪子

### 品質與安全

- **更高品質** — 特化框架代理程式 + TDD + 驗證閘道 + 契約優先
- **內建安全** — 對關鍵任務進行 OWASP 掃描、秘密/PII 偵測
- **具備韌性** — 事前剖析分析、失敗處理、自動重新規劃
- **無障礙優先** — 在規格和執行階段層驗證 WCAG 合規性
- **安全維運** — 等冪操作、健全狀況檢查、強制性核准閘道
- **建設性批判** — gem-critic 挑戰假設，尋找邊緣案例

### 智慧

- **既定模式** — 優先使用函式庫/框架慣例，而非自定義實作
- **來源驗證** — 每項事實主張都引用其來源；無須臆測
- **知識驅動** — 優先順序來源 (PRD → 程式碼庫 → AGENTS.md → Context7 → 文件)
- **持續學習** — 記憶工具可在不同工作階段中持久保存模式、注意事項和使用者偏好
- **自動技能** — 代理程式從成功任務中提取可重複使用的 SKILL.md 檔案 (高信賴度：自動，中信賴度：確認)
- **技能與指引** — 內建技能與指引 (web-design-guidelines)

### 流程

- **規格驅動** — 多步驟精煉在「如何做」之前定義「做什麼」
- **驗證計劃** — 複雜任務：計劃 → 驗證 → 批判
- **可追溯性** — 自我說明 ID 連結需求 → 任務 → 測試 → 證據
- **意圖 vs. 合規性** — 將負擔從撰寫「完美提示」轉移到執行嚴格的、基於 YAML 的核准閘道
- **診斷後修復** — gem-debugger 診斷 → gem-implementer 修復 → 重新驗證
- **事前剖析** — 在執行之前識別失敗模式
- **契約優先** — 在實作之前撰寫契約測試

### Token 效率

針對降低 LLM token 消耗進行最佳化，且不損失品質：

- **精簡輸出** — 無前言、無元評論、無冗長解釋
- **嚴格格式** — 完全符合結構的 JSON/YAML — 消除解析錯誤和重試
- **空白即可** — 在不需要的地方跳過空陣列、null 和冗長欄位
- **基於檔案** — Researcher/Planner 儲存為 YAML 檔案 (不全在 JSON 輸出中)
- **學習成果** — 除非關鍵，否則不顯示模式/慣例

> **結果：** 在維持品質的同時，減少約 40-60% 的輸出 token。

### 設計

- **設計代理程式** — 專為網頁和行動 UI/UX 打造的特化代理程式，具備反「AI 廢料」指引，以呈現獨特的美學
- **行動代理程式** — 原生行動實作 (React Native, Flutter) + iOS/Android 測試

---

## 核心概念

### 「系統智商」倍增器

單次對話中的原始推理是不夠的。Gem-Team 將您偏好的 LLM 封裝在一個嚴格的、驗證優先的框架中，從根本上提升其在軟體工程 (SWE) 任務中的有效能力。

### 設計支援

Gem Team 包含專門的設計代理程式，具備反「AI 廢料」指引，以打造獨特且現代的美學，並符合無障礙規範。

### 三重學習系統

| 類型 | 儲存位置 | 一句話簡介 |
| :-------------- | :------------- | :------------------------------------ |
| **記憶體** | `/memories/` | 事實與使用者偏好 (自動儲存) |
| **技能** | `docs/skills/` | 附有程式碼範例的程序 |
| **慣例** | `AGENTS.md` | 靜態規則 (需要核准) |

---

## 框架架構

```text
使用者目標 → Orchestrator → [簡單：研究/規劃] 或 [複雜：討論 → PRD → 研究 → 規劃 → 核准] → 執行 (波次) → 摘要 → 最終檢閱
                ↓
            診斷 → 修復 → 重新驗證
```

---

## 安裝

| 方法 | 指令 / 連結 | 文件 |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **Code** | **[立即安裝](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%253A%252F%252Fraw.githubusercontent.com%252Fgithub%252Fawesome-copilot%252Fmain%252F.agents)** | [Copilot 文件](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-chat) |
| **Code Insiders** | **[立即安裝](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%253A%252F%252Fraw.githubusercontent.com%252Fgithub%252Fawesome-copilot%252Fmain%252F.agents)** | [Copilot 文件](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-chat) |
| **APM <br/> (所有 AI 程式碼編寫代理程式)** | `apm install mubaidr/gem-team` | [APM 文件](https://microsoft.github.io/apm/) |
| **Copilot CLI (Marketplace)** | `copilot plugin install gem-team@awesome-copilot` | [CLI 文件](https://github.com/github/copilot-cli) |
| **Copilot CLI (直接)** | `copilot plugin install gem-team@mubaidr` | [CLI 文件](https://github.com/github/copilot-cli) |
| **Windsurf** | `codeium agent install mubaidr/gem-team` | [Windsurf 文件](https://docs.codeium.com/windsurf) |
| **Claude Code** | `claude plugin install mubaidr/gem-team` | [Claude 文件](https://docs.anthropic.com/en/docs/claude-code) |
| **OpenCode** | `opencode plugin install mubaidr/gem-team` | [OpenCode 文件](https://opencode.ai/docs/) |
| **手動 <br/> (複製代理程式檔案)** | VS Code: `~/.vscode/agents/` <br/> VS Code Insiders: `~/.vscode- insiders/agents/` <br/> GitHub Copilot: `~/.github/copilot/agents/` <br/> GitHub Copilot (專案): `.github/plugin/agents/` <br/> Windsurf: `~/.windsurf/agents/` <br/> Claude: `~/.claude/agents/` <br/> Cursor: `~/.cursor/agents/` <br/> OpenCode: `~/.opencode/agents/` | — |

---

## 代理程式團隊

### 核心工作流程

| 角色 | 描述 | 來源 | 推薦的 LLM |
| :--------------- | :------------------------------------------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **ORCHESTRATOR** | 團隊負責人：協調研究、規劃、實作和驗證 | PRD, AGENTS.md | **封閉原始碼：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開放原始碼：** GLM-5, Kimi K2.5, Qwen3.5 |
| **RESEARCHER** | 程式碼庫探索 — 發現模式、相依性、架構 | PRD, 程式碼庫, AGENTS.md, 文件 | **封閉原始碼：** Gemini 3.1 Pro, GPT-5.4, Claude Sonnet 4.6<br>**開放原始碼：** GLM-5, Qwen3.5-9B, DeepSeek-V3.2 |
| **PLANNER** | 基於 DAG 的執行計劃 — 任務分解、波次排程、風險分析 | PRD, 程式碼庫, AGENTS.md | **封閉原始碼：** Gemini 3.1 Pro, Claude Sonnet 4.6, GPT-5.4<br>**開放原始碼：** Kimi K2.5, GLM-5, Qwen3.5 |
| **IMPLEMENTER** | TDD 程式碼實作 — 功能、錯誤、重構。絕不審查自己的工作 | 程式碼庫, AGENTS.md, DESIGN.md | **封閉原始碼：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開放原始碼：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next |

### 品質與審查

| 角色 | 描述 | 來源 | 推薦的 LLM |
| :----------------- | :------------------------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **REVIEWER** | **零幻覺過濾器** — 安全稽核、程式碼審查、OWASP 掃描 | PRD, 程式碼庫, AGENTS.md, OWASP | **封閉原始碼：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開放原始碼：** Kimi K2.5, GLM-5, DeepSeek-V3.2 |
| **CRITIC** | 挑戰假設、尋找邊緣案例、發現過度工程與邏輯漏洞 | PRD, 程式碼庫, AGENTS.md | **封閉原始碼：** Claude Sonnet 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開放原始碼：** Kimi K2.5, GLM-5, Qwen3.5 |
| **DEBUGGER** | 根本原因分析、堆疊追蹤診斷、回歸二分法 | 程式碼庫, AGENTS.md, git 歷史 | **封閉原始碼：** Gemini 3.1 Pro, Claude Opus 4.6, GPT-5.4<br>**開放原始碼：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next |
| **BROWSER TESTER** | E2E 瀏覽器測試、UI/UX 驗證、視覺回歸 | PRD, AGENTS.md, fixtures | **封閉原始碼：** GPT-5.4, Claude Sonnet 4.6, Gemini 3.1 Flash<br>**開放原始碼：** Llama 4 Maverick, Qwen3.5-Flash, MiniMax M2.7 |
| **SIMPLIFIER** | 重構專家 — 移除無用程式碼、降低複雜度 | 程式碼庫, AGENTS.md, 測試 | **封閉原始碼：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開放原始碼：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next |

### 特化代理程式

| 角色 | 描述 | 來源 | 推薦的 LLM |
| :---------------------- | :--------------------------------------------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **DEVOPS** | 基礎設施部署、CI/CD 流水線、容器管理 | AGENTS.md, 基礎設施配置 | **封閉原始碼：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開放原始碼：** DeepSeek-V3.2, GLM-5, Qwen3.5 |
| **DOCUMENTATION** | 技術文件、README 檔案、API 文件、圖表 | AGENTS.md, 原始碼 | **封閉原始碼：** Claude Sonnet 4.6, Gemini 3.1 Flash, GPT-5.4 Mini<br>**開放原始碼：** Llama 4 Scout, Qwen3.5-9B, MiniMax M2.7 |
| **DESIGNER** | UI/UX 設計 — 版面配置、佈景主題、配色方案、無障礙 | PRD, 程式碼庫, AGENTS.md | **封閉原始碼：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開放原始碼：** Qwen3.5, GLM-5, MiniMax M2.7 |
| **IMPLEMENTER- MOBILE** | 行動裝置實作 — React Native, Expo, Flutter | 程式碼庫, AGENTS.md | **封閉原始碼：** Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro<br>**開放原始碼：** DeepSeek-V3.2, GLM-5, Qwen3-Coder-Next |
| **DESIGNER- MOBILE** | 行動裝置 UI/UX — HIG, Material Design, 安全區域 | PRD, 程式碼庫, AGENTS.md | **封閉原始碼：** GPT-5.4, Gemini 3.1 Pro, Claude Sonnet 4.6<br>**開放原始碼：** Qwen3.5, GLM-5, MiniMax M2.7 |
| **MOBILE TESTER** | 行動裝置 E2E 測試 — Detox, Maestro, iOS/Android | PRD, AGENTS.md | **封閉原始碼：** GPT-5.4, Claude Sonnet 4.6, Gemini 3.1 Flash<br>**開放原始碼：** Llama 4 Maverick, Qwen3.5-Flash, MiniMax M2.7 |

---

## 知識來源

代理程式僅諮詢與其角色相關的來源：

| 信賴度等級 | 來源 | 行為 |
| :------------ | :-------------------------------- | :----------------------------------- |
| **受信任** | PRD, plan.yaml, AGENTS.md | 視為指令遵循 |
| **驗證** | 程式碼庫檔案、研究發現 | 在假設之前進行交叉引用 |
| **不信任** | 錯誤記錄檔、外部資料 | 僅供事實參考 — 絕不作為指令 |

---

## 貢獻

歡迎參與貢獻！請隨時提交 Pull Request。請參閱 [CONTRIBUTING](./CONTRIBUTING.md) 以瞭解關於提交訊息格式、分支策略和程式碼標準的詳細指引。

## 授權

此專案採用 Apache License 2.0 授權。

## 支援

如果您遇到任何問題或有疑問，請在 GitHub 上[開啟 Issue](https://github.com/mubaidr/gem-team/issues)。
