# draw-io 指令稿 (draw-io Scripts)

用於在 cxp-bu-order-ms 專案中處理 `.drawio` 圖表檔案的實用指令稿。

## 需求

- Python 3.8+
- 無外部依賴項目（僅使用標準函式庫：`xml.etree.ElementTree`, `argparse`, `json`, `sys`, `pathlib`）

## 指令稿 (Scripts)

### `validate-drawio.py`

根據必要條件驗證 `.drawio` 檔案的 XML 結構。

**用法**

```bash
python scripts/validate-drawio.py <圖表路徑.drawio>
```

**範例**

```bash
# 驗證單一檔案
python scripts/validate-drawio.py docs/architecture.drawio

# 驗證目錄中的所有 drawio 檔案
for f in docs/**/*.drawio; do python scripts/validate-drawio.py "$f"; done
```

**執行檢查項**

| 檢查項 | 描述 |
|-------|-------------|
| 根儲存格 | 驗證每個圖表頁面中是否存在 id="0" 和 id="1" 的儲存格 |
| 唯一 ID | 一個圖表內的所有 `mxCell` id 值皆唯一 |
| 邊緣連接性 | 每個邊緣都具有指向現有儲存格的有效 `source` 和 `target` 屬性 |
| 幾何資訊 | 每個頂點儲存格皆具有一個 `mxGeometry` 子元件 |
| 父層鏈 | 每個儲存格的 `parent` 屬性皆參照現有的儲存格 id |
| XML 格式正確性 | 檔案為有效的 XML 格式 |

**結束代碼**

- `0` — 驗證通過
- `1` — 發現一個或多個驗證錯誤（錯誤訊息會印出至標準輸出 stdout）

---

### `add-shape.py`

將新的形狀（頂點儲存格）新增至現有的 `.drawio` 圖表檔案。

**用法**

```bash
python scripts/add-shape.py <圖表.drawio> <標籤> <x> <y> [選項]
```

**參數**

| 參數 | 必要 | 描述 |
|----------|----------|-------------|
| `diagram` | 是 | `.drawio` 檔案的路徑 |
| `label` | 是 | 新形狀的文字標籤 |
| `x` | 是 | X 座標（相對於左上角的像素） |
| `y` | 是 | Y 座標（相對於左上角的像素） |

**選項**

| 選項 | 預設值 | 描述 |
|--------|---------|-------------|
| `--width` | `120` | 形狀寬度（像素） |
| `--height` | `60` | 形狀高度（像素） |
| `--style` | `"rounded=1;whiteSpace=wrap;html=1;"` | draw.io 樣式字串 |
| `--diagram-index` | `0` | 圖表頁面索引（從 0 開始） |
| `--dry-run` | false | 僅印出新儲存格的 XML 而不修改檔案 |

**範例**

```bash
# 新增一個基礎圓角方框
python scripts/add-shape.py docs/flowchart.drawio "新步驟" 400 300

# 新增一個自訂樣式的形狀
python scripts/add-shape.py docs/flowchart.drawio "決策" 400 400 \
  --width 160 --height 80 \
  --style "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"

# 在不寫入檔案的情況下預覽
python scripts/add-shape.py docs/architecture.drawio "服務 X" 600 200 --dry-run
```

**輸出**

成功時印出新的儲存格 id：
```
Added shape id="auto_abc123" to page 0 of docs/flowchart.drawio
```

---

## 常見工作流程

### 提交前驗證

```bash
# 驗證所有圖表
find . -name "*.drawio" -not -path "*/node_modules/*" | \
  xargs -I{} python scripts/validate-drawio.py {}
```

### 快速新增預留位置節點

```bash
python scripts/add-shape.py docs/architecture.drawio "TODO: 服務" 800 400 \
  --style "rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;"
```

### 檢查範本是否有效

```bash
python scripts/validate-drawio.py .github/skills/draw-io-diagram-generator/templates/flowchart.drawio
```
