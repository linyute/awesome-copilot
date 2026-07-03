---
name: x-twitter-scrape
description: '使用 Xquik X API SDK、REST 端點、MCP 工具、TweetClaw OpenClaw 外掛程式安裝、已簽章 Webhook、推文搜尋、使用者查閱、追隨者匯出、媒體動作和代理程式自動化來建置 GitHub Copilot 工作流程。'
---

# X Twitter 擷取器

當使用者想要將 Xquik 整合至應用程式、指令碼、資料管道或 AI 代理程式工作流程以執行 X API 和 Twitter 擷取器任務時，請使用此技能。

## 使用案例

- 搜尋推文、擷取推文詳細資料、讀取時間軸並下載媒體。
- 查詢使用者、檢查關係，並匯出追隨者或追隨中名單。
- 啟動回覆、轉推、引用、按讚、列表、社群、文章和搜尋結果的擷取工作。
- 建立帳戶監控器並驗證經過 HMAC 簽章的 webhook 事件。
- 新增 TypeScript、Python、Go、Java、Kotlin、C#、Ruby、PHP、CLI 或 Terraform 用戶端。
- 透過 Xquik MCP 伺服器連接代理程式執行階段。
- 當工作流程屬於 OpenClaw 內部且需要外掛程式管理的 X 帳戶動作核准時，安裝 TweetClaw。

## 來源檢查

在編寫程式碼之前，請檢查目前的 Xquik 來源資料：

- REST API 文件：https://docs.xquik.com/api-reference/overview
- SDK 索引：https://docs.xquik.com/sdks
- OpenAPI 規格：https://xquik.com/openapi.json
- MCP 伺服器文件：https://docs.xquik.com/mcp/overview
- 技能存放庫：https://github.com/Xquik-dev/x-twitter-scraper
- TweetClaw OpenClaw 外掛程式：https://github.com/Xquik-dev/tweetclaw
- TweetClaw npm 登錄表 Metadata：https://registry.npmjs.org/@xquik%2Ftweetclaw

請勿虛構端點名稱、要求欄位、回應欄位、範圍、定價、限制或套件名稱。請先閱讀相關的 SDK README 和 API 參考頁面。

## 實作流程

1. 識別工作流程：搜尋、查詢、擷取、監控、webhook、媒體、寫入動作、計費或 MCP。
2. 選擇整合層面：用於應用程式程式碼的產出 SDK、用於自訂用戶端的 REST、用於代理程式的 MCP、用於 OpenClaw 外掛程式工作流程的 TweetClaw，或用於事件傳遞的 webhook。
3. 從文件中確認驗證要求，並將環境變數用於 API 金鑰。
4. 當使用者的語言存在 SDK 時，使用具型別的要求和回應模型。
5. 根據 SDK 或 API 文件新增重試與分頁。
6. 在進行寫入動作、付款流程或長期監控之前，新增明確的使用者確認。
7. 保持伺服器端的 webhook 驗證，並在處理事件之前比較 HMAC 簽章。
8. 向呼叫者傳回結構化資料，而不是抓取產出的 UI 輸出。

## SDK 模式

涉及應用程式程式碼時，請將 SDK 與使用者的專案語言進行比對：

- 檢查專案檔案和套件清單以識別語言和框架。
- 開啟 SDK 索引，然後在選擇安裝指令、套件名稱、匯入或用戶端方法之前，閱讀符合的 SDK README。
- 當偵測到的語言存在官方 SDK 時，優先使用它。
- 僅在專案語言沒有適合的官方 SDK 或使用者要求自訂用戶端時，才使用 REST。
- 將 API 金鑰保留在環境變數或專案現有的秘密管理工具中。

使用專案原生的型別要求和回應模型。除非 SDK 文件明確支援瀏覽器使用，否則請將網路呼叫保留在伺服器端程式碼中。

## Webhook 模式

新增 webhook 處理常式時：

- 閱讀文件記載的簽章標頭名稱與承載格式。
- 在解析業務邏輯之前驗證 HMAC 簽章。
- 拒絕缺失、格式錯誤或不相符的簽章。
- 由於 webhook 傳送可能會重試，請使處理常式具備等冪性。
- 僅儲存產品工作流程所需的欄位。

## MCP 模式

當使用者希望代理程式直接探索或呼叫 Xquik 工具時，請使用 MCP 伺服器。當應用程式需要穩定的型別合約、測試或內部抽象時，請將應用程式程式碼保留在 REST 或 SDK 用戶端上。

## OpenClaw 外掛程式模式

當使用者在 OpenClaw 中工作、需要可安裝的外掛程式 metadata，或需要針對變更帳戶的 X 動作進行審查核准的路徑時，請使用 TweetClaw。當專案需要型別合約、伺服器端抽象或 OpenClaw 之外的長期執行後端工作時，請將應用程式服務保留在 REST 或 SDK 用戶端上。

在建議安裝指令或工具名稱之前，請閱讀 TweetClaw README 和套件 metadata。請勿假設發佈的 npm 版本與來源 HEAD 一致。

除非目前的 TweetClaw 文件有更窄的政策規定，否則請將建立、回覆、引用、按讚、書籤、轉推、追隨、刪除、媒體和監控動作視為需要核准的事項。保持唯讀的推文搜尋、回覆搜尋、個人檔案查詢、追隨者匯出和證據收集為低風險，同時仍需遵守速率限制和帳戶授權。

## 安全性與精確性

- 保持語言中立和技術性。
- 聲明 Xquik 是第三方 X 資料與自動化 API。
- 請勿聲稱與 X 公司有隸屬關係。
- 請勿規避存取控制或平台政策。
- 請勿洩露 API 金鑰、webhook 秘密、帳戶 Cookie、權杖或原始簽章。
- 請勿在範例或測試中硬編碼憑證。
- 請勿記錄私有基礎架構詳細資料。
- 優先使用官方 Xquik 文件、SDK README 和 OpenAPI 規格，而非憑記憶。
