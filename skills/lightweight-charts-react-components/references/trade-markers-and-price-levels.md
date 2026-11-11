# 交易標記與價格水平線

適用於成交記錄（execution history）、策略訊號、進場／停損／停利疊加層，或點擊放置的水平價格線。這些皆為視覺標記。圖表不會執行訂單、持久化編輯，也不會將標記轉換為繪圖工具。

## 根據所代表的事物選擇標記方式

| 需求                                                         | 基元                                  | 擁有權                                                       |
| ------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| K 線上的成交或訊號                                           | `Markers`                             | K 線系列的子元件                                             |
| 水平進場、停損、目標或警報水平線                             | `PriceLine`                           | 所使用價格刻度之系列的子元件                                 |
| 垂直事件線、區域或任意自訂繪圖                               | `SeriesPrimitive` ／ `PanePrimitive`  | 請參閱[時段疊加層](session-overlays-and-primitives.md)       |

保持領域 ID 穩定。水平線的 React key 必須是其 ID，而不是其變動的價格，這樣編輯才能更新現有的價格線。標記順序必須按時間遞增；多個標記可以屬於同一根 K 線。`Markers` 預期在每次響應式變更時接收**完整清單**，包含用於清空清單的 `[]`。

## 配方：成交記錄、可編輯水平線與點擊放置警報

`candles` 是遞增且唯一的 UTC 秒數快照。每筆成交記錄的 `barTime` 已經在該精確時間軸上識別了包含它的 K 線。市場資料轉接器必須使用交易場所的間隔與時段規則將成交瞬間對應至 K 線。單純的本地時間四捨五入操作對於基於時段的 K 線是不安全的。載入歷史記錄之外的事件會保留在上游，並在載入該歷史記錄時變為可見。

```tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { LineStyle } from "lightweight-charts";
import type {
  CandlestickData,
  MouseEventParams,
  SeriesMarker,
  UTCTimestamp,
} from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  Markers,
  Pane,
  PriceLine,
  TimeScale,
  TimeScaleFitContentTrigger,
  type SeriesApiRef,
} from "lightweight-charts-react-components";

type Execution = {
  id: string;
  barTime: UTCTimestamp;
  side: "buy" | "sell";
  quantity: number;
};
type Level = { id: string; price: number; title: string; color: string };

const quantize = (rawPrice: number, tickSize: number, precision: number) =>
  Number((Math.round(rawPrice / tickSize) * tickSize).toFixed(precision));

function PriceInput({
  price,
  tickSize,
  precision,
  onCommit,
}: {
  price: number;
  tickSize: number;
  precision: number;
  onCommit: (price: number) => void;
}) {
  // 保存輸入的文字並在提交時進行四捨五入。在每次按鍵時進行四捨五入會在輸入途中
  // 重寫欄位：例如刻度為 5 時，輸入「105」會將「1」變成 0。
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    const rawPrice = Number(draft);
    if (draft !== "" && Number.isFinite(rawPrice)) {
      onCommit(quantize(rawPrice, tickSize, precision));
    }
  };
  return (
    <input
      type="number"
      step={tickSize}
      value={draft ?? price}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === "Enter") commit();
      }}
    />
  );
}

export function TradeAnnotations({
  candles,
  executions,
  initialLevels,
  tickSize,
  precision,
}: {
  candles: CandlestickData<UTCTimestamp>[];
  executions: Execution[];
  initialLevels: Level[];
  tickSize: number;
  precision: number;
}) {
  const seriesRef = useRef<SeriesApiRef<"Candlestick">>(null);
  const [levels, setLevels] = useState(initialLevels);
  const [showExecutions, setShowExecutions] = useState(true);
  const [placing, setPlacing] = useState(false);

  const markers = useMemo<SeriesMarker<UTCTimestamp>[]>(() => {
    if (!showExecutions) return [];
    const loadedTimes = new Set(candles.map(bar => bar.time));
    return executions
      .filter(execution => loadedTimes.has(execution.barTime))
      .map(execution => ({
        id: execution.id,
        time: execution.barTime,
        position:
          execution.side === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        shape: execution.side === "buy" ? ("arrowUp" as const) : ("arrowDown" as const),
        color: execution.side === "buy" ? "#16a34a" : "#dc2626",
        text: `${execution.side.toUpperCase()} ${execution.quantity}`,
      }))
      .sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
  }, [candles, executions, showExecutions]);

  const onClick = useCallback(
    (param: MouseEventParams) => {
      if (!placing || !param.point || !(tickSize > 0) || !Number.isFinite(tickSize))
        return;
      const series = seriesRef.current?.api();
      if (!series || param.paneIndex !== series.getPane().paneIndex()) return;
      // 使用目標系列的實際刻度從面板本地像素進行轉換。
      // point.y 不是價格，且可能參照不相關的面板。
      const rawPrice = series.coordinateToPrice(param.point.y);
      if (rawPrice === null || !Number.isFinite(rawPrice)) return;
      const price = quantize(rawPrice, tickSize, precision);
      const id = crypto.randomUUID();
      setLevels(previous => [
        ...previous,
        { id, price, title: "Alert", color: "#f59e0b" },
      ]);
      setPlacing(false);
    },
    [placing, tickSize, precision]
  );

  return (
    <section>
      <button onClick={() => setShowExecutions(value => !value)}>
        {showExecutions ? "Hide executions" : "Show executions"}
      </button>
      <button onClick={() => setPlacing(value => !value)}>
        {placing ? "Cancel placement" : "Place alert level"}
      </button>
      <Chart
        options={{ autoSize: true }}
        containerProps={{ style: { height: 360 } }}
        onClick={onClick}
      >
        <Pane>
          <CandlestickSeries
            ref={seriesRef}
            data={candles}
            options={{
              priceLineVisible: false,
              priceFormat: { type: "price", minMove: tickSize, precision },
            }}
          >
            <Markers markers={markers} options={{ zOrder: "normal" }} />
            {levels.map(level => (
              <PriceLine
                key={level.id}
                price={level.price}
                options={{
                  title: level.title,
                  color: level.color,
                  lineStyle: LineStyle.Dashed,
                  axisLabelVisible: true,
                }}
              />
            ))}
          </CandlestickSeries>
        </Pane>
        <TimeScale>
          <TimeScaleFitContentTrigger deps={[]} />
        </TimeScale>
      </Chart>
      {levels.map(level => (
        <label key={level.id} style={{ display: "block" }}>
          {level.title}
          <PriceInput
            price={level.price}
            tickSize={tickSize}
            precision={precision}
            onCommit={price =>
              setLevels(previous =>
                previous.map(item => (item.id === level.id ? { ...item, price } : item))
              )
            }
          />
          <button
            onClick={() =>
              setLevels(previous => previous.filter(item => item.id !== level.id))
            }
          >
            Remove
          </button>
        </label>
      ))}
    </section>
  );
}
```

在轉譯前，將 `tickSize` 驗證為正有限數，並將 `precision` 驗證為金融商品支援的非負整數。上述的四捨五入是從零開始的刻度網格的顯示四捨五入。具有不同價格範圍規則的金融商品需要特定場所的量化器；請勿將其重複用作訂單驗證器。`initialLevels` 是掛載時的種子資料。按金融商品 ID 掛載，或在標記狀態位於上游時將其替換為受控的 `levels`／`onLevelsChange` 約定。

## 生命週期與適配細節

`PriceLine` 會對 `price` 與 `options` 的變更做出響應，並在取消掛載時移除其上游線條。明確的 `price` prop 與 `options` 是分開的；請勿將價格僅放在 options 內。停用 K 線系列預設的最新價格線可減少與領域水平線的視覺混淆。

`Markers` 會建立上游外掛程式並響應式地更新標記清單，但目前的 hook 在建立後不會套用新的 `options`。若要變更外掛程式選項（例如 `zOrder`），請使用識別該選項的 key 重新掛載 `Markers`，或呼叫 `markersRef.current?.api()?.applyOptions(...)`。後者需要 `MarkersApiRef` 與初始化後的 API。顯示／隱藏清單使用 `markers={[]}`，而不需要重新建立外掛程式。

對於標記點擊詳細資訊，`MouseEventParams.hoveredObjectId` 可以識別提供了 `id` 的標記。根據應用程式的成交 ID 解析它。對於可拖曳的線條或區域，請在繪圖外掛程式中實作互動與點擊測試；單獨的 `PriceLine` 沒有拖曳回呼。

將持久化與網路變更保留在應用程式的標記儲存中。變更本地圖表狀態不應暗示下達即時訂單或在伺服器上註冊警報。如果需要，請新增應用程式的明確儲存／提交流程。

## 驗收檢查

- 在同一根 K 線上新增兩筆成交記錄，重新排序輸入，並驗證排序後的標記依然存在。隱藏它們並驗證完整清單已被清空；再次顯示它們。
- 當 tick 為 5 時，在水平線的價格中輸入 105：欄位保留每個數字，且線條在 blur 或按 Enter 時移動。清除欄位並 blur：價格恢復原狀。
- 編輯水平線的價格與標題而不變更其 ID。移除它並驗證線條消失。切換金融商品並驗證標記不會洩漏到其他商品。
- 在放置模式下，於已知價格處點擊價格面板。驗證 tick 四捨五入。新增另一個面板並驗證在該處點擊不會在價格系列上建立水平線。
- 變更標記選項並驗證所選的重新掛載／API 路徑確實套用了它們；在目前的 hook 中，僅變更 options prop 是不夠的。
