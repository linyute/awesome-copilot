# JavaScript 參考

這是一份涵蓋 JavaScript 基礎、進階功能、DOM 操作、網路請求以及現代框架的全面參考。整合自 MDN Web Docs 和其他教育資源。

---

## 目錄

1. [什麼是 JavaScript？](#what-is-javascript)
2. [將 JavaScript 加入頁面](#adding-javascript-to-a-page)
3. [腳本載入策略](#script-loading-strategies)
4. [註解](#comments)
5. [變數](#variables)
6. [數字與數學](#numbers-and-math)
7. [字串](#strings)
8. [實用的字串方法](#useful-string-methods)
9. [陣列](#arrays)
10. [條件判斷式](#conditionals)
11. [迴圈](#loops)
12. [函式](#functions)
13. [建立自訂函式](#building-custom-functions)
14. [函式回傳值](#function-return-values)
15. [事件](#events)
16. [物件基礎](#object-basics)
17. [DOM 腳本操作](#dom-scripting)
18. [網路請求](#network-requests)
19. [使用 JSON](#working-with-json)
20. [JavaScript 框架：主要功能](#javascript-frameworks-main-features)
21. [React 入門](#getting-started-with-react)
22. [React 元件](#react-components)

---

## 什麼是 JavaScript？

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript>

JavaScript 是一種腳本或程式語言，可讓您在網頁上實現複雜的功能。它能實現動態內容更新、互動式地圖、動畫圖形、捲動影片播放器等功能。

### 網頁技術的三個層次

JavaScript 是標準網頁技術中的第三層：

- **HTML**：用於結構化網頁內容並賦予其意義的標記語言
- **CSS**：用於將樣式套用到 HTML 內容的樣式規則語言
- **JavaScript**：建立動態更新內容、控制多媒體和製作影像動畫的腳本語言

### JavaScript 可以做什麼？

核心 JavaScript 功能讓您可以：

- 在變數中**儲存有用的值**
- **對文字執行操作**（字串） -- 組合與操作文字
- **回應事件執行程式碼** -- 偵測使用者互動，如點擊、鍵盤輸入等
- 透過 DOM (文件物件模型) **存取與操作 HTML 和 CSS**

### 實務範例

```html
<button>玩家 1： Chris</button>
```

```javascript
function updateName() {
  const name = prompt("輸入新名稱");
  button.textContent = `玩家 1： ${name}`;
}

const button = document.querySelector("button");
button.addEventListener("click", updateName);
```

### 瀏覽器 API

應用程式介面 (API) 提供預先建立的程式碼建構區塊，可實現強大的功能：

| API | 描述 |
|-----|-------------|
| **DOM API** | 動態操作 HTML 和 CSS；建立、移除和變更 HTML 元件 |
| **Geolocation API** | 擷取地理資訊 |
| **Canvas 和 WebGL API** | 建立動畫 2D 和 3D 圖形 |
| **音訊和影片 API** | 在網頁中播放音訊和影片；從網路攝影機擷取影片 |

### 第三方 API

預設不內建於瀏覽器中；需要從網路取得程式碼：

- **Google Maps API**：將自訂地圖嵌入網站
- **OpenStreetMap API**：加入地圖功能
- **社群媒體 API**：在您的網站上顯示貼文

### JavaScript 如何執行

- JavaScript 依其出現順序**由上而下**執行
- 每個瀏覽器分頁都有自己獨立的執行環境
- **JavaScript 是解譯式語言**（雖然現代解譯器為了效能會使用即時編譯 (JIT)）
- **用戶端 JavaScript** 在使用者的電腦瀏覽器中執行
- **伺服器端 JavaScript** 在伺服器上執行（例如 Node.js 環境）
- **動態程式碼**根據情況更新顯示內容；**靜態程式碼**始終顯示相同的內容

---

## 將 JavaScript 加入頁面

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript>

### 1. 內部 JavaScript

使用 `<script>` 標籤直接在 HTML 檔案中加入 JavaScript：

```html
<body>
  <button>點擊我！</button>

  <script>
    function createParagraph() {
      const para = document.createElement("p");
      para.textContent = "您點擊了按鈕！";
      document.body.appendChild(para);
    }

    const buttons = document.querySelectorAll("button");
    for (const button of buttons) {
      button.addEventListener("click", createParagraph);
    }
  </script>
</body>
```

### 2. 外部 JavaScript (建議)

將 JavaScript 存放在獨立檔案中，以便更好地組織和重複使用：

**HTML 檔案：**

```html
<script type="module" src="script.js"></script>
```

**script.js 檔案：**

```javascript
function createParagraph() {
  const para = document.createElement("p");
  para.textContent = "您點擊了按鈕！";
  document.body.appendChild(para);
}

const buttons = document.querySelectorAll("button");
for (const button of buttons) {
  button.addEventListener("click", createParagraph);
}
```

### 3. 行內 JavaScript 處理常式 (不建議)

```html
<button onclick="createParagraph()">點擊我！</button>
```

避免使用行內處理常式，因為它們會將 JavaScript 混入 HTML、效率低下且難以維護。

### 比較

| 方法 | 位置 | 最適合 | 優點 | 缺點 |
|--------|----------|----------|------|------|
| **內部** | body 中的 `<script>` | 小型專案 | 簡單、獨立 | 無法重複使用 |
| **外部** | `<script src="">` | 大多數專案 | 可重複使用、有組織 | 需要 HTTP 伺服器 |
| **行內** | `onclick=""` | 不建議 | 快速測試 | 難以維護、污染 HTML |
| **模組** | `<script type="module">` | 現代專案 | 計時安全、有組織 | 需要 HTTP 伺服器 |

---

## 腳本載入策略

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript>

### 將 `<script>` 放在 Body 底部

```html
<body>
  <h1>我的頁面</h1>
  <p>此處為內容</p>
  <script src="script.js"></script>
</body>
```

### 在 `<head>` 中使用 `<script type="module">` (建議)

```html
<head>
  <script type="module" src="script.js"></script>
</head>
```

瀏覽器會等待所有 HTML 處理完畢後再執行。

### 使用 `defer` 屬性

```html
<head>
  <script defer src="script.js"></script>
</head>
```

腳本與 HTML 解析平行下載；僅在 HTML 完全解析後才執行。具有 `defer` 的腳本會依序執行。

### 使用 `async` 屬性（用於非相依腳本）

```html
<script async src="analytics.js"></script>
```

腳本平行下載並在準備就緒時立即執行。不保證執行順序。僅用於不依賴 DOM 元件的腳本。

### 將內部腳本包裝在 `DOMContentLoaded` 中

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const button = document.querySelector("button");
  button.addEventListener("click", updateName);
});
```

---

## 註解

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript>

### 單行註解

```javascript
// 這是單行註解
const name = "Chris"; // 也可以放在行端
```

### 多行註解

```javascript
/*
  這是多行註解。
  它可以跨越多行。
  對於較長的解釋很有用。
*/
```

### 最佳實作

- 使用註解解釋程式碼**為什麼**這樣做，而不是解釋它**做了什麼**
- 變數名稱應直觀 -- 不要對顯而易見的操作加上註解
- 註解通常越多越好，但避免過度
- 隨著程式碼變更，保持註解最新

---

## 變數

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Variables>

變數是**值的容器**，例如數字或字串。變數至關重要，因為它們讓您的程式碼能夠記住並操作資料。

### 宣告變數

使用 **`let`** 關鍵字建立變數：

```javascript
let myName;
let myAge;
```

宣告後，變數即存在但沒有值 (`undefined`)。

### 初始化變數

使用等號 (`=`) 指派值：

```javascript
myName = "Chris";
myAge = 37;
```

或同時進行宣告與初始化：

```javascript
let myDog = "Rover";
```

### 變數類型

**數字：**

```javascript
let myAge = 17;           // 整數
let temperature = 98.6;   // 浮點數
```

**字串：**

```javascript
let dolphinGoodbye = "So long and thanks for all the fish";
```

**布林值：**

```javascript
let iAmAlive = true;
let test = 6 < 3;  // 回傳 false
```

**陣列：**

```javascript
let myNameArray = ["Chris", "Bob", "Jim"];
let myNumberArray = [10, 15, 40];
myNameArray[0];    // "Chris" (從零開始索引)
myNumberArray[2];  // 40
```

**物件：**

```javascript
let dog = { name: "Spot", breed: "Dalmatian" };
dog.name;  // "Spot"
```

### 變數命名規則

- 僅使用拉丁字元 (0-9, a-z, A-Z) 和底線
- 使用**小駱駝拼寫法 (lower camel case)**：`myAge`, `initialColor`, `finalOutputValue`
- 使名稱直觀且具描述性
- 變數區分大小寫：`myage` 與 `myAge` 不同
- 不要以底線或數字開頭
- 不要使用保留關鍵字 (`var`, `function`, `let`, etc.)

### 動態型別

JavaScript 是**動態型別**的 -- 您不需要宣告變數型別。變數型別由指派的值決定：

```javascript
let myString = "Hello";
typeof myString;           // "string"

let myNumber = "500";
typeof myNumber;           // "string"

myNumber = 500;
typeof myNumber;           // "number"
```

### 使用 `const` 定義常數

對於不應變更的值，請使用 **`const`**：

```javascript
const myDog = "Rover";
myDog = "Fido";  // 錯誤： 無法重新指派
```

對於物件，即使使用 `const`，您仍可修改其屬性：

```javascript
const bird = { species: "Kestrel" };
bird.species = "Striated Caracara";  // 正常 - 修改內容
```

### `let` vs `const` vs `var`

| 功能 | `let` | `const` | `var` |
|---------|-------|---------|-------|
| 可重新指派 | 是 | 否 | 是 |
| 必須初始化 | 否 | 是 | 否 |
| 作用域 | 區塊 (Block) | 區塊 (Block) | 函式 (Function) |
| 提升 (Hoisting) 問題 | 否 | 否 | 是 |

**最佳實作：** 盡可能使用 `const`，需要重新指派時才使用 `let`。在現代 JavaScript 中應避免使用 `var`。

---

## 數字與數學

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Math>

### 數字類型

- **整數 (Integers)**：不含小數部分的數字（例如 10, 400, -5）
- **浮點數 (Floating Point Numbers, Floats)**：含有小數點的數字（例如 12.5, 56.7786543）
- JavaScript 僅有一種數字資料類型：`Number`（加上用於極大整數的 `BigInt`）

### 算術運算子

| 運算子 | 名稱 | 範例 | 結果 |
|----------|------|---------|--------|
| `+` | 加法 | `6 + 9` | `15` |
| `-` | 減法 | `20 - 15` | `5` |
| `*` | 乘法 | `3 * 7` | `21` |
| `/` | 除法 | `10 / 5` | `2` |
| `%` | 餘數 (Modulo) | `8 % 3` | `2` |
| `**` | 指數 | `5 ** 2` | `25` |

```javascript
const num1 = 10;
const num2 = 50;
9 * num1;      // 90
num1 ** 3;     // 1000
num2 / num1;   // 5
```

### 運算子優先順序

1. **乘法與除法**優先執行（由左至右）
2. **加法與減法**隨後執行（由左至右）

```javascript
num2 + num1 / 8 + 2;        // = 53.25  (50 + 1.25 + 2)
(num2 + num1) / (8 + 2);    // = 6      (60 / 10)
```

### 遞增與遞減運算子

```javascript
let num1 = 4;
num1++;     // 傳回 4，然後遞增為 5
++num1;     // 先遞增，然後傳回 6

let num2 = 6;
num2--;     // 傳回 6，然後遞減為 5
--num2;     // 先遞減，然後傳回 4
```

### 指派運算子

| 運算子 | 範例 | 等同於 |
|----------|---------|------------|
| `+=` | `x += 4;` | `x = x + 4;` |
| `-=` | `x -= 3;` | `x = x - 3;` |
| `*=` | `x *= 3;` | `x = x * 3;` |
| `/=` | `x /= 5;` | `x = x / 5;` |

### 比較運算子

| 運算子 | 名稱 | 範例 | 結果 |
|----------|------|---------|--------|
| `===` | 嚴格相等 | `5 === 2 + 3` | `true` |
| `!==` | 嚴格不相等 | `5 !== 2 + 3` | `false` |
| `<` | 小於 | `10 < 6` | `false` |
| `>` | 大於 | `10 > 20` | `false` |
| `<=` | 小於或等於 | `3 <= 2` | `false` |
| `>=` | 大於或等於 | `5 >= 4` | `true` |

請務必使用 `===` 和 `!==`（嚴格版本）而非 `==` 和 `!=`。

### 實用的數字方法

```javascript
// 四捨五入至小數點後幾位
const lotsOfDecimal = 1.7665849587;
lotsOfDecimal.toFixed(2);  // "1.77"

// 將字串轉換為數字
let myNumber = "74";
myNumber = Number(myNumber) + 3;  // 77

// 檢查資料類型
typeof 5;      // "number"
typeof 6.667;  // "number"

// Math 物件方法
Math.random();           // 0 到 1 之間的隨機數
Math.floor(2.9);         // 2 (無條件捨去)
Math.ceil(2.1);          // 3 (無條件進位)
Math.pow(5, 2);          // 25 (5 的 2 次方)
```

---

## 字串

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Strings>

### 建立字串

字串必須用引號包圍：

```javascript
const single = '單引號';
const double = "雙引號";
const backtick = `反引號`;
```

字串的開頭和結尾必須使用相同的字元。

### 範本字面值 (Template Literals)

範本字面值（用反引號包圍的字串）有兩項特殊功能：

**1. 嵌入 JavaScript 表達式：**

```javascript
const name = "Chris";
const greeting = `哈囉, ${name}`;
console.log(greeting); // "哈囉, Chris"

const song = "Fight the Youth";
const score = 9;
const highestScore = 10;
const output = `我喜歡這首歌 ${song}。我給它的分數是 ${
  (score / highestScore) * 100
}%。`;
// "我喜歡這首歌 Fight the Youth。我給它的分數是 90%。"
```

**2. 多行字串：**

```javascript
const newline = `終有一天您終於明瞭
您必須做什麼，並開始著手，`;
```

若使用一般字串，請使用 `\n` 換行：

```javascript
const newline2 = "終有一天您終於明瞭\n您必須做什麼，並開始著手，";
```

### 字串串接

```javascript
// 使用 + 運算子
const greeting = "Hello" + ", " + "Bob";  // "Hello, Bob"

// 使用範本字面值 (建議)
const name = "Ramesh";
console.log(`您好, ${name}`);  // "您好, Ramesh"
```

### 轉義字元

```javascript
const bigmouth = 'I've got no right to take my place...';
```

---

## 實用的字串方法

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Useful_string_methods>

### 尋找字串長度

```javascript
const browserType = "mozilla";
browserType.length;  // 7
```

### 擷取字元

```javascript
browserType[0];                          // "m" (第一個字元)
browserType[browserType.length - 1];     // "a" (最後一個字元)
```

### 測試子字串

```javascript
const browserType = "mozilla";

browserType.includes("zilla");     // true
browserType.startsWith("zilla");   // false
browserType.endsWith("zilla");     // true
```

### 尋找子字串的位置

```javascript
const tagline = "MDN - Resources for developers, by developers";
tagline.indexOf("developers");     // 20
tagline.indexOf("x");             // -1 (未找到)

// 尋找後續出現的位置
const first = tagline.indexOf("developers");           // 20
const second = tagline.indexOf("developers", first + 1); // 35
```

### 擷取子字串

```javascript
const browserType = "mozilla";
browserType.slice(1, 4);  // "ozi"
browserType.slice(2);     // "zilla" (從索引 2 到結尾)
```

### 變更大小寫

```javascript
const radData = "My NaMe Is MuD";
radData.toLowerCase();  // "my name is mud"
radData.toUpperCase();  // "MY NAME IS MUD"
```

### 取代字串的部分內容

```javascript
// 取代第一次出現的位置
const browserType = "mozilla";
const updated = browserType.replace("moz", "van");  // "vanilla"

// 取代所有出現的位置
let quote = "To be or not to be";
quote = quote.replaceAll("be", "code");  // "To code or not to code"
```

**重要：** 字串方法會傳回新字串；除非您重新指派，否則它們不會修改原始字串。

---

## 陣列

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Arrays>

### 建立陣列

```javascript
const shopping = ["吐司", "牛奶", "起司", "鷹嘴豆泥", "麵條"];
const sequence = [1, 1, 2, 3, 5, 8, 13];
const random = ["樹", 795, [0, 1, 2]];  // 允許混合類型
```

### 尋找陣列長度

```javascript
shopping.length;  // 5
```

### 存取與修改項目

```javascript
shopping[0];           // "吐司" (從零開始索引)
shopping[0] = "芝麻醬"; // 修改第一個項目

// 多維陣列
const random = ["樹", 795, [0, 1, 2]];
random[2][2];  // 2
```

### 尋找項目的索引

```javascript
const birds = ["鸚鵡", "隼", "貓頭鷹"];
birds.indexOf("貓頭鷹");     // 2
birds.indexOf("兔子");  // -1 (未找到)
```

### 加入項目

```javascript
const cities = ["曼徹斯特", "利物浦"];

// 加入到末尾
cities.push("加地夫");
cities.push("布萊德福", "布萊頓");  // 加入多個項目

// 加入到開頭
cities.unshift("愛丁堡");
```

### 移除項目

```javascript
const cities = ["曼徹斯特", "利物浦", "愛丁堡", "卡萊爾"];

// 從末尾移除
cities.pop();       // 傳回移除的項目

// 從開頭移除
cities.shift();     // 傳回移除的項目

// 從特定索引移除
const index = cities.indexOf("利物浦");
if (index !== -1) {
  cities.splice(index, 1);    // 移除該索引處的 1 個項目
}
cities.splice(index, 2);      // 從該索引開始移除 2 個項目
```

### 逐一查看陣列 (Iterating)

**for...of 迴圈：**

```javascript
const birds = ["鸚鵡", "隼", "貓頭鷹"];
for (const bird of birds) {
  console.log(bird);
}
```

**map() -- 轉換項目：**

```javascript
const numbers = [5, 2, 7, 6];
const doubled = numbers.map(number => number * 2);
// [10, 4, 14, 12]
```

**filter() -- 選取相符項目：**

```javascript
const cities = ["倫敦", "利物浦", "托特尼斯", "愛丁堡"];
const longer = cities.filter(city => city.length > 8);
// ["利物浦", "愛丁堡"]
```

### 字串與陣列之間的轉換

```javascript
// 字串轉陣列
const data = "曼徹斯特,倫敦,利物浦";
const cities = data.split(",");
// ["曼徹斯特", "倫敦", "利物浦"]

// 陣列轉字串
const commaSeparated = cities.join(",");
// "曼徹斯特,倫敦,利物浦"

// 簡單的 toString (一律使用逗號)
const dogNames = ["Rocket", "Flash", "Bella"];
dogNames.toString();  // "Rocket,Flash,Bella"
```

---

## 條件判斷式

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Conditionals>

### if...else 語句

```javascript
if (條件) {
  /* 條件為真時執行的程式碼 */
} else {
  /* 否則執行其他程式碼 */
}
```

### else if 語句

```javascript
if (choice === "sunny") {
  para.textContent = "穿短褲吧！";
} else if (choice === "rainy") {
  para.textContent = "帶上雨衣。";
} else if (choice === "snowing") {
  para.textContent = "冷死了！";
} else {
  para.textContent = "";
}
```

### 邏輯運算子

**AND (`&&`) -- 所有條件皆須為真：**

```javascript
if (choice === "sunny" && temperature < 86) {
  para.textContent = "天氣晴朗。去海邊吧！";
}
```

**OR (`||`) -- 至少一個條件為真：**

```javascript
if (iceCreamVanOutside || houseStatus === "on fire") {
  console.log("您應該趕快離開房子。");
}
```

**NOT (`!`) -- 反轉表達式的值：**

```javascript
if (!(iceCreamVanOutside || houseStatus === "on fire")) {
  console.log("那可能應該待在裡面。");
}
```

**常見錯誤：**

```javascript
// 錯誤 - 一律會評估為真
if (x === 5 || 7 || 10 || 20) { }

// 正確
if (x === 5 || x === 7 || x === 10 || x === 20) { }
```

### Switch 語句

```javascript
switch (choice) {
  case "sunny":
    para.textContent = "穿短褲吧！";
    break;
  case "rainy":
    para.textContent = "帶上雨衣。";
    break;
  case "snowing":
    para.textContent = "冷死了！";
    break;
  default:
    para.textContent = "";
}
```

### 三元運算子

```javascript
const greeting = isBirthday
  ? "史密斯太太生日快樂！"
  : "史密斯太太早安。";
```

---

## 迴圈

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Loops>

### for...of 迴圈

用於逐一查看集合：

```javascript
const cats = ["豹", "藪貓", "美洲豹", "老虎"];
for (const cat of cats) {
  console.log(cat);
}
```

### 標準 for 迴圈

```javascript
for (let i = 1; i < 10; i++) {
  console.log(`${i} x ${i} = ${i * i}`);
}
```

組成部分： **初始化程式 (initializer)** (`let i = 1`)、**條件 (condition)** (`i < 10`)、**最終表達式 (final-expression)** (`i++`)。

### 使用 for 迴圈逐一查看陣列

```javascript
const cats = ["豹", "藪貓", "美洲豹"];
for (let i = 0; i < cats.length; i++) {
  console.log(cats[i]);
}
```

### while 迴圈

```javascript
let i = 0;
while (i < cats.length) {
  console.log(cats[i]);
  i++;
}
```

### do...while 迴圈

程式碼會**至少執行一次**，然後檢查條件：

```javascript
let i = 0;
do {
  console.log(cats[i]);
  i++;
} while (i < cats.length);
```

### break 與 continue

**break -- 立即結束迴圈：**

```javascript
for (const contact of contacts) {
  const splitContact = contact.split(":");
  if (splitContact[0].toLowerCase() === searchName) {
    console.log(`${splitContact[0]} 的號碼是 ${splitContact[1]}。`);
    break;
  }
}
```

**continue -- 跳到下一次迭代：**

```javascript
for (let i = 1; i <= num; i++) {
  let sqRoot = Math.sqrt(i);
  if (Math.floor(sqRoot) !== sqRoot) {
    continue;  // 跳過非完全平方數
  }
  console.log(i);
}
```

### 該使用哪種迴圈類型？

| 迴圈類型 | 最適合 |
|-----------|----------|
| `for...of` | 當您不需要索引時逐一查看集合 |
| `for` | 通用迴圈；完全控制迭代過程 |
| `while` | 當在迴圈前初始化較為合適時 |
| `do...while` | 當程式碼必須至少執行一次時 |
| `map()` | 轉換陣列項目 |
| `filter()` | 選取特定的陣列項目 |

**警告：** 務必確保迴圈會結束。無限迴圈會導致瀏覽器當機。

---

## 函式

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Functions>

### 什麼是函式？

函式是執行單一任務的**可重複使用程式碼區塊**。它們讓您能將程式碼儲存在定義好的區塊中，並在需要時隨時呼叫。

### 內建瀏覽器函式

```javascript
const myText = "我是一個字串";
const newString = myText.replace("字串", "香腸");  // "我是一個香腸"

const myArray = ["我", "愛", "巧克力", "青蛙"];
const madeAString = myArray.join(" ");  // "我 愛 巧克力 青蛙"

const myNumber = Math.random();  // 0 到 1 之間的隨機數
```

### Custom Functions

```javascript
function myFunction() {
  alert("哈囉");
}

myFunction();  // 呼叫函式
```

### 函式參數與預設參數

```javascript
function hello(name = "Chris") {
  console.log(`哈囉 ${name}！`);
}

hello("Ari");  // "哈囉 Ari！"
hello();       // "哈囉 Chris！"
```

### 匿名函式

沒有名稱的函式，通常作為參數傳遞：

```javascript
textBox.addEventListener("keydown", function (event) {
  console.log(`您按下了 "${event.key}"。`);
});
```

### 箭頭函式 (Arrow Functions)

使用 `=>` 的現代語法：

```javascript
// 完整語法
textBox.addEventListener("keydown", (event) => {
  console.log(`您按下了 "${event.key}"。`);
});

// 單一參數 - 括號可選
textBox.addEventListener("keydown", event => {
  console.log(`您按下了 "${event.key}"。`);
});

// 單一回傳語句 - 隱含回傳
const originals = [1, 2, 3];
const doubled = originals.map(item => item * 2);  // [2, 4, 6]
```

### 函式作用域 (Scope)

函式內部的變數被鎖定在**函式作用域**中，無法從外部存取：

```javascript
const x = 1;        // 全域作用域 - 處處可存取

function myFunc() {
  const y = 2;      // 函式作用域 - 僅在 myFunc 內部
  console.log(x);   // 可以存取全域 x
}

console.log(x);     // 可以存取全域 x
console.log(y);     // 參照錯誤： y 未定義
```

### 區塊作用域 (let/const)

```javascript
if (x === 1) {
  const c = 4;      // 區塊作用域
}
console.log(c);     // 參照錯誤： c 未定義
```

---

## 建立自訂函式

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Build_your_own_function>

### 函式結構

```javascript
function displayMessage() {
  // 函式主體程式碼放在此處
}
```

關鍵組成部分：

- `function` 關鍵字宣告函式定義
- 函式名稱遵循變數命名慣例
- 括號 `()` 存放參數
- 大括號 `{}` 包含呼叫時執行的程式碼

### 完整實務範例

```javascript
function displayMessage(msgText, msgType) {
  const body = document.body;

  const panel = document.createElement("div");
  panel.setAttribute("class", "msgBox");
  body.appendChild(panel);

  const msg = document.createElement("p");
  msg.textContent = msgText;
  panel.appendChild(msg);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "x";
  panel.appendChild(closeBtn);

  closeBtn.addEventListener("click", () => body.removeChild(panel));

  if (msgType === "warning") {
    msg.style.backgroundImage = 'url("icons/warning.png")';
    panel.style.backgroundColor = "red";
  } else if (msgType === "chat") {
    msg.style.backgroundImage = 'url("icons/chat.png")';
    panel.style.backgroundColor = "aqua";
  } else {
    msg.style.paddingLeft = "20px";
  }
}
```

### 呼叫函式

```javascript
// 直接呼叫
displayMessage("您的收件匣快滿了", "warning");

// 作為事件處理常式 (無括號)
btn.addEventListener("click", displayMessage);

// 透過匿名函式傳遞參數
btn.addEventListener("click", () =>
  displayMessage("喔喔，這是不同的訊息！"),
);
```

**重要：** 將函式作為回呼傳遞時，請勿包含括號：

```javascript
btn.addEventListener("click", displayMessage);    // 正確
btn.addEventListener("click", displayMessage());  // 錯誤 - 會立即呼叫
```

### 參數 (Parameters) vs 引數 (Arguments)

- **參數**是函式定義中的具名變數
- **引數**是呼叫函式時傳遞的實際數值

---

## 函式回傳值

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Return_values>

### 什麼是回傳值？

回傳值是函式執行完畢後傳回的數值。

```javascript
const myText = "天氣很冷";
const newString = myText.replace("冷", "熱");  // "天氣很熱"
```

### 使用 return 關鍵字

```javascript
function random(number) {
  return Math.floor(Math.random() * number);
}
```

當呼叫函式時，回傳值會**取代函式呼叫本身**：

```javascript
ctx.arc(random(WIDTH), random(HEIGHT), random(50), 0, 2 * Math.PI);
// 若 random() 呼叫傳回 500, 200, 35：
ctx.arc(500, 200, 35, 0, 2 * Math.PI);
```

### 建立具有回傳值的函式

```javascript
function squared(num) {
  return num * num;
}

function cubed(num) {
  return num * num * num;
}

function factorial(num) {
  if (num < 0) return undefined;
  if (num === 0) return 1;
  let x = num - 1;
  while (x > 1) {
    num *= x;
    x--;
  }
  return num;
}
```

### 使用回傳值

```javascript
input.addEventListener("change", () => {
  const num = parseFloat(input.value);
  if (isNaN(num)) {
    para.textContent = "您需要輸入一個數字！";
  } else {
    para.textContent = `${num} 的平方是 ${squared(num)}。 `;
    para.textContent += `${num} 的立方是 ${cubed(num)}。 `;
    para.textContent += `${num} 的階乘是 ${factorial(num)}。 `;
  }
});
```

| 概念 | 描述 |
|---------|-------------|
| **return 關鍵字** | 傳回一個值並立即結束函式 |
| **無回傳值** | 未明確回傳值的函式會傳回 `undefined` |
| **變數儲存** | 回傳值可以儲存在變數中供稍後使用 |

---

## 事件 (Events)

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events>

### 什麼是事件？

事件是瀏覽器在發生重大事情時發出的訊號。它們讓您的程式碼能對使用者互動和系統活動做出反應。

### 使用 addEventListener() (建議)

```javascript
const btn = document.querySelector("button");

function random(number) {
  return Math.floor(Math.random() * (number + 1));
}

btn.addEventListener("click", () => {
  const rndCol = `rgb(${random(255)} ${random(255)} ${random(255)})`;
  document.body.style.backgroundColor = rndCol;
});
```

### 使用具名函式

```javascript
function changeBackground() {
  const rndCol = `rgb(${random(255)} ${random(255)} ${random(255)})`;
  document.body.style.backgroundColor = rndCol;
}

btn.addEventListener("click", changeBackground);
```

### 移除事件接聽程式

```javascript
btn.removeEventListener("click", changeBackground);
```

### 加入多個接聽程式

```javascript
myElement.addEventListener("click", functionA);
myElement.addEventListener("click", functionB);
// 當點擊元件時，兩個函式都會執行
```

### 常見事件類型

| 事件 | 描述 |
|-------|-------------|
| `click` | 使用者點擊元件 |
| `dblclick` | 使用者按兩下元件 |
| `focus` | 元件獲得焦點 |
| `blur` | 元件失去焦點 |
| `mouseover` | 滑鼠指標移至元件上方 |
| `mouseout` | 滑鼠指標離開元件 |
| `keydown` | 使用者按下按鍵 |
| `submit` | 表單已提交 |
| `play` | 媒體開始播放 |
| `pause` | 媒體已暫停 |

### 事件物件 (Event Objects)

事件處理函式會自動接收一個**事件物件**：

```javascript
function bgChange(e) {
  const rndCol = `rgb(${random(255)} ${random(255)} ${random(255)})`;
  e.target.style.backgroundColor = rndCol;
}

btn.addEventListener("click", bgChange);
```

**鍵盤事件：**

```javascript
const textBox = document.querySelector("#textBox");
const output = document.querySelector("#output");

textBox.addEventListener("keydown", (event) => {
  output.textContent = `您按下了 "${event.key}"。`;
});
```

### 防止預設行為

```javascript
const form = document.querySelector("form");
const fname = document.getElementById("fname");
const lname = document.getElementById("lname");

form.addEventListener("submit", (e) => {
  if (fname.value === "" || lname.value === "") {
    e.preventDefault();
    para.textContent = "您需要填寫兩個名字！";
  }
});
```

### 事件處理常式屬性 (不建議用於多個處理常式)

```javascript
btn.onclick = () => {
  document.body.style.backgroundColor = rndCol;
};
```

無法加入多個接聽程式 -- 後續的指派會覆蓋先前的指派。

---

## 物件基礎

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Object_basics>

### 什麼是物件？

物件是相關資料和/或功能的集合，由以下部分組成：

- **屬性 (Properties)**：物件內部的變數（資料）
- **方法 (Methods)**：物件內部的函式（功能）

### 物件字面值 (Object Literal) 語法

```javascript
const person = {
  name: ["Bob", "Smith"],
  age: 32,
  bio() {
    console.log(`${this.name[0]} ${this.name[1]} 今年 ${this.age} 歲。`);
  },
  introduceSelf() {
    console.log(`嗨！ 我是 ${this.name[0]}。`);
  },
};
```

### 點記法 (Dot Notation)

```javascript
person.age;           // 32
person.bio();         // 呼叫方法
person.name.first;    // 存取巢狀屬性
```

### 括號記法 (Bracket Notation)

```javascript
person["age"];              // 32
person["name"]["first"];    // 巢狀存取

// 當屬性名稱儲存在變數中時
function logProperty(propertyName) {
  console.log(person[propertyName]);
}
logProperty("name");  // ["Bob", "Smith"]
```

### 設定物件成員

```javascript
// 更新現有屬性
person.age = 45;

// 建立新屬性
person["eyes"] = "hazel";
person.farewell = function () {
  console.log("大家再見！");
};

// 動態屬性建立 (僅限括號記法)
const myDataName = "height";
const myDataValue = "1.75m";
person[myDataName] = myDataValue;
```

### 什麼是 "this"？

`this` 關鍵字指的**是目前執行程式碼所在的物件**：

```javascript
const person1 = {
  name: "Chris",
  introduceSelf() {
    console.log(`嗨！ 我是 ${this.name}。`);
  },
};

const person2 = {
  name: "Deepti",
  introduceSelf() {
    console.log(`嗨！ 我是 ${this.name}。`);
  },
};

person1.introduceSelf();  // "嗨！ 我是 Chris。"
person2.introduceSelf();  // "嗨！ 我是 Deepti。"
```

### 建構子 (Constructors)

使用 `new` 關鍵字呼叫並建立新物件的函式：

```javascript
function Person(name) {
  this.name = name;
  this.introduceSelf = function () {
    console.log(`嗨！ 我是 ${this.name}。`);
  };
}

const salva = new Person("Salva");
salva.introduceSelf();  // "嗨！ 我是 Salva。"

const frankie = new Person("Frankie");
frankie.introduceSelf();  // "嗨！ 我是 Frankie。"
```

---

## DOM 腳本操作

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting>

### 什麼是 DOM？

**文件物件模型 (Document Object Model, DOM)** 是瀏覽器建立的一種樹狀結構表示法，讓程式語言能存取 HTML。樹中的每個項目稱為**節點 (node)**。

### DOM 樹關係

- **根節點 (Root node)**：頂層節點（`HTML` 元件）
- **父節點 (Parent node)**：內部包含其他節點的節點
- **子節點 (Child node)**：直接位於另一個節點內部的節點
- **同層節點 (Sibling nodes)**：位於同一個父節點下的同一層級節點
- **後代節點 (Descendant node)**：位於另一個節點內部任何位置的節點

### 選取元件

```javascript
// querySelector - 選取第一個相符項 (建議)
const link = document.querySelector("a");
const element = document.querySelector("#myId");
const element = document.querySelector(".myClass");

// querySelectorAll - 選取所有相符項 (傳回 NodeList)
const paragraphs = document.querySelectorAll("p");

// 舊式方法
const elementRef = document.getElementById('myId');
const elementRefArray = document.getElementsByTagName('p');
```

### 建立與插入元件

```javascript
const para = document.createElement("p");
para.textContent = "希望您喜歡這次體驗。";

const sect = document.querySelector("section");
sect.appendChild(para);

// 建立文字節點
const text = document.createTextNode(" -- 頂尖的來源。");
const linkPara = document.querySelector("p");
linkPara.appendChild(text);
```

### 移動與移除元件

```javascript
// 移動 (在現有元件上使用 appendChild 會移動它)
sect.appendChild(linkPara);

// 複製
const clone = linkPara.cloneNode();       // 淺複製
const deepClone = linkPara.cloneNode(true); // 深複製

// 移除
sect.removeChild(linkPara);               // 使用父代
linkPara.remove();                        // 現代方法
linkPara.parentNode.removeChild(linkPara); // 舊版瀏覽器
```

### 操作內容

```javascript
// textContent - 僅限純文字 (較安全)
link.textContent = "Mozilla 開發者網路";

// innerHTML - 會解析 HTML (請謹慎使用)
element.innerHTML = "<span>新內容</span>";
```

### 操作屬性

```javascript
link.href = "https://developer.mozilla.org";
element.getAttribute("class");
element.setAttribute("class", "newClass");
element.removeAttribute("id");
```

### 操作樣式

**方法 1：行內樣式：**

```javascript
para.style.color = "white";
para.style.backgroundColor = "black";
para.style.padding = "10px";
para.style.width = "250px";
para.style.textAlign = "center";
```

注意： CSS 帶連字號的屬性在 JavaScript 中會變為小駱駝拼寫法 (`background-color` 變為 `backgroundColor`)。

**方法 2：CSS 類別 (建議)：**

```javascript
para.classList.add("highlight");
para.classList.remove("highlight");
para.classList.toggle("highlight");
```

### 完整實務範例：動態購物清單

```html
<h1>我的購物清單</h1>
<form>
  <label for="item">輸入新項目：</label>
  <input type="text" name="item" id="item" />
  <button>加入項目</button>
</form>
<ul></ul>
```

```javascript
const list = document.querySelector("ul");
const input = document.querySelector("input");
const button = document.querySelector("button");

button.addEventListener("click", (event) => {
  event.preventDefault();

  const myItem = input.value;
  input.value = "";

  const listItem = document.createElement("li");
  const listText = document.createElement("span");
  const listBtn = document.createElement("button");

  listItem.appendChild(listText);
  listText.textContent = myItem;
  listItem.appendChild(listBtn);
  listBtn.textContent = "刪除";
  list.appendChild(listItem);

  listBtn.addEventListener("click", () => {
    list.removeChild(listItem);
  });

  input.focus();
});
```

### 關鍵瀏覽器物件

| 物件 | 描述 |
|--------|-------------|
| `window` | 代表瀏覽器分頁 |
| `document` | 載入於視窗中的頁面 |
| `navigator` | 瀏覽器狀態與識別 |

---

## 網路請求

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Network_requests>

### Fetch API

現代 JavaScript 的主要 API，用於從伺服器擷取資源，且無需重新載入整個頁面。

### 基本語法

```javascript
fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP 錯誤： ${response.status}`);
    }
    return response.text();
  })
  .then((data) => {
    // 使用資料
  })
  .catch((error) => {
    console.error(`擷取問題： ${error.message}`);
  });
```

### 擷取文字內容

```javascript
function updateDisplay(verse) {
  verse = verse.replace(" ", "").toLowerCase();
  const url = `${verse}.txt`;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP 錯誤： ${response.status}`);
      }
      return response.text();
    })
    .then((text) => {
      poemDisplay.textContent = text;
    })
    .catch((error) => {
      poemDisplay.textContent = `無法擷取詩句： ${error}`;
    });
}
```

### 擷取 JSON 資料

```javascript
fetch("products.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP 錯誤： ${response.status}`);
    }
    return response.json();
  })
  .then((json) => initialize(json))
  .catch((err) => console.error(`擷取問題： ${err.message}`));
```

### 擷取二進位資料 (Blob)

```javascript
fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP 錯誤： ${response.status}`);
    }
    return response.blob();
  })
  .then((blob) => showProduct(blob, product))
  .catch((err) => console.error(`擷取問題： ${err.message}`));
```

### 核心回應方法

| 方法 | 使用案例 |
|--------|----------|
| `response.text()` | 純文字檔案 |
| `response.json()` | JSON 物件/陣列 |
| `response.blob()` | 二進位資料（影像、影片） |

### 錯誤處理

```javascript
.then((response) => {
  if (!response.ok) {
    throw new Error(`HTTP 錯誤： ${response.status}`);
  }
  return response.json();
})
.catch((error) => {
  console.error(`擷取問題： ${error.message}`);
});
```

**重要**：`fetch()` 僅在網路失敗時拒絕 (reject)，而非 HTTP 錯誤狀態 (404, 500)。務必檢查 `response.ok` 或 `response.status`。

### XMLHttpRequest (舊式替代方案)

```javascript
const request = new XMLHttpRequest();

try {
  request.open("GET", "products.json");
  request.responseType = "json";

  request.addEventListener("load", () => {
    initialize(request.response);
  });
  request.addEventListener("error", () => {
    console.error("XHR 錯誤");
  });

  request.send();
} catch (error) {
  console.error(`XHR 錯誤 ${request.status}`);
}
```

Fetch 較簡單，建議優先於 XMLHttpRequest 使用。

---

## 使用 JSON

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON>

### 什麼是 JSON？

**JSON (JavaScript 物件標記法, JavaScript Object Notation)** 是一種以 JavaScript 物件語法為基礎，用於表示結構化資料的標準文字格式，常用於網頁應用程式中的資料傳輸。

- 將字串轉換為原生物件稱為**反序列化 (deserialization)**
- 將原生物件轉換為字串稱為**序列化 (serialization)**
- JSON 檔案使用 `.json` 副檔名和 `application/json` MIME 類型

### JSON 結構

```json
{
  "squadName": "超級英雄小隊",
  "homeTown": "大都會市",
  "formed": 2016,
  "secretBase": "超級塔",
  "active": true,
  "members": [
    {
      "name": "分子人",
      "age": 29,
      "secretIdentity": "丹 · 裘克斯",
      "powers": ["抗輻射能力", "身體縮小", "輻射射線"]
    }
  ]
}
```

### 有效的 JSON 資料類型

- 字串字面值、數字字面值、`true`、`false`、`null`
- 包含有效 JSON 類型的物件和陣列

**在 JSON 中無效的類型：**

- `undefined`, `NaN`, `Infinity`
- 函式或物件類型，如 `Date`, `Set`, `Map`
- 單引號（必須使用雙引號）
- 結尾逗號
- 註解

### 存取 JSON 資料

```javascript
superHeroes.homeTown;                    // "大都會市"
superHeroes.members[1].powers[2];        // 第二位英雄的第三種能力
superHeroes[0].powers[0];               // 用於頂層陣列
```

### JSON.parse() -- 字串轉物件

```javascript
const jsonString = '{"name":"John","age":30}';
const obj = JSON.parse(jsonString);
console.log(obj.name);  // "John"
```

### JSON.stringify() -- 物件轉字串

```javascript
let myObj = { name: "Chris", age: 38 };
let myString = JSON.stringify(myObj);
console.log(myString);  // '{"name":"Chris","age":38}'
```

### 完整範例：擷取與顯示 JSON

```javascript
async function populate() {
  const requestURL =
    "https://mdn.github.io/learning-area/javascript/oojs/json/superheroes.json";
  const request = new Request(requestURL);

  const response = await fetch(request);
  const superHeroes = await response.json();

  populateHeader(superHeroes);
  populateHeroes(superHeroes);
}

function populateHeader(obj) {
  const header = document.querySelector("header");
  const myH1 = document.createElement("h1");
  myH1.textContent = obj.squadName;
  header.appendChild(myH1);

  const myPara = document.createElement("p");
  myPara.textContent = `家鄉： ${obj.homeTown} // 成立年份： ${obj.formed}`;
  header.appendChild(myPara);
}

function populateHeroes(obj) {
  const section = document.querySelector("section");
  const heroes = obj.members;

  for (const hero of heroes) {
    const myArticle = document.createElement("article");
    const myH2 = document.createElement("h2");
    myH2.textContent = hero.name;
    myArticle.appendChild(myH2);

    const myPara = document.createElement("p");
    myPara.textContent = `秘密身分： ${hero.secretIdentity}`;
    myArticle.appendChild(myPara);

    section.appendChild(myArticle);
  }
}

populate();
```

---

## JavaScript 框架：主要功能

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Main_features>

### 領域特定語言 (DSL)

**JSX (JavaScript 和 XML)：**

```jsx
const subject = "World";
const header = (
  <header>
    <h1>Hello, {subject}!</h1>
  </header>
);
```

編譯為：

```javascript
const header = React.createElement(
  "header",
  null,
  React.createElement("h1", null, "Hello, ", subject, "!"),
);
```

**Handlebars (Ember)：**

```handlebars
<header>
  <h1>Hello, {{subject}}!</h1>
</header>
```

**TypeScript (Angular)：**

```typescript
function add(a: number, b: number) {
  return a + b;
}
```

### 元件 Props 與狀態 (State)

**Props (外部資料)：**

```jsx
function AuthorCredit(props) {
  return (
    <figure>
      <img src={props.src} alt={props.alt} />
      <figcaption>{props.byline}</figcaption>
    </figure>
  );
}

<AuthorCredit
  src="./assets/zelda.png"
  alt="Portrait of Zelda Schiff"
  byline="Zelda Schiff is editor-in-chief of the Library Times."
/>
```

**狀態 (內部資料)：**

```jsx
function CounterButton() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      已點擊 {count} 次
    </button>
  );
}
```

### 轉譯方法

| 方法 | 使用者 | 描述 |
|----------|---------|-------------|
| **虛擬 DOM (Virtual DOM)** | React, Vue | 在 JS 記憶體中儲存 DOM 資訊，與真實 DOM 進行比較 (diff)，並套用變裝 |
| **增量 DOM (Incremental DOM)** | Angular | 不會建立完整複本，忽略未變更的部分 |
| **Glimmer VM** | Ember | 將範本編譯為位元組碼 (bytecode) |

### 相依性注入 (Dependency Injection)

「屬性鑽取 (Prop drilling)」（透過多層巢狀傳遞資料）的解決方案：

- **Angular**：相依性注入系統
- **Vue**：`provide()` 和 `inject()` 方法
- **React**：Context API
- **Ember**：服務 (Services)

### 測試範例 (React Testing Library)

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import CounterButton from "./CounterButton";

it("Renders a semantic button with an initial state of 0", () => {
  render(<CounterButton />);
  const btn = screen.getByRole("button");
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveTextContent("已點擊 0 次");
});

it("Increments the count when clicked", () => {
  render(<CounterButton />);
  const btn = screen.getByRole("button");
  fireEvent.click(btn);
  expect(btn).toHaveTextContent("已點擊 1 次");
});
```

---

## React 入門

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started>

### 什麼是 React？

React 是**一個用於建立使用者介面的函式庫**。它不是框架 -- 它是一個可與 ReactDOM 等其他函式庫搭配用於網頁開發的可重複使用函式庫。其主要目標是透過使用**元件 (components)** 來減少建構 UI 時的錯誤。

### 環境設定

需求：

- **Node.js** (v18 或更高版本；建議使用 v20 LTS)
- **npm** (隨 Node.js 安裝)

### 使用 Vite 建立 React 應用程式

```bash
npm create vite@latest moz-todo-react -- --template react
cd moz-todo-react && npm install
npm run dev -- --open --port 3000
```

### 專案結構

```
moz-todo-react/
  index.html              (進入 HTML 檔案)
  package.json            (專案 Metadata 與相依性)
  src/
    App.jsx               (主要元件)
    App.css
    main.jsx              (進入點 - 匯入 App)
    index.css             (全域樣式)
    assets/
  vite.config.js
```

### 理解 JSX

JSX 擴充了 JavaScript，允許在 JavaScript 中撰寫類 HTML 的程式碼：

```jsx
const heading = <h1>Mozilla 開發者網路</h1>;
```

屬性使用 `className` 而非 `class`：

```jsx
<button type="button" className="primary">
  點擊我！
</button>
```

### 基本元件

```jsx
import "./App.css";

function App() {
  return (
    <>
      <header>
        <h1>哈囉, 世界！</h1>
        <button type="button">點擊我！</button>
      </header>
    </>
  );
}

export default App;
```

### 片段 (Fragments)

使用 `<>`（片段）傳回多個元件，而無需額外的 `<div>` 包裝：

```jsx
return (
  <>
    <header>內容</header>
    <main>更多內容</main>
  </>
);
```

### JSX 中的 JavaScript 表達式

使用大括號 `{}` 來嵌入 JavaScript 表達式：

```jsx
const subject = "React";

function App() {
  return (
    <>
      <h1>Hello, {subject}!</h1>
      <h1>Hello, {subject.toUpperCase()}!</h1>
      <h1>Hello, {2 + 2}!</h1>
    </>
  );
}
```

### Props (元件屬性)

Props 用於將資料從父元件傳遞給子元件（單向資料流）：

```jsx
// main.jsx
<App subject="Clarice" />

// App.jsx
function App(props) {
  return (
    <header>
      <h1>哈囉, {props.subject}！</h1>
    </header>
  );
}
```

### 轉譯應用程式

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App subject="Clarice" />
  </StrictMode>
);
```

---

## React 元件

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_components>

### 建立元件

功能性元件 (Functional component) 是一個傳回 JSX 的 JavaScript 函式：

```jsx
function Todo(props) {
  return (
    <li className="todo stack-small">
      <div className="c-cb">
        <input id={props.id} type="checkbox" defaultChecked={props.completed} />
        <label className="todo-label" htmlFor={props.id}>
          {props.name}
        </label>
      </div>
      <div className="btn-group">
        <button type="button" className="btn">
          編輯 <span className="visually-hidden">{props.name}</span>
        </button>
        <button type="button" className="btn btn__danger">
          刪除 <span className="visually-hidden">{props.name}</span>
        </button>
      </div>
    </li>
  );
}

export default Todo;
```

### 傳遞 Props

```jsx
<ul role="list" className="todo-list">
  <Todo name="吃" id="todo-0" completed />
  <Todo name="睡" id="todo-1" />
  <Todo name="重複" id="todo-2" />
</ul>
```

### 使用 map() 轉譯清單

```jsx
const DATA = [
  { id: "todo-0", name: "吃", completed: true },
  { id: "todo-1", name: "睡", completed: false },
  { id: "todo-2", name: "重複", completed: false },
];

function App(props) {
  const taskList = props.tasks?.map((task) => (
    <Todo
      id={task.id}
      name={task.name}
      completed={task.completed}
      key={task.id}
    />
  ));

  return (
    <ul
      role="list"
      className="todo-list stack-large stack-exception"
      aria-labelledby="list-heading">
      {taskList}
    </ul>
  );
}
```

### 唯一的 Key

務必為透過迭代轉譯的項目提供唯一的 `key` prop：

```jsx
const taskList = props.tasks?.map((task) => (
  <Todo
    id={task.id}
    name={task.name}
    completed={task.completed}
    key={task.id}
  />
));
```

React 使用 key 來追蹤哪些項目已被變更、新增或移除。

### 元件架構範例

```jsx
// src/components/Form.jsx
function Form() {
  return (
    <form>
      <h2 className="label-wrapper">
        <label htmlFor="new-todo-input" className="label__lg">
          需要做什麼？
        </label>
      </h2>
      <input
        type="text"
        id="new-todo-input"
        className="input input__lg"
        name="text"
        autoComplete="off"
      />
      <button type="submit" className="btn btn__primary btn__lg">
        加入
      </button>
    </form>
  );
}

export default Form;
```

```jsx
// src/App.jsx
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";

function App(props) {
  const taskList = props.tasks?.map((task) => (
    <Todo
      id={task.id}
      name={task.name}
      completed={task.completed}
      key={task.id}
    />
  ));

  return (
    <div className="todoapp stack-large">
      <h1>待辦事項管理器</h1>
      <Form />
      <div className="filters btn-group stack-exception">
        <FilterButton />
        <FilterButton />
        <FilterButton />
      </div>
      <h2 id="list-heading">剩餘 3 個任務</h2>
      <ul
        role="list"
        className="todo-list stack-large stack-exception"
        aria-labelledby="list-heading">
        {taskList}
      </ul>
    </div>
  );
}

export default App;
```

---

## 初探 JavaScript

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/A_first_splash>

### 像程式設計師一樣思考

程式設計需要將問題分解為可執行的任務、將語法應用於現實世界的問題，並理解各項功能如何協同運作。

### 數字猜測遊戲：完整範例

```javascript
let randomNumber = Math.floor(Math.random() * 100) + 1;

const guesses = document.querySelector(".guesses");
const lastResult = document.querySelector(".lastResult");
const lowOrHi = document.querySelector(".lowOrHi");
const guessSubmit = document.querySelector(".guessSubmit");
const guessField = document.querySelector(".guessField");

let guessCount = 1;
let resetButton;

function checkGuess() {
  const userGuess = Number(guessField.value);

  if (guessCount === 1) {
    guesses.textContent = "之前的猜測：";
  }
  guesses.textContent = `${guesses.textContent} ${userGuess}`;

  if (userGuess === randomNumber) {
    lastResult.textContent = "恭喜您！ 您猜對了！";
    lastResult.style.backgroundColor = "green";
    lowOrHi.textContent = "";
    setGameOver();
  } else if (guessCount === 10) {
    lastResult.textContent = "！！！遊戲結束！！！";
    lowOrHi.textContent = "";
    setGameOver();
  } else {
    lastResult.textContent = "錯誤！";
    lastResult.style.backgroundColor = "red";
    if (userGuess < randomNumber) {
      lowOrHi.textContent = "最後一次猜測太低了！";
    } else if (userGuess > randomNumber) {
      lowOrHi.textContent = "最後一次猜測太高了！";
    }
  }

  guessCount++;
  guessField.value = "";
  guessField.focus();
}

guessSubmit.addEventListener("click", checkGuess);

function setGameOver() {
  guessField.disabled = true;
  guessSubmit.disabled = true;
  resetButton = document.createElement("button");
  resetButton.textContent = "開始新遊戲";
  document.body.appendChild(resetButton);
  resetButton.addEventListener("click", resetGame);
}

function resetGame() {
  guessCount = 1;

  const resetParas = document.querySelectorAll(".resultParas p");
  for (const resetPara of resetParas) {
    resetPara.textContent = "";
  }

  resetButton.parentNode.removeChild(resetButton);

  guessField.disabled = false;
  guessSubmit.disabled = false;
  guessField.value = "";
  guessField.focus();

  lastResult.style.backgroundColor = "white";

  randomNumber = Math.floor(Math.random() * 100) + 1;
}
```

### 展示的關鍵技術

- `Math.floor(Math.random() * 100) + 1` -- 產生隨機整數
- `Number()` 建構子 -- 將輸入轉換為數字
- `document.querySelector()` -- 選取 DOM 元件
- `.textContent` -- 設定元件中的文字
- `.style.backgroundColor` -- 變更元件樣式
- `.disabled` -- 停用/啟用表單元件
- `document.createElement()` -- 建立新的 HTML 元件
- `.appendChild()` / `.removeChild()` -- 從 DOM 中加入/移除元件
- `addEventListener()` -- 附加事件接聽程式
- `.focus()` -- 將焦點移回輸入欄位

---

## JavaScript 學習模組概觀

> 來源： <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting>

### MDN 學習路徑涵蓋的主題

**核心語言基礎：**

1. 什麼是 JavaScript？
2. 初探 JavaScript
3. JavaScript 疑難排解
4. 變數
5. 數字與運算子
6. 字串
7. 實用的字串方法
8. 陣列

**控制流程與函式：**
9. 條件判斷式
10. 迴圈
11. 函式
12. 建立自己的函式
13. 函式回傳值

**事件與 DOM 操作：**
14. 事件簡介
15. 事件冒泡 (Event bubbling)
16. 物件基礎
17. DOM 腳本操作

**API 與資料：**
18. 發出網路請求
19. 使用 JSON

**錯誤處理：**
20. JavaScript 偵錯與錯誤處理

### 實務挑戰

- **荒謬故事產生器 (Silly story generator)** -- 變數、數學、字串、陣列
- **影像藝廊 (Image gallery)** -- 迴圈、函式、條件判斷、事件
- **房地產資料 UI (House data UI)** -- JSON 擷取、過濾、轉譯

---

## JavaScript 內建物件快速參考

> 來源： <https://www.w3schools.com/jsref/jsref_reference.asp> (部分內容)

### 核心物件與常見方法

**陣列方法 (Array Methods)：**
`concat()`, `every()`, `filter()`, `find()`, `findIndex()`, `forEach()`, `from()`, `includes()`, `indexOf()`, `isArray()`, `join()`, `keys()`, `lastIndexOf()`, `map()`, `of()`, `pop()`, `push()`, `reduce()`, `reduceRight()`, `reverse()`, `shift()`, `slice()`, `some()`, `sort()`, `splice()`, `toString()`, `unshift()`, `values()`

**字串方法 (String Methods)：**
`charAt()`, `charCodeAt()`, `concat()`, `endsWith()`, `fromCharCode()`, `includes()`, `indexOf()`, `lastIndexOf()`, `match()`, `matchAll()`, `padEnd()`, `padStart()`, `repeat()`, `replace()`, `replaceAll()`, `search()`, `slice()`, `split()`, `startsWith()`, `substring()`, `toLowerCase()`, `toUpperCase()`, `trim()`, `trimEnd()`, `trimStart()`

**數字方法 (Number Methods)：**
`isFinite()`, `isInteger()`, `isNaN()`, `isSafeInteger()`, `parseFloat()`, `parseInt()`, `toExponential()`, `toFixed()`, `toLocaleString()`, `toPrecision()`, `toString()`

**數學方法 (Math Methods)：**
`abs()`, `acos()`, `asin()`, `atan()`, `atan2()`, `cbrt()`, `ceil()`, `cos()`, `exp()`, `floor()`, `log()`, `max()`, `min()`, `pow()`, `random()`, `round()`, `sign()`, `sin()`, `sqrt()`, `tan()`, `trunc()`

**日期方法 (Date Methods)：**
`getDate()`, `getDay()`, `getFullYear()`, `getHours()`, `getMilliseconds()`, `getMinutes()`, `getMonth()`, `getSeconds()`, `getTime()`, `now()`, `parse()`, `setDate()`, `setFullYear()`, `setHours()`, `setMilliseconds()`, `setMinutes()`, `setMonth()`, `setSeconds()`, `toDateString()`, `toISOString()`, `toJSON()`, `toLocaleDateString()`, `toLocaleString()`, `toLocaleTimeString()`, `toString()`, `toTimeString()`, `toUTCString()`

**JSON 方法：**
`JSON.parse()`, `JSON.stringify()`

**全域函式 (Global Functions)：**
`decodeURI()`, `decodeURIComponent()`, `encodeURI()`, `encodeURIComponent()`, `eval()`, `isFinite()`, `isNaN()`, `Number()`, `parseFloat()`, `parseInt()`, `String()`

**Promise 方法：**
`Promise.all()`, `Promise.allSettled()`, `Promise.any()`, `Promise.race()`, `Promise.reject()`, `Promise.resolve()`, `.then()`, `.catch()`, `.finally()`

---

*此參考資料由下列來源彙編而成：*

1. *<https://www.w3schools.com/jsref/jsref_reference.asp>*
2. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting>*
3. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript>*
4. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/A_first_splash>*
5. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Variables>*
6. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Math>*
7. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Strings>*
8. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Useful_string_methods>*
9. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Arrays>*
10. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Conditionals>*
11. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Loops>*
12. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Functions>*
13. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Build_your_own_function>*
14. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Return_values>*
15. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events>*
16. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Object_basics>*
17. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_components>*
18. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started>*
19. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Main_features>*
20. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting>*
21. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Network_requests>*
22. *<https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON>*
