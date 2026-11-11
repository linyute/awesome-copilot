# Globestudio 設定參考 (Globestudio config reference)

由 scripts/generate-skill-references.js 從 public/schema/config.json、src/config/*.js、src/data/look-presets.js、src/data/geography.js、src/data/us-state-codes.js 與 src/utils/embed-snippets.js 自動產生。在此手動編輯的內容在下次產生時將會遺失。

應用程式從設定中保留的每個鍵值及其接受的值。https://globestudio.app/schema/config.json 上的結構描述具有相同的定義，且測試確保其與每個連結、嵌入與匯入所經過的剖析器 (src/utils/share-config.js 中的 normalizeConfig) 保持一致。剖析器會無訊息地丟棄任何其他鍵值，並將數值限制在其範圍內。

## 目錄

- 解讀設定：連結、版本與部分設定
- 最上層鍵值
- shaderSettings，以及各效果所讀取的調整參數
- globeSettings、spaceSettings 與 flowSettings
- 漸層 (Gradients)
- 自訂形狀 (Custom shapes)
- 形狀 (Shapes)
- 區域：大洲、次區域、地圖無法繪製的國家、美國各州
- 限制條件

## 解讀設定

- 連結將設定承載為 `?c=` 加上 `encodeURIComponent(JSON.stringify(config))`。JSON 中的 `"v": 3` 標示該設定已編碼一次且其色彩會如實以其十六進位呈現。若為 `"v": 2` 或較舊未帶此欄位的連結，色彩的呈現會比其十六進位更暗（歷史相容行為）。應用程式為挑選過色彩的設計寫入 3，其餘寫入 2。
- 在 `/looks/<id>` 與 `/embed?look=<id>` 上，外觀風格優先套用，設定僅變更其具體命名的鍵值。在 `shaderSettings`、`globeSettings`、`spaceSettings` 與 `flowSettings` 中，設定省略的鍵值會保留該外觀風格的數值。
- 在工作室中，外觀風格僅設定其樣式：區域、資料點以及外觀未設定的任何其他鍵值會保留使用者上次在該處使用的設定，且檢視會以地球儀開啟。在未指定外觀風格的 `/` 上，設定省略的每個最上層鍵值皆是如此，且四個巢狀物件會以下方的應用程式預設值填補空缺。
- 嵌入網址會如同工作室一樣繪製外觀風格，包含其密度、點大小、背景與透明度，且網址參數與設定會覆寫其命名的項目。網址或設定中的 `background` 色彩會使原本透明的外觀風格 (Wireframe) 呈現實心背景。在未指定外觀風格時，嵌入會繪製 Default：密度 40、點大小 10，呈現接近全黑的背景，除非網址或設定指定了背景。
- 在匯出對話方塊「Share」標籤頁中匯入的檔案不含外觀風格，因此四個巢狀物件會以應用程式預設值填補空缺：檔案必須容納完整設計，如同工作室自身的匯出檔案。
- `version`：由應用程式寫入每個匯出的檔案與分享連結中，標示該設定代表完整設計：在 shaderSettings、globeSettings、spaceSettings 與 flowSettings 中，設定省略的鍵值會取得應用程式預設值，即使在外觀風格上亦然。在僅變更外觀風格部分設定的設定中請省略此項目。2 亦表示點、地圖、格線、網絡、標記與流動色彩皆如實以其十六進位呈現：應用程式在選取色彩後會寫入 2，而對色彩呈現比十六進位更暗的設計寫入 1（與過去的行為一致）。
- 預設外觀 (Default look) 是 Default 外觀風格所設定的值（若有設定）。應用程式預設值 (App default) 是巢狀物件在沒有外觀風格時退回的值。

## 最上層鍵值

| 鍵值 | 接受的值 | 預設外觀 | 說明 |
|---|---|---|---|
| `selection` | 文字，例如 `world`、`country:USA`、`continent:Europe`、`subregion:Western Europe` | `"world"` | 地圖顯示的內容：`world`、`country:` 加上大寫 ISO 3166-1 alpha-3 代碼、`continent:` 加上大洲名稱，或 `subregion:` 加上次區域名稱。小寫代碼會被丟棄，應用程式不認識的名稱會顯示全世界。 |
| `stateSelection` | `all`、郵遞區號或 FIPS 代碼（參見美國各州） | `"all"` | 當 selection 為 `country:USA` 時，要顯示的州、華盛頓特區或領地，以其郵遞區號 (`CA`) 或 2 位數 FIPS 代碼 (`06`) 表示，或以 `all` 代表整個國家。應用程式會儲存 FIPS 代碼（us-atlas 給予該州的識別碼）。其他數值皆會被丟棄。工作室與嵌入皆會繪製該州。 |
| `background` | 十六進位色彩 | `"#0a0a0a"` | 畫布色彩，以十六進位表示（`#` 為選用）。 |
| `transparent` | true 或 false | `false` | 代替 `background` 的透明背景。 |
| `backgroundStyle` | `solid`, `space`, `flow`, `transparent` | `"solid"` | `solid` 繪製純色；`space` 繪製星空與星雲場景；`flow` 繪製動態漸層網格著色器；`transparent` 不繪製任何內容且隱含 `transparent: true`。 |
| `density` | 1 至 100 | `40` | 可見區域內的點密度。 |
| `dotSize` | 0.1 至 30 | `10` | 點半徑。 |
| `dotColor` | 十六進位色彩 | `"#ffffff"` | 點色彩，以十六進位表示。 |
| `dotColorAlpha` | 0 至 1 |  | 點不透明度。 |
| `dotGradient` | 漸層或 null（參見漸層） |  | 點漸層，用於代替 `dotColor`。 |
| `dotsVisible` | true 或 false | `true` |  |
| `shape` | `Circle`, `Hexagon`, `Triangle`, `Pentagon`, `Square`, `Voxel`, `Particle Grid`, `Diamond`, `Star`, `Plus`, `Ring`, `ASCII`, `Custom` | `"Circle"` | 點形狀。`ASCII` 繪製 `asciiSymbol`，`Custom` 繪製 `customShape`。 |
| `dotRotation` | 0 至 360 |  | 每個點的旋轉角度（度）。工作室會讀取此設定；嵌入網址繪製的點皆未旋轉。 |
| `shapeRotationSpeed` | 0 至 100 |  | 形狀旋轉速度，0 至 100（0 停止動畫）。 |
| `sizeVary` | true 或 false |  | 加入個別點的尺寸抖動效果。 |
| `asciiSymbol` | 文字，最多 12 個字元 | `"*"` | 當 `shape` 為 `ASCII` 時繪製為點的文字。超出長度的文字會被截斷為 12 個字元。 |
| `customShape` | 物件或 null（參見自訂形狀） |  | 當 `shape` 為 `Custom` 時繪製為點的影像，或為 null。SVG 在使用前會清除指令碼與事件處理常式。檔案隨連結傳遞，因此超過幾十 kB 的檔案將無法放入必須保持在 32,000 個字元以內的嵌入網址。 |
| `renderMode` | `dots`, `solid` | `"dots"` | `dots` 將陸地繪製為點陣，`solid` 繪製為實心填滿形狀。 |
| `worldFill` | 十六進位色彩 | `"#5a5a64"` | 實心地圖中的陸地填滿色彩，以十六進位表示。 |
| `worldFillAlpha` | 0 至 1 |  |  |
| `worldFillGradient` | 漸層或 null（參見漸層） |  | 陸地填滿漸層，用於代替 `worldFill`。 |
| `worldFillVisible` | true 或 false |  |  |
| `worldStroke` | 十六進位色彩 | `"#f6f2ea"` | 實心地圖中的外框線色彩，以十六進位表示。 |
| `worldStrokeAlpha` | 0 至 1 |  |  |
| `worldStrokeGradient` | 漸層或 null（參見漸層） |  | 外框線漸層，用於代替 `worldStroke`。 |
| `worldStrokeVisible` | true 或 false |  |  |
| `worldStrokeWidth` | 0 至 10 |  |  |
| `mapDepth` | 0 至 100 | `55` | 3D 地圖檢視的 FOV 式深度。 |
| `tiltX` | -180 至 180 | `0` |  |
| `tiltY` | -180 至 180 | `0` |  |
| `animationsEnabled` | true 或 false |  | false 會使設計保持靜止。 |
| `viewMode` | `globe`, `flat` |  | 3D 地球儀或平面地圖。 |
| `viewSwitch` | true 或 false |  | 僅限嵌入：true 會在角落顯示 Globe 與 Map 切換鈕，訪客可將地球儀切換為平面地圖或切換回來。工作室有自己的切換器並會忽略此設定。 |
| `flatProjection` | `mercator`, `equalEarth`, `naturalEarth1`, `winkel3`, `robinson` |  | 平面地圖檢視的投影法。適用於實心地圖 (renderMode 為 "solid")；點陣地圖一律使用麥卡托投影。 |
| `riversVisible` | true 或 false |  |  |
| `citiesVisible` | true 或 false |  |  |
| `citiesMinPop` | 0 至 50,000,000 |  | 僅顯示人口至少達到此數值的城市。 |

## shaderSettings

著色器傳遞階段。`effect` 挑選效果；其他鍵值為微調參數，各效果僅讀取其中部分參數。

| 鍵值 | 接受的值 | 應用程式預設值 | 說明 |
|---|---|---|---|
| `effect` | `none`, `bloom`, `chromatic`, `crt`, `halftone`, `pixel`, `threshold`, `glitch`, `edge`, `wave`, `metal`, `pencil`, `toon`, `stripes`, `badtv`, `rgb`, `chroma`, `corrupt`, `bayer`, `iridescent`, `risograph`, `newsprint`, `aurora`, `atkinson`, `ascii` | `"none"` |  |
| `intensity` | 0 至 100 | `45` |  |
| `split` | 0 至 100 | `7` |  |
| `grain` | 0 至 100 | `8` |  |
| `scanlines` | 0 至 100 | `36` |  |
| `cellSize` | 0 至 30 | `14` |  |
| `threshold` | 0 至 100 | `50` |  |
| `warp` | 0 至 100 | `24` |  |
| `motion` | 0 至 100 | `35` |  |

### 各效果所讀取的參數

每個效果都會讀取 intensity 與 grain；其他參數僅在有列出時讀取。`none` 不繪製著色器傳遞階段。點色彩說明該效果對 `dotColor` 與 `dotGradient` 的處理方式。

| 效果 | 標籤 | 參數 | 點色彩 |
|---|---|---|---|
| `none` | None |  | kept (保留) |
| `bloom` | Bloom | intensity, split, warp, motion, grain | kept (保留) |
| `chromatic` | Chromatic | intensity, split, warp, motion, grain | kept (保留) |
| `crt` | CRT | intensity, split, cellSize, scanlines, warp, motion, grain | kept (保留) |
| `halftone` | Halftone | intensity, cellSize, scanlines, motion, grain | ignored：白色墨水，在 `theme=light` 下為石墨色 |
| `pixel` | Pixel | intensity, cellSize, scanlines, grain | kept (保留) |
| `threshold` | Threshold | intensity, threshold, warp, motion, grain | ignored：白色墨水，在 `theme=light` 下為石墨色 |
| `glitch` | Glitch | intensity, split, scanlines, motion, grain | kept (保留) |
| `edge` | Edge | intensity, threshold, grain | ignored：白色墨水，在 `theme=light` 下為石墨色 |
| `wave` | Wave | intensity, split, warp, motion, grain | kept (保留) |
| `metal` | Metal | intensity, motion, grain | ignored：鉻金屬 |
| `pencil` | Pencil | intensity, grain | ignored：紙上石墨 |
| `toon` | Toon | intensity, grain | ignored：白色墨水，在 `theme=light` 下為石墨色 |
| `stripes` | Stripes | intensity, cellSize, motion, grain | kept (保留) |
| `badtv` | Bad TV | intensity, motion, grain | kept (保留) |
| `rgb` | RGB | intensity, motion, grain | kept (保留) |
| `chroma` | Chroma | intensity, motion, grain | kept (保留) |
| `corrupt` | Corrupt | intensity, cellSize, motion, grain | changed：貼齊至純 RGB 色彩 |
| `bayer` | Bayer dither | intensity, cellSize, grain | kept (保留) |
| `iridescent` | Iridescent | intensity, cellSize, motion, grain | changed：淺色變為流轉的金屬箔色調 |
| `risograph` | Risograph | intensity, split, cellSize, grain | changed：淺色變為粉紅與青色墨水 |
| `newsprint` | Newsprint | intensity, cellSize, grain | ignored：白紙上的 CMYK 印刷 |
| `aurora` | Aurora | intensity, cellSize, motion, grain | changed：覆蓋綠色、青色與洋紅色光帶 |
| `atkinson` | Atkinson dither | intensity, cellSize, grain | kept (保留) |
| `ascii` | ASCII | intensity, cellSize, grain | ignored：白色墨水，在 `theme=light` 下為石墨色 |

## globeSettings

3D 地球儀裝飾元件：自動旋轉、光暈光環、格線網格、網絡弧線、資料標記。

| 鍵值 | 接受的值 | 應用程式預設值 | 說明 |
|---|---|---|---|
| `look` | `classic`, `borderless` | `"classic"` |  |
| `autoSpin` | true 或 false | `true` | 舊版欄位。目前的控制項目為 `autoSpinSpeed` (0 至 100，其中 0 停止旋轉)；匯入時若此值為 `false`，autoSpinSpeed 會被強制設為 0。 |
| `autoSpinSpeed` | 0 至 100 | `35` | 地球儀自動旋轉速度，0 至 100（0 停止旋轉）。 |
| `dotLift` | 0 至 100 | `15` | 點懸浮於球體上方的距離。 |
| `glow` | true 或 false | `true` |  |
| `glowStrength` | 0 至 100 | `58` |  |
| `glowSpread` | 0 至 100 | `50` |  |
| `glowColor` | 十六進位色彩或 null | `null` | 光暈光環的十六進位色彩。null 會依據外觀風格與點色彩自動挑選。 |
| `grid` | true 或 false | `true` |  |
| `gridColor` | 十六進位色彩 | `"#ffffff"` | 所有格線的純色著色，除非有設定 gridGradient。 |
| `gridGradient` | 漸層或 null（參見漸層） | `null` | 格線的漸層，依緯度變化（南 → 北）。 |
| `gridLift` | 0 至 100 | `1` | 格線懸浮於球體上方的距離。 |
| `gridSize` | 5 至 90 | `30` | 格線之間的度數間距。 |
| `gridStrength` | 0 至 100 | `45` |  |
| `network` | true 或 false | `true` | 城市脈衝 + 大圓航線弧線。 |
| `networkStrength` | 0 至 100 | `70` |  |
| `networkArcs` | 0 至 100，或 true 或 false | `60` | 弧線密度，0 至 100，或舊版布林值 (true = 預設密度，false = 隱藏)。 |
| `networkPulses` | 0 至 100，或 true 或 false | `50` | 脈衝密度，0 至 100，或舊版布林值 (true = 預設密度，false = 隱藏)。 |
| `arcColor` | 十六進位色彩或 null | `null` | 十六進位字串。所有網絡弧線/軌跡/前端的統一色調。null 會退回每條航線硬式編碼的多色模式。 |
| `pulseColor` | 十六進位色彩或 null | `null` | 十六進位字串。所有城市脈衝核心 + 環的統一色調。null 會退回每個樞紐硬式編碼的多色模式。 |
| `networkMono` | true 或 false | `true` | 已棄用。曾用於網絡轉譯的多色/單色切換。已被忽略。請改用 arcColor / pulseColor。 |
| `routes` | true 或 false | `true` | 航線，僅在 borderless 外觀風格下繪製。 |
| `routesStrength` | 0 至 100 | `82` |  |
| `surface` | true 或 false | `true` |  |
| `surfaceStrength` | 0 至 100 | `30` |  |
| `surfaceColor` | 十六進位色彩 | `"#18191d"` | 球體填滿的純色著色，除非有設定 surfaceGradient。 |
| `surfaceGradient` | 漸層或 null（參見漸層） | `null` | 球體填滿的漸層，依緯度變化（南 → 北）。 |
| `data` | true 或 false | `true` | 顯示貼上的資料標記及其弧線。false 會隱藏它們但保留 dataPoints。 |
| `dataPoints` | 包含 {lat, lng, value} 的陣列，最多 250 個 | `[]` | 資料標記，每個資料點一個，大小由 value 決定。Data 貼上框會寫入此內容。缺少或超出範圍的 lat 或 lng 之資料點會被丟棄，且僅保留前 250 個有效資料點。 |
| `dataArcs` | true 或 false | `false` | 從每個資料點依清單順序繪製弧線至下一個點。需要至少 2 個資料點；弧線僅在地球儀檢視中顯示。 |
| `dataMarkerColor` | 十六進位色彩或 null | `null` | 資料標記及其弧線的十六進位色彩。null 會使用預設的青色 (#7edfff)。 |

## spaceSettings

星空 + 星雲微調。當 backgroundStyle 為 `space` 時套用。

| 鍵值 | 接受的值 | 應用程式預設值 | 說明 |
|---|---|---|---|
| `density` | 0 至 100 | `65` |  |
| `motion` | 0 至 100 | `35` |  |
| `nebula` | 0 至 100 | `55` |  |
| `hue` | 0 至 360 | `0` |  |
| `brightness` | 0 至 200 | `100` |  |

## flowSettings

動態漸層網格微調。當 backgroundStyle 為 `flow` 時套用。

| 鍵值 | 接受的值 | 應用程式預設值 | 說明 |
|---|---|---|---|
| `colorA` | 十六進位色彩 | `"#635bff"` |  |
| `colorB` | 十六進位色彩 | `"#00d4ff"` |  |
| `colorC` | 十六進位色彩 | `"#ff5c93"` |  |
| `motion` | 0 至 100 | `32` |  |
| `turbulence` | 0 至 100 | `64` |  |
| `grain` | 0 至 100 | `14` |  |
| `scale` | 0 至 100 | `52` |  |
| `brightness` | 0 至 200 | `104` |  |

## 漸層 (Gradients)

雙色線性漸層，或為 null 代表無漸層。若不同時具備 `from` 與 `to` 則會被丟棄。`dotGradient`、`worldFillGradient`、`worldStrokeGradient`、`globeSettings.gridGradient` 與 `globeSettings.surfaceGradient` 皆接受此結構。

| 鍵值 | 接受的值 | 說明 |
|---|---|---|
| `from` | 十六進位色彩 | 起始色彩，以十六進位表示。 |
| `to` | 十六進位色彩 | 結束色彩，以十六進位表示。 |
| `angle` | 0 至 360 | 方向角度（度）。 |
| `fromAlpha` | 0 至 1 | 起始色彩的不透明度。 |
| `toAlpha` | 0 至 1 | 結束色彩的不透明度。 |

範例：`{"from":"#ff5c93","to":"#00d4ff","angle":90}`

## 自訂形狀 (Custom shapes)

當 `shape` 為 `Custom` 時繪製為點的影像，或為 null。SVG 在使用前會清除指令碼與事件處理常式。檔案隨連結傳遞，因此超過幾十 kB 的檔案將無法放入必須保持在 32,000 個字元以內的嵌入網址。

| 鍵值 | 接受的值 | 說明 |
|---|---|---|
| `name` | 文字，最多 80 個字元 | 檔案名稱。超出長度的名稱會被截斷為 80 個字元。 |
| `type` | `image/svg+xml`, `image/png`, `image/jpeg`, `image/webp` |  |
| `dataUrl` | 文字，最多 409,600 個字元 | 作為 Data URL 的影像：PNG、JPEG 與 WebP 為 base64，SVG 為 URL 編碼的標記。 |
| `svgSource` | 文字 | 僅限 SVG：標記內容。當存在時，應用程式會讀取此內容代替 `dataUrl`（自訂形狀仍需要 dataUrl）。 |

## 形狀 (Shapes)

`shape` 的 13 種數值：`Circle`、`Hexagon`、`Triangle`、`Pentagon`、`Square`、`Voxel`、`Particle Grid`、`Diamond`、`Star`、`Plus`、`Ring`、`ASCII`、`Custom`。請依照字面拼寫：`Particle Grid` 中間有空格，且 `ASCII` 與 `Custom` 需要 `asciiSymbol` 與 `customShape`。

## 區域 (Regions)

`selection` 可為 `world`、`country:` 加上大寫 ISO 3166-1 alpha-3 代碼 (`country:JPN`)、`continent:` 加上大洲名稱，或 `subregion:` 加上次區域名稱，拼寫如下所示。應用程式不認識的名稱會顯示全世界。

### 大洲 (Continents)

共 6 個：`Africa`、`Asia`、`Europe`、`North America`、`Oceania`、`South America`。沒有 Antarctica。

### 次區域 (Subregions)

共 22 個：`Australia and New Zealand`、`Caribbean`、`Central America`、`Central Asia`、`Central Europe`、`Eastern Africa`、`Eastern Asia`、`Eastern Europe`、`Melanesia`、`Middle Africa`、`North America`、`Northern Africa`、`Northern Europe`、`South America`、`South-Eastern Asia`、`Southeast Europe`、`Southern Africa`、`Southern Asia`、`Southern Europe`、`Western Africa`、`Western Asia`、`Western Europe`。

### 地圖無法繪製的國家

點陣地圖沒有足夠空間容納這 70 個微型國家與領地，因此使用 `country:` 指定其中之一會顯示全世界：`ABW`, `AIA`, `ALA`, `AND`, `ASM`, `ATG`, `BES`, `BHR`, `BLM`, `BRB`, `CCK`, `COK`, `COM`, `CPV`, `CUW`, `CXR`, `CYM`, `DMA`, `FRO`, `FSM`, `GGY`, `GIB`, `GLP`, `GRD`, `GUM`, `HKG`, `IMN`, `IOT`, `JEY`, `KIR`, `KNA`, `LCA`, `LIE`, `MAC`, `MAF`, `MCO`, `MDV`, `MHL`, `MNP`, `MSR`, `MTQ`, `MUS`, `MYT`, `NFK`, `NIU`, `NRU`, `PCN`, `PLW`, `PYF`, `REU`, `SGP`, `SHN`, `SJM`, `SMR`, `SPM`, `STP`, `SXM`, `SYC`, `TCA`, `TKL`, `TON`, `TUV`, `UMI`, `UNK`, `VAT`, `VCT`, `VGB`, `VIR`, `WLF`, `WSM`。

### 美國各州 (US states)

當 `selection: "country:USA"` 時，`stateSelection` 接受 `all`、郵遞區號或 FIPS 代碼，且應用程式會儲存 FIPS 代碼。工作室與嵌入皆會繪製該州。其他數值皆會被丟棄。

| 郵遞區號 | FIPS | 郵遞區號 | FIPS | 郵遞區號 | FIPS | 郵遞區號 | FIPS |
|---|---|---|---|---|---|---|---|
| `AL` | `01` | `AK` | `02` | `AZ` | `04` | `AR` | `05` |
| `CA` | `06` | `CO` | `08` | `CT` | `09` | `DE` | `10` |
| `DC` | `11` | `FL` | `12` | `GA` | `13` | `HI` | `15` |
| `ID` | `16` | `IL` | `17` | `IN` | `18` | `IA` | `19` |
| `KS` | `20` | `KY` | `21` | `LA` | `22` | `ME` | `23` |
| `MD` | `24` | `MA` | `25` | `MI` | `26` | `MN` | `27` |
| `MS` | `28` | `MO` | `29` | `MT` | `30` | `NE` | `31` |
| `NV` | `32` | `NH` | `33` | `NJ` | `34` | `NM` | `35` |
| `NY` | `36` | `NC` | `37` | `ND` | `38` | `OH` | `39` |
| `OK` | `40` | `OR` | `41` | `PA` | `42` | `RI` | `44` |
| `SC` | `45` | `SD` | `46` | `TN` | `47` | `TX` | `48` |
| `UT` | `49` | `VT` | `50` | `VA` | `51` | `WA` | `53` |
| `WV` | `54` | `WI` | `55` | `WY` | `56` | `AS` | `60` |
| `GU` | `66` | `MP` | `69` | `PR` | `72` | `VI` | `78` |

## 限制條件

- 嵌入網址長度必須保持在 32,000 個字元以內：`https://globestudio.app/embed?c=` 加上編碼後的設定。網站會在網址稍微低於 32,800 個字元時以 414 拒絕連線，因此此限制留有一些安全裕度。
- `globeSettings.dataPoints` 僅保留前 250 個有效資料點。
- 自訂形狀的 `dataUrl` 最多為 409,600 個字元（為工作室 200 KB 檔案上限的兩倍），遠超出嵌入網址所能容納的長度。
- `asciiSymbol` 保留 12 個字元，`customShape.name` 保留 80 個字元。
