# 真實世界的 CodeTour 範例

當您想查看真實儲存庫如何使用 CodeTour 功能時，請參考此檔案。
每個範例都源自公開的 GitHub 儲存庫，並附有指向 `.tour` 檔案的直接連結。

---

## microsoft/codetour — 貢獻者導覽

**導覽檔案：** https://github.com/microsoft/codetour/blob/main/.tours/intro.tour
**角色：** 新貢獻者
**步驟：** ~5 · **深度：** 標準

**優點：**
- 包含嵌入式 SVG 架構圖的簡介步驟（說明中使用原始 GitHub URL）
- 每一步都包含豐富的 Markdown，並帶有表情符號章節標題（`### 🎥 導覽播放器`）
- 說明中包含行內跨檔案連結：`[Gutter decorator](./src/player/decorator.ts)`
- 使用頂層的 `description` 欄位作為導覽本身的副標題

**值得複製的技巧：** 在說明中嵌入圖片和跨連結，使其內容完整自足。

```json
{
  "file": "src/player/index.ts",
  "line": 436,
  "description": "### 🎥 導覽播放器\n\nCodeTour 播放器 ...\n\n![架構](https://raw.githubusercontent.com/.../overview.svg)\n\n另請參閱：[Gutter decorator](./src/player/decorator.ts)"
}
```

---

## a11yproject/a11yproject.com — 新貢獻者上路

**導覽檔案：** https://github.com/a11yproject/a11yproject.com/blob/main/.tours/code-tour.tour
**角色：** 外部貢獻者
**步驟：** 26 · **深度：** 深

**優點：**
- 幾乎完全由 `directory` 步驟組成 — 引導至每個 `src/` 子目錄，而不會迷失在檔案中
- 全篇採用對話式、對初學者友善的語氣
- 在開場步驟中使用 `selection` 來強調 `package.json` 中的確切項目
- 以真誠的感謝和行動呼籲作結

**值得複製的技巧：** 使用目錄步驟作為上路導覽的骨幹 — 它們能在不需要作者解釋每個檔案的情況下教導結構。

```json
{
  "directory": "src/_data",
  "description": "此資料夾包含網站的 **資料檔案**。將它們視為輕量級資料庫 — 驅動資源清單、文章索引和導航的 YAML 檔案。"
}
```

---

## github/codespaces-codeql — 技術上最完整的範例

**導覽檔案：** https://github.com/github/codespaces-codeql/blob/main/.tours/codeql-tutorial.tour
**角色：** 安全工程師 / 概念學習者
**步驟：** 12 · **深度：** 標準

**優點：**
- `isPrimary: true` — 在 Codespace 開啟時自動啟動
- `commands` 陣列可在導覽途中執行真實的 VS Code 指令：當讀者到達該步驟時，導覽會直接執行 `codeQL.runQuery`
- `view` 屬性可用於切換側邊欄面板（`"view": "codeQLDatabases"`）
- 使用 `pattern` 代替 `line` 進行彈性匹配：`"pattern": "import tutorial.*"`
- `selection` 用於強調查詢檔案中的確切 `select` 子句

**這是 `commands`、`view` 和 `pattern` 的權威參考範例。**

```json
{
  "file": "tutorial.ql",
  "pattern": "import tutorial.*",
  "view": "codeQLDatabases",
  "commands": ["codeQL.setDefaultTourDatabase", "codeQL.runQuery"],
  "title": "執行您的第一個查詢",
  "description": "點擊上方的 **▶ Run** 按鈕。結果將顯示在 CodeQL Query Results 面板中。"
}
```

---

## github/codespaces-learn-with-me — 極簡互動式教學

**導覽檔案：** https://github.com/github/codespaces-learn-with-me/blob/main/.tours/main.tour
**角色：** 完全初學者
**步驟：** 4 · **深度：** 快速

**優點：**
- 僅有 4 個步驟 — 證明對於快速/直覺型編碼（vibecoder）角色來說，少即是多
- `isPrimary: true` 用於自動啟動
- 每個步驟都告訴讀者要 **做點什麼**（編輯字串、更改顏色）— 而不僅僅是閱讀
- 以具體的成果結尾：「您的頁面已上線」

**值得複製的技巧：** 對於快速/直覺型的導覽，請果斷刪減。四個能推動行動的步驟勝過十二個解釋一切的步驟。

---

## blackgirlbytes/copilot-todo-list — 28 步互動式教學

**導覽檔案：** https://github.com/blackgirlbytes/copilot-todo-list/blob/main/.tours/main.tour
**角色：** 概念學習者 / 動手做教學
**步驟：** 28 · **深度：** 深

**優點：**
- 使用 **僅限內容的檢查點步驟**（無 `file` 鍵）作為進度里程碑：在編碼任務之間加入「查看您的頁面！🎉」和「試試看！」
- 說明中包含終端機行內指令：`>> npm install uuid; npm install styled-components`
- 每個檔案步驟都以 Markdown 程式碼區塊顯示使用者應接受的確切程式碼，讓他們知道預期輸出

**值得複製的技巧：** 檢查點步驟（僅限內容、里程碑標題）能打斷冗長的導覽，並讓讀者有進展感。

```json
{
  "title": "查看您的頁面！🎉",
  "description": "開啟 **Simple Browser** 索引標籤以查看您的待辦事項清單。您應該會看到從資料陣列中渲染出的所有三個任務。\n\n一旦您對此感到滿意，請繼續增加互動功能。"
}
```

---

## lucasjellema/cloudnative-on-oci-2021 — 多重導覽架構系列

**導覽檔案：**
- https://github.com/lucasjellema/cloudnative-on-oci-2021/blob/main/.tours/function-tweet-retriever.tour
- https://github.com/lucasjellema/cloudnative-on-oci-2021/blob/main/.tours/oci-and-infrastructure-as-code.tour
- https://github.com/lucasjellema/cloudnative-on-oci-2021/blob/main/.tours/build-and-deployment-pipeline-function-tweet-retriever.tour

**角色：** 平台工程師 / 架構師
**步驟：** 每導覽 12 步 · **深度：** 標準

**優點：**
- 三個針對不同關注點（函式程式碼、IaC、CI/CD 管道）的獨立導覽 — 每個都獨立但透過 `nextTour` 連結
- 在 Terraform 檔案中大量使用 `selection` 座標，其中重點是一個區塊（而非單行）
- 步驟中包含指向官方 OCI 文件的行內 Markdown 連結
- 設計為可透過 `vscode.dev/github.com/...` 瀏覽，無需複製

**值得複製的技巧：** 對於複雜系統，請為每一層編寫一個導覽，並使用 `nextTour` 將它們串聯起來。不要嘗試在單個導覽中涵蓋基礎設施 + 應用程式程式碼 + CI/CD。

---

## SeleniumHQ/selenium — Monorepo 建構系統上路

**導覽檔案：**
- `.tours/bazel.tour` — Bazel 工作區與建構目標導覽
- `.tours/building-and-testing-the-python-bindings.tour` — Python 繫結 BUILD.bazel 逐步解說

**角色：** 外部貢獻者（建構系統焦點）
**步驟：** 每導覽 ~10 步

**優點：**
- 針對一個非顯而易見的切入點 — 不是產品程式碼，而是建構系統
- 證明了「貢獻者上路」導覽不一定要從 `main()` 開始 — 它們可以從這個特定儲存庫中任何令人困惑的地方開始
- 用於大型、成熟的開源軟體（OSS）專案

---

## 技巧快速參考

| 功能 | 何時使用 | 真實範例 |
|---------|-------------|-------------|
| `isPrimary: true` | 當儲存庫開啟時（Codespace、vscode.dev）自動啟動導覽 | codespaces-learn-with-me、codespaces-codeql |
| `commands: [...]` | 當讀者到達此步驟時，執行 VS Code 指令 | codespaces-codeql (`codeQL.runQuery`) |
| `view: "terminal"` | 在此步驟切換 VS Code 側邊欄/面板 | codespaces-codeql (`codeQLDatabases`) |
| `pattern: "regex"` | 按行內容而非行號進行匹配 — 用於變動頻繁的檔案 | codespaces-codeql |
| `selection: {start, end}` | 強調一個區塊（函式主體、配置區塊、類型定義） | a11yproject、oci-2021、codespaces-codeql |
| `directory: "path/"` | 在不閱讀每個檔案的情況下引導至資料夾 | a11yproject、codespaces-codeql |
| `uri: "https://..."` | 連結至 PR、Issue、RFC、ADR、外部文件 | 任何 PR 審查導覽 |
| `nextTour: "Title"` | 將導覽串聯成系列 | oci-2021 (三部分系列) |
| 檢查點步驟（僅限內容） | 冗長互動式導覽中的進度里程碑 | copilot-todo-list |
| 說明中的 `>> 指令` | VS Code 中的終端機行內指令連結 | copilot-todo-list |
| 說明中嵌入圖片 | 架構圖、螢幕截圖 | microsoft/codetour |

---

## 在 GitHub 上探索更多真實導覽

**在 GitHub 上搜尋所有 `.tour` 檔案：**
https://github.com/search?q=path%3A**%2F*.tour+&type=code

此搜尋會傳回提交到公開 GitHub 儲存庫的每個 `.tour` 檔案。您可以用它來：
- 尋找與您正在處理的專案使用相同語言/框架的儲存庫導覽
- 研究其他作者如何處理相同的角色或步驟類型
- 查找特定欄位（如 `commands`、`selection`、`pattern`）在實際環境中的用法

透過語言或關鍵字篩選以縮小結果範圍 — 例如，在查詢中加入 `language:TypeScript` 或 `fastapi`。

---

## 延伸閱讀

- **DEV Community — "Onboard your codebase with CodeTour"**: https://dev.to/tobiastimm/onboard-your-codebase-with-codetour-2jc8
- **Coder 部落格 — "Onboard to new projects faster with CodeTour"**: https://coder.com/blog/onboard-to-new-projects-faster-with-codetour
- **Microsoft Tech Community — Educator Developer 部落格**: https://techcommunity.microsoft.com/blog/educatordeveloperblog/codetour-vscode-extension-allows-you-to-produce-interactive-guides-assessments-a/1274297
- **AMIS 技術部落格 — vscode.dev + CodeTour**: https://technology.amis.nl/software-development/visual-studio-code-the-code-tours-extension-for-in-context-and-interactive-readme/
- **CodeTour GitHub 主題**: https://github.com/topics/codetour
