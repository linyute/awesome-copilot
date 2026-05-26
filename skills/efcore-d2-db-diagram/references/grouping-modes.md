# 分組模式 (Grouping Modes)

## bounded-context (領域邊界)

依據領域將資料表分組，使用資料夾、命名空間與命名線索。

範例：

- Clients (客戶)
- Offers (報價)
- Freelances (自由職業者)
- Billing (帳單)
- Audit (稽核)
- Identity (身分驗證)

## schema (資料庫綱要)

依據 `ToTable` 或遷移中的資料庫綱要進行分組。

## namespace (命名空間)

依據 C# 命名空間分組。

## flat (平面)

不建立容器。

對於小型綱要或使用者希望達到最大相容性時，請使用 flat 模式。
