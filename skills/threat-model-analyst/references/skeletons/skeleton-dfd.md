# Skeleton: 1.1-threatmodel.mmd

> **⛔ 這是一個原始 Mermaid 檔案 — 沒有 Markdown 封裝。第 1 行必須以 `%%{init:` 開頭。**
> **init 區塊、classDefs 和 linkStyle 是固定的 — 絕不變更顏色/線條。**
> **圖表方向始終為 `flowchart LR` — 絕非 `flowchart TB`。**
> **⛔ 下方的範本僅為了可讀性而顯示在程式碼區塊內 — 請勿在輸出檔案中包含該程式碼區塊。**

---

```
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'primaryColor': '#ffffff', 'lineColor': '#666666' }}}%%
flowchart LR
    classDef process fill:#6baed6,stroke:#2171b5,stroke-width:2px,color:#000000
    classDef external fill:#fdae61,stroke:#d94701,stroke-width:2px,color:#000000
    classDef datastore fill:#74c476,stroke:#238b45,stroke-width:2px,color:#000000
    [CONDITIONAL: 增量模式 — 包含下方兩行]
    classDef newComponent fill:#d4edda,stroke:#28a745,stroke-width:3px,color:#000000
    classDef removedComponent fill:#e9ecef,stroke:#6c757d,stroke-width:1px,stroke-dasharray:5,color:#6c757d
    [END-CONDITIONAL]

    [REPEAT: 每個外部執行者/互動者一行 — 位於所有子圖之外]
    [FILL: NodeID]["[FILL: 顯示名稱]"]:::external
    [END-REPEAT]

    [REPEAT: 每個信任邊界一個子圖]
    subgraph [FILL: BoundaryID]["[FILL: 邊界顯示名稱]"]
        [REPEAT: 此邊界內的處理程序與資料儲存]
        [FILL: NodeID](("[FILL: 處理程序名稱]")):::process
        [FILL: NodeID][("[FILL: 資料儲存名稱]")]:::datastore
        [END-REPEAT]
    end
    [END-REPEAT]

    [REPEAT: 每個資料流程一行 — 使用 <--> 表示雙向請求-回應]
    [FILL: SourceID] <-->|"[FILL: DF##: 描述]"| [FILL: TargetID]
    [END-REPEAT]

    [REPEAT: 每個信任邊界子圖一個樣式行]
    style [FILL: BoundaryID] fill:none,stroke:#e31a1c,stroke-width:3px,stroke-dasharray: 5 5
    [END-REPEAT]

    linkStyle default stroke:#666666,stroke-width:2px
```

**絕不變更這些固定元素：**
- `%%{init:` themeVariables：僅限 `background`、`primaryColor`、`lineColor`
- `flowchart LR` — 絕非 TB
- classDef 顏色：process=#6baed6/#2171b5, external=#fdae61/#d94701, datastore=#74c476/#238b45
- 增量模式 classDefs（若適用）：newComponent=#d4edda/#28a745 (淺綠色), removedComponent=#e9ecef/#6c757d (灰色虛線)
- 新元件必須使用 `:::newComponent`（而非 `:::process`）。已移除元件必須使用 `:::removedComponent`。
- 信任邊界樣式：`fill:none,stroke:#e31a1c,stroke-width:3px,stroke-dasharray: 5 5`
- linkStyle：`stroke:#666666,stroke-width:2px`

**DFD 形狀：**
- 處理程序：`(("名稱"))`（雙括號 = 圓形）
- 資料儲存：`[("名稱")]`（中括號加括號 = 圓柱體）
- 外部：`["名稱"]`（中括號 = 矩形）
- 所有標籤必須包含在引號 `""` 內
- 所有子圖 ID：`subgraph ID["標題"]`

<!-- ⛔ DFD 後檢查點 — 建立此檔案後立即執行：
  1. 計算元件節點：具有 (("...")), [("...")], ["..."] 形狀的列數
  2. 計算邊界：具有 'subgraph' 的列數
  3. 若元件 > 15 或邊界 > 4：
     → 立即開啟 skeleton-summary-dfd.md 並建立 1.2-threatmodel-summary.mmd
     → 在摘要存在之前，切勿繼續進行 1-threatmodel.md
  4. 若未達閾值 → 跳過摘要，繼續進行 1-threatmodel.md
  這是最常被跳過的步驟。此檢查點是強制性的。 -->
