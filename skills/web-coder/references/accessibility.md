# 無障礙性參考 (Accessibility Reference)

網頁無障礙性可確保每個人（包含身心障礙人士）都能使用內容。

## WCAG (網頁內容無障礙性指引)

### 等級
- **A**：最低等級
- **AA**：標準目標（許多司法管轄區的法律要求）
- **AAA**：增強的無障礙性

### 四大原則 (POUR)

1. **可感知 (Perceivable)**：呈現資訊的方式能讓使用者感知
2. **可操作 (Operable)**：UI 元件與導覽是可操作的
3. **可理解 (Understandable)**：資訊與 UI 操作是可理解的
4. **穩健性 (Robust)**：內容可搭配目前與未來的技術運作

## ARIA (無障礙豐富網際網路應用程式)

### ARIA 角色 (Roles)

```html
<!-- 地標角色 (Landmark roles) -->
<nav role="navigation">
<main role="main">
<aside role="complementary">
<footer role="contentinfo">

<!-- 小工具角色 (Widget roles) -->
<div role="button" tabindex="0">點擊我</div>
<div role="tab" aria-selected="true">標籤頁 1</div>
<div role="dialog" aria-labelledby="dialogTitle">

<!-- 文件結構 -->
<div role="list">
  <div role="listitem">項目 1</div>
</div>
```

### ARIA 屬性 (Attributes)

```html
<!-- 狀態 (States) -->
<button aria-pressed="true">切換</button>
<input aria-invalid="true" aria-errormessage="error1">
<div aria-expanded="false" aria-controls="menu">選單</div>

<!-- 屬性 (Properties) -->
<img alt="" aria-hidden="true">
<input aria-label="搜尋" type="search">
<dialog aria-labelledby="title" aria-describedby="desc">
  <h2 id="title">對話方塊標題</h2>
  <p id="desc">描述</p>
</dialog>

<!-- 關係 (Relationships) -->
<label id="label1" for="input1">姓名：</label>
<input id="input1" aria-labelledby="label1">

<!-- 即時區域 (Live regions) -->
<div aria-live="polite" aria-atomic="true">
  狀態已更新
</div>
```

## 鍵盤導覽

### Tab 順序

```html
<!-- 自然的 Tab 順序 -->
<button>第一個</button>
<button>第二個</button>

<!-- 自訂 Tab 順序（儘可能避免） -->
<button tabindex="1">第一個</button>
<button tabindex="2">第二個</button>

<!-- 可透過程式設計聚焦（不在 Tab 順序中） -->
<div tabindex="-1">不在 Tab 順序中</div>

<!-- 在 Tab 順序中 -->
<div tabindex="0" role="button">自訂按鈕</div>
```

### 鍵盤事件

```javascript
element.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'Enter':
    case ' ': // 空白鍵
      // 啟動
      break;
    case 'Escape':
      // 關閉/取消
      break;
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      // 導覽
      break;
  }
});
```

## 語義化 HTML (Semantic HTML)

```html
<!-- ✅ 佳：語義化元件 -->
<nav aria-label="主導覽">
  <ul>
    <li><a href="/">首頁</a></li>
  </ul>
</nav>

<!-- ❌ 差：非語義化 -->
<div class="nav">
  <div><a href="/">首頁</a></div>
</div>

<!-- ✅ 佳：正確的標題階層 -->
<h1>頁面標題</h1>
  <h2>章節</h2>
    <h3>子章節</h3>

<!-- ❌ 差：跳過層級 -->
<h1>頁面標題</h1>
  <h3>跳過的 h2</h3>
```

## 表單無障礙性

```html
<form>
  <!-- 標籤 (Labels) -->
  <label for="name">姓名：</label>
  <input type="text" id="name" name="name" required aria-required="true">
  
  <!-- 錯誤訊息 -->
  <input
    type="email"
    id="email"
    aria-invalid="true"
    aria-describedby="email-error">
  <span id="email-error" role="alert">
    請輸入有效的電子郵件
  </span>
  
  <!-- 用於群組的欄位集 (Fieldset) -->
  <fieldset>
    <legend>請選擇一個選項</legend>
    <label>
      <input type="radio" name="option" value="a">
      選項 A
    </label>
    <label>
      <input type="radio" name="option" value="b">
      選項 B
    </label>
  </fieldset>
  
  <!-- 說明文字 -->
  <label for="password">密碼：</label>
  <input
    type="password"
    id="password"
    aria-describedby="password-help">
  <span id="password-help">
    必須至少 8 個字元
  </span>
</form>
```

## 圖片與媒體

```html
<!-- 具備資訊的圖片 -->
<img src="chart.png" alt="第一季銷售額增長了 50%">

<!-- 裝飾性圖片 -->
<img src="decorative.png" alt="" role="presentation">

<!-- 複雜圖片 -->
<figure>
  <img src="data-viz.png" alt="資料視覺化圖表">
  <figcaption>
    資料的詳細描述...
  </figcaption>
</figure>

<!-- 具備字幕的影片 -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="zh-tw" label="繁體中文">
</video>
```

## 色彩與對比度

### WCAG 需求

- **AA 等級**：一般文字為 4.5:1，大文字為 3:1
- **AAA 等級**：一般文字為 7:1，大文字為 4.5:1

```css
/* ✅ 佳對比度 */
.text {
  color: #000; /* 黑色 */
  background: #fff; /* 白色 */
  /* 對比度：21:1 */
}

/* 不要僅依賴色彩 */
.error {
  color: red;
  /* ✅ 同時使用圖示或文字 */
  &::before {
    content: '⚠ ';
  }
}
```

## 螢幕閱讀器 (Screen Readers)

### 最佳實踐

```html
<!-- 導覽用的跳過連結 -->
<a href="#main-content" class="skip-link">
  跳至主要內容
</a>

<!-- 無障礙標題 -->
<h1>主標題（僅限一個）</h1>

<!-- 具描述性的連結 -->
<!-- ❌ 差 -->
<a href="/article">閱讀更多</a>

<!-- ✅ 佳 -->
<a href="/article">閱讀更多關於無障礙性的內容</a>

<!-- 隱藏內容（僅限螢幕閱讀器） -->
<span class="sr-only">
  供螢幕閱讀器使用的額外上下文
</span>
```

```css
/* 僅限螢幕閱讀器類別 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## 焦點管理 (Focus Management)

```css
/* 可見的焦點指示器 */
:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* 不要完全移除焦點樣式 */
/* ❌ 差 */
:focus {
  outline: none;
}

/* ✅ 佳：自訂焦點樣式 */
:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.5);
}
```

```javascript
// 對話方塊中的焦點管理
function openModal() {
  modal.showModal();
  modal.querySelector('button').focus();
  
  // 陷阱焦點 (Trap focus)
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      trapFocus(e, modal);
    }
  });
}
```

## 測試工具

- **axe DevTools**：瀏覽器擴充功能
- **WAVE**：網頁無障礙性評估工具
- **NVDA**：螢幕閱讀器 (Windows)
- **JAWS**：螢幕閱讀器 (Windows)
- **VoiceOver**：螢幕閱讀器 (macOS/iOS)
- **Lighthouse**：自動化稽核

## 檢查表

- [ ] 已使用語義化 HTML
- [ ] 所有圖片皆有替代文字
- [ ] 色彩對比度符合 WCAG AA
- [ ] 鍵盤導覽可正常運作
- [ ] 焦點指示器清晰可見
- [ ] 表單具備標籤
- [ ] 標題階層正確
- [ ] 已適當使用 ARIA
- [ ] 已進行螢幕閱讀器測試
- [ ] 沒有鍵盤陷阱

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- 無障礙性 (Accessibility)
- 無障礙樹 (Accessibility tree)
- 無障礙描述 (Accessible description)
- 無障礙名稱 (Accessible name)
- ARIA
- ATAG
- 布林屬性 (ARIA) (Boolean attribute (ARIA))
- 螢幕閱讀器 (Screen reader)
- UAAG
- WAI
- WCAG

## 額外資源

- [WCAG 2.1 指引](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN 無障礙性 (Accessibility)](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y 專案 (A11y Project)](https://www.a11yproject.com/)
