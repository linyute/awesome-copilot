# 約定式提交 — 快速參考指南 (Conventional Commits — Quick Reference Guide)

完整規範：https://www.conventionalcommits.org/en/v1.0.0/

---

## 格式 (Format)

```
<類型>(<範圍>): <描述>

[選填正文]

[選填頁尾]
```

---

## 類型範例 (Type Examples)

### `feat` — 新功能
```
feat(payments): add Apple Pay support for checkout flow

Users in supported regions can now complete purchases using Apple Pay.
This reduces checkout friction and is expected to improve mobile conversion rates.

Closes #88
```

### `fix` — 錯誤修復
```
fix(api): correct off-by-one error in pagination offset

The results page was skipping the last item on every page because the
offset calculation used `>` instead of `>=`. Users were missing records
silently with no error.

Fixes #201
```

### `refactor` — 程式碼重構（行為不變）
```
refactor(user-service): extract email validation into shared utility

Email validation logic was duplicated across 4 modules. Extracted into
`utils/validators.ts` so future changes only need to happen in one place.
```

### `perf` — 效能改進
```
perf(dashboard): lazy-load chart components to reduce initial bundle size

The dashboard was importing all chart types upfront, adding ~180KB to the
initial load. Charts are now loaded on demand, cutting initial load time
by ~40% on slow connections.
```

### `docs` — 僅限文件
```
docs(readme): add local development setup instructions

New contributors were struggling to get the dev environment running.
Added step-by-step instructions covering Node version, env vars, and
the database seed command.
```

### `test` — 新增或更新測試
```
test(auth): add coverage for concurrent login edge cases

The login flow had no tests for simultaneous requests from the same
session. Added tests that verify only one session token is issued
when multiple requests arrive in the same tick.
```

### `chore` — 維護 / 設定
```
chore(deps): upgrade eslint from v8 to v9

v8 reached end-of-life. Migrated config to flat config format required
by v9. No rule changes — this is a tooling-only update.
```

### `ci` — CI/CD 管線
```
ci: add caching for node_modules in GitHub Actions

Cold CI runs were taking 4+ minutes due to repeated installs.
Adding cache restore on lockfile hash reduces this to ~90 seconds.
```

### `revert` — 還原提交
```
revert: feat(notifications): add push notification opt-in

Reverts commit a3f92bc.

The push notification feature caused a crash on Android 12 devices.
Rolling back until the root cause is identified.
```

---

## 範圍指南 (Scope Guidelines)

`範圍 (scope)` 是選填的，但強烈建議使用。它應當是：
- 識別程式碼庫區域的簡短名詞：`auth`, `api`, `dashboard`, `payments`。
- 在整個專案中保持一致（不要混用 `user` 與 `users`）。
- 若變更確實是全域性的，則省略。

---

## 破壞性變更 (Breaking Changes)

在頁尾加入 `BREAKING CHANGE:`（或在類型後使用 `!`）：

```
feat(api)!: remove v1 endpoints

All v1 REST endpoints have been removed following the 6-month deprecation
notice. Consumers must migrate to v2 before upgrading.

BREAKING CHANGE: /api/v1/* routes no longer exist. See migration guide at docs/v2-migration.md
```

---

## 正文編寫提示 (Body Writing Tips)

撰寫正文前請先自問：
- **在此變更之前，有哪些部分損壞或缺失？**
- **為何選擇此方案而非替代方案？**
- **對於使用者或開發者而言，變更後會有何不同？**

避免：
- 重述 diff 已經顯示的內容（例如：「變更了變數名稱」）。
- 模糊的語言（例如：「各種改進」、「雜項修復」）。
- 未來時態（例如：「這將修復...」）— 請使用現在/過去時態。

---

## 提交訊息反面模式 (Commit Message Anti-Patterns)

| ❌ 錯誤做法 | ✅ 較好做法 |
|--------|----------|
| `fix bug` | `fix(cart): prevent duplicate items on rapid add-to-cart clicks` |
| `updates` | `feat(profile): allow users to update display name` |
| `WIP` | 不要提交 WIP — 請使用 stash |
| `misc changes` | 拆分為獨立且具意義的提交 |
| `John's changes` | 描述變更了什麼，而非誰變更了它 |
