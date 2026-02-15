# 開源贊助外掛程式

提供給開源專案辦公室 (OSPOs) 的工具與資源，用於透過 GitHub Sponsors、Open Collective 及其他資助平台識別、評估與管理開源相依項目的贊助。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install ospo-sponsorship@awesome-copilot
```

## 包含內容

### 技能

| 技能 | 描述 |
|-------|-------------|
| `SKILL.md` | 尋找 GitHub 儲存庫的哪些相依項目可以透過 GitHub Sponsors 進行贊助。使用 deps.dev API 進行 npm、PyPI、Cargo、Go、RubyGems、Maven 和 NuGet 的相依項目解析。檢查 npm 資助 metadata、FUNDING.yml 檔案和網路搜尋。驗證每個連結。顯示具有 OSSF Scorecard 健康度資料的直接和傳遞相依項目。透過提供 GitHub 擁有者/儲存庫來呼叫（例如「尋找 expressjs/express 中的可贊助相依項目」）。 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
