# 時段疊加層與基元

適用於交易時段陰影（market-session shading）、選取的歷史回測區間、維護期間，或必須跟隨圖表捲動與縮放的自訂標記。疊加層應保持附加至圖表座標，而非單次擷取的 DOM 像素矩形。

## 選擇最窄的擴充方式

| 所需視覺效果                                                 | 實作方式                                              | 原因                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------ |
| 單根 K 線上的事件                                            | `Markers`                                             | 內建標記版面配置                                             |
| 水平閾值                                                     | `PriceLine`                                           | 內建價格轉換與軸標籤                                         |
| 跨面板的背景                                                 | `PanePrimitive`                                       | 屬於面板，而非單一系列的價格刻度                             |
| 依賴價格的繪製、系列軸標籤、點擊測試（hit testing）          | `SeriesPrimitive`                                     | 原生附加提供擁有的系列                                       |
| 全新的資料系列轉譯器                                         | 搭配 `ICustomSeriesPaneView` 外掛程式的 `CustomSeries` | 作為系列參與其中，包含資料與自動縮放                         |
| 全新的水平軸語意                                             | `CustomChart`                                         | 轉譯器並非水平刻度行為                                       |

## 配方：價格與成交量面板上可重複使用的時段帶

時段邊界由應用程式的市場日曆轉接器準備為 UTC 秒數時間戳記。請勿為實行日光節約時間的交易所寫死固定的 UTC 偏移量。本範例在兩個載入的時間軸觀察值的**中心**之間繪製從 `from` 到 `to` 的陰影；它不會向兩側延伸半根 K 線。

此具體外掛程式會跳過其端點無法被 `timeToCoordinate()` 轉換的時段帶。對於在載入的歷史記錄之外開始的視窗，請在轉接器中修剪（clip）至載入的時間軸。若產品需要 K 線之間的精確邊界，請提供明確的邊界至座標內插策略，而不是假裝未知的時間會自動對應。

將此儲存為 `SessionBands.ts`。從上游轉譯器介面推斷繪製目標的型別，可避免對 `fancy-canvas` 引入直接的執行階段依賴。媒體座標空間（media coordinate space）使用 CSS 像素並透過目標處理裝置像素比（device pixel ratio）；點陣圖座標空間則需要明確的 x/y 像素比轉換。

```ts file=SessionBands.ts
import type {
  IChartApiBase,
  IPanePrimitive,
  IPanePrimitivePaneView,
  IPrimitivePaneRenderer,
  PaneAttachedParameter,
  Time,
  UTCTimestamp,
} from "lightweight-charts";

export type SessionBand = {
  id: string;
  from: UTCTimestamp;
  to: UTCTimestamp;
  color: string;
};
type DrawTarget = Parameters<IPrimitivePaneRenderer["draw"]>[0];
type Rect = { x: number; width: number; color: string };

export class SessionBands implements IPanePrimitive<Time> {
  private rects: Rect[] = [];
  private requestUpdate: (() => void) | undefined;
  private readonly views: IPanePrimitivePaneView[];

  constructor(
    private readonly chart: IChartApiBase<Time>,
    private bands: SessionBand[]
  ) {
    this.views = [
      {
        zOrder: () => "bottom", // 陰影保持在 K 線與成交量後方。
        renderer: () => ({ draw: target => this.draw(target) }),
      },
    ];
  }

  attached({ requestUpdate }: PaneAttachedParameter<Time>) {
    this.requestUpdate = requestUpdate;
  }

  detached() {
    this.requestUpdate = undefined;
  }

  setBands(bands: SessionBand[]) {
    this.bands = bands;
    this.requestUpdate?.(); // 外部外掛程式變異需要請求重新繪製。
  }

  updateAllViews() {
    const scale = this.chart.timeScale();
    this.rects = this.bands.flatMap(band => {
      const from = scale.timeToCoordinate(band.from);
      const to = scale.timeToCoordinate(band.to);
      if (from === null || to === null) return [];
      return [{ x: Math.min(from, to), width: Math.abs(to - from), color: band.color }];
    });
  }

  paneViews() {
    return this.views;
  }

  private draw(target: DrawTarget) {
    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      context.save();
      for (const rect of this.rects) {
        context.fillStyle = rect.color;
        context.fillRect(rect.x, 0, rect.width, mediaSize.height);
      }
      context.restore();
    });
  }
}
```

將以下內容儲存為 `SessionChart.tsx`。`candles` 與 `volume` 共用相同的標準化遞增 UTC 秒數網格。穩定的 `bands` 陣列保留轉譯回呼的識別。新的陣列會刻意使用新的時段定義重新建立基元。

```tsx
import { useCallback, useState } from "react";
import type { CandlestickData, HistogramData, UTCTimestamp } from "lightweight-charts";
import {
  CandlestickSeries,
  Chart,
  HistogramSeries,
  Pane,
  PanePrimitive,
  TimeScale,
  TimeScaleFitContentTrigger,
  type RenderPanePrimitive,
} from "lightweight-charts-react-components";
import { SessionBands, type SessionBand } from "./SessionBands";

export function SessionChart({
  candles,
  volume,
  bands,
}: {
  candles: CandlestickData<UTCTimestamp>[];
  volume: HistogramData<UTCTimestamp>[];
  bands: SessionBand[];
}) {
  const [showBands, setShowBands] = useState(true);
  const renderBands = useCallback<RenderPanePrimitive>(
    ({ chart }) => new SessionBands(chart, bands),
    [bands]
  );

  return (
    <section>
      <button onClick={() => setShowBands(value => !value)}>
        {showBands ? "Hide sessions" : "Show sessions"}
      </button>
      <Chart options={{ autoSize: true }} containerProps={{ style: { height: 450 } }}>
        <Pane stretchFactor={3}>
          <CandlestickSeries data={candles} />
          {/* 每次呼叫都會建構獨立的附加實例。 */}
          {showBands && <PanePrimitive render={renderBands} />}
        </Pane>
        <Pane stretchFactor={1}>
          <HistogramSeries data={volume} options={{ priceFormat: { type: "volume" } }} />
          {showBands && <PanePrimitive render={renderBands} />}
        </Pane>
        <TimeScale>
          <TimeScaleFitContentTrigger deps={[]} />
        </TimeScale>
      </Chart>
    </section>
  );
}
```

`PanePrimitive` 需要 `Pane` 祖先元件；若在其外部使用會擲出例外。基元可以作為 `plugin` 傳遞**或**透過 `render` 建立，兩者不可兼得。轉譯工廠接收初始化後的 `{ chart, pane }`；當建構需要這些 API 時特別有用。包裝器會在掛載時附加它，並在取消掛載時予以分離。

## 識別與更新選擇

包裝器使用 `plugin ?? render` 的識別作為附加識別。新的外掛程式物件或回呼會分離前一個實例並附加新的實例。請勿在每次游標移動或 tick 時內聯新的工廠。本配方根據時段定義對其進行記憶化（memoizes），因此故意的定義變更會重新建立它。請勿在兩個面板／圖表之間重複使用同一個具狀態的外掛程式實例：其附加狀態與重新繪製回呼僅屬於單一附加。

對於頻繁的變更，建立穩定的外掛程式，並透過應用程式擁有的實例或 ref 呼叫其本身的 `setBands()` 方法。包裝器的基元 ref 公開上游介面，而非自訂方法；在呼叫這些方法時，請在應用程式程式碼中保持具體外掛程式的具體型別。上述的 `setBands()` 會請求重新繪製；在未發出該請求的情況下變更類別欄位不一定會立即重新繪製。

在 `updateAllViews()` 中計算座標，然後繪製快取的檢視。上游會在相關的圖表更新期間呼叫此方法，因此捲動／縮放會重新整理幾何形狀。請勿在 React effect 中僅計算一次 x 並在縮放時繼續保留它。若外掛程式訂閱了外部事件，請在 `detached()` 中使用相同的處理常式識別取消訂閱。本配方沒有自訂事件訂閱。

## 系列特定繪製與自訂系列邊界

對於帶有時間軸標籤的垂直事件線，請在目標系列下使用 `SeriesPrimitive`。實作 `ISeriesPrimitive.updateAllViews()` 以重新計算並快取 `chart.timeScale().timeToCoordinate(time)`，或將該工作委派給面板檢視本身的 `update()` 方法。Lightweight Charts 會在圖表更新期間呼叫基元的 `updateAllViews()` 回呼。傳回一個其轉譯器在點陣圖座標空間填滿全高矩形的 `IPrimitivePaneView`（透過 `horizontalPixelRatio` 縮放 x 與寬度），並加上一個來自 `timeAxisViews()` 的 `ISeriesPrimitiveAxisView` 作為標籤。為 UTC 時間戳記或營業日明確格式化標籤；在 `BusinessDay` 物件上呼叫 `.toString()` 不會產生有用的日期。`SeriesPrimitive` 轉譯工廠接收 `{ chart, series }`；在繪製與價格相關的形狀時，使用系列 API 進行價格轉換。

對於分組成交量長條圖或全新的繪圖類型，請使用包含實作上游 `ICustomSeriesPaneView` 之外掛程式的 `CustomSeries`。該外掛程式提供 `renderer`、`update`、`priceValueBuilder`、`isWhitespace` 與 `defaultOptions`。價格值建構器必須包含所有應參與自動縮放的數值。在 `customValues` 中保留自訂裝載（payload），並在更新時保留自訂資料形狀。`CustomSeries` 需要外掛程式實例；而 `CustomChart` 則是改變水平刻度，屬於不同的擴充方式。

## 驗收檢查

- 平移、縮放、調整大小並變更裝置像素比：時段帶仍保持附加至預期的 K 線，且僅填滿其所擁有的面板。
- 反覆開啟／關閉時段並變更時段帶陣列。舊的附加項目會消失，且不會殘留過期的背景。
- 針對說明的修剪策略測試遺漏／超出歷史記錄的端點以及零寬度區間。驗證日曆轉接器中的日光節約時間變更。
- 對於外部外掛程式更新，呼叫 `setBands()` 並驗證其在不需要使用者移動圖表的情況下重新繪製。確認每個面板都有自己的實例。
