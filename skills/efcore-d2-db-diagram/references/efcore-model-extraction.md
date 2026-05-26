# EF Core 模型擷取

## 檢查檔案

按此順序檢查：

1. `DbContext` 類別。
2. `DbSet<T>` 宣告。
3. `OnModelCreating`。
4. `IEntityTypeConfiguration<T>` 類別。
5. 實體 (Entity) 類別。
6. 遷移 (Migrations) 與模型快照 (Model snapshot)。
7. 資料註釋 (Data annotations)。

## 對應優先順序

當來源發生衝突時，請依照下列順序優先使用：

1. 最新的遷移 / 模型快照。
2. Fluent API。
3. 資料註釋。
4. EF Core 慣例。
5. C# 形狀。

## 重要 EF Core API

尋找：

- `ToTable`
- `HasKey`
- `HasAlternateKey`
- `HasIndex`
- `IsUnique`
- `Property`
- `HasColumnName`
- `HasColumnType`
- `IsRequired`
- `HasMaxLength`
- `HasConversion`
- `HasOne`
- `WithMany`
- `WithOne`
- `HasForeignKey`
- `OnDelete`
- `OwnsOne`
- `OwnsMany`
- `UsingEntity`
- `Ignore`

## 遷移 (Migrations)

使用遷移來檢測：

- 實際資料表名稱。
- 連結資料表 (Join tables)。
- Shadow FK 欄位。
- 索引 (Indexes)。
- 複合鍵 (Composite keys)。
- 刪除行為 (Delete behaviors)。
- 僅遷移用的資料表。
