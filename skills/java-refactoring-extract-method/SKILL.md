---
name: java-refactoring-extract-method
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

## 安全規則

- 僅允許保留行為：不得變更功能、移除邏輯、改變例外、變更副作用順序或原始方法的可見性。
- 先執行基準測試：使用最精簡且可通過的測試命令（`./mvnw -q -Dtest=MyTest test`、`./gradlew test --tests MyTest`），或執行 `./mvnw verify`／`./gradlew build`。每次提取後都要重新執行。若基準測試失敗，請停止並回報。
- 若程式碼沒有測試，請停止並回報；先提出特性測試。絕不可刪除或削弱測試。
- 每個步驟只進行一次提取（使用者要求提交時，每次提取各自提交），以便逐一審查及還原。
- 優先使用 IDE 重構：使用提供「提取方法」功能的 IDE 工具（它能安全地處理參數與回傳值）。Copilot CLI 的 `lsp` 工具提供導覽與重新命名，但沒有程式碼動作，因此透過 `lsp-setup` 設定 jdtls 也無法取得此功能；否則請手動提取，並使用編譯器和測試進行驗證。
- 提取的方法預設為 `private`。未經使用者詢問，不得新增 `public`／`protected` 方法、變更現有簽章，或修改產生的程式碼（`target/`、`build/generated`、`@Generated`）。
- 請留意：區塊中被修改的區域變數（回傳值或引入簡單的結果型別）、多個結果、受檢例外、區塊內的 `return`／`break`／`continue`，以及 `synchronized`／帶有交易註解的方法（在 `this` 上呼叫提取出的 `private` 方法會繞過 Spring 代理與 AOP）。

## 任務

使用 **提取方法** 改善可讀性、可測試性、內聚性與一致性。

1. 找出候選方法（粗略判斷標準：超過 15 行、超過 10 個陳述式，或圈複雜度超過 10），並找出其中內聚性高的程式碼區塊。
2. 將每個區塊提取為名稱具描述性的方法，並遵循現有程式碼風格與專案的 Java 版本（檢查 `maven.compiler.release`／工具鏈；勿使用較新版本的語法）。
3. 只有在新方法的名稱未能清楚表達其用途時，才在方法上方加上一行註解。
4. 編譯並執行測試；回報變更的方法、執行的命令及其結果。

為每個變更的方法提供完整且可編譯的程式碼。

## 待重構程式碼：

現在，評估所有複雜度高的函式，並使用 **提取方法** 對其進行重構。
