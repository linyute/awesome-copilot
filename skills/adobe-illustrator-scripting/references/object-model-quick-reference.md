# Illustrator JavaScript 物件模型快速查閱

## 包含階層

```
Application (app)
 └─ Document (文件)
     ├─ Layer (圖層)
     │   ├─ pathItems[]        → PathItem → PathPoint[]
     │   ├─ compoundPathItems[] → CompoundPathItem
     │   ├─ textFrames[]       → TextFrame (文字框)
     │   │   ├─ characters[]   → TextRange (單個字元)
     │   │   ├─ words[]        → TextRange (單字)
     │   │   ├─ paragraphs[]   → TextRange (段落)
     │   │   ├─ lines[]        → TextRange (行)
     │   │   └─ insertionPoints[] (插入點)
     │   ├─ placedItems[]      → PlacedItem (置入項目)
     │   ├─ rasterItems[]      → RasterItem (點陣項目)
     │   ├─ meshItems[]        → MeshItem (網格項目)
     │   ├─ pluginItems[]      → PluginItem (外掛程式項目)
     │   ├─ graphItems[]       → GraphItem (圖表項目)
     │   ├─ symbolItems[]      → SymbolItem (符號項目) → Symbol
     │   ├─ groupItems[]       → GroupItem (群組項目，遞迴包含頁面項目)
     │   ├─ nonNativeItems[]   → NonNativeItem (非原生項目)
     │   └─ legacyTextItems[]  → LegacyTextItem (舊版文字項目)
     ├─ Artboard[] (工作區域)
     ├─ Swatch[] (色樣) / Spot[] (特別色) / Gradient[] (漸層) / Pattern[] (圖樣)
     ├─ GraphicStyle[] (圖形樣式) / Brush[] (筆刷) / Symbol[] (符號)
     ├─ Story[]
     ├─ CharacterStyle[] (字元樣式) / ParagraphStyle[] (段落樣式)
     ├─ Variable[] (變數) / Dataset[] (資料集)
     └─ View[] (檢視)
```

## 圖稿項目類型 (pageItems 成員)

| 類型 | typename | 集合 | 備註 |
|---|---|---|---|
| 路徑 | `PathItem` | `pathItems` | 線條、形狀、任意路徑 |
| 複合路徑 | `CompoundPathItem` | `compoundPathItems` | 多條路徑組合而成 |
| 群組 | `GroupItem` | `groupItems` | 包含巢狀頁面項目 |
| 文字框 | `TextFrame` | `textFrames` | 點文字、區域文字或路徑文字 |
| 置入影像 | `PlacedItem` | `placedItems` | 連結的外部檔案 |
| 點陣影像 | `RasterItem` | `rasterItems` | 嵌入的點陣圖 |
| 網格 | `MeshItem` | `meshItems` | 漸層網格物件 |
| 圖表 | `GraphItem` | `graphItems` | 統計圖/圖表物件 |
| 外掛程式項目 | `PluginItem` | `pluginItems` | 外掛程式產生的圖稿 |
| 符號實體 | `SymbolItem` | `symbolItems` | 符號的實體 |
| 非原生項目 | `NonNativeItem` | `nonNativeItems` | 外部物件 |
| 舊版文字 | `LegacyTextItem` | `legacyTextItems` | CS 版本之前的文字物件 |

## 顏色物件類型

| 物件 | 色彩空間 | 值範圍 | 備註 |
|---|---|---|---|
| `RGBColor` | RGB | 每個色版 0-255 | `.red`, `.green`, `.blue` |
| `CMYKColor` | CMYK | 每個色版 0-100 | `.cyan`, `.magenta`, `.yellow`, `.black` |
| `GrayColor` | 灰階 | 0-100 | `.gray` (0=黑色, 100=白色) |
| `LabColor` | Lab | L: 0-100, a/b: -128 到 127 | `.l`, `.a`, `.b` |
| `SpotColor` | 特別色 | 色調 (tint) 0-100 | `.spot`, `.tint` |
| `PatternColor` | 圖樣 | - | `.pattern`, `.matrix` |
| `GradientColor` | 漸層 | - | `.gradient`, `.origin`, `.angle` |
| `NoColor` | 無 | - | 透明/無填色 |

## 常用指令碼撰寫常數

### 文件與顏色

- `DocumentColorSpace.RGB` / `.CMYK`

### 文字

- `Justification.LEFT` / `.CENTER` / `.RIGHT` / `.FULLJUSTIFY` / `.FULLJUSTIFYLASTLINELEFT` / `.FULLJUSTIFYLASTLINECENTER` / `.FULLJUSTIFYLASTLINERIGHT`
- `TextType.POINTTEXT` / `.AREATEXT` / `.PATHTEXT`
- `FontBaselineOption.NORMALBASELINE` / `.SUPERSCRIPT` / `.SUBSCRIPT`

### 路徑

- `PointType.SMOOTH` / `.CORNER`
- `StrokeCap.BUTTENDCAP` / `.ROUNDENDCAP` / `.PROJECTINGENDCAP`
- `StrokeJoin.MITERENDJOIN` / `.ROUNDENDJOIN` / `.BEVELENDJOIN`

### 變形 (Transformations)

- `Transformation.DOCUMENTORIGIN` / `.BOTTOM` / `.BOTTOMLEFT` / `.BOTTOMRIGHT` / `.CENTER` / `.LEFT` / `.RIGHT` / `.TOP` / `.TOPLEFT` / `.TOPRIGHT`

### 混合模式 (Blend Modes)

- `BlendModes.NORMAL` / `.MULTIPLY` / `.SCREEN` / `.OVERLAY` / `.SOFTLIGHT` / `.HARDLIGHT` / `.COLORDODGE` / `.COLORBURN` / `.DARKEN` / `.LIGHTEN` / `.DIFFERENCE` / `.EXCLUSION` / `.HUE` / `.SATURATIONBLEND` / `.COLORBLEND` / `.LUMINOSITY`

### 元素放置 (Element Placement)

- `ElementPlacement.PLACEATBEGINNING` / `.PLACEATEND` / `.PLACEBEFORE` / `.PLACEAFTER` / `.INSIDE`

### 堆疊順序 (Z-Order)

- `ZOrderMethod.BRINGTOFRONT` / `.SENDTOBACK` / `.BRINGFORWARD` / `.SENDBACKWARD`

### 儲存/匯出

- `SaveOptions.SAVECHANGES` / `.DONOTSAVECHANGES` / `.PROMPTTOSAVECHANGES`
- `ExportType.PNG24` / `.PNG8` / `.JPEG` / `.SVG` / `.TIFF` / `.PHOTOSHOP` / `.AUTOCAD` / `.FLASH` / `.GIF`
- `Compatibility.ILLUSTRATOR8` 到 `.ILLUSTRATOR24`
- `PDFCompatibility.ACROBAT4` 到 `.ACROBAT8`

### 漸層

- `GradientType.LINEAR` / `.RADIAL`

### 變數

- `VariableKind.TEXTUAL` / `.IMAGE` / `.VISIBILITY` / `.GRAPH`

### 使用者互動

- `UserInteractionLevel.DISPLAYALERTS` / `.DONTDISPLAYALERTS`

### 列印

- `PrintArtworkDesignation.ALLLAYERS` / `.VISIBLELAYERS` / `.VISIBLEPRINTABLELAYERS`

## 單位轉換

| 從 | 到點 (Points) | 公式 |
|---|---|---|
| 英吋 | 點 | `inches * 72` |
| 公分 | 點 | `cm * 28.346` |
| 公釐 | 點 | `mm * 2.834645` |
| 派卡 (Picas) | 點 | `picas * 12` |
| Em 單位 | 點 | `(emUnits * fontSize) / 1000` |
