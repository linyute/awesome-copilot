# Verify

| 檢查 | 結果 | 證據 |
| --- | --- | --- |
| 契約測試 | 通過 | `pytest tests/contract` 14 通過 |
| E2E (10 筆種子理賠資料, c = 4) | 失敗 | S3 與 S7 當 `severity` 為 `medium` 時傳回 `queue: null` |
| 相互關聯的追蹤記錄 | 通過 | 後端、triage 與 `get_policy` span 共用同一個操作識別碼 |
