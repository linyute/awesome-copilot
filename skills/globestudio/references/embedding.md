# 嵌入 Globestudio (Embedding Globestudio)

由 scripts/generate-skill-references.js 從 packages/react/src/index.tsx、packages/web-component/index.js、public/embed.js、src/components/embed-view.jsx、src/data/starter-react.js 與 src/utils/embed-snippets.js 自動產生。在此手動編輯的內容在下次產生時將會遺失。

每個嵌入都是指向 `https://globestudio.app/embed` 的 iframe：套件與指令碼載入器僅僅是建構該網址。地球儀是在 globestudio.app 上轉譯，因此頁面無需加入 three.js 亦無需加入地圖資料。

## 目錄

- 選擇嵌入方式
- React: @globestudio/react
- Web 元件: @globestudio/element
- 單純 iframe
- 指令碼載入器: embed.js
- /embed 查詢參數
- 設計設定 (Design configs)
- 淺色頁面、透明度與尺寸
- 檢查轉譯狀況

## 選擇嵌入方式

| 專案類型 | 使用方式 |
|---|---|
| React, Next.js, Remix, 或搭配 React 的 Astro | @globestudio/react |
| Vue, Svelte, Solid, Angular, Astro, 或搭配打包工具的 HTML | @globestudio/element |
| 無建構步驟的 HTML | 單純 iframe |
| Webflow, Framer, WordPress, Notion, Squarespace | 單純 iframe |

在工作室中，匯出對話方塊的「Share」標籤頁會針對畫面上的設計產生 iframe、React 與 Web component 程式碼。

## React: @globestudio/react

將 `@globestudio/react` 新增至專案，版本需為 0.1.1 或更高：0.1.0 在設定 `config` 時會遺失 `look`，導致修改後的設定退回 Default 風格嵌入。`<Globe>` 轉譯單純的 iframe 且不保留任何狀態，因此可直接在伺服器端轉譯。在 Next.js 伺服器元件中僅使用可序列化的 Props；`onLoad` 或 ref 則需要用戶端元件。

若尚無專案，可提供入門範本 (starter)，這是一個已轉譯 `<Globe>` 的 Vite 與 React 應用程式。向使用者提供 https://globestudio.app/docs#react-component，其中包含複製範本的命令以及可免安裝開啟的 StackBlitz 連結。

| Prop | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `look` | `LookId` | `"halftone"` | 外觀風格預設集識別碼。`LookId` 可自動完成 Globestudio 隨附的每個外觀數值。 |
| `width` | `number \| string` | `"100%"` | CSS 寬度單位。數值轉為像素；`%`、`vw` 等請使用字串。 |
| `height` | `number \| string` | `480` | CSS 高度單位。 |
| `config` | `string` |  | 以 JSON 字串表示的設計分享設定 `JSON.stringify(design)`，無需 URL 編碼：元件會自動為嵌入網址進行編碼。應用程式的「Share」標籤頁會輸出此字串；若從 MCP 伺服器的 `build_share_url` 取得，請對其傳回的 `config` 進行字串化。當同時設定 `look` 時，它會覆蓋於該外觀之上（僅包含變更的設定可保留該外觀的其餘設定）；單獨設定時則覆蓋於 Default 之上。 |
| `theme` | `"light" \| "dark"` | `"dark"` | 嵌入調色盤。`"light"` 將光暈與格線切換為淺色頁面專用調色盤，並將 Halftone、Wireframe、Toon 與 Threshold 的白色墨水轉為石墨色。Halftone、Toon 與 Threshold 會繪製自有的深色頁面，墨水在其中無法辨識，因此請在 `config` 中將它們同時設為透明。其他任何值皆保持深色調色盤。 |
| `title` | `string` | `"Globestudio dotted globe"` | 嵌入 iframe 的無障礙標題。輔助技術/螢幕閱讀器必要項。 |
| `className` | `string` |  | 轉發給 iframe 的 `className`。 |
| `style` | `CSSProperties` |  | 轉發給 iframe 的 `style`。於元件預設的 `border: 0` 之後合併，呼叫端可覆寫任何樣式。 |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | `loading` 屬性。 |
| `source` | `string` |  | 加入嵌入網址的選用 `source` 查詢參數。用於在 Vercel Analytics 中追蹤嵌入來源。範例：`source="my-saas-landing"`。 |
| `onLoad` | `React.IframeHTMLAttributes<HTMLIFrameElement>["onLoad"]` |  | 當 iframe 完成載入時觸發。直接轉發。 |

```jsx
import { Globe } from "@globestudio/react";

const HERO_GLOBE = { v: 3, selection: "continent:Europe", dotColor: "#7dd3fc" };

export const Hero = () => (
  <Globe look="crt" config={JSON.stringify(HERO_GLOBE)} height={520} title="Dotted globe of Europe" />
);
```

## Web component: @globestudio/element

將 `@globestudio/element` 新增至專案（同樣需要 0.1.1 或更高版本），接著 `import "@globestudio/element"`，此操作會註冊 `<globe-studio>`。在伺服器端執行 import 是安全的，但該元素僅在瀏覽器中繪製，因此在伺服器端轉譯環境（Nuxt、SvelteKit、Astro）下請在用戶端程式碼中載入。`defineGlobeStudio(tag)` 可使用其他標籤名稱進行註冊。

| 屬性 | 預設值 |
|---|---|
| `look` | `halftone` |
| `config` |  |
| `theme` | `dark` |
| `source` |  |
| `width` | `100%` |
| `height` | `480` |
| `title` | `Globestudio dotted globe` |
| `loading` | `lazy` |

```html
<globe-studio look="crt" config='{"v":3,"selection":"continent:Europe","dotColor":"#7dd3fc"}' height="480" title="Dotted globe of Europe"></globe-studio>
```

若無建構步驟，請改為使用單純 iframe。該 Web 元件本質上亦僅是建構該 iframe，因此頁面會得到相同的地球儀。

## 單純 iframe

```html
<iframe
  src="https://globestudio.app/embed?look=crt&c=%7B%22v%22%3A3%2C%22selection%22%3A%22continent%3AEurope%22%2C%22dotColor%22%3A%22%237dd3fc%22%7D"
  width="100%"
  height="480"
  style="border: 0;"
  loading="lazy"
  title="Dotted globe of Europe"
></iframe>
```

該位址即為套件依據 `look="crt"` 與上述設定所建構的網址。

## 指令碼載入器: embed.js

頁面可能已載入 embed.js（官方文件 https://globestudio.app/docs#script-tag-loader 所提供的指令碼載入器）。它會將每個帶有 `data-globestudio` 的元素轉為 iframe，包含後續新增的元素。iframe 會填滿該元素；本身無高度的元素會取得 `data-height` 像素並跟隨嵌入的尺寸變更訊息調整。在此類頁面上，地球儀即為帶有這些屬性的元素；在全新頁面上，請直接編寫單純 iframe。

```html
<div data-globestudio data-look="halftone" style="height: 480px"></div>
```

| 屬性 | 對應設定 | 預設值 |
|---|---|---|
| `data-look` | `look` |  |
| `data-density` | `density` |  |
| `data-dot-size` | `dotSize` |  |
| `data-dot-color` | `dotColor` |  |
| `data-world-fill` | `worldFill` |  |
| `data-render-mode` | `renderMode` |  |
| `data-selection` | `selection` |  |
| `data-motion` | `motion` |  |
| `data-tilt-x` | `tiltX` |  |
| `data-tilt-y` | `tiltY` |  |
| `data-auto-spin` | `autoSpin` |  |
| `data-view` | `view` |  |
| `data-static` | `static` |  |
| `data-background` | `background` |  |
| `data-transparent` | `transparent` |  |
| `data-theme` | `theme` |  |
| `data-config` | `c` |  |
| `data-source` | `source` | `script-embed` |
| `data-title` | iframe title | `Globestudio dotted globe` |
| `data-height` | 宿主高度 | `420` |

## /embed 查詢參數

| 參數 | 接受的值 | 預設值 | 說明 |
|---|---|---|---|
| `look` | 外觀 id | `default` | 嵌入起始的外觀風格。未知的 id 顯示 Default。 |
| `background` | 十六進位（`#` 選填）或 `transparent` |  | 畫布後方的頁面色彩。未指定時頁面採用設定中的實心背景，或採用外觀風格的背景。在此處指定色彩會使透明外觀保持實心頁面。 |
| `density` | 1 至 90 | 外觀的設定值；無外觀時為 `40` | 點密度。未指定且設定中亦未指定 `density` 時採用外觀設定值。小於等於 0 或非數字時保留外觀設定值。 |
| `dotSize` | 0.1 至 25 | 外觀的設定值；無外觀時為 `10` | 點大小。未指定且設定中亦未指定 `dotSize` 時採用外觀設定值。小於等於 0 或非數字時保留外觀設定值。 |
| `dotColor` | 十六進位（`#` 選填） |  | 點色彩。其轉譯比實際十六進位更暗（歷史相容行為），使先前製作的嵌入維持原樣。若需精確的十六進位色彩，請在 `"v": 3` 設定中指定 `dotColor`。 |
| `worldFill` | 十六進位（`#` 選填） |  | 實心地圖中的陸地填滿色彩，解讀方式與 `dotColor` 相同。 |
| `renderMode` | `dots` 或 `solid` |  | 點陣或實心填滿陸地。 |
| `selection` | 區域（同設定中之格式） | `world` | 地圖顯示的區域。 |
| `motion` | 0 至 100 | `35` | 已讀取但尚未產生效果。 |
| `tiltX` | -45 至 45 | `0` | 攝影機傾斜度（度）。 |
| `tiltY` | -45 至 45 | `0` | 攝影機傾斜度（度）。 |
| `autoSpin` | `1` 或 `0` | `1` | 旋轉地球儀。 |
| `view` | `globe` 或 `flat` |  | 3D 地球儀或平面地圖。優先於設定中的 `viewMode`；兩者皆未指定時為地球儀。 |
| `static` | `1` 或 `0` | `0` | `1` 會使所有動畫靜止，供設計工具畫布與螢幕截圖使用。 |
| `source` | 文字 | `embed` | 分析標記，在尺寸變更訊息中傳回。 |
| `transparent` | `1` 或 `0` | 外觀的設定值；無外觀時為 `0` | `1` 使頁面透明，以便襯托於宿主頁面上。外觀自帶的透明度 (Wireframe) 無需參數；`0` 可將其關閉。 |
| `theme` | `light` |  | 將光暈與格線切換為淺色頁面專用調色盤，並將 Halftone、Wireframe、Toon 與 Threshold 的白色墨水轉為石墨色。 |
| `plugin` | `figma` |  | 舊版 Figma 外掛程式挑選器外殼。非供嵌入使用。 |
| `c` | 設定檔（經 URL 編碼） |  | 最後套用，覆蓋於外觀風格與上述參數之上。參見「設計設定」。 |

## 設計設定 (Design configs)

- `config`（套件）與 `c`（網址）接受設計的 JSON。向套件提供 JSON 字串 `JSON.stringify(design)`；套件會自動編碼。在網址中，使用 `encodeURIComponent` 編碼一次。
- 搭配外觀風格時，設定僅變更其具體命名的鍵值，其餘保留該外觀的設定值，包含其密度、點大小、背景與透明度。網址或設定中的 `background` 色彩會使透明外觀風格 (Wireframe) 呈現實心頁面。單獨使用時，設定會覆蓋於 Default 之上。
- 如同工作室輸出一般帶有 `version` 的設定屬於完整設計：在 `shaderSettings`、`globeSettings`、`spaceSettings` 與 `flowSettings` 內部，其省略的鍵值會取得應用程式預設值，即使搭配外觀風格亦然。
- 從 MCP 伺服器的 `build_share_url` 取得時，向套件提供結果的 `look` 以及對其 `config` 進行 `JSON.stringify` 的字串，而非其 `embed_url` 的 `c`：該網址將區域、色彩與密度作為獨立參數傳遞，因此其 `c` 中可能缺少這些項目。
- 網址必須保持在 32,000 個字元以內，因此請檢查 `https://globestudio.app/embed?c=` 加上編碼後設定的總長度。自訂形狀檔案或冗長的資料點清單通常是超長的主因。

## 淺色頁面、透明度與尺寸

- 在淺色頁面上，在 `<Globe>` 或 `<globe-studio>` 上設定 `theme="light"`，在 embed.js 上設定 `data-theme="light"`，或在單純 iframe 中設定 `theme=light`。這會將光暈與格線切換為淺色頁面專用調色盤。僅傳送 `light`；任何其他數值皆保留原網址設定。
- 在設定中也使設計符合頁面：在保留點色彩的外觀風格上設定淺色 `background` 與深色 `dotColor`（參見 looks.md 中的點色彩說明），或使用 `"backgroundStyle": "transparent"` 搭配可在頁面上清楚顯示的點。
- Halftone、Wireframe、Toon 與 Threshold 無論 `dotColor` 設定為何皆繪製白色墨水，因此在淺色頁面上透明版本幾乎會完全隱形。淺色主題會將其墨水轉為石墨色；若不使用淺色主題，請為其指定實心深色 `background`。
- 石墨色墨水僅在透明或淺色背景上顯示。Halftone、Toon 與 Threshold 會繪製自有的深色頁面，墨水在其中無法辨識，因此搭配淺色主題時亦需將它們設為透明：在設定中指定 `"backgroundStyle": "transparent"`，或在單純 iframe 中指定 `transparent=1`。
- 在單純 iframe 中，`transparent=1` 或 `background=transparent` 可讓頁面穿透顯示。
- 為 iframe 或其容器指定明確高度；套件預設為 480 px。嵌入會向父頁面發布 `{ type: "globestudio-resize", height, source }` 訊息，embed.js 藉此設定本身無高度之元素的尺寸。
- 設定 `title` 說明地球儀顯示的內容以利螢幕閱讀器讀取，頁面首屏以下的地球儀請保留 `loading="lazy"`。

## 檢查轉譯狀況

轉譯需要 WebGL 2。請透過讀取進行檢查：程式碼以及其建構出的 `/embed` 網址，使用者可以在瀏覽器中開啟該網址檢視地球儀。若尚未實際看到轉譯成果，請如實說明。一片空白的地球儀通常表示瀏覽器不支援 WebGL 2。每種外觀風格在無任何修改下的預設縮圖位於 `https://globestudio.app/looks/<id>.png`。
