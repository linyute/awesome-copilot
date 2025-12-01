---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '建立具備正確 OpenAPI 文件的 ASP.NET Minimal API 端點'
---

# ASP.NET Minimal API 與 OpenAPI

你的目標是協助我建立結構良好的 ASP.NET Minimal API 端點，並具備正確型別與完整的 OpenAPI/Swagger 文件。

## API 組織

- 使用 `MapGroup()` 擴充方法將相關端點分組
- 以端點過濾器處理橫切關注點
- 大型 API 可用獨立端點類別結構化
- 複雜 API 可考慮採用以功能為基礎的資料夾結構

## 請求與回應型別

- 明確定義請求與回應 DTO/模型
- 建立具備正確驗證屬性的模型類別
- 不可變請求/回應物件可用 record 型別
- 屬性名稱需具意義且符合 API 設計標準
- 使用 `[Required]` 及其他驗證屬性強制約束
- 使用 ProblemDetailsService 與 StatusCodePages 取得標準錯誤回應

## 型別處理

- 路由參數採強型別並明確綁定型別
- 用 `Results<T1, T2>` 表示多種回應型別
- 回傳 `TypedResults` 以獲得強型別回應
- 善用 C# 10+ 新功能如 nullable 標註與 init-only 屬性

## OpenAPI 文件

- 使用 .NET 9 內建的 OpenAPI 文件支援
- 定義操作摘要與描述
- 以 `WithName` 擴充方法加入 operationId
- 屬性與參數加上 `[Description()]` 描述
- 正確設定請求與回應的內容型別
- 用文件轉換器加入伺服器、標籤與安全機制等元素
- 用 schema 轉換器自訂 OpenAPI schema
