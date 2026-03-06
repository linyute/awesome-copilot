---
name: chrome-devtools
description: '使用 Chrome DevTools MCP 進行專家級的瀏覽器自動化、除錯和效能分析。用於與網頁互動、擷取螢幕截圖、分析網路流量以及分析效能概況。'
license: MIT
---

# Chrome DevTools 代理 (Agent)

## 概覽

用於控制和檢查執行中的 Chrome 瀏覽器的專門技能。此技能利用 `chrome-devtools` MCP 伺服器來執行廣泛的瀏覽器相關任務，從簡單的導覽到複雜的效能剖析。

## 何時使用

在以下情況使用此技能：

- **瀏覽器自動化**：導覽頁面、點擊元件、填寫表單以及處理對話方塊。
- **視覺化檢查**：擷取網頁的螢幕截圖或文字快照。
- **除錯**：檢查主控台訊息、在頁面背景中評估 JavaScript 以及分析網路請求。
- **效能分析**：記錄並分析效能追蹤，以識別瓶頸和核心網路指標 (Core Web Vital) 問題。
- **模擬**：調整視窗大小或模擬網路/CPU 條件。

## 工具類別

### 1. 導覽與頁面管理

- `new_page`：開啟新分頁/頁面。
- `navigate_page`：前往特定 URL、重新整理或導覽歷史紀錄。
- `select_page`：在已開啟的頁面之間切換背景。
- `list_pages`：檢視所有已開啟的頁面及其 ID。
- `close_page`：關閉特定頁面。
- `wait_for`：等待頁面中出現特定文字。

### 2. 輸入與互動

- `click`：點擊某個元件（使用快照中的 `uid`）。
- `fill` / `fill_form`：在輸入框中輸入文字或一次填寫多個欄位。
- `hover`：將滑鼠懸停在元件上。
- `press_key`：傳送鍵盤快速鍵或特殊按鍵（例如：「Enter」、「Control+C」）。
- `drag`：拖放元件。
- `handle_dialog`：接受或關閉瀏覽器警示/提示。
- `upload_file`：透過檔案輸入上傳檔案。

### 3. 除錯與檢查

- `take_snapshot`：獲取基於文字的無障礙樹（最適合用於識別元件）。
- `take_screenshot`：擷取頁面或特定元件的視覺化呈現。
- `list_console_messages` / `get_console_message`：檢查頁面的主控台輸出。
- `evaluate_script`：在頁面背景中執行自訂 JavaScript。
- `list_network_requests` / `get_network_request`：分析網路流量和請求詳細資訊。

### 4. 模擬與效能

- `resize_page`：更改視窗尺寸。
- `emulate`：限制 CPU/網路頻寬或模擬地理位置。
- `performance_start_trace`：開始記錄效能設定檔。
- `performance_stop_trace`：停止記錄並儲存追蹤。
- `performance_analyze_insight`：從記錄的效能資料中獲取詳細分析。

## 工作流模式

### 模式 A：識別元件（快照優先）

在尋找元件時，務必優先選擇 `take_snapshot` 而非 `take_screenshot`。快照提供了互動工具所需的 `uid` 值。

```markdown
1. `take_snapshot` 以獲取目前的頁面結構。
2. 尋找目標元件的 `uid`。
3. 使用 `click(uid=...)` 或 `fill(uid=..., value=...)`。
```

### 模式 B：疑難排解錯誤

當頁面出現故障時，請同時檢查主控台記錄和網路請求。

```markdown
1. `list_console_messages` 以檢查 JavaScript 錯誤。
2. `list_network_requests` 以識別失敗的 (4xx/5xx) 資源。
3. `evaluate_script` 以檢查特定 DOM 元件或全域變數的值。
```

### 模式 C：效能剖析

識別頁面速度緩慢的原因。

```markdown
1. `performance_start_trace(reload=true, autoStop=true)`
2. 等待頁面載入/追蹤完成。
3. `performance_analyze_insight` 以尋找 LCP 問題或版面配置位移 (layout shift)。
```

## 最佳實踐

- **背景意識**：如果你不確定目前哪個分頁處於活動狀態，請務必執行 `list_pages` 和 `select_page`。
- **快照**：在任何重大的導覽或 DOM 變更後執行新的快照，因為 `uid` 值可能會改變。
- **逾時**：為 `wait_for` 使用合理的逾時設定，以避免在載入緩慢的元件上停留過久。
- **螢幕截圖**：僅在需要視覺驗證時謹慎使用 `take_screenshot`，而邏輯判斷應依賴 `take_snapshot`。
