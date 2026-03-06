# 開源贊助外掛程式 (Open Source Sponsorship Plugin)

為開源專案辦公室 (OSPO) 提供的工具與資源，用於透過 GitHub Sponsors、Open Collective 與其他資助平台識別、評估與管理開源相依項目的贊助。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install ospo-sponsorship@awesome-copilot
```

## 包含內容 (What's Included)

### 技能 (Skills)

| 技能 | 描述 |
|-------|-------------|
| `SKILL.md` | 尋找 GitHub 儲存庫的哪些相依項目可以透過 GitHub Sponsors 進行贊助。使用 deps.dev API 跨 npm、PyPI、Cargo、Go、RubyGems、Maven 與 NuGet 進行相依項目解析。檢查 npm 資助中繼資料 (funding metadata)、FUNDING.yml 檔案與網頁搜尋。驗證每個連結。顯示具有 OSSF Scorecard 健康資料的直接與過渡相依項目。透過提供 GitHub 擁有者/儲存庫來呼叫 (例如 "find sponsorable dependencies in expressjs/express")。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
