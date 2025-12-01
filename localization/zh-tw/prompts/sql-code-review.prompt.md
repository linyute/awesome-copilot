---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '通用 SQL 程式碼審查助手，針對所有 SQL 資料庫（MySQL、PostgreSQL、SQL Server、Oracle）進行全面安全性、可維護性與程式碼品質分析。重點檢查 SQL 注入防護、存取控制、程式標準與反模式偵測。可搭配 SQL 優化 prompt，完整涵蓋開發流程。'
tested_with: 'GitHub Copilot Chat (GPT-4o) - 2025 年 7 月 20 日驗證'
---

# SQL 程式碼審查

針對 ${selection}（如未選取則全專案），進行 SQL 程式碼全面審查，重點檢查安全性、效能、可維護性及資料庫最佳實務。

## 🔒 安全性分析

### SQL 注入防護
```sql
-- ❌ 嚴重：SQL 注入漏洞
query = "SELECT * FROM users WHERE id = " + userInput;
query = f"DELETE FROM orders WHERE user_id = {user_id}";

-- ✅ 安全：參數化查詢
-- PostgreSQL/MySQL
PREPARE stmt FROM 'SELECT * FROM users WHERE id = ?';
EXECUTE stmt USING @user_id;

-- SQL Server
EXEC sp_executesql N'SELECT * FROM users WHERE id = @id', N'@id INT', @id = @user_id;
```

### 存取控制與權限
- **最小權限原則**：僅授予必要權限
- **角色式存取**：使用資料庫角色而非直接授權
- **Schema 安全性**：正確設定 schema 擁有權與存取
- **函式／程序安全性**：檢查 DEFINER 與 INVOKER 權限

### 資料保護
- **敏感資料外洩**：避免 SELECT * 於含敏感欄位資料表
- **稽核日誌**：敏感操作需記錄
- **資料遮蔽**：使用檢視表或函式遮蔽敏感資料
- **加密**：敏感資料需加密儲存

## ⚡ 效能最佳化

### 查詢結構分析
```sql
-- ❌ 不佳：低效查詢模式
SELECT DISTINCT u.* 
FROM users u, orders o, products p
WHERE u.id = o.user_id 
AND o.product_id = p.id
AND YEAR(o.order_date) = 2024;

-- ✅ 優化：結構良好
SELECT u.id, u.name, u.email
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.order_date >= '2024-01-01' 
AND o.order_date < '2025-01-01';
```

### 索引策略檢查
- **缺少索引**：找出需加索引欄位
- **過度索引**：找出未使用或重複索引
- **複合索引**：多欄位索引用於複雜查詢
- **索引維護**：檢查碎片化或過時索引

### Join 最佳化
- **Join 類型**：確認使用正確 Join（INNER、LEFT、EXISTS）
- **Join 順序**：優先處理結果集較小者
- **笛卡兒積**：找出缺少 Join 條件
- **子查詢 vs JOIN**：選擇最有效方式

### 聚合與視窗函式
```sql
-- ❌ 不佳：低效聚合
SELECT user_id, 
       (SELECT COUNT(*) FROM orders o2 WHERE o2.user_id = o1.user_id) as order_count
FROM orders o1
GROUP BY user_id;

-- ✅ 優化：高效聚合
SELECT user_id, COUNT(*) as order_count
FROM orders
GROUP BY user_id;
```

## 🛠️ 程式碼品質與可維護性

### SQL 風格與格式
```sql
-- ❌ 不佳：格式混亂
select u.id,u.name,o.total from users u left join orders o on u.id=o.user_id where u.status='active' and o.order_date>='2024-01-01';

-- ✅ 良好：格式清晰
SELECT u.id,
       u.name,
       o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
  AND o.order_date >= '2024-01-01';
```

### 命名規範
- **一致命名**：資料表、欄位、約束皆需一致
- **具描述性**：資料庫物件命名需清楚
- **保留字**：避免使用資料庫保留字
- **大小寫一致**：schema 內大小寫一致

### Schema 設計檢查
- **正規化**：適度正規化（避免過度／不足）
- **資料型別**：選用最佳型別以提升效能
- **約束**：正確使用 PRIMARY KEY、FOREIGN KEY、CHECK、NOT NULL
- **預設值**：適當設定欄位預設值

## 🗂️ 資料庫專屬最佳實務

### PostgreSQL
```sql
-- 使用 JSONB 儲存 JSON 資料
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN 索引加速 JSONB 查詢
CREATE INDEX idx_events_data ON events USING gin(data);

-- 陣列型別儲存多值欄位
CREATE TABLE tags (
    post_id INT,
    tag_names TEXT[]
);
```

### MySQL
```sql
-- 選用合適儲存引擎
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    data TEXT,
    expires TIMESTAMP
) ENGINE=InnoDB;

-- 優化 InnoDB
ALTER TABLE large_table 
ADD INDEX idx_covering (status, created_at, id);
```

### SQL Server
```sql
-- 選用合適資料型別
CREATE TABLE products (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- 分析型欄位使用 Columnstore 索引
CREATE COLUMNSTORE INDEX idx_sales_cs ON sales;
```

### Oracle
```sql
-- 使用序列自動編號
CREATE SEQUENCE user_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE users (
    id NUMBER DEFAULT user_id_seq.NEXTVAL PRIMARY KEY,
    name VARCHAR2(255) NOT NULL
);
```

## 🧪 測試與驗證

### 資料完整性檢查
```sql
-- 檢查參照完整性
SELECT o.user_id 
FROM orders o 
LEFT JOIN users u ON o.user_id = u.id 
WHERE u.id IS NULL;

-- 檢查資料一致性
SELECT COUNT(*) as inconsistent_records
FROM products 
WHERE price < 0 OR stock_quantity < 0;
```

### 效能測試
- **執行計畫**：檢查查詢執行計畫
- **負載測試**：以真實資料量測試查詢
- **壓力測試**：驗證多併發下效能
- **回歸測試**：確保優化不影響功能

## 📊 常見反模式

### N+1 查詢問題
```sql
-- ❌ 不佳：應用程式 N+1 查詢
for user in users:
    orders = query("SELECT * FROM orders WHERE user_id = ?", user.id)

-- ✅ 優化：單一查詢
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

### 過度使用 DISTINCT
```sql
-- ❌ 不佳：DISTINCT 掩蓋 Join 問題
SELECT DISTINCT u.name 
FROM users u, orders o 
WHERE u.id = o.user_id;

-- ✅ 優化：正確 Join 不需 DISTINCT
SELECT u.name
FROM users u
INNER JOIN orders o ON u.id = o.user_id
GROUP BY u.name;
```

### WHERE 子句誤用函式
```sql
-- ❌ 不佳：函式阻礙索引
SELECT * FROM orders 
WHERE YEAR(order_date) = 2024;

-- ✅ 優化：範圍條件可用索引
SELECT * FROM orders 
WHERE order_date >= '2024-01-01' 
  AND order_date < '2025-01-01';
```

## 📋 SQL 審查清單

### 安全性
- [ ] 所有使用者輸入皆參數化
- [ ] 無字串拼接動態 SQL
- [ ] 權限與存取控制適當
- [ ] 敏感資料妥善保護
- [ ] SQL 注入攻擊向量已消除

### 效能
- [ ] 常查詢欄位皆有索引
- [ ] 無不必要 SELECT *
- [ ] JOIN 已最佳化且類型正確
- [ ] WHERE 子句具選擇性且用索引
- [ ] 子查詢已最佳化或改用 JOIN

### 程式碼品質
- [ ] 命名規範一致
- [ ] 格式與縮排正確
- [ ] 複雜邏輯有註解
- [ ] 資料型別適當
- [ ] 有錯誤處理

### Schema 設計
- [ ] 資料表正規化
- [ ] 約束確保資料完整性
- [ ] 索引支援查詢模式
- [ ] 外鍵關係明確
- [ ] 預設值適當

## 🎯 審查輸出格式

### 問題模板
```
## [優先級] [類別]：簡要說明

**位置**：[資料表／檢視／程序名稱及行號]
**問題**：[詳細說明]
**安全風險**：[如有 - 注入風險、資料外洩等]
**效能影響**：[查詢成本、執行時間]
**建議修正**：[具體修正建議與程式碼範例]

**修正前：**
```sql
-- 問題 SQL
```

**修正後：**
```sql
-- 優化 SQL
```

**預期改善**：[效能提升、安全性增強]
```

### 總結評分
- **安全性分數**：1-10（SQL 注入防護、存取控制）
- **效能分數**：1-10（查詢效率、索引使用）
- **可維護性分數**：1-10（程式品質、文件）
- **Schema 品質分數**：1-10（設計模式、正規化）

### 三大優先修正
1. **[重大安全修正]**：修正 SQL 注入漏洞
2. **[效能最佳化]**：新增索引或優化查詢
3. **[程式碼品質]**：改善命名規範與文件

請針對各資料庫平台提供可執行、具體建議，並強調平台專屬最佳化與實務。
