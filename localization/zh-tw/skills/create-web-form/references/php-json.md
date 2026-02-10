# PHP JSON 參考

> 來源：<https://www.w3schools.com/php/php_json.asp>

## 什麼是 JSON？

JSON 的全稱是 **JavaScript 物件標記法 (JavaScript Object Notation)**，是一種用於儲存和交換資料的語法。JSON 是一種完全獨立於語言的文字格式。由於 JSON 格式僅包含文字，因此可以輕鬆地在伺服器之間傳送和接收，並被任何程式語言用作資料格式。

PHP 具備一些處理 JSON 的內建函式：

- `json_encode()` -- 將數值編碼為 JSON 格式
- `json_decode()` -- 將 JSON 字串解碼為 PHP 變數

## `json_encode()` -- 將 PHP 編碼為 JSON

`json_encode()` 函式用於將數值編碼為 JSON 格式（即有效的 JSON 字串）。

### 編碼關聯陣列

```php
<?php
$age = array("Peter" => 35, "Ben" => 37, "Joe" => 43);

echo json_encode($age);
?>
```

輸出：

```json
{"Peter":35,"Ben":37,"Joe":43}
```

### 編碼索引陣列

```php
<?php
$cars = array("Volvo", "BMW", "Toyota");

echo json_encode($cars);
?>
```

輸出：

```json
["Volvo","BMW","Toyota"]
```

### 編碼 PHP 物件

```php
<?php
$myObj = new stdClass();
$myObj->name = "John";
$myObj->age = 30;
$myObj->city = "New York";

echo json_encode($myObj);
?>
```

輸出：

```json
{"name":"John","age":30,"city":"New York"}
```

## `json_decode()` -- 將 JSON 解碼為 PHP

`json_decode()` 函式用於將 JSON 字串解碼為 PHP 物件或關聯陣列。

### 語法

```php
json_decode(string, assoc, depth, options)
```

### 參數

| 參數 | 描述                                                                                                   |
|-----------|---------------------------------------------------------------------------------------------------------------|
| `string`  | 必要。指定要解碼的 JSON 字串。                                                            |
| `assoc`   | 選用。若設為 `true`，傳回的物件將轉換為關聯陣列。預設為 `false`。 |
| `depth`   | 選用。指定最大遞迴深度。預設為 `512`。                                            |
| `options` | 選用。指定位元遮罩 (例如 `JSON_BIGINT_AS_STRING`)。                                               |

### 將 JSON 解碼為 PHP 物件（預設）

預設情況下，`json_decode()` 函式會傳回一個物件：

```php
<?php
$jsonobj = '{"Peter":35,"Ben":37,"Joe":43}';

$obj = json_decode($jsonobj);

echo $obj->Peter;  // 輸出： 35
echo $obj->Ben;    // 輸出： 37
echo $obj->Joe;    // 輸出： 43
?>
```

### 將 JSON 解碼為關聯陣列

當第二個參數設為 `true` 時，JSON 字串會被解碼為關聯陣列：

```php
<?php
$jsonobj = '{"Peter":35,"Ben":37,"Joe":43}';

$arr = json_decode($jsonobj, true);

echo $arr["Peter"];  // 輸出： 35
echo $arr["Ben"];    // 輸出： 37
echo $arr["Joe"];    // 輸出： 43
?>
```

## 存取解碼後的值

### 從物件存取

使用箭頭 (`->`) 運算子從解碼後的物件存取值：

```php
<?php
$jsonobj = '{"Peter":35,"Ben":37,"Joe":43}';

$obj = json_decode($jsonobj);

echo $obj->Peter;
echo $obj->Ben;
echo $obj->Joe;
?>
```

### 從關聯陣列存取

使用方括號語法從解碼後的關聯陣列存取值：

```php
<?php
$jsonobj = '{"Peter":35,"Ben":37,"Joe":43}';

$arr = json_decode($jsonobj, true);

echo $arr["Peter"];
echo $arr["Ben"];
echo $arr["Joe"];
?>
```

## 逐一查看數值 (Looping)

### 逐一查看物件

使用 `foreach` 迴圈逐一查看解碼後物件的數值：

```php
<?php
$jsonobj = '{"Peter":35,"Ben":37,"Joe":43}';

$obj = json_decode($jsonobj);

foreach($obj as $key => $value) {
    echo $key . " => " . $value . "<br>";
}
?>
```

輸出：

```
Peter => 35
Ben => 37
Joe => 43
```

### 逐一查看關聯陣列

使用 `foreach` 迴圈逐一查看解碼後關聯陣列的數值：

```php
<?php
$jsonobj = '{"Peter":35,"Ben":37,"Joe":43}';

$arr = json_decode($jsonobj, true);

foreach($arr as $key => $value) {
    echo $key . " => " . $value . "<br>";
}
?>
```

輸出：

```
Peter => 35
Ben => 37
Joe => 43
```
