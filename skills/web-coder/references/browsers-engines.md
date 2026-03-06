# 瀏覽器與引擎參考 (Browsers & Engines Reference)

網頁瀏覽器、算圖引擎以及瀏覽器特定資訊。

## 主要瀏覽器

### Google Chrome

**引擎**：Blink（算圖）、V8 (JavaScript)  
**發布年份**：2008 年  
**市佔率**：約 65%（桌面端）  

**開發人員工具**： 
- 元件 (Elements) 面板
- 控制台 (Console)
- 網路 (Network) 分頁
- 效能 (Performance) 分析器
- Lighthouse 稽核

### Mozilla Firefox

**引擎**：Gecko（算圖）、SpiderMonkey (JavaScript)  
**發布年份**：2004 年  
**市佔率**：約 3%（桌面端）  

**特性**：
- 強調隱私權
- 容器分頁
- 增強型追蹤防護
- 開發者版本 (Developer Edition)

### Apple Safari

**引擎**：WebKit（算圖）、JavaScriptCore (JavaScript)  
**發布年份**：2003 年  
**市佔率**：桌面端約 20%，在 iOS 上佔主導地位  

**特性**：
- 節能
- 重視隱私
- 智慧追蹤防護 (Intelligent Tracking Prevention)
- iOS 上唯一允許的瀏覽器

### Microsoft Edge

**引擎**：Blink（自 2020 年起基於 Chromium）  
**發布年份**：2015 年 (EdgeHTML)、2020 年 (Chromium)  

**特性**：
- 與 Windows 整合
- 集合 (Collections)
- 垂直分頁
- IE 模式（相容性）

### Opera

**引擎**：Blink  
**基於**：Chromium  

**特性**：
- 內建 VPN
- 廣告攔截器
- 側邊欄

## 算圖引擎 (Rendering Engines)

### Blink

**使用者**：Chrome、Edge、Opera、Vivaldi  
**分支自**：WebKit (2013)  
**語言**：C++  

### WebKit

**使用者**：Safari  
**起源**：KHTML (KDE)  
**語言**：C++  

### Gecko

**使用者**：Firefox  
**開發者**：Mozilla  
**語言**：C++、Rust  

### 舊版引擎

- **Trident**：Internet Explorer（已遭取代）
- **EdgeHTML**：原始 Edge（已遭取代）
- **Presto**：舊版 Opera（已遭取代）

## JavaScript 引擎

| 引擎 | 瀏覽器 | 語言 |
|--------|---------|----------|
| V8 | Chrome、Edge | C++ |
| SpiderMonkey | Firefox | C++、Rust |
| JavaScriptCore | Safari | C++ |
| Chakra | IE/Edge (舊版) | C++ |

### V8 特性

- 即時編譯 (JIT compilation)
- 行內快取 (Inline caching)
- 隱藏類別 (Hidden classes)
- 垃圾回收 (Garbage collection)
- WASM 支援

## 瀏覽器開發人員工具

### Chrome 開發人員工具

```javascript
// 控制台 API
console.log('訊息');
console.table(array);
console.time('標籤');
console.timeEnd('標籤');

// 指令行 API
$() // document.querySelector()
$$() // document.querySelectorAll()
$x() // XPath 查詢
copy(object) // 複製到剪貼簿
monitor(function) // 記錄函式呼叫
```

**面板**：
- 元件 (Elements)：DOM 檢查
- 控制台 (Console)：JavaScript 控制台
- 原始碼 (Sources)：除錯器
- 網路 (Network)：HTTP 請求
- 效能 (Performance)：分析 (Profiling)
- 記憶體 (Memory)：堆疊快照 (Heap snapshots)
- 應用程式 (Application)：儲存、Service Workers
- 安全性 (Security)：憑證資訊
- Lighthouse：稽核

### Firefox 開發人員工具

**獨特特性**：
- CSS 網格檢查器 (Grid Inspector)
- 字體編輯器 (Font Editor)
- 無障礙性檢查器 (Accessibility Inspector)
- 網路頻寬限制 (Network throttling)

## 跨瀏覽器相容性 (Cross-Browser Compatibility)

### 瀏覽器前綴 (供應商前綴) (Browser Prefixes / Vendor Prefixes)

```css
/* 舊版用法 - 建議改用 Autoprefixer */
.element {
  -webkit-transform: rotate(45deg); /* Chrome, Safari */
  -moz-transform: rotate(45deg); /* Firefox */
  -ms-transform: rotate(45deg); /* IE */
  -o-transform: rotate(45deg); /* Opera */
  transform: rotate(45deg); /* 標準 */
}
```

**現代做法**：使用建構工具 (Autoprefixer)

### 使用者代理字串 (User Agent String)

```javascript
// 檢查瀏覽器
const userAgent = navigator.userAgent;

if (userAgent.includes('Firefox')) {
  // Firefox 特定程式碼
} else if (userAgent.includes('Chrome')) {
  // Chrome 特定程式碼
}

// 更好的做法：特性偵測 (Feature detection)
if ('serviceWorker' in navigator) {
  // 現代瀏覽器
}
```

### 漸進式降級 (Graceful Degradation) vs 漸進式增強 (Progressive Enhancement)

**漸進式降級**：針對現代瀏覽器建構，為舊版瀏覽器降級

```css
.container {
  display: grid; /* 現代瀏覽器 */
  display: block; /* 後備方案 */
}
```

**漸進式增強**：建構基礎版本，為現代瀏覽器增強功能

```css
.container {
  display: block; /* 基礎 */
}

@supports (display: grid) {
  .container {
    display: grid; /* 增強功能 */
  }
}
```

## 瀏覽器特性

### Service Workers

用於離線功能的背景指令碼

**支援度**：所有現代瀏覽器

### WebAssembly

網頁用的二進位指令格式

**支援度**：所有現代瀏覽器

### Web 元件 (Web Components)

自訂 HTML 元件

**支援度**：所有現代瀏覽器（搭配 Polyfill）

### WebRTC

即時通訊

**支援度**：所有現代瀏覽器

## 瀏覽器儲存 (Browser Storage)

| 儲存方式 | 大小 | 到期時間 | 範圍 |
|---------|------|------------|-------|
| 餅乾 (Cookies) | 4KB | 可設定 | 網域 (Domain) |
| LocalStorage | 5-10MB | 永不 | 來源 (Origin) |
| SessionStorage | 5-10MB | 分頁關閉時 | 來源 (Origin) |
| IndexedDB | 50MB+ | 永不 | 來源 (Origin) |

## 行動瀏覽器

### iOS Safari

- iOS 上唯一允許的瀏覽器
- 所有 iOS 瀏覽器皆使用 WebKit
- 與桌面版 Safari 不同

### Chrome 行動版 (Android)

- Blink 引擎
- 與桌面版 Chrome 類似

### 三星網際網路 (Samsung Internet)

- 基於 Chromium
- 在三星裝置上很受歡迎

## 瀏覽器市佔率 (2026)

**桌面端**：
- Chrome：約 65%
- Safari：約 20%
- Edge：約 5%
- Firefox：約 3%
- 其他：約 7%

**行動端**：
- Chrome：約 65%
- Safari：約 25%
- 三星網際網路：約 5%
- 其他：約 5%

## 測試瀏覽器

### 工具

- **BrowserStack**：雲端瀏覽器測試
- **Sauce Labs**：自動化測試
- **CrossBrowserTesting**：即時測試
- **LambdaTest**：跨瀏覽器測試

### 虛擬機器 (Virtual Machines)

- **VirtualBox**：免費虛擬化軟體
- **Parallels**：Mac 虛擬化軟體
- **Windows 開發人員 VM**：免費的 Windows 虛擬機器

## 開發者特性

### 基於 Chromium 的開發者特性

- **遠端除錯 (Remote Debugging)**：除錯行動裝置
- **工作空間 (Workspaces)**：直接編輯檔案
- **程式碼片段 (Snippets)**：可重用的程式碼片段
- **涵蓋範圍 (Coverage)**：偵測未使用的程式碼

### Firefox 開發者版本 (Developer Edition)

- **CSS 網格檢查器**
- **彈性盒 (Flexbox) 檢查器**
- **字體面板**
- **無障礙性稽核**

## 瀏覽器擴充功能 (Browser Extensions)

### Manifest V3（現代標準）

```json
{
  "manifest_version": 3,
  "name": "我的擴充功能",
  "version": "1.0",
  "permissions": ["storage", "activeTab"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- Apple Safari
- Blink
- blink 元件 (blink element)
- 瀏覽器 (Browser)
- 瀏覽內容 (Browsing context)
- Chrome
- 開發人員工具 (Developer tools)
- 引擎 (Engine)
- Firefox OS
- Gecko
- Google Chrome
- JavaScript 引擎 (JavaScript engine)
- Microsoft Edge
- Microsoft Internet Explorer
- Mozilla Firefox
- Netscape Navigator
- Opera 瀏覽器 (Opera browser)
- Presto
- 算圖引擎 (Rendering engine)
- Trident
- 使用者代理 (User agent)
- 供應商前綴 (Vendor prefix)
- WebKit

## 額外資源

- [Chrome 開發人員工具文件](https://developer.chrome.com/docs/devtools/)
- [Firefox 開發人員工具文件](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Safari 網頁檢查器 (Web Inspector)](https://developer.apple.com/safari/tools/)
- [Can I Use](https://caniuse.com/)
- [瀏覽器市佔率](https://gs.statcounter.com/)
