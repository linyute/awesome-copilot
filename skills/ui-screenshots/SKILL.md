---
name: ui-screenshots
description: '使用 Playwright 和 PIL 在開發過程中擷取 Web 應用程式截圖。支援全頁擷取、互動狀態，以及避免慢速重複擷取的工作流程。'
---

# UI 截圖 (UI Screenshots)

在開發過程中擷取 Web 應用程式和圖形化 UI 的截圖，以記錄視覺變更。

## 何時使用此技能

當您需要：

- 擷取執行中 Web 應用程式的當前狀態
- 在程式碼變更前後記錄 UI
- 擷取互動狀態（提示工具、懸停、選取元素）
- 在不重新擷取的情況下截取頁面的特定區塊

## 前置作業

```bash
pip install playwright Pillow -q
playwright install chromium
```

## 核心工作流程

### 1. 拍攝原始全頁截圖

```python
from playwright.async_api import async_playwright

async def capture(url="http://localhost:3000", out="screenshot-raw.png", width=1400, height=5000):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": width, "height": height})
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_timeout(4000)  # 讓圖表/動畫渲染完成
        await page.screenshot(path=out, full_page=True)
        await browser.close()
```

- 使用 **高視口 (tall viewport)** (height=5000)，讓頁面在不滾動的情況下完整渲染
- `wait_until="networkidle"` + `wait_for_timeout(4000)` 可確保非同步圖表載入完成
- `full_page=True` 可擷取完整的捲動內容

### 2. 檢視原始圖像，然後使用 PIL 裁切

**不要試圖透過 Playwright 的 `clip` 參數來獲得完美的裁切。** 這在全頁擷取中不可靠。

```python
from PIL import Image

img = Image.open("screenshot-raw.png")
cropped = img.crop((left, top, right, bottom))  # 根據實際視覺調整
cropped.save("screenshot-final.png")
```

1. 拍攝原始截圖
2. 檢視圖像以查看實際像素位置
3. 根據觀察結果使用 PIL 進行裁切
4. 檢視結果 — 如果不正確，重新裁切（瞬間完成，無需重新截圖）

### 3. 反覆裁切，而非反覆擷取

- 重新截圖很慢（瀏覽器啟動 + 頁面載入 + 渲染等待）
- 重新裁切是瞬間的（僅需 PIL）
- 取得一張高品質的原始截圖後，即可視需要進行多次裁切

### 4. 互動狀態

```python
element = page.locator("selector").first
await element.hover()
await page.wait_for_timeout(1000)  # 讓提示工具出現
await page.screenshot(path="screenshot-hover.png", full_page=True)
```

若要在沒有懸停效果的情況下取得「已選取」狀態，請在點擊後將滑鼠移開：

```python
await element.click()
await page.mouse.move(300, 300)  # 移開以避免顯示懸停效果
await page.wait_for_timeout(500)
await page.screenshot(path="screenshot-selected.png", full_page=True)
```

### 5. 特定區塊擷取

從單一全頁截圖中裁切出不同區塊：

```python
img.crop((0, 200, 920, 900)).save("screenshot-header.png")
img.crop((0, 900, 920, 1600)).save("screenshot-main.png")
```

## 指引

1. **在進行任何變更前，務必先擷取原始狀態** — 如果忘記了，您必須還原程式碼才能取得原始截圖
2. **變更前後配對必須使用相同的視口寬度和裁切範圍** — 否則比較將毫無意義
3. **若您已變更程式碼才需要「變更前」的截圖**：使用 `git checkout HEAD~1 -- <files>` 還原，截圖，然後使用 `git checkout HEAD -- <files>` 恢復
4. **對於互動狀態**：為每個狀態都擷取變更前與變更後的截圖 — 不要假設一般的「變更前」涵蓋了所有情況
5. **在 Playwright 中使用 `device_scale_factor=1`** 強制以 1x 像素顯示，讓截圖符合使用者在 100% 縮放時看到的內容
6. **圖表需要額外的等待時間** — Plotly, D3 等渲染是非同步的；networkidle 後至少需 4 秒
7. **窄視口會暴露出渲染錯誤** — 某些邊框/對齊問題僅在特定寬度下出現

## 非 Web 應用程式截圖

適用於 Playwright 無法存取的桌面應用程式（VS, WPF, WinForms, 主控台應用程式, 終端機）。

### mss + ctypes (推薦用於桌面視窗)

透過 Win32 API 按標題尋找視窗，並使用 `mss` 擷取其區域。經測試每次擷取約 33ms。

```python
import ctypes
from ctypes import c_int, Structure, byref, windll
import mss
from PIL import Image

user32 = windll.user32

def find_window(title_contains):
    """尋找標題包含指定字串的可見視窗。"""
    results = []
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    def cb(hwnd, _):
        if user32.IsWindowVisible(hwnd):
            buf = ctypes.create_unicode_buffer(256)
            user32.GetWindowTextW(hwnd, buf, 256)
            if title_contains.lower() in buf.value.lower():
                results.append((hwnd, buf.value))
        return True
    user32.EnumWindows(WNDENUMPROC(cb), 0)
    return results

def capture_window(title_contains, output_path):
    """依標題字串擷取視窗。"""
    windows = find_window(title_contains)
    if not windows:
        raise ValueError(f"找不到符合 '{title_contains}' 的視窗")
    hwnd = windows[0][0]

    class RECT(Structure):
        _fields_ = [('left', c_int), ('top', c_int), ('right', c_int), ('bottom', c_int)]
    rect = RECT()
    user32.GetWindowRect(hwnd, byref(rect))
    w, h = rect.right - rect.left, rect.bottom - rect.top

    with mss.mss() as sct:
        shot = sct.grab({'left': rect.left, 'top': rect.top, 'width': w, 'height': h})
        img = Image.frombytes('RGB', shot.size, shot.rgb)
        img.save(output_path)
        return img

# 用法:
capture_window('Visual Studio Code', 'vscode-capture.png')
```

**前置作業:** `pip install mss pillow`
**限制:** 視窗必須可見（不能被其他視窗遮住或最小化）。

### Electron 應用程式 (VS Code 等)

**僅限 Node.js Playwright** — Python Playwright 沒有 `electron` API。透過 CDP (Chrome DevTools Protocol) 而非螢幕擷取 — 即使最小化也能運作。

```javascript
const { _electron: electron } = require('playwright');
const app = await electron.launch({
    executablePath: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
    args: ['--new-window', '--disable-extensions', '--user-data-dir=' + tmpDir]
});
const window = await app.firstWindow();
await window.waitForLoadState('domcontentloaded');

// 立即最小化 — 仍可透過 CDP 進行擷取
await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].minimize();
});

await window.screenshot({ path: 'capture.png' }); // 最小化時仍可運作！
await app.close();
```

**重要**：必須加上 `--user-data-dir=<temp>`，否則 VS Code 會轉接至現有實例，而啟動的處理程序會立即結束。

### 決策樹

| 場景 | 工具 | 注意事項 |
|---|---|---|
| Web 應用程式 (localhost) | Playwright | 已驗證，可完整存取 DOM |
| Electron 應用程式 (VS Code) | Playwright Electron (Node.js) | 可透過 CDP 在最小化時運作 |
| 桌面應用程式，可見視窗 | mss + ctypes (按標題尋找) | 每次擷取約 33ms |
| 桌面應用程式，被遮擋 | Windows Graphics Capture API | 設定複雜，Win10 1903+ |
| 快速全螢幕 | mss | 約 68ms |

## 限制

- Web 擷取需要本地執行中的應用程式或可存取的 URL
- 桌面擷取 (mss) 需要視窗可見且未被遮擋
- Electron 擷取需要 Node.js Playwright (非 Python)
- 某些具有大量客戶端渲染的 SPA 可能需要自訂的等待邏輯，而不僅僅是 networkidle
