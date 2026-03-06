# HTML 表單範例參考

此參考整合了 W3Schools 的關鍵教學內容，涵蓋 HTML 表單、表單元件、輸入類型以及表單相關屬性。

---

## HTML 表單

> **來源：** https://www.w3schools.com/html/html_forms.asp

### `<form>` 元件

`<form>` 元件用於建立供使用者輸入的 HTML 表單。它充當不同類型輸入元件的容器，例如文字欄位、核取方塊、選項按鈕、提交按鈕等。

```html
<form>
  <!-- 表單元件放在這裡 -->
</form>
```

### `<input>` 元件

`<input>` 元件是使用最廣泛的表單元件。它可以根據 `type` 屬性以多種方式顯示。

| 類型 | 描述 |
|------|-------------|
| `<input type="text">` | 顯示單行文字輸入欄位 |
| `<input type="radio">` | 顯示選項按鈕（用於從多個選項中選取一個） |
| `<input type="checkbox">` | 顯示核取方塊（用於選取零個或多個選項） |
| `<input type="submit">` | 顯示提交按鈕（用於提交表單） |
| `<input type="button">` | 顯示可點擊的按鈕 |

### 文字欄位

`<input type="text">` 定義了一個用於文字輸入的單行輸入欄位。

```html
<form>
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname">
</form>
```

**注意：** 表單本身是不可見的。輸入欄位的預設寬度為 20 個字元。

### `<label>` 元件

`<label>` 元件為許多表單元件定義標籤。它對螢幕閱讀器使用者非常有用，因為當使用者聚焦於輸入元件時，螢幕閱讀器會大聲朗讀標籤。它也有助於難以點擊極小區域（如選項按鈕或核取方塊）的使用者，因為點擊標籤文字可以切換關聯的輸入項。

`<label>` 標籤的 `for` 屬性應等於 `<input>` 元件的 `id` 屬性，以便將它們繫結在一起。

### 選項按鈕 (Radio Buttons)

`<input type="radio">` 定義了一個選項按鈕。選項按鈕讓使用者可以從有限數量的選項中選取「一個」。

```html
<form>
  <p>選擇您偏好的網頁語言：</p>
  <input type="radio" id="html" name="fav_language" value="HTML">
  <label for="html">HTML</label><br>
  <input type="radio" id="css" name="fav_language" value="CSS">
  <label for="css">CSS</label><br>
  <input type="radio" id="javascript" name="fav_language" value="JavaScript">
  <label for="javascript">JavaScript</label>
</form>
```

### 核取方塊 (Checkboxes)

`<input type="checkbox">` 定義了一個核取方塊。核取方塊讓使用者可以從有限數量的選項中選取「零個或多個」。

```html
<form>
  <input type="checkbox" id="vehicle1" name="vehicle1" value="Bike">
  <label for="vehicle1"> 我有一輛腳踏車</label><br>
  <input type="checkbox" id="vehicle2" name="vehicle2" value="Car">
  <label for="vehicle2"> 我有一輛汽車</label><br>
  <input type="checkbox" id="vehicle3" name="vehicle3" value="Boat">
  <label for="vehicle3"> 我有一艘船</label>
</form>
```

### 提交按鈕

`<input type="submit">` 定義了一個按鈕，用於將表單資料提交給表單處理程式 (form-handler)。表單處理程式通常是伺服器上一個帶有處理輸入資料指令碼的檔案，由表單的 `action` 屬性指定。

```html
<form action="/action_page.php">
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname" value="John"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname" value="Doe"><br><br>
  <input type="submit" value="提交">
</form>
```

### `<input>` 的 `name` 屬性

每個輸入欄位必須具備 `name` 屬性才能被提交。如果省略 `name` 屬性，輸入欄位的值將完全不會被傳送。

---

## HTML 表單屬性

> **來源：** https://www.w3schools.com/html/html_forms_attributes.asp

### `action` 屬性

`action` 屬性定義提交表單時要執行的動作。通常，當使用者點擊提交按鈕時，表單資料會傳送到伺服器上的一個檔案。

```html
<form action="/action_page.php">
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname" value="John"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname" value="Doe"><br><br>
  <input type="submit" value="提交">
</form>
```

**提示：** 如果省略 `action` 屬性，則動作會設定為目前頁面。

### `target` 屬性

`target` 屬性指定提交表單後，在哪裡顯示收到的回應。

| 值 | 描述 |
|-------|-------------|
| `_blank` | 回應顯示在新視窗或分頁中 |
| `_self` | 回應顯示在目前視窗中（預設） |
| `_parent` | 回應顯示在父框架中 |
| `_top` | 回應顯示在視窗的完整主體中 |
| `framename` | 回應顯示在具名的 iframe 中 |

```html
<form action="/action_page.php" target="_blank">
```

### `method` 屬性

`method` 屬性指定提交表單資料時要使用的 HTTP 方法。表單資料可以作為 URL 變數（使用 `method="get"`）或作為 HTTP POST 交易（使用 `method="post"`）傳送。

```html
<!-- 使用 GET -->
<form action="/action_page.php" method="get">

<!-- 使用 POST -->
<form action="/action_page.php" method="post">
```

**何時使用 GET：**

- 若未指定，則為預設方法
- 表單資料以名稱/值對的形式附加到 URL 後面
- URL 的長度有限制（約 2048 個字元）
- 絕不要使用 GET 傳送敏感資料（資料會在 URL 中可見）
- 對於使用者想要為結果加入書籤的表單提交非常有用
- GET 適用於非安全資料，例如搜尋引擎中的查詢字串

**何時使用 POST：**

- 將表單資料附加在 HTTP 請求的主體內部（資料不會顯示在 URL 中）
- POST 沒有大小限制
- 使用 POST 提交的表單無法加入書籤
- 提交敏感或個人資訊時，務必使用 POST

### `autocomplete` 屬性

`autocomplete` 屬性指定表單是否應開啟或關閉自動完成功能。開啟自動完成時，瀏覽器會根據使用者先前輸入過的值自動完成數值。

```html
<form action="/action_page.php" autocomplete="on">
```

### `novalidate` 屬性

`novalidate` 屬性是一個布林屬性。當存在時，它指定提交表單時不應對表單資料進行驗證。

```html
<form action="/action_page.php" novalidate>
```

### `enctype` 屬性

`enctype` 屬性指定在將表單資料提交到伺服器時應如何對其進行編碼。此屬性僅能與 `method="post"` 搭配使用。

| 值 | 描述 |
|-------|-------------|
| `application/x-www-form-urlencoded` | 預設。所有字元在傳送前都會進行編碼 |
| `multipart/form-data` | 當表單包含檔案上傳控制項 (`<input type="file">`) 時是必須的 |
| `text/plain` | 傳送資料時不進行任何編碼（不建議使用） |

```html
<form action="/action_page.php" method="post" enctype="multipart/form-data">
```

### `name` 屬性

`name` 屬性指定表單的名稱。它用於在 JavaScript 中參照元件，或在提交後參照表單資料。只有具備 name 屬性的表單在提交時才會傳遞其數值。

### `accept-charset` 屬性

`accept-charset` 屬性指定用於表單提交的字元編碼。預設值為 `"unknown"`，表示與文件相同的編碼。

### 所有 `<form>` 屬性總結

| 屬性 | 描述 |
|-----------|-------------|
| `accept-charset` | 指定表單提交的字元編碼 |
| `action` | 指定提交表單時將表單資料傳送到何處 |
| `autocomplete` | 指定表單是否應開啟或關閉自動完成功能 |
| `enctype` | 指定提交時如何對表單資料進行編碼（適用於 `method="post"`） |
| `method` | 指定傳送表單資料時要使用的 HTTP 方法 |
| `name` | 指定表單的名稱 |
| `novalidate` | 指定提交時不應對表單進行驗證 |
| `rel` | 指定連結資源與目前文件之間的關係 |
| `target` | 指定提交表單後在哪裡顯示回應 |

---

## HTML 表單元件

> **來源：** https://www.w3schools.com/html/html_form_elements.asp

### `<input>` 元件

最重要的表單元件。可以根據 `type` 屬性以多種方式顯示。如果省略 `type`，輸入欄位預設為 `text` 類型。

### `<label>` 元件

為多個表單元件定義標籤。`for` 屬性應等於關聯輸入項的 `id` 以便繫結。使用者也可以點擊標籤來切換輸入控制項的焦點/選取狀態。

### `<select>` 元件

`<select>` 元件定義了一個下拉式清單。

```html
<label for="cars">選擇一輛車：</label>
<select id="cars" name="cars">
  <option value="volvo">Volvo</option>
  <option value="saab">Saab</option>
  <option value="fiat" selected>Fiat</option>
  <option value="audi">Audi</option>
</select>
```

- `<option>` 元件定義了可以選取的選項。
- 預設情況下，下拉式清單中的第一項會被選取。
- `selected` 屬性預先選取一個選項。
- 使用 `size` 屬性指定可見數值的數量。
- 使用 `multiple` 屬性允許使用者選取多個數值。

```html
<!-- 可見數值 -->
<select id="cars" name="cars" size="3">

<!-- 允許選取多個項目 -->
<select id="cars" name="cars" size="4" multiple>
```

### `<textarea>` 元件

`<textarea>` 元件定義了一個多行輸入欄位（文字區域）。

```html
<textarea name="message" rows="10" cols="30">
貓咪正在花園裡玩耍。
</textarea>
```

- `rows` 屬性指定文字區域中可見的行數。
- `cols` 屬性指定文字區域的可見寬度。
- 您也可以使用 CSS 的 `height` 和 `width` 屬性來定義尺寸。

```css
textarea {
  width: 100%;
  height: 200px;
}
```

### `<button>` 元件

`<button>` 元件定義了一個可點擊的按鈕。

```html
<button type="button" onclick="alert('哈囉, 世界！')">點擊我！</button>
```

**注意：** 務必為 `<button>` 元件指定 `type` 屬性。不同瀏覽器可能有不同的預設類型。

### `<fieldset>` 和 `<legend>` 元件

`<fieldset>` 元件用於對表單中的相關資料進行分組。`<legend>` 元件為 `<fieldset>` 元件定義標題。

```html
<form action="/action_page.php">
  <fieldset>
    <legend>個人資料：</legend>
    <label for="fname">名字：</label><br>
    <input type="text" id="fname" name="fname" value="John"><br>
    <label for="lname">姓氏：</label><br>
    <input type="text" id="lname" name="lname" value="Doe"><br><br>
    <input type="submit" value="提交">
  </fieldset>
</form>
```

### `<datalist>` 元件

`<datalist>` 元件為 `<input>` 元件指定預定義選項清單。使用者在輸入資料時會看到預定義選項的下拉式清單。`<input>` 元件的 `list` 屬性必須參照 `<datalist>` 元件的 `id` 屬性。

```html
<form action="/action_page.php">
  <input list="browsers" name="browser">
  <datalist id="browsers">
    <option value="Edge">
    <option value="Firefox">
    <option value="Chrome">
    <option value="Opera">
    <option value="Safari">
  </datalist>
  <input type="submit">
</form>
```

### `<output>` 元件

`<output>` 元件代表計算結果（通常使用 JavaScript 執行）。

```html
<form action="/action_page.php"
  oninput="x.value=parseInt(a.value)+parseInt(b.value)">
  0
  <input type="range" id="a" name="a" value="50">
  100 +
  <input type="number" id="b" name="b" value="50">
  =
  <output name="x" for="a b"></output>
  <br><br>
  <input type="submit">
</form>
```

### `<optgroup>` 元件

`<optgroup>` 元件用於在 `<select>` 元件（下拉式清單）中對相關選項進行分組。

```html
<label for="cars">選擇一輛車：</label>
<select name="cars" id="cars">
  <optgroup label="瑞典車系">
    <option value="volvo">Volvo</option>
    <option value="saab">Saab</option>
  </optgroup>
  <optgroup label="德國車系">
    <option value="mercedes">Mercedes</option>
    <option value="audi">Audi</option>
  </optgroup>
</select>
```

### 表單元件總結

| 元件 | 描述 |
|---------|-------------|
| `<form>` | 定義供使用者輸入的 HTML 表單 |
| `<input>` | 定義一個輸入控制項 |
| `<textarea>` | 定義多行輸入控制項（文字區域） |
| `<label>` | 為 `<input>` 元件定義標籤 |
| `<fieldset>` | 對表單中的相關元件進行分組 |
| `<legend>` | 為 `<fieldset>` 元件定義標題 |
| `<select>` | 定義下拉式清單 |
| `<optgroup>` | 在下拉式清單中定義一組相關選項 |
| `<option>` | 下拉式清單中的一個選項 |
| `<button>` | 定義一個可點擊的按鈕 |
| `<datalist>` | 指定輸入控制項的預定義選項清單 |
| `<output>` | 定義計算結果 |

---

## HTML 表單輸入類型

> **來源：** https://www.w3schools.com/html/html_form_input_types.asp

### 輸入類型： text

`<input type="text">` 定義一個單行文字輸入欄位。

```html
<form>
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname">
</form>
```

### 輸入類型： password

`<input type="password">` 定義一個密碼欄位。字元會被遮蔽（顯示為星號或圓點）。

```html
<form>
  <label for="username">使用者名稱：</label><br>
  <input type="text" id="username" name="username"><br>
  <label for="pwd">密碼：</label><br>
  <input type="password" id="pwd" name="pwd">
</form>
```

### 輸入類型： submit

`<input type="submit">` 定義一個用於將表單資料提交給表單處理程式的按鈕。表單處理程式通常是表單 `action` 屬性指定的伺服器頁面。

```html
<form action="/action_page.php">
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname" value="John"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname" value="Doe"><br><br>
  <input type="submit" value="提交">
</form>
```

如果省略提交按鈕的 `value` 屬性，按鈕將顯示預設文字。

### 輸入類型： reset

`<input type="reset">` 定義一個重設按鈕，會將所有表單數值重設為預設值。

```html
<form action="/action_page.php">
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname" value="John"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname" value="Doe"><br><br>
  <input type="submit" value="提交">
  <input type="reset">
</form>
```

### 輸入類型： radio

`<input type="radio">` 定義一個選項按鈕。選項按鈕讓使用者僅能從有限數量的選項中選取「一個」。

```html
<form>
  <input type="radio" id="html" name="fav_language" value="HTML">
  <label for="html">HTML</label><br>
  <input type="radio" id="css" name="fav_language" value="CSS">
  <label for="css">CSS</label><br>
  <input type="radio" id="javascript" name="fav_language" value="JavaScript">
  <label for="javascript">JavaScript</label>
</form>
```

### 輸入類型： checkbox

`<input type="checkbox">` 定義一個核取方塊。核取方塊讓使用者可以選取「零個或多個」選項。

```html
<form>
  <input type="checkbox" id="vehicle1" name="vehicle1" value="Bike">
  <label for="vehicle1"> 我有一輛腳踏車</label><br>
  <input type="checkbox" id="vehicle2" name="vehicle2" value="Car">
  <label for="vehicle2"> 我有一輛汽車</label><br>
  <input type="checkbox" id="vehicle3" name="vehicle3" value="Boat">
  <label for="vehicle3"> 我有一艘船</label>
</form>
```

### 輸入類型： button

`<input type="button">` 定義一個按鈕。

```html
<input type="button" onclick="alert('哈囉, 世界！')" value="點擊我！">
```

### 輸入類型： color

`<input type="color">` 用於應包含顏色的輸入欄位。根據瀏覽器支援，可能會顯示顏色選取器。

```html
<form>
  <label for="favcolor">選取您喜愛的顏色：</label>
  <input type="color" id="favcolor" name="favcolor" value="#ff0000">
</form>
```

### 輸入類型： date

`<input type="date">` 用於應包含日期的輸入欄位。根據瀏覽器支援，可能會顯示日期選取器。

```html
<form>
  <label for="birthday">生日：</label>
  <input type="date" id="birthday" name="birthday">
</form>
```

您可以使用 `min` 和 `max` 屬性來加入限制：

```html
<input type="date" id="datemin" name="datemin" min="2000-01-02">
<input type="date" id="datemax" name="datemax" max="1979-12-31">
```

### 輸入類型： datetime-local

`<input type="datetime-local">` 指定一個不含時區的日期和時間輸入欄位。

```html
<form>
  <label for="birthdaytime">生日（日期和時間）：</label>
  <input type="datetime-local" id="birthdaytime" name="birthdaytime">
</form>
```

### 輸入類型： email

`<input type="email">` 用於應包含電子郵件地址的輸入欄位。根據瀏覽器支援，電子郵件地址可以被自動驗證。某些智慧型手機會辨識 email 類型並在鍵盤加入 `.com`。

```html
<form>
  <label for="email">輸入您的電子郵件：</label>
  <input type="email" id="email" name="email">
</form>
```

### 輸入類型： file

`<input type="file">` 定義一個檔案選取欄位和一個用於檔案上傳的「瀏覽」按鈕。

```html
<form>
  <label for="myfile">選取一個檔案：</label>
  <input type="file" id="myfile" name="myfile">
</form>
```

### 輸入類型： hidden

`<input type="hidden">` 定義一個隱藏的輸入欄位（使用者不可見）。隱藏欄位讓網頁開發者能在提交表單時包含使用者無法看到或修改的資料。

```html
<form>
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <input type="hidden" id="custId" name="custId" value="3487">
  <input type="submit" value="提交">
</form>
```

### 輸入類型： image

`<input type="image">` 定義一個影像作為提交按鈕。影像路徑在 `src` 屬性中指定。

```html
<form>
  <input type="image" src="img_submit.gif" alt="提交" width="48" height="48">
</form>
```

### 輸入類型： month

`<input type="month">` 允許使用者選取月份和年份。

```html
<form>
  <label for="bdaymonth">生日（月份與年份）：</label>
  <input type="month" id="bdaymonth" name="bdaymonth">
</form>
```

### 輸入類型： number

`<input type="number">` 定義一個數字輸入欄位。您可以設定接受哪些數字的限制。

```html
<form>
  <label for="quantity">數量（介於 1 到 5 之間）：</label>
  <input type="number" id="quantity" name="quantity" min="1" max="5">
</form>
```

**輸入限制：**

| 屬性 | 描述 |
|-----------|-------------|
| `disabled` | 指定應停用輸入欄位 |
| `max` | 指定輸入欄位的最大值 |
| `maxlength` | 指定輸入欄位的最大字元數 |
| `min` | 指定輸入欄位的最小值 |
| `pattern` | 指定用於檢查輸入值的規則運算式 |
| `readonly` | 指定輸入欄位為唯讀（無法變更） |
| `required` | 指定必須填寫輸入欄位（必填） |
| `size` | 指定輸入欄位的寬度（以字元計） |
| `step` | 指定輸入欄位的合法數字間隔 |
| `value` | 指定輸入欄位的預設值 |

### 輸入類型： range

`<input type="range">` 定義一個用於輸入精確值不重要之數字的控制項（如滑桿控制項）。預設範圍為 0 到 100。您可以使用 `min`、`max` 和 `step` 來設定限制。

```html
<form>
  <label for="vol">音量（介於 0 到 50 之間）：</label>
  <input type="range" id="vol" name="vol" min="0" max="50">
</form>
```

### 輸入類型： search

`<input type="search">` 用於搜尋欄位（行為類似於一般文字欄位）。

```html
<form>
  <label for="gsearch">搜尋 Google：</label>
  <input type="search" id="gsearch" name="gsearch">
</form>
```

### 輸入類型： tel

`<input type="tel">` 用於應包含電話號碼的輸入欄位。

```html
<form>
  <label for="phone">輸入您的電話號碼：</label>
  <input type="tel" id="phone" name="phone"
    pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}">
</form>
```

### 輸入類型： time

`<input type="time">` 允許使用者選取時間（無時區）。

```html
<form>
  <label for="appt">選取一個時間：</label>
  <input type="time" id="appt" name="appt">
</form>
```

### 輸入類型： url

`<input type="url">` 用於應包含 URL 地址的輸入欄位。根據瀏覽器支援，url 欄位可以被自動驗證。某些智慧型手機會辨識 url 類型並在鍵盤加入 `.com`。

```html
<form>
  <label for="homepage">加入您的首頁：</label>
  <input type="url" id="homepage" name="homepage">
</form>
```

### 輸入類型： week

`<input type="week">` 允許使用者選取週別和年份。

```html
<form>
  <label for="week">選取一週：</label>
  <input type="week" id="week" name="week">
</form>
```

### 輸入類型總結

| 輸入類型 | 描述 |
|------------|-------------|
| `text` | 預設。單行文字輸入 |
| `password` | 密碼欄位（字元被遮蔽） |
| `submit` | 提交按鈕 |
| `reset` | 重設按鈕 |
| `radio` | 選項按鈕 |
| `checkbox` | 核取方塊 |
| `button` | 可點擊按鈕 |
| `color` | 顏色選取器 |
| `date` | 日期控制項（年、月、日） |
| `datetime-local` | 日期與時間控制項（無時區） |
| `email` | 電子郵件地址欄位 |
| `file` | 檔案選取欄位與「瀏覽」按鈕 |
| `hidden` | 隱藏輸入欄位 |
| `image` | 影像作為提交按鈕 |
| `month` | 月份與年份控制項 |
| `number` | 數字輸入欄位 |
| `range` | 用於在範圍內輸入數字的滑桿控制項 |
| `search` | 用於搜尋的文字欄位 |
| `tel` | 電話號碼輸入欄位 |
| `time` | 時間輸入控制項 |
| `url` | URL 地址輸入欄位 |
| `week` | 週別與年份控制項 |

---

## HTML 輸入屬性

> **來源：** https://www.w3schools.com/html/html_form_attributes.asp

### `value` 屬性

`value` 屬性指定輸入欄位的初始值。

```html
<form>
  <label for="fname">名字：</label><br>
  <input type="text" id="fname" name="fname" value="John"><br>
  <label for="lname">姓氏：</label><br>
  <input type="text" id="lname" name="lname" value="Doe">
</form>
```

### `readonly` 屬性

`readonly` 屬性指定輸入欄位為唯讀。唯讀輸入欄位無法修改，但可以使用 Tab 鍵切換到、突顯並複製。唯讀欄位的值在提交表單時會被傳送。

```html
<input type="text" id="fname" name="fname" value="John" readonly>
```

### `disabled` 屬性

`disabled` 屬性指定輸入欄位應被停用。停用的欄位無法使用且無法點擊。停用欄位的值在提交表單時「不會」被傳送。

```html
<input type="text" id="fname" name="fname" value="John" disabled>
```

### `size` 屬性

`size` 屬性指定輸入欄位的可見寬度（以字元計）。`size` 的預設值為 20。適用於： text, search, tel, url, email, 與 password。

```html
<input type="text" id="fname" name="fname" size="50">
```

### `maxlength` 屬性

`maxlength` 屬性指定輸入欄位中允許的最大字元數。設定 `maxlength` 後，輸入欄位將不接受超過指定數量的字元。

```html
<input type="text" id="fname" name="fname" maxlength="10">
```

### `min` 與 `max` 屬性

`min` 和 `max` 屬性指定輸入欄位的最小值和最大值。適用於： number, range, date, datetime-local, month, time, 與 week。

```html
<input type="date" id="datemin" name="datemin" min="2000-01-02">
<input type="date" id="datemax" name="datemax" max="1979-12-31">
<input type="number" id="quantity" name="quantity" min="1" max="5">
```

### `multiple` 屬性

`multiple` 屬性指定允許使用者在輸入欄位中輸入多個值。適用於 email 與 file。

```html
<input type="file" id="files" name="files" multiple>
```

### `pattern` 屬性

`pattern` 屬性指定提交表單時用於檢查輸入欄位數值的規則運算式。適用於： text, date, search, url, tel, email, 與 password。

```html
<input type="text" id="country_code" name="country_code"
  pattern="[A-Za-z]{3}" title="三位字母的國家代碼">
```

**提示：** 使用全域 `title` 屬性來描述模式以協助使用者。

### `placeholder` 屬性

`placeholder` 屬性指定描述輸入欄位預期值的簡短提示。提示在使用者輸入值之前顯示在輸入欄位中。適用於： text, search, url, tel, email, 與 password。

```html
<input type="tel" id="phone" name="phone"
  placeholder="123-45-678">
```

### `required` 屬性

`required` 屬性指定在提交表單前必須填寫輸入欄位。

```html
<input type="text" id="username" name="username" required>
```

### `step` 屬性

`step` 屬性指定輸入欄位的合法數字間隔。適用於： number, range, date, datetime-local, month, time, 與 week。

```html
<!-- 接受以 3 為間隔的數值 -->
<input type="number" id="points" name="points" step="3">
```

**注意：** 輸入限制並非萬無一失。JavaScript 提供了額外的方法來限制非法輸入。伺服器端驗證始終是必須的。

### `autofocus` 屬性

`autofocus` 屬性指定輸入欄位在頁面載入時應自動獲得焦點。

```html
<input type="text" id="fname" name="fname" autofocus>
```

### `height` 與 `width` 屬性

`height` 和 `width` 屬性指定 `<input type="image">` 元件的高度和寬度。務必指定影像大小以防止載入時頁面閃爍。

```html
<input type="image" src="img_submit.gif" alt="提交" width="48" height="48">
```

### `list` 屬性

`list` 屬性參照包含 `<input>` 元件預定義選項的 `<datalist>` 元件。

```html
<input list="browsers">
<datalist id="browsers">
  <option value="Edge">
  <option value="Firefox">
  <option value="Chrome">
  <option value="Opera">
  <option value="Safari">
</datalist>
```

### `autocomplete` 屬性

`autocomplete` 屬性指定表單或輸入欄位是否應開啟或關閉自動完成。開啟時，瀏覽器會根據先前輸入的值自動完成。

```html
<form action="/action_page.php" autocomplete="on">
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <label for="email">電子郵件：</label>
  <input type="email" id="email" name="email" autocomplete="off"><br><br>
  <input type="submit">
</form>
```

**提示：** `autocomplete` 適用於 `<form>` 元件以及下列 `<input>` 類型： text, search, url, tel, email, password, datepickers, range, 與 color。

### 輸入屬性總結

| 屬性 | 描述 |
|-----------|-------------|
| `value` | 指定輸入元件的預設值 |
| `readonly` | 指定輸入欄位為唯讀 |
| `disabled` | 指定輸入欄位為停用 |
| `size` | 指定輸入欄位的可見寬度 |
| `maxlength` | 指定輸入欄位中允許的最大字元數 |
| `min` | 指定輸入欄位的最小值 |
| `max` | 指定輸入欄位的最大值 |
| `multiple` | 指定使用者可以輸入多個值 |
| `pattern` | 指定用於檢查數值的規則運算式 |
| `placeholder` | 指定描述預期值的簡短提示 |
| `required` | 指定提交前必須填寫輸入欄位 |
| `step` | 指定合法數字間隔 |
| `autofocus` | 指定輸入欄位在載入時應獲得焦點 |
| `height` | 指定 `<input type="image">` 的高度 |
| `width` | 指定 `<input type="image">` 的寬度 |
| `list` | 參照帶有預定義選項的 `<datalist>` 元件 |
| `autocomplete` | 指定自動完成功能為開啟或關閉 |

---

## HTML 輸入項 form* 屬性

> **來源：** https://www.w3schools.com/html/html_form_attributes_form.asp

### `form` 屬性

輸入項 `form` 屬性指定 `<input>` 元件所屬的表單。此屬性的值必須等於其所屬 `<form>` 元件的 `id` 屬性。這允許位於表單外部的輸入欄位仍能與該表單關聯。

```html
<form action="/action_page.php" id="form1">
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <input type="submit" value="提交">
</form>

<!-- 此輸入項位於表單外部，但仍是其中的一部分 -->
<label for="lname">姓氏：</label>
<input type="text" id="lname" name="lname" form="form1">
```

### `formaction` 屬性

輸入項 `formaction` 屬性指定提交表單時處理輸入內容的檔案 URL。此屬性會覆蓋 `<form>` 元件的 `action` 屬性。適用於 submit 與 image 輸入類型。

```html
<form action="/action_page.php">
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <input type="submit" value="提交">
  <input type="submit" formaction="/action_page2.php" value="以管理員身分提交">
</form>
```

### `formenctype` 屬性

輸入項 `formenctype` 屬性指定提交表單資料時應如何編碼（僅適用於 `method="post"` 的表單）。此屬性會覆蓋 `<form>` 元件的 `enctype` 屬性。適用於 submit 與 image 輸入類型。

```html
<form action="/action_page_binary.asp" method="post">
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <input type="submit" value="提交">
  <input type="submit" formenctype="multipart/form-data"
    value="以 Multipart/form-data 格式提交">
</form>
```

### `formmethod` 屬性

輸入項 `formmethod` 屬性定義將表單資料傳送到動作 URL 的 HTTP 方法。此屬性會覆蓋 `<form>` 元件的 `method` 屬性。適用於 submit 與 image 輸入類型。

```html
<form action="/action_page.php" method="get">
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <label for="lname">姓氏：</label>
  <input type="text" id="lname" name="lname"><br><br>
  <input type="submit" value="使用 GET 提交">
  <input type="submit" formmethod="post" value="使用 POST 提交">
</form>
```

### `formtarget` 屬性

輸入項 `formtarget` 屬性指定一個名稱或關鍵字，指示在何處顯示提交表單後的回應。此屬性會覆蓋 `<form>` 元件的 `target` 屬性。適用於 submit 與 image 輸入類型。

```html
<form action="/action_page.php">
  <label for="fname">名字：</label>
  <input type="text" id="fname" name="fname"><br><br>
  <label for="lname">姓氏：</label>
  <input type="text" id="lname" name="lname"><br><br>
  <input type="submit" value="提交">
  <input type="submit" formtarget="_blank" value="在新視窗/分頁中提交">
</form>
```

### `formnovalidate` 屬性

輸入項 `formnovalidate` 屬性指定提交時不應驗證 `<input>` 元件。此屬性會覆蓋 `<form>` 元件的 `novalidate` 屬性。適用於 submit 輸入類型。

```html
<form action="/action_page.php">
  <label for="email">輸入您的電子郵件：</label>
  <input type="email" id="email" name="email"><br><br>
  <input type="submit" value="提交">
  <input type="submit" formnovalidate="formnovalidate"
    value="不經驗證提交">
</form>
```

### `novalidate` 屬性

`novalidate` 屬性是一個 `<form>` 屬性。當存在時，它指定提交時不應驗證所有表單資料。

```html
<form action="/action_page.php" novalidate>
  <label for="email">輸入您的電子郵件：</label>
  <input type="email" id="email" name="email"><br><br>
  <input type="submit" value="提交">
</form>
```

### form* 屬性總結

| 屬性 | 描述 |
|-----------|-------------|
| `form` | 指定輸入元件所屬的表單 |
| `formaction` | 指定表單提交的 URL（覆蓋表單的 `action`） |
| `formenctype` | 指定表單資料的編碼方式（覆蓋表單的 `enctype`） |
| `formmethod` | 指定傳送資料的 HTTP 方法（覆蓋表單的 `method`） |
| `formnovalidate` | 指定不應驗證該輸入項（覆蓋表單的 `novalidate`） |
| `formtarget` | 指定顯示回應的位置（覆蓋表單的 `target`） |
