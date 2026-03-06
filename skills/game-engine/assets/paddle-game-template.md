# 球拍遊戲範本 (2D 打磚塊) (Paddle Game Template (2D Breakout))

這是一個使用純 JavaScript 和 HTML5 Canvas API 建構 2D 打磚塊遊戲的完整逐步指南。本範本涵蓋了開發的每個階段，從設定畫布到實作生命系統和精緻的遊戲迴圈。

**您將建構的內容：** 一個經典的打磚塊/球拍遊戲，玩家控制一個球拍來彈跳球並摧毀一區域的磚塊，具備分數追蹤、勝負條件、鍵盤和滑動控制以及生命系統。

**先決條件：** 基礎到進階的 JavaScript 知識以及對 HTML 的熟悉度。

**來源：** 基於 [MDN 2D Breakout Game Tutorial](https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript)。

---

## 步驟 1：建立畫布並在上面繪圖 (Step 1: Create the Canvas and Draw on It)

第一步是設定帶有 `<canvas>` 元素的 HTML 文件，並學習使用 2D 轉譯內容繪製基本形狀。

### HTML 結構 (HTML Structure)

建立包含嵌入式畫布元素的基礎 HTML 檔案：

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>遊戲開發畫布工作坊</title>
    <style>
      * {
        padding: 0;
        margin: 0;
      }
      canvas {
        background: #eeeeee;
        display: block;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <canvas id="myCanvas" width="480" height="320"></canvas>

    <script>
      // 此處編寫 JavaScript 程式碼
    </script>
  </body>
</html>
```

### 獲取畫布參考與 2D 內容 (Getting the Canvas Reference and 2D Context)

畫布元素提供了一個繪圖表面。您透過 2D 轉譯內容物件來存取它：

```javascript
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
```

- `canvas` 是對 HTML `<canvas>` 元素的參考。
- `ctx` 是 2D 轉譯內容物件，提供所有繪圖方法。

### 繪製填充矩形 (Drawing a Filled Rectangle)

使用 `rect()` 定義矩形，並使用 `fill()` 進行轉譯：

```javascript
ctx.beginPath();
ctx.rect(20, 40, 50, 50);
ctx.fillStyle = "red";
ctx.fill();
ctx.closePath();
```

- 前兩個參數 (`20, 40`) 設定左上角座標。
- 後兩個參數 (`50, 50`) 設定寬度和高度。
- `fillStyle` 設定填滿顏色。
- `fill()` 將形狀轉譯為實心填滿。

### 繪製圓形 (Drawing a Circle)

使用 `arc()` 定義圓形：

```javascript
ctx.beginPath();
ctx.arc(240, 160, 20, 0, Math.PI * 2, false);
ctx.fillStyle = "green";
ctx.fill();
ctx.closePath();
```

- `240, 160` — 中心 x, y 座標。
- `20` — 半徑。
- `0` — 起始角度（弧度）。
- `Math.PI * 2` — 結束角度（完整圓形）。
- `false` — 順時針繪製。

### 繪製描邊矩形（僅輪廓） (Drawing a Stroked Rectangle (Outline Only))

使用 `stroke()` 代替 `fill()` 來繪製輪廓，並使用 `strokeStyle` 設定輪廓顏色：

```javascript
ctx.beginPath();
ctx.rect(160, 10, 100, 40);
ctx.strokeStyle = "rgb(0 0 255 / 50%)";
ctx.stroke();
ctx.closePath();
```

- 使用具有 50% Alpha 透明度的 RGB 顏色。
- `stroke()` 僅繪製輪廓，而非實心填滿。

### 關鍵方法參考 (Key Methods Reference)

| 方法 | 目的 |
|--------|---------|
| `beginPath()` | 開始一個新的繪圖路徑 |
| `closePath()` | 關閉目前的繪圖路徑 |
| `rect(x, y, width, height)` | 定義一個矩形 |
| `arc(x, y, radius, startAngle, endAngle, counterclockwise)` | 定義一個圓形或弧線 |
| `fillStyle` | 設定填滿顏色 |
| `fill()` | 使用填滿顏色填滿形狀 |
| `strokeStyle` | 設定描邊（輪廓）顏色 |
| `stroke()` | 繪製形狀的輪廓 |

### 步驟 1 的完整程式碼 (Complete Code for Step 1)

```html
<canvas id="myCanvas" width="480" height="320"></canvas>

<style>
  * { padding: 0; margin: 0; }
  canvas { background: #eeeeee; display: block; margin: 0 auto; }
</style>

<script>
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  // 紅色實心正方形
  ctx.beginPath();
  ctx.rect(20, 40, 50, 50);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  // 綠色實心圓形
  ctx.beginPath();
  ctx.arc(240, 160, 20, 0, Math.PI * 2, false);
  ctx.fillStyle = "green";
  ctx.fill();
  ctx.closePath();

  // 藍色描邊矩形（半透明）
  ctx.beginPath();
  ctx.rect(160, 10, 100, 40);
  ctx.strokeStyle = "rgb(0 0 255 / 50%)";
  ctx.stroke();
  ctx.closePath();
</script>
```

---

## 步驟 2：移動球體 (Step 2: Move the Ball)

現在我們透過建立遊戲迴圈來製作球體的動畫，該迴圈在每影格重新繪製畫布，並使用速度變數更新球體位置。

### 建立繪圖迴圈 (Creating the Draw Loop)

定義一個使用 `setInterval` 重複執行的 `draw()` 函式：

```javascript
function draw() {
  // 繪圖程式碼
}
setInterval(draw, 10);
```

`setInterval(draw, 10)` 每 10 毫秒呼叫一次 `draw` 函式，產生約每秒 100 影格。

### 繪製球體 (Drawing the Ball)

在 `draw()` 函式內部，在固定位置繪製一個球體（圓形）：

```javascript
ctx.beginPath();
ctx.arc(50, 50, 10, 0, Math.PI * 2);
ctx.fillStyle = "#0095DD";
ctx.fill();
ctx.closePath();
```

### 增加位置變數 (Adding Position Variables)

使用變數代替硬編碼的位置，以便我們在每影格更新它們。將這些變數放在 `draw()` 函式上方：

```javascript
let x = canvas.width / 2;
let y = canvas.height - 30;
```

這會讓球體從畫布底部的水平中心開始。

### 增加速度變數 (Adding Velocity Variables)

為水平 (`dx`) 和垂直 (`dy`) 移動定義速度與方向：

```javascript
let dx = 2;
let dy = -2;
```

- `dx = 2` 每影格向右移動球體 2 像素。
- `dy = -2` 每影格向上移動球體 2 像素（負 y 在畫布上是向上的）。

### 每影格更新位置 (Updating Position Each Frame)

在 `draw()` 函式末尾增加位置更新：

```javascript
x += dx;
y += dy;
```

### 清除畫布 (Clearing the Canvas)

如果不清除，球體會留下軌跡。在每影格開始時增加 `clearRect()`：

```javascript
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

### 重構為獨立的 drawBall() 函式 (Refactoring Into a Separate drawBall() Function)

為了使程式碼整潔且易於維護，請分離球體繪製邏輯：

```javascript
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}
```

### 步驟 2 的完整程式碼 (Complete Code for Step 2)

```javascript
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  x += dx;
  y += dy;
}

setInterval(draw, 10);
```

**核心概念：**
- **動畫迴圈**：`setInterval(draw, 10)` 持續重新繪製場景。
- **位置變數**：`x` 和 `y` 追蹤球體目前位置。
- **速度變數**：`dx` 和 `dy` 決定每影格的移動量。
- **清除畫布**：`clearRect()` 在繪製新影格前移除前一影格。

---

## 步驟 3：碰撞牆壁反彈 (Step 3: Bounce Off the Walls)

我們增加碰撞偵測，使球體從畫布邊緣彈回而不是消失。

### 定義球體半徑 (Defining the Ball Radius)

將球體半徑擷取到一個命名的常數中，以便在碰撞計算中重複使用：

```javascript
const ballRadius = 10;
```

更新 `drawBall()` 以使用此變數：

```javascript
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}
```

### 基本牆壁碰撞（無半徑調整） (Basic Wall Collision (Without Radius Adjustment))

最簡單的方法是檢查球體的下一個位置是否超出畫布邊界：

```javascript
// 左右牆壁
if (x + dx > canvas.width || x + dx < 0) {
  dx = -dx;
}

// 上下牆壁
if (y + dy > canvas.height || y + dy < 0) {
  dy = -dy;
}
```

反轉 `dx` 或 `dy`（乘以 -1）會改變球體的方向。

### 改進的碰撞（考慮球體半徑） (Improved Collision (Accounting for Ball Radius))

基本版本會讓球體在彈回前陷進牆壁一半。若要修復此問題，請考慮球體半徑：

```javascript
// 左右牆壁
if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
  dx = -dx;
}

// 上下牆壁
if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
  dy = -dy;
}
```

### 碰撞偵測條件 (Collision Detection Conditions)

| 牆壁 | 條件 | 動作 |
|------|-----------|--------|
| **左側** | `x + dx < ballRadius` | `dx = -dx` |
| **右側** | `x + dx > canvas.width - ballRadius` | `dx = -dx` |
| **上方** | `y + dy < ballRadius` | `dy = -dy` |
| **下方** | `y + dy > canvas.height - ballRadius` | `dy = -dy` |

### 步驟 3 的完整程式碼 (Complete Code for Step 3)

```javascript
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 10;

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();

  // 碰撞偵測 - 左右牆壁
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }

  // 碰撞偵測 - 上下牆壁
  if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
    dy = -dy;
  }

  x += dx;
  y += dy;
}

setInterval(draw, 10);
```

---

## 步驟 4：球拍與鍵盤控制 (Step 4: Paddle and Keyboard Controls)

現在我們在螢幕底部增加一個玩家控制的球拍，並串接鍵盤輸入（左右方向鍵）。

### 定義球拍變數 (Defining Paddle Variables)

```javascript
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
```

- `paddleHeight` 和 `paddleWidth` 定義球拍尺寸。
- `paddleX` 讓球拍從水平中心開始。它是 `let`，因為它會隨玩家移動而改變。

### 繪製球拍 (Drawing the Paddle)

建立 `drawPaddle()` 函式。球拍位於畫布的最底部：

```javascript
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}
```

- y 位置是 `canvas.height - paddleHeight`，使其與底部邊緣平齊。

### 鍵盤狀態變數 (Keyboard State Variables)

追蹤方向鍵目前是否被按下：

```javascript
let rightPressed = false;
let leftPressed = false;
```

### 按鍵動作事件接聽程式 (Event Listeners for Key Presses)

註冊 `keydown`（按下按鍵）和 `keyup`（放開按鍵）的處理常式：

```javascript
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
```

### 按鍵處理函式 (Key Handler Functions)

根據按下或放開的按鍵設定布林旗標：

```javascript
function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}
```

同時檢查 `"ArrowRight"`（現代瀏覽器）和 `"Right"`（舊版 IE/Edge）以確保相容性。

### 球拍移動邏輯（具備邊界檢查） (Paddle Movement Logic (With Boundary Checking))

在 `draw()` 函式內部增加此內容，根據按鍵狀態移動球拍，同時保持其在畫布邊界內：

```javascript
if (rightPressed) {
  paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
} else if (leftPressed) {
  paddleX = Math.max(paddleX - 7, 0);
}
```

- 球拍每影格移動 7 像素。
- `Math.min` 防止球拍超出右側邊緣。
- `Math.max` 防止球拍超出左側邊緣。

### 步驟 4 的完整程式碼 (Complete Code for Step 4)

```javascript
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 10;

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawPaddle();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
    dy = -dy;
  }

  if (rightPressed) {
    paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
  } else if (leftPressed) {
    paddleX = Math.max(paddleX - 7, 0);
  }

  x += dx;
  y += dy;
}

setInterval(draw, 10);
```

---

## 步驟 5：遊戲結束 (Step 5: Game Over)

我們將底部牆壁的反彈替換為實際的遊戲邏輯：球體應該從球拍彈回，但如果沒接住，則遊戲結束。

### 儲存間隔參考 (Storing the Interval Reference)

若要在遊戲結束時停止遊戲迴圈，請儲存間隔識別碼：

```javascript
let interval = 0;
```

然後指定 `setInterval` 的傳回值：

```javascript
interval = setInterval(draw, 10);
```

### 實作遊戲結束與球拍碰撞 (Implementing Game Over and Paddle Collision)

替換底部牆壁碰撞檢查。我們現在不再從底部邊緣彈回，而是檢查球體是撞到球拍還是沒接住：

```javascript
if (y + dy < ballRadius) {
  // 球體撞到上方牆壁 -- 彈回
  dy = -dy;
} else if (y + dy > canvas.height - ballRadius) {
  // 球體到達底部邊緣
  if (x > paddleX && x < paddleX + paddleWidth) {
    // 球體撞到球拍 -- 彈回
    dy = -dy;
  } else {
    // 球體沒接到球拍 -- 遊戲結束
    alert("遊戲結束 (GAME OVER)");
    document.location.reload();
    clearInterval(interval);
  }
}
```

**球拍碰撞原理：**
- `x > paddleX` — 球體越過球拍左側邊緣。
- `x < paddleX + paddleWidth` — 球體在球拍右側邊緣之前。
- 如果兩者皆為真，則球體在球拍上方，因此彈回。
- 如果球體到達底部而未撞到球拍，則遊戲結束。

### 步驟 5 的完整程式碼 (Complete Code for Step 5)

```javascript
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 10;

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;
let interval = 0;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawPaddle();

  // 左右牆壁碰撞
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }

  // 上方牆壁碰撞
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
    // 底部邊緣：球拍碰撞或遊戲結束
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      alert("遊戲結束 (GAME OVER)");
      document.location.reload();
      clearInterval(interval);
    }
  }

  // 球拍移動
  if (rightPressed) {
    paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
  } else if (leftPressed) {
    paddleX = Math.max(paddleX - 7, 0);
  }

  x += dx;
  y += dy;
}

interval = setInterval(draw, 10);
```

---

## 步驟 6：建置磚塊區域 (Step 6: Build the Brick Field)

現在我們建立球體將摧毀的磚塊網格。磚塊儲存在 2D 陣列中，並以列和欄繪製。

### 磚塊配置變數 (Brick Configuration Variables)

定義控制磚塊區域佈局的常數：

```javascript
const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
```

- `brickRowCount` / `brickColumnCount` — 有幾列和幾欄磚塊。
- `brickWidth` / `brickHeight` — 每個個別磚塊的尺寸。
- `brickPadding` — 磚塊之間的間距。
- `brickOffsetTop` / `brickOffsetLeft` — 從畫布上方和左側邊緣到第一塊磚塊的距離。

### 建立磚塊 2D 陣列 (Creating the Bricks 2D Array)

使用巢狀迴圈建立一個 2D 陣列。每塊磚塊儲存其 `x` 和 `y` 位置（最初為 `0`，在繪製期間計算）：

```javascript
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0 };
  }
}
```

### drawBricks() 函式 (The drawBricks() Function)

對每塊磚塊進行迴圈，計算其位置，儲存並繪製：

```javascript
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
      const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
      bricks[c][r].x = brickX;
      bricks[c][r].y = brickY;
      ctx.beginPath();
      ctx.rect(brickX, brickY, brickWidth, brickHeight);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }
  }
}
```

**位置計算公式：**
- `brickX = column * (brickWidth + brickPadding) + brickOffsetLeft`
- `brickY = row * (brickHeight + brickPadding) + brickOffsetTop`

這會建立一個具有一致間距和邊距的均勻網格。

### 在遊戲迴圈中呼叫 drawBricks() (Calling drawBricks() in the Game Loop)

在清除畫布後，在 `draw()` 函式開頭增加呼叫：

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  // ... draw 函式的其餘部分
}
```

### 步驟 6 的完整程式碼 (Complete Code for Step 6)

```javascript
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 10;

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;
let interval = 0;

const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0 };
  }
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
      const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
      bricks[c][r].x = brickX;
      bricks[c][r].y = brickY;
      ctx.beginPath();
      ctx.rect(brickX, brickY, brickWidth, brickHeight);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      alert("遊戲結束 (GAME OVER)");
      document.location.reload();
      clearInterval(interval);
    }
  }

  if (rightPressed) {
    paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
  } else if (leftPressed) {
    paddleX = Math.max(paddleX - 7, 0);
  }

  x += dx;
  y += dy;
}

interval = setInterval(draw, 10);
```

---

## 步驟 7：碰撞偵測 (Step 7: Collision Detection)

畫面上有了磚塊後，我們需要偵測球體何時撞到磚塊並使其消失。每塊磚塊都有一個 `status` 屬性：`1` 表示可見，`0` 表示已摧毀。

### 為磚塊增加狀態屬性 (Adding the Status Property to Bricks)

更新磚塊初始化以包含 `status` 旗標：

```javascript
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}
```

### collisionDetection() 函式 (The collisionDetection() Function)

對每塊磚塊進行迴圈，並檢查球體的中心是否在磚塊的邊界框內：

```javascript
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
        }
      }
    }
  }
}
```

**碰撞條件（四個條件必須同時滿足）：**
- `x > b.x` — 球體中心在磚塊左側邊緣的右方。
- `x < b.x + brickWidth` — 球體中心在磚塊右側邊緣的左方。
- `y > b.y` — 球體中心在磚塊上方邊緣的下方。
- `y < b.y + brickHeight` — 球體中心在磚塊下方邊緣的上方。

當偵測到碰撞時：
- `dy = -dy` 反轉球體的垂直方向（彈回）。
- `b.status = 0` 將磚塊標記為已摧毀。

### 更新 drawBricks() 以尊重狀態 (Updating drawBricks() to Respect Status)

僅繪製仍處於作用中狀態 (`status === 1`) 的磚塊：

```javascript
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}
```

### 在遊戲迴圈中呼叫 collisionDetection() (Calling collisionDetection() in the Game Loop)

在繪製完所有元素後，在 `draw()` 函式中增加呼叫：

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();
  // ... draw 函式的其餘部分
}
```

---

## 步驟 8：追蹤分數並獲勝 (Step 8: Track the Score and Win)

我們增加一個分數計數器，每當有一塊磚塊被摧毀時就遞增，並增加一個在所有磚塊消失時觸發的獲勝條件。

### 初始化分數 (Initializing the Score)

```javascript
let score = 0;
```

### drawScore() 函式 (The drawScore() Function)

使用文字轉譯在畫布上顯示目前分數：

```javascript
function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText(`分數：${score}`, 8, 20);
}
```

- `ctx.font` 設定字型大小和字型系列（類似 CSS）。
- `ctx.fillText(text, x, y)` 在給定座標處轉譯文字。
- 位置 `(8, 20)` 將分數放在左上角。

### 遞增分數 (Incrementing the Score)

在 `collisionDetection()` 函式中，當磚塊被撞到時遞增分數：

```javascript
dy = -dy;
b.status = 0;
score++;
```

### 增加獲勝條件 (Adding the Win Condition)

遞增分數後，檢查玩家是否已摧毀所有磚塊：

```javascript
score++;
if (score === brickRowCount * brickColumnCount) {
  alert("恭喜，您贏了！");
  document.location.reload();
  clearInterval(interval);
}
```

磚塊總數為 `brickRowCount * brickColumnCount`。當分數達到該數字時，代表每塊磚塊都已被摧毀。

### 具備分數與獲勝功能的完整 collisionDetection() (Complete collisionDetection() with Score and Win)

```javascript
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score++;
          if (score === brickRowCount * brickColumnCount) {
            alert("恭喜，您贏了！");
            document.location.reload();
            clearInterval(interval);
          }
        }
      }
    }
  }
}
```

### 在遊戲迴圈中呼叫 drawScore() (Calling drawScore() in the Game Loop)

在 `draw()` 函式中增加呼叫：

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  collisionDetection();
  // ... draw 函式的其餘部分
}
```

### 畫布文字方法參考 (Canvas Text Methods Reference)

| 方法/屬性 | 目的 |
|-----------------|---------|
| `ctx.font` | 設定字型大小和字型系列 |
| `ctx.fillStyle` | 設定文字顏色 |
| `ctx.fillText(text, x, y)` | 在座標處繪製填充文字 |

---

## 步驟 9：滑鼠控制 (Step 9: Mouse Controls)

除了鍵盤控制外，我們還增加滑鼠支援，以便玩家可以透過移動滑鼠來移動球拍。

### 增加 mousemove 事件接聽程式 (Adding the mousemove Event Listener)

與現有的鍵盤接聽程式一起註冊處理常式：

```javascript
document.addEventListener("mousemove", mouseMoveHandler);
```

### mouseMoveHandler 函式 (The mouseMoveHandler Function)

計算滑鼠相對於畫布的水平位置，並更新球拍位置：

```javascript
function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}
```

**運作原理：**
- `e.clientX` — 滑鼠在瀏覽器視窗中的水平位置。
- `canvas.offsetLeft` — 從畫布左側邊緣到視窗左側邊緣的距離。
- `relativeX` — 相對於畫布（而非視窗）的滑鼠位置。
- 邊界檢查 (`relativeX > 0 && relativeX < canvas.width`) 確保球拍僅在滑鼠位於畫布上方時移動。
- `paddleX = relativeX - paddleWidth / 2` 透過減去球拍寬度的一半，使球拍中心位於滑鼠游標下方。

### 完整的事件接聽程式設定（鍵盤 + 滑鼠） (Complete Event Listener Setup (Keyboard + Mouse))

```javascript
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);
```

兩種控制方法可同時運作。玩家可以使用方向鍵或滑鼠 — 或隨時在兩者之間切換。

---

## 步驟 10：收尾 (Step 10: Finishing Up)

最後一步增加一個生命系統（讓玩家有多次機會），並將遊戲迴圈從 `setInterval` 升級為 `requestAnimationFrame` 以獲得更平滑的轉譯。

### 增加生命變數 (Adding the Lives Variable)

```javascript
let lives = 3;
```

### drawLives() 函式 (The drawLives() Function)

在右上方顯示剩餘生命數：

```javascript
function drawLives() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText(`生命：${lives}`, canvas.width - 65, 20);
}
```

### 實作生命系統 (Implementing the Lives System)

將立即遊戲結束的邏輯替換為以生命為基礎的系統。當球體沒接到球拍時：

```javascript
if (y + dy < ballRadius) {
  dy = -dy;
} else if (y + dy > canvas.height - ballRadius) {
  if (x > paddleX && x < paddleX + paddleWidth) {
    dy = -dy;
  } else {
    lives--;
    if (!lives) {
      alert("遊戲結束 (GAME OVER)");
      document.location.reload();
    } else {
      // 重設球體和球拍位置
      x = canvas.width / 2;
      y = canvas.height - 30;
      dx = 2;
      dy = -2;
      paddleX = (canvas.width - paddleWidth) / 2;
    }
  }
}
```

**失去生命時會發生什麼：**
- `lives--` 減少生命計數器。
- 如果 `lives` 達到 `0`，則透過警示和頁面重新整理結束遊戲。
- 否則，球體重設至中心底部，速度重設，球拍重設至中心。

### 升級至 requestAnimationFrame (Upgrading to requestAnimationFrame)

將 `setInterval` 替換為 `requestAnimationFrame`，以獲得更流暢、經瀏覽器最佳化的遊戲迴圈：

**舊方法（移除）：**
```javascript
interval = setInterval(draw, 10);
```

**新方法：**
在 `draw()` 函式末尾增加 `requestAnimationFrame(draw)`：

```javascript
function draw() {
  // ... 所有繪圖和邏輯 ...
  requestAnimationFrame(draw);
}

// 透過呼叫一次 draw() 來啟動遊戲：
draw();
```

`requestAnimationFrame` 讓瀏覽器以最佳影格率（通常為 60fps）安排轉譯，這比固定的 10 毫秒間隔更高效。

### 在遊戲迴圈中呼叫 drawLives() (Calling drawLives() in the Game Loop)

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();
  // ... 其餘邏輯 ...
  requestAnimationFrame(draw);
}
```

---

## 完整的最終遊戲程式碼 (Complete Final Game Code)

以下是整合在單一、獨立 HTML 檔案中的完整遊戲。這是所有 10 個步驟結合後的最終產品。

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>2D 打磚塊遊戲</title>
    <style>
      * {
        padding: 0;
        margin: 0;
      }
      canvas {
        background: #eeeeee;
        display: block;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <canvas id="myCanvas" width="480" height="320"></canvas>

    <script>
      const canvas = document.getElementById("myCanvas");
      const ctx = canvas.getContext("2d");

      // --- 球體 ---
      const ballRadius = 10;
      let x = canvas.width / 2;
      let y = canvas.height - 30;
      let dx = 2;
      let dy = -2;

      // --- 球拍 ---
      const paddleHeight = 10;
      const paddleWidth = 75;
      let paddleX = (canvas.width - paddleWidth) / 2;

      // --- 控制 ---
      let rightPressed = false;
      let leftPressed = false;

      // --- 磚塊 ---
      const brickRowCount = 3;
      const brickColumnCount = 5;
      const brickWidth = 75;
      const brickHeight = 20;
      const brickPadding = 10;
      const brickOffsetTop = 30;
      const brickOffsetLeft = 30;

      const bricks = [];
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
          bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
      }

      // --- 分數與生命 ---
      let score = 0;
      let lives = 3;

      // =====================
      // 事件接聽程式
      // =====================
      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);
      document.addEventListener("mousemove", mouseMoveHandler);

      function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
          rightPressed = true;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
          leftPressed = true;
        }
      }

      function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
          rightPressed = false;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
          leftPressed = false;
        }
      }

      function mouseMoveHandler(e) {
        const relativeX = e.clientX - canvas.offsetLeft;
        if (relativeX > 0 && relativeX < canvas.width) {
          paddleX = relativeX - paddleWidth / 2;
        }
      }

      // =====================
      // 碰撞偵測
      // =====================
      function collisionDetection() {
        for (let c = 0; c < brickColumnCount; c++) {
          for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
              if (
                x > b.x &&
                x < b.x + brickWidth &&
                y > b.y &&
                y < b.y + brickHeight
              ) {
                dy = -dy;
                b.status = 0;
                score++;
                if (score === brickRowCount * brickColumnCount) {
                  alert("恭喜，您贏了！");
                  document.location.reload();
                }
              }
            }
          }
        }
      }

      // =====================
      // 繪圖函式
      // =====================
      function drawBall() {
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
      }

      function drawPaddle() {
        ctx.beginPath();
        ctx.rect(
          paddleX,
          canvas.height - paddleHeight,
          paddleWidth,
          paddleHeight
        );
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
      }

      function drawBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
          for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
              const brickX =
                c * (brickWidth + brickPadding) + brickOffsetLeft;
              const brickY =
                r * (brickHeight + brickPadding) + brickOffsetTop;
              bricks[c][r].x = brickX;
              bricks[c][r].y = brickY;
              ctx.beginPath();
              ctx.rect(brickX, brickY, brickWidth, brickHeight);
              ctx.fillStyle = "#0095DD";
              ctx.fill();
              ctx.closePath();
            }
          }
        }
      }

      function drawScore() {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText(`分數：${score}`, 8, 20);
      }

      function drawLives() {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText(`生命：${lives}`, canvas.width - 65, 20);
      }

      // =====================
      // 主要遊戲迴圈
      // =====================
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();
        collisionDetection();

        // 左右牆壁碰撞
        if (
          x + dx > canvas.width - ballRadius ||
          x + dx < ballRadius
        ) {
          dx = -dx;
        }

        // 上方牆壁碰撞
        if (y + dy < ballRadius) {
          dy = -dy;
        } else if (y + dy > canvas.height - ballRadius) {
          // 底部邊緣：球拍碰撞或失去一命
          if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
          } else {
            lives--;
            if (!lives) {
              alert("遊戲結束 (GAME OVER)");
              document.location.reload();
            } else {
              x = canvas.width / 2;
              y = canvas.height - 30;
              dx = 2;
              dy = -2;
              paddleX = (canvas.width - paddleWidth) / 2;
            }
          }
        }

        // 球拍移動（鍵盤）
        if (rightPressed) {
          paddleX = Math.min(
            paddleX + 7,
            canvas.width - paddleWidth
          );
        } else if (leftPressed) {
          paddleX = Math.max(paddleX - 7, 0);
        }

        x += dx;
        y += dy;
        requestAnimationFrame(draw);
      }

      draw();
    </script>
  </body>
</html>
```

---

## 快速參考：所有遊戲變數 (Quick Reference: All Game Variables)

| 變數 | 型別 | 目的 |
|----------|------|---------|
| `canvas` | const | HTML 畫布元素的參考 |
| `ctx` | const | 2D 轉譯內容 |
| `ballRadius` | const | 球體半徑 (10) |
| `x`, `y` | let | 球體目前位置 |
| `dx`, `dy` | let | 球體速度（每影格像素數） |
| `paddleHeight` | const | 球拍高度 (10) |
| `paddleWidth` | const | 球拍寬度 (75) |
| `paddleX` | let | 球拍目前的水平位置 |
| `rightPressed` | let | 向右鍵是否被按住 |
| `leftPressed` | let | 向左鍵是否被按住 |
| `brickRowCount` | const | 磚塊列數 (3) |
| `brickColumnCount` | const | 磚塊欄數 (5) |
| `brickWidth` | const | 每塊磚塊的寬度 (75) |
| `brickHeight` | const | 每塊磚塊的高度 (20) |
| `brickPadding` | const | 磚塊之間的間距 (10) |
| `brickOffsetTop` | const | 從畫布頂端到第一列磚塊的距離 (30) |
| `brickOffsetLeft` | const | 從畫布左側到第一欄磚塊的距離 (30) |
| `bricks` | const | 持有所有磚塊物件的 2D 陣列 |
| `score` | let | 目前玩家分數 |
| `lives` | let | 剩餘生命（從 3 開始） |

## 快速參考：所有函式 (Quick Reference: All Functions)

| 函式 | 目的 |
|----------|---------|
| `keyDownHandler(e)` | 在按鍵按下時將 `rightPressed` 或 `leftPressed` 設為 `true` |
| `keyUpHandler(e)` | 在按鍵放開時將 `rightPressed` 或 `leftPressed` 設為 `false` |
| `mouseMoveHandler(e)` | 移動球拍以跟隨滑鼠水平位置 |
| `collisionDetection()` | 針對所有作用中磚塊檢查球體；摧毀撞到的磚塊、遞增分數、檢查獲勝 |
| `drawBall()` | 在目前的 `(x, y)` 位置轉譯球體 |
| `drawPaddle()` | 在目前的 `paddleX` 位置轉譯球拍 |
| `drawBricks()` | 轉譯所有 `status === 1` 的磚塊 |
| `drawScore()` | 在左上角轉譯分數文字 |
| `drawLives()` | 在右上角轉譯生命文字 |
| `draw()` | 主要遊戲迴圈：清除畫布、繪製所有內容、處理碰撞、更新位置 |
