# 用於 Microsoft 365 Copilot 的 TypeSpec 外掛程式 (TypeSpec for Microsoft 365 Copilot Plugin)

用於使用 TypeSpec 為 Microsoft 365 Copilot 擴充性建立宣告式代理程式與 API 外掛程式的提示、指引與資源全面集合。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install typespec-m365-copilot@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/typespec-m365-copilot:typespec-create-agent` | 為 Microsoft 365 Copilot 產生一個具備指引、功能與對話啟動點的完整 TypeSpec 宣告式代理程式 |
| `/typespec-m365-copilot:typespec-create-api-plugin` | 為 Microsoft 365 Copilot 產生一個具備 REST 操作、驗證與調適型卡片 (Adaptive Cards) 的 TypeSpec API 外掛程式 |
| `/typespec-m365-copilot:typespec-api-operations` | 將 GET、POST、PATCH 與 DELETE 操作新增至具有正確路由、參數與調適型卡片的 TypeSpec API 外掛程式中 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
