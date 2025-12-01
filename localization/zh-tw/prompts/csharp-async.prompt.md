---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '取得 C# 非同步程式設計最佳實踐'
---

# C# 非同步程式設計最佳實踐

你的目標是協助我遵循 C# 非同步程式設計的最佳實踐。

## 命名慣例

- 所有非同步方法請使用 'Async' 作為後綴
- 方法名稱應與同步版本相符（例如：`GetDataAsync()` 對應 `GetData()`）

## 回傳型別

- 當方法有回傳值時，請回傳 `Task<T>`
- 當方法沒有回傳值時，請回傳 `Task`
- 若需高效能且減少配置，請考慮使用 `ValueTask<T>`
- 除了事件處理器外，請避免非同步方法回傳 `void`

## 例外處理

- 在 await 運算式周圍使用 try/catch 區塊
- 避免在非同步方法中吞掉例外
- 在函式庫程式碼中適當使用 `ConfigureAwait(false)` 以避免死結
- 在回傳 Task 的非同步方法中，請使用 `Task.FromException()` 傳遞例外，而非直接丟出

## 效能

- 多個任務並行執行時，請使用 `Task.WhenAll()`
- 實作逾時或取得第一個完成任務時，請使用 `Task.WhenAny()`
- 僅傳遞任務結果時，避免不必要的 async/await
- 長時間執行的操作請考慮使用取消權杖（CancellationToken）

## 常見陷阱

- 非同步程式碼中切勿使用 `.Wait()`、`.Result` 或 `.GetAwaiter().GetResult()`
- 避免混用阻塞與非同步程式碼
- 除了事件處理器外，請勿建立 async void 方法
- Task 回傳的方法務必使用 await

## 實作模式

- 長時間執行的操作請實作非同步命令模式
- 處理序列時請使用非同步串流（IAsyncEnumerable<T>）
- 公開 API 請考慮使用以任務為基礎的非同步模式（TAP）

當你檢查我的 C# 程式碼時，請找出上述問題並提出符合最佳實踐的改進建議。
