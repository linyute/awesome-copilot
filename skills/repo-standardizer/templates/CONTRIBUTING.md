# 貢獻指南

感謝您有意願為本專案做出貢獻！請撥冗閱讀本指南，讓您的貢獻過程順利進行。

## 開始參與

1. Fork 本存放庫。
2. 建立功能分支：`git checkout -b feat/your-feature`。
3. 進行變更並附帶清晰的訊息完成 Commit。
4. Push 分支並向預設分支（多數存放庫為 `main`）發起 Pull Request。

## Pull Request 檢查清單

- [ ] PR 說明解釋了「做了什麼」以及「為什麼這麼做」。
- [ ] 本機測試通過（`npm test` / `pytest` / `go test` ...）。
- [ ] 新增的行為皆有測試覆蓋。
- [ ] 若使用者可見行為有所變更，已同步更新文件。

## Issue 慣例

- 請使用 Issue 表單：錯誤回報、功能請求、諮詢問題。
- 為您的 Issue 加上對應的 `bug` / `enhancement` / `P0`–`P3` 標籤。

## Commit 風格

使用**附帶 scope** 的慣例提交（Conventional Commits）：`type(scope): description`

```
feat(labels): add tier labels
fix(ci): correct release workflow
```

常見類型：`feat` `fix` `docs` `chore` `refactor` `test` `ci` `perf`。
Scope = 您觸及的範圍（模組、檔案、子系統）。

範例：

```
feat(labels): add tier labels
fix(ci): correct release workflow
fix(docx): update README.md
docs(readme): explain installation
chore(ci): bump action version
```

## 程式碼風格

請與專案現有風格保持一致（已包含 Linter 設定檔）。
如有疑慮，請在 Push 前執行 Linter。

## 有任何疑問？

歡迎開啟討論或在 `question` Issue 中發問。我們很樂意提供協助！
