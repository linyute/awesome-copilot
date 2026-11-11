# HR policy assistant (快速原型)

託管的 `hr-assistant` agent 透過一個 toolbox MCP 工具從合成範例政策中回答 HR 政策問題。React + Vite 前端與 FastAPI 後端在本機執行。

## 實作契約 (Implementation contract)

| 項目 | 數值 |
| --- | --- |
| 服務 | `frontend` (React + Vite, 連接埠 5173), `backend` (FastAPI, 連接埠 8000), `hr-mcp` (FastMCP, 串流 HTTP) |
| Agent | `hr-assistant`, Microsoft Agent Framework, Responses API, Basic 範例的模型部署 |
| 後端 API | `POST /api/chat` → `{ answer, citations[] }`；錯誤 `{ code, message }` |
| 環境變數 | `FOUNDRY_PROJECT_ENDPOINT_URL`, `HOSTED_RESPONSES_ENDPOINT`, `TOOLBOX_ENDPOINT` |

## 託管檢查點 (Hosted checkpoint)

已通過：`hr-assistant` v3 傳回 `response.completed` 並具備符合結構描述的輸出，`lookup_policy` MCP 呼叫已執行，且相互關聯的追蹤已抵達 Application Insights。執行階段 skills：N/A (不需要)。

## 本機驗收 (Local acceptance)

針對 `LOCAL_FRONTEND` 執行的契約測試、E2E 測試與遙測測試皆已通過。
