# draw.io 形狀函式庫 (draw.io Shape Libraries)

所有內建形狀函式庫的參考指南。可透過 draw.io 編輯器（或 VS Code 擴充功能形狀面板）中的 `View > Shapes` 啟用。

---

## 函式庫目錄

### 一般 (General)

**啟用方式**：預設始終啟用

適用於任何圖表類型的常見形狀。

| 形狀 | 樣式鍵值 | 用途 |
| ------- | ----------- | --------- |
| 矩形 | *(預設)* | 方框、步驟、元件 |
| 圓角矩形 | `rounded=1;` | 較圓潤的流程框 |
| 橢圓 | `ellipse;` | 狀態、開始/結束 |
| 三角形 | `triangle;` | 箭頭、閘門 |
| 菱形 | `rhombus;` | 決策 |
| 六邊形 | `shape=hexagon;` | 標籤、技術圖示 |
| 雲朵 | `shape=cloud;` | 雲端服務 |
| 圓柱體 | `shape=cylinder3;` | 資料庫 |
| 備註 | `shape=note;` | 註釋 |
| 文件 | `shape=document;` | 檔案 |
| 箭頭形狀 | 各種 `mxgraph.arrows2.*` | 流程方向 |
| 註註標 | `shape=callout;` | 對話氣泡 |

---

### 流程圖 (Flowchart)

**啟用方式**：`View > Shapes > Flowchart`  
**形狀前綴**：`mxgraph.flowchart.`

標準 ANSI/ISO 流程圖符號。

| 符號 | 樣式字串 | ANSI 名稱 |
| -------- | ------------- | ----------- |
| 開始 / 結束 | `ellipse;` | 終端 (Terminal) |
| 處理 (Process) (矩形) | `rounded=1;` | 處理 (Process) |
| 決策 (Decision) | `rhombus;` | 決策 (Decision) |
| 輸入/輸出 (平行四邊形) | `shape=mxgraph.flowchart.io;` | 資料 (Data) |
| 預定義處理 | `shape=mxgraph.flowchart.predefined_process;` | 預定義處理 (Predefined Process) |
| 手動操作 | `shape=mxgraph.flowchart.manual_operation;` | 手動操作 (Manual Operation) |
| 手動輸入 | `shape=mxgraph.flowchart.manual_input;` | 手動輸入 (Manual Input) |
| 資料庫 | `shape=mxgraph.flowchart.database;` | 直接存取儲存 (Direct Access Storage) |
| 文件 | `shape=mxgraph.flowchart.document;` | 文件 (Document) |
| 多重文件 | `shape=mxgraph.flowchart.multi-document;` | 多重文件 (Multiple Documents) |
| 頁內連接器 | `ellipse;` (小型，30×30) | 連接器 (Connector) |
| 跨頁連接器 | `shape=mxgraph.flowchart.off_page_connector;` | 跨頁連接器 (Off-page Connector) |
| 準備 (Preparation) | `shape=mxgraph.flowchart.preparation;` | 準備 (Preparation) |
| 延遲 (Delay) | `shape=mxgraph.flowchart.delay;` | 延遲 (Delay) |
| 顯示 (Display) | `shape=mxgraph.flowchart.display;` | 顯示 (Display) |
| 內部儲存 | `shape=mxgraph.flowchart.internal_storage;` | 內部儲存 (Internal Storage) |
| 排序 (Sort) | `shape=mxgraph.flowchart.sort;` | 排序 (Sort) |
| 擷取 (Extract) | `shape=mxgraph.flowchart.extract;` | 擷取 (Extract) |
| 合併 (Merge) | `shape=mxgraph.flowchart.merge;` | 合併 (Merge) |
| 或 (Or) | `shape=mxgraph.flowchart.or;` | 或 (Or) |
| 註釋 (Annotation) | `shape=mxgraph.flowchart.annotation;` | 註釋 (Annotation) |
| 卡片 (Card) | `shape=mxgraph.flowchart.card;` | 打孔卡 (Punched Card) |

**完整的流程圖範例樣式字串：**

```text
處理 (Process)：     rounded=1;whiteSpace=wrap;html=1;
決策 (Decision)：    rhombus;whiteSpace=wrap;html=1;
開始/結束：          ellipse;whiteSpace=wrap;html=1;
資料庫：             shape=mxgraph.flowchart.database;whiteSpace=wrap;html=1;
文件：               shape=mxgraph.flowchart.document;whiteSpace=wrap;html=1;
輸入/輸出 (資料)：   shape=mxgraph.flowchart.io;whiteSpace=wrap;html=1;
```

---

### UML

**啟用方式**：`View > Shapes > UML`

#### 使用案例圖 (Use Case Diagrams)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 參與者 | `shape=mxgraph.uml.actor;whiteSpace=wrap;html=1;` |
| 使用案例 (橢圓) | `ellipse;whiteSpace=wrap;html=1;` |
| 系統邊界 | `swimlane;startSize=30;whiteSpace=wrap;html=1;` |

#### 類別圖 (Class Diagrams)

使用泳道容器作為類別方框：

```xml
<!-- 類別容器 -->
<mxCell value="«interface»&#xa;IOrderService" 
        style="swimlane;fontStyle=1;align=center;startSize=30;whiteSpace=wrap;html=1;"
        vertex="1" parent="1">
  <mxGeometry x="200" y="100" width="200" height="160" as="geometry" />
</mxCell>

<!-- 屬性（類別的子元件） -->
<mxCell value="+ id: string&#xa;+ status: string" 
        style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;overflow=hidden;html=1;"
        vertex="1" parent="classId">
  <mxGeometry y="30" width="200" height="60" as="geometry" />
</mxCell>

<!-- 函式分隔線 -->
<mxCell value="" style="line;strokeWidth=1;fillColor=none;" vertex="1" parent="classId">
  <mxGeometry y="90" width="200" height="10" as="geometry" />
</mxCell>

<!-- 函式（類別的子元件） -->
<mxCell value="+ create(): Order&#xa;+ cancel(): void"
        style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;overflow=hidden;html=1;"
        vertex="1" parent="classId">
  <mxGeometry y="100" width="200" height="60" as="geometry" />
</mxCell>
```

#### UML 關聯箭頭

| 關聯類型 | 樣式字串 |
| ------------- | ------------- |
| 繼承 (extends) | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=0;` |
| 實作 (implements) | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=block;endFill=0;` |
| 關聯 (Association) | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;` |
| 依賴 (Dependency) | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=open;endFill=0;` |
| 聚合 (Aggregation) | `edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=0;endArrow=none;` |
| 組合 (Composition) | `edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=1;endArrow=none;` |

#### 元件圖 (Component Diagram)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 元件 | `shape=component;align=left;spacingLeft=36;whiteSpace=wrap;html=1;` |
| 介面 (Lollipop) | `ellipse;whiteSpace=wrap;html=1;aspect=fixed;`（小圓圈） |
| 連接埠 | `shape=mxgraph.uml.port;` |
| 節點 | `shape=mxgraph.uml.node;whiteSpace=wrap;html=1;` |
| 成品 (Artifact) | `shape=mxgraph.uml.artifact;whiteSpace=wrap;html=1;` |

#### 循序圖 (Sequence Diagrams)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 參與者 | `shape=mxgraph.uml.actor;whiteSpace=wrap;html=1;` |
| 生命線 (物件) | `shape=umlLifeline;startSize=40;whiteSpace=wrap;html=1;` |
| 啟動區塊 | `shape=umlActivation;whiteSpace=wrap;html=1;` |
| 同步訊息 | `edgeStyle=elbowEdgeStyle;elbow=vertical;html=1;endArrow=block;endFill=1;` |
| 非同步訊息 | `edgeStyle=elbowEdgeStyle;elbow=vertical;html=1;endArrow=open;endFill=0;` |
| 傳回 | `edgeStyle=elbowEdgeStyle;elbow=vertical;dashed=1;html=1;endArrow=open;endFill=0;` |
| 自我呼叫 | `edgeStyle=elbowEdgeStyle;elbow=vertical;exitX=1;exitY=0.3;entryX=1;entryY=0.5;html=1;` |

#### 狀態圖 (State Diagrams)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 初始狀態 (實心圓) | `ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;` |
| 狀態 | `rounded=1;whiteSpace=wrap;html=1;arcSize=50;` |
| 結束狀態 | `shape=doubleEllipse;fillColor=#000000;strokeColor=#000000;` |
| 轉換 | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=1;` |
| 分叉/合併 | `shape=mxgraph.uml.fork_or_join;html=1;fillColor=#000000;` |

---

### 實體關聯 (ER 圖)

**啟用方式**：`View > Shapes > Entity Relation`

#### 現代 ER 表格（鴉腳標記法 crow's foot notation）

```xml
<!-- 表格容器 -->
<mxCell id="tbl-orders" value="orders"
        style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;"
        vertex="1" parent="1">
  <mxGeometry x="80" y="80" width="240" height="210" as="geometry" />
</mxCell>

<!-- 欄位列 -->
<mxCell id="col-id" value=""
        style="shape=tableRow;horizontal=0;startSize=0;swimmilaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
        vertex="1" parent="tbl-orders">
  <mxGeometry y="30" width="240" height="30" as="geometry" />
</mxCell>

<!-- PK 標記儲存格 -->
<mxCell value="PK" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;fontStyle=1;overflow=hidden;"
        vertex="1" parent="col-id">
  <mxGeometry width="40" height="30" as="geometry" />
</mxCell>

<!-- 欄位名稱儲存格 -->
<mxCell value="id" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;"
        vertex="1" parent="col-id">
  <mxGeometry x="40" width="140" height="30" as="geometry" />
</mxCell>

<!-- 資料類型儲存格 -->
<mxCell value="UUID" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontStyle=2;"
        vertex="1" parent="col-id">
  <mxGeometry x="180" width="60" height="30" as="geometry" />
</mxCell>
```

#### ER 關聯連接器（鴉腳標記法）

| 基數 (Cardinality) | 樣式字串 |
| ------------- | ------------- |
| 一對一 | `edgeStyle=entityRelationEdgeStyle;html=1;startArrow=ERmandOne;endArrow=ERmandOne;startFill=1;endFill=1;` |
| 一對多 | `edgeStyle=entityRelationEdgeStyle;html=1;startArrow=ERmandOne;endArrow=ERmany;startFill=1;endFill=1;` |
| 零對多 | `edgeStyle=entityRelationEdgeStyle;html=1;startArrow=ERmandOne;endArrow=ERzeroToMany;startFill=1;endFill=0;` |
| 零對一 | `edgeStyle=entityRelationEdgeStyle;html=1;startArrow=ERmandOne;endArrow=ERzeroToOne;startFill=1;endFill=0;` |
| 多對多 | `edgeStyle=entityRelationEdgeStyle;html=1;startArrow=ERmany;endArrow=ERmany;startFill=1;endFill=1;` |

---

### 網路 / 基礎設施 (Network / Infrastructure)

**啟用方式**：`View > Shapes > Networking`

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 一般伺服器 | `shape=server;html=1;whiteSpace=wrap;` |
| 網頁伺服器 | `shape=mxgraph.network.web_server;` |
| 資料庫伺服器 | `shape=mxgraph.network.database;` |
| 筆記型電腦 | `shape=mxgraph.network.laptop;` |
| 桌上型電腦 | `shape=mxgraph.network.desktop;` |
| 行動電話 | `shape=mxgraph.network.mobile;` |
| 路由器 | `shape=mxgraph.cisco.routers.router;` |
| 交換器 | `shape=mxgraph.cisco.switches.workgroup_switch;` |
| 防火牆 | `shape=mxgraph.cisco.firewalls.firewall;` |
| 雲端 (一般) | `shape=cloud;` |
| 網際網路 | `shape=mxgraph.network.internet;` |
| 負載平衡器 | `shape=mxgraph.network.load_balancer;` |

---

### BPMN 2.0

**啟用方式**：`View > Shapes > BPMN`  
**形狀前綴**：`shape=mxgraph.bpmn.*`

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 開始事件 | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.ellipsePerimeter;symbol=general;verticalLabelPosition=bottom;` |
| 結束事件 | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.ellipsePerimeter;symbol=terminate;verticalLabelPosition=bottom;` |
| 任務 | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.rectanglePerimeter;symbol=task;` |
| 互斥閘道 (Exclusive gateway) | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.rhombusPerimeter;symbol=exclusiveGw;` |
| 平行閘道 (Parallel gateway) | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.rhombusPerimeter;symbol=parallelGw;` |
| 子程序 | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.rectanglePerimeter;symbol=subProcess;` |
| 循序流 (Sequence flow) | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=1;` |
| 訊息流 (Message flow) | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=block;endFill=0;` |
| 儲存池 (Pool) | `shape=pool;startSize=30;horizontal=1;` |
| 泳道 (Lane) | `swimlane;startSize=30;` |

---

### 模擬 / 線框圖 (Mockup / Wireframe)

**啟用方式**：`View > Shapes > Mockup`

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 按鈕 | `shape=mxgraph.mockup.forms.button;` |
| 輸入欄位 | `shape=mxgraph.mockup.forms.text1;` |
| 核取方塊 | `shape=mxgraph.mockup.forms.checkbox;` |
| 下拉選單 | `shape=mxgraph.mockup.forms.comboBox;` |
| 瀏覽器視窗 | `shape=mxgraph.mockup.containers.browser;` |
| 手機螢幕 | `shape=mxgraph.mockup.containers.smartphone;` |
| 列表 | `shape=mxgraph.mockup.containers.list;` |
| 表格 | `shape=mxgraph.mockup.containers.table;` |

---

### Kubernetes

**啟用方式**：`View > Shapes > Kubernetes`

| 資源項目 | 樣式字串 |
| ---------- | ------------- |
| Pod | `shape=mxgraph.kubernetes.pod;` |
| Deployment | `shape=mxgraph.kubernetes.deploy;` |
| Service | `shape=mxgraph.kubernetes.svc;` |
| Ingress | `shape=mxgraph.kubernetes.ing;` |
| ConfigMap | `shape=mxgraph.kubernetes.cm;` |
| Secret | `shape=mxgraph.kubernetes.secret;` |
| PersistentVolume | `shape=mxgraph.kubernetes.pv;` |
| Namespace | `shape=mxgraph.kubernetes.ns;` |
| Node | `shape=mxgraph.kubernetes.node;` |

---

## 在 VS Code 中啟用函式庫

函式庫是在 draw.io 編輯器內啟用的（VS Code 已內嵌該編輯器）：

1. 在 VS Code 中開啟任何 `.drawio` 或 `.drawio.svg` 檔案
2. 點擊形狀面板（左側欄位）中的 `+` 圖示 → `Search Shapes` 或 `More Shapes`
3. 勾選您想要啟用的函式庫
4. 形狀將出現在面板中供拖放使用

函式庫設定是儲存在每個使用者的 draw.io 設定中（而非每個專案）。

---

## 自訂形狀函式庫建立

自訂函式庫是一個副檔名為 `.xml` 的 XML 檔案，透過 `File > Open Library` 載入：

```xml
<mxlibrary>
  [
    {
      "xml": "&lt;mxCell value=\"元件\" style=\"rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;\" vertex=\"1\"&gt;&lt;mxGeometry width=\"120\" height=\"60\" as=\"geometry\" /&gt;&lt;/mxCell&gt;",
      "w": 120,
      "h": 60,
      "aspect": "fixed",
      "title": "我的元件"
    }
  ]
</mxlibrary>
```

每個形狀項目包含：
- `xml`：經過 XML 轉義的儲存格定義
- `w` / `h`：預設寬度/高度
- `aspect`：`"fixed"` 用於鎖定比例
- `title`：面板中顯示的名稱

    }
  ]
</mxlibrary>
```
