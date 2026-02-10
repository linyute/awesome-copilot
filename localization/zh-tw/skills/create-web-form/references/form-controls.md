# 表單控制項參考

這是一份整合式的參考指南，涵蓋了 HTML 表單結構、原生表單控制項、HTML5 輸入類型以及其他表單元件。內容取材自 Mozilla 開發者網路 (MDN) 網頁文件。

---

## 目錄

1. [如何結構化網頁表單](#how-to-structure-a-web-form)
2. [基本原生表單控制項](#basic-native-form-controls)
3. [HTML5 輸入類型](#html5-input-types)
4. [其他表單控制項](#other-form-controls)

---

## 如何結構化網頁表單

> **來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/How_to_structure_a_web_form

### `<form>` 元件

`<form>` 元件正式定義了一個表單並決定其行為。它必須包覆所有表單內容。

**重要：** 切勿將一個表單巢狀於另一個表單中 -- 這會導致不可預測的行為。

```html
<form>
  <!-- 表單內容 -->
</form>
```

表單控制項可以使用 `form` 屬性存在於 `<form>` 元件之外，藉此透過 ID 將其與特定表單關聯。

### 群組與語義結構

#### `<fieldset>` 與 `<legend>` 元件

`<fieldset>` 對具有相同目的的小工具進行分組，提升可用性與無障礙空間。`<legend>` 為 fieldset 提供描述性標籤。

**關鍵益處：**
- 螢幕閱讀器（如 JAWS 和 NVDA）會在宣讀 fieldset 內部的每個控制項之前先宣讀 legend。
- 對於選項按鈕 (radio buttons) 和核取方塊 (checkboxes) 的分組至關重要。
- 對於將長表單跨多個頁面進行區段劃分非常有用。

```html
<form>
  <fieldset>
    <legend>果汁大小</legend>
    <p>
      <input type="radio" name="size" id="size_1" value="small" />
      <label for="size_1">小</label>
    </p>
    <p>
      <input type="radio" name="size" id="size_2" value="medium" />
      <label for="size_2">中</label>
    </p>
    <p>
      <input type="radio" name="size" id="size_3" value="large" />
      <label for="size_3">大</label>
    </p>
  </fieldset>
</form>
```

**結果：** 螢幕閱讀器宣告：「果汁大小：小」、「果汁大小：中」、「果汁大小：大」。

### 標籤：無障礙空間的基礎

#### `<label>` 元件

標籤正式地將文字與表單控制項關聯起來。`for` 屬性透過輸入項的 `id` 將標籤連結到該輸入項。

```html
<label for="name">姓名：</label>
<input type="text" id="name" name="user_name" />
```

**隱含關聯：** 將控制項巢狀於標籤內部（儘管明確使用 `for` 屬性仍是最佳實作）：

```html
<label for="name">
  姓名： <input type="text" id="name" name="user_name" />
</label>
```

**無障礙影響：**
- 螢幕閱讀器宣告：「姓名，編輯文字」。
- 若無正確標籤： 「編輯文字，空白」（這對使用者沒有幫助）。

#### 標籤是可點擊的

點擊或輕觸標籤會啟動關聯的控制項 -- 對於點擊區域較小的核取方塊和選項按鈕特別有用。

```html
<form>
  <p>
    <input type="checkbox" id="taste_1" name="taste_cherry" value="cherry" />
    <label for="taste_1">我喜歡櫻桃</label>
  </p>
</form>
```

#### 多重標籤（最佳實作）

避免為單一小工具放置多個標籤。相反地，應將所有文字包含在一個標籤內：

```html
<!-- 不建議 -->
<label for="username">姓名：</label>
<input id="username" type="text" name="username" required />
<label for="username">*</label>

<!-- 較好 -->
<label for="username">
  <span>姓名：</span>
  <input id="username" type="text" name="username" required />
  <span>*</span>
</label>

<!-- 最佳 -->
<label for="username">姓名 *：</label>
<input id="username" type="text" name="username" required />
```

### 搭配表單使用的常見 HTML 結構

使用這些語義化 HTML 元件來結構化表單：

- `<ul>` / `<ol>` 搭配 `<li>`： 建議用於核取方塊或選項按鈕的分組。
- `<p>`： 包裝「標籤-控制項」配對。
- `<div>`： 一般用途的分組。
- `<section>`： 將相關的表單區段群組化。
- `<h1>`, `<h2>`： 將複雜表單組織成多個區段。

### 完整付款表單範例

```html
<form>
  <h1>付款表單</h1>
  <p>請填寫所有必填 (*) 欄位。</p>

  <!-- 聯絡資訊區段 -->
  <section>
    <h2>聯絡資訊</h2>

    <fieldset>
      <legend>稱謂</legend>
      <ul>
        <li>
          <label for="title_1">
            <input type="radio" id="title_1" name="title" value="A" />
            Ace
          </label>
        </li>
        <li>
          <label for="title_2">
            <input type="radio" id="title_2" name="title" value="K" />
            King
          </label>
        </li>
      </ul>
    </fieldset>

    <p>
      <label for="name">姓名 *：</label>
      <input type="text" id="name" name="username" required />
    </p>

    <p>
      <label for="mail">電子郵件 *：</label>
      <input type="email" id="mail" name="user-mail" required />
    </p>

    <p>
      <label for="pwd">密碼 *：</label>
      <input type="password" id="pwd" name="password" required />
    </p>
  </section>

  <!-- 付款資訊區段 -->
  <section>
    <h2>付款資訊</h2>

    <p>
      <label for="card">卡片類型：</label>
      <select id="card" name="user-card">
        <option value="visa">Visa</option>
        <option value="mc">Mastercard</option>
        <option value="amex">American Express</option>
      </select>
    </p>

    <p>
      <label for="number">卡號 *：</label>
      <input type="tel" id="number" name="card-number" required />
    </p>
  </section>

  <!-- 提交區段 -->
  <section>
    <p>
      <button type="submit">驗證付款</button>
    </p>
  </section>
</form>
```

### 表單結構最佳實作

| 實作方式 | 益處 |
|----------|---------|
| 務必使用 `<form>` 包覆 | 可被輔助技術與瀏覽器外掛程式識別 |
| 使用 `<fieldset>` 與 `<legend>` 包裝相關控制項 | 提升可用性與無障礙空間 |
| 務必使用 `for` 屬性關聯標籤 | 螢幕閱讀器會隨控制項宣告標籤內容 |
| 使用語義化 HTML (`<section>`, `<h2>` 等) | 更好的表單結構與無障礙空間 |
| 將選項按鈕/核取方塊以清單形式分組 | 更清晰的視覺與語義組織 |
| 清楚標示必填欄位 | 使用者與輔助技術能知曉哪些欄位是強制性的 |
| 透過螢幕閱讀器測試 | 驗證表單是否真正具備無障礙空間 |

---

## 基本原生表單控制項

> **來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Basic_native_form_controls

### 文字輸入欄位

#### 單行文字欄位

透過 `<input type="text">` 建立，或省略 type 屬性（預設為 text）。

```html
<input type="text" id="comment" name="comment" value="我是一個文字欄位" />
```

**常見文字欄位行為：**
- 可以標記為 `readonly`（顯示數值但不可修改，仍會隨表單提交）或 `disabled`（不隨表單傳送）。
- 支援 `placeholder` 屬性提供簡短描述。
- 可以透過 `size`（實體方塊大小）和 `maxlength`（字元限制）進行限制。
- 受益於 `spellcheck` 屬性。
- 在傳送到伺服器前會自動移除換行符。

#### 密碼欄位

基於安全考量會遮蔽輸入字元（顯示為圓點或星號）。

```html
<input type="password" id="pwd" name="pwd" />
```

**安全筆記：** 這僅在視覺上隱藏文字。務必使用 HTTPS 進行安全表單傳輸，以防止資料攔截。

#### 隱藏內容

隨表單資料傳送的不可見表單控制項（例如時間戳記、追蹤資訊）。

```html
<input type="hidden" id="timestamp" name="timestamp" value="1286705410" />
```

- 使用者不可見。
- 絕不會獲得焦點。
- 使用者無法刻意編輯。
- 螢幕閱讀器不會注意到它。
- 必須具備 `name` 和 `value` 屬性。

### 可勾選項目：核取方塊與選項按鈕

#### 核取方塊 (Checkbox)

允許複選。每個核取方塊可以獨立被勾選或取消勾選。

```html
<fieldset>
  <legend>選擇所有您喜歡吃的蔬菜</legend>
  <ul>
    <li>
      <label for="carrots">胡蘿蔔</label>
      <input
        type="checkbox"
        id="carrots"
        name="vegetable"
        value="carrots"
        checked />
    </li>
    <li>
      <label for="peas">豌豆</label>
      <input type="checkbox" id="peas" name="vegetable" value="peas" />
    </li>
    <li>
      <label for="cabbage">高麗菜</label>
      <input type="checkbox" id="cabbage" name="vegetable" value="cabbage" />
    </li>
  </ul>
</fieldset>
```

**特性：**
- 對相關的核取方塊使用相同的 `name` 屬性。
- 包含 `checked` 屬性以預先選取。
- 僅有被勾選方塊的數值會隨表單傳送。

#### 選項按鈕 (Radio Button)

每個群組僅允許選取一個。透過相同的 `name` 屬性連結在一起。

```html
<fieldset>
  <legend>您最喜愛哪種餐點？</legend>
  <ul>
    <li>
      <label for="soup">湯</label>
      <input type="radio" id="soup" name="meal" value="soup" checked />
    </li>
    <li>
      <label for="curry">咖哩</label>
      <input type="radio" id="curry" name="meal" value="curry" />
    </li>
    <li>
      <label for="pizza">披薩</label>
      <input type="radio" id="pizza" name="meal" value="pizza" />
    </li>
  </ul>
</fieldset>
```

**特性：**
- 同一群組中的按鈕共用 `name` 屬性。
- 勾選其中一個會自動取消勾選其他按鈕。
- 僅有被勾選的數值會隨表單傳送。
- 若不重設表單，無法取消選取所有按鈕。

**無障礙最佳實作：** 將相關項目包裝在描述群組的 `<fieldset>` 與 `<legend>` 中，並將每個 `<label>`/`<input>` 配對放在一起。

### 按鈕

#### 提交按鈕 (Submit Button)

將表單資料傳送到伺服器。

```html
<!-- 使用 <input> -->
<input type="submit" value="提交此表單" />

<!-- 使用 <button> -->
<button type="submit">提交此表單</button>
```

#### 重設按鈕 (Reset Button)

將所有表單小工具重設為預設值。

```html
<!-- 使用 <input> -->
<input type="reset" value="重設此表單" />

<!-- 使用 <button> -->
<button type="reset">重設此表單</button>
```

#### 匿名按鈕 (Anonymous Button)

無自動效果；需要 JavaScript 自訂。

```html
<!-- 使用 <input> -->
<input type="button" value="無 JavaScript 則無作用" />

<!-- 使用 <button> -->
<button type="button">無 JavaScript 則無作用</button>
```

**`<button>` 元件的優點：** 樣式設定容易得多，且支援標籤內的 HTML 內容。

### 影像按鈕

轉譯為影像但行為與提交按鈕相同。會提交點擊處的 X 與 Y 座標。

```html
<input type="image" alt="點擊我！" src="my-img.png" width="80" height="30" />
```

**座標提交：**
- X 座標索引鍵： `[name].x`
- Y 座標索引鍵： `[name].y`

**使用 GET 方法的範例 URL：**
```
https://example.com?pos.x=123&pos.y=456
```

### 檔案選取器

允許使用者選取一個或多個檔案傳送到伺服器。

```html
<!-- 單一檔案 -->
<input type="file" name="file" id="file" accept="image/*" />

<!-- 多個檔案 -->
<input type="file" name="file" id="file" accept="image/*" multiple />
```

**行動裝置擷取** -- 直接存取裝置相機、麥克風或儲存空間：

```html
<input type="file" accept="image/*;capture=camera" />
<input type="file" accept="video/*;capture=camcorder" />
<input type="file" accept="audio/*;capture=microphone" />
```

**屬性：**
- `accept`： 限制檔案類型（例如 `image/*`, `.pdf`）。
- `multiple`： 允許選取多個檔案。

### 所有表單控制項的常見屬性

| 屬性 | 預設值 | 描述 |
|-----------|---------|-------------|
| `autofocus` | false | 頁面載入時元件自動獲得焦點（每個文件僅限一個） |
| `disabled` | false | 使用者無法互動；若適用的話會繼承自包覆的 `<fieldset>` |
| `form` | -- | 透過 ID 將控制項與 `<form>` 元件關聯（允許控制項位於表單外部） |
| `name` | -- | 控制項名稱；隨表單資料提交 |
| `value` | -- | 元件的初始值 |

### 表單資料提交行為

**可勾選項目的特殊情況：**
- 僅在勾選時才傳送數值。
- 未勾選的項目： 完全不傳送任何內容（連名稱都不會傳送）。
- 已勾選但無 value 屬性： 名稱會隨數值 `"on"` 一起傳送。

```html
<input type="checkbox" name="subscribe" value="yes" />
```
- 若勾選： `subscribe=yes`
- 若未勾選： (無)

---

## HTML5 輸入類型

> **來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/HTML5_input_types

HTML5 引入了新的 `<input type>` 數值，用於建立具有內建驗證功能的原生表單控制項，並提升跨裝置的使用者體驗。

### 電子郵件地址欄位 (`type="email"`)

```html
<label for="email">輸入您的電子郵件地址：</label>
<input type="email" id="email" name="email" />
```

**關鍵功能：**
- **驗證**： 瀏覽器在提交前驗證電子郵件格式。
- **多個電子郵件**： 使用 `multiple` 屬性處理以逗號分隔的地址。
- **行動裝置鍵盤**： 在觸控裝置上預設顯示 `@` 符號。
- **無效狀態**： 符合 `:invalid` 虛擬類別並傳回 `typeMismatch` 有效性。

```html
<input type="email" id="email" name="email" multiple />
```

**重要筆記：**
- `a@b` 被視為有效（允許內部網路地址）。
- 使用 `pattern` 屬性進行自訂驗證。

### 搜尋欄位 (`type="search"`)

```html
<label for="search">輸入搜尋詞彙：</label>
<input type="search" id="search" name="search" />
```

**關鍵功能：**
- **視覺樣式**： 在某些瀏覽器中呈現圓角。
- **清除圖示**： 當欄位有值且獲得焦點時，顯示清除按鈕以清空欄位。
- **鍵盤**： Enter 鍵可能顯示「搜尋」或放大鏡圖示。
- **自動完成**： 數值會被儲存並在站點頁面中重複使用。

### 電話號碼欄位 (`type="tel"`)

```html
<label for="tel">輸入電話號碼：</label>
<input type="tel" id="tel" name="tel" />
```

**關鍵功能：**
- **行動裝置鍵盤**： 在觸控裝置上顯示數字鍵盤。
- **不強制格式**： 允許字母和特殊字元（以適應各種國際格式）。
- **模式驗證**： 使用 `pattern` 屬性強制執行特定格式。

### URL 欄位 (`type="url"`)

```html
<label for="url">輸入 URL：</label>
<input type="url" id="url" name="url" />
```

**關鍵功能：**
- **驗證要求**： 必須包含協定（例如 `http:`）並強制執行正確的 URL 格式。
- **行動裝置鍵盤**： 預設顯示冒號、點和正斜槓。
- **筆記**： 格式正確的 URL 並不保證網站確實存在。

### 數字欄位 (`type="number"`)

```html
<label for="number">輸入數字：</label>
<input type="number" id="number" name="number" />
```

**屬性：**

| 屬性 | 用途 | 範例 |
|-----------|---------|---------|
| `min` | 最小值 | `min="1"` |
| `max` | 最大值 | `max="10"` |
| `step` | 增加/減少間隔 | `step="2"` |

**範例：**

1-10 之間的奇數：
```html
<input type="number" name="age" id="age" min="1" max="10" step="2" />
```

小數值 (0-1)：
```html
<input type="number" name="change" id="pennies" min="0" max="1" step="0.01" />
```

**關鍵功能：**
- **微調按鈕 (Spinner)**： 增減數值。
- **行動裝置**： 顯示數字鍵盤。
- **預設步長**： `1`（除非變更，否則僅允許整數）。
- **浮點數**： 使用 `step="any"` 或 `step="0.01"`。

### 滑桿控制項 (`type="range"`)

```html
<label for="price">選擇最高房價：</label>
<input
  type="range"
  name="price"
  id="price"
  min="50000"
  max="500000"
  step="1000"
  value="250000" />
<output class="price-output" for="price"></output>
```

**顯示數值的 JavaScript：**
```javascript
const price = document.querySelector("#price");
const output = document.querySelector(".price-output");

output.textContent = price.value;

price.addEventListener("input", () => {
  output.textContent = price.value;
});
```

**關鍵功能：**
- 精確度低於文字輸入（最適合大約值）。
- 透過滑鼠、觸控或鍵盤箭頭移動滑桿。
- 使用 `<output>` 元件顯示目前值。
- 透過 `min`, `max`, `step` 屬性進行配置。

### 日期與時間選取器

#### 日期 (`type="date"`)

```html
<label for="date">輸入日期：</label>
<input type="date" name="date" id="date" />
```
擷取： 年、月、日（不含時間）。

#### 本地日期時間 (`type="datetime-local"`)

```html
<label for="datetime">輸入日期與時間：</label>
<input type="datetime-local" name="datetime" id="datetime" />
```
擷取： 日期與時間（不含時區）。

#### 月份 (`type="month"`)

```html
<label for="month">輸入月份：</label>
<input type="month" name="month" id="month" />
```
擷取： 月份與年份。

#### 時間 (`type="time"`)

```html
<label for="time">輸入時間：</label>
<input type="time" name="time" id="time" />
```
- **顯示格式**： 12 小時制（在某些瀏覽器中）。
- **傳回格式**： 一律為 24 小時制。

#### 週別 (`type="week"`)

```html
<label for="week">輸入週別：</label>
<input type="week" name="week" id="week" />
```
- 週別： 週一至週日。
- 第 1 週： 包含該年度的第一個週四。

#### 日期/時間限制

```html
<label for="myDate">這個夏天您何時有空？</label>
<input
  type="date"
  name="myDate"
  min="2025-06-01"
  max="2025-08-31"
  step="7"
  id="myDate" />
```

#### 驗證範例 (CSS)

```css
input:invalid + span::after {
  content: " X";
}

input:valid + span::after {
  content: " 核取記號";
}
```

### 顏色選取器 (`type="color"`)

```html
<label for="color">選取顏色：</label>
<input type="color" name="color" id="color" />
```

**關鍵功能：**
- 開啟作業系統預設的顏色選取功能。
- 傳回值： 一律為小寫的 6 位十六進位值（例如 `#ff0000`）。
- 無需手動輸入格式： 系統顏色選取器會處理選取過程。

### 用戶端驗證筆記

**優點：**
- 即時的使用者回饋。
- 引導精確地完成表單。
- 節省往返伺服器的次數。

**重要限制：**
- 非安全措施 -- 使用者可以輕易停用。
- 伺服器端驗證始終是必須的。
- 僅能防止明顯的錯誤，無法防範惡意資料。

### HTML5 輸入類型總結

| 類型 | 用途 | 關鍵屬性 | 行動裝置鍵盤 |
|------|---------|---------------|-----------------|
| `email` | 電子郵件地址 | `multiple` | @ 符號 |
| `search` | 搜尋查詢 | `pattern` | 標準 |
| `tel` | 電話號碼 | `pattern` | 數字 |
| `url` | 網頁 URL | 必要的通訊協定 | `:/.` 符號 |
| `number` | 數值 | `min`, `max`, `step` | 數字 |
| `range` | 滑桿選取 | `min`, `max`, `step` | 無 |
| `date` | 日期選取器 | `min`, `max` | 日曆 |
| `time` | 時間選取器 | `min`, `max` | 時鐘 |
| `color` | 顏色選取器 | 預設十六進位值 | 顏色選取器 |

---

## 其他表單控制項

> **來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Other_form_controls

### 多行文字欄位 (`<textarea>`)

```html
<textarea cols="30" rows="8"></textarea>
```

**關鍵特性：**
- 允許使用者輸入多行文字。
- 支援硬換行（按 Enter 鍵）。
- 內容放置在起始標籤與結束標籤之間。
- 需要結束標籤（與 `<input>` 不同）。

**控制多行轉譯：**

| 屬性 | 描述 |
|-----------|-------------|
| `cols` | 依平均字元寬度計的可見寬度（預設值： 20） |
| `rows` | 可見文字行數（預設值： 2） |
| `wrap` | 換行行為： `soft`（預設）、`hard` 或 `off` |

**範例（包含換行）：**
```html
<textarea cols="30" rows="8" wrap="hard"></textarea>
```

**控制大小調整 (CSS)：**
```css
textarea {
  resize: both;        /* 水平與垂直 */
  resize: horizontal;  /* 僅水平 */
  resize: vertical;    /* 僅垂直 */
  resize: none;        /* 不可調整 */
}
```

### 下拉式控制項

#### 選取方塊（單選）

```html
<select id="simple" name="simple">
  <option>香蕉</option>
  <option selected>櫻桃</option>
  <option>檸檬</option>
</select>
```

**使用分組 (`<optgroup>`)：**
```html
<select id="groups" name="groups">
  <optgroup label="水果">
    <option>香蕉</option>
    <option selected>櫻桃</option>
    <option>檸檬</option>
  </optgroup>
  <optgroup label="蔬菜">
    <option>胡蘿蔔</option>
    <option>茄子</option>
    <option>馬鈴薯</option>
  </optgroup>
</select>
```

**使用數值屬性：**
```html
<select id="simple" name="simple">
  <option value="banana">大又漂亮的黃香蕉</option>
  <option value="cherry">甜美多汁的櫻桃</option>
  <option value="lemon">酸勁十足的檸檬</option>
</select>
```

**屬性：**
- `selected` -- 設定預設選取的選項。
- `value` -- 提交表單時傳送的數值（若省略，則使用選項文字）。
- `size` -- 可見選項的數量。

#### 多選式選取方塊

```html
<select id="multi" name="multi" multiple size="2">
  <optgroup label="水果">
    <option>香蕉</option>
    <option selected>櫻桃</option>
    <option>檸檬</option>
  </optgroup>
  <optgroup label="蔬菜">
    <option>胡蘿蔔</option>
    <option>茄子</option>
    <option>馬鈴薯</option>
  </optgroup>
</select>
```

**筆記：**
- 加入 `multiple` 屬性以允許複選。
- 使用者在桌機上透過 Cmd/Ctrl + 點擊進行選取。
- 所有數值以清單形式顯示（而非下拉選單）。

#### 自動完成方塊 (`<datalist>`)

```html
<label for="myFruit">您最愛的水果是什麼？</label>
<input type="text" name="myFruit" id="myFruit" list="mySuggestion" />
<datalist id="mySuggestion">
  <option>蘋果</option>
  <option>香蕉</option>
  <option>黑莓</option>
  <option>藍莓</option>
  <option>檸檬</option>
  <option>荔枝</option>
  <option>桃子</option>
  <option>梨子</option>
</datalist>
```

**運作方式：**
- `<datalist>` 提供建議值。
- 透過 `list` 屬性繫結至輸入項（必須與 datalist 的 `id` 相符）。
- 瀏覽器在使用者打字時顯示相符的數值。
- 適用於各種輸入類型（text, email, range, color 等）。

### 進度條 (`<progress>`)

```html
<progress max="100" value="75">75/100</progress>
```

**屬性：**
- `max` -- 最大值（若未指定，預設為 1.0）。
- `value` -- 目前進度值。
- 標籤內的內容是針對不支援瀏覽器的後備方案。

**使用案例：** 下載進度、問卷完成度、任務進度。

### 計量器 (`<meter>`)

```html
<meter min="0" max="100" value="75" low="33" high="66" optimum="0">75</meter>
```

**屬性：**
- `min` / `max` -- 範圍邊界。
- `low` / `high` -- 定義三個範圍（低、中、高）。
- `value` -- 目前計量值。
- `optimum` -- 偏好值（決定顏色代碼）。

**顏色代碼：**
- 綠色： 數值位於偏好範圍。
- 黃色： 數值位於平均範圍。
- 紅色： 數值位於最差範圍。

**最佳值 (Optimum) 邏輯：**
- 若 `optimum` 在低範圍： 愈低愈好。
- 若 `optimum` 在中範圍： 置中較好。
- 若 `optimum` 在高範圍： 愈高愈好。

**使用案例：** 磁碟空間使用量、溫度計、評分。

### 其他表單控制項總結

| 元件 | 用途 | 輸入類型 |
|---------|---------|------------|
| `<textarea>` | 多行文字輸入 | 文字內容 |
| `<select>` | 單選或複選 | 預定義選項 |
| `<datalist>` | 建議的自動完成值 | 具有建議功能的文字輸入 |
| `<progress>` | 進度指示 | 唯讀顯示 |
| `<meter>` | 測量顯示 | 唯讀顯示 |
