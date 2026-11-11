# Improve 模式

遞迴改進：從過去的執行紀錄中學習，並以具證據支援的最小變更精進 Agentic Loop skill 與工作流程。分析過程為唯讀；未經核准不套用任何變更。

## 1. 蒐集證據 (Gather evidence)

**範圍。** 在解決方案存放庫中，使用其自身的證據。在 `github/awesome-copilot` 的複製本中，證據存在於各解決方案資料夾中：使用 `session_store_sql` 尋找最近載入 `foundry-agentic-loop` 的工作階段，與使用者確認資料夾，並讀取其記錄。

**預算。** 在約 20 分鐘內提出提案。從下列提煉的記錄開始。僅使用工作階段歷程記錄來確認或量化候選叢集，絕不從頭到尾完整讀取原始逐字稿 (`events.jsonl`)。

- **飛行記錄：** `.agentic-loop/runs/*.json`，包含階段、輪次、關卡狀態、問題、經驗教訓、持續時間與成果。
- **經驗教訓：** `docs/LOOP.md` 項目及其狀態。
- **工作流程歷程記錄：** 搭配 `runs` 的 `dynamic_workflows_manage`，篩選為 `foundry-agentic-loop-workflow`，接著針對每個失敗、被封鎖或緩慢的執行進行 `inspect-run`。
- **工作階段歷程記錄：** 針對範圍內最近的 Agentic Loop 工作階段使用 `session_store_sql`：失敗的工具、重試、使用者更正、提出的問題以及在遭封鎖暫停後的手動修正。對每個查詢限制時間並使用 `LIMIT`。
- **目前原始檔：** `foundry-agentic-loop` skill (`SKILL.md`、`references/`、`assets/` 與 `evals/evals.json`) 以及工作流程 `lib/*.mjs`。

## 2. 分析 (Analyze)

依根本原因而非徵兆將發現叢集化。尋找：
- 重複出現的關卡失敗，以及需要多輪或耗時較長的階段
- 在 Chat 中以手動修正的問題
- 使用者更正
- 尚未納入 skill 中的已採納經驗教訓
- 絕不影響成果的指示 (權杖費用浪費)

依頻率 × 影響程度為叢集排序。僅在具備至少兩次執行的證據或一次經確認的嚴重失敗時，才保留該叢集。

使用 `grep` 尋找目標區段，而非閱讀整個檔案。若叢集超過三個，進行並行草擬，每個叢集由一個子代理人負責，各自傳回第 3 節中的欄位。

## 3. 提案 (Propose)

針對每個叢集，提供：
- 證據 (執行識別碼、階段、引文)
- 目標檔案與區段
- 最小 diff
- 預期成效
- 迴歸檢查：現有 eval 或新 eval 案例

優先精簡或刪除文字，而非新增文字。保持 `SKILL.md` 精簡，並將詳細資料放在 references 中。切勿放寬核准、RBAC、安全性或證據關卡門檻，且絕不新增密碼秘密或租用戶專屬數值。指派全新情境的檢閱者子代理人對照 evals 質疑每個提案，並捨棄失敗的提案。僅批次重新驗證檢閱者提出爭議的主張。

## 4. 核准後套用 (Apply after approval)

- **在 `github/awesome-copilot` 的複製本中：** 直接編輯 `skills/foundry-agentic-loop/` 與 `extensions/foundry-agentic-loop-*`。使用 `npm run skill:validate`、`npm run plugin:validate` 與 `node --test extensions/foundry-agentic-loop-*/tests/*.test.mjs` 進行驗證，然後提出 Pull Request。
- **在解決方案存放庫中：** 外掛檔案在更新時會被替換，因此改為編寫專案覆寫。將整個 skill 資料夾複製至 `.github/skills/foundry-agentic-loop/` 並在該處進行編輯；工作流程會忽略缺少 `SKILL.md`、`references/sdd.md` 與四個階段指引的複本。工作流程子代理人會優先讀取專案 skills，因此覆寫會套用至下一次執行。僅透過上游 Pull Request 變更工作流程程式碼。
- **事後作業：** 當擴充功能變更時使用 `extensions_reload` 重新載入，接著使用搭售的執行程式 [`scripts/evals.mjs`](../scripts/evals.mjs) (Node 20+、Copilot CLI) 進行衡量。它在全新工作區中使用候選 skill 作為專案覆寫離線執行各個案例，以第二個呼叫進行評分，並寫入 `.agentic-loop/evals/<timestamp>/results.json` 與 `summary.md`。
  1. 在不載入 `evals/evals.json` 的情況下選取案例：`node <skill>/scripts/evals.mjs index --target references/<file>.md` (亦可加上 `--mode`、`--capability`)。針對新行為新增或更新案例，包含 `mode`、`capabilities`、`targets`、`risk`，針對具狀態案例加上 `evals/fixtures/` 下的 `fixture`。
  2. 執行 `node <skill>/scripts/evals.mjs run --target references/<file>.md --base <base-commit>` (或 `--ids 4,29`)；在解決方案存放庫中，`--base` 可以是已安裝的外掛 skill 資料夾。自基準點以來未變更的失敗案例亦會針對基準 skill 執行。
  3. 僅在結束代碼為 0 時通過：無迴歸問題，且每個新增或變更的案例皆通過。修正迴歸並僅重新執行那些案例一次。將在基準點同樣失敗的案例回報為先前已存在的問題，而非反覆重試。
  4. 結束代碼 2 表示執行程式無法使用（Copilot CLI 遺漏或未登入）：停止，回報 "evals unavailable"，並保持經驗教訓不變。
- **經驗教訓：** 僅在通過迴歸執行後才將相符的 `docs/LOOP.md` 經驗教訓標記為 `adopted`，並僅在稍後的實際執行確認其成效後才標記為 `validated`。僅寫入目前工作區的 `docs/LOOP.md`；針對來自其他解決方案資料夾的經驗教訓，為其負責人回報狀態變更。提議將具通用性的改進貢獻至上游。
