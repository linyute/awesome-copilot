<!-- foundry-agentic-loop:begin mode=sdd -->
## Agentic Loop: SDD 工作流程

此工作區使用規格驅動開發 (SDD) 建構。針對建構請求與下列簡短命令，載入 `foundry-agentic-loop` skill 並遵循其 `references/sdd.md`；它會先檢查進行中的執行並繼續執行中或暫停的回合，而非啟動第二個回合。

| 命令 | 步驟 |
| --- | --- |
| `status` | 從 `dynamic_workflows_manage` 回報進行中的執行，然後回報其 `.agentic-loop/runs/` 記錄中的關卡問題 |
| `approve`, `resume` | 使用 `resumeFromRunId` 繼續暫停的執行 |
| `deploy` | 若有進行中的執行，僅透過它部署：在 `approve-deploy-v1` 或 `approve-deploy-r<n>[-a<k>]-v1`，摘要其內容並在獲得核准後繼續；在任何其他暫停點，回報其停止位置並先解決該問題。在沒有進行中執行的情況下，執行 Deploy 階段指引，在 `azd up` 之前先行詢問 |
| `specify`, `implement`, `verify` | 在沒有進行中執行的情況下，在現有成品上執行該階段指引 |
| `build <brief>` | 提供繼續執行中或暫停的回合；否則啟動新的 `foundry-agentic-loop-workflow` 執行 |
| `improve` | Improve 模式 |

- 規格與契約存放於 `docs/spec.md`，經驗教訓存放於 `docs/LOOP.md`，而 Azure 設定僅存放於 `.azure/deployment-plan.md`，絕不放在此處。
- 此區段鎖定建構模式。僅在使用者明確確認切換時才變更。
<!-- foundry-agentic-loop:end -->
