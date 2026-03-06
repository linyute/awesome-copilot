# Styling Web Forms 參考

---

## 1. 設定網頁表單樣式

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Styling_web_forms>

### 概觀

本節涵蓋了設定 HTML 表單元件樣式的 CSS 技術。這對於了解哪些表單元件容易設定樣式，以及哪些需要特殊技術至關重要。

**先決條件：**

- 對 HTML 有基本了解
- CSS 樣式設定基礎

**目標：** 學習適用於表單小工具 (widgets) 的樣式設定技術，並了解其中的挑戰。

### 設定表單小工具樣式的挑戰

#### 歷史背景

- **1995 年：** HTML 2 規範引入了表單控制項。
- **1996 年底：** CSS 發布，但當時尚未得到廣泛支援。
- **早期：** 瀏覽器依賴作業系統來轉譯表單小工具。
- **現代：** 大多數表單小工具現在都可以設定樣式，但仍有一些例外。

#### 表單小工具分類

**容易設定樣式的元件：**

1. `<form>`
2. `<fieldset>` 和 `<legend>`
3. 單行文字 `<input>` (類型：text, url, email)
4. 多行 `<textarea>`
5. 按鈕 (`<input>` 和 `<button>`)
6. `<label>`
7. `<output>`

**較難設定樣式的元件：**

- 核取方塊 (Checkboxes) 和選項按鈕 (Radio buttons)
- `<input type="search">`
- （請參閱「進階表單樣式設定」章節以了解相關技術）

**無法僅透過 CSS 設定樣式的元件：**

- `<input type="color">`
- 日期相關控制項 (`<input type="datetime-local">`)
- `<input type="range">`
- `<input type="file">`
- `<select>`, `<option>`, `<optgroup>`, `<datalist>`
- `<progress>` 和 `<meter>`

### 設定簡單表單小工具的樣式

#### 字型與文字

**問題：** 瀏覽器不會一致地繼承 `font-family` 和 `font-size` -- 許多瀏覽器會使用系統預設值。

**解決方案：** 強制繼承以確保樣式一致：

```css
button,
input,
select,
textarea {
  font-family: inherit;
  font-size: 100%;
}
```

`inherit` 值會與父元件的計算屬性值相符。

**注意：** `<input type="submit">` 在某些瀏覽器中不會繼承；請改用 `<button>` 以獲得更好的一致性。

#### 盒模型尺寸 (Box Sizing)

**問題：** 每個小工具都有不同的預設邊框 (border)、內距 (padding) 和外距 (margin) 規則。

**解決方案：** 使用 `box-sizing` 並搭配一致的尺寸：

```css
input,
textarea,
select,
button {
  width: 150px;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
```

這可以確保所有元件佔用的空間相同，不受原生平台預設值的影響。

#### Legend 放置

預設情況下，`<legend>` 元件會位於 `<fieldset>` 邊框之上。若要重新調整其位置：

```css
fieldset {
  position: relative;
}

legend {
  position: absolute;
  bottom: 0;
  right: 0;
  color: white;
  background-color: black;
  padding: 3px;
}
```

範例 HTML：

```html
<form>
  <fieldset>
    <legend>選擇所有您喜歡吃的蔬菜</legend>
    <ul>
      <li>
        <label for="carrots">胡蘿蔔</label>
        <input
          type="checkbox"
          checked
          id="carrots"
          name="carrots"
          value="carrots" />
      </li>
      <li>
        <label for="peas">豌豆</label>
        <input type="checkbox" id="peas" name="peas" value="peas" />
      </li>
    </ul>
  </fieldset>
</form>
```

**無障礙空間注意事項：** `<legend>` 內容會被輔助技術讀取。雖然在視覺上調整其位置，但請將其保留在 DOM 中。考慮使用 `transform` 而非定位 (positioning) 以避免邊框間隙。

### 實用樣式範例：明信片表單

#### HTML 結構

```html
<form>
  <h1>收件人：Mozilla</h1>

  <div id="from">
    <label for="name">寄件人：</label>
    <input type="text" id="name" name="user_name" />
  </div>

  <div id="reply">
    <label for="mail">回覆：</label>
    <input type="email" id="mail" name="user_email" />
  </div>

  <div id="message">
    <label for="msg">您的訊息：</label>
    <textarea id="msg" name="user_message"></textarea>
  </div>

  <div class="button">
    <button type="submit">傳送您的訊息</button>
  </div>
</form>
```

#### 設定網頁字型

```css
@font-face {
  font-family: "handwriting";
  src:
    url("fonts/journal-webfont.woff2") format("woff2"),
    url("fonts/journal-webfont.woff") format("woff");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "typewriter";
  src:
    url("fonts/momot___-webfont.woff2") format("woff2"),
    url("fonts/momot___-webfont.woff") format("woff");
  font-weight: normal;
  font-style: normal;
}
```

#### 整體佈局

```css
body {
  font: 1.3rem sans-serif;
  padding: 0.5em;
  margin: 0;
  background: #222222;
}

form {
  position: relative;
  width: 740px;
  height: 498px;
  margin: 0 auto;
  padding: 1em;
  box-sizing: border-box;
  background: white url("background.jpg");

  /* CSS Grid 佈局 */
  display: grid;
  grid-gap: 20px;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: 10em 1em 1em 1em;
}
```

#### 標題與佈局

```css
h1 {
  font:
    1em "typewriter",
    monospace;
  align-self: end;
}

#message {
  grid-row: 1 / 5;
}

#from,
#reply {
  display: flex;
}
```

#### 標籤 (Labels)

```css
label {
  font:
    0.8em "typewriter",
    sans-serif;
}
```

#### 文字欄位

```css
input,
textarea {
  font:
    1.4em/1.5em "handwriting",
    cursive,
    sans-serif;
  border: none;
  padding: 0 10px;
  margin: 0;
  width: 80%;
  background: none;
}

input:focus,
textarea:focus {
  background: rgb(0 0 0 / 10%);
  border-radius: 5px;
}
```

#### Textarea 調整

```css
textarea {
  display: block;
  padding: 10px;
  margin: 10px 0 0 -10px;
  width: 100%;
  height: 90%;
  border-right: 1px solid;
  /* resize: none; */
  overflow: auto;
}
```

提示：

- 僅在必要時使用 `resize: none`（避免限制使用者控制）。
- 設定 `overflow: auto` 以確保跨瀏覽器轉譯一致。

#### 按鈕樣式

```css
button {
  padding: 5px;
  font: bold 0.6em sans-serif;
  border: 2px solid #333333;
  border-radius: 5px;
  background: none;
  cursor: pointer;
  transform: rotate(-1.5deg);
}

button::after {
  content: " >>>";
}

button:hover,
button:focus {
  background: black;
  color: white;
}
```

### 表單的關鍵 CSS 屬性

| 屬性 | 用途 |
|---|---|
| `font-family: inherit` | 繼承父代字型 |
| `font-size: 100%` | 繼承父代大小 |
| `box-sizing: border-box` | 寬度包含內距/邊框 |
| `border: none` | 移除預設邊框 |
| `padding` | 增加元件內部空間 |
| `margin` | 增加元件外部空間 |
| `background` | 控制背景外觀 |
| `:focus` | 設定聚焦表單欄位的樣式 |
| `resize` | 允許/防止 textarea 調整大小 |
| `overflow: auto` | 一致地處理捲動 |

### 最佳實作

1. **一致性：** 使用 `box-sizing: border-box` 實現可預測的尺寸。
2. **繼承：** 在表單元件上明確設定 `font-family` 和 `font-size`。
3. **無障礙空間：** 務必為鍵盤導覽包含 `:focus` 樣式。
4. **瀏覽器支援：** 在不同瀏覽器上進行測試以確保轉譯一致。
5. **使用者控制：** 避免移除有用的預設值，如 textarea 大小調整。
6. **自訂字型：** 使用 `@font-face` 並提供多種格式 (woff2 + woff) 以確保相容性。

---

## 2. 進階表單樣式設定

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Advanced_form_styling>

### 概觀

本節涵蓋了難以使用 CSS 設定樣式的表單控制項，並將其分為「壞」（需要更複雜的 CSS）和「醜」（幾乎無法徹底設定樣式）兩類。

**壞的：**

- 核取方塊和選項按鈕
- `<input type="search">`

**醜的：**

- 下拉式小工具：`<select>`, `<option>`, `<optgroup>`, `<datalist>`
- `<input type="color">`
- 日期相關控制項：`<input type="datetime-local">`
- `<input type="range">`
- `<input type="file">`
- `<progress>` 和 `<meter>`

### `appearance` 屬性

`appearance` 屬性控制表單控制項的作業系統級別樣式。最實用的值是 `none`，它會移除系統級別的樣式，並允許自訂 CSS 樣式。

```css
input {
  appearance: none;
}
```

這會讓控制項停止使用系統級別的樣式，讓您能夠使用 CSS 建立自訂樣式。

### 設定核取方塊和選項按鈕的樣式

#### 方法：使用 `appearance: none`

完全移除預設的核取方塊/選項按鈕樣式，並建立自訂設計：

```html
<form>
  <fieldset>
    <legend>水果偏好</legend>
    <p>
      <label>
        <input type="checkbox" name="fruit" value="cherry" />
        我喜歡櫻桃
      </label>
    </p>
    <p>
      <label>
        <input type="checkbox" name="fruit" value="banana" disabled />
        我不能喜歡香蕉
      </label>
    </p>
  </fieldset>
</form>
```

#### CSS 自訂核取方塊樣式

```css
input[type="checkbox"] {
  appearance: none;
  position: relative;
  width: 1em;
  height: 1em;
  border: 1px solid gray;
  /* 調整核取方塊在文字基線上的位置 */
  vertical-align: -2px;
  /* 在此處設定，以便 Windows 的高對比模式可以覆蓋 */
  color: green;
}

input[type="checkbox"]::before {
  content: "\2714";
  position: absolute;
  font-size: 1.2em;
  right: -1px;
  top: -0.3em;
  visibility: hidden;
}

input[type="checkbox"]:checked::before {
  /* 使用 `visibility` 而非 `display` 以避免重新計算佈局 */
  visibility: visible;
}

input[type="checkbox"]:disabled {
  border-color: black;
  background: #dddddd;
  color: gray;
}
```

**關鍵虛擬類別：**

- `:checked` -- 核取方塊/選項按鈕處於選取狀態
- `:disabled` -- 核取方塊/選項按鈕已停用且無法互動

### 搜尋方塊與 `appearance`

對於 `<input type="search">` 元件，過去通常需要 `appearance: none`，但在 Safari 16+ 中已不再需要。

移除 "x" 刪除按鈕：

```css
input[type="search"]:not(:focus, :active)::-webkit-search-cancel-button {
  display: none;
}
```

### 設定「醜陋」表單控制項的樣式

#### 全域標準化

在所有表單控制項中套用一致的樣式：

```css
button,
label,
input,
select,
progress,
meter {
  display: block;
  font-family: inherit;
  font-size: 100%;
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  padding: 5px;
  height: 30px;
}

input[type="text"],
input[type="datetime-local"],
input[type="color"],
select {
  box-shadow: inset 1px 1px 3px #cccccc;
  border-radius: 5px;
}
```

### 設定 Select 和 Datalist 元件的樣式

#### 建立自訂 Select 箭頭

```html
<label for="select">選取方塊：</label>
<div class="select-wrapper">
  <select id="select" name="select">
    <option>香蕉</option>
    <option>櫻桃</option>
    <option>檸檬</option>
  </select>
</div>
```

```css
select {
  appearance: none;
  width: 100%;
  height: 100%;
}

.select-wrapper {
  position: relative;
}

.select-wrapper::after {
  content: "\25BC";
  font-size: 1rem;
  top: 3px;
  right: 10px;
  position: absolute;
}
```

**限制：**

- 您無法設定點擊時出現的下拉選項方塊樣式。
- 您無法設定 `<datalist>` 自動完成清單的樣式。
- 若要完全控制，請使用函式庫、建立自訂控制項，或使用 `multiple` 屬性。

### 設定日期輸入類型的樣式

日期/時間輸入 (`datetime-local`, `time`, `week`, `month`) 的樣式選項有限：

```css
input[type="datetime-local"] {
  box-shadow: inset 1px 1px 3px #cccccc;
  border-radius: 5px;
}
```

外層容器可以設定樣式，但內部部分（彈出式日曆、微調按鈕）則不行。若要完全控制，請使用自訂控制項函式庫或自行建立。

### 設定範圍輸入類型的樣式

範圍滑桿 (Range sliders) 可以透過大量的 CSS 工作來達成自訂：

```css
input[type="range"] {
  appearance: none;
  background: red;
  height: 2px;
  padding: 0;
  outline: 1px solid transparent;
}
```

完整的範圍樣式需要複雜的 CSS 以及瀏覽器特定的虛擬元件 (`::-webkit-slider-thumb`, `::-moz-range-thumb` 等)。

### 設定顏色輸入類型的樣式

```css
input[type="color"] {
  border: 0;
  padding: 0;
}
```

若要進行更顯著的自訂，則需要自訂解決方案。

### 設定檔案輸入類型的樣式

檔案輸入大部分可以設定樣式，除了檔案選取按鈕之外，該按鈕完全無法設定樣式。建議的方法是隱藏輸入項並設定標籤 (label) 的樣式。

```html
<label for="file">選擇要上傳的檔案</label>
<input id="file" name="file" type="file" multiple />
```

```css
input[type="file"] {
  height: 0;
  padding: 0;
  opacity: 0;
}

label[for="file"] {
  box-shadow: 1px 1px 3px #cccccc;
  background: linear-gradient(to bottom, #eeeeee, #cccccc);
  border: 1px solid darkgrey;
  border-radius: 5px;
  text-align: center;
  line-height: 1.5;
}

label[for="file"]:hover {
  background: linear-gradient(to bottom, white, #dddddd);
}

label[for="file"]:active {
  box-shadow: inset 1px 1px 3px #cccccc;
}
```

#### 顯示檔案資訊的 JavaScript

```javascript
const fileInput = document.querySelector("#file");
const fileList = document.querySelector("#file-list");

fileInput.addEventListener("change", updateFileList);

function updateFileList() {
  while (fileList.firstChild) {
    fileList.removeChild(fileList.firstChild);
  }

  const curFiles = fileInput.files;

  if (curFiles.length > 0) {
    for (const file of curFiles) {
      const listItem = document.createElement("li");
      listItem.textContent = `檔案名稱：${file.name}；檔案大小：${returnFileSize(file.size)}。`;
      fileList.appendChild(listItem);
    }
  }
}

function returnFileSize(number) {
  if (number < 1e3) {
    return `${number} bytes`;
  } else if (number >= 1e3 && number < 1e6) {
    return `${(number / 1e3).toFixed(1)} KB`;
  }
  return `${(number / 1e6).toFixed(1)} MB`;
}
```

### 設定進度條 (Progress) 與計量器 (Meter) 元件的樣式

進度條和計量器是最難設定樣式的。

```css
progress,
meter {
  display: block;
  width: 100%;
  padding: 5px;
  height: 30px;
}
```

**限制：**

- 不同瀏覽器之間的寬度處理不一致。
- 無法個別設定前景進度條顏色。
- `appearance: none` 反而會讓情況變得更糟。
- **建議：** 使用自訂解決方案或第三方函式庫。

### 樣式設定方法摘要

| 控制項類型 | 方法 | 難度 |
|---|---|---|
| 核取方塊/選項按鈕 | `appearance: none` + 自訂設計 | 中 |
| 搜尋輸入 | 舊版瀏覽器使用 `appearance: none` | 低 |
| Select/Datalist | 包裝器 (Wrapper) + 自訂箭頭，控制有限 | 中 |
| 日期輸入 | 僅限基本樣式 | 高 |
| 範圍滑桿 | `appearance: none` + 複雜虛擬元件 | 高 |
| 顏色輸入 | 移除邊框/內距 | 低 |
| 檔案輸入 | 隱藏 + 設定標籤樣式 | 中 |
| 進度條/計量器 | 建議使用自訂解決方案 | 極高 |

### 關鍵重點

1. 在套用自訂 CSS 之前，使用 `appearance: none` 移除作業系統級別的樣式。
2. `:checked` 和 `:disabled` 等虛擬類別對於表單控制項狀態至關重要。
3. 某些控制項（下拉選單內部、檔案按鈕、進度條內部）具有固有的限制。
4. 對於「醜陋」元件的完全自訂，請考慮自訂以 JavaScript 為基礎的控制項、第三方函式庫，或現代的 HTML/CSS 功能，如可自訂的 Select 元件。

---

## 3. 可自訂的 Select 元件

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select>

### 概觀

可自訂的 Select 元件讓您能使用實驗性的 HTML 和 CSS 功能建構完全樣式化的 `<select>` 元件，並能完全控制：

- 選取按鈕樣式
- 下拉選取器外觀
- 箭頭圖示設計
- 目前選取項目的核取記號
- 個別 `<option>` 元件的樣式設定

**警告：** 目前瀏覽器對這些功能的支援有限。在某些 JavaScript 框架中，這些功能可能會導致伺服器端轉譯 (SSR) 的水合 (hydration) 失敗。

### 可自訂 Select 由哪些功能組成？

#### HTML 元件

**`<select>`, `<option>`, `<optgroup>` 元件：**

- 與傳統的 select 運作方式類似，但具有額外允許的內容類型。
- `<option>` 元件現在可以包含標記（span、影像、語義元件），而不僅僅是文字。

**`<select>` 內部的 `<button>` 元件：**

- `<select>` 元件的第一個子元件（以往不允許）。
- 替換關閉狀態下 select 的預設按鈕轉譯。
- 被稱為 **select button**（開啟下拉選取器）。
- Select 按鈕預設為 `inert`（不活潑），使子代互動元件無法聚焦。

**`<selectedcontent>` 元件：**

- 可選地放置在第一個 `<button>` 子元件中。
- 在關閉的 `<select>` 中顯示目前選取的值。
- 包含目前選取 `<option>` 內容的複本。

#### CSS 屬性與虛擬元件

| 功能 | 用途 |
|---|---|
| `appearance: base-select` | 選擇使用瀏覽器定義的自訂 select 樣式（在 `select` 和 `::picker(select)` 上皆為必要） |
| `::picker(select)` | 目標為整個選取器內容（除了第一個 `<button>` 之外的所有元件） |
| `::picker-icon` | 目標為 select 按鈕內部的箭頭圖示 |
| `::checkmark` | 目標為目前選取 `<option>` 中的核取記號 |
| `:open` | 在選取器開啟時目標為 select 按鈕 |
| `:checked` | 目標為目前選取的 `<option>` |
| `:popover-open` | 目標為顯示狀態下的選取器（透過 Popover API） |

#### 自動行為

- 透過 Popover API 實現 **Invoker/Popover 關係**。
- 透過 CSS 錨點定位 (anchor positioning) 實現 **隱含錨點參照**（無需明確的 anchor-name/position-anchor）。
- 具有後備選項的 **自動定位**，以防止視窗溢出。

### HTML 標記結構

#### 基本範例：寵物選取器

```html
<form>
  <p>
    <label for="pet-select">選取寵物：</label>
    <select id="pet-select">
      <button>
        <selectedcontent></selectedcontent>
      </button>

      <option value="">請選取一隻寵物</option>
      <option value="cat">
        <span class="icon" aria-hidden="true">&#x1F431;</span>
        <span class="option-label">貓</span>
      </option>
      <option value="dog">
        <span class="icon" aria-hidden="true">&#x1F436;</span>
        <span class="option-label">狗</span>
      </option>
      <option value="hamster">
        <span class="icon" aria-hidden="true">&#x1F439;</span>
        <span class="option-label">倉鼠</span>
      </option>
      <option value="chicken">
        <span class="icon" aria-hidden="true">&#x1F414;</span>
        <span class="option-label">雞</span>
      </option>
      <option value="fish">
        <span class="icon" aria-hidden="true">&#x1F41F;</span>
        <span class="option-label">魚</span>
      </option>
      <option value="snake">
        <span class="icon" aria-hidden="true">&#x1F40D;</span>
        <span class="option-label">蛇</span>
      </option>
    </select>
  </p>
</form>
```

**關鍵標記點：**

- 在裝飾性圖示上使用 `aria-hidden="true"`，以防止輔助技術重複宣告。
- `<button><selectedcontent></selectedcontent></button>` 代表 select 按鈕，並允許樣式自訂。
- 多元件的 `<option>` 內容會被複製到 `<selectedcontent>` 並在關閉的 select 中顯示。
- **漸進式增強：** 不支援的瀏覽器會忽略按鈕結構，並去除選項中的非文字內容。

#### 值擷取規則

當 `<option>` 包含多層級 DOM 子樹時：

1. 瀏覽器會擷取 `textContent` 屬性。
2. 套用 `trim()`。
3. 將結果設定為 `<select>` 的值。

### CSS 樣式設定技術

#### 1. 選擇使用自訂 Select 轉譯

**必要的第一步：**

```css
select,
::picker(select) {
  appearance: base-select;
}
```

這會移除作業系統級別的樣式，並啟用自訂瀏覽器基礎樣式。

#### 2. 設定 Select 按鈕的樣式

```css
* {
  box-sizing: border-box;
}

html {
  font-family: "Helvetica", "Arial", sans-serif;
}

select {
  border: 2px solid #dddddd;
  background: #eeeeee;
  padding: 10px;
  transition: 0.4s;
  flex: 1;
}

select:hover,
select:focus {
  background: #dddddd;
}
```

#### 3. 設定選取器圖示 (Picker Icon) 的樣式

```css
select::picker-icon {
  color: #999999;
  transition: 0.4s rotate;
}

/* 開啟選取器時旋轉圖示 */
select:open::picker-icon {
  rotate: 180deg;
}
```

#### 4. 設定下拉選取器 (Drop-Down Picker) 的樣式

```css
::picker(select) {
  border: none;
  border-radius: 8px;
}

option {
  display: flex;
  justify-content: flex-start;
  gap: 20px;

  border: 2px solid #dddddd;
  background: #eeeeee;
  padding: 10px;
  transition: 0.4s;
}

/* 圓角化頂部和底部邊角 */
option:first-of-type {
  border-radius: 8px 8px 0 0;
}

option:last-of-type {
  border-radius: 0 0 8px 8px;
}

/* 移除除最後一個之外的內部底邊框 */
option:not(option:last-of-type) {
  border-bottom: none;
}

/* 斑馬紋 */
option:nth-of-type(odd) {
  background: white;
}

/* 懸停/聚焦時突顯 */
option:hover,
option:focus {
  background: plum;
}

/* 設定選項圖示樣式 */
option .icon {
  font-size: 1.6rem;
  text-box: trim-both cap alphabetic;
}
```

#### 5. 設定按鈕中已選內容的樣式

在按鈕中顯示時隱藏圖示（但在選取器中保留）：

```css
selectedcontent .icon {
  display: none;
}
```

#### 6. 設定目前選取選項的樣式

```css
option:checked {
  font-weight: bold;
}
```

#### 7. 設定核取記號的樣式

移動到末尾並使用自訂內容：

```css
option::checkmark {
  order: 1;
  margin-left: auto;
  content: "\2611\FE0F";
}
```

**注意：** `::checkmark` 不在無障礙樹中；產生的內容不會被輔助技術讀取。

### 進階技術

#### Popover 動畫

使用 Popover API 狀態來設定選取器可見性的動畫：

```css
/* 初始隱藏狀態 */
::picker(select) {
  opacity: 0;
  transition: all 0.4s allow-discrete;
}

/* 顯示狀態 */
::picker(select):popover-open {
  opacity: 1;
}

/* 從 display: none 動畫化時所需 */
@starting-style {
  ::picker(select):popover-open {
    opacity: 0;
  }
}
```

**關鍵點：**

- 使用 `allow-discrete` 來啟用離散屬性動畫。
- 同時為 `opacity` 和自動更改的屬性（`display`, `overlay`）設定動畫。
- `@starting-style` 指定顯示轉換的初始狀態。

#### 錨點定位 (Anchor Positioning)

將選取器定位在相對於 select 按鈕的位置：

```css
::picker(select) {
  top: calc(anchor(bottom) + 1px);
  left: anchor(10%);
}
```

**詳情：**

- 隱含錨點參照（無需明確的 anchor-name）。
- `anchor(bottom)` = select 按鈕的底部邊緣。
- `anchor(10%)` = 從按鈕左側邊緣起算，寬度的 10% 處。
- 瀏覽器預設樣式包含針對視窗溢出的 position-try 後備方案。

### 其他 Select 功能

**`<select multiple>`：**

- 目前尚未指定對可自訂 select 的支援。
- 將在未來的更新中處理。

**`<optgroup>`：**

- 預設樣式：加粗，縮排比選項少。
- 必須設定樣式以符合整體設計。
- 現在可以包含 `<legend>` 元件作為子代，以便於目標定位。
- `<legend>` 文字會取代/澄清 `label` 屬性。

### 瀏覽器支援與相容性

檢查以下項目的瀏覽器相容性表：

- `<selectedcontent>`
- `::picker(select)`
- `::checkmark`
- `::picker-icon`
- `:open` 虛擬類別
- `appearance: base-select`

**漸進式增強：** 不支援的瀏覽器會回退到傳統的 select 行為，僅顯示純文字選項。

### 關鍵益處

1. **完全的 CSS 自訂** Select 的外觀。
2. **豐富的選項內容**（影像、多個文字 span）。
3. 透過 Popover API 實現 **平滑動畫**。
4. 透過錨點定位實現 **智慧定位**。
5. **漸進式增強** -- 可在舊版瀏覽器中運作。
6. 基本功能 **無需 JavaScript**。
7. 透過與 ARIA 相容的結構 **預設無障礙**。

---

## 4. UI 虛擬類別 (UI Pseudo-Classes)

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/UI_pseudo-classes>

### 概觀

CSS 中的 UI 虛擬類別讓您能根據表單控制項的不同狀態來設定樣式。本節涵蓋使用 CSS 選擇器為各種狀態下的表單設定樣式。

**先決條件：**

- 對 HTML 和 CSS 有基本了解
- 具備虛擬類別和虛擬元件的知識

**目標：** 了解表單的哪些部分難以設定樣式以及原因，並學習如何使用虛擬類別自訂表單控制項。

### 可用的虛擬類別

#### 常見虛擬類別

- **`:hover`** -- 僅在滑鼠指標停留在元件上方時選取該元件。
- **`:focus`** -- 僅在元件被聚焦（透過鍵盤按 Tab 鍵切換）時選取該元件。
- **`:active`** -- 僅在元件被啟用（點擊或按下 Return/Enter 鍵）時選取該元件。

#### 表單專屬虛擬類別

**必填與選填：**

- **`:required`** -- 目標為具有 `required` HTML 屬性的元件。
- **`:optional`** -- 目標為選填的表單控制項。

**驗證狀態：**

- **`:valid`** -- 目標為具有有效資料的表單控制項。
- **`:invalid`** -- 目標為具有無效資料的表單控制項。
- **`:in-range`** -- 目標為在最小/最大範圍內的數字輸入項。
- **`:out-of-range`** -- 目標為在最小/最大範圍外的數字輸入項。

**啟用/停用與讀取狀態：**

- **`:enabled`** -- 目標為可以被啟用的元件。
- **`:disabled`** -- 目標為無法與之互動的元件。
- **`:read-only`** -- 目標為具有 `readonly` 屬性的元件。
- **`:read-write`** -- 目標為可編輯的表單控制項（預設狀態）。

**核取方塊與選項按鈕狀態：**

- **`:checked`** -- 目標為選取的核取方塊和選項按鈕。
- **`:indeterminate`** -- 目標為既非選取也非取消選取狀態的元件。
- **`:default`** -- 目標為頁面載入時預設選取的元件。

**其他實用虛擬類別：**

- **`:focus-within`** -- 當元件或其子代被聚焦時相符。
- **`:focus-visible`** -- 僅在透過鍵盤（而非觸控/滑鼠）聚焦元件時相符。
- **`:placeholder-shown`** -- 當輸入項/文字區域在空白時顯示預留位置文字時相符。

### 根據必填或選填設定輸入項樣式

#### HTML 結構

```html
<form>
  <fieldset>
    <legend>回饋表單</legend>
    <div>
      <label for="fname">名字： </label>
      <input id="fname" name="fname" type="text" required />
    </div>
    <div>
      <label for="lname">姓氏： </label>
      <input id="lname" name="lname" type="text" required />
    </div>
    <div>
      <label for="email">電子郵件地址（若您希望收到回覆）： </label>
      <input id="email" name="email" type="email" />
    </div>
    <div><button>提交</button></div>
  </fieldset>
</form>
```

#### CSS 樣式

```css
body {
  font-family: sans-serif;
  margin: 20px auto;
  max-width: 70%;
}

fieldset {
  padding: 10px 30px 0;
}

legend {
  color: white;
  background: black;
  padding: 5px 10px;
}

fieldset > div {
  margin-bottom: 20px;
  display: flex;
  flex-flow: row wrap;
}

button,
label,
input {
  display: block;
  font-size: 100%;
  box-sizing: border-box;
  width: 100%;
  padding: 5px;
}

input {
  box-shadow: inset 1px 1px 3px #cccccc;
  border-radius: 5px;
}

input:hover,
input:focus {
  background-color: #eeeeee;
}

button {
  width: 60%;
  margin: 0 auto;
}

/* 必填與選填樣式設定 */
input:required {
  border: 2px solid;
}

input:optional {
  border: 2px dashed;
}
```

**關鍵點：**

- 必填控制項使用實線邊框；選填控制項使用虛線邊框。
- 避免僅使用顏色來區分必填與選填（色盲友善無障礙）。
- 標準網頁慣例：為必填欄位使用星號 (*) 或「必填」字樣。
- `:optional` 很少使用，因為表單控制項預設就是選填的。

### 在虛擬類別中使用產生的內容 (Generated Content)

使用 `::before` 和 `::after` 虛擬元件搭配 `content` 屬性來加入視覺指示，而無需增加 DOM 元件。螢幕閱讀器不會讀取產生的內容。

#### 帶有用於產生內容的 Span 的 HTML

```html
<form>
  <fieldset>
    <legend>回饋表單</legend>

    <p>必填欄位標有「必填」字樣。</p>
    <div>
      <label for="fname">名字： </label>
      <input id="fname" name="fname" type="text" required />
      <span></span>
    </div>
    <div>
      <label for="lname">姓氏： </label>
      <input id="lname" name="lname" type="text" required />
      <span></span>
    </div>
    <div>
      <label for="email">電子郵件地址（若您希望收到回覆）：</label>
      <input id="email" name="email" type="email" />
      <span></span>
    </div>
    <div><button>提交</button></div>
  </fieldset>
</form>
```

#### 用於產生內容的 CSS

```css
fieldset > div {
  margin-bottom: 20px;
  display: flex;
  flex-flow: row wrap;
}

button,
label,
input {
  display: block;
  font-family: inherit;
  font-size: 100%;
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  padding: 5px;
  height: 30px;
}

input {
  box-shadow: inset 1px 1px 3px #cccccc;
  border-radius: 5px;
}

input:hover,
input:focus {
  background-color: #eeeeee;
}

/* 產生的內容樣式設定 */
input + span {
  position: relative;
}

input:required + span::after {
  font-size: 0.7rem;
  position: absolute;
  content: "必填";
  color: white;
  background-color: black;
  padding: 5px 10px;
  top: -26px;
  left: -70px;
}

button {
  width: 60%;
  margin: 0 auto;
}
```

**關鍵技術：**

- 將 `<span>` 設定為 `position: relative`，作為定位上下文。
- 產生的內容可以相對於該上下文進行絕對定位。
- 使用鄰接同層選擇器 (`+`) 來目標化輸入項之後的 span。
- 文字輸入項 (`text`, `password`, `button`) 不會顯示產生的內容。其他類型 (`range`, `color`, `checkbox` 等) 則支援。

### 根據有效性設定控制項樣式

#### :valid 和 :invalid

**關鍵點：**

- 沒有限制驗證的控制項始終符合 `:valid`。
- 具有 `required` 且無值的輸入項同時符合 `:invalid` 和 `:required`。
- 當資料與所需格式不符時，Email/URL 輸入項符合 `:invalid`。
- 超出範圍（最小/最大）值的輸入項同時符合 `:invalid` 和 `:out-of-range`。

#### CSS 樣式

```css
input + span {
  position: relative;
}

input:required + span::after {
  font-size: 0.7rem;
  position: absolute;
  content: "必填";
  color: white;
  background-color: black;
  padding: 5px 10px;
  top: -26px;
  left: -70px;
}

/* 驗證指示器 */
input + span::before {
  position: absolute;
  right: -20px;
  top: 5px;
}

input:invalid {
  border: 2px solid red;
}

input:invalid + span::before {
  content: "\2716";
  color: red;
}

input:valid + span::before {
  content: "\2713";
  color: green;
}
```

#### :in-range 和 :out-of-range

適用於具有 `min` 和 `max` 屬性的數字輸入項：

```html
<div>
  <label for="age">年齡（必須滿 12 歲）： </label>
  <input id="age" name="age" type="number" min="12" max="120" required />
  <span></span>
</div>
```

```css
input + span {
  position: relative;
}

input + span::after {
  font-size: 0.7rem;
  position: absolute;
  padding: 5px 10px;
  top: -26px;
}

input:required + span::after {
  color: white;
  background-color: black;
  content: "必填";
  left: -70px;
}

input:out-of-range + span::after {
  color: white;
  background-color: red;
  width: 155px;
  content: "超出允許的數值範圍";
  left: -182px;
}

input + span::before {
  position: absolute;
  right: -20px;
  top: 5px;
}

input:invalid {
  border: 2px solid red;
}

input:invalid + span::before {
  content: "\2716";
  color: red;
}

input:valid + span::before {
  content: "\2713";
  color: green;
}
```

**重要注意事項：**

- `:out-of-range` 的輸入項也符合 `:invalid`。
- 套用 CSS 階層規則：較後面的規則會覆蓋前面的規則。
- 當您想為範圍違規提供更具體的錯誤訊息時，請使用 `:out-of-range`。
- **數字輸入類型：** `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`。

### 設定啟用與停用輸入項的樣式

#### 使用案例

根據使用者輸入停用不適用的表單欄位（例如，帳單地址欄位與送貨地址相同時）。

#### HTML 結構

```html
<form>
  <fieldset id="shipping">
    <legend>送貨地址</legend>
    <div>
      <label for="name1">姓名： </label>
      <input id="name1" name="name1" type="text" required />
    </div>
    <div>
      <label for="address1">地址： </label>
      <input id="address1" name="address1" type="text" required />
    </div>
    <div>
      <label for="zip-code1">郵遞區號： </label>
      <input id="zip-code1" name="zip-code1" type="text" required />
    </div>
  </fieldset>
  <fieldset id="billing">
    <legend>帳單地址</legend>
    <div>
      <label for="billing-checkbox">與送貨地址相同：</label>
      <input type="checkbox" id="billing-checkbox" checked />
    </div>
    <div>
      <label for="name" class="billing-label">姓名： </label>
      <input id="name" name="name" type="text" disabled required />
    </div>
    <div>
      <label for="address2" class="billing-label">地址：</label>
      <input id="address2" name="address2" type="text" disabled required />
    </div>
    <div>
      <label for="zip-code2" class="billing-label">郵遞區號：</label>
      <input id="zip-code2" name="zip-code2" type="text" disabled required />
    </div>
  </fieldset>

  <div><button>提交</button></div>
</form>
```

#### CSS 樣式

```css
input[type="text"]:disabled {
  background: #eeeeee;
  border: 1px solid #cccccc;
}

label:has(+ :disabled) {
  color: #aaaaaa;
}
```

#### 切換停用狀態的 JavaScript

```javascript
function toggleBilling() {
  const billingItems = document.querySelectorAll('#billing input[type="text"]');
  for (const item of billingItems) {
    item.disabled = !item.disabled;
  }
}

document
  .getElementById("billing-checkbox")
  .addEventListener("change", toggleBilling);
```

**關鍵點：**

- **停用的輸入項：** 無法與之互動，資料不會傳送到伺服器。
- **啟用的輸入項：** 可以被選取、點擊、輸入（預設狀態）。
- 使用 `:disabled` 和 `:enabled` 虛擬類別來目標化這些狀態。
- 使用 `:has()` 虛擬類別設定標籤樣式，使其與停用的輸入項一起變灰。

### 唯讀與讀寫輸入項

#### 與停用 (Disabled) 的區別

- **唯讀輸入項：** 使用者無法編輯，但值「會」被提交到伺服器。
- **讀寫輸入項：** 可以被編輯（預設狀態）。
- 在輸入項元件上使用 `readonly` 屬性。

#### CSS 樣式

```css
input:read-only,
textarea:read-only {
  border: 0;
  box-shadow: none;
  background-color: white;
}

textarea:read-write {
  box-shadow: inset 1px 1px 3px #cccccc;
  border-radius: 5px;
}
```

**關鍵點：**

- 移除唯讀元件的邊框/陰影，以顯示它們是不可編輯的。
- 為讀寫元件增加樣式，使其明顯可編輯。
- `:enabled` 和 `:read-write` 很少使用，因為它們代表預設狀態。

### 選項按鈕與核取方塊狀態

#### :checked

`:checked` 虛擬類別目標為選取的核取方塊和選項按鈕。

```css
input[type="radio"] {
  appearance: none;
}

input[type="radio"] {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: 2px solid gray;
  vertical-align: -2px;
  outline: none;
}

input[type="radio"]::before {
  display: block;
  content: " ";
  width: 10px;
  height: 10px;
  border-radius: 6px;
  background-color: red;
  font-size: 1.2em;
  transform: translate(3px, 3px) scale(0);
  transform-origin: center;
  transition: all 0.3s ease-in;
}

input[type="radio"]:checked::before {
  transform: translate(3px, 3px) scale(1);
  transition: all 0.3s cubic-bezier(0.25, 0.25, 0.56, 2);
}
```

**優點：**

- 使用轉換 (transforms) 而非寬度/高度，可防止佈局跳動。
- `transform-origin` 允許從中心開始動畫。
- `transition` 提供平滑的動畫效果。

#### :default

`:default` 虛擬類別符合預設勾選的核取方塊/選項按鈕（具有 `checked` 屬性），即使稍後取消勾選也一樣。

```css
input ~ span {
  position: relative;
}

input:default ~ span::after {
  font-size: 0.7rem;
  position: absolute;
  content: "預設";
  color: white;
  background-color: black;
  padding: 5px 10px;
  right: -65px;
  top: -3px;
}
```

- 使用後續同層選擇器 (`~`) 而非下一個同層選擇器 (`+`)。
- 因為 `<span>` 不會緊接在 `<input>` 之後，所以需要此選擇器。
- 顯示在頁面載入時預設選取了哪個選項。

#### :indeterminate

`:indeterminate` 虛擬類別符合既非選取也非取消選取狀態的元件。

**處於不定狀態 (Indeterminate) 的元件：**

- 當所有同名選項按鈕都未選取時的 `<input type="radio">`。
- 透過 JavaScript 將 `indeterminate` 屬性設為 `true` 時的 `<input type="checkbox">`。
- 沒有值的 `<progress>` 元件。

```css
input[type="radio"]:indeterminate {
  border: 2px solid red;
  animation: 0.4s linear infinite alternate border-pulse;
}

@keyframes border-pulse {
  from {
    border: 2px solid red;
  }

  to {
    border: 6px solid red;
  }
}
```

**使用案例：** 一個動畫視覺指示器，提醒使用者在繼續之前需要選取一個選項按鈕。

### 其他實用的虛擬類別

#### :focus-within

當元件**或其任何子代**被聚焦時相符。

```css
form:focus-within {
  border: 2px solid blue;
}
```

**使用案例：** 當表單內的任何輸入項獲得焦點時，突顯整個表單。

#### :focus-visible

僅在透過**鍵盤互動**（而非觸控或滑鼠）聚焦元件時相符。

```css
input:focus-visible {
  outline: 3px solid blue;
}
```

**使用案例：** 顯示鍵盤焦點指示器，同時隱藏滑鼠焦點樣式。

#### :placeholder-shown

當 `<input>` 和 `<textarea>` 元件顯示其預留位置文字（空白時）時相符。

```css
input:placeholder-shown {
  color: #999;
}
```

**使用案例：** 在預留位置可見時設定輸入項的不同樣式。

### 總結

本節涵蓋了表單樣式設定的所有主要 UI 虛擬類別，包括：

1. 具有視覺指示器的必填與選罰樣式設定。
2. 用於無障礙標籤的產生內容技術。
3. 驗證狀態（有效、無效、範圍內、超出範圍）。
4. 啟用/停用以及唯讀/讀寫狀態。
5. 選項按鈕與核取方塊狀態（已選取、預設、不定）。
6. 用於進階樣式設定的其他虛擬類別。

這些虛擬類別無需 JavaScript 即可實現複雜的表單樣式，透過語義化 HTML 提升無障礙空間，並透過表單狀態的視覺回饋提供更好的使用者體驗。
