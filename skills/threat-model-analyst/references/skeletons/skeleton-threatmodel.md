# Skeleton: 1-threatmodel.md

> **⛔ 逐字複製下方的範本內容（不包括外部程式碼區塊）。取代 `[FILL]` 預留位置。`.md` 和 `.mmd` 中的圖表必須完全相同。**
> **⛔ 資料流表 (Data Flow Table) 欄位：`ID | Source | Target | Protocol | Description`。請勿將 `Target` 重新命名為 `Destination`。請勿更換欄位順序。**
> **⛔ 信任邊界表 (Trust Boundary Table) 欄位：`Boundary | Description | Contains`（3 個欄位）。請勿增加 `Name` 欄位或將 `Contains` 重新命名為 `Components Inside`。**

---

````markdown
# 威脅模型 (Threat Model)

## 資料流圖 (Data Flow Diagram)

```mermaid
[FILL: 從 1.1-threatmodel.mmd 複製完全相同的內容]
```

## 元件表 (Element Table)

| Element | Type | TMT Category | Description | Trust Boundary |
|---------|------|--------------|-------------|----------------|
[條件：對於具有 sidecar 的 K8s 應用程式，在 Trust Boundary 之後增加一個 `Co-located Sidecars` 欄位]
[重複：每個元件一行]
| [FILL] | [FILL: Process / External Interactor / Data Store] | [FILL: SE.P.TMCore.* / SE.EI.TMCore.* / SE.DS.TMCore.*] | [FILL] | [FILL] |
[結束重複]

## 資料流表 (Data Flow Table)

| ID | Source | Target | Protocol | Description |
|----|--------|--------|----------|-------------|
[重複：每個資料流一行]
| [FILL: DF##] | [FILL] | [FILL] | [FILL] | [FILL] |
[結束重複]

## 信任邊界表 (Trust Boundary Table)

| Boundary | Description | Contains |
|----------|-------------|----------|
[重複：每個信任邊界一行]
| [FILL] | [FILL] | [FILL: 以逗號分隔的元件清單] |
[結束重複]

[條件：僅在產生摘要圖表（元件 > 15 或邊界 > 4）時包含]

## 摘要檢視 (Summary View)

```mermaid
[FILL: 從 1.2-threatmodel-summary.mmd 複製完全相同的內容]
```

## 摘要與詳細映射 (Summary to Detailed Mapping)

| Summary Element | Contains | Summary Flows | Maps to Detailed Flows |
|-----------------|----------|---------------|------------------------|
[重複]
| [FILL] | [FILL] | [FILL: SDF##] | [FILL: DF##, DF##] |
[結束重複]

[結束條件]
````

**固定規則：**
- 詳細資料流使用 `DF01`, `DF02`；摘要資料流使用 `SDF01`, `SDF02`
- 元件類型 (Element Type)：必須為 `Process`、`External Interactor` 或 `Data Store`
- TMT 類別 (TMT Category)：必須是來自 tmt-element-taxonomy.md 的特定 ID（例如：`SE.P.TMCore.WebSvc`）
