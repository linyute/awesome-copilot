# 開源贊助外掛程式

提供給開源專案辦公室 (OSPO) 用於透過 GitHub Sponsors、Open Collective 和其他資助平台識別、評估與管理開源相依性贊助的工具與資源。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install ospo-sponsorship@awesome-copilot
```

## 內含項目

### 技能 (Skills)

| 技能 | 說明 |
|-------|-------------|
| `SKILL.md` | 找出 GitHub 存放庫的哪些相依性可透過 GitHub Sponsors 進行贊助。使用 deps.dev API 跨 npm、PyPI、Cargo、Go、RubyGems、Maven 和 NuGet 進行相依性解析。檢查 npm 資金 metadata、FUNDING.yml 檔案和網路搜尋。驗證每個連結。顯示具有 OSSF Scorecard 健康資料的直接與傳遞相依性。透過提供 GitHub 擁有者/存放庫來呼叫（例如 "find sponsorable dependencies in expressjs/express"）。 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個由社群驅動的 GitHub Copilot 擴充功能集合。

## 授權條款

MIT
