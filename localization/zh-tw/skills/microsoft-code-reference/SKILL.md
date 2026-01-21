---
name: microsoft-code-reference
description: 查詢 Microsoft API 參考、尋找可執行的程式碼範例，並驗證 SDK 程式碼是否正確。在處理 Azure SDK、.NET 函式庫或 Microsoft API 時使用——用以尋找正確的方法、檢查參數、取得可執行的範例或疑難排解錯誤。透過查詢官方文件來捕捉虛構的方法、錯誤的簽章以及淘汰的模式。
compatibility: 需要 Microsoft Learn MCP 伺服器 (https://learn.microsoft.com/api/mcp)
---

# Microsoft 程式碼參考 (Microsoft Code Reference)

## 工具

| 需求 | 工具 | 範例 |
|------|------|---------|
| API 方法/類別查詢 | `microsoft_docs_search` | `"BlobClient UploadAsync Azure.Storage.Blobs"` |
| 可執行的程式碼範例 | `microsoft_code_sample_search` | `query: "upload blob managed identity", language: "python"` |
| 完整的 API 參考 | `microsoft_docs_fetch` | 從 `microsoft_docs_search` 擷取 URL (用於多載、完整簽章) |

## 尋找程式碼範例

使用 `microsoft_code_sample_search` 取得官方且可執行的範例：

```
microsoft_code_sample_search(query: "upload file to blob storage", language: "csharp")
microsoft_code_sample_search(query: "authenticate with managed identity", language: "python")
microsoft_code_sample_search(query: "send message service bus", language: "javascript")
```

**何時使用：**
- 在撰寫程式碼之前——尋找可遵循的可執行模式
- 發生錯誤之後——將你的程式碼與已知的良好範例進行比較
- 不確定初始化/設定時——範例會顯示完整的內容

## API 查詢

```
# 驗證方法是否存在 (包含命名空間以提高精確度)
"BlobClient UploadAsync Azure.Storage.Blobs"
"GraphServiceClient Users Microsoft.Graph"

# 尋找類別/介面
"DefaultAzureCredential class Azure.Identity"

# 尋找正確的套件
"Azure Blob Storage NuGet package"
"azure-storage-blob pip package"
```

當方法有多個多載 (overloads) 或你需要完整的參數細節時，請擷取完整頁面。

## 疑難排解錯誤

使用 `microsoft_code_sample_search` 尋找可執行的程式碼範例並與你的實作進行比較。針對特定錯誤，請使用 `microsoft_docs_search` 和 `microsoft_docs_fetch`：

| 錯誤類型 | 查詢 |
|------------|-------|
| 找不到方法 | `"[ClassName] methods [Namespace]"` |
| 找不到類型 | `"[TypeName] NuGet package namespace"` |
| 錯誤的簽章 | `"[ClassName] [MethodName] overloads"` → 擷取完整頁面 |
| 淘汰 (Deprecated) 警告 | `"[OldType] migration v12"` |
| 驗證失敗 | `"DefaultAzureCredential troubleshooting"` |
| 403 禁止存取 (Forbidden) | `"[ServiceName] RBAC permissions"` |

## 何時驗證

務必在以下情況進行驗證：
- 方法名稱看起來「太過方便」(例如 `UploadFile` 對比實際的 `Upload`)
- 混合使用 SDK 版本 (v11 `CloudBlobClient` 對比 v12 `BlobServiceClient`)
- 套件名稱未遵循慣例 (.NET 為 `Azure.*`，Python 為 `azure-*`)
- 第一次使用某個 API 時

## 驗證工作流程

在使用 Microsoft SDK 產生程式碼之前，請驗證其正確性：

1. **確認方法或套件是否存在** — `microsoft_docs_search(query: "[ClassName] [MethodName] [Namespace]")`
2. **擷取完整細節** (用於多載/複雜參數) — `microsoft_docs_fetch(url: "...")`
3. **尋找可執行的範例** — `microsoft_code_sample_search(query: "[task]", language: "[lang]")`

對於簡單的查詢，僅執行步驟 1 可能就足夠了。對於複雜的 API 使用，請完成所有三個步驟。
