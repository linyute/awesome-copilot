### Spark 設定（最佳實作） (Spark Configuration (Best Practices))

```python
# 啟用 Fabric 最佳化
spark.conf.set("spark.sql.parquet.vorder.enabled", "true")
spark.conf.set("spark.microsoft.delta.optimizeWrite.enabled", "true")
```

### 讀取資料 (Reading Data)

```python
# 讀取 CSV 檔案
df = spark.read.format("csv") \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .load("Files/bronze/data.csv")

# 讀取 JSON 檔案
df = spark.read.format("json").load("Files/bronze/data.json")

# 讀取 Parquet 檔案
df = spark.read.format("parquet").load("Files/bronze/data.parquet")

# 讀取 Delta 資料表
df = spark.read.table("my_delta_table")

# 從 SQL 端點讀取
df = spark.sql("SELECT * FROM lakehouse.my_table")
```

### 寫入 Delta 資料表 (Writing Delta Tables)

```python
# 將 DataFrame 寫入為受管理的 Delta 資料表
df.write.format("delta") \
    .mode("overwrite") \
    .saveAsTable("silver_customers")

# 包含分區的寫入
df.write.format("delta") \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .saveAsTable("silver_transactions")

# 附加到現有資料表
df.write.format("delta") \
    .mode("append") \
    .saveAsTable("silver_events")
```

### Delta 資料表作業 (CRUD) (Delta Table Operations (CRUD))

```python
# 更新 (UPDATE)
spark.sql("""
    UPDATE silver_customers
    SET status = 'active'
    WHERE last_login > '2024-01-01' -- 範例日期，請視需要調整
""")

# 刪除 (DELETE)
spark.sql("""
    DELETE FROM silver_customers
    WHERE is_deleted = true
""")

# 合併 (Upsert) (MERGE (Upsert))
spark.sql("""
    MERGE INTO silver_customers AS target
    USING staging_customers AS source
    ON target.customer_id = source.customer_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

### 結構描述定義 (Schema Definition)

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType, DecimalType

schema = StructType([
    StructField("id", IntegerType(), False),
    StructField("name", StringType(), True),
    StructField("email", StringType(), True),
    StructField("amount", DecimalType(18, 2), True),
    StructField("created_at", TimestampType(), True)
])

df = spark.read.format("csv") \
    .schema(schema) \
    .option("header", "true") \
    .load("Files/bronze/customers.csv")
```

### 筆記本中的 SQL Magic (SQL Magic in Notebooks)

```sql
%%sql
-- 直接查詢 Delta 資料表
SELECT 
    customer_id,
    COUNT(*) as order_count,
    SUM(amount) as total_amount
FROM gold_orders
GROUP BY customer_id
ORDER BY total_amount DESC
LIMIT 10
```

### V-Order 最佳化 (V-Order Optimization)

```python
# 啟用 V-Order 進行讀取最佳化
spark.conf.set("spark.sql.parquet.vorder.enabled", "true")
```

### 資料表最佳化 (Table Optimization)

```sql
%%sql
-- 最佳化資料表（壓縮小型檔案）
OPTIMIZE silver_transactions

-- 在查詢資料欄上套用 Z-ordering 進行最佳化
OPTIMIZE silver_transactions ZORDER BY (customer_id, transaction_date)

-- 清理舊檔案（預設保留 7 天）
VACUUM silver_transactions

-- 使用自訂保留期進行清理
VACUUM silver_transactions RETAIN 168 HOURS

```

### 增量載入模式 (Incremental Load Pattern)

```python
from pyspark.sql.functions import col

# 獲取上次處理的高水位線 (watermark)
last_watermark = spark.sql("""
    SELECT MAX(processed_timestamp) as watermark 
    FROM silver_orders
""").collect()[0]["watermark"]

# 僅載入新記錄
new_records = spark.read.format("delta") \
    .table("bronze_orders") \
    .filter(col("created_at") > last_watermark)

# 合併新記錄
new_records.createOrReplaceTempView("staging_orders")
spark.sql("""
    MERGE INTO silver_orders AS target
    USING staging_orders AS source
    ON target.order_id = source.order_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

### SCD Type 2 模式 (SCD Type 2 Pattern)

```python
from pyspark.sql.functions import current_timestamp, lit

# 結束現有記錄
spark.sql("""
    UPDATE dim_customer
    SET is_current = false, end_date = current_timestamp()
    WHERE customer_id IN (SELECT customer_id FROM staging_customer)
    AND is_current = true
""")

# 插入新版本
spark.sql("""
    INSERT INTO dim_customer
    SELECT 
        customer_id,
        name,
        email,
        address,
        current_timestamp() as start_date,
        null as end_date,
        true as is_current
    FROM staging_customer
""")
```
