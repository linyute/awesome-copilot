# 網頁無障礙空間 (Web Accessibility) 參考

這是一份整合自 MDN Web Docs 的參考指南，涵蓋了核心無障礙概念、撰寫指引、安全瀏覽實作、基於 ARIA 的小工具以及行動裝置無障礙需求。

---

## 1. 無障礙空間概觀

> **來源：** https://developer.mozilla.org/en-US/docs/Web/Accessibility

### 什麼是無障礙空間？

**無障礙空間**（縮寫為 **A11y** -- 「a」 + 11 個字元 + 「y」）在網頁開發中意指讓儘可能多的人能夠使用網站，即使這些人的能力在某些方面受到限制。

> 「網頁從根本上設計為供所有人使用，無論其硬體、軟體、語言、地點或能力為何。當網頁達到此目標時，具有各類聽力、行動、視覺與認知能力的人士皆可存取。」 -- W3C

關鍵點：

- 技術讓許多人的生活變更**容易**。
- 技術讓身心障礙人士的生活變為**可能**。
- 無障礙空間涵蓋了身體、認知、聽力、行動與視覺能力。

### 核心原則

1. **語義化 HTML** -- 為預期目的使用正確的元件。
2. **鍵盤導覽** -- 確保在沒有滑鼠的情況下也能擁有完整功能。
3. **輔助技術支援** -- 維持與螢幕閱讀器及其他工具的相容性。
4. **可感知性 (Perceivability)** -- 內容必須能透過多種感官感知。
5. **可操作性 (Operability)** -- 所有功能必須可透過鍵盤操作。
6. **可理解性 (Understandability)** -- 語言清晰且行為可預測。
7. **穩健性 (Robustness)** -- 可在多種輔助技術上運作。

### 初學者教學模組 (MDN Learn Web Development)

| 模組 | 描述 |
|--------|-------------|
| 什麼是無障礙空間？ | 需考慮的群體、使用者依賴的工具、工作流程整合 |
| 無障礙工具與輔助技術 | 解決無障礙問題的工具 |
| HTML：無障礙空間的良好基礎 | 語義化標記與正確的元件使用 |
| CSS 與 JavaScript 最佳實作 | CSS 與 JS 的無障礙實作 |
| WAI-ARIA 基礎 | 為複雜 UI 控制項與動態內容增加語義 |
| 無障礙多媒體 | 影片、音訊與影像的替代文字 |
| 行動裝置無障礙空間 | iOS/Android 工具與行動裝置特定的考量 |

### 關鍵標準與框架

- **WCAG (網頁內容無障礙設計指引)** -- 組織為可感知性、可操作性、可理解性與穩健性類別。
- **ARIA (無障礙豐富網際網路應用程式)** -- 超過 53 個屬性與 87 個角色，用於為自訂小工具增加語義意義。

---

## 2. 網頁作者資訊

> **來源：** https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Information_for_Web_authors

### 準則與法規

#### ARIA 撰寫實作指南 (APG)

- **提供者：** W3C
- **URL：** https://www.w3.org/WAI/ARIA/apg/
- 無障礙網頁體驗的設計模式與功能範例。
- 涵蓋如何將無障礙語義套用於常見設計模式與小工具。

#### 網頁內容無障礙設計指引 (WCAG)

- **提供者：** W3C 網頁無障礙倡議 (WAI)
- **URL：** https://www.w3.org/WAI/standards-guidelines/wcag/
- 歐盟無障礙法規正採用的重要基準準則。

#### MDN 上的 ARIA

- ARIA 角色、屬性與特性的完整指南。
- 每個角色的最佳實作與程式碼範例。

### 如何執行的指南

| 指南 | 提供者 | URL |
|-------|----------|-----|
| 團隊無障礙空間指南 | 美國總務管理局 (GSA) | https://digital.gov/guides/accessibility-for-teams/ |
| 無障礙網頁撰寫 | IBM | https://www.ibm.com/able/requirements/requirements/ |

### 自動化檢查與修復工具

#### 瀏覽器擴充功能

| 工具 | URL |
|------|-----|
| HTML CodeSniffer | https://squizlabs.github.io/HTML_CodeSniffer/ |
| aXe DevTools | 內建於瀏覽器開發者工具 |
| Lighthouse 無障礙稽核 | 已整合至 Chrome 開發者工具 |
| Accessibility Insights | https://accessibilityinsights.io/ |
| WAVE | https://wave.webaim.org/extension/ |

#### 建構程序 / 程式化測試

| 工具 | 描述 |
|------|-------------|
| axe-core | 用於自動化測試的無障礙引擎 (dequelabs/axe-core) |
| eslint-plugin-jsx-a11y | 用於 JSX 無障礙規則的 ESLint 外掛程式 |
| Lighthouse Audits | 可程式化的稽核執行工具 (GoogleChrome/lighthouse) |
| AccessLint.js | 自動化無障礙 Linter 函式庫 |

#### 持續整合

- **AccessLint** (https://accesslint.com/) -- 與 GitHub 的 Pull Request 整合，進行自動化無障礙空間審查。

### 測試建議

採用的模擬與測試方法：

- 色盲模擬
- 低視力模擬
- 低對比度測試
- 縮放測試
- 僅限鍵盤導覽（停用滑鼠）
- 僅限觸控測試
- 語音指令測試
- 使用 **Web Disability Simulator** 瀏覽器擴充功能進行測試

最佳實作： **儘可能與真實使用者一起測試。**

---

## 3. 安全瀏覽

> **來源：** https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Browsing_safely

### 處理的狀況

| 狀況 | 常見觸發因素 |
|-----------|-----------------|
| 前庭系統障礙 (Vestibular Disorders) | 動態、動畫、視差捲動效果 |
| 癲癇症 | 閃爍（每秒 3 次以上）、顫動、高對比色彩變化 |
| 光敏感性 (Photosensitivity) | 色彩強度、閃爍、高對比 |
| 創傷性腦損傷 (TBI) | 處理色彩時產生的重度認知負荷 |

### CSS 媒體特性： `prefers-reduced-motion`

偵測使用者作業系統層級對減少動態效果的偏好。

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

開發者可以接聽的 CSS 過渡事件：

- `transitionrun`
- `transitionstart`
- `transitionend`
- `transitioncancel`

### 平台層級的瀏覽器控制項

| 平台 | 設定 | 備註 |
|----------|---------|-------|
| 桌上型 Safari (10.1+) | 停用自動播放 | 不影響動畫 GIF |
| iOS Safari (10.3+) | 減少動態效果（系統輔助功能設定） | GIF 不受影響 |
| Firefox | `image.animation_mode` 設為 `"none"` | 停用所有動畫 GIF |
| 閱讀器模式 (各種) | 內容封鎖器、文字轉語音、字型/縮放 | 減少干擾 |

### 有用的瀏覽器擴充功能

| 擴充功能 | 用途 | 瀏覽器 |
|-----------|---------|---------|
| Gif Blocker | 封鎖所有 GIF | Chrome |
| Gif Scrubber | 像影片一樣暫停/播放/拖動 GIF | Chrome |
| Beeline Reader | 灰階模式、失讀症友善字型、對比度 | Chrome, Edge, Firefox |

### 作業系統無障礙功能

**Windows 10：**

- 設定 > 輕鬆存取 > 顯示 -- 關閉動畫。
- 設定 > 輕鬆存取 > 顯示 > 色彩篩選器 -- 切換灰階。
- 灰階可減輕 TBI、光敏感性癲癇及其他狀況的認知負荷。

**macOS：**

- 系統偏好設定 > 輔助功能 > 顯示器 -- 「減少動態效果」選項。

### 符合 WCAG： 成功準則 2.3.1

**三次閃爍或低於閾值** -- 內容閃爍頻率不得超過每秒三次，除非閃爍低於一般閃爍與紅色閃爍閾值。

### 給開發者的最佳實作

**應該：**

- 支援 `prefers-reduced-motion` 媒體查詢。
- 保持閃爍頻率低於每秒 3 次。
- 為所有動畫提供播放/暫停控制項。
- 在啟用作業系統無障礙功能的情況下進行測試。

**不該：**

- 在沒有使用者控制項的情況下自動播放影片或動畫。
- 使用高頻率閃爍或頻閃效果。
- 假設所有使用者都能忍受動態效果。

### 實作檢查清單

- [ ] 在 CSS 中加入 `@media (prefers-reduced-motion: reduce)` 規則。
- [ ] 當使用者偏好設定已啟用時，停用自動播放動畫。
- [ ] 確保 GIF 具備暫停控制項。
- [ ] 在 Windows 與 macOS 無障礙模式下進行測試。
- [ ] 針對 WCAG 2.3.1（三次閃爍準則）進行驗證。

---

## 4. 無障礙網頁應用程式與小工具

> **來源：** https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Accessible_web_applications_and_widgets

### 問題點

使用 `<div>` 和 `<span>` 等一般 HTML 元件構建的自訂 JavaScript 小工具（滑桿、選單列、分頁、對話方塊）缺乏輔助技術的語義意義。動態內容變更可能無法被螢幕閱讀器偵測。

### ARIA (無障礙豐富網際網路應用程式)

ARIA 透過三種類型的屬性填補標準 HTML 與桌面風格 UI 控制項之間的鴻溝：

1. **角色 (Roles)** -- 描述 HTML 中原生未提供的小工具（滑桿、選單列、分頁、對話方塊）。
2. **屬性 (Properties)** -- 描述特徵（可拖曳、必填、具有彈出式視窗）。
3. **狀態 (States)** -- 描述目前互動狀態（忙碌中、已停用、已選取、隱藏）。

**重要：** 只要有合適的語義化 HTML 元件，請優先使用，而非 ARIA。ARIA 是動態元件的漸進式增強。

### 範例： 分頁小工具

**無 ARIA（非無障礙）：**

```html
<ol>
  <li id="ch1Tab">
    <a href="#ch1Panel">第 1 章</a>
  </li>
  <li id="ch2Tab">
    <a href="#ch2Panel">第 2 章</a>
  </li>
</ol>

<div>
  <div id="ch1Panel">第 1 章內容放在這裡</div>
  <div id="ch2Panel">第 2 章內容放在這裡</div>
</div>
```

**具備 ARIA（無障礙）：**

```html
<ol role="tablist">
  <li id="ch1Tab" role="tab">
    <a href="#ch1Panel">第 1 章</a>
  </li>
  <li id="ch2Tab" role="tab">
    <a href="#ch2Panel">第 2 章</a>
  </li>
</ol>

<div>
  <div id="ch1Panel" role="tabpanel" aria-labelledby="ch1Tab">
    第 1 章內容放在這裡
  </div>
  <div id="ch2Panel" role="tabpanel" aria-labelledby="ch2Tab">
    第 2 章內容放在這裡
  </div>
</div>
```

### 常見 ARIA 狀態屬性

| 屬性 | 用途 |
|-----------|---------|
| `aria-checked` | 核取方塊或選項按鈕的狀態 |
| `aria-disabled` | 可見但無法編輯/操作 |
| `aria-grabbed` | 拖放操作中的「抓取」狀態 |
| `aria-selected` | 元件的選取狀態 |
| `aria-expanded` | 可展開內容是否開啟 |
| `aria-pressed` | 切換按鈕的按下狀態 |

使用 ARIA 狀態來指示 UI 狀態，並使用 CSS 屬性選擇器來設定對應樣式。

### 使用 `aria-hidden` 管理可見性

```html
<div id="tp1" class="tooltip" role="tooltip" aria-hidden="true">
  您的名字是選填的
</div>
```

```css
div.tooltip[aria-hidden="true"] {
  display: none;
}
```

```javascript
function showTip(el) {
  el.setAttribute("aria-hidden", "false");
}
```

### 角色變更

切勿動態變更元件的 ARIA 角色。相反地，請完全替換該元件：

```javascript
// 正確： 交換元件
// 檢視模式
<div role="button">編輯此文字</div>

// 編輯模式： 替換為輸入項
<input type="text" />
```

### 鍵盤導覽最佳實作

| 按鍵 | 預期行為 |
|-----|-------------------|
| Tab / Shift+Tab | 將焦點移入或移出小工具 |
| 方向鍵 | 在小工具內的項目之間導覽 |
| Enter / 空白鍵 | 啟動聚焦的控制項 |
| Escape | 關閉選單或對話方塊 |
| Home / End | 跳至第一個或最後一個項目 |

焦點管理考量因素：

- 維持與視覺佈局一致的焦點順序。
- 使用 `tabindex="0"` 讓自訂元件可透過鍵盤存取。
- 避免 `tabindex > 0`（這會破壞自然的分頁順序）。
- 為鍵盤使用者更新視覺焦點指示器。
- 開啟對話方塊或強制回應視窗 (modals) 時，透過程式移動焦點。

### 互動式小工具的關鍵 ARIA 屬性

**標記與描述：**

| 屬性 | 用法 |
|-----------|-------|
| `aria-label` | 直接文字標籤 |
| `aria-labelledby` | 參照標記此元件的元件 |
| `aria-describedby` | 參照額外的描述性文字 |
| `aria-description` | 行內描述文字 |

**關係：**

| 屬性 | 用法 |
|-----------|-------|
| `aria-controls` | 此元件控制另一個元件 |
| `aria-owns` | 建立父子關係 |
| `aria-flowto` | 定義邏輯閱讀順序 |

**小工具行為：**

| 屬性 | 用法 |
|-----------|-------|
| `aria-haspopup` | 具有彈出式元件（選單、清單方塊、對話方塊、網格、樹狀圖） |
| `aria-expanded` | 可展開內容狀態 (true/false) |
| `aria-modal` | 強制回應對話方塊 (true) |
| `aria-live` | 即時區域宣告（polite, assertive, off） |
| `aria-busy` | 載入中或處理中狀態 (true/false) |

### 動態內容的即時區域 (Live Regions)

```html
<div aria-live="polite" aria-atomic="true">
  更新將宣告給螢幕閱讀器
</div>
```

- `aria-live="polite"` -- 在方便時宣告。
- `aria-live="assertive"` -- 立即宣告。
- `aria-atomic="true"` -- 宣告整個區域，而不僅僅是變更的部分。

---

## 5. 行動裝置無障礙空間檢查清單

> **來源：** https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist

針對鎖定 WCAG 2.2 AA 合規性的行動應用程式開發者所準備的無障礙需求檢查清單。

### 色彩

- **一般文字：** 最小 4.5:1 對比度（小於 18pt 或 14pt 粗體）。
- **大型文字：** 最小 3:1 對比度（至少 18pt 或 14pt 粗體）。
- 透過色彩傳達的資訊也必須透過其他方式提供（例如為連結加上底線）。

### 可見性

- 切勿僅透過零不透明度 (opacity)、z-index 排序或移出螢幕外來隱藏內容。
- 使用 `hidden` HTML 屬性、`visibility` 或 `display` CSS 屬性來真實地隱藏內容。
- 除非絕對必要，否則避免使用 `aria-hidden`。
- 對於多個檢視/卡片可能重疊的單頁應用程式 (SPA) 而言至關重要。

### 焦點

- 標準控制項（連結、按鈕、表單欄位）預設即可聚焦。
- 自訂控制項必須具備適當的 ARIA 角色（例如 `button`, `link`, `checkbox`）。
- 焦點順序必須邏輯一致。

### 文字替代方案

- 使用 `alt`, `title`, `aria-label`, `aria-labelledby` 或 `aria-describedby` 為所有非文字元件提供文字替代方案。
- 避免使用文字影像。
- 可見的 UI 元件文字必須與程式名稱一致 (WCAG 2.1: Label in Name)。
- 所有表單控制項必須具備關聯的 `<label>` 元件。

### 處理狀態

- 標準控制項： 作業系統負責處理選項按鈕與核取方塊。
- 自訂控制項必須透過 ARIA 狀態溝通狀態變更：
  - `aria-checked`
  - `aria-disabled`
  - `aria-selected`
  - `aria-expanded`
  - `aria-pressed`

### 螢幕方向 (Orientation)

- 內容不得限制為僅限直向或橫向，除非必要（例如鋼琴應用程式或銀行支票掃描器）。
- 參照： WCAG 2.1 Orientation (https://www.w3.org/WAI/WCAG21/Understanding/orientation.html)。

### 通用準則

**應用程式結構：**

- 務必提供應用程式標題。
- 使用正確的標題階層，不要跳過層級：

```html
<h1>頂層標題</h1>
  <h2>次層標題</h2>
  <h2>另一個次層標題</h2>
    <h3>底層標題</h3>
```

**ARIA 地標角色：**

使用地標描述應用程式或文件結構：

- `banner`
- `complementary`
- `contentinfo`
- `main`
- `navigation`
- `search`

**觸控事件 (WCAG 2.1: Pointer Cancellation)：**

1. 避免在按下事件 (down-event) 時執行函式。
2. 若不可避免，請在放開事件 (up-event) 時完成函式並提供中止機制。
3. 若不可避免，確保放開事件可以撤銷按下事件的動作。
4. 例外： 遊戲控制、虛擬鍵盤、即時回饋。

**觸控目標尺寸：**

- 目標必須夠大，以便使用者穩定互動。
- 參照： BBC Mobile Accessibility Guidelines 獲取特定尺寸建議 (https://www.bbc.co.uk/accessibility/forproducts/guides/mobile/target-touch-size)。

---

## 額外資源

| 資源 | URL |
|----------|-----|
| W3C 無障礙空間標準 | https://www.w3.org/standards/webdesign/accessibility |
| WAI 興趣小組 | https://www.w3.org/WAI/about/groups/waiig/ |
| ARIA 規範 | https://w3c.github.io/aria/ |
| WAI-ARIA 撰寫實作 | https://www.w3.org/WAI/ARIA/apg/ |
| WCAG 2.1 理解文件 | https://www.w3.org/WAI/WCAG21/Understanding/ |
| IBM 無障礙空間需求 | https://www.ibm.com/able/requirements/requirements/ |
| Accessibility Insights | https://accessibilityinsights.io/ |
| WAVE 評估工具 | https://wave.webaim.org/extension/ |
