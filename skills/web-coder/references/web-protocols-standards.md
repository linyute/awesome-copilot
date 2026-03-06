# Web 協定與標準參考

管理 Web 的組織、規範與標準。

## 標準組織

### W3C (World Wide Web Consortium)

開發 Web 標準的國際社群。

**關鍵標準**：
- HTML
- CSS
- XML
- SVG
- WCAG (無障礙)
- Web API

**網站**：https://www.w3.org/

### WHATWG (Web Hypertext Application Technology Working Group)

維護 HTML 與 DOM Living Standard 的社群。

**關鍵標準**：
- HTML Living Standard
- DOM Living Standard
- Fetch Standard
- URL Standard

**網站**：https://whatwg.org/

### IETF (Internet Engineering Task Force)

開發網際網路標準。

**關鍵標準**：
- HTTP
- TLS
- TCP/IP
- DNS
- WebRTC 協定

**網站**：https://www.ietf.org/

### ECMA International

資訊系統標準組織。

**關鍵標準**：
- ECMAScript (JavaScript)
- JSON

**網站**：https://www.ecma-international.org/

### TC39 (Technical Committee 39)

ECMAScript 標準化委員會。

**提案階段**：
- **階段 0**：Strawperson (草案)
- **階段 1**：Proposal (提案)
- **階段 2**：Draft (草稿)
- **階段 3**：Candidate (候選)
- **階段 4**：Finished (完成，包含在下一個版本中)

### IANA (Internet Assigned Numbers Authority)

協調網際網路協定資源。

**職責**：
- MIME 類型
- 連接埠編號
- 協定參數
- TLD (頂級域名)

### ICANN (Internet Corporation for Assigned Names and Numbers)

協調 DNS 與 IP 位址。

## Web 標準

### HTML 標準

**HTML5 功能**：
- 語義化元件 (`<article>`, `<section>` 等)
- 音訊與影片元件
- Canvas 與 SVG
- 表單增強
- LocalStorage 與 SessionStorage
- Web Workers
- Geolocation API

### CSS 規範

**CSS 模組** (每個規範都是一個模組)：
- CSS Selectors Level 4
- CSS Flexbox Level 1
- CSS Grid Level 2
- CSS Animations
- CSS Transitions
- CSS Custom Properties

### JavaScript 標準

**ECMAScript 版本**：
- **ES5** (2009)：嚴格模式、JSON
- **ES6/ES2015**：類別、模組、箭頭函式、Promise
- **ES2016**：Array.includes()、指數運算子 (`**`)
- **ES2017**：async/await、Object.values/entries
- **ES2018**：物件的 Rest/spread、非同步迭代
- **ES2019**：Array.flat()、Object.fromEntries
- **ES2020**：選擇性鏈結 (Optional chaining)、空值合併 (Nullish coalescing)、BigInt
- **ES2021**：邏輯賦值 (Logical assignment)、Promise.any
- **ES2022**：Top-level await、類別欄位
- **ES2023**：Array.findLast()、Object.groupBy

### Web API 規範

**常見 API**：
- DOM (文件物件模型)
- Fetch API
- Service Workers
- Web Storage
- IndexedDB
- WebRTC
- WebGL
- Web Audio API
- Payment Request API
- Web Authentication API

## 規範

### 規範性 vs 非規範性 (Normative vs Non-Normative)

- **規範性 (Normative)**：符合性所必需的
- **非規範性 (Non-normative)**：僅供參考 (範例、註解)

### 規範生命週期

1. **Editor's Draft**：進行中
2. **Working Draft**：社群審核
3. **Candidate Recommendation**：實作與測試
4. **Proposed Recommendation**：最終審核
5. **W3C Recommendation**：正式標準

## 瀏覽器相容性

### 功能偵測

```javascript
// 檢查功能支援
if ('serviceWorker' in navigator) {
  // 使用 service workers
}

if (window.IntersectionObserver) {
  // 使用 Intersection Observer
}

if (CSS.supports('display', 'grid')) {
  // 使用 CSS Grid
}
```

### Baseline 相容性

新標準化的功能獲得廣泛的瀏覽器支援。

**廣泛可用**：Firefox、Chrome、Edge、Safari 支援

### Polyfills

在舊版瀏覽器中提供現代功能的程式碼：

```javascript
// Promise polyfill
if (!window.Promise) {
  window.Promise = PromisePolyfill;
}

// Fetch polyfill
if (!window.fetch) {
  window.fetch = fetchPolyfill;
}
```

### 漸進式增強 (Progressive Enhancement)

為基礎瀏覽器建構，為現代瀏覽器增強：

```css
/* 基礎樣式 */
.container {
  display: block;
}

/* 為支援 Grid 的瀏覽器增強 */
@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## IDL (介面定義語言)

**WebIDL**：定義 Web API

```webidl
interface Element : Node {
  readonly attribute DOMString? tagName;
  DOMString? getAttribute(DOMString qualifiedName);
  undefined setAttribute(DOMString qualifiedName, DOMString value);
};
```

## 應知規範

- **HTML Living Standard**
- **CSS 規範** (模組化)
- **ECMAScript 語言規範**
- **HTTP/1.1 (RFC 9112)**
- **HTTP/2 (RFC 9113)**
- **HTTP/3 (RFC 9114)**
- **TLS 1.3 (RFC 8446)**
- **WebSocket Protocol (RFC 6455)**
- **CORS (Fetch Standard)**
- **Service Workers**
- **Web Authentication (WebAuthn)**

## 詞彙術語

**涵蓋的關鍵字詞**：
- Baseline (相容性)
- BCP 47 語言標籤
- ECMA
- ECMAScript
- HTML5
- IANA
- ICANN
- IDL
- IETF
- ISO
- ITU
- 非規範性 (Non-normative)
- 規範性 (Normative)
- Polyfill
- Shim
- 規範
- W3C
- WAI
- WCAG
- WHATWG
- Web 標準
- WebIDL

## 其他資源

- [W3C Standards](https://www.w3.org/TR/)
- [WHATWG Living Standards](https://spec.whatwg.org/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Can I Use](https://caniuse.com/)
- [TC39 Proposals](https://github.com/tc39/proposals)
