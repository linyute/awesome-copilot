# Verify

| 檢查 | 結果 | 證據 |
| --- | --- | --- |
| 契約測試 | 通過 | `pytest tests/contract` 16 通過 |
| E2E (10 筆種子理賠資料) | 通過 | 10/10 於 c = 4 |
| 相互關聯的追蹤記錄 | 通過 | 後端、triage 與 `get_policy` span 共用同一個操作識別碼 |

E2E 並行數：c = 4 (TPM 100000，每案例 3 分鐘與 60000 個權杖)。Deploy 會在 c = 4 重新執行 E2E。
