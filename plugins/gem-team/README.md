# Gem Team

**將 AI 程式碼編寫轉化為工程流程。**

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

## 真實環境效能

> 在 100K+ token 情境下，每次 API 呼叫成本低於 $0.001 美元。跨 666 次代理人執行處理了超過 8,280 萬個 token，一般回應在 2-5 秒內完成。提示快取將龐大的情境轉變為不到一分錢的操作——與未快取的輸入相比降低了 10 倍成本。

_在 Gem-Team 開發期間透過 CommandCode 使用 DeepSeek V4.1 Flash 觀察所得。_

## 問題所在

目前的 AI 程式碼編寫通常是一次性且臨時的。您得到了程式碼，但沒有得到可重複的流程。這會導致品質不一致、浪費 token，以及缺乏長期學習。

## 解決方案

Gem Team 以紀律嚴明的工程交付系統包裝您的 AI。它會自動強制執行良好的軟體工程實務，讓您以更少的心力獲得更好的成果。

## 為什麼選擇 Gem Team？

- **預設兼具品質**：TDD 與驗收檢查一律適用；審查與安全性稽核在風險需要時執行。不再出現會在正式環境中崩潰的「憑感覺寫程式」（vibe coding）。
- **智慧且高效**：透過具範圍的交接與成比例的架構，使每個任務減少 40-60% 的情境。快取的 token 與精簡的佐證路徑讓成本可預測，並使您的 AI 保持專注。
- **與您的工具協同運作**：與 Copilot、Claude、Cursor、Codex、Gemini 與 Windsurf 無縫整合。使用您偏好的環境。
- **持續學習與改進**：記住有效的方法並擷取可重複使用的技能。您的 AI 會隨著時間變得更聰明、更有效率。
- **可繼續執行的計畫**：每個 MEDIUM/HIGH 任務都會獲得一個持久化的計畫 ID。暫停、繼續或擴展工作，而不會遺失情境或重新探索已知內容。
- **適用於任何模型**：強化後的輸出合約與關聯不變量後備機制，意味著每個代理人都能跨商業與開放模型運作——而不僅僅是那些背誦了您的結構描述的模型。

### 智慧型模型路由

Gem Team 自動為各種類型的工作使用合適的模型：

- **頂級模型 (Premium models)** 處理更需要深入推理的規劃、除錯與審查。
- **探索模型 (Explore models)** 高效處理研究、實作、測試、文件與其他有界限的任務。
- **可設定的層級** 讓您選擇符合預算與工作流程的模型和提供者。

這讓您在關鍵處獲得更強大的驗證，而無需為每個任務支付最高昂的模型成本。只需在 `.gem-team.yaml` 中設定一次：

```yaml
model_routing:
  enabled: true
  tiers:
    premium: "your-strong-model (provider)"
    explore: "your-fast-model (provider)"
```

**TL;DR：** Gem Team 將 AI 程式碼編寫轉變為結構化、可重複且內建品質、效率與學習的工程流程。

## 快速開始

請先安裝 [APM](https://microsoft.github.io/apm/)：

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

針對個人使用進行全域安裝：

```bash
apm install -g mubaidr/gem-team
```

APM 會在 `apm.lock.yaml` 中記錄解析出的 commit。重複執行 `apm install`
會重放該 lockfile；不會無聲升級現有的安裝。
需要時可明確重新整理 Gem Team：

```bash
# 專案範圍安裝
apm update mubaidr/gem-team --yes

# 全域安裝
apm update -g mubaidr/gem-team --yes
```

若要檢查 APM CLI 本身的更新，請使用 `apm self-update --check`。

針對可重現的環境，請固定發行標籤：

```bash
apm install 'mubaidr/gem-team#gem-team-v<version>' --target copilot
```

將 `<version>` 替換為
[GitHub Releases](https://github.com/mubaidr/gem-team/releases) 頁面上已發布的版本。

初次安裝後，認可屬於您存放庫的已產生 APM 檔案，特別是 `apm.yml`、`apm.lock.yaml`，以及產生的框架目錄（如 `.github/`、`.claude/`、`.cursor/`、`.opencode/`、`.codex/`、`.gemini/` 或 `.windsurf/`）。請**勿**認可 `apm_modules/`。

> APM 可以從現有的框架目錄自動偵測目標，但對於可預測的安裝與全新存放庫，建議明確指定 `--target`。
>
> 直接 Git 安裝使用 `.apm/` 中的規範來源。維護者無需
> 認可 `build/`；發行封存檔與總和檢查碼會自動產生並
> 附加至每個 GitHub Release。

## 運作流程

Gem Team 使用結構化工作流程將 AI 程式碼編寫轉變為可靠的工程流程：

1. **路由 (Route)**：從提供的佐證對請求進行分類，並僅選取其所需的工作流程深度。
2. **規劃 (Plan)**：針對 TRIVIAL/LOW 工作使用記憶體內波次計畫，針對 MEDIUM/HIGH 工作使用持久化且經規劃者確認的波次計畫。
3. **建構 (Build)**：透過相同的有序波次迴圈，使用 TDD 與專家代理人執行每個波次計畫。
4. **驗證 (Verify)**：檢查每個任務，並僅在變更範圍風險需要時執行審查者整合檢查。
5. **學習 (Learn)**：在成功執行後，僅晉升穩定且具備高度信心度的模式。

## 功能特色

- **基於風險的品質閘門**：TDD 與確定性驗證一律適用；專家審查與稽核在計畫或變更範圍需要時執行。
- **輕鬆管理情境**：漸進式情境管理可避免內容膨脹。透過範圍限定的交接、合併情境的任務、逐字保留的群集 `shared_context`、依快取生命週期排序的負載，以及以參照傳遞的佐證，將每個代理人的 token 用量降至最低，同時最大化各波次間快取 token 的重複利用。
- **智慧路由**：根據複雜度自動將任務路由至合適的代理人。
- **平行執行**：獨立任務在波次內平行執行；重疊的權責則序列化以防止衝突。
- **可繼續執行的計畫**：每個 MEDIUM/HIGH 任務都會獲得一個持久化的計畫 ID 與 `plan.yaml`。暫停、繼續或擴展工作而不會遺失情境。
- **可重複使用的知識**：擷取高信心度的模式與技能，並重複用於未來的任務中。
- **成本效益**：模型路由、輸出整潔度與精簡的交接，確保您僅使用所需的 token。佐證依參照傳遞而非複製——在跨波次時保持低情境用量與高快取命中率。
- **失敗分類**：為每次失敗進行分類（重試、可修復、重新規劃、不穩定、回歸、平台專屬、測試錯誤），使協調者能將其路由至合適的代理人，而非盲目重試。
- **驗證邊界**：協調者切勿重新驗證或事後質疑專家輸出。驗證權限由負責該工作的專家獨家擁有。
- **品質指令**：每個代理人都遵循特定規則以防止常見的 AI 程式碼編寫問題：無無效按鈕、無流行語、無範本填充文字，且每個決策都有其理由。

## 運作方式

Gem Team 安裝了一組在協調者指導下協同運作的專屬代理人。該團隊遵循包含規劃、實作、驗證與學習的嚴格工作流程。

- **專家代理人**：專門用於規劃、研究、實作、審查等的代理人。
- **協調機制**：單一波次迴圈在每個複雜度層級協調有序的工作、平行任務、有界限的重試與最終驗收檢查。
- **情境管理**：執行代理人接收權威性的 `task_definition` 以及巢狀 `handoff`；限制、佐證與前一波次的輸出皆透過它傳遞。規劃者接收有界限的 `planning_context`；審查者使用專屬的審查 `handoff`；每個被委派者僅接收角色範圍的設定快照。

### 代理人角色

| 角色                | 說明                                                                                                                                                                                                                          |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestrator**    | 分類意圖、路由工作、追蹤狀態並強制執行驗證閘門。切勿重新驗證專家輸出。                                                                                                                                                       |
| **Planner**         | 建立具備 YAGNI/KISS 範圍縮減與關注點分離切分的有界限波次計畫：里程碑、路由、交接、風險與條件。                                                                                                                               |
| **Implementer**     | 使用 TDD 實作功能、修復錯誤與進行重構。涵蓋正常路徑、邊界、錯誤與狀態轉換。套用 SOLID、快速失敗（fail-fast）與最小驚訝原則。每個重大決策皆有單行理由。無無效按鈕。                                                         |
| **Reviewer**        | 針對品質、安全性與合規性進行獨立審查。針對決策提供唯讀評論模式。驗證每個決策皆有理由。將無效按鈕與外部指令碼修補程式標記為阻礙性問題。                                                                                     |
| **Debugger**        | 根本原因分析、堆疊追蹤、回歸二分法。新增重現測試；切勿實作修復程式碼。                                                                                                                                                       |
| **Researcher**      | 以五種具預算的模式探索程式碼庫：scan、question、audit、trace、deep。                                                                                                                                                          |
| **Browser Tester**  | 包含視覺、無障礙功能、效能、網路與回歸檢查的端對端瀏覽器測試。                                                                                                                                                               |
| **Mobile Tester**   | 使用 Detox、Maestro 或 Appium 在 iOS/Android 上進行行動裝置端對端測試。                                                                                                                                                      |
| **DevOps**          | 基礎架構、CI/CD、容器、健康檢查、復原與正式環境核准。                                                                                                                                                                         |
| **Documentation**   | 技術文件、README、API 參考、圖表與演練指南。無流行語。每個章節的存在都必須是因為產品需要。無捏造的統計資料。                                                                                                               |
| **Code Simplifier** | 移除無效程式碼、降低複雜度、合併重複內容與改善命名。每次重構皆有單行理由。無流行語。移除 AI 贅詞註解。                                                                                                                       |
| **Skill Creator**   | 將高信心度的模式擷取至可重複使用的 `SKILL.md` 檔案與資產中。                                                                                                                                                                 |

## 相容工具

Gem Team 可與您喜愛的 AI 程式碼編寫工具搭配使用：

| 工具         | 框架                | 說明                                 |
| :----------- | :------------------ | :----------------------------------- |
| **Copilot**  | `.github/agents/`   | VS Code Copilot / GitHub Copilot CLI |
| **Claude**   | `.claude/agents/`   | Claude Code                          |
| **Cursor**   | `.cursor/agents/`   | Cursor                               |
| **OpenCode** | `.opencode/agents/` | OpenCode                             |
| **Codex**    | `.codex/agents/`    | Codex CLI                            |
| **Gemini**   | `GEMINI.md`         | Gemini CLI                           |
| **Windsurf** | `.windsurf/rules/`  | Windsurf / Cascade                   |

## 設定

Gem Team 經過設計，開箱即可透過智慧預設值運作。您可以透過編輯 `AGENTS.md` 檔案或 `.apm/agents/` 目錄中的特定代理人定義來自訂行為。

### 審查者與評論模式

`gem-reviewer` 使用三個獨立軸向：

- `review_mode`：`standard`、`high` 或 `critic` 控制審查強度。
- `review_target`：`plan`、`task`、`code`、`decision`、`docs`、`config` 或 `integration` 選取審查目標。
- `review_scope`：`changed`、`affected` 或 `full` 限制佐證廣度。

TRIVIAL/LOW 工作在規劃期間不會呼叫規劃者或審查者。
MEDIUM/HIGH 工作會接收一次執行前計畫審查：MEDIUM 為 standard，
HIGH 或高風險工作為 high，而架構、破壞性變更
或跨領域訊號則為 critic。後續的整合審查是由風險觸發，而非
例行性的波次閘門。

討論會直接獲得回覆。被要求的評估或決策會轉變為帶有
`review_mode: critic`、`review_target: decision` 與
`review_scope: full` 的唯讀質疑挑戰。評論模式不會變更檔案或宣稱已進行實作。
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

- [說明文件](https://mubaidr.github.io/gem-team/)
- [參與貢獻](https://mubaidr.github.io/gem-team/5.resources/2.contributing.html)
- [授權條款](LICENSE)

## 支援

若您有疑問或需要協助，請在 [GitHub](https://github.com/mubaidr/gem-team/issues) 上提出 issue。
