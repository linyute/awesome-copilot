# 漸進式網頁應用程式 (PWA) 參考

---

## 概觀：什麼是漸進式網頁應用程式 (PWA)？

> 來源：<https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps>

**漸進式網頁應用程式 (PWA)** 是一種使用網頁平台技術建構的應用程式，提供與平台專屬（原生）應用程式相當的使用者體驗。關鍵特性包括：

- 透過單一程式碼庫在多個平台和裝置上執行
- 可以像原生應用程式一樣安裝在裝置上
- 支援離線和背景操作
- 與裝置功能和其他已安裝的應用程式整合
- 作為永久功能出現，使用者可直接從作業系統啟動

### 主要指南

| 指南 | 描述 |
|-------|-------------|
| **什麼是漸進式網頁應用程式 (PWA)？** | 與傳統網站和平台專屬應用程式的比較；PWA 主要功能介紹 |
| **讓 PWA 具備安裝能力** | 安裝能力的門檻、裝置安裝程序、自訂安裝體驗 |
| **安裝與解除安裝網頁應用程式** | 使用者如何在裝置上安裝和解除安裝 PWA |
| **離線與背景操作** | 實現離線功能的技術、間歇性網路連線管理、背景任務執行 |
| **快取 (Caching)** | 本機資源快取的 API、離線功能的常見快取策略 |
| **PWA 最佳實作** | 跨瀏覽器與裝置適應、無障礙空間、效能最佳化、作業系統整合 |

### 實作功能教學

| 功能 | 用途 |
|---------|---------|
| 建立獨立應用程式 | 在專用視窗而非瀏覽器分頁中啟動 |
| 定義應用程式圖示 | 為已安裝的 PWA 自訂圖示 |
| 自訂應用程式顏色 | 設定背景顏色和佈景主題顏色 |
| 顯示徽章 (Badges) | 在應用程式圖示上顯示徽章（例如通知計數） |
| 公開應用程式捷徑 | 從作業系統捷徑選單存取常見動作 |
| 在應用程式間共用資料 | 使用作業系統的應用程式共用機制 |
| 觸發安裝 | 提供自訂 UI 邀請使用者安裝 |
| 建立檔案關聯 | 連結檔案類型至 PWA 進行處理 |

### 核心技術與 API

#### 網頁應用程式資訊清單 (Web App Manifest)

- 定義 PWA Metadata 與外觀
- 自訂深度的作業系統整合（名稱、圖示、顯示模式、顏色等）

#### Service Worker API

**通訊：**

- `Client.postMessage()` -- Service worker 至 PWA 的訊息傳遞
- Broadcast Channel API -- Service worker 與用戶端之間的雙向通訊

**離線操作：**

- `Cache` API -- 持久性 HTTP 回應儲存
- `Clients` -- 受 Service worker 控制之文件的存取控制
- `FetchEvent` -- HTTP 請求攔截與快取

**背景任務：**

- Background Synchronization API -- 延後任務直至網路連線穩定
- Web Periodic Background Synchronization API -- 註冊具備網路連線能力的週期性任務
- Background Fetch API -- 管理大型、長時間的下載

#### 其他必要的網頁 API

| API | 用途 |
|-----|---------|
| **IndexedDB** | 結構化資料與檔案的用戶端儲存 |
| **Badging API** | 應用程式圖示徽章通知 |
| **Notifications API** | 作業系統層級的通知顯示 |
| **Web Share API** | 共用內容至使用者選取的應用程式 |
| **Window Controls Overlay API** | 桌面 PWA 視窗自訂（隱藏標題列，將應用程式顯示在整個視窗上） |

### PWA 必備檢查清單

- 可安裝且具備獨立操作能力
- 透過 Service worker 實現離線功能
- 已實作快取策略
- 已設定網頁應用程式資訊清單
- 已定義應用程式圖示和顏色
- 具備無障礙空間且效能良好
- 跨瀏覽器相容
- 安全（需要 HTTPS）

---

## 教學

> 來源：<https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials>

這些教學提供結構化的、逐步的學習路徑，帶領您從頭開始建構 PWA。

### 教學 1：CycleTracker -- 建立您的第一個 PWA

**層級：** 初學者

一個月經週期追蹤應用程式，導覽將網頁應用程式轉換為 PWA 的完整程序。

**子模組：**

1. **基礎 HTML 與 CSS** -- 建構基礎網頁應用程式結構
2. **安全連線** -- 設定帶有 HTTPS 的測試環境
3. **JavaScript 功能** -- 加入互動性與應用程式邏輯
4. **資訊清單與圖示設計** -- 建立並檢查網頁應用程式資訊清單；定義圖示
5. **使用 Service worker 支援離線** -- 加入 Service worker 並管理過期快取

**涵蓋主題：**

- 建立功能性網頁應用程式的 HTML、CSS 和 JavaScript 基礎
- 設定測試環境
- 將網頁應用程式升級為 PWA
- 資訊清單開發：建立並檢查網頁應用程式資訊清單
- Service worker：在應用程式中加入 Service worker
- 快取管理：使用 Service worker 刪除過期快取

### 教學 2：js13kGames -- 深入探索 PWA

**層級：** 中階

一個遊戲資訊清單應用程式（源自 js13kGames 2017 競賽），探索進階 PWA 功能。

**子模組：**

1. **PWA 結構** -- 理解應用程式架構與組織
2. **使用 Service worker 支援離線** -- 實作離線功能
3. **讓 PWA 具備安裝能力** -- 符合安裝能力門檻
4. **使用 Notifications 與 Push API** -- 實作推播通知
5. **漸進式載入** -- 最佳化載入效能

**涵蓋主題：**

- PWA 基礎與核心概念
- Notifications 與 Push API：實作通知與推播功能
- 應用程式效能：最佳化 PWA 效能
- 超越基礎的進階 PWA 功能

---

## API 與資訊清單參考

> 來源：<https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Reference>

### 網頁應用程式資訊清單成員

網頁應用程式資訊清單描述 PWA 特性、自訂其外觀，並能實現更深度的作業系統整合。資訊清單 JSON 檔案中可以定義下列成員：

| 成員 | 狀態 | 描述 |
|--------|--------|-------------|
| `name` | 標準 | 應用程式的全名 |
| `short_name` | 標準 | 用於空間有限環境的短名稱 |
| `description` | 標準 | 應用程式的描述 |
| `start_url` | 標準 | 啟動應用程式時載入的 URL |
| `scope` | 標準 | PWA 的導覽範圍 |
| `display` | 標準 | 顯示模式 (fullscreen, standalone, minimal-ui, browser) |
| `display_override` | 實驗性 | 覆蓋顯示模式偏好設定 |
| `orientation` | 標準 | 應用程式的預設方向 |
| `icons` | 標準 | 各種環境下的圖示物件陣列 |
| `screenshots` | 標準 | 用於應用程式商店與安裝 UI 的螢幕截圖 |
| `background_color` | 標準 | 啟動畫面 (splash screen) 的背景顏色 |
| `theme_color` | 標準 | 應用程式的預設佈景主題顏色 |
| `categories` | 標準 | 預期的應用程式類別 |
| `id` | 標準 | 應用程式的唯一識別碼 |
| `shortcuts` | 標準 | 關鍵任務的快速存取捷徑 |
| `file_handlers` | 實驗性 | 應用程式可處理的檔案類型 |
| `launch_handler` | 實驗性 | 控制應用程式的啟動方式 |
| `protocol_handlers` | 實驗性 | 應用程式可處理的 URL 通訊協定 |
| `share_target` | 實驗性 | 定義應用程式如何接收共用資料 |
| `scope_extensions` | 實驗性 | 擴充導覽範圍 |
| `note_taking` | 實驗性 | 筆記應用程式整合 |
| `related_applications` | 實驗性 | 相關原生應用程式 |
| `prefer_related_applications` | 實驗性 | 偏好原生應用程式而非 PWA |
| `serviceworker` | 實驗性 / 非標準 | Service worker 註冊資訊 |

### Service Worker API

#### 與應用程式通訊

- **`Client.postMessage()`** -- 從 Service worker 傳送訊息至用戶端頁面
- **Broadcast Channel API** -- 在 Service worker 與用戶端 PWA 之間建立雙向通訊管道

#### 離線操作

- **`Cache`** -- HTTP 回應的持久性儲存，供離線時重複使用
- **`Clients`** -- 存取受 Service worker 控制之文件的介面
- **`FetchEvent`** -- 攔截 HTTP 請求；實現快取或代理回應以支援離線

#### 背景操作

- **Background Synchronization API** -- 延後任務直至網路連線穩定
- **Web Periodic Background Synchronization API** -- 註冊隨網路連線執行的週期性任務
- **Background Fetch API** -- 管理長時間執行的下載，例如影片和音訊檔案

### 其他用於 PWA 的網頁 API

| API | 用途 |
|-----|---------|
| **IndexedDB** | 結構化資料與檔案的用戶端儲存 |
| **Badging API** | 設定應用程式圖示徽章以作為通知指示 |
| **Notifications API** | 顯示作業系統層級的系統通知 |
| **Web Share API** | 共用文字、連結、檔案和內容至使用者選取的應用程式 |
| **Window Controls Overlay API** | 隱藏標題列並將應用程式顯示在整個視窗區域（桌面 PWA） |

### 關鍵 MDN 參考路徑

- **PWA 主要索引：** `/en-US/docs/Web/Progressive_web_apps`
- **Service Worker API：** `/en-US/docs/Web/API/Service_Worker_API`
- **網頁 API 概觀：** `/en-US/docs/Web/API`
- **網頁應用程式資訊清單：** `/en-US/docs/Web/Progressive_web_apps/Manifest`
