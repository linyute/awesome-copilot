# 2D 迷宮遊戲範本 (2D Maze Game Template)

這是一個經行動裝置最佳化的 2D 迷宮遊戲，玩家引導球體穿過障礙物組成的迷宮，以到達目標洞口。該遊戲在行動裝置上使用 **Device Orientation API** 進行傾斜感應動作控制，在桌面端則使用鍵盤方向鍵。它使用 **Phaser** 框架（v2.x 搭配 Arcade Physics）建構，具備多關卡進度、碰撞偵測、音訊回饋、震動觸覺以及計時器系統。

**來源參考：** [MDN - HTML5 Gamedev Phaser Device Orientation](https://developer.mozilla.org/en-US/docs/Games/Tutorials/HTML5_Gamedev_Phaser_Device_Orientation)
**線上展示：** [Cyber Orb](https://orb.enclavegames.com/)
**原始碼：** [GitHub - EnclaveGames/Cyber-Orb](https://github.com/EnclaveGames/Cyber-Orb)

---

## 遊戲概念 (Game Concept)

玩家透過傾斜行動裝置或按方向鍵來控制一個球體（「寶珠」）。球體在由水平和垂直牆段組成的迷宮中滾動。每一關的目標是在避開牆壁的同時，將球引導至螢幕頂部的洞口。與牆壁碰撞會觸發彈跳、音效以及選用的震動。計時器會追蹤玩家在每一關以及整個遊戲中所花費的時間。

---

## 專案結構 (Project Structure)

```
project/
  index.html
  src/
    phaser-arcade-physics.2.2.2.min.js
    Boot.js
    Preloader.js
    MainMenu.js
    Howto.js
    Game.js
  img/
    ball.png
    hole.png
    element-horizontal.png
    element-vertical.png
    button-start.png
    loading-bg.png
    loading-bar.png
  audio/
    bounce.ogg
    bounce.mp3
    bounce.m4a
```

---

## Phaser 設定與初始化 (Phaser Setup and Initialization)

### HTML 入口點

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>Cyber Orb</title>
  <style>
    body { margin: 0; background: #333; }
  </style>
  <script src="src/phaser-arcade-physics.2.2.2.min.js"></script>
  <script src="src/Boot.js"></script>
  <script src="src/Preloader.js"></script>
  <script src="src/MainMenu.js"></script>
  <script src="src/Howto.js"></script>
  <script src="src/Game.js"></script>
</head>
<body>
  <script>
    (() => {
      const game = new Phaser.Game(320, 480, Phaser.CANVAS, "game");
      game.state.add("Boot", Ball.Boot);
      game.state.add("Preloader", Ball.Preloader);
      game.state.add("MainMenu", Ball.MainMenu);
      game.state.add("Howto", Ball.Howto);
      game.state.add("Game", Ball.Game);
      game.state.start("Boot");
    })();
  </script>
</body>
</html>
```

- Canvas 大小：`320 x 480`
- 轉譯器：`Phaser.CANVAS`（替代方案：`Phaser.WEBGL`、`Phaser.AUTO`）

---

## 遊戲狀態架構 (Game State Architecture)

遊戲遵循線性狀態流：

```
Boot --> Preloader --> MainMenu --> Howto --> Game
```

### Boot 狀態

載入載入畫面所需的最少資產並設定縮放。

```javascript
const Ball = {
  _WIDTH: 320,
  _HEIGHT: 480,
};

Ball.Boot = function (game) {};
Ball.Boot.prototype = {
  preload() {
    this.load.image("preloaderBg", "img/loading-bg.png");
    this.load.image("preloaderBar", "img/loading-bar.png");
  },
  create() {
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;
    this.game.state.start("Preloader");
  },
};
```

### Preloader 狀態

在載入所有遊戲資產時顯示視覺載入列。音訊以多種格式載入以確保跨瀏覽器相容性。

```javascript
Ball.Preloader = function (game) {};
Ball.Preloader.prototype = {
  preload() {
    this.preloadBg = this.add.sprite(
      (Ball._WIDTH - 297) * 0.5,
      (Ball._HEIGHT - 145) * 0.5,
      "preloaderBg"
    );
    this.preloadBar = this.add.sprite(
      (Ball._WIDTH - 158) * 0.5,
      (Ball._HEIGHT - 50) * 0.5,
      "preloaderBar"
    );
    this.load.setPreloadSprite(this.preloadBar);

    this.load.image("ball", "img/ball.png");
    this.load.image("hole", "img/hole.png");
    this.load.image("element-w", "img/element-horizontal.png");
    this.load.image("element-h", "img/element-vertical.png");
    this.load.spritesheet("button-start", "img/button-start.png", 146, 51);
    this.load.audio("audio-bounce", [
      "audio/bounce.ogg",
      "audio/bounce.mp3",
      "audio/bounce.m4a",
    ]);
  },
  create() {
    this.game.state.start("MainMenu");
  },
};
```

### MainMenu 狀態

顯示帶有開始按鈕的標題畫面。

```javascript
Ball.MainMenu = function (game) {};
Ball.MainMenu.prototype = {
  create() {
    this.add.sprite(0, 0, "screen-mainmenu");
    this.gameTitle = this.add.sprite(Ball._WIDTH * 0.5, 40, "title");
    this.gameTitle.anchor.set(0.5, 0);

    this.startButton = this.add.button(
      Ball._WIDTH * 0.5, 200, "button-start",
      this.startGame, this,
      2, 0, 1  // 暫留、移開、按下時的影格
    );
    this.startButton.anchor.set(0.5, 0);
    this.startButton.input.useHandCursor = true;
  },
  startGame() {
    this.game.state.start("Howto");
  },
};
```

### Howto 狀態

遊戲開始前的單次點擊說明畫面。

```javascript
Ball.Howto = function (game) {};
Ball.Howto.prototype = {
  create() {
    this.buttonContinue = this.add.button(
      0, 0, "screen-howtoplay",
      this.startGame, this
    );
  },
  startGame() {
    this.game.state.start("Game");
  },
};
```

---

## Device Orientation API 用法 (Device Orientation API Usage)

Device Orientation API 提供關於裝置物理傾斜的即時資料。使用了兩個軸：

| 屬性 | 軸 | 範圍 | 效果 |
|----------|------|-------|--------|
| `event.gamma` | 左右傾斜 | -90 到 90 度 | 水平球體速度 |
| `event.beta` | 前後傾斜 | -180 到 180 度 | 垂直球體速度 |

### 註冊監聽器 (Registering the Listener)

```javascript
// 在 Game 狀態的 create() 方法中
window.addEventListener("deviceorientation", this.handleOrientation);
```

### 處理定向事件 (Handling Orientation Events)

```javascript
handleOrientation(e) {
  const x = e.gamma; // 左右傾斜
  const y = e.beta;  // 前後傾斜
  Ball._player.body.velocity.x += x;
  Ball._player.body.velocity.y += y;
}
```

### 傾斜行為 (Tilt Behavior)

- 向左傾斜裝置：gamma 為負值，球向左滾動
- 向右傾斜裝置：gamma 為正值，球向右滾動
- 向前傾斜裝置：beta 為正值，球向下滾動
- 向後傾斜裝置：beta 為負值，球向上滾動

傾斜角度直接對應到速度增量 — 傾斜越陡，每影格施加在球體上的力就越大。

---

## 核心遊戲機制 (Core Game Mechanics)

### 遊戲狀態結構 (Game State Structure)

```javascript
Ball.Game = function (game) {};
Ball.Game.prototype = {
  create() {},
  initLevels() {},
  showLevel(level) {},
  updateCounter() {},
  managePause() {},
  manageAudio() {},
  update() {},
  wallCollision() {},
  handleOrientation(e) {},
  finishLevel() {},
};
```

### 球體建立與物理 (Ball Creation and Physics)

```javascript
// 在 create() 中
this.ball = this.add.sprite(this.ballStartPos.x, this.ballStartPos.y, "ball");
this.ball.anchor.set(0.5);
this.physics.enable(this.ball, Phaser.Physics.ARCADE);
this.ball.body.setSize(18, 18);
this.ball.body.bounce.set(0.3, 0.3);
```

- 錨點設於中心 `(0.5, 0.5)` 以繞中點旋轉
- 物理主體：18x18 像素
- 彈跳係數：0.3（在與牆壁碰撞後保留 30% 的速度）

### 鍵盤控制（桌面端回退） (Keyboard Controls (Desktop Fallback))

```javascript
// 在 create() 中
this.keys = this.game.input.keyboard.createCursorKeys();

// 在 update() 中
if (this.keys.left.isDown) {
  this.ball.body.velocity.x -= this.movementForce;
} else if (this.keys.right.isDown) {
  this.ball.body.velocity.x += this.movementForce;
}
if (this.keys.up.isDown) {
  this.ball.body.velocity.y -= this.movementForce;
} else if (this.keys.down.isDown) {
  this.ball.body.velocity.y += this.movementForce;
}
```

### 洞口（目標）設定 (Hole (Goal) Setup)

```javascript
this.hole = this.add.sprite(Ball._WIDTH * 0.5, 90, "hole");
this.physics.enable(this.hole, Phaser.Physics.ARCADE);
this.hole.anchor.set(0.5);
this.hole.body.setSize(2, 2);
```

洞口有一個極小的 2x2 碰撞主體，用於精確的重疊偵測。

---

## 關卡系統 (Level System)

### 關卡資料格式 (Level Data Format)

每一關都是一個由具有位置和類型的牆段物件組成的陣列：

```javascript
this.levelData = [
  [{ x: 96, y: 224, t: "w" }],                           // 第 1 關
  [
    { x: 72, y: 320, t: "w" },
    { x: 200, y: 320, t: "h" },
    { x: 72, y: 150, t: "w" },
  ],                                                       // 第 2 關
  // ... 更多關卡
];
```

- `x, y`：以像素為單位的位置
- `t`：類型 — `"w"` 代表水平牆，`"h"` 代表垂直牆

### 建構關卡 (Building Levels)

```javascript
initLevels() {
  for (let i = 0; i < this.maxLevels; i++) {
    const newLevel = this.add.group();
    newLevel.enableBody = true;
    newLevel.physicsBodyType = Phaser.Physics.ARCADE;

    for (const item of this.levelData[i]) {
      newLevel.create(item.x, item.y, `element-${item.t}`);
    }

    newLevel.setAll("body.immovable", true);
    newLevel.visible = false;
    this.levels.push(newLevel);
  }
}
```

### 顯示關卡 (Showing a Level)

```javascript
showLevel(level) {
  const lvl = level || this.level;
  if (this.levels[lvl - 2]) {
    this.levels[lvl - 2].visible = false;
  }
  this.levels[lvl - 1].visible = true;
}
```

---

## 碰撞偵測 (Collision Detection)

### 牆壁碰撞（彈跳） (Wall Collisions (Bounce))

```javascript
// 在 update() 中
this.physics.arcade.collide(
  this.ball, this.borderGroup,
  this.wallCollision, null, this
);
this.physics.arcade.collide(
  this.ball, this.levels[this.level - 1],
  this.wallCollision, null, this
);
```

`collide` 會導致球從牆壁彈開並觸發回呼。

### 洞口重疊（穿過偵測） (Hole Overlap (Pass-Through Detection))

```javascript
this.physics.arcade.overlap(
  this.ball, this.hole,
  this.finishLevel, null, this
);
```

`overlap` 會偵測交集，但不會產生物理碰撞反應。

### 牆壁碰撞回呼 (Wall Collision Callback)

```javascript
wallCollision() {
  if (this.audioStatus) {
    this.bounceSound.play();
  }
  if ("vibrate" in window.navigator) {
    window.navigator.vibrate(100);
  }
}
```

---

## 音訊系統 (Audio System)

```javascript
// 在 create() 中
this.bounceSound = this.game.add.audio("audio-bounce");

// 切換
manageAudio() {
  this.audioStatus = !this.audioStatus;
}
```

---

## 震動 API (Vibration API)

```javascript
if ("vibrate" in window.navigator) {
  window.navigator.vibrate(100); // 100 毫秒震動脈衝
}
```

在呼叫前進行功能偵測。在支援的行動裝置上提供觸覺回饋。

---

## 計時器系統 (Timer System)

```javascript
// 在 create() 中
this.timer = 0;
this.totalTimer = 0;
this.timerText = this.game.add.text(15, 15, "時間：0", this.fontBig);
this.totalTimeText = this.game.add.text(120, 30, "總時間：0", this.fontSmall);
this.time.events.loop(Phaser.Timer.SECOND, this.updateCounter, this);

// 計數器回呼
updateCounter() {
  this.timer++;
  this.timerText.setText(`時間：${this.timer}`);
  this.totalTimeText.setText(`總時間：${this.totalTimer + this.timer}`);
}
```

---

## 關卡完成 (Level Completion)

```javascript
finishLevel() {
  if (this.level >= this.maxLevels) {
    this.totalTimer += this.timer;
    alert(`恭喜，遊戲完成！
總時間：${this.totalTimer} 秒`);
    this.game.state.start("MainMenu");
  } else {
    alert(`第 ${this.level} 關完成！`);
    this.totalTimer += this.timer;
    this.timer = 0;
    this.level++;
    this.timerText.setText(`時間：${this.timer}`);
    this.totalTimeText.setText(`總時間：${this.totalTimer}`);
    this.levelText.setText(`關卡：${this.level} / ${this.maxLevels}`);
    this.ball.body.x = this.ballStartPos.x;
    this.ball.body.y = this.ballStartPos.y;
    this.ball.body.velocity.x = 0;
    this.ball.body.velocity.y = 0;
    this.showLevel();
  }
}
```

---

## 完整的更新迴圈 (Complete Update Loop)

```javascript
update() {
  // 鍵盤輸入
  if (this.keys.left.isDown) {
    this.ball.body.velocity.x -= this.movementForce;
  } else if (this.keys.right.isDown) {
    this.ball.body.velocity.x += this.movementForce;
  }
  if (this.keys.up.isDown) {
    this.ball.body.velocity.y -= this.movementForce;
  } else if (this.keys.down.isDown) {
    this.ball.body.velocity.y += this.movementForce;
  }

  // 牆壁碰撞
  this.physics.arcade.collide(
    this.ball, this.borderGroup, this.wallCollision, null, this
  );
  this.physics.arcade.collide(
    this.ball, this.levels[this.level - 1], this.wallCollision, null, this
  );

  // 洞口重疊
  this.physics.arcade.overlap(
    this.ball, this.hole, this.finishLevel, null, this
  );
}
```

---

## Phaser API 快速參考 (Phaser API Quick Reference)

| 函式 | 目的 |
|----------|---------|
| `this.add.sprite(x, y, key)` | 建立一個遊戲物件 |
| `this.add.group()` | 建立一個物件容器 |
| `this.add.button(x, y, key, cb, ctx, over, out, down)` | 建立互動式按鈕 |
| `this.add.text(x, y, text, style)` | 建立文字顯示 |
| `this.physics.enable(obj, system)` | 在物件上啟用物理功能 |
| `this.physics.arcade.collide(a, b, cb)` | 偵測碰撞並彈跳 |
| `this.physics.arcade.overlap(a, b, cb)` | 偵測重疊但不彈跳 |
| `this.load.image(key, path)` | 載入影像資產 |
| `this.load.spritesheet(key, path, w, h)` | 載入精靈動畫表 |
| `this.load.audio(key, paths[])` | 載入包含格式回退方案的音訊 |
| `this.game.add.audio(key)` | 實例化音訊物件 |
| `this.time.events.loop(interval, cb, ctx)` | 建立重複計時器 |
