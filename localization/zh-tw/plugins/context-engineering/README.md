# 上下文工程外掛程式 (Context Engineering Plugin)

透過更好的上下文管理來最大化 GitHub Copilot 成效的工具與技術。包含結構化程式碼的指引、用於規劃多檔案變更的代理程式 (agent)，以及用於上下文感知開發的提示詞。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install context-engineering@awesome-copilot
```

## 包含內容

### 命令 (斜線命令)

| 命令 | 說明 |
|---------|-------------|
| `/context-engineering:context-map` | 在進行變更前產生所有與任務相關檔案的地圖 |
| `/context-engineering:what-context-needed` | 在回答問題前詢問 Copilot 需要檢視哪些檔案 |
| `/context-engineering:refactor-plan` | 規劃具有適當順序與回滾步驟的多檔案重構 |

### 代理程式 (Agents)

| 代理程式 | 說明 |
|-------|-------------|
| `context-architect` | 一個透過識別相關上下文與相依性來協助規劃與執行多檔案變更的代理程式 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
