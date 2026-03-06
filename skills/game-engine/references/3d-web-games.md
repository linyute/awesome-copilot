# 3D 網頁遊戲 (3D Web Games)

這是一份建構網頁 3D 遊戲的綜合參考指南，涵蓋了基礎理論、主要框架、著色器程式編寫、碰撞偵測以及沉浸式 WebXR 體驗。

來源：[MDN Web Docs -- Games Techniques: 3D on the web](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web)

---

## 3D 理論與基礎 (3D Theory and Fundamentals)

在開始使用任何框架之前，了解 3D 轉譯背後的核心概念至關重要。

### 座標系統 (Coordinate System)

WebGL 使用 **右手座標系統**：

- **X 軸** — 指向右側
- **Y 軸** — 指向上方
- **Z 軸** — 指向螢幕外，朝向觀察者

所有 3D 物件都是相對於此座標系統定位的。

### 頂點、邊、面與網格 (Vertices, Edges, Faces, and Meshes)

- **頂點 (Vertex)** — 3D 空間中的一個點，由 `(x, y, z)` 定義，並具有額外屬性：顏色（RGBA，值為 0.0-1.0）、法線（頂點面向的方向，用於光照）以及紋理座標。
- **邊 (Edge)** — 連接兩個頂點的線。
- **面 (Face)** — 由邊界定的平面（例如：連接三個頂點的三角形）。
- **幾何圖形 (Geometry)** — 由頂點、邊和面建構而成的結構形狀。
- **材質 (Material)** — 表面外觀，結合了顏色、紋理、粗糙度、金屬感等。
- **網格 (Mesh)** — 結合幾何圖形與材質以產生可轉譯的 3D 物件。

### 轉譯管線 (The Rendering Pipeline)

轉譯管線將 3D 物件轉換為螢幕上的 2D 像素，主要分為四個階段：

**1. 頂點處理 (Vertex Processing)**

將個別的頂點資料組合成基本基元（三角形、線、點）並套用轉換：

- **模型轉換 (Model transformation)** — 在世界空間中定位並定向物件。
- **檢視轉換 (View transformation)** — 定位並定向虛擬相機。
- **投影轉換 (Projection transformation)** — 定義相機的視野 (FOV)、外觀比例 (aspect ratio)、近平面和遠平面。
- **視埠轉換 (Viewport transformation)** — 將結果對應到螢幕視埠。

**2. 點陣化 (Rasterization)**

將 3D 基元轉換為與像素網格對齊的 2D 片段 (fragments)。

**3. 片段處理 (Fragment Processing)**

使用紋理和光照確定每個片段的最終顏色：

- **紋理 (Textures)**：對應到 3D 表面的 2D 影像。個別紋理元素稱為 *紋素 (texels)*。紋理包覆 (Texture wrapping) 會在幾何圖形周圍重複影像；紋理過濾 (Texture filtering) 會處理顯示解析度與紋理解析度不同時的縮小與放大。
- **光照 (Phong 模型)**：四種光交互作用類型 — **漫射 (diffuse)**（遠處方向光，如太陽）、**鏡面 (specular)**（點光源亮部，如手電筒）、**環境 (ambient)**（恆定的全域照明）以及**放射 (emissive)**（物件自身發出的光）。

**4. 輸出合併 (Output Merging)**

將 3D 片段轉換為最終的 2D 像素網格。為了提高效率，會剔除螢幕外和被遮擋的物件。

### 相機 (Camera)

相機定義了哪些內容是可見的：

- **位置** — 3D 空間中的位置。
- **方向** — 相機指向何處。
- **定向 (Orientation)** — 繞檢視軸旋轉。

### 實務技巧 (Practical Tips)

- WebGL 中的大小與位置值是無單位的；您可以自行決定它們代表公釐、公尺、英呎或其他任何單位。
- 在編寫程式碼前，先從概念上理解轉譯管線；頂點和片段處理階段可透過著色器進行程式編寫。
- 每個框架（Three.js、Babylon.js、A-Frame、PlayCanvas）都對此管線進行了抽象化，但基礎原理是相同的。

---

## 框架 (Frameworks)

### Three.js

Three.js 是最受歡迎的網頁 3D 引擎之一。它在 WebGL 之上提供了一個高階 API，並擁有龐大的外掛程式、範例和社群支援生態系統。

#### 設定 (Setup)

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>Three.js 示範</title>
    <style>
      html, body, canvas {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        font-size: 0;
      }
    </style>
  </head>
  <body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r79/three.min.js"></script>
    <script>
      const WIDTH = window.innerWidth;
      const HEIGHT = window.innerHeight;
      /* 所有程式碼編寫於此 */
    </script>
  </body>
</html>
```

或透過 npm 安裝：

```bash
npm install --save three
npm install --save-dev vite
npx vite
```

#### 核心元件 (Core Components)

**轉譯器 (Renderer)** — 在瀏覽器中顯示場景：

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xdddddd, 1);
document.body.appendChild(renderer.domElement);
```

**場景 (Scene)** — 所有 3D 物件、燈光和相機的容器：

```javascript
const scene = new THREE.Scene();
```

**相機 (Camera)** — 定義視角（PerspectiveCamera 最常用）：

```javascript
const camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT);
camera.position.z = 50;
scene.add(camera);
```

參數：視野（角度）、外觀比例。其他相機類型包括正交相機 (Orthographic) 和立方體相機 (Cube)。

#### 幾何圖形、材質與網格 (Geometry, Material, and Mesh)

```javascript
// 幾何圖形定義形狀
const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
const torusGeometry = new THREE.TorusGeometry(7, 1, 16, 32);
const dodecahedronGeometry = new THREE.DodecahedronGeometry(7);

// 材質定義表面外觀
const basicMaterial = new THREE.MeshBasicMaterial({ color: 0x0095dd });   // 無光照
const phongMaterial = new THREE.MeshPhongMaterial({ color: 0xff9500 });   // 有光澤
const lambertMaterial = new THREE.MeshLambertMaterial({ color: 0xeaeff2 }); // 霧面

// 網格結合幾何圖形 + 材質
const cube = new THREE.Mesh(boxGeometry, basicMaterial);
cube.position.set(-25, 0, 0);
cube.rotation.set(0.4, 0.2, 0);
scene.add(cube);
```

#### 燈光 (Lighting)

```javascript
const light = new THREE.PointLight(0xffffff);
light.position.set(-10, 15, 50);
scene.add(light);
```

其他燈光類型：環境光 (Ambient)、方向光 (Directional)、半球光 (Hemisphere)、聚光燈 (Spot)。

注意：`MeshBasicMaterial` 不會對燈光做出反應。請針對受光表面使用 `MeshPhongMaterial` 或 `MeshLambertMaterial`。

#### 動畫迴圈 (Animation Loop)

```javascript
let t = 0;
function render() {
  t += 0.01;
  requestAnimationFrame(render);

  cube.rotation.y += 0.01;                          // 持續旋轉
  torus.scale.y = Math.abs(Math.sin(t));             // 脈動縮放
  dodecahedron.position.y = -7 * Math.sin(t * 2);   // 上下浮動位置

  renderer.render(scene, camera);
}
render();
```

#### 實務技巧 (Practical Tips)

- 使用 `Math.sin()` 製作縮放動畫時請搭配 `Math.abs()`，以避免負向縮放值。
- 轉譯迴圈使用 `requestAnimationFrame` 以實現流暢且經瀏覽器最佳化的影格更新。
- 完整的 API 請參考 [Three.js 文件](https://threejs.org/docs/)。

---

### Babylon.js

Babylon.js 是一款功能齊全的 3D 引擎，具備內建的數學函式庫、物理支援以及詳盡的文件。

#### 設定 (Setup)

```html
<script src="https://cdn.babylonjs.com/v7.34.1/babylon.js"></script>
<canvas id="render-canvas"></canvas>
```

#### 引擎、場景與轉譯迴圈 (Engine, Scene, and Render Loop)

```javascript
const canvas = document.getElementById("render-canvas");
const engine = new BABYLON.Engine(canvas);

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);

function renderLoop() {
  scene.render();
}
engine.runRenderLoop(renderLoop);
```

#### 相機與燈光 (Camera and Lighting)

```javascript
const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -10), scene);
const light = new BABYLON.PointLight("light", new BABYLON.Vector3(10, 10, 0), scene);
```

#### 建立網格 (Creating Meshes)

```javascript
const box = BABYLON.Mesh.CreateBox("box", 2, scene);       // 名稱, 大小, 場景
const torus = BABYLON.Mesh.CreateTorus("torus", 2, 0.5, 15, scene); // 名稱, 直徑, 厚度, 鑲嵌, 場景
const cylinder = BABYLON.Mesh.CreateCylinder("cylinder", 2, 2, 2, 12, 1, scene);
// 名稱, 高度, 頂部直徑, 底部直徑, 鑲嵌, 高度細分, 場景
```

#### 材質 (Materials)

```javascript
const boxMaterial = new BABYLON.StandardMaterial("material", scene);
boxMaterial.emissiveColor = new BABYLON.Color3(0, 0.58, 0.86);
box.material = boxMaterial;
```

#### 轉換與動畫 (Transforms and Animation)

```javascript
box.position.x = 5;
box.rotation.x = -0.2;
box.scaling.x = 1.5;

// 轉譯迴圈內的動畫
let t = 0;
function renderLoop() {
  scene.render();
  t -= 0.01;
  box.rotation.y = t * 2;
  torus.scaling.z = Math.abs(Math.sin(t * 2)) + 0.5;
  cylinder.position.y = Math.sin(t * 3);
}
engine.runRenderLoop(renderLoop);
```

#### 實務技巧 (Practical Tips)

- `BABYLON` 全域物件包含所有框架功能。
- `BABYLON.Vector3` 和 `BABYLON.Color3` 廣泛用於定位與著色。
- Babylon.js 包含用於向量、顏色和矩陣的內建數學函式庫。
- 關於物理、粒子和後製處理等進階功能，請參考 [Babylon.js 文件](https://doc.babylonjs.com/)。

---

### A-Frame

A-Frame 是 Mozilla 開發的一個宣告式、以 HTML 為基礎的框架，用於建構網頁上的 VR/AR 體驗。它使用實體元件系統 (entity-component system)，底層執行於 WebGL。

#### 設定 (Setup)

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>A-Frame 示範</title>
    <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
    <style>
      body { margin: 0; padding: 0; width: 100%; height: 100%; font-size: 0; }
    </style>
  </head>
  <body>
    <a-scene>
      <!-- 實體編寫於此 -->
    </a-scene>
  </body>
</html>
```

`<a-scene>` 元素是根容器。A-Frame 會自動包含預設的相機、燈光和輸入控制。

#### 基本基元與實體 (Primitives and Entities)

```html
<!-- 內建的基本形狀基元 -->
<a-box position="0 1 -3" rotation="0 10 0" color="#4CC3D9"></a-box>
<a-sky color="#DDDDDD"></a-sky>

<!-- 具有明確幾何圖形和材質的通用實體 -->
<a-entity
  geometry="primitive: torus; radius: 1; radiusTubular: 0.1; segmentsTubular: 12;"
  material="color: #EAEFF2; roughness: 0.1; metalness: 0.5;"
  rotation="10 0 0"
  position="-3 1 0">
</a-entity>
```

#### 使用 JavaScript 建立實體 (Creating Entities with JavaScript)

```javascript
const scene = document.querySelector("a-scene");
const cylinder = document.createElement("a-cylinder");
cylinder.setAttribute("color", "#FF9500");
cylinder.setAttribute("height", "2");
cylinder.setAttribute("radius", "0.75");
cylinder.setAttribute("position", "3 1 0");
scene.appendChild(cylinder);
```

#### 相機與燈光 (Camera and Lighting)

```html
<a-camera position="0 1 4" cursor-visible="true" cursor-color="#0095DD" cursor-opacity="0.5">
</a-camera>

<a-light type="directional" color="white" intensity="0.5" position="-1 1 2"></a-light>
<a-light type="ambient" color="white"></a-light>
```

預設控制：WASD 鍵用於移動，滑鼠用於環視。VR 模式按鈕會出現在右下角。

#### 動畫 (Animation)

透過 HTML 屬性進行宣告式動畫：

```html
<a-box
  color="#0095DD"
  rotation="20 40 0"
  position="0 1 0"
  animation="property: rotation; from: 20 0 0; to: 20 360 0;
    dir: alternate; loop: true; dur: 4000; easing: easeInOutQuad;">
</a-box>
```

動畫屬性：`property`（要製作動畫的屬性）、`from`/`to`（起始/結束值）、`dir`（交替或正常）、`loop`（布林值）、`dur`（毫秒）、`easing`（緩動函式）。

透過 JavaScript 進行動態動畫：

```javascript
let t = 0;
function render() {
  t += 0.01;
  requestAnimationFrame(render);
  cylinder.setAttribute("position", `3 ${Math.sin(t * 2) + 1} 0`);
}
render();
```

#### 實務技巧 (Practical Tips)

- A-Frame 非常適合使用熟悉的 HTML 語法進行快速 VR/AR 原型設計。
- 實體元件架構使其具備高度擴充性；社群外掛程式可增加物理、遊戲手把控制等功能。
- 使用 `<a-sky>` 設定背景顏色或 360 度影像。
- A-Frame 支援桌面端、行動端 (iOS/Android) 以及 VR 頭戴式裝置 (Meta Quest, HTC Vive)。

---

### PlayCanvas

PlayCanvas 是一款 WebGL 遊戲引擎，具備兩種工作流選項：

1. **引擎方式** — 直接在 HTML 中包含 PlayCanvas JavaScript 函式庫並從頭開始編碼。
2. **編輯器方式** — 使用線上拖放式視覺化編輯器進行場景組合。

#### 關鍵特色 (Key Features)

- 實體元件系統架構
- 由 [ammo.js](https://github.com/kripken/ammo.js/) 提供支援的內建物理引擎
- 碰撞偵測
- 音訊支援
- 輸入處理（鍵盤、滑鼠、觸控、遊戲手把）
- 資源/資產管理

#### 實務技巧 (Practical Tips)

- 得益於其具備即時協作功能的線上編輯器，PlayCanvas 非常適合團隊導向的遊戲開發。
- 僅限引擎的方式非常輕量，可以嵌入到任何網頁中。
- 關於實體、元件、相機、燈光、材質與動畫的教學，請參考 [PlayCanvas 開發者文件](https://developer.playcanvas.com/)。

---

## GLSL 著色器 (GLSL Shaders)

GLSL (OpenGL Shading Language) 是一種類似 C 的語言，可直接在 GPU 上執行，進而實現對轉譯管線之頂點與片段處理階段的自訂控制。

### 什麼是著色器 (What Shaders Are)

著色器是在 GPU 而非 CPU 上執行的小型程式。它們是強型別的，且高度依賴向量與矩陣數學。與 WebGL 相關的著色器有兩種類型：

- **頂點著色器 (Vertex shader)** — 每個頂點執行一次，將 3D 位置轉換為螢幕座標。
- **片段著色器 (Fragment shader)** (像素著色器) — 每個像素執行一次，確定最終的 RGBA 顏色。

### 頂點著色器 (Vertex Shader)

頂點著色器的工作是設定 `gl_Position`，這是一個儲存頂點轉換後位置的內建 GLSL 變數：

```glsl
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, position.z, 1.0);
}
```

- `projectionMatrix` — 處理透視或正交投影（由 Three.js 提供）。
- `modelViewMatrix` — 結合模型與檢視轉換（由 Three.js 提供）。
- `vec4(x, y, z, w)` — 一個 4 分量向量；對於位置頂點，`w` 預設為 1.0。

您可以直接操縱頂點：

```glsl
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x + 10.0, position.y, position.z + 5.0, 1.0);
}
```

### 片段著色器 (Fragment Shader)

片段著色器的工作是設定 `gl_FragColor`，這是一個持有 RGBA 顏色的內建 GLSL 變數：

```glsl
void main() {
  gl_FragColor = vec4(0.0, 0.58, 0.86, 1.0);
}
```

RGBA 分量是從 0.0 到 1.0 的浮點數。Alpha 0.0 為完全透明；1.0 為完全不透明。

### 在 HTML 和 Three.js 中使用著色器 (Using Shaders in HTML and Three.js)

使用具有自訂類型屬性的 script 標記嵌入著色器原始碼：

```html
<script id="vertexShader" type="x-shader/x-vertex">
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
</script>

<script id="fragmentShader" type="x-shader/x-fragment">
  void main() {
    gl_FragColor = vec4(0.0, 0.58, 0.86, 1.0);
  }
</script>
```

使用 `ShaderMaterial` 套用它們：

```javascript
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShader").textContent,
});

const cube = new THREE.Mesh(boxGeometry, shaderMaterial);
```

### 著色器管線 (The Shader Pipeline)

1. **頂點著色器** 處理每個頂點並輸出 `gl_Position`。
2. **點陣化** 將 3D 座標對應到 2D 螢幕像素。
3. **片段著色器** 處理每個像素並輸出 `gl_FragColor`。

### 關鍵概念 (Key Concepts)

- **Uniforms** — 從 JavaScript 傳遞給著色器的值，在單次繪圖呼叫中對所有頂點/片段保持不變（例如：燈光位置、時間）。
- **Attributes** — 傳遞給頂點著色器的逐頂點資料（例如：位置、法線、UV 座標）。
- **Varyings** — 從頂點著色器傳遞給片段著色器的值，在表面上進行內插 (interpolated)。

### 實務技巧 (Practical Tips)

- 著色器執行於 GPU 並減輕 CPU 的計算負擔，這對於即時效能至關重要。
- Three.js、Babylon.js 和其他框架對大部分著色器設定進行了抽象化；純 WebGL 需要明顯更多的樣板程式碼。
- [ShaderToy](https://www.shadertoy.com/) 是獲取著色器範例與靈感的絕佳資源。
- GLSL 要求明確的型別宣告；對於浮點數，請一律使用 `1.0` 而非 `1`。

---

## 碰撞偵測 (Collision Detection)

碰撞偵測用於判斷 3D 物件何時相交，這對於遊戲物理、互動以及遊戲邏輯至關重要。

### 軸對齊邊界框 (Axis-Aligned Bounding Boxes, AABB)

AABB 使用一個與座標軸對齊、不旋轉的矩形方框包圍物件。它是最快的常用碰撞測試方式，因為它僅使用邏輯比較（無須三角函數）。

**限制**：AABB 不會隨物件旋轉。對於旋轉實體，請在每影格調整邊界框大小或改用邊界球。

#### 點 vs. AABB (Point vs. AABB)

透過測試所有三個軸來檢查點是否位於方框內部：

```javascript
function isPointInsideAABB(point, box) {
  return (
    point.x >= box.minX &&
    point.x <= box.maxX &&
    point.y >= box.minY &&
    point.y <= box.maxY &&
    point.z >= box.minZ &&
    point.z <= box.maxZ
  );
}
```

#### AABB vs. AABB

檢查兩個方框是否在所有三個軸上重疊：

```javascript
function intersect(a, b) {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}
```

### 邊界球 (Bounding Spheres)

邊界球對旋轉是不變的（無論物件如何旋轉，球體都保持不變），這使其成為旋轉實體的理想選擇。然而，它們與非球形形狀的契合度較差，且會導致較多誤報 (false positives)。

#### 點 vs. 邊界球 (Point vs. Sphere)

檢查從點到球心的距離是否小於半徑：

```javascript
function isPointInsideSphere(point, sphere) {
  const distance = Math.sqrt(
    (point.x - sphere.x) ** 2 +
    (point.y - sphere.y) ** 2 +
    (point.z - sphere.z) ** 2
  );
  return distance < sphere.radius;
}
```

**效能最佳化**：透過比較平方距離來避免平方根運算：

```javascript
const distanceSqr =
  (point.x - sphere.x) ** 2 +
  (point.y - sphere.y) ** 2 +
  (point.z - sphere.z) ** 2;
return distanceSqr < sphere.radius * sphere.radius;
```

#### 邊界球 vs. 邊界球 (Sphere vs. Sphere)

檢查中心點之間的距離是否小於半徑之和：

```javascript
function intersect(sphere, other) {
  const distance = Math.sqrt(
    (sphere.x - other.x) ** 2 +
    (sphere.y - other.y) ** 2 +
    (sphere.z - other.z) ** 2
  );
  return distance < sphere.radius + other.radius;
}
```

#### 邊界球 vs. AABB (Sphere vs. AABB)

透過限制 (clamping) 找到 AABB 上距離球心最近的點，然後檢查距離：

```javascript
function intersect(sphere, box) {
  const x = Math.max(box.minX, Math.min(sphere.x, box.maxX));
  const y = Math.max(box.minY, Math.min(sphere.y, box.maxY));
  const z = Math.max(box.minZ, Math.min(sphere.z, box.maxZ));

  const distance = Math.sqrt(
    (x - sphere.x) ** 2 +
    (y - sphere.y) ** 2 +
    (z - sphere.z) ** 2
  );

  return distance < sphere.radius;
}
```

### 使用 Three.js 進行碰撞偵測 (Collision Detection with Three.js)

Three.js 提供內建的 `Box3` 和 `Sphere` 物件，以及用於邊界體積碰撞偵測的視覺輔助程式。

#### 建立邊界體積 (Creating Bounding Volumes)

```javascript
// 從物件建立 Box3（建議使用 — 考慮了轉換與子物件）
const knotBBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
knotBBox.setFromObject(knot);

// 從幾何圖形建立 Sphere
const knotBSphere = new THREE.Sphere(
  knot.position,
  knot.geometry.boundingSphere.radius
);
```

**重要**：`setFromObject()` 考慮了位置、旋轉、縮放以及子網格。幾何圖形的 `boundingBox` 屬性則沒有。

#### 交集測試 (Intersection Tests)

```javascript
// 點在方框或球體內
knotBBox.containsPoint(point);
knotBSphere.containsPoint(point);

// 方框 vs. 方框
knotBBox.intersectsBox(otherBox);

// 球體 vs. 球體
knotBSphere.intersectsSphere(otherSphere);
```

注意：`containsBox()` 檢查一個方框是否完全包含另一個，這與 `intersectsBox()` 不同。

#### 邊界球 vs. Box3（自訂修補） (Sphere vs. Box3 (Custom Patch))

Three.js 原生不提供球體對抗方框的測試。請手動增加：

```javascript
THREE.Sphere.__closest = new THREE.Vector3();
THREE.Sphere.prototype.intersectsBox = function (box) {
  THREE.Sphere.__closest.set(this.center.x, this.center.y, this.center.z);
  THREE.Sphere.__closest.clamp(box.min, box.max);
  const distance = this.center.distanceToSquared(THREE.Sphere.__closest);
  return distance < this.radius * this.radius;
};
```

#### 用於視覺化偵錯的 BoxHelper (BoxHelper for Visual Debugging)

`BoxHelper` 為任何網格建立可見的線框邊界框，並簡化更新：

```javascript
const knotBoxHelper = new THREE.BoxHelper(knot, 0x00ff00);
scene.add(knotBoxHelper);

// 移動或旋轉網格後，更新輔助程式
knot.position.set(-3, 2, 1);
knot.rotation.x = -Math.PI / 4;
knotBoxHelper.update();

// 轉換為 Box3 進行交集測試
const box3 = new THREE.Box3();
box3.setFromObject(knotBoxHelper);
box3.intersectsBox(otherBox3);
```

BoxHelper 的優點：隨 `update()` 自動調整大小、包含子網格、提供視覺化偵錯。限制：僅限方框體積（無球體輔助程式）。

### 物理引擎 (Physics Engines)

如需更精密的碰撞偵測與反應，請使用物理引擎：

- **Cannon.js** — JavaScript 的開源 3D 物理引擎。
- **ammo.js** — Bullet 物理函式庫的 JavaScript 移植版（PlayCanvas 使用）。

物理引擎會建立一個附加到視覺網格的 *物理主體 (physical body)*，其具有速度、位置、旋轉和扭矩等屬性。*物理形狀 (physical shape)*（方框、球體、凸包）用於物理計算。

### 實務技巧 (Practical Tips)

- 針對軸對齊、不旋轉的物件使用 AABB — 它們是最快的選項。
- 針對旋轉物件使用邊界球 — 球體對於旋轉是不變的。
- 對於複雜形狀，考慮使用複合邊界體積（多個基元組合）。
- 避免在緊密迴圈中使用 `Math.sqrt()`；改為比較平方距離。
- 對於生產環境的遊戲，請整合物理引擎，而非從頭編寫碰撞偵測。

---

## WebXR

WebXR 是現代網頁 API，用於在瀏覽器中建構虛擬實境 (VR) 和擴增實境 (AR) 體驗。它取代了已過時的 WebVR API。

### 什麼是 WebXR (What WebXR Is)

WebXR Device API 提供對 XR 硬體（頭戴式裝置、控制器）的存取，並實現立體轉譯。它擷取即時資料，包括：

- 頭戴式裝置的位置和定向
- 控制器的位置、定向、速度和加速度
- 來自 XR 控制器的輸入事件

### 支援的裝置 (Supported Devices)

- Meta Quest
- Valve Index
- PlayStation VR (PSVR2)
- 任何具有相容 WebXR 瀏覽器的裝置

### 核心概念 (Core Concepts)

每個 WebXR 體驗都需要兩樣東西：

1. **即時位置資料** — 應用程式持續接收頭戴式裝置和控制器在 3D 空間中的位置。
2. **即時立體轉譯** — 應用程式將兩個略微偏移的檢視（每隻眼睛一個）轉譯到頭戴式裝置的顯示器上。

### 框架支援 (Framework Support)

所有主要的 3D 網頁框架都支援 WebXR：

- **A-Frame** — 內建 VR 模式按鈕；宣告式的、以 HTML 為基礎的場景會自動在 VR 中運作。
- **Three.js** — 透過 `renderer.xr` 提供 WebXR 整合。請參閱 [Three.js VR 文件](https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content)。
- **Babylon.js** — 透過 XR Experience Helper 提供內建 WebXR 支援。

### 相關 API (Related APIs)

- **Gamepad API** — 用於非 XR 控制器輸入（遊戲手把、搖桿）。
- **Device Orientation API** — 用於在行動裝置上偵測裝置旋轉。

### 設計原則 (Design Principles)

- 將 **沉浸感** 優先於原始圖形品質或遊戲複雜度。
- 使用者必須感覺自己是 *體驗的一部分*。
- 以高且穩定的影格率轉譯的基本形狀，在 VR 中可能比以不穩定影格率轉譯的細緻圖形更具吸引力。
- 實驗至關重要；請經常在實際硬體上進行測試。

### 實務技巧 (Practical Tips)

- 從 A-Frame 開始進行快速 VR 原型設計 — 其宣告式 HTML 方法可讓您在幾分鐘內完成一個可運作的 VR 場景。
- 當您需要更多轉譯與效能控制權時，請使用 Three.js 或 Babylon.js。
- 務必在真實的頭戴式裝置上進行測試；其體驗與桌面預覽截然不同。
- 維持穩定、高影格率 (72-90+ FPS) 以防止動暈症。
- 完整的 API 參考請參閱 [MDN WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)。
