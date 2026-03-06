# 基於 MCP 的 M365 代理程式外掛程式 (MCP-based M365 Agents Plugin)

用於為 Microsoft 365 Copilot 建立整合 Model Context Protocol 之宣告式代理程式的全面集合

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install mcp-m365-copilot@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/mcp-m365-copilot:mcp-create-declarative-agent` | 建立 MCP 宣告式代理程式 |
| `/mcp-m365-copilot:mcp-create-adaptive-cards` | 建立 MCP 調適型卡片 (Adaptive Cards) |
| `/mcp-m365-copilot:mcp-deploy-manage-agents` | 部署與管理 MCP 代理程式 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `mcp-m365-agent-expert` | 為 Microsoft 365 Copilot 建立整合 Model Context Protocol 之基於 MCP 宣告式代理程式的專家助手 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
