# Excalidraw 函式庫工具

此目錄包含用於處理 Excalidraw 函式庫的指令碼。

## split-excalidraw-library.py

將 Excalidraw 函式庫檔案 (`*.excalidrawlib`) 分割成個別的圖示 JSON 檔案，以便 AI 助手能夠高效地使用 Token。

### 前提條件

- Python 3.6 或更高版本
- 無需額外的依賴項（僅使用標準函式庫）

### 用法

```bash
python split-excalidraw-library.py <函式庫目錄路徑>
```

### 逐步工作流

1. **建立函式庫目錄**：
   ```bash
   mkdir -p skills/excalidraw-diagram-generator/libraries/aws-architecture-icons
   ```

2. **下載並放置函式庫檔案**：
   - 造訪：https://libraries.excalidraw.com/
   - 搜尋 "AWS Architecture Icons" 並下載 `.excalidrawlib` 檔案
   - 將其重新命名以符合目錄名稱：`aws-architecture-icons.excalidrawlib`
   - 將其放入步驟 1 中建立的目錄中

3. **執行指令碼**：
   ```bash
   python skills/excalidraw-diagram-generator/scripts/split-excalidraw-library.py skills/excalidraw-diagram-generator/libraries/aws-architecture-icons/
   ```

### 輸出結構

該指令碼會在函式庫目錄中建立以下結構：

```
skills/excalidraw-diagram-generator/libraries/aws-architecture-icons/
  aws-architecture-icons.excalidrawlib  # 原始檔案（保留）
  reference.md                          # 產生的：快速查詢表
  icons/                                # 產生的：個別圖示檔案
    API-Gateway.json
    CloudFront.json
    EC2.json
    S3.json
    ...
```

### 指令碼功能

1. **讀取** `.excalidrawlib` 檔案
2. 從 `libraryItems` 陣列中**提取**每個圖示
3. **淨化**圖示名稱以建立有效的檔名（空格 → 連字號，移除特殊字元）
4. 將每個圖示作為單獨的 JSON 檔案**儲存**在 `icons/` 目錄中
5. **產生**一個 `reference.md` 檔案，其中包含將圖示名稱映射到檔名的表格

### 優點

- **Token 效率**：AI 可以先讀取輕量級的 `reference.md` 來尋找相關圖示，然後僅載入所需的特定圖示檔案。
- **組織性**：圖示以清晰的目錄結構進行組織。
- **擴充性**：使用者可以並排新增多個函式庫集合。

### 建議工作流

1. 從 https://libraries.excalidraw.com/ 下載所需的 Excalidraw 函式庫。
2. 對每個函式庫檔案執行此指令碼。
3. 將產生的資料夾移動到 `../libraries/`。
4. AI 助手將使用 `reference.md` 檔案來高效地定位和使用圖示。

### 函式庫來源（範例 — 請驗證可用性）

- 在 https://libraries.excalidraw.com/ 上找到的範例可能包括雲端/服務圖示集。
- 可用性隨時間變化；使用前請在網站上驗證確切的函式庫名稱。
- 此指令碼適用於您提供的任何有效 `.excalidrawlib` 檔案。

### 疑難排解

**錯誤：找不到檔案 (File not found)**
- 檢查檔案路徑是否正確。
- 確保檔案具有 `.excalidrawlib` 副檔名。

**錯誤：無效的函式庫檔案格式 (Invalid library file format)**
- 確保檔案是有效的 Excalidraw 函式庫檔案。
- 檢查它是否包含 `libraryItems` 陣列。

### 授權考量

使用第三方圖示函式庫時：
- **AWS Architecture Icons**：受 AWS 內容授權條款約束。
- **GCP Icons**：受 Google 條款約束。
- **其他函式庫**：請檢查各個函式庫的授權。

此指令碼僅供個人/組織使用。重新發佈分割後的圖示檔案應遵守原始函式庫的授權條款。

## add-icon-to-diagram.py

將分割後的 Excalidraw 函式庫中的特定圖示新增至現有的 `.excalidraw` 圖表中。該指令碼會處理座標轉換和 ID 衝突規避，並可選地在圖示下方新增標籤。

### 前提條件

- Python 3.6 或更高版本
- 圖表檔案 (`.excalidraw`)
- 分割後的圖示函式庫目錄（由 `split-excalidraw-library.py` 建立）

### 用法

```bash
python add-icon-to-diagram.py <圖表路徑> <圖示名稱> <x> <y> [選項]
```

**選項**
- `--library-path 路徑`：圖示函式庫目錄的路徑（預設：`aws-architecture-icons`）
- `--label 文字`：在圖示下方新增文字標籤
- `--use-edit-suffix`：透過 `.excalidraw.edit` 進行編輯，以避免編輯器覆寫問題（預設啟用；傳遞 `--no-use-edit-suffix` 即可停用）

### 範例

```bash
# 在位置 (400, 300) 新增 EC2 圖示
python add-icon-to-diagram.py diagram.excalidraw EC2 400 300

# 新增帶有標籤的 VPC 圖示
python add-icon-to-diagram.py diagram.excalidraw VPC 200 150 --label "VPC"

# 預設啟用安全編輯模式（規避編輯器覆寫問題）
# 使用 `--no-use-edit-suffix` 即可停用
python add-icon-to-diagram.py diagram.excalidraw EC2 500 300

# 從另一個函式庫新增圖示
python add-icon-to-diagram.py diagram.excalidraw Compute-Engine 500 200 
   --library-path libraries/gcp-icons --label "API Server"
```

### 指令碼功能

1. 從函式庫的 `icons/` 目錄**載入**圖示 JSON。
2. **計算**圖示的邊界框。
3. 將所有座標**偏移**到目標位置。
4. 為所有元素和群組**產生**唯一的 ID。
5. 將轉換後的元素**附加**到圖表中。
6. **(選用)** 在圖示下方新增標籤。

---

## add-arrow.py

在現有的 `.excalidraw` 圖表中的兩點之間新增一條直線箭頭。支援選用標籤和線條樣式。

### 前提條件

- Python 3.6 或更高版本
- 圖表檔案 (`.excalidraw`)

### 用法

```bash
python add-arrow.py <圖表路徑> <起始-x> <起始-y> <結束-x> <結束-y> [選項]
```

**選項**
- `--style {solid|dashed|dotted}`：線條樣式（預設：`solid`）
- `--color 十六進位`：箭頭顏色（預設：`#1e1e1e`）
- `--label 文字`：在箭頭上新增文字標籤
- `--use-edit-suffix`：透過 `.excalidraw.edit` 進行編輯，以避免編輯器覆寫問題（預設啟用；傳遞 `--no-use-edit-suffix` 即可停用）

### 範例

```bash
# 簡單箭頭
python add-arrow.py diagram.excalidraw 300 200 500 300

# 帶有標籤的箭頭
python add-arrow.py diagram.excalidraw 300 200 500 300 --label "HTTPS"

# 帶有自訂顏色的虛線箭頭
python add-arrow.py diagram.excalidraw 400 350 600 400 --style dashed --color "#7950f2"

# 預設啟用安全編輯模式（規避編輯器覆寫問題）
# 使用 `--no-use-edit-suffix` 即可停用
python add-arrow.py diagram.excalidraw 300 200 500 300
```

### 指令碼功能

1. 根據給定座標**建立**箭頭元素。
2. **(選用)** 在箭頭中點附近新增標籤。
3. 將元素**附加**到圖表中。
4. **儲存**更新後的檔案。
