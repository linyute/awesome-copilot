---
name: 'javax-to-jakarta-migration'
description: '將 Java 程式碼從 javax.* 遷移到 jakarta.* 命名空間。在升級到 Tomcat 11、Jakarta EE 10 或在程式碼中偵測到 javax 匯入時使用。'
argument-hint: '要遷移的檔案、套件或模組'
---

# javax → jakarta 遷移技能

## 何時使用
- 升級到 Tomcat 11 / Jakarta EE 10+
- 程式碼審查偵測到 `javax.*` 匯入
- 將現有專案遷移到 jakarta 命名空間

## 程序

### 步驟 1 — 掃描 javax 使用情況
在程式碼中搜尋所有需要遷移的 `javax.*` 匯入：
```
javax.servlet.*      → jakarta.servlet.*
javax.persistence.*  → jakarta.persistence.*
javax.validation.*   → jakarta.validation.*
javax.annotation.*   → jakarta.annotation.*
javax.inject.*       → jakarta.inject.*
javax.enterprise.*   → jakarta.enterprise.*
javax.faces.*        → jakarta.faces.*
javax.ws.rs.*        → jakarta.ws.rs.*
javax.el.*           → jakarta.el.*
javax.json.*         → jakarta.json.*
javax.mail.*         → jakarta.mail.*
javax.websocket.*    → jakarta.websocket.*
```

**不要遷移**這些（它們保留在 `javax.*` 中）：
- `javax.sql.*` — JDK 的一部分
- `javax.naming.*` — JDK 的一部分 (JNDI)
- `javax.crypto.*` — JDK 的一部分
- `javax.net.*` — JDK 的一部分
- `javax.security.auth.*` — JDK 的一部分
- `javax.swing.*`, `javax.xml.parsers.*` — JDK 套件

### 步驟 2 — 更新 pom.xml
取代相依性座標：

| 舊 | 新 |
|-----|-----|
| `javax.servlet:javax.servlet-api` | `jakarta.servlet:jakarta.servlet-api:6.0.0` |
| `javax.persistence:javax.persistence-api` | `jakarta.persistence:jakarta.persistence-api:3.1.0` |
| `javax.validation:validation-api` | `jakarta.validation:jakarta.validation-api:3.0.2` |
| `javax.annotation:javax.annotation-api` | `jakarta.annotation:jakarta.annotation-api:2.1.1` |

### 步驟 3 — 更新 web.xml（如果存在）
```xml
<!-- 舊命名空間 -->
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee" version="4.0">

<!-- 新命名空間 -->
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee" version="6.0">
```

### 步驟 4 — 更新 Java 原始程式碼檔案
在 `.java` 檔案中將所有 `javax.` 匯入取代為 `jakarta.` 等效項。

### 步驟 5 — 驗證
1. 執行 `mvn clean compile` 或 `gradlew build` — 修復任何編譯錯誤
2. 執行 `mvn test` 或 `gradlew test` — 確保所有測試都通過
3. 搜尋任何剩餘的 `javax.*` 匯入（不包括 JDK 套件）

### 輸出
提供遷移摘要，列出所有更改的檔案、取代的匯入以及任何需要的手動步驟。
