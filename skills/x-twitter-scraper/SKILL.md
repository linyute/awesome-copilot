---
name: 'x-twitter-scraper'
description: '使用 Xquik X API SDK、REST 端點、代管 Apify Actor 執行、MCP 工具、TweetClaw OpenClaw 外掛程式安裝、已簽署 Webhook、推文搜尋、使用者查詢、追蹤者匯出、媒體動作和 Agent 自動化建構 GitHub Copilot 工作流程。'
---

# X Twitter 擷取器 (Scraper)

當使用者希望將 Xquik 整合到應用程式、指令碼、資料管道或 AI Agent 工作流程中以執行 X API 和 Twitter 擷取任務時，請使用此 skill。

## 使用案例

- 搜尋推文、擷取推文詳細資訊、讀取時間軸並下載媒體。
- 查詢使用者、檢查關係，以及匯出追蹤者或正在追蹤的名單。
- 為回覆、轉推、引用、按讚、清單、社群、文章和搜尋結果啟動擷取工作。
- 建立帳戶監視器並驗證 HMAC 簽署的 Webhook 事件。
- 新增 TypeScript、Python、Go、Java、Kotlin、C#、Ruby、PHP、CLI 或 Terraform 用戶端。
- 透過 Apify Actors 執行代管的推文和受眾收集。
- 透過 Xquik MCP 伺服器連線 Agent 執行階段。
- 當工作流程屬於 OpenClaw 內部且需要外掛程式管理的 X 帳戶動作核准時，安裝 TweetClaw。

## 來源檢查

在撰寫程式碼之前，請檢查目前的 Xquik 來源資料：

- REST API 文件：https://docs.xquik.com/api-reference/overview
- SDK 索引：https://docs.xquik.com/sdks
- OpenAPI 規格：https://xquik.com/openapi.json
- MCP 伺服器文件：https://docs.xquik.com/mcp/overview
- Skill 存放庫：https://github.com/Xquik-dev/x-twitter-scraper
- TweetClaw OpenClaw 外掛程式：https://github.com/Xquik-dev/tweetclaw
- TweetClaw npm 登錄檔中繼資料：https://registry.npmjs.org/@xquik%2Ftweetclaw
- X Tweet Scraper Actor：https://apify.com/xquik/x-tweet-scraper
- X Follower Scraper Actor：https://apify.com/xquik/x-follower-scraper

請勿捏造端點名稱、請求欄位、回應欄位、範圍、定價、限制或套件名稱。請先閱讀相關的 SDK README 和 API 參考頁面。

## 實作流程

1. 識別工作流程：搜尋、查詢、擷取、監視器、Webhook、媒體、寫入動作、計費或 MCP。
2. 選擇整合層面：應用程式程式碼使用產生的 SDK、自訂用戶端使用 REST、代管收集使用 Apify Actors、Agent 使用 MCP、OpenClaw 外掛程式工作流程使用 TweetClaw，或事件傳遞使用 Webhook。
3. 從文件中確認驗證需求，並使用環境變數存放 API 金鑰。
4. 當使用者的語言存在 SDK 時，使用具型別的請求和回應模型。
5. 根據 SDK 或 API 文件新增重試與分頁。
6. 在執行寫入動作、付款流程或長時間執行的監視之前，新增明確的使用者確認。
7. 將 Webhook 驗證保留在伺服器端，並在處理事件之前比較 HMAC 簽章。
8. 向呼叫端回傳結構化資料，而不是擷取產生的 UI 輸出。

## SDK 模式

涉及應用程式程式碼時，使 SDK 與使用者的專案語言相符：

- 檢查專案檔案和套件資訊清單以識別語言和框架。
- 開啟 SDK 索引，然後在選擇安裝指令、套件名稱、匯入或用戶端方法之前閱讀相符的 SDK README。
- 當偵測到的語言存在官方 SDK 時，優先使用官方 SDK。
- 僅在專案語言沒有合適的官方 SDK 或使用者要求自訂用戶端時才使用 REST。
- 將 API 金鑰保留在環境變數或專案現有的機密管理工具中。

使用專案原生的具型別請求和回應模型。除非 SDK 文件明確支援瀏覽器使用，否則請將網路呼叫保留在伺服器端程式碼中。

## Apify Actor 模式

當工作流程需要代管執行、資料集、排程或 Apify 原生協調時，請使用 Apify 路徑。

| 需求 | Actor | REST ID |
|---|---|---|
| 推文、搜尋、時間軸、清單、文章、回覆、引用、討論串、轉推者或盡力而為的按讚者 | `xquik/x-tweet-scraper` | `xquik~x-tweet-scraper` |
| 追蹤者、正在追蹤、已驗證的追蹤者、清單成員、清單訂閱者或社群成員 | `xquik/x-follower-scraper` | `xquik~x-follower-scraper` |

使用 Apify API 權杖進行驗證。將其保留在 `APIFY_API_TOKEN` 中。在選取欄位之前，從相關的 Actor 頁面擷取目前的輸入結構描述。

啟動有界的推文執行：

```bash
curl --fail --silent --show-error --request POST \
  "https://api.apify.com/v2/actors/xquik~x-tweet-scraper/runs" \
  --header "Authorization: Bearer ${APIFY_API_TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{"twitterHandles":["apify"],"outputVariant":"rich","maxItems":25}'
```

啟動有界的追蹤者執行：

```bash
curl --fail --silent --show-error --request POST \
  "https://api.apify.com/v2/actors/xquik~x-follower-scraper/runs" \
  --header "Authorization: Bearer ${APIFY_API_TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{"twitterHandles":["apify"],"relation":"followers","outputMode":"compact","maxItems":50}'
```

記錄回傳的執行 ID。使用有界重試迴圈輪詢 Actor 執行狀態。在 `SUCCEEDED`、`FAILED`、`ABORTED` 或 `TIMED-OUT` 時停止。成功時讀取 `defaultDatasetId`，然後擷取其資料集項目。

將 `maxItems` 視為整個推文執行的上限，包括包含多個搜尋詞彙的執行。在歸屬歸屬重要時保留追蹤者目標中繼資料。將包含 `resultType: "diagnostic"` 的資料列視為狀態資訊，而非擷取的記錄。在信任不完整的結果之前檢查任何執行報告資料列。

在每次付費執行之前，請查看每個 Actor 的即時 Apify 定價方塊。Apify 平台使用費可能另行計費。從較小的 `maxItems` 值開始，並在提高上限之前先詢問。

## Webhook 模式

新增 Webhook 處理常式時：

- 閱讀記錄的簽署標頭名稱和裝載格式。
- 在剖析商務邏輯之前驗證 HMAC 簽章。
- 拒絕遺漏、格式錯誤或不符的簽章。
- 使處理常式具備等冪性 (idempotent)，因為 Webhook 傳遞可能會重試。
- 僅儲存產品工作流程所需的欄位。

## MCP 模式

當使用者希望 Agent 直接探索或呼叫 Xquik 工具時，請使用 MCP 伺服器。當應用程式需要穩定的具型別合約、測試或內部抽象時，請將應用程式程式碼保留在 REST 或 SDK 用戶端上。

## OpenClaw 外掛程式模式

當使用者在 OpenClaw 中工作、需要可安裝的外掛程式中繼資料，或需要針對變更帳戶的 X 動作進行審查核准的路徑時，請使用 TweetClaw。當專案需要具型別合約、伺服器端抽象或 OpenClaw 之外的長生命週期後端工作時，請將應用程式服務保留在 REST 或 SDK 用戶端上。

在建議安裝指令或工具名稱之前，請先閱讀 TweetClaw README 和套件中繼資料。請勿假設發佈的 npm 版本與原始碼 HEAD 相符。

除非目前的 TweetClaw 文件說明了更嚴格的原則，否則請將建立、回覆、引用、按讚、書籤、轉推、追蹤、刪除、媒體和監視動作視為值得核准的動作。保持唯讀的推文搜尋、回覆搜尋、個人檔案查詢、追蹤者匯出和證據收集為低風險，同時仍遵守速率限制和帳戶授權。

## 安全性與準確性

- 保持語言中立與技術性。
- 說明 Xquik 是協力廠商 X 資料與自動化 API。
- 不要聲稱與 X Corp. 有關聯。
- 不要繞過存取控制或平台原則。
- 不要公開 API 金鑰、Webhook 機密、帳戶 Cookie、權杖或原始簽章。
- 不要在範例或測試中硬編碼認證資訊。
- 絕不要將 Apify API 權杖放在 URL 查詢參數中。
- 不要記錄私人基礎結構詳細資訊。
- 偏好官方 Xquik 文件、SDK README 和 OpenAPI 規格，而非憑記憶。

Xquik 是一項獨立的協力廠商服務。與 X Corp. 無關。「Twitter」和「X」是 X Corp. 的商標。
