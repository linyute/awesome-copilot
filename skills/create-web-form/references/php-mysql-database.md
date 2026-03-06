# PHP MySQL 資料庫參考

這是一份整合了在 PHP 中使用 MySQL 資料庫的參考指南，涵蓋連線、CRUD 操作、預備語句 (Prepared Statements) 以及查詢技術。

---

## 目錄

1. [MySQL 簡介](#1-mysql-introduction)
2. [連線至 MySQL](#2-connect-to-mysql)
3. [建立資料庫](#3-create-a-database)
4. [建立資料表](#4-create-a-table)
5. [插入資料](#5-insert-data)
6. [取得最後插入的 ID](#6-get-last-inserted-id)
7. [插入多筆記錄](#7-insert-multiple-records)
8. [預備語句](#8-prepared-statements)
9. [選取資料](#9-select-data)
10. [使用 WHERE 選取](#10-select-with-where)
11. [使用 ORDER BY 選取](#11-select-with-order-by)
12. [刪除資料](#12-delete-data)
13. [更新資料](#13-update-data)
14. [使用 LIMIT 選取](#14-select-with-limit)

---

## 1. MySQL 簡介

> **來源：** <https://www.w3schools.com/php/php_mysql_intro.asp>

### 什麼是 MySQL？

MySQL 是最受歡迎的開放原始碼關聯式資料庫管理系統。與 PHP 結合使用，MySQL 可用於建立動態且由資料驅動的網頁應用程式。

### 關鍵點

- **MySQL** 是一個用於網頁上的資料庫系統。
- **MySQL** 在伺服器上執行（通常與 Apache 等網頁伺服器並存）。
- 它非常適合小型和大型應用程式。
- 它非常快速、可靠且易於使用。
- 它使用標準 **SQL** (結構化查詢語言, Structured Query Language)。
- 它可以免費下載及使用。
- MySQL 由甲骨文公司 (Oracle Corporation) 開發、發佈及支援。

### MySQL 中的資料

- MySQL 中的資料儲存在**資料表**中。
- 資料表是相關資料的集合，由**欄 (columns)** 和**列 (rows)** 組成。
- 資料庫對於按類別儲存資訊非常有用。例如，公司可能擁有員工、產品和客戶的資料庫。

### PHP + MySQL 資料庫系統

- PHP 結合 MySQL 是跨平台的（可在 Windows、Linux、macOS 等環境執行）。
- 用於查詢 MySQL 資料庫的 PHP 程式碼在伺服器上執行，並將 HTML 結果傳送給瀏覽器。

### PHP MySQL API

PHP 提供三種連線至 MySQL 並與之互動的方法：

| API | 描述 |
|-----|-------------|
| **MySQLi (物件導向)** | MySQL 改進版擴充功能 - 物件導向介面 |
| **MySQLi (程序式)** | MySQL 改進版擴充功能 - 程序式介面 |
| **PDO (PHP 資料物件)** | 支援 12 種不同的資料庫系統 |

**建議：** 請使用 **MySQLi** 或 **PDO**。舊有的 `mysql_*` 函式已過時，且自 PHP 7.0 起已移除。

**MySQLi vs PDO：**

- **PDO** 可在 12 種不同的資料庫系統上運作；**MySQLi** 僅支援 MySQL。
- 如果您需要將專案切換到另一個資料庫，PDO 會使過程更簡單 -- 您只需更改連線字串和少數查詢。
- 兩者都支援**預備語句 (Prepared Statements)**，可防止 SQL 插入 (SQL injection) 攻擊。

---

## 2. 連線至 MySQL

> **來源：** <https://www.w3schools.com/php/php_mysql_connect.asp>

### 開啟與 MySQL 的連線

在存取 MySQL 資料庫中的資料之前，您需要連線至伺服器。

### MySQLi 物件導向連線

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";

// 建立連線
$conn = new mysqli($servername, $username, $password);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}
echo "連線成功";
?>
```

### MySQLi 程序式連線

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";

// 建立連線
$conn = mysqli_connect($servername, $username, $password);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}
echo "連線成功";
?>
```

### PDO 連線

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";

try {
    $conn = new PDO("mysql:host=$servername;dbname=myDB", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "連線成功";
} catch(PDOException $e) {
    echo "連線失敗： " . $e->getMessage();
}
?>
```

**注意：** 在 PDO 範例中，指定了一個資料庫 (`myDB`)。PDO 要求必須連線至一個有效的資料庫。如果未指定資料庫，則會拋出例外。

### 關閉連線

指令碼結束時連線會自動關閉。若要提前關閉：

```php
// MySQLi 物件導向
$conn->close();

// MySQLi 程序式
mysqli_close($conn);

// PDO
$conn = null;
```

---

## 3. 建立資料庫

> **來源：** <https://www.w3schools.com/php/php_mysql_create.asp>

`CREATE DATABASE` 語句用於在 MySQL 中建立資料庫。

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";

// 建立連線
$conn = new mysqli($servername, $username, $password);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

// 建立資料庫
$sql = "CREATE DATABASE myDB";
if ($conn->query($sql) === TRUE) {
    echo "資料庫建立成功";
} else {
    echo "建立資料庫時出錯： " . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";

// 建立連線
$conn = mysqli_connect($servername, $username, $password);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

// 建立資料庫
$sql = "CREATE DATABASE myDB";
if (mysqli_query($conn, $sql)) {
    echo "資料庫建立成功";
} else {
    echo "建立資料庫時出錯： " . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";

try {
    $conn = new PDO("mysql:host=$servername", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "CREATE DATABASE myDBPDO";
    // 使用 exec()，因為沒有傳回結果
    $conn->exec($sql);
    echo "資料庫建立成功<br>";
} catch(PDOException $e) {
    echo $sql . "<br>" . $e->getMessage();
}

$conn = null;
?>
```

**提示：** 建立資料庫時，您只需向 `mysqli` 物件指定前三個參數（主機名稱、使用者名稱和密碼）。若要選取特定資料庫，請加入第四個參數。

---

## 4. 建立資料表

> **來源：** <https://www.w3schools.com/php/php_mysql_create_table.asp>

`CREATE TABLE` 語句用於在 MySQL 中建立資料表。

### 建立資料表的關鍵 SQL 概念

- **NOT NULL** - 每一列必須包含該欄位的值；不允許 null 值。
- **DEFAULT 值** - 設定一個預設值，當未傳入其他值時會自動加入。
- **UNSIGNED** - 用於數字類型，限制儲存的資料為正數和零。
- **AUTO_INCREMENT** - 每當加入一筆新記錄時，MySQL 會自動將該欄位的值增加 1。
- **PRIMARY KEY** - 用於唯一識別資料表中的列。具有 PRIMARY KEY 設定的欄位通常是 ID 號碼，並搭配 `AUTO_INCREMENT` 使用。

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

// 用於建立資料表的 SQL
$sql = "CREATE TABLE MyGuests (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(30) NOT NULL,
    lastname VARCHAR(30) NOT NULL,
    email VARCHAR(50),
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "資料表 MyGuests 建立成功";
} else {
    echo "建立資料表時出錯： " . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

// 用於建立資料表的 SQL
$sql = "CREATE TABLE MyGuests (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(30) NOT NULL,
    lastname VARCHAR(30) NOT NULL,
    email VARCHAR(50),
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if (mysqli_query($conn, $sql)) {
    echo "資料表 MyGuests 建立成功";
} else {
    echo "建立資料表時出錯： " . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 用於建立資料表的 SQL
    $sql = "CREATE TABLE MyGuests (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(30) NOT NULL,
        lastname VARCHAR(30) NOT NULL,
        email VARCHAR(50),
        reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";

    // 使用 exec()，因為沒有傳回結果
    $conn->exec($sql);
    echo "資料表 MyGuests 建立成功";
} catch(PDOException $e) {
    echo $sql . "<br>" . $e->getMessage();
}

$conn = null;
?>
```

---

## 5. 插入資料

> **來源：** <https://www.w3schools.com/php/php_mysql_insert.asp>

`INSERT INTO` 語句用於向 MySQL 資料表加入新記錄。

### SQL 語法

```sql
INSERT INTO table_name (column1, column2, column3, ...)
VALUES (value1, value2, value3, ...)
```

**重要規則：**

- SQL 查詢在 PHP 中必須加上引號。
- SQL 查詢中的字串值必須加上引號。
- 數值絕對不可加上引號。
- NULL 這個字絕對不可加上引號。

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('John', 'Doe', 'john@example.com')";

if ($conn->query($sql) === TRUE) {
    echo "新記錄建立成功";
} else {
    echo "錯誤： " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('John', 'Doe', 'john@example.com')";

if (mysqli_query($conn, $sql)) {
    echo "新記錄建立成功";
} else {
    echo "錯誤： " . $sql . "<br>" . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "INSERT INTO MyGuests (firstname, lastname, email)
    VALUES ('John', 'Doe', 'john@example.com')";
    // 使用 exec()，因為沒有傳回結果
    $conn->exec($sql);
    echo "新記錄建立成功";
} catch(PDOException $e) {
    echo $sql . "<br>" . $e->getMessage();
}

$conn = null;
?>
```

**注意：** 不需要為 `id` 欄位和 `reg_date` 欄位指定值，因為 `id` 是 `AUTO_INCREMENT`，而 `reg_date` 預設為 `CURRENT_TIMESTAMP`。

---

## 6. 取得最後插入的 ID

> **來源：** <https://www.w3schools.com/php/php_mysql_insert_lastid.asp>

如果您對具有 AUTO_INCREMENT 欄位的資料表執行 INSERT，可以立即擷取最後插入列的 ID。

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('John', 'Doe', 'john@example.com')";

if ($conn->query($sql) === TRUE) {
    $last_id = $conn->insert_id;
    echo "新記錄建立成功。最後插入的 ID 為： " . $last_id;
} else {
    echo "錯誤： " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('John', 'Doe', 'john@example.com')";

if (mysqli_query($conn, $sql)) {
    $last_id = mysqli_insert_id($conn);
    echo "新記錄建立成功。最後插入的 ID 為： " . $last_id;
} else {
    echo "錯誤： " . $sql . "<br>" . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "INSERT INTO MyGuests (firstname, lastname, email)
    VALUES ('John', 'Doe', 'john@example.com')";
    // 使用 exec()，因為沒有傳回結果
    $conn->exec($sql);
    $last_id = $conn->lastInsertId();
    echo "新記錄建立成功。最後插入的 ID 為： " . $last_id;
} catch(PDOException $e) {
    echo $sql . "<br>" . $e->getMessage();
}

$conn = null;
?>
```

**關鍵方法：**

- MySQLi OO: `$conn->insert_id`
- MySQLi 程序式: `mysqli_insert_id($conn)`
- PDO: `$conn->lastInsertId()`

---

## 7. 插入多筆記錄

> **來源：** <https://www.w3schools.com/php/php_mysql_insert_multiple.asp>

可以使用 `multi_query()` 方法 (MySQLi) 或透過分組數值 (PDO) 來執行多條 SQL 語句。

### MySQLi 物件導向 (multi_query)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('John', 'Doe', 'john@example.com');";
$sql .= "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('Mary', 'Moe', 'mary@example.com');";
$sql .= "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('Julie', 'Dooley', 'julie@example.com')";

if ($conn->multi_query($sql) === TRUE) {
    echo "新記錄建立成功";
} else {
    echo "錯誤： " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式 (multi_query)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('John', 'Doe', 'john@example.com');";
$sql .= "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('Mary', 'Moe', 'mary@example.com');";
$sql .= "INSERT INTO MyGuests (firstname, lastname, email)
VALUES ('Julie', 'Dooley', 'julie@example.com')";

if (mysqli_multi_query($conn, $sql)) {
    echo "新記錄建立成功";
} else {
    echo "錯誤： " . $sql . "<br>" . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO (針對多次插入使用預備語句)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 開始一個交易 (Transaction)
    $conn->beginTransaction();

    // 預備語句
    $stmt = $conn->prepare("INSERT INTO MyGuests (firstname, lastname, email)
    VALUES (:firstname, :lastname, :email)");

    // 插入第一列
    $stmt->execute([
        ':firstname' => 'John',
        ':lastname' => 'Doe',
        ':email' => 'john@example.com'
    ]);

    // 插入第二列
    $stmt->execute([
        ':firstname' => 'Mary',
        ':lastname' => 'Moe',
        ':email' => 'mary@example.com'
    ]);

    // 插入第三列
    $stmt->execute([
        ':firstname' => 'Julie',
        ':lastname' => 'Dooley',
        ':email' => 'julie@example.com'
    ]);

    // 提交交易
    $conn->commit();
    echo "新記錄建立成功";
} catch(PDOException $e) {
    // 若發生錯誤則回滾交易
    $conn->rollBack();
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**注意：** `multi_query()` 字串中的每條 SQL 語句必須以**分號**分隔。PDO 版本使用預備語句和交易，以實現更安全、更可靠的批次插入。

---

## 8. 預備語句 (Prepared Statements)

> **來源：** <https://www.w3schools.com/php/php_mysql_prepared_statements.asp>

預備語句對於防範 **SQL 插入** 非常有用。它們是處理使用者提供之資料的推薦查詢方式。

### 什麼是預備語句？

預備語句是一種用於重複執行相同（或相似）SQL 語句且效率極高的功能。它們分為兩個階段運作：

1. **預備 (Prepare)：** 建立一個 SQL 語句範本並傳送到資料庫。某些值會留空，稱為**參數**（標記為 `?` 或 `:name`）。例如：`INSERT INTO MyGuests VALUES(?, ?, ?)`
2. **執行 (Execute)：** 資料庫會解析、編譯並最佳化 SQL 語句範本，並儲存結果而不執行。應用程式將特定值繫結到參數並執行語句。該語句可以使用不同的值執行任意次數。

### 預備語句的優點

- **減少解析時間：** 查詢僅預備一次，即使執行多次。
- **減少頻寬：** 每次只需傳送參數，而非整個查詢。
- **防範 SQL 插入攻擊：** 參數值隨後使用不同的協定傳輸，無需轉義。如果原始語句範本非衍生自外部輸入，則不會發生 SQL 插入。

### MySQLi 預備語句（使用繫結參數）

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

// 預備與繫結
$stmt = $conn->prepare("INSERT INTO MyGuests (firstname, lastname, email) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $firstname, $lastname, $email);

// 設定參數並執行
$firstname = "John";
$lastname = "Doe";
$email = "john@example.com";
$stmt->execute();

$firstname = "Mary";
$lastname = "Moe";
$email = "mary@example.com";
$stmt->execute();

$firstname = "Julie";
$lastname = "Dooley";
$email = "julie@example.com";
$stmt->execute();

echo "新記錄建立成功";

$stmt->close();
$conn->close();
?>
```

**`bind_param()` 的類型字串引數：**

| 字元 | 描述 |
|-----------|-------------|
| `i` | 整數 (integer) |
| `d` | 雙精度浮點數 (double) |
| `s` | 字串 (string) |
| `b` | BLOB (二進位大型物件) |

每個參數都必須指定類型。藉由告知 MySQL 預期什麼類型的資料，您可以將 SQL 插入的風險降至最低。

### PDO 預備語句（使用命名參數）

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // 將 PDO 錯誤模式設定為例外
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 預備 SQL 並繫結參數
    $stmt = $conn->prepare("INSERT INTO MyGuests (firstname, lastname, email)
    VALUES (:firstname, :lastname, :email)");
    $stmt->bindParam(':firstname', $firstname);
    $stmt->bindParam(':lastname', $lastname);
    $stmt->bindParam(':email', $email);

    // 插入第一列
    $firstname = "John";
    $lastname = "Doe";
    $email = "john@example.com";
    $stmt->execute();

    // 插入第二列
    $firstname = "Mary";
    $lastname = "Moe";
    $email = "mary@example.com";
    $stmt->execute();

    // 插入第三列
    $firstname = "Julie";
    $lastname = "Dooley";
    $email = "julie@example.com";
    $stmt->execute();

    echo "新記錄建立成功";
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**注意：** 在 PDO 中，使用命名參數 (`:firstname`) 而非 `?` 位置佔位符（雖然 PDO 兩者都支援）。命名參數具有更好的可讀性。

---

## 9. 選取資料

> **來源：** <https://www.w3schools.com/php/php_mysql_select.asp>

`SELECT` 語句用於從一個或多個資料表中選取資料。

### SQL 語法

```sql
SELECT column_name(s) FROM table_name

-- 或選取所有欄位：
SELECT * FROM table_name
```

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "SELECT id, firstname, lastname FROM MyGuests";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // 輸出每一列的資料
    while($row = $result->fetch_assoc()) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "SELECT id, firstname, lastname FROM MyGuests";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    // 輸出每一列的資料
    while($row = mysqli_fetch_assoc($result)) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

mysqli_close($conn);
?>
```

### PDO (使用預備語句)

```php
<?php
echo "<table style='border: solid 1px black;'>";
echo "<tr><th>Id</th><th>名字</th><th>姓氏</th></tr>";

class TableRows extends RecursiveIteratorIterator {
    function __construct($it) {
        parent::__construct($it, self::LEAVES_ONLY);
    }

    function current() {
        return "<td style='width:150px;border:1px solid black;'>" . parent::current() . "</td>";
    }

    function beginChildren() {
        echo "<tr>";
    }

    function endChildren() {
        echo "</tr>" . "
";
    }
}

$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $conn->prepare("SELECT id, firstname, lastname FROM MyGuests");
    $stmt->execute();

    // 將產生的陣列設定為關聯陣列
    $result = $stmt->setFetchMode(PDO::FETCH_ASSOC);
    foreach(new TableRows(new RecursiveArrayIterator($stmt->fetchAll())) as $k => $v) {
        echo $v;
    }
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
echo "</table>";
?>
```

**較簡單的 PDO Select (常見模式)：**

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("SELECT id, firstname, lastname FROM MyGuests");
    $stmt->execute();

    // 以關聯陣列形式擷取所有結果
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($results as $row) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**關鍵方法：**

- `$result->num_rows` -- 傳回結果集中的列數 (MySQLi OO)。
- `$result->fetch_assoc()` -- 以關聯陣列形式擷取結果列 (MySQLi OO)。
- `$stmt->fetchAll(PDO::FETCH_ASSOC)` -- 傳回包含所有列的陣列 (PDO)。

---

## 10. 使用 WHERE 選取

> **來源：** <https://www.w3schools.com/php/php_mysql_select_where.asp>

`WHERE` 子句用於過濾記錄，僅擷取符合指定條件的記錄。

### SQL 語法

```sql
SELECT column_name(s) FROM table_name WHERE column_name operator value
```

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "SELECT id, firstname, lastname FROM MyGuests WHERE lastname='Doe'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // 輸出每一列的資料
    while($row = $result->fetch_assoc()) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "SELECT id, firstname, lastname FROM MyGuests WHERE lastname='Doe'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    while($row = mysqli_fetch_assoc($result)) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

mysqli_close($conn);
?>
```

### PDO (使用預備語句 -- 建議)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("SELECT id, firstname, lastname FROM MyGuests WHERE lastname = :lastname");
    $stmt->bindParam(':lastname', $lastname);

    $lastname = "Doe";
    $stmt->execute();

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as $row) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**常見的 WHERE 運算子：**

| 運算子 | 描述 |
|----------|-------------|
| `=` | 等於 |
| `<>` 或 `!=` | 不等於 |
| `>` | 大於 |
| `<` | 小於 |
| `>=` | 大於或等於 |
| `<=` | 小於或等於 |
| `BETWEEN` | 在內含範圍內 |
| `LIKE` | 搜尋模式 |
| `IN` | 為欄位指定多個可能的值 |

**重要：** 在 WHERE 子句中使用使用者提供的值時，務必使用帶有繫結參數的預備語句，以防止 SQL 插入。

---

## 11. 使用 ORDER BY 選取

> **來源：** <https://www.w3schools.com/php/php_mysql_select_orderby.asp>

`ORDER BY` 子句用於對結果集進行遞增或遞減排序。預設情況下，它會進行**遞增**排序。使用 `DESC` 關鍵字可進行遞減排序。

### SQL 語法

```sql
SELECT column_name(s) FROM table_name ORDER BY column_name ASC|DESC
```

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "SELECT id, firstname, lastname FROM MyGuests ORDER BY lastname";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

$conn->close();
?>
```

### 遞減排序範例

```php
$sql = "SELECT id, firstname, lastname FROM MyGuests ORDER BY lastname DESC";
```

### 多欄位排序

您可以根據多個欄位進行排序。根據多個欄位排序時，僅當第一個欄位的值相同時，才會使用第二個欄位：

```sql
SELECT * FROM MyGuests ORDER BY lastname ASC, firstname ASC
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "SELECT id, firstname, lastname FROM MyGuests ORDER BY lastname";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    while($row = mysqli_fetch_assoc($result)) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

mysqli_close($conn);
?>
```

### PDO

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("SELECT id, firstname, lastname FROM MyGuests ORDER BY lastname");
    $stmt->execute();

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as $row) {
        echo "id: " . $row["id"] . " - 姓名： " . $row["firstname"] . " " . $row["lastname"] . "<br>";
    }
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

---

## 12. 刪除資料

> **來源：** <https://www.w3schools.com/php/php_mysql_delete.asp>

`DELETE` 語句用於從資料表中刪除記錄。

### SQL 語法

```sql
DELETE FROM table_name WHERE some_column = some_value
```

**重要：** `WHERE` 子句指定應刪除哪些記錄。如果您省略 WHERE 子句，**所有記錄都將被刪除！**

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

// 用於刪除記錄的 SQL
$sql = "DELETE FROM MyGuests WHERE id=3";

if ($conn->query($sql) === TRUE) {
    echo "記錄刪除成功";
} else {
    echo "刪除記錄時出錯： " . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

// 用於刪除記錄的 SQL
$sql = "DELETE FROM MyGuests WHERE id=3";

if (mysqli_query($conn, $sql)) {
    echo "記錄刪除成功";
} else {
    echo "刪除記錄時出錯： " . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO (使用預備語句)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 預備刪除語句
    $stmt = $conn->prepare("DELETE FROM MyGuests WHERE id = :id");
    $stmt->bindParam(':id', $id);

    $id = 3;
    $stmt->execute();

    echo "記錄刪除成功";
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**警告：** 刪除記錄時請務必小心。此操作無法撤銷！

---

## 13. 更新資料

> **來源：** <https://www.w3schools.com/php/php_mysql_update.asp>

`UPDATE` 語句用於更新資料表中的現有記錄。

### SQL 語法

```sql
UPDATE table_name SET column1=value1, column2=value2, ... WHERE some_column=some_value
```

**重要：** `WHERE` 子句指定應更新哪些記錄。如果您省略 WHERE 子句，**所有記錄都將被更新！**

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "UPDATE MyGuests SET lastname='Doe' WHERE id=2";

if ($conn->query($sql) === TRUE) {
    echo "記錄更新成功";
} else {
    echo "更新記錄時出錯： " . $conn->error;
}

$conn->close();
?>
```

### MySQLi 程序式

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = mysqli_connect($servername, $username, $password, $dbname);

// 檢查連線
if (!$conn) {
    die("連線失敗： " . mysqli_connect_error());
}

$sql = "UPDATE MyGuests SET lastname='Doe' WHERE id=2";

if (mysqli_query($conn, $sql)) {
    echo "記錄更新成功";
} else {
    echo "更新記錄時出錯： " . mysqli_error($conn);
}

mysqli_close($conn);
?>
```

### PDO (使用預備語句)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare("UPDATE MyGuests SET lastname = :lastname WHERE id = :id");
    $stmt->bindParam(':lastname', $lastname);
    $stmt->bindParam(':id', $id);

    $lastname = "Doe";
    $id = 2;
    $stmt->execute();

    echo "記錄更新成功";
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**注意：** `$conn->query($sql)` 成功時傳回 `TRUE`。若要檢查有多少列受到影響，請使用 `$conn->affected_rows` (MySQLi) 或 `$stmt->rowCount()` (PDO)。

---

## 14. 使用 LIMIT 選取

> **來源：** <https://www.w3schools.com/php/php_mysql_select_limit.asp>

`LIMIT` 子句用於指定要傳回的記錄數。這對於將結果分頁或在每頁顯示固定數量的記錄非常有用。

### SQL 語法

```sql
SELECT column_name(s) FROM table_name LIMIT number

-- 使用位移量 (用於分頁)：
SELECT column_name(s) FROM table_name LIMIT offset, count
```

**注意：** 第一列從位移量 `0` 開始（而非 `1`）。

### MySQLi 物件導向

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

$sql = "SELECT * FROM Orders LIMIT 30";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "id: " . $row["id"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

$conn->close();
?>
```

### 使用位移量搭配 LIMIT (分頁)

`LIMIT` 子句可以接受兩個值： `LIMIT offset, count`。

- **位移量 (offset)** 指定從何處開始傳回記錄（第一筆記錄為 0）。
- **計數 (count)** 指定要傳回的最大記錄數。

```sql
-- 傳回第 16-30 筆記錄 (從位移量 15 開始，傳回 15 筆記錄)：
SELECT * FROM Orders LIMIT 15, 15
```

### 分頁範例

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDB";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die("連線失敗： " . $conn->connect_error);
}

// 每頁結果數
$results_per_page = 10;

// 目前頁碼 (來自 URL 參數)
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

// 計算位移量
$offset = ($page - 1) * $results_per_page;

// 使用 LIMIT 與 OFFSET 選取記錄
$sql = "SELECT * FROM Orders LIMIT $offset, $results_per_page";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "id: " . $row["id"] . "<br>";
    }
} else {
    echo "0 筆結果";
}

$conn->close();
?>
```

### PDO 搭配 LIMIT (預備語句)

```php
<?php
$servername = "localhost";
$username = "username";
$password = "password";
$dbname = "myDBPDO";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $limit = 10;
    $offset = 0;

    $stmt = $conn->prepare("SELECT * FROM Orders LIMIT :offset, :limit");
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as $row) {
        echo "id: " . $row["id"] . "<br>";
    }
} catch(PDOException $e) {
    echo "錯誤： " . $e->getMessage();
}

$conn = null;
?>
```

**重要：** 在 PDO 的預備語句中使用 LIMIT 時，您必須使用 `PDO::PARAM_INT` 明確地將值繫結為整數，否則 PDO 會將其視為字串並加上引號，這會導致 SQL 錯誤。

---

## 快速參考總結

### 連線模式

| 方法 | 連線 | 關閉 |
|--------|---------|-------|
| MySQLi OO | `new mysqli($host, $user, $pass, $db)` | `$conn->close()` |
| MySQLi 程序式 | `mysqli_connect($host, $user, $pass, $db)` | `mysqli_close($conn)` |
| PDO | `new PDO("mysql:host=$host;dbname=$db", $user, $pass)` | `$conn = null` |

### CRUD 操作

| 操作 | SQL 指令 |
|-----------|-------------|
| **建立 (Create)** | `INSERT INTO table (col1, col2) VALUES (val1, val2)` |
| **讀取 (Read)** | `SELECT col1, col2 FROM table WHERE condition` |
| **更新 (Update)** | `UPDATE table SET col1=val1 WHERE condition` |
| **刪除 (Delete)** | `DELETE FROM table WHERE condition` |

### 查詢修飾符

| 修飾符 | 用途 | 範例 |
|----------|---------|---------|
| `WHERE` | 過濾列 | `WHERE id = 1` |
| `ORDER BY` | 排序結果 | `ORDER BY name ASC` |
| `LIMIT` | 限制列數 | `LIMIT 10` |
| `LIMIT offset, count` | 分頁 | `LIMIT 20, 10` |

### MySQLi bind_param 類型

| 類型 | 字元 |
|------|-----------|
| 整數 | `i` |
| 雙精度浮點數 | `d` |
| 字串 | `s` |
| BLOB | `b` |

### 安全最佳實作

1. **務必**對使用者提供的資料使用帶有繫結參數的預備語句。
2. **切勿**將使用者輸入直接插入 SQL 查詢字串中。
3. 使用 `PDO::ERRMODE_EXCEPTION` 來正確處理錯誤。
4. 在處理之前驗證並清理所有使用者輸入。
5. 對資料庫使用者帳號使用最小權限原則。
6. 將資料庫認證資訊儲存在網頁根目錄之外，並盡可能使用環境變數。

---

*此參考是根據 W3Schools 的 PHP MySQL 教學頁面整合而成。*
*來源 URL 已列於各章節開頭。*
