# 績效比較

當使用者想要比較多個原始價格相差數個數量級的資產時使用此功能。將一條價格為 200 的線與一條價格為 2 的線放在一起，很少能提供有用的績效比較。在選擇刻度模式之前，請先選擇並命名比較基準線（baseline）。

## 百分比比較的兩種含義

| 產品需求                                     | 資料與刻度                                                  | 後果                                                    |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| 相對於第一個可見數值的相對變動               | 原始價格搭配 `PriceScaleMode.Percentage`                    | 當視區移動時基準線可能會改變                           |
| 自固定日期或開盤以來的報酬率                 | 在上游計算報酬率，並繪製在 `PriceScaleMode.Normal` 上       | 平移不會改變所繪製報酬率的含義                         |

以下配方使用固定的共用基準線。請勿對已經計算好的報酬率再次套用百分比刻度模式。這會對資料進行第二次正規化，且起始的零不適合作為百分比分母。

## 配方：對齊且具固定基準線的報酬率比較

每個資產在所需日曆上提供遞增且唯一的 UTC 秒數價格。每個數值都是有限數；基準價格必須為正數。當請求的比較涉及幣別與調整政策時，輸入應使用相同的幣別與調整政策。此程式碼顯示**價格報酬率**，而非包含股利的總報酬率。

選擇所有資產中存在的最早載入時間戳記作為共用基準線。將後續的間隙保留為間隙；切勿透過從不同日期填補來虛構價格。對於契約性的「自日期 X 以來」需求，讓轉接器在 X 提供常見的基準觀察值，或回報遺漏的基準線，而不是靜默地移動它。使用穩定的資料集金鑰進行掛載，使初始的適應符合完成的快照。

```tsx
import { useMemo, useState } from "react";
import { PriceScaleMode } from "lightweight-charts";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import {
  Chart,
  LineSeries,
  Pane,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";

export type Asset = {
  id: string;
  label: string;
  color: string;
  data: LineData<UTCTimestamp>[];
};

export function buildComparison(assets: Asset[]) {
  if (assets.length === 0) return null;
  const indexes = assets.map(
    asset => new Map(asset.data.map(point => [point.time, point.value]))
  );
  const baselineTime = assets[0].data.find(point =>
    indexes.every(index => index.has(point.time))
  )?.time;
  if (baselineTime === undefined) return null;

  const series = assets.map((asset, index) => {
    const baseline = indexes[index].get(baselineTime);
    if (baseline === undefined || !Number.isFinite(baseline) || baseline <= 0) {
      throw new Error(`Invalid baseline for ${asset.id}`);
    }
    const data = asset.data
      .filter(point => point.time >= baselineTime)
      .map(point => ({ time: point.time, value: (point.value / baseline - 1) * 100 }));
    return { ...asset, data };
  });
  return { baselineTime, series };
}

export function ReturnComparison({ assets }: { assets: Asset[] }) {
  const comparison = useMemo(() => buildComparison(assets), [assets]);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  if (!comparison) return <p>No common baseline observation</p>;
  const baselineLabel = new Date(comparison.baselineTime * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <section>
      <p>Price return since {baselineLabel} UTC</p>
      {comparison.series.map(asset => (
        <button
          key={asset.id}
          aria-pressed={!hidden.has(asset.id)}
          onClick={() =>
            setHidden(previous => {
              const next = new Set(previous);
              if (next.has(asset.id)) next.delete(asset.id);
              else next.add(asset.id);
              return next;
            })
          }
        >
          {asset.label}
        </button>
      ))}
      <Chart
        options={{ autoSize: true, rightPriceScale: { mode: PriceScaleMode.Normal } }}
        containerProps={{ style: { height: 360 } }}
      >
        <Pane>
          {comparison.series.map(asset => (
            <LineSeries
              key={asset.id}
              data={asset.data}
              options={{
                color: asset.color,
                visible: !hidden.has(asset.id),
                priceScaleId: "right",
                priceLineVisible: false,
                priceFormat: {
                  type: "custom",
                  minMove: 0.01,
                  formatter: (value: number) =>
                    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
                },
              }}
            />
          ))}
        </Pane>
        <TimeScale>
          {/* 切換比較會改變可見性，而非其基準線或檢視。 */}
          <TimeScaleFitContentTrigger deps={[comparison.baselineTime]} />
        </TimeScale>
      </Chart>
    </section>
  );
}
```

所有線條共用一個價格刻度，因為轉換後的數值具有相同的單位。當標籤變更或輸入順序變更時，穩定的系列 ID 會保留上游系列。`visible` 保持系列處於掛載狀態；當打算移除系列時，條件式掛載也是有效的，但可能會改變共用的時間軸。保留隱藏系列可以在該時間軸中保留其時間位置。

## 適配邊界

最早共用基準線適用於完整、固定的初始快照。前置（prepending）更早的歷史資料可能會改變它。若產品承諾固定基準線，請將選定的基準時間／價格儲存在應用程式的比較狀態中，並在後續快照中重複使用它們；載入歷史記錄絕不能重新定義「報酬率」。同樣地，切換可見性絕不能僅從可見子集重新計算基準線。此配方始終跨完整資產清單進行計算。

若日曆不同，請明確選擇交集基準線，並將後續缺少的觀察值保留為不存在，或在共用日曆上插入空格點（whitespace points）。請勿按陣列索引對齊。十字準線詳細資訊應讀取每個系列的事件項目並在缺少時顯示 `—`；請參閱[懸停詳細資訊](hover-legends-and-tooltips.md)。

若任務明確為「相對於目前可見視窗的百分比變動」，請改用原始價格陣列與 `rightPriceScale.mode: PriceScaleMode.Percentage`。標註此行為，因為縮放與平移可能會改變顯示的百分比基準線。對於具有不同單位的指標，請使用獨立的軸或面板。

## 驗收檢查

- 在共用基準線上，所有資產均等於 0%。價格從 100 變動至 110 會產生 +10%，從 100 變動至 90 會產生 −10%。
- 比較價格為 1 與 1000 且具有相同比例變動的資產。它們的報酬率線條重合。平移並驗證固定數值不會改變。
- 切換單一資產、變更輸入順序並更新最新價格。ID、色彩和基準線保留其預期含義。
- 測試無共用時間、遺漏觀察值與無效基準線的情況。在沒有產品需求的情況下，請勿以零替代或前向填補（forward-fill）遺漏的價格。
