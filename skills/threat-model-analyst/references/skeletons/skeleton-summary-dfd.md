# Skeleton: 1.2-threatmodel-summary.mmd

> **⛔ 在建立 `1.1-threatmodel.mmd` 後，務必評估此 Skeleton。**
> 計算詳細 DFD 中的元件（節點標記為 `(("..."))`, `[("...")]`, `["..."]`）和邊界（`subgraph`）。
> - 如果元件數量 > 15 或邊界數量 > 4 → 此檔案為**必填**。請填寫下方的範本。
> - 如果元件數量 ≤ 15 且邊界數量 ≤ 4 → **跳過**此檔案。直接進行 `1-threatmodel.md`。
> **⛔ 這是一個原始的 Mermaid 檔案。下方的範本僅為了可讀性而顯示在程式碼區塊中 —— 請勿在輸出檔案中包含程式碼區塊符號。`.mmd` 檔案必須在第 1 行以 `%%{init:` 開頭。**

---

```
%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'primaryColor': '#ffffff', 'lineColor': '#666666' }}}%%
flowchart LR
    classDef process fill:#6baed6,stroke:#2171b5,stroke-width:2px,color:#000000
    classDef external fill:#fdae61,stroke:#d94701,stroke-width:2px,color:#000000
    classDef datastore fill:#74c476,stroke:#238b45,stroke-width:2px,color:#000000

    [FILL: 外部參與者 —— 保留所有，請勿聚合]
    [FILL: ExternalActor]["[FILL: Name]"]:::external

    [重複：每個信任邊界一個 subgraph —— 必須保留所有邊界]
    subgraph [FILL: BoundaryID]["[FILL: Boundary Name]"]
        [FILL: 聚合及單獨節點]
    end
    [結束重複]

    [重複：使用 SDF 前綴的摘要資料流]
    [FILL: Source] <-->|"[FILL: SDF##: description]"| [FILL: Target]
    [結束重複]

    [重複：邊界樣式]
    style [FILL: BoundaryID] fill:none,stroke:#e31a1c,stroke-width:3px,stroke-dasharray: 5 5
    [結束重複]

    linkStyle default stroke:#666666,stroke-width:2px
```

## 聚合規則 (Aggregation Rules)

**參考：** `diagram-conventions.md` → Summary Diagram Rules 以獲取完整詳細資訊。

1. **必須保留所有信任邊界** —— 絕不合併或省略邊界。
2. **單獨保留：** 入口點、核心流程元件、安全關鍵服務、主要資料儲存、所有外部參與者。
3. **僅聚合：** 支援性基礎架構、次要快取、處於相同信任層級的多個外部實體。
4. **聚合元件的標籤必須列出內容：**
   ```
   DataLayer[("資料層<br/>(UserDB, OrderDB, Redis)")]
   SupportServices(("支援服務<br/>(Logging, Monitoring)"))
   ```
5. **資料流 ID：** 使用 `SDF` 前綴：`SDF01`, `SDF02`, ...

## 在 `1-threatmodel.md` 中為必要

當產生此檔案時，`1-threatmodel.md` 必須包含：
- 一個 `## Summary View` 章節，並在 ` ```mermaid ` 區塊中包含此圖表
- 一個 `## Summary to Detailed Mapping` 表格：

```markdown
| Summary Element | Contains | Summary Flows | Maps to Detailed Flows |
|----------------|----------|---------------|------------------------|
| [FILL] | [FILL: 詳細元件清單] | [FILL: SDF##] | [FILL: DF## 清單] |
```
