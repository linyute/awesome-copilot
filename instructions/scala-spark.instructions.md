---
description: '在 Scala 中建立 Apache Spark 應用程式的最佳實踐，涵蓋 DataFrame、Dataset、SparkSQL、效能調優、測試和生產部署模式。'
applyTo: '**/*.scala, **/build.sbt, **/build.sc'
---

# Scala + Apache Spark 最佳實踐

在 Scala 中編寫高效、可維護且可用於生產環境的 Apache Spark 應用程式的指南。

## 相依性 (Dependencies)

### SBT

```scala
val sparkVersion = "3.5.1"

libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core"   % sparkVersion % "provided",
  "org.apache.spark" %% "spark-sql"    % sparkVersion % "provided",
  "org.apache.spark" %% "spark-mllib"  % sparkVersion % "provided",
  "org.apache.spark" %% "spark-streaming" % sparkVersion % "provided"
)
```

### Maven

```xml
<properties>
    <spark.version>3.5.1</spark.version>
    <scala.binary.version>2.13</scala.binary.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.apache.spark</groupId>
        <artifactId>spark-core_${scala.binary.version}</artifactId>
        <version>${spark.version}</version>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.spark</groupId>
        <artifactId>spark-sql_${scala.binary.version}</artifactId>
        <version>${spark.version}</version>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.spark</groupId>
        <artifactId>spark-mllib_${scala.binary.version}</artifactId>
        <version>${spark.version}</version>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.spark</groupId>
        <artifactId>spark-streaming_${scala.binary.version}</artifactId>
        <version>${spark.version}</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

將 Spark 相依性標記為 `"provided"`，因為叢集會在執行時提供它們。僅在 fat JAR 中打包應用程式特定的函式庫。

## SparkSession 設定

始終使用 `SparkSession` 作為單一入口點：

```scala
import org.apache.spark.sql.SparkSession

val spark: SparkSession = SparkSession.builder()
  .appName("MyApplication")
  .config("spark.sql.shuffle.partitions", "200")
  .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
  .getOrCreate()

import spark.implicits._
```

- **不要**在同一個 JVM 中建立多個 `SparkSession` 實例。
- 避免在應用程式程式碼中硬編碼 `master`；應在提交時透過 `--master` 進行設定。

## DataFrame vs Dataset vs RDD

大多數工作負載優先選擇 **DataFrame API**（無類型的 `Dataset[Row]`）。當編譯時類型安全足以抵消序列化開銷時，使用 **Dataset**（有類型）。除非您需要低階控制，否則避免使用原始的 **RDD**。

```scala
import org.apache.spark.sql.{DataFrame, Dataset}

// 優先選擇 — DataFrame API
val df: DataFrame = spark.read.parquet("data/events")
val result = df
  .filter($"status" === "active")
  .groupBy($"region")
  .agg(count("*").as("total"))

// 有類型的 Dataset — 在需要架構安全時使用
case class Event(id: Long, status: String, region: String)
val ds: Dataset[Event] = df.as[Event]
val active = ds.filter(_.status == "active")
```

## 架構管理 (Schema Management)

讀取半結構化資料時，始終明確定義架構，而不是依賴架構推導：

```scala
import org.apache.spark.sql.types._

val schema = StructType(Seq(
  StructField("id", LongType, nullable = false),
  StructField("name", StringType, nullable = true),
  StructField("timestamp", TimestampType, nullable = false),
  StructField("amount", DecimalType(18, 2), nullable = true),
  StructField("tags", ArrayType(StringType), nullable = true)
))

val df = spark.read
  .schema(schema)
  .json("data/events/*.json")
```

- 架構推導 (`inferSchema=true`) 會讀取整個資料源，對於大檔案來說非常昂貴。
- 對於 Parquet 和 Delta，架構是內嵌的 — 不需要明確定義。

## 欄位運算式 (Column Expressions)

在轉換中，優先選擇 `col()` 或 `$""` 而不是字串欄位名稱，以便儘早偵測錯誤：

```scala
import org.apache.spark.sql.functions._

// 正確 — 經過類型檢查的欄位參考
df.select(col("name"), $"amount" * 1.1 as "adjusted_amount")

// 避免 — 僅使用字串參考會將錯誤延遲到執行時
df.select("name", "amount")
```

## 合併 (Joins)

### 廣播合併 (Broadcast Joins)

當合併的小端可以放入執行器記憶體時（通常 < 100 MB），請廣播它：

```scala
import org.apache.spark.sql.functions.broadcast

val enriched = largeDF.join(
  broadcast(smallLookupDF),
  Seq("key"),
  "left"
)
```

### 避免笛卡兒積 (Cartesian Products)

除非有意為之，否則絕不使用交叉合併 (cross join)。啟用防護措施：

```scala
spark.conf.set("spark.sql.crossJoin.enabled", "false")
```

### 傾斜處理 (Skew Handling)

對於傾斜鍵上的合併，對鍵進行加鹽處理以分配負載：

```scala
import org.apache.spark.sql.functions._

val saltBuckets = 10
val saltedLeft = leftDF.withColumn("salt", (rand() * saltBuckets).cast("int"))
val saltedRight = rightDF
  .crossJoin((0 until saltBuckets).toDF("salt"))

val result = saltedLeft
  .join(saltedRight, Seq("join_key", "salt"))
  .drop("salt")
```

代價是右側會增長 10 倍，因此這僅在右側相當小或傾斜嚴重到足以證明其合理性時才有效。對於 Spark 3.x+，AQE 的內建傾斜合併處理 (`spark.sql.adaptive.skewJoin.enabled = true`) 可以自動完成此操作，無需手動加鹽。

## 分割與分桶 (Partitioning and Bucketing)

### 寫入分割

按高基數過濾欄位（例如：日期）分割輸出：

```scala
df.write
  .partitionBy("year", "month")
  .mode("overwrite")
  .parquet("output/events")
```

- 避免在極高基數欄位（例如：使用者 ID）上進行分割，這會產生數百萬個小檔案。

### 隨機洗牌分割 (Shuffle Partitions)

根據資料量調整 `spark.sql.shuffle.partitions`：

```scala
// 預設值為 200；根據資料大小進行調整
// 經驗法則：目標是每個分割區 128 MB
spark.conf.set("spark.sql.shuffle.partitions", "400")
```

### Repartition vs Coalesce

```scala
// Repartition — 完全洗牌，用於增加或均勻分佈分割區
df.repartition(100, $"key")

// Coalesce — 不洗牌，僅用於減少分割區數量
df.coalesce(10)
```

絕不要在大型資料集上使用 `coalesce(1)` — 它會強制所有資料通過單個任務。

## 快取與持久化 (Caching and Persistence)

僅當 DataFrame 被多次重複使用時才進行快取：

```scala
import org.apache.spark.storage.StorageLevel

val cached = expensiveDF.persist(StorageLevel.MEMORY_AND_DISK)
cached.count() // 具現化快取

// 多次使用快取的 DF
val summary = cached.groupBy("region").count()
val filtered = cached.filter($"amount" > 1000)

// 完成後務必釋放快取 (unpersist)
cached.unpersist()
```

- 優先選擇 `MEMORY_AND_DISK` 而非 `MEMORY_ONLY`，以避免逐出時重新計算。
- 絕不快取僅使用一次的 DataFrame。

## UDF — 謹慎使用

優先選擇內建的 Spark SQL 函式而不是 UDF。UDF 會停用 Catalyst 優化且需要序列化：

```scala
import org.apache.spark.sql.functions._

// 正確 — 使用內建函式
df.withColumn("upper_name", upper($"name"))
  .withColumn("name_length", length($"name"))

// 避免 — 對於內建函式可以處理的事項使用 UDF
val upperUdf = udf((s: String) => s.toUpperCase)
df.withColumn("upper_name", upperUdf($"name"))
```

當 UDF 不可避免時，優先選擇 `spark.udf.register` 以獲得 SparkSQL 相容性，並明確處理 null 值：

```scala
val parseStatus = udf((raw: String) => {
  Option(raw).map(_.trim.toLowerCase) match {
    case Some("active") | Some("enabled")  => "ACTIVE"
    case Some("inactive") | Some("disabled") => "INACTIVE"
    case _                                   => "UNKNOWN"
  }
})
```

## 視窗函式 (Window Functions)

將視窗函式用於排名、滾動總和以及前移/後移 (lag/lead) 計算：

```scala
import org.apache.spark.sql.expressions.Window

val windowSpec = Window
  .partitionBy("department")
  .orderBy($"salary".desc)

val ranked = df
  .withColumn("rank", rank().over(windowSpec))
  .withColumn("dense_rank", dense_rank().over(windowSpec))
  .withColumn("row_number", row_number().over(windowSpec))
  .withColumn("running_total", sum($"salary").over(
    Window.partitionBy("department").orderBy("hire_date")
      .rowsBetween(Window.unboundedPreceding, Window.currentRow)
  ))
```

## 錯誤處理

### 損壞記錄處理

```scala
val df = spark.read
  .option("mode", "PERMISSIVE")            // 預設值：保留損壞的列
  .option("columnNameOfCorruptRecord", "_corrupt_record")
  .schema(schema)
  .json("data/events")

val clean = df.filter($"_corrupt_record".isNull).drop("_corrupt_record")
val bad   = df.filter($"_corrupt_record".isNotNull)
bad.write.json("data/quarantine")
```

### 基於累加器 (Accumulator) 的錯誤計數

```scala
val parseErrors = spark.sparkContext.longAccumulator("parseErrors")

val parsed = df.map { row =>
  try {
    parseRow(row)
  } catch {
    case _: Exception =>
      parseErrors.add(1)
      null
  }
}.filter(_ != null)

println(s"Parse errors: ${parseErrors.value}")
```

> **警告：** 累加器僅在動作（`count`、`collect`、`write`）內保證準確。如果任務因失敗而重試，累加器可能會重複計數。對於精確的錯誤追蹤，優先選擇上述隔離 (quarantine) 模式；累加器僅用於營運監控。

## 串流處理 (Structured Streaming)

```scala
val stream = spark.readStream
  .format("kafka")
  .option("kafka.bootstrap.servers", "broker:9092")
  .option("subscribe", "events")
  .option("startingOffsets", "latest")
  .load()

val parsed = stream
  .selectExpr("CAST(value AS STRING) as json")
  .select(from_json($"json", schema).as("data"))
  .select("data.*")

val query = parsed.writeStream
  .format("delta")
  .option("checkpointLocation", "/checkpoints/events")
  .outputMode("append")
  .trigger(Trigger.ProcessingTime("30 seconds"))
  .start("output/events")

query.awaitTermination()
```

- 始終設定檢查點位置 (checkpoint location) 以實現容錯。
- 使用 `Trigger.ProcessingTime` 或 `Trigger.AvailableNow` — 避免在生產中使用 `Trigger.Once`（請改用 `AvailableNow`）。

## Delta Lake 整合

```scala
import io.delta.tables.DeltaTable

// Upsert / merge (更新或插入)
val target = DeltaTable.forPath(spark, "data/customers")

target.as("t")
  .merge(updatesDF.as("s"), "t.id = s.id")
  .whenMatched.updateAll()
  .whenNotMatched.insertAll()
  .execute()

// Time travel (時光溯源)
val yesterday = spark.read
  .format("delta")
  .option("timestampAsOf", "2025-01-15")
  .load("data/customers")

// Optimize and vacuum (優化與清理)
target.optimize().executeCompaction()
target.vacuum(168) // 保留 7 天
```

## 效能調優檢查清單

1. **減少隨機洗牌 (shuffles)** — 使用 `broadcast` 合併、預先分割資料、避免不必要的 `groupBy`。
2. **避免在大型 DataFrame 上使用 `collect()`** — 它會將所有資料拉取到驅動程式。
3. **優先選擇 `explain(true)`** 以在執行昂貴作業前檢查物理計畫。
4. **啟用自適應查詢執行 (AQE)**:
   ```scala
   spark.conf.set("spark.sql.adaptive.enabled", "true")
   spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
   spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
   ```
5. **對分析工作負載使用欄位式格式** (Parquet, Delta, ORC) 而不是 CSV/JSON。
6. **謂詞下推 (Predicate pushdown)** — 在查詢計畫中儘早過濾；將過濾器放在合併之前。
7. **欄位修剪 (Column pruning)** — 僅 `select` 需要的欄位，而不是 `select("*")`。
8. **避免在 `groupBy` 之前使用 `distinct()`** — 聚合操作已經會進行去重。

## 測試

### 單元測試轉換

在可能的情況下，不使用 SparkSession 測試純轉換函式：

```scala
import org.scalatest.funsuite.AnyFunSuite

class TransformationsTest extends AnyFunSuite {
  test("parseStatus maps known values correctly") {
    assert(parseStatus("active") == "ACTIVE")
    assert(parseStatus("DISABLED") == "INACTIVE")
    assert(parseStatus(null) == "UNKNOWN")
  }
}
```

### 使用 SparkSession 進行整合測試

對 DataFrame 級別的測試使用共享的 `SparkSession`：

```scala
import org.apache.spark.sql.SparkSession
import org.scalatest.BeforeAndAfterAll
import org.scalatest.funsuite.AnyFunSuite

trait SparkTestBase extends AnyFunSuite with BeforeAndAfterAll {
  lazy val spark: SparkSession = SparkSession.builder()
    .master("local[2]")
    .appName("test")
    .config("spark.sql.shuffle.partitions", "2")
    .getOrCreate()

  override def afterAll(): Unit = {
    spark.stop()
    super.afterAll()
  }
}

class EventPipelineTest extends SparkTestBase {
  import spark.implicits._

  test("pipeline filters inactive events") {
    val input = Seq(
      Event(1L, "active", "US"),
      Event(2L, "inactive", "EU")
    ).toDS()

    val result = filterActive(input)
    assert(result.count() == 1)
    assert(result.collect().head.status == "active")
  }
}
```

## 應用程式打包

### 使用 sbt-assembly 製作 Fat JAR

```scala
// project/plugins.sbt
addSbtPlugin("com.eed3si9n" % "sbt-assembly" % "2.1.5")

// build.sbt
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", _*) => MergeStrategy.discard
  case _                        => MergeStrategy.first
}
```

### Spark Submit (提交作業)

```bash
spark-submit \
  --class com.example.MainApp \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 10 \
  --executor-memory 8g \
  --executor-cores 4 \
  --conf spark.sql.adaptive.enabled=true \
  --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
  target/scala-2.13/my-app-assembly-1.0.jar \
  --input s3://bucket/input \
  --output s3://bucket/output
```

## 常見反模式 (Common Anti-Patterns)

| 反模式 | 為何不好 | 修復方法 |
|---|---|---|
| 對大資料使用 `collect()` | 驅動程式 OOM | 使用 `take(n)`、`show()` 或寫入儲存空間 |
| 在迴圈內使用 `count()` | 每次都會觸發完整 DAG 評估 | 快取並計數一次 |
| 對內建操作使用 UDF | 停用 Catalyst 優化器 | 使用 `org.apache.spark.sql.functions._` |
| 對 DataFrame 使用 `var` | 可變參考會導致混淆 | 鏈式轉換或使用 `val` |
| 對 CSV/JSON 使用架構推導 | 讀取整個來源，且脆弱 | 明確定義 `StructType` |
| 在大資料上使用 `coalesce(1)` | 單任務瓶頸 | 使用具有合理計數的 `repartition` |
| 在 RDD 上使用巢狀 `map` | 二次複雜度 | 使用 `join` 或 `broadcast` |
| 忽略資料傾斜 | 拖後腿的任務、OOM | 對鍵加鹽或使用 AQE 傾斜處理 |

## 動態分配 (Dynamic Allocation)

啟用動態分配讓 Spark 根據工作負載需求擴展或縮減執行器。這對於共享叢集至關重要，因為固定執行器計數在閒置階段會浪費資源：

```scala
spark.conf.set("spark.dynamicAllocation.enabled", "true")
spark.conf.set("spark.dynamicAllocation.minExecutors", "2")
spark.conf.set("spark.dynamicAllocation.maxExecutors", "50")
spark.conf.set("spark.dynamicAllocation.initialExecutors", "5")
spark.conf.set("spark.dynamicAllocation.executorIdleTimeout", "60s")
spark.conf.set("spark.dynamicAllocation.schedulerBacklogTimeout", "1s")
```

或透過 `spark-submit`:

```bash
spark-submit \
  --conf spark.dynamicAllocation.enabled=true \
  --conf spark.dynamicAllocation.minExecutors=2 \
  --conf spark.dynamicAllocation.maxExecutors=50 \
  --conf spark.shuffle.service.enabled=true \
  ...
```

關鍵設定：

| 設定 | 目的 |
|---|---|
| `minExecutors` | 下限 — 始終保持至少這麼多執行器在運行 |
| `maxExecutors` | 上限 — 限制以防止壟斷叢集 |
| `initialExecutors` | 自動擴充啟動前的初始計數 |
| `executorIdleTimeout` | 在此時長後移除閒置的執行器（預設 60s） |
| `schedulerBacklogTimeout` | 當任務掛起達到此時長時請求新的執行器 |

- **在 YARN/Mesos 上需要 `spark.shuffle.service.enabled=true`** — 外部洗牌服務在執行器移除後保留洗牌檔案。若無此服務，移除的執行器會遺失其洗牌資料，迫使進行昂貴的重新計算。
- 在 **Kubernetes** 上，請改用 `spark.dynamicAllocation.shuffleTracking.enabled=true`（不需要外部洗牌服務）。
- **不要將** `--num-executors` 與動態分配結合使用 — 它們會產生衝突。啟用動態分配時請移除 `--num-executors`。
