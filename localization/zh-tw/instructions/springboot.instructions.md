---
description: 'Spring Boot 基礎應用程式建構指引'
applyTo: '**/*.java, **/*.kt'
---

# Spring Boot 開發

## 一般指引

- 僅在審查程式碼變更時提出高信心建議。
- 撰寫具備良好維護性的程式碼，並在註解中說明設計決策的原因。
- 處理邊界情境並撰寫清楚的例外處理。
- 若使用函式庫或外部相依套件，請在註解中說明其用途與目的。

## Spring Boot 指引

### 相依性注入

- 所有必要的相依性皆使用建構式注入。
- 相依性欄位宣告為 `private final`。

### 設定

- 外部化設定請使用 YAML 檔（`application.yml`）。
- 環境設定檔：針對不同環境（dev、test、prod）使用 Spring profiles。
- 設定屬性：使用 @ConfigurationProperties 進行型別安全的設定綁定。
- 機密管理：機密資訊請以環境變數或機密管理系統外部化。

### 程式碼組織

- 套件結構：依功能/領域組織，而非依層次。
- 關注點分離：Controller 保持精簡、Service 專注、Repository 簡單。
- 工具類別：工具類別請設為 final 並使用 private 建構式。

### Service 層

- 商業邏輯放在標註 `@Service` 的類別中。
- Service 應保持無狀態且可測試。
- 透過建構式注入 Repository。
- Service 方法簽名應使用領域 ID 或 DTO，除非必要不直接暴露 Repository 實體。

### 日誌

- 所有日誌皆使用 SLF4J（`private static final Logger logger = LoggerFactory.getLogger(MyClass.class);`）。
- 不直接使用具體實作（Logback、Log4j2）或 `System.out.println()`。
- 使用參數化日誌：`logger.info("User {} logged in", userId);`。

### 安全性與輸入處理

- 使用參數化查詢 | 一律使用 Spring Data JPA 或 `NamedParameterJdbcTemplate` 防止 SQL 注入。
- 以 JSR-380（`@NotNull`、`@Size` 等）註解及 `BindingResult` 驗證請求主體與參數。

## 建構與驗證

- 新增或修改程式碼後，請確認專案能成功建構。
- 若專案使用 Maven，執行 `mvn clean install`。
- 若專案使用 Gradle，執行 `./gradlew build`（Windows 可用 `gradlew.bat build`）。
- 確保所有測試皆通過。

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 翻譯為繁體中文，可能包含錯誤。如發現不適當或錯誤之翻譯，請至 [issue](../../issues) 回報。
