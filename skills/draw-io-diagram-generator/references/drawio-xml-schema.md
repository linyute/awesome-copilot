# draw.io XML 結構定義參考 (draw.io XML Schema Reference)

`.drawio` 檔案格式 (mxGraph XML) 的完整參考。在產生、解析或驗證圖表檔案時使用。

---

## 頂層結構 (Top-Level Structure)

每個 `.drawio` 檔案都是具有此根結構的 XML：

```xml
<!-- 產生新檔案時，將 modified 設定為目前的 ISO 8601 時間戳記 -->
<mxfile host="Electron" modified=""
        agent="draw.io" version="26.0.0" type="device">
  <diagram id="<unique-id>" name="<頁面名稱>">
    <mxGraphModel ...屬性...>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- 此處包含所有內容儲存格 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### `<mxfile>` 屬性

| 屬性 | 必要 | 預設值 | 描述 |
| ----------- | ---------- | --------- | ------------- |
| `host` | 否 | `"app.diagrams.net"` | 來源編輯器（桌面版/VS Code 為 `"Electron"`） |
| `modified` | 否 | — | ISO 8601 時間戳記 |
| `agent` | 否 | — | 使用者代理字串 (User agent string) |
| `version` | 否 | — | draw.io 版本 |
| `type` | 否 | `"device"` | 儲存類型 |

### `<diagram>` 屬性

| 屬性 | 必要 | 描述 |
| ----------- | ---------- | ------------- |
| `id` | 是 | 唯一的頁面識別碼（任何字串） |
| `name` | 是 | 編輯器中顯示的分頁標籤 |

### `<mxGraphModel>` 屬性

| 屬性 | 類型 | 預設值 | 描述 |
| ----------- | ------ | --------- | ------------- |
| `dx` | 整數 | `1422` | 捲動 X 位移 |
| `dy` | 整數 | `762` | 捲動 Y 位移 |
| `grid` | `0`/`1` | `1` | 顯示網格 |
| `gridSize` | 整數 | `10` | 網格貼齊大小（像素） |
| `guides` | `0`/`1` | `1` | 顯示對齊導引線 |
| `tooltips` | `0`/`1` | `1` | 啟用工具提示 |
| `connect` | `0`/`1` | `1` | 停留時啟用連接箭頭 |
| `arrows` | `0`/`1` | `1` | 顯示方向箭頭 |
| `fold` | `0`/`1` | `1` | 啟用群組摺疊/展開 |
| `page` | `0`/`1` | `1` | 顯示頁面邊界 |
| `pageScale` | 浮點數 | `1` | 頁面縮放比例 |
| `pageWidth` | 整數 | `1169` | 頁面寬度（像素，A4 橫向） |
| `pageHeight` | 整數 | `827` | 頁面高度（像素，A4 橫向） |
| `math` | `0`/`1` | `0` | 啟用 LaTeX 數學渲染 |
| `shadow` | `0`/`1` | `0` | 形狀的全域陰影 |

**常見頁面尺寸（96dpi 下的像素）：**

| 格式 | 寬度 | 高度 |
| -------- | ------- | -------- |
| A4 橫向 | `1169` | `827` |
| A4 縱向 | `827` | `1169` |
| A3 橫向 | `1654` | `1169` |
| Letter 橫向 | `1100` | `850` |
| Letter 縱向 | `850` | `1100` |
| 螢幕 (16:9) | `1654` | `931` |

---

## 保留儲存格（一律必要）

```xml
<mxCell id="0" />                 <!-- 根儲存格 — 絕不可省略，絕不可新增屬性 -->
<mxCell id="1" parent="0" />     <!-- 預設圖層 — 所有儲存格皆為此儲存格的子元件 -->
```

這兩個儲存格必須是 `<root>` 內的第一個項目。ID `0` 和 `1` 已保留，不可用於任何其他儲存格。

---

## 頂點 (Vertex)（形狀）元件

```xml
<mxCell
  id="2"
  value="標籤文字"
  style="rounded=1;whiteSpace=wrap;html=1;"
  vertex="1"
  parent="1">
  <mxGeometry x="200" y="160" width="120" height="60" as="geometry" />
</mxCell>
```

### `<mxCell>` 頂點屬性

| 屬性 | 必要 | 類型 | 描述 |
| ----------- | ---------- | ------ | ------------- |
| `id` | 是 | 字串 | 此圖表內唯一的識別碼 |
| `value` | 是 | 字串 | 標籤文字（若樣式具有 `html=1` 則允許 HTML） |
| `style` | 是 | 字串 | 以分號分隔的鍵值對 (key=value) 樣式字串 |
| `vertex` | 是 | `"1"` | 必須為 `"1"` 以將其宣告為形狀 |
| `parent` | 是 | 字串 | 父儲存格 ID（預設圖層為 `"1"`） |

### `<mxGeometry>` 頂點屬性

| 屬性 | 必要 | 類型 | 描述 |
| ----------- | ---------- | ------ | ------------- |
| `x` | 是 | 浮點數 | 形狀左邊緣（相對於畫布原點的像素） |
| `y` | 是 | 浮點數 | 形狀頂邊緣（相對於畫布原點的像素） |
| `width` | 是 | 浮點數 | 形狀寬度（像素） |
| `height` | 是 | 浮點數 | 形狀高度（像素） |
| `as` | 是 | `"geometry"` | 始終為 `"geometry"` |

---

## 邊緣 (Edge)（連接器）元件

```xml
<mxCell
  id="5"
  value="標籤"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
  edge="1"
  source="2"
  target="3"
  parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

### `<mxCell>` 邊緣屬性

| 屬性 | 必要 | 類型 | 描述 |
| ----------- | ---------- | ------ | ------------- |
| `id` | 是 | 字串 | 唯一識別碼 |
| `value` | 是 | 字串 | 連接器標籤（若無標籤則為空字串） |
| `style` | 是 | 字串 | 樣式字串（請參閱邊緣樣式） |
| `edge` | 是 | `"1"` | 必須為 `"1"` 以宣告為連接器 |
| `source` | 否 | 字串 | 來源頂點的 ID |
| `target` | 否 | 字串 | 目標頂點的 ID |
| `parent` | 是 | 字串 | 父儲存格 ID（通常為 `"1"`） |

### `<mxGeometry>` 邊緣屬性

| 屬性 | 必要 | 類型 | 描述 |
| ----------- | ---------- | ------ | ------------- |
| `relative` | 否 | `"1"` | 對於邊緣，始終為 `"1"` |
| `as` | 是 | `"geometry"` | 始終為 `"geometry"` |

### 具有標籤位移的邊緣

```xml
<mxGeometry x="-0.1" y="10" relative="1" as="geometry">
  <mxPoint as="offset" />
</mxGeometry>
```

相對幾何座標上的 `x` 會沿著邊緣移動標籤 (-1 到 1)。`y` 是垂直位移像素。

### 具有手動轉折點（控制點）的邊緣

```xml
<mxGeometry relative="1" as="geometry">
  <Array as="points">
    <mxPoint x="340" y="80" />
    <mxPoint x="340" y="200" />
  </Array>
</mxGeometry>
```

---

## 多頁面圖表

```xml
<mxfile>
  <diagram id="page-1" name="總覽">
    <mxGraphModel>...</mxGraphModel>
  </diagram>
  <diagram id="page-2" name="詳情">
    <mxGraphModel>...</mxGraphModel>
  </diagram>
</mxfile>
```

每個 `<diagram>` 都是一個獨立的頁面/分頁。儲存格 ID 的範圍僅限於其所屬的 `<diagram>` — 相同的 ID 值可以出現在不同頁面中而不會衝突。

---

## 圖層儲存格 (Layer Cells)

圖層取代了預設的 `id="1"` 圖層。透過 `parent` 指定儲存格所屬的圖層：

```xml
<mxCell id="0" />
<mxCell id="1" value="背景" parent="0" />        <!-- 圖層 1 -->
<mxCell id="layer2" value="服務" parent="0" />     <!-- 圖層 2 -->
<mxCell id="layer3" value="連接器" parent="0" />   <!-- 圖層 3 -->

<!-- 透過 parent 屬性指派圖層 -->
<mxCell id="10" value="API" ... parent="layer2">
  <mxGeometry ... />
</mxCell>
```

切換圖層可見性：

```xml
<mxCell id="layer2" value="服務" parent="0" visible="0" />
```

---

## 泳道容器 (Swimlane Container)

```xml
<!-- 泳道容器 -->
<mxCell id="swim1" value="流程" style="shape=pool;startSize=30;horizontal=1;" 
        vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="800" height="340" as="geometry" />
</mxCell>

<!-- 第 1 條泳道（泳道容器的子元件） -->
<mxCell id="lane1" value="客戶" style="swimlane;startSize=30;" 
        vertex="1" parent="swim1">
  <mxGeometry x="0" y="30" width="800" height="150" as="geometry" />
</mxCell>

<!-- 泳道內的形狀（泳道的子元件） -->
<mxCell id="step1" value="下單" style="rounded=1;whiteSpace=wrap;html=1;" 
        vertex="1" parent="lane1">
  <mxGeometry x="80" y="50" width="120" height="60" as="geometry" />
</mxCell>
```

> **關鍵**：泳道內的儲存格其 `parent` 必須設定為 **泳道的 ID**，而非 `"1"`。  
> 泳道內的座標是 **相對於泳道原點** 的。

---

## 群組儲存格 (Group Cells)

```xml
<!-- 隱形的群組容器 -->
<mxCell id="group1" value="" style="group;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="300" height="200" as="geometry" />
</mxCell>

<!-- 子元件座標相對於群組原點 -->
<mxCell id="child1" value="A" style="rounded=1;" vertex="1" parent="group1">
  <mxGeometry x="20" y="20" width="100" height="60" as="geometry" />
</mxCell>
```

---

## HTML 標籤

當樣式中包含 `html=1` 時，`value` 可以包含 HTML：

```xml
<mxCell value="&lt;b&gt;訂單服務&lt;/b&gt;&lt;br&gt;&lt;i&gt;:8080&lt;/i&gt;"
        style="rounded=1;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="160" height="60" as="geometry" />
</mxCell>
```

HTML 必須經過 XML 轉義 (XML-escaped)：

- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`
- `"` → `&quot;`

支援的常見 HTML 標籤：`<b>`, `<i>`, `<u>`, `<br>`, `<font color="#hex">`, `<span style="...">`, `<hr/>`

---

## 工具提示 / Metadata

```xml
<mxCell value="服務名稱" tooltip="處理訂單處理流程" style="..." vertex="1" parent="1">
  <mxGeometry ... />
</mxCell>
```

---

## ID 產生規則

| 規則 | 詳情 |
| ------ | -------- |
| ID `0` 與 `1` | 保留 — 始終為根儲存格與預設圖層 |
| 所有其他 ID | 在所屬的 `<diagram>` 中必須唯一 |
| 安全模式 | 從 `2` 開始的連續整數，或 UUID 字串 |
| 跨頁面 | ID 不需要跨不同的 `<diagram>` 頁面保持唯一 |

**安全連續 ID 範例：**

```text
id="2", id="3", id="4", ...
```

**UUID 風格範例：**

```text
id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

---

## 座標系統

- 原點 `(0, 0)` 位於畫布 **左上角**
- `x` 向 **右** 增加
- `y` 向 **下** 增加
- 所有單位皆為 **像素 (pixels)**

---

## 建議間距

| 情境 | 數值 |
| --------- | ------- |
| 形狀間的最小間隙 | `40px` |
| 舒適的間隙 | `80px` |
| 泳道內部留白 (padding) | `20px` |
| 頁面邊緣留白 | `40px` |
| 連接器路由淨空 | `10px` |

---

## 最精簡有效的 `.drawio` 檔案

```xml
<mxfile host="Electron" modified="2026-03-25T00:00:00.000Z" version="26.0.0">
  <diagram id="main" name="第 1 頁">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1"
                  tooltips="1" connect="1" arrows="1" fold="1"
                  page="1" pageScale="1" pageWidth="1169" pageHeight="827"
                  math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## 驗證規則

### 必須通過

- [ ] `id="0"` 與 `id="1"` 儲存格必須作為 `<root>` 的前兩個子元件出現
- [ ] 沒有其他儲存格使用 `id="0"` 或 `id="1"`
- [ ] 每個 `<diagram>` 內的所有 `id` 值皆唯一
- [ ] 每個 `<mxCell>` 都有且僅有一個 `<mxGeometry>` 子元件
- [ ] `<mxGeometry>` 具有 `as="geometry"` 屬性
- [ ] 頂點儲存格具有 `vertex="1"`，邊緣儲存格具有 `edge="1"`
- [ ] 邊緣的 `source`/`target` ID 參照同一個圖表中現有的頂點 ID
- [ ] 泳道子元件其 `parent` 設定為泳道 ID，而非 `"1"`
- [ ] `value` 屬性中的 HTML 已過 XML 轉義

### 建議做法

- [ ] 形狀不重疊，除非是刻意的（使用 ≥40px 間隙）
- [ ] 邊緣標籤精簡（≤4 個單字）
- [ ] 圖層儲存格具有描述性的 `value` 名稱
- [ ] 所有形狀皆位於 `pageWidth` × `pageHeight` 範圍內
