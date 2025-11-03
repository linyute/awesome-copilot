---
title: 'Refactoring Java Methods with Remove Parameter'
mode: 'agent'
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

## 任務

應用 **移除參數** 以提高可讀性、可測試性、可維護性、可重用性、模組化、內聚性、低耦合和一致性。

始終返回一個完整且可編譯的函式 (Java 17)。

在內部執行中間步驟：
- 首先，分析每個函式並識別未使用或冗餘的參數（即，可以從類別欄位、常數或其他函式呼叫中取得的值）。
- 對於每個符合條件的函式，從其定義和所有內部呼叫中移除不必要的參數。
- 確保在移除參數後，函式仍能正常運作。
- 僅在單個 ```java``` 區塊內輸出重構後的程式碼。
- 不要從原始函式中刪除任何功能。
- 在每個修改後的函式上方包含一行註釋，說明移除了哪個參數以及原因。

## 待重構程式碼：

現在，評估所有具有未使用參數的函式，並使用 **移除參數** 對其進行重構。
