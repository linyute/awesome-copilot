# 適用於 Microsoft 365 Copilot 的 TypeSpec 延伸模組

適用於使用 TypeSpec 建置 Microsoft 365 Copilot 擴充性的宣告式 Agent 和 API 延伸模組的提示、指令和資源的全面集合。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install typespec-m365-copilot@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 描述 |
|---------|-------------|
| `/typespec-m365-copilot:typespec-create-agent` | 為 Microsoft 365 Copilot 產生具有指令、功能和對話啟動器的完整 TypeSpec 宣告式 Agent |
| `/typespec-m365-copilot:typespec-create-api-plugin` | 為 Microsoft 365 Copilot 產生具有 REST 作業、驗證和調適型卡片 (Adaptive Cards) 的 TypeSpec API 延伸模組 |
| `/typespec-m365-copilot:typespec-api-operations` | 將具有正確路由、參數和調適型卡片的 GET、POST、PATCH 和 DELETE 作業新增至 TypeSpec API 延伸模組 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
