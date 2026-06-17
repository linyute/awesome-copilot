---
name: x-twitter-scraper
description: '使用 Xquik X API SDK、REST 端點、MCP 工具、已簽署的 Webhook、推文搜尋、使用者查找、跟隨者匯出、媒體操作和代理程式自動化來建構 GitHub Copilot 工作流程。'
---

# X Twitter Scraper

當使用者想要將 Xquik 整合到應用程式、指令碼、資料管線或 AI 代理程式工作流程中，以執行 X API 和 Twitter scraper 任務時，請使用此技能。

## 使用案例

- 搜尋推文、獲取推文詳情、讀取時間軸並下載媒體。
- 查找使用者、檢查關係，並匯出跟隨者或正在跟隨的名單。
- 啟動回覆、轉推、引用、點讚、列表、社群、文章和搜尋結果的擷取作業。
- 建立帳戶監控器並驗證經過 HMAC 簽署的 Webhook 事件。
- 新增 TypeScript、Python、Go、Java、Kotlin、C#、Ruby、PHP、CLI 或 Terraform 用戶端。
- 透過 Xquik MCP 伺服器連接代理程式執行階段。

## 來源檢查

在撰寫程式碼之前，請檢查目前的 Xquik 來源資料：

- REST API 文件：https://docs.xquik.com/api-reference/overview
- SDK 索引：https://docs.xquik.com/sdks
- OpenAPI 規格：https://xquik.com/openapi.json
- MCP 伺服器文件：https://docs.xquik.com/mcp/overview
- 技能儲存庫：https://github.com/Xquik-dev/x-twitter-scraper

請勿虛構端點名稱、請求欄位、回應欄位、範圍、定價、限制或套件名稱。請先閱讀相關的 SDK README 和 API 參考頁面。

## 實作流程

1. 識別工作流程：搜尋、查找、擷取、監控、Webhook、媒體、寫入操作、計費或 MCP。
2. 選擇整合介面：用於應用程式程式碼的產出的 SDK、用於自訂用戶端的 REST、用於代理程式的 MCP，或用於事件遞送的 Webhook。
3. 從文件中確認驗證要求，並使用環境變數來儲存 API 金鑰。
4. 當存在適用於使用者語言的 SDK 時，請使用具型別的請求和回應模型。
5. 根據 SDK 或 API 文件新增重試和分頁。
6. 在執行寫入操作、付款流程或長時間執行的監控之前，請先取得使用者明確的確認。
7. 將 Webhook 驗證保留在伺服器端，並在處理事件之前比較 HMAC 簽章。
8. 將結構化資料回傳給呼叫者，而不是擷取產出的 UI 輸出。

## SDK 模式

涉及應用程式程式碼時，請讓 SDK 與使用者的專案語言相匹配：

- 檢查專案檔案和套件清單以識別語言和框架。
- 開啟 SDK 索引，然後在選擇安裝指令、套件名稱、匯入或用戶端方法之前閱讀相符的 SDK README。
- 當存在官方 SDK 時，優先使用適用於偵測到之語言的官方 SDK。
- 僅在專案語言沒有合適的官方 SDK 或使用者要求自訂用戶端時才使用 REST。
- 將 API 金鑰儲存在環境變數或專案現有的秘密管理員中。

使用專案原生的具型別請求和回應模型。除非 SDK 文件明確支援瀏覽器使用，否則請將網路呼叫保留在伺服器端程式碼中。

## Webhook 模式

新增 Webhook 處理常式時：

- 閱讀文件記載的簽署標頭名稱和承載格式。
- 在解析商業邏輯之前驗證 HMAC 簽章。
- 拒絕遺失、格式錯誤或不匹配的簽章。
- 由於 Webhook 遞送可能會重試，請使處理常式具備等冪性。
- 僅儲存產品工作流程所需的欄位。

## MCP 模式

當使用者想要代理程式直接探索或呼叫 Xquik 工具時，請使用 MCP 伺服器。當應用程式需要穩定的具型別合約、測試或內部抽象時，請將應用程式程式碼保留在 REST 或 SDK 用戶端上。

## 安全性與準確性

- 保持語言中立且具專業性。
- 聲明 Xquik 是第三方 X 資料和自動化 API。
- 請勿聲稱與 X Corp. 有隸屬關係。
- 請勿規避存取控制或平台政策。
- 請勿洩漏 API 金鑰、Webhook 秘密、帳戶 Cookie、權杖或原始簽章。
- 請勿在範例或測試中硬編碼認證資訊。
- 請勿記錄私有基礎設施細節。
- 優先使用官方 Xquik 文件、SDK README 和 OpenAPI 規格，而非憑記憶。
