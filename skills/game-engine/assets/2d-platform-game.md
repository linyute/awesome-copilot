# 2D 平台跳躍遊戲範本 (2D Platform Game Template)

這是一個使用 Phaser (v2.x / Phaser CE) 搭配 Arcade Physics 建構 2D 平台跳躍遊戲的完整逐步指南。本範本涵蓋了開發的每個階段：設定專案、從 JSON 關卡資料建立平台、增加具備以物理為基礎的移動和跳躍功能的英雄、可收集的硬幣、行走的敵人、死亡與踩踏機制、計分板、精靈動畫、包含門/鑰匙系統的獲勝條件，以及多關卡進度。

**您將建構的內容：** 一個經典的橫向捲軸平台跳躍遊戲，英雄在其中穿梭於平台間、收集硬幣、避開或踩踏蜘蛛敵人、尋找鑰匙解鎖大門以完成關卡，並晉級到多個關卡 — 具備分數追蹤、動畫和物理效果。

**先決條件：** 基礎到進階的 JavaScript 知識，熟悉 HTML，以及用於開發的本機網頁伺服器（例如 browser-sync、live-server 或 Python 的 SimpleHTTPServer）。

**來源：** 基於 [Mozilla HTML5 Games Workshop - Platformer](https://mozdevs.github.io/html5-games-workshop/en/guides/platformer/start-here/)。專案入門檔案可在該工作坊的存放庫中取得。

---

## 從這裡開始 (Start Here)

本教學使用 **Phaser** 框架建構 2D 平台跳躍遊戲。Phaser 處理轉譯、物理、輸入、音訊和資產載入，讓您可以專注於遊戲邏輯。

### 您將建構的內容 (What You Will Build)

完成後的遊戲具備：

- 玩家使用鍵盤控制的英雄角色
- 英雄可以行走和跳躍的平台
- 增加分數的可收集硬幣
- 接觸時會殺死英雄的行走蜘蛛敵人（但可以從上方踩踏）
- 鑰匙和門系統：英雄必須拾取鑰匙解鎖門以完成關卡
- 從 JSON 資料檔案載入的多個關卡
- 顯示已收集硬幣的計分板
- 英雄的精靈動畫（閒置、跑步、跳躍、落下）

### 專案結構 (Project Structure)

```
project/
  index.html
  js/
    phaser.min.js        (Phaser 2.6.2 或 Phaser CE)
    main.js              (所有遊戲程式碼皆在此處)
  audio/
    sfx/
      jump.wav
      coin.wav
      stomp.wav
      key.wav
      door.wav
  images/
    background.png
    ground.png
    grass:8x1.png        (各種尺寸的平台圖塊影像)
    grass:6x1.png
    grass:4x1.png
    grass:2x1.png
    grass:1x1.png
    hero.png             (英雄精靈表：每影格 36x42)
    hero_stopped.png     (初期步驟使用的單影格)
    coin_animated.png    (硬幣精靈表)
    spider.png           (蜘蛛精靈表)
    invisible_wall.png   (敵人 AI 的隱形邊界)
    key.png              (鑰匙精靈表)
    door.png             (門精靈表)
    key_icon.png         (HUD 上的鑰匙圖示)
    font:numbers.png     (分數使用的點陣圖字型)
  data/
    level00.json
    level01.json
```

### 關卡資料格式 (Level Data Format)

每一關都在 JSON 檔案中定義。JSON 結構描述了每個實體的位置：

```json
{
    "hero": { "x": 21, "y": 525 },
    "door": { "x": 169, "y": 546 },
    "key": { "x": 750, "y": 524 },
    "platforms": [
        { "image": "ground", "x": 0, "y": 546 },
        { "image": "grass:8x1", "x": 208, "y": 420 },
        { "image": "grass:4x1", "x": 420, "y": 336 },
        { "image": "grass:2x1", "x": 680, "y": 252 }
    ],
    "coins": [
        { "x": 147, "y": 525 },
        { "x": 189, "y": 525 },
        { "x": 399, "y": 399 },
        { "x": 441, "y": 336 }
    ],
    "spiders": [
        { "x": 121, "y": 399 }
    ],
    "decoration": {
        "grass": [
            { "x": 84, "y": 504, "frame": 0 },
            { "x": 420, "y": 504, "frame": 1 }
        ]
    }
}
```

每種實體類型（英雄、門、鑰匙、平台、硬幣、蜘蛛）都有 `x` 和 `y` 座標。平台還會指定該平台圖塊要使用的 `image` 資產。

---

## 初始化 Phaser (Initialise Phaser)

第一步是設定 HTML 檔案並建立 Phaser 遊戲實例。

### HTML 入口點

建立一個 `index.html` 檔案，載入 Phaser 和您的遊戲指令碼：

```html
<!doctype html>
<html lang="zh-Hant">
<head>
    <meta charset="utf-8">
    <title>平台跳躍遊戲</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            background: #000;
        }
    </style>
    <script src="js/phaser.min.js"></script>
    <script src="js/main.js"></script>
</head>
<body>
    <div id="game"></div>
</body>
</html>
```

- `<div id="game">` 是 Phaser 插入遊戲畫布的容器。
- 先載入 Phaser，再載入您的遊戲指令碼。

### 建立遊戲實例 (Creating the Game Instance)

在 `js/main.js` 中，建立 Phaser 遊戲物件並註冊一個遊戲狀態：

```javascript
// 建立一個 Phaser 遊戲實例
// 參數：寬度, 高度, 轉譯器, DOM 元素識別碼
window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');

    // 增加並啟動遊玩狀態
    game.state.add('play', PlayState);
    game.state.start('play');
};
```

- `960, 600` 設定遊戲畫布的大小（以像素為單位）。
- `Phaser.AUTO` 讓 Phaser 自動在 WebGL 和 Canvas 轉譯之間切換。
- `'game'` 是將包含畫布的 DOM 元素的識別碼。

### PlayState 物件 (The PlayState Object)

將遊戲狀態定義為一個具有生命週期方法的物件：

```javascript
PlayState = {};

PlayState.init = function () {
    // 狀態啟動時首先呼叫
};

PlayState.preload = function () {
    // 在此處載入所有資產
};

PlayState.create = function () {
    // 建立遊戲實體並設定世界
};

PlayState.update = function () {
    // 每影格呼叫一次（約每秒 60 次）
    // 在此處處理遊戲邏輯、輸入、碰撞
};
```

- `init` — 首先執行；用於設定和接收參數。
- `preload` — 用於在遊戲開始前載入所有資產（影像、音訊、JSON）。
- `create` — 資產載入後呼叫一次；用於建立精靈、群組和遊戲物件。
- `update` — 每影格以約 60fps 呼叫；用於輸入處理、物理檢查和遊戲邏輯。

此時您應該會在頁面上看到一個空的黑色畫布。

---

## 遊戲迴圈 (The Game Loop)

Phaser 使用遊戲迴圈架構。每影格 Phaser 都會呼叫 `update()`，這是您處理輸入、移動精靈和檢查碰撞的地方。在迴圈開始前，`preload()` 會載入資產，而 `create()` 則會設定初始遊戲狀態。

### 載入並顯示背景 (Loading and Displaying the Background)

首先載入並顯示背景影像，以驗證遊戲迴圈是否正常運作：

```javascript
PlayState.preload = function () {
    this.game.load.image('background', 'images/background.png');
};

PlayState.create = function () {
    // 在位置 (0, 0) 增加背景影像
    this.game.add.image(0, 0, 'background');
};
```

- `this.game.load.image(key, path)` 載入一個影像並為其指定一個鍵值供稍後參考。
- `this.game.add.image(x, y, key)` 在給定位置建立一個靜態影像。

您現在應該會看到背景影像顯示在遊戲畫布中。

### 理解影格循環 (Understanding the Frame Cycle)

```
preload() -> [資產已載入] -> create() -> update() -> update() -> update() -> ...
```

每次對 `update()` 的呼叫都代表一個影格。遊戲的目標是每秒 60 影格。所有的移動、輸入讀取和碰撞偵測都發生在 `update()` 內。

---

## 建立平台 (Creating Platforms)

平台是英雄行走和跳躍的表面。它們從關卡 JSON 資料中載入，並建立為排列在群組中的具備物理功能的精靈。

### 載入平台資產 (Loading Platform Assets)

在 `preload` 中載入關卡 JSON 資料和所有平台圖塊影像：

```javascript
PlayState.preload = function () {
    this.game.load.image('background', 'images/background.png');

    // 載入關卡資料
    this.game.load.json('level:1', 'data/level01.json');

    // 載入平台影像
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
};
```

### 從關卡資料產生平台 (Spawning Platforms from Level Data)

建立一個方法來載入關卡，並在物理群組中產生每個平台精靈：

```javascript
PlayState.create = function () {
    // 增加背景
    this.game.add.image(0, 0, 'background');

    // 載入關卡資料並產生實體
    this._loadLevel(this.game.cache.getJSON('level:1'));
};

PlayState._loadLevel = function (data) {
    // 建立平台群組
    this.platforms = this.game.add.group();

    // 從關卡資料產生每個平台
    data.platforms.forEach(this._spawnPlatform, this);
};

PlayState._spawnPlatform = function (platform) {
    // 在平台的位置使用指定的影像增加精靈
    let sprite = this.platforms.create(platform.x, platform.y, platform.image);

    // 在此平台上啟用物理功能
    this.game.physics.enable(sprite);

    // 將平台設為靜止，使其不會被英雄推動
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
};
```

- `this.game.add.group()` 建立一個 Phaser 群組 — 這是一個相關精靈的容器，可實現批次作業和碰撞偵測。
- `this.platforms.create(x, y, key)` 在群組內建立精靈。
- `sprite.body.immovable = true` 防止平台被其他物理主體推動。
- `sprite.body.allowGravity = false` 防止平台因重力而落下。

您現在應該會看到地面和草地平台圖塊轉譯在螢幕上。

---

## 主角精靈 (The Main Character Sprite)

現在增加玩家將控制的英雄角色。

### 載入英雄影像 (Loading the Hero Image)

將英雄影像增加到 `preload`。最初我們使用單個靜態影像；稍後我們將切換到精靈表以製作動畫：

```javascript
// 在 PlayState.preload 中：
this.game.load.image('hero', 'images/hero_stopped.png');
```

### 產生英雄 (Spawning the Hero)

將英雄增加到 `_loadLevel` 並建立產生方法：

```javascript
PlayState._loadLevel = function (data) {
    this.platforms = this.game.add.group();
    data.platforms.forEach(this._spawnPlatform, this);

    // 在關卡資料定義的位置產生英雄
    this._spawnCharacters({ hero: data.hero });
};

PlayState._spawnCharacters = function (data) {
    // 建立英雄精靈
    this.hero = this.game.add.sprite(data.hero.x, data.hero.y, 'hero');

    // 將錨點設為底部中心以方便定位
    this.hero.anchor.set(0.5, 1);
};
```

- `anchor.set(0.5, 1)` 將精靈的原點設定在水平中心和垂直底部。這使得將英雄定位在平台上方變得更容易，因為 `y` 位置指的是英雄的腳而不是左上角。

---

## 鍵盤控制 (Keyboard Controls)

捕捉鍵盤輸入，以便玩家可以左右移動英雄並跳躍。

### 設定輸入按鍵 (Setting Up Input Keys)

在 `init` 中，設定鍵盤控制：

```javascript
PlayState.init = function () {
    // 強制整數轉譯以獲得清晰的像素藝術效果
    this.game.renderer.renderSession.roundPixels = true;

    // 捕捉方向鍵
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });
};
```

- `addKeys()` 捕捉指定的按鍵並傳回一個包含按鍵狀態參考的物件。
- `Phaser.KeyCode.LEFT`、`RIGHT`、`UP` 對應到方向鍵。
- `renderSession.roundPixels = true` 防止像素藝術精靈因次像素 (sub-pixel) 轉譯而顯得模糊。

### 在 Update 中讀取輸入 (Reading Input in Update)

在 `update` 中處理按鍵狀態。目前僅記錄方向；下一步將增加以物理為基礎的移動：

```javascript
PlayState.update = function () {
    this._handleInput();
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown) {
        // 向左移動英雄
    } else if (this.keys.right.isDown) {
        // 向右移動英雄
    } else {
        // 停止（未按下按鍵）
    }
};
```

- `this.keys.left.isDown` 在向左鍵被按住時傳回 `true`。
- `else` 子句處理既沒按左也沒按右的情況（英雄應該停止）。

---

## 使用物理移動精靈 (Moving Sprites with Physics)

啟用 Arcade Physics，讓英雄可以以速度移動並透過碰撞與平台互動。

### 啟用物理引擎 (Enabling the Physics Engine)

在 `init` 中啟用 Arcade Physics：

```javascript
PlayState.init = function () {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });

    // 啟用 Arcade Physics
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
};
```

### 為英雄增加物理主體 (Adding a Physics Body to the Hero)

在 `_spawnCharacters` 中對英雄精靈啟用物理功能：

```javascript
PlayState._spawnCharacters = function (data) {
    this.hero = this.game.add.sprite(data.hero.x, data.hero.y, 'hero');
    this.hero.anchor.set(0.5, 1);

    // 對英雄啟用物理主體
    this.game.physics.enable(this.hero);
};
```

### 以速度移動 (Moving with Velocity)

現在更新 `_handleInput` 以根據按鍵動作設定英雄的速度：

```javascript
const SPEED = 200; // 每秒像素數

PlayState._handleInput = function () {
    if (this.keys.left.isDown) {
        this.hero.body.velocity.x = -SPEED;
    } else if (this.keys.right.isDown) {
        this.hero.body.velocity.x = SPEED;
    } else {
        this.hero.body.velocity.x = 0;
    }
};
```

- `body.velocity.x` 設定水平速度（每秒像素數）。
- 負值向左移動精靈；正值向右移動。
- 在沒有按鍵被按下時將速度設為 `0`，可使英雄立即停止。

英雄現在可以左右移動，但會掉落出平台並從螢幕消失，因為還沒有重力或碰撞處理。

---

## 重力 (Gravity)

增加重力，使英雄向下墜落並與平台發生碰撞。

### 設定全域重力 (Setting Global Gravity)

在 `init` 中為整個物理世界啟用重力：

```javascript
PlayState.init = function () {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    // 設定全域重力
    this.game.physics.arcade.gravity.y = 1200;
};
```

- `gravity.y = 1200` 對所有啟用了物理功能的精靈套用每秒平方 1200 像素的向下加速度（除非它們透過 `allowGravity = false` 選擇退出）。

### 英雄與平台間的碰撞偵測 (Collision Detection Between Hero and Platforms)

在 `update` 中增加碰撞偵測，使英雄降落在平台上而不是穿過平台：

```javascript
PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();
};

PlayState._handleCollisions = function () {
    // 使英雄與平台群組發生碰撞
    this.game.physics.arcade.collide(this.hero, this.platforms);
};
```

- `arcade.collide(spriteA, groupB)` 檢查英雄與平台群組中每個精靈之間的物理碰撞。當英雄降落在平台上時，物理引擎會防止它穿過並解決重疊問題。
- 務必在 `_handleInput()` 之前呼叫 `_handleCollisions()`，這樣在處理輸入時，碰撞資料（例如英雄是否觸地）才是最新的。

英雄現在會因重力而墜落並降落在平台上。您可以在平台上左右行走。

---

## 跳躍 (Jumps)

允許英雄在按向上方向鍵時跳躍 — 但僅在站在平台上時（禁止二段跳）。

### 實作跳躍機制 (Implementing the Jump Mechanic)

增加一個跳躍常數並更新 `_handleInput`：

```javascript
const SPEED = 200;
const JUMP_SPEED = 600;

PlayState._handleInput = function () {
    if (this.keys.left.isDown) {
        this.hero.body.velocity.x = -SPEED;
    } else if (this.keys.right.isDown) {
        this.hero.body.velocity.x = SPEED;
    } else {
        this.hero.body.velocity.x = 0;
    }

    // 處理跳躍
    if (this.keys.up.isDown) {
        this._jump();
    }
};

PlayState._jump = function () {
    let canJump = this.hero.body.touching.down;

    if (canJump) {
        this.hero.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};
```

- 當英雄的物理主體底端接觸到另一個主體時，`this.hero.body.touching.down` 為 `true` — 代表英雄正站在某個物體上。
- 將 `velocity.y` 設定為負值會使英雄向上彈射（在螢幕座標系中 y 軸指向下方）。
- `canJump` 檢查可防止英雄在空中再次跳躍，強制執行單次跳躍行為。
- 此方法傳回是否執行了跳躍，這對稍後播放音效很有用。

### 增加跳躍音效 (Adding a Jump Sound Effect)

載入跳躍聲音並在跳躍成功時播放：

```javascript
// 在 PlayState.preload 中：
this.game.load.audio('sfx:jump', 'audio/sfx/jump.wav');

// 在 PlayState.create 中：
this.sfx = {
    jump: this.game.add.audio('sfx:jump')
};

// 在 PlayState._jump 中，設定速度之後：
PlayState._jump = function () {
    let canJump = this.hero.body.touching.down;

    if (canJump) {
        this.hero.body.velocity.y = -JUMP_SPEED;
        this.sfx.jump.play();
    }

    return canJump;
};
```

---

## 可拾取的硬幣 (Pickable Coins)

增加玩家可以拾取以增加分數的可收集硬幣。

### 載入硬幣資產 (Loading Coin Assets)

在 `preload` 中載入硬幣精靈表和硬幣音效：

```javascript
// 在 PlayState.preload 中：
this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
this.game.load.audio('sfx:coin', 'audio/sfx/coin.wav');
```

- `load.spritesheet(key, path, frameWidth, frameHeight)` 載入一個精靈表，並將其切割成每影格 22x22 像素的各個影格以製作動畫。

### 從關卡資料產生硬幣 (Spawning Coins from Level Data)

更新 `_loadLevel` 以建立硬幣群組並產生每個硬幣：

```javascript
PlayState._loadLevel = function (data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);

    this._spawnCharacters({ hero: data.hero });
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);

    // 增加一個補間動畫 (tween) 使硬幣上下浮動
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;

    // 使用補間動畫製作硬幣旋轉動畫
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps，迴圈
    sprite.animations.play('rotate');
};
```

- 每個硬幣都在 `coins` 群組內建立，以便進行碰撞偵測。
- `allowGravity = false` 防止硬幣落下。
- `animations.add` 使用精靈表影格 0, 1, 2, 1 建立一個影格動畫，以 6fps 持續循環播放。

### 收集硬幣 (Collecting Coins)

將硬幣聲音增加到 sfx 物件，並偵測英雄與硬幣之間的重疊：

```javascript
// 在 PlayState.create 中，增加到 sfx 物件：
this.sfx = {
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin')
};

// 在 PlayState._handleCollisions 中：
PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);

    // 偵測英雄與硬幣之間的重疊（無物理碰撞，僅重疊）
    this.game.physics.arcade.overlap(
        this.hero, this.coins, this._onHeroVsCoin, null, this
    );
};

PlayState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();  // 從遊戲中移除硬幣
    this.coinPickupCount++;
};
```

- `arcade.overlap()` 檢查兩個精靈/群組是否重疊而不解決物理碰撞。當偵測到重疊時，它會呼叫回呼函式 (`_onHeroVsCoin`)。
- `coin.kill()` 將硬幣精靈從遊戲世界中移除。
- `this.coinPickupCount` 追蹤收集的硬幣數量（在 `_loadLevel` 中初始化）。

### 初始化硬幣計數器 (Initializing the Coin Counter)

```javascript
PlayState._loadLevel = function (data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);

    this._spawnCharacters({ hero: data.hero });

    // 初始化硬幣計數器
    this.coinPickupCount = 0;
};
```

---

## 行走的敵人 (Walking Enemies)

增加在平台上來回走動的蜘蛛敵人。英雄可以從上方踩踏它們，但如果從側面接觸則會死亡。

### 載入敵人資產 (Loading Enemy Assets)

```javascript
// 在 PlayState.preload 中：
this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
this.game.load.image('invisible-wall', 'images/invisible_wall.png');
this.game.load.audio('sfx:stomp', 'audio/sfx/stomp.wav');
```

- 蜘蛛精靈表包含爬行動畫的影格。
- 隱形牆放置在平台邊緣以防止蜘蛛掉落 — 它們不進行視覺渲染但具備物理主體。

### 產生敵人 (Spawning Enemies)

更新 `_loadLevel` 並為蜘蛛增加產生方法：

```javascript
PlayState._loadLevel = function (data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);
    data.spiders.forEach(this._spawnSpider, this);

    this._spawnCharacters({ hero: data.hero });

    // 使敵人牆隱形
    this.enemyWalls.visible = false;

    this.coinPickupCount = 0;
};
```

### 在平台上建立隱形牆 (Creating Invisible Walls on Platforms)

修改 `_spawnPlatform` 以在每個平台的兩個邊緣增加隱形牆：

```javascript
PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;

    // 在此平台的左右邊緣產生隱形牆
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');

    // 錨點設於牆壁底部，並根據側邊調整位置
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};
```

- 每個平台獲得兩面隱形牆，左右邊緣各一面。
- 牆壁作為屏障防止蜘蛛走落邊緣。
- 錨點經過設定，使牆壁與平台的正確側邊對齊。

### 產生並製作蜘蛛動畫 (Spawning and Animating Spiders)

```javascript
PlayState._spawnSpider = function (spider) {
    let sprite = this.spiders.create(spider.x, spider.y, 'spider');
    sprite.anchor.set(0.5, 1);

    // 增加爬行動畫
    sprite.animations.add('crawl', [0, 1, 2], 8, true);
    sprite.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    sprite.animations.play('crawl');

    // 啟用物理功能
    this.game.physics.enable(sprite);

    // 設定初始移動速度
    sprite.body.velocity.x = Spider.SPEED;
};

// 蜘蛛速度常數
const Spider = { SPEED: 100 };
```

- 蜘蛛有兩個動畫：`crawl`（循環播放）和 `die`（死亡時播放一次）。
- `velocity.x = 100` 讓蜘蛛開始以每秒 100 像素的速度向右移動。

### 使蜘蛛撞牆彈回 (Making Spiders Bounce Off Walls)

增加碰撞處理，使蜘蛛在撞到隱形牆或平台邊緣時反轉方向：

```javascript
// 在 PlayState._handleCollisions 中：
PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

    this.game.physics.arcade.overlap(
        this.hero, this.coins, this._onHeroVsCoin, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.spiders, this._onHeroVsEnemy, null, this
    );
};
```

為了使蜘蛛在與牆壁碰撞時反轉方向，每影格檢查它們的速度並翻轉它們：

```javascript
// 在 PlayState.update 中碰撞處理後，更新蜘蛛方向：
PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();

    // 根據速度更新蜘蛛面向的方向
    this.spiders.forEach(function (spider) {
        if (spider.body.touching.right || spider.body.blocked.right) {
            spider.body.velocity.x = -Spider.SPEED; // 向左轉
        } else if (spider.body.touching.left || spider.body.blocked.left) {
            spider.body.velocity.x = Spider.SPEED; // 向右轉
        }
    }, this);
};
```

- 當蜘蛛右側觸碰到牆壁時，它反轉為向左移動，反之亦然。
- `body.touching` 在碰撞解決後由 Phaser 設定。

---

## 死亡 (Death)

實作英雄觸碰敵人時死亡，以及殺死敵人的踩踏機制。

### 英雄 vs 敵人：踩踏或死亡 (Hero vs Enemy: Stomp or Die)

當英雄與蜘蛛重疊時，檢查英雄是否正在落下（踩踏）：

```javascript
PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) {
        // 英雄正在落下 -> 踩踏敵人
        enemy.body.velocity.x = 0; // 停止敵人移動
        enemy.body.enable = false; // 停用敵人物理

        // 播放死亡動畫後移除敵人
        enemy.animations.play('die');
        enemy.events.onAnimationComplete.addOnce(function () {
            enemy.kill();
        });

        // 踩踏後將英雄向上彈起
        hero.body.velocity.y = -JUMP_SPEED / 2;

        this.sfx.stomp.play();
    } else {
        // 英雄從側面或下方觸碰敵人 -> 死亡
        this._killHero();
    }
};

PlayState._killHero = function () {
    this.hero.kill();
    // 短暫延遲後重新啟動關卡
    this.game.time.events.add(500, function () {
        this.game.state.restart(true, false, { level: this.level });
    }, this);
};
```

- 如果 `hero.body.velocity.y > 0`，代表英雄正向下移動（落下），表示踩踏動作。
- 踩踏時：敵人停止、播放死亡動畫並被移除。英雄向上彈起。
- 如果英雄不是正在落下，則英雄死亡。`this.hero.kill()` 將英雄從遊戲中移除。
- 500 毫秒後，整個狀態重啟，實際上是重新載入關卡。

### 增加踩踏音效 (Add Stomp Sound)

```javascript
// 在 PlayState.create 中，增加到 sfx：
this.sfx = {
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin'),
    stomp: this.game.add.audio('sfx:stomp')
};
```

### 增加英雄死亡動畫 (Adding a Death Animation for the Hero)

讓英雄在死亡時閃爍並從螢幕掉落：

```javascript
PlayState._killHero = function () {
    this.hero.alive = false;

    // 播放「死亡」視覺效果：英雄跳起並從螢幕掉落
    this.hero.body.velocity.y = -JUMP_SPEED / 2;
    this.hero.body.velocity.x = 0;
    this.hero.body.allowGravity = true;

    // 停用碰撞以便英雄穿過平台掉落
    this.hero.body.collideWorldBounds = false;

    // 延遲後重啟
    this.game.time.events.add(1000, function () {
        this.game.state.restart(true, false, { level: this.level });
    }, this);
};
```

### 死亡時防止輸入 (Guarding Input When Dead)

防止玩家在英雄死亡後控制它：

```javascript
PlayState._handleInput = function () {
    if (!this.hero.alive) { return; }

    if (this.keys.left.isDown) {
        this.hero.body.velocity.x = -SPEED;
    } else if (this.keys.right.isDown) {
        this.hero.body.velocity.x = SPEED;
    } else {
        this.hero.body.velocity.x = 0;
    }

    if (this.keys.up.isDown) {
        this._jump();
    }
};
```

- `this.hero.alive` 在 `_killHero` 中被設為 `false`，因此死亡後的輸入會被忽略，英雄會自然地掉出螢幕。

---

## 計分板 (Scoreboard)

使用點陣圖字型在螢幕上顯示已收集硬幣的數量。

### 載入點陣圖字型 (Loading the Bitmap Font)

```javascript
// 在 PlayState.preload 中：
this.game.load.image('font:numbers', 'images/numbers.png');
this.game.load.image('icon:coin', 'images/coin_icon.png');
```

### 建立 HUD (Creating the HUD)

建立一個顯示硬幣圖示和數量的固定 HUD（抬頭顯示器）：

```javascript
PlayState._createHud = function () {
    let coinIcon = this.game.make.image(0, 0, 'icon:coin');

    // 為硬幣計數建立動態文字標籤
    this.hud = this.game.add.group();

    // 對分數使用 retroFont 或一般文字物件
    let scoreStyle = {
        font: '30px monospace',
        fill: '#fff'
    };
    this.coinFont = this.game.add.text(
        coinIcon.width + 7, 0, 'x0', scoreStyle
    );

    this.hud.add(coinIcon);
    this.hud.add(this.coinFont);

    this.hud.position.set(10, 10);
    this.hud.fixedToCamera = true;
};
```

或者，使用 Phaser 的 `RetroFont` 進行像素藝術數字轉譯：

```javascript
PlayState._createHud = function () {
    // 使用 RetroFont 進行以點陣圖為基礎的數字轉譯
    this.coinFont = this.game.add.retroFont(
        'font:numbers', 20, 26,
        '0123456789X ', 6
    );

    let coinIcon = this.game.make.image(0, 0, 'icon:coin');

    let coinScoreImg = this.game.make.image(
        coinIcon.x + coinIcon.width + 7, 0, this.coinFont
    );

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(coinScoreImg);
    this.hud.position.set(10, 10);
    this.hud.fixedToCamera = true;
};
```

- `retroFont` 從包含字元字形的精靈表建立點陣圖字型。
- 參數：影像鍵值, 字元寬度, 字元高度, 字元集字串, 每列字元數。

### 在 create 中呼叫 createHud (Calling createHud in create)

```javascript
PlayState.create = function () {
    this.game.add.image(0, 0, 'background');

    this._loadLevel(this.game.cache.getJSON('level:1'));

    // 建立 HUD
    this._createHud();
};
```

### 更新分數顯示 (Updating the Score Display)

每當收集到硬幣時更新分數文字：

```javascript
PlayState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    this.coinPickupCount++;

    // 更新 HUD
    this.coinFont.text = 'x' + this.coinPickupCount;
};
```

---

## 主角動畫 (Animations for the Main Character)

用精靈表替換靜態英雄影像，並為不同狀態增加動畫：閒置（停止）、跑步、跳躍和落下。

### 載入英雄精靈表 (Loading the Hero Spritesheet)

在 `preload` 中用精靈表載入替換單個影像載入：

```javascript
// 替換：this.game.load.image('hero', 'images/hero_stopped.png');
// 改為：
this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
```

- 英雄精靈表每影格寬 36 像素、高 42 像素。
- 影格包括閒置、行走循環、跳躍和落下姿勢。

### 定義動畫 (Defining Animations)

在 `_spawnCharacters` 中建立英雄精靈後增加動畫定義：

```javascript
PlayState._spawnCharacters = function (data) {
    this.hero = this.game.add.sprite(data.hero.x, data.hero.y, 'hero');
    this.hero.anchor.set(0.5, 1);
    this.game.physics.enable(this.hero);

    // 定義動畫
    this.hero.animations.add('stop', [0]);               // 單影格：閒置
    this.hero.animations.add('run', [1, 2], 8, true);    // 2 影格 8fps，迴圈
    this.hero.animations.add('jump', [3]);                // 單影格：向上跳躍
    this.hero.animations.add('fall', [4]);                // 單影格：向下落下
};
```

- `animations.add(name, frames, fps, loop)` 註冊具有給定名稱的動畫。
- 單影格動畫（如 `stop`、`jump` 和 `fall`）實際上是設定靜態姿勢。
- `run` 動畫以 8fps 在影格 1 和 2 之間切換。

### 播放正確的動畫 (Playing the Correct Animation)

增加一個方法來根據英雄目前狀態確定並播放正確的動畫：

```javascript
PlayState._getAnimationName = function () {
    let name = 'stop'; // 預設值：靜止不動

    if (!this.hero.alive) {
        name = 'stop'; // 死亡時使用閒置影格
    } else if (this.hero.body.velocity.y < 0) {
        name = 'jump'; // 向上移動
    } else if (this.hero.body.velocity.y > 0 && !this.hero.body.touching.down) {
        name = 'fall'; // 向下移動且未觸地
    } else if (this.hero.body.velocity.x !== 0 && this.hero.body.touching.down) {
        name = 'run';  // 在地面上水平移動
    }

    return name;
};
```

### 根據方向翻轉精靈 (Flipping the Sprite Based on Direction)

在 `update` 中更新英雄面向的方向並播放動畫：

```javascript
PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();

    // 根據移動方向翻轉精靈
    if (this.hero.body.velocity.x < 0) {
        this.hero.scale.x = -1; // 面向左側
    } else if (this.hero.body.velocity.x > 0) {
        this.hero.scale.x = 1;  // 面向右側
    }

    // 播放適當的動畫
    this.hero.animations.play(this._getAnimationName());

    // 更新蜘蛛方向
    this.spiders.forEach(function (spider) {
        if (spider.body.touching.right || spider.body.blocked.right) {
            spider.body.velocity.x = -Spider.SPEED;
        } else if (spider.body.touching.left || spider.body.blocked.left) {
            spider.body.velocity.x = Spider.SPEED;
        }
    }, this);
};
```

- `this.hero.scale.x = -1` 水平翻轉精靈以面向左側。設為 `1` 則面向右側。因為錨點在 `(0.5, 1)`，翻轉看起來很自然。
- `animations.play()` 僅在名稱變更時才重新啟動動畫，因此每影格呼叫它是安全且高效的。

---

## 獲勝條件 (Win Condition)

增加門和鑰匙機制：英雄必須收集鑰匙，然後到達門口以完成關卡。

### 載入門與鑰匙資產 (Loading Door and Key Assets)

```javascript
// 在 PlayState.preload 中：
this.game.load.spritesheet('door', 'images/door.png', 42, 66);
this.game.load.spritesheet('key', 'images/key.png', 20, 22);  // 鑰匙浮動動畫
this.game.load.image('icon:key', 'images/key_icon.png');

this.game.load.audio('sfx:key', 'audio/sfx/key.wav');
this.game.load.audio('sfx:door', 'audio/sfx/door.wav');
```

### 產生門與鑰匙 (Spawning the Door and Key)

更新 `_loadLevel` 和 `_spawnCharacters`：

```javascript
PlayState._loadLevel = function (data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.bgDecoration = this.game.add.group();

    // 必須先產生裝飾品（背景層）
    // 在英雄之前產生門，使其轉譯在英雄後方
    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);
    data.spiders.forEach(this._spawnSpider, this);

    this._spawnDoor(data.door.x, data.door.y);
    this._spawnKey(data.key.x, data.key.y);
    this._spawnCharacters({ hero: data.hero });

    this.enemyWalls.visible = false;

    this.coinPickupCount = 0;
    this.hasKey = false;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);

    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);

    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;

    // 為鑰匙增加一個上下浮動的補間動畫 (tween)
    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({ y: this.key.y + 6 }, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};
```

- 門被放置在背景裝飾群組中，使其轉譯在英雄後方。
- 鑰匙具有正弦波浮動補間動畫，在 800 毫秒內上下移動 6 像素，循環往復。

### 收集鑰匙並開門 (Collecting the Key and Opening the Door)

將鑰匙和門的音效增加到 sfx 物件：

```javascript
// 在 PlayState.create sfx 中：
this.sfx = {
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin'),
    stomp: this.game.add.audio('sfx:stomp'),
    key: this.game.add.audio('sfx:key'),
    door: this.game.add.audio('sfx:door')
};
```

在 `_handleCollisions` 中增加鑰匙和門的重疊偵測：

```javascript
PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

    this.game.physics.arcade.overlap(
        this.hero, this.coins, this._onHeroVsCoin, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.spiders, this._onHeroVsEnemy, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.key, this._onHeroVsKey, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.door, this._onHeroVsDoor,
        // 僅在英雄持有鑰匙時觸發
        function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this
    );
};
```

- 門的重疊偵測具有 **處理回呼 (process callback)**（第四個引數），僅在 `this.hasKey` 為 true 且英雄觸地時才觸發重疊回呼。這防止了英雄在落下時或沒有鑰匙的情況下進入門口。

### 鑰匙與門回呼 (Key and Door Callbacks)

```javascript
PlayState._onHeroVsKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.sfx.door.play();

    // 凍結英雄並播放開門動畫
    hero.body.velocity.x = 0;
    hero.body.velocity.y = 0;
    hero.body.enable = false;

    // 播放開門動畫（從關閉影格切換到開啟影格）
    door.frame = 1; // 切換至「開啟」影格

    // 延遲後晉級至下一關
    this.game.time.events.add(500, this._goToNextLevel, this);
};

PlayState._goToNextLevel = function () {
    this.camera.fade('#000');
    this.camera.onFadeComplete.addOnce(function () {
        this.game.state.restart(true, false, {
            level: this.level + 1
        });
    }, this);
};
```

- 當英雄觸碰鑰匙時，鑰匙被移除且 `hasKey` 設為 `true`。
- 當英雄到達門口（持有鑰匙）時，英雄凍結，門開啟，延遲後遊戲過渡到下一關。
- `camera.fade()` 建立一個淡出為黑色的過渡效果，讓關卡切換更精緻。

### 在 HUD 中顯示鑰匙圖示 (Showing the Key Icon in the HUD)

更新 `_createHud` 以顯示英雄是否已收集鑰匙：

```javascript
PlayState._createHud = function () {
    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    // ... 現有的硬幣 HUD 程式碼 ...

    this.hud.add(this.keyIcon);
    this.hud.add(coinIcon);
    this.hud.add(coinScoreImg);
    this.hud.position.set(10, 10);
    this.hud.fixedToCamera = true;
};
```

在 `update` 中每影格更新鑰匙圖示的外觀：

```javascript
// 在 PlayState.update 中，增加：
this.keyIcon.frame = this.hasKey ? 1 : 0;
```

- 影格 0 顯示灰色的鑰匙圖示；影格 1 顯示已收集的鑰匙圖示。

---

## 切換關卡 (Switching Levels)

透過根據關卡索引載入不同 JSON 檔案來支援多個關卡。

### 透過 init 傳遞關卡編號 (Passing Level Number Through init)

修改 `init` 以接收關卡參數：

```javascript
PlayState.init = function (data) {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 1200;

    // 儲存目前關卡編號（預設為 0）
    this.level = (data.level || 0) % LEVEL_COUNT;
};

const LEVEL_COUNT = 2; // 總關卡數
```

- `data` 是從 `game.state.start()` 或 `game.state.restart()` 傳遞的物件。
- 取模運算 (`% LEVEL_COUNT`) 在最後一關後回到關卡 0，形成關卡無限循環。

### 動態載入關卡資料 (Loading Level Data Dynamically)

更新 `preload` 以根據 `this.level` 載入正確的關卡：

```javascript
PlayState.preload = function () {
    this.game.load.image('background', 'images/background.png');

    // 載入目前關卡的 JSON 資料
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');

    // ... 載入所有其他資產 ...
};
```

更新 `create` 以使用正確的關卡資料：

```javascript
PlayState.create = function () {
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp'),
        key: this.game.add.audio('sfx:key'),
        door: this.game.add.audio('sfx:door')
    };

    this.game.add.image(0, 0, 'background');

    // 根據目前關卡編號載入關卡資料
    this._loadLevel(this.game.cache.getJSON('level:' + this.level));

    this._createHud();
};
```

### 從關卡 0 開始遊戲 (Starting the Game at Level 0)

更新初始狀態啟動以傳遞關卡 0：

```javascript
window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play', true, false, { level: 0 });
};
```

- `start` 的第三和第四個引數控制世界/快取的清除。`true, false` 保留重新啟動之間的快取（資產無須重新載入）但清除世界。
- `{ level: 0 }` 作為 `data` 參數傳遞給 `init`。

### 關卡過渡流程 (Level Transition Flow)

完整的關卡流程為：

1. 英雄收集鑰匙 -> `hasKey = true`
2. 英雄到達門口 -> 觸發 `_onHeroVsDoor`
3. 相機淡出為黑色 -> 觸發 `_goToNextLevel`
4. 狀態重新啟動並包含 `{ level: this.level + 1 }`
5. `init` 接收新的關卡編號
6. 正確的關卡 JSON 被載入，遊戲繼續

---

## 向前邁進 (Moving Forward)

恭喜 — 您已建構了一個完整的 2D 平台跳躍遊戲。以下是進一步擴充遊戲的想法：

### 建議的改進 (Suggested Improvements)

- **行動裝置 / 觸控控制：** 為具備觸控功能的裝置增加螢幕按鈕或使用 `game.input.onDown` 增加滑動手勢。
- **更多關卡：** 建立額外的 JSON 關卡檔案，包含新的平台佈局、硬幣放置和敵人配置。
- **選單畫面：** 在進入 `PlayState` 前增加一個具有標題畫面和開始按鈕的 `MenuState`。
- **遊戲結束畫面：** 不要立即重新啟動，而是顯示帶有分數的「遊戲結束」畫面。
- **生命系統：** 給英雄多次生命，而不是立即重新啟動。
- **道具 (Power-ups)：** 增加速度提升、二段跳或無敵等項目。
- **移動平台：** 使用補間動畫建立沿路徑移動的平台。
- **不同敵人類型：** 增加飛行敵人、射擊子彈的敵人或具有不同移動模式的敵人。
- **視差捲動 (Parallax scrolling)：** 增加多個背景層，以不同速度捲動以產生深度感。
- **相機捲動：** 對於寬度大於螢幕的關卡，使用 `game.camera.follow(this.hero)` 跟隨英雄捲動。
- **聲音與音樂：** 增加背景音樂和額外的音效以獲得更精緻的體驗。
- **粒子效果：** 使用 Phaser 的粒子發射器製作收集硬幣時的閃光、敵人死亡效果或落地時的塵土。

### 完整遊戲原始碼參考 (Full Game Source Reference)

以下是合併所有步驟後的完整 `main.js` 檔案，供您參考。這代表了具備所有功能的遊戲最終狀態：

```javascript
// =============================================================================
// 常數
// =============================================================================

const SPEED = 200;
const JUMP_SPEED = 600;
const LEVEL_COUNT = 2;
const Spider = { SPEED: 100 };

// =============================================================================
// 遊戲狀態：PlayState
// =============================================================================

PlayState = {};

// -----------------------------------------------------------------------------
// init
// -----------------------------------------------------------------------------

PlayState.init = function (data) {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 1200;

    this.level = (data.level || 0) % LEVEL_COUNT;
};

// -----------------------------------------------------------------------------
// preload
// -----------------------------------------------------------------------------

PlayState.preload = function () {
    // 背景
    this.game.load.image('background', 'images/background.png');

    // 關卡資料
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');

    // 平台圖塊
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');

    // 角色
    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');

    // 可收集項目
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('key', 'images/key.png', 20, 22);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);

    // HUD
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('icon:key', 'images/key_icon.png');
    this.game.load.image('font:numbers', 'images/numbers.png');

    // 音訊
    this.game.load.audio('sfx:jump', 'audio/sfx/jump.wav');
    this.game.load.audio('sfx:coin', 'audio/sfx/coin.wav');
    this.game.load.audio('sfx:stomp', 'audio/sfx/stomp.wav');
    this.game.load.audio('sfx:key', 'audio/sfx/key.wav');
    this.game.load.audio('sfx:door', 'audio/sfx/door.wav');
};

// -----------------------------------------------------------------------------
// create
// -----------------------------------------------------------------------------

PlayState.create = function () {
    // 音效
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp'),
        key: this.game.add.audio('sfx:key'),
        door: this.game.add.audio('sfx:door')
    };

    // 背景
    this.game.add.image(0, 0, 'background');

    // 載入關卡
    this._loadLevel(this.game.cache.getJSON('level:' + this.level));

    // HUD
    this._createHud();
};

// -----------------------------------------------------------------------------
// update
// -----------------------------------------------------------------------------

PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();

    // 更新英雄精靈方向與動畫
    if (this.hero.body.velocity.x < 0) {
        this.hero.scale.x = -1;
    } else if (this.hero.body.velocity.x > 0) {
        this.hero.scale.x = 1;
    }
    this.hero.animations.play(this._getAnimationName());

    // 蜘蛛撞牆時更新方向
    this.spiders.forEach(function (spider) {
        if (spider.body.touching.right || spider.body.blocked.right) {
            spider.body.velocity.x = -Spider.SPEED;
        } else if (spider.body.touching.left || spider.body.blocked.left) {
            spider.body.velocity.x = Spider.SPEED;
        }
    }, this);

    // 更新 HUD 中的鑰匙圖示
    this.keyIcon.frame = this.hasKey ? 1 : 0;
};

// -----------------------------------------------------------------------------
// 關卡載入
// -----------------------------------------------------------------------------

PlayState._loadLevel = function (data) {
    // 建立群組（順序會影響轉譯層級）
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();

    // 從關卡資料產生實體
    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);
    data.spiders.forEach(this._spawnSpider, this);

    this._spawnDoor(data.door.x, data.door.y);
    this._spawnKey(data.key.x, data.key.y);
    this._spawnCharacters({ hero: data.hero });

    // 隱藏隱形牆
    this.enemyWalls.visible = false;

    // 初始化遊戲狀態
    this.coinPickupCount = 0;
    this.hasKey = false;
};

// -----------------------------------------------------------------------------
// 產生方法
// -----------------------------------------------------------------------------

PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;

    // 為敵人 AI 在兩側增加隱形牆
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
    this.hero = this.game.add.sprite(data.hero.x, data.hero.y, 'hero');
    this.hero.anchor.set(0.5, 1);
    this.game.physics.enable(this.hero);
    this.hero.body.collideWorldBounds = true;

    // 英雄動畫
    this.hero.animations.add('stop', [0]);
    this.hero.animations.add('run', [1, 2], 8, true);
    this.hero.animations.add('jump', [3]);
    this.hero.animations.add('fall', [4]);
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;

    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true);
    sprite.animations.play('rotate');
};

PlayState._spawnSpider = function (spider) {
    let sprite = this.spiders.create(spider.x, spider.y, 'spider');
    sprite.anchor.set(0.5, 1);
    this.game.physics.enable(sprite);

    sprite.animations.add('crawl', [0, 1, 2], 8, true);
    sprite.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    sprite.animations.play('crawl');

    sprite.body.velocity.x = Spider.SPEED;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;

    // 浮動補間動畫
    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({ y: this.key.y + 6 }, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};

// -----------------------------------------------------------------------------
// 輸入
// -----------------------------------------------------------------------------

PlayState._handleInput = function () {
    if (!this.hero.alive) { return; }

    if (this.keys.left.isDown) {
        this.hero.body.velocity.x = -SPEED;
    } else if (this.keys.right.isDown) {
        this.hero.body.velocity.x = SPEED;
    } else {
        this.hero.body.velocity.x = 0;
    }

    if (this.keys.up.isDown) {
        this._jump();
    }
};

PlayState._jump = function () {
    let canJump = this.hero.body.touching.down;
    if (canJump) {
        this.hero.body.velocity.y = -JUMP_SPEED;
        this.sfx.jump.play();
    }
    return canJump;
};

// -----------------------------------------------------------------------------
// 碰撞
// -----------------------------------------------------------------------------

PlayState._handleCollisions = function () {
    // 物理碰撞
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

    // 重疊偵測（無物理推動）
    this.game.physics.arcade.overlap(
        this.hero, this.coins, this._onHeroVsCoin, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.spiders, this._onHeroVsEnemy, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.key, this._onHeroVsKey, null, this
    );
    this.game.physics.arcade.overlap(
        this.hero, this.door, this._onHeroVsDoor,
        function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this
    );
};

// -----------------------------------------------------------------------------
// 碰撞回呼
// -----------------------------------------------------------------------------

PlayState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    this.coinPickupCount++;
    this.coinFont.text = 'x' + this.coinPickupCount;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) {
        // 踩踏：英雄落在敵人身上
        enemy.body.velocity.x = 0;
        enemy.body.enable = false;
        enemy.animations.play('die');
        enemy.events.onAnimationComplete.addOnce(function () {
            enemy.kill();
        });
        hero.body.velocity.y = -JUMP_SPEED / 2;
        this.sfx.stomp.play();
    } else {
        // 英雄死亡
        this._killHero();
    }
};

PlayState._onHeroVsKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.sfx.door.play();
    hero.body.velocity.x = 0;
    hero.body.velocity.y = 0;
    hero.body.enable = false;

    door.frame = 1; // 開門

    this.game.time.events.add(500, this._goToNextLevel, this);
};

// -----------------------------------------------------------------------------
// 死亡與關卡過渡
// -----------------------------------------------------------------------------

PlayState._killHero = function () {
    this.hero.alive = false;
    this.hero.body.velocity.y = -JUMP_SPEED / 2;
    this.hero.body.velocity.x = 0;
    this.hero.body.allowGravity = true;
    this.hero.body.collideWorldBounds = false;

    this.game.time.events.add(1000, function () {
        this.game.state.restart(true, false, { level: this.level });
    }, this);
};

PlayState._goToNextLevel = function () {
    this.camera.fade('#000');
    this.camera.onFadeComplete.addOnce(function () {
        this.game.state.restart(true, false, {
            level: this.level + 1
        });
    }, this);
};

// -----------------------------------------------------------------------------
// 動畫
// -----------------------------------------------------------------------------

PlayState._getAnimationName = function () {
    let name = 'stop';

    if (!this.hero.alive) {
        name = 'stop';
    } else if (this.hero.body.velocity.y < 0) {
        name = 'jump';
    } else if (this.hero.body.velocity.y > 0 && !this.hero.body.touching.down) {
        name = 'fall';
    } else if (this.hero.body.velocity.x !== 0 && this.hero.body.touching.down) {
        name = 'run';
    }

    return name;
};

// -----------------------------------------------------------------------------
// HUD
// -----------------------------------------------------------------------------

PlayState._createHud = function () {
    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    let coinIcon = this.game.make.image(
        this.keyIcon.width + 7, 0, 'icon:coin'
    );

    let scoreStyle = { font: '24px monospace', fill: '#fff' };
    this.coinFont = this.game.add.text(
        coinIcon.x + coinIcon.width + 7, 0, 'x0', scoreStyle
    );

    this.hud = this.game.add.group();
    this.hud.add(this.keyIcon);
    this.hud.add(coinIcon);
    this.hud.add(this.coinFont);
    this.hud.position.set(10, 10);
    this.hud.fixedToCamera = true;
};

// =============================================================================
// 入口點
// =============================================================================

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play', true, false, { level: 0 });
};
```

### 關鍵概念摘要 (Key Concepts Summary)

| 概念 | Phaser API | 目的 |
|---------|-----------|---------|
| 遊戲實例 | `new Phaser.Game(w, h, renderer, container)` | 建立遊戲畫布與引擎 |
| 遊戲狀態 | `game.state.add()` / `game.state.start()` | 將程式碼組織為 init/preload/create/update 生命週期 |
| 載入影像 | `game.load.image(key, path)` | 載入靜態影像資產 |
| 載入精靈表 | `game.load.spritesheet(key, path, fw, fh)` | 載入動畫精靈表 |
| 載入 JSON | `game.load.json(key, path)` | 載入 JSON 資料（關卡定義） |
| 載入音訊 | `game.load.audio(key, path)` | 載入音效 |
| 精靈群組 | `game.add.group()` | 相關精靈的容器；實現批次碰撞偵測 |
| 物理主體 | `game.physics.enable(sprite)` | 為精靈增加 Arcade Physics 主體 |
| 重力 | `game.physics.arcade.gravity.y` | 全域向下加速度 |
| 碰撞 | `arcade.collide(a, b)` | 物理碰撞解決（精靈互相推擠） |
| 重疊 | `arcade.overlap(a, b, callback)` | 無物理推擠的偵測（用於拾取物品） |
| 速度 | `sprite.body.velocity.x/y` | 以每秒像素為單位的移動速度 |
| 靜止 | `sprite.body.immovable = true` | 防止精靈被碰撞推動 |
| 動畫 | `sprite.animations.add(name, frames, fps, loop)` | 定義影格動畫 |
| 補間動畫 | `game.add.tween(target).to(props, duration, easing)` | 平滑的屬性動畫 |
| 鍵盤輸入 | `game.input.keyboard.addKeys({...})` | 捕捉特定的鍵盤按鍵 |
| 相機 | `this.camera.fade()` | 螢幕過渡效果 |
| 錨點 | `sprite.anchor.set(x, y)` | 設定定位與旋轉的原點 |
| 精靈翻轉 | `sprite.scale.x = -1` | 水平鏡像精靈 |
