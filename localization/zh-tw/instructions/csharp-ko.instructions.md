---
description: 'C# 應用程式開發的程式碼撰寫規則 by @jgkim999'
applyTo: '**/*.cs'
---

# C# 程式碼撰寫規則

## 命名規則 (Naming Conventions)

一致的命名規則是程式碼可讀性的核心。建議遵循 Microsoft 的指南。

| 元素 | 命名規則 | 範例 |
|------|-----------|------|
| 介面 | 前綴 'I' + PascalCase | `IAsyncRepository`, `ILogger` |
| 公開(public) 成員 | PascalCase | `public int MaxCount;`, `public void GetData()` |
| 參數、區域變數 | camelCase | `int userCount`, `string customerName` |
| 私有/內部欄位 | 底線(_) + camelCase | `private string _connectionString;` |
| 常數 (const) | PascalCase | `public const int DefaultTimeout = 5000;` |
| 泛型型別參數 | 前綴 'T' + 描述性名稱 | `TKey`, `TValue`, `TResult` |
| 非同步方法 | 'Async' 後綴 | `GetUserAsync`, `DownloadFileAsync` |

## 程式碼格式和可讀性 (Formatting & Readability)

一致的格式使程式碼在視覺上更容易解析。

| 項目 | 規則 | 說明 |
|------|------|------|
| 縮排 | 使用 4 個空格 | 使用 4 個空格而不是 Tab。cs 檔案必須使用 4 個空格。 |
| 括號 | 始終使用大括號 {} | 即使控制語句 (if, for, while 等) 只有一行，也始終使用大括號。 |
| 空行 | 邏輯分離 | 在方法定義、屬性定義、邏輯分離的程式碼區塊之間添加空行。 |
| 語句撰寫 | 一行一個語句 | 一行只撰寫一個語句。 |
| var 關鍵字 | 僅在型別明確時使用 | 僅當變數的型別可以從右側明確推斷時才使用 var。 |
| 命名空間 | 使用檔案範圍命名空間 | C# 10 及更高版本使用檔案範圍命名空間以減少不必要的縮排。 |
| 註解 | 撰寫 XML 格式註解 | 始終為撰寫的類別或函數撰寫 XML 格式的註解。 |

## 語言功能使用 (Language Features)

利用最新的 C# 功能使程式碼更簡潔高效。

| 功能 | 說明 | 範例/參考 |
|------|------|------|
| 非同步程式設計 | 對 I/O 綁定操作使用 async/await | `async Task<string> GetDataAsync()` |
| ConfigureAwait | 減少函式庫程式碼中的上下文切換開銷 | `await SomeMethodAsync().ConfigureAwait(false)` |
| LINQ | 查詢和操作集合資料 | `users.Where(u => u.IsActive).ToList()` |
| 表達式主體成員 | 簡潔地表達簡單的方法/屬性 | `public string Name => _name;` |
| 可空引用型別 | 防止編譯時 NullReferenceException | `#nullable enable` |
| using 宣告 | 簡潔地處理 IDisposable 物件 | `using var stream = new FileStream(...);` |

## 性能和例外處理 (Performance & Exception Handling)

建立穩健且快速的應用程式的指南。

### 例外處理

只捕獲可以處理的具體例外。避免捕獲一般例外，例如 catch (Exception)。

不要將例外用於程式流程控制。例外只應用於意外的錯誤情況。

### 性能
s
重複連接字串時，請使用 StringBuilder 而不是 + 運算符。

使用 Entity Framework Core 時，對於只讀查詢，請使用 .AsNoTracking() 以提高性能。

避免不必要的物件分配，尤其是在迴圈中。

## 安全 (Security)

撰寫安全程式碼的基本原則。

| 安全領域 | 規則 | 說明 |
|------|------|------|
| 輸入驗證 | 驗證所有外部資料 | 不要信任來自外部（用戶、API 等）的所有資料，並始終驗證其有效性。 |
| SQL 注入防禦 | 使用參數化查詢 | 始終使用參數化查詢或 Entity Framework 等 ORM 來防止 SQL 注入攻擊。 |
| 敏感資料保護 | 使用配置管理工具 | 密碼、連接字串、API 金鑰等不應硬編碼在原始碼中，而應使用 Secret Manager、Azure Key Vault 等。 |

這些規則應整合到專案的 .editorconfig 檔案和團隊的程式碼審查流程中，以持續維護高品質的程式碼。