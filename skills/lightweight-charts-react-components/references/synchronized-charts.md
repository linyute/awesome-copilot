# 同步圖表

當獨立的圖表卡片需要共用捲動、縮放與游標時使用此功能：例如基準旁的價格圖表或兩個獨立的儀表板小工具。對於垂直堆疊檢視中的價格、成交量與指標，請先使用[包含多個面板的單一圖表](price-volume-and-indicators.md)；共用的水平刻度已經提供了該協調功能。

此函式庫沒有專用的同步元件；以下配方結合了公開的圖表與時間刻度 API。

## 選擇同步座標

| 關聯性                                       | 要同步的範圍                  | 限制條件                                     |
| -------------------------------------------- | ----------------------------- | -------------------------------------------- |
| 相同的時間戳記網格                           | 時間邊界或邏輯邊界            | 兩個圖表中具有相同的時間／索引含義           |
| 不同的日曆或遺漏的 K 線                      | 時間邊界                      | 邏輯索引 50 不一定代表相同的日期             |
| 僅具有相同的可見 K 線數量                    | 邏輯邊界                      | 這不一定代表日曆對齊                         |

以下配方要求**兩個圖表中具有相同且完整的 UTC 秒數網格**。使用時間邊界以確保預期的日曆視窗是明確的。在歷史記錄不同的情況下，上游的範圍修剪可能會產生競爭範圍；請先將共用領域標準化，或使用指定的領導者與具備記錄的跟隨者修剪策略。請勿在不相容的領域上盲目使用雙向回呼。

## 配方：具備範圍與十字準線同步的雙線圖

`first` 與 `second` 包含已排序、唯一且具有相同時間戳記的實數數值點。在兩個快照都載入後按資料集識別進行掛載。圖表寬度可以不同：時間邊界同步的是顯示的日期，而非像素間距。在將時間／數值轉移至另一個系列時，`CrosshairMode.Normal` 可保持游標行為可預測。

```tsx
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CrosshairMode } from "lightweight-charts";
import type {
  IChartApi,
  IRange,
  LineData,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import {
  Chart,
  LineSeries,
  TimeScale,
  type ChartApiRef,
  type SeriesApiRef,
} from "lightweight-charts-react-components";

type Side = "first" | "second";
type Point = LineData<UTCTimestamp>;

export function SynchronizedCharts({
  first,
  second,
}: {
  first: Point[];
  second: Point[];
}) {
  const firstChart = useRef<ChartApiRef<Time, IChartApi>>(null);
  const secondChart = useRef<ChartApiRef<Time, IChartApi>>(null);
  const firstSeries = useRef<SeriesApiRef<"Line">>(null);
  const secondSeries = useRef<SeriesApiRef<"Line">>(null);
  const forwardingRange = useRef(false);
  const pointerOwner = useRef<Side | null>(null);
  const firstValues = useMemo(
    () => new Map(first.map(point => [point.time, point.value])),
    [first]
  );
  const secondValues = useMemo(
    () => new Map(second.map(point => [point.time, point.value])),
    [second]
  );

  const forwardRange = useCallback((source: Side, range: IRange<Time> | null) => {
    if (!range || forwardingRange.current) return;
    const target = (source === "first" ? secondChart : firstChart).current
      ?.api()
      ?.timeScale();
    if (!target) return;
    const existing = target.getVisibleRange();
    // 相等性也會在清除同步防護後停止延遲的通知。
    // 此處的輸入專門使用數值時間戳記。
    if (existing?.from === range.from && existing?.to === range.to) return;
    forwardingRange.current = true;
    try {
      target.setVisibleRange(range);
    } finally {
      forwardingRange.current = false;
    }
  }, []);

  const forwardCrosshair = useCallback(
    (source: Side, param: MouseEventParams) => {
      // 只有目前位於使用者指標下方的圖表才能引導。
      // 跟隨者上的程式化變更不得成為來源上的新輸入。
      if (pointerOwner.current !== source) return;
      const targetChart = (source === "first" ? secondChart : firstChart).current?.api();
      const targetSeries = (
        source === "first" ? secondSeries : firstSeries
      ).current?.api();
      const values = source === "first" ? secondValues : firstValues;
      if (!targetChart || !targetSeries) return;
      const value =
        typeof param.time === "number"
          ? values.get(param.time as UTCTimestamp)
          : undefined;
      if (!param.point || value === undefined || typeof param.time !== "number") {
        targetChart.clearCrosshairPosition();
        return;
      }
      // 匹配的時間使用目標自己的數值，絕不使用來源的價格或
      // y 像素。目標系列提供正確的價格刻度與面板。
      targetChart.setCrosshairPosition(value, param.time, targetSeries);
    },
    [firstValues, secondValues]
  );

  useEffect(() => {
    let frame = 0;
    const initialize = () => {
      const a = firstChart.current?.api();
      const b = secondChart.current?.api();
      if (!a || !b || !firstSeries.current?.api() || !secondSeries.current?.api()) {
        frame = requestAnimationFrame(initialize);
        return;
      }
      a.timeScale().fitContent();
      const range = a.timeScale().getVisibleRange();
      if (range) b.timeScale().setVisibleRange(range);
    };
    initialize();
    return () => cancelAnimationFrame(frame);
  }, []);

  const leave = () => {
    pointerOwner.current = null;
    firstChart.current?.api()?.clearCrosshairPosition();
    secondChart.current?.api()?.clearCrosshairPosition();
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: 16,
      }}
    >
      <Chart
        ref={firstChart}
        options={{ autoSize: true, crosshair: { mode: CrosshairMode.Normal } }}
        containerProps={{
          style: { height: 300 },
          onPointerEnter: () => {
            pointerOwner.current = "first";
          },
          onPointerLeave: leave,
        }}
        onCrosshairMove={param => forwardCrosshair("first", param)}
      >
        <LineSeries ref={firstSeries} data={first} options={{ color: "#2563eb" }} />
        <TimeScale onVisibleTimeRangeChange={range => forwardRange("first", range)} />
      </Chart>
      <Chart
        ref={secondChart}
        options={{ autoSize: true, crosshair: { mode: CrosshairMode.Normal } }}
        containerProps={{
          style: { height: 300 },
          onPointerEnter: () => {
            pointerOwner.current = "second";
          },
          onPointerLeave: leave,
        }}
        onCrosshairMove={param => forwardCrosshair("second", param)}
      >
        <LineSeries ref={secondSeries} data={second} options={{ color: "#ea580c" }} />
        <TimeScale onVisibleTimeRangeChange={range => forwardRange("second", range)} />
      </Chart>
    </div>
  );
}
```

在適應懸停行為不同的觸控輸入時，使用 `onPointerDown` 作為另一個設定擁有者的訊號。包裝器會清理 `TimeScale` 與圖表訂閱；此配方僅清理其自身的就緒訊號訊框。請勿在單獨的 effect 中移除包裝器擁有的原生圖表。

## 適配與失敗模式

對於相同網格上的 K 線內精度或未來的右側空格，邏輯邊界可以比時間邊界更好地保留分數 K 線位置。一致地將範圍回呼以及 getter/setter 替換為其邏輯變體，並在設定前比較兩個數值端點。同時保留重入防護。

對於不同的日曆，如上所述依精確時間解析目標十字準線，並在遺漏時予以清除。若產品需要最近前項匹配，請仔細實作該搜尋並在懸停 UI 中指出實際匹配的時間戳記。切勿複製來源 y 像素或在具有不同單位的目標上使用其價格。

兩個獨立調整大小的圖表可能會在資料變更後破壞同步。讓選定的領導者在兩個資料集都更新後選擇檢視；跟隨者圖表不應在每次 tick 時都調整大小。對於大型儀表板網格，在應用程式中儲存一個共用範圍，並僅在端點變更時進行廣播。

## 驗收檢查

- 平移／縮放任一圖表，並驗證另一個圖表顯示相符的日期且沒有事件迴圈。測試不同的寬度以及卡片的大小調整。
- 雙向移動十字準線。目標會在同一時間選擇自己的數值，即使某一系列的數值大上 100 倍。
- 離開卡片或懸停在遺漏的資料上：跟隨者游標會被清除。程式化更新絕不能成為新的十字準線領導者。
- 在新的資料集金鑰下重新掛載，並驗證舊的回呼／訊框不會保留已移除的圖表。測試適配期間新增的任何日曆策略。
