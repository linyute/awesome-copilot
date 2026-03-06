# 遊戲開發網頁 API (Web APIs for Game Development)

這是一份涵蓋與建構瀏覽器遊戲最相關之網頁平台 API 的綜合參考指南。每個章節都描述了該 API 的內容、為何對遊戲開發很重要、其關鍵介面與方法，並在適用處提供簡短的程式碼範例。

---

## asm.js

### 它是什麼 (What It Is)

asm.js 是 JavaScript 的一個嚴格且高度可最佳化的子集，旨在提供接近原生的效能。它將 JavaScript 限制在一組狹窄的結構中 — 整數、浮點數、算術運算、簡單函式與堆積 (heap) 存取 — 並且不允許使用物件、字串、閉包 (closures) 以及任何需要堆積分配的結構。其結果是完全有效的 JavaScript，任何引擎都能執行，但支援它的引擎可以對其進行積極的預先編譯。

### 為何對遊戲很重要 (Why It Matters for Games)

- **接近原生的速度**：經 Emscripten 編譯的 C/C++ 遊戲引擎在跨瀏覽器執行時能具備接近原生的效能。
- **可預測的效能**：受限的功能集可產生高度穩定的影格率。
- **C/C++ 可移植性**：現有的原生遊戲引擎可以使用 Emscripten 編譯為 asm.js 並部署在網頁上。
- **無須外掛程式**：在每個現代瀏覽器中都能作為標準 JavaScript 執行。

### 關鍵概念 (Key Concepts)

| 概念 | 說明 |
|---------|-------------|
| 允許的結構 | `while`, `if`, 數字（嚴格的整數/浮點數）, 頂層具名函式, 算術運算, 函式呼叫, 堆積存取 |
| 不允許的結構 | 物件, 字串, 閉包, 動態型別強制轉換, 堆積分配結構 |
| 編譯器工具鏈 | Emscripten 將 C/C++ 編譯為 asm.js |
| 引擎辨識 | 瀏覽器偵測 `"use asm"` 指令並套用預先編譯 |

### 棄用通知 (Deprecation Notice)

asm.js 已被棄用。**WebAssembly (Wasm)** 是其現代繼任者，提供更好的效能、更廣泛的工具支援以及更強大的行業支持。新專案應改為針對 WebAssembly。

### 程式碼範例 (Code Example)

```javascript
// asm.js 模組模式（簡化版）
function MyModule(stdlib, foreign, heap) {
  "use asm";

  var sqrt = stdlib.Math.sqrt;
  var HEAP32 = new stdlib.Int32Array(heap);

  function distance(x1, y1, x2, y2) {
    x1 = +x1; y1 = +y1; x2 = +x2; y2 = +y2;
    var dx = 0.0, dy = 0.0;
    dx = +(x2 - x1);
    dy = +(y2 - y1);
    return +sqrt(dx * dx + dy * dy);
  }

  return { distance: distance };
}
```

---

## Canvas API

### 它是什麼 (What It Is)

Canvas API 提供了一種透過 JavaScript 與 HTML `<canvas>` 元素繪製 2D 圖形的方法。它是瀏覽器遊戲的主要轉譯表面之一，支援遊戲圖形、動畫、影像操作以及即時影片處理。

### 為何對遊戲很重要 (Why It Matters for Games)

- **2D 轉譯表面**：在瀏覽器遊戲中繪製精靈、圖塊地圖、粒子與 HUD 元件的標準方式。
- **像素級控制**：透過 `ImageData` 直接存取像素資料，用於自訂效果、碰撞地圖與程序化產生。
- **高效能**：在現代瀏覽器中具備硬體加速功能，適合 60 fps 的遊戲迴圈。
- **廣大生態系統**：Phaser、Konva.js、EaselJS 與 p5.js 等函式庫皆基於 Canvas 進行遊戲開發。

### 關鍵介面 (Key Interfaces)

| 介面 | 目的 |
|-----------|---------|
| `HTMLCanvasElement` | `<canvas>` HTML 元素 |
| `CanvasRenderingContext2D` | 主要的 2D 繪圖介面 |
| `ImageData` | 用於直接操作的原始像素資料 |
| `ImageBitmap` | 用於高效繪製的點陣圖影像資料 |
| `Path2D` | 可重用的路徑物件 |
| `OffscreenCanvas` | 離屏轉譯，可用於 Web Workers |
| `CanvasPattern` | 重複的影像模式 |
| `CanvasGradient` | 顏色漸層 |
| `TextMetrics` | 文字測量資料 |

### 關鍵方法 (CanvasRenderingContext2D) (Key Methods (CanvasRenderingContext2D))

- `fillRect()`, `strokeRect()`, `clearRect()` — 矩形作業
- `drawImage()` — 繪製影像、精靈或其他畫布
- `beginPath()`, `arc()`, `lineTo()`, `fill()`, `stroke()` — 路徑繪製
- `getImageData()`, `putImageData()` — 像素操作
- `save()`, `restore()` — 狀態管理
- `translate()`, `rotate()`, `scale()`, `transform()` — 轉換作業

### 程式碼範例 (Code Example)

```html
<canvas id="game" width="800" height="600"></canvas>
```

```javascript
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 清除該影格
ctx.clearRect(0, 0, canvas.width, canvas.height);

// 繪製一個填充矩形（例如：平台）
ctx.fillStyle = "green";
ctx.fillRect(100, 400, 200, 20);

// 繪製一個精靈
const sprite = new Image();
sprite.src = "player.png";
sprite.onload = () => {
  ctx.drawImage(sprite, playerX, playerY, 32, 32);
};

// 遊戲迴圈
function gameLoop(timestamp) {
  update(timestamp);
  render(ctx);
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

---

## CSS (階層式樣式表) (CSS (Cascading Style Sheets))

### 它是什麼 (What It Is)

CSS 是用於描述網頁文件呈現方式的語言。在遊戲開發的情境中，CSS 負責處理位於遊戲畫布上方或旁邊的 UI 重疊層、HUD 元件、功能表、過渡效果、動畫以及視覺效果的樣式。

### 為何對遊戲很重要 (Why It Matters for Games)

- **UI 與 HUD 樣式**：無須觸動遊戲畫布即可設定生命條、分數顯示、庫存面板、對話框與功能表的樣式。
- **CSS 動畫與過渡**：針對 UI 元件（淡入、滑出、脈動效果）實現硬體加速動畫，且僅需極少量的 JavaScript。
- **CSS 轉換**：平移、旋轉、縮放與傾斜 DOM 元素，用於視覺效果與 UI 定位。
- **Flexbox 與 Grid**：以回應式方式排版複雜的遊戲 UI（設定面板、排行榜、大廳畫面）。
- **自訂屬性（CSS 變數）**：透過在執行時更改變數值來動態更換遊戲 UI 的佈景主題。
- **指標與游標控制**：自訂或隱藏游標，控制重疊層元素上的指標事件。
- **媒體查詢 (Media queries)**：讓遊戲 UI 適應不同的螢幕尺寸與裝置型別。

### 遊戲關鍵屬性 (Key Properties for Games)

| 屬性 / 特色 | 使用案例 |
|--------------------|----------|
| `transform` | 旋轉、縮放、平移 UI 元件 |
| `transition` | 平滑的屬性變更（例如：生命條寬度） |
| `animation` / `@keyframes` | 迴圈或觸發的 UI 動畫 |
| `opacity` | 適用於重疊層與互動視窗的淡化效果 |
| `pointer-events` | 讓點擊穿過重疊層抵達畫布 |
| `cursor` | 設定自訂游標或隱藏游標 (`cursor: none`) |
| `z-index` | 將 UI 分層置於遊戲畫布上方 |
| `position: fixed / absolute` | 將 HUD 元件固定在視埠 |
| `display: flex / grid` | 用於功能表與面板的回應式排版 |
| `filter` | 對 DOM 元素套用模糊、亮度、對比度效果 |
| `mix-blend-mode` | 將重疊效果與畫布混合 |
| `will-change` | 提示瀏覽器最佳化動畫屬性 |

### 程式碼範例 (Code Example)

```css
/* 遊戲 HUD 重疊層 */
.hud {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  pointer-events: none;       /* 讓點擊穿透到畫布 */
  z-index: 10;
  font-family: "Press Start 2P", monospace;
  color: white;
  text-shadow: 2px 2px 0 black;
}

/* 具備平滑過渡效果的生命條 */
.health-bar {
  width: 200px;
  height: 20px;
  background: #333;
  border: 2px solid white;
}
.health-bar-fill {
  height: 100%;
  background: limegreen;
  transition: width 0.3s ease;
  will-change: width;
}

/* 脈動傷血指示器 */
@keyframes damage-flash {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.4; }
}
.damage-overlay {
  position: fixed;
  inset: 0;
  background: red;
  animation: damage-flash 0.3s ease;
  pointer-events: none;
}
```

---

## 全螢幕 API (Fullscreen API)

### 它是什麼 (What It Is)

全螢幕 API 提供了將特定元素（及其後代）以全螢幕模式呈現的方法，移除所有瀏覽器介面與 UI 元素。它允許以程式化方式進入與退出全螢幕，並報告目前的全螢幕狀態。

### 為何對遊戲很重要 (Why It Matters for Games)

- **沉浸式體驗**：全螢幕移除所有瀏覽器干擾，提供類似遊戲機的遊戲體驗。
- **最大化螢幕空間**：整個顯示器都可用於遊戲視埠。
- **遊戲是主要的應用案例**：MDN 文件明確地將線上遊戲列為目標應用程式。

### 關鍵介面與方法 (Key Interfaces and Methods)

| API | 說明 |
|-----|-------------|
| `Element.requestFullscreen()` | 進入全螢幕模式。傳回一個 `Promise`。 |
| `Document.exitFullscreen()` | 退出全螢幕模式。傳回一個 `Promise`。 |
| `Document.fullscreenElement` | 目前處於全螢幕的元素，若無則為 `null`。 |
| `Document.fullscreenEnabled` | 指示全螢幕是否可用的布林值。 |
| `fullscreenchange` 事件 | 當全螢幕狀態變更時觸發。 |
| `fullscreenerror` 事件 | 若進入/退出全螢幕失敗時觸發。 |

### 程式碼範例 (Code Example)

```javascript
const gameContainer = document.getElementById("game-container");

// 點擊按鈕時進入全螢幕（需要使用者手勢）
document.getElementById("fullscreenBtn").addEventListener("click", () => {
  if (document.fullscreenEnabled) {
    gameContainer.requestFullscreen().catch(err => {
      console.error("全螢幕請求失敗：", err);
    });
  }
});

// 按鍵切換全螢幕
document.addEventListener("keydown", (e) => {
  if (e.key === "F11") {
    e.preventDefault();
    if (!document.fullscreenElement) {
      gameContainer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
});

// 回應全螢幕變更（調整畫布大小、調整 UI）
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    resizeCanvasToFullscreen();
  } else {
    resizeCanvasToWindowed();
  }
});
```

### 備註 (Notes)

- 僅能為了回應使用者手勢（點擊、按鍵動作）而請求全螢幕。
- 使用者隨時可以透過 Escape 鍵或 F11 退出。
- 位於 iframe 中的嵌入式遊戲需要 `allowfullscreen` 屬性。
- 在 UI 中提供此功能前，請先檢查 `Document.fullscreenEnabled`。

---

## Gamepad API

### 它是什麼 (What It Is)

Gamepad API 提供了一個標準化介面，用於偵測與讀取來自遊戲手把與遊戲控制器的輸入。它公開了按鈕按下、類比搖桿位置以及控制器連接事件，在瀏覽器遊戲中實現了遊戲機風格的控制。

### 為何對遊戲很重要 (Why It Matters for Games)

- **遊戲機等級的輸入**：在瀏覽器遊戲中支援 Xbox、PlayStation 與通用控制器。
- **多個控制器**：同時偵測並處理多個遊戲手把以進行本機多人遊戲。
- **類比輸入**：讀取類比搖桿軸與具備壓力感應功能的觸發鍵，以實現細緻的控制。
- **觸覺回饋**：透過 `GamepadHapticActuator` 提供實驗性的震動支援。

### 關鍵介面 (Key Interfaces)

| 介面 | 說明 |
|-----------|-------------|
| `Gamepad` | 代表具有按鈕、軸與中繼資料的已連接控制器 |
| `GamepadButton` | 代表單個按鈕 — `pressed` (布林值) 與 `value` (壓力 0..1) |
| `GamepadEvent` | 適用於 `gamepadconnected` 與 `gamepaddisconnected` 事件的事件物件 |
| `GamepadHapticActuator` | 硬體觸覺回饋介面（實驗性） |

### 關鍵方法與事件 (Key Methods and Events)

| API | 說明 |
|-----|-------------|
| `navigator.getGamepads()` | 傳回包含所有已連接控制器的 `Gamepad` 物件陣列 |
| `gamepadconnected` 事件 | 當控制器連接時在 `window` 上觸發 |
| `gamepaddisconnected` 事件 | 當控制器中斷連接時在 `window` 上觸發 |

### 程式碼範例 (Code Example)

```javascript
// 偵測控制器連接
window.addEventListener("gamepadconnected", (e) => {
  console.log(`遊戲手把已連接：${e.gamepad.id}`);
});

window.addEventListener("gamepaddisconnected", (e) => {
  console.log(`遊戲手把已中斷連線：${e.gamepad.id}`);
});

// 每影格輪詢遊戲手把狀態
function pollGamepads() {
  const gamepads = navigator.getGamepads();
  for (const gp of gamepads) {
    if (!gp) continue;

    // 讀取類比搖桿（軸）
    const leftStickX = gp.axes[0]; // -1 (左) 到 1 (右)
    const leftStickY = gp.axes[1]; // -1 (上) 到 1 (下)

    // 讀取按鈕
    if (gp.buttons[0].pressed) {
      // A 按鈕 / Cross — 跳躍
      player.jump();
    }
    if (gp.buttons[7].value > 0.1) {
      // 右觸發鍵 — 加速（類比壓力感應）
      player.accelerate(gp.buttons[7].value);
    }
  }
  requestAnimationFrame(pollGamepads);
}
requestAnimationFrame(pollGamepads);
```

---

## IndexedDB API

### 它是什麼 (What It Is)

IndexedDB 是一個內建於瀏覽器中的低階、非同步、具交易性的使用者端資料庫。它使用鍵值索引的物件儲存區來儲存大量的結構化資料（包括檔案與 Blob），並支援高效率查詢所需的索引。

### 為何對遊戲很重要 (Why It Matters for Games)

- **儲存遊戲狀態**：在各個工作階段之間保留玩家進度、庫存、角色屬性與關卡完成情況。
- **在本機快取資產**：儲存紋理、音訊檔案、關卡資料與其他資產，以減少網路請求並實現離線遊玩。
- **大容量儲存**：處理比 `localStorage`（限制約為 5 MB）多得多的資料。
- **非阻塞**：非同步作業可在儲存/載入期間保持遊戲迴圈流暢執行。
- **具交易性**：不可分割的讀寫作業可防止儲存時發生資料毀損。

### 關鍵介面 (Key Interfaces)

| 介面 | 目的 | 遊戲使用案例 |
|-----------|---------|---------------|
| `indexedDB.open()` | 開啟或建立資料庫 | 啟動時初始化遊戲資料庫 |
| `IDBDatabase` | 資料庫連線 | 管理連線生命週期 |
| `IDBTransaction` | 讀寫範圍與存取控制 | 不可分割的存檔作業 |
| `IDBObjectStore` | 主要資料容器 | 儲存玩家個人檔案、關卡資料、設定 |
| `IDBIndex` | 次要查閱鍵值 | 依型別、稀有度或其他屬性查詢項目 |
| `IDBCursor` | 迭代記錄 | 對遊戲資料進行批次作業 |
| `IDBKeyRange` | 定義查詢的鍵值範圍 | 獲取特定範圍內的分數、最近的存檔位 |
| `IDBRequest` | 非同步作業控制代碼 | 管理所有資料庫作業的回呼 |

### 程式碼範例 (Code Example)

```javascript
// 開啟（或建立）遊戲資料庫
const request = indexedDB.open("MyGameDB", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  // 為存檔資料建立物件儲存區
  const saveStore = db.createObjectStore("saves", { keyPath: "slotId" });
  saveStore.createIndex("timestamp", "timestamp");
};

request.onsuccess = (event) => {
  const db = event.target.result;

  // 儲存遊戲狀態
  function saveGame(slot, gameState) {
    const tx = db.transaction("saves", "readwrite");
    const store = tx.objectStore("saves");
    store.put({
      slotId: slot,
      timestamp: Date.now(),
      playerHealth: gameState.health,
      playerPosition: gameState.position,
      inventory: gameState.inventory,
    });
  }

  // 載入遊戲狀態
  function loadGame(slot) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("saves", "readonly");
      const store = tx.objectStore("saves");
      const req = store.get(slot);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
};
```

---

## JavaScript

### 它是什麼 (What It Is)

JavaScript 是一種輕量級、動態型別、以原型為基礎、具備一級函式 (first-class functions) 的程式語言。它是網頁的腳本語言，也是所有瀏覽器遊戲邏輯的基礎語言，支援指令式、函數式與物件導向範式。

### 為何對遊戲很重要 (Why It Matters for Games)

- **執行環境**：JavaScript 是瀏覽器遊戲邏輯執行的語言。
- **事件驅動架構**：原生的事件處理支援輸入、計時器與非同步資源載入。
- **一級函式**：回呼 (callbacks) 與閉包 (closures) 實現了遊戲迴圈、事件處理器、行為樹與狀態機等模式。
- **動態物件**：執行時的物件建立與修改支援了實體元件系統 (ECS) 與以資料為基礎的設計。
- **現代類別語法**：ES6+ 類別為遊戲實體提供了簡潔的繼承階層結構。
- **Async/await**：為資產載入、伺服器通訊與場景轉換提供簡潔的非同步控制流。
- **記憶體回收 (Garbage collection)**：自動記憶體管理（雖然了解 GC 造成的暫停對於維持平滑影格率很重要）。

### 遊戲關鍵語言功能 (Key Language Features for Games)

| 功能 | 遊戲應用 |
|---------|------------------|
| 類別與繼承 | 實體階層結構 (GameObject, Player, Enemy) |
| 閉包 | 在回呼與事件處理器中封裝狀態 |
| `requestAnimationFrame` | 核心遊戲迴圈驅動程式 |
| Promises / async-await | 資產載入、伺服器呼叫、場景轉換 |
| 解構與展開運算子 | 簡潔的設定與狀態傳遞 |
| `Map` 與 `Set` | 實體查閱表、唯一 ID 追蹤、碰撞集合 |
| 範本字串 | 偵錯輸出、動態文字轉譯 |
| 模組 (import/export) | 將遊戲程式碼組織為系統與元件 |

### 程式碼範例 (Code Example)

```javascript
// ES6+ 遊戲實體模式
class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
  }
  update(dt) { /* 在子類別中覆寫 */ }
  render(ctx) { /* 在子類別中覆寫 */ }
}

class Player extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.health = 100;
    this.speed = 200;
  }
  update(dt) {
    if (input.left) this.x -= this.speed * dt;
    if (input.right) this.x += this.speed * dt;
  }
  render(ctx) {
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x, this.y, 32, 32);
  }
}

// 使用 requestAnimationFrame 的遊戲迴圈
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  for (const entity of entities) {
    entity.update(dt);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const entity of entities) {
    entity.render(ctx);
  }
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

---

## 指標鎖定 API (Pointer Lock API)

### 它是什麼 (What It Is)

指標鎖定 API（前身為滑鼠鎖定 API）提供對原始滑鼠移動增量的存取，而非絕對游標位置。它將滑鼠事件鎖定到單個元素上，移除游標移動邊界並隱藏游標 — 這對於第一人稱相機控制及類似機制至關重要。

### 為何對遊戲很重要 (Why It Matters for Games)

- **第一人稱相機控制**：透過物理性移動滑鼠來移動相機，無螢幕邊緣限制。
- **無游標干擾**：游標被隱藏，增加沉浸感。
- **持久鎖定**：一旦啟動，移動資料會持續流動，與滑鼠按鈕狀態無關。
- **原始輸入選項**：`unadjustedMovement` 旗標會停用作業系統層級的滑鼠加速度，為競技遊戲提供一致的瞄準感。
- **釋放滑鼠按鈕**：由於移動僅由增量處理，點擊可以映射到遊戲動作（射擊、互動）。

### 關鍵介面與方法 (Key Interfaces and Methods)

| API | 說明 |
|-----|-------------|
| `element.requestPointerLock(options?)` | 將指標鎖定到元素。傳回一個 `Promise`。 |
| `document.exitPointerLock()` | 釋放指標鎖定。 |
| `document.pointerLockElement` | 目前持有鎖定的元素，若無則為 `null`。 |
| `MouseEvent.movementX` | 自上次 `mousemove` 事件以來的水平增量。 |
| `MouseEvent.movementY` | 自上次 `mousemove` 事件以來的垂直增量。 |
| `pointerlockchange` 事件 | 當鎖定狀態變更時觸發。 |
| `pointerlockerror` 事件 | 若鎖定或解鎖失敗時觸發。 |

### 程式碼範例 (Code Example)

```javascript
const canvas = document.getElementById("game");

// 點擊時請求指標鎖定（需要使用者手勢）
canvas.addEventListener("click", async () => {
  if (!document.pointerLockElement) {
    await canvas.requestPointerLock({
      unadjustedMovement: true, // 原始輸入，無作業系統加速度
    });
  }
});

// 回應鎖定狀態變更
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) {
    document.addEventListener("mousemove", handleMouseMove);
  } else {
    document.removeEventListener("mousemove", handleMouseMove);
  }
});

// 使用移動增量進行相機旋轉
const sensitivity = 0.002;
function handleMouseMove(e) {
  camera.yaw   += e.movementX * sensitivity;
  camera.pitch  += e.movementY * sensitivity;
  camera.pitch   = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.pitch));
}
```

### 備註 (Notes)

- 僅能為了回應使用者手勢（點擊、按鍵動作）而請求指標鎖定。
- 使用者隨時可以透過 Escape 鍵退出。
- 遭沙盒化 (sandboxed) 的 iframe 需要 `allow-pointer-lock` 屬性。

---

## SVG (可縮放向量圖形) (SVG (Scalable Vector Graphics))

### 它是什麼 (What It Is)

SVG 是一種基於 XML 的標記語言，用於描述二維向量圖形。與點陣格式（PNG、JPEG）不同，SVG 影像可縮放到任何解析度而不損失品質。SVG 與 CSS、DOM 和 JavaScript 整合，使得元素具備可編寫指令碼與互動的特性。

### 為何對遊戲很重要 (Why It Matters for Games)

- **解析度獨立性**：單個 SVG 資產在任何螢幕尺寸或像素密度上看起來都很清晰 — 非常適合回應式遊戲 UI。
- **輕量級**：以文字為基礎且可壓縮，減少 UI 美術與圖示的下載大小。
- **透過 DOM 可編寫指令碼**：SVG 元素可以使用 JavaScript 即時建立、修改與製作動畫。
- **CSS 樣式設定**：SVG 形狀接受填充、描邊、透明度、轉換、濾鏡與動畫的 CSS 規則。
- **內建動畫**：SMIL 動畫元素（`<animate>`、`<animateTransform>`、`<animateMotion>`）用於宣告式運動。
- **濾鏡與效果**：透過 SVG 濾鏡基元實現高斯模糊、投射陰影、顏色矩陣與混合模式。

### 關鍵元素 (Key Elements)

| 元素 | 遊戲使用案例 |
|---------|---------------|
| `<rect>` | 生命條、UI 面板、平台 |
| `<circle>`, `<ellipse>` | 目標、粒子、指示器 |
| `<path>` | 複雜的向量美術、自訂形狀 |
| `<polygon>`, `<polyline>` | 網格重疊層、線框元素 |
| `<g>` | 群組元素以進行集體轉換 |
| `<defs>`, `<use>`, `<symbol>` | 可重用的精靈定義 |
| `<text>`, `<tspan>` | 分數顯示、標籤、對話 |
| `<filter>` | 模糊、陰影與顏色效果 |
| `<clipPath>`, `<mask>` | 視埠裁剪、揭示效果 |
| `<linearGradient>`, `<radialGradient>` | 陰影與深度效果 |
| `<animate>`, `<animateTransform>` | 宣告式 UI 動畫 |

### 程式碼範例 (Code Example)

```html
<!-- 一個簡單的 SVG 生命條 -->
<svg width="220" height="30" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="limegreen" />
      <stop offset="100%" stop-color="green" />
    </linearGradient>
  </defs>
  <!-- 背景 -->
  <rect x="1" y="1" width="218" height="28" rx="5" fill="#333" stroke="#fff" stroke-width="1" />
  <!-- 生命值填充（寬度透過 JS 控制） -->
  <rect id="health-fill" x="3" y="3" width="160" height="24" rx="4" fill="url(#healthGrad)">
    <animate attributeName="width" from="214" to="60" dur="3s" fill="freeze" />
  </rect>
</svg>
```

```javascript
// 以程式化方式更新生命條
function setHealth(percent) {
  const maxWidth = 214;
  document.getElementById("health-fill")
    .setAttribute("width", maxWidth * (percent / 100));
}
```

---

## 型別化陣列 (Typed Arrays)

### 它們是什麼 (What They Are)

型別化陣列是位於原始二進位資料緩衝區 (`ArrayBuffer`) 之上的陣列式視圖。與一般 JavaScript 陣列不同，每個型別化陣列都有固定的元素型別與大小，提供可預測的記憶體佈局與高效的資料存取。沒有單一的 `TypedArray` 建構函式；取而代之的是使用特定的建構函式，如 `Float32Array`、`Uint8Array` 與 `Uint16Array`。

### 為何對遊戲很重要 (Why They Matter for Games)

- **WebGL 頂點與索引緩衝區**：WebGL 方法直接接受用於位置、法線、紋理座標、顏色與索引的型別化陣列。
- **Web Audio 緩衝區**：音訊取樣資料以 `Float32Array` 形式儲存與操作。
- **二進位資產載入**：直接解析二進位檔案格式（模型、紋理、關卡資料）。
- **記憶體效率**：固定大小的元素，無裝箱 (boxing) 開銷。
- **WebAssembly 互通性**：透過 `SharedArrayBuffer` 與型別化陣列視圖在 JavaScript 與 Wasm 模組之間共用記憶體。
- **網路序列化**：高效地打包遊戲狀態以進行多人遊戲傳輸。

### 關鍵型別 (Key Types)

| 型別 | 位元組 | 範圍 | 遊戲使用案例 |
|------|-------|-------|---------------|
| `Float32Array` | 4 | ~3.4e38 | 頂點位置、法線、UV、物理值 |
| `Float64Array` | 8 | ~1.8e308 | 高精確度計算、模擬 |
| `Uint8Array` | 1 | 0 — 255 | 紋理/像素資料、顏色通道 |
| `Uint8ClampedArray` | 1 | 0 — 255 (截斷) | `ImageData` 像素操作 |
| `Uint16Array` | 2 | 0 — 65535 | 索引緩衝區（小型網格） |
| `Uint32Array` | 4 | 0 — ~43 億 | 索引緩衝區（大型網格）、ID |
| `Int16Array` | 2 | -32768 — 32767 | 音訊取樣、量化法線 |
| `Int32Array` | 4 | 約 -21 億 — 21 億 | 整數遊戲資料 |

### 關鍵屬性與方法 (Key Properties and Methods)

```javascript
const verts = new Float32Array([0, 0, 0,  1, 0, 0,  0, 1, 0]);

verts.buffer;             // 底層 ArrayBuffer
verts.byteLength;         // 位元組總大小
verts.byteOffset;         // 在緩衝區中的位元組偏移量
verts.length;             // 元素數量
verts.BYTES_PER_ELEMENT;  // Float32Array 為 4

// 寫入資料
verts.set([1, 2, 3], 0);            // 在偏移處複製值
verts.copyWithin(6, 0, 3);          // 將第一個頂點複製到第三個插槽

// 讀取子視圖（無須複製）
const firstTriangle = verts.subarray(0, 9);

// 函數式方法
const scaled = verts.map(v => v * 2);
const max = verts.reduce((a, v) => Math.max(a, v), -Infinity);
```

### 程式碼範例 (Code Example)

```javascript
// 建構一個用於 WebGL 轉譯的矩形
const positions = new Float32Array([
  -0.5, -0.5, 0,   // 左下
   0.5, -0.5, 0,   // 右下
   0.5,  0.5, 0,   // 右上
  -0.5,  0.5, 0,   // 左上
]);

const indices = new Uint16Array([
  0, 1, 2,  // 第一個三角形
  0, 2, 3,  // 第二個三角形
]);

// 上傳至 WebGL
const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const idxBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// 為 Web Audio 產生一個 440 Hz 的正弦波
const sampleRate = 44100;
const audioBuffer = new Float32Array(sampleRate); // 1 秒
for (let i = 0; i < sampleRate; i++) {
  audioBuffer[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
}
```

---

## Web Audio API

### 它是什麼 (What It Is)

Web Audio API 是一個用於控制網頁音訊的高階系統。它使用模組化路由圖，其中音訊來源透過效果節點連接到目的地（揚聲器）。它提供高精確度計時、低延遲，並具有基於來源-接聽者模型的內建 3D 空間音訊。

### 為何對遊戲很重要 (Why It Matters for Games)

- **低延遲播放**：音效以極短延遲回應遊戲事件。
- **3D 空間音訊**：在 3D 空間中定位相對於玩家/接聽者的聲音，實現具方向性與距離感的音訊。
- **模組化效果管線**：串接增益、殘響、濾鏡、壓縮與破音節點以實現動態音場。
- **精確排程**：將聲音安排在精確的取樣級時間，適用於節奏遊戲、序列音樂與計時事件。
- **即時分析**：`AnalyserNode` 為音訊互動視覺效果提供頻率與波形資料。
- **程序化音訊**：`OscillatorNode` 為合成音效與 UI 音調產生波形。

### 關鍵介面 (Key Interfaces)

| 介面 | 目的 |
|-----------|---------|
| `AudioContext` | 主要的音訊處理圖；必須首先建立 |
| `AudioBufferSourceNode` | 從 `AudioBuffer` 播放預載的音訊（SFX、音樂） |
| `OscillatorNode` | 產生波形（正弦波、方波、三角波、鋸齒波） |
| `GainNode` | 控制音量 / 振幅 |
| `BiquadFilterNode` | 低通、高通、帶通濾鏡 |
| `ConvolverNode` | 使用脈衝響應實現捲積殘響 |
| `DelayNode` | 延遲線效果（回音、合聲） |
| `DynamicsCompressorNode` | 混合多種聲音時防止破音 |
| `PannerNode` | 在 3D 空間中定位音訊來源 |
| `AudioListener` | 代表玩家在 3D 空間中的耳朵 |
| `StereoPannerNode` | 簡單的左右聲道平衡 |
| `AnalyserNode` | 即時頻率與時域分析 |
| `AudioWorkletNode` | 在主執行緒外進行自訂音訊處理 |

### 常用路由模式 (Common Routing Patterns)

| 使用案例 | 路由圖 |
|----------|---------------|
| 背景音樂 | `BufferSource` -> `GainNode` -> `Destination` |
| 具定位感的 SFX | `BufferSource` -> `PannerNode` -> `GainNode` -> `Destination` |
| 殘響環境 | `BufferSource` -> `ConvolverNode` -> `GainNode` -> `Destination` |
| UI 回饋音 | `OscillatorNode` -> `GainNode` -> `Destination` |
| 主混音 | 多個來源 -> 個別 `GainNode` -> `DynamicsCompressorNode` -> `Destination` |

### 程式碼範例 (Code Example)

```javascript
const audioCtx = new AudioContext();

// 載入並播放一個音效
async function playSFX(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;

  // 增加增益控制
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.8;

  // 連接：來源 -> 增益 -> 揚聲器
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  source.start(0);
}

// 3D 空間定位音訊
function playPositionalSound(buffer, x, y, z) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  const panner = audioCtx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 100;
  panner.positionX.value = x;
  panner.positionY.value = y;
  panner.positionZ.value = z;

  source.connect(panner);
  panner.connect(audioCtx.destination);
  source.start(0);
}

// 每影格更新接聽者位置（與相機/玩家匹配）
function updateListener(playerPos, playerForward, playerUp) {
  const listener = audioCtx.listener;
  listener.positionX.value = playerPos.x;
  listener.positionY.value = playerPos.y;
  listener.positionZ.value = playerPos.z;
  listener.forwardX.value = playerForward.x;
  listener.forwardY.value = playerForward.y;
  listener.forwardZ.value = playerForward.z;
  listener.upX.value = playerUp.x;
  listener.upY.value = playerUp.y;
  listener.upZ.value = playerUp.z;
}
```

---

## WebGL API

### 它是什麼 (What It Is)

WebGL (Web Graphics Library) 是一個 JavaScript API，用於在瀏覽器內轉譯硬體加速的 2D 與 3D 圖形。它實作了符合 OpenGL ES 2.0 (WebGL 1) 與 OpenGL ES 3.0 (WebGL 2) 規範的設定檔，透過 HTML `<canvas>` 元素運作，並使用裝置 GPU 進行轉譯。

### 為何對遊戲很重要 (Why It Matters for Games)

- **GPU 加速轉譯**：使用裝置 GPU 實現高影格率的即時 3D 圖形。
- **著色器程式編寫**：使用 GLSL 編寫頂點與片段著色器，實現自訂視覺效果、光照、陰影與後製處理。
- **3D 與 2D**：同時適用於全 3D 遊戲與高效能 2D 轉譯。
- **無須外掛程式**：在所有現代瀏覽器中原生執行。
- **豐富生態系統**：three.js、Babylon.js、PlayCanvas 與 Pixi.js 等函式庫簡化了 WebGL 遊戲開發。

### 關鍵介面 (Key Interfaces)

| 介面 | 目的 |
|-----------|---------|
| `WebGLRenderingContext` | WebGL 1 轉譯內容 (OpenGL ES 2.0) |
| `WebGL2RenderingContext` | WebGL 2 轉譯內容 (OpenGL ES 3.0) |
| `WebGLProgram` | 連結好的頂點 + 片段著色器程式 |
| `WebGLShader` | 個別頂點或片段著色器 |
| `WebGLBuffer` | GPU 記憶體緩衝區（頂點、索引） |
| `WebGLTexture` | 表面使用的紋理資料 |
| `WebGLFramebuffer` | 離屏轉譯目標（陰影貼圖、後製處理） |
| `WebGLRenderbuffer` | 非紋理轉譯緩衝區（深度、模板） |
| `WebGLVertexArrayObject` | 快取的頂點屬性設定 (WebGL 2) |
| `WebGLUniformLocation` | 對著色器 uniform 變數的參考 |
| `WebGLSampler` | 紋理取樣參數 (WebGL 2) |
| `WebGLTransformFeedback` | GPU 對 GPU 資料串流 (WebGL 2) |

### 對遊戲很重要的 WebGL 2 功能 (WebGL 2 Features Important for Games)

- **3D 紋理**：體積轉譯、查閱表。
- **執行個體化轉譯 (Instanced Rendering)**：`drawArraysInstanced()` / `drawElementsInstanced()` 用於高效繪製數千個相同的物件。
- **多重轉譯目標**：`drawBuffers()` 用於延遲轉譯管線。
- **Uniform 緩衝區物件**：跨繪圖呼叫高效共享著色器資料。
- **轉換回饋 (Transform Feedback)**：捕捉頂點著色器輸出，用於 GPU 驅動的粒子系統與模擬。
- **頂點陣列物件**：快取頂點狀態，減少每次繪圖的設定開銷。

### 內容管理事件 (Context Management Events)

| 事件 | 說明 |
|-------|-------------|
| `webglcontextlost` | GPU 內容遺失（裝置中斷連接、資源限制）。遊戲必須優雅處理此情況。 |
| `webglcontextrestored` | GPU 內容已還原。遊戲應重新載入 GPU 資源。 |
| `webglcontextcreationerror` | 內容初始化失敗。 |

### 程式碼範例 (Code Example)

```javascript
const canvas = document.getElementById("game");
const gl = canvas.getContext("webgl2");

// 頂點著色器
const vsSource = `#version 300 es
  in vec4 aPosition;
  uniform mat4 uModelViewProjection;
  void main() {
    gl_Position = uModelViewProjection * aPosition;
  }
`;

// 片段著色器
const fsSource = `#version 300 es
  precision mediump float;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(1.0, 0.5, 0.2, 1.0);
  }
`;

function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// 上傳頂點資料
const positions = new Float32Array([0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const aPos = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

// 轉譯
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

### 建議的函式庫 (Recommended Libraries)

| 函式庫 | 說明 |
|---------|-------------|
| three.js | 功能豐富的 3D 引擎 |
| Babylon.js | 具備物理、音訊與網路功能的完整遊戲引擎 |
| PlayCanvas | 雲端型遊戲引擎 |
| Pixi.js | 輕量級 2D 轉譯器 |
| glMatrix | 矩陣與向量數學函式庫 |

---

## WebRTC API

### 它是什麼 (What It Is)

WebRTC (Web Real-Time Communication) 實現了瀏覽器之間的點對點通訊，用於音訊、影片與任意資料交換 — 無須外掛程式或中介中繼伺服器（雖然會使用訊令伺服器以及 STUN/TURN 進行連線設定與 NAT 穿越）。

### 為何對遊戲很重要 (Why It Matters for Games)

- **點對點多人遊戲**：在玩家之間建立直接連線，減少延遲，並為小規模遊戲省去專用遊戲伺服器。
- **低延遲資料通道**：`RTCDataChannel` 以最小開銷發送二進位遊戲狀態更新，支援可靠與不可靠傳遞模式。
- **語音聊天**：內建的音訊/影片串流實現了遊戲內語音通訊。
- **減少伺服器成本**：直接的同儕連線可將頻寬與處理負荷從集中式伺服器卸載。

### 關鍵介面 (Key Interfaces)

| 介面 | 目的 |
|-----------|---------|
| `RTCPeerConnection` | 管理兩個同儕之間的連線，包括媒體串流與資料通道 |
| `RTCDataChannel` | 用於任意資料（遊戲狀態、指令、聊天）的雙向通道 |
| `RTCSessionDescription` | 透過 SDP 進行工作階段協商（提供/回答模型） |
| `RTCIceCandidate` | 用於 NAT/防火牆穿越的連線性候選者 |
| `RTCRtpSender` / `RTCRtpReceiver` | 管理音訊/影片編碼與傳輸 |
| `RTCStatsReport` | 連線統計資料（延遲、封包遺失、頻寬），用於最佳化 |

### 關鍵事件 (Key Events)

| 事件 | 說明 |
|-------|-------------|
| `datachannel` | 遠端同儕開啟了資料通道 |
| `connectionstatechange` | 同儕連線狀態已變更 |
| `icecandidate` | 有新的 ICE 候選者可用 |
| `track` | 傳入的媒體軌道（音訊/影片） |

### 連線生命週期 (Connection Lifecycle)

1. 在每個同儕端建立 `RTCPeerConnection`。
2. 透過訊令 (signaling) 伺服器（通常是 WebSocket）交換 SDP 提供 (offers)/回答 (answers)。
3. 交換 ICE 候選者以進行 NAT 穿越。
4. 同儕端直接連線。
5. 開啟 `RTCDataChannel` 傳輸遊戲資料，及/或增加媒體軌道進行語音通訊。
6. 使用 `RTCStatsReport` 監控效能。
7. 當工作階段結束時，關閉通道與連線。

### 程式碼範例 (Code Example)

```javascript
// 同儕 A：建立連線與資料通道
const peerA = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

const gameChannel = peerA.createDataChannel("game", {
  ordered: false,       // 允許不按順序傳遞（較低延遲）
  maxRetransmits: 0,    // 不可靠模式（類似 UDP）
});

gameChannel.onopen = () => {
  // 發送遊戲狀態更新
  gameChannel.send(JSON.stringify({ type: "move", x: 10, y: 20 }));
};

gameChannel.onmessage = (event) => {
  const data = JSON.parse(event.data);
  applyRemoteGameState(data);
};

// 同儕 B：接收資料通道
const peerB = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

peerB.ondatachannel = (event) => {
  const channel = event.channel;
  channel.onmessage = (e) => {
    const data = JSON.parse(e.data);
    applyRemoteGameState(data);
  };
};

// 訊令（透過您的訊令伺服器交換提供/回答）
async function connect() {
  const offer = await peerA.createOffer();
  await peerA.setLocalDescription(offer);
  // 透過訊令伺服器將提供發送給同儕 B...

  // 同儕 B 接收提供，設定遠端描述，建立回答
  await peerB.setRemoteDescription(offer);
  const answer = await peerB.createAnswer();
  await peerB.setLocalDescription(answer);
  // 將回答發送回同儕 A...

  await peerA.setRemoteDescription(answer);
}
```

---

## WebSockets API

### 它是什麼 (What It Is)

WebSocket API 透過單個 TCP 連線在瀏覽器與伺服器之間實現持久、全雙工的通訊。與 HTTP 請求-回應不同，WebSocket 連線保持開啟狀態，允許伺服器隨時向使用者端推送資料。

### 為何對遊戲很重要 (Why It Matters for Games)

- **即時多人遊戲**：在使用者端與伺服器之間串流玩家位置、遊戲事件與世界狀態，延遲極低。
- **伺服器推送更新**：伺服器可以立即向所有連接的玩家廣播遊戲狀態變更，無須輪詢。
- **低開銷**：每條訊息無須重複發送 HTTP 標頭；僅透過持久連線傳輸框架化資料。
- **支援二進位資料**：發送 `ArrayBuffer` 與 `Blob` 資料以實現高效的遊戲狀態序列化。
- **相容於 Web Worker**：在背景執行緒中執行 WebSocket 通訊，保持遊戲迴圈不被阻塞。

### 關鍵介面：WebSocket (Key Interface: WebSocket)

| 成員 | 說明 |
|--------|-------------|
| `new WebSocket(url, protocols?)` | 開啟與伺服器的連線 |
| `send(data)` | 傳輸資料 (string, ArrayBuffer, Blob) |
| `close(code?, reason?)` | 優雅地關閉連線 |
| `readyState` | 目前狀態：CONNECTING (0), OPEN (1), CLOSING (2), CLOSED (3) |
| `bufferedAmount` | 已加入佇列但尚未發送的位元組數（用於流量控制） |
| `binaryType` | 針對二進位資料設定為 `"arraybuffer"` 或 `"blob"` |

### 事件 (Events)

| 事件 | 說明 |
|-------|-------------|
| `open` | 連線已建立且就緒 |
| `message` | 從伺服器接收到資料（透過 `event.data` 存取） |
| `close` | 連線已關閉（透過 `CloseEvent` 存取代碼/原因） |
| `error` | 發生錯誤 |

### 程式碼範例 (Code Example)

```javascript
// 連接到遊戲伺服器
const socket = new WebSocket("wss://game.example.com/ws");
socket.binaryType = "arraybuffer";

socket.addEventListener("open", () => {
  // 驗證並加入遊戲室
  socket.send(JSON.stringify({
    type: "join",
    room: "room-42",
    playerId: "player-1"
  }));
});

socket.addEventListener("message", (event) => {
  if (typeof event.data === "string") {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
      case "state":
        updateWorldState(msg.state);
        break;
      case "playerJoined":
        addRemotePlayer(msg.player);
        break;
      case "playerLeft":
        removeRemotePlayer(msg.playerId);
        break;
    }
  } else {
    // 二進位資料 — 例如：壓縮後的遊戲狀態
    const view = new DataView(event.data);
    processRawGameState(view);
  }
});

socket.addEventListener("close", (event) => {
  console.log(`已中斷連線：${event.code} ${event.reason}`);
  showReconnectPrompt();
});

// 在每個 tick 向伺服器發送玩家輸入
function sendInput(input) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "input",
      keys: input.keys,
      mouseX: input.mouseX,
      mouseY: input.mouseY,
      timestamp: performance.now(),
    }));
  }
}
```

### 備註 (Notes)

- 當玩家導航離開時，關閉 WebSocket 連線，以避免阻塞瀏覽器的返回-前進快取 (back-forward cache)。
- 對於需要不可靠（類似 UDP）傳遞的遊戲，請考慮 WebRTC 資料通道或較新的 WebTransport API。
- 熱門的伺服器端函式庫：Socket.IO, ws (Node.js), Gorilla WebSocket (Go), SignalR (.NET)。

---

## WebVR API（已棄用） (WebVR API (Deprecated))

### 它是什麼 (What It Is)

WebVR API 提供從網頁瀏覽器存取虛擬實境裝置（頭戴式顯示器，如 Oculus Rift 與 HTC Vive）的介面。它公開了顯示器屬性、頭部追蹤姿勢資料以及立體轉譯功能，實現沉浸式 VR 體驗。

### 為何對遊戲很重要 (Why It Matters for Games)

- **沉浸式 VR 遊戲**：轉譯由即時頭部追蹤驅動的立體 3D 場景。
- **房間規模體驗**：`VRStageParameters` 描述了物理遊玩區域的維度。
- **控制器整合**：VR 控制器可透過 Gamepad API 存取，透過 `gamepad.displayId` 將每個控制器連結到 `VRDisplay`。

### 棄用通知 (Deprecation Notice)

WebVR API **已棄用且非標準**。它從未被批准為網頁標準，並已被 **WebXR Device API** 取代，後者支援 VR 與 AR，具備更廣泛的瀏覽器支援，並正朝向標準化發展。所有新的 VR 遊戲開發都應針對 WebXR。

### 關鍵介面 (Key Interfaces)

| 介面 | 目的 |
|-----------|---------|
| `VRDisplay` | 代表一個 VR 頭戴式裝置。核心方法：`requestPresent()`, `requestAnimationFrame()`, `getFrameData()`, `submitFrame()`。 |
| `VRFrameData` | 目前影格的姿勢、檢視矩陣與投影矩陣。 |
| `VRPose` | 特定時間點的位置、定向、速度與加速度。 |
| `VREyeParameters` | 逐眼的視野與轉譯偏移量。 |
| `VRStageParameters` | 房間規模遊玩區域的維度與轉換。 |
| `VRDisplayCapabilities` | 裝置功能旗標（具有位置追蹤、具有外部顯示器等）。 |
| `Navigator.getVRDisplays()` | 傳回一個 Promise，解析為已連接 `VRDisplay` 物件的陣列。 |

### 關鍵事件 (Key Events)

| 事件 | 說明 |
|-------|-------------|
| `vrdisplayconnect` | VR 頭戴式裝置已連接 |
| `vrdisplaydisconnect` | VR 頭戴式裝置已中斷連線 |
| `vrdisplaypresentchange` | 頭戴式裝置進入或退出呈現模式 |
| `vrdisplayactivate` | 頭戴式裝置已準備好呈現 |

### 程式碼範例 (Code Example)

```javascript
// 檢查 WebVR 支援
if (navigator.getVRDisplays) {
  navigator.getVRDisplays().then(displays => {
    if (displays.length === 0) return;
    const vrDisplay = displays[0];

    // 開始向頭戴式裝置呈現
    vrDisplay.requestPresent([{ source: canvas }]).then(() => {
      const frameData = new VRFrameData();

      function renderLoop() {
        vrDisplay.requestAnimationFrame(renderLoop);
        vrDisplay.getFrameData(frameData);

        // 轉譯左眼
        gl.viewport(0, 0, canvas.width / 2, canvas.height);
        renderScene(frameData.leftProjectionMatrix, frameData.leftViewMatrix);

        // 轉譯右眼
        gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        renderScene(frameData.rightProjectionMatrix, frameData.rightViewMatrix);

        vrDisplay.submitFrame();
      }
      renderLoop();
    });
  });
}
```

### 遷移至 WebXR (Migration to WebXR)

對於新專案，請改用 **WebXR Device API**。支援 WebXR 的框架包括：

- **A-Frame** — 宣告式實體元件 VR 框架
- **Babylon.js** — 具備 WebXR 支援的完整功能遊戲引擎
- **three.js** — 整合 WebXR 的輕量級 3D 函式庫
- **WebXR Polyfill** — 適用於舊版瀏覽器的回溯相容層

---

## Web Workers API

### 它是什麼 (What It Is)

Web Workers API 實現了在與主執行緒分開的背景執行緒中執行 JavaScript。Worker 在其自身的全域範圍內運作 (`DedicatedWorkerGlobalScope` 或 `SharedWorkerGlobalScope`)，無法直接存取 DOM，並透過訊息傳遞 (`postMessage` / `onmessage`) 與主執行緒通訊。

### 為何對遊戲很重要 (Why It Matters for Games)

- **卸載重度計算**：將物理模擬、路徑規劃、AI、程序化產生與碰撞偵測移至背景執行緒，使主執行緒維持在 60 fps。
- **平行資產處理**：在不阻塞轉譯的情況下解碼影像、解壓縮資料或解析關卡檔案。
- **OffscreenCanvas**：在 Worker 內對畫布進行轉譯，實現平行轉譯管線。
- **非阻塞網路**：在 Worker 中執行 `fetch()` 或 XHR 呼叫，保持遊戲迴圈流暢。

### Worker 型別 (Worker Types)

| 型別 | 說明 | 遊戲使用案例 |
|------|-------------|---------------|
| 專用 Worker (`Worker`) | 單一擁有者的背景執行緒 | 單一遊戲實例的物理、AI、路徑規劃 |
| 共用 Worker (`SharedWorker`) | 跨多個視窗/分頁共用 | 多分頁或多 iframe 的遊戲情境 |
| Service Worker | 具備離線支援的網路代理 | 資產快取、離線遊玩 |

### 關鍵介面 (Key Interfaces)

| API | 說明 |
|-----|-------------|
| `new Worker(scriptURL)` | 從指令碼檔案建立專用 Worker |
| `worker.postMessage(data)` | 向 Worker 發送資料 |
| `worker.onmessage` | 從 Worker 接收資料（透過 `event.data`） |
| `worker.terminate()` | 立即停止 Worker |
| 在 Worker 內部：`self.postMessage(data)` | 向主執行緒發送資料回傳 |
| 在 Worker 內部：`self.onmessage` | 從主執行緒接收資料 |

### 限制 (Limitations)

- Worker 無法存取 DOM。
- 無 `window` 物件；全域範圍有限。
- 資料預設為複製（結構化複製）；使用 `Transferable` 物件（ArrayBuffer, OffscreenCanvas）進行零複製傳輸。
- Worker 指令碼必須符合同源原則。

### 程式碼範例 (Code Example)

**主執行緒 (game.js)：**

```javascript
// 建立一個物理 Worker
const physicsWorker = new Worker("physics-worker.js");

// 每影格向 Worker 發送世界狀態
function updatePhysics(entities) {
  // 傳輸緩衝區以實現零複製效能
  const buffer = serializeEntities(entities);
  physicsWorker.postMessage({ type: "step", buffer }, [buffer]);
}

// 從 Worker 接收結果
physicsWorker.onmessage = (event) => {
  const { type, buffer } = event.data;
  if (type === "result") {
    applyPhysicsResults(buffer);
  }
};
```

**Worker 執行緒 (physics-worker.js)：**

```javascript
self.onmessage = (event) => {
  const { type, buffer } = event.data;
  if (type === "step") {
    const positions = new Float32Array(buffer);

    // 執行物理模擬
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 9.8 * (1 / 60); // Y 軸重力
    }

    // 發送結果回傳，並傳輸緩衝區
    self.postMessage({ type: "result", buffer: positions.buffer }, [positions.buffer]);
  }
};
```

---

## XMLHttpRequest

### 它是什麼 (What It Is)

`XMLHttpRequest` (XHR) 是一個內建的瀏覽器 API，用於在不重新整理頁面的情況下向伺服器發送 HTTP 請求。儘管其名稱如此，它可以檢索任何資料型別 — JSON、二進位（ArrayBuffer、Blob）、純文字、XML 與 HTML。雖然在新程式碼中很大程度上已被 Fetch API 取代，但它仍被廣泛使用且受到完全支援。

### 為何對遊戲很重要 (Why It Matters for Games)

- **資產載入**：在不阻塞遊戲迴圈的情況下，非同步檢索遊戲資產（影像、音訊、JSON 關卡資料、二進位模型檔案）。
- **二進位資料支援**：將 `responseType` 設定為 `"arraybuffer"` 或 `"blob"`，以便將二進位資產直接載入到用於 WebGL 或 Web Audio 的型別化陣列中。
- **進度追蹤**：`progress` 事件會報告下載進度，實現載入進度列。
- **伺服器通訊**：提交分數、驗證玩家、獲取排行榜，並將遊戲狀態與後端服務同步。
- **相容於 Web Worker**：XHR 可在 Web Worker 內部用於背景資產載入。

### 關鍵方法 (Key Methods)

| 方法 | 說明 |
|--------|-------------|
| `open(method, url, async?)` | 初始化請求（GET、POST 等） |
| `send(body?)` | 發送請求；主體可以是字串、FormData、ArrayBuffer、Blob |
| `setRequestHeader(name, value)` | 設定一個 HTTP 標頭（在 `open` 之後、`send` 之前呼叫） |
| `abort()` | 取消進行中的請求 |
| `getResponseHeader(name)` | 檢索特定的回應標頭值 |

### 關鍵屬性 (Key Properties)

| 屬性 | 說明 |
|----------|-------------|
| `response` | 由 `responseType` 指定型別的回應主體 |
| `responseType` | 預期的回應格式：`""`, `"text"`, `"json"`, `"arraybuffer"`, `"blob"`, `"document"` |
| `status` | HTTP 狀態碼 (200, 404 等) |
| `readyState` | 請求生命週期狀態 (0 = UNSENT 到 4 = DONE) |
| `timeout` | 請求自動中止前的毫秒數 |
| `withCredentials` | 是否在跨來源請求中包含 Cookie |

### 事件 (Events)

| 事件 | 說明 |
|-------|-------------|
| `load` | 請求成功完成 |
| `error` | 請求失敗 |
| `progress` | 下載期間的定期進度更新 |
| `abort` | 請求被中止 |
| `readystatechange` | `readyState` 已變更 |

### 程式碼範例 (Code Example)

```javascript
// 載入 JSON 關卡檔案
function loadLevel(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "json";

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error(`關卡載入失敗：${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("網路錯誤"));
    xhr.send();
  });
}

// 載入具備進度追蹤功能的二進位資產
function loadBinaryAsset(url, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response); // ArrayBuffer
      } else {
        reject(new Error(`資產載入失敗：${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("網路錯誤"));
    xhr.send();
  });
}

// 用法
loadLevel("levels/level1.json").then(data => initLevel(data));
loadBinaryAsset("models/tank.bin", pct => updateLoadingBar(pct))
  .then(buf => parseModel(new Float32Array(buf)));
```

### 關於 Fetch API 的註記 (Note on Fetch API)

對於新專案，通常建議使用 **Fetch API** (`fetch()`)。它提供更簡潔的基於 Promise 的介面、透過 `ReadableStream` 支援串流，並且能與 async/await 整合。然而，當您在掃描上傳進度事件或需要與舊程式碼建立更廣泛的相容性時，XHR 仍然具有其相關性。
