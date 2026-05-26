---
name: screen-recording
description: '為 Pull Request 和文件建立標註動畫 GIF 演示與螢幕錄影。涵蓋影格擷取、定時、基於 imageio 的 GIF 建立，以及逐影格標註工作流程。'
---

# 螢幕錄影 (Screen Recording)

建立動畫 GIF 演示，展示功能或工作流程的實際操作 — 並加上標註、可變動的定時以及適當的節奏。適用於 PR 描述、文件和發行說明。

## 何時使用此技能

當您需要：

- 將多步驟的 UI 互動錄製為動畫 GIF
- 建立展示變更前後行為的演示
- 為文件或發行說明建立附帶標註的逐步導覽
- 展示 Bug 重現或修復過程

## 前置作業

```bash
pip install playwright Pillow imageio numpy scipy mss -q
playwright install chromium
```

## 核心工作流程

### 1. 擷取影格 (Frames)

使用 Playwright 逐步執行互動並擷取每個影格：

```python
from playwright.async_api import async_playwright

async def record_frames(url, steps, width=1400, height=900):
    """
    steps: 字典清單，包含 'action' (接收 page 的非同步可呼叫物件)
           和 'name' (影格檔案名稱)
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": width, "height": height})
        await page.goto(url, wait_until="networkidle")

        for step in steps:
            if step.get("action"):
                await step["action"](page)
                await page.wait_for_timeout(step.get("wait", 500))
            await page.screenshot(path=step["name"])

        await browser.close()
```

### 2. 使用 imageio 組合 GIF

**編寫 GIF 時請使用 imageio，而非 PIL** — PIL 的 GIF 編碼器會合併視覺上相似的影格，這會破壞動畫效果。

```python
import imageio.v3 as iio
from PIL import Image
import numpy as np

frames = []
durations = []

for frame_path, duration_ms in frame_list:
    img = Image.open(frame_path)
    frames.append(np.array(img))
    durations.append(duration_ms)

iio.imwrite("demo.gif", frames, duration=durations, loop=0)
```

### 3. 可變影格定時

統一的定時會讓一切顯得太快或太慢。請使用可變定時：

| 階段 | 持續時間 | 原因 |
|-------|----------|-----|
| 快速操作（輸入、點擊） | 100ms | 感覺自然，維持活力 |
| 操作後的停頓 | 600-800ms | 讓觀看者吸收剛剛發生的事 |
| 主標題/最終訊息 | 500ms+ | 主要結論需要時間停駐 |

### 4. 標註影格

使用 `image-annotations` 技能將標註應用於特定影格：

```python
from PIL import Image, ImageDraw, ImageFont

def annotate_frame(frame_path, annotations, out_path):
    img = Image.open(frame_path)
    draw = ImageDraw.Draw(img)

    for ann in annotations:
        # 應用標註 (矩形、箭頭、標籤等)
        pass

    img.save(out_path)
```

### 5. 標註淡入效果

為了讓標註順暢出現：

```python
def apply_fade(base_frame, annotation_layer, alpha):
    """以給定的不透明度 (0.0 到 1.0) 將標註混合到影格上"""
    blended = Image.blend(
        base_frame.convert("RGBA"),
        annotation_layer.convert("RGBA"),
        alpha
    )
    return blended.convert("RGB")

# 10fps 下的 2 影格淡入：50% 然後 100%
faded_frames = [
    apply_fade(base, annotations, 0.5),  # 影格 1：半透明
    apply_fade(base, annotations, 1.0),  # 影格 2：全透明
]
```

在 10fps 下，使用 2 個淡入影格（總計 0.2 秒）。在 30fps 下，使用 3-4 個影格。緩動曲線 (Easing curves) 在低幀率下看起來很差 — 簡單的淡入效果既簡潔又易讀。

## 建立為 Script

除了簡單的演示外，標註邏輯會變得複雜。請編寫一個專用的指令稿（例如 `annotate_gif.py`）並使用函數，而不是寫入內聯程式碼。您將需要反覆調整定時和位置。

## 測試動畫

**請務必先進行隔離測試** — 不要為了測試淡入調整而重新建置完整的演示：

```python
# 小型測試 GIF：10 個空白影格 → 淡入影格 → 15 個停留影格
# 加入影格計數器疊加層以便除錯：
draw.text((10, height - 30), f"F{i}/{total} a={alpha:.0%} FADE",
          fill="white", font=small_font)
```

## 桌面螢幕錄影 (mss)

用於錄製桌面應用程式、終端機或瀏覽器之外的任何內容。使用 `mss` 進行快速螢幕擷取。

```python
import mss
from PIL import Image
import time

def record_gif(output_path, region=None, duration=5, fps=8):
    """將螢幕區域錄製為 GIF。region = {left, top, width, height} 或 None 為全螢幕。"""
    with mss.mss() as sct:
        if region is None:
            region = sct.monitors[1]  # 主螢幕

        frames = []
        t_end = time.time() + duration
        while time.time() < t_end:
            t0 = time.time()
            shot = sct.grab(region)
            frames.append(Image.frombytes('RGB', shot.size, shot.rgb))
            time.sleep(max(0, 1 / fps - (time.time() - t0)))

    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                   duration=int(1000 / fps), loop=0, optimize=True)
    return len(frames)

record_gif('demo.gif', region={'left': 0, 'top': 0, 'width': 800, 'height': 500}, duration=3)
```

經測試：8fps 下 3 秒 → 24 影格，約 31KB。保持 fps ≤ 10 以獲得合理的檔案大小。

**注意：** `PIL.save(save_all=True)` 適用於簡單錄製，但會合併視覺上相似的影格。若有帶淡入效果的標註 GIF，請改用 `imageio.v3.imwrite`。

### 結合視窗擷取

```python
# 尋找視窗矩形，然後將其錄製為 GIF
# 重用 ui-screenshots 技能中的 find_window()
import ctypes
from ctypes import c_int, Structure, byref, windll

class RECT(Structure):
    _fields_ = [('left', c_int), ('top', c_int), ('right', c_int), ('bottom', c_int)]

hwnd = find_window('My App')[0][0]
rect = RECT()
windll.user32.GetWindowRect(hwnd, byref(rect))
region = {'left': rect.left, 'top': rect.top,
          'width': rect.right - rect.left, 'height': rect.bottom - rect.top}
record_gif('app-demo.gif', region=region, duration=5, fps=8)
```

## 基於差異的叢集檢測

以程式方式找出影格之間的變更區域，以決定標註內容：

```python
import numpy as np
from scipy import ndimage

def find_changed_clusters(frame_a, frame_b, threshold=30, min_pixels=300, dilate=5):
    """找出影格之間變更區域的邊界框。"""
    diff = np.abs(frame_b.astype(float) - frame_a.astype(float)).max(axis=2)
    mask = diff > threshold
    dilated = ndimage.binary_dilation(mask, iterations=dilate)
    labeled, n = ndimage.label(dilated)
    clusters = []
    for i in range(1, n + 1):
        ys, xs = np.where(labeled == i)
        if len(ys) < min_pixels:
            continue
        clusters.append((xs.min(), ys.min(), xs.max(), ys.max(), len(ys)))
    return sorted(clusters, key=lambda c: -c[4])  # 由大到小排序
```

## 格式相容性

| 格式 | VS Code 預覽 | GitHub | 瀏覽器 |
|--------|----------------|--------|---------|
| GIF | ✅ 動畫 | ✅ | ✅ |
| WebP | ⚠️ 僅靜態 | ✅ | ✅ |
| MP4 | ❌ 損壞 | ⚠️ | ✅ |

**GIF 是 VS Code 預覽、GitHub Markdown 和瀏覽器中唯一普遍支援的動畫格式。**

## 指引

1. **操作 → 停頓 → 標註** — 在快速操作期間，不要顯示標註。先停頓，然後再進行標註
2. **主標題使用最大字型** — 主要結論使用 64pt+，細節標註使用 38pt
3. **GIF 調色盤不會破壞漸層** — 20 個不同的透明度步驟在 256 色調色盤下依然有效
4. **至少 10fps** — 進行輸入/互動時，較低的幀率看起來會很卡頓
5. **反覆建置** — 先調整好影格順序，再進行標註，最後調整定時

## 限制

- GIF 限制為每影格 256 色 — 適用於 UI 截圖，但在攝影內容上可能會出現色帶 (banding)
- 大型 GIF (高解析度下 50+ 影格) 可能會佔用數 MB — 考慮裁切至相關區域
- GIF 不支援音訊 — 若需要旁白演示，請使用 MP4 (但會失去 VS Code 預覽支援)
