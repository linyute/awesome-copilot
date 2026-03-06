---
description: 'Scala 2.12/2.13 程式語言編碼規範與最佳實踐，遵循 Databricks 樣式指南，專注於函數式程式設計、型別安全和生產環境程式碼品質。'
applyTo: '**.scala, **/build.sbt, **/build.sc'
---

# Scala 最佳實踐

基於 [Databricks Scala Style Guide](https://github.com/databricks/scala-style-guide)

## 核心原則

### 撰寫簡單的程式碼
程式碼唯寫一次，但會被多次閱讀和修改。透過撰寫簡單的程式碼，優化長期可讀性和可維護性。

### 預設不可變性 (Immutability)
- 始終優先選擇 `val` 而非 `var`
- 使用來自 `scala.collection.immutable` 的不可變集合
- Case class 的建構子參數不應是可變的
- 使用 Copy 建構子來建立修改後的實例

```scala
// 好 - 不可變 case class
case class Person(name: String, age: Int)

// 壞 - 可變 case class
case class Person(name: String, var age: Int)

// 若要變更數值，使用 copy 建構子
val p1 = Person("Peter", 15)
val p2 = p1.copy(age = 16)

// 好 - 不可變集合
val users = List(User("Alice", 30), User("Bob", 25))
val updatedUsers = users.map(u => u.copy(age = u.age + 1))
```

### 純函式 (Pure Functions)
- 函式應具備確定性且無副作用
- 將純邏輯與副作用 (Effects) 分離
- 對於有副作用的方法使用顯式型別

```scala
// 好 - 純函式
def calculateTotal(items: List[Item]): BigDecimal =
  items.map(_.price).sum

// 壞 - 具有副作用的非純函式
def calculateTotal(items: List[Item]): BigDecimal = {
  println(s"Calculating total for ${items.size} items")  // 副作用
  val total = items.map(_.price).sum
  saveToDatabase(total)  // 副作用
  total
}
```

## 命名慣例

### 類別與物件

```scala
// 類別 (Classes)、特性 (Traits)、物件 (Objects) - PascalCase
class ClusterManager
trait Expression
object Configuration

// 套件 (Packages) - 全小寫 ASCII
package com.databricks.resourcemanager

// 方法/函式 - camelCase
def getUserById(id: Long): Option[User]
def processData(input: String): Result

// 常數 - 在伴生模型 (Companion object) 中使用大寫
object Configuration {
  val DEFAULT_PORT = 10000
  val MAX_RETRIES = 3
  val TIMEOUT_MS = 5000L
}
```

### 變數與參數

```scala
// 變數 - camelCase，名稱應不言自明
val serverPort = 1000
val clientPort = 2000
val maxRetryAttempts = 3

// 在小範圍、局部範圍內可以使用單個字元名稱
for (i <- 0 until 10) {
  // ...
}

// 不要使用 "l" (Larry) - 看起來像 "1", "|", "I"
```

### 列舉 (Enumerations)

```scala
// 列舉物件 - PascalCase
// 數值 - 使用底線分隔的大寫字母 (UPPER_CASE)
private object ParseState extends Enumeration {
  type ParseState = Value

  val PREFIX,
      TRIM_BEFORE_SIGN,
      SIGN,
      VALUE,
      UNIT_BEGIN,
      UNIT_END = Value
}
```

## 語法風格

### 行長與間距

```scala
// 每行限制為 100 個字元
// 運算子前後各留一個空格
def add(int1: Int, int2: Int): Int = int1 + int2

// 逗號後留一個空格
val list = List("a", "b", "c")

// 冒號後留一個空格
def getConf(key: String, defaultValue: String): String = {
  // 程式碼
}

// 使用 2 個空格縮排
if (true) {
  println("Wow!")
}

// 長參數列表使用 4 個空格縮排
def newAPIHadoopFile[K, V, F <: NewInputFormat[K, V]](
    path: String,
    fClass: Class[F],
    kClass: Class[K],
    vClass: Class[V],
    conf: Configuration = hadoopConfiguration): RDD[(K, V)] = {
  // 方法體
}

// 具有長參數的類別
class Foo(
    val param1: String,  // 4 空格縮排
    val param2: String,
    val param3: Array[Byte])
  extends FooInterface  // 2 空格縮排
  with Logging {

  def firstMethod(): Unit = { ... }  // 上方留白行
}
```

### 30 原則

- 一個方法應包含少於 30 行程式碼
- 一個類別應包含少於 30 個方法

### 大括號

```scala
// 多行區塊始終使用大括號
if (true) {
  println("Wow!")
}

// 例外：單行三元運算（無副作用）
val result = if (condition) value1 else value2

// try-catch 始終使用大括號
try {
  foo()
} catch {
  case e: Exception => handle(e)
}
```

### Long 字面量

```scala
// Long 字面量使用大寫 L
val longValue = 5432L  // 推薦做法
val badValue = 5432l   // 避免做法 - 難以辨認
```

### 括號

```scala
// 具有副作用的方法 - 使用括號
class Job {
  def killJob(): Unit = { ... }  // 正確 - 變更狀態
  def getStatus: JobStatus = { ... }  // 正確 - 無副作用
}

// 呼叫端應與宣告匹配
new Job().killJob()  // 正確
new Job().getStatus  // 正確
```

### 匯入 (Imports)

```scala
// 除非匯入 6 個以上實體，否則避免萬用字元 (Wildcard) 匯入
import scala.collection.mutable.{Map, HashMap, ArrayBuffer}

// 對於隱式轉換 (Implicits) 或 6 個以上項目，可以使用萬用字元
import scala.collection.JavaConverters._
import java.util.{Map, HashMap, List, ArrayList, Set, HashSet}

// 始終使用絕對路徑
import scala.util.Random  // 好
// import util.Random     // 不要使用相對路徑

// 匯入順序（中間留白行）：
import java.io.File
import javax.servlet.http.HttpServlet

import scala.collection.mutable.HashMap
import scala.util.Random

import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD

import com.databricks.MyClass
```

### 模式匹配 (Pattern Matching)

```scala
// 如果方法完全是模式匹配，則將 match 放在同一行
def test(msg: Message): Unit = msg match {
  case TextMessage(text) => handleText(text)
  case ImageMessage(url) => handleImage(url)
}

// 單個 case 閉包 (Closures) - 同一行
list.zipWithIndex.map { case (elem, i) =>
  // 處理
}

// 多個 case - 縮排並換行
list.map {
  case a: Foo => processFoo(a)
  case b: Bar => processBar(b)
  case _ => handleDefault()
}

// 僅按型別匹配 - 不要展開所有參數
case class Pokemon(name: String, weight: Int, hp: Int, attack: Int, defense: Int)

// 壞 - 當欄位變動時容易出錯
targets.foreach {
  case Pokemon(_, _, hp, _, defense) =>
    // 容易出錯
}

// 好 - 按型別匹配
targets.foreach {
  case p: Pokemon =>
    val loss = math.min(0, myAttack - p.defense)
    p.copy(hp = p.hp - loss)
}
```

### 匿名函式

```scala
// 避免過多括號
// 正確
list.map { item =>
  transform(item)
}

// 正確
list.map(item => transform(item))

// 錯誤 - 不必要的大括號
list.map(item => {
  transform(item)
})

// 錯誤 - 過多巢狀
list.map({ item => ... })
```

### 中置方法 (Infix Methods)

```scala
// 對於非符號方法，避免使用中置表示法
list.map(func)  // 正確
list map func   // 錯誤

// 對於運算子則沒問題
arrayBuffer += elem
```

## 語言功能

### 避免在類別上使用 apply()

```scala
// 避免在類別上使用 apply - 難以追蹤
class TreeNode {
  def apply(name: String): TreeNode = { ... }  // 不要這樣做
}

// 在伴生物件上作為工廠方法則可以
object TreeNode {
  def apply(name: String): TreeNode = new TreeNode(name)  // 可以
}
```

### override 修飾符

```scala
// 始終使用 override - 即使是對抽象方法
trait Parent {
  def hello(data: Map[String, String]): Unit
}

class Child extends Parent {
  // 如果沒有 override，這可能實際上沒有進行覆寫！
  override def hello(data: Map[String, String]): Unit = {
    println(data)
  }
}
```

### 避免在建構子中使用解構 (Destructuring)

```scala
// 不要在建構子中使用解構繫結
class MyClass {
  // 壞 - 會建立非暫時性的 (non-transient) Tuple2
  @transient private val (a, b) = someFuncThatReturnsTuple2()

  // 好
  @transient private val tuple = someFuncThatReturnsTuple2()
  @transient private val a = tuple._1
  @transient private val b = tuple._2
}
```

### 避免傳名呼叫 (Call-by-Name)

```scala
// 避免傳名呼叫參數
// 壞 - 呼叫端無法判斷是執行一次還是多次
def print(value: => Int): Unit = {
  println(value)
  println(value + 1)
}

// 好 - 使用顯式函式型別
def print(value: () => Int): Unit = {
  println(value())
  println(value() + 1)
}
```

### 避免多個參數列表

```scala
// 避免多個參數列表（隱式參數除外）
// 壞
case class Person(name: String, age: Int)(secret: String)

// 好
case class Person(name: String, age: Int, secret: String)

// 例外：隱式參數的獨立列表（但應儘量避免隱式參數！）
def foo(x: Int)(implicit ec: ExecutionContext): Future[Int]
```

### 符號方法 (Symbolic Methods)

```scala
// 僅用於算術運算子
class Vector {
  def +(other: Vector): Vector = { ... }  // 可以
  def -(other: Vector): Vector = { ... }  // 可以
}

// 不要用於其他方法
// 壞
channel ! msg
stream1 >>= stream2

// 好
channel.send(msg)
stream1.join(stream2)
```

### 型別推斷

```scala
// 始終為公開方法指定型別
def getUserById(id: Long): Option[User] = { ... }

// 始終為隱式方法指定型別
implicit def stringToInt(s: String): Int = s.toInt

// 當型別不明顯時（3 秒原則），指定變數型別
val user: User = complexComputation()

// 當顯而易見時可以省略
val count = 5
val name = "Alice"
```

### Return 語句

```scala
// 避免在閉包中使用 return - 它在底層使用異常處理
def receive(rpc: WebSocketRPC): Option[Response] = {
  tableFut.onComplete { table =>
    if (table.isFailure) {
      return None  // 不要這樣做 - 執行緒錯誤！
    }
  }
}

// 使用 return 作為守衛 (Guard) 以簡化控制流
def doSomething(obj: Any): Any = {
  if (obj eq null) {
    return null
  }
  // 執行某些操作
}

// 使用 return 提早跳出迴圈
while (true) {
  if (cond) {
    return
  }
}
```

### 遞迴與尾遞迴 (Tail Recursion)

```scala
// 除非是自然的遞迴結構（樹、圖），否則避免使用遞迴
// 對尾遞迴方法使用 @tailrec
@scala.annotation.tailrec
def max0(data: Array[Int], pos: Int, max: Int): Int = {
  if (pos == data.length) {
    max
  } else {
    max0(data, pos + 1, if (data(pos) > max) data(pos) else max)
  }
}

// 為了清晰起見，優先使用顯式迴圈
def max(data: Array[Int]): Int = {
  var max = Int.MinValue
  for (v <- data) {
    if (v > max) {
      max = v
    }
  }
  max
}
```

### 隱式轉換 (Implicits)

```scala
// 除非滿足以下條件，否則避免使用隱式轉換：
// 1. 建構 DSL
// 2. 隱式型別參數 (ClassTag, TypeTag)
// 3. 類別內的私有型別轉換

// 如果必須使用，不要超載 (Overload)
object ImplicitHolder {
  // 壞 - 無法選擇性匯入
  def toRdd(seq: Seq[Int]): RDD[Int] = { ... }
  def toRdd(seq: Seq[Long]): RDD[Long] = { ... }
}

// 好 - 使用不同的名稱
object ImplicitHolder {
  def intSeqToRdd(seq: Seq[Int]): RDD[Int] = { ... }
  def longSeqToRdd(seq: Seq[Long]): RDD[Long] = { ... }
}
```

## 型別安全

### 代數資料型別 (Algebraic Data Types)

```scala
// 和型別 (Sum types) - 帶有 case class 的 sealed trait
sealed trait PaymentMethod
case class CreditCard(number: String, cvv: String) extends PaymentMethod
case class PayPal(email: String) extends PaymentMethod
case class BankTransfer(account: String, routing: String) extends PaymentMethod

def processPayment(payment: PaymentMethod): Either[Error, Receipt] = payment match {
  case CreditCard(number, cvv) => chargeCreditCard(number, cvv)
  case PayPal(email) => chargePayPal(email)
  case BankTransfer(account, routing) => chargeBankAccount(account, routing)
}

// 積型別 (Product types) - case classes
case class User(id: Long, name: String, email: String, age: Int)
case class Order(id: Long, userId: Long, items: List[Item], total: BigDecimal)
```

### 使用 Option 優於 null

```scala
// 使用 Option 而非 null
def findUserById(id: Long): Option[User] = {
  database.query(id)
}

// 使用 Option() 來防止 null
def myMethod1(input: String): Option[String] = Option(transform(input))

// 不要使用 Some() - 它無法防止 null
def myMethod2(input: String): Option[String] = Some(transform(input)) // 壞

// 對 Option 進行模式匹配
def processUser(id: Long): String = findUserById(id) match {
  case Some(user) => s"Found: ${user.name}"
  case None => "User not found"
}

// 除非絕對確定，否則不要呼叫 get()
val user = findUserById(123).get  // 危險！

// 使用 getOrElse, map, flatMap, fold 等方法
val name = findUserById(123).map(_.name).getOrElse("Unknown")
```

### 使用 Either 進行錯誤處理

```scala
sealed trait ValidationError
case class InvalidEmail(email: String) extends ValidationError
case class InvalidAge(age: Int) extends ValidationError
case class MissingField(field: String) extends ValidationError

def validateUser(data: Map[String, String]): Either[ValidationError, User] = {
  for {
    name <- data.get("name").toRight(MissingField("name"))
    email <- data.get("email").toRight(MissingField("email"))
    validEmail <- validateEmail(email)
    ageStr <- data.get("age").toRight(MissingField("age"))
    age <- ageStr.toIntOption.toRight(InvalidAge(-1))
  } yield User(name, validEmail, age)
}
```

### Try 與異常 (Exceptions)

```scala
// 不要從 API 回傳 Try
// 壞
def getUser(id: Long): Try[User]

// 好 - 使用顯式的 throws
@throws(classOf[DatabaseConnectionException])
def getUser(id: Long): Option[User]

// 使用 NonFatal 捕捉異常
import scala.util.control.NonFatal

try {
  dangerousOperation()
} catch {
  case NonFatal(e) =>
    logger.error("Operation failed", e)
  case e: InterruptedException =>
    // 處理中斷
}
```

## 集合 (Collections)

### 優先使用不可變集合

```scala
import scala.collection.immutable._

// 好
val numbers = List(1, 2, 3, 4, 5)
val doubled = numbers.map(_ * 2)
val evens = numbers.filter(_ % 2 == 0)

val userMap = Map(
  1L -> "Alice",
  2L -> "Bob"
)
val updated = userMap + (3L -> "Charlie")

// 對於惰性序列，使用 Stream (Scala 2.12) 或 LazyList (Scala 2.13)
val fibonacci: LazyList[BigInt] =
  BigInt(0) #:: BigInt(1) #:: fibonacci.zip(fibonacci.tail).map { case (a, b) => a + b }

val first10 = fibonacci.take(10).toList
```

### 單子鏈接 (Monadic Chaining)

```scala
// 避免鏈接超過 3 個操作
// 在 flatMap 後換行
// 不要與 if-else 區塊鏈接

// 壞 - 過於複雜
database.get(name).flatMap { elem =>
  elem.data.get("address").flatMap(Option.apply)
}

// 好 - 具備更好的可讀性
def getAddress(name: String): Option[String] = {
  if (!database.contains(name)) {
    return None
  }

  database(name).data.get("address") match {
    case Some(null) => None
    case Some(addr) => Option(addr)
    case None => None
  }
}

// 不要與 if-else 鏈接
// 壞
if (condition) {
  Seq(1, 2, 3)
} else {
  Seq(1, 2, 3)
}.map(_ + 1)

// 好
val seq = if (condition) Seq(1, 2, 3) else Seq(4, 5, 6)
seq.map(_ + 1)
```

## 效能

### 使用 while 迴圈

```scala
// 對於效能關鍵的程式碼，使用 while 代替 for/map
val arr = Array.fill(1000)(Random.nextInt())

// 慢
val newArr = arr.zipWithIndex.map { case (elem, i) =>
  if (i % 2 == 0) 0 else elem
}

// 快
val newArr = new Array[Int](arr.length)
var i = 0
while (i < arr.length) {
  newArr(i) = if (i % 2 == 0) 0 else arr(i)
  i += 1
}
```

### Option 與 null

```scala
// 對於效能關鍵的程式碼，優先選擇 null 而非 Option
class Foo {
  @javax.annotation.Nullable
  private[this] var nullableField: Bar = _
}
```

### 使用 private[this]

```scala
// private[this] 會產生欄位，而非存取子方法
class MyClass {
  private val field1 = ...        // 可能使用存取子
  private[this] val field2 = ...  // 直接存取欄位

  def perfSensitiveMethod(): Unit = {
    var i = 0
    while (i < 1000000) {
      field2  // 保證直接存取欄位
      i += 1
    }
  }
}
```

### Java 集合

```scala
// 為了效能，優先選擇 Java 集合
import java.util.{ArrayList, HashMap}

val list = new ArrayList[String]()
val map = new HashMap[String, Int]()
```

## 並行 (Concurrency)

### 優先選擇 ConcurrentHashMap

```scala
// 使用 java.util.concurrent.ConcurrentHashMap
private[this] val map = new java.util.concurrent.ConcurrentHashMap[String, String]

// 或者在低競爭情況下使用同步化的 map
private[this] val map = java.util.Collections.synchronizedMap(
  new java.util.HashMap[String, String]
)
```

### 顯式同步化 (Explicit Synchronization)

```scala
class Manager {
  private[this] var count = 0
  private[this] val map = new java.util.HashMap[String, String]

  def update(key: String, value: String): Unit = synchronized {
    map.put(key, value)
    count += 1
  }

  def getCount: Int = synchronized { count }
}
```

### 原子變數 (Atomic Variables)

```scala
import java.util.concurrent.atomic._

// 優先選擇 Atomic 而非 @volatile
val initialized = new AtomicBoolean(false)

// 清晰地表達僅執行一次
if (!initialized.getAndSet(true)) {
  initialize()
}
```

## 測試

### 捕捉特定異常

```scala
import org.scalatest._

// 壞 - 過於寬泛
intercept[Exception] {
  thingThatThrows()
}

// 好 - 特定型別
intercept[IllegalArgumentException] {
  thingThatThrows()
}
```

## SBT 配置

```scala
// build.sbt
ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "2.13.12"
ThisBuild / organization := "com.example"

lazy val root = (project in file("."))
  .settings(
    name := "my-application",

    libraryDependencies ++= Seq(
      "org.typelevel" %% "cats-core" % "2.10.0",
      "org.typelevel" %% "cats-effect" % "3.5.2",

      // 測試
      "org.scalatest" %% "scalatest" % "3.2.17" % Test,
      "org.scalatestplus" %% "scalacheck-1-17" % "3.2.17.0" % Test
    ),

    scalacOptions ++= Seq(
      "-encoding", "UTF-8",
      "-feature",
      "-unchecked",
      "-deprecation",
      "-Xfatal-warnings"
    )
  )
```

## 其他

### 使用 nanoTime

```scala
// 使用 nanoTime 計算持續時間，而非 currentTimeMillis
val start = System.nanoTime()
doWork()
val elapsed = System.nanoTime() - start

import java.util.concurrent.TimeUnit
val elapsedMs = TimeUnit.NANOSECONDS.toMillis(elapsed)
```

### URI 優於 URL

```scala
// 使用 URI 而非 URL（URL.equals 會執行 DNS 查詢！）
val uri = new java.net.URI("http://example.com")
// 不要使用：val url = new java.net.URL("http://example.com")
```

## 總結

1. **撰寫簡單的程式碼** - 優化可讀性與可維護性
2. **使用不可變資料** - val、不可變集合、case classes
3. **節制使用語言功能** - 限制隱式轉換、避免符號方法
4. **為公開 API 指定型別** - 為方法和欄位顯式指定型別
5. **顯式優於隱式** - 清晰比簡潔更重要
6. **使用標準函式庫** - 不要重新發明輪子
7. **遵循命名慣例** - PascalCase, camelCase, UPPER_CASE
8. **保持方法簡小** - 30 原則
9. **顯式處理錯誤** - Option, Either, 帶有 @throws 的異常
10. **在優化前進行剖析 (Profile)** - 以測量為準，不要靠猜測

如需完整詳細資訊，請參閱 [Databricks Scala Style Guide](https://github.com/databricks/scala-style-guide)。
