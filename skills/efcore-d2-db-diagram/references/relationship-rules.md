# 關聯規則 (Relationship Rules)

## 一對多 (One-to-many)

檢測來源：

- `HasOne(...).WithMany(...)`
- 依賴實體上的 FK 屬性。
- 主體實體上的集合導覽 (Collection navigation)。

渲染「依賴」到「主體」：

```d2
Orders.ClientId -> Clients.Id: "N:1"
```

## 一對一 (One-to-one)

檢測來源：

- `HasOne(...).WithOne(...)`
- 唯一 FK 索引。
- 共用主鍵關聯。

渲染「依賴」到「主體」：

```d2
ClientProfiles.ClientId -> Clients.Id: "1:1"
```

## 多對多 (Many-to-many)

檢測來源：

- `UsingEntity`
- 兩個集合導覽，且沒有明確的連結實體。
- 由遷移建立的連結資料表，包含兩個 FK 和複合鍵。

預設情況下，明確渲染連結資料表。

## 擁有的型別 (Owned types)

檢測來源：

- `OwnsOne`
- `OwnsMany`
- `[Owned]`

預設情況下，除非偵測到資料表分割 (Table splitting) 或個別資料表對應，否則將其內嵌 (Inline)。

## 選用關聯 (Optional relationships)

當符合下列條件時，關聯為選用：

- FK 可為 null。
- 設定了 `IsRequired(false)`。
- 遷移欄位可為 null。

對選用關聯使用虛線。
