# ContextMatic 外掛程式

程式碼編寫代理程式 (Coding agents) 有時會產生 API 的幻覺。APIMatic Context 為它們提供了經策劃且具版本控制的 API 和 SDK 文件。

當開發者要求他們的代理程式「整合支付 API」時，它通常會猜測，並從過時的訓練資料或不符合實際 SDK 的通用模式中提取資訊。ContextMatic 透過在代理程式需要時，精確地提供權威、具版本意識且原生於 SDK 的內容，解決了這個問題。

## 包含的內容

### MCP 伺服器

| 伺服器          | 描述                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `context-matic` | 用於具版本意識的第三方 API 整合和 SDK 探索的託管 MCP 伺服器。 |

### 技能

| 技能                      | 描述                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/integrate-context-matic` | 使用權威 SDK 和端點資訊整合支援的第三方 API 的專注工作流程。 |
| `/onboard-context-matic`   | ContextMatic MCP 伺服器、支援的 API 和工具使用方式的引導式說明。                            |

## ContextMatic 的功能

ContextMatic 為 GitHub Copilot 提供基於真實 API 定義和 SDK 的版本意識 API 和 SDK 指導，而非通用的公開範例。它有助於：

- 依專案程式語言進行 API 探索
- 驗證和入門指南
- 包含參數和回應詳細資訊的端點查詢
- 包含型別屬性定義的模組查詢

## 支援的 API

此外掛程式為下列 API 提供原生於 SDK 的內容，適用於 TypeScript、C#、Python、Java、PHP 和 Ruby：

| API                            | 描述                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| **Adyen API**                  | 支付處理：檢索付款方式、建立訂單、管理儲存的付款權杖 |
| **Google Maps APIs**           | 位置服務：地理編碼、導航、距離矩陣、海拔、道路和地點   |
| **PayPal Server SDK**          | 支付流程：訂單、付款、保險庫 (vault)、交易搜尋和訂閱             |
| **PayQuicker API**             | 支付與金融服務：方案協議、銀行帳戶、消費返還報價       |
| **Slack API**                  | 工作區自動化：OAuth 機器人、訊息傳遞、對話管理                      |
| **Spotify Web API**            | 音樂與 Podcast：媒體庫管理、播放控制、探索                       |
| **Tesla Fleet Management API** | 車輛與車隊營運：充電紀錄、車輛指令、能源管理       |
| **Tesser API Portal**          | 數位支付：支付意圖、鏈上支付、應用程式管理                       |
| **Twilio API**                 | 通訊：簡訊、語音、影片與驗證服務                              |

此清單持續增加中。[建議新的 API](#contributing) 以請求支援未列出的內容。

---

## 外掛程式為代理程式提供的功能

安裝後，外掛程式會向代理程式公開七個工具。每個工具都對應到整合工作流程的特定階段：

| 工具              | 啟用的開發者任務                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch_api`       | 提供精確的 API 匹配，或列出所提供 `language` 的所有可用 API，包含每個 API 的名稱、金鑰與描述。輸入專案的程式語言與 API `key` 進行精確匹配查詢（僅傳回該 API）。若未找到精確匹配，則會傳回該 `language` 的完整 API 目錄。代理程式會優先呼叫此工具以探索哪些 API 可用。 |
| `ask`             | 與 API Copilot 對話以獲取逐步整合指南與一般 API 問題：驗證設定、用戶端初始化、功能行為、框架特定模式（例如：「如何在 Laravel 中初始化 Twilio 用戶端？」），以及符合慣例的 SDK 程式碼範例。                                                                             |
| `endpoint_search` | 依方法名稱傳回 SDK 端點方法的描述、輸入參數與回應形式。                                                                                                                            |
| `model_search`    | 依名稱傳回 SDK 模型完整定義及其型別屬性。在編寫建構請求主體或讀取回應物件的程式碼之前呼叫此工具。                                                                                                                                      |
| `update_activity` | 記錄具體的整合里程碑，例如 SDK 設定、驗證設定、首次成功的 API 呼叫與已解決的錯誤。代理程式會在程式碼或基礎架構中實際達成里程碑後呼叫此工具。                                                                                                       |
| `add_guidelines`  | 加入特定語言的指導檔案，例如安全、測試或工作流程指導，代理程式可在實作過程中遵循這些內容。                                                                                                                                |
| `add_skills`      | 加入可重複使用的專案技能，例如 `{language}-conventions`，以便日後的 API 整合工作能遵循專案的語言特定慣例。                                                                                                                   |

如需關於整合使用這些工具的逐步指導，請在您的代理程式中呼叫 `/integrate-context-matic` 技能。它會告知代理程式在整合工作流程中何時以及如何呼叫每個工具。

---

## 從提示詞到程式碼：工具如何協作

這七種工具旨在於自然整合工作流程中串連。以下是代理程式在收到實際任務時，幕後發生的具體範例：

**您的提示詞：** _"/integrate-context-matic 將 Twilio 簡訊通知加入到我的 Next.js 應用程式。當訂單出貨時發送簡訊。""_

| 步驟 | 呼叫的工具                                                                       | 回傳內容                                                                                                                                                           |
| ---- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `add_guidelines` (`language=typescript`)                                          | 加入代理程式在開始 API 整合前可遵循的安全、測試與實作工作流程的專案指導檔案。                                 |
| 2    | `add_skills` (`language=typescript`)                                              | 加入可重複使用的語言特定技能（例如慣例指導），以便專案設定符合未來的整合工作。                                                 |
| 3    | `fetch_api` (`language=typescript`, `key="twilio"`)                               | 找到精確匹配 — 傳回 Twilio 的條目及其名稱、金鑰與描述                                                                                            |
| 4    | `ask` (`key=twilio`, query=_"如何初始化 Twilio TypeScript 用戶端？"_) | 傳回包含驗證設定的精確 SDK 設定程式碼                                                                                                                      |
| 5    | `update_activity` (`milestone=auth_configured`)                                   | 在傳回的 SDK/驗證設定加入應用程式後，記錄憑證已連線至應用程式，且整合已準備好進行首次即時呼叫 |
| 6    | `endpoint_search` (`query=createMessage`)                                         | 傳回簡訊發送端點的方法簽章、必要參數與驗證需求                                                                        |
| 7    | `model_search` (`query=CreateMessageRequest`)                                     | 傳回包含所有可用欄位的完整型別請求模型                                                                                                           |
| 8    | `ask` (`query="如何在 Next.js 中處理送達狀態回呼？"`)           | 傳回符合 Twilio SDK 的 Webhook 處理程式碼                                                                                                                   |

每個步驟只需一次工具呼叫即可完成。代理程式負責協調。您描述目標，它會在適當時機選擇正確的工具。

## MCP 伺服器

此外掛程式使用 ContextMatic MCP 端點：

```text
https://chatbotapi.apimatic.io/mcp/plugins
```

外掛程式透過其外掛程式根目錄的 `.mcp.json` 檔案註冊 MCP 伺服器，因此伺服器可與內建技能一起使用。

---

## 數分鐘內建構完整應用程式

<details>
<summary><strong>PayPal 即時店面 — Node.js/Express · 30 分鐘</strong></summary>

![PayPal](https://img.shields.io/badge/-PayPal-003087?logo=paypal&logoColor=white&labelColor=003087) ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white&labelColor=339933) ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white&labelColor=000000) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&labelColor=F7DF1E)

![paypalsampleapp](https://github.com/user-attachments/assets/dc3e5b02-934e-44b5-9df9-20387557babe)

**建構內容：** 一個完整的 Node.js/Express 店面，具備產品管理、每個產品可分享的結帳連結、PayPal 智慧支付按鈕、伺服器端訂單建立與擷取，以及支付歷史紀錄儀表板。

**提示詞：**

```
/integrate-context-matic 為我建構一個「PayPal 即時店面」應用程式。
此應用程式有一個設定頁面，我只需在此輸入一次 PayPal client-id 與 secret，然後
是一個產品建立表單，輸入產品名稱、描述、價格、貨幣，
並上傳或提供產品圖片。當我點擊「產生結帳頁面」時，它會
建立一個即時、可分享的結帳 URL，例如 /checkout/abc123，任何人都可以打開 —
他們會看到包含圖片、價格、描述的產品詳細資訊以及可運作的 PayPal
智慧支付按鈕。支付流程應完全在伺服器端使用 PayPal
Server SDK 進行：後端在買家點擊付款時建立訂單，核准後擷取訂單，
並顯示包含訂單詳細資訊的確認頁面。我可以建立多個產品，每個產品都有其唯一的可分享結帳連結。
包含一個簡單的儀表板，我可以在其中查看所有產品及其結帳連結，外加
一份已完成付款的清單，顯示每個產品的訂單 ID、買家資訊、
金額與狀態。結帳頁面應具備行動裝置回應式，並看起來像專業的產品頁面。透過
環境變數支援沙盒與即時模式。僅使用 Orders API 與 Payments API，請勿使用
Transaction Search 或 Vault。使其可透過 npm install 與 npm start 進行部署。
```

**工具使用方式：**

| 步驟 | 工具              | 查詢                             | 回傳內容                                                                                   |
| ---- | ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | `fetch_api`       | `language=typescript`             | 可用 API；識別出金鑰為 `paypal` 的 PayPal Server SDK                                     |
| 2    | `ask`             | SDK 設定與環境切換 | 用戶端初始化程式碼、`.env` 結構、透過 `Client.fromEnvironment` 進行沙盒與即時設定 |
| 3    | `ask`             | 訂單建立流程               | 包含完整 TypeScript 伺服器端程式碼的端對端建立 → 核准 → 擷取流程                   |
| 4    | `endpoint_search` | `ordersCreate`                    | `CreateOrder` 方法簽章、`OrderRequest` 主體結構、回應型別 `Order`、錯誤代碼  |
| 5    | `endpoint_search` | `capture`                         | `CaptureOrder` 合約 — 必要 `id` 參數、選用主體、回應中的擷取 ID 位置      |
| 6    | `model_search`    | `OrderRequest`                    | 完整請求模型屬性；標記 `payer` 與 `application_context` 為已棄用             |
| 7    | `model_search`    | `Money`                           | 用於建構金額的貨幣代碼與數值欄位                                             |
| 8    | `ask`             | 智慧支付按鈕             | 前端按鈕整合 — `createOrder` / `onApprove` 連接到後端端點              |
| 9    | `endpoint_search` | `getOrder`                        | 用於確認頁面的 `GetOrder` 方法簽章與回應形式                           |
| 10   | `model_search`    | `PurchaseUnitRequest`             | 包含 `amount`、`items`、`shipping` 與所有選用欄位的完整模型                             |
| 11   | `model_search`    | `Order`                           | 完整回應模型 — `status`、`purchaseUnits`、`links`（包含 `approve` 重新導向 URL）    |

**應用程式成果：**

- 具有即時沙盒驗證的一次性憑證設定頁面
- 具備名稱、描述、價格、貨幣與圖片上傳的產品建立功能
- 每個產品具有唯一可分享的結帳 URL (`/checkout/abc123`)
- 伺服器端訂單建立與擷取 — 無客戶端機密外洩
- 包含訂單 ID、買家資訊與擷取詳細資訊的確認頁面
- 包含所有產品、總營收與支付歷史紀錄的儀表板
- 行動裝置回應式結帳頁面
- 可透過 `npm install && npm start` 進行部署

**建構時間：** 10 分鐘產生 + 20 分鐘測試 = **總計 30 分鐘**

</details>

<details>
<summary><strong>Spotify 音樂 DNA 卡 — Python/Flask · 30 分鐘</strong></summary>

![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&labelColor=3776AB) ![Flask](https://img.shields.io/badge/-Flask-000000?logo=flask&logoColor=white&labelColor=000000)

![spotifySampleApp](https://github.com/user-attachments/assets/63556c36-ba2d-417c-978c-5a4697e9b4e2)

**建構內容：** 一個 Python/Flask 網路應用程式，使用者透過 Spotify OAuth 登入，抓取他們的最愛歌手與曲目，批次擷取音訊特徵，並分析資料以製作個人化的「音樂 DNA」卡片 — 特色包含平均音訊特徵的雷達圖、前 5 大類型、最冷門的歌手，以及一個產生的個性標籤 — 並附帶下載/分享按鈕。僅限自訂品牌；不包含任何 Spotify 標誌。

**提示詞：**

```
/integrate-context-matic 使用 Python 建立一個網路應用程式，使用者以 Spotify 登入，
抓取他們的最愛歌手與曲目，然後抓取這些曲目的音訊特徵。
分析資料以計算平均音訊特徵、找出最冷門的歌手、
決定前 5 大音樂類型，並根據平均值產生一個「音樂個性」標籤。
將所有內容呈現在一張視覺吸引人的 DNA 卡片中，包含雷達圖、
前幾大音樂類型、最冷門歌手與個性標籤，並包含一個按鈕以
下載或分享卡片。使用您自己的品牌與標誌；請勿在任何地方包含 Spotify
標誌。
```

**工具使用方式：**

| 步驟 | 工具              | 查詢                                                       | 回傳內容                                                                                                                                                                                                                                                 |
| ---- | ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `fetch_api`       | `language=python`                                           | 可用 API；識別出金鑰為 `spotify` 的 Spotify Web API SDK                                                                                                   |
| 2    | `ask`             | SDK 設定、用於使用者登入的 OAuth 2.0 授權碼流程 | 完整的 `pip install spotify-api-sdk` 設定、使用 `AuthorizationCodeAuthCredentials` 初始化 `SpotifywebapiClient`、`.env` 結構、`get_authorization_url()` → `fetch_token(code)` → `clone_with(o_auth_token=token)` 流程、權杖重新整理模式         |
| 3    | `ask`             | 如何抓取使用者的最愛歌手與最愛曲目            | 使用 `users_controller.get_users_top_artists()` 與 `users_controller.get_users_top_tracks()` 的端對端程式碼，包含 `time_range`、`limit`、`offset` 參數；讀取 `PagingArtistObject.items` 與 `PagingTrackObject.items`                                     |
| 4    | `endpoint_search` | `get_users_top_artists`                                     | 方法簽章 — 參數 `time_range`、`limit`、`offset`；回應型別 `PagingArtistObject`；必要範圍 `OAuthScopeEnum.USER_TOP_READ`                                                                                                                     |
| 5    | `endpoint_search` | `get_users_top_tracks`                                      | 方法簽章 — 與最愛歌手相同的參數；回應型別 `PagingTrackObject`，包含 `List[TrackObject]` 項目                                                                                                                   |
| 6    | `endpoint_search` | `get_audio_features`                                        | 透過 `tracks_controller.get_audio_features(id)` 進行單曲處理；回應型別 `AudioFeaturesObject`                                                                                                                           |
| 7    | `endpoint_search` | `get_several_audio_features`                                | 透過 `tracks_controller.get_several_audio_features(ids)` 進行批次處理 — 接收逗號分隔的曲目 ID 字串；回應型別 `ManyAudioFeatures`                                                                                                                 |
| 8    | `endpoint_search` | `get_current_users_profile`                                 | `users_controller.get_current_users_profile()` — 無參數；回應 `PrivateUserObject`；必要範圍 `USER_READ_EMAIL`、`USER_READ_PRIVATE`                                                                                                                 |
| 9    | `model_search`    | `AudioFeaturesObject`                                       | 14 個屬性 — `danceability`、`energy`、`valence`、`acousticness`、`instrumentalness`、`liveness`、`speechiness`、`tempo`、`loudness`、`key`、`mode`、`time_signature`、`duration_ms`、`uri`（用於雷達圖與個性邏輯的 0.0–1.0 浮點數） |
| 10   | `model_search`    | `ArtistObject`                                              | 屬性 `name`、`id`、`popularity`（0–100 整數，用於找出最冷門歌手）、`genres`（`List[str]`，用於前 5 大類型聚合）、`images`、`external_urls`                                                                                         |
| 11   | `model_search`    | `TrackObject`                                               | 屬性 `id`（批次呼叫音訊特徵所需）、`name`、`popularity`、`artists` (`List[ArtistObject]`)、`album`、`duration_ms`、`uri`                                                                                                                    |
| 12   | `model_search`    | `PagingTrackObject`                                         | 分頁包裝 — `items` (`List[TrackObject]`)、`total`、`next`、`offset`、`limit`                                                                                                                 |
| 13   | `model_search`    | `ManyAudioFeatures`                                         | 批次回應包裝 — `audio_features` (`List[AudioFeaturesObject]`) 用於迭代與平均化                                                                                                                               |
| 14   | `model_search`    | `PrivateUserObject`                                         | 使用者設定檔 — `display_name`、`images` (`List[ImageObject]`)、`id`、`email`、`country`（用於個人化 DNA 卡片標頭）                                                                                                 |

**應用程式成果：**

- 透過授權碼流程進行 Spotify OAuth 2.0 登入（無客戶端機密外洩至瀏覽器）
- 抓取目前使用者的設定檔 (`display_name`、大頭貼) 以個人化卡片
- 抓取前 50 大歌手與前 50 大曲目 (可設定 `time_range`：短/中/長期)
- 透過 `get_several_audio_features` 批次抓取所有最愛曲目的音訊特徵
- 計算所有曲目的平均音訊特徵 (舞動性、活力、情緒、聲學性、器樂性、現場感、演說性)
- 識別最冷門的歌手 (在最愛歌手中具有最低的 `popularity` 分數)
- 從所有最愛歌手的類型清單中聚合並排名前 5 大音樂類型
- 根據平均特徵閾值產生「音樂個性」標籤 (例如：「活力探索者」、「憂鬱夢想家」、「冷靜聲學靈魂」)
- 呈現一張視覺吸引人的 DNA 卡片，包含：
  - 7 個平均音訊特徵的雷達圖 (Chart.js)
  - 具備視覺標章的前 5 大音樂類型
  - 具備名稱與受歡迎程度分數的最冷門歌手
  - 顯眼顯示的個性標籤
  - 使用者的顯示名稱與大頭貼
- 將卡片下載為 PNG 與分享按鈕 (html2canvas)
- 自訂品牌與標誌 — 任何地方皆無 Spotify 標誌
- 長期工作階段的權杖重新整理處理
- 可透過 `pip install -r requirements.txt && python app.py` 進行部署

</details>

<details>
<summary><strong>Google 地圖餐廳輪盤 — PHP · 30 分鐘</strong></summary>

![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?logo=googlemaps&logoColor=white&labelColor=4285F4) ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white&labelColor=777BB4) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&labelColor=F7DF1E)

![google-maps-sample-app](https://github.com/user-attachments/assets/eafab114-ccf8-42f9-84c3-bc9706706118)

**建構內容：** 一個 PHP 網路應用程式，使用者在地圖上放置大頭針（或使用他們的位置），繪製移動半徑圓圈，並點擊「旋轉」以隨機挑選該半徑內的餐廳。應用程式會顯示 Google 地點照片、街景服務店面預覽以及一鍵導航 — 具備輪盤動畫與「再轉一次」按鈕以增加遊戲懸疑感。自訂品牌；憑證透過 `.env` 檔案輸入。

**提示詞：**

```
/integrate-context-matic 使用 php 與 google maps platform
apis sdk 建立一個網路應用程式。憑證請建立一個 env 檔案，使用者在其中提供 API
Key。使用者在地圖上放置一個大頭針（或使用您的位置），繪製一個圓圈代表您願意移動的距離，
然後點擊「旋轉」。應用程式會隨機挑選該半徑內的一間餐廳，顯示 Google 地點的照片、
街景服務店面預覽，以及一鍵導航。對挑選結果不滿意？再轉一次。
輪盤動畫與懸疑感使其感覺像一款遊戲。
```

**工具使用方式：**

| 步驟 | 工具              | 查詢                                                 | 回傳內容                                                                                                                                                                                                                                  |
| ---- | ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `fetch_api`       | `language=php`                                        | 可用 API；識別出金鑰為 `googlemaps` 的 Google Maps Platform SDK（另有 `paypal`、`spotify`、`maxio`、`verizon`）                                                           |
| 2    | `ask`             | SDK 設定、API 金鑰驗證設定                 | `composer require sdksio/google-maps-platform-sdk:1.0.3`、使用 `CustomQueryAuthenticationCredentialsBuilder::init('key')` 初始化 `GoogleMapsPlatformClientBuilder::init()`、`.env` 結構、`Environment::PRODUCTION`                                  |
| 3    | `ask`             | 如何搜尋半徑內的鄰近餐廳  | 使用 `$client->getPlacesApi()->nearbySearch($location, $radius, 'restaurant', ...)` 的完整程式碼，透過 `isSuccess()` / `getResult()` 處理回應，迭代 `Place[]` 結果                                                                  |
| 4    | `endpoint_search` | `nearbySearch`                                        | 方法簽章 — 參數 `location` (`"lat,lng"`), `radius` (公尺), `keyword`, `maxprice`, `minprice`, `opennow`, `pagetoken`, `rankby`, `type`, `language`；回應型別 `PlacesNearbySearchResponse`                                        |
| 5    | `endpoint_search` | `placeDetails`                                        | 方法簽章 — 參數 `placeId`, `fields[]` (基本/聯絡/氛圍分類), `sessiontoken`, `language`, `region`；回應型別 `PlacesDetailsResponse`                                                                                |
| 6    | `endpoint_search` | `placePhoto`                                          | 方法簽章 — 參數 `photoReference` (字串), `maxheight`, `maxwidth` (1-1600px)；回應型別 `mixed` (原始影像位元組)                                                                                                                   |
| 7    | `endpoint_search` | `streetView`                                          | 方法簽章 — 參數 `size` (`"{w}x{h}"`, 最大 640px), `fov`, `heading`, `location`, `pitch`, `radius`, `source`；回應型別 `mixed` (影像位元組)                                                                                         |
| 8    | `endpoint_search` | `directions`                                          | 方法簽章 — 參數 `destination`, `origin`, `mode`, `avoid`, `units`, `waypoints`, `language`, `region`；回應型別 `DirectionsResponse`                                                                                                |
| 9    | `model_search`    | `PlacesNearbySearchResponse`                          | 屬性：`results` (`Place[]`), `status` (`PlacesSearchStatus`), `nextPageToken`, `errorMessage`, `htmlAttributions`                                                                                                                           |
| 10   | `model_search`    | `PlacesDetailsResponse`                               | 屬性：`result` (`Place`), `status` (`PlacesDetailsStatus`), `htmlAttributions`, `infoMessages`                                                                                                                                              |
| 11   | `model_search`    | `Place`                                               | 完整模型 — `name`, `placeId`, `formattedAddress`, `geometry` (`Geometry`), `rating`, `userRatingsTotal`, `priceLevel`, `photos` (`PlacePhoto[]`), `openingHours`, `types`, `vicinity`, `website`, `businessStatus`, `reviews` (`PlaceReview[]`) |
| 12   | `model_search`    | `PlacePhoto`                                          | 屬性：`photoReference` (字串，用於 `placePhoto` 呼叫), `height`, `width`, `htmlAttributions`                                                                                                                                          |
| 13   | `model_search`    | `Geometry`                                            | 屬性：`location` (`LatLngLiteral`), `viewport` (`Bounds`)                                                                                                                                                                                   |
| 14   | `model_search`    | `LatLngLiteral`                                       | 屬性：`lat` (浮點數), `lng` (浮點數) — 用於提取座標以取得街景與導航                                                                                                              |
| 15   | `model_search`    | `DirectionsResponse`                                  | 屬性：`routes` (`DirectionsRoute[]`), `status` (`DirectionsStatus`), `geocodedWaypoints`, `availableTravelModes`, `errorMessage`                                                                                                            |
| 16   | `ask`             | 如何針對指定 lat/lng 使用街景服務靜態 API | `$client->getStreetViewApi()->streetView($size, null, null, $location)`，回傳原始影像位元組；使用 `streetViewMetadata()` 檢查可用性                                                                                                   |

**應用程式成果：**

- 具備 `GOOGLE_MAPS_API_KEY` 以進行憑證設定的 `.env` 檔案
- 互動式 Google 地圖，支援點擊放置大頭針或「使用我的位置」（瀏覽器地理定位）
- 可拖曳的圓圈覆蓋層以設定移動半徑（公尺）
- 具備輪盤/吃角子老虎動畫的「旋轉」按鈕以增加懸疑感
- 後端 `nearbySearch`，使用指定繪製半徑內的 `keyword=restaurant`
- 從 `Place[]` 結果中隨機挑選餐廳
- 地點詳細資訊卡片顯示：
  - 餐廳名稱、評分、價格等級與格式化地址
  - 透過 `placePhoto` 與 `photoReference` 呈現的 Google 地點照片輪播
  - 透過 `streetView` 使用地點 lat/lng 的街景服務店面預覽
  - 一鍵導航連結（導航 API 或帶有 `origin` 與 `destination` 的 Google 地圖 URL）
- 「再轉一次」按鈕，無需變更大頭針/半徑即可重新篩選
- 透過 `nextPageToken` 支援分頁以獲取更多結果
- 行動裝置回應式地圖與卡片版面配置
- 可透過 `composer install && php -S localhost:8000` 進行部署

</details>

---

## 嘗試範例提示詞

體驗 ContextMatic 的最佳方式是在安裝外掛程式後，將這些提示詞直接貼入 Cursor 或 Claude Code 中。每個提示詞都是為了自然觸發完整的工具鏈而編寫的。

<details>
<summary><strong>入門：您的第一個 API 呼叫</strong></summary>

![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic 設定 Spotify TypeScript SDK 並抓取我的前 5 大曲目。
向我展示完整的用戶端初始化與 API 呼叫。
```

---

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white&labelColor=FF2D20)

```
/integrate-context-matic 我該如何向 Twilio API 進行驗證並發送簡訊？
給我完整的 PHP 設定，包含 SDK 用戶端與發送呼叫。
```

---

![Slack](https://img.shields.io/badge/-Slack-4A154B?logo=slack&logoColor=white&labelColor=4A154B) ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&labelColor=3776AB)

```
/integrate-context-matic 引導我初始化 Python 指令碼中的 Slack API 用戶端
並發送訊息至頻道。
```

</details>

<details>
<summary><strong>框架特定整合</strong></summary>

![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?logo=googlemaps&logoColor=white&labelColor=4285F4) ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=nextdotjs&logoColor=white&labelColor=000000) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic 我正在建構 Next.js 應用程式。整合 Google Maps
Places API 以搜尋附近餐廳並顯示在頁面上。
使用 TypeScript SDK。
```

---

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![Laravel](https://img.shields.io/badge/-Laravel-FF2D20?logo=laravel&logoColor=white&labelColor=FF2D20) ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white&labelColor=FF2D20)

```
/integrate-context-matic 我正在使用 Laravel。向我展示如何在使用
者註冊時發送 Twilio 簡訊。包含 PHP SDK 設定、用戶端初始化，以及
控制器程式碼。
```

---

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![ASP.NET Core](https://img.shields.io/badge/-ASP.NET%20Core-512BD4?logo=dotnet&logoColor=white&labelColor=512BD4) ![C#](https://img.shields.io/badge/-C%23-239120?logo=csharp&logoColor=white&labelColor=239120)

```
/integrate-context-matic 我有 ASP.NET Core 應用程式。加入 Twilio Webhook 處理
以便我能在簡訊發送時接收送達狀態回呼。
```

</details>

<details>
<summary><strong>串連工具以進行完整整合</strong></summary>

這些提示詞旨在練習完整的外掛程式工作流程；從 API 探索到端點查詢，再到生產就緒的程式碼。

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=nextdotjs&logoColor=white&labelColor=000000) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic 我想將即時訂單出貨通知加入
我的 Next.js 商店。使用 Twilio 在訂單狀態變更為
「已出貨」時發送簡訊。向我展示完整的整合：SDK 設定、正確的端點及其
參數，以及 TypeScript 程式碼。
```

---

![Slack](https://img.shields.io/badge/-Slack-4A154B?logo=slack&logoColor=white&labelColor=4A154B) ![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic 我需要在我的播放清單監控應用程式中，每當 Spotify
曲目變更時發布 Slack 訊息。引導我整合 TypeScript 中的這兩個 API —
從探索有哪些可用項目開始，然後向我展示驗證設定
與精確的 API 呼叫。
```

---

![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?logo=googlemaps&logoColor=white&labelColor=4285F4) ![ASP.NET Core](https://img.shields.io/badge/-ASP.NET%20Core-512BD4?logo=dotnet&logoColor=white&labelColor=512BD4) ![C#](https://img.shields.io/badge/-C%23-239120?logo=csharp&logoColor=white&labelColor=239120)

```
/integrate-context-matic 在我的 ASP.NET Core 應用程式中，我想要使用 Google Maps
對使用者地址進行地理編碼並快取結果。查詢地理編碼端點
與回應模型，然後產生 C# 程式碼，包含錯誤處理。
```

</details>

<details>
<summary><strong>偵錯與錯誤處理</strong></summary>

![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic 我的 Spotify API 呼叫傳回 401。我應該
使用哪種 OAuth 流程，TypeScript SDK 是如何自動處理權杖重新整理的？
```

---

![Slack](https://img.shields.io/badge/-Slack-4A154B?logo=slack&logoColor=white&labelColor=4A154B) ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&labelColor=3776AB)

```
/integrate-context-matic 我的 Slack 訊息發布間歇性地失敗並傳回
速率限制錯誤。Python SDK 是如何公開速率限制資訊的，
推薦的重試模式是什麼？
```

</details>

---

## 典型使用案例

- 探索有哪些支援的 API 可用於 TypeScript、Python、Java、PHP、Ruby、Go 或 C# 專案
- 獲取專案程式語言的第三方 API 逐步整合指導
- 使用具版本意識的 SDK 指導來設定驗證、用戶端初始化與首次 API 呼叫
- 在編寫依賴 SDK 型別的程式碼之前，檢視請求與回應模型
- 在實作過程中查詢精確的方法、參數與回應型別

## APIMatic 如何為 API 產生內容

![使用 ContextMatic 進行 API 整合](https://github.com/apimatic/context-matic/blob/dev/assets/images/image.png?raw=true)

APIMatic 透過其用於產生 10 多種程式語言之慣例、型別安全 SDK 的相同 SDK 產生管線來處理您的 OpenAPI 規格。產生的 MCP 伺服器會將 SDK 文件與整合模式公開為 AI 助理可原生使用的結構化工具回應。

這意味著 AI 接收到的內容是：

- 衍生自實際產生的 SDK 程式碼，而非原始文件
- 包含慣例模式、型別模型與錯誤處理
- 符合您的 API 規格目前的版本

API 提供者：[請求示範](https://www.apimatic.io/request-demo) 以為您的 API 產生內容。

## 來源

此處的外掛程式貢獻改編自 APIMatic ContextMatic 專案，並針對 Awesome Copilot 進行封裝。

GitHub 來源：

- https://github.com/apimatic/context-matic

## 貢獻

有請求或發現問題？使用下列其中一個範本：

- [請求新程式語言](https://github.com/apimatic/context-matic/issues/new?template=language-request.yml) — 請求支援新的 SDK 程式語言 (例如 Swift、Kotlin、Rust)
- [請求新 API](https://github.com/apimatic/context-matic/issues/new?template=api-request.yml) — 請求將新的第三方 API 加入到目錄中
- [報告問題或提供回饋](https://github.com/apimatic/context-matic/issues/new?template=issue-feedback.yml) — 報告錯誤、分享回饋或建議改善現有工具

若為其他事務，[開啟一個空白問題](https://github.com/apimatic/context-matic/issues/new) 或透過 [support@apimatic.io](mailto:support@apimatic.io) 與我們聯繫。

## 深入了解

- [產品頁面](https://www.apimatic.io/product/context-plugins)
- [部落格：從 API 入口網站到 Cursor](https://www.apimatic.io/blog/from-api-portals-to-cursor)
- [案例研究](https://www.apimatic.io/product/context-plugins/case-study)

---

## 授權

MIT
