---
description: "遵循 Symfony 官方最佳實踐的 Symfony 開發標準"
applyTo: "**/*.php, **/*.yaml, **/*.yml, **/*.xml, **/*.twig"
---

# Symfony 開發指示

遵循 Symfony 官方最佳實踐和核心框架哲學開發 Symfony 應用程式的指示。

## 專案背景
- Symfony（最新穩定版或 LTS）
- 預設 Symfony 目錄結構
- 啟用自動裝配 (Autowiring) 和自動配置 (Autoconfiguration)
- 需要持久化時使用 Doctrine ORM
- 使用 Twig 作為模板引擎
- 視需要使用 Symfony Forms, Validator, Security, Messenger
- 使用 PHPUnit 進行測試
- 在支援的地方使用基於屬性 (Attribute-based) 的配置

## 專案結構
- 使用預設的 Symfony 目錄結構
- 不要為應用程式程式碼建立 Bundles
- 使用 PHP 命名空間組織應用程式程式碼
- 配置存放在 `config/`，應用程式程式碼存放在 `src/`，模板存放在 `templates/`

## 配置

### 環境配置
- 對於與基礎設施相關的配置使用環境變數
- 使用 `.env` 檔案定義特定環境的數值
- 不要使用環境變數來控制應用程式行為

### 敏感配置
- 使用 Symfony Secrets 儲存秘密資訊（API 金鑰、憑證）
- 絕不將秘密資訊提交至儲存庫

### 應用程式配置
- 在 `config/services.yaml` 中使用參數 (Parameters) 進行應用程式行為配置
- 僅在需要時為每個環境覆寫參數
- 參數加上 `app.` 前綴以避免衝突
- 使用簡短且具描述性的參數名稱
- 對於鮮少變動的配置值使用 PHP 常數

## 服務與相依注入 (Dependency Injection)
- 獨佔使用相依注入
- 優先使用建構子注入 (Constructor injection)
- 預設使用自動裝配和自動配置
- 儘可能保持服務為私有 (Private)
- 避免透過 `$container->get()` 存取服務
- 優先使用 YAML 格式進行服務配置
- 在能提高解耦或清晰度的情況下使用介面 (Interfaces)

## 控制器 (Controllers)
- 繼承 `AbstractController`
- 保持控制器精簡，專注於銜接程式碼 (Glue code)
- 不要將商業邏輯放在控制器中
- 使用屬性配置路由、快取和安全性
- 對服務使用相依注入
- 在方便且適當時使用實體值解析器 (Entity Value Resolvers)
- 需要時透過儲存庫 (Repositories) 顯式執行複雜查詢

## Doctrine 與持久化
- 將 Doctrine 實體視為純 PHP 物件
- 使用 PHP 屬性定義 Doctrine 映射 (Mapping)
- 使用儲存庫查詢資料
- 避免在儲存庫中加入商業邏輯
- 對所有 Schema 變更使用遷移 (Migrations)

## 模板 (Twig)
- 模板名稱、目錄和變數使用 snake_case
- 模板片段 (Fragments) 加上底線前綴
- 保持模板專注於呈現
- 避免在 Twig 模板中加入商業邏輯
- 預設對輸出進行逸碼 (Escape) 處理
- 除非內容受信任且已清理，否則避免使用 `|raw`

## 表單 (Forms)
- 將表單定義為 PHP 類別
- 不要直接在控制器中建立表單
- 在模板中新增表單按鈕，而非在表單類別中
- 在底層物件上定義驗證約束 (Validation constraints)
- 使用單一控制器動作來渲染和處理每個表單
- 僅在需要多個提交按鈕時才在控制器中定義提交按鈕

## 驗證 (Validation)
- 使用 Symfony Validator 約束
- 在應用程式邊界驗證資料
- 當需要重用時，優先選擇物件層級驗證而非僅限表單的驗證

## 國際化
- 使用 XLIFF 作為翻譯檔案
- 使用翻譯鍵 (Translation keys) 而非字面內容字串
- 使用表達目的而非表達位置的具描述性鍵名

## 安全性
- 除非需要多個系統，否則優先使用單一防火牆
- 使用自動密碼雜湊器 (Auto password hasher)
- 對於複雜的授權邏輯使用投票器 (Voters)
- 避免在屬性中使用複雜的安全性運算式

## 網頁資產 (Web Assets)
- 使用 AssetMapper 管理網頁資產
- 除非必要，否則避免不的前端建構複雜性

## 非同步處理
- 使用 Symfony Messenger 處理非同步和背景任務
- 保持訊息處理常式 (Message handlers) 簡小且專注
- 為失敗的訊息配置失敗傳輸 (Failure transports)

## 測試
- 使用 `WebTestCase` 撰寫功能測試
- 新增冒煙測試 (Smoke tests) 以確保所有公開 URL 都能成功回應
- 在功能測試中硬編碼 URL，而非生成路由
- 在適當情況下對孤立邏輯使用單元測試
- 隨著應用程式演進，增量地新增更具體的測試

## 一般指南
- 優先考慮清晰度而非抽象化
- 在引入自訂模式前，先遵循 Symfony 慣例
- 保持配置顯式且具可讀性
- 避免過早最佳化
- 使用 Symfony Demo 作為參考實作
