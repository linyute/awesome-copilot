# Excalidraw JSON 結構描述參考

本文件描述了用於生成圖表的 Excalidraw `.excalidraw` 檔案結構。

## 最上層結構

```typescript
interface ExcalidrawFile {
  type: "excalidraw";
  version: number;           // 始終為 2
  source: string;            // "https://excalidraw.com"
  elements: ExcalidrawElement[];
  appState: AppState;
  files: Record<string, any>; // 通常為空 {}
}
```

## AppState

```typescript
interface AppState {
  viewBackgroundColor: string; // 十六進位顏色，例如 "#ffffff"
  gridSize: number;            // 通常為 20
}
```

## ExcalidrawElement 基礎屬性

所有元素都共用這些屬性：

```typescript
interface BaseElement {
  id: string;                  // 唯一識別碼
  type: ElementType;           // 參見下方的元素類型
  x: number;                   // X 座標（相對於左上角的像素）
  y: number;                   // Y 座標（相對於左上角的像素）
  width: number;               // 寬度（像素）
  height: number;              // 高度（像素）
  angle: number;               // 旋轉角度（弧度，通常為 0）
  strokeColor: string;         // 十六進位顏色，例如 "#1e1e1e"
  backgroundColor: string;     // 十六進位顏色或 "transparent"
  fillStyle: "solid" | "hachure" | "cross-hatch";
  strokeWidth: number;         // 通常為 1-4
  strokeStyle: "solid" | "dashed" | "dotted";
  roughness: number;           // 0-2，控制手繪效果（預設為 1）
  opacity: number;             // 0-100
  groupIds: string[];          // 此元素所屬群組的 ID
  frameId: null;               // 通常為 null
  index: string;               // 堆疊順序識別碼
  roundness: Roundness | null;
  seed: number;                // 用於確定性渲染的隨機種子
  version: number;             // 元素版本（編輯時遞增）
  versionNonce: number;        // 編輯時變更的隨機數
  isDeleted: boolean;          // 應為 false
  boundElements: any;          // 通常為 null
  updated: number;             // 毫秒級時間戳記
  link: null;                  // 外部連結（通常為 null）
  locked: boolean;             // 元素是否已鎖定
}
```

## 元素類型

### 矩形 (Rectangle)

```typescript
interface RectangleElement extends BaseElement {
  type: "rectangle";
  roundness: { type: 3 };      // 3 = 圓角
  text?: string;               // 內部的選用文字
  fontSize?: number;           // 字型大小（通常為 16-32）
  fontFamily?: number;         // 1 = Virgil, 2 = Helvetica, 3 = Cascadia
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}
```

**範例：**
```json
{
  "id": "rect1",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 100,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#a5d8ff",
  "text": "我的方框",
  "fontSize": 20,
  "textAlign": "center",
  "verticalAlign": "middle",
  "roundness": { "type": 3 }
}
```

### 橢圓 (Ellipse)

```typescript
interface EllipseElement extends BaseElement {
  type: "ellipse";
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}
```

### 菱形 (Diamond)

```typescript
interface DiamondElement extends BaseElement {
  type: "diamond";
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}
```

### 箭頭 (Arrow)

```typescript
interface ArrowElement extends BaseElement {
  type: "arrow";
  points: [number, number][];  // 相對於元素的 [x, y] 座標陣列
  startBinding: Binding | null;
  endBinding: Binding | null;
  roundness: { type: 2 };      // 2 = 彎曲箭頭
}
```

**範例：**
```json
{
  "id": "arrow1",
  "type": "arrow",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 0,
  "points": [
    [0, 0],
    [200, 0]
  ],
  "roundness": { "type": 2 },
  "startBinding": null,
  "endBinding": null
}
```

**點 (Points) 說明：**
- 第一個點 `[0, 0]` 是相對於 `(x, y)` 的座標
- 後續的點都是相對於第一個點的座標
- 對於水平直箭頭：`[[0, 0], [width, 0]]`
- 對於垂直直箭頭：`[[0, 0], [0, height]]`

### 線條 (Line)

```typescript
interface LineElement extends BaseElement {
  type: "line";
  points: [number, number][];
  startBinding: Binding | null;
  endBinding: Binding | null;
  roundness: { type: 2 } | null;
}
```

### 文字 (Text)

```typescript
interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: number;          // 1-3
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  roundness: null;             // 文字沒有圓角屬性
}
```

**範例：**
```json
{
  "id": "text1",
  "type": "text",
  "x": 100,
  "y": 100,
  "width": 150,
  "height": 25,
  "text": "Hello World",
  "fontSize": 20,
  "fontFamily": 1,
  "textAlign": "left",
  "verticalAlign": "top",
  "roundness": null
}
```

**寬度/高度計算：**
- 寬度 ≈ `text.length * fontSize * 0.6`
- 高度 ≈ `fontSize * 1.2 * 行數`

## 連結 (Bindings)

連結用於將箭頭連接到形狀：

```typescript
interface Binding {
  elementId: string;           // 受連結元素的 ID
  focus: number;               // -1 到 1，沿著邊緣的位置
  gap: number;                 // 與元素邊緣的距離
}
```

## 常見顏色

| 顏色名稱 | 十六進位代碼 | 使用案例 |
|------------|----------|----------|
| 黑色 | `#1e1e1e` | 預設線條 |
| 淺藍色 | `#a5d8ff` | 主要實體 |
| 淺綠色 | `#b2f2bb` | 流程步驟 |
| 黃色 | `#ffd43b` | 重要/中心 |
| 淺紅色 | `#ffc9c9` | 警告/錯誤 |
| 青色 | `#96f2d7` | 次要項目 |
| 透明 | `transparent` | 無填充 |
| 白色 | `#ffffff` | 背景 |

## ID 生成

ID 應為唯一字串。常見模式：

```javascript
// 基於時間戳記
const id = Date.now().toString(36) + Math.random().toString(36).substr(2);

// 順序生成
const id = "element-" + counter++;

// 描述性名稱
const id = "step-1", "entity-user", "arrow-1-to-2";
```

## 種子生成 (Seed Generation)

種子用於手繪效果中的確定性隨機性：

```javascript
const seed = Math.floor(Math.random() * 2147483647);
```

## 版本 (Version) 和 VersionNonce

```javascript
const version = 1;  // 編輯元素時遞增
const versionNonce = Math.floor(Math.random() * 2147483647);
```

## 座標系統

- 原點 `(0, 0)` 為左上角
- X 向右增加
- Y 向下增加
- 所有單位均為像素

## 建議間距

| 場景 | 間距 |
|---------|---------|
| 元素之間的水平間距 | 200-300px |
| 行之間的垂直間距 | 100-150px |
| 與邊緣的最小距離 | 50px |
| 箭頭與方框的間隔 | 20-30px |

## 字型系列 (Font Families)

| ID | 名稱 | 描述 |
|----|------|-------------|
| 1 | Virgil | 手繪風格（預設） |
| 2 | Helvetica | 整潔的無襯線字體 |
| 3 | Cascadia | 等寬字體 |

## 驗證規則

✅ **必要項：**
- 所有 ID 必須唯一
- `type` 必須與實際元素類型相符
- `version` 必須為 ≥ 1 的整數
- `opacity` 必須在 0-100 之間

⚠️ **建議項：**
- 為了保持一致性，將 `roughness` 設為 1
- 為了清晰起見，使用寬度為 2 的 `strokeWidth`
- 將 `isDeleted` 設為 `false`
- 將 `locked` 設為 `false`
- 將 `frameId`、`boundElements`、`link` 保持為 `null`

## 完整最小範例

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "box1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a0",
      "roundness": { "type": 3 },
      "seed": 1234567890,
      "version": 1,
      "versionNonce": 987654321,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1706659200000,
      "link": null,
      "locked": false,
      "text": "你好",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle"
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```
