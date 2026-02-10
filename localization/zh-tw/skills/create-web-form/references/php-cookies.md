# PHP Cookie 參考

> 來源：<https://www.w3schools.com/php/php_cookies.asp>

## 什麼是 Cookie？

Cookie 通常用於識別使用者。它是由伺服器嵌入到使用者電腦中的一個小型檔案。每當同一台電腦透過瀏覽器請求頁面時，也會同時傳送該 Cookie。使用 PHP，您可以建立並擷取 Cookie 的數值。

## 使用 `setcookie()` 建立 Cookie

使用 `setcookie()` 函式建立 Cookie。

### 語法

```php
setcookie(name, value, expire, path, domain, secure, httponly);
```

### 參數

| 參數 | 描述 |
|------------|---------------------------------------------------------------------------------------------------------|
| `name` | 必要。指定 Cookie 的名稱。 |
| `value` | 選用。指定 Cookie 的值。 |
| `expire` | 選用。指定 Cookie 到期的時間。`time() + 86400 * 30` 將設定 Cookie 在 30 天後到期。如果省略此參數或設為 `0`，Cookie 將在工作階段結束時（瀏覽器關閉時）到期。預設值為 `0`。 |
| `path` | 選用。指定 Cookie 在伺服器上的路徑。如果設為 `"/"`，Cookie 將在整個網域內可用。如果設為 `"/php/"`，Cookie 將僅在 `php` 目錄及其所有子目錄中可用。預設值為設定 Cookie 時所在的目前目錄。 |
| `domain` | 選用。指定 Cookie 的網域名稱。若要使 Cookie 在 `example.com` 的所有子網域中可用，請將網域設定為 `".example.com"`。 |
| `secure` | 選用。指定 Cookie 是否應僅透過安全的 HTTPS 連線傳輸。`true` 表示僅在存在安全連線時才設定 Cookie。預設值為 `false`。 |
| `httponly` | 選用。若設為 `true`，Cookie 將僅能透過 HTTP 協定存取（指令碼語言如 JavaScript 無法存取該 Cookie）。此設定有助於減少透過 XSS 攻擊導致的身分竊取。預設值為 `false`。 |

**注意：** `setcookie()` 函式必須出現在 `<html>` 標籤之前（在向瀏覽器傳送任何輸出之前）。

### 範例：建立 Cookie

下列範例建立了一個名為 "user" 的 Cookie，其值為 "John Doe"。該 Cookie 將在 30 天後到期。 `"/"` 表示該 Cookie 在整個網站中皆可用：

```php
<?php
$cookie_name = "user";
$cookie_value = "John Doe";
setcookie($cookie_name, $cookie_value, time() + (86400 * 30), "/"); // 86400 = 1 天
?>
<html>
<body>

<?php
if(!isset($_COOKIE[$cookie_name])) {
    echo "名為 '" . $cookie_name . "' 的 Cookie 尚未設定！";
} else {
    echo "Cookie '" . $cookie_name . "' 已設定！<br>";
    echo "數值為： " . $_COOKIE[$cookie_name];
}
?>

</body>
</html>
```

**注意：** `setcookie()` 函式將 Cookie 作為 HTTP 回應標頭的一部分傳送。Cookie 在目前頁面上不可見，直到下次載入應顯示該 Cookie 的頁面為止。因此，若要測試 Cookie，必須重新載入頁面或導覽至另一個頁面。

## 擷取 Cookie 數值

使用 PHP 的 `$_COOKIE` 超全域變數來擷取 Cookie 的數值。

```php
<?php
if(!isset($_COOKIE["user"])) {
    echo "名為 'user' 的 Cookie 尚未設定！";
} else {
    echo "Cookie 'user' 已設定！<br>";
    echo "數值為： " . $_COOKIE["user"];
}
?>
```

**提示：** 在嘗試存取 Cookie 數值之前，請使用 `isset()` 函式確認是否已設定該 Cookie。

## 修改 Cookie 數值

若要修改 Cookie，只需再次使用 `setcookie()` 函式設定該 Cookie：

```php
<?php
$cookie_name = "user";
$cookie_value = "Alex Porter";
setcookie($cookie_name, $cookie_value, time() + (86400 * 30), "/");
?>
<html>
<body>

<?php
if(!isset($_COOKIE[$cookie_name])) {
    echo "名為 '" . $cookie_name . "' 的 Cookie 尚未設定！";
} else {
    echo "Cookie '" . $cookie_name . "' 已設定！<br>";
    echo "數值為： " . $_COOKIE[$cookie_name];
}
?>

</body>
</html>
```

## 刪除 Cookie

若要刪除 Cookie，請使用 `setcookie()` 函式並將到期日期設定為過去的時間：

```php
<?php
// 將到期日期設定為一小時前
setcookie("user", "", time() - 3600);
?>
<html>
<body>

<?php
echo "Cookie 'user' 已刪除。";
?>

</body>
</html>
```

## 檢查是否已啟用 Cookie

下列範例建立了一個小型指令碼來檢查是否已啟用 Cookie。首先，嘗試使用 `setcookie()` 函式建立一個測試 Cookie，然後計算 `$_COOKIE` 陣列變數的數量：

```php
<?php
setcookie("test_cookie", "test", time() + 3600, '/');
?>
<html>
<body>

<?php
if(count($_COOKIE) > 0) {
    echo "Cookie 已啟用。";
} else {
    echo "Cookie 已停用。";
}
?>

</body>
</html>
```
