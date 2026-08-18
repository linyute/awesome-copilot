# TypeSpec for Microsoft 365 Copilot 外掛程式

提示、指示與資源的完整集合，用於透過 TypeSpec 建構宣告式 Agent 與 API 外掛程式，以實現 Microsoft 365 Copilot 的擴充性。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install typespec-m365-copilot@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 說明 |
|---------|-------------|
| `/typespec-m365-copilot:typespec-create-agent` | 為 Microsoft 365 Copilot 產生具備指示、功能與對話起點的完整 TypeSpec 宣告式 Agent |
| `/typespec-m365-copilot:typespec-create-api-plugin` | 為 Microsoft 365 Copilot 產生具備 REST 作業、驗證與調適型資訊卡 (Adaptive Cards) 的 TypeSpec API 外掛程式 |
| `/typespec-m365-copilot:typespec-api-operations` | 將 GET、POST、PATCH 與 DELETE 作業新增至 TypeSpec API 外掛程式，並具備適當的路由、參數與調適型資訊卡 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，該專案為社群推動的 GitHub Copilot 擴充套件集合。

## 授權

MIT
