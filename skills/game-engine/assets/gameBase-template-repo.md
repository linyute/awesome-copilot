# GameBase 範本存放庫 (GameBase Template Repository)

這是一個功能豐富且極具主見的 2D 遊戲專案入門範本，使用 **Haxe** 語言和 **Heaps** 遊戲引擎建構。由 *Dead Cells* 的主要開發者 **Sebastien Benard** (deepnight) 建立並維護。GameBase 提供了一個經過生產測試的基礎，包含實體管理、透過 LDtk 的關卡整合、轉譯管線以及遊戲迴圈架構 — 旨在讓開發者跳過樣板程式碼，直接進入遊戲特定的邏輯實作。

**存放庫：** [github.com/deepnight/gameBase](https://github.com/deepnight/gameBase)
**作者：** [Sebastien Benard / deepnight](https://deepnight.net)
**技術：** Haxe + Heaps（HashLink 或 JS 目標）
**關卡編輯器整合：** [LDtk](https://ldtk.io)

---

## 目的 (Purpose)

GameBase 的存在是為了接決「空白專案」問題。開發者無須從頭開始設定轉譯、實體系統、相機控制、偵錯重疊和關卡載入，而是直接複製此存放庫並立即開始實作遊戲特定的機制。它反映了從商業遊戲開發中淬煉出的模式，特別是來自 *Dead Cells* 的開發經驗。

關鍵優勢：
- 預建的實體系統，具備以網格為基礎的定位和次像素精確度
- LDtk 關卡編輯器整合，用於視覺化關卡設計
- 內建偵錯工具和重疊介面
- 與影格率無關且具備固定步長更新的遊戲迴圈
- 具有跟隨、震動、縮放和限制功能的相機系統
- 可設定的控制器/輸入管理
- 使用 Heaps 的可調整轉譯管線

---

## 存放庫結構 (Repository Structure)

```
gameBase/
  src/
    game/
      App.hx              -- 應用程式進入點與初始化
      Game.hx             -- 主要遊戲程序，持有關卡與實體
      Entity.hx           -- 基礎實體類別，具備網格座標、速度、動畫
      Level.hx            -- 關卡載入與來自 LDtk 的碰撞地圖
      Camera.hx           -- 相機跟隨、震動、縮放、限制
      Fx.hx               -- 視覺效果（粒子、閃光等）
      Types.hx            -- 列舉、型別定義與常數
      en/
        Hero.hx            -- 玩家實體（範實作）
        Mob.hx             -- 敵人實體（範實作）
    import.hx             -- 全域匯入（處處可用）
  res/
    atlas/                 -- 精靈圖集與紋理圖集
    levels/                -- LDtk 關卡專案檔案
    fonts/                 -- 點陣圖字型
  .ldtk                   -- LDtk 專案檔案（根目錄）
  build.hxml              -- Haxe 編譯器設定
  Makefile                -- 建置/執行捷徑
  README.md
```

---

## 關鍵檔案及其角色 (Key Files and Their Roles)

### `src/game/App.hx` -- 應用程式進入點

擴充 `dn.Process` 的主要應用程式類別。處理：
- 視窗/顯示初始化
- 場景管理（根場景圖）
- 全域輸入控制器設定
- 偵錯切換與主控台

```haxe
class App extends dn.Process {
  public static var ME : App;

  override function init() {
    ME = this;
    // 初始化轉譯、控制器、資產
    new Game();
  }
}
```

### `src/game/Game.hx` -- 遊戲程序

管理作用中的遊戲工作階段：
- 持有目前 `Level` 的參考
- 管理所有作用中的 `Entity` 執行個體（透過全域連結串列）
- 處理暫停、遊戲結束與重新啟動邏輯
- 協調相機與效果

```haxe
class Game extends dn.Process {
  public var level : Level;
  public var hero : en.Hero;
  public var fx : Fx;
  public var camera : Camera;

  public function new() {
    super(App.ME);
    level = new Level();
    fx = new Fx();
    camera = new Camera();
    hero = new en.Hero();
  }
}
```

### `src/game/Entity.hx` -- 基礎實體

核心實體類別，特色包含：
- **以網格為基礎的定位：** `cx`、`cy`（整數儲存格座標）加上 `xr`、`yr`（儲存格內比率 0.0 到 1.0）以實現平滑的次像素移動
- **速度與摩擦力：** `dx`、`dy`（速度）以及可設定的 `frictX`、`frictY`
- **重力：** 每個實體可選用的重力
- **精靈管理：** 透過 Heaps `h2d.Anim` 或 `dn.heaps.HSprite` 管理動畫精靈
- **生命週期：** `update()`、`fixedUpdate()`、`postUpdate()`、`dispose()`
- **碰撞輔助程式：** 針對關卡碰撞地圖的 `hasCollision(cx, cy)` 檢查

```haxe
class Entity {
  // 網格位置
  public var cx : Int = 0;   // 儲存格 X
  public var cy : Int = 0;   // 儲存格 Y
  public var xr : Float = 0.5; // 儲存格內 X 比率 (0..1)
  public var yr : Float = 1.0; // 儲存格內 Y 比率 (0..1)

  // 速度
  public var dx : Float = 0;
  public var dy : Float = 0;

  // 像素位置（計算得出）
  public var attachX(get,never) : Float;
  inline function get_attachX() return (cx + xr) * Const.GRID;
  public var attachY(get,never) : Float;
  inline function get_attachY() return (cy + yr) * Const.GRID;

  // 物理步長
  public function fixedUpdate() {
    xr += dx;
    dx *= frictX;

    // X 碰撞
    if (xr > 1) { cx++; xr--; }
    if (xr < 0) { cx--; xr++; }

    yr += dy;
    dy *= frictY;

    // Y 碰撞
    if (yr > 1) { cy++; yr--; }
    if (yr < 0) { cy--; xr++; }
  }
}
```

### `src/game/Level.hx` -- 關卡管理

載入並管理來自 LDtk 專案檔案的關卡資料：
- 解析圖塊層、實體層與整數網格 (IntGrid) 層
- 建置碰撞網格 (`hasCollision(cx, cy)`)
- 提供查詢關卡結構的輔助方法

```haxe
class Level {
  var data : ldtk.Level;
  var collisions : Map<Int, Bool>;

  public function new(ldtkLevel) {
    data = ldtkLevel;
    // 解析整數網格層以獲取碰撞標記
    for (cy in 0...data.l_Collisions.cHei)
      for (cx in 0...data.l_Collisions.cWid)
        if (data.l_Collisions.getInt(cx, cy) == 1)
          collisions.set(coordId(cx, cy), true);
  }

  public inline function hasCollision(cx:Int, cy:Int) : Bool {
    return collisions.exists(coordId(cx, cy));
  }
}
```

### `src/game/Camera.hx` -- 相機系統

提供：
- **目標追蹤：** 具備可設定死區且平滑地跟隨實體
- **震動：** 具備衰減效果的螢幕震動
- **縮放：** 動態放大/縮小
- **限制：** 保持相機在關卡邊界內

### `src/game/Fx.hx` -- 效果系統

粒子與視覺效果管理：
- 粒子集區 (Particle pools)
- 螢幕閃爍
- 慢動作輔助程式
- 顏色重疊效果

---

## 技術堆疊 (Technology Stack)

### Haxe

一種跨平台的高階程式語言，可編譯成多種目標：
- **HashLink (HL)：** 用於桌面端的原生位元組碼 VM（主要開發目標）
- **JavaScript (JS)：** 瀏覽器/網頁目標
- **C/C++：** 透過 HXCPP 進行原生建置

### Heaps (Heaps.io)

一個高效能、跨平台的 2D/3D 遊戲引擎：
- 透過 OpenGL/DirectX/WebGL 進行 GPU 加速轉譯
- 採用 `h2d.Object` 層級結構的場景圖架構
- 精靈批次處理與紋理圖集
- 點陣圖字型轉譯
- 輸入抽象化

### LDtk

由 Sebastien Benard 建立的現代開源 2D 關卡編輯器：
- 視覺化的圖塊式關卡設計
- 用於碰撞與中繼資料的整數網格層
- 用於放置遊戲物件的實體層
- 自動貼圖規則
- 從專案檔案自動產生的 Haxe API

---

## 設定說明 (Setup Instructions)

### 先決條件

1. **安裝 Haxe** (4.0+)：[haxe.org](https://haxe.org/download/)
2. **安裝 HashLink**（用於桌面目標）：[hashlink.haxe.org](https://hashlink.haxe.org/)
3. **安裝 LDtk**（用於關卡編輯）：[ldtk.io](https://ldtk.io/)

### 開始使用

```bash
# 複製存放庫
git clone https://github.com/deepnight/gameBase.git my-game
cd my-game

# 安裝 Haxe 相依項目
haxelib install heaps
haxelib install deepnightLibs
haxelib install ldtk-haxe-api

# 建置並執行（HashLink 目標）
haxe build.hxml
hl bin/client.hl

# 或使用 Makefile（如果可用）
make run
```

### 作為起點使用

1. **複製或使用範本** — 不要分支 (fork)；將其複製到具有您遊戲名稱的新目錄中。
2. **重新命名套件 (Package)** — 更新 `src/game/` 套件宣告與專案參考，以符合您的遊戲名稱。
3. **編輯 `build.hxml`** — 視需要調整主要類別、輸出路徑與目標。
4. **在 LDtk 中設計關卡** — 開啟 `.ldtk` 檔案，定義您的圖層與實體，然後匯出。
5. **實作實體** — 在 `src/game/en/` 中建立擴充 `Entity` 的新實體類別。
6. **迭代** — 使用偵錯主控台（遊戲中切換）進行即時檢查與調校。

---

## 建置目標 (Build Targets)

| 目標 | 指令 | 輸出 | 使用案例 |
|--------|---------|--------|----------|
| HashLink | `haxe build.hxml` | `bin/client.hl` | 開發、桌面版發行 |
| JavaScript | `haxe build.js.hxml` | `bin/client.js` | 網頁/瀏覽器建置 |
| DirectX/OpenGL | 透過 HL 原生 | 原生執行檔 | 生產環境桌面版發行 |

---

## 偵錯功能 (Debug Features)

GameBase 內建了偵錯工具：
- **偵錯重疊：** 按鍵切換顯示實體邊界、網格、速度、碰撞地圖
- **主控台：** 遊戲內指令主控台，用於切換旗標、傳送、產生實體
- **FPS 計數器：** 可見的影格率與更新率監控器
- **程序檢查器：** 檢視作用中的程序及其層級結構

---

## 遊戲迴圈架構 (Game Loop Architecture)

GameBase 使用固定時間步長的遊戲迴圈模式：

```
每影格：
  1. preUpdate()    -- 輸入輪詢，影格前邏輯
  2. fixedUpdate()  -- 物理、移動、碰撞（固定時間步長）
     - 可能每影格執行 0-N 次以追上進度
  3. update()       -- 一般的每影格邏輯
  4. postUpdate()   -- 精靈位置同步、相機更新、轉譯準備
```

這可確保物理行為無論影格率如何都保持一致，同時轉譯與視覺更新保持流暢。

---

## 實體生命週期 (Entity Lifecycle)

```
建構函式  -->  init()  -->  [遊戲迴圈：fixedUpdate/update/postUpdate]  -->  dispose()
```

- **建構函式：** 設定初始位置、建立精靈、在全域實體清單中註冊
- **fixedUpdate()：** 物理步長（速度、摩擦力、重力、碰撞）
- **update()：** AI、狀態機、動畫觸發器
- **postUpdate()：** 將精靈位置同步至網格座標，套用視覺效果
- **dispose()：** 從實體清單中移除，銷毀精靈，清理參考
