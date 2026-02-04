---
name: penpot-uiux-design
description: '使用 MCP 工具在 Penpot 中建立專業 UI/UX 設計的全面指南。當執行以下操作時使用此技能：(1) 為網頁、行動裝置或桌面應用程式建立新的 UI/UX 設計，(2) 使用元件和權杖 (Tokens) 建構設計系統，(3) 設計儀表板、表單、導覽或登陸頁面，(4) 套用無障礙標準和最佳實踐，(5) 遵循平台指南 (iOS, Android, Material Design)，(6) 審查或改進現有的 Penpot 設計以提高可用性。觸發詞：「設計 UI」、「建立介面」、「建構佈局」、「設計儀表板」、「建立表單」、「設計登陸頁面」、「使其具備無障礙性」、「設計系統」、「元件函式庫」。'
---

# Penpot UI/UX 設計指南

使用 `penpot/penpot-mcp` MCP 伺服器和經過驗證的 UI/UX 原則，在 Penpot 中建立以使用者為中心的專業設計。
## 可用的 MCP 工具

| 工具 | 用途 |
| ---- | ------- |
| `mcp__penpot__execute_code` | 在 Penpot 外掛程式上下文中執行 JavaScript 以建立/修改設計 |
| `mcp__penpot__export_shape` | 將形狀匯出為 PNG/SVG 以進行視覺檢查 |
| `mcp__penpot__import_image` | 將圖片（圖示、相片、標誌）匯入設計中 |
| `mcp__penpot__penpot_api_info` | 擷取 Penpot API 文件 |

## MCP 伺服器設定

Penpot MCP 工具需要 `penpot/penpot-mcp` 伺服器在本機執行。有關詳細的安裝和疑難排解，請參閱 [setup-troubleshooting.md](references/setup-troubleshooting.md)。

### 設定前：檢查是否已在執行

**在嘗試設定之前，務必先檢查 MCP 伺服器是否已經可用：**

1. **先嘗試呼叫工具**：嘗試執行 `mcp__penpot__penpot_api_info` - 如果成功，則伺服器正在執行且已連接。無需設定。

2. **如果工具失敗**，請詢問使用者：
   > 「Penpot MCP 伺服器似乎未連接。伺服器是否已安裝並正在執行？如果是，我可以協助疑難排解。如果不是，我可以引導您完成設定。」

3. **僅在使用者確認未安裝伺服器時，才繼續進行設定說明。**

### 快速入門（僅限未安裝時）

```bash
# 複製並安裝
git clone https://github.com/penpot/penpot-mcp.git
cd penpot-mcp
npm install

# 建構並啟動伺服器
npm run bootstrap
```

然後在 Penpot 中：
1. 開啟一個設計檔案
2. 前往 **Plugins** → **Load plugin from URL**
3. 輸入：`http://localhost:4400/manifest.json`
4. 在外掛程式 UI 中點擊 **"Connect to MCP server"**

### VS Code 組態

新增至 `settings.json`：
```json
{
  "mcp": {
    "servers": {
      "penpot": {
        "url": "http://localhost:4401/sse"
      }
    }
  }
}
```

### 疑難排解（如果已安裝伺服器但無法運作）

| 問題 | 解決方案 |
| ----- | -------- |
| 外掛程式無法連接 | 檢查伺服器是否正在執行（在 penpot-mcp 目錄中執行 `npm run start:all`） |
| 瀏覽器封鎖 localhost | 允許本機網路存取提示，或停用 Brave Shield，或嘗試使用 Firefox |
| 工具未出現在用戶端 | 在變更組態後完全重新啟動 VS Code/Claude |
| 工具執行失敗/逾時 | 確保 Penpot 外掛程式 UI 已開啟並顯示「已連接 (Connected)」 |
| "WebSocket connection failed" | 檢查防火牆是否允許連接埠 4400, 4401, 4402 |

## 快速參考

| 工作 | 參考檔案 |
| ---- | -------------- |
| MCP 伺服器安裝與疑難排解 | [setup-troubleshooting.md](references/setup-troubleshooting.md) |
| 元件規格（按鈕、表單、導覽） | [component-patterns.md](references/component-patterns.md) |
| 無障礙性（對比度、觸控目標） | [accessibility.md](references/accessibility.md) |
| 螢幕大小與平台規格 | [platform-guidelines.md](references/platform-guidelines.md) |

## 核心設計原則

### 黃金法則

1. **清晰勝過巧妙**：每個元素都必須有其目的
2. **一致性建立信任**：重複使用模式、顏色和元件
3. **使用者目標優先**：針對任務而非功能進行設計
4. **無障礙性不是選配**：為每個人設計
5. **與真實使用者一起測試**：儘早驗證假設

### 視覺階層（優先順序）

1. **大小**：較大 = 較重要
2. **顏色/對比度**：高對比度吸引注意力
3. **位置**：左上角（從左至右閱讀）最先被看到
4. **留白**：隔離強調重要性
5. **排版粗細**：粗體最為突出
## 設計工作流

1. **先檢查設計系統**：詢問使用者是否有現有的權杖/規格，或從目前的 Penpot 檔案中發現
2. **了解頁面**：使用 `penpotUtils.shapeStructure()` 呼叫 `mcp__penpot__execute_code` 以查看階層
3. **尋找元素**：使用 `penpotUtils.findShapes()` 根據類型或名稱定位元素
4. **建立/修改**：使用 `penpot.createBoard()`、`penpot.createRectangle()`、`penpot.createText()` 等。
5. **套用佈局**：使用 `addFlexLayout()` 建立回應式容器
6. **驗證**：呼叫 `mcp__penpot__export_shape` 以視覺化檢查您的工作

## 設計系統處理

**在建立設計之前，確定使用者是否有現有的設計系統：**

1. **詢問使用者**：「您是否有要遵循的設計系統或品牌指南？」
2. **從 Penpot 中發現**：檢查現有的元件、顏色和模式

```javascript
// 發現目前檔案中現有的設計模式
const allShapes = penpotUtils.findShapes(() => true, penpot.root);

// 尋找使用中的現有顏色
const colors = new Set();
allShapes.forEach(s => {
  if (s.fills) s.fills.forEach(f => colors.add(f.fillColor));
});

// 尋找現有的文字樣式（字型大小、粗細）
const textStyles = allShapes
  .filter(s => s.type === 'text')
  .map(s => ({ fontSize: s.fontSize, fontWeight: s.fontWeight }));

// 尋找現有的元件
const components = penpot.library.local.components;

return { colors: [...colors], textStyles, componentCount: components.length };
```

**如果使用者擁有設計系統：**

- 使用他們指定的顏色、間距、排版
- 匹配他們現有的元件模式
- 遵循他們的命名慣例

**如果使用者沒有設計系統：**

- 使用下方的預設權杖作為起點
- 提議協助建立一致的模式
- 參考 [component-patterns.md](references/component-patterns.md) 中的規格
## Penpot API 關鍵注意事項

- `width`/`height` 是唯讀的 → 使用 `shape.resize(w, h)`
- `parentX`/`parentY` 是唯讀的 → 使用 `penpotUtils.setParentXY(shape, x, y)`
- 使用 `insertChild(index, shape)` 進行 Z 軸排序（而非 `appendChild`）
- Flex 子元素陣列順序在 `dir="column"` 或 `dir="row"` 時是相反的
- 在 `text.resize()` 之後，將 `growType` 重設為 `"auto-width"` 或 `"auto-height"`

## 定位新畫板 (Boards)

**在建立新畫板之前，務必先檢查現有的畫板**以避免重疊：

```javascript
// 尋找所有現有的畫板並計算下一個位置
const boards = penpotUtils.findShapes(s => s.type === 'board', penpot.root);
let nextX = 0;
const gap = 100; // 畫板之間的間距

if (boards.length > 0) {
  // 尋找最右側的畫板邊緣
  boards.forEach(b => {
    const rightEdge = b.x + b.width;
    if (rightEdge + gap > nextX) {
      nextX = rightEdge + gap;
    }
  });
}

// 在計算出的位置建立新畫板
const newBoard = penpot.createBoard();
newBoard.x = nextX;
newBoard.y = 0;
newBoard.resize(375, 812);
```

**畫板間距指南：**

- 對於相關螢幕（相同流程），使用 100px 間距
- 對於不同區塊/流程，使用 200px+ 間距
- 垂直對齊畫板（相同的 Y 座標）以便於視覺組織
- 按照使用者流程順序水平分組相關螢幕

## 預設設計權杖 (Design Tokens)

**僅在使用者沒有設計系統時使用這些預設值。如果使用者有提供權杖，請優先使用。**

### 間距比例（以 8px 為基礎）

| 權杖 | 值 | 用法 |
| ----- | ----- | ----- |
| `spacing-xs` | 4px | 緊湊的行內元素 |
| `spacing-sm` | 8px | 相關元素 |
| `spacing-md` | 16px | 預設邊距 |
| `spacing-lg` | 24px | 區塊間距 |
| `spacing-xl` | 32px | 主要區塊 |
| `spacing-2xl` | 48px | 頁面級別間距 |

### 排版比例

| 級別 | 大小 | 粗細 | 用法 |
| ----- | ---- | ------ | ----- |
| 展示 (Display) | 48-64px | 粗體 | 英雄標題 (Hero headlines) |
| H1 | 32-40px | 粗體 | 頁面標題 |
| H2 | 24-28px | 半粗體 | 區塊標頭 |
| H3 | 20-22px | 半粗體 | 子區塊 |
| 內文 (Body) | 16px | 常規 | 主要內容 |
| 小字 (Small) | 14px | 常規 | 次要文字 |
| 說明 (Caption) | 12px | 常規 | 標籤、提示 |

### 顏色用法

| 用途 | 建議 |
| ------- | -------------- |
| 主要 (Primary) | 主要品牌顏色，行動呼籲 (CTA) |
| 次要 (Secondary) | 輔助操作 |
| 成功 (Success) | #22C55E 範圍（確認） |
| 警告 (Warning) | #F59E0B 範圍（警告） |
| 錯誤 (Error) | #EF4444 範圍（錯誤） |
| 中性 (Neutral) | 用於文字/邊框的灰階 |

## 常見佈局

### 行動裝置螢幕 (375×812)

```text
┌─────────────────────────────┐
│ 狀態列 (44px)                │
├─────────────────────────────┤
│ 標頭/導覽 (56px)             │
├─────────────────────────────┤
│                             │
│ 內容區域                     │
│ （可捲動）                   │
│ 邊距：水平 16px              │
│                             │
├─────────────────────────────┤
│ 底部導覽/CTA (84px)          │
└─────────────────────────────┘

```

### 桌面儀表板 (1440×900)

```text
┌──────┬──────────────────────────────────┐
│      │ 標頭 (64px)                      │
│ 側邊 │──────────────────────────────────│
│ 欄   │ 頁面標題 + 操作                    │
│      │──────────────────────────────────│
│ 240  │ 內容網格                          │
│ px   │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│      │ │卡片  │ │卡片 │ │卡片  │ │卡片 │  │
│      │ └─────┘ └─────┘ └─────┘ └─────┘  │
│      │                                  │
└──────┴──────────────────────────────────┘

```

## 元件檢查清單

### 按鈕

- [ ] 清晰、以操作為導向的標籤（2-3 個字）
- [ ] 最小觸控目標：44×44px
- [ ] 視覺狀態：預設、懸停、啟用、停用、載入中
- [ ] 足夠的對比度（與背景對比為 3:1）
- [ ] 整個應用程式中一致的邊框半徑

### 表單

- [ ] 標籤位於輸入框上方（而不僅是預留位置文字）
- [ ] 必填欄位指示器
- [ ] 欄位旁的錯誤訊息
- [ ] 邏輯索引標籤順序
- [ ] 輸入類型與內容匹配（電子郵件、電話等）

### 導覽

- [ ] 清楚指示目前位置
- [ ] 在各個螢幕上保持一致的位置
- [ ] 最多 7±2 個頂層項目
- [ ] 行動裝置上易於觸控（48px 目標）

## 無障礙性快速檢查

1. **色彩對比度**：文字 4.5:1，大文字 3:1
2. **觸控目標**：最小 44×44px
3. **焦點狀態**：可見的鍵盤焦點指示器
4. **替代文字**：圖片的有意義描述
5. **階層**：正確的標題級別 (H1→H2→H3)
6. **色彩獨立性**：絕不完全依賴顏色

## 設計審查檢查清單

在最終確定任何設計之前：

- [ ] 視覺階層清晰
- [ ] 間距和對齊一致
- [ ] 排版易於閱讀（16px+ 內文）
- [ ] 色彩對比度符合 WCAG AA 標準
- [ ] 互動元素顯而易見
- [ ] 行動裝置友善的觸控目標
- [ ] 考慮了載入中/空白/錯誤狀態
- [ ] 與設計系統保持一致

## 驗證設計

將這些驗證方法與 `mcp__penpot__execute_code` 搭配使用：

| 檢查項目 | 方法 |
| ----- | ------ |
| 超出邊界的元素 | 使用 `isContainedIn()` 的 `penpotUtils.analyzeDescendants()` |
| 文字太小 (<12px) | 使用 `fontSize` 篩選的 `penpotUtils.findShapes()` |
| 缺乏對比度 | 呼叫 `mcp__penpot__export_shape` 並進行視覺檢查 |
| 階層結構 | 使用 `penpotUtils.shapeStructure()` 審查巢狀結構 |

### 匯出 CSS

透過 `mcp__penpot__execute_code` 使用 `penpot.generateStyle(selection, { type: 'css', includeChildren: true })` 從設計中提取 CSS。

## 優秀設計的秘訣

1. **從內容開始**：真實內容揭示了佈局需求
2. **行動優先設計**：限制激發創意
3. **使用網格**：8px 基準網格保持整齊對齊
4. **限制顏色**：1 種主色 + 1 種次要顏色 + 中性色
5. **限制字型**：最多 1-2 種字體
6. **擁抱留白**：呼吸空間提高理解力
7. **保持一致**：相同的操作 = 隨處可見的相同外觀
8. **提供回饋**：每項操作都需要回應
