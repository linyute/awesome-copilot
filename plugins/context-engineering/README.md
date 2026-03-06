# Context Engineering 外掛程式

透過更好的內容管理極大化 GitHub Copilot 效能的工具與技術。包含結構化程式碼的指引、用於規劃多檔案變更的 Agent，以及用於內容感知開發的提示詞。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install context-engineering@awesome-copilot
```

## 包含內容

### 命令 (斜線命令)

| 命令 | 說明 |
|---------|-------------|
| `/context-engineering:context-map` | 在進行變更前產生與任務相關的所有檔案地圖 |
| `/context-engineering:what-context-needed` | 在回答問題前詢問 Copilot 需要查看哪些檔案 |
| `/context-engineering:refactor-plan` | 規劃具備適當順序與復原步驟的多檔案重構 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `context-architect` | 一個透過識別相關內容與相依性，協助規劃並執行多檔案變更的 Agent |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能收藏。

## 授權

MIT
