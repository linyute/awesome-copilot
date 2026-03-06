# 遊戲控制機制 (Game Control Mechanisms)

此參考指南涵蓋了網頁遊戲的主要控制機制，包括行動裝置觸控、桌面端鍵盤與滑鼠、遊戲手把控制器以及非常規輸入方法。

## 行動裝置觸控控制 (Mobile Touch Controls)

行動裝置觸控控制對於針對行動裝置的網頁遊戲至關重要。採用行動優先的方法可確保遊戲在 HTML5 遊戲最廣泛使用的平台上具有可存取性。

### 關鍵事件與 API (Key Events and APIs)

瀏覽器中可用的核心觸控事件如下：

| 事件 | 說明 |
|-------|-------------|
| `touchstart` | 使用者手指接觸螢幕時觸發 |
| `touchmove` | 使用者手指在接觸螢幕的狀態下移動時觸發 |
| `touchend` | 使用者手指離開螢幕時觸發 |
| `touchcancel` | 觸控被取消或中斷（例如：手指移出螢幕）時觸發 |

**註冊觸控事件監聽器：**

```javascript
const canvas = document.querySelector("canvas");
canvas.addEventListener("touchstart", handleStart);
canvas.addEventListener("touchmove", handleMove);
canvas.addEventListener("touchend", handleEnd);
canvas.addEventListener("touchcancel", handleCancel);
```

**觸控事件屬性：**

- `e.touches[0]` — 存取第一個觸控點（多點觸控使用以零為起始的索引）。
- `e.touches[0].pageX` / `e.touches[0].pageY` — 相對於頁面的觸控座標。
- 務必減去畫布偏移量 (offset)，以獲取相對於畫布元素的座標。

### 程式碼範例 (Code Examples)

**純 JavaScript 觸控處理函式：**

```javascript
document.addEventListener("touchstart", touchHandler);
document.addEventListener("touchmove", touchHandler);

function touchHandler(e) {
  if (e.touches) {
    playerX = e.touches[0].pageX - canvas.offsetLeft - playerWidth / 2;
    playerY = e.touches[0].pageY - canvas.offsetTop - playerHeight / 2;
    e.preventDefault();
  }
}
```

**Phaser 框架指標 (pointer) 系統：**

Phaser 透過代表個別手指的「指標」來管理觸控輸入：

```javascript
// 存取指標
this.game.input.activePointer;       // 最近一次作用的指標
this.game.input.pointer1;            // 第一個指標
this.game.input.pointer2;            // 第二個指標

// 增加更多指標（總共最多 10 個）
this.game.input.addPointer();

// 全域輸入事件
this.game.input.onDown.add(itemTouched, this);
this.game.input.onUp.add(itemReleased, this);
this.game.input.onTap.add(itemTapped, this);
this.game.input.onHold.add(itemHeld, this);
```

**用於飛船移動的可拖曳精靈：**

```javascript
const player = this.game.add.sprite(30, 30, "ship");
player.inputEnabled = true;
player.input.enableDrag();
player.events.onDragStart.add(onDragStart, this);
player.events.onDragStop.add(onDragStop, this);

function onDragStart(sprite, pointer) {
  console.log(`正在拖曳於：${pointer.x}, ${pointer.y}`);
}
```

**用於射擊的隱形觸控區域（螢幕右半部）：**

```javascript
this.buttonShoot = this.add.button(
  this.world.width * 0.5, 0,
  "button-alpha",    // 透明影像
  null,
  this
);
this.buttonShoot.onInputDown.add(this.goShootPressed, this);
this.buttonShoot.onInputUp.add(this.goShootReleased, this);
```

**虛擬遊戲手把外掛程式：**

```javascript
this.gamepad = this.game.plugins.add(Phaser.Plugin.VirtualGamepad);
this.joystick = this.gamepad.addJoystick(100, 420, 1.2, "gamepad");
this.button = this.gamepad.addButton(400, 420, 1.0, "gamepad");
```

### 最佳實作 (Best Practices)

- 務必對觸控事件呼叫 `preventDefault()`，以避免不必要的捲動和瀏覽器預設行為。
- 使用隱形按鈕區域而非可見按鈕，以避免遮擋遊戲畫面。
- 利用自然的觸控手勢（如拖曳），這比螢幕按鈕更直覺。
- 在計算位置時，請減去畫布偏移量並考慮物件尺寸。
- 觸控區域應足夠大，以便舒適地進行互動。
- 規劃多點觸控支援。Phaser 支援最多 10 個同時運作的指標。
- 使用像 Phaser 這樣的框架，以自動實現桌面端與行動端的相容性。
- 對於進階觸控控制 UI，請考慮使用虛擬遊戲手把/搖桿外掛程式。

## 具備滑鼠與鍵盤的桌面端 (Desktop with Mouse and Keyboard)

桌面端鍵盤與滑鼠控制可為網頁遊戲提供精確輸入，是桌面瀏覽器的預設控制配置。

### 關鍵事件與 API (Key Events and APIs)

**鍵盤事件：**

```javascript
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
```

- `event.code` 傳回可讀的按鍵識別碼，例如 `"ArrowLeft"`、`"ArrowRight"`、`"ArrowUp"`、`"ArrowDown"`。
- 使用 `requestAnimationFrame()` 實現流暢的影格更新。

**Phaser 鍵盤 API：**

```javascript
this.cursors = this.input.keyboard.createCursorKeys();  // 方向鍵物件
this.keyLeft = this.input.keyboard.addKey(Phaser.KeyCode.A);  // 自訂按鍵繫結
// 透過 .isDown 屬性檢查按鍵狀態
// 透過 .onDown.add() 接聽按下事件
```

**Phaser 滑鼠 API：**

```javascript
this.game.input.mousePointer;                    // 滑鼠位置與狀態
this.game.input.mousePointer.isDown;             // 是否按下了任何滑鼠按鈕
this.game.input.mousePointer.x;                  // 滑鼠 X 座標
this.game.input.mousePointer.y;                  // 滑鼠 Y 座標
this.game.input.mousePointer.leftButton.isDown;  // 滑鼠左鍵
this.game.input.mousePointer.rightButton.isDown; // 滑鼠右鍵
this.game.input.activePointer;                   // 平台無關（滑鼠 + 觸控）
```

### 程式碼範例 (Code Examples)

**純 JavaScript 鍵盤狀態追蹤：**

```javascript
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;

function keyDownHandler(event) {
  if (event.code === "ArrowRight") rightPressed = true;
  else if (event.code === "ArrowLeft") leftPressed = true;
  if (event.code === "ArrowDown") downPressed = true;
  else if (event.code === "ArrowUp") upPressed = true;
}

function keyUpHandler(event) {
  if (event.code === "ArrowRight") rightPressed = false;
  else if (event.code === "ArrowLeft") leftPressed = false;
  if (event.code === "ArrowDown") downPressed = false;
  else if (event.code === "ArrowUp") upPressed = false;
}
```

**整合輸入處理的遊戲迴圈：**

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (rightPressed) playerX += 5;
  else if (leftPressed) playerX -= 5;
  if (downPressed) playerY += 5;
  else if (upPressed) playerY -= 5;

  ctx.drawImage(img, playerX, playerY);
  requestAnimationFrame(draw);
}
```

**Phaser 中的雙重控制支援（方向鍵 + WASD）：**

```javascript
this.cursors = this.input.keyboard.createCursorKeys();
this.keyLeft = this.input.keyboard.addKey(Phaser.KeyCode.A);
this.keyRight = this.input.keyboard.addKey(Phaser.KeyCode.D);
this.keyUp = this.input.keyboard.addKey(Phaser.KeyCode.W);
this.keyDown = this.input.keyboard.addKey(Phaser.KeyCode.S);

// 在 update 中：
if (this.cursors.left.isDown || this.keyLeft.isDown) {
  // 向左移動
} else if (this.cursors.right.isDown || this.keyRight.isDown) {
  // 向右移動
}
if (this.cursors.up.isDown || this.keyUp.isDown) {
  // 向上移動
} else if (this.cursors.down.isDown || this.keyDown.isDown) {
  // 向下移動
}
```

**多個開火按鈕：**

```javascript
this.keyFire1 = this.input.keyboard.addKey(Phaser.KeyCode.X);
this.keyFire2 = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

if (this.keyFire1.isDown || this.keyFire2.isDown) {
  // 發射武器
}
```

**裝置特定說明：**

```javascript
if (this.game.device.desktop) {
  moveText = "使用方向鍵或 WASD 移動";
  shootText = "按 X 或空格鍵射擊";
} else {
  moveText = "長按並移動以移動";
  shootText = "點擊以射擊";
}
```

### 最佳實作 (Best Practices)

- 支援多種輸入方式：同時提供方向鍵和 WASD 進行移動，以及多個開火按鈕（例如 X 和空格鍵）。
- 使用 `activePointer` 代替 `mousePointer`，以無縫支援滑鼠和觸控輸入。
- 偵測裝置類型並向玩家顯示適當的控制說明。
- 使用 `requestAnimationFrame()` 實現平滑動畫，並在遊戲迴圈中檢查按鍵狀態，而非對個別按鍵動作做出反應。
- 允許使用鍵盤快速鍵跳過非遊戲畫面（例如 Enter 開始、任意鍵跳過開場）。
- 使用 Phaser 或類似的框架以確保跨瀏覽器相容性，因為它們會自動處理邊緣情況和瀏覽器差異。

## 具備遊戲手把的桌面端 (Desktop with Gamepad)

Gamepad API 使網頁遊戲能夠偵測並回應遊戲手把和控制器的輸入，為瀏覽器帶來類似遊戲機的體驗。

### 關鍵事件與 API (Key Events and APIs)

**核心事件：**

```javascript
window.addEventListener("gamepadconnected", gamepadHandler);
window.addEventListener("gamepaddisconnected", gamepadHandler);
```

**遊戲手把物件屬性：**

- `controller.id` — 裝置識別碼字串。
- `controller.buttons[]` — 按鈕物件陣列，每個物件都有一個 `.pressed` 布林屬性。
- `controller.axes[]` — 類比搖桿值陣列，範圍從 -1 到 1。

**標準按鈕/軸對應（Xbox 360 配置）：**

| 輸入 | 索引 | 類型 |
|-------|-------|------|
| A 按鈕 | 0 | 按鈕 |
| B 按鈕 | 1 | 按鈕 |
| X 按鈕 | 2 | 按鈕 |
| Y 按鈕 | 3 | 按鈕 |
| 方向鍵 上 | 12 | 按鈕 |
| 方向鍵 下 | 13 | 按鈕 |
| 方向鍵 左 | 14 | 按鈕 |
| 方向鍵 右 | 15 | 按鈕 |
| 左搖桿 X | axes[0] | 軸 |
| 左搖桿 Y | axes[1] | 軸 |
| 右搖桿 X | axes[2] | 軸 |
| 右搖桿 Y | axes[3] | 軸 |

### 程式碼範例 (Code Examples)

**純 JavaScript 連線處理函式：**

```javascript
let controller = {};
let buttonsPressed = [];

function gamepadHandler(e) {
  controller = e.gamepad;
  console.log(`遊戲手把：${controller.id}`);
}

window.addEventListener("gamepadconnected", gamepadHandler);
```

**每影格輪詢按鈕狀態：**

```javascript
function gamepadUpdateHandler() {
  buttonsPressed = [];
  if (controller.buttons) {
    for (const [i, button] of controller.buttons.entries()) {
      if (button.pressed) {
        buttonsPressed.push(i);
      }
    }
  }
}

function gamepadButtonPressedHandler(button) {
  return buttonsPressed.includes(button);
}
```

**遊戲迴圈整合：**

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gamepadUpdateHandler();

  if (gamepadButtonPressedHandler(12)) playerY -= 5;  // 方向鍵 上
  else if (gamepadButtonPressedHandler(13)) playerY += 5;  // 方向鍵 下
  if (gamepadButtonPressedHandler(14)) playerX -= 5;  // 方向鍵 左
  else if (gamepadButtonPressedHandler(15)) playerX += 5;  // 方向鍵 右
  if (gamepadButtonPressedHandler(0)) alert("轟！");  // A 按鈕

  ctx.drawImage(img, playerX, playerY);
  requestAnimationFrame(draw);
}
```

**具備長按 vs 短按偵測功能的可重複使用 GamepadAPI 函式庫：**

```javascript
const GamepadAPI = {
  active: false,
  controller: {},

  connect(event) {
    GamepadAPI.controller = event.gamepad;
    GamepadAPI.active = true;
  },

  disconnect(event) {
    delete GamepadAPI.controller;
    GamepadAPI.active = false;
  },

  update() {
    GamepadAPI.buttons.cache = [...GamepadAPI.buttons.status];
    GamepadAPI.buttons.status = [];

    const c = GamepadAPI.controller || {};
    const pressed = [];

    if (c.buttons) {
      for (let b = 0; b < c.buttons.length; b++) {
        if (c.buttons[b].pressed) {
          pressed.push(GamepadAPI.buttons.layout[b]);
        }
      }
    }

    const axes = [];
    if (c.axes) {
      for (const ax of c.axes) {
        axes.push(ax.toFixed(2));
      }
    }

    GamepadAPI.axes.status = axes;
    GamepadAPI.buttons.status = pressed;
    return pressed;
  },

  buttons: {
    layout: ["A", "B", "X", "Y", "LB", "RB", "LT", "RT",
             "Back", "Start", "LS", "RS",
             "DPad-Up", "DPad-Down", "DPad-Left", "DPad-Right"],
    cache: [],
    status: [],
    pressed(button, hold) {
      let newPress = false;
      if (GamepadAPI.buttons.status.includes(button)) {
        newPress = true;
      }
      if (!hold && GamepadAPI.buttons.cache.includes(button)) {
        newPress = false;
      }
      return newPress;
    }
  },

  axes: {
    status: []
  }
};

window.addEventListener("gamepadconnected", GamepadAPI.connect);
window.addEventListener("gamepaddisconnected", GamepadAPI.disconnect);
```

**具備死區 (deadzone) 閾值的類比搖桿移動：**

```javascript
if (GamepadAPI.axes.status) {
  if (GamepadAPI.axes.status[0] > 0.5) playerX += 5;       // 右
  else if (GamepadAPI.axes.status[0] < -0.5) playerX -= 5; // 左
  if (GamepadAPI.axes.status[1] > 0.5) playerY += 5;       // 下
  else if (GamepadAPI.axes.status[1] < -0.5) playerY -= 5; // 上
}
```

**情境感知控制顯示：**

```javascript
if (this.game.device.desktop) {
  if (GamepadAPI.active) {
    moveText = "使用方向鍵或左搖桿移動";
    shootText = "按 A 射擊，按 Y 顯示控制說明";
  } else {
    moveText = "使用方向鍵或 WASD 移動";
    shootText = "按 X 或空格鍵射擊";
  }
} else {
  moveText = "長按並移動以移動";
  shootText = "點擊以射擊";
}
```

### 最佳實作 (Best Practices)

- 在處理遊戲手把輸入前，務必檢查 `GamepadAPI.active`。
- 透過快取前一影格的按鈕狀態，區分「長按」(hold)（持續動作）與「短按」(press)（單次新動作）。
- 為類比搖桿值套用一個死區閾值（例如 0.5），以避免不精確硬體造成的無意漂移輸入。
- 建立按鈕對應系統，因為不同裝置可能有不同的按鈕配置。
- 透過在 `requestAnimationFrame` 中呼叫更新函式，每影格輪詢一次遊戲手把狀態。
- 當連接了遊戲手把時，在螢幕上顯示指示器以及相應的控制說明。
- 全球瀏覽器支援率約為 63%；請務必提供回退的鍵盤/滑鼠控制。

## 其他控制機制 (Other Control Mechanisms)

非常規控制機制可提供獨特的遊戲體驗，並利用新興硬體超越傳統輸入裝置。

### 電視遙控器 (TV Remote Controls)

**說明：** 智慧型電視遙控器會發出標準鍵盤事件，這使得網頁遊戲無須修改即可在電視螢幕上執行。

**關鍵事件與 API：**

- 遙控器方向按鈕對應到標準方向鍵代碼。
- 自訂遙控器按鈕具有製造商特定的按鍵代碼。

**程式碼範例：**

```javascript
// 標準方向鍵控制會自動在電視遙控器上運作
this.cursors = this.input.keyboard.createCursorKeys();
if (this.cursors.right.isDown) {
  // 向右移動玩家
}

// 探索製造商特定的遙控器按鍵代碼
window.addEventListener("keydown", (event) => {
  console.log(event.keyCode);
});

// 處理自訂遙控器按鈕（代碼隨製造商而異）
window.addEventListener("keydown", (event) => {
  switch (event.keyCode) {
    case 8:   // 暫停（以 Panasonic 為例）
      break;
    case 588: // 自訂動作
      break;
  }
});
```

**最佳實作：**

- 在開發期間將按鍵代碼記錄到主控台，以探索遙控器按鈕對應。
- 由於遙控器會發出鍵盤事件，請重用現有的鍵盤控制實作。
- 參考製造商文件或速查表以獲取按鍵代碼對應。

### Leap Motion（手勢識別） (Leap Motion (Hand Gesture Recognition))

**說明：** 使用 Leap Motion 感應器在無須物理接觸的情況下，偵測手部位置、旋轉及握力以實現以手勢為基礎的控制。

**關鍵事件與 API：**

- `Leap.loop()` — 以影格為基礎的手部追蹤回呼。
- `hand.roll()` — 以弧度表示的水平旋轉。
- `hand.pitch()` — 以弧度表示的垂直旋轉。
- `hand.grabStrength` — 介於 0（張開手）到 1（握拳）之間的握力浮點數。

**程式碼範例：**

```html
<script src="https://js.leapmotion.com/leap-0.6.4.min.js"></script>
```

```javascript
const toDegrees = 1 / (Math.PI / 180);
let horizontalDegree = 0;
let verticalDegree = 0;
const degreeThreshold = 30;
let grabStrength = 0;

Leap.loop({
  hand(hand) {
    horizontalDegree = Math.round(hand.roll() * toDegrees);
    verticalDegree = Math.round(hand.pitch() * toDegrees);
    grabStrength = hand.grabStrength;
  },
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (horizontalDegree > degreeThreshold) playerX -= 5;
  else if (horizontalDegree < -degreeThreshold) playerX += 5;

  if (verticalDegree > degreeThreshold) playerY += 5;
  else if (verticalDegree < -degreeThreshold) playerY -= 5;

  if (grabStrength === 1) fireWeapon();

  ctx.drawImage(img, playerX, playerY);
  requestAnimationFrame(draw);
}
```

**最佳實作：**

- 使用角度閾值（例如 30 度）來過濾微小的手部動作和雜訊。
- 在開發期間輸出診斷資料以校準靈敏度。
- 僅限於簡單動作（如轉向和射擊），而非複雜的多重輸入配置。
- 需要安裝 Leap Motion 驅動程式。

### 多普勒效應（以麥克風為基礎的手勢偵測） (Doppler Effect (Microphone-Based Gesture Detection))

**說明：** 透過分析裝置麥克風接收到的聲波頻率偏移來偵測手部移動方向與大小。發出的音調會從使用者手上彈回，頻率差異則指示移動方向。

**關鍵事件與 API：**

- 使用多普勒效應偵測函式庫。
- `bandwidth.left` 和 `bandwidth.right` 提供頻率分析值。

**程式碼範例：**

```javascript
doppler.init((bandwidth) => {
  const diff = bandwidth.left - bandwidth.right;
  // 正向差異 = 朝一個方向移動
  // 負向差異 = 朝另一個方向移動
});
```

**最佳實作：**

- 最適合簡單的單軸控制，如捲動或上下移動。
- 精確度低於 Leap Motion 或遊戲手把輸入。
- 透過左右頻率差異比較提供方向資訊。

### Makey Makey（物理物件控制器） (Makey Makey (Physical Object Controllers))

**說明：** 將導電物件（香蕉、粘土、繪製的電路、水等）連接到模擬鍵盤與滑鼠輸入的電路板，為遊戲實現創意的物理介面。

**關鍵事件與 API（透過用於自訂硬體的 Cylon.js）：**

- 適用於使用 Arduino 或 Raspberry Pi 的自訂設定之 `makey-button` 驅動程式。
- `"push"` 事件監聽器用於按鈕觸發。
- Makey Makey 電路板本身透過 USB 運作並發出標準鍵盤事件，無須編寫自訂程式碼。

**程式碼範例（使用 Cylon.js 的自訂設定）：**

```javascript
const Cylon = require("cylon");

Cylon.robot({
  connections: {
    arduino: { adaptor: "firmata", port: "/dev/ttyACM0" },
  },
  devices: {
    makey: { driver: "makey-button", pin: 2 },
  },
  work(my) {
    my.makey.on("push", () => {
      console.log("按鈕已按下！");
      // 觸發遊戲動作
    });
  },
}).start();
```

**最佳實作：**

- Makey Makey 電路板透過 USB 連接並發出標準鍵盤事件，因此現有的鍵盤控制可直接使用。
- 對於自訂設定，請在 GPIO 連接上使用 10 MOhm 電阻。
- 實現創意的物理遊戲體驗，特別適合展覽和裝置藝術。

### 非常規控制的一般建議 (General Recommendations for Unconventional Controls)

- 實作多種控制機制以接觸最廣泛的受眾。
- 以鍵盤和遊戲手把為基礎進行建構，因為大多數非常規控制器都會模擬或補充標準輸入。
- 使用閾值來過濾不精確硬體產生的雜訊和意外輸入。
- 在開發期間透過主控台輸出和螢幕數值提供視覺診斷。
- 控制複雜度應與遊戲需求相匹配。並非所有機制都適合所有遊戲。
- 在其實作遊戲邏輯之前，請徹底測試硬體設定。
