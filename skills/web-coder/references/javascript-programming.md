# JavaScript 與程式設計參考 (JavaScript & Programming Reference)

JavaScript、ECMAScript、程式設計概念以及現代 JS 模式的全面參考。

## 核心概念

### JavaScript
一種遵循 ECMAScript 規格的高階、直譯式程式語言。與 HTML 和 CSS 並列為網頁開發的主要語言。

**關鍵特性**：
- 動態型別 (Dynamically typed)
- 基於原型 (Prototype-based) 的繼承
- 一等函式 (First-class functions)
- 事件驅動 (Event-driven)
- 非同步執行 (Asynchronous execution)

### ECMAScript
JavaScript 所實作的標準化規格。

**主要版本**：
- **ES5** (2009)：嚴格模式 (Strict mode)、JSON 支援
- **ES6/ES2015**：類別 (Classes)、箭頭函式 (Arrow functions)、Promise、模組 (Modules)
- **ES2016+**：Async/await、選用鏈結 (Optional chaining)、空值合併 (Nullish coalescing)

## 資料型別 (Data Types)

### 基本型別 (Primitive Types)

```javascript
// 字串 (String)
let name = "John";
let greeting = 'Hello';
let template = `Hello, ${name}!`; // 樣式字面值 (Template literal)

// 數字 (Number)
let integer = 42;
let float = 3.14;
let negative = -10;
let scientific = 1e6; // 1000000

// BigInt (用於極大的整數)
let big = 9007199254740991n;

// 布林值 (Boolean)
let isTrue = true;
let isFalse = false;

// 未定義 (Undefined)（已宣告但未賦值）
let undefined_var;
console.log(undefined_var); // undefined

// 空值 (Null)（刻意表示不具備任何值）
let empty = null;

// 符號 (Symbol)（唯一識別碼）
let sym = Symbol('description');
```

### 型別檢查

```javascript
typeof "hello"; // "string"
typeof 42; // "number"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "object" (歷史遺留的錯誤)
typeof Symbol(); // "symbol"
typeof {}; // "object"
typeof []; // "object"
typeof function() {}; // "function"

// 較佳的陣列檢查方式
Array.isArray([]); // true

// Null 檢查
value === null; // 若為 null 則為 true
```

### 型別強制轉換與轉換 (Type Coercion and Conversion)

```javascript
// 隱式強制轉換
"5" + 2; // "52" (字串串接)
"5" - 2; // 3 (數字相減)
"5" * "2"; // 10 (數字相乘)
!!"value"; // true (布林值轉換)

// 顯式轉換
String(123); // "123"
Number("123"); // 123
Number("abc"); // NaN
Boolean(0); // false
Boolean(1); // true
parseInt("123px"); // 123
parseFloat("3.14"); // 3.14
```

### 真值 (Truthy) 與假值 (Falsy)

**假值**（評估為 false）：
- `false`
- `0`, `-0`
- `""` (空字串)
- `null`
- `undefined`
- `NaN`

**其餘皆為真值**，包含：
- `"0"` (字串)
- `"false"` (字串)
- `[]` (空陣列)
- `{}` (空物件)
- `function() {}` (空函式)

## 變數與常數

```javascript
// var (函式作用域，會提升 (hoist) - 現代程式碼中應避免使用)
var oldStyle = "避免使用這個";

// let (區塊作用域，可以重新賦值)
let count = 0;
count = 1; // ✓ 正常運作

// const (區塊作用域，無法重新賦值)
const MAX = 100;
MAX = 200; // ✗ TypeError

// const 用於物件/陣列（其內容可以變更）
const person = { name: "John" };
person.name = "Jane"; // ✓ 正常運作（修改物件內容）
person = {}; // ✗ TypeError（重新賦值變數）
```

## 函式 (Functions)

### 函式宣告 (Function Declaration)

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### 函式運算式 (Function Expression)

```javascript
const greet = function(name) {
  return `Hello, ${name}!`;
};
```

### 箭頭函式 (Arrow Functions)

```javascript
// 基本語法
const add = (a, b) => a + b;

// 具備區塊主體
const multiply = (a, b) => {
  const result = a * b;
  return result;
};

// 單一參數（括號可省略）
const square = x => x * x;

// 無參數
const getRandom = () => Math.random();

// 隱式回傳物件（需用括號包覆）
const makePerson = (name, age) => ({ name, age });
```

### 一等函式 (First-Class Functions)

函式即為值，可以：
- 賦值給變數
- 作為引數 (Argument) 傳遞
- 從其他函式中回傳

```javascript
// 賦值給變數
const fn = function() { return 42; };

// 作為引數傳遞
function execute(callback) {
  return callback();
}
execute(() => console.log("Hello"));

// 從函式中回傳
function createMultiplier(factor) {
  return function(x) {
    return x * factor;
  };
}
const double = createMultiplier(2);
double(5); // 10
```

### 閉包 (Closures)

會記住其詞法作用域 (Lexical scope) 的函式：

```javascript
function createCounter() {
  let count = 0; // 私有變數
  
  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.decrement(); // 1
counter.getCount(); // 1
```

### 回呼函式 (Callback Functions)

作為引數傳遞並在稍後執行的函式：

```javascript
// 陣列方法使用回呼
const numbers = [1, 2, 3, 4, 5];

numbers.forEach(num => console.log(num));

const doubled = numbers.map(num => num * 2);

const evens = numbers.filter(num => num % 2 === 0);

const sum = numbers.reduce((acc, num) => acc + num, 0);
```

### IIFE (立即呼叫函式運算式)

```javascript
(function() {
  // 此處的程式碼會立即執行
  console.log("IIFE 已執行");
})();

// 具備參數
(function(name) {
  console.log(`Hello, ${name}`);
})("World");

// 箭頭函式 IIFE
(() => {
  console.log("箭頭 IIFE");
})();
```

## 物件 (Objects)

### 建立物件

```javascript
// 物件字面值
const person = {
  name: "John",
  age: 30,
  greet() {
    return `Hello, I'm ${this.name}`;
  }
};

// 建構子函式 (Constructor function)
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const john = new Person("John", 30);

// Object.create
const proto = { greet() { return "Hello"; } };
const obj = Object.create(proto);
```

### 存取屬性

```javascript
const obj = { name: "John", age: 30 };

// 點號標法 (Dot notation)
obj.name; // "John"

// 括號標法 (Bracket notation)
obj["age"]; // 30
const key = "name";
obj[key]; // "John"

// 選用鏈結 (Optional chaining) (ES2020)
obj.address?.city; // undefined (若 address 不存在也不會報錯)
obj.getName?.(); // undefined (若 getName 不存在也不會報錯)
```

### 物件方法

```javascript
const person = { name: "John", age: 30, city: "NYC" };

// 取得鍵 (Keys)
Object.keys(person); // ["name", "age", "city"]

// 取得值 (Values)
Object.values(person); // ["John", 30, "NYC"]

// 取得條目 (Entries)
Object.entries(person); // [["name", "John"], ["age", 30], ["city", "NYC"]]

// 指派 (Assign)（合併物件）
const extended = Object.assign({}, person, { country: "USA" });

// 展開運算子 (Spread operator)（現代替代方案）
const merged = { ...person, country: "USA" };

// 凍結 (Freeze)（變為不可變）
Object.freeze(person);
person.age = 31; // 無聲失敗（在嚴格模式下會報錯）

// 封印 (Seal)（防止新增/移除屬性）
Object.seal(person);
```

### 解構賦值 (Destructuring)

```javascript
// 物件解構
const person = { name: "John", age: 30, city: "NYC" };
const { name, age } = person;

// 使用不同的變數名稱
const { name: personName, age: personAge } = person;

// 具備預設值
const { name, country = "USA" } = person;

// 巢狀解構
const user = { profile: { email: "john@example.com" } };
const { profile: { email } } = user;

// 陣列解構
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
// first = 1, second = 2, rest = [3, 4, 5]

// 跳過元素
const [a, , c] = numbers;
// a = 1, c = 3
```

## 陣列 (Arrays)

```javascript
// 建立陣列
const arr = [1, 2, 3];
const empty = [];
const mixed = [1, "two", { three: 3 }, [4]];

// 存取元素
arr[0]; // 1
arr[arr.length - 1]; // 最後一個元素
arr.at(-1); // 3 (ES2022 - 負數索引)

// 修改陣列
arr.push(4); // 新增至末尾
arr.pop(); // 從末尾移除
arr.unshift(0); // 新增至開頭
arr.shift(); // 從開頭移除
arr.splice(1, 2, 'a', 'b'); // 從索引 1 移除 2 個元素，並插入 'a', 'b'

// 迭代 (Iteration)
arr.forEach(item => console.log(item));
for (let item of arr) { console.log(item); }
for (let i = 0; i < arr.length; i++) { console.log(arr[i]); }

// 轉換 (Transformation)
const doubled = arr.map(x => x * 2);
const evens = arr.filter(x => x % 2 === 0);
const sum = arr.reduce((acc, x) => acc + x, 0);

// 搜尋
arr.includes(2); // true
arr.indexOf(2); // 索引值或 -1
arr.find(x => x > 2); // 第一個符合的元素
arr.findIndex(x => x > 2); // 第一個符合的索引值

// 測試
arr.some(x => x > 5); // 若有任何符合則為 true
arr.every(x => x > 0); // 若全部符合則為 true

// 排序與反轉
arr.sort((a, b) => a - b); // 遞增
arr.reverse(); // 原端反轉

// 合併
const combined = arr.concat([4, 5]);
const spread = [...arr, 4, 5];

// 切片 (Slice)（複製部分內容）
const portion = arr.slice(1, 3); // 索引 1 至 3（不包含 3）

// 展平 (Flat)（展平巢狀陣列）
[[1, 2], [3, 4]].flat(); // [1, 2, 3, 4]
```

## 控制流 (Control Flow)

### 條件句

```javascript
// if/else
if (condition) {
  // 程式碼
} else if (otherCondition) {
  // 程式碼
} else {
  // 程式碼
}

// 三元運算子 (Ternary operator)
const result = condition ? valueIfTrue : valueIfFalse;

// Switch 語句
switch (value) {
  case 1:
    // 程式碼
    break;
  case 2:
  case 3:
    // 評估為 2 或 3 時的程式碼
    break;
  default:
    // 預設程式碼
}

// 空值合併 (ES2020)
const value = null ?? "預設值"; // "預設值"
const value = 0 ?? "預設值"; // 0 (0 不是空值)

// 使用邏輯 OR 設定預設值 (ES2020 之前)
const value = falsy || "預設值";

// 選用鏈結
const city = user?.address?.city;
```

### 迴圈 (Loops)

```javascript
// for 迴圈
for (let i = 0; i < 10; i++) {
  console.log(i);
}

// while 迴圈
let i = 0;
while (i < 10) {
  console.log(i);
  i++;
}

// do-while 迴圈
do {
  console.log(i);
  i++;
} while (i < 10);

// for...of（迭代值）
for (const item of array) {
  console.log(item);
}

// for...in（迭代鍵 - 避免用於陣列）
for (const key in object) {
  console.log(key, object[key]);
}

// break 與 continue
for (let i = 0; i < 10; i++) {
  if (i === 5) break; // 結束迴圈
  if (i === 3) continue; // 跳過本次迭代
  console.log(i);
}
```

## 非同步 JavaScript (Asynchronous JavaScript)

### 回呼 (Callbacks)

```javascript
function fetchData(callback) {
  setTimeout(() => {
    callback("資料已收到");
  }, 1000);
}

fetchData(data => console.log(data));
```

### Promise

```javascript
// 建立 Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("成功！");
    } else {
      reject("錯誤！");
    }
  }, 1000);
});

// 使用 Promise
promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
  .finally(() => console.log("完成"));

// Promise 公用程式
Promise.all([promise1, promise2]); // 等待全部完成
Promise.race([promise1, promise2]); // 第一個完成的
Promise.allSettled([promise1, promise2]); // 等待全部結算 (ES2020)
Promise.any([promise1, promise2]); // 第一個成功的 (ES2021)
```

### Async/Await

```javascript
// Async 函式
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('錯誤：', error);
  }
}

// 使用 Async 函式
fetchData().then(data => console.log(data));

// 頂層 await (Top-level await) (ES2022，僅限模組)
const data = await fetchData();
```

## 類別 (Classes)

```javascript
class Person {
  // 建構子
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  // 實例方法 (Instance method)
  greet() {
    return `Hello, I'm ${this.name}`;
  }
  
  // Getter (取得器)
  get info() {
    return `${this.name}, ${this.age}`;
  }
  
  // Setter (設定器)
  set birthYear(year) {
    this.age = new Date().getFullYear() - year;
  }
  
  // 靜態方法 (Static method)
  static species() {
    return "Homo sapiens";
  }
}

// 繼承 (Inheritance)
class Employee extends Person {
  constructor(name, age, jobTitle) {
    super(name, age); // 呼叫父類別建構子
    this.jobTitle = jobTitle;
  }
  
  // 覆寫方法 (Override method)
  greet() {
    return `${super.greet()}, I'm a ${this.jobTitle}`;
  }
}

// 用法
const john = new Person("John", 30);
john.greet(); // "Hello, I'm John"
Person.species(); // "Homo sapiens"

const jane = new Employee("Jane", 25, "Developer");
jane.greet(); // "Hello, I'm Jane, I'm a Developer"
```

## 模組 (Modules)

### ES6 模組 (ESM)

```javascript
// 匯出 (Export) (math.js)
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}
export default class Calculator {
  // ...
}

// 匯入 (Import)
import Calculator, { PI, add } from './math.js';
import * as math from './math.js';
import { add as sum } from './math.js'; // 重新命名
```

### CommonJS (Node.js)

```javascript
// 匯出 (math.js)
module.exports = {
  add(a, b) {
    return a + b;
  }
};

// 匯入
const math = require('./math');
```

## 錯誤處理 (Error Handling)

```javascript
// try/catch
try {
  // 可能會拋出錯誤的程式碼
  throw new Error("發生了一些錯誤");
} catch (error) {
  console.error(error.message);
} finally {
  // 一律會執行
  console.log("清理工作");
}

// 自訂錯誤
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

throw new ValidationError("無效的輸入");
```

## 最佳實踐 (Best Practices)

### 應做事項 (Do's)
- ✅ 預設使用 `const`，需要時才用 `let`
- ✅ 使用嚴格模式 (`'use strict';`)
- ✅ 針對回呼函式使用箭頭函式
- ✅ 使用樣式字面值進行字串插值
- ✅ 使用解構賦值以精簡程式碼
- ✅ 針對非同步程式碼使用 async/await
- ✅ 妥善處理錯誤
- ✅ 使用具描述性的變數名稱
- ✅ 保持函式小巧且單一職責
- ✅ 使用現代 ES6+ 特性

### 禁忌事項 (Don'ts)
- ❌ 使用 `var`（應使用 `let` 或 `const`）
- ❌ 污染全域作用域
- ❌ 使用 `==`（應使用 `===` 進行嚴格相等檢查）
- ❌ 修改函式參數
- ❌ 使用 `eval()` 或 `with()`
- ❌ 無聲地忽略錯誤
- ❌ 在 I/O 操作中使用同步程式碼
- ❌ 建立深度巢狀的回呼（回呼地獄）

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- 演算法 (Algorithm)
- 引數 (Argument)
- 陣列 (Array)
- 非同步 (Asynchronous)
- 繫結 (Binding)
- BigInt
- 位元旗標 (Bitwise flags)
- 區塊（腳本）(Block (scripting))
- 布林值 (Boolean)
- 回呼函式 (Callback function)
- 駱駝式命名法 (Camel case)
- 類別 (Class)
- 閉包 (Closure)
- 程式碼點 (Code point)
- 程式碼單元 (Code unit)
- 編譯 (Compile)
- 編譯時 (Compile time)
- 條件式 (Conditional)
- 常數 (Constant)
- 建構子 (Constructor)
- 控制流 (Control flow)
- 深層複製 (Deep copy)
- 還原序列化 (Deserialization)
- ECMAScript
- 封裝 (Encapsulation)
- 例外 (Exception)
- Expando
- 一等函式 (First-class function)
- 函式 (Function)
- 提升 (Hoisting)
- IIFE
- 識別碼 (Identifier)
- 不可變 (Immutable)
- 繼承 (Inheritance)
- 實例 (Instance)
- JavaScript
- JSON
- JSON 型別表示 (JSON type representation)
- 即時編譯 (Just-In-Time Compilation (JIT))
- 烤肉串式命名法 (Kebab case)
- 關鍵字 (Keyword)
- 字面值 (Literal)
- 區域作用域 (Local scope)
- 區域變數 (Local variable)
- 迴圈 (Loop)
- 方法 (Method)
- 混入 (Mixin)
- 模組化 (Modularity)
- 可變 (Mutable)
- 命名空間 (Namespace)
- NaN
- 原生 (Native)
- Null
- 空值類值 (Nullish value)
- 數字 (Number)
- 物件 (Object)
- 物件參考 (Object reference)
- 物件導向程式設計 (OOP)
- 運算元 (Operand)
- 運算子 (Operator)
- 參數 (Parameter)
- 解析 (Parse)
- 多型 (Polymorphism)
- 基本型別 (Primitive)
- Promise
- 屬性 (JavaScript) (Property (JavaScript))
- 原型 (Prototype)
- 基於原型的程式設計 (Prototype-based programming)
- 虛擬碼 (Pseudocode)
- 遞迴 (Recursion)
- 正規表示式 (Regular expression)
- 作用域 (Scope)
- 序列化 (Serialization)
- 可序列化物件 (Serializable object)
- 淺層複製 (Shallow copy)
- 簽章（函式）(Signature (functions))
- 鬆散模式 (Sloppy mode)
- 蛇形命名法 (Snake case)
- 靜態方法 (Static method)
- 靜態型別 (Static typing)
- 語句 (Statement)
- 嚴格模式 (Strict mode)
- 字串 (String)
- 字串化器 (Stringifier)
- 符號 (Symbol)
- 同步 (Synchronous)
- 語法 (Syntax)
- 語法錯誤 (Syntax error)
- 型別 (Type)
- 型別強制轉換 (Type coercion)
- 型別轉換 (Type conversion)
- 真值 (Truthy)
- 假值 (Falsy)
- 未定義 (Undefined)
- 值 (Value)
- 變數 (Variable)

## 額外資源

- [MDN JavaScript 參考](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ECMAScript 規格](https://tc39.es/ecma262/)
- [JavaScript.info](https://javascript.info/)
- [你所不知道的 JS (You Don't Know JS) 書籍系列](https://github.com/getify/You-Dont-Know-JS)
