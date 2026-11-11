# 暫留圖例與工具提示

當需要「在游標下方顯示 OHLC」、常駐顯示最新 bar 的圖例或浮動詳細資訊方塊時使用此指引。圖表渲染在 canvas 上；包裝器提供事件處理常式，但不提供工具提示或圖例的 UI。請將 HTML 詳細資訊與圖表並列放置在具備定位設定的應用程式容器中。

## 架構選擇

- 在 `Chart` 上使用 `onCrosshairMove`；包裝器負責訂閱與清理。切勿為同一個處理常式重複呼叫 `subscribeCrosshairMove()`。
- 透過 `seriesRef.current.api()` 回傳的**原生系列 API** 查閱 `param.seriesData`。此 Map 不是以包裝器 ref 或字串 ID 作為鍵值。
- 該 Map 在特定時間可能會省略某個系列。在讀取數值前，請先檢查其是否存在以及是否具備合適的結構（K 線為 `close`，折線/柱狀圖為 `value`）。
- 依時間記錄選取項目，並從應用程式快照中讀取當前資料。這樣一來，即使指標保持不動，更新當前暫留的 K 線時圖例亦會隨之更新。若僅比較時間戳記將會留下過期的 OHLC 數值。
- 忽略相同的選取/位置更新。原生選項/資料更新可能會觸發 crosshair 事件；每次都建立新的 React 狀態可能會回饋至另一次選項更新，進而導致重新渲染死循環。此處選取相等性是安全的，因為顯示的 OHLC 來自當前資料，而非快取的事件數值。
- `param.point` 是相對於圖表面板的本機座標，而非整個可視區域（viewport）。本食譜適用於單一面板；若要在多面板圖表上顯示工具提示，請加上每個面板的 DOM 偏移量。

## 食譜：即時 OHLC 圖例與邊界限制的工具提示

`data` 為正規化、按時間遞增排序且時間不重複的 UTC 秒數 K 線資料；初始快照在掛載前已準備就緒。應用程式透過完整陣列管理即時更新。請將此作為單一元件模組複製。詳細資訊為 React 文字，因此交易代號標籤與數值不會被插值注入 `innerHTML`。

```tsx
import { useCallback, useMemo, useRef, useState } from "react";
import type { CandlestickData, MouseEventParams, UTCTimestamp } from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  TimeScale,
  TimeScaleFitContentTrigger,
  type SeriesApiRef,
} from "lightweight-charts-react-components";

type Hover = { time: UTCTimestamp; x: number; y: number };
const tooltipWidth = 190;
const tooltipHeight = 96;
const chartOptions = { autoSize: true, timeScale: { timeVisible: true } };

export function CandleDetails({
  symbol,
  data,
}: {
  symbol: string;
  data: CandlestickData<UTCTimestamp>[];
}) {
  const seriesRef = useRef<SeriesApiRef<"Candlestick">>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const byTime = useMemo(() => new Map(data.map(bar => [bar.time, bar])), [data]);
  const selected = hover ? byTime.get(hover.time) : undefined;
  // 離開繪圖區、缺失資料與空資料集均屬不同狀態。
  const legend = selected ?? data[data.length - 1];

  const onCrosshairMove = useCallback((param: MouseEventParams) => {
    const series = seriesRef.current?.api();
    const container = containerRef.current;
    const point = param.point;
    if (
      !series ||
      !container ||
      !point ||
      typeof param.time !== "number" ||
      point.x < 0 ||
      point.y < 0 ||
      point.x > container.clientWidth ||
      point.y > container.clientHeight
    ) {
      setHover(null);
      return;
    }
    const bar = param.seriesData.get(series);
    if (!bar || !("close" in bar)) {
      setHover(null);
      return;
    }
    // 在與具備定位設定的圖表容器相同的座標系統中限制邊界。
    // 若卡片寬度窄於工具提示，CSS 亦會縮小其寬度。
    const width = Math.min(tooltipWidth, container.clientWidth);
    const x = Math.max(0, Math.min(point.x + 12, container.clientWidth - width));
    const y = Math.max(0, Math.min(point.y + 12, container.clientHeight - tooltipHeight));
    const next = { time: param.time as UTCTimestamp, x, y };
    // 原生更新可能在指標未移動的情況下觸發相同的十字準星事件。
    // 在此情況下保留狀態標識；當前資料依然會重新整理 OHLC。
    setHover(previous =>
      previous?.time === next.time && previous.x === x && previous.y === y
        ? previous
        : next
    );
  }, []);

  const describe = (bar: CandlestickData<UTCTimestamp>) =>
    `O ${bar.open.toFixed(2)} · H ${bar.high.toFixed(2)} · L ${bar.low.toFixed(2)} · C ${bar.close.toFixed(2)}`;

  return (
    <section style={{ minWidth: 0 }}>
      <p>
        {symbol}: {legend ? describe(legend) : "No data"}
      </p>
      <div style={{ position: "relative" }}>
        <Chart
          containerRef={containerRef}
          containerProps={{ style: { height: 360 } }}
          options={chartOptions}
          onCrosshairMove={onCrosshairMove}
        >
          <CandlestickSeries ref={seriesRef} data={data} />
          <TimeScale>
            <TimeScaleFitContentTrigger deps={[]} />
          </TimeScale>
        </Chart>
        {hover && selected && (
          <div
            style={{
              position: "absolute",
              left: hover.x,
              top: hover.y,
              width: tooltipWidth,
              maxWidth: "100%",
              height: tooltipHeight,
              boxSizing: "border-box",
              padding: 10,
              background: "#0f172a",
              color: "white",
              borderRadius: 4,
              pointerEvents: "none", // 暫留詳細資訊絕不能搶奪圖表的指標事件。
              zIndex: 2,
            }}
          >
            <strong>{symbol}</strong>
            <div>{new Date(selected.time * 1000).toISOString().slice(0, 16)} UTC</div>
            <div style={{ fontSize: 12 }}>{describe(selected)}</div>
          </div>
        )}
      </div>
    </section>
  );
}
```

純 2 位小數點格式化器僅適用於具備該精準度的資產。針對其他 tick 大小，請使用與系列 `priceFormat` 相同的精準度。對於商業日期，請直接格式化日期欄位；數值型時間戳記為 epoch 秒數，在建構 `Date` 之前需要先乘以 1000。

當暫留的系列無資料時，本食譜會回退顯示最新的 K 線。若使用者希望區分「資料間隙」與「離開圖表」，請保留明確的「間隙」狀態，並改為顯示「此時間點無 bar」。時區或語系格式化器只會改變標籤文字，絕不會改變底層的 bar 時間戳記。

## 調整適配：多個系列或固定圖例

針對多條折線，保留以穩定的應用程式系列 ID 為索引的 ref。針對每個系列，取得其原生 API，接著讀取 `param.seriesData.get(api)`。當 Map 中無點時顯示 `—`；切勿在相同的邏輯索引處顯示其他資產的數值。標籤/顏色應從應用程式的 ID 映射中衍生，而非取決於 Map 項目剛好出現的順序。

針對固定圖例，請省略浮動方塊與位置更新。保留選取的時間，並如上所述從最新資料中衍生顯示的數值。針對極高的指標事件觸發頻率，使用 `requestAnimationFrame` 批次處理 HTML 更新；並在清理時取消擱置的畫面幀。避免在單次十字準星回呼中為每個系列分別寫入 React 狀態。

針對掛載在 `document.body` 上的可滾動 portal 中的工具提示，使用 `getBoundingClientRect()` 與 portal 的定位模型轉換圖表本機座標。切勿將本機的 x/y 不加修飾地直接重複用作頁面座標。在多面板情境下，`param.paneIndex` 用於識別來源面板；計算其偏移量或將工具提示放置在對應的面板容器內部。

## 驗收檢查

- 暫留於第一個/最後一個 bar 以及空白處；離開 canvas 與價格軸。缺失的 Map 項目絕不會拋出例外狀況，浮動方塊應消失，且圖例應回退顯示。
- 在不移動指標的情況下，更新相同時間戳記處暫留的 K 線。其 OHLC 數值應在圖例與工具提示中即時變動。
- 在狹窄寬度下暫留於四個邊緣附近。浮動方塊應保持在圖表內部，且不會阻礙拖曳、滾動或十字準星移動。
- 當僅有暫留時間戳記相符時，請勿抑制圖例更新：即時同 bar 修訂會保留時間但變更數值。在讀取 K 線欄位之前，防範查閱項目缺失的情況。
- 針對多系列適配，測試不同行事曆與資料點缺失的情境。
