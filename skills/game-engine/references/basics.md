# 遊戲開發基礎 (Game Development Basics)

這是一份涵蓋網頁遊戲開發技術、遊戲架構以及遊戲迴圈解剖的綜合參考指南。

來源：
- https://developer.mozilla.org/en-US/docs/Games/Introduction
- https://developer.mozilla.org/en-US/docs/Games/Anatomy

---

## 遊戲開發網頁技術 (Web Technologies for Game Development)

### 圖形與轉譯 (Graphics and Rendering)

- **WebGL** — 基於 OpenGL ES 2.0 的硬體加速 2D 與 3D 圖形。提供直接存取 GPU 的權限以實現高效能轉譯。
- **Canvas API** — 透過 `<canvas>` 元素提供的 2D 繪圖表面。適用於 2D 遊戲、精靈 (sprite) 轉譯及像素操作。
- **SVG** — 可縮放向量圖形，用於與解析度無關的視覺效果。對 UI 元件和簡單的向量遊戲很有用。
- **HTML/CSS** — 用於建構遊戲 UI、功能表、HUD 及重疊層的標準網頁技術。

### 音訊 (Audio)

- **Web Audio API** — 支援即時播放、合成、空間音訊、效果處理及動態混音的高階音訊引擎。
- **HTML Audio 元素** — 適用於背景音樂及基本音效的簡單音訊播放。

### 輸入與控制 (Input and Controls)

- **Gamepad API** — 支援遊戲控制器與遊戲手把，包含按鍵對應及類比搖桿輸入。
- **Touch Events API** — 適用於行動裝置的多點觸控輸入處理。
- **Pointer Lock API** — 將滑鼠游標鎖定在遊戲區域內，並提供原始座標增量以實現精確的相機/瞄準控制。
- **裝置感應器 (Device Sensors)** — 存取加速規與陀螺儀以獲取以動作為基礎的輸入。
- **全螢幕 API (Full Screen API)** — 實現沉浸式的全螢幕遊戲體驗。

### 網路與多人遊戲 (Networking and Multiplayer)

- **WebSockets API** — 用於即時多人遊戲、聊天及即時更新的持續性雙向通訊通道。
- **WebRTC API** — 用於低延遲多人遊戲、語音聊天及資料通道的點對點連線。
- **Fetch API** — 用於下載遊戲資產、載入關卡資料及傳輸非即時遊戲狀態的 HTTP 請求。

### 資料儲存與效能 (Data Storage and Performance)

- **IndexedDB API** — 用於儲存遊戲存檔、快取資產及離線遊玩支援的使用者端結構化儲存。
- **型別化陣列 (Typed Arrays)** — 直接存取原始二進位資料緩衝區，用於 GL 紋理、音訊取樣及精簡的遊戲資料。
- **Web Workers API** — 在背景執行緒執行任務，用於在不阻塞主執行緒的情況下卸載沉浸式計算（物理、路徑規劃、AI）。

### 語言與編譯 (Languages and Compilation)

- **JavaScript** — 網頁遊戲開發的主要語言。
- **透過 Emscripten 的 C/C++** — 將現有的原生遊戲程式碼編譯為 JavaScript 或 WebAssembly 以進行網頁部署。
- **WebAssembly (Wasm)** — 針對效能關鍵的遊戲程式碼提供接近原生的執行速度。

---

## 您可以建構的遊戲類型 (Types of Games You Can Build)

現代網頁平台支援各種類型的遊戲：

- 3D 動作遊戲與射擊遊戲
- 角色扮演遊戲 (RPG)
- 2D 平台跳躍遊戲與橫向捲軸遊戲
- 益智與策略遊戲
- 卡牌與棋盤遊戲
- 休閒與行動友善遊戲
- 具備即時網路連線的多人遊戲體驗

---

## 網頁遊戲開發的優勢 (Advantages of Web-Based Game Development)

1. **普適觸及** — 遊戲可透過瀏覽器在智慧型手機、平板電腦、PC 及智慧電視上執行。
2. **無須依賴應用程式商店** — 直接在網頁上部署，無須經過商店審核流程。
3. **完全的營收控制** — 無須強制拆帳；可使用任何支付處理系統。
4. **即時更新** — 立即推送更新，無須等待商店審核。
5. **擁有自己的分析資料** — 收集您自己的資料或選擇任何分析服務提供者。
6. **直接的玩家關係** — 無須透過中介即可與玩家互動。
7. **天生的分享性** — 遊戲可透過標準網頁機制進行連結與探索。

---

## 遊戲迴圈的解剖 (Anatomy of a Game Loop)

每個遊戲都透過一個持續循環的步驟運作：

1. **呈現 (Present)** — 向玩家顯示目前的遊戲狀態。
2. **接受 (Accept)** — 接收使用者輸入（鍵盤、滑鼠、遊戲手把、觸控）。
3. **解釋 (Interpret)** — 將原始輸入處理為具意義的遊戲動作。
4. **計算 (Calculate)** — 根據動作、物理、AI 與時間更新遊戲狀態。
5. **重複 (Repeat)** — 迴圈回到呈現更新後的狀態。

遊戲可能是 **事件驅動 (event-driven)**（回合制，等待玩家動作）或 **按影格 (per-frame)**（透過主迴圈持續更新）。

---

## 使用 requestAnimationFrame 建構遊戲迴圈 (Building a Game Loop with requestAnimationFrame)

### 基本主迴圈 (Basic Main Loop)

```javascript
window.main = () => {
  window.requestAnimationFrame(main);

  // 您的遊戲邏輯編寫於此：更新狀態、轉譯影格
};

main(); // 開始循環
```

關鍵點：
- `requestAnimationFrame()` 將回呼與瀏覽器的重新繪製排程（通常為 60 Hz）同步。
- 在執行迴圈工作 **之前** 安排下一影格，以最大化可用的計算時間。

### 自包含主迴圈 (IIFE) (Self-Contained Main Loop (IIFE))

```javascript
;(() => {
  function main() {
    window.requestAnimationFrame(main);

    // 遊戲邏輯編寫於此
  }

  main();
})();
```

### 可停止的主迴圈 (Stoppable Main Loop)

```javascript
;(() => {
  function main() {
    MyGame.stopMain = window.requestAnimationFrame(main);

    // 遊戲邏輯編寫於此
  }

  main();
})();

// 停止迴圈：
window.cancelAnimationFrame(MyGame.stopMain);
```

---

## 計時與影格率 (Timing and Frame Rate)

### DOMHighResTimeStamp

`requestAnimationFrame` 會向您的回呼傳遞一個 `DOMHighResTimeStamp`，提供精確到 1/1000 毫秒的計時精確度。

```javascript
;(() => {
  function main(tFrame) {
    MyGame.stopMain = window.requestAnimationFrame(main);

    // tFrame 是一個以毫秒為單位的高解析度時間戳記
    // 將其用於 delta-time 計算
  }

  main();
})();
```

### 影格時間預算 (Frame Time Budget)

在 60 Hz 時，每影格約有 **16.67 毫秒** 的可用處理時間。瀏覽器的影格循環為：

1. 開始新影格（前一影格顯示於螢幕）
2. 執行 `requestAnimationFrame` 回呼
3. 執行記憶體回收 (Garbage collection) 及每影格瀏覽器任務
4. 睡眠直到 VSync，然後重複

---

## 簡單的更新與轉譯模式 (Simple Update and Render Pattern)

當您的遊戲能維持目標影格率時，最簡單的方法如下：

```javascript
;(() => {
  function main(tFrame) {
    MyGame.stopMain = window.requestAnimationFrame(main);

    update(tFrame); // 處理遊戲邏輯
    render();       // 繪製影格
  }

  main();
})();
```

假設：
- 每影格都能在時間預算內處理輸入並更新狀態。
- 模擬速度與顯示器更新率相同（通常約 60 FPS）。
- 無須進行影格插值 (Frame interpolation)。

---

## 具備固定時間步長的解耦更新與轉譯 (Decoupled Update and Render with Fixed Timestep)

為了穩健處理變動的更新率並獲得一致的模擬行為：

```javascript
;(() => {
  function main(tFrame) {
    MyGame.stopMain = window.requestAnimationFrame(main);
    const nextTick = MyGame.lastTick + MyGame.tickLength;
    let numTicks = 0;

    // 計算需要多少次模擬更新
    if (tFrame > nextTick) {
      const timeSinceTick = tFrame - MyGame.lastTick;
      numTicks = Math.floor(timeSinceTick / MyGame.tickLength);
    }

    queueUpdates(numTicks);
    render(tFrame);
    MyGame.lastRender = tFrame;
  }

  function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
      MyGame.lastTick += MyGame.tickLength;
      update(MyGame.lastTick);
    }
  }

  MyGame.lastTick = performance.now();
  MyGame.lastRender = MyGame.lastTick;
  MyGame.tickLength = 50; // 20 Hz 模擬速率（每刻 50 毫秒）

  setInitialState();
  main(performance.now());
})();
```

優點：
- **具決定性的模擬** — 無論顯示器更新率為何，遊戲邏輯都以固定頻率執行。
- **平滑轉譯** — 轉譯可以在模擬狀態之間進行插值以獲得視覺上的流暢感。
- **可移植行為** — 遊戲在 60 Hz、120 Hz 及 144 Hz 顯示器上的表現相同。

---

## 其他架構模式 (Alternative Architecture Patterns)

### 使用獨立的 setInterval 進行更新 (Separate setInterval for Updates)

```javascript
// 遊戲邏輯以固定速率更新
setInterval(() => {
  update();
}, 50); // 20 Hz

// 轉譯與顯示器同步
requestAnimationFrame(function render(tFrame) {
  requestAnimationFrame(render);
  draw();
});
```

缺點：即使分頁不可見，`setInterval` 仍會持續執行，浪費資源。

### 使用 Web Worker 進行更新 (Web Worker for Updates)

```javascript
// 沉重的遊戲邏輯在背景執行緒中執行
const updateWorker = new Worker('game-update-worker.js');

requestAnimationFrame(function render(tFrame) {
  requestAnimationFrame(render);
  updateWorker.postMessage({ ticks: numTicksNeeded });
  draw();
});
```

優點：不會阻塞主執行緒。非常適合物理運算量大或 AI 密集型的遊戲。
缺點：Worker 與主執行緒之間存在通訊開銷。

### 由 requestAnimationFrame 驅動 Web Worker (requestAnimationFrame Driving a Web Worker)

```javascript
;(() => {
  function main(tFrame) {
    MyGame.stopMain = window.requestAnimationFrame(main);

    // 訊號 Worker 計算更新
    updateWorker.postMessage({
      lastTick: MyGame.lastTick,
      numTicks: calculatedNumTicks
    });

    render(tFrame);
  }

  main();
})();
```

優點：不依賴舊式計時器。Worker 平行執行計算。

---

## 處理分頁失去焦點 (Handling Tab Focus Loss)

當瀏覽器分頁失去焦點時，`requestAnimationFrame` 會變慢或完全停止。策略如下：

| 策略 | 說明 | 最適合 |
|---|---|---|
| 視為暫停 | 跳過經過的時間；不更新 | 單人遊戲 |
| 模擬間隔 | 在重新獲得焦點時執行所有錯過的更新 | 簡單的模擬 |
| 從伺服器/同儕端同步 | 獲取授權狀態 | 多人遊戲 |

在重新獲得焦點事件後監控 `numTicks` 值。極大的值代表遊戲曾被暫停，可能需要特殊處理，而非嘗試模擬所有錯過的影格。

---

## 計時方法的比較 (Comparison of Timing Approaches)

| 方法 | 優點 | 缺點 |
|---|---|---|
| 每影格簡單更新/轉譯 | 易於實作，反應靈敏 | 在慢速/快速硬體上會失效 |
| 固定時間步長 + 插值 | 模擬一致，視覺平滑 | 實作較複雜 |
| 品質縮放 | 動態維持影格率 | 需要調適型品質系統 |

---

## 效能最佳化實作 (Performance Best Practices)

- **將非影格關鍵程式碼分離** 出主迴圈。針對 UI、網路回應及其他非同步作業使用事件與回呼。
- **使用 Web Workers** 處理計算密集型任務，如物理模擬、路徑規劃及 AI。
- **利用 GPU 加速**，透過 WebGL 進行轉譯。
- **保持在影格預算內** — 監控您的更新 + 轉譯時間，使其維持在 16.67 毫秒內（針對 60 FPS）。
- **降低記憶體回收壓力**，透過重用物件並避免每影格分配記憶體。
- **及早規劃計時策略** — 在開發中途更改遊戲迴圈架構既困難又容易出錯。

---

## 熱門的 3D 框架與函式庫 (Popular 3D Frameworks and Libraries)

- **Three.js** — 具備龐大生態系統的通用 3D 函式庫。
- **Babylon.js** — 具備物理、音訊及場景管理功能的完整 3D 遊戲引擎。
- **A-Frame** — 基於 Three.js 的宣告式 3D/VR 框架。
- **PlayCanvas** — 具備視覺化編輯器的雲端代管 3D 遊戲引擎。
- **Phaser** — 具備物理及輸入處理功能的熱門 2D 遊戲框架。
