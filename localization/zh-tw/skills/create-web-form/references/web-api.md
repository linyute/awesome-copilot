# Web API 參考

> 來源：<https://developer.mozilla.org/en-US/docs/Web/API>

## 概觀

Web API 是開發者可用於網頁應用程式的程式設計介面，通常與 JavaScript 搭配使用。它們讓開發者能建構現代網頁應用程式，並擁有以往僅限於原生應用程式的能力（如相機存取、離線支援、背景處理等）。

## API 類別

### 音訊與無障礙空間 (Accessibility)

- **Audio Output Devices API** -- 選取音訊輸出裝置（實驗性）。

### 背景與藍牙 (Background and Bluetooth)

- **Background Fetch API** -- 管理長時間執行的下載。
- **Background Synchronization API** -- 在背景同步資料。
- **Badging API** -- 在應用程式圖示上顯示徽章。
- **Beacon API** -- 傳送分析資料。
- **Web Bluetooth API** -- 連接到藍牙裝置。

### 畫布、CSS 與通訊 (Canvas, CSS, and Communication)

- **Canvas API** -- 在網頁上進行 2D 繪圖。
- **CSS APIs** (繪製、字型載入、型別物件模型)。
- **Clipboard API** -- 存取剪貼簿資料。
- **Console API** -- 偵錯工具。
- **Cookie Store API** -- 管理 Cookie。
- **Credential Management API** -- 處理身分驗證。

### DOM 與裝置 (DOM and Device)

- **Document Object Model (DOM)** -- 操縱頁面結構的核心網頁 API。
- **Device Motion/Orientation Events** -- 存取裝置感應器。
- **Device Memory API** -- 偵測裝置能力。

### 擷取與檔案系統 (Fetch and File System)

- **Fetch API** -- 現代 HTTP 請求。
- **File API** -- 存取檔案資料。
- **File System API** -- 處理本機檔案。
- **Fullscreen API** -- 進入全螢幕模式。

### 地理位置與圖形 (Geolocation and Graphics)

- **Geolocation API** -- 取得使用者位置。
- **Gamepad API** -- 連接遊戲控制器。
- **WebGL** -- 3D 圖形轉譯。
- **WebGPU API** -- GPU 運算。

### 歷程記錄與 HTML (History and HTML)

- **History API** -- 瀏覽器歷程記錄導覽。
- **HTML DOM API** -- 操縱 HTML 元件。
- **HTML Drag and Drop API** -- 原生拖放支援。

### 輸入與 IndexedDB (Input and IndexedDB)

- **IndexedDB API** -- 用戶端結構化資料庫。
- **Intersection Observer API** -- 追蹤元件可見性。

### 媒體與媒體串流 (Media and MediaStream)

- **Media Capture and Streams API** -- 存取相機和麥克風。
- **MediaStream Recording API** -- 錄製音訊和影片。
- **Media Session API** -- 控制播放。
- **Media Source Extensions** -- 串流媒體內容。

### 導覽與網路 (Navigation and Network)

- **Navigation API** -- 用戶端路由。
- **Network Information API** -- 偵測連線類型。

### 付款與效能 (Payment and Performance)

- **Payment Request API** -- 結帳流程處理。
- **Performance APIs** -- 監控應用程式效能。
- **Permissions API** -- 請求功能權限。
- **Picture-in-Picture API** -- 浮動影片播放器。
- **Pointer Events** -- 處理輸入裝置。
- **Push API** -- 接收推播通知。

### 儲存與感應器 (Storage and Sensors)

- **Service Worker API** -- 離線功能。
- **Storage API** -- 持久性儲存。
- **Streams API** -- 處理資料串流。
- **Screen Capture API** -- 錄製螢幕內容。

### 影片與虛擬實境 (Video and Virtual Reality)

- **ViewTransition API** -- 動畫化頁面切換。
- **WebXR Device API** -- VR/AR 體驗。

### WebSocket 與 Web Workers (WebSocket and Web Workers)

- **WebSocket API** -- 即時雙向通訊。
- **Web Workers API** -- 背景處理。
- **Web Audio API** -- 音訊處理與合成。
- **Web Authentication API** -- WebAuthn 支援。
- **Web Storage API** -- `localStorage` 和 `sessionStorage`。

### XML

- **XMLHttpRequest API** -- 舊式 HTTP 請求（大部分已被 Fetch 取代）。

## 關鍵介面範例

### 核心 DOM 介面

```javascript
Document, Element, HTMLElement
Node, NodeList
DocumentFragment
Attr, NamedNodeMap
```

### 事件處理

```javascript
Event, EventTarget, CustomEvent
MouseEvent, KeyboardEvent, TouchEvent
PointerEvent, DragEvent
```

### 非同步操作

```javascript
// 基於 Promise 的 API
AbortController, AbortSignal
Fetch, Request, Response
```

### 媒體與圖形

```javascript
HTMLMediaElement, AudioContext
Canvas, CanvasRenderingContext2D
WebGL2RenderingContext, GPU
```

### 儲存與資料庫

```javascript
Storage             // localStorage, sessionStorage
IndexedDB           // IDBDatabase, IDBTransaction
CacheStorage        // Service Worker 快取
```

## 核心概念

1. **漸進式增強 (Progressive Enhancement)** -- API 在舊版瀏覽器中會優雅降級。
2. **基於標準 (Standards-based)** -- 遵循 W3C 和 WHATWG 規範。
3. **實驗性 API (Experimental APIs)** -- 標記為仍在開發中的功能；可能會變更或移除。
4. **已棄用 API (Deprecated APIs)** -- 逐步退出的舊功能；在新專案中應避免使用。
5. **非標準 API (Non-standard APIs)** -- 瀏覽器特定的實作；請謹慎使用。

## 重要注意事項

- Web API 通常與 JavaScript 搭配使用，但不限於此。
- 許多 API 需要**使用者權限**（地理位置、相機、麥克風）。
- 某些 API 是**實驗性**的，可能會變更或移除。
- 每個 API 的瀏覽器支援程度不同 -- 使用前務必檢查相容性。
- 在新專案中應避免使用較舊的已棄用 API。
