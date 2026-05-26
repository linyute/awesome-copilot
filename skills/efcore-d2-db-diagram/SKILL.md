---
name: efcore-d2-db-diagram
description: "使用 Entity Framework Core 模型產生 D2 資料庫圖表。適用於：EF Core 資料庫圖表、Entity Framework Core ERD、DbContext 圖表、C# 實體關係圖、PostgreSQL 綱要視覺化、從 EF Core 實體產生 .d2 檔案、Fluent API 對應圖表、基於遷移的資料庫圖表、資料表關聯、擁有的型別、多對多連結資料表、索引與限制。不適用於：執行階段偵錯、執行資料庫遷移、部署綱要、SQL 效能調校或 draw.io 圖表。"
---

# EF Core D2 資料庫圖表產生器

## 何時使用

當使用者想要從 Entity Framework Core 程式碼庫產生資料庫 / ERD 圖表時，請使用此技能。

典型需求：

- 從 EF Core 實體產生 D2 資料庫圖表。
- 視覺化資料表、欄位、主鍵、外鍵與關聯。
- 分析 `DbContext`、`DbSet<T>`、`IEntityTypeConfiguration<T>`、Fluent API 與遷移。
- 產生可透過 `d2` CLI 渲染為 SVG/PNG 的 `.d2` 檔案。
- 為 ASP.NET Core / .NET 專案的資料庫模型編寫文件。

## 目標

建立一個可讀的 D2 實體關係圖，該圖表應反映實際的 EF Core 持續性模型，而不僅僅是原始 C# 類別的形狀。

圖表必須優先考慮：

1. 資料庫資料表與關聯。
2. 主鍵、外鍵、必填/選填欄位。
3. 擁有的型別 (Owned types) 與值物件 (Value objects)。
4. 多對多關聯與連結資料表。
5. 索引、唯一限制與資料表名稱。
6. 僅在沒有明確對應時使用 EF Core 慣例。

輸出為 `.d2` 原始碼。可透過 `d2` CLI 渲染為 SVG 或 PNG。

## 工具

- **d2 CLI**: 將 `.d2` 檔案渲染為 SVG/PNG。
  - `d2 input.d2 output.svg`
  - `d2 --layout=elk input.d2 output.svg`
- **d2 fmt**: 格式化 D2 檔案。
  - `d2 fmt input.d2`
- 不需要 MCP 伺服器。此技能將 D2 原始碼以文字形式產生。

## 建議工作流程

1. 閱讀 EF Core 專案結構。
2. 找到所有 `DbContext` 類別。
3. 找到所有 `DbSet<T>` 宣告。
4. 找到實體類別、擁有的型別、列舉型別與值物件。
5. 閱讀 `OnModelCreating` 與所有 `IEntityTypeConfiguration<T>` 類別。
6. 當可用時，閱讀遷移以確認資料表名稱、連結資料表、索引與刪除行為。
7. 在編寫 D2 之前，建立標準化的資料庫模型。
8. 在產生前，先詢問必要的圖表問卷。
9. 使用資料庫模型（而非原始類別巢狀）來產生 `.d2` 檔案。
10. 在交付前，使用 `d2 fmt` 驗證 D2 語法。
11. 盡可能使用 `d2 --layout=elk schema.d2 schema.svg` 進行渲染。
12. 若要重新產生，請先重新閱讀 EF Core 對應與遷移。

## 產生圖表前的強制問題

對於每個新圖表與每次重新產生，除非使用者已在相同請求中回答，否則請詢問這些問題。

1. `Which DbContext should be diagrammed? (auto-detect/all/specific name)` (應繪製哪個 DbContext？自動偵測/全部/特定名稱)
2. `Display columns? (all/key-only/none)` (顯示欄位？全部/僅鍵/無)
3. `Display column types? (Yes/No)` (顯示欄位型別？是/否)
4. `Display nullable/required markers? (Yes/No)` (顯示可為 null/必填標記？是/否)
5. `Display indexes and unique constraints? (Yes/No)` (顯示索引與唯一限制？是/否)
6. `Display enum values? (Yes/No)` (顯示列舉值？是/否)
7. `Display owned types? (inline/separate/hide)` (顯示擁有的型別？內嵌/分開/隱藏)
8. `Display many-to-many join tables? (explicit/compact/hide)` (顯示多對多連結資料表？明確/緊湊/隱藏)
9. `Display audit/technical tables? (Yes/No)` (顯示稽核/技術資料表？是/否)
10. `Display migration-only tables not present as entities? (Yes/No)` (顯示僅遷移用的資料表？是/否)
11. `Which grouping mode? (bounded-context/schema/namespace/flat)` (哪種分組模式？領域邊界/綱要/命名空間/平面)
12. `Which layout engine? (elk/dagre/tala)` (哪個排版引擎？elk/dagre/tala)
13. `Which output format? (d2/svg/png)` (哪個輸出格式？d2/svg/png)

預設值（當使用者要求快速產生時）：

- DbContext: `auto-detect`
- Columns: `key-only`
- Column types: `Yes`
- Nullable markers: `Yes`
- Indexes: `Yes`
- Enums: `No`
- Owned types: `inline`
- Join tables: `explicit`
- Audit/technical tables: `No`
- Migration-only tables: `Yes`
- Grouping: `bounded-context`
- Layout: `elk`
- Output: `d2`

## 參考文件

視需要載入：

| 參考 | 何時載入 |
|---|---|
| `references/efcore-model-extraction.md` | 讀取 DbContext、DbSet、Fluent API、設定與遷移的規則 |
| `references/d2-erd-style.md` | ERD 圖表的 D2 語法與視覺慣例 |
| `references/relationship-rules.md` | 如何推斷一對一、一對多、多對多與擁有的關聯 |
| `references/grouping-modes.md` | 領域邊界、綱要、命名空間與平面分組規則 |
| `references/quality-gate.md` | 交付產生的圖表前的最終檢查清單 |

## EF Core 擷取規則

### 來源優先順序

當來源不一致時，請依照此優先順序：

1. 最新套用的遷移 / 遷移快照。
2. `OnModelCreating` 或 `IEntityTypeConfiguration<T>` 中的 Fluent API 設定。
3. 資料註釋 (Data annotations)。
4. EF Core 慣例。
5. 原始 C# 類別形狀。

### 必須檢測的 EF Core 概念

檢測並呈現：

- `DbContext` 與 `DbSet<T>`。
- 實體類別名稱與 `ToTable` 實際資料表名稱。
- `ToTable("Table", "schema")` 中的綱要名稱。
- 來自 `HasKey`、`[Key]`、慣例與遷移的主鍵。
- 複合鍵。
- 來自 `HasForeignKey`、導覽屬性與遷移操作的外鍵。
- 明確的刪除行為：`Cascade`, `Restrict`, `NoAction`, `SetNull`, `ClientSetNull`。
- 必填/選填關聯標記。
- 來自 `OwnsOne`、`OwnsMany` 與 `[Owned]` 的擁有的型別。
- 來自 `UsingEntity` 與隱含 EF Core 連結資料表的多對多關聯。
- 來自 `HasIndex`、`IsUnique` 與遷移的索引。
- 來自 `HasAlternateKey` 的替代鍵。
- 在 Fluent API 中設定的 Shadow 屬性。
- 影響持續型別或可讀性的值轉換 (Value conversions)。
- 列舉屬性。
- 已忽略的屬性與已忽略的實體。

## 圖表渲染規則

### 資料表

盡可能將每個持續性資料表表示為 `shape: sql_table` 的 D2 節點。

使用此內容慣例：

```d2
Clients: {
  shape: sql_table
  constraint: primary_key
  Id: uuid {constraint: primary_key}
  Name: text
  Status: enum
}
```

若 `sql_table` 不可用或導致驗證問題，則回退到具有結構化文字的矩形。

### 關聯

使用從「依賴資料表」指向「主體資料表」的有向邊緣。

已知時，標籤必須包含關聯基數與 FK 名稱：

```d2
Offers.ClientId -> Clients.Id: "N:1 FK_Offers_Clients_ClientId"
```

使用這些基數標籤：

- `1:1`
- `1:N`
- `N:1`
- `N:N`
- `owned`

### 擁有的型別 (Owned types)

擁有的型別預設為內嵌渲染。

內嵌範例：

```d2
Clients: {
  shape: sql_table
  Id: uuid {constraint: primary_key}
  Address.Street: text
  Address.ZipCode: text
  Address.City: text
}
```

若使用者選擇 `separate`，請將擁有的型別表示為視覺上從屬的資料表，並使用 `owned` 關聯。

### 多對多 (Many-to-many)

預設為明確的連結資料表，因為 EF Core 會建立真實資料表。

對於隱含的多對多關聯，請建立一個產生的連結資料表節點，並將其標記為 `implicit join`。

### 技術資料表

除非要求，否則預設隱藏技術資料表。

範例：

- `__EFMigrationsHistory`
- Hangfire 資料表
- ASP.NET Identity 資料表
- 稽核記錄 (Audit logs)
- Outbox 資料表

若隱藏了技術資料表，請在圖表後的總結中提及它們。

## 分組模式 (Grouping Modes)

- `bounded-context`: 依偵測到的領域區域或資料夾/模組分組。
- `schema`: 依資料庫綱要分組，例如 `public`, `auth`, `billing`。
- `namespace`: 依 C# 命名空間分組。
- `flat`: 無容器，所有資料表在相同層級。

## 風格規則

使用一致的風格：

- 主要實體資料表：實線邊框。
- 連結資料表：虛線邊框。
- 擁有的型別：較淡的筆觸或巢狀內嵌欄位。
- 技術資料表：柔和風格。
- 外部資料表或僅遷移用的資料表：點狀邊框。
- 必填關聯：實線。
- 選填關聯：虛線。
- Cascade 刪除：標籤後綴 `cascade`。

## 交付前的品質閘道

在交付圖表前，請確認：

- [ ] 已明確選擇 DbContext。
- [ ] 已考慮所有 `DbSet<T>` 實體。
- [ ] 已讀取 Fluent API 設定。
- [ ] 已檢查遷移（若存在）。
- [ ] 資料表名稱與綱要名稱符合 EF Core 對應。
- [ ] 主鍵已存在。
- [ ] 已呈現外鍵與基數。
- [ ] 已根據使用者選擇處理擁有的型別。
- [ ] 多對多連結資料表為明確呈現（除非使用者要求其他方式）。
- [ ] 隱藏的技術資料表已列於最終總結中。
- [ ] D2 語法透過 `d2 fmt` 驗證為有效。
- [ ] 當位於容器內時，邊緣端點使用完整的點記號法。
- [ ] 圖表保持可讀性並避免過多交叉的排版。

## 輸出格式

當使用者要求安裝技能時，提供此資料夾結構：

```text
.github/
  skills/
    efcore-d2-db-diagram/
      SKILL.md
      references/
        efcore-model-extraction.md
        d2-erd-style.md
        relationship-rules.md
        grouping-modes.md
        quality-gate.md
```

當使用者要求產生圖表時，提供：

1. `.d2` 原始檔案內容。
2. 使用所選排版引擎的渲染指令。
3. 關於假設與隱藏資料表的簡明總結。
