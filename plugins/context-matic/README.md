# ContextMatic 外掛模組

程式設計代理人容易對 API 產生幻覺。APIMatic Context 為它們提供經過策劃、具備版本感知的 API 與 SDK 文件。

當開發者要求其代理人「整合付款 API」時，通常只會猜測，提取過時的訓練資料或與實際 SDK 不符的通用模式。ContextMatic 透過在需要時準確地為代理人提供具權威性、版本感知且原生於 SDK 的情境來解決此問題。

## 包含內容

### MCP 伺服器

| 伺服器          | 說明                                                        |
| --------------- | ----------------------------------------------------------- |
| `context-matic` | 用於版本感知的第三方 API 整合與 SDK 探索的託管 MCP 伺服器。 |

### 技能

| 技能                       | 說明                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `/integrate-context-matic` | 使用權威 SDK 與端點資訊整合受支援第三方 API 的專注工作流程。     |
| `/onboard-context-matic`   | ContextMatic MCP 伺服器、受支援 API 及工具使用方式的引導式導覽。 |

## ContextMatic 的功能

ContextMatic 為 GitHub Copilot 提供奠基於真實 API 定義與 SDK 的版本感知 API 與 SDK 指引，而非通用的公開範例。它有助於：

- 依專案語言進行 API 探索
- 驗證與快速入門指引
- 包含參數與回應詳細資訊的端點查閱
- 包含具型別屬性定義的模型查閱

## 受支援的 API

此外掛模組為代理人提供以下 API 的 SDK 原生情境，支援 TypeScript、C#、Python、Java、PHP 和 Ruby：

| API                            | 說明                                                     |
| ------------------------------ | -------------------------------------------------------- |
| **Adyen API**                  | 付款處理：擷取付款方式、建立訂單、管理儲存的付款權杖     |
| **Google Maps APIs**           | 位置服務：地理編碼、路線規劃、距離矩陣、高度、道路和地點 |
| **PayPal Server SDK**          | 付款流程：訂單、付款、保管庫 (vault)、交易搜尋和訂閱     |
| **PayQuicker API**             | 付款與金融服務：方案協議、銀行帳戶、回饋消費報價         |
| **Slack API**                  | 工作區自動化：OAuth 機器人、訊息傳遞、對話管理           |
| **Spotify Web API**            | 音樂與 Podcast：資料庫管理、播放控制、探索               |
| **Tesla Fleet Management API** | 車輛與車隊營運：充電記錄、車輛指令、能源管理             |
| **Tesser API Portal**          | 數位付款：付款意圖、鏈上付款、應用程式管理               |
| **Twilio API**                 | 通訊：SMS、語音、影片和驗證服務                          |

此清單持續增加中。[建議新 API](#contributing) 以請求支援未在此處列出的 API。

---

## 外掛模組為代理人提供的內容

安裝後，此外掛模組會向代理人公開七個工具。每個工具都對應到整合工作流程的特定階段：

| 工具              | 所啟用的開發者工作                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch_api`       | 提供完全符合的 API 或列出所提供 `language` 的所有可用 API，包括每個 API 的名稱、索引鍵和說明。傳入專案的語言和 API `key` 進行精確比對查閱（僅傳回該 API）。若未找到精確比對，則會傳回該 `language` 的完整 API 目錄。代理人會先呼叫此工具以探索哪些 API 可用。 |
| `ask`             | 與 API Copilot 對話以獲取逐步整合指引與一般 API 問題解答：驗證設定、用戶端初始化、功能行為、特定架構模式（例如「如何在 Laravel 中初始化 Twilio 用戶端？」）以及符合慣用法的 SDK 程式碼範例。                                                                  |
| `endpoint_search` | 依方法名稱傳回 SDK 端點方法的說明、輸入參數和回應結構。                                                                                                                                                                                                       |
| `model_search`    | 依名稱傳回 SDK 模型的完整定義及其具型別屬性。在撰寫建構請求主體或讀取回應物件的程式碼之前呼叫此工具。                                                                                                                                                         |
| `update_activity` | 記錄具體的整合里程碑，例如 SDK 設定、驗證設定、第一次成功的 API 呼叫以及已解決的錯誤。代理人會在程式碼或基礎架構中實際達成里程碑後呼叫此工具。                                                                                                                |
| `add_guidelines`  | 新增語言專屬的指引檔案（例如安全性、測試或工作流程指引），代理人可在實作期間遵循。                                                                                                                                                                            |
| `add_skills`      | 新增可重複使用的專案技能，例如 `{language}-conventions`，以便未來的 API 整合工作能夠遵循專案特定語言的慣例。                                                                                                                                                  |

如需循序漸進結合使用這些工具的指引，請在代理人中叫用 `/integrate-context-matic` 技能。它會指示代理人在整個整合工作流程中何時以及如何呼叫每個工具。

---

## 從提示詞到程式碼：工具如何協同運作

這七個工具旨在於自然整合工作流程中串聯在一起。以下是當代理人接收到實際工作時，幕後運作的具體範例：

**您的提示詞：** _"/integrate-context-matic Add Twilio SMS notifications to my Next.js app. Send a text when an order ships."_

| 步驟 | 呼叫的工具                                                                        | 傳回的內容                                                                                          |
| ---- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | `add_guidelines` (`language=typescript`)                                          | 新增專案指引檔案，代理人在開始 API 整合前可遵循這些檔案進行安全性、測試和實作工作流程。             |
| 2    | `add_skills` (`language=typescript`)                                              | 新增可重複使用的語言特定技能（例如慣例指引），使專案設定與未來的整合工作相符。                      |
| 3    | `fetch_api` (`language=typescript`, `key="twilio"`)                               | 找到精確比對 — 傳回 Twilio 的項目及其名稱、索引鍵和說明                                             |
| 4    | `ask` (`key=twilio`, query=_"How do I initialize the Twilio TypeScript client?"_) | 傳回包含驗證設定的精確 SDK 設定程式碼                                                               |
| 5    | `update_activity` (`milestone=auth_configured`)                                   | 在將傳回的 SDK/驗證設定新增至應用程式後，記錄憑證已連接至應用程式，且整合已準備好進行第一次即時呼叫 |
| 6    | `endpoint_search` (`query=createMessage`)                                         | 傳回 SMS 傳送端點的方法簽章、必要參數和驗證需求                                                     |
| 7    | `model_search` (`query=CreateMessageRequest`)                                     | 傳回包含所有可用欄位的完整具型別請求模型                                                            |
| 8    | `ask` (`query="How do I handle delivery status callbacks in Next.js?"`)           | 傳回與 Twilio SDK 一致的 Webhook 處理程式碼                                                         |

每個步驟都在單一工具呼叫中完成。代理人負責協調流程。您只需描述目標，它就會在適當時機挑選正確的工具。

## MCP 伺服器

此外掛模組使用 ContextMatic MCP 端點：

```text
https://chatbotapi.apimatic.io/mcp/plugins
```

此外掛模組透過其外掛模組根目錄的 `mcp.json` 檔案註冊 MCP 伺服器，因此該伺服器可與隨附的技能一起使用。

---

## 幾分鐘內建構完整應用程式

<details>
<summary><strong>PayPal 即時店面 — Node.js/Express · 30 分鐘</strong></summary>

![PayPal](https://img.shields.io/badge/-PayPal-003087?logo=paypal&logoColor=white&labelColor=003087) ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white&labelColor=339933) ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white&labelColor=000000) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&labelColor=F7DF1E)

![paypalsampleapp](https://github.com/user-attachments/assets/dc3e5b02-934e-44b5-9df9-20387557babe)

**建構內容：** 完整的 Node.js/Express 店面，包含產品管理、每個產品的可分享結帳連結、PayPal 智慧付款按鈕、伺服器端訂單建立與擷取，以及付款歷史記錄儀表板。

**提示詞：**

```
/integrate-context-matic Build me a "PayPal Instant Storefront" app.
The app has a setup page where I enter my PayPal client-id and secret once, then
a product creation form where I enter a product name, description, price, currency,
and upload or provide product images. When I click "Generate Checkout Page" it
creates a live, shareable checkout URL like /checkout/abc123 that anyone can open —
they see the product details with images, price, description, and a working PayPal
Smart Payment Button. The payment flow should be fully server-side using the PayPal
Server SDK: backend creates the order when buyer clicks pay, captures it after
approval, and shows a confirmation page with order details. I should be able to
create multiple products and each gets its own unique checkout link I can share
with anyone. Include a simple dashboard where I can see all my products and their
checkout links, plus a list of completed payments showing order ID, buyer info,
amount, and status for each product. The checkout pages should be mobile-responsive
and look like real professional product pages. Support sandbox and live mode via
environment variables. Only use the Orders API and Payments API, do not use
Transaction Search or Vault. Make it deployable with npm install and npm start.
```

**工具使用方式：**

| 步驟 | 工具              | 查詢                  | 傳回的內容                                                                            |
| ---- | ----------------- | --------------------- | ------------------------------------------------------------------------------------- |
| 1    | `fetch_api`       | `language=typescript` | 可用 API；識別出索引鍵為 `paypal` 的 PayPal Server SDK                                |
| 2    | `ask`             | SDK 設定與環境切換    | 用戶端初始化程式碼、`.env` 結構、透過 `Client.fromEnvironment` 進行沙箱與正式環境設定 |
| 3    | `ask`             | 訂單建立流程          | 包含完整 TypeScript 伺服器端程式碼的端對端建立 → 核准 → 擷取流程                      |
| 4    | `endpoint_search` | `ordersCreate`        | `CreateOrder` 方法簽章、`OrderRequest` 主體結構、回應型別 `Order`、錯誤代碼           |
| 5    | `endpoint_search` | `capture`             | `CaptureOrder` 協定 — 必要 `id` 參數、選用主體、回應中的擷取 ID 位置                  |
| 6    | `model_search`    | `OrderRequest`        | 完整請求模型屬性；將 `payer` 與 `application_context` 標記為已棄用                    |
| 7    | `model_search`    | `Money`               | 用於建構金額的貨幣代碼與數值欄位                                                      |
| 8    | `ask`             | 智慧付款按鈕          | 前端按鈕整合 — `createOrder` / `onApprove` 連接到後端端點                             |
| 9    | `endpoint_search` | `getOrder`            | 確認頁面的 `GetOrder` 方法簽章與回應結構                                              |
| 10   | `model_search`    | `PurchaseUnitRequest` | 包含 `amount`、`items`、`shipping` 及所有選用欄位的完整模型                           |
| 11   | `model_search`    | `Order`               | 完整回應模型 — `status`、`purchaseUnits`、`links`（包含 `approve` 重新導向 URL）      |

**應用程式成果：**

- 具備即時沙箱驗證的一次性憑證設定頁面
- 包含名稱、說明、價格、貨幣和圖片上傳的產品建立功能
- 每個產品具備唯一的分享結帳 URL (`/checkout/abc123`)
- 伺服器端訂單建立與擷取 — 不暴露用戶端密鑰
- 包含訂單 ID、買家資訊和擷取詳細資訊的確認頁面
- 包含所有產品、總營收和付款歷史記錄的儀表板
- 行動裝置自適應的結帳頁面
- 可透過 `npm install && npm start` 部署

**建構時間：** 10 分鐘生成 + 20 分鐘測試 = **共 30 分鐘**

</details>

<details>
<summary><strong>Spotify 音樂 DNA 卡片 — Python/Flask · 30 分鐘</strong></summary>

![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&labelColor=3776AB) ![Flask](https://img.shields.io/badge/-Flask-000000?logo=flask&logoColor=white&labelColor=000000)

![spotifySampleApp](https://github.com/user-attachments/assets/63556c36-ba2d-417c-978c-5a4697e9b4e2)

**建構內容：** 一個 Python/Flask 網路應用程式，使用者透過 Spotify OAuth 進行驗證，擷取其熱門藝人與曲目，批次擷取音訊特徵，並分析資料以產生個人化的「音樂 DNA」卡片 — 具有平均音訊特徵的雷達圖、前 5 大類型、最冷門藝人以及產生的個性標籤 — 附帶下載/分享按鈕。僅使用自訂品牌標識；無任何 Spotify 標誌。

**提示詞：**

```
/integrate-context-matic Create a web app using Python where users log in with Spotify,
fetch their top artists and top tracks, then fetch audio features for those tracks.
Analyze the data to calculate average audio features, find the most obscure artist,
determine the top 5 genres, and generate a "music personality" label based on the
averages. Render all of this in a visually appealing DNA card with a radar chart,
top genres, most obscure artist, and personality label, and include a button to
download or share the card. Use your own branding and logo; do not include Spotify
logos anywhere.
```

**工具使用方式：**

| 步驟 | 工具              | 查詢                                       | 傳回的內容                                                                                                                                                                                                                                   |
| ---- | ----------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `fetch_api`       | `language=python`                          | 可用 API；識別出索引鍵為 `spotify` 的 Spotify Web API SDK                                                                                                                                                                                    |
| 2    | `ask`             | 用戶登入的 SDK 設定與 OAuth 2.0 授權碼流程 | 完整的 `pip install spotify-api-sdk` 設定、使用 `AuthorizationCodeAuthCredentials` 的 `SpotifywebapiClient` 初始化、`.env` 結構、`get_authorization_url()` → `fetch_token(code)` → `clone_with(o_auth_token=token)` 流程、權杖重新整理模式   |
| 3    | `ask`             | 如何擷取使用者的熱門藝人與熱門曲目         | 使用 `users_controller.get_users_top_artists()` 與 `users_controller.get_users_top_tracks()` 並帶入 `time_range`、`limit`、`offset` 參數的端對端程式碼；讀取 `PagingArtistObject.items` 與 `PagingTrackObject.items`                         |
| 4    | `endpoint_search` | `get_users_top_artists`                    | 方法簽章 — 參數 `time_range`、`limit`、`offset`；回應型別 `PagingArtistObject`；必要範圍 `OAuthScopeEnum.USER_TOP_READ`                                                                                                                      |
| 5    | `endpoint_search` | `get_users_top_tracks`                     | 方法簽章 — 與熱門藝人相同的參數；包含 `List[TrackObject]` 項目的回應型別 `PagingTrackObject`                                                                                                                                                 |
| 6    | `endpoint_search` | `get_audio_features`                       | 透過 `tracks_controller.get_audio_features(id)` 的單一曲目方法；回應型別 `AudioFeaturesObject`                                                                                                                                               |
| 7    | `endpoint_search` | `get_several_audio_features`               | 透過 `tracks_controller.get_several_audio_features(ids)` 的批次方法 — 接收逗號分隔的曲目 ID 字串；回應型別 `ManyAudioFeatures`                                                                                                               |
| 8    | `endpoint_search` | `get_current_users_profile`                | `users_controller.get_current_users_profile()` — 無參數；回應 `PrivateUserObject`；必要範圍 `USER_READ_EMAIL`、`USER_READ_PRIVATE`                                                                                                           |
| 9    | `model_search`    | `AudioFeaturesObject`                      | 所有 14 個屬性 — `danceability`、`energy`、`valence`、`acousticness`、`instrumentalness`、`liveness`、`speechiness`、`tempo`、`loudness`、`key`、`mode`、`time_signature`、`duration_ms`、`uri`（皆為 0.0–1.0 浮點數，用於雷達圖與個性邏輯） |
| 10   | `model_search`    | `ArtistObject`                             | 屬性 `name`、`id`、`popularity`（0–100 整數，用於尋找最冷門藝人）、`genres`（`List[str]`，用於前 5 大類型彙總）、`images`、`external_urls`                                                                                                   |
| 11   | `model_search`    | `TrackObject`                              | 屬性 `id`（音訊特徵批次呼叫所需）、`name`、`popularity`、`artists` (`List[ArtistObject]`)、`album`、`duration_ms`、`uri`                                                                                                                     |
| 12   | `model_search`    | `PagingTrackObject`                        | 分頁包裝函式 — `items` (`List[TrackObject]`)、`total`、`next`、`offset`、`limit`                                                                                                                                                             |
| 13   | `model_search`    | `ManyAudioFeatures`                        | 批次回應包裝函式 — 用於反覆運算與計算平均值的 `audio_features` (`List[AudioFeaturesObject]`)                                                                                                                                                 |
| 14   | `model_search`    | `PrivateUserObject`                        | 使用者設定檔 — `display_name`、`images` (`List[ImageObject]`)、`id`、`email`、`country`（用於個人化 DNA 卡片標頭）                                                                                                                           |

**應用程式成果：**

- 透過授權碼流程進行 Spotify OAuth 2.0 登入（不向瀏覽器暴露用戶端密鑰）
- 擷取目前使用者的設定檔（`display_name`、頭像）以個人化卡片
- 擷取前 50 位藝人與前 50 首曲目（可設定 `time_range`：短期/中期/長期）
- 透過 `get_several_audio_features` 批次擷取所有熱門曲目的音訊特徵
- 計算所有曲目的平均音訊特徵（可跳舞性、能量、正向度、原聲性、器樂性、現場感、語音度）
- 識別最冷門的藝人（熱門藝人中 `popularity` 分數最低者）
- 彙總所有熱門藝人曲風清單並排名前 5 大類型
- 根據平均特徵閾值產生「音樂個性」標籤（例如「充滿活力的探索者」、「憂鬱的夢想家」、「放鬆的原聲靈魂」）
- 呈現視覺上吸引人的 DNA 卡片，包含：
  - 7 項平均音訊特徵的雷達圖 (Chart.js)
  - 帶有視覺徽章的前 5 大類型
  - 包含名稱和熱門度分數的最冷門藝人
  - 醒目顯示的個性標籤
  - 使用者的顯示名稱與頭像
- 卡片下載為 PNG 與分享按鈕 (html2canvas)
- 全程使用自訂品牌與標誌 — 無任何 Spotify 標誌
- 針對長時間工作階段的權杖重新整理處理
- 可透過 `pip install -r requirements.txt && python app.py` 部署

</details>

<details>
<summary><strong>Google 地圖餐廳輪盤 — PHP · 30 分鐘</strong></summary>

![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?logo=googlemaps&logoColor=white&labelColor=4285F4) ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white&labelColor=777BB4) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&labelColor=F7DF1E)

![google-maps-sample-app](https://github.com/user-attachments/assets/eafab114-ccf8-42f9-84c3-bc9706706118)

**建構內容：** 一個 PHP 網路應用程式，使用者在 Google 地圖上放置圖針（或使用其位置），繪製行程半徑圓圈，然後按一下「旋轉」以隨機挑選該半徑內的餐廳。該應用程式顯示 Google 地點相片、街景店面預覽以及一鍵路線規劃 — 具有轉輪動畫與「再次旋轉」按鈕，營造遊戲化的懸疑感。自訂品牌標識；透過 `.env` 檔案提供憑證。

**提示詞：**

```
/integrate-context-matic Create a web application using php and google maps platform
apis sdk. for credentials create an env file in which the user will provide the API
Key. The user will Drop a pin (or use your location) on the map, draw a circle for
how far you are willing to travel, and click "spin." The app picks a random restaurant
within that radius, shows you photos from Google Places, a Street View preview of the
storefront, and one-click directions. Not happy with the pick? Spin again. The wheel
animation and suspense make it feel like a game.
```

**工具使用方式：**

| 步驟 | 工具              | 查詢                                  | 傳回的內容                                                                                                                                                                                                                                      |
| ---- | ----------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `fetch_api`       | `language=php`                        | 可用 API；識別出索引鍵為 `googlemaps` 的 Google Maps Platform SDK（還有：`paypal`、`spotify`、`maxio`、`verizon`）                                                                                                                              |
| 2    | `ask`             | SDK 設定、API 金鑰驗證設定            | `composer require sdksio/google-maps-platform-sdk:1.0.3`、帶有 `CustomQueryAuthenticationCredentialsBuilder::init('key')` 的 `GoogleMapsPlatformClientBuilder::init()`、`.env` 結構、`Environment::PRODUCTION`                                  |
| 3    | `ask`             | 如何搜尋半徑內的附近餐廳              | 使用 `$client->getPlacesApi()->nearbySearch($location, $radius, 'restaurant', ...)` 的完整程式碼、透過 `isSuccess()` / `getResult()` 處理回應、反覆運算 `Place[]` 結果                                                                          |
| 4    | `endpoint_search` | `nearbySearch`                        | 方法簽章 — 參數 `location` (`"lat,lng"`)、`radius`（公尺）、`keyword`、`maxprice`、`minprice`、`opennow`、`pagetoken`、`rankby`、`type`、`language`；回應型別 `PlacesNearbySearchResponse`                                                      |
| 5    | `endpoint_search` | `placeDetails`                        | 方法簽章 — 參數 `placeId`、`fields[]`（Basic/Contact/Atmosphere 類別）、`sessiontoken`、`language`、`region`；回應型別 `PlacesDetailsResponse`                                                                                                  |
| 6    | `endpoint_search` | `placePhoto`                          | 方法簽章 — 參數 `photoReference`（字串）、`maxheight`、`maxwidth`（1-1600px）；回應型別 `mixed`（原始影像位元組）                                                                                                                               |
| 7    | `endpoint_search` | `streetView`                          | 方法簽章 — 參數 `size` (`"{w}x{h}"`，最大 640px)、`fov`、`heading`、`location`、`pitch`、`radius`、`source`；回應型別 `mixed`（影像位元組）                                                                                                     |
| 8    | `endpoint_search` | `directions`                          | 方法簽章 — 參數 `destination`、`origin`、`mode`、`avoid`、`units`、`waypoints`、`language`、`region`；回應型別 `DirectionsResponse`                                                                                                             |
| 9    | `model_search`    | `PlacesNearbySearchResponse`          | 屬性：`results` (`Place[]`)、`status` (`PlacesSearchStatus`)、`nextPageToken`、`errorMessage`、`htmlAttributions`                                                                                                                               |
| 10   | `model_search`    | `PlacesDetailsResponse`               | 屬性：`result` (`Place`)、`status` (`PlacesDetailsStatus`)、`htmlAttributions`、`infoMessages`                                                                                                                                                  |
| 11   | `model_search`    | `Place`                               | 完整模型 — `name`、`placeId`、`formattedAddress`、`geometry` (`Geometry`)、`rating`、`userRatingsTotal`、`priceLevel`、`photos` (`PlacePhoto[]`)、`openingHours`、`types`、`vicinity`、`website`、`businessStatus`、`reviews` (`PlaceReview[]`) |
| 12   | `model_search`    | `PlacePhoto`                          | 屬性：`photoReference`（字串，用於 `placePhoto` 呼叫）、`height`、`width`、`htmlAttributions`                                                                                                                                                   |
| 13   | `model_search`    | `Geometry`                            | 屬性：`location` (`LatLngLiteral`)、`viewport` (`Bounds`)                                                                                                                                                                                       |
| 14   | `model_search`    | `LatLngLiteral`                       | 屬性：`lat`（浮點數）、`lng`（浮點數）— 用於擷取街景與路線規劃的座標                                                                                                                                                                            |
| 15   | `model_search`    | `DirectionsResponse`                  | 屬性：`routes` (`DirectionsRoute[]`)、`status` (`DirectionsStatus`)、`geocodedWaypoints`、`availableTravelModes`、`errorMessage`                                                                                                                |
| 16   | `ask`             | 如何在給定緯度/經度下使用街景靜態 API | `$client->getStreetViewApi()->streetView($size, null, null, $location)`，傳回原始影像位元組；用於可用性檢查的 `streetViewMetadata()`                                                                                                            |

**應用程式成果：**

- 包含用於憑證之 `GOOGLE_MAPS_API_KEY` 的 `.env` 檔案
- 具有點擊放置圖針或「使用我的位置」（瀏覽器地理位置）的互動式 Google 地圖
- 可拖曳的圓形覆蓋層以設定行程半徑（公尺）
- 具有輪盤/拉霸機動畫的「旋轉」按鈕以營造懸疑感
- 在繪製半徑內使用 `keyword=restaurant` 的後端 `nearbySearch`
- 從 `Place[]` 結果中隨機選擇餐廳
- 地點詳細資訊卡片顯示：
  - 餐廳名稱、評分、價格等級與格式化地址
  - 透過帶有 `photoReference` 的 `placePhoto` 提供 Google 地點相片輪播
  - 透過 `streetView` 使用地點的緯度/經度提供街景店面預覽
  - 一鍵路線規劃連結（包含 `origin` 與 `destination` 的 Directions API 或 Google 地圖 URL）
  - 「再次旋轉」按鈕以在不變更圖針/半徑的情況下重新抽籤
- 透過 `nextPageToken` 支援分頁以取得更多結果
- 行動裝置自適應的地圖與卡片版面配置
- 可透過 `composer install && php -S localhost:8000` 部署

</details>

---

## 嘗試範例提示詞

體驗 ContextMatic 的最佳方式是在安裝外掛模組後將這些提示詞直接貼至 Cursor 或 Claude Code 中。每個提示詞都旨在自然觸發完整的工具鏈。

<details>
<summary><strong>快速入門：您的第一個 API 呼叫</strong></summary>

![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic Set up the Spotify TypeScript SDK and fetch my top 5 tracks.
Show me the complete client initialization and the API call.
```

---

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white&labelColor=777BB4)

```
/integrate-context-matic How do I authenticate with the Twilio API and send an SMS?
Give me the full PHP setup including the SDK client and the send call.
```

---

![Slack](https://img.shields.io/badge/-Slack-4A154B?logo=slack&logoColor=white&labelColor=4A154B) ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&labelColor=3776AB)

```
/integrate-context-matic Walk me through initializing the Slack API client
in a Python script and posting a message to a channel.
```

</details>

<details>
<summary><strong>特定架構整合</strong></summary>

![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?logo=googlemaps&logoColor=white&labelColor=4285F4) ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=nextdotjs&logoColor=white&labelColor=000000) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic I'm building a Next.js app. Integrate the Google Maps
Places API to search for nearby restaurants and display them on a page.
Use the TypeScript SDK.
```

---

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![Laravel](https://img.shields.io/badge/-Laravel-FF2D20?logo=laravel&logoColor=white&labelColor=FF2D20) ![PHP](https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white&labelColor=777BB4)

```
/integrate-context-matic I'm using Laravel. Show me how to send a Twilio SMS
when a user registers. Include the PHP SDK setup, client initialization, and the
controller code.
```

---

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![ASP.NET Core](https://img.shields.io/badge/-ASP.NET%20Core-512BD4?logo=dotnet&logoColor=white&labelColor=512BD4) ![C#](https://img.shields.io/badge/-C%23-239120?logo=csharp&logoColor=white&labelColor=239120)

```
/integrate-context-matic I have an ASP.NET Core app. Add Twilio webhook handling
so I can receive delivery status callbacks when an SMS is sent.
```

</details>

<details>
<summary><strong>串聯工具以進行完整整合</strong></summary>

這些提示詞旨在演練完整的外掛模組工作流程；從 API 探索、端點查閱到可用於實際環境的程式碼。

![Twilio](https://img.shields.io/badge/-Twilio-F22F46?logo=twilio&logoColor=white&labelColor=F22F46) ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=nextdotjs&logoColor=white&labelColor=000000) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic I want to add real-time order shipping notifications
to my Next.js store. Use Twilio to send an SMS when the order status changes to
"shipped". Show me the full integration: SDK setup, the correct endpoint and its
parameters, and the TypeScript code.
```

---

![Slack](https://img.shields.io/badge/-Slack-4A154B?logo=slack&logoColor=white&labelColor=4A154B) ![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic I need to post a Slack message every time a Spotify
track changes in my playlist monitoring app. Walk me through integrating both APIs
in TypeScript — start by discovering what's available, then show me the auth setup
and the exact API calls.
```

---

![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?logo=googlemaps&logoColor=white&labelColor=4285F4) ![ASP.NET Core](https://img.shields.io/badge/-ASP.NET%20Core-512BD4?logo=dotnet&logoColor=white&labelColor=512BD4) ![C#](https://img.shields.io/badge/-C%23-239120?logo=csharp&logoColor=white&labelColor=239120)

```
/integrate-context-matic In my ASP.NET Core app, I want to geocode user
addresses using Google Maps and cache the results. Look up the geocode endpoint
and response model, then generate the C# code including error handling.
```

</details>

<details>
<summary><strong>除錯與錯誤處理</strong></summary>

![Spotify](https://img.shields.io/badge/-Spotify-1DB954?logo=spotify&logoColor=white&labelColor=1DB954) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&labelColor=3178C6)

```
/integrate-context-matic My Spotify API call is returning 401. What OAuth flow
should I be using and how does the TypeScript SDK handle token refresh automatically?
```

---

![Slack](https://img.shields.io/badge/-Slack-4A154B?logo=slack&logoColor=white&labelColor=4A154B) ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&labelColor=3776AB)

```
/integrate-context-matic My Slack message posts are failing intermittently
with rate limit errors. How does the Python SDK expose rate limit information and
what's the recommended retry pattern?
```

</details>

---

## 典型使用案例

- 探索哪些受支援的 API 適用於 TypeScript、Python、Java、PHP、Ruby、Go 或 C# 專案
- 取得以專案語言整合受支援第三方 API 的逐步指引
- 使用具備版本感知的 SDK 指引設定驗證、用戶端初始化和第一個 API 呼叫
- 在撰寫依賴於 SDK 型別的程式碼之前檢查請求與回應模型
- 在實作期間查閱所需的確切方法、參數和回應型別

## APIMatic 如何為 API 產生情境

![API integration using ContextMatic](https://github.com/apimatic/context-matic/blob/dev/assets/images/image.png?raw=true)

APIMatic 透過其用於在 10 種以上語言中產生符合慣用法且型別安全的 SDK 所使用的相同 SDK 產生管道來處理您的 OpenAPI 規格。產生的 MCP 伺服器將 SDK 文件與整合模式公開為結構化工具回應，AI 助理可以直接使用。

這意味著 AI 接收到的情境是：

- 源自實際產生的 SDK 程式碼，而非原始文件
- 包含慣用模式、具型別模型與錯誤處理
- 與您目前的 API 規格版本一致

對於 API 提供者：[申請展示](https://www.apimatic.io/request-demo)以針對您的 API 產生情境。

## 來源

此貢獻的外掛模組改編自 APIMatic ContextMatic 專案，並針對 Awesome Copilot 進行打包。

GitHub 來源：

- https://github.com/apimatic/context-matic

## 參與貢獻

有需求或發現問題？請使用以下範本之一：

- [請求新語言](https://github.com/apimatic/context-matic/issues/new?template=language-request.yml) — 請求支援新的 SDK 語言（例如 Swift、Kotlin、Rust）
- [請求新 API](https://github.com/apimatic/context-matic/issues/new?template=api-request.yml) — 請求將新的第三方 API 新增至目錄
- [回報問題或提供意見反應](https://github.com/apimatic/context-matic/issues/new?template=issue-feedback.yml) — 回報錯誤、分享意見反應，或對現有工具提出改進建議

如有其他事項，請[開啟空白議題](https://github.com/apimatic/context-matic/issues/new)或透過 [support@apimatic.io](mailto:support@apimatic.io) 聯繫。

## 深入了解

- [產品頁面](https://www.apimatic.io/product/context-plugins)
- [部落格：從 API 入口網站到 Cursor](https://www.apimatic.io/blog/from-api-portals-to-cursor)
- [案例研究](https://www.apimatic.io/product/context-plugins/case-study)

---

## 授權條款

MIT
