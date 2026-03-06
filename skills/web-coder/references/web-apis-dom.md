# Web API 與 DOM 參考

現代瀏覽器中可用的文件物件模型 (DOM) 與 Web API 的完整參考。

## 文件物件模型 (DOM)

### 什麼是 DOM？
DOM 是 HTML 與 XML 文件的程式設計介面。它將頁面結構表示為一個物件樹，可以使用 JavaScript 進行操作。

**DOM 樹結構**：
```
Document (文件)
└── html
    ├── head
    │   ├── title
    │   └── meta
    └── body
        ├── header
        ├── main
        └── footer
```

### DOM 節點類型

| 節點類型 | 描述 | 範例 |
|-----------|-------------|---------|
| Element | HTML 元件 | `<div>`, `<p>` |
| Text | 文字內容 | 元件內的文字 |
| Comment | HTML 註解 | `<!-- comment -->` |
| Document | 根文件 | `document` |
| DocumentFragment | 輕量級文件 | 用於批次操作 |

### 選取元件

```javascript
// 透過 ID
const element = document.getElementById('myId');

// 透過類別名稱 (傳回 HTMLCollection)
const elements = document.getElementsByClassName('myClass');

// 透過標籤名稱 (傳回 HTMLCollection)
const divs = document.getElementsByTagName('div');

// Query selector (第一個相符項)
const first = document.querySelector('.myClass');
const advanced = document.querySelector('div.container > p:first-child');

// Query selector all (傳回 NodeList)
const all = document.querySelectorAll('.myClass');

// 特殊選取器
document.body; // Body 元件
document.head; // Head 元件
document.documentElement; // <html> 元件
```

### 遍歷 DOM

```javascript
const element = document.querySelector('#myElement');

// 父層
element.parentElement;
element.parentNode;

// 子層
element.children; // 子元件的 HTMLCollection
element.childNodes; // 所有子節點的 NodeList
element.firstElementChild;
element.lastElementChild;

// 兄弟層
element.nextElementSibling;
element.previousElementSibling;

// 符合選取器的最近祖先
element.closest('.container');

// 檢查元件是否包含另一個元件
parent.contains(child); // true/false
```

### 建立與修改元件

```javascript
// 建立元件
const div = document.createElement('div');
const text = document.createTextNode('Hello');
const fragment = document.createDocumentFragment();

// 設定內容
div.textContent = '純文字'; // 安全 (已轉義)
div.innerHTML = '<strong>HTML</strong>'; // 使用使用者輸入時可能不安全

// 設定屬性
div.setAttribute('id', 'myDiv');
div.setAttribute('class', 'container');
div.id = 'myDiv'; // 直接屬性
div.className = 'container';
div.classList.add('active');
div.classList.remove('inactive');
div.classList.toggle('visible');
div.classList.contains('active'); // true/false

// 設定樣式
div.style.color = 'red';
div.style.backgroundColor = 'blue';
div.style.cssText = 'color: red; background: blue;';

// Data 屬性
div.dataset.userId = '123'; // 設定 data-user-id="123"
div.getAttribute('data-user-id'); // "123"

// 插入 DOM
parent.appendChild(div); // 作為最後一個子項加入
parent.insertBefore(div, referenceNode); // 在參考節點前插入
parent.prepend(div); // 作為第一個子項加入 (現代方法)
parent.append(div); // 作為最後一個子項加入 (現代方法)
element.after(div); // 在元件後插入
element.before(div); // 在元件前插入
element.replaceWith(newElement); // 取代元件

// 從 DOM 移除
element.remove(); // 現代方法
parent.removeChild(element); // 舊方法

// 複製元件
const clone = element.cloneNode(true); // true = 深層複製 (包含子項)
```

### 元件屬性

```javascript
// 尺寸與位置
element.offsetWidth; // 寬度 (包含邊框)
element.offsetHeight; // 高度 (包含邊框)
element.clientWidth; // 寬度 (不含邊框)
element.clientHeight; // 高度 (不含邊框)
element.scrollWidth; // 總可捲動寬度
element.scrollHeight; // 總可捲動高度
element.offsetTop; // 相對於 offsetParent 的頂部位置
element.offsetLeft; // 相對於 offsetParent 的左側位置

// 邊界框
const rect = element.getBoundingClientRect();
// 傳回：{ x, y, width, height, top, right, bottom, left }

// 捲動位置
element.scrollTop; // 垂直捲動位置
element.scrollLeft; // 水平捲動位置
element.scrollTo(0, 100); // 捲動到指定位置
element.scrollIntoView(); // 將元件捲動到檢視範圍內

// 檢查可見性
element.checkVisibility(); // 現代 API
```

## 事件處理

### 加入事件接聽程式 (Event Listeners)

```javascript
// addEventListener (現代且推薦的方法)
element.addEventListener('click', handleClick);
element.addEventListener('click', handleClick, { once: true }); // 第一次觸發後移除

function handleClick(event) {
  console.log('已點擊！', event);
}

// 事件選項
element.addEventListener('scroll', handleScroll, {
  passive: true, // 不會呼叫 preventDefault()
  capture: false, // 冒泡階段 (預設)
  once: true // 呼叫一次後移除
});

// 移除事件接聽程式
element.removeEventListener('click', handleClick);
```

### 常見事件

| 類別 | 事件 |
|----------|--------|
| 滑鼠 (Mouse) | `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`, `mouseenter`, `mouseleave`, `contextmenu` |
| 鍵盤 (Keyboard) | `keydown`, `keyup`, `keypress` (已過時) |
| 表單 (Form) | `submit`, `change`, `input`, `focus`, `blur`, `invalid` |
| 視窗 (Window) | `load`, `DOMContentLoaded`, `resize`, `scroll`, `beforeunload`, `unload` |
| 觸控 (Touch) | `touchstart`, `touchmove`, `touchend`, `touchcancel` |
| 拖放 (Drag) | `drag`, `dragstart`, `dragend`, `dragover`, `drop` |
| 媒體 (Media) | `play`, `pause`, `ended`, `timeupdate`, `loadeddata` |
| 動畫 (Animation) | `animationstart`, `animationend`, `animationiteration` |
| 轉換 (Transition) | `transitionstart`, `transitionend` |

### 事件物件

```javascript
element.addEventListener('click', (event) => {
  // 目標元件
  event.target; // 觸發事件的元件
  event.currentTarget; // 附加接聽程式的元件
  
  // 滑鼠位置
  event.clientX; // 相對於視埠的 X
  event.clientY; // 相對於視埠的 Y
  event.pageX; // 相對於文件的 X
  event.pageY; // 相對於文件的 Y
  
  // 鍵盤
  event.key; // 'a', 'Enter', 'ArrowUp'
  event.code; // 'KeyA', 'Enter', 'ArrowUp'
  event.ctrlKey; // 如果按下 Ctrl 則為 true
  event.shiftKey; // 如果按下 Shift 則為 true
  event.altKey; // 如果按下 Alt 則為 true
  event.metaKey; // 如果按下 Meta/Cmd 則為 true
  
  // 控制事件流
  event.preventDefault(); // 防止預設動作
  event.stopPropagation(); // 停止冒泡
  event.stopImmediatePropagation(); // 停止其他接聽程式
});
```

### 事件委派 (Event Delegation)

在父層而非個別子項上處理事件：

```javascript
// 與其為每個按鈕加入接聽程式
document.querySelector('.container').addEventListener('click', (event) => {
  if (event.target.matches('button')) {
    console.log('按鈕已點擊：', event.target);
  }
});
```

## Web 儲存 API

### LocalStorage

永續儲存 (無過期時間)：

```javascript
// 設定項目
localStorage.setItem('key', 'value');
localStorage.setItem('user', JSON.stringify({ name: 'John' }));

// 取得項目
const value = localStorage.getItem('key');
const user = JSON.parse(localStorage.getItem('user'));

// 移除項目
localStorage.removeItem('key');

// 全部清除
localStorage.clear();

// 透過索引取得索引鍵
localStorage.key(0);

// 項目數量
localStorage.length;

// 反覆運算所有項目
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(key, value);
}
```

### SessionStorage

分頁關閉時清除儲存：

```javascript
// API 與 localStorage 相同
sessionStorage.setItem('key', 'value');
sessionStorage.getItem('key');
sessionStorage.removeItem('key');
sessionStorage.clear();
```

**儲存限制**：每個來源 (origin) 約 5-10MB

## Fetch API

用於 HTTP 要求的現代 API：

```javascript
// 基本 GET 要求
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// Async/await
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    
    // 檢查是否成功
    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態：${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch 錯誤：', error);
  }
}

// 使用 JSON 的 POST 要求
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'John', age: 30 })
})
  .then(response => response.json())
  .then(data => console.log(data));

// 使用各種選項
fetch(url, {
  method: 'GET', // GET, POST, PUT, DELETE 等
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data), // 用於 POST/PUT
  mode: 'cors', // cors, no-cors, same-origin
  credentials: 'include', // include, same-origin, omit
  cache: 'no-cache', // default, no-cache, reload, force-cache
  redirect: 'follow', // follow, error, manual
  referrerPolicy: 'no-referrer' // no-referrer, origin 等
});

// 回應方法
const text = await response.text(); // 純文字
const json = await response.json(); // JSON
const blob = await response.blob(); // 二進位資料
const arrayBuffer = await response.arrayBuffer(); // ArrayBuffer
const formData = await response.formData(); // FormData
```

## 其他重要的 Web API

### Console API

```javascript
console.log('訊息'); // 記錄訊息
console.error('錯誤'); // 錯誤訊息 (紅色)
console.warn('警告'); // 警告訊息 (黃色)
console.info('資訊'); // 資訊訊息
console.table([{ a: 1 }, { a: 2 }]); // 表格格式
console.group('群組'); // 開始群組
console.groupEnd(); // 結束群組
console.time('timer'); // 開始計時器
console.timeEnd('timer'); // 結束計時器並記錄持續時間
console.clear(); // 清除主控台
console.assert(condition, '錯誤訊息'); // 判斷式
```

### 計時器

```javascript
// 延遲一段時間後執行一次
const timeoutId = setTimeout(() => {
  console.log('1 秒後執行');
}, 1000);

// 取消逾時
clearTimeout(timeoutId);

// 重複執行
const intervalId = setInterval(() => {
  console.log('每秒執行一次');
}, 1000);

// 取消間隔
clearInterval(intervalId);

// RequestAnimationFrame (用於動畫)
function animate() {
  // 動畫程式碼
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

### URL API

```javascript
const url = new URL('https://example.com:8080/path?query=value#hash');

url.protocol; // 'https:'
url.hostname; // 'example.com'
url.port; // '8080'
url.pathname; // '/path'
url.search; // '?query=value'
url.hash; // '#hash'
url.href; // 完整 URL

// URL 參數
url.searchParams.get('query'); // 'value'
url.searchParams.set('newParam', 'newValue');
url.searchParams.append('query', 'another');
url.searchParams.delete('query');
url.searchParams.has('query'); // true/false

// 轉換為字串
url.toString(); // 完整 URL
```

### FormData API

```javascript
// 從表單建立 FormData
const form = document.querySelector('form');
const formData = new FormData(form);

// 手動建立 FormData
const data = new FormData();
data.append('username', 'john');
data.append('file', fileInput.files[0]);

// 取得值
data.get('username'); // 'john'
data.getAll('files'); // 所有 'files' 值的陣列

// 反覆運算
for (const [key, value] of data.entries()) {
  console.log(key, value);
}

// 使用 fetch 傳送
fetch('/api/upload', {
  method: 'POST',
  body: formData // 不要設定 Content-Type 標頭
});
```

### Intersection Observer API

偵測元件何時進入視埠：

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('元件可見');
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.5, // 50% 可見
  rootMargin: '0px'
});

observer.observe(element);
observer.unobserve(element);
observer.disconnect(); // 停止觀察所有項
```

### Mutation Observer API

監看 DOM 變更：

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('DOM 已變更：', mutation.type);
  });
});

observer.observe(element, {
  attributes: true, // 監看屬性變更
  childList: true, // 監看子元件
  subtree: true, // 監看所有後代
  characterData: true // 監看文字內容
});

observer.disconnect(); // 停止觀察
```

### Geolocation API

```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);
  },
  (error) => {
    console.error('取得位置時發生錯誤：', error);
  },
  {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  }
);

// 監看位置 (持續更新)
const watchId = navigator.geolocation.watchPosition(callback);
navigator.geolocation.clearWatch(watchId);
```

### Web Workers

在背景執行緒中執行 JavaScript：

```javascript
// 主執行緒
const worker = new Worker('worker.js');

worker.postMessage({ data: 'Hello' });

worker.onmessage = (event) => {
  console.log('來自 worker：', event.data);
};

worker.onerror = (error) => {
  console.error('Worker 錯誤：', error);
};

worker.terminate(); // 停止 worker

// worker.js
self.onmessage = (event) => {
  console.log('來自標題：', event.data);
  self.postMessage({ result: '完成' });
};
```

### Canvas API

繪製圖形：

```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// 繪製矩形
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 100, 50);

// 繪製圓形
ctx.beginPath();
ctx.arc(100, 100, 50, 0, Math.PI * 2);
ctx.fillStyle = 'red';
ctx.fill();

// 繪製文字
ctx.font = '20px Arial';
ctx.fillText('Hello', 10, 50);

// 繪製影像
const img = new Image();
img.onload = () => {
  ctx.drawImage(img, 0, 0);
};
img.src = 'image.jpg';
```

### IndexedDB

用於大量結構化資料的用戶端資料庫：

```javascript
// 開啟資料庫
const request = indexedDB.open('MyDatabase', 1);

request.onerror = () => console.error('資料庫錯誤');

request.onsuccess = (event) => {
  const db = event.target.result;
  // 使用資料庫
};

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const objectStore = db.createObjectStore('users', { keyPath: 'id' });
  objectStore.createIndex('name', 'name', { unique: false });
};

// 加入資料
const transaction = db.transaction(['users'], 'readwrite');
const objectStore = transaction.objectStore('users');
objectStore.add({ id: 1, name: 'John' });

// 取得資料
const request = objectStore.get(1);
request.onsuccess = () => console.log(request.result);
```

## 最佳實踐

### 應該做 (Do's)
- ✅ 使用 `addEventListener` 而非內嵌事件處理程式
- ✅ 不再需要時移除事件接聽程式
- ✅ 為動態內容使用事件委派
- ✅ 將 DOM 查詢快取在變數中
- ✅ 對純文字使用 `textContent` (比 `innerHTML` 更安全)
- ✅ 對批次 DOM 操作使用 DocumentFragment
- ✅ 對捲動與調整大小處理程式進行防震 (Debounce) 或節流 (Throttle)
- ✅ 為動畫使用 `requestAnimationFrame`
- ✅ 驗證並整理使用者輸入

### 不該做 (Don'ts)
- ❌ 對不可信資料使用 `innerHTML` (XSS 風險)
- ❌ 在迴圈中重複查詢 DOM
- ❌ 在緊密迴圈中修改 DOM (請使用批次操作)
- ❌ 使用 `document.write()` (已過時)
- ❌ 使用同步 XMLHttpRequest
- ❌ 在 localStorage 中儲存敏感資料
- ❌ 忽略非同步程式碼中的錯誤處理
- ❌ 使用繁重計算阻塞主執行緒

## 詞彙術語

**涵蓋的關鍵字詞**：
- API
- 應用程式內容 (Application context)
- 指向標 (Beacon)
- Blink
- Blink 元件
- 瀏覽器
- 瀏覽內容 (Browsing context)
- 緩衝區 (Buffer)
- Canvas
- DOM (文件物件模型)
- 文件環境 (Document environment)
- 事件
- Expando
- 全域物件
- 全域範圍
- 提升 (Hoisting)
- IndexedDB
- 插值 (Interpolation)
- 節點 (DOM)
- 陰影樹 (Shadow tree)
- WindowProxy
- 包裝器 (Wrapper)

## 其他資源

- [MDN DOM 參考](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [MDN Web API](https://developer.mozilla.org/en-US/docs/Web/API)
- [JavaScript.info DOM](https://javascript.info/document)
