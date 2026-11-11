# 市場資料與即時更新

當建構報價畫面或交易終端機，需要先載入 OHLC 歷史資料並接著從 WebSocket 接收 bar 快照時使用此指引。常見痛點包括重複的時間戳記、將毫秒誤當成秒、重新擷取後的過期 K 線，以及當使用者在檢視歷史資料時圖表持續向外縮放。

## 決定由誰擁有完整歷史資料

| 資料流向 | 實作方式 | 原因 |
| ------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| 中等更新頻率；其他 React UI 需要歷史資料 | `data` 傳入完整陣列，預設 `reactive` | 圖表與應用程式具備單一真實數據來源（Single source of truth） |
| 快照、重新擷取、前置附加、修剪或歷史資料修正 | 替換完整陣列；可選 `alwaysReplaceData` | 圖表必須精確符合所提供的歷史資料 |
| 頻繁的 tick；圖表無需每個 tick 均執行 React 渲染 | `reactive={false}`，接著使用 `ref.current.api()?.update(bar)` | 圖表擁有持續性的更新；React 擁有其生命週期 |

響應式 `data` 一律代表**整體預期的完整資料集**。傳入 `[latestBar]` 會直接取代整個歷史資料。包裝器的增量更新機制會將先前的項目參照與 `series.data()` 進行比對。在包裝器 **2.6.1** 與 Lightweight Charts **5.2.1** 下，該 API 會重建 K 線與折線物件，因此即使 React 保留了先前的物件參照，多 bar 尾端替換與附加依然會呼叫 `setData()`。在此基準版本上請將 React 擁有的食譜視為完整歷史資料替換。針對頻繁的增量寫入，請使用下方圖表擁有的食譜，搭配 `reactive={false}` 與明確的 `series.update(bar)`。

`reactive={false}` 在初始化期間仍會呼叫 `setData(data)`。它會忽略後續的 data prop 變更。切勿將命令式 tick 與可能覆寫它們的響應式快照混合使用。

## 在邊界處正規化資料摘要

此配接器預期接收**完整的 K 線快照**，而非個別成交明細。若資料摘要包含逐筆成交價格，請在上游完成 OHLC 聚合。`timestampMs` 為 UTC 毫秒的 bar 開盤時刻。在回應中較晚出現、修訂同一根 bar 的有效負載將會勝出。無效資料會直接被拒絕而非予以繪製。

```ts file=market-data.ts
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export type Candle = CandlestickData<UTCTimestamp>;
export type WireCandle = {
  timestampMs: number;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
};

export function normalizeCandle(row: WireCandle): Candle {
  // 拒絕將 null、字串與布林值在執行時期強制轉型為 epoch 秒數。
  if (typeof row.timestampMs !== "number") {
    throw new Error("Invalid candle timestamp");
  }
  const seconds = row.timestampMs / 1000;
  const prices = [row.open, row.high, row.low, row.close].map(value => {
    // 傳輸型別在執行時期並非保證，且 Number() 會將 null 與空白字串轉換為 0，這會通過下方的範圍檢查。
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    throw new Error("Missing OHLC price");
  });
  const [open, high, low, close] = prices;
  if (
    !Number.isSafeInteger(seconds) ||
    !prices.every(Number.isFinite) ||
    low > Math.min(open, close) ||
    high < Math.max(open, close) ||
    low > high
  ) {
    throw new Error("Invalid candle snapshot");
  }
  // 該品牌型別（brand）表達經過驗證的 epoch 秒數；它不執行轉換。
  return { time: seconds as UTCTimestamp, open, high, low, close };
}

export function normalizeHistory(rows: WireCandle[]): Candle[] {
  const byTime = new Map<UTCTimestamp, Candle>();
  for (const row of rows) {
    const candle = normalizeCandle(row);
    byTime.set(candle.time, candle);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

export function upsertLatest(history: Candle[], bar: Candle): Candle[] {
  const last = history[history.length - 1];
  if (!last || bar.time > last.time) return [...history, bar];
  if (bar.time === last.time) return [...history.slice(0, -1), bar];
  // 此僅限尾端的路徑會拒絕較晚到達的歷史資料。請將修訂分開統整為完整快照，然後替換資料而非附加資料。
  return history;
}
```

當資料來源為日曆日系列時，將每日商業日期保留為 `YYYY-MM-DD` 或 `BusinessDay`。切勿透過瀏覽器的本地時區轉換這些日期。日內資料摘要應一律使用 UTC 秒數。切勿混用時間表示法，或根據任意閥值推斷秒數或毫秒數。

## 食譜：React 擁有的即時 K 線

將上方的配接器儲存為 `market-data.ts`，接著將此元件儲存為 `LiveCandles.tsx`。訂閱配接器會傳遞正規化後的完整 K 線並回傳取消訂閱函式。它必須利用提供者的游標/重播協定來彌補快照到訂閱之間的間隙。當提供者具備序號時，亦必須使用該序號拒絕過期的同 bar 修訂；單憑時間戳記順序無法為同一根 K 線的修訂排序。

```tsx file=LiveCandles.tsx
import { useEffect, useState } from "react";
import {
  CandlestickSeries,
  Chart,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";
import { upsertLatest, type Candle } from "./market-data";

export type SubscribeBars = (receive: (bar: Candle) => void) => () => void;

export function LiveCandles({
  initialData,
  subscribe,
}: {
  initialData: Candle[];
  subscribe: SubscribeBars;
}) {
  // 當資料集本體改變時，請使用包含 symbol + interval + snapshot revision 的 key 進行掛載。initialData 是特意設計為掛載時期的初始種子。
  const [data, setData] = useState<Candle[]>(() => initialData.map(bar => ({ ...bar })));

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribe(bar => {
      if (active) setData(previous => upsertLatest(previous, { ...bar }));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [subscribe]);

  return (
    <section style={{ minWidth: 0 }}>
      <Chart
        containerProps={{ style: { height: 360, width: "100%" } }}
        options={{
          autoSize: true,
          timeScale: { timeVisible: true, secondsVisible: false },
        }}
      >
        <CandlestickSeries data={data} />
        <TimeScale>
          {/* 穩定的 trigger 僅 fit 一次。每次 tick 必須保留使用者的縮放狀態。 */}
          <TimeScaleFitContentTrigger deps={[]} />
        </TimeScale>
      </Chart>
    </section>
  );
}
```

包裝器本身預設僅將 `addDefaultPane` 設為 `false`；它**不會**啟用 `autoSize`。請明確設定 `autoSize: true` 並給予包裝器非零的高度。寬度可遵循其父元素。Flex/grid 卡片通常需要在卡片上設定 `minWidth: 0` 以允許縮小。DOM 節點請使用 `containerRef`，圖表 API 包裝器請使用 `ref`；這是兩種不同的參照。

針對 Next.js App Router 整合，請在圖表用戶端模組頂部加入 `"use client"`。若外圍設定仍無法預先渲染圖表，請透過帶有 `ssr: false` 的用戶端動態邊界載入該模組。切勿在伺服器端渲染期間存取 `window` 或建立圖表 API。有關該邊界的配置位置，請參閱 [Next.js 僅限用戶端載入指引](https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr)。

## 食譜：圖表擁有的 Tick

當圖表必須處理大量快照且無需為每個快照觸發 React 渲染時，請使用此替代方案。訂閱合約保持相同。圖表與系列 ref 會公開包裝器物件：原生 API 由 `.api()` 回傳。在初始化完成前，非 null 的包裝器 ref 仍可能包含 null 的 API。

```tsx
import { useEffect, useRef, useState } from "react";
import type { IChartApi, Time, UTCTimestamp } from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  type ChartApiRef,
  type SeriesApiRef,
} from "lightweight-charts-react-components";
import type { Candle } from "./market-data";
import type { SubscribeBars } from "./LiveCandles";

export function ImperativeCandles({
  initialData,
  subscribe,
}: {
  initialData: Candle[];
  subscribe: SubscribeBars;
}) {
  const chartRef = useRef<ChartApiRef<Time, IChartApi>>(null);
  const seriesRef = useRef<SeriesApiRef<"Candlestick">>(null);
  // 種子保持穩定；針對其他資料集本體請使用新的 key 掛載。
  const [seed] = useState(() => initialData.map(bar => ({ ...bar })));

  const fitted = useRef(false);

  useEffect(() => {
    let active = true;
    let frame = 0;
    let unsubscribe: (() => void) | undefined;

    const startWhenReady = () => {
      if (!active) return;
      const chart = chartRef.current?.api();
      const series = seriesRef.current?.api();
      if (!chart || !series) {
        frame = requestAnimationFrame(startWhenReady);
        return;
      }
      // 初始化後 fit 一次，接著將可視區域交由使用者控制。
      if (!fitted.current) {
        fitted.current = true;
        chart.timeScale().fitContent();
      }
      // 重新訂閱後系列可能包含比種子更新的 bar，且 update() 在遇到早於系列尾端的 bar 時會擲出錯誤。
      const current = series.data();
      let lastTime = current[current.length - 1]?.time as UTCTimestamp | undefined;
      unsubscribe = subscribe(bar => {
        if (!active || (lastTime !== undefined && bar.time < lastTime)) return;
        series.update({ ...bar });
        lastTime = bar.time;
      });
    };
    startWhenReady();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      unsubscribe?.();
    };
  }, [subscribe]);

  return (
    <Chart
      ref={chartRef}
      options={{ autoSize: true, timeScale: { timeVisible: true } }}
      containerProps={{ style: { height: 360 } }}
    >
      <CandlestickSeries ref={seriesRef} data={seed} reactive={false} />
    </Chart>
  );
}
```

保持 `subscribe` 穩定：每個新函式都會關閉並重新開啟資料摘要。

針對明確的「即時 (Live)」控制項，從控制項處理常式呼叫 `chartRef.current?.api()?.timeScale().scrollToRealTime()`。`fitContent()` 會顯示整個資料集；它不代表「跟隨最後一根 bar」。上游的 `shiftVisibleRangeOnNewBar` 通常僅在最後一根 bar 可見時才會平移。針對受控的跟隨模式，關閉自動平移，並僅在啟用跟隨模式時於接受更新後進行滾動。

## 失敗模式與驗收檢查

- 當修正較舊的 bar 時重新建構完整的快照。僅限尾部的範例會特意忽略較舊的更新；重新連線復原時必須替換歷史資料。
- 若需要，可透過停止/緩衝資料摘要的套用來暫停繪製。切換 `reactive` 不會停止通訊端連線，也不會為命令式圖表提供重播緩衝區。
- 修剪或批次附加可能會呼叫 `setData()`；請勿就地異動先前的物件並期望包裝器能偵測到該異動。
- 避免在每次渲染時複製整個資料集（例如在 JSX 中使用 `data.map(...)`）：這會造成不必要的配置並可能重新觸發響應式資料 effect。保留參照並不能繞過上述基準版本中 `setData()` 的限制。當頻繁完整替換開銷巨大時，請使用圖表擁有的食譜。
- 確認初始資料已排序且無重複；相同時間的更新只會精確替換一根 bar；較晚時間的更新會新增一根；較早時間的更新會遵循所選的修正策略。向左平移、更新，並驗證使用者的可視區域維持不變。
- 在圖表擁有的食譜中，在即時 bar 到達後變更 `subscribe` 並重播較舊的 bar：不得拋出任何例外狀況，該 bar 會被忽略，且可視區域不會移動。
- 變更交易代號/時間間隔，並驗證舊的訂閱已被清除且無舊 bar 進入新圖表。檢查狹窄卡片與用戶端渲染路由以確保 canvas 具備非零尺寸。
