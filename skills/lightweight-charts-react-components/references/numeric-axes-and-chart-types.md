# 數值軸與圖表類型

適用於跨履約價（strikes）的選擇權波動率曲面切片、跨標的資產價格的報酬分佈曲線（payoff profile）、跨到期日的殖利率曲線，或自訂水平刻度。容易混淆的地方在於，上游系列將水平欄位命名為 `time`，即使水平項目是**代表履約價或到期日的數值**。

## 根據水平領域選擇圖表建構函式

| 水平領域                                     | 包裝器                  | 系列／類型約定                                     |
| -------------------------------------------- | ----------------------- | -------------------------------------------------- |
| 日期或 UTC 時間                              | `Chart`                 | `Time`，包含 UTC 秒數時間戳記                      |
| 履約價／標的資產價格                         | `OptionsChart`          | `number`，例如 `LineData<number>`                  |
| 以單一數值單位表示的距到期時間               | `YieldCurveChart`       | `number`；僅支援 `LineSeries` 與 `AreaSeries`      |
| 本質上不同的水平行為                         | `CustomChart`           | 明確的 `IHorzScaleBehavior<HorzScaleItem>`         |
| 現有日期搭配不同的標籤格式                   | 通常為 `Chart` 選項     | 格式化函式可能就足夠；不需要新的領域               |

不要僅為了符合 `Chart` 的型別定義而將履約價轉換為 `UTCTimestamp`。
對於殖利率曲線，請確定一個 x 單位是月份還是年份，並保持每個資料集與格式化函式的一致性。所有數值 x 值必須是有限數（finite）、遞增且唯一的。重新整理後的曲線通常是完整的快照，而不是附加的 tick 資料。

## 配方：依履約價劃分的隱含波動率

定價／市場資料層提供的波動率是以**百分比點**為單位，因此 24.5 代表 24.5%，而非 0.245。此元件僅視覺化這些觀察值；它不對選擇權進行定價或計算波動率。當使用相同的履約價領域時，不同的到期日可以用獨立的線系列表示。

```tsx
import type { DeepPartial, LineData, PriceChartOptions } from "lightweight-charts";
import {
  LineSeries,
  OptionsChart,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";

const strikeOptions = {
  autoSize: true,
  // 內建水平刻度使用 precision。timeFormatter 格式化
  // 水平十字準線標籤；系列控制垂直數值格式。
  localization: {
    precision: 0,
    timeFormatter: (strike: number) => `$${strike.toFixed(0)}`,
  },
} satisfies DeepPartial<PriceChartOptions>;

export function VolatilitySmile({
  data,
  expiryId,
}: {
  data: LineData<number>[];
  expiryId: string;
}) {
  return (
    <OptionsChart
      key={expiryId}
      options={strikeOptions}
      containerProps={{ style: { height: 320 } }}
    >
      <LineSeries<number>
        data={data}
        alwaysReplaceData
        options={{
          color: "#2563eb",
          priceLineVisible: false,
          priceFormat: {
            type: "custom",
            minMove: 0.01,
            formatter: (value: number) => `${value.toFixed(2)}%`,
          },
        }}
      />
      <TimeScale<number>>
        <TimeScaleFitContentTrigger deps={[]} />
      </TimeScale>
    </OptionsChart>
  );
}

export const exampleSmile: LineData<number>[] = [
  { time: 80, value: 31.2 },
  { time: 90, value: 26.5 },
  { time: 100, value: 24.5 },
  { time: 110, value: 25.7 },
  { time: 120, value: 29.1 },
];
```

`expiryId` 會改變資料集識別並重設圖表的初始檢視。例行的報價重新整理保持其穩定，並在不每次重新調整大小（fit）的情況下替換資料。根據金融商品選擇履約價精度；此處的整數美元標籤僅為範例領域。數值 x 刻度為整數履約價，水平十字準線標籤包含貨幣前綴。報酬圖表使用相同的包裝器，其 y 值與格式化函式代表報酬貨幣而非波動率。

請勿使用 `localization.priceFormatter` 來標示履約價：它會覆寫**垂直**價格刻度格式化函式，包含系列自訂價格格式化函式。內建的數值水平行為使用 `localization.precision` 處理刻度，並使用 `localization.timeFormatter` 處理水平十字準線標籤。若要為每個水平刻度加上前綴格式化，需要適當的自訂行為。

## 配方：目前與先前的殖利率曲線

兩個資料集均使用**到期月數**作為 x，並以百分比點作為 y。該包裝器設定上游殖利率曲線語意；它不是重新命名標籤的日期時間圖表。兩條線共用一個刻度，以便比較它們的水平。

```tsx
import type { DeepPartial, LineData, YieldCurveChartOptions } from "lightweight-charts";
import {
  LineSeries,
  TimeScale,
  TimeScaleFitContentTrigger,
  YieldCurveChart,
} from "lightweight-charts-react-components";

const yieldOptions = {
  autoSize: true,
  localization: { priceFormatter: (value: number) => `${value.toFixed(2)}%` },
  yieldCurve: {
    startTimeRange: 0,
    minimumTimeRange: 360,
    formatTime: (months: number) => (months < 12 ? `${months}M` : `${months / 12}Y`),
  },
} satisfies DeepPartial<YieldCurveChartOptions>;

export function YieldComparison({
  current,
  previous,
  curveId,
}: {
  current: LineData<number>[];
  previous: LineData<number>[];
  curveId: string;
}) {
  return (
    <YieldCurveChart
      key={curveId}
      options={yieldOptions}
      containerProps={{ style: { height: 320 } }}
    >
      <LineSeries<number>
        data={current}
        alwaysReplaceData
        options={{ color: "#2563eb", priceLineVisible: false }}
      />
      <LineSeries<number>
        data={previous}
        alwaysReplaceData
        options={{ color: "#94a3b8", lineStyle: 2, priceLineVisible: false }}
      />
      <TimeScale<number>>
        <TimeScaleFitContentTrigger deps={[]} />
      </TimeScale>
    </YieldCurveChart>
  );
}

export const exampleYields: LineData<number>[] = [
  { time: 1, value: 4.8 },
  { time: 6, value: 4.5 },
  { time: 12, value: 4.1 },
  { time: 60, value: 3.7 },
  { time: 120, value: 3.6 },
  { time: 360, value: 3.8 },
];
```

`YieldCurveChart` 透過包裝器的執行階段防護僅接受線系列與區域系列。請勿將 K 線（candle）、長條圖（bar）、長條直方圖（histogram）或自訂系列新增至此圖表。此處的最小 360 個月跨度是明確的顯示選擇；請根據產品預期的期限領域進行調整。負殖利率數值仍然是合法的 y 資料；請勿將其限制為零。

## 配方：重複使用上游時間行為以呈現季度標籤

這是一個自訂行為範例，適用於應用程式選擇將其季度格式化封裝為上游水平刻度行為的情境。對於簡單的標籤變更，在 `Chart` 上使用一般的 `timeScale.tickMarkFormatter` 與 `localization.timeFormatter` 更為輕量。擴充預設行為，而不是重新實作排序、時間轉換、快取與刻度產生。

```tsx
import { useState } from "react";
import { defaultHorzScaleBehavior } from "lightweight-charts";
import type { LineData, LocalizationOptions, TickMark, Time } from "lightweight-charts";
import {
  CustomChart,
  LineSeries,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";

function quarterLabel(time: Time): string {
  const date =
    typeof time === "number"
      ? new Date(time * 1000)
      : typeof time === "string"
        ? new Date(`${time}T00:00:00Z`)
        : new Date(Date.UTC(time.year, time.month - 1, time.day));
  return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
}

const DefaultTimeBehavior = defaultHorzScaleBehavior();
function isTime(time: unknown): time is Time {
  return (
    typeof time === "number" ||
    typeof time === "string" ||
    (typeof time === "object" &&
      time !== null &&
      "year" in time &&
      typeof time.year === "number" &&
      "month" in time &&
      typeof time.month === "number" &&
      "day" in time &&
      typeof time.day === "number")
  );
}

class QuarterBehavior extends DefaultTimeBehavior {
  override formatTickmark(
    mark: TickMark,
    _localization: LocalizationOptions<Time>
  ): string {
    // TickMark.originalTime 為 unknown；在格式化前進行縮小（narrow）。
    return isTime(mark.originalTime)
      ? quarterLabel(mark.originalTime)
      : super.formatTickmark(mark, _localization);
  }
}

export function QuarterlyChart({ data }: { data: LineData<Time>[] }) {
  // 此建構函式行為屬於一個圖表實例。日後變更
  // 行為需要重新掛載圖表，而不是更新選項。
  const [behavior] = useState(() => new QuarterBehavior());
  return (
    <CustomChart<Time, QuarterBehavior>
      horzScaleBehavior={behavior}
      options={{ autoSize: true, localization: { timeFormatter: quarterLabel } }}
      containerProps={{ style: { height: 320 } }}
    >
      <LineSeries data={data} />
      <TimeScale>
        <TimeScaleFitContentTrigger deps={[]} />
      </TimeScale>
    </CustomChart>
  );
}
```

對季度標籤使用季度觀察值；將此格式化函式套用至每日觀察值可能會產生重複的季度標籤。`time` 欄位仍然包含有效的日期／UTC 時間。對於非時間領域，實作其相應的 `IHorzScaleBehavior` 約定，並透過 `CustomChart`、系列、`TimeScale`、refs 和處理常式傳遞匹配的水平型別。請勿使用強制轉型（cast）來掩蓋不相容的水平領域。

## Refs、事件與驗收檢查

數值圖表的處理常式接收 `MouseEventParams<number>`。懸停時的 `param.time` 是履約價或期限，而非 epoch 秒數。請使用該領域的格式化函式對其進行格式化；請勿呼叫 `new Date(param.time * 1000)`。數值系列 refs 使用 `SeriesApiRef<"Line", number>`；數值刻度 refs 使用 `TimeScaleApiRef<number>`。對於原生圖表方法，使用對應的上游 `IChartApiBase<number>` 或 `IYieldCurveChartApi` API 型別定義包裝器 ref。

- 驗證 100 的履約價被標記為履約價，且波動率 24.5 被標記為 24.5%。重新整理整個波動率曲線（smile）並確認已移除的履約價消失。
- 驗證期限 6、12 和 120 代表 6M、1Y 和 10Y。測試負殖利率以及在同一個刻度上的兩條曲線。變更曲線識別並驗證初始範圍。
- 確認殖利率曲線拒絕非線／區域系列。檢查自訂行為實例在不相關的應用程式轉譯期間保持穩定。
- 懸停在每種圖表類型上，驗證正確的水平項目型別傳遞至工具提示。測試年份和時區邊界附近的季度標籤。
