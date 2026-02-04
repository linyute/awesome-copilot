# 無障礙性指南參考 (WCAG)

## 快速合規檢查清單

### AA 級要求（最低標準）

- [ ] 一般文字色彩對比度為 4.5:1
- [ ] 大文字（18px+ 或 14px 粗體）色彩對比度為 3:1
- [ ] 觸控目標最小為 44×44px
- [ ] 所有功能均可透過鍵盤操作
- [ ] 具有可見的焦點指示器
- [ ] 內容閃爍頻率每秒不超過 3 次
- [ ] 頁面具有描述性標題
- [ ] 連結目的可從文字中明確得知
- [ ] 表單輸入框具有標籤
- [ ] 錯誤訊息具備描述性

---

## 色彩與對比度

### 對比率

| 元素 | 最小比率 | 增強 (AAA) |
| ------- | ------------- | -------------- |
| 內文文字 | 4.5:1 | 7:1 |
| 大文字 (18px+) | 3:1 | 4.5:1 |
| UI 元件 | 3:1 | - |
| 圖形物件 | 3:1 | - |

### 色彩獨立性

絕不將色彩作為傳達資訊的唯一手段：

```text
✗ 僅以紅色顯示錯誤欄位
✓ 錯誤欄位具有紅色邊框 + 錯誤圖示 + 文字訊息

✗ 僅以紅色星號標記必填欄位
✓ 必填欄位標記為「(必填)」或使用圖示 + 工具提示 (Tooltip)

✗ 僅透過彩色圓點顯示狀態
✓ 狀態包含色彩 + 圖示 + 標籤文字

```

### 可存取的色彩組合

**背景上的安全文字顏色：**

| 背景 | 文字顏色 | 對比度 |
| ---------- | ---------- | -------- |
| 白色 (#FFFFFF) | 深灰色 (#1F2937) | 15.5:1 ✓ |
| 淺灰色 (#F3F4F6) | 深灰色 (#374151) | 10.9:1 ✓ |
| 主要藍色 (#2563EB) | 白色 (#FFFFFF) | 4.6:1 ✓ |
| 深色 (#111827) | 白色 (#FFFFFF) | 18.1:1 ✓ |

**應避免用於文字的顏色：**

- 白色背景上的黃色（對比度不足）
- 白色背景上的淺灰色
- 白色背景上的橘色（勉強合格）

---

## 鍵盤導覽

### 要求

1. **所有互動元素**都必須可透過 Tab 鍵到達
2. **邏輯索引標籤順序**應遵循視覺佈局
3. **無鍵盤陷阱**（使用者始終可以透過 Tab 鍵離開）
4. 在鍵盤導覽期間始終保持**焦點可見**
5. 提供**跳過連結 (Skip links)** 以繞過重複的導覽項目

### 焦點指示器 (Focus Indicators)

```css
/* 焦點樣式範例 */
:focus {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none; /* 對滑鼠使用者隱藏 */
}

:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

```

### 鍵盤快速鍵

| 按鍵 | 預期行為 |
| --- | ----------------- |
| Tab | 移動到下一個互動元素 |
| Shift+Tab | 移動到上一個元素 |
| Enter | 觸發按鈕/連結 |
| 空白鍵 | 觸發按鈕、切換核取方塊 |
| Escape | 關閉互動視窗/下拉選單 |
| 方向鍵 | 在元件內部導覽 |

---

## 螢幕助讀程式支援

### 語義化 HTML 元素

根據用途使用適當的元素：

| 用途 | 元素 | 不建議使用 |
| ------- | ------- | -------- |
| 導覽 | `<nav>` | `<div class="nav">` |
| 主要內容 | `<main>` | `<div id="main">` |
| 標頭 | `<header>` | `<div class="header">` |
| 頁尾 | `<footer>` | `<div class="footer">` |
| 按鈕 | `<button>` | `<div onclick>` |
| 連結 | `<a href>` | `<span onclick>` |

### 標題階層

```text
h1 - 頁面標題（每頁一個）
  h2 - 主要章節
    h3 - 子章節
      h4 - 次要子章節
    h3 - 另一個子章節
  h2 - 另一個主要章節

```

**絕不跳過層級**（例如從 h1 直接跳到 h3 而沒有 h2）

### 圖片替代文字 (Alt Text)

```text
裝飾性：alt=""（留空，不可省略）
資訊性：alt="描述圖片顯示的內容"
功能性：alt="圖片執行的操作"
複雜性：alt="簡短描述" + 附近有詳細描述

```

**替代文字範例：**

```text
✓ alt="顯示第四季銷售額從 1000 萬美元增長到 1500 萬美元的條形圖"
✓ alt="公司標誌"
✓ alt=""（用於裝飾性背景圖案）

✗ alt="圖片" 或 alt="相片"
✗ alt="img_12345.jpg"
✗ 完全缺少 alt 屬性

```

---

## 觸控與指標

### 觸控目標大小

| 平台 | 最小值 | 建議值 |
| -------- | ------- | ----------- |
| WCAG 2.1 | 44×44px | 48×48px |
| iOS (Apple) | 44×44pt | - |
| Android | 48×48dp | - |

### 觸控目標間距

- 相鄰目標之間至少保持 8px 的距離
- 為了舒適感，建議保持 16px 以上
- 主要操作使用較大的目標

### 指標手勢

- 複雜的手勢必須有單指替代方案
- 拖曳操作需要具備等效的點擊操作
- 避免在觸控裝置上使用僅限懸停的功能

---

## 表單無障礙性

### 標籤

每個輸入框都必須有一個關聯的標籤：

```text
<label for="email">電子郵件地址</label>
<input type="email" id="email" name="email">

```

### 必填欄位

```text
<!-- 向螢幕助讀程式宣告 -->
<label for="name">
  姓名 <span aria-label="必填">*</span>
</label>
<input type="text" id="name" required aria-required="true">

```

### 錯誤處理

```text
<label for="email">電子郵件</label>
<input type="email" id="email" aria-invalid="true" aria-describedby="email-error">
<span id="email-error" role="alert">
  請輸入有效的電子郵件地址
</span>

```

### 表單說明

- 在輸入前提供格式提示
- 在錯誤發生前顯示密碼要求
- 使用 fieldset/legend 將相關欄位分組

---

## 動態內容

### 即時區域 (Live Regions)

對於動態更新的內容：

```text
aria-live="polite" - 在方便時宣告
aria-live="assertive" - 立即宣告（會中斷）
role="alert" - 緊急訊息（類似 assertive）
role="status" - 狀態更新（類似 polite）

```

### 載入狀態

```text
<button aria-busy="true" aria-live="polite">
  <span class="spinner"></span>
  載入中...
</button>

```

### 互動視窗 (Modal Dialogs)

- 開啟時焦點移入互動視窗
- 焦點受困於互動視窗內
- Escape 鍵可關閉互動視窗
- 關閉時焦點回到觸發元素

---

## 測試無障礙性

### 手動測試檢查清單

1. **僅限鍵盤**：使用 Tab/Enter 導覽整個頁面
2. **螢幕助讀程式**：使用 VoiceOver (Mac) 或 NVDA (Windows) 進行測試
3. **縮放 200%**：內容保持可讀且可用
4. **高對比度**：使用系統高對比模式進行測試
5. **無滑鼠**：在不使用指標裝置的情況下完成所有任務

### 自動化工具

- axe DevTools（瀏覽器擴充功能）
- WAVE (WebAIM 瀏覽器擴充功能)
- Lighthouse (Chrome DevTools)
- 色彩對比度檢查器 (WebAIM, Contrast Ratio)

### 常見檢查問題

- [ ] 缺少或空白的替代文字
- [ ] 空的連結或按鈕
- [ ] 缺少表單標籤
- [ ] 色彩對比度不足
- [ ] 缺少語言屬性 (lang)
- [ ] 標題結構不正確
- [ ] 缺少跳過導覽連結
- [ ] 無法存取的自訂小工具

---

## ARIA 快速參考

### 角色 (Roles)

| 角色 | 用途 |
| ---- | ------- |
| `button` | 可點擊按鈕 |
| `link` | 導覽連結 |
| `dialog` | 互動視窗 |
| `alert` | 重要訊息 |
| `navigation` | 導覽區域 |
| `main` | 主要內容 |
| `search` | 搜尋功能 |
| `tab/tablist/tabpanel` | 索引標籤介面 |

### 屬性 (Properties)

| 屬性 | 用途 |
| -------- | ------- |
| `aria-label` | 可存取的名稱 |
| `aria-labelledby` | 參照標記元素 |
| `aria-describedby` | 參照描述內容 |
| `aria-hidden` | 對輔助技術隱藏 |
| `aria-expanded` | 展開狀態 |
| `aria-selected` | 選取狀態 |
| `aria-disabled` | 停用狀態 |
| `aria-required` | 必填欄位 |
| `aria-invalid` | 無效輸入 |

### 黃金法則

**ARIA 的第一條規則**：如果原生 HTML 可行，就不要使用 ARIA。

```text
✗ <div role="button" tabindex="0">點擊</div>
✓ <button>點擊</button>

```
