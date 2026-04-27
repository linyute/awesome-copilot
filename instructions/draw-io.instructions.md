---
description: "建立、編輯或檢視 .drawio, .drawio.svg, 或 .drawio.png 檔案中的 draw.io 圖表與 mxGraph XML 時使用。"
applyTo: "**/*.drawio,**/*.drawio.svg,**/*.drawio.png"
---

# draw.io 圖表標準

> **技能 (Skill)**：在生成或編輯任何 `.drawio` 檔案之前，請先載入 `.github/skills/draw-io/SKILL.md` 以取得完整工作流程、XML 範例與疑難排解資訊。

---

## 必要工作流程

針對每項 draw.io 任務，請遵循以下步驟：

1. **識別** 圖表類型 (流程圖 / 架構圖 / 時序圖 / ER 圖 / UML / 網路圖 / BPMN)
2. **選擇** `.github/skills/draw-io/templates/` 中相符的範本並進行調整，或從最小框架開始
3. **規劃** 在編寫 XML 前先在紙上規劃版面配置 — 先定義層級、參與者或實體
4. **生成** 符合下方規則的有效 mxGraph XML
5. **驗證** 使用 `python .github/skills/draw-io/scripts/validate-drawio.py <file>`
6. **確認** 使用 VS Code 的 draw.io 擴充功能 (`hediet.vscode-drawio`) 開啟該檔案，確認渲染正確

---

## XML 結構規則 (不可妥協)

```xml
<!-- 生成新檔案時，將 modified 設定為當前的 ISO 8601 時間戳記 -->
<mxfile host="Electron" modified="" version="26.0.0">
  <diagram id="unique-id" name="頁面名稱">
    <mxGraphModel ...>
      <root>
        <mxCell id="0" />                          <!-- 必要：必須為第一個 -->
        <mxCell id="1" parent="0" />               <!-- 必要：必須為第二個 -->
        <!-- 所有其他儲存格皆放置於此 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

- `id="0"` 與 `id="1"` **必須** 存在且必須為前兩個儲存格 — 沒有例外
- 每個儲存格 `id` 於圖表中必須是 **唯一** 的
- 每個頂點 (`vertex="1"`) 必須包含子元素 `<mxGeometry x y width height as="geometry">`
- 每個邊 (`edge="1"`) 的 `source`/`target` 必須指向既有的頂點 ID — **例外**：浮動邊 (時序圖生命線) 於 `<mxGeometry>` 內使用 `<mxPoint as="sourcePoint">` 與 `<mxPoint as="targetPoint">`，而非 `source`/`target` 屬性
- 除 id=0 外，每個儲存格皆須包含指向既有 id 的 `parent`
- 容器 (泳道) 的子元素使用 **相對於其父容器的座標**，而非畫布座標

---

## 強制性風格慣例

### 語意化配色方案 — 於專案中保持一致

| 角色 | fillColor (填充色) | strokeColor (邊框色) |
|---|---|---|
| 主要 / 資訊 (預設) | `#dae8fc` | `#6c8ebf` |
| 成功 / 開始 / 正面 | `#d5e8d4` | `#82b366` |
| 警告 / 決策 | `#fff2cc` | `#d6b656` |
| 錯誤 / 結束 / 危險 | `#f8cecc` | `#b85450` |
| 中性 / 介面 | `#f5f5f5` | `#666666` |
| 外部 / 合作夥伴 | `#e1d5e7` | `#9673a6` |

### 頂點形狀應始終包含

```
whiteSpace=wrap;html=1;
```

### 當標籤包含 HTML 標籤 (`<b>`, `<i>`, `<br>`) 時，請使用 `html=1`

### 標準連線線

```
edgeStyle=orthogonalEdgeStyle;html=1;
```

---

## 圖表類型快速參考

| 類型 | 容器 | 關鍵形狀 | 連線線風格 |
|---|---|---|---|
| 流程圖 | 無 | `ellipse` (開始/結束), `rounded=1` (處理), `rhombus` (決策) | `orthogonalEdgeStyle` |
| 架構圖 | 每層級使用 `swimlane` | `rounded=1` 服務, 雲端/資料庫形狀 | `orthogonalEdgeStyle` 附標籤 |
| 時序圖 | 無 | `mxgraph.uml.actor`, 虛線生命線邊緣 | `endArrow=block` (同步), `endArrow=open;dashed=1` (回傳) |
| ER 圖 | `shape=table;childLayout=tableLayout` | `shape=tableRow`, `shape=partialRectangle` | `entityRelationEdgeStyle;endArrow=ERmany;startArrow=ERone` |
| UML 類別圖 | 每個類別使用 `swimlane` | 屬性/方法文字列 | `endArrow=block;endFill=0` (繼承), `dashed=1` (實現) |

---

## 版面配置最佳實務

- 所有座標對齊至 **10 px 格線** (數值需可被 10 整除)
- **水平**：同列形狀間距 40–60 px
- **垂直**：層級列間距 80–120 px
- 標準形狀大小：`120 × 60` px (處理), `200 × 100` px (決策菱形)
- 預設畫布：A4 橫向 `1169 × 827` px
- 每個頁面最多 **40 個儲存格** — 大型圖表請拆分為多個頁面
- 每個頁面頂部新增一個 **標題文字儲存格**：
  ```
  style="text;strokeColor=none;fillColor=none;fontSize=18;fontStyle=1;align=center;"
  ```

---

## 檔案與命名慣例

- 副檔名：`.drawio` 用於版本控制圖表，`.drawio.svg` 用於嵌入 Markdown 的檔案
- 命名：`kebab-case` — 例如 `order-flow.drawio`, `database-schema.drawio`
- 位置：`docs/` 或 `architecture/` 與其說明的文件程式碼存放在一起
- 多頁面：在同一個 `<mxfile>` 中，每個邏輯檢視使用一個 `<diagram>` 元素

---

## 驗證檢查清單 (每次 Commit 前執行)

- [ ] `<mxCell id="0" />` 與 `<mxCell id="1" parent="0" />` 為前兩個儲存格
- [ ] 所有儲存格 id 在圖表中是唯一的
- [ ] 所有邊的 `source`/`target` id 皆指向既有頂點
- [ ] 所有頂點儲存格皆具備 `<mxGeometry as="geometry">`
- [ ] 所有儲存格 (除 id=0 外) 皆具備有效的 `parent`
- [ ] XML 格式良好 — 無未閉合標籤，屬性值中無裸露的 `&`, `<`, `>`
- [ ] 語意化配色方案使用一致
- [ ] 每個頁面皆有標題儲存格

```bash
# 執行自動驗證
python .github/skills/draw-io/scripts/validate-drawio.py <file.drawio>
```

---

## 參考檔案

| 檔案 | 用途 |
|---|---|
| `.github/skills/draw-io/SKILL.md` | 完整代理工作流程、指令與疑難排解 |
| `.github/skills/draw-io/references/drawio-xml-schema.md` | 完整 mxCell 屬性參考 |
| `.github/skills/draw-io/references/style-reference.md` | 所有樣式鍵、形狀名稱、邊緣類型 |
| `.github/skills/draw-io/references/shape-libraries.md` | 附樣式字串的形狀函式庫目錄 |
| `.github/skills/draw-io/templates/` | 各圖表類型可直接使用的 `.drawio` 範本 |
| `.github/skills/draw-io/scripts/validate-drawio.py` | XML 結構驗證器 |
| `.github/skills/draw-io/scripts/add-shape.py` | CLI：新增形狀至既有圖表 |
