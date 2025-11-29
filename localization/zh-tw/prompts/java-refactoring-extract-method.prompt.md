---
title: 'Refactoring Java Methods with Extract Method'
mode: 'agent'
description: '使用 Java 語言中的提取方法進行重構'
---

# 使用提取方法重構 Java 函式

## 角色

您是重構 Java 函式的專家。

以下是 **2 個範例**（包含重構前後的程式碼標題），代表 **提取方法**。

## 重構前程式碼 1：
```java
public FactLineBuilder setC_BPartner_ID_IfValid(final int bpartnerId) {
	assertNotBuild();
	if (bpartnerId > 0) {
		setC_BPartner_ID(bpartnerId);
	}
	return this;
}
```

## 重構後程式碼 1：
```java
public FactLineBuilder bpartnerIdIfNotNull(final BPartnerId bpartnerId) {
	if (bpartnerId != null) {
		return bpartnerId(bpartnerId);
	} else {
		return this;
	}
}
public FactLineBuilder setC_BPartner_ID_IfValid(final int bpartnerRepoId) {
	return bpartnerIdIfNotNull(BPartnerId.ofRepoIdOrNull(bpartnerRepoId));
}
```

## 重構前程式碼 2：
```java
public DefaultExpander add(RelationshipType type, Direction direction) {
     Direction existingDirection = directions.get(type.name());
     final RelationshipType[] newTypes;
     if (existingDirection != null) {
          if (existingDirection == direction) {
               return this;
          }
          newTypes = types;
     } else {
          newTypes = new RelationshipType[types.length + 1];
          System.arraycopy(types, 0, newTypes, 0, types.length);
          newTypes[types.length] = type;
     }
     Map<String, Direction> newDirections = new HashMap<String, Direction>(directions);
     newDirections.put(type.name(), direction);
     return new DefaultExpander(newTypes, newDirections);
}
```

## 重構後程式碼 2：
```java
public DefaultExpander add(RelationshipType type, Direction direction) {
     Direction existingDirection = directions.get(type.name());
     final RelationshipType[] newTypes;
     if (existingDirection != null) {
          if (existingDirection == direction) {
               return this;
          }
          newTypes = types;
     } else {
          newTypes = new RelationshipType[types.length + 1];
          System.arraycopy(types, 0, newTypes, 0, types.length);
          newTypes[types.length] = type;
     }
     Map<String, Direction> newDirections = new HashMap<String, Direction>(directions);
     newDirections.put(type.name(), direction);
     return (DefaultExpander) newExpander(newTypes, newDirections);
}
protected RelationshipExpander newExpander(RelationshipType[] types,
          Map<String, Direction> directions) {
     return new DefaultExpander(types, directions);
}
```

## 任務

應用 **提取方法** 以提高可讀性、可測試性、可維護性、可重用性、模組化、內聚性、低耦合和一致性。

始終返回一個完整且可編譯的函式 (Java 17)。

在內部執行中間步驟：
- 首先，分析每個函式並識別超出閾值的函式：
  * LOC (程式碼行數) > 15
  * NOM (語句數) > 10
  * CC (圈複雜度) > 10
- 對於每個符合條件的函式，識別可以提取到單獨函式中的程式碼區塊。
- 提取至少一個具有描述性名稱的新函式。
- 僅在單個 ```java``` 區塊內輸出重構後的程式碼。
- 不要從原始函式中刪除任何功能。
- 在每個新函式上方包含一行註釋，描述其用途。

## 待重構程式碼：

現在，評估所有複雜度高的函式，並使用 **提取方法** 對其進行重構。
