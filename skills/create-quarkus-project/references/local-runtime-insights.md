# 本機執行階段深入解析 (選用)

[BootUI](https://github.com/jdubois/boot-ui) ([文件](https://www.julien-dubois.com/boot-ui/)) 是一個僅供本機使用的開發人員主控台，也是適用於 Spring Boot 和 Quarkus 應用程式的選擇性加入 (opt-in) MCP 伺服器，對於在開發期間檢查執行中的應用程式非常有用。

Agent 規則：

- 在新增相依性或技能之前，務必徵詢使用者同意。
- 僅供本機開發新增 (dev 設定檔 / 僅限 dev 的相依性範圍)；切勿在生產環境中發佈或公開它。
- 遵循專案文件以取得確切的相依性座標與組態。

安裝其 Agent 技能 (在取得同意後)：

```bash
gh skill install jdubois/boot-ui skills/bootui
```
