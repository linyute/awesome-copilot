# 可執行的食譜範例

此資料夾包含針對每份 Cookbook 食譜的獨立、可執行的 C# 範例。這些是 [基於檔案的應用程式 (file-based apps)](https://learn.microsoft.com/dotnet/core/sdk/file-based-apps)，可以直接使用 `dotnet run` 執行。

## 先決條件

- .NET 10.0 或更高版本
- GitHub Copilot SDK 套件（自動引用）

## 執行範例

每個 `.cs` 檔案都是一個完整、可執行的程式。只需使用：

```bash
dotnet run <檔名>.cs
```

### 可用的食譜

| 食譜                 | 命令                                 | 說明                                       |
| -------------------- | ------------------------------------ | ------------------------------------------ |
| 錯誤處理             | `dotnet run error-handling.cs`       | 示範錯誤處理模式                           |
| 多個工作階段         | `dotnet run multiple-sessions.cs`    | 管理多個獨立的對話                         |
| 管理本機檔案         | `dotnet run managing-local-files.cs` | 使用 AI 分組組織檔案                       |
| PR 視覺化            | `dotnet run pr-visualization.cs`     | 產生 PR 時長圖表                           |
| 持續性工作階段       | `dotnet run persisting-sessions.cs`  | 跨重新啟動儲存並恢復工作階段               |

### 帶有引數的範例

**針對特定儲存庫的 PR 視覺化：**

```bash
dotnet run pr-visualization.cs -- --repo github/copilot-sdk
```

**管理本機檔案（先編輯檔案以更改目標資料夾）：**

```bash
# 先編輯 managing-local-files.cs 中的 targetFolder 變數
dotnet run managing-local-files.cs
```

## 基於檔案的應用程式 (File-Based Apps)

這些範例使用 .NET 的基於檔案的應用程式功能，允許單檔案 C# 程式：

- 在沒有專案檔案的情況下執行
- 自動引用常見套件
- 支援頂層語句 (top-level statements)

## 學習資源

- [.NET 基於檔案的應用程式文件](https://learn.microsoft.com/en-us/dotnet/core/sdk/file-based-apps)
- [GitHub Copilot SDK 文件](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md)
- [上層 Cookbook](../README.md)
