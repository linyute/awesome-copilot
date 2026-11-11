# Globestudio 外觀風格 (Globestudio looks)

由 scripts/generate-skill-references.js 從 src/data/look-presets.js、src/data/preset-seo.js 與 src/data/preset-tags.js 自動產生。在此手動編輯的內容在下次產生時將會遺失。

共 21 種外觀風格。每種都是一個起點：`/looks/<id>` 在工作室中開啟它，`/embed?look=<id>` 將其嵌入，而在任一網址上的 `?c=` 設定可變更部分設定並保留該外觀風格其餘數值。網址位址中使用 id；顯示名稱則是大家看到的名稱。

嵌入網址會如同工作室一樣繪製外觀風格，帶有下方的密度、點大小與背景，除非網址或設定覆寫了它們。網址或設定中的 `background` 色彩會使原本透明的外觀風格 (Wireframe) 呈現實心頁面。

這些 id 與其執行的效果名稱不同：`wireframe` (Wireframe) 執行 `edge`，`vapor` (Vapor) 執行 `chromatic`，`topographic` (Sonar) 執行 `wave`。在網址位址中請放入外觀 id，在 `shaderSettings.effect` 中則放入效果 id。

點色彩說明該外觀風格的著色器對 `dotColor` 與 `dotGradient` 的處理方式。只有保留它們的外觀風格才能呈現品牌色彩。Halftone、Wireframe、Toon 與 Threshold 無論設定為何皆繪製白色墨水，或在 `/embed` 位址上使用 `theme=light`、套件上使用 `theme="light"` 以及工作室的淺色主題下呈現石墨色。Halftone 也會以其點陣填滿整個地球儀，因此選取的國家僅在平面檢視中才會凸顯。

## 目錄

- 所有外觀風格：各一行摘要
- 各外觀風格詳細章節（依 id 排列），包含其基準設定、適用情境與標籤

## 所有外觀風格

| id | 名稱 | 簡述 | 效果 | 點色彩 | 形狀 | 背景 |
|---|---|---|---|---|---|---|
| `default` | Default | 簡潔製圖 | `none` | kept (保留) | Circle | solid `#0a0a0a` |
| `halftone` | Halftone | 報紙印刷感，瀏覽器轉譯 | `halftone` | ignored：白色墨水，在 `theme=light` 下為石墨色 | Circle | solid `#0a0a0c` |
| `risograph` | Risograph | 粉紅 + 青色墨水，刻意套印不準 | `risograph` | changed：淺色變為粉紅與青色墨水 | Circle | solid `#1a1410` |
| `newsprint` | Newsprint | CMYK，四色版，專業印刷網角 | `newsprint` | ignored：白紙上的 CMYK 印刷 | Circle | solid `#15110c` |
| `aurora` | Aurora | 橫跨星球的極光光帶 | `aurora` | changed：覆蓋綠色、青色與洋紅色光帶 | Particle Grid | space |
| `pixel` | Pixel | 8 位元世界地圖集 | `pixel` | kept (保留) | Square | solid `#0a0814` |
| `bayer` | Bayer | 經典 Mac 門檻抖色 | `bayer` | kept (保留) | Square | solid `#171719` |
| `atkinson` | Atkinson | Atkinson 抖色，比 Bayer 更稀疏 | `atkinson` | kept (保留) | Square | solid `#171719` |
| `wireframe` | Wireframe | 邊緣描摹，如手工版畫 | `edge` | ignored：白色墨水，在 `theme=light` 下為石墨色 | Triangle | transparent |
| `crt` | CRT | 陰極射線管磷光體餘暉 | `crt` | kept (保留) | ASCII | solid `#020a10` |
| `glitch` | Glitch | 訊號中斷，RGB 色差分離 | `glitch` | kept (保留) | Square | solid `#08020c` |
| `badtv` | Bad TV | 類比磁帶衰退老化 | `badtv` | kept (保留) | Square | solid `#060608` |
| `bloom` | Bloom | 大氣層燃燒效果 | `bloom` | no dots：實心陸地，以 `worldFill` 著色 | solid land | space |
| `metal` | Metal | 液態鉻金屬，柔和反射 | `metal` | ignored：鉻金屬 | Voxel | solid `#08080e` |
| `iridescent` | Iridescent | 全像雷射箔貼紙 | `iridescent` | changed：淺色變為流轉的金屬箔色調 | Star | solid `#000000` |
| `pencil` | Pencil | 鉛筆素描大洲輪廓 | `pencil` | ignored：紙上石墨 | ASCII | solid `#14100a` |
| `corrupt` | Corrupt | 刻意的 Datamosh 破圖故障 | `corrupt` | changed：貼齊至純 RGB 色彩 | Square | solid `#100008` |
| `toon` | Toon | 卡通賽璐珞普普藝術世界 | `toon` | ignored：白色墨水，在 `theme=light` 下為石墨色 | Circle | solid `#0b1a2c` |
| `threshold` | Threshold | 純粹雙色二進位黑白 | `threshold` | ignored：白色墨水，在 `theme=light` 下為石墨色 | Square | solid `#0a0a0a` |
| `vapor` | Vapor | 合成波地平線，粉彩漸層 | `chromatic` | kept (保留) | Diamond | solid `#1c0a2a` |
| `topographic` | Sonar | 聲納螢幕上的同心環 | `wave` | kept (保留) | Ring | solid `#0f1419` |

## 各外觀風格詳情

效果列出了該外觀風格自有的各微調參數值（0 至 100，cellSize 0 至 30）。地圖、背景與地球儀是外觀風格的基準線，設定檔可按鍵值逐一取代。向量 (Vectors) 說明匯出對話方塊的 SVG 標籤頁對該外觀的支援情況。SVG 與 Figma 標籤頁的 Copy as vectors 會繪製平面地圖（即使從地球儀檢視匯出亦同），保留點、其形狀與色彩。其餘效果需要 PNG 或影片才能呈現。

### default

Default：簡潔製圖。

- 工作室：https://globestudio.app/looks/default
- 嵌入網址：https://globestudio.app/embed?look=default
- 效果：none
- 點色彩：kept (保留)
- 地圖：Circle 點，`#ffffff`，密度 40，大小 10
- 背景：solid `#0a0a0a`
- 地球儀：開啟光暈，開啟格線，開啟網絡
- 向量：SVG 與 Copy as vectors 完整保留所有視覺效果。
- 適用情境：標題後方的產品登陸頁主視覺；焦點需放在其他內容上的會議簡報投影片背景；設計師為專案自訂的品牌系統基礎
- 標籤：clean, minimal, neutral, simple, starter

### halftone

Halftone：報紙印刷感，瀏覽器轉譯。

- 工作室：https://globestudio.app/looks/halftone
- 嵌入網址：https://globestudio.app/embed?look=halftone
- 效果：`halftone`，intensity 78，cellSize 8，scanlines 0，motion 20，grain 0
- 點色彩：ignored：白色墨水，在 `theme=light` 下為石墨色
- 地圖：Circle 點，`#ffffff`，密度 50，大小 11
- 背景：solid `#0a0a0c`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：半色調 (halftone) 圖樣僅能透過 PNG 完整呈現。
- 適用情境：著重印刷質感的雜誌跨頁或專案編輯頁首；年度報告封面與章節分隔頁；黑膠唱片封套或孔版印刷 (Risograph) 周邊印刷品
- 標籤：print, vintage, editorial, newspaper, dots, retro

### risograph

Risograph：粉紅 + 青色墨水，刻意套印不準。

- 工作室：https://globestudio.app/looks/risograph
- 嵌入網址：https://globestudio.app/embed?look=risograph
- 效果：`risograph`，intensity 82，split 6，cellSize 4，grain 20
- 點色彩：changed：淺色變為粉紅與青色墨水
- 地圖：Circle 點，`#ffffff`，密度 55，大小 12
- 背景：solid `#1a1410`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：粉紅與青色墨水僅能透過 PNG 完整呈現。
- 適用情境：獨立雜誌與 Zine 小誌排版；印刷風格周邊（海報、貼紙、型錄 lookbook）；設計電子報中的編輯插畫頁首
- 標籤：print, pink, cyan, riso, ink, vibrant, modern, zine

### newsprint

Newsprint：CMYK，四色版，專業印刷網角。

- 工作室：https://globestudio.app/looks/newsprint
- 嵌入網址：https://globestudio.app/embed?look=newsprint
- 效果：`newsprint`，intensity 85，cellSize 6，grain 8
- 點色彩：ignored：白紙上的 CMYK 印刷
- 地圖：Circle 點，`#ffffff`，密度 60，大小 11
- 背景：solid `#15110c`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：CMYK 半色調僅能透過 PNG 完整呈現。
- 適用情境：漫畫風格資訊圖表與解說圖版；仿廉價大眾小說 (pulp) / 復古雜誌風格拼貼；具備印刷質感數位文章中的編輯章節分隔線
- 標籤：cmyk, print, newspaper, editorial, vintage, magazine

### aurora

Aurora：橫跨星球的極光光帶。

- 工作室：https://globestudio.app/looks/aurora
- 嵌入網址：https://globestudio.app/embed?look=aurora
- 效果：`aurora`，intensity 75，cellSize 14，motion 45，grain 0
- 點色彩：changed：覆蓋綠色、青色與洋紅色光帶
- 地圖：Particle Grid 點，`#ffffff`，密度 70，大小 12
- 背景：space
- 地球儀：開啟光暈，開啟格線，開啟網絡
- 向量：極光光帶與星空背景僅能透過 PNG 完整呈現。
- 適用情境：帶有細微持續動態的科技 / SaaS 產品登陸頁主視覺；銜接至靜態標誌組合的會議發表開場序列；不喧賓奪主的直播 / 播客視覺背景
- 標籤：glow, atmospheric, soft, dreamy, blue, green, space, night

### pixel

Pixel：8 位元世界地圖集。

- 工作室：https://globestudio.app/looks/pixel
- 嵌入網址：https://globestudio.app/embed?look=pixel
- 效果：`pixel`，intensity 70，cellSize 12，scanlines 36，grain 4
- 點色彩：kept (保留)
- 地圖：Square 點，`#ffffff`，密度 75，大小 15
- 背景：solid `#0a0814`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：像素化效果僅能透過 PNG 完整呈現。
- 適用情境：獨立遊戲工作室網站主視覺；復古主題會議品牌識別；懷舊產品的像素藝術行銷頁面
- 標籤：8-bit, retro, game, blocky, square, low-fi, nintendo

### bayer

Bayer：經典 Mac 門檻抖色。

- 工作室：https://globestudio.app/looks/bayer
- 嵌入網址：https://globestudio.app/embed?look=bayer
- 效果：`bayer`，intensity 88，cellSize 8，grain 0
- 點色彩：kept (保留)
- 地圖：Square 點，`#ffffff`，密度 70，大小 12
- 背景：solid `#171719`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：抖色效果僅能透過 PNG 完整呈現。
- 適用情境：復古科技產品發表與懷舊品牌系統；具備「早期 Mac」視覺感受的軟體與 SaaS 頁面；像素藝術或 1 位元遊戲的工作室網站
- 標籤：dither, retro, mac, classic, ordered, monochrome

### atkinson

Atkinson：Atkinson 抖色，比 Bayer 更稀疏。

- 工作室：https://globestudio.app/looks/atkinson
- 嵌入網址：https://globestudio.app/embed?look=atkinson
- 效果：`atkinson`，intensity 90，cellSize 6，grain 0
- 點色彩：kept (保留)
- 地圖：Square 點，`#ffffff`，密度 65，大小 11
- 背景：solid `#171719`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：抖色效果僅能透過 PNG 完整呈現。
- 適用情境：懷舊 Mac 風格獨立軟體產品頁面；復古計算機愛好者聚會品牌識別；回顧型設計文章的印刷感插畫
- 標籤：dither, blue-noise, mac, classic, monochrome, apple

### wireframe

Wireframe：邊緣描摹，如手工版畫。

- 工作室：https://globestudio.app/looks/wireframe
- 嵌入網址：https://globestudio.app/embed?look=wireframe
- 效果：`edge`，intensity 65，threshold 16，grain 0
- 點色彩：ignored：白色墨水，在 `theme=light` 下為石墨色
- 地圖：Triangle 點，`#ffffff`，密度 90，大小 16
- 背景：transparent
- 地球儀：關閉光暈，開啟格線，開啟網絡
- 向量：描摹邊緣僅能透過 PNG 完整呈現。
- 適用情境：開發者工具產品頁面；建築與工程作品集網站；科學 / 研究出版物頁首
- 標籤：line, outline, edge, technical, sketch, blueprint, skeletal

### crt

CRT：陰極射線管磷光體餘暉。

- 工作室：https://globestudio.app/looks/crt
- 嵌入網址：https://globestudio.app/embed?look=crt
- 效果：`crt`，intensity 65，split 8，cellSize 9，scanlines 78，warp 30，motion 30，grain 10
- 點色彩：kept (保留)
- 地圖：ASCII 點，`#ffffff`，密度 70，大小 14
- 背景：solid `#020a10`
- 地球儀：開啟光暈，開啟格線，開啟網絡
- 向量：掃描線與光暈僅能透過 PNG 完整呈現。
- 適用情境：80 年代美學產品發表；復古遊戲與合成波 (synthwave) 品牌系統；會議 / 播客開場動畫視覺
- 標籤：retro, scanline, tv, monitor, phosphor, vintage, 80s

### glitch

Glitch：訊號中斷，RGB 色差分離。

- 工作室：https://globestudio.app/looks/glitch
- 嵌入網址：https://globestudio.app/embed?look=glitch
- 效果：`glitch`，intensity 70，split 35，scanlines 32，motion 85，grain 14
- 點色彩：kept (保留)
- 地圖：Square 點，`#ffffff`，密度 75，大小 14
- 背景：solid `#08020c`
- 地球儀：關閉光暈，開啟格線，開啟網絡
- 向量：故障破圖效果僅能透過 PNG 完整呈現。
- 適用情境：電子音樂唱片公司與音樂廠牌網站；發表預告與揭曉前的懸疑視覺圖形；賽博龐克美學會議品牌識別
- 標籤：broken, distorted, error, datamosh, harsh

### badtv

Bad TV：類比磁帶衰退老化。

- 工作室：https://globestudio.app/looks/badtv
- 嵌入網址：https://globestudio.app/embed?look=badtv
- 效果：`badtv`，intensity 65，motion 55，grain 32
- 點色彩：kept (保留)
- 地圖：Square 點，`#ffffff`，密度 70，大小 13
- 背景：solid `#060608`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：磁帶雜訊僅能透過 PNG 完整呈現。
- 適用情境：偽紀錄片與仿歷史檔案影片片頭視覺；蒸氣波 (Vaporwave) / 復古音樂專案品牌識別；低傳真 (Lo-fi) 播客封面與直播背景
- 標籤：vhs, analog, distorted, retro, scanline, tape

### bloom

Bloom：大氣層燃燒效果。

- 工作室：https://globestudio.app/looks/bloom
- 嵌入網址：https://globestudio.app/embed?look=bloom
- 效果：`bloom`，intensity 78，split 10，warp 30，motion 20，grain 3
- 點色彩：no dots：實心陸地，以 `worldFill` 著色
- 地圖：實心陸地，填滿 `#5a5a64`，外框 `#f6f2ea`
- 背景：space
- 地球儀：開啟光暈，開啟格線，開啟網絡
- 向量：SVG 將此地圖繪製為點陣。實心陸地、泛光與星空背景僅能透過 PNG 完整呈現。
- 適用情境：SaaS 產品登陸頁主視覺；金融科技、健康科技或身心健康領域的消費級產品發表；投資人簡報結尾與最後投影片視覺
- 標籤：glow, soft, dreamy, atmospheric, warm, halo

### metal

Metal：液態鉻金屬，柔和反射。

- 工作室：https://globestudio.app/looks/metal
- 嵌入網址：https://globestudio.app/embed?look=metal
- 效果：`metal`，intensity 78，motion 30，grain 0
- 點色彩：ignored：鉻金屬
- 地圖：Voxel 點，`#ffffff`，密度 70，大小 13
- 背景：solid `#08080e`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：鉻金屬著色僅能透過 PNG 完整呈現。
- 適用情境：消費性電子產品發表；汽車與工程品牌系統；著重硬體領域的會議品牌識別
- 標籤：chrome, shiny, polished, futuristic, premium

### iridescent

Iridescent：全像雷射箔貼紙。

- 工作室：https://globestudio.app/looks/iridescent
- 嵌入網址：https://globestudio.app/embed?look=iridescent
- 效果：`iridescent`，intensity 78，cellSize 6，motion 35，grain 22
- 點色彩：changed：淺色變為流轉的金屬箔色調
- 地圖：Star 點，`#ffffff`，密度 70，大小 13
- 背景：solid `#000000`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：雷射箔微光僅能透過 PNG 完整呈現。
- 適用情境：Y2K 復古風尚與生活風格品牌系統；會員專區與信用卡產品頁面；設計與創意科技活動會議品牌識別
- 標籤：holographic, foil, rainbow, shimmer, y2k, sticker

### pencil

Pencil：鉛筆素描大洲輪廓。

- 工作室：https://globestudio.app/looks/pencil
- 嵌入網址：https://globestudio.app/embed?look=pencil
- 效果：`pencil`，intensity 65，grain 0
- 點色彩：ignored：紙上石墨
- 地圖：ASCII 點，`#ffffff`，密度 60，大小 14
- 背景：solid `#14100a`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：鉛筆筆觸與紙張紋理僅能透過 PNG 完整呈現。
- 適用情境：設計出版物中的編輯插畫；手工藝 / 手作風格品牌系統；旅遊專題文章頁首與章節分隔
- 標籤：sketch, hatching, drawn, traditional, illustration

### corrupt

Corrupt：刻意的 Datamosh 破圖故障。

- 工作室：https://globestudio.app/looks/corrupt
- 嵌入網址：https://globestudio.app/embed?look=corrupt
- 效果：`corrupt`，intensity 75，cellSize 6，motion 45，grain 0
- 點色彩：changed：貼齊至純 RGB 色彩
- 地圖：Square 點，`#ffffff`，密度 80，大小 12
- 背景：solid `#100008`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：Datamosh 故障效果僅能透過 PNG 完整呈現。
- 適用情境：電子音樂專輯封面與音樂廠牌網站；故障藝術 (Glitch-art) 展覽圖錄封面；反商業 / 批判性設計出版品頁首
- 標籤：glitch, broken, datamosh, harsh, experimental

### toon

Toon：卡通賽璐珞普普藝術世界。

- 工作室：https://globestudio.app/looks/toon
- 嵌入網址：https://globestudio.app/embed?look=toon
- 效果：`toon`，intensity 72，grain 0
- 點色彩：ignored：白色墨水，在 `theme=light` 下為石墨色
- 地圖：Circle 點，`#3df4ff`，密度 60，大小 13
- 背景：solid `#0b1a2c`
- 地球儀：開啟光暈，開啟格線，開啟網絡
- 向量：賽璐珞著色 (cel shading) 僅能透過 PNG 完整呈現。
- 適用情境：普普藝術雜誌與 Zine 封面；帶有卡通角色聲音的動畫品牌形象短片；童書或青少年出版物內頁跨頁
- 標籤：cartoon, cel-shaded, pop-art, bold, comic, illustration

### threshold

Threshold：純粹雙色二進位黑白。

- 工作室：https://globestudio.app/looks/threshold
- 嵌入網址：https://globestudio.app/embed?look=threshold
- 效果：`threshold`，intensity 75，threshold 42，warp 24，motion 30，grain 8
- 點色彩：ignored：白色墨水，在 `theme=light` 下為石墨色
- 地圖：Square 點，`#f6f2ea`，密度 65，大小 11
- 背景：solid `#0a0a0a`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：雙色門檻效果僅能透過 PNG 完整呈現。
- 適用情境：專題雜誌封面與開章頁；黑白絹印海報設計；極簡主義年度報告分隔頁
- 標籤：binary, two-tone, minimal, editorial, contrast, stark, poster

### vapor

Vapor：合成波地平線，粉彩漸層。

- 工作室：https://globestudio.app/looks/vapor
- 嵌入網址：https://globestudio.app/embed?look=vapor
- 效果：`chromatic`，intensity 55，split 14，warp 24，motion 35，grain 6
- 點色彩：kept (保留)
- 地圖：Diamond 點，`#ff9ec5`，密度 60，大小 12
- 背景：solid `#1c0a2a`
- 地球儀：開啟光暈，開啟格線，開啟網絡
- 向量：色差分離效果僅能透過 PNG 完整呈現。
- 適用情境：合成波 / 蒸氣波 EP 與專輯封面；深夜 SaaS 或遊戲產品發表；賽博龐克風格專案編輯跨頁與小誌
- 標籤：synthwave, vaporwave, retro, neon, pastel, 80s, miami

### topographic

Sonar：聲納螢幕上的同心環。

- 工作室：https://globestudio.app/looks/topographic
- 嵌入網址：https://globestudio.app/embed?look=topographic
- 效果：`wave`，intensity 65，split 14，warp 55，motion 25，grain 4
- 點色彩：kept (保留)
- 地圖：Ring 點，`#c8ddc7`，密度 70，大小 11
- 背景：solid `#0f1419`
- 地球儀：關閉光暈，關閉格線，開啟網絡
- 向量：波形失真效果僅能透過 PNG 完整呈現。
- 適用情境：資安、監控與網路產品發表；海事、航空與追蹤數據故事；科幻介面與遊戲背景
- 標籤：sonar, radar, rings, signal, green, tech, scifi
