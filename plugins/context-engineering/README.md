# Context Engineering 外掛程式

透過更佳的情境管理以最大化 GitHub Copilot 效益的工具與技巧。包含組織程式碼結構的指引、用於規劃多檔案變更的 agent，以及適用於情境感知開發的提示。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install context-engineering@awesome-copilot
```

## 包含內容

### 指令（斜線指令）

| 指令 | 說明 |
|---------|-------------|
| `/context-engineering:context-map` | 在進行變更之前，產生與任務相關的所有檔案對應圖 |
| `/context-engineering:what-context-needed` | 在回答問題之前，詢問 Copilot 需要檢視哪些檔案 |
| `/context-engineering:refactor-plan` | 規劃具有適當順序與回滾步驟的多檔案重構 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `context-architect` | 透過識別相關情境與相依性，協助規劃與執行多檔案變更的 agent |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot)（GitHub Copilot 擴充功能的社群驅動集合）的一部分。

## 授權條款

MIT
