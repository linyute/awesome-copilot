---
name: microsoft-code-reference
description: 查詢 Microsoft API 參考、尋找可執行的程式碼範例，並驗證 SDK 程式碼是否正確。在處理 Azure SDK、.NET 函式庫或 Microsoft API 時使用 — 以尋找正確的方法、檢查參數、獲取可執行的範例或對錯誤進行疑難排解。透過查詢官方文件來捕捉幻覺方法、錯誤簽章和過時模式。
compatibility: 與 Microsoft Learn MCP 伺服器 (https://learn.microsoft.com/api/mcp) 搭配使用效果最佳。也可以使用 mslearn CLI 作為備案。
---

# Microsoft 程式碼參考 (Microsoft Code Reference)

## 工具

| 需求 | 工具 | 範例 |
|------|------|---------|
| API 方法/類別查詢 | `microsoft_docs_search` | `"BlobClient UploadAsync Azure.Storage.Blobs"` |
| 可執行的程式碼範例 | `microsoft_code_sample_search` | `query: "upload blob managed identity", language: "python"` |
| 完整 API 參考 | `microsoft_docs_fetch` | 從 `microsoft_docs_search` 獲取 URL (用於多載、完整簽章) |

## 尋找程式碼範例

使用 `microsoft_code_sample_search` 獲取官方且可執行的範例：

```
microsoft_code_sample_search(query: "upload file to blob storage", language: "csharp")
microsoft_code_sample_search(query: "authenticate with managed identity", language: "python")
microsoft_code_sample_search(query: "send message service bus", language: "javascript")
```

**何時使用：**
- 在編寫程式碼之前 — 尋找可遵循的工作模式
- 發生錯誤後 — 將您的程式碼與已知良好的範例進行比較
- 不確定初始化/設定時 — 範例顯示了完整的上下文

## API 查詢

```
# 驗證方法是否存在 (包含命名空間以確保精確度)
"BlobClient UploadAsync Azure.Storage.Blobs"
"GraphServiceClient Users Microsoft.Graph"

# 尋找類別/介面
"DefaultAzureCredential class Azure.Identity"

# 尋找正確的套件
"Azure Blob Storage NuGet package"
"azure-storage-blob pip package"
```

當方法有多個多載 (overload) 或您需要完整的參數細節時，請獲取完整頁面。

## 錯誤疑難排解

使用 `microsoft_code_sample_search` 尋找可執行的程式碼範例，並與您的實作進行比較。對於特定錯誤，使用 `microsoft_docs_search` 和 `microsoft_docs_fetch`：

| 錯誤類型 | 查詢 |
|------------|-------|
| 找不到方法 | `"[ClassName] methods [Namespace]"` |
| 找不到型別 | `"[TypeName] NuGet package namespace"` |
| 錯誤簽章 | `"[ClassName] [MethodName] overloads"` → 獲取完整頁面 |
| 過時警告 | `"[OldType] migration v12"` |
| 驗證失敗 | `"DefaultAzureCredential troubleshooting"` |
| 403 Forbidden | `"[ServiceName] RBAC permissions"` |

## 何時驗證

在以下情況下務必進行驗證：
- 方法名稱看起來「太方便」(例如 `UploadFile` vs 實際的 `Upload`)
- 混合使用 SDK 版本 (v11 `CloudBlobClient` vs v12 `BlobServiceClient`)
- 套件名稱不符合慣例 (.NET 為 `Azure.*`，Python 為 `azure-*`)
- 第一次使用某個 API

## 驗證工作流

在使用 Microsoft SDK 產生程式碼之前，驗證其是否正確：

1. **確認方法或套件是否存在** — `microsoft_docs_search(query: "[ClassName] [MethodName] [Namespace]")`
2. **獲取完整細節** (用於多載/複雜參數) — `microsoft_docs_fetch(url: "...")`
3. **尋找可執行的範例** — `microsoft_code_sample_search(query: "[任務]", language: "[語言]")`

對於簡單查詢，僅執行步驟 1 即可。對於複雜的 API 使用，請完成所有三個步驟。

## CLI 替代方案

如果 Learn MCP 伺服器不可用，請改用終端機或 shell (例如 Bash、PowerShell 或 cmd) 中的 `mslearn` CLI：

```sh
# 直接執行 (無需安裝)
npx @microsoft/learn-cli search "BlobClient UploadAsync Azure.Storage.Blobs"

# 或全域安裝後執行
npm install -g @microsoft/learn-cli
mslearn search "BlobClient UploadAsync Azure.Storage.Blobs"
```

| MCP 工具 | CLI 命令 |
|----------|-------------|
| `microsoft_docs_search(query: "...")` | `mslearn search "..."` |
| `microsoft_code_sample_search(query: "...", language: "...")` | `mslearn code-search "..." --language ...` |
| `microsoft_docs_fetch(url: "...")` | `mslearn fetch "..."` |

對 `search` 或 `code-search` 傳遞 `--json` 以獲取原始 JSON 輸出供進一步處理。
