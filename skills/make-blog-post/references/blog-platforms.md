# 部落格平台 (Blog Platforms)

當目的地為部落格或網站存放庫時，請使用此參考資料。在寫入任何內容之前，請先確認靜態網站產生器。每一種產生器都有自有的文章資料夾、檔案命名規則與 front matter 約定，無視這些約定的文章將導致建構失敗或永遠無法顯示。

## 偵測產生器

僅在目前工作區中尋找。

**預設文章資料夾**欄位記錄的是各產生器的慣例，而非絕對保證。此處列出的每個專案都可以搬移該資料夾，且有些專案是在程式碼中宣告而非在設定檔中宣告。請將該欄位視為優先尋找的位置，並以專案自身的設定為準。

兩種產生器可能會共用相同的設定檔名稱：`_config.yml` 同時屬於 Jekyll 與 Hexo，而 `config.toml` 則同時屬於 Hugo 與 Zola。單憑該檔案名稱無法識別產生器。僅在該列的其他特徵標記亦同時存在時才判定網站類型。當標記指向多個產生器時，詢問是由哪一個建構網站。

| 平台 | 偵測依據 | 預設文章資料夾 | 必須遵守的約定 |
| --- | --- | --- | --- |
| Jekyll | `_config.yml`，且 `Gemfile` 中有 `jekyll` 或 `github-pages` 確認，或當 `package.json` 未列出 `hexo` 時存在 `_posts/` 資料夾 | `_posts/` | 檔案名稱必須遵循 `YYYY-MM-DD-slug.<markup-extension>`（例如 `.md` 或 `.markdown`）。使用與網站現有文章相符的 YAML front matter。`_config.yml` 中的 `source` 或 `collections_dir` 設定可搬移此資料夾。 |
| Hugo | `hugo.toml`、`hugo.yaml`、`hugo.json` 或 `config/_default/` 目錄。單純的 `config.toml` 僅在具有 `baseURL` 鍵（大小寫不限）或旁邊有 `archetypes/` 資料夾時才計入 | `content/posts/` | 符合佈景主題的 TOML 或 YAML front matter。`draft: true` 可將其排除在建構之外。`contentDir` 可搬移內容根目錄。section 為其下方存放現有文章的最頂層資料夾。在網站設定中設定了 `params.mainSections` 時以此為準，若未設定，Hugo 會將擁有最多頁面的 section 視為主 section。 |
| Astro | `astro.config.*` | 內容集合（content collection）所宣告的任何位置，通常為 `src/content/blog/` | 閱讀集合設定：Astro 5 為 `src/content.config.*`，Astro 4 為 `src/content/config.*`。集合的 `loader` 決定目錄，因此 `glob({ base: './src/data/blog' })` 會將文章放在該處而非 `src/content/` 下。Front matter 必須符合該集合的 `schema`，遺漏必要欄位會導致建構失敗。 |
| Eleventy | `.eleventy.js`, `eleventy.config.*` | `posts/`，或設定檔中所命名的資料夾 | Front matter 加上目錄資料檔案。`tags` 值會將文章新增至集合中，這通常是 feed 與索引所讀取的內容。 |
| Next.js | 包含 MDX 或內容管線的 `next.config.*` | `content/`、`posts/`、`app/blog/` 或管線讀取的任何位置 | MDX 規則適用：元件必須匯入或提供，散文中的原始 `<` 或 `{` 會破壞語法解析。 |
| Gatsby | `gatsby-config.*` | `content/blog/` | Front matter 欄位必須存在於範本所查詢的 GraphQL schema 中。提供給 `gatsby-source-filesystem` 的 `path` 為實際來源資料夾。 |
| Docusaurus | `docusaurus.config.*` | `blog/` | 日期來自檔案名稱前綴或 `date` 欄位。在 `.md` 中以 `<!-- truncate -->` 標記摘要結束位置，在 `.mdx` 中以 `{/* truncate */}` 標記。部落格外掛程式的 `path` 選項可搬移資料夾。 |
| Hexo | `_config.yml` 加上 `package.json` 中的 `hexo` | `source/_posts/` | YAML front matter。`<!-- more -->` 標記摘要分界。`_config.yml` 中的 `source_dir` 可搬移原始碼根目錄。 |
| Zola | 帶有 `base_url` 鍵的 `config.toml`（Hugo 不使用此拼法） | `content/` | 以 `+++` 包裹的 TOML front matter，而非 `---`。文章屬於某個 section，即 `content/` 下帶有自身 `_index.md` 的子資料夾。 |
| VitePress | `.vitepress/` | 佈景主題所設定的資料夾 | Front matter 加上列出文章的索引頁面。 |

僅在應用程式存放庫子資料夾中找到的網站（例如專案網站）屬於該專案，不一定是作者的個人部落格。請在計畫檢查時主動提議，而非直接假設。

## 適用於所有產生器的規則

- **依基底名稱而非單一副檔名比對設定檔。** 每個以 `.*` 撰寫的項目代表一個家族，專案可能會將其拼為 `.js`、`.mjs`、`.cjs`、`.ts`、`.mts` 或 `.cts`。在判定缺乏產生器之前先對基底名稱進行 glob 比對，因為僅偵測一種副檔名拼法會將真正的部落格誤判為一般存放庫。
- **專案的設定優先於此表格。** 在選擇路徑之前先開啟產生器的設定檔。當專案在程式碼中宣告其內容時（Astro 的 `loader`、Eleventy 的目錄設定、Gatsby 的檔案系統來源、Docusaurus 的外掛程式 `path`），該宣告即為目的地。它定位了文章位置，且不定義其欄位。
- **透過設定解析不完整的名稱。** 「放在部落格中」確定了由哪個專案接收文章，但保留了資料夾的開放性。從產生器的設定中確定資料夾，接著在計畫檢查時重述完整路徑。
- **先閱讀相鄰檔案。** 開啟已解析資料夾中的現有文章，並完全複製其欄位集合。實際運作中的文章比此處的任何通用規則更為可靠，且在由同一位作者撰寫時亦可作為語音樣本。
- **寫入前先解決分歧。** 當設定與現有文章指向不同資料夾時，詢問哪一個是目前使用中的。當設定命名的資料夾尚未包含任何文章時，以設定為準。
- **符合 schema 即可停止。** Schema 是驗證或讀取 front matter 的機制，即使與路徑宣告並列，它與路徑宣告仍屬兩回事：Astro 集合的 `schema`、Gatsby 範本查詢的 GraphQL 欄位，或 Docusaurus 部落格外掛程式讀取的欄位。當網站未宣告 schema 時，相鄰文章的欄位集合即為 schema。符合它即可，請勿捏造網站未讀取的 front matter 欄位。
- **依要求建立草稿。** 核准即為關卡，因此寫入的文章應處於可隨時發布的狀態。當使用者要求草稿時，使用平台自身的機制：Hugo 的 `draft: true`、Jekyll 的 `published: false` 或其 `_drafts` 資料夾，或是網站 schema 宣告的旗標。請勿新增平台會忽略的旗標。
- **遵守檔案命名規則。** 日期前綴名稱在某些平台上是必要的，在其他平台上則是不正確的。
- **重複使用網站的分類體系。** 從網站已使用的標籤與分類中選取標籤與分類。
- **遵循存放庫的換行符號。** 符合其 `.gitattributes` 或其現有文章。

當使用者將文章傳送至文件集時亦適用相同的規則：符合相鄰文件的 front matter 與命名方式，切勿僅為了容納它而建立新的文件區域。
