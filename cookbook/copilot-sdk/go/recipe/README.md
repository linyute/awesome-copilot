# 可執行的食譜範例

此資料夾包含針對每份 Cookbook 食譜的獨立、可執行的 Go 範例。每個檔案都是一個完整的程式，可以直接使用 `go run` 執行。

## 先決條件

- Go 1.21 或更高版本
- GitHub Copilot SDK for Go

```bash
go get github.com/github/copilot-sdk/go
```

## 執行範例

每個 `.go` 檔案都是一個完整、可執行的程式。只需使用：

```bash
go run <檔名>.go
```

### 可用的食譜

| 食譜                 | 命令                             | 說明                                       |
| -------------------- | -------------------------------- | ------------------------------------------ |
| 錯誤處理             | `go run error-handling.go`       | 示範錯誤處理模式                           |
| 多個工作階段         | `go run multiple-sessions.go`    | 管理多個獨立的對話                         |
| 管理本機檔案         | `go run managing-local-files.go` | 使用 AI 分組組織檔案                       |
| PR 視覺化            | `go run pr-visualization.go`     | 產生 PR 時長圖表                           |
| 持續性工作階段       | `go run persisting-sessions.go`  | 跨重新啟動儲存並恢復工作階段               |

### 帶有引數的範例

**針對特定儲存庫的 PR 視覺化：**

```bash
go run pr-visualization.go -repo github/copilot-sdk
```

**管理本機檔案（先編輯檔案以更改目標資料夾）：**

```bash
# 先編輯 managing-local-files.go 中的 targetFolder 變數
go run managing-local-files.go
```

## Go 最佳實踐

這些範例遵循 Go 慣例：

- 帶有明確檢查的正確錯誤處理
- 使用 `defer` 進行清理
- 慣用命名（區域變數使用 camelCase）
- 在適當情況下使用標準函式庫
- 職責分離清晰

## 學習資源

- [Go 文件](https://go.dev/doc/)
- [GitHub Copilot SDK for Go](https://github.com/github/copilot-sdk/blob/main/go/README.md)
- [上層 Cookbook](../README.md)
