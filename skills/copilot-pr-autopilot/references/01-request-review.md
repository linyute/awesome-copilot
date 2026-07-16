# 步驟 1：要求審閱

擁有者：**parent** (無子代理)；預算：無。

## 輸入

- 目標 PR 的 `PrNumber`。

## 回傳協定

- 擷取的 `baseline` = `LatestCopilotReview.submittedAt` 字串 (或為空)
  以傳遞至步驟 2。
- 布林值 `single_iteration_mode` — 如果因 Copilot 不是有效的審閱者而導致觸發失敗，則為 `true`；
  否則為 `false`。

## 流程

1. 先進行快照以了解 Copilot 是否已在等待中：

   ```pwsh
   $snap = pwsh ./scripts/02-check-review-status.ps1 -PrNumber <n>
   $baseline = if ($snap -match '"submittedAt":"([^"]+)"') { $Matches[1] } else { '' }
   $pending  = ($snap -match '"CopilotPending":true')
   ```

   針對原始 JSON 的 Regex 可在任何 PS 版本 (5.1 / 7.x) 上跨
   parent → 子代理界線將 `submittedAt` 保持為字串，以避免
   `[datetime]` 重新繫結。

2. **如果為 `$pending`** — 跳過該觸發器；帶著 `baseline` 跳轉至步驟 2。

3. **否則** — 啟動觸發器：

   ```pwsh
   pwsh ./scripts/01-request-review.ps1 -PrNumber <n>
   ```

   該指令碼保留了其自身的 `InFlight` 短路作為安全網，
   但標準的「Copilot 是否在等待中？」訊號存在於
   `02-check-review-status.ps1` (上方) 中。

4. 如果 `01-request-review.ps1` 因為 Copilot 不是有效的
   審閱者 (此儲存庫 / 帳戶未啟用 Copilot 程式碼審閱) 而拋出異常，
   請採用 [single-iteration fallback](orchestration.md#single-iteration-fallback)。
