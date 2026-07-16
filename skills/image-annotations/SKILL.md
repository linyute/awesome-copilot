---
name: image-annotations
description: '使用 PIL 為螢幕截圖、圖表和圖像添加標註矩形、箭頭、標籤和顏色編碼的高亮。包含動畫 GIF 標註的時序與步調規則。'
---

# 圖像標註 (Image Annotations)

使用 PIL/Pillow 為任何圖像（螢幕截圖、圖表、架構文件、演示影格）添加視覺標註。標記出變更點或需要注意的地方，讓審核者一目了然。

## 何時使用此技能

當你需要執行以下操作時，請使用此技能：

- 在螢幕截圖中標記特定區域，用於 PR 說明。
- 標註前後對比圖，以展示變更內容。
- 為圖表或架構圖添加標籤和標註。
- 製作帶有標註的動畫 GIF 演示影格。

## 先決條件

```bash
pip install Pillow -q
```

## 顏色規則

- **紅色 (`#E63946`)** — 僅用於「錯誤」/「移除」的事項（例如：圈選正在修復的 Bug）。
- **黃橙色 (`#FF9F1C`)** — 用於中性高亮（例如：「看這裡」、「新功能」等）。
- 切勿僅因為醒目而使用紅色 — 紅色即代表錯誤/移除。

## 字型

- 在 Windows 上使用 **Ink Free** (`C:/Windows/Fonts/Inkfree.ttf`) 以獲得手寫風格。
- 在 Linux/macOS 上，後備方案使用 `ImageFont.load_default()`。
- 對於約 1400px 寬的圖像，標註大小設為 **36**。
- `stroke_width=1` 配合 `stroke_fill=<與填充相同的顏色>` — 賦予字體輪廓，但不會過於厚重。
- 請勿使用白色描邊 — 看起來像劣質的發光效果。

## 形狀

- 建議使用**圓角矩形**而非圓形/橢圓形 — 邊緣鋸齒感較少。
- `draw.rounded_rectangle([x1, y1, x2, y2], radius=14, outline=color, width=5)`
- 在目標內容周圍保留 **18px 的留白**。

## 參考程式碼片段

```python
from PIL import Image, ImageDraw, ImageFont

# 設定
font = ImageFont.truetype('C:/Windows/Fonts/Inkfree.ttf', 36)  # 或使用 load_default()
color = '#FF9F1C'  # 用於高亮的橙色
stroke = 5
pad = 18

img = Image.open('screenshot.png')
draw = ImageDraw.Draw(img)

# 帶有留白的圓角矩形
draw.rounded_rectangle(
    [x1 - pad, y1 - pad, x2 + pad, y2 + pad],
    radius=14, outline=color, width=stroke
)

# 引導線 (與矩形厚度相同)
draw.line([x2 + pad, cy, x2 + pad + 40, cy - 30], fill=color, width=stroke)

# 標籤 — 與主體同色的描邊，請勿使用白色描邊
draw.text(
    (x2 + pad + 45, cy - 60), '標籤文字',
    fill=color, font=font, stroke_width=1, stroke_fill=color
)

img.save('annotated.png')
```

## 演算法標註 — `annotate.py`

若圖像有多個元素需要標註，請使用下方的 `annotate.py` 模組。將其儲存於指令碼旁並匯入。它能處理自動標籤放置，避免重疊。

### 快速開始

```python
from annotate import annotate_image

result = annotate_image(
    'screenshot.png',
    [
        {'elem': (560, 275, 635, 390), 'label': '按鈕', 'draw_box': True},
        {'elem': (105, 453, 236, 470), 'label': '狀態文字'},
    ],
    debug=True,
)
result.save('annotated.png')
```

- `elem`: `(x1, y1, x2, y2)` 精確邊界框 — 必須是準確的像素座標。
- `label`: 文字標籤（支援 `\n` 進行多行換行）。
- `draw_box`: 若為 `True`，則在元素周圍繪製圓角矩形。若為 `False`（預設），則繪製指向元素的 V 型箭頭。
- `debug`: 顯示目標矩形和候選熱圖，用於驗證放置效果。

### 座標網格輔助工具

**在標註陌生圖像前，務必使用 `grid_image()`。** 縮小的預覽圖顯示的尺寸小於實際像素尺寸 — 遠離 (0,0) 時誤差會累積。

```python
from annotate import grid_image

grid = grid_image('screenshot.png', step=100)
grid.save('grid.png')
```

然後使用小範圍裁剪進行驗證：

```python
from PIL import Image
img = Image.open('screenshot.png')
crop = img.crop((x1 - 20, y1 - 20, x2 + 20, y2 + 20))
crop.save('verify.png')
```

### 演算法概覽

1. **環形搜尋**：候選位置在距離元素邊緣 MIN_ARROW (25px) 到 MAX_ARROW (120px) 之間。
2. **對比度評分**：偏好標籤文字易讀的位置 — `abs(avg_brightness - 147) - std * 0.3 - dist * 0.02`。
3. **聯合解析**：獨立計算候選位置，並以貪婪方式放置（分數最高者優先）。
4. **硬性阻擋**：標籤不得與任何其他標註的元素或緩衝區重疊。
5. **鄰近懲罰**：距離其他已放置標籤 40px 以內的標籤會被扣分。
6. **箭頭交叉懲罰**：箭頭若穿過已放置的箭頭，扣 50 分。

### 除錯模式顏色

| 顏色 | 意義 |
|-------|---------|
| 青色 | 目標元素框 (元素 + 留白) |
| 灰色 | 排除區域 (MIN_ARROW 緩衝區) |
| 紅→綠 | 候選熱圖 (紅=差，綠=好) |
| 洋紅色 | 選擇的標籤位置 |
| 橙色 | 最終渲染的標註 |

### 箭頭樣式

- **`draw_box=True`**: 圓角矩形 + 直線連接到標籤，無箭頭。
- **`draw_box=False`**: V 型箭頭，線條末端為圓角。

### `annotate.py` — 完整模組

請將此內容儲存為 `annotate.py` 並從中匯入：

```python
"""
自動化螢幕截圖標註，具備自動標籤放置功能。

pip install Pillow numpy
對於 diff_images 選用：pip install scipy
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# --- 預設值 ---
DEFAULT_FONT = 'C:/Windows/Fonts/Inkfree.ttf'
DEFAULT_FONT_SIZE = 32
DEFAULT_COLOR = '#FF9F1C'
DEFAULT_STROKE = 5
MIN_ARROW = 25
MAX_ARROW = 120
TEXT_PAD = 6
BREATH = 18
CROSSING_PENALTY = 50
PROXIMITY_MARGIN = 40
PROXIMITY_PENALTY = 50


def _rect_intersects(a, b):
    return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]


def _segments_intersect(p1, p2, p3, p4):
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    d1, d2 = cross(p3, p4, p1), cross(p3, p4, p2)
    d3, d4 = cross(p1, p2, p3), cross(p1, p2, p4)
    return ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and \
           ((d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0))


def _line_rect_exit(cx, cy, tx, ty, rect):
    x1, y1, x2, y2 = rect
    dx, dy = tx - cx, ty - cy
    tmin, tmax = 0.0, 1.0
    for lo, hi, p, d in [(x1, x2, cx, dx), (y1, y2, cy, dy)]:
        if abs(d) < 1e-9:
            continue
        t0, t1 = (lo - p) / d, (hi - p) / d
        if t0 > t1:
            t0, t1 = t1, t0
        tmin, tmax = max(tmin, t0), min(tmax, t1)
    return (cx + dx * tmax, cy + dy * tmax)


def _rect_gap(a, b):
    dx = max(a[0] - b[2], b[0] - a[2], 0)
    dy = max(a[1] - b[3], b[1] - a[3], 0)
    if dx == 0 and dy == 0:
        return 0
    return math.sqrt(dx**2 + dy**2)


def _find_candidates(pixels, W, H, cyan, pw, ph, font):
    cx, cy = (cyan[0] + cyan[2]) / 2, (cyan[1] + cyan[3]) / 2
    excl_zone = (cyan[0] - MIN_ARROW, cyan[1] - MIN_ARROW,
                 cyan[2] + MIN_ARROW, cyan[3] + MIN_ARROW)
    sx1 = max(0, cyan[0] - MAX_ARROW - pw)
    sy1 = max(0, cyan[1] - MAX_ARROW - ph)
    sx2 = min(W - pw, cyan[2] + MAX_ARROW)
    sy2 = min(H - ph, cyan[3] + MAX_ARROW)
    step_x = max(8, min(pw // 2, MAX_ARROW // 3))
    step_y = max(8, min(ph // 2, MAX_ARROW // 3))
    cands = []
    for px in range(sx1, sx2, step_x):
        for py in range(sy1, sy2, step_y):
            pink = (px, py, px + pw, py + ph)
            if _rect_intersects(pink, excl_zone):
                continue
            gl, gr = cyan[0] - pink[2], pink[0] - cyan[2]
            gt, gb = cyan[1] - pink[3], pink[1] - cyan[3]
            hd, vd = max(gl, gr, 0), max(gt, gb, 0)
            ed = math.sqrt(hd**2 + vd**2) if (hd > 0 and vd > 0) else max(hd, vd)
            if ed > MAX_ARROW:
                continue
            region = pixels[py:py + ph, px:px + pw, :3].astype(float)
            score = abs(np.mean(region) - 147) - np.std(region) * 0.3
            dist = math.sqrt((px + pw/2 - cx)**2 + (py + ph/2 - cy)**2)
            score -= dist * 0.02
            cands.append(((px, py), score))
    return cands


def _resolve_placements(annots, font):
    placed = []
    all_elem_zones = []
    for ann in annots:
        all_elem_zones.append(ann['cyan'])
        if ann.get('draw_box', False):
            c = ann['cyan']
            all_elem_zones.append((c[0]-BREATH, c[1]-BREATH, c[2]+BREATH, c[3]+BREATH))
    for ann in sorted(annots, key=lambda a: -a['best_score']):
        pw, ph = ann['pw'], ann['ph']
        cyan = ann['cyan']
        cx, cy = ann['cyan_center']
        draw_box = ann.get('draw_box', False)
        best_pos, best_score = None, -999
        valid = []
        for (px, py), score in ann['candidates']:
            pink = (px, py, px + pw, py + ph)
            ok = True
            for ez in all_elem_zones:
                if ez == cyan:
                    continue
                if ann.get('draw_box', False):
                    own_viz = (cyan[0]-BREATH, cyan[1]-BREATH, cyan[2]+BREATH, cyan[3]+BREATH)
                    if ez == own_viz:
                        continue
                if _rect_intersects(pink, ez):
                    ok = False; break
            if not ok:
                continue
            for p_pink, p_excl, p_viz, _ in placed:
                if _rect_intersects(pink, p_pink) or _rect_intersects(pink, p_excl):
                    ok = False; break
                if p_viz and _rect_intersects(pink, p_viz):
                    ok = False; break
            if not ok:
                continue
            for p_pink, p_excl, p_viz, _ in placed:
                for rect in [p_pink, p_excl, p_viz]:
                    if rect is None:
                        continue
                    gap = _rect_gap(pink, rect)
                    if gap < PROXIMITY_MARGIN:
                        score -= PROXIMITY_PENALTY * (1 - gap / PROXIMITY_MARGIN)
            for ez in all_elem_zones:
                if ez == cyan:
                    continue
                gap = _rect_gap(pink, ez)
                if gap < PROXIMITY_MARGIN:
                    score -= PROXIMITY_PENALTY * (1 - gap / PROXIMITY_MARGIN)
            tcx, tcy = px + pw/2, py + ph/2
            cand_start = _line_rect_exit(tcx, tcy, cx, cy, pink)
            if draw_box:
                viz = (cyan[0]-BREATH, cyan[1]-BREATH, cyan[2]+BREATH, cyan[3]+BREATH)
                cand_end = _line_rect_exit(cx, cy, tcx, tcy, viz)
            else:
                cand_end = _line_rect_exit(cx, cy, tcx, tcy, cyan)
            for _, _, _, pa in placed:
                if pa and _segments_intersect(cand_start, cand_end, pa[0], pa[1]):
                    score -= CROSSING_PENALTY; break
            valid.append(((px, py), score))
            if score > best_score:
                best_score, best_pos = score, (px, py)
        ann['valid_candidates'] = valid
        if best_pos is None:
            ann['pink'] = ann['tpos'] = ann['astart'] = ann['aend'] = ann['viz'] = None
            continue
        px, py = best_pos
        pink = (px, py, px + pw, py + ph)
        ann['pink'] = pink
        ann['tpos'] = (px + TEXT_PAD, py + TEXT_PAD)
        tcx, tcy = px + pw/2, py + ph/2
        ann['astart'] = _line_rect_exit(tcx, tcy, cx, cy, pink)
        if draw_box:
            viz = (cyan[0]-BREATH, cyan[1]-BREATH, cyan[2]+BREATH, cyan[3]+BREATH)
            ann['viz'] = viz
            ann['aend'] = _line_rect_exit(cx, cy, tcx, tcy, viz)
        else:
            ann['viz'] = None
            ann['aend'] = _line_rect_exit(cx, cy, tcx, tcy, cyan)
        placed.append((pink, ann['excl_zone'], ann['viz'], (ann['astart'], ann['aend'])))


def _draw_debug(img, annots, color):
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for ann in annots:
        cands = ann.get('valid_candidates', ann['candidates'])
        if not cands:
            continue
        pw, ph = ann['pw'], ann['ph']
        scores = [s for _, s in cands]
        smin, smax = min(scores), max(scores)
        rng = smax - smin if smax > smin else 1
        for (px, py), score in cands:
            t = (score - smin) / rng
            if t < 0.5:
                r_c, g_c, b_c = 220, int(180 * (t * 2)), 0
            else:
                r_c, g_c, b_c = int(220 * (1 - (t-0.5)*2)), 200, 0
            alpha_fill = int(40 + 70 * t)
            alpha_out = int(80 + 120 * t)
            od.rectangle((px, py, px + pw, py + ph),
                         fill=(r_c, g_c, b_c, alpha_fill), outline=(r_c, g_c, b_c, alpha_out), width=1)
    for ann in annots:
        ez = ann['excl_zone']
        od.rectangle(ez, fill=(120, 120, 120, 50), outline=(160, 160, 160, 160), width=1)
        od.rectangle(ann['cyan'], fill=(0, 255, 255, 30), outline=(0, 255, 255, 180), width=2)
        if ann.get('pink'):
            od.rectangle(ann['pink'], fill=(255, 0, 255, 50),
                         outline=(255, 0, 255, 180), width=2)
    return Image.alpha_composite(img, overlay)


def _draw_annotations(img, annots, font, color, stroke_width):
    draw = ImageDraw.Draw(img)
    for ann in annots:
        if ann.get('viz'):
            draw.rounded_rectangle(ann['viz'], radius=12, outline=color, width=stroke_width)
        tpos = ann.get('tpos')
        astart, aend = ann.get('astart'), ann.get('aend')
        if not (tpos and astart and aend):
            continue
        sx, sy = int(astart[0]), int(astart[1])
        ex, ey = int(aend[0]), int(aend[1])
        draw.line([(sx, sy), (ex, ey)], fill=color, width=4, joint='curve')
        r = 2
        draw.ellipse([(sx-r, sy-r), (sx+r, sy+r)], fill=color)
        draw.ellipse([(ex-r, ey-r), (ex+r, ey+r)], fill=color)
        if not ann.get('draw_box', False):
            angle = math.atan2(ey - sy, ex - sx)
            al, spread = 18, 0.45
            ax = ex - al * math.cos(angle - spread)
            ay = ey - al * math.sin(angle - spread)
            bx = ex - al * math.cos(angle + spread)
            by = ey - al * math.sin(angle + spread)
            draw.line([(int(ax), int(ay)), (ex, ey)], fill=color, width=4)
            draw.line([(int(bx), int(by)), (ex, ey)], fill=color, width=4)
            for px_, py_ in [(int(ax), int(ay)), (int(bx), int(by))]:
                draw.ellipse([(px_-r, py_-r), (px_+r, py_+r)], fill=color)
        draw.text(tpos, ann['label'], fill=color, font=font,
                  stroke_width=1, stroke_fill=color)
    return img


def annotate_image(image_path, annotations, *,
                   debug=False,
                   font_path=DEFAULT_FONT,
                   font_size=DEFAULT_FONT_SIZE,
                   color=DEFAULT_COLOR,
                   stroke_width=DEFAULT_STROKE):
    """
    使用自動標籤放置對螢幕截圖進行標註。

    Args:
        image_path: 輸入影像路徑
        annotations: 字典列表，鍵值包含：
            - elem: (x1, y1, x2, y2) 元素的緊密邊界框
            - label: 文字標籤字串
            - draw_box: (可選，預設 False) 是否在元素周圍繪製圓角矩形
        debug: 若為 True，則繪製開發用矩形（青色/粉色/灰色/熱圖）
        font_path: TTF 字型檔路徑
        font_size: 字型大小（像素）
        color: 標註的十六進位顏色（預設為橙色 #FF9F1C）
        stroke_width: 橙色高亮框的線寬

    Returns:
        繪製完標註的 PIL.Image
    """
    font = ImageFont.truetype(font_path, font_size)
    img = Image.open(image_path).convert('RGBA')
    pixels = np.array(img)
    W, H = img.size
    annots = []
    for i, spec in enumerate(annotations):
        eb = spec['elem']
        em_pad = min(20, max(10, (eb[2] - eb[0]) // 10))
        cyan = (eb[0] - em_pad, eb[1] - em_pad, eb[2] + em_pad, eb[3] + em_pad)
        lines = spec['label'].split('\n')
        tw = max(font.getbbox(line)[2] - font.getbbox(line)[0] for line in lines)
        bbox = font.getbbox('Ay')
        line_h = bbox[3] - bbox[1]
        th = line_h * len(lines) + 4 * (len(lines) - 1)
        pw, ph = tw + 2 * TEXT_PAD, th + 2 * TEXT_PAD
        cands = _find_candidates(pixels, W, H, cyan, pw, ph, font)
        annots.append({
            'id': i,
            'label': spec['label'],
            'draw_box': spec.get('draw_box', False),
            'cyan': cyan,
            'cyan_center': ((cyan[0]+cyan[2])/2, (cyan[1]+cyan[3])/2),
            'excl_zone': (cyan[0]-MIN_ARROW, cyan[1]-MIN_ARROW,
                          cyan[2]+MIN_ARROW, cyan[3]+MIN_ARROW),
            'pw': pw, 'ph': ph,
            'candidates': cands,
            'best_score': max((s for _, s in cands), default=-999),
        })
    _resolve_placements(annots, font)
    annots.sort(key=lambda a: a['id'])
    if debug:
        img = _draw_debug(img, annots, color)
    img = _draw_annotations(img, annots, font, color, stroke_width)
    return img


def diff_images(before_path, after_path, *, threshold=30, min_pixels=300,
                dilate=5, debug=False):
    """尋找兩張螢幕截圖之間的變更區域並傳回聚類框。

    傳回 (clusters, debug_img_or_None):
        clusters: (x1, y1, x2, y2, pixel_count) 列表，按大小降序排列
        debug_img: 若 debug=True，傳回帶有熱圖覆蓋層和聚類框的 PIL 圖像
    """
    from scipy import ndimage
    img_a = Image.open(before_path).convert('RGB')
    img_b = Image.open(after_path).convert('RGB')
    if img_a.size != img_b.size:
        raise ValueError(f"圖像大小不同: {img_a.size} vs {img_b.size}")
    arr_a = np.array(img_a, dtype=np.float32)
    arr_b = np.array(img_b, dtype=np.float32)
    W, H = img_a.size
    diff = np.abs(arr_b - arr_a).max(axis=2)
    mask = diff > threshold
    dilated = ndimage.binary_dilation(mask, iterations=dilate)
    labeled, n_clusters = ndimage.label(dilated)
    clusters = []
    for i in range(1, n_clusters + 1):
        ys, xs = np.where(labeled == i)
        if len(ys) < min_pixels:
            continue
        clusters.append((int(xs.min()), int(ys.min()),
                          int(xs.max()), int(ys.max()), len(ys)))
    clusters.sort(key=lambda c: -c[4])
    debug_img = None
    if debug:
        overlay = img_b.copy().convert('RGBA')
        norm = np.clip(diff / 255.0, 0, 1)
        show_mask = diff > 10
        r = np.clip((norm * 2) * 255, 0, 255).astype(np.uint8)
        g = np.clip((1 - np.abs(norm - 0.5) * 2) * 200, 0, 200).astype(np.uint8)
        b = np.clip((1 - norm) * 255, 0, 255).astype(np.uint8)
        a = np.where(show_mask, np.clip(norm * 200 + 40, 40, 220).astype(np.uint8), 0)
        heat = Image.fromarray(np.stack([r, g, b, a], axis=2), 'RGBA')
        overlay = Image.alpha_composite(overlay, heat)
        draw = ImageDraw.Draw(overlay)
        try:
            font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 18)
        except OSError:
            font = ImageFont.load_default()
        for idx, (x1, y1, x2, y2, px_count) in enumerate(clusters):
            draw.rectangle([x1, y1, x2, y2], outline=(0, 255, 255, 200), width=3)
            label = f"#{idx+1}  {px_count:,}px"
            bbox = font.getbbox(label)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
            lx, ly = x1, max(0, y1 - th - 8)
            draw.rectangle([lx, ly, lx + tw + 8, ly + th + 4], fill=(0, 0, 0, 180))
            draw.text((lx + 4, ly + 2), label, fill=(0, 255, 255, 255), font=font)
        debug_img = overlay
    return clusters, debug_img


def grid_image(image_path, step=100):
    """在圖像上繪製座標網格，以便精確定位元素。"""
    img = Image.open(image_path).convert('RGBA')
    draw = ImageDraw.Draw(img)
    W, H = img.size
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 14)
    except OSError:
        font = ImageFont.load_default()
    for x in range(0, W, step):
        draw.line([(x, 0), (x, H)], fill=(255, 0, 0, 120), width=1)
        draw.text((x + 2, 2), str(x), fill=(255, 0, 0, 200), font=font)
    for y in range(0, H, step):
        draw.line([(0, y), (W, y)], fill=(255, 0, 0, 120), width=1)
        draw.text((2, y + 2), str(y), fill=(255, 0, 0, 200), font=font)
    return img
```

## 圖像差異分析 (Image Diffing)

以程式方式尋找兩張螢幕截圖之間的變更。作為微小變更的安全網 — 若差異顯著，建議直接進行標註。

```python
from annotate import diff_images

clusters, debug_img = diff_images(
    'before.png', 'after.png',
    threshold=30,     # 像素差異門檻 (0-255)
    min_pixels=300,   # 忽略極小的雜訊群組
    dilate=5,         # 合併附近的變更像素
    debug=True,       # 渲染熱圖覆蓋層
)

# clusters = [(x1, y1, x2, y2, pixel_count), ...] 按大小降序排列
if debug_img:
    debug_img.save('diff-debug.png')

# 將群組資料傳入 annotate_image:
annotations = [
    {'elem': (x1, y1, x2, y2), 'label': f'變更 #{i+1}', 'draw_box': True}
    for i, (x1, y1, x2, y2, _) in enumerate(clusters[:3])
]
```

**除錯熱圖顏色**：藍色 = 差異微小，黃色 = 中等，紅色 = 巨大，青色框 = 群組邊界框。

**適用場景**：細微的透明度變更、虛線、輕微顏色偏移、反鋸齒差異。
**不適用場景**：肉眼可見的任何變更 — 請直接進行標註，以獲得更好的說明標籤。

## 動畫 GIF 標註

與靜態圖像不同 — 動畫具有時間軸、轉場和動態視覺內容。

### 元素高亮

1. **大區域用矩形，小元素用箭頭** — 500x300px 的區域用矩形，200x25px 的元素用箭頭。
2. **標籤放在描述內容的「緊鄰處」** — 短箭頭 (30-80px)，標籤鄰近放置。觀眾視線不應移動超過 ~100px。
3. **箭頭不得穿過標籤** — 選擇靠近目標的邊緣。
4. **請勿使用底部條/字幕模式** — 視線會在內容和底部條之間跳躍。僅建議使用內容情境標註。
5. **主訊息使用較大字體** — 重點內容 64pt+，細節標註 38pt。

### 時序與節奏

6. **淡入：10fps 下的 2 影格彈出** — 50% → 100% 不透明度（總計 0.2s）。低影格率下的緩動曲線效果很差。
7. **輸入 → 暫停 → 標註** — 在快速操作期間，請勿顯示任何標註。先暫停，再添加標註。
8. **可變影格持續時間** — 操作時快速 (100ms)，暫停時緩慢 (600-800ms)，重點最終訊息則長停留 (500ms)。
9. **更高的影格率以維持流暢運動** — 打字/互動至少 10fps。

### 彈出淡入實作

```python
# 10fps 下的 2 影格彈出
FADE_ALPHAS = [0.50, 1.00]

for frame_idx in range(total_frames):
    if annotation_just_changed and local_idx < len(FADE_ALPHAS):
        alpha = FADE_ALPHAS[local_idx]
    else:
        alpha = 1.0
    # 將 alpha 應用於標註元素：
    # - 藥丸形背景: fill=(r, g, b, int(base_alpha * alpha))
    # - 文字: fill=(*color, int(255 * alpha))
    # - 矩形邊框: outline=(*color, int(255 * alpha))
```

## 準則

1. **所有元素厚度一致** — 矩形 `width`、線條 `width` 和視覺文字粗細應保持一致 (~5px)。
2. 將標籤**靠近矩形放置** — 短引導線 (25-35px)。
3. 標籤可以重疊內容 — 描邊提供了足夠的對比度。
4. **先在本地驗證** — 上傳到 PR 前務必確認。
5. **以原始 1x 解析度擷取截圖，並在 HTML 中控制顯示大小** — Markdown 中使用 `<img width="300">`，請勿用 PIL 調整大小（會產生偽影）。
6. **務必先檢查 `Image.open(path).size`** — 高解析度 (HiDPI) 截圖比看起來大（150% 縮放 = 1.5x CSS 像素尺寸）。
7. **短標籤效果較好** — 長標籤有效放置空間較少，盡量使用 1-3 個詞。
8. **使用 `debug=True` 驗證** — 對於新圖像的第一個標註，務必使用除錯模式檢查。

## 限制

- Ink Free 字體僅限 Windows，其他平台需後備字體。
- PIL 文字渲染功能基礎 — 不支援富文本或 Markdown。
- 動畫 GIF 標註需要逐影格處理，處理長錄影時可能較慢。
- 演算法放置效果在 2-6 個標註時最佳；過多標註可能導致畫面擁擠。
