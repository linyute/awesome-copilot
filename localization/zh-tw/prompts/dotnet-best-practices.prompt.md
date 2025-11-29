---
mode: 'agent'
description: '確保 .NET/C# 程式碼符合本解決方案/專案的最佳實踐。'
---

# .NET/C# 最佳實踐

你的任務是確保 ${selection} 中的 .NET/C# 程式碼符合本解決方案/專案的最佳實踐，包括：

## 文件與結構

- 為所有公開類別、介面、方法與屬性撰寫完整 XML 文件註解
- XML 註解需包含參數說明與回傳值說明
- 遵循命名空間結構：{Core|Console|App|Service}.{Feature}

## 設計模式與架構

- 相依性注入建議使用主建構式語法（如 `public class MyClass(IDependency dependency)`）
- 以泛型基底類別實作 Command Handler 模式（如 `CommandHandler<TOptions>`）
- 介面分離並明確命名（介面以 'I' 為前綴）
- 複雜物件建立建議採用工廠模式

## 相依性注入與服務

- 建構式注入並以 ArgumentNullException 檢查 null
- 依適當生命週期註冊服務（Singleton、Scoped、Transient）
- 採用 Microsoft.Extensions.DependencyInjection 樣式
- 為服務實作介面以利測試

## 資源管理與本地化

- 使用 ResourceManager 管理本地化訊息與錯誤字串
- LogMessages 與 ErrorMessages 應分開資源檔
- 透過 `_resourceManager.GetString("MessageKey")` 取得資源

## 非同步模式

- 所有 I/O 操作與長時間任務皆使用 async/await
- 非同步方法回傳 Task 或 Task<T>
- 適當時使用 ConfigureAwait(false)
- 妥善處理非同步例外

## 測試標準

- 使用 MSTest 框架，斷言採用 FluentAssertions
- 遵循 AAA 模式（Arrange, Act, Assert）
- 使用 Moq 模擬相依元件
- 測試成功與失敗情境
- 包含 null 參數驗證測試

## 設定與組態

- 使用強型別組態類別並加上資料註解
- 實作驗證屬性（Required, NotEmptyOrWhitespace）
- 組態綁定採用 IConfiguration
- 支援 appsettings.json 組態檔

## Semantic Kernel 與 AI 整合

- 使用 Microsoft.SemanticKernel 處理 AI 操作
- 正確設定 kernel 與服務註冊
- 處理 AI 模型設定（ChatCompletion、Embedding 等）
- 採用結構化輸出模式以確保 AI 回應可靠

## 錯誤處理與記錄

- 使用 Microsoft.Extensions.Logging 進行結構化記錄
- 以有意義的內容進行範疇記錄
- 拋出具描述性的例外
- 預期失敗情境使用 try-catch

## 效能與安全

- 適用時採用 C# 12+ 與 .NET 8 最佳化
- 實作正確的輸入驗證與清理
- 資料庫操作採用參數化查詢
- AI/ML 操作遵循安全程式設計

## 程式碼品質

- 確保符合 SOLID 原則
- 透過基底類別與工具避免程式碼重複
- 命名具意義且反映領域概念
- 方法聚焦且具內聚性
- 正確實作資源釋放模式
