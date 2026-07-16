# 步驟 2：等待審閱

子代理程式類型：`general-purpose`；預算：**20 分鐘硬限制**（單一
受限子代理程式，非擴充功能驅動）。

當迴圈處於 [單次反覆運算
模式](orchestration.md#single-iteration-fallback) 時將**跳過**——沒有 Copilot
審閱需要等待。

## 輸入

來自步驟 1：
- `PrNumber`。
- `baseline` —— 在觸發器啟動前擷取的 `LatestCopilotReview.submittedAt` 字串
  （若先前無 Copilot 審閱則為空字串）。

## 回傳合約

- `02-check-review-status.ps1` JSON 快照。
- `recommendation` ∈ {`ready`, `give-up-push-commit`}。
- 若且唯若 `LatestCopilotReview.submittedAt > baseline` **且**
  `ReviewAtHead: true` **兩者皆成立**，則為 `ready`。

## 流程

大約每 **3 分鐘**輪詢一次 `02-check-review-status.ps1`，
直到狀態為 `ready` 或達到 20 分鐘限制為止：

```pwsh
pwsh ./scripts/02-check-review-status.ps1 -PrNumber <n>
```

- 每次輪詢時，從 JSON 中擷取 `submittedAt` 與 `ReviewAtHead`。
- 在首次符合與所擷取 `baseline` 相比之兩項條件的輪詢時
  停止並回傳 `ready`。
- 若達到限制仍未達到 `ready` 狀態，則回傳 `give-up-push-commit`。

## 注意事項

- **請勿以快於約 3 分鐘的速度進行輪詢。** API 沒有提供進度訊號；
  更頻繁的輪詢只會耗盡預算。
- **`give-up-push-commit` 後備機制是由父代理程式驅動。** 當
  子代理程式回傳此建議時，**父代理程式**會推送一個實質性
  （非空白字元）的提交（commit）——在 `synchronize` 上自動分配
  是最可靠的觸發器。接著父代理程式會以全新的 `baseline`
  重新進入步驟 1 的迴圈。
- **單次受限執行，非擴充功能驅動。** 請勿在此步驟請求
  擴充功能——如果 20 分鐘不夠，正確的做法是使用
  `give-up-push-commit` 後備機制，而非繼續輪詢。
