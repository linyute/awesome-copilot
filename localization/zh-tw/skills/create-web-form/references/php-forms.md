# PHP 表單參考

此參考整合了 W3Schools 的關鍵教學內容，涵蓋 PHP 表單處理、驗證、必填欄位、URL/電子郵件驗證以及一個完整的實際範例。

---

## PHP 表單處理

> **來源：** <https://www.w3schools.com/php/php_forms.asp>

### PHP 表單如何運作

PHP 超全域變數 `$_GET` 和 `$_POST` 用於收集表單資料。當使用者填寫表單並點擊提交時，表單資料會被傳送到 `<form>` 標籤中 `action` 屬性所指定的 PHP 檔案。

### 一個簡單的 HTML 表單

```html
<html>
<body>

<form action="welcome.php" method="post">
  姓名： <input type="text" name="name"><br>
  電子郵件： <input type="text" name="email"><br>
  <input type="submit">
</form>

</body>
</html>
```

當使用者填寫表單並點擊提交時，表單資料會透過 HTTP POST 傳送到 `welcome.php`。處理檔案隨後可以存取這些資料：

```php
<html>
<body>

歡迎 <?php echo $_POST["name"]; ?><br>
您的電子郵件地址是： <?php echo $_POST["email"]; ?>

</body>
</html>
```

### 使用 GET 方法

```html
<form action="welcome_get.php" method="get">
  姓名： <input type="text" name="name"><br>
  電子郵件： <input type="text" name="email"><br>
  <input type="submit">
</form>
```

```php
<html>
<body>

歡迎 <?php echo $_GET["name"]; ?><br>
您的電子郵件地址是： <?php echo $_GET["email"]; ?>

</body>
</html>
```

### GET vs. POST

| 功能 | GET | POST |
|---------|-----|------|
| 可見性 | 資料在 URL 中可見（作為查詢字串參數） | 資料「不會」顯示在 URL 中 |
| 書籤 | 頁面可以隨查詢字串值一起加入書籤 | 頁面無法隨提交的資料一起加入書籤 |
| 資料長度 | 有限制（最大 URL 長度約為 2048 個字元） | 對資料大小無限制 |
| 安全性 | 「絕不」應在傳送敏感資料（密碼等）時使用 | 對於敏感資料比 GET 更安全 |
| 快取 | 請求可以被快取 | 請求不會被快取 |
| 瀏覽器記錄 | 參數會保留在瀏覽器記錄中 | 參數不會儲存在瀏覽器記錄中 |
| 使用案例 | 非敏感資料、搜尋查詢、過濾參數 | 敏感資料、會變更資料的表單提交 |

**重要：** `$_GET` 和 `$_POST` 都是超全域陣列。無論範圍為何，它們始終可以存取，而且您可以從任何函式、類別或檔案中存取它們，而無需執行任何特殊操作。

---

## PHP 表單驗證

> **來源：** <https://www.w3schools.com/php/php_form_validation.asp>

### 處理 PHP 表單時應考量安全性

這些頁面說明如何以安全性為重來處理 PHP 表單。正確驗證表單資料對於保護您的表單免受駭客和垃圾郵件散佈者的侵害非常重要。

### HTML 表單

本教學中使用的表單：

- **欄位：** 名字、電子郵件、網站、評論、性別
- **驗證規則：**

| 欄位   | 驗證規則 |
|---------|-----------------|
| 名字    | 必填。僅能包含字母和空白字元 |
| 電子郵件  | 必填。必須包含有效的電子郵件地址（含 `@` 和 `.`） |
| 網站 | 選填。若存在，則必須包含有效的 URL |
| 評論 | 選填。多行輸入欄位 (textarea) |
| 性別  | 必填。必須選取一個 |

### Form 元件

```html
<form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
```

`$_SERVER["PHP_SELF"]` 變數會傳回目前執行指令碼的檔案名稱。因此，表單資料會傳送到頁面本身，而非不同的頁面。

### 什麼是 `$_SERVER["PHP_SELF"]`？

`$_SERVER["PHP_SELF"]` 是一個超全域變數，會傳回目前執行指令碼相對於文件根目錄的檔案名稱。

### 關於 PHP 表單安全性的重要筆記

`$_SERVER["PHP_SELF"]` 變數可能會被駭客透過 **跨站指令碼 (XSS)** 攻擊來利用。

**XSS** 讓攻擊者能夠將用戶端指令碼插入其他使用者觀看的網頁中。例如，如果表單位於名為 `test_form.php` 的頁面上，使用者可以輸入下列 URL：

```
http://www.example.com/test_form.php/%22%3E%3Cscript%3Ealert('hacked')%3C/script%3E
```

這會轉換為：

```html
<form method="post" action="test_form.php/"><script>alert('hacked')</script>
```

`<script>` 標籤被加入，且 `alert` 指令被執行。這只是一個簡單的範例。任何 JavaScript 程式碼都可以加入到 `<script>` 標籤中，駭客可以將使用者重新導向到另一個伺服器上的檔案，該檔案持有可以更改全域變數或將表單提交到另一個地址的惡意程式碼。

### 如何避免 `$_SERVER["PHP_SELF"]` 漏洞

使用 `htmlspecialchars()`：

```php
<form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
```

`htmlspecialchars()` 函式將特殊字元轉換為 HTML 實體。現在，如果使用者嘗試利用 `PHP_SELF`，輸出將安全地轉譯為：

```html
<form method="post" action="test_form.php/&quot;&gt;&lt;script&gt;alert('hacked')&lt;/script&gt;">
```

漏洞利用嘗試會失敗，因為程式碼被轉義並被視為純文字。

### 使用 PHP 驗證表單資料

1. 使用 `trim()` 去除使用者輸入中不必要的字元（多餘的空白、製表符、換行符）。
2. 使用 `stripslashes()` 移除使用者輸入中的反斜槓。
3. 使用 `htmlspecialchars()` 將特殊字元轉換為 HTML 實體。

### `test_input()` 函式

建立一個可重複使用的函式來執行所有檢查：

```php
<?php
function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>
```

### 處理表單

```php
<?php
// 定義變數並設定為空值
$name = $email = $gender = $comment = $website = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = test_input($_POST["name"]);
    $email = test_input($_POST["email"]);
    $website = test_input($_POST["website"]);
    $comment = test_input($_POST["comment"]);
    $gender = test_input($_POST["gender"]);
}
?>
```

**重要：** 在指令碼開頭，我們使用 `$_SERVER["REQUEST_METHOD"]` 檢查表單是否已提交。如果 `REQUEST_METHOD` 是 `POST`，則表單已提交且應進行驗證。

---

## PHP 表單必填欄位

> **來源：** <https://www.w3schools.com/php/php_form_required.asp>

### 將欄位設為必填

在上一節中，所有輸入欄位都是選填的。在本節中，我們加入驗證以將特定欄位設為必填，並在需要時建立錯誤訊息。

### 加入錯誤變數

為每個必填欄位定義錯誤變數，並將其初始化為空值：

```php
<?php
// 定義變數並設定為空值
$nameErr = $emailErr = $genderErr = $websiteErr = "";
$name = $email = $gender = $comment = $website = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (empty($_POST["name"])) {
        $nameErr = "姓名是必填的";
    } else {
        $name = test_input($_POST["name"]);
    }

    if (empty($_POST["email"])) {
        $emailErr = "電子郵件是必填的";
    } else {
        $email = test_input($_POST["email"]);
    }

    if (empty($_POST["website"])) {
        $website = "";
    } else {
        $website = test_input($_POST["website"]);
    }

    if (empty($_POST["comment"])) {
        $comment = "";
    } else {
        $comment = test_input($_POST["comment"]);
    }

    if (empty($_POST["gender"])) {
        $genderErr = "性別是必填的";
    } else {
        $gender = test_input($_POST["gender"]);
    }
}
?>
```

### `empty()` 函式

`empty()` 函式檢查變數是否為空、null 或具有虛假值 (falsy value)。對於空字串、`null`、`0`、`"0"`、`false` 以及未定義的變數，它會傳回 `true`。

### 顯示錯誤訊息

在 HTML 表單中，在對應欄位旁顯示錯誤訊息：

```html
<form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">

  姓名： <input type="text" name="name">
  <span class="error">* <?php echo $nameErr; ?></span>
  <br><br>

  電子郵件： <input type="text" name="email">
  <span class="error">* <?php echo $emailErr; ?></span>
  <br><br>

  網站： <input type="text" name="website">
  <span class="error"><?php echo $websiteErr; ?></span>
  <br><br>

  評論： <textarea name="comment" rows="5" cols="40"></textarea>
  <br><br>

  性別：
  <input type="radio" name="gender" value="female">女性
  <input type="radio" name="gender" value="male">男性
  <input type="radio" name="gender" value="other">其他
  <span class="error">* <?php echo $genderErr; ?></span>
  <br><br>

  <input type="submit" name="submit" value="提交">

</form>
```

### 設定錯誤訊息樣式

使用 CSS 讓錯誤訊息更醒目：

```css
.error {
    color: #FF0000;
}
```

### 必填欄位指示器

通常會在必填欄位旁放置星號 `*` 以表示必須填寫。星號可以直在 HTML 中加入，或透過 PHP 動態加入。

---

## PHP 表單 URL 與電子郵件驗證

> **來源：** <https://www.w3schools.com/php/php_form_url_email.asp>

### 驗證姓名

使用 `preg_match()` 檢查姓名欄位是否僅包含字母、連字號、撇號和空白字元：

```php
$name = test_input($_POST["name"]);
if (!preg_match("/^[a-zA-Z-' ]*$/", $name)) {
    $nameErr = "僅允許字母和空白字元";
}
```

`preg_match()` 函式在字串中搜尋模式，若找到模式則傳回 `1`，否則傳回 `0`。

### 驗證電子郵件地址

使用 `filter_var()` 檢查電子郵件地址是否格式正確：

```php
$email = test_input($_POST["email"]);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $emailErr = "無效的電子郵件格式";
}
```

`filter_var()` 函式使用指定的過濾器過濾變數。`FILTER_VALIDATE_EMAIL` 用於驗證該值是否為有效的電子郵件地址。

### 驗證 URL

使用 `preg_match()` 檢查 URL 是否有效：

```php
$website = test_input($_POST["website"]);
if (!preg_match("/\b(?:https?|ftp):\/\/|www\.[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i", $website)) {
    $websiteErr = "無效的 URL";
}
```

或者，`filter_var()` 也可以驗證 URL：

```php
if (!filter_var($website, FILTER_VALIDATE_URL)) {
    $websiteErr = "無效的 URL";
}
```

### 組合驗證邏輯

將所有驗證檢查整合到表單處理區塊中：

```php
<?php
$nameErr = $emailErr = $genderErr = $websiteErr = "";
$name = $email = $gender = $comment = $website = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (empty($_POST["name"])) {
        $nameErr = "姓名是必填的";
    } else {
        $name = test_input($_POST["name"]);
        if (!preg_match("/^[a-zA-Z-' ]*$/", $name)) {
            $nameErr = "僅允許字母和空白字元";
        }
    }

    if (empty($_POST["email"])) {
        $emailErr = "電子郵件是必填的";
    } else {
        $email = test_input($_POST["email"]);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emailErr = "無效的電子郵件格式";
        }
    }

    if (empty($_POST["website"])) {
        $website = "";
    } else {
        $website = test_input($_POST["website"]);
        if (!preg_match("/\b(?:https?|ftp):\/\/|www\.[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i", $website)) {
            $websiteErr = "無效的 URL";
        }
    }

    if (empty($_POST["comment"])) {
        $comment = "";
    } else {
        $comment = test_input($_POST["comment"]);
    }

    if (empty($_POST["gender"])) {
        $genderErr = "性別是必填的";
    } else {
        $gender = test_input($_POST["gender"]);
    }
}
?>
```

### PHP 驗證函式參考

| 函式 | 用途 |
|----------|---------|
| `preg_match(pattern, string)` | 測試字串是否符合規則運算式模式。若相符則傳回 `1`，否則傳回 `0`。 |
| `filter_var(value, filter)` | 使用指定的過濾器常數過濾變數。成功時傳回過濾後的資料，失敗時傳回 `false`。 |
| `FILTER_VALIDATE_EMAIL` | 驗證電子郵件地址格式的過濾器常數。 |
| `FILTER_VALIDATE_URL` | 驗證 URL 格式的過濾器常數。 |

---

## PHP 完整表單範例

> **來源：** <https://www.w3schools.com/php/php_form_complete.asp>

### 在提交後保留表單數值

若要在使用者點擊提交按鈕後顯示輸入欄位中的數值，請在每個 `input` 元件的 `value` 屬性內部以及 `textarea` 元件內部加入一段小型的 PHP 指令碼。這樣一來，即使發生驗證錯誤，表單仍會保留使用者輸入的資料。

使用 `<?php echo $variable; ?>` 輸出數值：

```html
姓名： <input type="text" name="name" value="<?php echo $name; ?>">

電子郵件： <input type="text" name="email" value="<?php echo $email; ?>">

網站： <input type="text" name="website" value="<?php echo $website; ?>">

評論： <textarea name="comment" rows="5" cols="40"><?php echo $comment; ?></textarea>
```

### 保留選項按鈕的選取狀態

對於選項按鈕，使用條件判斷式檢查該值是否先前已被選取：

```html
性別：
<input type="radio" name="gender"
  <?php if (isset($gender) && $gender == "female") echo "checked"; ?>
  value="female">女性

<input type="radio" name="gender"
  <?php if (isset($gender) && $gender == "male") echo "checked"; ?>
  value="male">男性

<input type="radio" name="gender"
  <?php if (isset($gender) && $gender == "other") echo "checked"; ?>
  value="other">其他
```

### 完整的 PHP 表單指令碼

```php
<?php
// 定義變數並設定為空值
$nameErr = $emailErr = $genderErr = $websiteErr = "";
$name = $email = $gender = $comment = $website = "";

function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (empty($_POST["name"])) {
        $nameErr = "姓名是必填的";
    } else {
        $name = test_input($_POST["name"]);
        // 檢查姓名是否僅包含字母和空白字元
        if (!preg_match("/^[a-zA-Z-' ]*$/", $name)) {
            $nameErr = "僅允許字母和空白字元";
        }
    }

    if (empty($_POST["email"])) {
        $emailErr = "電子郵件是必填的";
    } else {
        $email = test_input($_POST["email"]);
        // 檢查電子郵件地址是否格式正確
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emailErr = "無效的電子郵件格式";
        }
    }

    if (empty($_POST["website"])) {
        $website = "";
    } else {
        $website = test_input($_POST["website"]);
        // 檢查 URL 地址語法是否有效
        if (!preg_match("/\b(?:https?|ftp):\/\/|www\.[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i", $website)) {
            $websiteErr = "無效的 URL";
        }
    }

    if (empty($_POST["comment"])) {
        $comment = "";
    } else {
        $comment = test_input($_POST["comment"]);
    }

    if (empty($_POST["gender"])) {
        $genderErr = "性別是必填的";
    } else {
        $gender = test_input($_POST["gender"]);
    }
}
?>
```

### 完整的 HTML 表單

```html
<!DOCTYPE HTML>
<html>
<head>
<style>
.error {color: #FF0000;}
</style>
</head>
<body>

<h2>PHP 表單驗證範例</h2>
<p><span class="error">* 必填欄位</span></p>

<form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">

  姓名： <input type="text" name="name" value="<?php echo $name; ?>">
  <span class="error">* <?php echo $nameErr; ?></span>
  <br><br>

  電子郵件： <input type="text" name="email" value="<?php echo $email; ?>">
  <span class="error">* <?php echo $emailErr; ?></span>
  <br><br>

  網站： <input type="text" name="website" value="<?php echo $website; ?>">
  <span class="error"><?php echo $websiteErr; ?></span>
  <br><br>

  評論： <textarea name="comment" rows="5" cols="40"><?php echo $comment; ?></textarea>
  <br><br>

  性別：
  <input type="radio" name="gender"
    <?php if (isset($gender) && $gender == "female") echo "checked"; ?>
    value="female">女性
  <input type="radio" name="gender"
    <?php if (isset($gender) && $gender == "male") echo "checked"; ?>
    value="male">男性
  <input type="radio" name="gender"
    <?php if (isset($gender) && $gender == "other") echo "checked"; ?>
    value="other">其他
  <span class="error">* <?php echo $genderErr; ?></span>
  <br><br>

  <input type="submit" name="submit" value="提交">

</form>

<?php
echo "<h2>您的輸入：</h2>";
echo $name;
echo "<br>";
echo $email;
echo "<br>";
echo $website;
echo "<br>";
echo $comment;
echo "<br>";
echo $gender;
?>

</body>
</html>
```

### 關鍵函式總結

| 函式 | 用途 |
|----------|---------|
| `htmlspecialchars()` | 將特殊字元 (`<`, `>`, `&`, `"`, `'`) 轉換為 HTML 實體以防範 XSS |
| `trim()` | 去除字串開頭和結尾的空白字元（或其他字元） |
| `stripslashes()` | 移除字串中的反斜槓 |
| `empty()` | 檢查變數是否為空、null 或虛假值 |
| `isset()` | 檢查變數是否已設定且不為 null |
| `preg_match()` | 對字串執行規則運算式比對 |
| `filter_var()` | 使用指定的過濾器過濾變數 |
| `$_POST` | 收集使用 POST 方法傳送之表單資料的超全域陣列 |
| `$_GET` | 收集使用 GET 方法傳送之表單資料的超全域陣列 |
| `$_SERVER["PHP_SELF"]` | 傳回目前執行指令碼的檔案名稱 |
| `$_SERVER["REQUEST_METHOD"]` | 傳回用於存取頁面的請求方法（例如 `POST`, `GET`） |

### 關鍵重點

1. **務必清理使用者輸入**，透過可重複使用的 `test_input()` 函式使用 `trim()`、`stripslashes()` 和 `htmlspecialchars()`。
2. **防範 XSS**：在表單 action 屬性中，將 `$_SERVER["PHP_SELF"]` 傳遞給 `htmlspecialchars()`。
3. **使用 `$_SERVER["REQUEST_METHOD"]`** 在處理前檢查表單是否已提交。
4. **使用 `empty()` 驗證必填欄位**，並在每個欄位旁顯示錯誤訊息。
5. **使用 `preg_match()` 驗證資料格式**（姓名、URL），並使用 `filter_var()` 驗證電子郵件與 URL。
6. **在提交後保留表單數值**，方法是將變數回應 (echo) 到輸入項的 `value` 屬性和 textarea 內容中。
7. **保留選項按鈕狀態**：透過 `isset()` 和數值比較條件式地加入 `checked` 屬性。
8. **POST 優於 GET**，適用於包含敏感或大量資料的表單提交。
