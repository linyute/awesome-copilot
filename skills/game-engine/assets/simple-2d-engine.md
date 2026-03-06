# 簡單 2D 平台跳躍引擎範本 (Simple 2D Platformer Engine Template)

這是一個由 *Dead Cells* 的主要開發者 **Sebastien Benard** (deepnight) 編寫的以網格為基礎的 2D 平台跳躍引擎教學。本範本涵蓋了高效能平台跳躍遊戲的基礎架構：一個結合整數網格儲存格與次像素精確度的雙座標定位系統、速度與摩擦力機制、重力，以及穩健的碰撞偵測與反應系統。此方法與語言無關，但範例使用 Haxe。

**來源參考：**
- [第 1 部分 - 基礎](https://deepnight.net/tutorial/a-simple-platformer-engine-part-1-basics/)
- [第 2 部分 - 碰撞](https://deepnight.net/tutorial/a-simple-platformer-engine-part-2-collisions/)

**作者：** [Sebastien Benard / deepnight](https://deepnight.net)

---

## 引擎架構總覽 (Engine Architecture Overview)

該引擎圍繞一個網格化世界建構，其中每個儲存格都有固定的像素大小（例如 16x16）。實體使用 **雙座標系統** 存在於此網格中：整數儲存格座標用於粗略定位，而浮點數比率用於每個儲存格內的次像素精確度。這種設計能夠針對網格實現像素級精確的碰撞偵測，同時保持平滑、流暢的移動。

### 核心原則 (Core Principles)

1. **網格即真相：** 世界是一個 2D 儲存格網格。碰撞資料存在於網格中。
2. **實體跨越儲存格：** 實體的位置由其佔用的儲存格 (`cx`, `cy`) 加上其進入該儲存格的程度 (`xr`, `yr`) 定義。
3. **速度以網格比率為單位：** 移動增量 (`dx`, `dy`) 代表每步佔儲存格的分數，而非原始像素。
4. **碰撞即網格查詢：** 引擎不測試精靈邊界與幾何圖形，而是檢查實體即將進入的網格儲存格。

---

## 第 1 部分：基礎 (Part 1: Basics)

### 網格 (The Grid)

關卡是一個 2D 陣列，其中每個儲存格或是空白或是實心。一個常數定義了儲存格的像素大小：

```haxe
static inline var GRID = 16;
```

碰撞資料儲存為簡單的 2D 布林或整數對照圖：

```haxe
// 檢查網格儲存格是否為實心
function hasCollision(cx:Int, cy:Int):Bool {
  // 在關卡資料中查詢儲存格值
  return level.getCollision(cx, cy) != 0;
}
```

### 實體定位：雙座標 (Entity Positioning: Dual Coordinates)

每個實體使用四個值追蹤其位置：

| 變數 | 型別 | 說明 |
|----------|------|-------------|
| `cx` | Int | 儲存格 X 座標（實體在哪一欄） |
| `cy` | Int | 儲存格 Y 座標（實體在哪一列） |
| `xr` | Float | 儲存格內的 X 比率，範圍 0.0 到 1.0 |
| `yr` | Float | 儲存格內的 Y 比率，範圍 0.0 到 1.0 |

位於 `cx=5, cy=3, xr=0.5, yr=1.0` 的實體在儲存格 (5,3) 的水平中心，且正坐在底邊。

### 轉換為像素座標 (Converting to Pixel Coordinates)

若要轉譯實體，請將網格座標轉換為像素位置：

```haxe
// 用於轉譯的像素位置
var pixelX : Float = (cx + xr) * GRID;
var pixelY : Float = (cy + yr) * GRID;
```

即使碰撞系統在離散的網格儲存格上運作，這仍能產生平滑、次像素精確的轉譯位置。

### 速度與移動 (Velocity and Movement)

速度以 **每固定步長的儲存格比率單位** 表示（而非每影格像素）：

```haxe
var dx : Float = 0; // 水平速度（每步儲存格數）
var dy : Float = 0; // 垂直速度（每步儲存格數）
```

每次固定步長更新時，速度都會增加到比率中：

```haxe
// 套用水平移動
xr += dx;

// 套用垂直移動
yr += dy;
```

### 儲存格溢位 (Cell Overflow)

當比率超出 0..1 範圍時，實體已移動到相鄰的儲存格：

```haxe
// X 溢位
while (xr > 1) { xr--; cx++; }
while (xr < 0) { xr++; cx--; }

// Y 溢位
while (yr > 1) { yr--; cy++; }
while (yr < 0) { yr++; cy--; }
```

### 摩擦力 (Friction)

摩擦力作為每步的乘數套用，使速度衰減至零：

```haxe
var frictX : Float = 0.82; // 水平摩擦力（0 = 立即停止，1 = 無摩擦）
var frictY : Float = 0.82; // 垂直摩擦力

// 每步移動後套用
dx *= frictX;
dy *= frictY;

// 將極小值歸零
if (Math.abs(dx) < 0.0005) dx = 0;
if (Math.abs(dy) < 0.0005) dy = 0;
```

典型的摩擦力值：
- `0.82` — 標準地面摩擦力（反應靈敏，快速停止）
- `0.94` — 冰面或光滑表面（緩慢減速）
- `0.96` — 空氣阻力（非常緩慢的水平減速）

### 重力 (Gravity)

重力是每步增加到 `dy` 的常數：

```haxe
static inline var GRAVITY = 0.05; // 單位為每 step^2 的儲存格比率

// 在 fixedUpdate 中：
dy += GRAVITY;
```

由於 `dy` 會累積並套用摩擦力，實體會達到一個自然的終端速度。

### 轉譯 / 精靈同步 (Rendering / Sprite Sync)

在物理步驟之後，精靈被放置在計算出的像素位置：

```haxe
// 在物理計算完成後的 postUpdate 中：
sprite.x = (cx + xr) * GRID;
sprite.y = (cy + yr) * GRID;
```

對於平台跳躍遊戲角色，錨點通常位於精靈的底部中心。透過代表當前儲存格底部的 `yr = 1.0`，精靈的腳部會與地板對齊。

### 基礎實體範本 (Basic Entity Template)

```haxe
class Entity {
  // 網格座標
  var cx : Int = 0;
  var cy : Int = 0;
  var xr : Float = 0.5;
  var yr : Float = 1.0;

  // 速度
  var dx : Float = 0;
  var dy : Float = 0;

  // 摩擦力
  var frictX : Float = 0.82;
  var frictY : Float = 0.82;

  // 重力
  static inline var GRAVITY = 0.05;

  // 網格大小
  static inline var GRID = 16;

  // 像素位置（計算得出）
  public var attachX(get, never) : Float;
  inline function get_attachX() return (cx + xr) * GRID;

  public var attachY(get, never) : Float;
  inline function get_attachY() return (cy + yr) * GRID;

  public function fixedUpdate() {
    // 重力
    dy += GRAVITY;

    // 套用速度
    xr += dx;
    yr += dy;

    // 套用摩擦力
    dx *= frictX;
    dy *= frictY;

    // 歸零微小值
    if (Math.abs(dx) < 0.0005) dx = 0;
    if (Math.abs(dy) < 0.0005) dy = 0;

    // 儲存格溢位
    while (xr > 1) { xr--; cx++; }
    while (xr < 0) { xr++; cx--; }
    while (yr > 1) { yr--; cy++; }
    while (yr < 0) { yr++; cy--; }
  }

  public function postUpdate() {
    sprite.x = attachX;
    sprite.y = attachY;
  }
}
```

---

## 第 2 部分：碰撞 (Part 2: Collisions)

### 碰撞哲學 (Collision Philosophy)

該引擎直接檢查網格儲存格，而不是使用邊界框對邊界框的碰撞偵測（這在處理斜坡、單向平台和邊緣情況時會變得複雜）。由於實體的位置已經以網格術語表示，碰撞偵測就變成了一系列簡單的整數查詢。

### 核心想法 (The Core Idea)

在允許實體進入相鄰儲存格之前，先檢查該儲存格是否為實心。如果是，則限制實體的比率並將該軸向的速度歸零。

### 軸向分離 (Axis Separation)

碰撞是 **按軸** 處理的 — 先 X 後 Y（或反之亦然）。這簡化了邏輯並避開了角落情況的穿透問題。

### X 軸碰撞 (X-Axis Collision)

在將 `dx` 套用到 `xr` 後，執行儲存格溢位步驟前，檢查碰撞：

```haxe
// 套用 X 移動
xr += dx;

// 檢查右側碰撞
if (dx > 0 && hasCollision(cx + 1, cy) && xr >= 0.7) {
  xr = 0.7;   // 限制：在進入實心儲存格前停止
  dx = 0;     // 消除水平速度
}

// 檢查左側碰撞
if (dx < 0 && hasCollision(cx - 1, cy) && xr <= 0.3) {
  xr = 0.3;   // 限制：在進入實心儲存格前停止
  dx = 0;     // 消除水平速度
}

// 儲存格溢位（碰撞檢查後）
while (xr > 1) { xr--; cx++; }
while (xr < 0) { xr++; cx--; }
```

**為什麼是 0.7 和 0.3？** 這些閾值代表實體在儲存格內的碰撞半徑。一個位於 `xr = 0.5` 且半寬為 0.3 個儲存格的實體，會在右側 `xr = 0.7` 和左側 `xr = 0.3` 處發生碰撞。請根據實體寬度調整這些值。

### Y 軸碰撞 (Y-Axis Collision)

類似地，在將 `dy` 套用到 `yr` 後：

```haxe
// 套用 Y 移動
yr += dy;

// 檢查下方碰撞（地板）
if (dy > 0 && hasCollision(cx, cy + 1) && yr >= 1.0) {
  yr = 1.0;   // 限制：降落在實心儲存格上方
  dy = 0;     // 消除垂直速度
}

// 檢查上方碰撞（天花板）
if (dy < 0 && hasCollision(cx, cy - 1) && yr <= 0.3) {
  yr = 0.3;   // 限制：在進入天花板儲存格前停止
  dy = 0;     // 消除垂直速度
}

// 儲存格溢位
while (yr > 1) { yr--; cy++; }
while (yr < 0) { yr++; cy--; }
```

對於地板碰撞，`yr = 1.0` 代表實體正好位於其當前儲存格的底邊，這也是其下方儲存格的頂邊。這是自然的「站在地面上」位置。

### 觸地偵測 (On-Ground Detection)

若要判斷實體是否正站在實體地面上（用於跳躍邏輯、動畫等）：

```haxe
function isOnGround() : Bool {
  return hasCollision(cx, cy + 1) && yr >= 0.98;
}
```

使用 `0.98` 而非 `1.0` 作為閾值是為了容許微小的浮點數精確度誤差。

### 具備碰撞功能的完整實體 (Complete Entity with Collisions)

```haxe
class Entity {
  var cx : Int = 0;
  var cy : Int = 0;
  var xr : Float = 0.5;
  var yr : Float = 1.0;
  var dx : Float = 0;
  var dy : Float = 0;
  var frictX : Float = 0.82;
  var frictY : Float = 0.82;

  static inline var GRID = 16;
  static inline var GRAVITY = 0.05;

  // 碰撞半徑（以儲存格比率單位表示的半寬）
  var collRadius : Float = 0.3;

  function hasCollision(testCx:Int, testCy:Int):Bool {
    return level.isCollision(testCx, testCy);
  }

  function isOnGround():Bool {
    return hasCollision(cx, cy + 1) && yr >= 0.98;
  }

  public function fixedUpdate() {
    // --- 重力 ---
    dy += GRAVITY;

    // --- X 軸 ---
    xr += dx;

    // 右側碰撞
    if (dx > 0 && hasCollision(cx + 1, cy) && xr >= 1.0 - collRadius) {
      xr = 1.0 - collRadius;
      dx = 0;
    }

    // 左側碰撞
    if (dx < 0 && hasCollision(cx - 1, cy) && xr <= collRadius) {
      xr = collRadius;
      dx = 0;
    }

    // X 儲存格溢位
    while (xr > 1) { xr--; cx++; }
    while (xr < 0) { xr++; cx--; }

    // --- Y 軸 ---
    yr += dy;

    // 地板碰撞
    if (dy > 0 && hasCollision(cx, cy + 1) && yr >= 1.0) {
      yr = 1.0;
      dy = 0;
    }

    // 天花板碰撞
    if (dy < 0 && hasCollision(cx, cy - 1) && yr <= collRadius) {
      yr = collRadius;
      dy = 0;
    }

    // Y 儲存格溢位
    while (yr > 1) { yr--; cy++; }
    while (yr < 0) { yr++; cy--; }

    // --- 摩擦力 ---
    dx *= frictX;
    dy *= frictY;

    if (Math.abs(dx) < 0.0005) dx = 0;
    if (Math.abs(dy) < 0.0005) dy = 0;
  }

  public function postUpdate() {
    sprite.x = (cx + xr) * GRID;
    sprite.y = (cy + yr) * GRID;
  }
}
```

---

## 碰撞邊緣情況與解決方案 (Collision Edge Cases and Solutions)

### 對角線移動 / 角落裁剪 (Diagonal Movement / Corner Clipping)

因為碰撞是按軸順序檢查的，對角線移動進入角落的實體會自然地先針對一個軸進行解決。這可以防止實體卡在角落，並消除了對複雜對角線碰撞邏輯的需求。

### 高速穿透 (High-Speed Tunneling)

如果 `dx` 或 `dy` 大到足以在一個步驟中跳過整個儲存格，實體可能會「穿透」牆壁。解決方案：

1. **限制速度：** 將 `dx` 和 `dy` 限制在最大 0.5（每步半個儲存格）
2. **細分步驟：** 如果速度超過閾值，則以較小的增量執行碰撞檢查
3. **網格射線步進 (Ray-marching the grid)：** 檢查移動路徑上的每個儲存格

```haxe
// 簡單的速度限制
if (dx > 0.5) dx = 0.5;
if (dx < -0.5) dx = -0.5;
if (dy > 0.5) dy = 0.5;
if (dy < -0.5) dy = -0.5;
```

### 單向平台 (One-Way Platforms)

實體可以從下方跳過，但可以從上方降落的平台：

```haxe
// 在 Y 碰撞中，檢查單向平台
if (dy > 0 && isOneWayPlatform(cx, cy + 1) && yr >= 1.0 && prevYr < 1.0) {
  yr = 1.0;
  dy = 0;
}
```

關鍵：僅在實體向下移動 (`dy > 0`) 且先前位於平台上方 (`prevYr < 1.0`) 時才發生碰撞。

### 斜坡 (Slopes)

對於基本的斜坡支援，不使用二進位碰撞檢查，而是查詢儲存格內實體 x 位置處的斜坡高度：

```haxe
// 斜坡碰撞虛擬程式碼
var slopeHeight = getSlopeHeight(cx, cy + 1, xr);
if (yr >= slopeHeight) {
  yr = slopeHeight;
  dy = 0;
}
```

---

## 跳躍 (Jumping)

跳躍僅是一個負向的 `dy` 衝量：

```haxe
function jump() {
  if (isOnGround()) {
    dy = -0.5; // 跳躍衝量（以儲存格比率為單位）
  }
}
```

重力自然會使上升運動減速，產生拋物線弧度。若要允許變動高度跳躍（按住按鈕越久 = 跳得越高）：

```haxe
// 放開跳躍按鈕時，減少上升速度
function onJumpRelease() {
  if (dy < 0) {
    dy *= 0.5; // 削減剩餘的上升速度
  }
}
```

---

## 座標系統示意圖 (Coordinate System Diagram)

```
  儲存格 (cx, cy)           下一個儲存格 (cx+1, cy)
  +-------------------+   +-------------------+
  |                   |   |                   |
  |  xr=0.0    xr=1.0 --> |  xr=0.0           |
  |                   |   |                   |
  |         *         |   |                   |
  |     (xr=0.5,      |   |                   |
  |      yr=0.5)      |   |                   |
  |                   |   |                   |
  +-------------------+   +-------------------+
  yr=0.0      yr=1.0 = 下方儲存格頂端

  像素位置 = (cx + xr) * GRID, (cy + yr) * GRID
```

---

## 更新順序摘要 (Update Order Summary)

```
fixedUpdate()：
  1. 套用重力          dy += GRAVITY
  2. 套用 X 速度       xr += dx
  3. 檢查 X 碰撞       限制 xr，若碰撞則將 dx 歸零
  4. 處理 X 儲存格溢位 cx/xr 標準化
  5. 套用 Y 速度       yr += dy
  6. 檢查 Y 碰撞       限制 yr，若碰撞則將 dy 歸零
  7. 處理 Y 儲存格溢位 cy/yr 標準化
  8. 套用摩擦力         dx *= frictX, dy *= frictY
  9. 歸零微小值         閾值檢查

postUpdate()：
  1. 同步精靈位置       sprite.x/y = 像素座標
  2. 更新動畫           根據狀態/速度
  3. 相機跟隨           追蹤實體
```

---

## 設計優勢 (Design Advantages)

| 特色 | 優點 |
|---------|---------|
| 以網格為基礎的碰撞 | 每次檢查的時間複雜度為 O(1)，無須寬相 (broad-phase) 偵測 |
| 雙座標系統 | 具備整數碰撞功能的次像素平滑轉譯 |
| 按軸碰撞 | 邏輯簡單，自然處理角落情況 |
| 以比率為基礎的速度 | 與解析度無關的移動 |
| 摩擦力乘數 | 依表面類型調整手感 |
| 儲存格溢位 while 迴圈 | 安全處理跨儲存格移動 |
