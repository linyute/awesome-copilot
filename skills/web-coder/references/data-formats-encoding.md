# 資料格式與編碼參考 (Data Formats & Encoding Reference)

網頁開發中的資料格式、字元編碼以及序列化。

## JSON (JavaScript 物件標記法)

輕量級的資料交換格式。

### 語法 (Syntax)

```json
{
  "string": "值",
  "number": 42,
  "boolean": true,
  "null": null,
  "array": [1, 2, 3],
  "object": {
    "nested": "值"
  }
}
```

**允許的類型**：字串 (string)、數字 (number)、布林值 (boolean)、null、陣列 (array)、物件 (object)  
**不允許的類型**：undefined、函式 (functions)、日期 (dates)、正規表示式 (RegExp)

### JavaScript 方法

```javascript
// 解析 JSON 字串
const data = JSON.parse('{"name":"John","age":30}');

// 將物件轉換為字串 (Stringify)
const json = JSON.stringify({ name: 'John', age: 30 });

// 美化輸出（縮排）
const json = JSON.stringify(data, null, 2);

// 自訂序列化
const json = JSON.stringify(obj, (key, value) => {
  if (key === 'password') return undefined; // 排除
  return value;
});

// toJSON 方法
const obj = {
  name: 'John',
  date: new Date(),
  toJSON() {
    return {
      name: this.name,
      date: this.date.toISOString()
    };
  }
};
```

### JSON 型別表示

JavaScript 型別如何對應至 JSON：
- 字串 (String) → string
- 數字 (Number) → number
- 布林值 (Boolean) → boolean
- null → null
- 陣列 (Array) → array
- 物件 (Object) → object
- undefined → 省略
- 函式 (Function) → 省略
- 符號 (Symbol) → 省略
- 日期 (Date) → ISO 8601 字串

## XML (可延伸標記語言)

用於編碼文件的標記語言。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
  </user>
  <user id="2">
    <name>Jane Smith</name>
    <email>jane@example.com</email>
  </user>
</users>
```

**使用案例**：
- 設定檔
- 資料交換
- RSS/Atom 摘要
- SOAP 網頁服務

### 在 JavaScript 中解析 XML

```javascript
// 解析 XML 字串
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

// 查詢元件
const users = xmlDoc.querySelectorAll('user');
users.forEach(user => {
  const name = user.querySelector('name').textContent;
  console.log(name);
});

// 建立 XML
const serializer = new XMLSerializer();
const xmlString = serializer.serializeToString(xmlDoc);
```

## 字元編碼 (Character Encoding)

### UTF-8

通用字元編碼（建議用於網頁）。

**特性**：
- 可變寬度（每個字元 1-4 位元組）
- 向後相容於 ASCII
- 支援所有 Unicode 字元

```html
<meta charset="UTF-8">
```

### UTF-16

每個字元 2 或 4 位元組。

**用途**：JavaScript 內部使用 UTF-16

```javascript
'A'.charCodeAt(0); // 65
String.fromCharCode(65); // 'A'

// 表情符號 (Emoji)（在 UTF-16 中需要代理對 (Surrogate pair)）
'😀'.length; // 2 (在 JavaScript 中)
```

### ASCII

7 位元編碼（128 個字元）。

**範圍**：0-127  
**包含**：英文字母、數字、常見符號

### 程式碼點 (Code Point) vs 程式碼單元 (Code Unit)

- **程式碼點**：Unicode 字元 (U+0041 = 'A')
- **程式碼單元**：UTF-16 中的 16 位元值

```javascript
// 程式碼點
'A'.codePointAt(0); // 65
String.fromCodePoint(0x1F600); // '😀'

// 迭代程式碼點
for (const char of 'Hello 😀') {
  console.log(char);
}
```

## Base64

二進位對文字的編碼方案。

```javascript
// 編碼
const encoded = btoa('Hello World'); // "SGVsbG8gV29ybGQ="

// 解碼
const decoded = atob('SGVsbG8gV29ybGQ='); // "Hello World"

// 處理 Unicode（需要額外步驟）
const encoded = btoa(unescape(encodeURIComponent('Hello 世界')));
const decoded = decodeURIComponent(escape(atob(encoded)));

// 現代方法
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytes = encoder.encode('Hello 世界');
const decoded = decoder.decode(bytes);
```

**使用案例**：
- 在 JSON/XML 中嵌入二進位資料
- 資料 URL (`data:image/png;base64,...`)
- 基本驗證標頭

## URL 編碼 (百分比編碼)

編碼 URL 中的特殊字元。

```javascript
// encodeURIComponent (編碼除了 A-Z a-z 0-9 - _ . ! ~ * ' ( ) 以外的所有字元)
const encoded = encodeURIComponent('Hello World!'); // "Hello%20World%21"
const decoded = decodeURIComponent(encoded); // "Hello World!"

// encodeURI (編碼較少 - 用於完整 URL)
const url = encodeURI('http://example.com/search?q=hello world');

// 現代 URL API
const url = new URL('http://example.com/search');
url.searchParams.set('q', 'hello world');
console.log(url.toString()); // 自動編碼
```

## MIME 類型 (MIME Types)

媒體類型識別。

### 常見 MIME 類型

| 類型 | MIME 類型 |
|------|-----------|
| HTML | `text/html` |
| CSS | `text/css` |
| JavaScript | `text/javascript`, `application/javascript` |
| JSON | `application/json` |
| XML | `application/xml`, `text/xml` |
| 純文字 (Plain Text) | `text/plain` |
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| GIF | `image/gif` |
| SVG | `image/svg+xml` |
| PDF | `application/pdf` |
| ZIP | `application/zip` |
| MP4 影片 | `video/mp4` |
| MP3 音訊 | `audio/mpeg` |
| 表單資料 | `application/x-www-form-urlencoded` |
| 多部分資料 (Multipart) | `multipart/form-data` |

```html
<link rel="stylesheet" href="styles.css" type="text/css">
<script src="app.js" type="text/javascript"></script>
```

```http
Content-Type: application/json; charset=utf-8
Content-Type: text/html; charset=utf-8
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
```

## 序列化 (Serialization) 與還原序列化 (Deserialization)

將資料結構轉換為可儲存格式或從中轉換。

### JSON 序列化

```javascript
// 序列化
const obj = { name: 'John', date: new Date() };
const json = JSON.stringify(obj);

// 還原序列化
const parsed = JSON.parse(json);
```

### 可序列化物件 (Serializable Objects)

可透過結構化複製演算法 (Structured clone algorithm) 序列化的物件：
- 基本型別
- 陣列、物件、
- Date、RegExp
- Map、Set
- ArrayBuffer、TypedArrays

**不可序列化**：
- 函式 (Functions)
- DOM 節點
- 符號 (Symbols)（作為值時）
- 具備原型方法的物件

## 字元參考 (Character References)

用於特殊字元的 HTML 實體。

```html
&lt;    <!-- < -->
&gt;    <!-- > -->
&amp;   <!-- & -->
&quot;  <!-- " -->
&apos;  <!-- ' -->
&nbsp;  <!-- 不換行空格 -->
&copy;  <!-- © -->
&#8364; <!-- € -->
&#x20AC; <!-- € (十六進位) -->
```

## 資料 URL (Data URLs)

直接在 URL 中嵌入資料。

```html
<!-- 行內圖片 -->
<img src="data:image/png;base64,iVBORw0KGgoAAAANS..." alt="圖示">

<!-- 行內 SVG -->
<img src="data:image/svg+xml,%3Csvg xmlns='...'%3E...%3C/svg%3E" alt="標誌">

<!-- 行內 CSS -->
<link rel="stylesheet" href="data:text/css,body%7Bmargin:0%7D">
```

```javascript
// 從畫布 (Canvas) 建立資料 URL
const canvas = document.querySelector('canvas');
const dataURL = canvas.toDataURL('image/png');

// 從 Blob 建立資料 URL
const blob = new Blob(['Hello'], { type: 'text/plain' });
const reader = new FileReader();
reader.onload = () => {
  const dataURL = reader.result;
};
reader.readAsDataURL(blob);
```

## 逸出序列 (Escape Sequences)

```javascript
// 字串逸出
'It\'s a string'; // 單引號
"He said \"Hello\""; // 雙引號
'第 1 行\n第 2 行'; // 換行
'第 1 欄\t第 2 欄'; // 定位字元 (Tab)
'Path\\to\\file'; // 反斜線
```

## 資料結構 (Data Structures)

### 陣列 (Arrays)

有序集合：
```javascript
const arr = [1, 2, 3];
arr.push(4); // 新增至末尾
arr.pop(); // 從末尾移除
```

### 物件 (Objects)

鍵值對 (Key-value pairs)：
```javascript
const obj = { key: 'value' };
obj.newKey = 'new value';
delete obj.key;
```

### Map

鍵控集合（任何型別皆可作為鍵）：
```javascript
const map = new Map();
map.set('key', 'value');
map.set(obj, 'value');
map.get('key');
map.has('key');
map.delete('key');
```

### Set

唯一值：
```javascript
const set = new Set([1, 2, 2, 3]); // {1, 2, 3}
set.add(4);
set.has(2); // true
set.delete(1);
```

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- ASCII
- Base64
- 字元 (Character)
- 字元編碼 (Character encoding)
- 字元參考 (Character reference)
- 字元集 (Character set)
- 程式碼點 (Code point)
- 程式碼單元 (Code unit)
- 資料結構 (Data structure)
- 還原序列化 (Deserialization)
- 列舉 (Enumerated)
- 逸出字元 (Escape character)
- JSON
- JSON 型別表示 (JSON type representation)
- MIME
- MIME 類型 (MIME type)
- 百分比編碼 (Percent-encoding)
- 序列化 (Serialization)
- 可序列化物件 (Serializable object)
- Unicode
- URI
- URL
- URN
- UTF-8
- UTF-16

## 額外資源

- [JSON 規格](https://www.json.org/)
- [Unicode 標準](https://unicode.org/standard/standard.html)
- [MDN 字元編碼](https://developer.mozilla.org/en-US/docs/Glossary/Character_encoding)
- [MIME 類型 (MIME types)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
