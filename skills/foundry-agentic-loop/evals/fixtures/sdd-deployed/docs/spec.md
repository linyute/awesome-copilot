# Claims triage — 規格書

> 上次更新：2026-10-12 · 情境：n/a · 部署計畫：[.azure/deployment-plan.md](../.azure/deployment-plan.md)

## 1. 摘要 (Summary)

理賠專員上傳合成理賠摘要；託管的 `triage` agent 針對嚴重性進行分類、套用 policy-rules skill 並路由理賠案件，讓常規理賠案件能在一分鐘內送達正確的佇列。

## 2. 目標與非目標 (Goals and non-goals)

**目標：** 為每筆理賠提供嚴重性與佇列，並附帶引用的政策規則。**非目標：** 支付款項、文件 OCR、終端使用者登入。

## 4. 功能性需求 (Functional requirements)

| ID | 需求 | 驗收條件 (EARS) | 優先順序 |
| --- | --- | --- | --- |
| FR-001 | 系統應分類理賠嚴重性，以便理賠專員能排定優先順序。 | 當提交理賠時，triage agent 應傳回屬於 {low, medium, high} 的 `severity`。 | Must |
| FR-002 | 系統應將每筆理賠路由至一個佇列。 | 當已知嚴重性時，後端應從路由表傳回 `queue`。 | Must |

## 7. Agents

| Agent | 用途 | 架構 | 通訊協定 | 模型 | Toolbox、skills 與工具 | 基礎 (Grounding) | 防護措施 (Guardrails) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| triage | 分類與路由 | Copilot SDK | Responses | `gpt-5.4-mini` | `claims-tools`: `policy-rules` skill, `get_policy` MCP tool | 無 | 預設 |

## 10. 實作契約 (凍結) (Implementation contract (frozen))

`POST /api/triage` → `{ severity, queue, rules[] }`；錯誤 `{ code, message }`。環境變數：`HOSTED_RESPONSES_ENDPOINT`, `TOOLBOX_ENDPOINT`, `APPLICATIONINSIGHTS_CONNECTION_STRING`。

## 12. 驗證計畫 (Verification plan)

| 需求 | 檢查 | 層級 | 證據 |
| --- | --- | --- | --- |
| FR-001 | 10 筆種子理賠資料傳回凍結的嚴重性 | E2E | `docs/verify.md` |
| FR-002 | 路由表涵蓋每個嚴重性以及 null | 契約測試 | `tests/contract` |
| NFR 可觀察性 | 後端、agent 與工具 span 共用同一個操作識別碼 (operation ID) | 追蹤記錄 | `docs/verify.md` |
