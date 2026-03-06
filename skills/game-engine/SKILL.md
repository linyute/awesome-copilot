---
name: game-engine
description: '使用 HTML5、Canvas、WebGL 和 JavaScript 建構網頁遊戲引擎和遊戲的專家技能。當被要求建立遊戲、建構遊戲引擎、實作遊戲物理、處理碰撞偵測、設定遊戲迴圈、管理精靈 (sprites)、增加遊戲控制或處理 2D/3D 轉譯時使用。涵蓋平台跳躍遊戲、打磚塊風格遊戲、迷宮遊戲、圖塊地圖 (tilemaps)、音訊、透過 WebRTC 的多人遊戲以及遊戲發行的技術。'
---

# 遊戲引擎技能 (Game Engine Skill)

使用 HTML5 Canvas、WebGL 和 JavaScript 建構網頁遊戲和遊戲引擎。此技能包含入門範本、參考文件，以及使用 Phaser、Three.js、Babylon.js 和 A-Frame 等框架進行 2D 和 3D 遊戲開發的逐步工作流。

## 何時使用此技能 (When to Use This Skill)

- 使用網頁技術從頭開始建構遊戲引擎或遊戲
- 實作遊戲迴圈、物理、碰撞偵測或轉譯
- 使用 HTML5 Canvas、WebGL 或 SVG 處理遊戲圖形
- 增加遊戲控制（鍵盤、滑鼠、觸控、遊戲手把）
- 建立 2D 平台跳躍遊戲、打磚塊風格遊戲、迷宮遊戲或 3D 體驗
- 處理圖塊地圖、精靈或動畫
- 為網頁遊戲增加音訊
- 使用 WebRTC 或 WebSockets 實作多人遊戲功能
- 最佳化遊戲效能
- 發行和分發網頁遊戲

## 先決條件 (Prerequisites)

- HTML、CSS 和 JavaScript 的基礎知識
- 支援 Canvas/WebGL 的現代網頁瀏覽器
- 文字編輯器或 IDE
- 選用：用於建構工具和本機開發伺服器的 Node.js

## 核心概念 (Core Concepts)

以下概念構成了每個網頁遊戲引擎的基礎。

### 遊戲迴圈 (Game Loop)

每個遊戲引擎都圍繞著遊戲迴圈運轉 — 一個持續的循環：

1. **處理輸入 (Process Input)** - 讀取鍵盤、滑鼠、觸控或遊戲手把輸入
2. **更新狀態 (Update State)** - 更新遊戲物件位置、物理、AI 和邏輯
3. **轉譯 (Render)** - 將目前的遊戲狀態繪製到螢幕上

使用 `requestAnimationFrame` 實現流暢且經瀏覽器最佳化的轉譯。

### 轉譯 (Rendering)

- **Canvas 2D** - 最適合 2D 遊戲、以精靈為基礎的轉譯和圖塊地圖
- **WebGL** - 硬體加速的 3D 和進階 2D 轉譯
- **SVG** - 以向量為基礎的圖形，適合 UI 元件
- **CSS** - 對於以 DOM 為基礎的遊戲元件和過渡效果很有用

### 物理與碰撞偵測 (Physics and Collision Detection)

- **2D 碰撞偵測** - 以 AABB、圓形和 SAT 為基礎的碰撞
- **3D 碰撞偵測** - 邊界框 (Bounding box)、邊界球 (Bounding sphere) 和射線投射 (Raycasting)
- **速度與加速度** - 適用於移動的基本牛頓物理學
- **重力** - 適用於平台跳躍遊戲的恆定向下加速度

### 控制 (Controls)

- **鍵盤** - 方向鍵、WASD 和自訂按鍵繫結
- **滑鼠** - 點擊、移動和用於 FPS 風格控制的指標鎖定 (Pointer lock)
- **觸控** - 行動裝置觸控事件和虛擬搖桿
- **遊戲手把** - 用於控制器支援的 Gamepad API

### 音訊 (Audio)

- **Web Audio API** - 程式化聲音產生和空間音訊
- **HTML5 Audio** - 適用於音樂和音效的簡單音訊播放

## 逐步工作流 (Step-by-Step Workflows)

### 建立基本的 2D 遊戲 (Creating a Basic 2D Game)

1. 設定包含 `<canvas>` 元素的 HTML 檔案
2. 獲取 2D 轉譯內容 (Rendering context)
3. 使用 `requestAnimationFrame` 實作遊戲迴圈
4. 建立具有位置、速度和大小屬性的遊戲物件
5. 處理用於玩家控制的鍵盤/滑鼠輸入
6. 實作遊戲物件之間的碰撞偵測
7. 增加計分、生命值以及勝負條件
8. 增加音效和音樂

### 建構 3D 遊戲 (Building a 3D Game)

1. 選擇框架（Three.js、Babylon.js、A-Frame 或 PlayCanvas）
2. 設定場景、相機和轉譯器
3. 載入或建立 3D 模型和紋理
4. 實作燈光和著色器 (Shaders)
5. 增加物理和碰撞偵測
6. 實作玩家控制和相機移動
7. 增加音訊和視覺效果

### 發行遊戲 (Publishing a Game)

1. 最佳化資產（壓縮影像、縮減程式碼）
2. 在不同瀏覽器和裝置上進行測試
3. 選擇分發平台（網頁、應用程式商店、遊戲入口網站）
4. 如果需要，實作營利機制
5. 透過遊戲社群和社群媒體進行推廣

## 遊戲範本 (Game Templates)

入門範本可在 `assets/` 資料夾中找到。每個範本都提供了一個完整的、可執行的範例，可作為新專案的起點。

| 範本 | 說明 |
|----------|-------------|
| `paddle-game-template.md` | 使用純 JavaScript 的 2D 打磚塊風格遊戲 |
| `2d-maze-game.md` | 具有裝置定向控制的迷宮遊戲 |
| `2d-platform-game.md` | 使用 Phaser 框架的平台跳躍遊戲 |
| `gameBase-template-repo.md` | 遊戲基礎範本存放庫結構 |
| `simple-2d-engine.md` | 具有碰撞功能的簡單 2D 平台跳躍引擎 |

## 參考文件 (Reference Documentation)

詳細的參考資料可在 `references/` 資料夾中找到。請參閱這些檔案以獲取特定主題的深入介紹。

| 參考 | 涵蓋主題 |
|-----------|---------------|
| `basics.md` | 遊戲開發簡介和解剖 |
| `web-apis.md` | Canvas、WebGL、Web Audio、Gamepad 和其他網頁 API |
| `techniques.md` | 碰撞偵測、圖塊地圖、非同步指令碼、音訊 |
| `3d-web-games.md` | 3D 理論、框架、著色器、WebXR |
| `game-control-mechanisms.md` | 觸控、鍵盤、滑鼠和遊戲手把控制 |
| `game-publishing.md` | 分發、推廣和營利 |
| `algorithms.md` | 射線投射、碰撞、物理、向量數學 |
| `terminology.md` | 遊戲開發術語表 |
| `game-engine-core-principles.md` | 遊戲引擎的核心設計原則 |

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|-------|----------|
| Canvas 是空白的 | 檢查您是否在獲取內容後且在遊戲迴圈內呼叫繪圖方法 |
| 遊戲以不同速度執行 | 在更新計算中使用 delta time，而非固定值 |
| 碰撞偵測不一致 | 對快速移動的物件使用連續碰撞偵測或減少時間步長 |
| 音訊不播放 | 瀏覽器在播放音訊前需要使用者互動；請從點擊處理常式觸發播放 |
| 效能不佳 | 使用瀏覽器開發者工具進行分析、減少繪圖呼叫 (Draw calls)、使用物件集區 (Object pooling) 並最佳化資產大小 |
| 觸控控制沒反應 | 阻止預設觸控行為並與滑鼠事件分開處理觸控事件 |
| WebGL 內容遺失 | 處理 `webglcontextlost` 事件並在 `webglcontextrestored` 時還原狀態 |
