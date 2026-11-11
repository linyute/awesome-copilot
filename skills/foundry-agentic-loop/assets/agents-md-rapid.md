<!-- foundry-agentic-loop:begin mode=rapid -->
## Agentic Loop: 快速原型製作 (rapid prototyping)

此工作區為現有 Foundry 專案中的快速原型。針對建構請求，載入 `foundry-agentic-loop` skill 並遵循其 `references/rapid.md`。簡短命令：

| 命令 | 步驟 |
| --- | --- |
| `run` | 啟動後端與前端程式開發伺服器並回報其 URL |
| `test` | 執行本機驗收、契約與 E2E 測試 |
| `add agent`, `add tool`, `add skill` | 對照契約進行擴充，然後重新執行檢查點探測 |
| `deploy` | 重新部署變更的 agent 與 MCP 伺服器並重新執行其探測，然後在將應用程式部署至 `.azure/deployment-plan.md` 中的目標前先詢問 |
| `improve` | Improve 模式 |
| `convert to SDD` | 確認後，使用 Specify `reverse` 推導出規格，將此區段切換至 SDD 並啟動工作流程 |

- 契約存放於根目錄 `README.md`，經驗教訓存放於 `docs/LOOP.md`，而 Azure 設定僅存放於 `.azure/deployment-plan.md`，絕不放在此處。
- 此區段鎖定建構模式。僅在使用者明確確認切換時才變更。
<!-- foundry-agentic-loop:end -->
