# 表單資料處理參考

---

## 第一節：傳送與擷取表單資料

**來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data

### 概觀

一旦表單資料在用戶端通過驗證，即可進行提交。本節涵蓋了當使用者提交表單時會發生什麼事、資料會去哪裡，以及如何在伺服器上處理這些資料。

### 用戶端/伺服器架構

網頁使用基本的用戶端/伺服器架構：

- **用戶端**（網頁瀏覽器）向**伺服器**發送 HTTP 請求。
- **伺服器**（Apache, Nginx, IIS, Tomcat）使用相同的通訊協定進行回應。
- HTML 表單是一種使用者友善的方式，用於設定發送資料的 HTTP 請求。

### 在用戶端：定義如何傳送資料

`<form>` 元件控制資料的傳送方式。兩個關鍵屬性是 `action` 和 `method`。

#### `action` 屬性

`action` 屬性定義表單資料傳送的目的地。它必須是一個有效的相對或絕對 URL。

**絕對 URL：**

```html
<form action="https://www.example.com">...</form>
```

**相對 URL（同源）：**

```html
<form action="/somewhere_else">...</form>
```

**同一頁面（無屬性或 action 為空）：**

```html
<form>...</form>
```

**安全注意事項：** 使用 HTTPS (安全 HTTP) 加密資料。如果安全表單提交到非安全的 HTTP URL，瀏覽器會顯示安全警告。

#### `method` 屬性

兩種主要的 HTTP 方法用於傳輸表單資料： **GET** 和 **POST**。

### GET 方法

- 由瀏覽器用於要求伺服器傳回資源。
- 資料作為查詢參數附加到 URL 後面。
- 瀏覽器發送空的主體。

**範例表單：**

```html
<form action="https://www.example.com/greet" method="GET">
  <div>
    <label for="say">您想說什麼問候語？</label>
    <input name="say" id="say" value="嗨" />
  </div>
  <div>
    <label for="to">您想對誰說？</label>
    <input name="to" id="to" value="媽媽" />
  </div>
  <div>
    <button>傳送我的問候</button>
  </div>
</form>
```

**結果 URL：** `https://www.example.com/greet?say=嗨&to=媽媽`

**HTTP 請求：**

```http
GET /?say=嗨&to=媽媽 HTTP/2.0
Host: example.com
```

**何時使用：** 讀取資料、非敏感資訊。

### POST 方法

- 用於發送伺服器應處理的資料。
- 資料包含在 HTTP 請求主體中，而非 URL 中。
- 對於敏感資料（密碼等）較為安全。

**範例表單：**

```html
<form action="https://www.example.com/greet" method="POST">
  <div>
    <label for="say">您想說什麼問候語？</label>
    <input name="say" id="say" value="嗨" />
  </div>
  <div>
    <label for="to">您想對誰說？</label>
    <input name="to" id="to" value="媽媽" />
  </div>
  <div>
    <button>傳送我的問候</button>
  </div>
</form>
```

**HTTP 請求：**

```http
POST / HTTP/2.0
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 13

say=嗨&to=媽媽
```

**何時使用：** 敏感資料、大量資料、修改伺服器狀態。

### 在瀏覽器開發者工具中檢視 HTTP 請求

1. 開啟開發者工具 (F12)。
2. 選取「網路 (Network)」分頁。
3. 選取「全部 (All)」以查看所有請求。
4. 點擊「名稱 (Name)」分頁中的請求。
5. 檢視「請求 (Request)」（Firefox）或「承載內容 (Payload)」（Chrome/Edge）。

### 在伺服器端：擷取資料

伺服器接收資料後，會將其作為解析成鍵/值對的字串。存取方法取決於伺服器平台。

#### 範例：原始 PHP

```php
<?php
  // 存取 POST 資料
  $say = htmlspecialchars($_POST["say"]);
  $to  = htmlspecialchars($_POST["to"]);

  // 存取 GET 資料
  // $say = htmlspecialchars($_GET["say"]);

  echo $say, " ", $to;
?>
```

**輸出：** `嗨 媽媽`

#### 範例： Python 與 Flask

```python
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def form():
    return render_template('form.html')

@app.route('/hello', methods=['GET', 'POST'])
def hello():
    return render_template('greeting.html',
                         say=request.form['say'],
                         to=request.form['to'])

if __name__ == "__main__":
    app.run()
```

#### 其他伺服器端框架

| 語言   | 框架                              |
|------------|-----------------------------------------|
| Python     | Django, Flask, web2py, py4web           |
| Node.js    | Express, Next.js, Nuxt, Remix          |
| PHP        | Laravel, Laminas, Symfony               |
| Ruby       | Ruby On Rails                           |
| Java       | Spring Boot                             |

### 特殊情況：傳送檔案

檔案是二進位資料，需要特殊處理。需要三個步驟：

#### `enctype` 屬性

這指定了 `Content-Type` HTTP 標頭。

- **預設值：** `application/x-www-form-urlencoded`
- **針對檔案：** `multipart/form-data`

**檔案上傳範例：**

```html
<form
  method="post"
  action="https://example.com/upload"
  enctype="multipart/form-data">
  <div>
    <label for="file">選取一個檔案</label>
    <input type="file" id="file" name="myFile" />
  </div>
  <div>
    <button>傳送檔案</button>
  </div>
</form>
```

**需求：**

- 將 `method` 設為 `POST`（檔案內容不能放在 URL 中）。
- 將 `enctype` 設為 `multipart/form-data`。
- 包含一個或多個 `<input type="file">` 控制項。

**注意：** 伺服器可以限制檔案和請求的大小以防止濫用。

### 安全考量

#### 保持警覺：絕不信任您的使用者

必須檢查並清理所有傳入的資料：

1. **轉義危險字元** -- 注意可執行程式碼模式（JavaScript、SQL 指令）。使用伺服器端轉義函式。不同的上下文需要不同的轉義方式。
2. **限制傳入資料** -- 僅接受必要的資料。為請求設定大小上限。
3. **隔離上傳檔案 (Sandbox)** -- 儲存在不同的伺服器。透過不同的子網域或網域提供。切勿直接執行上傳的檔案。

**關鍵規則：** 切勿僅信任用戶端驗證 -- 務必在伺服器上進行驗證。用戶端驗證可以被規避；伺服器無法驗證用戶端實際上發生了什麼。

### 快速參考： GET vs POST

| 面向             | GET                                  | POST                                   |
|--------------------|--------------------------------------|----------------------------------------|
| 資料位置      | 在 URL 中作為查詢參數可見   | 隱藏在請求主體中                 |
| 資料大小          | 受 URL 長度限制                | 無固有限制                      |
| 安全性           | 不適合傳送敏感資料      | 對敏感/大型資料較佳        |
| 快取            | 可以被快取                        | 不會被快取                             |
| 使用案例           | 讀取/擷取資料              | 修改伺服器狀態、傳送檔案  |

### 重要注意事項

- **表單資料格式：** 以連結符號 (`&`) 連接的名稱/值對 (`name=value&name2=value2`)。
- **URL 編碼：** 特殊字元在查詢參數中會進行 URL 編碼。
- **預設表單目標：** 若無 `action`，資料會提交到目前頁面。
- **安全協定：** 對於敏感資料，請務必使用 HTTPS。

---

## 第二節：表單驗證

**來源：** https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation

### 概觀

用戶端表單驗證有助於確保輸入的資料符合表單控制項設定的要求。雖然這對於**使用者體驗**很重要，但**務必**與伺服器端驗證搭配使用，因為惡意使用者很容易規避用戶端驗證。

### 內建 HTML 驗證屬性

#### `required`

指定提交前必須填寫表單欄位。

```html
<input id="choose" name="i-like" required />
```

- 當輸入項為空時，會符合 `:required` 和 `:invalid` 虛擬類別。
- 對於選項按鈕，同名群組中必須選取一個按鈕。

#### `minlength` 和 `maxlength`

限制文字欄位和 textarea 的字元長度。

```html
<input type="text" minlength="6" maxlength="6" />
<textarea maxlength="140"></textarea>
```

#### `min`, `max`, 和 `step`

限制數值及其增量。

```html
<input type="number" min="1" max="10" step="1" />
<input type="date" min="2024-01-01" max="2024-12-31" />
```

#### `type`

根據特定格式（電子郵件、URL、數字、日期等）進行驗證。

```html
<input type="email" />
<input type="url" />
<input type="number" />
```

#### `pattern`

根據規則運算式進行驗證。

```html
<input
  type="text"
  pattern="[Bb]anana|[Cc]herry"
  required
/>
```

**模式 (Pattern) 範例：**

| 模式  | 符合內容                                  |
|----------|------------------------------------------|
| `a`      | 單個字元 'a'                     |
| `abc`    | 'a' 後接 'b' 後接 'c'     |
| `ab?c`   | 'ac' 或 'abc'                            |
| `ab*c`   | 'ac', 'abc', 'abbbbbc', 等等             |
| `a\|b`   | 'a' 或 'b'                               |

### 驗證狀態的 CSS 虛擬類別

#### 有效狀態 (Valid States)

```css
input:valid {
  border: 2px solid black;
}

input:user-valid {
  /* 在使用者互動後相符 */
}

input:in-range {
  /* 用於具有 min/max 的輸入項 */
}
```

#### 無效狀態 (Invalid States)

```css
input:invalid {
  border: 2px dashed red;
}

input:user-invalid {
  /* 在使用者互動後相符 */
}

input:out-of-range {
  /* 用於具有 min/max 的輸入項 */
}

input:required {
  /* 符合必填欄位 */
}
```

### 完整的內建驗證範例

```html
<form>
  <p>請填寫所有必填 (*) 欄位。</p>

  <fieldset>
    <legend>您有駕照嗎？ *</legend>
    <input type="radio" required name="driver" id="r1" value="yes" />
    <label for="r1">是</label>
    <input type="radio" required name="driver" id="r2" value="no" />
    <label for="r2">否</label>
  </fieldset>

  <p>
    <label for="age">您幾歲？</label>
    <input type="number" min="12" max="120" step="1" id="age" name="age" />
  </p>

  <p>
    <label for="fruit">您最愛的水果是什麼？ *</label>
    <input
      type="text"
      id="fruit"
      name="fruit"
      list="fruits"
      required
      pattern="[Bb]anana|[Cc]herry|[Aa]pple"
    />
    <datalist id="fruits">
      <option>Banana</option>
      <option>Cherry</option>
      <option>Apple</option>
    </datalist>
  </p>

  <p>
    <label for="email">電子郵件地址：</label>
    <input type="email" id="email" name="email" />
  </p>

  <button>提交</button>
</form>
```

### 約束驗證 API (Constraint Validation API)

約束驗證 API 提供自訂驗證邏輯的方法和屬性。

#### 關鍵屬性

**`validationMessage`** -- 傳回在地化的驗證錯誤訊息。

**`validity`** -- 傳回具有下列屬性的 `ValidityState` 物件：

| 屬性          | 描述                                         |
|-------------------|-----------------------------------------------------|
| `valid`           | 若元件符合所有約束，則為 `true`             |
| `valueMissing`    | 若為必填但為空，則為 `true`                        |
| `typeMismatch`    | 若數值與型別不符（例如 email），則為 `true`   |
| `patternMismatch` | 若不符合模式，則為 `true`                    |
| `tooLong`         | 若超過 `maxlength`，則為 `true`                       |
| `tooShort`        | 若少於 `minlength`，則為 `true`                         |
| `rangeOverflow`   | 若超過 `max`，則為 `true`                             |
| `rangeUnderflow`  | 若少於 `min`，則為 `true`                               |
| `customError`     | 若透過 `setCustomValidity()` 設定了自訂錯誤，則為 `true` |

**`willValidate`** -- 布林值，若元件在表單提交時將被驗證，則為 `true`。

#### 關鍵方法

```javascript
// 不提交即檢查有效性
element.checkValidity()    // 傳回布林值

// 向使用者回報有效性
element.reportValidity()   // 顯示瀏覽器的錯誤訊息

// 設定自訂錯誤訊息
element.setCustomValidity("自訂錯誤文字")

// 清除自訂錯誤
element.setCustomValidity("")
```

### JavaScript 自訂驗證範例

#### 基本自訂錯誤訊息

```javascript
const email = document.getElementById("mail");

email.addEventListener("input", (event) => {
  if (email.validity.typeMismatch) {
    email.setCustomValidity("我預期的是一個電子郵件地址！");
  } else {
    email.setCustomValidity("");
  }
});
```

#### 擴充內建驗證

```javascript
const email = document.getElementById("mail");

email.addEventListener("input", (event) => {
  // 重設自訂有效性
  email.setCustomValidity("");

  // 先檢查內建約束
  if (!email.validity.valid) {
    return;
  }

  // 加入自訂約束
  if (!email.value.endsWith("@example.com")) {
    email.setCustomValidity("請輸入以 @example.com 結尾的電子郵件");
  }
});
```

#### 具備自訂訊息的複雜表單驗證

```javascript
const form = document.querySelector("form");
const email = document.getElementById("mail");
const emailError = document.querySelector("#mail + span.error");

email.addEventListener("input", (event) => {
  if (email.validity.valid) {
    emailError.textContent = "";
    emailError.className = "error";
  } else {
    showError();
  }
});

form.addEventListener("submit", (event) => {
  if (!email.validity.valid) {
    showError();
    event.preventDefault();
  }
});

function showError() {
  if (email.validity.valueMissing) {
    emailError.textContent = "您需要輸入一個電子郵件地址。";
  } else if (email.validity.typeMismatch) {
    emailError.textContent = "輸入的值必須是電子郵件地址。";
  } else if (email.validity.tooShort) {
    emailError.textContent =
      `電子郵件長度應至少為 ${email.minLength} 個字元；您輸入了 ${email.value.length} 個字元。`;
  }
  emailError.className = "error active";
}
```

#### 使用 `novalidate` 停用內建驗證

在表單上使用 `novalidate` 以停用瀏覽器的自動驗證，同時保留 CSS 虛擬類別：

```html
<form novalidate>
  <input type="email" id="mail" required minlength="8" />
  <span class="error" aria-live="polite"></span>
</form>
```

### 不使用約束 API 的手動驗證

對於自訂表單控制項或需要完全控制驗證的情況：

```javascript
const form = document.querySelector("form");
const email = document.getElementById("mail");
const error = document.getElementById("error");

const emailRegExp = /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z\d-]+(?:\.[a-z\d-]+)*$/i;

const isValidEmail = () => {
  return email.value.length !== 0 && emailRegExp.test(email.value);
};

const setEmailClass = (isValid) => {
  email.className = isValid ? "valid" : "invalid";
};

const updateError = (isValid) => {
  if (isValid) {
    error.textContent = "";
    error.removeAttribute("class");
  } else {
    error.textContent = "請輸入有效的電子郵件地址。";
    error.setAttribute("class", "active");
  }
};

email.addEventListener("input", () => {
  const validity = isValidEmail();
  setEmailClass(validity);
  updateError(validity);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const validity = isValidEmail();
  setEmailClass(validity);
  updateError(validity);
});
```

### 設定錯誤訊息樣式

```css
/* 無效欄位樣式 */
input:invalid {
  border-color: #990000;
  background-color: #ffdddd;
}

input:focus:invalid {
  outline: none;
}

/* 錯誤訊息容器 */
.error {
  width: 100%;
  padding: 0;
  font-size: 80%;
  color: white;
  background-color: #990000;
  border-radius: 0 0 5px 5px;
}

.error.active {
  padding: 0.3em;
}
```

### 無障礙空間最佳實作

1. 在標籤中使用星號**標記必填欄位**：
   ```html
   <label for="name">姓名 *</label>
   ```
2. 對於動態錯誤訊息**使用 `aria-live`**：
   ```html
   <span class="error" aria-live="polite"></span>
   ```
3. **提供清晰、有助益的訊息**，說明預期的內容以及如何修正錯誤。
4. **避免僅依賴顏色**來指示錯誤。

### 驗證總結

| 做法               | 優點                                        | 缺點                                   |
|------------------------|---------------------------------------------|----------------------------------------|
| HTML 內建          | 不需要 JavaScript，速度快                  | 自訂空間有限                  |
| 約束驗證 API | 現代化，與內建功能整合 | 需要 JavaScript                    |
| 完全手動 (JS)      | 完全控制 UI 與邏輯          | 程式碼較多，必須處理所有細節      |

- **HTML 驗證**較快且不需要 JavaScript。
- **JavaScript 驗證**提供更多自訂功能與控制。
- **務必在伺服器端驗證** -- 用戶端驗證不具安全性。
- **使用約束驗證 API** 以獲得現代、內建的功能。
- **提供清晰的錯誤訊息**與引導。
- 使用 `:valid` 和 `:invalid` 虛擬類別**設定驗證狀態樣式**。
