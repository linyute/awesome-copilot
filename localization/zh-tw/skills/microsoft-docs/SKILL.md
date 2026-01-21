---
name: microsoft-docs
description: 查詢 Microsoft 官方文件以理解概念、尋找教學並學習服務如何運作。用於 Azure、.NET、Microsoft 365、Windows、Power Platform 以及所有 Microsoft 技術。從 learn.microsoft.com 和其他 Microsoft 官方網站取得準確、最新的資訊——架構概觀、快速入門、組態指南、限制以及最佳實踐。
compatibility: 需要 Microsoft Learn MCP 伺服器 (https://learn.microsoft.com/api/mcp)
---

# Microsoft 文件 (Microsoft Docs)

## 工具

| 工具 | 用於 |
|------|---------|
| `microsoft_docs_search` | 尋找文件——概念、指南、教學、組態 |
| `microsoft_docs_fetch` | 取得完整頁面內容 (當搜尋摘要不足夠時) |

## 何時使用

- **理解概念** ——「Cosmos DB 分割是如何運作的？」
- **學習一項服務** ——「Azure Functions 概觀」、「Container Apps 架構」
- **尋找教學** ——「快速入門」、「入門」、「逐步指南」
- **組態選項** ——「App Service 組態設定」
- **限制與配額** ——「Azure OpenAI 速率限制」、「Service Bus 配額」
- **最佳實踐** ——「Azure 安全性最佳實踐」

## 查詢有效性

良好的查詢應具備具體性：

```
# ❌ 太過廣泛
"Azure Functions"

# ✅ 具體
"Azure Functions Python v2 程式設計模型"
"Cosmos DB 分割鍵設計最佳實踐"
"Container Apps 調整規則 KEDA"
```

包含上下文：
- 相關時請註明**版本** (`.NET 8`, `EF Core 8`)
- **工作意圖** (`快速入門`, `教學`, `概觀`, `限制`)
- 針對多平台文件的**平台** (`Linux`, `Windows`)

## 何時擷取完整頁面

在搜尋後出現以下情況時進行擷取：
- **教學** ——需要完整的逐步指示
- **組態指南** ——需要列出所有選項
- **深度探討** ——使用者想要全面的涵蓋範圍
- **搜尋摘要被截斷** ——需要完整上下文

## 為何使用此技能

- **準確性** ——即時文件，而非可能已過時的訓練資料
- **完整性** ——教學具備所有步驟，而非片段
- **權威性** ——官方 Microsoft 文件
