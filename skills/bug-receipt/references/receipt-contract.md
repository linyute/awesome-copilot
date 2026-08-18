# 機器可讀收據合約 (Machine-readable receipt contract)

僅在使用者、CI 或其他工具需要結構化產物時使用 JSON。保持正常的最終回答為人類可讀。

## 必要欄位

- `version`：新收據為整數 `2`。版本 `1` 仍被接受以保持相容性。
- `status`：`verified`、`partial` 或 `blocked`。
- `evidenceSource`：`executed-now`、`supplied` 或 `mixed`（版本 `2` 中為必填）。
- `problem`：簡潔的缺陷與預期行為。
- `baseline`：包含 `command`、`result` 和 `evidence` 的物件。
- `rootCause`：包含 `summary` 以及適用於 `verified` 之至少一項證據項目的物件。
- `changes`：`{ "file", "summary" }` 物件陣列。
- `verification`：`{ "command", "result", "evidence" }` 物件陣列。
- `gaps`：明確遺漏的證明陳述陣列。

基準結果為 `failed`、`observed` 或 `not-run`。驗證結果為 `passed`、`failed` 或 `not-run`。

## 狀態不變量

對於 `verified`：

- 需要觀察到的基準：`failed` 或 `observed`，絕不能是 `not-run`。
- 需要至少一個包含 `location` 和 `observation` 的具體根本原因證據項目。
- 需要至少一個變更的檔案或產物。
- 需要至少一個驗證項目。
- 需要每個驗證結果均為 `passed`。
- 需要 `gaps` 為空。

對於 `partial`：

- 保留獲得的所有證據。
- 將每個遺漏或無定論的證明層放入 `gaps`。
- 切勿將未執行的檢查轉換為 `passed`。

對於 `blocked`：

- 需要至少一個指明外部阻礙條件的缺口。
- 將未執行的工作留空或標記為 `not-run`；不要推測結果。

針對 [receipt.schema.json](receipt.schema.json) 進行驗證，從技能目錄執行 `node scripts/validate-receipt.mjs <file>`，將 JSON 傳遞給 `node scripts/validate-receipt.mjs - --json`，或在安裝了套件 CLI 時使用 `bug-receipt check <file>`。
