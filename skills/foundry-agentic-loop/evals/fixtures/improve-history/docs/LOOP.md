# Agentic Loop 經驗教訓

建構此工作區的已驗證經驗教訓。Improve 模式會在獲得核准的情況下，將其轉化為 skill 與工作流程變更。

## 2026-09-02 expense-assistant, SDD

Outcome: 經過兩輪 Verify 後完成部署。

| 觀察與證據 | 提議的 skill 變更 (檔案、區段) | 預期成效 | 迴歸檢查 | 狀態 |
| --- | --- | --- | --- | --- |
| Verify r1 (wr_101): `get_receipt` 沒有 `execute_tool` span；MCP 伺服器未設定 OpenTelemetry 匯出工具。透過設定匯出工具修正；重新執行追蹤驗證通過。 | `references/observability.md`, MCP server | 節省一輪 Verify (衡量過一次) | eval 11 | proposed |
| Deploy (wr_101): 託管 agent 缺少 `TOOLBOX_ENDPOINT`；在 `azure.yaml` env 中對應並重新部署；冒煙測試通過。 | `references/azd-layout.md`, environment mapping | 避免部署失敗 (估計值) | eval 26 | adopted |

## 2026-09-20 travel-desk, SDD

Outcome: 經過兩輪 Verify 後完成部署。

| 觀察與證據 | 提議的 skill 變更 (檔案、區段) | 預期成效 | 迴歸檢查 | 狀態 |
| --- | --- | --- | --- | --- |
| Verify r1 (wr_117): Application Insights 中再度遺漏 MCP 工具 span；MCP 伺服器同樣缺少匯出工具。修正後重新執行追蹤驗證通過。 | `references/observability.md`, MCP server | 節省一輪 Verify (衡量過兩次) | eval 11 | proposed |
| Implement (wr_117): 前端程式開發伺服器因 5173 被占用而選用連接埠 5174；重新在 5173 啟動。 | none | — | — | rejected |
| Hosted checkpoint (wr_117): 在後端工作前透過 toolbox 驗證執行階段 skill 載入。 | `references/hosted-integration-checkpoint.md` | 經由 wr_117 驗證 | eval 8 | validated |

## 2026-10-05 lease-review, SDD

Outcome: 在 Verify 遭到封鎖；使用者停止了執行。

| 觀察與證據 | 提議的 skill 變更 (檔案、區段) | 預期成效 | 迴歸檢查 | 狀態 |
| --- | --- | --- | --- | --- |
| Verify r1 (wr_123): Playwright 在 Container Apps 冷啟動時逾時一次；未作變更下重新執行即通過。 | none | — | — | proposed |
