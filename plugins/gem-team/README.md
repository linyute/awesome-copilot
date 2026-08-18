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

- **預設高品質**：TDD 與驗收檢查一律適用；當風險需要時執行審查與安全性稽核。不再有在正式環境中故障的「感覺程式碼編寫」(vibe coding)。
- **智慧且高效**：針對更少的 token 與更低的成本進行最佳化。循序漸進的情境管理可防止內容膨脹並保持 AI 聚焦。
- **與現有工具協同運作**：與 Copilot、Claude、Cursor、Codex、Gemini 和 Windsurf 無縫整合。使用您偏好的環境。
- **持續學習與改進**：記住有效的方法並擷取可重複使用的技能。您的 AI 會隨著時間變得更聰明、更有效率。

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

Gem Team 使用結構化工作流程將 AI 程式碼編寫轉變為可靠的工程流程：

1. **路由**：從提供的佐證資料分類請求，並僅選取其所需的工作流程深度。
2. **規劃**：TRIVIAL/LOW 工作使用記憶體內 DAG，MEDIUM/HIGH 工作使用持久且經規劃者確認的 DAG。
3. **建構**：透過相同的相依性感知迴圈執行每個 DAG，並使用 TDD 與專家代理人。
4. **驗證**：檢查每個任務，且僅在變更範圍風險需要時執行審查者整合檢查。
5. **學習**：成功執行後僅提升穩定且高置信度的模式。

## 功能特點

- **基於風險的品質關卡**：TDD 與確定性驗證一律適用；當計畫或變更範圍需要時執行專家審查與稽核。
- **輕鬆的情境管理**：循序漸進的情境管理可防止膨脹並保持 AI 聚焦。
- **智慧路由**：任務會根據複雜度自動路由至合適的代理人。
- **可重複使用的知識**：擷取高置信度模式與技能並重複用於未來的任務。
- **成本效益**：模型路由與輸出整潔確保您僅使用所需的 token。

## 運作方式

Gem Team 安裝一組專門的代理人，在協調者的指導下協同工作。這個團隊遵循嚴謹的工作流程，包括規劃、實作、驗證與學習。

- **專家代理人**：用於規劃、研究、實作、審查等的專屬代理人。
- **協調**：單一 DAG 迴圈在每個複雜度層級協調相依性、平行工作、具邊界的重試以及最終驗收檢查。
- **情境管理**：執行代理人接收具權威性的 `task_definition`；限制條件、佐證資料與相依性輸出透過其標準 `handoff` 傳遞。規劃者與審查者使用專屬交接約定，且每個被委派者僅接收角色範圍的設定快照。

### 代理人角色

| 角色 | 描述 |
| :------------------ | :---------------------------------------------------------------------------------------- |
| **Orchestrator** | 協調工作流程並確保所有任務正確完成。 |
| **Planner** | 建立具邊界的 DAG 計畫：里程碑、路由、相依性、waves、風險與準則。 |
| **Implementer** | 使用 TDD 與最佳實踐撰寫程式碼。 |
| **Reviewer** | 審查計畫；為構想與質疑提供唯讀的批評分析。 |
| **Debugger** | 透過根本原因分析診斷錯誤（切勿實作修復）。 |
| **Researcher** | 探索程式碼庫並找出要使用的最佳模式。 |
| **Designer** | 建立 UI/UX 設計、版面配置與設計系統。 |
| **Tester** | 執行 E2E 瀏覽器測試與視覺回歸。 |
| **Tester Mobile** | 在 iOS/Android 模擬器上執行行動端 E2E 測試。 |
| **DevOps** | 透過核准關卡管理部署、CI/CD 與基礎設施。 |
| **Documentation** | 撰寫技術文件、API 參考資料與逐步說明。 |
| **Code Simplifier** | 重構程式碼以降低複雜度並移除無用程式碼。 |
| **Skill Creator** | 將可重複使用的模式擷取為封裝好的代理人技能。 |

## 相容工具

Gem Team 可與您喜愛的 AI 程式碼編寫工具搭配使用：

| 工具 | Harness | 描述 |
| :----------- | :------------------ | :----------------------------------- |
| **Copilot** | `.github/agents/` | VS Code Copilot / GitHub Copilot CLI |
| **Claude** | `.claude/agents/` | Claude Code |
| **Cursor** | `.cursor/agents/` | Cursor |
| **OpenCode** | `.opencode/agents/` | OpenCode |
| **Codex** | `.codex/agents/` | Codex CLI |
| **Gemini** | `GEMINI.md` | Gemini CLI |
| **Windsurf** | `.windsurf/rules/` | Windsurf / Cascade |

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
    objective: string
    proposal: string
    constraints: string[]
    alternatives: string[]
    evidence: string[]
    decision_needed: string
  critic_context:
    audience: string
    time_horizon: string
    success_criteria: string[]
    known_unknowns: string[]
```

## 深入了解

- [文件](https://mubaidr.github.io/gem-team/)
- [貢獻](https://mubaidr.github.io/gem-team/5.resources/2.contributing.html)
- [授權條款](LICENSE)

## 支援

如果您有疑問或需要協助，請在 [GitHub](https://github.com/mubaidr/gem-team/issues) 上提出 issue。
