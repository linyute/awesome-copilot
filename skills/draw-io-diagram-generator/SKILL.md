---
name: draw-io-diagram-generator
description: 用於建立、編輯或產生 draw.io 圖表檔案 (.drawio, .drawio.svg, .drawio.png)。涵蓋 mxGraph XML 撰寫、形狀函式庫、樣式字串、流程圖、系統架構、循序圖、ER 圖、UML 類別圖、網路拓撲、佈局策略、hediet.vscode-drawio VS Code 擴充功能，以及從請求到準備就緒檔案的完整代理程式工作流程。
---

# Draw.io 圖表產生器 (Draw.io Diagram Generator)

此技能讓您能夠產生、編輯及驗證具有正確 mxGraph XML 結構的 draw.io (`.drawio`) 圖表檔案。
所有產生的檔案都可以立即在
[Draw.io VS Code 擴充功能](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)
(`hediet.vscode-drawio`) 中開啟，無需任何手動修正。您也可以在 draw.io 網頁版應用程式或桌面版應用程式中開啟這些檔案。

---

## 1. 何時使用此技能

**觸發語句（看到這些語句時載入此技能）**

- 「建立一個圖表」、「繪製一個流程圖」、「產生一個架構圖」
- 「設計一個循序圖」、「製作一個 UML 類別圖」、「建構一個 ER 圖」
- 「新增一個 .drawio 檔案」、「更新圖表」、「視覺化流程」
- 「記錄架構」、「顯示資料模型」、「以圖表呈現服務互動」
- 任何產生或修改 `.drawio`、`.drawio.svg` 或 `.drawio.png` 檔案的請求

**支援的圖表類型**

| 圖表類型 | 提供範本 | 描述 |
|---|---|---|
| 流程圖 | `assets/templates/flowchart.drawio` | 包含決策與分支的程序流程 |
| 系統架構 | `assets/templates/architecture.drawio` | 多層級 / 分層服務架構 |
| 循序圖 | `assets/templates/sequence.drawio` | 參與者生命線與計時訊息流 |
| ER 圖 | `assets/templates/er-diagram.drawio` | 具有關聯性的資料庫資料表 |
| UML 類別圖 | `assets/templates/uml-class.drawio` | 類別、介面、列舉、關聯性 |
| 網路拓撲 | （使用形狀函式庫） | 路由器、伺服器、防火牆、子網路 |
| BPMN 工作流程 | （使用形狀函式庫） | 商務程序事件、任務、閘道 |
| 心智圖 | （手動） | 具有放射狀分支的核心主題 |

---

## 2. 前提條件

- 若在啟用 VS Code 整合的情況下執行，請安裝 drawio 擴充功能：**draw.io VS Code extension** — `hediet.vscode-drawio` (擴充功能識別碼)。安裝指令：
  ```
  ext install hediet.vscode-drawio
  ```
- **支援的副檔名**：`.drawio`、`.drawio.svg`、`.drawio.png`
- **Python 3.8+**（選用）— 用於 `scripts/` 中的驗證與形狀插入指令稿

---

## 3. 代理程式逐步工作流程 (Step-by-Step Agent Workflow)

針對每個圖表產生任務，請依序遵循以下步驟。

### 步驟 1 — 理解請求

詢問或推斷：
1. **圖表類型** — 哪種圖表？（流程圖、架構圖、UML、ER、循序圖、網路圖……）
2. **實體 / 參與者** — 主要元件、參與者、類別或資料表為何？
3. **關聯性** — 它們如何連接？方向為何？基數 (Cardinality) 為何？
4. **輸出路徑** — `.drawio` 檔案應儲存在何處？
5. **現有檔案** — 我們是建立新檔案還是編輯現有檔案？

若請求不明確，請根據上下文推斷最合理的圖表類型（例如：「顯示資料表」→ ER 圖，「顯示 API 呼叫流程」→ 循序圖）。

### 步驟 2 — 選擇範本或從頭開始

- **使用範本**：當圖表類型符合 `assets/templates/` 中的類型時使用。複製範本結構並替換佔位符數值。
- **從頭開始**：針對新穎的佈局。從最精簡的有效骨架開始：

```xml
<!-- 產生新檔案時，將 modified="" 設定為目前的 ISO 8601 時間戳記 -->
<mxfile host="Electron" modified="" version="26.0.0">
  <diagram id="page-1" name="Page-1">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1"
                  tooltips="1" connect="1" arrows="1" fold="1"
                  page="1" pageScale="1" pageWidth="1169" pageHeight="827"
                  math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- 在此處放置您的儲存格 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

> **規則**：ID `0` 與 `1` 始終是必要的，且必須是前兩個儲存格。絕不要重複使用它們。

### 步驟 3 — 規劃佈局

在產生 XML 之前，先草擬邏輯位置：
- 整理成 **列 (rows)** 或 **層級 (tiers)**（為圖層使用泳道）
- **水平間距**：同列形狀之間保留 40–60px
- **垂直間距**：層級列之間保留 80–120px
- 標準形狀大小：程序方框為 `120x60` px，泳道為 `160x80` px
- 預設畫布：A4 橫向 = `1169 x 827` px

### 步驟 4 — 產生 mxGraph XML

**頂點儲存格 (Vertex cell)**（每個形狀）：
```xml
<mxCell id="unique-id" value="標籤"
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
        vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
</mxCell>
```

**邊緣儲存格 (Edge cell)**（每個連接器）：
```xml
<mxCell id="edge-id" value="標籤（選用）"
        style="edgeStyle=orthogonalEdgeStyle;html=1;"
        edge="1" source="source-id" target="target-id" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

**關鍵規則**：
- 每個儲存格 ID 在檔案內必須 **全域唯一**
- 每個頂點必須有一個包含 `x`、`y`、`width`、`height`、`as="geometry"` 的 `mxGeometry` 子元件
- 每個邊緣必須具有與現有頂點 ID 匹配的 `source` 和 `target` — **例外**：浮動邊緣（例如循序圖生命線）在 `<mxGeometry>` 內部改用 `sourcePoint`/`targetPoint`；請參閱 §4 循序圖
- 每個儲存格的 `parent` 必須參照現有的儲存格 ID
- 當標籤包含 HTML (`<b>`, `<i>`, `<br>`) 時，在樣式中使用 `html=1`
- 轉義標籤中的 XML 特殊字元：`&` => `&amp;`, `<` => `&lt;`, `>` => `&gt;`

### 步驟 5 — 套用正確的樣式

使用標準語意化調色盤以保持一致性：

| 目的 | fillColor | strokeColor |
|---|---|---|
| 主要 / 資訊 | `#dae8fc` | `#6c8ebf` |
| 成功 / 開始 | `#d5e8d4` | `#82b366` |
| 警告 / 決策 | `#fff2cc` | `#d6b656` |
| 錯誤 / 結束 | `#f8cecc` | `#b85450` |
| 中性 | `#f5f5f5` | `#666666` |
| 外部 / 夥伴 | `#e1d5e7` | `#9673a6` |

各圖表類期的常見樣式字串：

```
# 圓角程序方框（流程圖）
rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;

# 決策菱形
rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;

# 開始/結束端點
ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;

# 資料庫圓柱體
shape=mxgraph.flowchart.database;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;

# 泳道容器（層級）
swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;

# UML 類別方框
swimlane;fontStyle=1;align=center;startSize=40;fillColor=#dae8fc;strokeColor=#6c8ebf;

# 介面 / 構造型 (Stereotype) 方框
swimlane;fontStyle=3;align=center;startSize=40;fillColor=#f5f5f5;strokeColor=#666666;

# ER 資料表容器
shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;

# 正交連接器
edgeStyle=orthogonalEdgeStyle;html=1;

# ER 關聯（鴉腳）
edgeStyle=entityRelationEdgeStyle;html=1;endArrow=ERmany;startArrow=ERone;
```

> 請參閱 `references/style-reference.md` 以取得完整的樣式鍵值目錄，以及 `references/shape-libraries.md` 以取得所有形狀函式庫名稱。

### 步驟 6 — 儲存與驗證

1. 將副檔名為 `.drawio` 的 **檔案寫入** 至請求的路徑
2. **執行驗證工具**（選用但建議執行）：
   ```bash
   python .github/skills/draw-io-diagram-generator/scripts/validate-drawio.py <檔案路徑.drawio>
   ```
3. **告知使用者** 如何開啟檔案：
   > 「在 VS Code 中開啟 `<檔案名稱>` — 系統會透過 draw.io 擴充功能自動渲染。如果您偏好，也可以使用 draw.io 網頁版應用程式或桌面版應用程式。」
4. **提供簡短描述** 說明圖表內容，讓使用者知道可以預期什麼。

---

## 4. 各類圖表製作秘訣

### 流程圖 (Flowchart)

關鍵元素：開始 (橢圓) => 處理 (圓角矩形) => 決策 (菱形) => 結束 (橢圓)

```xml
<!-- 開始節點 -->
<mxCell id="start" value="開始"
        style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;"
        vertex="1" parent="1">
  <mxGeometry x="500" y="80" width="120" height="60" as="geometry" />
</mxCell>

<!-- 處理 -->
<mxCell id="p1" value="程序步驟"
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
        vertex="1" parent="1">
  <mxGeometry x="500" y="200" width="120" height="60" as="geometry" />
</mxCell>

<!-- 決策 -->
<mxCell id="d1" value="條件？"
        style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"
        vertex="1" parent="1">
  <mxGeometry x="460" y="320" width="200" height="100" as="geometry" />
</mxCell>

<!-- 箭頭：start 到 p1 -->
<mxCell id="e1" value=""
        style="edgeStyle=orthogonalEdgeStyle;html=1;"
        edge="1" source="start" target="p1" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

### 架構圖（3 層式） (Architecture Diagram (3-tier))

為每一層使用 **泳道容器**。所有服務方框皆為其所屬泳道的子元件。

```xml
<!-- 層級泳道 -->
<mxCell id="tier1" value="用戶端層"
        style="swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;"
        vertex="1" parent="1">
  <mxGeometry x="60" y="100" width="1050" height="130" as="geometry" />
</mxCell>

<!-- 層級內的服務 (parent="tier1", 座標相對於泳道) -->
<mxCell id="webapp" value="網頁應用程式"
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
        vertex="1" parent="tier1">
  <mxGeometry x="80" y="40" width="120" height="60" as="geometry" />
</mxCell>
```

> 層級之間的連接器使用絕對座標，並設定 `parent="1"`。

### 循序圖 (Sequence Diagram)

關鍵元素：參與者（頂部）、生命線（虛線垂直線）、啟動區塊、訊息箭頭。

- 生命線：`edge="1"`，具有 `endArrow=none` 與 `dashed=1`，無來源 (source)/目標 (target) — 在幾何資訊中使用 `sourcePoint`/`targetPoint`
- 同步訊息：`endArrow=block;endFill=1`
- 傳回訊息：`endArrow=open;endFill=0;dashed=1`
- 自我呼叫：透過兩個右側再返回的 Array 點使邊緣形成迴圈

**最精簡 XML 片段：**

```xml
<!-- 參與者（火柴人） -->
<mxCell id="actorA" value="用戶端"
        style="shape=mxgraph.uml.actor;pointerEvents=1;dashed=0;whiteSpace=wrap;html=1;aspect=fixed;"
        vertex="1" parent="1">
  <mxGeometry x="110" y="80" width="60" height="80" as="geometry" />
</mxCell>

<!-- 服務方框 -->
<mxCell id="actorB" value="API 伺服器"
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"
        vertex="1" parent="1">
  <mxGeometry x="480" y="100" width="160" height="60" as="geometry" />
</mxCell>

<!-- 生命線 — 浮動邊緣：使用 sourcePoint/targetPoint，而非 source/target 屬性 -->
<mxCell id="lifA" value=""
        style="edgeStyle=none;dashed=1;endArrow=none;"
        edge="1" parent="1">
  <mxGeometry relative="1" as="geometry">
    <mxPoint x="140" y="160" as="sourcePoint" />
    <mxPoint x="140" y="700" as="targetPoint" />
  </mxGeometry>
</mxCell>

<!-- 啟動區塊（生命線上的細長矩形） -->
<mxCell id="actA1" value=""
        style="fillColor=#dae8fc;strokeColor=#6c8ebf;"
        vertex="1" parent="1">
  <mxGeometry x="130" y="220" width="20" height="180" as="geometry" />
</mxCell>

<!-- 同步訊息 -->
<mxCell id="msg1" value="POST /orders"
        style="edgeStyle=elbowEdgeStyle;elbow=vertical;html=1;endArrow=block;endFill=1;"
        edge="1" source="actA1" target="actorB" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

<!-- 傳回訊息（虛線） -->
<mxCell id="msg2" value="201 Created"
        style="edgeStyle=elbowEdgeStyle;elbow=vertical;dashed=1;html=1;endArrow=open;endFill=0;"
        edge="1" source="actorB" target="actA1" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

> **注意**：生命線是浮動邊緣，在 `<mxGeometry>` 中使用 `sourcePoint`/`targetPoint` 而非 `source`/`target` 屬性。這是循序圖的標準 draw.io 模式。

### ER 圖 (ER Diagram)

使用具有 `childLayout=tableLayout` 的 `shape=table` 容器。列是具有 `portConstraint=eastwest` 的 `shape=tableRow` 儲存格。每列內部的欄位是 `shape=partialRectangle`。

關聯箭頭使用 `edgeStyle=entityRelationEdgeStyle`：
- 一對一：`startArrow=ERone;endArrow=ERone`
- 一對多：`startArrow=ERone;endArrow=ERmany`
- 多對多：`startArrow=ERmany;endArrow=ERmany`
- 強制性：`ERmandOne`，選用性：`ERzeroToOne`

### UML 類別圖 (UML Class Diagram)

類別方框是泳道容器。屬性與函式是純文字儲存格。分隔線是高度為零的泳道子元件。

依關聯類型劃分的箭頭樣式：

| 關聯類型 | 樣式字串 |
|---|---|
| 繼承 (extends) | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=0;` |
| 實現 (implements) | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=block;endFill=0;` |
| 組合 (Composition) | `edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=1;endArrow=none;` |
| 聚合 (Aggregation) | `edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=0;endArrow=none;` |
| 依賴 (Dependency) | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=open;endFill=0;` |
| 關聯 (Association) | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;` |

---

## 5. 多頁面圖表

針對複雜系統新增多個 `<diagram>` 元件：

```xml
<mxfile host="Electron" version="26.0.0">
  <diagram id="overview" name="總覽">
    <!-- 總覽 mxGraphModel -->
  </diagram>
  <diagram id="detail" name="詳情檢視">
    <!-- 詳情 mxGraphModel -->
  </diagram>
</mxfile>
```

每個頁面都有自己獨立的儲存格 ID 命名空間。相同的 ID 值可以出現在不同頁面中而不會發生衝突。

---

## 6. 編輯現有圖表

修改現有的 `.drawio` 檔案時：

1. **先讀取** 檔案以了解現有的儲存格 ID、位置以及父層階層
2. **識別目標圖表頁面** — 透過索引或 `name` 屬性
3. **指派新的唯一 ID**，且不得與現有 ID 衝突
4. **遵守容器階層** — 泳道的子元件使用相對於其父層的座標
5. **驗證邊緣** — 在重新調整節點位置後，確認邊緣的 source/target ID 仍然有效

使用 `scripts/add-shape.py` 可安全地新增單一形狀，無需編輯原始 XML：
```bash
python .github/skills/draw-io-diagram-generator/scripts/add-shape.py docs/arch.drawio "新服務" 700 380
```

---

## 7. 最佳實務

**佈局**
- 將形狀對齊至 10px 網格（所有座標皆可被 10 整除）
- 將相關形狀整理在泳道容器內
- 每個頁面呈現一個圖表主題；針對複雜系統使用多頁面檔案
- 為了可讀性，建議每頁儲存格數量控制在 40 個或以下

**標籤**
- 在每個頁面頂部新增一個標題文字儲存格 (`text;strokeColor=none;fillColor=none;fontSize=18;fontStyle=1`)
- 一律在頂點形狀上設定 `whiteSpace=wrap;html=1`
- 保持標籤精簡 — 每個形狀盡可能使用 3 個單字或以下

**樣式一致性**
- 在專案中一致地使用第 3 節步驟 5 的語意化調色盤
- 優先使用 `edgeStyle=orthogonalEdgeStyle` 以獲得整齊的直角連接器
- 除非必要，否則不要在標籤中內嵌任意 HTML

**檔案命名**
- 使用連字號命名法 (kebab-case)：`order-service-flow.drawio`、`database-schema.drawio`
- 將圖表放在其記錄的程式碼旁：`docs/` 或 `architecture/`

---

## 8. 疑難排解

| 問題 | 可能原因 | 修正方法 |
|---|---|---|
| 檔案在 VS Code 中開啟時為空白 | 缺少 id=0 或 id=1 儲存格 | 在任何其他儲存格之前新增這兩個根儲存格 |
| 形狀位於錯誤位置 | 容器內的子元件 — 座標是相對的 | 檢查 `parent`；根據容器調整 x/y |
| 邊緣不可見 | source 或 target ID 與任何頂點皆不匹配 | 驗證兩個 ID 是否與寫入的一致 |
| 圖表顯示「已壓縮」 (Compressed) | mxGraphModel 已經過 base64 編碼 | 在 draw.io 網頁版中開啟，File > Export > XML (uncompressed) |
| 形狀樣式未渲染 | shape= 名稱拼寫錯誤 | 在 `references/shape-libraries.md` 中檢查確切的樣式字串 |
| 標籤顯示轉義後的 HTML | 具有 HTML 標籤的儲存格設定了 html=0 | 在儲存格樣式中加入 `html=1;` |
| 容器子元件超出容器邊緣 | 容器高度太小 | 在 mxGeometry 中增加容器高度 |

---

## 9. 驗證清單

在交付任何產生的 `.drawio` 檔案之前，請驗證：

- [ ] 檔案以 `<mxfile>` 根元件開始
- [ ] 每個 `<diagram>` 都有非空的 `id` 屬性
- [ ] `<mxCell id="0" />` 是每個圖表中的第一個儲存格
- [ ] `<mxCell id="1" parent="0" />` 是每個圖表中的第二個儲存格
- [ ] 每個圖表內的所有儲存格 `id` 值皆唯一
- [ ] 每個頂點儲存格皆具有 `vertex="1"` 與一個 ` <mxGeometry as="geometry">` 子元件
- [ ] 每個邊緣儲存格皆具有 `edge="1"` 且：(a) `source`/`target` 指向現有的頂點 ID，或 (b) 在其 `<mxGeometry>` 中具有 `<mxPoint as="sourcePoint">` 與 `<mxPoint as="targetPoint">`（浮動邊緣 — 用於循序圖生命線）
- [ ] 每個儲存格（id=0 除外）都具有一個指向現有 ID 的 `parent`
- [ ] 任何包含 HTML 標籤的標籤樣式中皆有 `html=1`
- [ ] XML 格式正確（無未關閉的標籤，屬性值中無未轉義的 `&`、`<`、`>`）
- [ ] 每個頁面頂部都存在一個標題標籤儲存格

執行自動化驗證工具：
```bash
python .github/skills/draw-io-diagram-generator/scripts/validate-drawio.py <檔案.drawio>
```

---

## 10. 輸出格式

交付圖表時，請一律提供：

1. 寫入至請求路徑的 **`.drawio` 檔案**
2. 說明圖表內容的 **單句摘要**
3. **如何開啟它**：
   > 「在 VS Code 中開啟 `<檔案名稱>` — draw.io 擴充功能將會自動渲染。或者，如果您偏好，也可以在 draw.io 網頁版應用程式或桌面版應用程式中開啟。」
4. **如何編輯它**（若使用者可能會進行自訂）：
   > 「點擊任何形狀即可選取。連按兩下可編輯標籤。拖曳可重新調整位置。」
5. **驗證狀態** — 是否已執行驗證指令稿並通過驗證

---

## 11. 參考資料

所有附屬檔案皆位於 `.github/skills/draw-io-diagram-generator/`：

| 檔案 | 內容 |
|---|---|
| `references/drawio-xml-schema.md` | 完整的 mxfile / mxGraphModel / mxCell 屬性參考、座標系統、保留儲存格、驗證規則 |
| `references/style-reference.md` | 所有樣式鍵值及其允許的值、頂點與邊緣樣式鍵值、形狀目錄、語意化調色盤 |
| `references/shape-libraries.md` | 所有形狀函式庫類別（一般、流程圖、UML、ER、網路、BPMN、模擬、K8s）及其樣式字串 |
| `assets/templates/flowchart.drawio` | 直接可用的流程圖範本 |
| `assets/templates/architecture.drawio` | 4 層式系統架構範本 |
| `assets/templates/sequence.drawio` | 3 位參與者的循序圖範本 |
| `assets/templates/er-diagram.drawio` | 具有鴉腳關聯的 3 資料表 ER 圖 |
| `assets/templates/uml-class.drawio` | 包含介面 + 2 個類別 + 具有關聯箭頭之列舉的範本 |
| `scripts/validate-drawio.py` | 用於驗證任何 .drawio 檔案 XML 結構的 Python 指令稿 |
| `scripts/add-shape.py` | 用於在現有圖表中新增形狀的 Python CLI |
| `scripts/README.md` | 如何使用指令稿以及範例說明 |
