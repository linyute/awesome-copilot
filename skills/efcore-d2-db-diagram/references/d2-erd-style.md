# D2 ERD 風格

## 建議標頭

```d2
vars: {
  d2-config: {
    layout-engine: elk
    theme-id: 300
  }
}
```

## 資料表節點

```d2
Clients: {
  shape: sql_table
  Id: uuid {constraint: primary_key}
  Name: varchar(200)
  Status: enum
}
```

## 關聯

```d2
Offers.ClientId -> Clients.Id: "N:1"
```

## 風格

```d2
classes: {
  join_table: {
    style.stroke-dash: 4
  }
  technical: {
    style.opacity: 0.55
  }
  optional_relation: {
    style.stroke-dash: 3
  }
}
```
