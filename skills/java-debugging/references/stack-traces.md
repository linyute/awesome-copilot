# 判讀 Java 堆疊追蹤 (Reading Java stack traces)

## 結構解析 (Anatomy)

```
java.lang.IllegalStateException: Order 42 already shipped
	at com.example.OrderService.ship(OrderService.java:88)
	at com.example.OrderController.ship(OrderController.java:31)
	...
Caused by: java.sql.SQLException: Connection refused
	at ...
	... 12 more
```

- 第一行：例外狀況型別與訊息。逐字閱讀訊息內容。
- 最頂層框架為擲出例外狀況之處；向下尋找自身程式碼中的第一個框架。
- `Caused by:` 鏈：最深（最後一個）原因通常為根本原因。`... N more` 表示與外層追蹤共用的框架數。
- `Suppressed:` 項目來自 try-with-resources 關閉時的失敗。

## 實用訣竅

1. 開啟自身套件中的第一個框架，並檢查哪個參照可能為 null 或哪個引數無效。
2. `NullPointerException`：有幫助的訊息（自 JDK 15 起預設開啟）會指出 null 的變數或呼叫。
3. 包裝例外狀況 (`BeanCreationException`, `CompletionException`, `InvocationTargetException`, `ExecutionException`)：直接跳至最深層的 `Caused by`。
4. `OutOfMemoryError`：請使用 `java-diagnostics` skill。`StackOverflowError`：尋找重複的框架模式（無窮遞迴）。
5. 熱點重複例外狀況缺少堆疊追蹤是源於 `OmitStackTraceInFastThrow`；檢查較早的記錄出現處，或在本機搭配 `-XX:-OmitStackTraceInFastThrow` 執行。
6. 代理/產生的框架 (`$$SpringCGLIB$$`, `$Proxy`, lambdas) 為干擾雜訊；請將注意力集中在鄰近的框架上。
7. 反應式/非同步：追蹤指向排程器執行緒；在開發時使用相互關聯識別碼或 operator debug。
8. 尋求協助或提出 issue 時，請附上完整的追蹤記錄、Java 版本與相依性版本。
