# 遊戲引擎核心設計原則 (Game Engine Core Design Principles)

這是一份關於建構遊戲引擎之基礎架構與設計原則的綜合參考指南。涵蓋了模組化、關注點分離、核心子系統以及實作指引。

來源：https://www.gamedev.net/articles/programming/general-and-gameplay-programming/making-a-game-engine-core-design-principles-r3210/

---

## 為什麼要建構遊戲引擎 (Why Build a Game Engine)

遊戲引擎是一個可重用的軟體框架，它抽象化了建構遊戲所需的通用系統。與其為每個專案重新編寫轉譯、物理、輸入和音訊程式碼，設計良好的引擎會將這些功能提供為模組化、可設定的子系統。

關鍵動機：
- **可重用性** — 在多個遊戲專案中使用相同的程式碼庫。
- **引擎程式碼與遊戲程式碼分離** — 引擎開發者與遊戲設計者可以獨立工作。
- **可維護性** — 結構良好的程式碼更容易偵錯、擴充與最佳化。
- **延展性** — 無須重寫現有系統即可增加新功能或支援新平台。

---

## 核心設計原則 (Core Design Principles)

### 模組化 (Modularity)

引擎中的每個主要系統都應該是一個具備明確介面的獨立模組。模組之間應透過乾淨的 API 通訊，而非直接存取彼此的內部。

**為什麼這很重要：**
- 可在不影響其他系統的情況下更換實作（例如：將 OpenGL 轉譯器替換為 Vulkan）。
- 可單獨測試各個系統。
- 允許團隊同時開發不同的模組。

**範例結構：**

```
engine/
  core/           -- 記憶體、日誌、數學、公用程式
  platform/       -- 作業系統抽象化、視窗化、檔案 I/O
  renderer/       -- 圖形 API、著色器、材質
  physics/        -- 碰撞、剛體動力學
  audio/          -- 聲音播放、混音、空間音訊
  input/          -- 鍵盤、滑鼠、遊戲手把、觸控
  scripting/      -- 指令碼語言繫結
  scene/          -- 場景圖、實體管理
  resources/      -- 資產載入、快取、串流
```

### 關注點分離 (Separation of Concerns)

每個系統都應該有單一且定義明確的職責。避免將轉譯邏輯與物理混合，或將輸入處理與遊戲狀態管理混合。

**實務指南：**
- 轉譯器不應了解遊戲機制。
- 物理引擎不應了解實體是如何轉譯的。
- 輸入處理應將原始裝置事件轉換為遊戲程式碼可以使用的抽象動作。
- 遊戲邏輯層位於引擎之上，使用引擎服務而不修改它們。

### 以資料為基礎的設計 (Data-Driven Design)

盡可能地透過資料而非硬編碼的邏輯來控制行為。這允許設計師和美術人員在不重新編譯程式碼的情況下修改遊戲行為。

**以資料為基礎之方法的範例：**
- 關卡佈局定義在資料檔案（JSON、XML、二進位）而非程式碼中。
- 實體屬性與行為透過組件資料進行設定。
- 著色器參數公開為可在工具中編輯的材質屬性。
- 動畫狀態機定義在設定檔中，而非指令式程式碼。

### 最小化相依性 (Minimize Dependencies)

每個模組應盡可能少地依賴其他模組。相依性圖應是一個乾淨的層級結構，而非交錯的網。

```
遊戲程式碼
    |
    v
引擎高階系統 (場景、實體、指令碼)
    |
    v
引擎低階系統 (轉譯器、物理、音訊、輸入)
    |
    v
引擎核心 (記憶體、數學、日誌、平台抽象化)
    |
    v
作業系統 / 硬體
```

模組之間的循環相依性是架構不佳的跡象，應予以消除。

---

## 實體元件系統 (ECS) 模式 (The Entity-Component-System (ECS) Pattern)

ECS 是一種在現代遊戲引擎中廣泛採用的架構模式，它偏好組合 (composition) 而非繼承 (inheritance)。

### 核心概念 (Core Concepts)

- **實體 (Entity)** — 一個唯一的識別碼（通常只是一個整數 ID），代表一個遊戲物件。實體本身沒有行為或資料。
- **元件 (Component)** — 附加到實體的純資料容器。每種元件型別儲存實體狀態的一個面向（位置、速度、精靈、生命值等）。
- **系統 (System)** — 處理所有具有特定元件組合之實體的函式或物件。系統包含邏輯；元件包含資料。

### 為什麼選擇 ECS 而非繼承 (Why ECS Over Inheritance)

傳統的物件導向繼承會建立僵化且深層的階層結構：

```
GameObject
  -> MovableObject
    -> Character
      -> Player
      -> Enemy
        -> FlyingEnemy
        -> GroundEnemy
```

這種方法的問題：
- 增加一個結合多個分支特徵的新實體型別需要重構階層結構或使用多重繼承。
- 深層階層結構很脆弱；基類別的變更會波及所有後代。
- 類別會隨著時間累積未使用的行為。

ECS 透過組合解決了這些問題：

```javascript
// 實體只是一個 ID
const player = world.createEntity();

// 附加元件來定義它是什麼
world.addComponent(player, new Position(100, 200));
world.addComponent(player, new Velocity(0, 0));
world.addComponent(player, new Sprite("player.png"));
world.addComponent(player, new Health(100));
world.addComponent(player, new PlayerInput());

// 「飛行敵人」只是不同的元件組合
const flyingEnemy = world.createEntity();
world.addComponent(flyingEnemy, new Position(400, 50));
world.addComponent(flyingEnemy, new Velocity(0, 0));
world.addComponent(flyingEnemy, new Sprite("bat.png"));
world.addComponent(flyingEnemy, new Health(30));
world.addComponent(flyingEnemy, new AIBehavior("patrol_fly"));
world.addComponent(flyingEnemy, new Flying());
```

### 系統處理元件 (Systems Process Components)

```javascript
// 移動系統：處理所有具有 Position + Velocity 的實體
function movementSystem(world, deltaTime) {
  for (const [entity, pos, vel] of world.query(Position, Velocity)) {
    pos.x += vel.x * deltaTime;
    pos.y += vel.y * deltaTime;
  }
}

// 轉譯系統：處理所有具有 Position + Sprite 的實體
function renderSystem(world, context) {
  for (const [entity, pos, sprite] of world.query(Position, Sprite)) {
    context.drawImage(sprite.image, pos.x, pos.y);
  }
}

// 重力系統：僅影響具有 Velocity 但沒有 Flying 的實體
function gravitySystem(world, deltaTime) {
  for (const [entity, vel] of world.query(Velocity).without(Flying)) {
    vel.y += 9.8 * deltaTime;
  }
}
```

### ECS 的優點 (Benefits of ECS)

- **靈活的組合** — 透過混合元件建立任何實體型別，無須修改程式碼。
- **快取友善的資料佈局** — 在記憶體中連續儲存元件可提高 CPU 快取效能。
- **平行處理** — 在不同元件組合上運作的系統可以平行執行。
- **易於序列化** — 元件是純資料，使儲存/載入變得簡單直覺。

---

## 核心引擎子系統 (Core Engine Subsystems)

### 記憶體管理 (Memory Management)

自訂記憶體管理對於遊戲引擎效能至關重要。預設的分配器 (malloc/new) 是通用的，未針對遊戲工作負載進行最佳化。

**常用的分配策略：**

- **堆疊分配器 (Stack Allocator)** — 針對暫時性的、以影格為範圍的資料進行快速 LIFO 分配。在每影格結束時重設堆疊指標。
- **集區分配器 (Pool Allocator)** — 針對相同型別的物件（實體、元件、粒子）進行固定大小的區塊分配。零碎片化。
- **影格分配器 (Frame Allocator)** — 每影格重設一次的線性分配器。非常適合每影格的暫時性資料。
- **雙緩衝分配器 (Double-Buffered Allocator)** — 兩個影格分配器每影格交替使用，允許前一影格的資料持久存在。

```cpp
// 概念性的影格分配器
class FrameAllocator {
    char* buffer;
    size_t offset;
    size_t capacity;

public:
    void* allocate(size_t size) {
        void* ptr = buffer + offset;
        offset += size;
        return ptr;
    }

    void reset() {
        offset = 0;  // 所有分配立即釋放
    }
};
```

### 資源管理 (Resource Management)

資源管理器負責處理遊戲資產的載入、快取與生命週期管理。

**關鍵職責：**
- **非同步載入** — 在背景執行緒中載入資產，以避免阻塞遊戲迴圈。
- **引用計數** — 追蹤有多少系統正在使用某項資產；當不再被引用時將其卸載。
- **快取** — 將最近使用的資產保留在記憶體中，以避免重複的磁碟讀取。
- **熱重載 (Hot reloading)** — 偵測磁碟上的資產變更，並在開發期間於執行時重新載入。
- **資源控制代碼 (Resource handles)** — 使用控制代碼（ID 或智慧指標）而非原始指標來引用資產。

```javascript
class ResourceManager {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  async load(path) {
    // 若快取中有資產則傳回
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    // 避免重複載入
    if (this.loading.has(path)) {
      return this.loading.get(path);
    }

    // 開始非同步載入
    const promise = this._loadFromDisk(path).then(resource => {
      this.cache.set(path, resource);
      this.loading.delete(path);
      return resource;
    });

    this.loading.set(path, promise);
    return promise;
  }

  unload(path) {
    this.cache.delete(path);
  }
}
```

### 轉譯管線 (Rendering Pipeline)

轉譯子系統將遊戲的視覺狀態轉換為螢幕上的像素。

**典型的轉譯管線階段：**

1. **場景遍歷** — 走訪場景圖或查詢 ECS 以獲取可轉譯的實體。
2. **平截面剔除 (Frustum culling)** — 捨棄位於相機視野外的物件。
3. **遮擋剔除 (Occlusion culling)** — 捨棄被其他幾何圖形遮擋的物件。
4. **排序** — 根據材質、深度或透明度需求對物件進行排序。
5. **批次處理 (Batching)** — 將具有相同材質的物件分組，以最小化繪圖呼叫與狀態變更。
6. **頂點處理** — 將頂點從模型空間轉換為螢幕空間（頂點著色器）。
7. **點陣化** — 將三角形轉換為片段（像素）。
8. **片段處理** — 使用光照、紋理和效果計算最終像素顏色（片段著色器）。
9. **後製處理** — 套用螢幕空間效果，如綻光 (bloom)、色調對應 (tone mapping) 和反鋸齒 (anti-aliasing)。

**轉譯指令模式：**

與其直接發出繪圖呼叫，不如建立一份轉譯指令列表，在提交前對其進行排序與批次處理：

```javascript
class RenderCommand {
  constructor(mesh, material, transform, sortKey) {
    this.mesh = mesh;
    this.material = material;
    this.transform = transform;
    this.sortKey = sortKey;
  }
}

class Renderer {
  constructor() {
    this.commandQueue = [];
  }

  submit(command) {
    this.commandQueue.push(command);
  }

  flush(context) {
    // 按材質排序以最小化狀態變更
    this.commandQueue.sort((a, b) => a.sortKey - b.sortKey);

    for (const cmd of this.commandQueue) {
      this._bindMaterial(cmd.material);
      this._setTransform(cmd.transform);
      this._drawMesh(cmd.mesh, context);
    }

    this.commandQueue.length = 0;
  }
}
```

### 物理整合 (Physics Integration)

物理子系統模擬物理行為並偵測碰撞。

**關鍵設計考量：**

- **固定時間步長** — 物理更新應以固定頻率執行（例如 50 Hz），與轉譯影格率無關。這可確保具決定性的模擬行為。
- **碰撞階段** — 使用寬相（空間分割、邊界體積階層）快速排除非碰撞對，接著進行窄相以進行精確的交集測試。
- **物理世界分離** — 物理世界應維護其自身的物件表示（物理主體），並與遊戲實體分開。同步步驟會在它們之間進行對應。

```javascript
class PhysicsWorld {
  constructor(fixedTimestep = 1 / 50) {
    this.fixedTimestep = fixedTimestep;
    this.accumulator = 0;
    this.bodies = [];
  }

  update(deltaTime) {
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimestep) {
      this.step(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
    }
  }

  step(dt) {
    // 整合速度
    for (const body of this.bodies) {
      body.velocity.y += body.gravity * dt;
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
    }

    // 偵測並解決碰撞
    this.broadPhase();
    this.narrowPhase();
    this.resolveCollisions();
  }
}
```

### 輸入系統 (Input System)

輸入系統將原始硬體事件轉換為具備遊戲意義的動作。

**分層設計：**

1. **硬體層** — 接收來自作業系統的原始事件（按鍵按下、滑鼠移動、按鈕點擊）。
2. **對應層** — 透過可設定的繫結將原始輸入轉換為具名動作（例如：「空格鍵」對應到「跳躍」，「W」對應到「前進」）。
3. **動作層** — 公開供遊戲程式碼查詢的抽象動作，與具體的硬體輸入完全解耦。

```javascript
class InputManager {
  constructor() {
    this.bindings = new Map();
    this.actionStates = new Map();
  }

  bind(action, key) {
    this.bindings.set(key, action);
  }

  handleKeyDown(event) {
    const action = this.bindings.get(event.code);
    if (action) {
      this.actionStates.set(action, true);
    }
  }

  handleKeyUp(event) {
    const action = this.bindings.get(event.code);
    if (action) {
      this.actionStates.set(action, false);
    }
  }

  isActionActive(action) {
    return this.actionStates.get(action) || false;
  }
}

// 用法
const input = new InputManager();
input.bind("Jump", "Space");
input.bind("MoveLeft", "KeyA");
input.bind("MoveRight", "KeyD");

// 在遊戲更新中：
if (input.isActionActive("Jump")) {
  player.jump();
}
```

### 事件系統 (Event System)

事件系統可在無須直接引用的情況下，實現引擎子系統與遊戲程式碼之間的解耦通訊。

**發佈-訂閱模式 (Publish-subscribe pattern)：**

```javascript
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  off(eventType, callback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
}

// 用法
const events = new EventBus();

events.on("collision", (data) => {
  console.log(`${data.entityA} 與 ${data.entityB} 發生碰撞`);
});

events.on("entityDestroyed", (data) => {
  spawnExplosion(data.position);
  addScore(data.points);
});

// 從物理系統發出事件
events.emit("collision", { entityA: player, entityB: wall });
```

**延遲事件：**

為了效能與決定性，事件可以在一個影格中加入佇列，並在更新循環的特定點進行發派：

```javascript
class DeferredEventBus extends EventBus {
  constructor() {
    super();
    this.eventQueue = [];
  }

  queue(eventType, data) {
    this.eventQueue.push({ type: eventType, data });
  }

  dispatchQueued() {
    for (const event of this.eventQueue) {
      this.emit(event.type, event.data);
    }
    this.eventQueue.length = 0;
  }
}
```

### 場景管理 (Scene Management)

場景管理器將遊戲內容組織為邏輯群組，並管理不同遊戲狀態之間的轉換。

**常用模式：**

- **場景圖 (Scene graph)** — 一種節點的層級樹狀結構，其中子物件的轉換是相對於父物件轉換的。移動父物件會連動移動所有子物件。
- **場景堆疊 (Scene stack)** — 場景可以被推入和彈出。暫停功能表會推入到遊戲畫面上方；關閉它則會彈回遊戲畫面。
- **場景載入** — 場景定義要載入哪些資產與實體。場景管理器負責協調載入、初始化與清理。

```javascript
class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.activeScene = null;
  }

  register(name, scene) {
    this.scenes.set(name, scene);
  }

  async switchTo(name) {
    if (this.activeScene) {
      this.activeScene.onExit();
      this.activeScene.unloadResources();
    }

    this.activeScene = this.scenes.get(name);
    await this.activeScene.loadResources();
    this.activeScene.onEnter();
  }

  update(deltaTime) {
    if (this.activeScene) {
      this.activeScene.update(deltaTime);
    }
  }

  render(context) {
    if (this.activeScene) {
      this.activeScene.render(context);
    }
  }
}
```

---

## 平台抽象化 (Platform Abstraction)

設計良好的引擎會將平台特定程式碼隱藏在統一介面之後。這使得引擎能在多個作業系統、圖形 API 和硬體設定上執行。

**需要抽象化的領域：**

| 關注點 | 範例 |
|---|---|
| 視窗化 | Win32, X11, Cocoa, SDL, GLFW |
| 圖形 API | OpenGL, Vulkan, DirectX, Metal, WebGL |
| 檔案 I/O | POSIX, Win32, 虛擬檔案系統 |
| 執行緒 | pthreads, Win32 執行緒, Web Workers |
| 音訊輸出 | WASAPI, CoreAudio, ALSA, Web Audio |
| 輸入裝置 | DirectInput, XInput, evdev, Gamepad API |

```javascript
// 抽象檔案系統介面
class FileSystem {
  async readFile(path) { throw new Error("尚未實作"); }
  async writeFile(path, data) { throw new Error("尚未實作"); }
  async exists(path) { throw new Error("尚未實作"); }
}

// 網頁實作
class WebFileSystem extends FileSystem {
  async readFile(path) {
    const response = await fetch(path);
    return response.arrayBuffer();
  }
}

// Node.js 實作
class NodeFileSystem extends FileSystem {
  async readFile(path) {
    const fs = require("fs").promises;
    return fs.readFile(path);
  }
}
```

---

## 初始化與關閉順序 (Initialization and Shutdown Order)

引擎子系統必須依照相依順序進行初始化，並依照相反順序關閉。

**典型的初始化序列：**

1. 核心系統（日誌、記憶體、設定）
2. 平台層（視窗建立、輸入裝置）
3. 轉譯系統（圖形內容、預設資源）
4. 音訊系統
5. 物理系統
6. 資源管理器（載入預設/共用資產）
7. 場景管理器
8. 指令碼系統
9. 遊戲特定初始化

**關閉則反轉此順序**，以確保系統在它們依賴的系統之前被清理。

```javascript
class Engine {
  async initialize() {
    this.logger = new Logger();
    this.config = new Config("engine.json");
    this.platform = new Platform();
    await this.platform.createWindow(this.config.window);

    this.renderer = new Renderer(this.platform.canvas);
    this.audio = new AudioSystem();
    this.physics = new PhysicsWorld();
    this.resources = new ResourceManager();
    this.input = new InputManager(this.platform.window);
    this.events = new EventBus();
    this.scenes = new SceneManager();

    this.logger.info("引擎已初始化");
  }

  shutdown() {
    this.scenes.cleanup();
    this.resources.unloadAll();
    this.input.cleanup();
    this.physics.cleanup();
    this.audio.cleanup();
    this.renderer.cleanup();
    this.platform.cleanup();
    this.logger.info("引擎關閉完成");
  }

  run() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.input.poll();
      this.physics.update(deltaTime);
      this.scenes.update(deltaTime);
      this.events.dispatchQueued();
      this.scenes.render(this.renderer);
      this.renderer.present();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
```

---

## 效能原則 (Performance Principles)

### 避免過度預先抽象化 (Avoid Premature Abstraction)

雖然模組化很重要，但在理解實際需求前就進行過度設計的介面會導致不必要的複雜度。從簡單、具體的實作開始，當實際使用案例需要時再向抽象化重構。

### 最佳化前先剖析 (Profile Before Optimizing)

在花時間進行最佳化之前，先使用剖析 (profiling) 工具測量實際的效能瓶頸。關於時間花在哪裡的直覺通常是錯誤的。

### 以資料為導向的設計 (Data-Oriented Design)

根據資料如何被存取而非透過物件導向的抽象來組織資料。將同型別的元件連續儲存在記憶體中（資料結構陣列 Array of Structures 轉為 陣列式資料結構 Structure of Arrays）可大幅提高 CPU 快取命中率。

```javascript
// 資料結構陣列 (僅針對位置進行迭代時對快取不友善)
const entities = [
  { position: {x: 0, y: 0}, sprite: "hero.png", health: 100 },
  { position: {x: 5, y: 3}, sprite: "bat.png", health: 30 },
];

// 陣列式資料結構 (僅針對位置進行迭代時對快取友善)
const positions = { x: [0, 5], y: [0, 3] };
const sprites = ["hero.png", "bat.png"];
const healths = [100, 30];
```

### 最小化熱點路徑中的分配 (Minimize Allocations in Hot Paths)

避免在每影格更新期間建立新物件或分配記憶體。預先分配緩衝區、使用物件集區並重用暫時性物件。

### 批次作業 (Batch Operations)

將相似的作業群組在一起，以減少內容切換、繪圖呼叫設定和快取遺漏造成的開銷。在移動到下一個型別前，先處理特定型別的所有實體。

---

## 關鍵原則摘要 (Summary of Key Principles)

| 原則 | 說明 |
|---|---|
| 模組化 | 具備乾淨介面的獨立子系統 |
| 關注點分離 | 每個系統都有單一職責 |
| 以資料為基礎的設計 | 由資料而非硬編碼邏輯控制行為 |
| 以組合偏好繼承 | ECS 模式提供靈活的實體建構方式 |
| 最小化相依性 | 乾淨、具層級結構的相依性圖 |
| 平台抽象化 | 將平台特定程式碼隱藏在統一介面後 |
| 固定步長物理 | 與影格率無關的具決定性模擬 |
| 事件驅動通訊 | 透過發佈-訂閱進行解耦互動 |
| 以資料為導向的效能 | 針對存取模式最佳化記憶體佈局 |
| 最佳化前先測量 | 剖析以識別實際瓶頸 |
