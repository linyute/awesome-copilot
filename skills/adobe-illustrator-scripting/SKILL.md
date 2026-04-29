---
name: 'adobe-illustrator-scripting'
description: '使用 ExtendScript (JavaScript/JSX) 編寫、偵錯並最佳化 Adobe Illustrator 自動化指令碼。在建立或修改操作文件、圖層、路徑、文字框、顏色、符號、工作區域或任何 Illustrator DOM 物件的指令碼時使用。涵蓋完整的 JavaScript 物件模型、座標系統、測量單位、匯出工作流程以及指令碼撰寫最佳實務。'
---

# Adobe Illustrator 指令碼撰寫

透過 ExtendScript (JavaScript/JSX) 自動化 Adobe Illustrator 的專家指引。此技能涵蓋 Illustrator 指令碼撰寫物件模型、所有主要 API 物件、程式碼模式，以及編寫生產品質 `.jsx` 指令碼的最佳實務。

## 隨附資產

- [`references/object-model-quick-reference.md`](references/object-model-quick-reference.md)：在編寫或偵錯指令碼時，使用此檔案快速查閱 Illustrator 指令碼撰寫物件模型、常見文件和頁面項目類型，以及相關的 DOM 概念。
- `scripts/`：包含 Illustrator 自動化指令碼範例，你可以將其用作文件操作、匯出、批次處理和 DOM 使用等常見任務的起點或實作模式。當你需要運作中的 JSX 模式或想要在偵錯時比較行為時，請查閱並改編這些範例。

## 何時使用此技能

- 編寫新的 Illustrator 自動化指令碼（`.jsx` 或 `.js` 檔案）
- 偵錯或修復現有的 Illustrator ExtendScript 程式碼
- 透過程式化方式操作文件、圖層、頁面項目、路徑、文字或顏色
- 批次處理 Illustrator 檔案或從資料產生圖稿
- 將文件匯出為各種格式（PDF、SVG、PNG、EPS 等）
- 使用 Illustrator DOM（Application、Document、Layer、PathItem、TextFrame 等）
- 使用變數和資料集建立資料驅動的圖形
- 使用指令碼化的列印選項自動化列印工作流程

## 先決條件

- 已安裝 Adobe Illustrator CC 或更高版本
- 具備基礎 JavaScript 知識（ExtendScript 是以 ES3 為基礎並包含 Adobe 擴充功能）
- 指令碼透過「檔案 > 指令碼 > 其他指令碼」、「指令碼」選單執行，或放置在「啟動指令碼」(Startup Scripts) 資料夾中
- 可使用 ExtendScript Toolkit (ESTK) 或任何文字編輯器來編寫 `.jsx` 檔案

## 指令碼撰寫環境

### 語言與副檔名

| 語言 | 副檔名 | 平台 |
|---|---|---|
| ExtendScript/JavaScript | `.jsx`, `.js` | Windows, macOS |
| AppleScript | `.scpt` | 僅限 macOS |
| VBScript | `.vbs` | 僅限 Windows |

**此技能專注於 ExtendScript/JavaScript**，因為它是跨平台且使用最廣泛的選項。

### 執行指令碼

- **指令碼選單**：檔案 > 指令碼，列出應用程式指令碼資料夾中的指令碼。
- **其他指令碼**：檔案 > 指令碼 > 其他指令碼，瀏覽並執行任何 `.jsx` 檔案。
- **啟動指令碼**：將指令碼放在 Startup Scripts 資料夾中，即可在啟動時自動執行。
- **Target 指令**：從 ESTK 或外部工具執行時，在指令碼開頭加入 `#target illustrator`。
- **`#targetengine` 指令**：使用 `#targetengine "session"` 在指令碼執行之間保留變數。

### 命名慣例 (JavaScript)

- 物件和屬性使用 **camelCase**：`activeDocument`、`pathItems`、`textFrames`
- 全域 `app` 引用 `Application` 物件
- 集合索引為 **從零開始 (zero-based)**：`documents[0]` 是最前面的文件
- 使用 `typename` 屬性在執行階段識別物件類型

## 物件模型概觀

Illustrator DOM 遵循嚴格的包含階層：

```
Application (app)
├── activeDocument / documents[]
│   ├── layers[]
│   │   ├── pageItems[] (所有圖稿)
│   │   ├── pathItems[]
│   │   ├── compoundPathItems[]
│   │   ├── textFrames[]
│   │   ├── placedItems[]
│   │   ├── rasterItems[]
│   │   ├── meshItems[]
│   │   ├── pluginItems[]
│   │   ├── graphItems[]
│   │   ├── symbolItems[]
│   │   ├── nonNativeItems[]
│   │   ├── legacyTextItems[]
│   │   └── groupItems[]
│   ├── artboards[]
│   ├── views[]
│   ├── selection (所選項目的陣列)
│   ├── swatches[], spots[], gradients[], patterns[]
│   ├── graphicStyles[], brushes[], symbols[]
│   ├── textFonts[] (透過 app.textFonts)
│   ├── stories[], characterStyles[], paragraphStyles[]
│   ├── variables[], datasets[]
│   └── inkList[], printOptions
├── preferences
├── printerList[]
└── textFonts[]
```

### 頂層物件

- **Application** (`app`)：根物件。提供對文件、偏好設定、字體和印表機的存取。關鍵屬性：`activeDocument`、`documents`、`textFonts`、`printerList`、`userInteractionLevel`、`version`。
- **Document**：代表開啟的 `.ai` 檔案。關鍵屬性：`layers`、`pageItems`、`selection`、`activeLayer`、`width`、`height`、`rulerOrigin`、`documentColorSpace`。關鍵方法：`saveAs()`、`exportFile()`、`close()`、`print()`。
- **Layer**：繪圖圖層。關鍵屬性：`pageItems`、`pathItems`、`textFrames`、`visible`、`locked`、`opacity`、`name`、`zOrderPosition`、`color`。

## 測量單位與座標

### 單位

所有指令碼 API 值均使用 **點 (points)** (72 點 = 1 英吋)。轉換其他單位：

| 單位 | 轉換方式 |
|---|---|
| 英吋 | 乘以 72 |
| 公分 | 乘以 28.346 |
| 公釐 | 乘以 2.834645 |
| 派卡 (Picas) | 乘以 12 |

字距微調 (Kerning)、字元間距 (Tracking) 和 `aki` 屬性使用 **em 單位** (一千分之一 em，與字體大小成比例)。

### 座標系統

- 對於**透過指令碼建立的文件**，原點 `(0,0)` 位於工作區域的**左下角**。
- X 軸從左到右增加；Y 軸從下到上增加。
- 頁面項目的 `position` 屬性是其週框 (bounding box) 的**左上角**，格式為 `[x, y]`。
- 頁面項目最大寬度/高度：16348 點。

### 圖稿項目邊界 (Art Item Bounds)

每個頁面項目都有三個週框矩形：

- `geometricBounds`：不包含筆畫寬度 `[左, 上, 右, 下]`
- `visibleBounds`：包含筆畫寬度
- `controlBounds`：包含控制點/方向點

## 使用文件

### 建立與開啟

```javascript
// 建立新文件
var doc = app.documents.add();

// 使用預設集建立
var preset = new DocumentPreset();
preset.width = 612;  // 8.5 英吋
preset.height = 792; // 11 英吋
preset.colorMode = DocumentColorSpace.CMYK;
var doc = app.documents.addDocument("Print", preset);

// 開啟現有檔案
var fileRef = new File("/path/to/file.ai");
var doc = app.open(fileRef);
```

### 儲存與匯出

```javascript
// 儲存為 Illustrator 格式
var saveOpts = new IllustratorSaveOptions();
saveOpts.compatibility = Compatibility.ILLUSTRATOR17; // CC
doc.saveAs(new File("/path/to/output.ai"), saveOpts);

// 匯出為 PDF
var pdfOpts = new PDFSaveOptions();
pdfOpts.compatibility = PDFCompatibility.ACROBAT7;
pdfOpts.preserveEditability = false;
doc.saveAs(new File("/path/to/output.pdf"), pdfOpts);

// 匯出為 PNG
var pngOpts = new ExportOptionsPNG24();
pngOpts.horizontalScale = 300;
pngOpts.verticalScale = 300;
pngOpts.transparency = true;
doc.exportFile(new File("/path/to/output.png"), ExportType.PNG24, pngOpts);

// 匯出為 SVG
var svgOpts = new ExportOptionsSVG();
svgOpts.fontType = SVGFontType.OUTLINEFONT;
doc.exportFile(new File("/path/to/output.svg"), ExportType.SVG, svgOpts);
```

## 使用路徑與形狀

### 內建形狀方法

`pathItems` 集合提供常用形狀的簡便方法：

```javascript
var doc = app.activeDocument;
var layer = doc.activeLayer;

// 矩形：rectangle(上, 左, 寬, 高)
var rect = layer.pathItems.rectangle(500, 100, 200, 150);

// 圓角矩形：roundedRectangle(上, 左, 寬, 高, 水平半徑, 垂直半徑)
var rrect = layer.pathItems.roundedRectangle(500, 100, 200, 150, 20, 20);

// 橢圓：ellipse(上, 左, 寬, 高)
var oval = layer.pathItems.ellipse(400, 200, 100, 100);

// 多邊形：polygon(中心 X, 中心 Y, 半徑, 邊數)
var hex = layer.pathItems.polygon(300, 300, 50, 6);

// 星形：star(中心 X, 中心 Y, 半徑, 內半徑, 點數)
var star = layer.pathItems.star(300, 300, 50, 25, 5);
```

### 使用座標陣列建立任意路徑

```javascript
var doc = app.activeDocument;
var path = doc.pathItems.add();
path.setEntirePath([[100, 100], [200, 200], [300, 100]]);
path.closed = false;
path.stroked = true;
path.strokeWidth = 2;
```

### 使用 PathPoint 物件建立任意路徑

```javascript
var doc = app.activeDocument;
var path = doc.pathItems.add();

var point1 = path.pathPoints.add();
point1.anchor = [100, 100];
point1.leftDirection = [100, 100];
point1.rightDirection = [150, 150];
point1.pointType = PointType.SMOOTH;

var point2 = path.pathPoints.add();
point2.anchor = [300, 100];
point2.leftDirection = [250, 150];
point2.rightDirection = [300, 100];
point2.pointType = PointType.SMOOTH;

path.closed = false;
```

### 路徑屬性

```javascript
var item = doc.pathItems[0];
item.filled = true;
item.stroked = true;
item.strokeWidth = 1.5;
item.strokeCap = StrokeCap.ROUNDENDCAP;
item.strokeJoin = StrokeJoin.ROUNDENDJOIN;
item.opacity = 80;
item.closed = true;
```

## 使用顏色

### 顏色物件

```javascript
// RGB 顏色 (值 0-255)
var red = new RGBColor();
red.red = 255;
red.green = 0;
red.blue = 0;

// CMYK 顏色 (值 0-100)
var cyan = new CMYKColor();
cyan.cyan = 100;
cyan.magenta = 0;
cyan.yellow = 0;
cyan.black = 0;

// 灰階 (0-100, 0 = 黑色)
var gray = new GrayColor();
gray.gray = 50;

// Lab 顏色
var lab = new LabColor();
lab.l = 50;
lab.a = 20;
lab.b = -30;

// 無顏色 (透明)
var none = new NoColor();
```

### 套用顏色

```javascript
var item = doc.pathItems[0];
item.fillColor = red;
item.strokeColor = cyan;

// 漸層填色
var gradient = doc.gradients.add();
gradient.type = GradientType.LINEAR;
gradient.gradientStops[0].color = red;
gradient.gradientStops[1].color = cyan;

var gradColor = new GradientColor();
gradColor.gradient = gradient;
item.fillColor = gradColor;
```

### 特別色與色樣 (Swatches)

```javascript
// 建立特別色
var spot = doc.spots.add();
spot.name = "我的特別色";
spot.color = red; // 基礎顏色定義

var spotColor = new SpotColor();
spotColor.spot = spot;
spotColor.tint = 100;

item.fillColor = spotColor;

// 透過名稱存取色樣
var swatch = doc.swatches.getByName("PANTONE 185 C");
item.fillColor = swatch.color;
```

## 使用文字

### 文字框類型

```javascript
var doc = app.activeDocument;

// 點文字 (Point text)
var pointText = doc.textFrames.add();
pointText.contents = "Hello World!";
pointText.position = [100, 500];

// 區域文字 (Area text，路徑內的文字)
var rectPath = doc.pathItems.rectangle(500, 100, 200, 100);
var areaText = doc.textFrames.areaText(rectPath);
areaText.contents = "矩形形狀內的文字。";

// 路徑文字 (Path text，沿著路徑的文字)
var curvePath = doc.pathItems.add();
curvePath.setEntirePath([[50, 300], [150, 400], [250, 300]]);
var pathText = doc.textFrames.pathText(curvePath);
pathText.contents = "路徑上的文字";
```

### 字元與段落格式

```javascript
var tf = doc.textFrames[0];
var textRange = tf.textRange;

// 字元屬性
var charAttr = textRange.characterAttributes;
charAttr.size = 24;           // 字體大小 (單位：點)
charAttr.textFont = app.textFonts.getByName("ArialMT");
charAttr.fillColor = red;
charAttr.tracking = 50;       // em 單位
charAttr.horizontalScale = 100;
charAttr.verticalScale = 100;
charAttr.baselineShift = 0;

// 段落屬性
var paraAttr = textRange.paragraphAttributes;
paraAttr.justification = Justification.CENTER;
paraAttr.firstLineIndent = 0;
paraAttr.leftIndent = 0;
paraAttr.spaceBefore = 0;
paraAttr.spaceAfter = 0;
```

### 存取文字內容

```javascript
var tf = doc.textFrames[0];

// 存取子範圍
var firstChar = tf.characters[0];
var firstWord = tf.words[0];
var firstPara = tf.paragraphs[0];
var firstLine = tf.lines[0];

// 修改特定範圍
tf.words[0].characterAttributes.size = 36;
tf.paragraphs[0].paragraphAttributes.justification = Justification.LEFT;
```

### 串接文字框 (Threading Text Frames)

```javascript
var frame1 = doc.textFrames.areaText(path1);
var frame2 = doc.textFrames.areaText(path2);

// 連結文字框，讓文字從 frame1 流向 frame2
frame1.nextFrame = frame2;

// Story 代表跨串接文字框的完整文字
var storyCount = doc.stories.length;
var fullText = doc.stories[0].textRange.contents;
```

## 使用圖層

```javascript
var doc = app.activeDocument;

// 建立圖層
var newLayer = doc.layers.add();
newLayer.name = "Background";
newLayer.visible = true;
newLayer.locked = false;
newLayer.opacity = 100;

// 存取現有圖層
var topLayer = doc.layers[0];
var layerByName = doc.layers.getByName("Background");

// 在圖層間移動項目
var item = doc.pathItems[0];
item.move(newLayer, ElementPlacement.PLACEATBEGINNING);

// 重新排序圖層
newLayer.zOrder(ZOrderMethod.SENDTOBACK);
```

## 使用選取項

```javascript
// 獲取目前選取項
var sel = app.activeDocument.selection;

// 疊代表選取的項目
for (var i = 0; i < sel.length; i++) {
    var item = sel[i];
    // 使用 typename 檢查類型
    if (item.typename === "PathItem") {
        item.fillColor = red;
    } else if (item.typename === "TextFrame") {
        item.contents = "已修改";
    }
}

// 透過程式選取項目
doc.pathItems[0].selected = true;

// 取消全選
doc.selection = null;
```

## 使用符號

```javascript
// 放置符號實體
var sym = doc.symbols.getByName("MySymbol");
var instance = doc.symbolItems.add(sym);
instance.position = [200, 400];

// 存取符號定義
var symDef = instance.symbol;

// 中斷符號連結 (擴充為一般圖稿)
instance.breakLink();
```

## 變形 (Transformations)

```javascript
var item = doc.pathItems[0];

// 繞中心旋轉 45 度
item.rotate(45);

// 縮放至寬度 50%、高度 75%
item.resize(50, 75);

// 平移 (移動)：向右 100 點，向上 50 點
item.translate(100, 50);

// 使用變形矩陣 (Transformation Matrix)
var matrix = app.getIdentityMatrix();
matrix = app.concatenateRotationMatrix(matrix, 30);
matrix = app.concatenateScaleMatrix(matrix, 150, 150);
item.transform(matrix);
```

## 使用工作區域 (Artboards)

```javascript
var doc = app.activeDocument;

// 存取工作區域
var ab = doc.artboards[0];
var rect = ab.artboardRect; // [左, 上, 右, 下]

// 建立新工作區域
var newAB = doc.artboards.add([0, 0, 612, 792]); // Letter 大小
newAB.name = "Page 2";

// 設定作用中工作區域
doc.artboards.setActiveArtboardIndex(1);
```

## 資料驅動的圖形 (變數與資料集)

```javascript
// 變數將文件項目連結到資料欄位
var v = doc.variables.add();
v.kind = VariableKind.TEXTUAL;
v.name = "headline";

// 將文字框連結到變數
var tf = doc.textFrames[0];
tf.contentVariable = v;

// 建立資料集以進行批次內容處理
var ds = doc.dataSets.add();
ds.name = "Version 1";
// 資料集會擷取目前的變數繫結

// 切換資料集以替換內容
doc.dataSets[0].display();
```

## 列印

```javascript
var doc = app.activeDocument;
var opts = new PrintOptions();

opts.printPreset = "Default";

// 紙張選項
var paperOpts = new PrintPaperOptions();
paperOpts.name = "Letter";
opts.paperOptions = paperOpts;

// 作業選項
var jobOpts = new PrintJobOptions();
jobOpts.copies = 1;
jobOpts.designation = PrintArtworkDesignation.VISIBLELAYERS;
opts.jobOptions = jobOpts;

doc.print(opts);
```

## 使用者互動層級 (User Interaction Levels)

控制執行指令碼時 Illustrator 是否顯示對話框：

```javascript
// 隱藏所有對話框
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

// 執行可能觸發對話框的操作...
doc.close(SaveOptions.DONOTSAVECHANGES);

// 恢復對話框顯示
app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
```

## 使用方法 (JavaScript 特定)

呼叫帶有多個選用參數的方法時，使用 `undefined` 跳過中間參數：

```javascript
// rotate(角度, [變更位置], [變更填色圖樣], [變更填色漸層], ...)
item.rotate(30, undefined, undefined, true);
```

## 常見模式

### 疊代文件中所有的頁面項目

```javascript
function processAllItems(doc) {
    for (var i = 0; i < doc.pageItems.length; i++) {
        var item = doc.pageItems[i];
        // 根據類型處理
        switch (item.typename) {
            case "PathItem":
                // 處理路徑
                break;
            case "TextFrame":
                // 處理文字
                break;
            case "GroupItem":
                // 處理群組 (可能包含巢狀項目)
                break;
        }
    }
}
```

### 批次處理資料夾中的檔案

```javascript
var folder = Folder.selectDialog("選擇包含 .ai 檔案的資料夾");
if (folder) {
    var files = folder.getFiles("*.ai");
    for (var i = 0; i < files.length; i++) {
        var doc = app.open(files[i]);
        // 處理每個文件...
        doc.close(SaveOptions.DONOTSAVECHANGES);
    }
}
```

### 錯誤處理

```javascript
try {
    var doc = app.activeDocument;
    var layer = doc.layers.getByName("NonExistentLayer");
} catch (e) {
    alert("錯誤：" + e.message);
    // 可使用 e.message, e.line, e.fileName
}
```

## 疑難排解

- **"undefined is not an object"**：通常表示集合為空或索引超出範圍。存取項目之前請檢查 `.length`。
- **指令碼已執行但視覺上沒有變化**：修改後呼叫 `app.redraw()` 強制重新整理畫面。
- **色彩模式不符**：文件的色彩空間 (RGB vs CMYK) 必須與顏色物件相符。使用 `doc.documentColorSpace` 進行檢查。
- **位置看起來不正確**：請記住，指令碼建立的文件使用左下角原點，Y 軸向上增加。`position` 屬性是週框的左上角。
- **文字未出現**：確保文字框大小不為零。對於點文字，設定 `position`；對於區域文字，提供有效路徑給 `areaText()`。
- **Windows 上的檔案路徑**：在路徑字串中使用正斜線 (`/`) 或雙反斜線 (`\\`)，或使用 `File` 物件建構函式。
- **對話框中斷批次指令碼**：在批次操作前設定 `app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS`。
- **集合使用 `getByName()`**：許多集合物件支援 `getByName("名稱")`，若找不到會拋出錯誤；請使用 try/catch 包圍。

## 指令碼撰寫常數參考

整個 API 中使用的常用列舉常數：

| 類別 | 常數 |
|---|---|
| **色彩空間** | `DocumentColorSpace.RGB`, `DocumentColorSpace.CMYK` |
| **對齊方式** | `Justification.LEFT`, `Justification.CENTER`, `Justification.RIGHT`, `Justification.FULLJUSTIFY` |
| **點類型** | `PointType.SMOOTH`, `PointType.CORNER` |
| **筆畫終點** | `StrokeCap.BUTTENDCAP`, `StrokeCap.ROUNDENDCAP`, `StrokeCap.PROJECTINGENDCAP` |
| **筆畫轉角** | `StrokeJoin.MITERENDJOIN`, `StrokeJoin.ROUNDENDJOIN`, `StrokeJoin.BEVELENDJOIN` |
| **混合模式** | `BlendModes.NORMAL`, `BlendModes.MULTIPLY`, `BlendModes.SCREEN`, `BlendModes.OVERLAY` |
| **儲存選項** | `SaveOptions.SAVECHANGES`, `SaveOptions.DONOTSAVECHANGES`, `SaveOptions.PROMPTTOSAVECHANGES` |
| **匯出類型** | `ExportType.PNG24`, `ExportType.PNG8`, `ExportType.JPEG`, `ExportType.SVG`, `ExportType.TIFF`, `ExportType.PHOTOSHOP`, `ExportType.AUTOCAD`, `ExportType.FLASH` |
| **元素放置** | `ElementPlacement.PLACEATBEGINNING`, `ElementPlacement.PLACEATEND`, `ElementPlacement.PLACEBEFORE`, `ElementPlacement.PLACEAFTER`, `ElementPlacement.INSIDE` |
| **堆疊順序** | `ZOrderMethod.BRINGTOFRONT`, `ZOrderMethod.SENDTOBACK`, `ZOrderMethod.BRINGFORWARD`, `ZOrderMethod.SENDBACKWARD` |
| **漸層類型** | `GradientType.LINEAR`, `GradientType.RADIAL` |
| **文字框種類** | `TextType.POINTTEXT`, `TextType.AREATEXT`, `TextType.PATHTEXT` |
| **變數種類** | `VariableKind.TEXTUAL`, `VariableKind.IMAGE`, `VariableKind.VISIBILITY`, `VariableKind.GRAPH` |
| **使用者互動** | `UserInteractionLevel.DISPLAYALERTS`, `UserInteractionLevel.DONTDISPLAYALERTS` |
| **相容性** | `Compatibility.ILLUSTRATOR10` 到 `Compatibility.ILLUSTRATOR24` |

## JavaScript 物件參考 (完整 API 物件清單)

Illustrator JavaScript API 包含以下物件，按類別分組：

### 核心物件

`Application`, `Document`, `Documents`, `DocumentPreset`, `Layer`, `Layers`, `PageItem`, `PageItems`, `View`, `Views`, `Preferences`

### 路徑與形狀物件

`PathItem`, `PathItems`, `PathPoint`, `PathPoints`, `CompoundPathItem`, `CompoundPathItems`, `GroupItem`, `GroupItems`

### 文字物件

`TextFrame`, `TextRange`, `TextRanges`, `TextPath`, `Characters`, `Words`, `Paragraphs`, `Lines`, `InsertionPoint`, `InsertionPoints`, `Story`, `Stories`, `CharacterAttributes`, `ParagraphAttributes`, `CharacterStyle`, `CharacterStyles`, `ParagraphStyle`, `ParagraphStyles`, `TextFont`, `TextFonts`, `TabStopInfo`

### 顏色物件

`RGBColor`, `CMYKColor`, `GrayColor`, `LabColor`, `NoColor`, `SpotColor`, `Spot`, `Spots`, `PatternColor`, `GradientColor`, `Color`, `Gradient`, `Gradients`, `GradientStop`, `GradientStops`

### 色樣與樣式物件

`Swatch`, `Swatches`, `SwatchGroup`, `SwatchGroups`, `GraphicStyle`, `GraphicStyles`, `Pattern`, `Patterns`, `Brush`, `Brushes`

### 符號物件

`Symbol`, `Symbols`, `SymbolItem`, `SymbolItems`

### 工作區域物件

`Artboard`, `Artboards`

### 置入與影像物件

`PlacedItem`, `PlacedItems`, `RasterItem`, `RasterItems`, `MeshItem`, `MeshItems`, `GraphItem`, `GraphItems`, `PluginItem`, `PluginItems`, `NonNativeItem`, `NonNativeItems`, `LegacyTextItem`, `LegacyTextItems`

### 資料驅動專用物件

`Variable`, `Variables`, `Dataset`, `Datasets`

### 矩陣與變形物件

`Matrix`

### 標記物件

`Tag`, `Tags`

### 描圖物件

`TracingObject`, `TracingOptions`

### 儲存與匯出選項

`IllustratorSaveOptions`, `EPSSaveOptions`, `PDFSaveOptions`, `FXGSaveOptions`, `ExportOptionsAutoCAD`, `ExportOptionsFlash`, `ExportOptionsGIF`, `ExportOptionsJPEG`, `ExportOptionsPhotoshop`, `ExportOptionsPNG8`, `ExportOptionsPNG24`, `ExportOptionsSVG`, `ExportOptionsTIFF`

### 開啟選項

`OpenOptions`, `OpenOptionsAutoCAD`, `OpenOptionsFreeHand`, `OpenOptionsPhotoshop`, `PDFFileOptions`, `PhotoshopFileOptions`

### 列印物件

`PrintOptions`, `PrintJobOptions`, `PrintPaperOptions`, `PrintColorManagementOptions`, `PrintColorSeparationOptions`, `PrintCoordinateOptions`, `PrintFlattenerOptions`, `PrintFontOptions`, `PrintPageMarksOptions`, `PrintPostScriptOptions`, `Printer`, `PrinterInfo`, `Paper`, `PaperInfo`, `PPDFile`, `PPDFileInfo`, `Ink`, `InkInfo`, `Screen`, `ScreenInfo`, `ScreenSpotFunction`

### 影像與點陣化選項

`ImageCaptureOptions`, `RasterEffectOptions`, `RasterizeOptions`

## 參考資料

- [變更記錄](https://ai-scripting.docsforadobe.dev/introduction/changelog/) - 最近的指令碼 API 變更 (CC 2020 增加了 `Document.getPageItemFromUuid` 和 `PageItem.uuid`; CC 2017 增加了 `Application.getIsFileOpen`)
- [Illustrator 指令碼撰寫指南](https://ai-scripting.docsforadobe.dev/) - 完整的社群維護文件
