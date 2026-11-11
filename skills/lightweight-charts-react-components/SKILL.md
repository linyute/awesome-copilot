---
name: lightweight-charts-react-components
description: '在 React 中使用 TradingView lightweight-charts 的 lightweight-charts-react-components 食譜。K 線圖、折線圖與面積圖系列；成交量與指標面板；即時 WebSocket 更新；滾動時的無限歷史資料載入；十字準星 OHLC 圖例與工具提示；交易標記與價格水平線；同步圖表；數值選項與殖利率曲線軸。在 React 應用程式中新增或修正金融或交易圖表時，或當使用者提及 lightweight-charts、React 中的 TradingView 圖表或此套件時使用。'
license: MIT
metadata:
  author: ukorvl
  version: "1.0"
  source: "https://github.com/ukorvl/lightweight-charts-react-components/tree/0368191127568e48aef6f7bda2ff3900e8e24756/skills/lightweight-charts-react-components"
---

# lightweight-charts-react-components 指引

## 快速開始

讓元件負責管理圖表與系列的建立與清理。從 `lightweight-charts-react-components` 匯入元件與 ref 型別；從
`lightweight-charts` 匯入原生資料、選項與事件型別。

1. 對照下方的相容性表格檢查版本。從應用程式的 `package.json` 讀取宣告的範圍，接著從 `lightweight-charts-react-components`、`lightweight-charts`、`react` 與 `react-dom` 的 `node_modules/<package>/package.json` 的 `version` 欄位讀取已安裝的版本。若尚未安裝該函式庫，請遵循[安裝指引](#安裝指引)。確保圖表渲染在瀏覽器中、應用程式的用戶端邊界內執行。
2. 針對基本的靜態圖表，從下方的最小圖表範例開始。否則，請閱讀符合所要求行為的參考文件。調整其資料摘要與 UI；保留其資料合約、元件巢狀結構以及 API 就緒狀態處理。
3. 選擇單一資料擁有者：對於 React 擁有的更新，透過 `data` 傳遞完整資料集；或者針對頻繁的 tick 使用 `reactive={false}` 與系列 API。

### 安裝指引

使用專案的套件管理器將包裝器連同其 `lightweight-charts` peer dependency 一併安裝。React 與 React DOM
必須已經安裝。

```sh
npm install lightweight-charts-react-components lightweight-charts
```

### 最小圖表範例

```tsx
import type { LineData, UTCTimestamp } from "lightweight-charts";
import {
  Chart,
  LineSeries,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";

// 資料必須依時間嚴格遞增排序，且時間不得重複（此處為 UTC 秒數）。
export function SimpleLineChart({ data }: { data: LineData<UTCTimestamp>[] }) {
  return (
    // autoSize 會隨容器變化，容器需要有非零的高度。
    <Chart
      options={{ autoSize: true }}
      containerProps={{ style: { height: 300, width: "100%" } }}
    >
      <LineSeries data={data} />
      <TimeScale>
        <TimeScaleFitContentTrigger deps={[]} />
      </TimeScale>
    </Chart>
  );
}
```

## 範例與程式碼片段（參考檔案）

閱讀符合使用者預期成果的參考文件。每份文件均包含完整的 TypeScript
食譜、資料與整合合約、架構考量原因、失敗模式與驗收檢查。當任務橫跨多個目標時可組合參考文件；對於簡單的圖表請勿載入所有參考文件。

| 使用者請求 | 參考文件 |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| WebSocket K 線、更新當前 bar、過期歷史資料、過多圖表重新渲染 | [市場資料與即時更新](references/market-data-and-live-updates.md) |
| 滾動載入較舊歷史資料、視窗跳動、交易代號/時間間隔切換、API 延遲回應 | [歷史資料與範圍選取](references/history-and-range-selection.md) |
| K 線加上成交量、移動平均線、震盪指標面板、獨立價格刻度 | [價格、成交量與指標](references/price-volume-and-indicators.md) |
| OHLC 圖例、暫留詳細資訊、缺失資料、工具提示定位 | [暫留圖例與工具提示](references/hover-legends-and-tooltips.md) |
| 交易執行與訊號、停損/目標水平、點擊放置價格線 | [交易標記與價格水平線](references/trade-markers-and-price-levels.md) |
| 比較不同價格的資產、固定基準報酬率、切換比較標的 | [效能表現比較](references/performance-comparison.md) |
| 共用滾動、縮放與十字準星的獨立圖表 | [同步圖表](references/synchronized-charts.md) |
| 交易時段著色、面板背景、隨縮放連動的自訂繪圖 | [時段覆蓋圖層與基元](references/session-overlays-and-primitives.md) |
| 選擇權履約價、殖利率到期日、選擇數值或自訂水平軸 | [數值軸與圖表型別](references/numeric-axes-and-chart-types.md) |

若無參考文件符合請求，請告知使用者本技能對此尚無現成食譜。接著使用公開元件與上游 `lightweight-charts` API
建構解決方案，並套用快速開始規則與下方的邊界情況。

### 技能相容性

這些食譜已對照下方的參考版本進行驗證。這些是經測試的基準版本，而非最新的發行版本。

若安裝的版本與參考版本不同，請與相容性範圍進行比對。在範圍內，食譜可照實套用。在範圍外，撰寫程式碼前請先告知使用者版本不相符的情況，因為重大 API
變更可能會影響食譜，並請對照安裝的套件驗證食譜使用的每個 API。

| 依賴項或環境 | 參考版本 | 相容性範圍與檢查 |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lightweight-charts-react-components` | `2.6.1`           | 食譜鎖定目標：`>=2.6.1 <3`。其他版本在調整食譜前需先檢查安裝的匯出項、圖表 API ref 與響應式資料行為。 |
| `lightweight-charts`                  | `5.2.1`           | 宣告的 peer dependency：`>=5.0.8 <6`。 |
| React 與 React DOM                   | `19.2.6`          | 宣告的 peer dependencies：`>=18.2 <20`。保持 `react` 與 `react-dom` 版本一致，並使用應用程式現有的 React 執行個體。 |
| Node.js                               | —                 | 套件 engines：`>=18.14.0`。應用程式的建構工具可能需要更新的版本。 |
| 模組系統 | ESM               | 僅支援 ESM `import` 進入點；無 CommonJS `require` 進入點。 |
| 渲染環境 | 瀏覽器 | 圖表需要 DOM 與 canvas。請在用戶端渲染，切勿在伺服器端渲染期間執行。 |

## 常見邊界情況

- **圖表大小：** 將 DOM 樣式放在 `containerProps` 上，並賦予圖表非零的高度。
- **必要的祖先元件：** 無外觀的圖表子元件需要圖表包裝器祖先。`Markers`、`PriceLine` 與 `SeriesPrimitive` 屬於其所屬系列內部；`PriceScale`、`Watermark` 與 `PanePrimitive` 需要 `Pane`；`TimeScaleFitContentTrigger` 需要 `TimeScale`。
- **API ref 與就緒狀態：** 原生 API 請使用 `ref.current?.api()`，div 元素請使用 `containerRef`。對於 `Chart`，請使用 `ChartApiRef<Time, IChartApi>`。`.api()` 最初可能回傳 null；在進行命令式設定之前請遵循食譜的就緒步驟。
- **視窗重設：** 若要保留滾動/縮放狀態，請保持圖表的 key 穩定，並將即時/歷史更新排除在 fit-trigger 依賴項之外。僅在初始載入或明確重設時執行 fit。請參閱[範圍處理](references/history-and-range-selection.md)。
- **資料更新：** 對於 React 擁有的更新使用 `data`，當每次 tick 觸發的 React 渲染產生明顯開銷時，使用 `reactive={false}` 與系列 API。避免混用兩者。響應式 `data` 一律為完整資料集。在包裝器 2.6.1 與 Lightweight Charts 5.2.1 中，`series.data()` 會重建 K 線與折線物件；因此即使 React 保持了先前參照的穩定，包裝器的前項參照比較仍會透過 `setData()` 傳送多 bar 尾部更新。請保持資料不可變，但在需要增量寫入時使用圖表擁有的 `reactive={false}` 食譜與明確的 `series.update(bar)`。請參閱[即時更新](references/market-data-and-live-updates.md)。

## 出處

改編自 [ukorvl/lightweight-charts-react-components](https://github.com/ukorvl/lightweight-charts-react-components/tree/0368191127568e48aef6f7bda2ff3900e8e24756/skills/lightweight-charts-react-components)
commit `0368191127568e48aef6f7bda2ff3900e8e24756`。原作者：ukorvl。
保留 [MIT 授權條款](LICENSE) 與所有九份參考食譜。在[即時更新](references/market-data-and-live-updates.md)中的本機修正拒絕了格式錯誤的時間戳記並解釋了測試版本的響應式更新限制；[時段覆蓋圖層](references/session-overlays-and-primitives.md)釐清了基元更新回呼。
其餘七份參考文件與 MIT 宣告維持不變。本目錄複本新增了來源屬名與操作邊界；這並不代表 TradingView 的背書認可。

食譜會產生應用程式程式碼且可能會變更依賴項。請遵循使用者所要求的範圍與主機的核准政策。資料摘要存取屬於應用程式獨立授權的配接器；請勿將憑證放入用戶端程式碼中。交
易標記僅為視覺標註，並非訂單執行或伺服器端快訊。在本機檢查中使用合成資料，並回報仍未經測試的瀏覽器/摘要行為。
