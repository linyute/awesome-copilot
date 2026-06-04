---
name: adobe-illustrator-scripting
description: '使用 ExtendScript (JavaScript/JSX) 編寫、調試和優化 Adobe Illustrator 自動化腳本。適用於建立或修改操作文件、圖層、路徑、文字框、顏色、符號、工作畫板或任何 Illustrator DOM 物件的腳本。涵蓋完整的 JavaScript 物件模型、座標系統、測量單位、匯出工作流程和腳本編寫最佳實踐。'
---

# Adobe Illustrator 指令碼編寫 (Scripting)

Adobe Illustrator 自動化指令碼編寫 (ExtendScript/JavaScript) 的專家指南。此技能涵蓋 Illustrator 指令碼物件模型、所有主要 API 物件、程式碼模式以及編寫生產品質 `.jsx` 指令碼的最佳實踐。

## 隨附資源 (Bundled Assets)

- [`references/object-model-quick-reference.md`](references/object-model-quick-reference.md)：在編寫或調試指令碼時，可將此檔案作為 Illustrator 指令碼物件模型、常見文件和頁面項目類型以及相關 DOM 概念的快速查詢參考。
- `scripts/`：包含範例 Illustrator 自動化指令碼，可用作常見任務（如文件操作、匯出、批次處理和 DOM 使用）的起點或實作模式。當您需要有效的 JSX 模式或在調試時想要比較行為時，請查閱並調整這些範例。

## 何時使用此技能

- 編寫新的 Illustrator 自動化指令碼 (`.jsx` 或 `.js` 檔案)
- 調試或修復現有的 Illustrator ExtendScript 程式碼
- 以程式方式操作文件、圖層、頁面項目、路徑、文字或顏色
- 批次處理 Illustrator 檔案或從資料生成圖稿
- 將文件匯出為各種格式 (PDF, SVG, PNG, EPS 等)
- 使用 Illustrator DOM (Application, Document, Layer, PathItem, TextFrame 等)
- 使用變數和資料集建立資料驅動的圖形
- 使用指令碼列印選項自動化列印工作流程

## 先決條件

- 已安裝 Adobe Illustrator CC 或更高版本
- 具備基本的 JavaScript 知識 (ExtendScript 是基於 ES3 並帶有 Adobe 擴充功能)
- 指令碼透過「檔案」>「指令碼」>「其他指令碼」、指令碼選單執行，或放置在啟動指令碼資料夾中
- 可以使用 ExtendScript Toolkit (ESTK) 或任何文字編輯器來編寫 `.jsx` 檔案

## 指令碼執行環境

### 語言和檔案副檔名

| 語言 | 副檔名 | 平台 |
|---|---|---|
| ExtendScript/JavaScript | `.jsx`, `.js` | Windows, macOS |
| AppleScript | `.scpt` | 僅限 macOS |
| VBScript | `.vbs` | 僅限 Windows |

**此技能專注於 ExtendScript/JavaScript**，作為跨平台、使用最廣泛的選項。

### 執行指令碼

- **指令碼選單**：檔案 > 指令碼列出應用程式指令碼資料夾中的指令碼
- **其他指令碼**：檔案 > 指令碼 > 其他指令碼以瀏覽並執行任何 `.jsx` 檔案
- **啟動指令碼**：將指令碼放置在啟動指令碼資料夾中，以便在啟動時自動執行
- **Target 指令**：從 ESTK 或外部工具執行時，請以 `#target illustrator` 開頭
- **`#targetengine` 指令**：使用 `#targetengine "session"` 在指令碼執行之間保留變數
- **外部呼叫**：指令碼通常從 Illustrator 外部啟動 — 透過 Shell 指令碼、任務執行器、CI 作業、ExtendScript Toolkit (`ExtendScript Toolkit.exe -run script.jsx`) 或來自其他 Adobe 應用程式的 `BridgeTalk` 訊息。請參閱 [外部呼叫與引數傳遞](#external-invocation--argument-passing)。

### 命名慣例 (JavaScript)

- 物件和屬性使用 **camelCase**：`activeDocument`, `pathItems`, `textFrames`
- `app` 全域參考 `Application` 物件
- 集合索引是 **以零為基底**：`documents[0]` 是最前方的文件
- 使用 `typename` 屬性在執行時識別物件類型

## 物件模型概覽 (Object Model Overview)

Illustrator DOM 遵循嚴格的包含層次結構：

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
│   ├── selection (選取的項目陣列)
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

- **Application** (`app`)：根物件。提供對文件、偏好設定、字型和印表機的存取。關鍵屬性：`activeDocument`, `documents`, `textFonts`, `printerList`, `userInteractionLevel`, `version`。
- **Document**：代表開啟的 `.ai` 檔案。關鍵屬性：`layers`, `pageItems`, `selection`, `activeLayer`, `width`, `height`, `rulerOrigin`, `documentColorSpace`。關鍵方法：`saveAs()`, `exportFile()`, `close()`, `print()`。
- **Layer**：繪圖圖層。關鍵屬性：`pageItems`, `pathItems`, `textFrames`, `visible`, `locked`, `opacity`, `name`, `zOrderPosition`, `color`。

## 測量單位和座標

### 單位

所有指令碼 API 值都使用 **點 (points)** (72 點 = 1 英吋)。轉換其他單位：

| 單位 | 轉換方式 |
|---|---|
| 英吋 | 乘以 72 |
| 公分 | 乘以 28.346 |
| 公釐 | 乘以 2.834645 |
| Picas | 乘以 12 |

字距調整 (kerning)、間距 (tracking) 和 `aki` 屬性使用 **em 單位** (em 的千分之一，與字體大小成比例)。

### 座標系統

- 對於 **指令碼建立的文件**，原點 `(0,0)` 位於工作畫板的 **左下角**
- X 軸從左向右增加；Y 軸從下向上增加
- 頁面項目的 `position` 屬性是其邊界方框的 **左上角**，格式為 `[x, y]`
- 最大頁面項目寬度/高度：16348 點

### 圖稿項目邊界 (Art Item Bounds)

每個頁面項目都有三個邊界矩形：

- `geometricBounds`：不包含筆畫寬度 `[左, 上, 右, 下]`
- `visibleBounds`：包含筆畫寬度
- `controlBounds`：包含控制/方向點

## 使用文件

### 建立和開啟

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

### 儲存和匯出

```javascript
// 以 Illustrator 格式儲存
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

## 使用路徑和形狀

### 內建形狀方法

`pathItems` 集合提供了常見形狀的便利方法：

```javascript
var doc = app.activeDocument;
var layer = doc.activeLayer;

// 矩形：rectangle(上, 左, 寬, 高)
var rect = layer.pathItems.rectangle(500, 100, 200, 150);

// 圓角矩形：roundedRectangle(上, 左, 寬, 高, 水平半徑, 垂直半徑)
var rrect = layer.pathItems.roundedRectangle(500, 100, 200, 150, 20, 20);

// 橢圓：ellipse(上, 左, 寬, 高)
var oval = layer.pathItems.ellipse(400, 200, 100, 100);

// 多邊形：polygon(中心X, 中心Y, 半徑, 邊數)
var hex = layer.pathItems.polygon(300, 300, 50, 6);

// 星形：star(中心X, 中心Y, 半徑, 內半徑, 點數)
var star = layer.pathItems.star(300, 300, 50, 25, 5);
```

### 使用座標陣列的自由路徑

```javascript
var doc = app.activeDocument;
var path = doc.pathItems.add();
path.setEntirePath([[100, 100], [200, 200], [300, 100]]);
path.closed = false;
path.stroked = true;
path.strokeWidth = 2;
```

### 使用 PathPoint 物件的自由路徑

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

### 應用顏色

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

### 特別色和色票 (Spot Colors and Swatches)

```javascript
// 建立特別色
var spot = doc.spots.add();
spot.name = "My Spot Color";
spot.color = red; // 基礎顏色定義

var spotColor = new SpotColor();
spotColor.spot = spot;
spotColor.tint = 100;

item.fillColor = spotColor;

// 透過名稱存取色票
var swatch = doc.swatches.getByName("PANTONE 185 C");
item.fillColor = swatch.color;
```

## 使用文字

### 文字框類型

```javascript
var doc = app.activeDocument;

// 點文字
var pointText = doc.textFrames.add();
pointText.contents = "Hello World!";
pointText.position = [100, 500];

// 區域文字 (路徑內的文字)
var rectPath = doc.pathItems.rectangle(500, 100, 200, 100);
var areaText = doc.textFrames.areaText(rectPath);
areaText.contents = "Text inside a rectangle shape.";

// 路徑文字 (沿著路徑的文字)
var curvePath = doc.pathItems.add();
curvePath.setEntirePath([[50, 300], [150, 400], [250, 300]]);
var pathText = doc.textFrames.pathText(curvePath);
pathText.contents = "Text on a path";
```

### 字元和段落格式

```javascript
var tf = doc.textFrames[0];
var textRange = tf.textRange;

// 字元屬性
var charAttr = textRange.characterAttributes;
charAttr.size = 24;           // 字體大小 (點)
charAttr.textFont = app.textFonts.getByName("ArialMT");
charAttr.fillColor = red;
charAttr.tracking = 50;       // Em 單位
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

### 串連文字框

```javascript
var frame1 = doc.textFrames.areaText(path1);
var frame2 = doc.textFrames.areaText(path2);

// 連結文字框，使文字從 frame1 流向 frame2
frame1.nextFrame = frame2;

// Story 代表跨串連文字框的完整文字
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

// 在圖層之間移動項目
var item = doc.pathItems[0];
item.move(newLayer, ElementPlacement.PLACEATBEGINNING);

// 重新排列圖層
newLayer.zOrder(ZOrderMethod.SENDTOBACK);
```

## 使用選取範圍

```javascript
// 取得當前選取範圍
var sel = app.activeDocument.selection;

// 迭代選取的項目
for (var i = 0; i < sel.length; i++) {
    var item = sel[i];
    // 使用 typename 檢查類型
    if (item.typename === "PathItem") {
        item.fillColor = red;
    } else if (item.typename === "TextFrame") {
        item.contents = "Modified";
    }
}

// 以程式方式選取項目
doc.pathItems[0].selected = true;

// 取消選取全部
doc.selection = null;
```

## 使用符號

```javascript
// 放置符號實例
var sym = doc.symbols.getByName("MySymbol");
var instance = doc.symbolItems.add(sym);
instance.position = [200, 400];

// 存取符號定義
var symDef = instance.symbol;

// 斷開符號連結 (展開為一般圖稿)
instance.breakLink();
```

## 變形 (Transformations)

```javascript
var item = doc.pathItems[0];

// 以中心旋轉 45 度
item.rotate(45);

// 縮放至 50% 寬度，75% 高度
item.resize(50, 75);

// 平移 (移動) 向右 100 點，向上 50 點
item.translate(100, 50);

// 使用變形矩陣
var matrix = app.getIdentityMatrix();
matrix = app.concatenateRotationMatrix(matrix, 30);
matrix = app.concatenateScaleMatrix(matrix, 150, 150);
item.transform(matrix);
```

## 使用工作畫板

```javascript
var doc = app.activeDocument;

// 存取工作畫板
var ab = doc.artboards[0];
var rect = ab.artboardRect; // [左, 上, 右, 下]

// 建立新工作畫板
var newAB = doc.artboards.add([0, 0, 612, 792]); // Letter 尺寸
newAB.name = "Page 2";

// 設定活動工作畫板
doc.artboards.setActiveArtboardIndex(1);
```

## 資料驅動圖形 (變數和資料集)

```javascript
// 變數將文件項目連結到資料欄位
var v = doc.variables.add();
v.kind = VariableKind.TEXTUAL;
v.name = "headline";

// 將文字框連結到變數
var tf = doc.textFrames[0];
tf.contentVariable = v;

// 為批次內容建立資料集
var ds = doc.dataSets.add();
ds.name = "Version 1";
// 資料集擷取當前變數繫結

// 切換資料集以交換內容
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

// 工作選項
var jobOpts = new PrintJobOptions();
jobOpts.copies = 1;
jobOpts.designation = PrintArtworkDesignation.VISIBLELAYERS;
opts.jobOptions = jobOpts;

doc.print(opts);
```

## 使用者互動等級 (User Interaction Levels)

控制 Illustrator 在指令碼執行期間是否顯示對話框：

```javascript
// 隱藏所有對話框
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

// 執行可能提示對話框的操作...
doc.close(SaveOptions.DONOTSAVECHANGES);

// 恢復顯示對話框
app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
```

## 使用方法 (JavaScript 特有)

呼叫具有多個選用參數的方法時，使用 `undefined` 跳過中間參數：

```javascript
// rotate(角度, [changePositions], [changeFillPatterns], [changeFillGradients], ...)
item.rotate(30, undefined, undefined, true);
```

## 外部呼叫與引數傳遞 (External Invocation & Argument Passing)

Illustrator 指令碼通常從應用程式外部啟動 — 透過 Shell 指令碼、排程器、建置管線、ExtendScript Toolkit 或來自其他 Creative Cloud 應用程式的 `BridgeTalk` 訊息。這些啟動器下的執行環境與應用程式內的 *檔案 > 指令碼* 路徑有幾種不同之處，這些不同之處經常會導致原本正確的程式碼執行失敗。

### `arguments[]` 在外部啟動器下不可靠

ExtendScript Toolkit 的 `-run` 呼叫和 `BridgeTalk.send()` 不會將任意啟動器引數轉發到指令碼的頂層 `arguments[]` 陣列中。在許多設定中，該陣列包含一個 `[object BridgeTalk]` 元素，而不是呼叫者傳遞的值，如下所示：

```javascript
// 指令碼頂部
var passed = (typeof arguments !== "undefined") ? arguments : [];
for (var i = 0; i < passed.length; i++) {
    $.writeln("arg[" + i + "] = " + passed[i]);
    // 通常輸出：arg[0] = [object BridgeTalk]
}
```

**當指令碼從外部啟動時，不要依賴 `arguments[]` 來取得必要輸入。** 請使用以下更可靠的管道之一。

### 用於引數的附屬檔案 (Sidecar File)

當指令碼在外部啟動器下失敗且錯誤來源不明顯時，請改用附屬檔案：讓呼叫者在已知的絕對路徑寫入一個小的文字檔，並在啟動時讀取它。無論啟動器有何怪癖，這都有效，並且在執行失敗後很容易檢查。

```javascript
var SIDECAR_PATH = "C:/Users/userName/job.args.txt";

function readSidecar(path) {
    var f = new File(path);
    if (!f.exists || !f.open("r")) return null;
    var lines = [];
    while (!f.eof) {
        var ln = f.readln();
        if (ln && !/^\s*$/.test(ln)) lines.push(ln);
    }
    f.close();
    return {
        input:  lines[0],
        output: lines[1],
        mode:   lines[2]
    };
}
```

`key=value` 格式同樣可行，並避免位置脆弱性：

```text
input=C:/path/to/input.ai
output=C:/path/to/output.pdf
mode=preview
```

### 環境變數

`$.getenv("NAME")` 傳回對 **Illustrator 進程** 可見的環境變數，而不是啟動器的環境變數。如果啟動器需要讓 Illustrator 看到一個值，它必須在系統範圍內或在 Illustrator 的父環境中設定變數，然後再啟動 Illustrator。對於每次呼叫的值，請偏好使用附屬檔案。

### `$.fileName` 和 `File($.fileName).parent`

在應用程式內執行時，`$.fileName` 是執行中指令碼的絕對路徑，`File($.fileName).parent` 產生指令碼的資料夾。在某些外部啟動器下 (特別是 ESTK `-run`)，`$.fileName` 可能為空，導致相對路徑解析靜默失敗。

```javascript
// 脆弱：在某些啟動器下傳回 null
var here = $.fileName ? File($.fileName).parent : null;
var sidecar = here ? new File(here.fsName + "/job.args.txt") : null;

// 強健：硬編碼已知的絕對路徑或回退到穩定的位置
var sidecar = new File("C:/Users/userName/job.args.txt");
if (!sidecar.exists) sidecar = new File(Folder.temp.fsName + "/job.args.txt");
```

### 診斷記錄到絕對路徑

靜默失敗很常見，因為對話框被隱藏，且啟動器可能不會顯示 `$.writeln` 輸出。將純文字記錄寫入已知的絕對路徑，以便執行後可以檢查。按需建立父資料夾，以免第一次呼叫因為遺失目錄而失敗。

```javascript
var LOG_PATH = "C:/Users/userName/logs/job.log";

function log(msg) {
    try {
        var f = new File(LOG_PATH);
        try { if (!f.parent.exists) f.parent.create(); } catch (eDir) {}
        if (f.open("a")) {
            f.writeln("[" + new Date() + "] " + msg);
            f.close();
        }
    } catch (e) {}
}
```

### 將進入點包裝在 `try { ... } catch` 中

外部啟動的指令碼經常在沒有任何可見跡象的情況下失敗。一個將錯誤寫入記錄檔的頂層 `try`/`catch` 將靜默失敗轉換為單一行可檢查的記錄。

```javascript
try {
    main();
} catch (err) {
    log("FATAL: " + err + (err && err.line ? " line=" + err.line : ""));
}
```

### 隱藏使用者互動

外部呼叫者無法回答對話框。在執行任何 DOM 操作之前禁用它們，並在可能以無頭 (headless) 方式啟動的指令碼中完全避免使用 `alert()` / `confirm()` / `prompt()`。

```javascript
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
```

### 明確儲存

關閉文件或讓 Illustrator 返回閒置狀態不會儲存工作檔案。在完成所有 DOM 編輯後，明確呼叫 `doc.saveAs(...)` (或 `doc.save()`) 並記錄其是否成功。

```javascript
var opts = new IllustratorSaveOptions();
opts.compatibility = Compatibility.ILLUSTRATOR17;
doc.saveAs(new File(doc.fullName.fsName), opts);
```

## 常見模式 (Common Patterns)

### 迭代文件中的所有頁面項目

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

### 在編輯前遞迴解鎖圖層和群組

鎖定的圖層或任何鎖定的祖先 (父群組、剪裁群組、子圖層) 將導致編輯時丟擲 `Error: Target layer cannot be modified`。在執行 DOM 修改之前，遍歷整個階層並清除 `locked` / `hidden` 旗標。

```javascript
function unlockAll(doc) {
    function visitLayers(layers) {
        for (var i = 0; i < layers.length; i++) {
            var lyr = layers[i];
            try { lyr.locked = false; lyr.visible = true; } catch (e) {}
            visitItems(lyr);
            if (lyr.layers && lyr.layers.length) visitLayers(lyr.layers);
        }
    }
    function visitItems(container) {
        var items = container.pageItems;
        for (var j = 0; j < items.length; j++) {
            var it = items[j];
            try { it.locked = false; it.hidden = false; } catch (e) {}
            if (it.typename === "GroupItem") visitItems(it);
        }
    }
    visitLayers(doc.layers);
}
```

### 替換連結影像背後的檔案 (重新連結)

`PlacedItem.file = newFile` 會替換連結的影像，同時保留父級、堆疊順序和 (重新應用後) 邊界。**`RasterItem` 不會公開可寫入的 `file` 屬性**，因此當佔位符是點陣圖時，您必須在同一個父級中新增一個新的 `PlacedItem`，複製邊界，然後移除原始項目。

```javascript
function relinkOrRebuild(item, newFile) {
    var bounds = item.geometricBounds.slice();
    var parent = item.parent;
    var name   = item.name;

    if (item.typename === "PlacedItem") {
        item.file = newFile;
        item.geometricBounds = bounds;
        return item;
    }

    // RasterItem 路徑：作為連結的 PlacedItem 在同一父級中重建。
    var fresh = parent.placedItems.add();
    fresh.file = newFile;
    fresh.geometricBounds = bounds;
    if (name) try { fresh.name = name; } catch (e) {}
    fresh.move(item, ElementPlacement.PLACEBEFORE);
    item.remove();
    return fresh;
}
```

### 放置 SVG 內容 (複製/貼上模式)

`PlacedItem.file` 接受點陣圖格式和 AI/PDF，**但不接受 SVG**。將其設定為 `.svg` 檔案會丟擲 `Unable to set placed item's file, is the file path provided valid?`。將 SVG 圖稿引入文件的可靠方法是將 SVG 作為獨立文件開啟，全選，複製，關閉，然後貼上到工作文件中。

```javascript
function placeSVG(targetDoc, svgFile, targetLayer) {
    var donor = app.open(svgFile);
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("copy");
    donor.close(SaveOptions.DONOTSAVECHANGES);

    app.activeDocument = targetDoc;
    targetDoc.activeLayer = targetLayer;
    app.executeMenuCommand("pasteFront");

    var sel = targetDoc.selection;
    if (!sel || sel.length === 0) return null;
    if (sel.length === 1) return sel[0];

    // 多個貼上的項目：將它們分組，以便呼叫者獲得單一控制代碼。
    var group = targetLayer.groupItems.add();
    for (var i = sel.length - 1; i >= 0; i--) {
        sel[i].move(group, ElementPlacement.PLACEATBEGINNING);
    }
    return group;
}
```

### 在遮色片群組中尋找剪裁路徑

剪裁群組會將其剪裁形狀暴露為子 `PathItem` (或較少見的 `CompoundPathItem` 的子項)，且 `clipping === true`。剪裁的 `geometricBounds` 提供了可見框架，用於調整內容大小或居中對齊。

```javascript
function findClipPath(group) {
    var items = group.pageItems;
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        try {
            if (it.typename === "PathItem" && it.clipping) return it;
            if (it.typename === "CompoundPathItem") {
                for (var j = 0; j < it.pathItems.length; j++) {
                    if (it.pathItems[j].clipping) return it;
                }
            }
        } catch (e) {}
    }
    return null;
}
```

### 覆蓋填滿 (Cover-Fit) 和包含填滿 (Contain-Fit) 縮放

要使影像完全覆蓋矩形 (任何溢位都被遮色片隱藏)，請使用寬度/高度比例較大的一個。要使影像完全包含在內，請使用較小的一個。出血因子 (例如 `1.10`) 讓覆蓋影像稍微延伸到剪裁邊緣之外。

```javascript
function fitItemToRect(item, rect, mode, bleed) {
    // rect = [左, 上, 右, 下] (Illustrator: 上 > 下)
    var rw = rect[2] - rect[0];
    var rh = rect[1] - rect[3];
    var ib = item.geometricBounds;
    var iw = ib[2] - ib[0];
    var ih = ib[1] - ib[3];
    if (iw <= 0 || ih <= 0) return;

    var sx = rw / iw;
    var sy = rh / ih;
    var s  = (mode === "cover" ? Math.max(sx, sy) : Math.min(sx, sy))
           * (bleed || 1);
    item.resize(s * 100, s * 100);

    var cx = (rect[0] + rect[2]) / 2;
    var cy = (rect[1] + rect[3]) / 2;
    var b  = item.geometricBounds;
    var w  = b[2] - b[0];
    var h  = b[1] - b[3];
    item.position = [cx - w / 2, cy + h / 2];
}
```

### 批次處理資料夾中的檔案

```javascript
var folder = Folder.selectDialog("Select folder of .ai files");
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
    alert("Error: " + e.message);
    // e.message, e.line, e.fileName 可用
}
```

## 故障排除 (Troubleshooting)

- **"undefined is not an object"**：通常表示集合為空或索引超出範圍。存取項目之前請檢查 `.length`。
- **指令碼執行但視覺上沒有變化**：修改後呼叫 `app.redraw()` 強制重新整理畫面。
- **顏色模式不符**：文件色彩空間 (RGB 與 CMYK) 必須與顏色物件相符。使用 `doc.documentColorSpace` 進行檢查。
- **位置似乎錯誤**：請記住指令碼文件使用左下角原點，Y 軸向上增加。`position` 屬性是邊界方框的左上角。
- **文字未顯示**：確保文字框具有非零大小。對於點文字，請設定 `position`；對於區域文字，請提供有效的路徑給 `areaText()`。
- **Windows 上的檔案路徑**：在路徑字串中使用正斜線 (`/`) 或雙反斜線 (`\\`)，或使用 `File` 物件建構子。
- **對話框中斷批次指令碼**：在批次操作前設定 `app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS`。
- **集合使用 `getByName()`**：許多集合物件支援 `getByName("name")`，如果找不到則丟擲錯誤；請使用 try/catch 包裝。
- **"Target layer cannot be modified"**：鎖定的圖層、子圖層或父群組 (通常是像 `Cover_Mask` 這樣的剪裁群組) 正在阻止編輯。修改前請在整個文件中遞迴清除 `locked` 和 `hidden`。請參閱 [在編輯前遞迴解鎖圖層和群組](#recursively-unlock-layers-and-groups-before-editing)。
- **"Unable to set placed item's file, is the file path provided valid?"**：檔案存在且路徑正確，但 `PlacedItem.file` 不接受此格式。SVG 是最常見的原因 — 請改用 [開啟 / 複製 / 貼上模式](#placing-svg-content-copypaste-pattern)。
- **`RasterItem.file = newFile` 沒有作用或丟擲錯誤**：`RasterItem` 不會公開可寫入的 `file` 屬性。在同一父級中新增一個新的 `PlacedItem`，恢復邊界和名稱，然後 `.remove()` 點陣圖。
- **`arguments[0]` 是 `[object BridgeTalk]`** (或為空)：指令碼透過 ESTK `-run` 或 `BridgeTalk` 訊息啟動；位置引數未轉發。請使用已知絕對路徑的附屬檔案。請參閱 [外部呼叫與引數傳遞](#external-invocation--argument-passing)。
- **`$.fileName` 為空**：同樣是外部啟動器的原因。在可能以無頭方式呼叫的指令碼中，不要從 `$.fileName` 衍生資源路徑 — 請使用絕對路徑或 `Folder.temp`。
- **指令碼似乎沒有作用**：幾乎總是鎖定的祖先、隱藏的對話框吞噬了錯誤，或者編輯後缺少明確的 `saveAs`。新增一個將記錄寫入絕對路徑的頂層 `try`/`catch` 以確認執行並擷取錯誤。
- **`item.resize(sx, sy)` 意外地重新居中圖稿**：`resize` 預設圍繞項目的中心 (`Transformation.CENTER`) 縮放。傳遞明確的 `scaleAbout` 引數或隨後使用 `translate(dx, dy)` 來重新定位。

## 指令碼常數參考 (Scripting Constants Reference)

API 中使用的常見列舉常數：

| 類別 | 常數 |
|---|---|
| **色彩空間 (Color Space)** | `DocumentColorSpace.RGB`, `DocumentColorSpace.CMYK` |
| **對齊 (Justification)** | `Justification.LEFT`, `Justification.CENTER`, `Justification.RIGHT`, `Justification.FULLJUSTIFY` |
| **點類型 (Point Type)** | `PointType.SMOOTH`, `PointType.CORNER` |
| **筆畫線端 (Stroke Cap)** | `StrokeCap.BUTTENDCAP`, `StrokeCap.ROUNDENDCAP`, `StrokeCap.PROJECTINGENDCAP` |
| **筆畫轉角 (Stroke Join)** | `StrokeJoin.MITERENDJOIN`, `StrokeJoin.ROUNDENDJOIN`, `StrokeJoin.BEVELENDJOIN` |
| **混合模式 (Blend Mode)** | `BlendModes.NORMAL`, `BlendModes.MULTIPLY`, `BlendModes.SCREEN`, `BlendModes.OVERLAY` |
| **儲存選項 (Save Options)** | `SaveOptions.SAVECHANGES`, `SaveOptions.DONOTSAVECHANGES`, `SaveOptions.PROMPTTOSAVECHANGES` |
| **匯出類型 (Export Type)** | `ExportType.PNG24`, `ExportType.PNG8`, `ExportType.JPEG`, `ExportType.SVG`, `ExportType.TIFF`, `ExportType.PHOTOSHOP`, `ExportType.AUTOCAD`, `ExportType.FLASH` |
| **項目放置 (Element Placement)** | `ElementPlacement.PLACEATBEGINNING`, `ElementPlacement.PLACEATEND`, `ElementPlacement.PLACEBEFORE`, `ElementPlacement.PLACEAFTER`, `ElementPlacement.INSIDE` |
| **Z-Order** | `ZOrderMethod.BRINGTOFRONT`, `ZOrderMethod.SENDTOBACK`, `ZOrderMethod.BRINGFORWARD`, `ZOrderMethod.SENDBACKWARD` |
| **漸層類型 (Gradient Type)** | `GradientType.LINEAR`, `GradientType.RADIAL` |
| **文字框種類 (Text Frame Kind)** | `TextType.POINTTEXT`, `TextType.AREATEXT`, `TextType.PATHTEXT` |
| **變數種類 (Variable Kind)** | `VariableKind.TEXTUAL`, `VariableKind.IMAGE`, `VariableKind.VISIBILITY`, `VariableKind.GRAPH` |
| **使用者互動 (User Interaction)** | `UserInteractionLevel.DISPLAYALERTS`, `UserInteractionLevel.DONTDISPLAYALERTS` |
| **相容性 (Compatibility)** | `Compatibility.ILLUSTRATOR10` 到 `Compatibility.ILLUSTRATOR24` |

## JavaScript 物件參考 (完整 API 物件清單)

Illustrator JavaScript API 包含以下按類別分組的物件：

### 核心物件

`Application`, `Document`, `Documents`, `DocumentPreset`, `Layer`, `Layers`, `PageItem`, `PageItems`, `View`, `Views`, `Preferences`

### 路徑和形狀物件

`PathItem`, `PathItems`, `PathPoint`, `PathPoints`, `CompoundPathItem`, `CompoundPathItems`, `GroupItem`, `GroupItems`

### 文字物件

`TextFrame`, `TextRange`, `TextRanges`, `TextPath`, `Characters`, `Words`, `Paragraphs`, `Lines`, `InsertionPoint`, `InsertionPoints`, `Story`, `Stories`, `CharacterAttributes`, `ParagraphAttributes`, `CharacterStyle`, `CharacterStyles`, `ParagraphStyle`, `ParagraphStyles`, `TextFont`, `TextFonts`, `TabStopInfo`

### 顏色物件

`RGBColor`, `CMYKColor`, `GrayColor`, `LabColor`, `NoColor`, `SpotColor`, `Spot`, `Spots`, `PatternColor`, `GradientColor`, `Color`, `Gradient`, `Gradients`, `GradientStop`, `GradientStops`

### 色票和樣式物件

`Swatch`, `Swatches`, `SwatchGroup`, `SwatchGroups`, `GraphicStyle`, `GraphicStyles`, `Pattern`, `Patterns`, `Brush`, `Brushes`

### 符號物件

`Symbol`, `Symbols`, `SymbolItem`, `SymbolItems`

### 工作畫板物件

`Artboard`, `Artboards`

### 放置和點陣圖物件

`PlacedItem`, `PlacedItems`, `RasterItem`, `RasterItems`, `MeshItem`, `MeshItems`, `GraphItem`, `GraphItems`, `PluginItem`, `PluginItems`, `NonNativeItem`, `NonNativeItems`, `LegacyTextItem`, `LegacyTextItems`

### 資料驅動物件

`Variable`, `Variables`, `Dataset`, `Datasets`

### 矩陣和變形物件

`Matrix`

### 標籤物件

`Tag`, `Tags`

### 影像描圖物件

`TracingObject`, `TracingOptions`

### 儲存和匯出選項

`IllustratorSaveOptions`, `EPSSaveOptions`, `PDFSaveOptions`, `FXGSaveOptions`, `ExportOptionsAutoCAD`, `ExportOptionsFlash`, `ExportOptionsGIF`, `ExportOptionsJPEG`, `ExportOptionsPhotoshop`, `ExportOptionsPNG8`, `ExportOptionsPNG24`, `ExportOptionsSVG`, `ExportOptionsTIFF`

### 開啟選項

`OpenOptions`, `OpenOptionsAutoCAD`, `OpenOptionsFreeHand`, `OpenOptionsPhotoshop`, `PDFFileOptions`, `PhotoshopFileOptions`

### 列印物件

`PrintOptions`, `PrintJobOptions`, `PrintPaperOptions`, `PrintColorManagementOptions`, `PrintColorSeparationOptions`, `PrintCoordinateOptions`, `PrintFlattenerOptions`, `PrintFontOptions`, `PrintPageMarksOptions`, `PrintPostScriptOptions`, `Printer`, `PrinterInfo`, `Paper`, `PaperInfo`, `PPDFile`, `PPDFileInfo`, `Ink`, `InkInfo`, `Screen`, `ScreenInfo`, `ScreenSpotFunction`

### 影像和點陣化選項

`ImageCaptureOptions`, `RasterEffectOptions`, `RasterizeOptions`

## 參考資料 (References)

- [變更記錄 (Changelog)](https://ai-scripting.docsforadobe.dev/introduction/changelog/) - 最近的指令碼 API 變更 (CC 2020 新增 `Document.getPageItemFromUuid` 和 `PageItem.uuid`；CC 2017 新增 `Application.getIsFileOpen`)
- [Illustrator 指令碼指南](https://ai-scripting.docsforadobe.dev/) - 社群維護的完整說明文件
