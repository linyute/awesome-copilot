---
name: excalidraw-diagram-generator
description: '根據自然語言描述生成 Excalidraw 圖表。當被要求「建立圖表」、「製作流程圖」、「視覺化流程」、「繪製系統架構」、「建立心智圖」或「生成 Excalidraw 檔案」時使用。支援流程圖、關聯圖、心智圖和系統架構圖。輸出可以直接在 Excalidraw 中開啟的 .excalidraw JSON 檔案。'
---

# Excalidraw 圖表生成器

一個用於根據自然語言描述生成 Excalidraw 格式圖表的技能。此技能有助於在無需手動繪製的情況下建立流程、系統、關聯和想法的視覺化表示。
## 何時使用此技能

當使用者請求以下內容時使用此技能：

- 「建立一個圖表顯示...」
- 「為...製作一個流程圖」
- 「視覺化...的流程」
- 「繪製...的系統架構」
- 「生成一個關於...的心智圖」
- 「為...建立一個 Excalidraw 檔案」
- 「顯示...之間的關聯」
- 「繪製...的工作流圖」

**支援的圖表類型：**
- 📊 **流程圖**：順序流程、工作流、決策樹
- 🔗 **關聯圖**：實體關聯、系統元件、依賴關係
- 🧠 **心智圖**：概念階層、腦力激盪結果、主題組織
- 🏗️ **架構圖**：系統設計、模組互動、資料流
- 📈 **資料流圖 (DFD)**：資料流視覺化、資料轉換流程
- 🏊 **業務流程圖 (泳道圖)**：跨部門工作流、基於角色的流程圖
- 📦 **類別圖**：物件導向設計、類別結構和關聯
- 🔄 **循序圖**：隨時間變化的物件互動、訊息流
- 🗃️ **實體關聯圖 (ER 圖)**：資料庫實體關聯、資料模型

## 前提條件

- 對應視覺化內容的清晰描述
- 識別關鍵實體、步驟或概念
- 理解元素之間的關聯或流動

## 逐步工作流

### 步驟 1：理解請求

分析使用者的描述以確定：
1. **圖表類型**（流程圖、關聯圖、心智圖、架構圖）
2. **關鍵元素**（實體、步驟、概念）
3. **關聯**（流動、連接、階層）
4. **複雜度**（元素數量）

### 步驟 2：選擇適當的圖表類型

| 使用者意圖 | 圖表類型 | 範例關鍵字 |
|-------------|--------------|------------------|
| 流程、步驟、程序 | **流程圖** | "workflow", "process", "steps", "procedure" |
| 連接、依賴關係、關聯 | **關聯圖** | "relationship", "connections", "dependencies", "structure" |
| 概念階層、腦力激盪 | **心智圖** | "mind map", "concepts", "ideas", "breakdown" |
| 系統設計、元件 | **架構圖** | "architecture", "system", "components", "modules" |
| 資料流、轉換流程 | **資料流圖 (DFD)** | "data flow", "data processing", "data transformation" |
| 跨功能流程、參與者責任 | **業務流程圖 (泳道圖)** | "business process", "swimlane", "actors", "responsibilities" |
| 物件導向設計、類別結構 | **類別圖** | "class", "inheritance", "OOP", "object model" |
| 互動序列、訊息流 | **循序圖** | "sequence", "interaction", "messages", "timeline" |
| 資料庫設計、實體關聯 | **ER 圖** | "database", "entity", "relationship", "data model" |

### 步驟 3：提取結構化資訊

**對於流程圖：**
- 順序步驟列表
- 決策點（如果有）
- 起點和終點

**對於關聯圖：**
- 實體/節點（名稱 + 選用描述）
- 實體之間的關聯（從 → 到，帶標籤）

**對於心智圖：**
- 中心主題
- 主要分支（建議 3-6 個）
- 每個分支的子主題（選用）

**對於資料流圖 (DFD)：**
- 資料來源和目的地（外部實體）
- 流程（資料轉換）
- 資料儲存（資料庫、檔案）
- 資料流（顯示資料從左到右或從左上到右下移動的箭頭）
- **重要**：不要表示流程順序，僅表示資料流

**對於業務流程圖 (泳道圖)：**
- 參與者/角色（部門、系統、人員）- 顯示為標題列
- 流程泳道（每個參與者下方的垂直泳道）
- 流程框（每個泳道內的活動）
- 流動箭頭（連接流程框，包括跨泳道交接）

**對於類別圖：**
- 類別名稱
- 具備可見性的屬性 (+, -, #)
- 具備可見性和參數的函式
- 關聯：繼承（實線 + 白色三角形）、實作（虛線 + 白色三角形）、關聯（實線）、依賴（虛線）、聚合（實線 + 白色菱形）、組合（實線 + 實心菱形）
- 多重性標記 (1, 0..1, 1..*, *)

**對於循序圖：**
- 物件/參與者（水平排列在頂部）
- 生命線（從每個物件延伸的垂直線）
- 訊息（生命線之間的水平箭頭）
- 同步訊息（實心箭頭）、非同步訊息（虛線箭頭）
- 回傳值（虛線箭頭）
- 啟動框（執行期間生命線上的矩形）
- 時間從上到下流動

**對於 ER 圖：**
- 實體（帶有實體名稱的矩形）
- 屬性（在實體內部列出）
- 主鍵（底線或標記為 PK）
- 外鍵（標記為 FK）
- 關聯（連接實體的線）
- 基數：1:1 (一對一)、1:N (一對多)、N:M (多對多)
- 多對多關聯的連接/關聯實體（虛線矩形）
### 步驟 4：生成 Excalidraw JSON

建立帶有適當元素的 `.excalidraw` 檔案：

**可用的元素類型：**
- `rectangle`：實體、步驟、概念的方框
- `ellipse`：用於強調的替代形狀
- `diamond`：決策點
- `arrow`：指向性連接
- `text`：標籤和註釋

**要設定的關鍵屬性：**
- **位置**：`x`, `y` 座標
- **大小**：`width`, `height`
- **樣式**：`strokeColor`, `backgroundColor`, `fillStyle`
- **字型**：`fontFamily: 5` (Excalifont - **所有文字元素均為必填**)
- **文字**：標籤的嵌入文字
- **連接**：箭頭的 `points` 陣列

**重要**：所有文字元素必須使用 `fontFamily: 5` (Excalifont) 以確保視覺外觀一致。

### 步驟 5：格式化輸出

建構完整的 Excalidraw 檔案：

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    // 圖表元素陣列
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

### 步驟 6：儲存並提供說明

1. 儲存為 `<描述性名稱>.excalidraw`
2. 告知使用者如何開啟：
   - 造訪 https://excalidraw.com
   - 點擊「開啟」或拖放檔案
   - 或使用 Excalidraw VS Code 擴充功能

## 最佳實踐

### 元素數量指南

| 圖表類型 | 建議數量 | 最大數量 |
|--------------|-------------------|---------|
| 流程圖步驟 | 3-10 | 15 |
| 關聯圖實體 | 3-8 | 12 |
| 心智圖分支 | 4-6 | 8 |
| 每個分支的心智圖子主題 | 2-4 | 6 |

### 佈局提示

1. **起始位置**：將重要元素置中，使用一致的間距
2. **間距**：
   - 水平間距：元素之間 200-300px
   - 垂直間距：行之間 100-150px
3. **顏色**：使用一致的配色方案
   - 主要元素：淡藍色 (`#a5d8ff`)
   - 次要元素：淺綠色 (`#b2f2bb`)
   - 重要/中心：黃色 (`#ffd43b`)
   - 警報/警告：淺紅色 (`#ffc9c9`)
4. **文字大小**：16-24px 以利閱讀
5. **字型**：所有文字元素務必使用 `fontFamily: 5` (Excalifont)
6. **箭頭樣式**：簡單流程使用直箭頭，複雜關聯使用彎曲箭頭

### 複雜度管理

**如果使用者請求包含過多元素：**
- 建議拆分為多個圖表
- 首先關注主要元素
- 提議建立詳細的子圖表

**範例回應：**
```
「您的請求包含 15 個元件。為了清晰起見，我建議：
1. 高階架構圖（6 個主要元件）
2. 每個子系統的詳細圖表

您希望我從高階檢視開始嗎？」
```
## 範例提示和回應

### 範例 1：簡單流程圖

**使用者**：「建立一個使用者註冊的流程圖」

**代理程式生成**：
1. 提取步驟：「輸入電子郵件」→「驗證電子郵件」→「設定密碼」→「完成」
2. 建立包含 4 個矩形 + 3 個箭頭的流程圖
3. 儲存為 `user-registration-flow.excalidraw`

### 範例 2：關聯圖

**使用者**：「繪製 User、Post 和 Comment 實體之間的關聯圖」

**代理程式生成**：
1. 實體：User, Post, Comment
2. 關聯：User → Post（「建立」）、User → Comment（「撰寫」）、Post → Comment（「包含」）
3. 儲存為 `user-content-relationships.excalidraw`

### 範例 3：心智圖

**使用者**：「關於機器學習概念的心智圖」

**代理程式生成**：
1. 中心：「機器學習」
2. 分支：監督式學習、非監督式學習、強化學習、深度學習
3. 每個分支下的子主題
4. 儲存為 `machine-learning-mindmap.excalidraw`

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 元素重疊 | 增加座標之間的間距 |
| 文字放不進框內 | 增加方框寬度或減小字型大小 |
| 元素過多 | 拆分為多個圖表 |
| 佈局不清晰 | 使用網格佈局（行/列）或放射狀佈局（心智圖） |
| 顏色不一致 | 根據元素類型預先定義調色盤 |

## 進階技術

### 網格佈局（用於關聯圖）
```javascript
const columns = Math.ceil(Math.sqrt(entityCount));
const x = startX + (index % columns) * horizontalGap;
const y = startY + Math.floor(index / columns) * verticalGap;
```

### 放射狀佈局（用於心智圖）
```javascript
const angle = (2 * Math.PI * index) / branchCount;
const x = centerX + radius * Math.cos(angle);
const y = centerY + radius * Math.sin(angle);
```

### 自動生成的 ID
使用時間戳記 + 隨機字串作為唯一 ID：
```javascript
const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
```

## 輸出格式

始終提供：
1. ✅ 完整的 `.excalidraw` JSON 檔案
2. 📊 已建立內容的摘要
3. 📝 元素數量
4. 💡 開啟/編輯說明

**範例摘要：**
```
已建立：user-workflow.excalidraw
類型：流程圖
元素：7 個矩形、6 個箭頭、1 個標題文字
總計：14 個元素

檢視方式：
1. 造訪 https://excalidraw.com
2. 拖放 user-workflow.excalidraw
3. 或在 Excalidraw VS Code 擴充功能中使用 檔案 → 開啟
```

## 驗證清單

在交付圖表之前：
- [ ] 所有元素都有唯一的 ID
- [ ] 座標防止重疊
- [ ] 文字可讀（字型大小 16+）
- [ ] **所有文字元素均使用 `fontFamily: 5` (Excalifont)**
- [ ] 箭頭邏輯連接
- [ ] 顏色遵循一致的方案
- [ ] 檔案為有效的 JSON
- [ ] 元素數量合理（<20 以確保清晰）
## 圖示函式庫 (選用增強)

對於專業圖表 (例如 AWS/GCP/Azure 架構圖)，您可以使用 Excalidraw 預製的圖示函式庫。這提供了專業、標準化的圖示，而非基本形狀。

### 當使用者請求圖示時

**如果使用者要求 AWS/雲端架構圖或提到想要使用特定圖示：**

1. **檢查函式庫是否存在**：尋找 `libraries/<library-name>/reference.md`
2. **如果函式庫存在**：繼續使用圖示 (請參閱下方的 AI 助手工作流)
3. **如果函式庫不存在**：回應設定說明：

   ```
   若要使用 [AWS/GCP/Azure/等] 架構圖示，請遵循以下步驟：
   
   1. 造訪 https://libraries.excalidraw.com/
   2. 搜尋 "[AWS Architecture Icons/等]" 並下載 .excalidrawlib 檔案
   3. 建立目錄：skills/excalidraw-diagram-generator/libraries/[icon-set-name]/
   4. 將下載的檔案放入該目錄
   5. 執行分割指令碼：
      python skills/excalidraw-diagram-generator/scripts/split-excalidraw-library.py skills/excalidraw-diagram-generator/libraries/[icon-set-name]/
   
   這會將函式庫分割為個別圖示檔案以實現高效率使用。
   設定完成後，我可以使用實際的 AWS/雲端圖示建立您的圖表。
   
   或者，我現在可以使用簡單形狀 (矩形、橢圓) 建立圖表，之後您可以手動在 Excalidraw 中將其替換為圖示。
   ```

### 使用者設定說明 (詳細)

**步驟 1：建立函式庫目錄**
```bash
mkdir -p skills/excalidraw-diagram-generator/libraries/aws-architecture-icons
```

**步驟 2：下載函式庫**
- 造訪：https://libraries.excalidraw.com/
- 搜尋您想要的圖示集 (例如 "AWS Architecture Icons")
- 點擊下載以取得 `.excalidrawlib` 檔案
- 範例類別 (可用性有所不同；請在網站上確認)：
   - 雲端服務圖示
   - UI/Material 圖示
   - 流程圖符號

**步驟 3：放置函式庫檔案**
- 將下載的檔案重新命名以符合目錄名稱 (例如 `aws-architecture-icons.excalidrawlib`)
- 將其移動到步驟 1 中建立的目錄

**步驟 4：執行分割指令碼**
```bash
python skills/excalidraw-diagram-generator/scripts/split-excalidraw-library.py skills/excalidraw-diagram-generator/libraries/aws-architecture-icons/
```

**步驟 5：驗證設定**
執行指令碼後，驗證是否存在以下結構：
```
skills/excalidraw-diagram-generator/libraries/aws-architecture-icons/
  aws-architecture-icons.excalidrawlib  (原始)
  reference.md                          (產生的 - 圖示查詢表)
  icons/                                (產生的 - 個別圖示檔案)
    API-Gateway.json
    CloudFront.json
    EC2.json
    Lambda.json
    RDS.json
    S3.json
    ...
```
### AI 助手工作流

**當圖示函式庫在 `libraries/` 中可用時：**

**推薦方法：使用 Python 指令碼 (高效且可靠)**

儲存庫包含自動處理圖示整合的 Python 指令碼：

1. **建立基礎圖表結構**：
   - 建立具有基本佈局 (標題、框、區域) 的 `.excalidraw` 檔案
   - 這建立了畫布和整體結構

2. **使用 Python 指令碼新增圖示**：
   ```bash
   python skills/excalidraw-diagram-generator/scripts/add-icon-to-diagram.py 
     <diagram-path> <icon-name> <x> <y> [--label "文字"] [--library-path 路徑]
   ```
   - 預設啟用經由 `.excalidraw.edit` 進行編輯以避免覆寫問題；傳遞 `--no-use-edit-suffix` 以停用。
   
   **範例**：
   ```bash
   # 在位置 (400, 300) 新增帶有標籤的 EC2 圖示
   python scripts/add-icon-to-diagram.py diagram.excalidraw EC2 400 300 --label "Web Server"
   
   # 在位置 (200, 150) 新增 VPC 圖示
   python scripts/add-icon-to-diagram.py diagram.excalidraw VPC 200 150
   
   # 從不同的函式庫新增圖示
   python scripts/add-icon-to-diagram.py diagram.excalidraw Compute-Engine 500 200 
     --library-path libraries/gcp-icons --label "API Server"
   ```

3. **新增連接箭頭**：
   ```bash
   python skills/excalidraw-diagram-generator/scripts/add-arrow.py 
     <diagram-path> <from-x> <from-y> <to-x> <to-y> [--label "文字"] [--style solid|dashed|dotted] [--color 十六進位]
   ```
   - 預設啟用經由 `.excalidraw.edit` 進行編輯以避免覆寫問題；傳遞 `--no-use-edit-suffix` 以停用。
   
   **範例**：
   ```bash
   # 從 (300, 250) 到 (500, 300) 的簡單箭頭
   python scripts/add-arrow.py diagram.excalidraw 300 250 500 300
   
   # 帶有標籤的箭頭
   python scripts/add-arrow.py diagram.excalidraw 300 250 500 300 --label "HTTPS"
   
   # 帶有自訂顏色的虛線箭頭
   python scripts/add-arrow.py diagram.excalidraw 400 350 600 400 --style dashed --color "#7950f2"
   ```

4. **工作流摘要**：
   ```bash
   # 步驟 1：建立具有標題和結構的基礎圖表
   # (建立具有初始元素的 .excalidraw 檔案)
   
   # 步驟 2：新增帶有標籤的圖示
   python scripts/add-icon-to-diagram.py my-diagram.excalidraw "Internet-gateway" 200 150 --label "Internet Gateway"
   python scripts/add-icon-to-diagram.py my-diagram.excalidraw VPC 250 250
   python scripts/add-icon-to-diagram.py my-diagram.excalidraw ELB 350 300 --label "Load Balancer"
   python scripts/add-icon-to-diagram.py my-diagram.excalidraw EC2 450 350 --label "EC2 Instance"
   python scripts/add-icon-to-diagram.py my-diagram.excalidraw RDS 550 400 --label "Database"
   
   # 步驟 3：新增連接箭頭
   python scripts/add-arrow.py my-diagram.excalidraw 250 200 300 250  # Internet → VPC
   python scripts/add-arrow.py my-diagram.excalidraw 300 300 400 300  # VPC → ELB
   python scripts/add-arrow.py my-diagram.excalidraw 400 330 500 350  # ELB → EC2
   python scripts/add-arrow.py my-diagram.excalidraw 500 380 600 400  # EC2 → RDS
   ```

**Python 指令碼方法的優點**：
- ✅ **不消耗 Token**：圖示 JSON 資料 (每個 200-1000 行) 永不進入 AI 上下文
- ✅ **精確轉換**：座標計算由程式確定性處理
- ✅ **ID 管理**：自動生成 UUID 以防止衝突
- ✅ **可靠**：無座標計算錯誤或 ID 衝突風險
- ✅ **快速**：直接檔案操作，無解析開銷
- ✅ **可重複使用**：適用於您提供的任何 Excalidraw 函式庫

**替代方案：手動整合圖示 (不推薦)**

僅在 Python 指令碼不可用時使用：

1. **檢查函式庫**：
   ```
   列出目錄：skills/excalidraw-diagram-generator/libraries/
   尋找包含 reference.md 檔案的子目錄
   ```

2. **讀取 reference.md**：
   ```
   開啟：libraries/<library-name>/reference.md
   這很輕量 (通常 <300 行)，並列出所有可用圖示
   ```

3. **尋找相關圖示**：
   ```
   在 reference.md 表格中搜尋與圖表需求相符的圖示名稱
   範例：對於包含 EC2、S3、Lambda 的 AWS 圖表 → 在表格中尋找 "EC2"、"S3"、"Lambda"
   ```

4. **載入特定圖示資料** (警告：大檔案)：
   ```
   僅讀取所需的圖示檔案：
   - libraries/aws-architecture-icons/icons/EC2.json (200-300 行)
   - libraries/aws-architecture-icons/icons/S3.json (200-300 行)
   - libraries/aws-architecture-icons/icons/Lambda.json (200-300 行)
   注意：每個圖示檔案為 200-1000 行 - 這會消耗大量 Token
   ```

5. **提取並轉換元素**：
   ```
   每個圖示 JSON 包含一個 "elements" 陣列
   計算邊界框 (min_x, min_y, max_x, max_y)
   對所有 x/y 座標套用偏移
   為所有元素生成新的唯一 ID
   更新 groupIds 參照
   將轉換後的元素複製到您的圖表中
   ```

6. **定位圖示並新增連接**：
   ```
   調整 x/y 座標以在圖表中正確定位圖示
   更新 ID 以確保整個圖表中的唯一性
   視需要新增連接箭頭和標籤
   ```

**手動整合的挑戰**：
- ⚠️ 高 Token 消耗 (每個圖示 200-1000 行 × 圖示數量)
- ⚠️ 複雜的座標轉換計算
- ⚠️ 若處理不慎會有 ID 衝突風險
- ⚠️ 對於包含許多圖示的圖表非常耗時
### 範例：使用圖示建立 AWS 圖表

**請求**：「建立一個包含 Internet Gateway、VPC、ELB、EC2 和 RDS 的 AWS 架構圖」

**推薦工作流 (使用 Python 指令碼)**：

```bash
# 步驟 1：建立具有標題的基礎圖表檔案
# 建立具有基本結構 (標題等) 的 my-aws-diagram.excalidraw

# 步驟 2：檢查圖示可用性
# 讀取：libraries/aws-architecture-icons/reference.md
# 確認圖示存在：Internet-gateway, VPC, ELB, EC2, RDS

# 步驟 3：使用 Python 指令碼新增圖示
python scripts/add-icon-to-diagram.py my-aws-diagram.excalidraw "Internet-gateway" 150 100 --label "Internet Gateway"
python scripts/add-icon-to-diagram.py my-aws-diagram.excalidraw VPC 200 200
python scripts/add-icon-to-diagram.py my-aws-diagram.excalidraw ELB 350 250 --label "Load Balancer"
python scripts/add-icon-to-diagram.py my-aws-diagram.excalidraw EC2 500 300 --label "Web Server"
python scripts/add-icon-to-diagram.py my-aws-diagram.excalidraw RDS 650 350 --label "Database"

# 步驟 4：新增連接箭頭
python scripts/add-arrow.py my-aws-diagram.excalidraw 200 150 250 200  # Internet → VPC
python scripts/add-arrow.py my-aws-diagram.excalidraw 265 230 350 250  # VPC → ELB
python scripts/add-arrow.py my-aws-diagram.excalidraw 415 280 500 300  # ELB → EC2
python scripts/add-arrow.py my-aws-diagram.excalidraw 565 330 650 350 --label "SQL" --style dashed

# 結果：使用專業 AWS 圖示、標籤和連接完成圖表
```

**優點**：
- 無需手動座標計算
- 圖示資料不消耗 Token
- 確定性、可靠的結果
- 易於反覆運算和調整位置

**替代工作流 (手動，如果指令碼不可用)**：
1. 檢查：`libraries/aws-architecture-icons/reference.md` 是否存在 → 是
2. 讀取 reference.md → 尋找 Internet-gateway、VPC、ELB、EC2、RDS 的條目
3. 載入：
   - `icons/Internet-gateway.json` (298 行)
   - `icons/VPC.json` (550 行)
   - `icons/ELB.json` (363 行)
   - `icons/EC2.json` (231 行) 
   - `icons/RDS.json` (類似大小)
   **總計：約 2000+ 行 JSON 需要處理**
4. 從每個 JSON 提取元素
5. 計算每個圖示的邊界框和偏移
6. 轉換所有座標 (x, y) 以進行定位
7. 為所有元素生成唯一 ID
8. 新增顯示資料流的箭頭
9. 新增文字標籤
10. 生成最終的 `.excalidraw` 檔案

**手動方法的挑戰**：
- 高 Token 消耗 (約 2000-5000 行)
- 複雜的座標數學
- ID 衝突風險

### 支援的圖示函式庫 (範例 — 請驗證可用性)

- 此工作流適用於您提供的任何有效 `.excalidrawlib` 檔案。
- 您可以在 https://libraries.excalidraw.com/ 上找到的函式庫類別範例包括：
   - 雲端服務圖示
   - Kubernetes / 基礎設施圖示
   - UI / Material 圖示
   - 流程圖 / 圖表符號
   - 網路圖示
- 可用性和命名可能會變動；使用前請在網站上驗證確切的函式庫名稱。

### 遞補方案：無可用圖示

**如果未設定圖示函式庫：**
- 使用基本形狀 (矩形、橢圓、箭頭) 建立圖表
- 使用色彩編碼和文字標籤來區分元件
- 告知使用者稍後可以新增圖示或為將來的圖表設定函式庫
- 圖表仍然可以運作且清晰，只是視覺上不夠精緻

## 參考資料

請參閱隨附的參考資料：
- `references/excalidraw-schema.md` - 完整的 Excalidraw JSON 結構描述
- `references/element-types.md` - 詳細的元素類型規格
- `templates/flowchart-template.json` - 基本流程圖入門範本
- `templates/relationship-template.json` - 關聯圖入門範本
- `templates/mindmap-template.json` - 心智圖入門範本
- `scripts/split-excalidraw-library.py` - 用於分割 `.excalidrawlib` 檔案的工具
- `scripts/README.md` - 函式庫工具文件
- `scripts/.gitignore` - 防止本機 Python 產出物被提交

## 限制

- 複雜曲線被簡化為直線/基本曲線
- 手繪粗糙度設定為預設值 (1)
- 自動生成不支援嵌入圖片
- 每個圖表建議的最大元素數量：20
- 無自動碰撞偵測 (請使用間距指南)

## 未來增強功能

潛在的改進：
- 自動佈局最佳化演算法
- 從 Mermaid/PlantUML 語法匯入
- 範本庫擴展
- 生成後的互動式編輯
