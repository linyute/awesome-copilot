---
name: 'gh-attach'
description: '將本機檔案（螢幕截圖、圖片、PDF、zip、影片）上傳到 GitHub user-attachments，下載 GitHub user-attachments，並在 PR、議題或評論中嵌入本機檔案。適用於「在 PR 中附加螢幕截圖」、「在議題中新增圖片」、「嵌入修改前/修改後螢幕截圖」、「附加此檔案」或「下載此 GitHub 附件」等要求。由 `gh-attach` 提供支援。'
---

# gh-attach

`gh attach` 將檔案上傳到 GitHub 的內部 user-attachments 端點（不存在公用 API）並印出 URL，無論貼在哪裡，GitHub 都會自動呈現（圖片/影片/檔案）。該 URL 會繼承存放庫的可見性，因此私人存放庫的上傳內容仍保持私密。

## 先決條件

```sh
gh extension list | grep -q 'gh attach' || gh extension install sudosubin/gh-attach
```

上傳使用 GitHub 瀏覽器工作階段 Cookie，而不是 `gh` 權杖。預設情況下，`gh` 必須通過驗證，以便 `gh-attach` 可以選取匹配的瀏覽器帳戶。如果選取了錯誤的帳戶，請新增 `--browser <name> --profile <name>`。對於無周邊 (headless) 環境使用，請將 `GH_ATTACH_SESSION_TOKEN` 設定為純 `user_session` Cookie 值。請將其視為完整的帳戶認證。

## 步驟

**1. 上傳**：使用加上引號的絕對路徑。在存放庫內部 `-R` 是可選的。對於 GHES，使用 `-R host/owner/repo`。該指令在一行中印出 URL。GitHub 會自動呈現它（圖片/影片/檔案），因此請照原樣使用：

```sh
URL=$(gh attach "$FILE" -R <owner>/<repo>)
```

**2. 嵌入**（一律使用 `--body-file -`，例如 `gh pr comment/edit`、`gh issue comment/edit`）：

```sh
printf '## Screenshots\n\n%s\n' "$URL" | gh pr comment <pr> -R <owner>/<repo> --body-file -
```

**3. 下載**：明確指定目的地。私人附件使用作用中的 `gh` 權杖，並以瀏覽器 Cookie 作為授權備用方案：

```sh
gh attach download "$URL" -O "$FILE"
```

## 注意事項

- 私人存放庫：URL 僅對獲授權的檢視者呈現。匿名擷取預期會傳回 404 或 403。
- 尺寸調整：嵌入 `<img width="800" src="$URL">` 而非純 URL。
- GitHub Cloud 和 GHES 決定它們接受哪些副檔名和內容類型。
