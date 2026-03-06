# 媒體與圖形參考 (Media & Graphics Reference)

網頁的多媒體內容、圖形以及相關技術。

## 圖片格式

### JPEG/JPG

用於照片的失真壓縮。

**特性**：
- 適合照片
- 不支援透明度
- 檔案較小
- 編輯後品質會下降

**用法**：
```html
<img src="photo.jpg" alt="照片">
```

### PNG

支援透明度的無損壓縮。

**特性**：
- 支援 Alpha 色版（透明度）
- 檔案大小大於 JPEG
- 適合標誌、圖形、螢幕截圖
- PNG-8 (256 色) 與 PNG-24 (1600 萬色)

```html
<img src="logo.png" alt="標誌">
```

### WebP

具備更佳壓縮率的現代格式。

**特性**：
- 檔案比 JPEG/PNG 小
- 支援透明度
- 支援動畫
- 舊版瀏覽器不支援

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="後備圖片">
</picture>
```

### AVIF

次世代圖片格式。

**特性**：
- 壓縮率優於 WebP
- 支援 HDR
- 編碼速度較慢
- 瀏覽器支援度有限

### GIF

動畫圖片（色彩有限）。

**特性**：
- 最高 256 色
- 支援動畫
- 簡單的透明度（無 Alpha）
- 請考慮現代替代方案（影片、WebP）

### SVG (可縮放向量圖形)

基於 XML 的向量圖形。

**特性**：
- 縮放不失真
- 簡單圖形的檔案極小
- 可透過 CSS/JS 操作
- 支援動畫

```html
<!-- 行內 SVG -->
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>

<!-- 外部 SVG -->
<img src="icon.svg" alt="圖示">
```

**建立 SVG**：
```html
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- 矩形 -->
  <rect x="10" y="10" width="80" height="60" fill="red" />
  
  <!-- 圓形 -->
  <circle cx="150" cy="40" r="30" fill="blue" />
  
  <!-- 路徑 -->
  <path d="M10 100 L100 100 L50 150 Z" fill="green" />
  
  <!-- 文字 -->
  <text x="50" y="180" font-size="20">Hello SVG</text>
</svg>
```

## Canvas API

2D 點陣圖 (Bitmap) 圖形。

### 基本設定

```html
<canvas id="myCanvas" width="400" height="300"></canvas>
```

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// 繪製矩形
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 50);

// 繪製圓形
ctx.beginPath();
ctx.arc(200, 150, 50, 0, Math.PI * 2);
ctx.fillStyle = 'blue';
ctx.fill();

// 繪製線條
ctx.beginPath();
ctx.moveTo(50, 200);
ctx.lineTo(350, 250);
ctx.strokeStyle = 'green';
ctx.lineWidth = 3;
ctx.stroke();

// 繪製文字
ctx.font = '30px Arial';
ctx.fillStyle = 'black';
ctx.fillText('Hello Canvas', 50, 100);

// 繪製圖片
const img = new Image();
img.onload = () => {
  ctx.drawImage(img, 0, 0);
};
img.src = 'image.jpg';
```

### Canvas 方法

```javascript
// 路徑
ctx.beginPath();
ctx.moveTo(x, y);
ctx.lineTo(x, y);
ctx.arc(x, y, radius, startAngle, endAngle);
ctx.closePath();
ctx.fill();
ctx.stroke();

// 轉換 (Transforms)
ctx.translate(x, y);
ctx.rotate(angle);
ctx.scale(x, y);
ctx.save(); // 儲存狀態
ctx.restore(); // 還原狀態

// 組合 (Compositing)
ctx.globalAlpha = 0.5;
ctx.globalCompositeOperation = 'source-over';

// 匯出
const dataURL = canvas.toDataURL('image/png');
canvas.toBlob(blob => {
  // 使用 blob
}, 'image/png');
```

## WebGL

瀏覽器中的 3D 圖形。

**使用案例**：
- 3D 視覺化
- 遊戲
- 資料視覺化
- VR/AR

**函式庫**：
- **Three.js**：簡易 3D 圖形
- **Babylon.js**：遊戲引擎
- **PixiJS**：2D WebGL 算圖器

```javascript
// Three.js 範例
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 建立立方體
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// 算圖迴圈 (Render loop)
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

## 影片

### HTML5 Video 元件

```html
<video controls width="640" height="360">
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  您的瀏覽器不支援影片播放。
</video>
```

**屬性**：
- `controls`：顯示播放控制項
- `autoplay`：自動開始播放
- `loop`：重複播放
- `muted`：靜音
- `poster`：縮圖
- `preload`：none/metadata/auto

### 影片格式

- **MP4 (H.264)**：支援最廣泛
- **WebM (VP8/VP9)**：開放格式
- **Ogg (Theora)**：開放格式

### JavaScript 控制

```javascript
const video = document.querySelector('video');

// 播放控制
video.play();
video.pause();
video.currentTime = 10; // 跳至 10 秒處

// 屬性
video.duration; // 總時長
video.currentTime; // 目前位置
video.paused; // 是否已暫停？
video.volume = 0.5; // 0.0 至 1.0
video.playbackRate = 1.5; // 播放速度

// 事件
video.addEventListener('play', () => {});
video.addEventListener('pause', () => {});
video.addEventListener('ended', () => {});
video.addEventListener('timeupdate', () => {});
```

## 音訊

### HTML5 Audio 元件

```html
<audio controls>
  <source src="audio.mp3" type="audio/mpeg">
  <source src="audio.ogg" type="audio/ogg">
</audio>
```

### 音訊格式

- **MP3**：支援最廣泛
- **AAC**：品質佳
- **Ogg Vorbis**：開放格式
- **WAV**：無壓縮

### Web Audio API

進階音訊處理：

```javascript
const audioContext = new AudioContext();

// 載入音訊
fetch('audio.mp3')
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
  .then(audioBuffer => {
    // 建立來源
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // 建立增益節點 (音量)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;
    
    // 連接：來源 -> 增益 -> 目的地
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 播放
    source.start();
  });
```

## 回應式圖片

### srcset 與 sizes

```html
<!-- 不同解析度 -->
<img src="image-800.jpg"
     srcset="image-400.jpg 400w,
             image-800.jpg 800w,
             image-1200.jpg 1200w"
     sizes="(max-width: 600px) 100vw,
            (max-width: 900px) 50vw,
            800px"
     alt="回應式圖片">

<!-- 像素密度 -->
<img src="image.jpg"
     srcset="image.jpg 1x,
             image@2x.jpg 2x,
             image@3x.jpg 3x"
     alt="高 DPI 圖片">
```

### Picture 元件

藝術指導與格式切換：

```html
<picture>
  <!-- 不同格式 -->
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  
  <!-- 針對行動裝置/桌面端使用不同裁切 -->
  <source media="(max-width: 600px)" srcset="image-mobile.jpg">
  <source media="(min-width: 601px)" srcset="image-desktop.jpg">
  
  <!-- 後備圖片 -->
  <img src="image.jpg" alt="後備圖片">
</picture>
```

## 圖片最佳化

### 最佳實踐

1. **選擇正確格式**：
   - 相片：JPEG、WebP、AVIF
   - 圖形/標誌：PNG、SVG、WebP
   - 動畫：影片、WebP

2. **壓縮圖片**：
   - 使用壓縮工具
   - 平衡品質與檔案大小
   - 針對大圖使用漸進式 JPEG

3. **回應式圖片**：
   - 提供適當的大小
   - 使用 srcset/picture
   - 考慮裝置像素比

4. **延遲載入 (Lazy loading)**：
   ```html
   <img src="image.jpg" loading="lazy" alt="延遲載入">
   ```

5. **標註尺寸**：
   ```html
   <img src="image.jpg" width="800" height="600" alt="標註尺寸">
   ```

## 圖片載入技術

### 延遲載入 (Lazy Loading)

```html
<!-- 原生延遲載入 -->
<img src="image.jpg" loading="lazy" alt="圖片">

<!-- 使用 Intersection Observer -->
<img data-src="image.jpg" class="lazy" alt="圖片">
```

```javascript
const images = document.querySelectorAll('.lazy');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

images.forEach(img => observer.observe(img));
```

### 漸進式增強 (Progressive Enhancement)

```html
<!-- 低品質預留位置圖 -->
<img src="image-tiny.jpg"
     data-src="image-full.jpg"
     class="blur"
     alt="漸進式圖片">
```

## Favicon (網站圖示)

網站的圖示：

```html
<!-- 標準 -->
<link rel="icon" href="/favicon.ico" sizes="any">

<!-- 現代 -->
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- 多種大小 -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
```

## 多媒體最佳實踐

### 效能

- 最佳化檔案大小
- 使用適當格式
- 實作延遲載入
- 使用 CDN 進行傳遞
- 壓縮影片

### 無障礙性 (Accessibility)

- 為圖片提供替代文字 (Alt text)
- 為影片加入字幕
- 為音訊提供逐字稿
- 不要自動播放聲音
- 確保具備鍵盤控制項

### SEO

- 具描述性的檔名
- 包含關鍵字的替代文字
- 結構化資料 (schema.org)
- 圖片網站地圖 (Image sitemaps)

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- Alpha
- 基準線（圖片）(Baseline (image))
- 基準線（指令碼）(Baseline (scripting))
- Canvas
- Favicon
- JPEG
- 無損壓縮 (Lossless compression)
- 失真壓縮 (Lossy compression)
- PNG
- 漸進式增強 (Progressive enhancement)
- 品質值 (Quality values)
- 點陣圖 (Raster image)
- 轉譯/算圖 (Render)
- 算圖引擎 (Rendering engine)
- SVG
- 向量圖片 (Vector images)
- WebGL
- WebP

## 額外資源

- [MDN Canvas 教學](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [SVG 教學](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [WebGL 基礎](https://webglfundamentals.org/)
- [回應式圖片指南](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
