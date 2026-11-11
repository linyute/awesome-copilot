---
name: java-refactoring-remove-parameter
description: '使用 Java 語言中的移除參數進行重構'
---

# 使用移除參數重構 Java 函式

## 角色

您是重構 Java 函式的專家。

以下是 **2 個範例**（包含重構前後的程式碼標題），代表 **移除參數**。

## 重構前程式碼 1：
```java
public Backend selectBackendForGroupCommit(long tableId, ConnectContext context, boolean isCloud)
        throws LoadException, DdlException {
    if (!Env.getCurrentEnv().isMaster()) {
        try {
            long backendId = new MasterOpExecutor(context)
                    .getGroupCommitLoadBeId(tableId, context.getCloudCluster(), isCloud);
            return Env.getCurrentSystemInfo().getBackend(backendId);
        } catch (Exception e) {
            throw new LoadException(e.getMessage());
        }
    } else {
        return Env.getCurrentSystemInfo()
                .getBackend(selectBackendForGroupCommitInternal(tableId, context.getCloudCluster(), isCloud));
    }
}
```

## 重構後程式碼 1：
```java
public Backend selectBackendForGroupCommit(long tableId, ConnectContext context)
        throws LoadException, DdlException {
    if (!Env.getCurrentEnv().isMaster()) {
        try {
            long backendId = new MasterOpExecutor(context)
                    .getGroupCommitLoadBeId(tableId, context.getCloudCluster());
            return Env.getCurrentSystemInfo().getBackend(backendId);
        } catch (Exception e) {
            throw new LoadException(e.getMessage());
        }
    } else {
        return Env.getCurrentSystemInfo()
                .getBackend(selectBackendForGroupCommitInternal(tableId, context.getCloudCluster()));
    }
}
```

## 重構前程式碼 2：
```java
NodeImpl( long id, long firstRel, long firstProp )
{
     this( id, false );
}
```

## 重構後程式碼 2：
```java
NodeImpl( long id)
{
     this( id, false );
}
```

## 安全規則

- 僅限不改變行為的調整。只有在參數確實未使用或可由其他來源推導（欄位、常數、其他參數）時才移除；即使依照慣例看似「多餘」，也絕不可移除有被讀取的參數。
- 先確認基準狀態：執行範圍最小且成功的測試指令（`./mvnw -q -Dtest=MyTest test`、`./gradlew test --tests MyTest`），或執行 `./mvnw verify`／`./gradlew build`，並在變更後再次執行。若基準測試失敗，請停止並回報。
- 若受影響的程式碼沒有測試，請停止並回報；先提出特性描述測試（characterization tests）。絕不可刪除或削弱測試。
- 變更函式簽章前，找出所有使用處：使用 LSP find-references（`lsp-setup`／jdtls），並以 grep 搜尋所有模組（包括測試）。另須檢查：
    - 覆寫方法與介面實作（`@Override`、抽象／預設方法、函式介面、方法參照）：整個繼承層級都必須同步變更；
    - 反射與以字串查找的方法（`getMethod`、`getDeclaredMethod`、`MethodHandle`、代理），以及 Spring／CDI／Quarkus／Jakarta 註記的方法（`@Bean`、`@EventListener`、`@Scheduled`、`@Inject`、`@Path`、`@Observes`、`@PostConstruct`），這些問題不一定會被編譯器發現；
    - 用於序列化／反序列化或 JPA／Jackson 的建構函式（`@JsonCreator`、`@ConstructorBinding`、`readObject`），以及對 `serialVersionUID` 的影響；
    - XML／properties／YAML 設定，以及提及該方法名稱的 AOP 切點運算式；
    - 其他模組或已發布成品所使用的 public 或 protected API。
- 變更 public／protected／已發布的 API（建議改採標記為棄用並新增多載），或修改產生的程式碼前，請先詢問使用者。
- 每個步驟只移除一個參數（若使用者要求提交變更，則每次提交只處理一個參數）。若可用，優先使用 jdtls 的 Change Method Signature 重構；否則須同步更新宣告及所有呼叫端。
- 移除參數可能造成多載簽章衝突或改變多載解析結果，請先檢查。呼叫端評估該引數時可能有副作用：若副作用重要，請予以保留。

## 任務

套用 **移除參數（Remove Parameter）** 重構，以提升可讀性、降低耦合並維持一致性。

1. 找出未使用或可推導的參數。
2. 從宣告及所有呼叫端移除各參數，接著編譯並執行測試。
3. 只有在移除原因不明顯時才新增一行註解；否則請在報告中說明。
4. 回報已移除的參數、已更新的呼叫端、執行的指令及其結果，以及任何尚未驗證的項目（例如反射或外部呼叫端）。

## 待重構程式碼：

現在，評估所有具有未使用參數的函式，並使用 **移除參數** 對其進行重構。
