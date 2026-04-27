# 可執行的範例食譜

此資料夾包含每個食譜食譜的獨立、可執行的 Java 範例。每個檔案都可以直接使用 [JBang](https://www.jbang.dev/) 執行 — 不需要專案設定。

## 先決條件

- Java 17 或更高版本
- 已安裝 JBang：

```bash
# macOS (使用 Homebrew)
brew install jbangdev/tap/jbang

# Linux/macOS (使用 curl)
curl -Ls https://sh.jbang.dev | bash -s - app setup

# Windows (使用 Scoop)
scoop install jbang
```

對於其他安裝方法，請參閱 [JBang 安裝指南](https://www.jbang.dev/download/)。

## 執行範例

每個 `.java` 檔案都是一個完整的、可執行的程式。只需使用：

```bash
jbang <FileName>.java
```

### 可用的食譜

| 食譜                 | 指令                                 | 描述                                       |
| -------------------- | ------------------------------------ | ------------------------------------------ |
| 錯誤處理             | `jbang ErrorHandling.java`           | 示範錯誤處理模式                           |
| 多個工作階段         | `jbang MultipleSessions.java`        | 管理多個獨立的對話                         |
| 管理本地檔案         | `jbang ManagingLocalFiles.java`      | 使用 AI 分組整理檔案                       |
| PR 視覺化            | `jbang PRVisualization.java`         | 產生 PR 年齡圖表                           |
| 持久化工作階段       | `jbang PersistingSessions.java`      | 在重新啟動後儲存並恢復工作階段             |
| Ralph 迴圈           | `jbang RalphLoop.java`              | 自主 AI 任務迴圈                           |
| 無障礙報告           | `jbang AccessibilityReport.java`     | WCAG 無障礙報告產生器                      |

### 帶有引數的範例

**特定儲存庫的 PR 視覺化：**

```bash
jbang PRVisualization.java github/copilot-sdk
```

**特定資料夾的管理本地檔案：**

```bash
jbang ManagingLocalFiles.java /path/to/your/folder
```

**使用自訂提示檔案的 Ralph 迴圈：**

```bash
jbang RalphLoop.java PROMPT_build.md 20
```

## 為什麼選擇 JBang？

JBang 讓您可以將 Java 檔案作為指令碼執行 — 不需要 `pom.xml`、`build.gradle`，也不需要專案架構。依賴項透過 `//DEPS` 註解在行內宣告並自動解析。

## 學習資源

- [JBang 文件](https://www.jbang.dev/documentation/guide/latest/)
- [Java 版 GitHub Copilot SDK](https://github.com/github/copilot-sdk-java)
- [父級食譜](../README.md)
