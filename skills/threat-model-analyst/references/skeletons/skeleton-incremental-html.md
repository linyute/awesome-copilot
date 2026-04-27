# 骨幹: incremental-comparison.html

> **⛔ 自包含的 HTML — 所有 CSS 均為行內。無 CDN 連結。請遵循此精確的 8 節結構。**

---

HTML 報告精確包含按此順序排列的 8 個章節。每個章節都必須出現。

## 第 1 節：頁首 + 比較卡片 (Header + Comparison Cards)
```html
<div class="header">
  <div class="report-badge">增量威脅模型比較 (INCREMENTAL THREAT MODEL COMPARISON)</div>
  <h1>[FILL: 儲存庫名稱]</h1>
</div>
<div class="comparison-cards">
  <div class="compare-card baseline">
    <div class="card-label">基準 (BASELINE)</div>
    <div class="card-hash">[FILL: 基準 SHA]</div>
    <div class="card-date">[FILL: 來自 git log 的基準提交日期]</div>
    <div class="risk-badge [FILL: old-class]">[FILL: 舊評等]</div>
  </div>
  <div class="compare-arrow">→</div>
  <div class="compare-card target">
    <div class="card-label">目標 (TARGET)</div>
    <div class="card-hash">[FILL: 目標 SHA]</div>
    <div class="card-date">[FILL: 來自 git log 的目標提交日期]</div>
    <div class="risk-badge [FILL: new-class]">[FILL: 新評等]</div>
  </div>
  <div class="compare-card trend">
    <div class="card-label">趨勢 (TREND)</div>
    <div class="trend-direction [FILL: color]">[FILL: Improving / Worsening / Stable]</div>
    <div class="trend-duration">[FILL: N 個月]</div>
  </div>
</div>
```
<!-- 骨幹指示：第 2 節 (風險轉移 Risk Shift) 已合併到上方的第 1 節中。舊的獨立 risk-shift div 已移除。comparison-cards div 取代了舊的副標題 + risk-shift + time-between 方框。 -->

## 第 2 節：指標欄 (5 個方塊) (Metrics Bar)
```html
<div class="metrics-bar">
  [FILL: 元件：舊 → 新 (±N)]
  [FILL: 信任邊界：舊 → 新 (±N)]
  [FILL: 威脅：舊 → 新 (±N)]
  [FILL: 發現項：舊 → 新 (±N)]
  [FILL: 程式碼變更：N 個提交，M 個 PR — 使用 git rev-list --count 和 git log --oneline --merges --grep="Merged PR"]
</div>
```
**必須包含「信任邊界」作為 5 個指標之一。第 5 個方塊是「程式碼變更」(而非時間間隔)。**

## 第 3 節：狀態摘要卡片 (彩色) (Status Summary Cards)
```html
<div class="status-cards">
  <!-- 綠色卡片 --> 已修復：[FILL: 數量] [FILL: 1 句摘要，不含 ID]
  <!-- 紅色卡片 --> 新增：[FILL: 數量] [FILL: 1 句摘要，不含 ID]
  <!-- 琥珀色卡片 --> 先前未識別：[FILL: 數量] [FILL: 1 句摘要，不含 ID]
  <!-- 灰色卡片 --> 仍然存在：[FILL: 數量] [FILL: 1 句摘要，不含 ID]
</div>
```
<!-- 骨幹指示：狀態卡片僅顯示「數量」+ 一個簡短的人類可讀句子。
  請勿包含威脅 ID (T06.S, T02.E)、發現項 ID (FIND-14) 或元件名稱。
  正確："已修復 1 個憑證處理弱點"
  正確："識別出 4 個新元件及 21 個新威脅"
  正確："未引入新威脅或發現項"
  錯誤："T06.S: DefaultAzureCredential → ManagedIdentityCredential"
  錯誤："ConfigurationOrchestrator — 5 個威脅 (T16.*), LLMService — 6 個威脅 (T17.*)"
  包含 ID 的詳細逐項細目屬於第 5 節 (威脅/發現項狀態細目)。 -->
**狀態資訊僅出現在此處 — 指標欄中不得重複。**

## 第 4 節：元件狀態網格 (Component Status Grid)
```html
<table class="component-grid">
  <tr><th>元件</th><th>類型</th><th>狀態</th><th>原始碼檔案</th></tr>
  [重複：每個元件一列，帶有顏色編碼的狀態徽章]
  <tr><td>[FILL]</td><td>[FILL]</td><td><span class="badge-[FILL: 狀態]">[FILL]</span></td><td>[FILL]</td></tr>
  [結束重複]
</table>
```

## 第 5 節：威脅/發現項狀態細目 (Threat/Finding Status Breakdown)
```html
<div class="status-breakdown">
  [FILL: 依狀態分組 — 已修復項目、新增項目等]
  [重複：每個項目：ID | 標題 | 元件 | 狀態]
  [結束重複]
</div>
```

## 第 6 節：包含差異的 STRIDE 熱圖 (STRIDE Heatmap with Deltas)
```html
<table class="stride-heatmap">
  <thead>
    <tr>
      <th>元件</th>
      <th>S</th><th>T</th><th>R</th><th>I</th><th>D</th><th>E</th><th>A</th>
      <th>總計</th>
      <th class="divider"></th>
      <th>T1</th><th>T2</th><th>T3</th>
    </tr>
  </thead>
  <tbody>
    [重複：每個元件一列]
    <tr>
      <td>[FILL: 元件]</td>
      <td>[FILL: S 值] [FILL: 差異指示器 ▲/▼]</td>
      ... [T, R, I, D, E, A, 總計比照辦理] ...
      <td class="divider"></td>
      <td>[FILL: T1]</td><td>[FILL: T2]</td><td>[FILL: T3]</td>
    </tr>
    [結束重複]
  </tbody>
</table>
```
**必須有 13 欄：元件 + S + T + R + I + D + E + A + 總計 + 分隔線 + T1 + T2 + T3**

## 第 7 節：需要驗證 (Needs Verification)
```html
<div class="needs-verification">
  [重複：分析與舊報告不一致的項目]
  [FILL: 項目描述]
  [結束重複]
</div>
```

## 第 8 節：頁尾 (Footer)
```html
<div class="footer">
  模型：[FILL] | 持續時間：[FILL]
  基準：[FILL: 資料夾] 於 [FILL: SHA]
  產出時間：[FILL: 時間戳記]
</div>
```

---

**固定 CSS 變數 (在 `<style>` 區塊中使用)：**
```css
--red: #dc3545;    /* 新增弱點 */
--green: #28a745;  /* 已修復/改善 */
--amber: #fd7e14;  /* 先前未識別 */
--gray: #6c757d;   /* 仍然存在 */
--accent: #2171b5; /* 已修改/資訊 */
```

**固定規則：**
- 所有 CSS 均在行內 `<style>` 區塊中 — 無外部樣式表
- 包含 `@media print` 樣式
- 熱圖在分隔線後必須有 T1/T2/T3 欄位
- 指標欄必須包含「信任邊界」
- 狀態資料僅在卡片中顯示 — 不得在指標欄中重複
- HTML 威脅/發現項總數必須與 Markdown STRIDE 摘要總數相符
