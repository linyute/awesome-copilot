---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '通用 SQL 效能最佳化助理，針對所有 SQL 資料庫（MySQL、PostgreSQL、SQL Server、Oracle）提供查詢調校、索引策略與資料庫效能分析。涵蓋執行計畫分析、分頁最佳化、批次操作與效能監控指引。'
tested_with: 'GitHub Copilot Chat (GPT-4o) - 驗證於 2025 年 7 月 20 日'
---

# SQL 效能最佳化助理

針對 ${selection}（若未選取則為整個專案）提供專業 SQL 效能最佳化。聚焦於適用於 MySQL、PostgreSQL、SQL Server、Oracle 及其他 SQL 資料庫的通用 SQL 最佳化技巧。

## 🎯 核心最佳化領域

### 查詢效能分析
```sql
-- ❌ 不建議：低效查詢模式
SELECT * FROM orders o
WHERE YEAR(o.created_at) = 2024
  AND o.customer_id IN (
      SELECT c.id FROM customers c WHERE c.status = 'active'
  );

-- ✅ 建議：最佳化查詢並加上索引提示
SELECT o.id, o.customer_id, o.total_amount, o.created_at
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01' 
  AND o.created_at < '2025-01-01'
  AND c.status = 'active';

-- 必要索引：
-- CREATE INDEX idx_orders_created_at ON orders(created_at);
-- CREATE INDEX idx_customers_status ON customers(status);
-- CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### 索引策略最佳化
```sql
-- ❌ 不建議：索引策略不佳
CREATE INDEX idx_user_data ON users(email, first_name, last_name, created_at);

-- ✅ 建議：最佳化複合索引
-- 適用於先以 email 篩選再以 created_at 排序的查詢
CREATE INDEX idx_users_email_created ON users(email, created_at);

-- 適用於姓名全文搜尋
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- 適用於用戶狀態查詢
CREATE INDEX idx_users_status_created ON users(status, created_at)
WHERE status IS NOT NULL;
```

### 子查詢最佳化
```sql
-- ❌ 不建議：關聯子查詢
SELECT p.product_name, p.price
FROM products p
WHERE p.price > (
    SELECT AVG(price) 
    FROM products p2 
    WHERE p2.category_id = p.category_id
);

-- ✅ 建議：視窗函式解法
SELECT product_name, price
FROM (
    SELECT product_name, price,
           AVG(price) OVER (PARTITION BY category_id) as avg_category_price
    FROM products
) ranked
WHERE price > avg_category_price;
```

## 📊 效能調校技巧

### JOIN 最佳化
```sql
-- ❌ 不建議：JOIN 順序與條件低效
SELECT o.*, c.name, p.product_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at > '2024-01-01'
  AND c.status = 'active';

-- ✅ 建議：最佳化 JOIN 並提前過濾
SELECT o.id, o.total_amount, c.name, p.product_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id AND c.status = 'active'
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.created_at > '2024-01-01';
```

### 分頁最佳化
```sql
-- ❌ 不建議：OFFSET 分頁（大量偏移時效能差）
SELECT * FROM products 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 10000;

-- ✅ 建議：游標分頁
SELECT * FROM products 
WHERE created_at < '2024-06-15 10:30:00'
ORDER BY created_at DESC 
LIMIT 20;

-- 或以 ID 為游標
SELECT * FROM products 
WHERE id > 1000
ORDER BY id 
LIMIT 20;
```

### 聚合最佳化
```sql
-- ❌ 不建議：多次分開聚合查詢
SELECT COUNT(*) FROM orders WHERE status = 'pending';
SELECT COUNT(*) FROM orders WHERE status = 'shipped';
SELECT COUNT(*) FROM orders WHERE status = 'delivered';

-- ✅ 建議：單一查詢條件聚合
SELECT 
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_count,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count
FROM orders;
```

## 🔍 查詢反模式

### SELECT 效能問題
```sql
-- ❌ 不建議：SELECT * 反模式
SELECT * FROM large_table lt
JOIN another_table at ON lt.id = at.ref_id;

-- ✅ 建議：明確選取欄位
SELECT lt.id, lt.name, at.value
FROM large_table lt
JOIN another_table at ON lt.id = at.ref_id;
```

### WHERE 子句最佳化
```sql
-- ❌ 不建議：WHERE 子句中使用函式
SELECT * FROM orders 
WHERE UPPER(customer_email) = 'JOHN@EXAMPLE.COM';

-- ✅ 建議：友善索引的 WHERE 子句
SELECT * FROM orders 
WHERE customer_email = 'john@example.com';
-- 建議：CREATE INDEX idx_orders_email ON orders(LOWER(customer_email));
```

### OR vs UNION 最佳化
```sql
-- ❌ 不建議：複雜 OR 條件
SELECT * FROM products 
WHERE (category = 'electronics' AND price < 1000)
   OR (category = 'books' AND price < 50);

-- ✅ 建議：UNION 提升最佳化
SELECT * FROM products WHERE category = 'electronics' AND price < 1000
UNION ALL
SELECT * FROM products WHERE category = 'books' AND price < 50;
```

## 📈 資料庫中立最佳化

### 批次操作
```sql
-- ❌ 不建議：逐行操作
INSERT INTO products (name, price) VALUES ('Product 1', 10.00);
INSERT INTO products (name, price) VALUES ('Product 2', 15.00);
INSERT INTO products (name, price) VALUES ('Product 3', 20.00);

-- ✅ 建議：批次新增
INSERT INTO products (name, price) VALUES 
('Product 1', 10.00),
('Product 2', 15.00),
('Product 3', 20.00);
```

### 暫存表使用
```sql
-- ✅ 建議：複雜運算使用暫存表
CREATE TEMPORARY TABLE temp_calculations AS
SELECT customer_id, 
       SUM(total_amount) as total_spent,
       COUNT(*) as order_count
FROM orders 
WHERE created_at >= '2024-01-01'
GROUP BY customer_id;

-- 進一步運算可用暫存表
SELECT c.name, tc.total_spent, tc.order_count
FROM temp_calculations tc
JOIN customers c ON tc.customer_id = c.id
WHERE tc.total_spent > 1000;
```

## 🛠️ 索引管理

### 索引設計原則
```sql
-- ✅ 建議：覆蓋索引設計
CREATE INDEX idx_orders_covering 
ON orders(customer_id, created_at) 
INCLUDE (total_amount, status);  -- SQL Server 語法
-- 或：CREATE INDEX idx_orders_covering ON orders(customer_id, created_at, total_amount, status); -- 其他資料庫
```

### 部分索引策略
```sql
-- ✅ 建議：特定條件使用部分索引
CREATE INDEX idx_orders_active 
ON orders(created_at) 
WHERE status IN ('pending', 'processing');
```

## 📊 效能監控查詢

### 查詢效能分析
```sql
-- 通用方式找出慢查詢
--（各資料庫語法略有不同）

-- MySQL：
SELECT query_time, lock_time, rows_sent, rows_examined, sql_text
FROM mysql.slow_log
ORDER BY query_time DESC;

-- PostgreSQL：
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC;

-- SQL Server：
SELECT 
    qs.total_elapsed_time/qs.execution_count as avg_elapsed_time,
    qs.execution_count,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(qt.text)
        ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) as query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_elapsed_time DESC;
```

## 🎯 通用最佳化檢查清單

### 查詢結構
- [ ] 生產查詢避免 SELECT *
- [ ] 適當選用 JOIN 類型（INNER vs LEFT/RIGHT）
- [ ] WHERE 子句早期過濾
- [ ] 子查詢適時用 EXISTS 取代 IN
- [ ] 避免 WHERE 子句中使用函式導致索引失效

### 索引策略
- [ ] 常查詢欄位建立索引
- [ ] 複合索引順序正確
- [ ] 避免過度索引（影響 INSERT/UPDATE 效能）
- [ ] 需要時使用覆蓋索引
- [ ] 特定查詢模式使用部分索引

### 資料型別與結構
- [ ] 適當選用資料型別提升儲存效率
- [ ] 適度正規化（OLTP 用 3NF，OLAP 可去正規化）
- [ ] 使用約束協助查詢最佳化
- [ ] 大型資料表適時分割

### 查詢模式
- [ ] 使用 LIMIT/TOP 控制結果集
- [ ] 實作高效分頁策略
- [ ] 批次操作處理大量資料
- [ ] 避免 N+1 查詢問題
- [ ] 重複查詢使用預備語句

### 效能測試
- [ ] 以真實資料量測試查詢
- [ ] 分析查詢執行計畫
- [ ] 持續監控查詢效能
- [ ] 慢查詢設警示
- [ ] 定期分析索引使用情形

## 📝 最佳化方法論

1. **識別**：用資料庫專屬工具找出慢查詢
2. **分析**：檢查執行計畫，找出瓶頸
3. **最佳化**：套用合適最佳化技巧
4. **測試**：驗證效能提升
5. **監控**：持續追蹤效能指標
6. **迭代**：定期效能回顧與優化

聚焦於可衡量的效能提升，並務必以真實資料量與查詢模式測試所有最佳化。
