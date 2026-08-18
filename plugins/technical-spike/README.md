# Technical Spike 外掛程式

用於建立、管理與研究技術探針 (technical spike) 的工具，以在進入解決方案的規格制定與實作前減少未知因素與假設。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install technical-spike@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 說明 |
|---------|-------------|
| `/technical-spike:create-technical-spike` | 建立設定時間上限 (time-boxed) 的技術探針文件，以在實作前研究並解決關鍵的開發決策。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `research-technical-spike` | 透過詳盡的調查與受控實驗，有系統地研究並驗證技術探針文件。 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，該專案為社群推動的 GitHub Copilot 擴充套件集合。

## 授權

MIT
