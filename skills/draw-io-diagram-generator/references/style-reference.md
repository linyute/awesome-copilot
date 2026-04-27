# draw.io 樣式參考 (draw.io Style Reference)

`<mxCell>` 元件上 `style` 屬性的完整參考。樣式是以分號分隔的 `key=value` 鍵值對。

---

## 樣式格式

```text
style="key1=value1;key2=value2;key3=value3;"
```

- 鍵與值皆區分大小寫
- 建議在結尾加上分號，但非必要
- 未知的鍵將會被自動忽略
- 缺少的鍵將使用 draw.io 預設值

---

## 通用樣式鍵值 (Universal Style Keys)

套用於所有形狀與邊緣。

| 鍵 | 值 | 預設值 | 描述 |
| ----- | -------- | --------- | ------------- |
| `fillColor` | `#hex` / `none` | `#FFFFFF` | 形狀填滿顏色（draw.io 預設；專案圖表請使用語意化調色盤） |
| `strokeColor` | `#hex` / `none` | `#000000` | 邊框/線條顏色（draw.io 預設；專案圖表請使用語意化調色盤） |
| `fontColor` | `#hex` | `#000000` | 文字顏色 |
| `fontSize` | 整數 | `11` | 字體大小 (pt) |
| `fontStyle` | 位元遮罩 (bitmask) | `0` | 粗體/斜體/底線 |
| `fontFamily` | 字串 | `Helvetica` | 字體家族名稱 |
| `align` | `left`/`center`/`right` | `center` | 文字水平對齊方式 |
| `verticalAlign` | `top`/`middle`/`bottom` | `middle` | 文字垂直對齊方式 |
| `opacity` | 0–100 | `100` | 形狀不透明度 (%) |
| `shadow` | `0`/`1` | `0` | 卸除式陰影 |
| `dashed` | `0`/`1` | `0` | 虛線邊框 |
| `dashPattern` | 例如 `8 8` | — | 自訂虛線/間隙模式 (px) |
| `strokeWidth` | 浮點數 | `2` | 邊框/線條寬度 (px) |
| `spacing` | 整數 | `2` | 文字周圍的留白 (px) |
| `spacingTop` | 整數 | `0` | 文字上方留白 |
| `spacingBottom` | 整數 | `0` | 文字下方留白 |
| `spacingLeft` | 整數 | `4` | 文字左側留白 |
| `spacingRight` | 整數 | `4` | 文字右側留白 |
| `html` | `0`/`1` | `0` | 允許標籤中使用 HTML |
| `whiteSpace` | `wrap`/`nowrap` | `nowrap` | 文字換行 |
| `overflow` | `visible`/`hidden`/`fill` | `visible` | 文字溢位行為 |
| `rotatable` | `0`/`1` | `1` | 允許在編輯器中旋轉 |
| `movable` | `0`/`1` | `1` | 允許在編輯器中移動 |
| `resizable` | `0`/`1` | `1` | 允許在編輯器中調整大小 |
| `deletable` | `0`/`1` | `1` | 允許在編輯器中刪除 |
| `editable` | `0`/`1` | `1` | 允許在編輯器中編輯標籤 |
| `locked` | `0`/`1` | `0` | 鎖定所有編輯行為 |
| `nolabel` | `0`/`1` | `0` | 完全隱藏標籤 |
| `noLabel` | `0`/`1` | `0` | `nolabel` 的別名 |
| `labelPosition` | `left`/`center`/`right` | `center` | 標籤水平錨點 |
| `verticalLabelPosition` | `top`/`middle`/`bottom` | `middle` | 標籤垂直錨點 |
| `imageAlign` | `left`/`center`/`right` | `center` | 圖片對齊方式 |

### `fontStyle` 位元遮罩值

| 值 | 效果 |
| ------- | -------- |
| `0` | 標準 |
| `1` | 粗體 |
| `2` | 斜體 |
| `4` | 底線 |
| `8` | 刪除線 |

可相加組合：`3` = 粗體 + 斜體, `5` = 粗體 + 底線, `7` = 粗體 + 斜體 + 底線。

---

## 形狀鍵值（僅限頂點） (Shape Keys (Vertex Only))

| 鍵 | 值 | 描述 |
| ----- | -------- | ------------- |
| `shape` | 請參閱形狀目錄 | 覆寫預設的矩形形狀 |
| `rounded` | `0`/`1` | 矩形圓角 |
| `arcSize` | 0–50 | 圓角半徑百分比（當 `rounded=1` 時） |
| `perimeter` | 函式名稱 | 連接周界類型 |
| `aspect` | `fixed` | 調整大小時鎖定長寬比 |
| `rotation` | 浮點數 | 旋轉角度 |
| `fixedSize` | `0`/`1` | 編輯標籤時防止自動調整大小 |
| `container` | `0`/`1` | 將形狀視為子元件的容器 |
| `collapsible` | `0`/`1` | 允許摺疊/展開切換 |
| `startSize` | 整數 | 泳道/容器的標頭大小 (px) |
| `swimlaneHead` | `0`/`1` | 顯示泳道標頭 |
| `swimlaneBody` | `0`/`1` | 顯示泳道主體 |
| `fillOpacity` | 0–100 | 僅限填滿的不透明度（獨立於 `opacity`） |
| `strokeOpacity` | 0–100 | 僅限線條的不透明度 |
| `gradientColor` | `#hex` / `none` | 漸層結束顏色 |
| `gradientDirection` | `north`/`south`/`east`/`west` | 漸層方向 |
| `sketch` | `0`/`1` | 粗糙的手繪風格 |
| `comic` | `0`/`1` | 漫畫/卡通線條風格 |
| `glass` | `0`/`1` | 玻璃反射效果 |

---

## 形狀目錄 (Shape Catalog)

### 基礎形狀

| 形狀 | 樣式字串 | 外觀 |
| ------- | ------------- | -------- |
| 矩形（預設） | *(不需要形狀鍵值)* | □ |
| 圓角矩形 | `rounded=1;` | ▢ |
| 橢圓 / 圓形 | `ellipse;` | ○ |
| 菱形 | `rhombus;` | ◇ |
| 三角形 | `triangle;` | △ |
| 六邊形 | `shape=hexagon;` | ⬡ |
| 五邊形 | `shape=mxgraph.basic.pentagon;` | ⬠ |
| 星形 | `shape=mxgraph.basic.star;` | ★ |
| 叉號 | `shape=mxgraph.basic.x;` | ✕ |
| 雲朵 | `shape=cloud;` | ☁ |
| 備註 / 標註 | `shape=note;folded=1;` | 📝 |
| 文件 | `shape=document;` | 📄 |
| 圓柱體（資料庫） | `shape=cylinder3;` | 🗄 |
| 磁帶 | `shape=tape;` | — |
| 平行四邊形 | `shape=parallelogram;perimeter=parallelogramPerimeter;` | ▱ |

### 流程圖形狀 (`mxgraph.flowchart.*`)

| 形狀 | 樣式字串 | 用途 |
| ------- | ------------- | ---------- |
| 處理 (Process) | `shape=mxgraph.flowchart.process;` | 標準流程步驟 |
| 開始/結束（終端） | `ellipse;` 或 `shape=mxgraph.flowchart.terminate;` | 流程開始/結束 |
| 決策 (Decision) | `rhombus;` | 是/否 分支 |
| 資料 (I/O) | `shape=mxgraph.flowchart.io;` | 輸入/輸出 |
| 預定義處理 | `shape=mxgraph.flowchart.predefined_process;` | 子常式 (Subroutine) |
| 手動輸入 | `shape=mxgraph.flowchart.manual_input;` | 手動輸入項目 |
| 手動操作 | `shape=mxgraph.flowchart.manual_operation;` | 手動步驟 |
| 資料庫 | `shape=mxgraph.flowchart.database;` | 資料儲存庫 |
| 內部儲存 | `shape=mxgraph.flowchart.internal_storage;` | 內部資料 |
| 直接資料 | `shape=mxgraph.flowchart.direct_data;` | 磁鼓儲存 |
| 文件 | `shape=mxgraph.flowchart.document;` | 文件 |
| 多重文件 | `shape=mxgraph.flowchart.multi-document;` | 多份文件 |
| 頁內連接器 | `ellipse;` (小型) | 頁面連接點 |
| 跨頁連接器 | `shape=mxgraph.flowchart.off_page_connector;` | 跨頁面參考 |
| 準備 (Preparation) | `shape=mxgraph.flowchart.preparation;` | 初始化 |
| 延遲 (Delay) | `shape=mxgraph.flowchart.delay;` | 等待狀態 |
| 顯示 (Display) | `shape=mxgraph.flowchart.display;` | 輸出顯示 |
| 排序 (Sort) | `shape=mxgraph.flowchart.sort;` | 排序操作 |
| 擷取 (Extract) | `shape=mxgraph.flowchart.extract;` | 擷取操作 |
| 合併 (Merge) | `shape=mxgraph.flowchart.merge;` | 合併路徑 |
| 或 (Or) | `shape=mxgraph.flowchart.or;` | OR 閘 |
| 與 (And) | `shape=mxgraph.flowchart.and;` | AND 閘 |
| 註釋 (Annotation) | `shape=mxgraph.flowchart.annotation;` | 評論/備註 |

### UML 形狀 (`mxgraph.uml.*`)

| 形狀 | 樣式字串 | 用途 |
| ------- | ------------- | ---------- |
| 參與者 | `shape=mxgraph.uml.actor;` | 使用案例參與者 |
| 邊界 | `shape=mxgraph.uml.boundary;` | 系統邊界 |
| 控制 | `shape=mxgraph.uml.control;` | 控制器物件 |
| 實體 | `shape=mxgraph.uml.entity;` | 實體物件 |
| 元件 | `shape=component;` | 元件盒 |
| 套件 | `shape=mxgraph.uml.package;` | 套件 |
| 備註 | `shape=note;` | UML 備註 |
| 生命線 | `shape=umlLifeline;startSize=40;` | 循序圖生命線 |
| 啟動 | `shape=umlActivation;` | 啟動區塊 |
| 銷毀 | `shape=mxgraph.uml.destroy;` | 銷毀標記 |
| 狀態 | `ellipse;` | 狀態節點 |
| 初始狀態 | `ellipse;fillColor=#000000;` | UML 初始狀態 |
| 結束狀態 | `shape=doubleEllipse;fillColor=#000000;` | UML 結束狀態 |
| 分叉/合併 | `shape=mxgraph.uml.fork_or_join;` | 分叉/合併橫條 |

### 網路形狀 (`mxgraph.network.*`)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| 伺服器 | `shape=server;` |
| 資料庫伺服器 | `shape=mxgraph.network.database;` |
| 防火牆 | `shape=mxgraph.cisco.firewalls.firewall;` |
| 路由器 | `shape=mxgraph.cisco.routers.router;` |
| 交換器 | `shape=mxgraph.cisco.switches.workgroup_switch;` |
| 雲端 | `shape=cloud;` |
| 網際網路 | `shape=mxgraph.network.internet;` |
| 筆記型電腦 | `shape=mxgraph.network.laptop;` |
| 桌上型電腦 | `shape=mxgraph.network.desktop;` |
| 行動電話 | `shape=mxgraph.network.mobile;` |

### AWS 形狀 (`mxgraph.aws4.*`)

使用 AWS4 函式庫。常見形狀：

| 形狀 | 樣式字串 |
| ------- | ------------- |
| EC2 | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;` |
| Lambda | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;` |
| S3 | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3;` |
| RDS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds;` |
| API Gateway | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway;` |
| CloudFront | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.cloudfront;` |
| Load Balancer | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.elb;` |
| SQS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sqs;` |
| SNS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sns;` |
| DynamoDB | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb;` |
| ECS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ecs;` |
| EKS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.eks;` |
| VPC | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;` |
| Region | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;` |

### Azure 形狀 (`mxgraph.azure.*`)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| App Service | `shape=mxgraph.azure.app_service;` |
| Function App | `shape=mxgraph.azure.function_apps;` |
| SQL Database | `shape=mxgraph.azure.sql_database;` |
| Blob Storage | `shape=mxgraph.azure.blob_storage;` |
| API Management | `shape=mxgraph.azure.api_management;` |
| Service Bus | `shape=mxgraph.azure.service_bus;` |
| AKS | `shape=mxgraph.azure.aks;` |
| Container Registry | `shape=mxgraph.azure.container_registry_registries;` |

### GCP 形狀 (`mxgraph.gcp2.*`)

| 形狀 | 樣式字串 |
| ------- | ------------- |
| Cloud Run | `shape=mxgraph.gcp2.cloud_run;` |
| Cloud Functions | `shape=mxgraph.gcp2.cloud_functions;` |
| Cloud SQL | `shape=mxgraph.gcp2.cloud_sql;` |
| Cloud Storage | `shape=mxgraph.gcp2.cloud_storage;` |
| GKE | `shape=mxgraph.gcp2.container_engine;` |
| Pub/Sub | `shape=mxgraph.gcp2.cloud_pubsub;` |
| BigQuery | `shape=mxgraph.gcp2.bigquery;` |

---

## 邊緣樣式鍵值 (Edge Style Keys)

| 鍵 | 值 | 描述 |
| ----- | -------- | ------------- |
| `edgeStyle` | 如下所述 | 連接路由演算法 |
| `rounded` | `0`/`1` | 直角邊緣的圓角 |
| `curved` | `0`/`1` | 曲線線段 |
| `orthogonal` | `0`/`1` | 強制執行正交路由 |
| `jettySize` | `auto`/整數 | 來源/目標的噴射大小 (jet size) |
| `exitX` | 0.0–1.0 | 來源出口點 X (0=左, 0.5=中, 1=右) |
| `exitY` | 0.0–1.0 | 來源出口點 Y (0=上, 0.5=中, 1=下) |
| `exitDx` | 浮點數 | 來源出口 X 位移 (px) |
| `exitDy` | 浮點數 | 來源出口 Y 位移 (px) |
| `entryX` | 0.0–1.0 | 目標入口點 X |
| `entryY` | 0.0–1.0 | 目標入口點 Y |
| `entryDx` | 浮點數 | 目標入口 X 位移 (px) |
| `entryDy` | 浮點數 | 目標入口 Y 位移 (px) |
| `endArrow` | 如下所述 | 目標端的箭頭 |
| `startArrow` | 如下所述 | 來源端的箭頭尾部 |
| `endFill` | `0`/`1` | 實心結束箭頭 |
| `startFill` | `0`/`1` | 實心起始箭頭 |
| `endSize` | 整數 | 結束箭頭大小 (px) |
| `startSize` | 整數 | 起始箭頭大小 (px) |
| `labelBackgroundColor` | `#hex`/`none` | 標籤背景填滿 |
| `labelBorderColor` | `#hex`/`none` | 標籤邊框顏色 |

### `edgeStyle` 值

| 值 | 路由方式 | 何時使用 |
| ------- | --------- | ---------- |
| `none` | 直線 | 簡單的直接連接 |
| `orthogonalEdgeStyle` | 直角轉彎 | 流程圖、架構圖 |
| `elbowEdgeStyle` | 單一彎折 | 清爽的有向圖表 |
| `entityRelationEdgeStyle` | ER 風格路由 | ER 圖 |
| `segmentEdgeStyle` | 帶控制點的分段 | 微調路由 |
| `isometricEdgeStyle` | 等角網格 | 等角圖 (Isometric) |

### 箭頭類型 (`endArrow` / `startArrow`)

| 值 | 形狀 | 用途 |
| ------- | ------- | --------- |
| `block` | 實心三角形 | 標準有向箭頭 |
| `open` | 開放式 V 形 → | 輕量化箭頭 |
| `classic` | 經典箭頭 | draw.io 預設箭頭 |
| `classicThin` | 細經典箭頭 | 緊湊型圖表 |
| `none` | 無箭頭 | 無方向線條 |
| `oval` | 圓點 | 聚合起始點 |
| `diamond` | 空心菱形 | 聚合 |
| `diamondThin` | 細菱形 | 纖細型圖表 |
| `ERone` | `\|` 橫條 | ER 基數「一」 |
| `ERmany` | 鴉腳 | ER 基數「多」 |
| `ERmandOne` | `\|\|` | ER 強制一 |
| `ERzeroToOne` | `o\|` | ER 零或一 |
| `ERzeroToMany` | `o<` | ER 零或多 |
| `ERoneToMany` | `\|<` | ER 一或多 |

---

## 調色盤 (Color Palette)

### 語意化顏色（建議用於保持圖表一致性）

| 意義 | 填滿 (Fill) | 線條 (Stroke) | 用法 |
| --------- | ------ | -------- | ------- |
| 使用者 / 用戶端 | `#dae8fc` | `#6c8ebf` | 瀏覽器、用戶端應用程式 |
| 服務 / 程序 | `#d5e8d4` | `#82b366` | 後端服務 |
| 資料庫 / 儲存 | `#f5f5f5` | `#666666` | 資料庫、檔案 |
| 決策 / 警告 | `#fff2cc` | `#d6b656` | 決策節點、警示 |
| 錯誤 / 重大 | `#f8cecc` | `#b85450` | 錯誤路徑、關鍵錯誤 |
| 外部 / 夥伴 | `#e1d5e7` | `#9673a6` | 第三方、外部系統 |
| 佇列 / 非同步 | `#ffe6cc` | `#d79b00` | 訊息佇列 |
| 閘道 / 代理 | `#dae8fc` | `#0050ef` | API 閘道、代理伺服器 |

### 深色背景形狀

對於深色主題的圖表，請換成：

- 填滿：`#1e4d78` (深藍), `#1a4731` (深綠)
- 線條：`#4aa3df`, `#67ab9f`
- 字體：`#ffffff`

---

## 完整樣式範例

### 圓角藍色方框

```text
rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
```

### 綠色流程步驟

```text
rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
```

### 黃色決策菱形

```text
rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;
```

### 紅色錯誤方框

```text
rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;
```

### 資料庫圓柱體

```text
shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;fillColor=#f5f5f5;strokeColor=#666666;
```

### 泳道容器

```text
shape=pool;startSize=30;horizontal=1;fillColor=#f5f5f5;strokeColor=#999999;
```

### 泳道 (Lane)

```text
swimlane;startSize=30;fillColor=#ffffff;strokeColor=#999999;
```

### 正交連接器 (Orthogonal Connector)

```text
edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;
```

### 有向箭頭（粗線）

```text
edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeWidth=2;
```

### 虛線依賴線

```text
edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;endFill=0;strokeColor=#666666;
```

### ER 關聯線（一對多）

```text
edgeStyle=entityRelationEdgeStyle;html=1;endArrow=ERmany;startArrow=ERmandOne;endFill=1;startFill=1;
```

### UML 繼承箭頭（空心三角形）

```text
edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=0;
```

### UML 組合 (Composition)（實心菱形）

```text
edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=1;endArrow=none;
```

### UML 聚合 (Aggregation)（空心菱形）

```text
edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=0;endArrow=none;
```

### UML 依賴 (Dependency)（虛線箭頭）

```text
edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=open;endFill=0;
```

### 隱形連接器（用於對齊）

```text
edgeStyle=none;strokeColor=none;endArrow=none;
```
