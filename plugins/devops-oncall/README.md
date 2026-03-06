# DevOps On-Call 外掛程式 (DevOps On-Call Plugin)

一組專注的提示、指引與聊天模式，協助您使用 DevOps 工具與 Azure 資源進行事件分級並快速回應。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install devops-oncall@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/devops-oncall:azure-resource-health-diagnose` | 分析 Azure 資源健康狀態，從記錄與遙測資料中診斷問題，並為已識別的問題建立補救計畫。 |
| `/devops-oncall:multi-stage-dockerfile` | 為任何語言或架構建立最佳化的多階段 Dockerfile |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `azure-principal-architect` | 使用 Azure Well-Architected Framework 原則與 Microsoft 最佳實務提供專家級 Azure 首席架構師指引。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
