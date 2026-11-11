# 關聯、Cascade、集合

## 搭配協助程式的雙向關聯

擁有端持有外鍵（`@ManyToOne`）。反向端使用 `mappedBy`。在領域模型中保持兩端同步，否則記憶體內的物件圖會與資料庫產生分歧。

```java
@Entity
class Order {
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLine> lines = new ArrayList<>();

    public void addLine(OrderLine line) {
        lines.add(line);
        line.setOrder(this);
    }

    public void removeLine(OrderLine line) {
        lines.remove(line);
        line.setOrder(null);
    }

    public List<OrderLine> getLines() {
        return Collections.unmodifiableList(lines);
    }
}

@Entity
class OrderLine {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;
}
```

規則：
- 僅有 `@ManyToOne` 端會寫入外鍵；僅變更反向集合對資料庫不會產生任何作用。
- 以唯讀方式公開集合（或進行防禦性複製）；初始化一次後切勿替換其參照（`order.setLines(new ArrayList<>())` 會破壞 orphan removal 並擾亂 Hibernate 的集合追蹤機制：請使用 `clear()`/`add()` 進行就地異動）。
- 當從不導覽父項 -> 子項時，優先使用單向 `@ManyToOne` 並在需要時查詢多端。

## 單向 @OneToMany 反模式

未加 `mappedBy` 且未加 `@JoinColumn` 的 `@OneToMany` 會建立聯結資料表並產生額外的 SQL。加上 `@JoinColumn` 則會先執行 `INSERT` 接著執行 `UPDATE` 來更新外鍵。請將關聯改為雙向（或僅保留 `@ManyToOne`）。

## Cascade 陷阱

| 陷阱 | 修正方式 |
| --- | --- |
| 在 `@ManyToOne` 或 `@ManyToMany` 上使用 `CascadeType.ALL`/`REMOVE`：刪除單一子項會刪除共用的父項或相關資料列 | 僅從父項串聯至專屬擁有的子項。 |
| 對龐大集合使用 `CascadeType.REMOVE` 會逐列載入並逐列刪除 | 排清擱置變更，執行大量 `DELETE ... WHERE parent_id = :id`，接著清理 context；或者搭配 `@OnDelete(action = OnDeleteAction.CASCADE)` 使用資料庫層級的 `ON DELETE CASCADE`。 |
| 在分離（detached）子項上使用 `CascadeType.PERSIST`：`PersistentObjectException: detached entity passed to persist` | 使用 `merge`（或先載入實體）；切勿在設定了 persist-cascade 的關聯上指派分離的執行個體。 |
| `CascadeType.MERGE` 以過期的 DTO 資料覆寫狀態 | 僅將允許的欄位複製到受管實體上。 |
| 在共用的子項上使用 `orphanRemoval = true` | 僅適用於獨佔、父項擁有的子項；從集合中移除會直接刪除該資料列。 |
| 在 `orphanRemoval` 映射上以 `setX(newList)` 替換集合 | 會擲出 `A collection with cascade="all-delete-orphan" was no longer referenced`；請就地異動集合。 |

`orphanRemoval` 亦隱含在父項被移除時一併刪除子項。

## 集合型別選擇

- `@ManyToMany`：使用 `Set`。若使用 `List`（bag），移除一個元素會刪除聯結資料表中的**所有**資料列並重新插入其餘項目。
- 除了純粹的連結之外，避免使用 `@ManyToMany`；一旦聯結本身具備屬性或需要查詢它時，請將該聯結塑模為實體（兩側均搭配 `@ManyToOne`）。
- 搭配 `@OrderColumn` 的 `@OneToMany` `List` 在從頭部移除元素時會重寫索引資料行；讀取時請改用 `@OrderBy` 進行排序。
- 可能包含數千列的集合根本不應該被映射；請透過分頁查詢它們。
- 切勿在大型延遲集合上呼叫 `collection.size()` 或 `contains()` 來計數/檢查；請執行 count/exists 查詢（`@LazyCollection(EXTRA)` 已被廢棄）。

## 集合中的相等性

`Set` 語意依賴於 `equals`/`hashCode`（請參閱 `identifiers-and-entity-design.md`）。若實體的 `hashCode` 依賴於產生的 id，其 `HashSet` 在 `persist` 之後將會遺失元素。

## 一對一 (One-to-One)

針對真正的一對一關係，優先採用共用主鍵（`@MapsId`）：無額外索引、可從擁有端延遲載入，且可透過單一查詢進行 `find`。若不採用此方式，反向端（`mappedBy`）通常會被積極載入，因為 Hibernate 必須查詢以確認其是否為 null；唯有當 `optional = false` 保證資料列存在，或透過位元組碼增強（bytecode enhancement）時，它才能成為延遲代理物件。

## 刪除與更新模式

- 移除包含子項的父項：可透過 cascade REMOVE（小型、專屬擁有的集合）、資料庫層級 cascade，或依序明確執行大量刪除（子項優先）。
- 大量 JPQL/HQL `update`/`delete` 會繞過持續性上下文與版本資料行；執行前請先排清，執行後請 `clear()` 或重新整理實體。
