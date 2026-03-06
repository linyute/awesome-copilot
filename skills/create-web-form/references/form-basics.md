# 表單基礎參考

此參考整合了 MDN Web Docs 的關鍵教學內容，涵蓋建立與結構化 HTML 網頁表單的基礎知識。

---

## 您的第一個表單

> **來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Your_first_form

### 什麼是網頁表單？

網頁表單是使用者與網站或應用程式之間互動的主要點之一。它們允許使用者輸入資料以供伺服器處理與儲存，或者立即在用戶端更新介面。

網頁表單由以下部分組成：

- **表單控制項（小工具）：** 文字欄位、下拉式選單、按鈕、核取方塊、選項按鈕
- **額外元件：** 大多數使用 `<input>` 元件建構，加上其他語義化元件
- **表單標籤 (Labels)：** 與控制項配對以確保無障礙空間

表單控制項可以透過**表單驗證**強制執行特定格式，且應為明眼使用者與視障使用者配對文字標籤。

### 設計您的表單

撰寫任何程式碼之前的最佳實作：

- 在編碼前先退一步規劃您的表單
- 建立草圖 (mockup) 以定義您需要的資料
- 保持表單簡單且專注
- 僅要求絕對必要的資料
- 較大型的表單存在讓使用者感到挫折並失去參與度的風險

### `<form>` 元件

`<form>` 元件正式定義了一個表單容器及其行為。

```html
<form action="/my-handling-form-page" method="post">...</form>
```

**屬性：**

| 屬性 | 描述 |
|-----------|-------------|
| `action`  | 提交表單資料時傳送的目的地 URL |
| `method`  | 傳送資料的 HTTP 方法 (`get` 或 `post`) |

這兩個屬性都是選填的，但按標準慣例通常都會設定。

### `<label>`、`<input>` 與 `<textarea>` 元件

```html
<form action="/my-handling-form-page" method="post">
  <p>
    <label for="name">姓名：</label>
    <input type="text" id="name" name="user_name" />
  </p>
  <p>
    <label for="mail">電子郵件：</label>
    <input type="email" id="mail" name="user_email" />
  </p>
  <p>
    <label for="msg">訊息：</label>
    <textarea id="msg" name="user_message"></textarea>
  </p>
</form>
```

#### `<label>` 元件

- `for` 屬性必須與其關聯之表單控制項的 `id` 相符。
- 點擊或輕觸標籤會啟動其關聯的控制項。
- 為螢幕閱讀器提供無障礙名稱。
- 提升滑鼠、觸控板與觸控裝置的可用性。

#### `<input>` 元件

`type` 屬性定義輸入項的外觀與行為。

| 類型    | 描述 |
|---------|-------------|
| `text`  | 基本單行文字欄位（預設）；接受任何文字 |
| `email` | 驗證是否為格式正確電子郵件地址的單行欄位；在行動裝置上顯示適當的鍵盤 |

`<input>` 是一個**空元件 (void element)** -- 它沒有結束標籤。

設定預設值：

```html
<input type="text" value="預設情況下此元件已填入此文字" />
```

#### `<textarea>` 元件

用於較長訊息的多行文字欄位。與 `<input>` 不同，它「不是」空元件，需要結束標籤。

設定預設值：

```html
<textarea>
預設情況下此元件已填入此文字
</textarea>
```

### `<button>` 元件

```html
<p class="button">
  <button type="submit">傳送您的訊息</button>
</p>
```

**`type` 屬性數值：**

| 數值    | 描述 |
|----------|-------------|
| `submit` | 將表單資料傳送至 `<form>` 元件 `action` 屬性中定義的 URL（預設值） |
| `reset`  | 將所有小工具重設為預設值（被視為 UX 反模式 -- 除非必要否則請避免） |
| `button` | 預設無任何作用；對於自訂 JavaScript 功能很有用 |

`<button>` 元件優於 `<input type="submit">`，因為 `<button>` 允許在其內部放置完整的 HTML 內容，從而實現更複雜的設計，而 `<input>` 僅允許純文字。

### 基本表單樣式設定

```css
body {
  text-align: center;
}

form {
  display: inline-block;
  padding: 1em;
  border: 1px solid #cccccc;
  border-radius: 1em;
}

p + p {
  margin-top: 1em;
}

label {
  display: inline-block;
  min-width: 90px;
  text-align: right;
}

input,
textarea {
  font: 1em sans-serif;
  width: 300px;
  box-sizing: border-box;
  border: 1px solid #999999;
}

input:focus,
textarea:focus {
  outline-style: solid;
  outline-color: black;
}

textarea {
  vertical-align: top;
  height: 5em;
}

.button {
  padding-left: 90px;
}

button {
  margin-left: 0.5em;
}
```

### 傳送表單資料至您的網頁伺服器

表單資料以**名稱/值對**的形式傳送。每個應提交資料的表單控制項都必須具備 `name` 屬性。

```html
<form action="/my-handling-form-page" method="post">
  <input type="text" id="name" name="user_name" />
  <input type="email" id="mail" name="user_email" />
  <textarea id="msg" name="user_message"></textarea>
  <button type="submit">傳送您的訊息</button>
</form>
```

此表單透過 HTTP POST 向 `/my-handling-form-page` 傳送三項資料：

- `user_name` -- 使用者的姓名
- `user_email` -- 使用者的電子郵件
- `user_message` -- 使用者的訊息

每種伺服器端語言（PHP、Python、Ruby、Java、C# 等）都有其使用 `name` 屬性處理表單資料的機制。

### 完整範例

```html
<form action="/my-handling-form-page" method="post">
  <div>
    <label for="name">姓名：</label>
    <input type="text" id="name" name="user_name" />
  </div>

  <div>
    <label for="mail">電子郵件：</label>
    <input type="email" id="mail" name="user_email" />
  </div>

  <div>
    <label for="msg">訊息：</label>
    <textarea id="msg" name="user_message"></textarea>
  </div>

  <div class="button">
    <button type="submit">傳送您的訊息</button>
  </div>
</form>
```

### 關鍵重點

1. **無障礙優先：** 務必使用帶有 `for` 屬性的 `<label>` 元件。
2. **語義化 HTML：** 使用適當的 `<input>` 類型（email, text 等）。
3. **保持簡單：** 僅要求必要的資料。
4. **為控制項命名：** 每個輸入項都需要 `name` 屬性以便提交表單。
5. **樣式很重要：** 表單需要 CSS 才能看起來專業。

---

## 如何結構化網頁表單

> **來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/How_to_structure_a_web_form

### `<form>` 元件

`<form>` 元件正式定義了一個表單並決定其行為。

關鍵點：

- 所有表單內容必須巢狀於 `<form>` 內部。
- 輔助技術與瀏覽器外掛程式可以發現 `<form>` 元件並提供特殊功能。
- **嚴禁將表單巢狀於另一個表單中** -- 這樣做會導致不可預測的行為。
- 表單控制項可以存在於 `<form>` 元件之外，但應使用 `form` 屬性進行關聯。

### `<fieldset>` 與 `<legend>` 元件

`<fieldset>` 建立小工具群組，用於樣式設定與語義目的。`<legend>` 透過描述其目的來標記 fieldset，並緊接在 `<fieldset>` 起始標籤之後。

許多輔助技術（如 JAWS 和 NVDA）會將 legend 文字視為 fieldset 內每個控制項標籤的一部分。

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

螢幕閱讀器會宣告：「果汁大小：小」、「果汁大小：中」、「果汁大小：大」。

**使用案例：**

- 對於選項按鈕分組至關重要
- 將複雜、冗長的表單劃分為多個頁面區段
- 當單一頁面出現許多控制項時提升可用性

### `<label>` 元件

`<label>` 元件是為 HTML 表單小工具定義標籤的正式方式。

#### 關聯標籤的兩種方法

**方法 1： 使用 `for` 屬性（建議）**

```html
<label for="name">姓名：</label>
<input type="text" id="name" name="user_name" />
```

螢幕閱讀器會宣告：「姓名，編輯文字」。

**方法 2： 隱含關聯（巢狀）**

```html
<label for="name">
  姓名： <input type="text" id="name" name="user_name" />
</label>
```

**最佳實作：** 即使使用巢狀方式，仍務必設定 `for` 屬性，以確保所有輔助技術都能理解其關係。

#### 標籤是可點擊的

點擊或輕觸標籤會啟動對應的小工具。這對於點擊區域較小的選項按鈕和核取方塊特別有用。

```html
<form>
  <p>
    <input type="checkbox" id="taste_1" name="taste_cherry" value="cherry" />
    <label for="taste_1">我喜歡櫻桃</label>
  </p>
  <p>
    <input type="checkbox" id="taste_2" name="taste_banana" value="banana" />
    <label for="taste_2">我喜歡香蕉</label>
  </p>
</form>
```

#### 處理多重標籤

避免在一個小工具上放置多個獨立標籤。相反地，應將所有標籤資訊包含在一個 `<label>` 元件中：

```html
<div>
  <label for="username">姓名 *：</label>
  <input id="username" type="text" name="username" required />
</div>
```

### 搭配表單使用的常見 HTML 結構

用於組織表單內容的建議結構化元件：

- 帶有 `<li>` 項目的 `<ul>` 或 `<ol>` 清單 -- 最適合多個核取方塊或選項按鈕
- 用於包裝標籤與小工具的 `<p>` 和 `<div>` 元件
- 用於將複雜表單組織成邏輯群組的 `<section>` 元件
- 用於區段劃分的 HTML 標題 (`<h1>`, `<h2>` 等)
- 如果表單有必填欄位，請在表單開始前包含說明標記的語句（例如：「* 為必填」）

### 建立表單結構 -- 付款表單範例

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
        <li>
          <label for="title_3">
            <input type="radio" id="title_3" name="title" value="Q" />
            Queen
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
      <label for="card">
        <span>卡片類型：</span>
      </label>
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
    <p>
      <label for="expiration">到期日 *：</label>
      <input
        type="text"
        id="expiration"
        name="expiration"
        required
        placeholder="MM/YY"
        pattern="^(0[1-9]|1[0-2])\/([0-9]{2})$" />
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

### 重要屬性參考

| 屬性     | 元件        | 用途 |
|---------------|----------------|---------|
| `for`         | `<label>`      | 透過與控制項的 `id` 相符，將標籤與表單控制項關聯 |
| `id`          | 表單控制項   | 用於與標籤關聯的唯一識別碼 |
| `name`        | 表單控制項   | 識別隨表單提交的資料 |
| `required`    | 表單控制項   | 將欄位標記為提交前的必填項 |
| `placeholder` | `<input>`      | 在欄位內顯示範例格式（例如：「MM/YY」） |
| `pattern`     | `<input>`      | 用於用戶端驗證的規則運算式 |
| `form`        | 表單控制項   | 將控制項與 `<form>` 關聯，即使控制項位於表單外部 |
| `type`        | `<input>`, `<button>` | 指定輸入行為（text, email, password, tel 等） |

### 無障礙表單結構的關鍵最佳實作

1. 務必使用 `<form>` 元件包覆所有表單內容。
2. 使用 `<fieldset>` 與 `<legend>` 對相關控制項進行分組，特別是選項按鈕。
3. 務必使用指向控制項 `id` 的 `for` 屬性將標籤與表單控制項關聯。
4. 使用語義化 HTML (`<section>`, 標題) 組織複雜表單。
5. 在表單前的段落中預先說明必填欄位標記。
6. 為多個核取方塊或選項按鈕使用清單 (`<ul>`/`<ol>`)。
7. 透過螢幕閱讀器測試以驗證無障礙空間。
8. 切勿將表單巢狀於其他表單中。
9. 讓標籤可點擊，以增加核取方塊與選項按鈕控制項的點擊區域。
