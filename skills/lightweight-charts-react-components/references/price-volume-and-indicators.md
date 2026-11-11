# 價格、成交量與指標

適用於包含 K 線、移動平均線、成交量，以及可選震盪指標的技術分析檢視。其架構取決於**單位**，而非系列類型：SMA 共用價格軸；成交量需要獨立的刻度；RSI 通常需要自己的面板。指標是由應用程式提供的資料系列；包裝器不會計算它們或擷取市場資料。

## 在新增系列之前選擇版面配置

| 預期結果                     | 放置位置與刻度                                 | 原因                                          |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------- |
| K 線與 SMA                   | 相同 `Pane`，`priceScaleId: "right"`           | 兩者的數值都是價格                            |
| 易讀的成交量面板             | 獨立的 `Pane`，擁有自己的右側刻度              | 成交量不能壓縮價格刻度                        |
| K 線下方的緊湊成交量         | 相同面板，成交量使用 `priceScaleId: "volume"`  | 具有底部邊界的獨立疊加刻度                    |
| 具備閾值線的 RSI             | 獨立面板；RSI 系列擁有這些線條                 | 不同的單位與有用的固定邊界                    |

當圖表共用金融商品與時間軸時，偏好使用包含多個面板的單一圖表。它們會自動共用水平刻度與十字準線；不需要雙圖表同步程式碼。`stretchFactor` 是相對權重，而不是像素。明確的 `Pane` 元件也為浮水印與面板基元提供有效的面板情境。

## 配方：價格／SMA、成交量、可選的 RSI

此元件預期接收標準化、遞增且唯一的 UTC 秒數 K 線，且每根 K 線均附帶成交量。它從上游計算接收 RSI（例如 Wilder RSI-14），而不是暗中實作不同的 RSI 公式。數值是介於 0–100 範圍內的數字。它們的時間戳記必須參照此 K 線網格；指標可以省略其初始的準備期（warm-up period）。

本地的 SMA 是簡單的追蹤算術平均數，包含目前的 K 線。其準備期點位是空格點（whitespace），而非零價格。重新計算適用於中等長度的歷史記錄；高頻應用程式可以使用相同的週期與時間戳記約定，在其資料層中以增量方式計算。

```tsx
import { useMemo, useState } from "react";
import type {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
  WhitespaceData,
} from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  HistogramSeries,
  LineSeries,
  Pane,
  PriceLine,
  TimeScale,
  TimeScaleFitContentTrigger,
  WatermarkText,
} from "lightweight-charts-react-components";

type CandleWithVolume = CandlestickData<UTCTimestamp> & { volume: number };
type SmaPoint = LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>;

export function trailingSma(candles: CandleWithVolume[], period: number): SmaPoint[] {
  if (!Number.isInteger(period) || period < 1) throw new Error("Invalid SMA period");
  let sum = 0;
  return candles.map((bar, index) => {
    sum += bar.close;
    if (index >= period) sum -= candles[index - period].close;
    return index + 1 < period
      ? { time: bar.time }
      : { time: bar.time, value: sum / period };
  });
}

export function AnalysisChart({
  candles,
  rsi,
  datasetId,
}: {
  candles: CandleWithVolume[];
  rsi: LineData<UTCTimestamp>[];
  datasetId: string;
}) {
  const [showRsi, setShowRsi] = useState(true);
  const price = useMemo(
    () =>
      candles.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      })),
    [candles]
  );
  const volume = useMemo<HistogramData<UTCTimestamp>[]>(
    () =>
      candles.map(bar => ({
        time: bar.time,
        value: bar.volume,
        color: bar.close >= bar.open ? "#26a69a80" : "#ef535080",
      })),
    [candles]
  );
  const sma = useMemo(() => trailingSma(candles, 20), [candles]);

  return (
    <section>
      <button onClick={() => setShowRsi(value => !value)}>
        {showRsi ? "Hide RSI" : "Show RSI"}
      </button>
      <Chart
        key={datasetId}
        options={{ autoSize: true, layout: { panes: { enableResize: true } } }}
        containerProps={{ style: { height: 540 } }}
      >
        <Pane stretchFactor={3}>
          <CandlestickSeries data={price} options={{ priceScaleId: "right" }} />
          <LineSeries
            data={sma}
            options={{
              priceScaleId: "right",
              color: "#2962ff",
              lineWidth: 2,
              priceLineVisible: false,
            }}
          />
          <WatermarkText
            lines={[{ text: "PRICE + SMA 20", color: "#64748b80", fontSize: 14 }]}
          />
        </Pane>
        <Pane stretchFactor={1}>
          <HistogramSeries
            data={volume}
            options={{ priceFormat: { type: "volume" }, priceLineVisible: false }}
          />
          <WatermarkText lines={[{ text: "VOLUME", color: "#64748b80", fontSize: 14 }]} />
        </Pane>
        {showRsi && (
          <Pane stretchFactor={1}>
            <LineSeries
              data={rsi}
              options={{
                color: "#a855f7",
                priceLineVisible: false,
                // 透過系列提供邊界，因此正確的面板刻度
                // 會受到限制，而無需圖表層級的刻度查詢。
                autoscaleInfoProvider: () => ({
                  priceRange: { minValue: 0, maxValue: 100 },
                }),
              }}
            >
              <PriceLine
                price={70}
                options={{ title: "70", color: "#a855f7", lineStyle: 2 }}
              />
              <PriceLine
                price={30}
                options={{ title: "30", color: "#a855f7", lineStyle: 2 }}
              />
            </LineSeries>
            <WatermarkText
              lines={[{ text: "RSI 14", color: "#64748b80", fontSize: 14 }]}
            />
          </Pane>
        )}
        <TimeScale>
          {/* 面板可見性變更不應重設水平縮放。 */}
          <TimeScaleFitContentTrigger deps={[]} />
        </TimeScale>
      </Chart>
    </section>
  );
}
```

在初始快照準備就緒後掛載此元件。`datasetId` 僅在代號、間隔或預期的初始檢視變更時改變，而不是在每次即時 tick 時改變。全新的指標陣列合理地導致完全替換。若頻繁重新計算代價高昂，請將其移至資料擁有者中，而不是變異圖表輸入物件。

## 配方：具備正確刻度擁有者的緊湊成交量疊加

目前的 `PriceScale` 元件需要 `Pane`，但其實作呼叫 `chart.priceScale(id)` 時未帶面板索引。在後續面板中，這可能會以面板零為目標，且命名的疊加刻度可能不存在於該處。請勿使用 `<PriceScale id="volume" />` 作為建立疊加刻度的機制。使用 `priceScaleId: "volume"` 建立成交量系列會建立／使用該刻度；然後 `volumeSeries.api().priceScale()` 會以其實際面板為目標。

將此替代方案複製為獨立模組。就緒迴圈處理在原生系列存在之前指派包裝器 ref 的情況。清理僅取消該迴圈；包裝器擁有系列與圖表的移除。

```tsx
import { useEffect, useRef } from "react";
import type { CandlestickData, HistogramData, UTCTimestamp } from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  HistogramSeries,
  Pane,
  TimeScale,
  TimeScaleFitContentTrigger,
  type SeriesApiRef,
} from "lightweight-charts-react-components";

export function PriceWithVolumeOverlay({
  price,
  volume,
}: {
  price: CandlestickData<UTCTimestamp>[];
  volume: HistogramData<UTCTimestamp>[];
}) {
  const priceRef = useRef<SeriesApiRef<"Candlestick">>(null);
  const volumeRef = useRef<SeriesApiRef<"Histogram">>(null);

  useEffect(() => {
    let frame = 0;
    const configureScales = () => {
      const priceSeries = priceRef.current?.api();
      const volumeSeries = volumeRef.current?.api();
      if (!priceSeries || !volumeSeries) {
        frame = requestAnimationFrame(configureScales);
        return;
      }
      priceSeries
        .priceScale()
        .applyOptions({ scaleMargins: { top: 0.05, bottom: 0.25 } });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    };
    configureScales();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Chart options={{ autoSize: true }} containerProps={{ style: { height: 360 } }}>
      <Pane>
        <CandlestickSeries
          ref={priceRef}
          data={price}
          options={{ priceScaleId: "right" }}
        />
        <HistogramSeries
          ref={volumeRef}
          data={volume}
          options={{
            priceScaleId: "volume",
            priceFormat: { type: "volume" },
            priceLineVisible: false,
            lastValueVisible: false,
          }}
        />
      </Pane>
      <TimeScale>
        <TimeScaleFitContentTrigger deps={[]} />
      </TimeScale>
    </Chart>
  );
}
```

名為 `volume` 的疊加刻度本身沒有可見的價格軸。當使用者需要成交量軸標籤時，請使用獨立面板或可見的左側軸。邊界保留獨立刻度上的垂直區域；它們不會重新縮放或正規化輸入資料。若以命令式方式將系列移至另一個面板，請在移動後重新取得其 `priceScale()`，而不是保留先前的刻度控制代碼。

## 驗收檢查

- 當成交量增加數個數量級時，價格仍保持清晰易讀。確認 SMA 與 K 線使用相同的單位與右側刻度。
- 當少於 20 根 K 線時，SMA 為空格點。在第 20 根 K 線處，它等於前 20 個收盤價的平均值。替換最後一根 K 線會重新計算其 SMA。
- RSI 保持在 0–100 軸上；30/70 線僅屬於 RSI。切換其面板並驗證現有系列仍保留在其原始面板上，且縮放保持不變。
- 在調整配方時於後續面板中轉譯疊加層：其刻度必須來自成交量系列，在面板零上沒有不正確的 ID 錯誤。
