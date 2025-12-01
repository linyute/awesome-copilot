---
agent: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: 'PostgreSQL 專屬程式碼審查助手，聚焦 PostgreSQL 最佳實踐、反模式與獨特品質標準。涵蓋 JSONB 操作、陣列用法、自訂型別、資料表設計、函式最佳化，以及 PostgreSQL 專屬安全功能如 Row Level Security (RLS)。'
tested_with: 'GitHub Copilot Chat (GPT-4o) - 2025 年 7 月 20 日驗證'
---

# PostgreSQL 程式碼審查助手

針對 ${selection}（若未選取則針對整個專案）進行專業 PostgreSQL 程式碼審查。重點在 PostgreSQL 專屬最佳實踐、反模式與獨特品質標準。

## 🎯 PostgreSQL 專屬審查重點

### JSONB 最佳實踐
```sql
-- ❌ 不佳：低效的 JSONB 用法
SELECT * FROM orders WHERE data->>'status' = 'shipped';  -- 無索引支援

-- ✅ 優良：可索引的 JSONB 查詢
CREATE INDEX idx_orders_status ON orders USING gin((data->'status'));
SELECT * FROM orders WHERE data @> '{"status": "shipped"}';

-- ❌ 不佳：深層巢狀但未考慮結構
UPDATE orders SET data = data || '{"shipping":{"tracking":{"number":"123"}}}';

-- ✅ 優良：結構化 JSONB 並加以驗證
ALTER TABLE orders ADD CONSTRAINT valid_status 
CHECK (data->>'status' IN ('pending', 'shipped', 'delivered'));
```

### 陣列操作審查
```sql
-- ❌ 不佳：低效的陣列操作
SELECT * FROM products WHERE 'electronics' = ANY(categories);  -- 無索引

-- ✅ 優良：GIN 索引的陣列查詢
CREATE INDEX idx_products_categories ON products USING gin(categories);
SELECT * FROM products WHERE categories @> ARRAY['electronics'];

-- ❌ 不佳：在 for 迴圈中進行陣列串接
-- 在函式/程序中效率低下

-- ✅ 優良：批次陣列操作
UPDATE products SET categories = categories || ARRAY['new_category']
WHERE id IN (SELECT id FROM products WHERE condition);
```

### PostgreSQL 資料表設計審查
```sql
-- ❌ 不佳：未善用 PostgreSQL 功能
CREATE TABLE users (
    id INTEGER,
    email VARCHAR(255),
    created_at TIMESTAMP
);

-- ✅ 優良：最佳化的 PostgreSQL 資料表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,  -- 不分大小寫 email
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 為 metadata 查詢加上 JSONB GIN 索引
CREATE INDEX idx_users_metadata ON users USING gin(metadata);
```

### 自訂型別與 Domain
```sql
-- ❌ 不佳：特定資料用一般型別
CREATE TABLE transactions (
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    status VARCHAR(20)
);

-- ✅ 優良：PostgreSQL 自訂型別
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'JPY');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE DOMAIN positive_amount AS DECIMAL(10,2) CHECK (VALUE > 0);

CREATE TABLE transactions (
    amount positive_amount NOT NULL,
    currency currency_code NOT NULL,
    status transaction_status DEFAULT 'pending'
);
```

## 🔍 PostgreSQL 專屬反模式

### 效能反模式
- **未使用 PostgreSQL 專屬索引**：未針對適用型別使用 GIN/GiST
- **錯誤使用 JSONB**：將 JSONB 當作一般字串欄位
- **忽略陣列運算子**：使用低效的陣列操作
- **分割鍵選擇不佳**：未有效利用 PostgreSQL 分割功能

### 資料表設計問題
- **未用 ENUM 型別**：有限值集合用 VARCHAR
- **忽略約束**：缺少 CHECK 約束進行資料驗證
- **型別選擇錯誤**：用 VARCHAR 取代 TEXT 或 CITEXT
- **JSONB 結構缺失**：未結構化 JSONB 或缺乏驗證

### 函式與觸發器問題
```sql
-- ❌ 不佳：低效的觸發器函式
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();  -- 應使用 TIMESTAMPTZ
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ 優良：最佳化的觸發器函式
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 只在需要時觸發
CREATE TRIGGER update_modified_time_trigger
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_modified_time();
```

## 📊 PostgreSQL Extension 使用審查

### Extension 最佳實踐
```sql
-- ✅ 建立前先檢查 extension 是否存在
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ✅ 適當使用 extension
-- UUID 產生
SELECT uuid_generate_v4();

-- 密碼雜湊
SELECT crypt('password', gen_salt('bf'));

-- 模糊文字比對
SELECT word_similarity('postgres', 'postgre');
```

## 🛡️ PostgreSQL 安全審查

### Row Level Security (RLS)
```sql
-- ✅ 優良：實作 RLS
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_data_policy ON sensitive_data
    FOR ALL TO application_role
    USING (user_id = current_setting('app.current_user_id')::INTEGER);
```

### 權限管理
```sql
-- ❌ 不佳：權限過於寬鬆
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;

-- ✅ 優良：細緻權限管理
GRANT SELECT, INSERT, UPDATE ON specific_table TO app_user;
GRANT USAGE ON SEQUENCE specific_table_id_seq TO app_user;
```

## 🎯 PostgreSQL 程式碼品質檢查清單

### 資料表設計
- [ ] 適當使用 PostgreSQL 型別（CITEXT、JSONB、陣列）
- [ ] 受限值集合用 ENUM 型別
- [ ] 實作正確的 CHECK 約束
- [ ] 使用 TIMESTAMPTZ 取代 TIMESTAMP
- [ ] 定義自訂 domain 以重複使用約束

### 效能考量
- [ ] 適當索引型別（JSONB/陣列用 GIN，範圍用 GiST）
- [ ] JSONB 查詢用包含運算子（@>、?）
- [ ] 陣列操作用 PostgreSQL 專屬運算子
- [ ] 正確使用 window 函式與 CTE
- [ ] 有效利用 PostgreSQL 專屬函式

### PostgreSQL 功能運用
- [ ] 適當使用 extension
- [ ] 需要時實作 PL/pgSQL 儲存程序
- [ ] 善用 PostgreSQL 進階 SQL 功能
- [ ] 使用 PostgreSQL 專屬最佳化技巧
- [ ] 函式中實作正確錯誤處理

### 安全與合規
- [ ] 需要時實作 Row Level Security (RLS)
- [ ] 正確角色與權限管理
- [ ] 使用 PostgreSQL 內建加密函式
- [ ] 利用 PostgreSQL 功能實作稽核軌跡

## 📝 PostgreSQL 專屬審查指引

1. **型別最佳化**：確保適當使用 PostgreSQL 專屬型別
2. **索引策略**：檢查索引型別並善用 PostgreSQL 專屬索引
3. **JSONB 結構**：驗證 JSONB 資料表設計與查詢模式
4. **函式品質**：審查 PL/pgSQL 函式效率與最佳實踐
5. **Extension 使用**：確認 PostgreSQL extension 使用得當
6. **效能功能**：檢查 PostgreSQL 進階功能運用
7. **安全實作**：審查 PostgreSQL 專屬安全功能

聚焦 PostgreSQL 獨特能力，確保程式碼能充分發揮 PostgreSQL 優勢，而非僅當作一般 SQL 資料庫使用。
