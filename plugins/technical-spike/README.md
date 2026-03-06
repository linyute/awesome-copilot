# 技術探針外掛程式 (Technical Spike Plugin)

用於建立、管理與研究技術探針 (technical spike) 的工具，旨在實作解決方案的規格說明與執行之前，減少未知數與假設。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install technical-spike@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/technical-spike:create-technical-spike` | 建立限時的技術探針文件，用於在實作前研究並解決關鍵開發決策。 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `research-technical-spike` | 透過詳盡的調查與受控實驗，系統地研究並驗證技術探針文件。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
