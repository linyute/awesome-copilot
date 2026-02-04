# Excalidraw 元素類型指南

每個 Excalidraw 元素類型的詳細規格，包含視覺範例和使用案例。

## 元素類型概覽

| 類型 | 視覺 | 主要用途 | 文字支援 |
|------|--------|-------------|--------------|
| `rectangle` | □ | 方框、容器、流程步驟 | ✅ 是 |
| `ellipse` | ○ | 強調、終端、狀態 | ✅ 是 |
| `diamond` | ◇ | 決策點、選擇 | ✅ 是 |
| `arrow` | → | 方向流、關聯 | ❌ 否（使用個別文字） |
| `line` | — | 連接、分隔線 | ❌ 否 |
| `text` | A | 標籤、註釋、標題 | ✅（其本身用途） |

---

## 矩形 (Rectangle)

**最適合：** 流程步驟、實體、資料儲存、元件

### 屬性

```typescript
{
  type: "rectangle",
  roundness: { type: 3 },  // 圓角
  text: "步驟名稱",        // 選用的嵌入文字
  fontSize: 20,
  textAlign: "center",
  verticalAlign: "middle"
}
```

### 使用案例

| 場景 | 組態 |
|----------|---------------|
| **流程步驟** | 綠色背景 (`#b2f2bb`)，文字居中 |
| **實體/物件** | 藍色背景 (`#a5d8ff`)，中等大小 |
| **系統元件** | 淺色，描述性文字 |
| **資料儲存** | 灰色/白色，資料庫樣式標籤 |

### 大小指南

| 內容 | 寬度 | 高度 |
|---------|-------|--------|
| 單一單字 | 120-150px | 60-80px |
| 短語 (2-4 個字) | 180-220px | 80-100px |
| 句子 | 250-300px | 100-120px |

### 範例

```json
{
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 80,
  "backgroundColor": "#b2f2bb",
  "text": "驗證輸入",
  "fontSize": 20,
  "textAlign": "center",
  "verticalAlign": "middle",
  "roundness": { "type": 3 }
}
```

---

## 橢圓 (Ellipse)

**最適合：** 起點/終點、狀態、強調圓圈

### 屬性

```typescript
{
  type: "ellipse",
  text: "開始",
  fontSize: 18,
  textAlign: "center",
  verticalAlign: "middle"
}
```

### 使用案例

| 場景 | 組態 |
|----------|---------------|
| **流程開始** | 淺綠色，「開始」文字 |
| **流程結束** | 淺紅色，「結束」文字 |
| **狀態** | 柔和顏色，狀態名稱 |
| **強調** | 明亮顏色，強調文字 |

### 大小指南

對於圓形，使用 `width === height`：

| 內容 | 直徑 |
|---------|----------|
| 圖示/符號 | 60-80px |
| 短文字 | 100-120px |
| 長文字 | 150-180px |

### 範例

```json
{
  "type": "ellipse",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 120,
  "backgroundColor": "#d0f0c0",
  "text": "開始",
  "fontSize": 18,
  "textAlign": "center",
  "verticalAlign": "middle"
}
```

---

## 菱形 (Diamond)

**最適合：** 決策點、條件分支

### 屬性

```typescript
{
  type: "diamond",
  text: "有效？",
  fontSize: 18,
  textAlign: "center",
  verticalAlign: "middle"
}
```

### 使用案例

| 場景 | 文字範例 |
|----------|--------------|
| **是/否決策** | 「有效？」、「存在？」 |
| **多重選擇** | 「類型？」、「狀態？」 |
| **條件式** | 「分數 > 50？」 |

### 大小指南

菱形比矩形需要更多空間來容納相同的文字：

| 內容 | 寬度 | 高度 |
|---------|-------|--------|
| 是/否 | 120-140px | 120-140px |
| 短問題 | 160-180px | 160-180px |
| 長問題 | 200-220px | 200-220px |

### 範例

```json
{
  "type": "diamond",
  "x": 100,
  "y": 100,
  "width": 150,
  "height": 150,
  "backgroundColor": "#ffe4a3",
  "text": "有效？",
  "fontSize": 18,
  "textAlign": "center",
  "verticalAlign": "middle"
}
```

---

## 箭頭 (Arrow)

**最適合：** 流向、關聯、依賴關係

### 屬性

```typescript
{
  type: "arrow",
  points: [[0, 0], [endX, endY]],  // 相對座標
  roundness: { type: 2 },          // 彎曲
  startBinding: null,              // 或 { elementId, focus, gap }
  endBinding: null
}
```

### 箭頭方向

#### 水平（從左到右）

```json
{
  "x": 100,
  "y": 150,
  "width": 200,
  "height": 0,
  "points": [[0, 0], [200, 0]]
}
```

#### 垂直（從上到下）

```json
{
  "x": 200,
  "y": 100,
  "width": 0,
  "height": 150,
  "points": [[0, 0], [0, 150]]
}
```

#### 對角線

```json
{
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150,
  "points": [[0, 0], [200, 150]]
}
```

### 箭頭樣式

| 樣式 | `strokeStyle` | `strokeWidth` | 使用案例 |
|-------|---------------|---------------|----------|
| **一般流程** | `"solid"` | 2 | 標準連接 |
| **選用/弱** | `"dashed"` | 2 | 選用路徑 |
| **重要** | `"solid"` | 3-4 | 強調流程 |
| **點線** | `"dotted"` | 2 | 間接關聯 |

### 新增箭頭標籤

使用放置在箭頭中點附近的個別文字元素：

```json
[
  {
    "type": "arrow",
    "id": "arrow1",
    "x": 100,
    "y": 150,
    "points": [[0, 0], [200, 0]]
  },
  {
    "type": "text",
    "x": 180,      // 中點附近
    "y": 130,      // 箭頭上方
    "text": "sends",
    "fontSize": 14
  }
]
```

---

## 線條 (Line)

**最適合：** 無方向性連接、分隔線、邊框

### 屬性

```typescript
{
  type: "line",
  points: [[0, 0], [x2, y2], [x3, y3], ...],
  roundness: null  // 或 { type: 2 } 用於彎曲
}
```

### 使用案例

| 場景 | 組態 |
|----------|---------------|
| **分隔線** | 水平，細線條 |
| **邊框** | 封閉路徑（多邊形） |
| **連接** | 多點路徑 |
| **底線** | 短水平線 |

### 多點線條範例

```json
{
  "type": "line",
  "x": 100,
  "y": 100,
  "points": [
    [0, 0],
    [100, 50],
    [200, 0]
  ]
}
```

---

## 文字 (Text)

**最適合：** 標籤、標題、註釋、獨立文字

### 屬性

```typescript
{
  type: "text",
  text: "標籤文字",
  fontSize: 20,
  fontFamily: 1,        // 1=Virgil, 2=Helvetica, 3=Cascadia
  textAlign: "left",
  verticalAlign: "top"
}
```

### 依用途劃分的字型大小

| 用途 | 字型大小 |
|---------|-----------|
| **主要標題** | 28-36 |
| **章節標題** | 24-28 |
| **元素標籤** | 18-22 |
| **註釋** | 14-16 |
| **小筆記** | 12-14 |

### 寬度/高度計算

```javascript
// 大約寬度
const width = text.length * fontSize * 0.6;

// 大約高度（單行）
const height = fontSize * 1.2;

// 多行
const lines = text.split('
').length;
const height = fontSize * 1.2 * lines;
```

### 文字定位

| 位置 | textAlign | verticalAlign | 使用案例 |
|----------|-----------|---------------|----------|
| **左上** | `"left"` | `"top"` | 預設標籤 |
| **居中** | `"center"` | `"middle"` | 標題 |
| **右下** | `"right"` | `"bottom"` | 腳註 |

### 範例：標題

```json
{
  "type": "text",
  "x": 100,
  "y": 50,
  "width": 400,
  "height": 40,
  "text": "系統架構",
  "fontSize": 32,
  "fontFamily": 2,
  "textAlign": "center",
  "verticalAlign": "top"
}
```

### 範例：註釋

```json
{
  "type": "text",
  "x": 150,
  "y": 200,
  "width": 100,
  "height": 20,
  "text": "使用者輸入",
  "fontSize": 14,
  "fontFamily": 1,
  "textAlign": "left",
  "verticalAlign": "top"
}
```

---

## 組合元素

### 模式：有標籤的方框

```json
[
  {
    "type": "rectangle",
    "id": "box1",
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 100,
    "text": "元件",
    "textAlign": "center",
    "verticalAlign": "middle"
  }
]
```

### 模式：已連接的方框

```json
[
  {
    "type": "rectangle",
    "id": "box1",
    "x": 100,
    "y": 100,
    "width": 150,
    "height": 80,
    "text": "步驟 1"
  },
  {
    "type": "arrow",
    "id": "arrow1",
    "x": 250,
    "y": 140,
    "points": [[0, 0], [100, 0]]
  },
  {
    "type": "rectangle",
    "id": "box2",
    "x": 350,
    "y": 100,
    "width": 150,
    "height": 80,
    "text": "步驟 2"
  }
]
```

### 模式：決策樹

```json
[
  {
    "type": "diamond",
    "id": "decision",
    "x": 100,
    "y": 100,
    "width": 140,
    "height": 140,
    "text": "有效？"
  },
  {
    "type": "arrow",
    "id": "yes-arrow",
    "x": 240,
    "y": 170,
    "points": [[0, 0], [60, 0]]
  },
  {
    "type": "text",
    "id": "yes-label",
    "x": 250,
    "y": 150,
    "text": "是",
    "fontSize": 14
  },
  {
    "type": "rectangle",
    "id": "yes-box",
    "x": 300,
    "y": 140,
    "width": 120,
    "height": 60,
    "text": "處理"
  }
]
```

---

## 摘要

| 當您需要... | 使用此元素 |
|------------------|------------------|
| 流程方框 | 帶文字的 `rectangle` |
| 決策點 | 帶問題的 `diamond` |
| 流向 | `arrow` |
| 開始/結束 | `ellipse` |
| 標題/標頭 | `text` (大字型) |
| 註釋 | `text` (小字型) |
| 無方向性連結 | `line` |
| 分隔線 | `line` (水平) |
