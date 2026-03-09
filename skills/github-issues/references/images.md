# 議題 (Issues) 與評論中的圖片

如何透過 CLI 以程式化方式在 GitHub 議題本文與評論中嵌入圖片。

## 方法 (依可靠程度排序)

### 1. GitHub Contents API (推薦用於私有儲存庫)

將圖片檔案推送至同一個儲存庫的分支，然後使用可供已通過驗證檢視者使用的 URL 來參考它們。

**步驟 1：建立分支**

```bash
# 取得預設分支的 SHA
SHA=$(gh api repos/{owner}/{repo}/git/ref/heads/main --jq '.object.sha')

# 建立新分支
gh api repos/{owner}/{repo}/git/refs -X POST \
  -f ref="refs/heads/{username}/images" \
  -f sha="$SHA"
```

**步驟 2：透過 Contents API 上傳圖片**

```bash
# 對圖片進行 Base64 編碼並上傳
BASE64=$(base64 -i /path/to/image.png)

gh api repos/{owner}/{repo}/contents/docs/images/my-image.png \
  -X PUT \
  -f message="新增圖片" \
  -f content="$BASE64" \
  -f branch="{username}/images" \
  --jq '.content.path'
```

為每張圖片重複此步驟。Contents API 會為每個檔案建立一個提交 (Commit)。

**步驟 3：在 Markdown 中參考**

```markdown
![說明](https://github.com/{owner}/{repo}/raw/{username}/images/docs/images/my-image.png)
```

> **重要：** 請使用 `github.com/{owner}/{repo}/raw/{branch}/{path}` 格式，**而非** `raw.githubusercontent.com`。對於私有儲存庫，`raw.githubusercontent.com` 的 URL 會傳回 404 錯誤。`github.com/.../raw/...` 格式之所以有效，是因為當檢視者已登入且具有儲存庫存取權限時，瀏覽器會傳送驗證 Cookie。

**優點：** 適用於檢視者具有存取權限的任何儲存庫、圖片存放在版本控制中、不會過期。
**缺點：** 會產生提交記錄、檢視者必須通過驗證、圖片在電子郵件通知中或對於沒有儲存庫存取權限的使用者將無法顯示。

### 2. Gist 代管 (僅限公開圖片)

將圖片作為檔案上傳至 Gist。僅適用於您願意公開的圖片。

```bash
# 建立一個包含佔位檔案的 Gist
gh gist create --public -f description.md <<< "圖片代管 Gist"

# 注意：gh gist edit 不支援二進位檔案。
# 您必須使用 API 將二進位內容加入 Gist。
```

> **限制：** Gist 不支援透過 CLI 上傳二進位檔案。您需要進行 Base64 編碼並以文字形式儲存，但這將無法顯示為圖片。不建議使用此方法。

### 3. 瀏覽器上傳 (最可靠的顯示方式)

取得永久圖片 URL 最可靠的方法是透過 GitHub 網頁 UI：

1. 在瀏覽器中開啟議題/評論。
2. 將圖片拖放或貼上至評論編輯器中。
3. GitHub 會產生一個永久的 `https://github.com/user-attachments/assets/{UUID}` URL。
4. 這些 URL 對任何人皆有效 (即使沒有儲存庫存取權限)，且能在電子郵件通知中顯示。

> **為何 API 無法做到這一點：** GitHub 的 `upload/policies/assets` 端點需要瀏覽器工作階段 (CSRF 權杖 + Cookie)。使用 API 權杖呼叫時，它會傳回 HTML 錯誤頁面。目前沒有用於產生 `user-attachments` URL 的公開 API。

## 以程式化方式擷取螢幕截圖

使用 `puppeteer-core` 搭配本地 Chrome 擷取 HTML 模型的螢幕截圖：

```javascript
const puppeteer = require('puppeteer-core');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  defaultViewport: { width: 900, height: 600, deviceScaleFactor: 2 }
});

const page = await browser.newPage();
await page.setContent(htmlString);

// 擷取特定元素的螢幕截圖
const elements = await page.$$('.section');
for (let i = 0; i < elements.length; i++) {
  await elements[i].screenshot({ path: `mockup-${i + 1}.png` });
}

await browser.close();
```

> **注意：** 由於網路隔離，MCP Playwright 可能無法連線至 localhost。請改用本地安裝的 Chrome 搭配 `puppeteer-core`。

## 快速參考

| 方法 | 私有儲存庫 | 永久性 | 無須驗證 | 僅限 API |
|--------|:---:|:---:|:---:|:---:|
| Contents API + `github.com/raw/` | ✅ | ✅ | ❌ | ✅ |
| 瀏覽器拖放 (`user-attachments`) | ✅ | ✅ | ✅ | ❌ |
| `raw.githubusercontent.com` | ❌ (404) | ✅ | ❌ | ✅ |
| Gist | 僅限公開 | ✅ | ✅ | ❌ (無二進位) |

## 常見陷阱

- **對於私有儲存庫，`raw.githubusercontent.com` 會傳回 404**，即使 URL 中包含有效的權杖也是如此。GitHub 的 CDN 不會傳遞授權標頭。
- **API 下載 URL 是暫時性的。** `gh api repos/.../contents/...` 傳回的帶有 `download_url` 的 URL 包含會過期的權杖。
- **`upload/policies/assets` 需要瀏覽器工作階段。** 請勿嘗試從 CLI 呼叫此端點。
- **大型檔案的 Base64 編碼** 可能會達到 API 裝載限制。Contents API 有約 100MB 的檔案大小限制，但對於 Base64 編碼的裝載，實際限制更低。
- **電子郵件通知** 不會顯示需要驗證的圖片。如果電子郵件的可讀性很重要，請使用瀏覽器上傳方法。
