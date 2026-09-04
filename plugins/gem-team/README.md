# Gem Team

**將 AI 程式碼編寫轉變為工程流程。**

> 強制執行良好軟體工程的代理人定義：最佳化成本、時間與品質。

<p align="center">
  <a href="https://mubaidr.github.io/gem-team/"><b>造訪首頁</b></a>
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/APM-mubaidr/gem--team-blue?style=flat-square" alt="APM package: mubaidr/gem-team">
  <img src="https://img.shields.io/github/v/release/mubaidr/gem-team?style=flat-square&color=important" alt="Latest release">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="Apache-2.0 license">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="Pull requests welcome">
</p>

## 問題

目前的 AI 程式碼編寫通常是一次性且臨時的。您能得到程式碼，但無法獲得可重複的流程。這導致品質不一致、浪費 token，以及缺乏長期學習累積。

## 解決方案

Gem Team 為您的 AI 封裝嚴謹的工程交付系統。它會自動強制執行良好的軟體工程實踐，讓您以更少的精力獲得更好的成果。

## 為什麼選擇 Gem Team？

- **預設即具備品質**：TDD 與驗收檢查一律適用；當風險需要時才執行審查與安全稽核。不再有會在正式環境中故障的「憑感覺寫程式」。
- **智慧且高效**：透過具範圍限制的交接與適度的架構設計，每項任務可減少 40–60% 的情境內容。快取 token 與精簡的佐證路徑讓成本可預測，並使 AI 保持專注。
- **支援您的工具**：與 Copilot、Claude、Cursor、Codex、Gemini 及 Windsurf 無縫整合。使用您偏好的環境。
- **持續學習與改進**：記住有效的方法並擷取可重複使用的技能。您的 AI 會隨時間變得更智慧、更有效率。
- **可恢復的計畫**：每項 MEDIUM/HIGH 任務都會取得持久的計畫 ID。您可以暫停、恢復或延長工作，而不會遺失情境或重新探索已知資訊。
- **支援任何模型**：強化的輸出契約與關聯不變量備援機制，讓每個代理人都能跨商用與開放模型運作，而不僅限於記住您結構描述的模型。

### 智慧模型路由

Gem Team 會針對每種工作自動使用合適的模型：

- **Premium 模型**處理規劃、除錯與審查，這些任務需要更深入的推論能力。
- **Explore 模型**高效處理研究、實作、測試、文件與其他具邊界的任務。
- **可設定的層級**讓您選擇符合預算與工作流程的模型和提供者。

這讓您在關鍵之處獲得更強大的驗證，而無需為每個任務支付最高昂的模型成本。在 `.gem-team.yaml` 中設定一次即可：

```yaml
model_routing:
  enabled: true
  tiers:
    premium: "your-strong-model (provider)"
    explore: "your-fast-model (provider)"
```

**簡要摘要：** Gem Team 將 AI 程式碼編寫轉變為結構化、可重複的工程流程，並內建品質、效率與學習機制。

## 快速入門

先安裝 [APM](https://microsoft.github.io/apm/)：

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

或僅為單一目標安裝：

```bash
apm install mubaidr/gem-team --target copilot
```

全域安裝供個人使用：

```bash
apm install -g mubaidr/gem-team
```

APM 會將解析的 commit 記錄在 `apm.lock.yaml` 中。重複執行 `apm install`
會重播該 lockfile；它不會靜默升級現有的安裝。
需要時明確重新整理 Gem Team：

```bash
# 專案範圍安裝
apm update mubaidr/gem-team --yes

# 全域安裝
apm update -g mubaidr/gem-team --yes
```

若要檢查 APM CLI 本身的更新，請使用 `apm self-update --check`。

若需要可重現的環境，請固定版本標籤：

```bash
apm install 'mubaidr/gem-team#gem-team-v<version>' --target copilot
```

將 `<version>` 替換為來自
[GitHub Releases](https://github.com/mubaidr/gem-team/releases) 頁面的已發布版本。

首次安裝後，提交屬於您存放庫的已產生 APM 檔案，特別是 `apm.yml`、`apm.lock.yaml` 以及產生的 harness 目錄，例如 `.github/`、`.claude/`、`.cursor/`、`.opencode/`、`.codex/`、`.gemini/` 或 `.windsurf/`。**切勿**提交 `apm_modules/`。

> APM 可以從現有的 harness 目錄自動偵測目標，但建議使用明確的 `--target` 以實現可預測的安裝與全新存放庫設定。
>
> 直接 Git 安裝會使用 `.apm/` 中的標準來源。維護者無需提交 `build/`；發布封存檔案與總和檢查碼會自動產生並附加至每個 GitHub Release。

## 流程

Gem Team 使用結構化工作流程，將 AI 程式碼編寫轉變為可靠的工程流程：

1. **路由**：根據提供的證據分類請求，並只選擇所需的工作流程深度。
2. **規劃**：TRIVIAL/LOW 工作使用記憶體中的波次計畫；MEDIUM/HIGH 工作使用持久且經規劃者確認的波次計畫。
3. **建置**：使用 TDD 與專業代理人，透過相同的有序波次迴圈執行每個波次計畫。
4. **驗證**：檢查每項任務，僅在變更範圍的風險需要時執行審查者整合檢查。
5. **學習**：成功執行後，只提升穩定且具高度信心的模式。

## 功能

- **以風險為基礎的品質關卡**：TDD 與確定性驗證一律適用；當計畫或變更範圍需要時，才執行專業審查與稽核。
- **輕鬆管理情境**：漸進式情境管理可避免內容膨脹。具範圍限制的交接、受限制的 `planning_context` 與以參照傳遞的證據，能讓每個代理人的 token 使用量保持最低，同時最大化各波次間快取 token 的重複使用。
- **智慧路由**：根據複雜度自動將任務路由至適合的代理人。
- **平行執行**：獨立任務在波次內平行執行；具重疊所有權的任務會序列化，以避免衝突。
- **可恢復的計畫**：每項 MEDIUM/HIGH 任務都會取得持久的計畫 ID 與 `plan.yaml`。您可以暫停、恢復或延長工作，而不會遺失情境。
- **可重複使用的知識**：擷取高信心模式與技能，供未來任務重複使用。
- **成本效率**：模型路由、輸出整理與精簡交接確保只使用所需的 token。證據以參照而非複製方式傳遞，讓各波次的情境使用量維持低檔並提高快取命中率。
- **失敗分類**：每次失敗都會分類（重試、可修正、重新規劃、不穩定、回歸、平台特定、測試錯誤），讓 Orchestrator 將其路由至適合的代理人，而非盲目重試。
- **驗證邊界**：Orchestrator 絕不重新驗證或質疑專業代理人的輸出。驗證完全由負責該工作的專業代理人掌控。

## 運作方式

Gem Team 會安裝一組專業代理人，在 Orchestrator 的指導下協同工作。團隊遵循包含規劃、實作、驗證與學習的嚴謹工作流程。

- **專業代理人**：分別負責規劃、研究、實作、審查等工作的代理人。
- **協同編排**：單一波次迴圈會在各種複雜度下協調有序工作、平行任務、受限重試與最終驗收檢查。
- **情境管理**：執行代理人會收到包含巢狀 `handoff` 的權威 `task_definition`；限制、證據與先前波次的輸出都透過其中傳遞。規劃者會收到受限制的 `planning_context`；審查者使用專用的審查 `handoff`；每個委派代理人只會收到角色範圍內的設定快照。

### 代理人角色

| 角色               | 描述                                                                           |
| :----------------- | :----------------------------------------------------------------------------- |
| **編排者**         | 分類意圖、分派工作、追蹤狀態並執行驗證關卡。絕不重新驗證專業代理人的輸出。     |
| **規劃者**         | 以 YAGNI/KISS 縮減範圍，建立受限制的波次計畫：里程碑、路由、交接、風險與條件。 |
| **實作者**         | 使用 TDD 實作功能、修正問題與重構。涵蓋正常流程、邊界、錯誤與狀態轉換。        |
| **審查者**         | 獨立審查品質、安全性與合規性。針對決策採用唯讀 critic 模式。                   |
| **除錯者**         | 進行根本原因分析、堆疊追蹤與回歸二分搜尋。新增重現測試，但絕不實作修正。       |
| **研究員**         | 以五種具預算限制的模式探索程式碼庫：掃描、提問、稽核、追蹤與深入研究。         |
| **瀏覽器測試員**   | 執行 E2E 瀏覽器測試，涵蓋視覺、無障礙、效能、網路與回歸檢查。                  |
| **行動裝置測試員** | 使用 Detox、Maestro 或 Appium 執行 iOS/Android 行動裝置 E2E 測試。             |
| **DevOps**         | 負責基礎架構、CI/CD、容器、健康檢查、回滾與正式環境核准。                      |
| **文件撰寫者**     | 撰寫技術文件、README、API 參考、圖表與操作說明。                               |
| **程式碼簡化者**   | 移除死碼、降低複雜度、整合重複內容並改善命名。                                 |
| **技能建立者**     | 將高信心模式擷取為可重複使用的 `SKILL.md` 檔案與資產。                         |

## 相容工具

Gem Team 可與您喜愛的 AI 程式碼編寫工具搭配使用：

| 工具         | Harness             | 描述                                 |
| :----------- | :------------------ | :----------------------------------- |
| **Copilot**  | `.github/agents/`   | VS Code Copilot / GitHub Copilot CLI |
| **Claude**   | `.claude/agents/`   | Claude Code                          |
| **Cursor**   | `.cursor/agents/`   | Cursor                               |
| **OpenCode** | `.opencode/agents/` | OpenCode                             |
| **Codex**    | `.codex/agents/`    | Codex CLI                            |
| **Gemini**   | `GEMINI.md`         | Gemini CLI                           |
| **Windsurf** | `.windsurf/rules/`  | Windsurf / Cascade                   |

## 設定

Gem Team 經過設計，開箱即可搭配智慧預設值運作。您可以透過編輯 `AGENTS.md` 檔案或 `.apm/agents/` 目錄中的特定代理人定義來自訂行為。

### 審查者與 critic 模式

`gem-reviewer` 使用三個獨立軸向：

- `review_mode`：`standard`、`high` 或 `critic` 控制審查強度。
- `review_target`：`plan`、`task`、`code`、`decision`、`docs`、`config` 或 `integration` 選取受審查的對象。
- `review_scope`：`changed`、`affected` 或 `full` 限制佐證資料廣度。

TRIVIAL/LOW 工作在規劃期間不會呼叫規劃者或審查者。
MEDIUM/HIGH 工作在執行前會收到一次計畫審查：MEDIUM 為標準審查，
HIGH 或高風險工作為高度審查，架構、重大變更或跨領域訊號為 critic 審查。
後續的整合審查由風險觸發，而非例行性的 wave 關卡。

討論會直接回答。所請求的評估或決策會變成
帶有 `review_mode: critic`、`review_target: decision` 與
`review_scope: full` 的唯讀質疑。Critic 模式不會變更檔案或聲稱已實作。
其主題與情境透過 `handoff` 傳遞：

```yaml
review_mode: critic
review_target: decision
review_scope: full
handoff:
  critic_subject:
    objective: str
    proposal: str
    constraints:
      - str
    alternatives:
      - str
    evidence:
      - str
    decision_needed: str
  critic_context:
    audience: str
    time_horizon: str
    success_criteria:
      - str
    known_unknowns:
      - str
```

## 深入了解

- [文件](https://mubaidr.github.io/gem-team/)
- [貢獻](https://mubaidr.github.io/gem-team/5.resources/2.contributing.html)
- [授權條款](LICENSE)

## 支援

如果您有疑問或需要協助，請在 [GitHub](https://github.com/mubaidr/gem-team/issues) 上提出 issue。
