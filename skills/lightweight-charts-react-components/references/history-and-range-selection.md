# 歷史資料與範圍選取

當使用者向左滾動以擷取較舊的 bar、選取不同的交易代號或時間間隔，或在預設檢視視窗之間切換時使用此指引。這些是不同的操作：新增歷史資料應保留目前檢視畫面、變更資料集本體應重設檢視畫面，而選擇時間視窗在所需資料已載入時應僅改變可見範圍。

## 食譜：前置附加較舊歷史資料且不遺失正在檢視的 bar

這是一個**單一系列日間圖表**。`initialData` 為非空、按時間遞增排序且時間不重複的 UTC 秒數折線點陣列。`loadOlder(before, signal)` 回傳正規化後的遞增點資料與明確的 `hasMore` 旗標。其游標為排除性（exclusive）的；食譜亦具備防禦性重疊去除機制。針對新資料集請掛載新的 key。配接器負責傳輸、驗證與回應資料校驗。

本食譜使用圖表擁有的資料，以便讓 `setData()` 與範圍還原能同時發生。在請求開始時擷取範圍會抵消使用者在等待期間所做的任何平移操作；應在套用回應資料前立即擷取範圍。

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IChartApi,
  LineData,
  LogicalRange,
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

type Point = LineData<UTCTimestamp>;
type HistoryPage = { data: Point[]; hasMore: boolean };
type LoadOlder = (before: UTCTimestamp, signal: AbortSignal) => Promise<HistoryPage>;

export function PaginatedHistory({
  initialData,
  loadOlder,
}: {
  initialData: Point[];
  loadOlder: LoadOlder;
}) {
  const [seed] = useState(() => initialData.map(point => ({ ...point })));
  const rows = useRef(seed);
  const chartRef = useRef<ChartApiRef<Time, IChartApi>>(null);
  const seriesRef = useRef<SeriesApiRef<"Line">>(null);
  const alive = useRef(false);
  const inFlight = useRef<AbortController | null>(null);
  const exhausted = useRef(false);
  const failed = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOlder = useCallback(async () => {
    const series = seriesRef.current?.api();
    const scale = chartRef.current?.api()?.timeScale();
    const first = rows.current[0];
    if (!alive.current || !series || !scale || !first) return;
    if (inFlight.current || exhausted.current || failed.current) return;

    // ref 可同步上鎖；在渲染前若收到多個範圍事件，僅靠 React loading 狀態會允許重複請求。
    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    setError(null);
    try {
      const page = await loadOlder(first.time, controller.signal);
      if (!alive.current || controller.signal.aborted) return;

      const byTime = new Map<UTCTimestamp, Point>();
      for (const point of page.data) {
        if (point.time < first.time) byTime.set(point.time, { ...point });
      }
      const older = [...byTime.values()].sort((a, b) => a.time - b.time);
      if (older.length === 0 && page.hasMore) {
        throw new Error("History cursor made no progress");
      }

      if (older.length > 0) {
        const visible = scale.getVisibleLogicalRange();
        rows.current = [...older, ...rows.current];
        series.setData(rows.current);
        if (visible) {
          // 每個插入的點都會使舊點的索引偏移 1。平移兩側邊界以保持相同的舊 bar 與相同的縮放寬度。
          scale.setVisibleLogicalRange({
            from: visible.from + older.length,
            to: visible.to + older.length,
          });
        }
      }
      exhausted.current = !page.hasMore;
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) {
        // 失敗後停止事件驅動的重試。讓使用者手動重試一次，避免將拖動變成失敗網路請求的死循環。
        failed.current = true;
        setError(cause instanceof Error ? cause.message : "History load failed");
      }
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
      if (alive.current) setLoading(false);
    }
  }, [loadOlder]);

  const onRange = useCallback(
    (range: LogicalRange | null) => {
      if (!range) return;
      const bars = seriesRef.current?.api()?.barsInLogicalRange(range);
      if (bars && bars.barsBefore < 20) void requestOlder();
    },
    [requestOlder]
  );

  useEffect(() => {
    alive.current = true;
    let frame = 0;
    const initializeView = () => {
      const series = seriesRef.current?.api();
      const scale = chartRef.current?.api()?.timeScale();
      if (!series || !scale) {
        frame = requestAnimationFrame(initializeView);
        return;
      }
      // 從靠近尾端的位置開始。前置附加分頁後不執行 fit trigger。
      scale.setVisibleLogicalRange({
        from: Math.max(0, seed.length - 80),
        to: seed.length - 1 + 5,
      });
      onRange(scale.getVisibleLogicalRange());
    };
    initializeView();
    return () => {
      alive.current = false;
      cancelAnimationFrame(frame);
      inFlight.current?.abort();
    };
  }, [seed, onRange]);

  return (
    <section>
      <p>{loading ? "Loading older history…" : "Scroll left for older history"}</p>
      {error && (
        <button
          onClick={() => {
            failed.current = false;
            void requestOlder();
          }}
        >
          Retry: {error}
        </button>
      )}
      <Chart
        ref={chartRef}
        options={{ autoSize: true, timeScale: { timeVisible: true } }}
        containerProps={{ style: { height: 360 } }}
      >
        <LineSeries ref={seriesRef} data={seed} reactive={false} />
        <TimeScale onVisibleLogicalRangeChange={onRange} />
      </Chart>
    </section>
  );
}
```

保持單一資料集的 `loadOlder` 穩定。改變它會重新觸發檢視初始化 effect；改變資料集應當改用新的 key 重新掛載。取消檢查機制可防範在 abort 之後依然 resolve 的傳輸協定。

上述索引平移假設每個前置附加的點都會在圖表時間軸上增加一個位置。若有多個系列，邏輯索引是指向其**時間聯集**。為所有系列建立單一對齊的時間軸，並計算新增加的時間軸位置數量。請勿依據任意指標的分頁長度進行平移。若即時摘要亦擁有尾部資料，請在回應時與當前歷史資料進行合併，並透過同一個資料擁有者套用更新；切勿讓擷取的請求快照覆寫較新的 tick。

## 食譜：具過期回應防護的代號或時間間隔替換

此處 API 回傳完整的正規化 OHLC 快照。請將此作為獨立模組複製。選取 ID 會標註每個回應，且僅為相符的結果掛載圖表。這可防止在新標籤下顯示先前的交易代號，並為新資料集提供其專屬的初始 fit。

```tsx
import { useEffect, useState } from "react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";

type Interval = "1h" | "1d";
type Selection = { symbol: string; interval: Interval };
type Snapshot = CandlestickData<UTCTimestamp>[];
type LoadSnapshot = (selection: Selection, signal: AbortSignal) => Promise<Snapshot>;

export function InstrumentHistory({ loadSnapshot }: { loadSnapshot: LoadSnapshot }) {
  const [selection, setSelection] = useState<Selection>({
    symbol: "ASSET_A",
    interval: "1d",
  });
  // effect 依賴這些值：重新點選當前間隔會建立新的選取物件，但絕不能重新擷取或重設檢視畫面。
  const { symbol, interval } = selection;
  const id = `${symbol}:${interval}`;
  const [result, setResult] = useState<{ id: string; data: Snapshot } | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setResult(null);
    setError(null);
    void loadSnapshot({ symbol, interval }, controller.signal).then(
      data => {
        if (active) setResult({ id, data });
      },
      cause => {
        if (active) {
          setError({
            id,
            message: cause instanceof Error ? cause.message : "Load failed",
          });
        }
      }
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, symbol, interval, loadSnapshot, retry]);

  const current = result?.id === id ? result : null;
  return (
    <section>
      <select
        aria-label="Instrument"
        value={selection.symbol}
        onChange={event =>
          setSelection(previous => ({ ...previous, symbol: event.target.value }))
        }
      >
        <option value="ASSET_A">Asset A</option>
        <option value="ASSET_B">Asset B</option>
      </select>
      <button onClick={() => setSelection(previous => ({ ...previous, interval: "1h" }))}>
        Hourly
      </button>
      <button onClick={() => setSelection(previous => ({ ...previous, interval: "1d" }))}>
        Daily
      </button>
      {error?.id === id ? (
        <button onClick={() => setRetry(value => value + 1)}>
          Retry: {error.message}
        </button>
      ) : !current ? (
        <p>Loading {id}…</p>
      ) : current.data.length === 0 ? (
        <p>No history for {id}</p>
      ) : (
        <Chart
          key={id}
          options={{
            autoSize: true,
            timeScale: { timeVisible: selection.interval === "1h" },
          }}
          containerProps={{ style: { height: 360 } }}
        >
          <CandlestickSeries data={current.data} alwaysReplaceData />
          <TimeScale>
            <TimeScaleFitContentTrigger deps={[]} />
          </TimeScale>
        </Chart>
      )}
    </section>
  );
}
```

提供穩定的 `loadSnapshot` 配接器。若相同代號的重新整理應保留縮放狀態，請保持圖表掛載，替換整個資料陣列，並避免觸發新的 fit trigger。本食譜在選取切換時特意進行重設，因為資料本體與時間間隔已改變。

針對已載入資料上的「上個月」這類預設時間視窗，請保持系列資料完整，並使用相符的時間型別呼叫 `timeScale.setVisibleRange({ from, to })`，或在初始化後更新 `TimeScale` 的 `visibleRange` prop。針對「最近 100 根 bar」，請使用邏輯邊界。切勿在同一次互動中同時傳入 visible-range 邊界與 fit trigger：fit trigger 可能會覆寫所請求的範圍。變更 `timeVisible` 僅格式化時間軸；它不會將日 K 線聚合成小時 K 線。資料配接器必須回傳所選的時間資料粒度。

## 驗收檢查

- 快速向左拖曳：僅有一個請求在處理中，重疊的時間戳記不會重複，且在回應時可見的 bar 在前置附加後依然可見。
- 在回應到達前再次平移；最終的回應應當保留較晚的檢視狀態。持續滾動直到 `hasMore` 為 false；請求應當停止發送。
- 模擬錯誤情況：圖表維持可用且提供明確的重試機制。在擷取過程中卸載：任何回應均不得更新已移除的圖表。
- 快速選取 A、B 與新時間間隔。讓 A 的回應最後到達，並驗證僅渲染最終的選取項目。涵蓋空快照與重試情境。
- 點擊已經選取的時間間隔：不得啟動任何請求，且圖表保留其縮放與滾動位置。
