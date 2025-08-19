---
applyTo: '*'
description: '最完整、實用且由工程師撰寫的效能最佳化指引，適用所有語言、框架與技術棧。涵蓋前端、後端與資料庫最佳實踐，並提供可執行的指南、情境式檢查清單、疑難排解與專家秘訣。'
---

# 效能最佳化最佳實踐

## 前言

效能不只是流行語——它決定產品是受歡迎還是被拋棄。我親身見證過緩慢的應用程式如何讓使用者沮喪、雲端費用暴增，甚至失去客戶。本指南是我實際使用與審查過最有效的效能實踐彙整，涵蓋前端、後端、資料庫層級及進階主題。請將其作為參考、檢查清單與激發靈感的來源，協助你打造快速、高效且具延展性的軟體。

---

## 一般原則

- **先量測，後優化：** 優化前務必先分析與量測。用基準測試、效能分析器與監控工具找出真正瓶頸。猜測是效能的大敵。
  - *專家秘訣：* 可用 Chrome DevTools、Lighthouse、New Relic、Datadog、Py-Spy 或語言內建分析器。
- **優化常見情境：** 針對最常執行的程式路徑優化。除非必要，勿浪費時間在罕見邊界情境。
- **避免過早優化：** 先寫清楚、易維護的程式碼，必要時再優化。過早優化會讓程式碼難以閱讀與維護。
- **資源使用最小化：** 有效利用記憶體、CPU、網路與磁碟。時刻思考：「能否用更少資源完成？」
- **偏好簡單：** 簡單的演算法與資料結構通常更快且易於優化。勿過度設計。
- **註明效能假設：** 任何效能關鍵或非顯而易見的優化程式碼都要清楚註解。未來維護者（包括你自己）會感謝你。
- **了解平台特性：** 熟悉語言、框架與執行環境的效能特性。Python 快的不一定在 JavaScript 也快，反之亦然。
- **自動化效能測試：** 整合效能測試與基準測試到 CI/CD 流程。及早發現效能退化。
- **設定效能預算：** 定義可接受的載入時間、記憶體用量、API 延遲等，並用自動化檢查強制執行。

---

## 前端效能

### 渲染與 DOM
- **減少 DOM 操作：** 盡量批次更新。頻繁 DOM 變更成本高。
  - *反模式：* 在 for 迴圈中更新 DOM。改用 document fragment 一次 append。
- **虛擬 DOM 框架：** 有效使用 React、Vue 等，避免不必要的重渲染。
  - *React 範例：* 用 `React.memo`、`useMemo`、`useCallback` 避免重複渲染。
- **列表鍵值：** 列表請用穩定鍵值協助虛擬 DOM 差異比對。除非列表靜態，勿用陣列索引。
- **避免行內樣式：** 行內樣式會造成版面抖動。優先用 CSS 類別。
- **CSS 動畫：** 優先用 CSS transition/animation，效能更佳且可 GPU 加速。
- **延遲非關鍵渲染：** 用 `requestIdleCallback` 等方法，等瀏覽器閒置時再執行。

### 資源最佳化
- **圖片壓縮：** 用 ImageOptim、Squoosh、TinyPNG 等工具。網頁優先用 WebP、AVIF 等新格式。
- **SVG 圖示：** SVG 可縮放且通常比 PNG 小。
- **壓縮與打包：** 用 Webpack、Rollup、esbuild 打包並壓縮 JS/CSS。啟用 tree-shaking 移除死程式碼。
- **快取標頭：** 靜態資源設長效快取標頭。更新時用快取破壞（cache busting）。
- **延遲載入：** 圖片用 `loading="lazy"`，JS 模組/元件用動態匯入。
- **字型最佳化：** 僅載入所需字元集。字型子集化並用 `font-display: swap`。

### 網路最佳化
- **減少 HTTP 請求：** 合併檔案、用圖片 sprite、內嵌關鍵 CSS。
- **HTTP/2 與 HTTP/3：** 啟用多路復用與低延遲。
- **用戶端快取：** 用 Service Worker、IndexedDB、localStorage 提升離線與重複造訪效能。
- **CDN：** 靜態資源用 CDN，靠近使用者。多 CDN 可冗餘。
- **延遲/非同步腳本：** 非關鍵 JS 用 `defer` 或 `async`，避免阻塞渲染。
- **預載與預取：** 用 `<link rel="preload">`、`<link rel="prefetch">` 預先載入關鍵資源。

### JavaScript 效能
- **避免阻塞主執行緒：** 重運算用 Web Worker 分流。
- **事件防抖/節流：** 滾動、縮放、輸入事件用 debounce/throttle 限制觸發頻率。
- **記憶體洩漏：** 清理事件監聽、interval、DOM 參照。用瀏覽器開發工具檢查。
- **高效資料結構：** 查詢用 Map/Set，數值資料用 TypedArray。
- **避免全域變數：** 全域變數易造成記憶體洩漏與不可預期效能。
- **避免深層物件複製：** 優先用淺複製，必要時才用 lodash 的 `cloneDeep`。

### 無障礙與效能
- **可及性元件：** ARIA 更新勿過度。語意化 HTML 兼顧可及性與效能。
- **螢幕閱讀器效能：** 避免快速 DOM 更新，避免輔助技術負擔。

### 框架專屬秘訣
#### React
- 用 `React.memo`、`useMemo`、`useCallback` 避免重複渲染。
- 拆分大型元件並用程式碼分割（`React.lazy`、`Suspense`）。
- 渲染時勿用匿名函式，每次渲染都會產生新參照。
- 用 `ErrorBoundary` 捕捉並處理錯誤。
- 用 React DevTools Profiler 分析。

#### Angular
- 無需頻繁更新的元件用 OnPush 變更偵測。
- 模板勿用複雜運算，邏輯移至元件類別。
- `ngFor` 用 `trackBy` 提升列表渲染效能。
- 路由懶載入模組與元件。
- 用 Angular DevTools 分析。

#### Vue
- 模板用 computed property 取代 method，利於快取。
- `v-show` 與 `v-if` 適當選用（頻繁切換建議用 `v-show`）。
- 元件與路由懶載入。
- 用 Vue Devtools 分析。

### 常見前端陷阱
- 首頁載入大型 JS bundle。
- 圖片未壓縮或用舊格式。
- 事件監聽未清理，造成記憶體洩漏。
- 簡單功能過度依賴第三方函式庫。
- 忽略行動裝置效能（請用真機測試！）。

### 前端疑難排解
- 用 Chrome DevTools 的 Performance 分析慢格。
- 用 Lighthouse 稽核效能並獲得建議。
- 用 WebPageTest 進行真實載入測試。
- 監控 Core Web Vitals（LCP, FID, CLS）以使用者為中心。

---

## 後端效能

### 演算法與資料結構最佳化
- **選用正確資料結構：** 順序存取用陣列，快速查詢用 hash map，階層資料用樹等。
- **高效演算法：** 適時用二分搜尋、快速排序、hash 演算法。
- **避免 O(n^2) 或更差：** 分析巢狀迴圈與遞迴，重構以降低複雜度。
- **批次處理：** 批次處理資料降低開銷（如批量資料庫寫入）。
- **串流處理：** 大型資料集用串流 API，避免一次載入全部。

### 平行處理與非同步
- **非同步 I/O：** 用 async/await、callback 或事件迴圈避免阻塞執行緒。
- **執行緒/工作池：** 用池管理平行處理，避免資源耗盡。
- **避免競爭條件：** 必要時用鎖、信號量或原子操作。
- **批次操作：** 網路/資料庫呼叫批次處理，減少往返。
- **背壓（Backpressure）：** 佇列與管線實作背壓，避免超載。

### 快取
- **快取高成本運算：** 熱資料用記憶體快取（Redis、Memcached）。
- **快取失效：** 用時間（TTL）、事件或手動失效。過期快取比沒快取更糟。
- **分散式快取：** 多伺服器用分散式快取，注意一致性。
- **快取暴衝保護：** 用鎖或請求合併防止羊群效應。
- **勿全快取：** 有些資料太易變或敏感不宜快取。

### API 與網路
- **最小化傳輸量：** 用 JSON、壓縮回應（gzip、Brotli），避免多餘資料。
- **分頁：** 大型結果集必須分頁。即時資料用游標。
- **速率限制：** 保護 API 避免濫用與超載。
- **連線池：** 資料庫與外部服務用連線池。
- **協定選擇：** 高吞吐低延遲用 HTTP/2、gRPC、WebSocket。

### 日誌與監控
- **熱路徑減少日誌：** 關鍵程式勿過度記錄日誌。
- **結構化日誌：** 用 JSON 或鍵值日誌，便於解析與分析。
- **全面監控：** 延遲、吞吐、錯誤率、資源用量。用 Prometheus、Grafana、Datadog 等。
- **警示：** 效能退化與資源耗盡設警示。

### 語言/框架專屬秘訣
#### Node.js
- 用非同步 API，勿阻塞事件迴圈（如 production 勿用 `fs.readFileSync`）。
- CPU 密集任務用 cluster 或 worker thread。
- 限制同時開啟連線數，避免資源耗盡。
- 大型檔案或網路資料用 stream 處理。
- 用 `clinic.js`、`node --inspect` 或 Chrome DevTools 分析。

#### Python
- 用內建資料結構（`dict`、`set`、`deque`）提升速度。
- 用 `cProfile`、`line_profiler`、`Py-Spy` 分析。
- 平行處理用 `multiprocessing` 或 `asyncio`。
- CPU 密集程式避免 GIL 瓶頸，可用 C 擴充或 subprocess。
- 用 `lru_cache` 記憶化。

#### Java
- 用高效集合（`ArrayList`、`HashMap` 等）。
- 用 VisualVM、JProfiler、YourKit 分析。
- 平行處理用 thread pool（`Executors`）。
- JVM 選項調整 heap 與 GC（`-Xmx`、`-Xms`、`-XX:+UseG1GC`）。
- 非同步程式用 `CompletableFuture`。

#### .NET
- I/O 密集操作用 `async/await`。
- 記憶體存取用 `Span<T>`、`Memory<T>`。
- 用 dotTrace、Visual Studio Profiler、PerfView 分析。
- 物件與連線適時池化。
- 串流資料用 `IAsyncEnumerable<T>`。

### 常見後端陷阱
- Web 伺服器同步/阻塞 I/O。
- 資料庫未用連線池。
- 過度快取或快取敏感/易變資料。
- 非同步程式碼未處理錯誤。
- 未監控或警示效能退化。

### 後端疑難排解
- 用 flame graph 視覺化 CPU 使用。
- 用分散式追蹤（OpenTelemetry、Jaeger、Zipkin）追蹤跨服務延遲。
- 用 heap dump 與記憶體分析器找洩漏。
- 記錄慢查詢與 API 呼叫供分析。

---

## 資料庫效能

### 查詢最佳化
- **索引：** 常查詢、篩選或 join 欄位設索引。監控索引使用並移除未用索引。
- **避免 SELECT *：** 只查詢所需欄位，減少 I/O 與記憶體。
- **參數化查詢：** 防止 SQL injection 並提升計劃快取。
- **查詢計劃：** 分析與優化查詢執行計劃。SQL 資料庫用 `EXPLAIN`。
- **避免 N+1 查詢：** 用 join 或批次查詢，避免迴圈重複查詢。
- **限制結果集：** 大型表用 `LIMIT`/`OFFSET` 或游標。

### 結構設計
- **正規化：** 降低冗餘，但讀取密集可適度反正規化。
- **資料型別：** 用最有效型別並設適當約束。
- **分割：** 大型表分割提升延展性與管理性。
- **封存：** 定期封存或清除舊資料，保持表精簡與快速。
- **外鍵：** 維護資料完整性，但高寫入場景需注意效能。

### 交易
- **交易短暫：** 交易越短越好，減少鎖競爭。
- **隔離等級：** 用最低能滿足一致性的隔離等級。
- **避免長時間交易：** 會阻塞其他操作並增加死鎖。

### 快取與複寫
- **讀取複本：** 讀取密集場景用複本延展。監控複寫延遲。
- **查詢結果快取：** 熱查詢用 Redis 或 Memcached。
- **寫入直通/延後：** 依一致性需求選擇策略。
- **分片：** 多伺服器分片提升延展性。

### NoSQL 資料庫
- **依存取模式設計：** 資料模型依查詢需求設計。
- **避免熱分片：** 寫入/讀取均勻分散。
- **無界成長：** 注意無界陣列或文件。
- **分片與複寫：** 提升延展性與可用性。
- **一致性模型：** 了解最終一致與強一致，依需求選擇。

### 常見資料庫陷阱
- 缺少或未用索引。
- SELECT * 用於 production 查詢。
- 未監控慢查詢。
- 忽略複寫延遲。
- 未封存舊資料。

### 資料庫疑難排解
- 用慢查詢日誌找瓶頸。
- 用 `EXPLAIN` 分析查詢計劃。
- 監控快取命中率。
- 用資料庫專屬監控工具（pg_stat_statements、MySQL Performance Schema）。

---

## 效能程式碼審查清單

- [ ] 是否有明顯演算法低效（O(n^2) 或更差）？
- [ ] 資料結構是否適用？
- [ ] 是否有不必要運算或重複工作？
- [ ] 是否適當快取且正確失效？
- [ ] 資料庫查詢是否最佳化、設索引且無 N+1 問題？
- [ ] 大型資料是否分頁、串流或分塊？
- [ ] 是否有記憶體洩漏或無界資源使用？
- [ ] 網路請求是否最小化、批次處理並失敗重試？
- [ ] 資源是否最佳化、壓縮且有效率提供？
- [ ] 熱路徑是否有阻塞操作？
- [ ] 熱路徑日誌是否最小化且結構化？
- [ ] 效能關鍵程式碼是否有註解與測試？
- [ ] 效能敏感程式碼是否有自動化測試或基準測試？
- [ ] 是否有效能退化警示？
- [ ] 是否有反模式（如 SELECT *、阻塞 I/O、全域變數）？

---

## 進階主題

### 效能分析與基準測試
- **分析器：** 用語言專屬分析器（Chrome DevTools、Py-Spy、VisualVM、dotTrace 等）找瓶頸。
- **微型基準測試：** 關鍵程式碼寫 microbenchmark。JavaScript 用 `benchmark.js`，Python 用 `pytest-benchmark`，Java 用 JMH。
- **A/B 測試：** 以 A/B 或 canary 發佈量測優化實際影響。
- **持續效能測試：** 整合效能測試到 CI/CD。用 k6、Gatling、Locust。

### 記憶體管理
- **資源釋放：** 檔案、socket、資料庫連線等資源要及時釋放。
- **物件池化：** 頻繁建立/銷毀的物件（如資料庫連線、執行緒）可池化。
- **heap 監控：** 監控 heap 用量與垃圾回收。依工作負載調整 GC。
- **記憶體洩漏：** 用偵測工具（Valgrind、LeakCanary、Chrome DevTools）。

### 延展性
- **水平延展：** 設計無狀態服務、分片/分割、負載平衡。
- **自動延展：** 用雲端自動延展群組並設合理門檻。
- **瓶頸分析：** 找出並解決單點故障。
- **分散式系統：** 用冪等操作、重試與斷路器。

### 安全與效能
- **高效加密：** 用硬體加速且維護良好的加密函式庫。
- **驗證：** 輸入高效驗證，熱路徑避免用正則。
- **速率限制：** 防止 DoS 並兼顧合法用戶。

### 行動效能
- **啟動時間：** 功能懶載入、延遲重運算、最小化初始 bundle。
- **圖片/資源最佳化：** 行動頻寬優先用響應式圖片與壓縮資源。
- **高效儲存：** 用 SQLite、Realm 或平台最佳化儲存。
- **效能分析：** 用 Android Profiler、Instruments（iOS）、Firebase Performance Monitoring。

### 雲端與無伺服器
- **冷啟動：** 依賴最小化並保持函式常駐。
- **資源分配：** 調整無伺服器函式記憶體/CPU。
- **託管服務：** 用託管快取、佇列、資料庫提升延展性。
- **成本最佳化：** 監控並以效能為指標優化雲端成本。

---

## 實用範例

### 範例 1：JavaScript 使用者輸入防抖
```javascript
// 不佳：每次輸入都觸發 API
input.addEventListener('input', (e) => {
  fetch(`/search?q=${e.target.value}`);
});

// 佳：API 呼叫防抖
let timeout;
input.addEventListener('input', (e) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    fetch(`/search?q=${e.target.value}`);
  }, 300);
});
```

### 範例 2：高效 SQL 查詢
```sql
-- 不佳：查詢所有欄位且未用索引
SELECT * FROM users WHERE email = 'user@example.com';

-- 佳：只查必要欄位且用索引
SELECT id, name FROM users WHERE email = 'user@example.com';
```

### 範例 3：Python 快取高成本運算
```python
# 不佳：每次都重新計算
result = expensive_function(x)

# 佳：快取結果
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(x):
    ...
result = expensive_function(x)
```

### 範例 4：HTML 圖片延遲載入
```html
<!-- 不佳：所有圖片立即載入 -->
<img src="large-image.jpg" />

<!-- 佳：圖片延遲載入 -->
<img src="large-image.jpg" loading="lazy" />
```

### 範例 5：Node.js 非同步 I/O
```javascript
// 不佳：阻塞式檔案讀取
const data = fs.readFileSync('file.txt');

// 佳：非阻塞式檔案讀取
fs.readFile('file.txt', (err, data) => {
  if (err) throw err;
  // process data
});
```

### 範例 6：Python 函式效能分析
```python
import cProfile
import pstats

def slow_function():
    ...

cProfile.run('slow_function()', 'profile.stats')
p = pstats.Stats('profile.stats')
p.sort_stats('cumulative').print_stats(10)
```

### 範例 7：Node.js 用 Redis 快取
```javascript
const redis = require('redis');
const client = redis.createClient();

function getCachedData(key, fetchFunction) {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (data) return resolve(JSON.parse(data));
      fetchFunction().then(result => {
        client.setex(key, 3600, JSON.stringify(result));
        resolve(result);
      });
    });
  });
}
```

---

## 參考資料與延伸閱讀
- [Google Web Fundamentals: Performance](https://web.dev/performance/)
- [MDN Web Docs: Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [OWASP: Performance Testing](https://owasp.org/www-project-performance-testing/)
- [Microsoft Performance Best Practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/performance)
- [PostgreSQL Performance Optimization](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Python Performance Tips](https://docs.python.org/3/library/profile.html)
- [Java Performance Tuning](https://www.oracle.com/java/technologies/javase/performance.html)
- [.NET Performance Guide](https://learn.microsoft.com/en-us/dotnet/standard/performance/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)
- [k6 負載測試](https://k6.io/)
- [Gatling](https://gatling.io/)
- [Locust](https://locust.io/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Jaeger](https://www.jaegertracing.io/)
- [Zipkin](https://zipkin.io/)

---

## 結論

效能最佳化是持續的過程。請不斷量測、分析與迭代。善用本指南的最佳實踐、檢查清單與疑難排解技巧，協助你開發與審查高效能、可延展且高效率的軟體。若有新秘訣或經驗，歡迎補充，讓本指南持續成長！

---

<!-- 效能最佳化指引結束 --> 
