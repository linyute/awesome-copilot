# 遊戲開發技術 (Game Development Techniques)

這是一份涵蓋建構網頁遊戲基本技術的綜合參考指南，編譯自 MDN Web Docs。

---

## 非同步指令碼 (Async Scripts)

**來源：** [MDN - Async Scripts for asm.js](https://developer.mozilla.org/en-US/docs/Games/Techniques/Async_scripts)

### 它是什麼 (What It Is)

非同步編譯允許 JavaScript 引擎在遊戲載入期間於主執行緒外編譯 asm.js 程式碼，並快取產生的機器碼。這可以防止後續載入時重複編譯，並讓瀏覽器在最佳化編譯過程時擁有最大的靈活性。

### 運作原理 (How It Works)

當非同步載入指令碼時，瀏覽器可以在背景執行緒編譯它，同時主執行緒繼續處理轉譯與使用者互動。編譯後的程式碼會被快取，因此以後的造訪可以完全跳過重新編譯。

### 何時使用 (When to Use It)

- 編譯 asm.js 程式碼的中型或大型遊戲。
- 啟動效能至關重要的任何遊戲（幾乎是所有遊戲）。
- 當您希望瀏覽器在各個工作階段之間快取編譯後的機器碼時。

### 程式碼範例 (Code Examples)

**HTML 屬性方式：**

```html
<script async src="file.js"></script>
```

**JavaScript 動態建立（預設為非同步）：**

```javascript
const script = document.createElement("script");
script.src = "file.js";
document.body.appendChild(script);
```

**重要事項：** 內嵌指令碼絕不會是非同步的，即使有 `async` 屬性也一樣。它們會立即編譯並執行：

```html
<!-- 儘管有屬性，這仍不是非同步的 -->
<script async>
  // 內嵌 JavaScript 程式碼
</script>
```

**針對字串型別的程式碼使用 Blob URL 進行非同步編譯：**

```javascript
const blob = new Blob([codeString]);
const script = document.createElement("script");
const url = URL.createObjectURL(blob);
script.onload = script.onerror = () => URL.revokeObjectURL(url);
script.src = url;
document.body.appendChild(script);
```

關鍵洞察在於，設定 `src`（而非 `innerHTML` 或 `textContent`）會觸發非同步編譯。

---

## 最佳化啟動效能 (Optimizing Startup Performance)

**來源：** [MDN - Optimizing Startup Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Optimizing_startup_performance)

### 它是什麼 (What It Is)

一系列旨在改善網頁應用程式與遊戲啟動速度並使其快速反應的策略，防止應用程式、瀏覽器或裝置對使用者顯示為凍結狀態。

### 運作原理 (How It Works)

核心原則是在啟動期間避免阻塞主執行緒。將工作卸載到背景執行緒 (Web Workers)、將啟動程式碼拆分為小型微任務，並保持主執行緒可用於處理使用者事件與轉譯。事件迴圈必須持續循環運轉。

### 何時使用 (When to Use It)

- 一律使用 — 這是所有網頁應用程式與遊戲的通病。
- 對於新應用程式至關重要，因為從一開始就以非同步方式建構會更容易。
- 對於移植自期望同步載入且需要重構的原生應用程式至關重要。

### 關鍵技術 (Key Techniques)

**1. 搭配 `defer` 與 `async` 載入指令碼**

防止阻塞 HTML 解析：

```html
<script defer src="app.js"></script>
<script async src="helper.js"></script>
```

**2. 使用 Web Workers 進行重度處理**

將資料擷取、解碼與計算移至 Worker。這可為 UI 與使用者事件釋放主執行緒。

**3. 資料處理**

- 使用瀏覽器提供的解碼器（影像、影片）而非自訂實作。
- 盡可能平行處理資料，而非循序處理。
- 將資產解碼（例如：JPEG 轉為原始紋理資料）卸載到 Worker。

**4. 資源載入**

- 不要在啟動 HTML 中包含關鍵轉譯路徑以外的指令碼或樣式表 — 僅在需要時載入它們。
- 使用資源提示：`preconnect`、`preload`。

**5. 程式碼大小與壓縮**

- 縮減 JavaScript 檔案。
- 使用 Gzip 或 Brotli 壓縮。
- 最佳化並壓縮資料檔案。

**6. 感知效能**

- 顯示啟動畫面 (splash screens) 以吸引使用者。
- 為重度網站顯示進度指示器。
- 即使絕對時長不變，也要讓時間感覺過得更快。

**7. Emscripten 主迴圈阻塞器（針對移植的應用程式）**

```javascript
emscripten_push_main_loop_blocker();
// 建立在主執行緒繼續前要執行的函式
// 建立依序呼叫的函式佇列
```

### 效能目標 (Performance Targets)

| 計量 | 目標 |
|---|---|
| 初始內容顯示 | 1-2 秒 |
| 使用者感知的延遲 | 50 毫秒或更短 |
| 遲鈍閾值 | 大於 200 毫秒 |

使用舊裝置或慢速裝置的使用者會經歷比開發者更長的延遲 — 請務必據此進行最佳化。

---

## WebRTC 資料通道 (WebRTC Data Channels)

**來源：** [MDN - WebRTC Data Channels](https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels)

### 它是什麼 (What It Is)

WebRTC 資料通道可讓您透過與同儕 (peer) 的作用中連線發送文字或二進位資料。在遊戲的情境中，這使玩家能夠相互發送資料進行文字聊天或遊戲狀態同步，而無須透過中央伺服器轉送。

### 運作原理 (How It Works)

WebRTC 在兩個瀏覽器之間建立點對點連線。連線建立後，可以在該連線上開啟資料通道。資料通道分為兩種類型：

**可靠通道 (Reliable Channels)：**
- 保證訊息抵達同儕端。
- 維持訊息順序 — 訊息依據發送順序抵達。
- 類比於 TCP 通訊端。

**不可靠通道 (Unreliable Channels)：**
- 不保證訊息傳遞。
- 訊息抵達順序可能不固定。
- 訊息可能完全不會抵達。
- 類比於 UDP 通訊端。

### 何時使用 (When to Use It)

- **可靠通道：** 回合制遊戲、聊天或任何每條訊息都必須按順序抵達的情境。
- **不可靠通道：** 即時動作遊戲，其中低延遲比保證傳遞更重要（例如：位置更新，過時的資料比遺失的資料更糟）。

### 遊戲中的使用案例 (Use Cases in Games)

- 玩家間的文字聊天通訊。
- 玩家間交換遊戲狀態資訊。
- 即時遊戲狀態同步。
- 無須專用遊戲伺服器的點對點多人遊戲。

### 實作筆記 (Implementation Notes)

- WebRTC API 主要以音訊與影片通訊著稱，但其包含強大的點對點資料通道功能。
- 建議使用函式庫以簡化實作並處理瀏覽器差異。
- 完整的 WebRTC 文件請參閱 [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)。

---

## 網頁遊戲音訊 (Audio for Web Games)

**來源：** [MDN - Audio for Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games)

### 它是什麼 (What It Is)

音訊為網頁遊戲提供回饋與氛圍。此技術涵蓋了跨桌面與行動平台的音訊實作，解決了瀏覽器差異與最佳化策略。

### 運作原理 (How It Works)

有兩個主要的 API 可供使用：

1. **HTMLMediaElement** — 用於基本音訊播放的標準 `<audio>` 元素。
2. **Web Audio API** — 用於動態音訊操縱、定位與精確計時的高階 API。

### 何時使用 (When to Use It)

- 針對簡單的線性播放使用 `<audio>` 元素（無須複雜控制的背景音樂）。
- 針對動態音樂、3D 空間音訊、精確計時與即時操縱使用 Web Audio API。
- 針對行動裝置或當您有許多短音效時，使用音訊精靈 (audio sprites)。

### 行動裝置上的關鍵挑戰 (Key Challenges on Mobile)

- **自動播放策略：** 瀏覽器限制含音訊的自動播放。播放必須由使用者透過點擊或輕觸啟動。
- **音量控制：** 行動瀏覽器可能會停用程式化音量控制，以保留作業系統層級的使用者控制。
- **緩衝/預載：** 行動瀏覽器通常在啟動播放前停用緩衝，以減少資料傳輸量。

### 技術 1：音訊精靈 (Technique 1: Audio Sprites)

借用 CSS 精靈的概念，將多個音訊剪輯合併為單一檔案，透過時間戳記播放特定區段。

**HTML：**

```html
<audio id="myAudio" src="mysprite.mp3"></audio>
<button data-start="18" data-stop="19">0</button>
<button data-start="16" data-stop="17">1</button>
<button data-start="14" data-stop="15">2</button>
<button data-start="12" data-stop="13">3</button>
<button data-start="10" data-stop="11">4</button>
<button data-start="8" data-stop="9">5</button>
<button data-start="6" data-stop="7">6</button>
<button data-start="4" data-stop="5">7</button>
<button data-start="2" data-stop="3">8</button>
<button data-start="0" data-stop="1">9</button>
```

**JavaScript：**

```javascript
const myAudio = document.getElementById("myAudio");
const buttons = document.getElementsByTagName("button");
let stopTime = 0;

for (const button of buttons) {
  button.addEventListener("click", () => {
    myAudio.currentTime = button.dataset.start;
    stopTime = Number(button.dataset.stop);
    myAudio.play();
  });
}

myAudio.addEventListener("timeupdate", () => {
  if (myAudio.currentTime > stopTime) {
    myAudio.pause();
  }
});
```

**為行動裝置準備音訊（在第一次使用者互動時觸發）：**

```javascript
const myAudio = document.createElement("audio");
myAudio.src = "my-sprite.mp3";
myAudio.play();
myAudio.pause();
```

### 技術 2：Web Audio API 多軌音樂 (Technique 2: Web Audio API Multi-Track Music)

以精確的計時載入並同步個別的音軌。

**建立音訊內容並載入檔案：**

```javascript
const audioCtx = new AudioContext();

async function getFile(filepath) {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}
```

**具備同步功能的音軌播放：**

```javascript
let offset = 0;

function playTrack(audioBuffer) {
  const trackSource = audioCtx.createBufferSource();
  trackSource.buffer = audioBuffer;
  trackSource.connect(audioCtx.destination);

  if (offset === 0) {
    trackSource.start();
    offset = audioCtx.currentTime;
  } else {
    trackSource.start(0, audioCtx.currentTime - offset);
  }

  return trackSource;
}
```

**在播放處理函式中處理自動播放策略：**

```javascript
playButton.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  playTrack(track);
  playButton.dataset.playing = true;
});
```

### 技術 3：與拍子同步的音軌播放 (Technique 3: Beat-Synchronized Track Playback)

為了實現無縫過渡，將新音軌同步到節拍邊界：

```javascript
const tempo = 3.074074076; // 節拍/小節的時間（以秒為單位）

if (offset === 0) {
  source.start();
  offset = context.currentTime;
} else {
  const relativeTime = context.currentTime - offset;
  const beats = relativeTime / tempo;
  const remainder = beats - Math.floor(beats);
  const delay = tempo - remainder * tempo;
  source.start(context.currentTime + delay, relativeTime + delay);
}
```

### 技術 4：位置音訊 (3D 空間化) (Technique 4: Positional Audio (3D Spatialization))

使用 `PannerNode` 在 3D 空間中定位音訊：

- 在遊戲世界空間中定位物件。
- 設定音訊來源的方向與移動。
- 套用環境效果（洞穴迴音、水下悶響等）。

這對於將音訊與視覺物件及玩家視角繫結在一起的 WebGL 3D 遊戲特別有用。

### 決策矩陣 (Decision Matrix)

| 技術 | 何時使用 | 優點 | 缺點 |
|---|---|---|---|
| 音訊精靈 | 許多短音效、行動裝置 | 減少 HTTP 請求、行動裝置友善 | 低位元率下尋址精確度降低 |
| 基礎 `<audio>` | 簡單線性播放 | 支援廣泛 | 控制有限、自動播放限制 |
| Web Audio API | 動態音樂、3D 定位、精確計時 | 完全控制、即時操縱、同步 | 程式碼較複雜 |
| 位置音訊 | 3D 沉浸式遊戲 | 現實感、玩家沉浸感 | 需要 WebGL 內容感知 |

---

## 2D 碰撞偵測 (2D Collision Detection)

**來源：** [MDN - 2D Collision Detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection)

### 它是什麼 (What It Is)

2D 碰撞偵測演算法根據遊戲實體的形狀型別（矩形對矩形、矩形對圓形、圓形對圓形等）判斷它們何時重疊或相交。遊戲通常不使用像素級精確偵測，而是使用覆蓋實體的簡單通用形狀（稱為「命中框」hitboxes），在視覺精確度與效能之間取得平衡。

### 運作原理 (How It Works)

每種演算法都會檢查兩個形狀之間的幾何關係。如果偵測到任何重疊，則報告發生碰撞。具體方法隨形狀型別而異。

### 何時使用 (When to Use It)

- 針對無旋轉的簡單矩形實體使用 AABB。
- 針對圓形實體或當您需要快速、簡單的檢查時使用圓形碰撞。
- 針對複雜的凸多邊形使用分離軸定理 (SAT)。
- 當您有許多實體時，使用寬相縮減 (broad-phase narrowing)（四元樹、空間雜湊圖）。

### 演算法 1：軸對齊邊界框 (AABB) (Algorithm 1: Axis-Aligned Bounding Box (AABB))

兩個軸對齊矩形（無旋轉）之間的碰撞偵測。透過確保矩形的 4 個側面之間都沒有間隙來偵測碰撞。

```javascript
class BoxEntity extends BaseEntity {
  width = 20;
  height = 20;

  isCollidingWith(other) {
    return (
      this.position.x < other.position.x + other.width &&
      this.position.x + this.width > other.position.x &&
      this.position.y < other.position.y + other.height &&
      this.position.y + this.height > other.position.y
    );
  }
}
```

### 演算法 2：圓形碰撞 (Algorithm 2: Circle Collision)

兩個圓形之間的碰撞偵測。取兩個圓形的中心點，並檢查它們之間的距離是否小於其半徑之和。

```javascript
class CircleEntity extends BaseEntity {
  radius = 10;

  isCollidingWith(other) {
    const dx =
      this.position.x + this.radius - (other.position.x + other.radius);
    const dy =
      this.position.y + this.radius - (other.position.y + other.radius);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + other.radius;
  }
}
```

注意：圓形的 `x` 和 `y` 座標指的是其左上角，因此您必須加上半徑來比較其實際中心。

### 演算法 3：分離軸定理 (SAT) (Algorithm 3: Separating Axis Theorem (SAT))

一種可以偵測任何兩個凸多邊形之間碰撞的演算法。它的原理是將每個多邊形投影到每個可能的軸上並檢查是否重疊。如果任何一個軸顯示有間隙，則多邊形沒有發生碰撞。

SAT 實作起來較複雜，但可以處理任意凸多邊形形狀。

### 碰撞效能：寬相與窄相 (Collision Performance: Broad Phase and Narrow Phase)

測試每個實體對抗所有其他實體在計算上非常昂貴 (O(n^2))。遊戲將碰撞偵測分為兩個階段：

**寬相 (Broad Phase)** — 使用空間資料結構快速識別哪些實體可能發生碰撞：
- 四元樹 (Quad Trees)
- R 樹 (R-Trees)
- 空間雜湊圖 (Spatial Hashmaps)

**窄相 (Narrow Phase)** — 僅對寬相產生的少量候選對象套用精確的碰撞演算法（AABB、圓形、SAT）。

### 基礎引擎程式碼 (Base Engine Code)

**用於碰撞視覺化的 CSS：**

```css
.entity {
  display: inline-block;
  position: absolute;
  height: 20px;
  width: 20px;
  background-color: blue;
}

.movable {
  left: 50px;
  top: 50px;
  background-color: red;
}

.collision-state {
  background-color: green !important;
}
```

**JavaScript 碰撞檢查器與實體系統：**

```javascript
const collider = {
  moveableEntity: null,
  staticEntities: [],
  checkCollision() {
    const isColliding = this.staticEntities.some((staticEntity) =>
      this.moveableEntity.isCollidingWith(staticEntity),
    );
    this.moveableEntity.setCollisionState(isColliding);
  },
};

const container = document.getElementById("container");

class BaseEntity {
  ref;
  position;
  constructor(position) {
    this.position = position;
    this.ref = document.createElement("div");
    this.ref.classList.add("entity");
    this.ref.style.left = `${this.position.x}px`;
    this.ref.style.top = `${this.position.y}px`;
    container.appendChild(this.ref);
  }
  shiftPosition(dx, dy) {
    this.position.x += dx;
    this.position.y += dy;
    this.redraw();
  }
  redraw() {
    this.ref.style.left = `${this.position.x}px`;
    this.ref.style.top = `${this.position.y}px`;
  }
  setCollisionState(isColliding) {
    if (isColliding && !this.ref.classList.contains("collision-state")) {
      this.ref.classList.add("collision-state");
    } else if (!isColliding) {
      this.ref.classList.remove("collision-state");
    }
  }
  isCollidingWith(other) {
    throw new Error("isCollidingWith 必須在子類別中實作");
  }
}

document.addEventListener("keydown", (e) => {
  e.preventDefault();
  switch (e.key) {
    case "ArrowLeft":
      collider.moveableEntity.shiftPosition(-5, 0);
      break;
    case "ArrowUp":
      collider.moveableEntity.shiftPosition(0, -5);
      break;
    case "ArrowRight":
      collider.moveableEntity.shiftPosition(5, 0);
      break;
    case "ArrowDown":
      collider.moveableEntity.shiftPosition(0, 5);
      break;
  }
  collider.checkCollision();
});
```

---

## 圖塊地圖 (Tilemaps)

**來源：** [MDN - Tilemaps](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps)

### 它是什麼 (What It Is)

圖塊地圖是 2D 遊戲開發中的一項基礎技術，它使用稱為「圖塊」的小型、規則形狀影像來建構遊戲世界。遊戲世界並非儲存大型的整體關卡影像，而是由網格化的可重用圖塊圖形組裝而成，提供了顯著的效能與記憶體優勢。

### 運作原理 (How It Works)

**核心結構：**

1. **圖塊圖集 (Tile Atlas)（精靈表）：** 所有圖塊影像都儲存在單一圖集檔案中。每個圖塊都被分配一個索引作為其識別碼。
2. **圖塊地圖資料物件：** 包含圖塊大小（像素尺寸）、影像圖集參考、地圖維度（以圖塊或像素為單位）、視覺網格（圖塊索引陣列）以及選用的邏輯網格（碰撞、路徑規劃、產生點資料）。

特殊值（負數、0 或 null）代表空白圖塊。

### 何時使用 (When to Use It)

- 建構任何類型的 2D 遊戲世界（平台跳躍、RPG、策略遊戲、益智遊戲）。
- 受《超級瑪利歐兄弟》、《小精靈》、《薩爾達傳說》、《星海爭霸》或《模擬城市》等經典遊戲啟發的遊戲。
- 在任何以網格為基礎的世界中，為路徑規劃、碰撞或關卡編輯提供邏輯優勢的情境。

### 轉譯靜態圖塊地圖 (Rendering Static Tilemaps)

針對可完全顯示於螢幕上的地圖：

```javascript
for (let column = 0; column < map.columns; column++) {
  for (let row = 0; row < map.rows; row++) {
    const tile = map.getTile(column, row);
    const x = column * map.tileSize;
    const y = row * map.tileSize;
    drawTile(tile, x, y);
  }
}
```

### 隨相機捲動圖塊地圖 (Scrolling Tilemaps with Camera)

在世界座標（關卡位置）與螢幕座標（轉譯位置）之間進行轉換：

```javascript
// 這些函式假設相機指向左上角

function worldToScreen(x, y) {
  return { x: x - camera.x, y: y - camera.y };
}

function screenToWorld(x, y) {
  return { x: x + camera.x, y: y + camera.y };
}
```

關鍵原則：僅轉譯可見圖塊以最佳化效能。在轉譯期間套用相機偏移轉換。

### 圖塊地圖型別 (Tilemap Types)

**正方形圖塊（最常用）：**
- 用於 RPG 與策略遊戲的俯視圖（《魔獸爭霸 2》、《最終幻想》）。
- 用於平台跳躍遊戲的側面圖（《超級瑪利歐兄弟》）。

**等角 (Isometric) 圖塊地圖：**
- 營造 3D 環境的錯覺。
- 常見於模擬與策略遊戲（《模擬城市 2000》、《法老王》、《最終幻想戰略版》）。

### 分層 (Layers)

多個視覺層可以實現：
- 在不同的背景型別中重用圖塊。
- 角色出現在地形後方或前方（在樹後行走）。
- 以較少的圖塊變化建構更豐富的世界。

範例：在草地、沙地或磚塊背景上方的獨立層中轉譯岩石圖塊。

### 邏輯網格 (Logic Grid)

用於非視覺遊戲邏輯的獨立網格：
- **碰撞偵測：** 標記可通行與阻塞的圖塊。
- **角色產生：** 定義產生點位置。
- **路徑規劃：** 建立導覽圖。
- **圖塊組合：** 偵測有效模式（《俄羅斯方塊》、《寶石方塊》）。

### 效能最佳化 (Performance Optimization)

1. **僅轉譯可見圖塊** — 完全跳過螢幕外的圖塊。
2. **預先轉譯至畫布** — 將地圖轉譯到離屏 (off-screen) 畫布元素，並作為單一操作進行點陣傳輸 (blit)。
3. **離屏緩衝** — 繪製一個略大於可見區域（大 2x2 圖塊）的區段，以減少捲動期間的重新繪製。
4. **區塊化 (Chunking)** — 將大型圖塊地圖劃分為多個區段（例如：10x10 圖塊區塊），將每個區段預先轉譯為一個「大圖塊」。

---

## 控制：Gamepad API (Controls: Gamepad API)

**來源：** [MDN - Controls Gamepad API](https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API)

### 它是什麼 (What It Is)

Gamepad API 提供了一個介面，用於在無須外掛程式的情況下，在網頁瀏覽器中偵測並使用遊戲手把控制器。它透過 JavaScript 公開按鈕按下與軸變更，實現對網頁遊戲的類遊戲機式控制。

### 運作原理 (How It Works)

兩個基礎事件處理控制器的生命週期：

- `gamepadconnected` — 連接遊戲手把時觸發。
- `gamepaddisconnected` — 中斷連接（物理斷開或閒置）時觸發。

安全性筆記：在分頁可見時需要使用者與控制器互動，事件才會觸發（防止指紋辨識）。

**遊戲手把物件屬性：**

| 屬性 | 說明 |
|---|---|
| `id` | 包含控制器資訊的字串 |
| `index` | 連接裝置的唯一識別碼 |
| `connected` | 指示連線狀態的布林值 |
| `mapping` | 配置型別（"standard" 是常用選項） |
| `axes` | 代表類比搖桿位置的浮點數陣列 (-1 到 1) |
| `buttons` | 具有 `pressed` 與 `value` 屬性的 GamepadButton 物件陣列 |

### 何時使用 (When to Use It)

- 建構應與遊戲機控制器搭配使用的遊戲時。
- 在 Windows 與 macOS 上支援 Xbox 360、Xbox One、PS3 或 PS4 控制器時。
- 當您想要支援雙重輸入（鍵盤 + 遊戲手把）時。

### 程式碼範例 (Code Examples)

**基礎設定結構：**

```javascript
const gamepadAPI = {
  controller: {},
  turbo: false,
  connect() {},
  disconnect() {},
  update() {},
  buttonPressed() {},
  buttons: [],
  buttonsCache: [],
  buttonsStatus: [],
  axesStatus: [],
};
```

**按鈕配置 (Xbox 360)：**

```javascript
const gamepadAPI = {
  buttons: [
    "DPad-Up", "DPad-Down", "DPad-Left", "DPad-Right",
    "Start", "Back", "Axis-Left", "Axis-Right",
    "LB", "RB", "Power", "A", "B", "X", "Y",
  ],
};
```

**事件接聽程式：**

```javascript
window.addEventListener("gamepadconnected", gamepadAPI.connect);
window.addEventListener("gamepaddisconnected", gamepadAPI.disconnect);
```

**連線與中斷連線處理函式：**

```javascript
connect(evt) {
  gamepadAPI.controller = evt.gamepad;
  gamepadAPI.turbo = true;
  console.log("遊戲手把已連接。");
},

disconnect(evt) {
  gamepadAPI.turbo = false;
  delete gamepadAPI.controller;
  console.log("遊戲手把已中斷連線。");
},
```

**更新方法（每影格呼叫）：**

```javascript
update() {
  // 清除按鈕快取
  gamepadAPI.buttonsCache = [];

  // 將前一影格的按鈕狀態移至快取
  for (let k = 0; k < gamepadAPI.buttonsStatus.length; k++) {
    gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
  }

  // 清除按鈕狀態
  gamepadAPI.buttonsStatus = [];

  // 獲取遊戲手把物件
  const c = gamepadAPI.controller || {};

  // 遍歷按鈕並將被按下的按鈕推入陣列
  const pressed = [];
  if (c.buttons) {
    for (let b = 0; b < c.buttons.length; b++) {
      if (c.buttons[b].pressed) {
        pressed.push(gamepadAPI.buttons[b]);
      }
    }
  }

  // 遍歷軸並將其值推入陣列
  const axes = [];
  if (c.axes) {
    for (const ax of c.axes) {
      axes.push(ax.toFixed(2));
    }
  }

  // 指派接收到的值
  gamepadAPI.axesStatus = axes;
  gamepadAPI.buttonsStatus = pressed;

  return pressed;
},
```

**具備長按支援的按鈕偵測：**

```javascript
buttonPressed(button, hold) {
  let newPress = false;
  if (gamepadAPI.buttonsStatus.includes(button)) {
    newPress = true;
  }
  if (!hold && gamepadAPI.buttonsCache.includes(button)) {
    newPress = false;
  }
  return newPress;
},
```

參數：
- `button` — 要接聽的按鈕名稱。
- `hold` — 若為 true，則按住按鈕視為持續動作；若為 false，則僅註冊新的一次按下。

**在遊戲迴圈中的用法：**

```javascript
if (gamepadAPI.turbo) {
  if (gamepadAPI.buttonPressed("A", "hold")) {
    this.turbo_fire();
  }
  if (gamepadAPI.buttonPressed("B")) {
    this.managePause();
  }
}
```

**具備閾值的類比搖桿輸入（防止搖桿漂移）：**

```javascript
if (gamepadAPI.axesStatus[0].x > 0.5) {
  this.player.angle += 3;
  this.turret.angle += 3;
}
```

**獲取所有連接的遊戲手把：**

```javascript
const gamepads = navigator.getGamepads();
// 傳回一個陣列，其中無法使用/中斷連接的插槽包含 null
// 範例（在索引 1 處有一個裝置）：[null, [object Gamepad]]
```

---

## 清晰的像素藝術外觀 (Crisp Pixel Art Look)

**來源：** [MDN - Crisp Pixel Art Look](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look)

### 它是什麼 (What It Is)

一種在大型高解析度顯示器上呈現像素藝術而不產生模糊的技術，其原理是將單個影像像素映射到螢幕像素塊，而不套用平滑內插。復古像素藝術要求在縮放時保持硬邊緣，但現代瀏覽器預設使用會混合顏色並產生模糊的平滑演算法。

### 運作原理 (How It Works)

CSS `image-rendering` 屬性控制瀏覽器如何縮放影像。將其設定為 `pixelated` 會強制執行最近鄰縮放 (nearest-neighbor scaling)，這會保留像素藝術清晰、方塊狀的視覺風格，而非套用雙線性或雙三次平滑。

**關鍵 CSS 值：**
- `pixelated` — 保留像素藝術的清晰邊緣。
- `crisp-edges` — 某些瀏覽器支援的替代方案。

### 何時使用 (When to Use It)

- 具有像素藝術資產的復古風格遊戲。
- 任何您想要刻意呈現方塊狀、像素化視覺風格的遊戲。
- 將小型精靈影像縮放到較大的顯示尺寸時。

### 技術 1：使用 CSS 縮放 `<img>` 元素

```html
<img
  src="character.png"
  alt="使用 CSS 放大且看起來清晰的像素藝術角色" />
```

```css
img {
  width: 48px;
  height: 136px;
  image-rendering: pixelated;
}
```

### 技術 2：畫布中的清晰像素藝術

將畫布 `width`/`height` 屬性設定為原始像素藝術解析度，然後使用 CSS `width`/`height` 進行縮放（例如：4 倍縮放，將 128 像素設為 512px CSS 寬度）。

```html
<canvas id="game" width="128" height="128">一隻貓</canvas>
```

```css
canvas {
  width: 512px;
  height: 512px;
  image-rendering: pixelated;
}
```

```javascript
const ctx = document.getElementById("game").getContext("2d");

const image = new Image();
image.onload = () => {
  ctx.drawImage(image, 0, 0);
};
image.src = "cat.png";
```

### 技術 3：具備修正功能的任意畫布縮放

對於非整數縮放因子，影像像素必須以整數倍與畫布像素對齊：

```javascript
const ctx = document.getElementById("game").getContext("2d");
ctx.scale(0.8, 0.8);

const image = new Image();
image.onload = () => {
  // 修正公式：dWidth = sWidth / xScale * n (其中 n 為整數)
  ctx.drawImage(image, 0, 0, 128, 128, 0, 0, 128 / 0.8, 128 / 0.8);
};
image.src = "cat.png";
```

使用 `drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)` 時：
- `dWidth` 必須等於 `sWidth / xScale * n`
- `dHeight` 必須等於 `sHeight / yScale * m`
- 其中 `n` 與 `m` 是正整數 (1, 2, 3 等)

### 已知限制 (Known Limitations)

**devicePixelRatio 對齊不準：** 當 `devicePixelRatio` 不是整數時（例如：在 110% 瀏覽器縮放比例下），像素轉譯可能會不均勻，因為 CSS 像素無法完美映射到裝置像素。這會產生不均勻的外觀，且目前沒有簡單的解決方案。

### 最佳實作 (Best Practices)

1. 盡可能使用整數縮放因子 (2x, 3x, 4x)。
2. 保持長寬比 — 等比例縮放寬度與高度。
3. 在不同的瀏覽器縮放層級下進行測試。
4. 避免使用分數形式的畫布縮放因子或 `drawImage` 尺寸。
5. 在畫布元素中包含具描述性的 `aria-label` 屬性，以確保無障礙功能。
