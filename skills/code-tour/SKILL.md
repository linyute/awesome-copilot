---
name: 'code-tour'
description: '使用此技能建立 CodeTour .tour 檔案 — 以人設為目標、循序漸進的逐步導覽，連結到實際的檔案和行號。觸發條件為：「建立導覽」、「製作程式碼導覽」、「產生導覽」、「入職導覽」、「此 PR 的導覽」、「此錯誤的導覽」、「RCA 導覽」、「架構導覽」、「說明 X 如何運作」、「氛圍檢查」、「PR 審查導覽」、「貢獻者指南」、「協助某人快速上手」，或任何對程式碼進行結構化逐步導覽的要求。支援 20 種開發者人設（新進人員、錯誤修復者、架構師、PR 審查者、氛圍編碼者、安全性審查者等）、所有 CodeTour 步驟類型（檔案/行號、選取範圍、模式、URI、指令、檢視）以及導覽層級的欄位（ref、isPrimary、nextTour）。適用於任何語言的任何儲存庫。'
---

# Code Tour 技能

您正在建立一個 **CodeTour** — 一個針對特定人設、循序漸進的程式碼庫逐步導覽，直接連結到檔案和行號。CodeTour 檔案儲存在 `.tours/` 中，並可與 [VS Code CodeTour 擴充功能](https://github.com/microsoft/codetour) 配合使用。

`scripts/` 中隨附了兩個指令碼：

- **`scripts/validate_tour.py`** — 在編寫任何導覽後執行。檢查 JSON 有效性、檔案/目錄是否存在、行號是否在範圍內、模式比對、nextTour 交叉引用以及敘事弧。執行方式：`python ~/.agents/skills/code-tour/scripts/validate_tour.py .tours/<name>.tour --repo-root .`
- **`scripts/generate_from_docs.py`** — 當使用者要求從 README/文件產生時，先執行此指令碼以擷取骨架，然後再填寫內容。執行方式：`python ~/.agents/skills/code-tour/scripts/generate_from_docs.py --persona new-joiner --output .tours/skeleton.tour`

隨附了兩個參考檔案：

- **`references/codetour-schema.json`** — 權威的 JSON 結構定義 (Schema)。閱讀它以驗證任何欄位名稱或類型。您使用的每個欄位都必須符合它。
- **`references/examples.md`** — 來自生產儲存庫的 8 個真實 CodeTour 導覽，附有註解技術。當您想查看特定功能（`commands`、`selection`、`view`、`pattern`、`isPrimary`、多導覽系列）在實踐中如何使用時，請閱讀此檔案。

### GitHub 上的真實 `.tour` 檔案

這些是經確認的生產環境 `.tour` 檔案。當您需要特定步驟類型、導覽層級欄位或敘事結構的實用範例時，請獲取其中一個 — 不要憑記憶編寫，因為真實的範例就在眼前。

透過 GitHub 程式碼搜尋尋找更多：https://github.com/search?q=path%3A**%2F*.tour+&type=code

#### 依示範的步驟類型 / 技術分類

| 學習內容 | 檔案 URL |
|---|---|
| `directory` + `file+line` (貢獻者入職) | https://github.com/coder/code-server/blob/main/.tours/contributing.tour |
| `selection` + `file+line` + 簡介內容步驟 (無障礙專案) | https://github.com/a11yproject/a11yproject.com/blob/main/.tours/code-tour.tour |
| 迷你教學 — 緊湊的 `file+line` 敘述，用於互動式學習 | https://github.com/lostintangent/rock-paper-scissors/blob/master/main.tour |
| 具備 `nextTour` 鏈結的多導覽儲存庫 (雲端原生 OCI 逐步導覽) | https://github.com/lucasjellema/cloudnative-on-oci-2021/blob/main/.tours/introduction.tour |
| `isPrimary: true` (標記為入職進入點) | https://github.com/nickvdyck/webbundlr/blob/main/.tours/getting-started.tour |
| 使用 `pattern` 取代 `line` (以正規表達式錨定的步驟) | https://github.com/nickvdyck/webbundlr/blob/main/.tours/architecture.tour |

**原始內容提示：** 加入前綴 `raw.githubusercontent.com` 並移除 `/blob/` 以存取原始 JSON。

一個優質的導覽不僅僅是加了註解的檔案。它是一個**敘事** — 向特定的人講述什麼是重要的、為什麼重要，以及下一步該做什麼。您的目標是編寫一個導覽，讓合適的人在第一次開啟此儲存庫時，會希望它確實存在。

**關鍵：僅建立 `.tour` JSON 檔案。切勿建立、修改或建構任何其他檔案。**

---

## 步驟 1：探索儲存庫

在詢問使用者任何問題之前，先探索程式碼庫：

- 列出根目錄，閱讀 README，並檢查關鍵的設定檔案
  (package.json, pyproject.toml, go.mod, Cargo.toml, composer.json 等)
- 辨識程式語言、框架以及專案的用途
- 繪製 1–2 層深的資料夾結構圖
- 尋找進入點：主檔案、索引檔案、應用程式啟動程式碼
- **注意哪些檔案實際存在** — 您在導覽中編寫的每個路徑都必須是真實存在的

如果儲存庫內容稀少或為空，請說明並根據現有的內容進行。

**如果使用者說「從 README 產生」或「使用文件」：** 請先執行骨架產生器，然後透過閱讀實際檔案來填寫每個 `[TODO: ...]`：

```bash
python skills/code-tour/scripts/generate_from_docs.py \
  --persona new-joiner \
  --output .tours/skeleton.tour
```

### 依語言/框架分類的進入點

不要閱讀所有內容 — 從這裡開始，然後跟隨匯入路徑。

| 技術堆疊 | 優先閱讀的進入點 |
|-------|---------------------------|
| **Node.js / TS** | `index.js/ts`, `server.js`, `app.js`, `src/main.ts`, `package.json` (scripts) |
| **Python** | `main.py`, `app.py`, `__main__.py`, `manage.py` (Django), `app/__init__.py` (Flask/FastAPI) |
| **Go** | `main.go`, `cmd/<name>/main.go`, `internal/` |
| **Rust** | `src/main.rs`, `src/lib.rs`, `Cargo.toml` |
| **Java / Kotlin** | `*Application.java`, `src/main/java/.../Main.java`, `build.gradle` |
| **Ruby** | `config/application.rb`, `config/routes.rb`, `app/controllers/application_controller.rb` |
| **PHP** | `index.php`, `public/index.php`, `bootstrap/app.php` (Laravel) |

### 儲存庫類型變體 — 相應調整重點

同樣的人設會根據儲存庫類型的不同而有不同的要求：

| 儲存庫類型 | 強調重點 | 典型的錨定檔案 |
|-----------|-------------------|----------------------|
| **服務 / API** | 請求生命週期、認證、錯誤合約 | 路由器 (router)、中介軟體 (middleware)、處理常式 (handler)、結構定義 (schema) |
| **函式庫 / SDK** | 公用 API 表面、擴充點、版本控制 | index/exports, 類型, 變更日誌 (changelog) |
| **CLI 工具** | 指令解析、設定載入、輸出格式化 | main, commands/, 設定 |
| **Monorepo** | 套件界限、共用合約、建構圖 | 根目錄 package.json/pnpm-workspace, shared/, packages/ |
| **框架** | 外掛系統、生命週期掛鉤 (lifecycle hooks)、逃生口 (escape hatches) | core/, plugins/, lifecycle |
| **資料管線** | 來源 → 轉換 → 接收器、結構定義擁有權 | ingest/, transform/, schema/, dbt models |
| **前端應用程式** | 元件階層、狀態管理、路由 | pages/, store/, router, api/ |

針對 **Monorepos**：找出與該人設目標最相關的 2–3 個套件。不要試圖導覽所有內容 — 在導覽開始時，使用一個步驟說明如何導覽工作區，然後保持專注。

### 大型儲存庫策略

對於擁有 100 個以上檔案的儲存庫：不要試圖閱讀所有內容。

1. 先閱讀進入點和 README
2. 建立前 5–7 個模組的心智模型
3. 針對要求的人設，找出**最重要的 2–3 個模組**並深入閱讀
4. 對於不涵蓋的模組，在簡介步驟中提到它們「超出了本次導覽的範圍」
5. 對於已繪製地圖但未閱讀的區域，使用 `directory` 步驟 — 它們能引導方向而不需要完整的知識

一個針對正確檔案的、精簡的 10 步導覽，優於一個涵蓋所有內容但散亂的 25 步導覽。

---

## 步驟 2：解讀意圖 — 推論您能推斷的一切，只詢問您無法推斷的部分

**使用者的一則訊息應該就足夠了。** 在詢問任何問題之前，請先閱讀其請求並推論人設、深度和重點。

### 意圖對照表

| 使用者說 | → 人設 | → 深度 | → 動作 |
|-----------|-----------|---------|----------|
| 「此 PR 的導覽」/ 「PR 審查」/ 「#123」 | pr-reviewer | 標準 | 為 PR 增加 `uri` 步驟；為分支使用 `ref` |
| 「為什麼 X 壞了」/ 「RCA」/ 「事故」 | rca-investigator | 標準 | 追蹤失敗的因果鏈 |
| 「偵錯 X」/ 「錯誤導覽」/ 「尋找錯誤」 | bug-fixer | 標準 | 進入點 → 故障點 → 測試 |
| 「入職」/ 「新進人員」/ 「快速上手」 | new-joiner | 標準 | 目錄、設定、業務背景 |
| 「快速導覽」/ 「氛圍檢查」/ 「重點摘要」 | vibecoder | 快速 | 5–8 個步驟，僅快速路徑 |
| 「說明 X 如何運作」/ 「功能導覽」 | feature-explainer | 標準 | 使用者介面 → API → 後端 → 儲存 |
| 「架構」/ 「技術主管」/ 「系統設計」 | architect | 深度 | 邊界、決策、權衡 |
| 「安全性」/ 「認證審查」/ 「信任邊界」 | security-reviewer | 標準 | 認證流程、驗證、敏感接收器 (sinks) |
| 「重構」/ 「可以安全擷取嗎？」 | refactorer | 標準 | 接縫 (seams)、隱藏相依性、擷取順序 |
| 「效能」/ 「瓶頸」/ 「慢速路徑」 | performance-optimizer | 標準 | 熱點路徑 (hot path)、N+1、I/O、快取 |
| 「貢獻者」/ 「開源入職」 | external-contributor | 快速 | 安全區域、慣例、地雷 |
| 「概念」/ 「說明模式 X」 | concept-learner | 標準 | 概念 → 實作 → 理由 |
| 「測試涵蓋範圍」/ 「在哪裡增加測試」 | test-writer | 標準 | 合約、接縫 (seams)、涵蓋範圍缺口 |
| 「我該如何呼叫 API」 | api-consumer | 標準 | 公用介面、認證、錯誤語意 |

**默默推論：** 人設、深度、焦點區域、是否增加 `uri`/`ref`、`isPrimary`。

**僅在您真的無法推論時才詢問：**
- 「錯誤導覽」但未描述錯誤 → 詢問錯誤描述
- 「功能導覽」但未指名功能 → 詢問是哪個功能
- 明確要求「特定檔案」 → 將其視為必要的停靠點

除非使用者提到，否則切勿詢問關於 `nextTour`、`commands`、`when` 或 `stepMarker`。

### PR 導覽食譜

針對 PR 導覽：將 `"ref"` 設定為分支，以 PR 的 `uri` 步驟開始，先涵蓋變更的檔案，然後是未變更但關鍵的檔案，最後以審查者檢核清單結束。

### 使用者提供的自訂設定 — 務必遵守

| 使用者說 | 該做什麼 |
|-----------|-----------|
| 「涵蓋 `src/auth.ts` 和 `config/db.yml`」 | 這些檔案是必要的停靠點 |
| 「固定在 `v2.3.0` 標籤」 / 「此 commit: abc123」 | 設定 `"ref": "v2.3.0"` |
| 「連結到 PR #456」 / 貼上網址 | 在適當的敘事時機增加一個 `uri` 步驟 |
| 「完成後引導至安全性導覽」 | 設定 `"nextTour": "Security Review"` |
| 「將此設為主入職導覽」 | 設定 `"isPrimary": true` |
| 「在此步驟開啟終端機」 | 增加 `"commands": ["workbench.action.terminal.focus"]` |
| 「深度」/「徹底」/「5 個步驟」/「快速」 | 相應地覆蓋深度 |

---

## 步驟 3：閱讀實際檔案 — 無一例外

**導覽中的每個檔案路徑和行號都必須透過閱讀檔案來驗證。**
導覽指向錯誤的檔案或不存在的行號，比沒有導覽還要糟糕。

對於每個規劃的步驟：
1. 閱讀檔案
2. 找到您要強調的程式碼所在的確切行號
3. 充分理解它，以便向目標人設進行解釋

如果使用者要求的檔案不存在，請告知 — 不要默默地用另一個檔案替代。

---

## 步驟 4：編寫導覽

儲存至 `.tours/<persona>-<focus>.tour`。請閱讀 `references/codetour-schema.json` 以獲取權威的欄位清單。您使用的每個欄位都必須出現在該結構定義 (schema) 中。

### 導覽根節點

```json
{
  "$schema": "https://aka.ms/codetour-schema",
  "title": "描述性標題 — 人設 / 目標",
  "description": "一句話：這是給誰看的，以及他們在完成後會理解什麼。",
  "ref": "main",
  "isPrimary": false,
  "nextTour": "後續導覽的標題",
  "steps": []
}
```

省略任何不適用於此導覽的欄位。

**`when`** — 條件式顯示。在執行時評估的 JavaScript 運算式。僅在條件為 true 時顯示此導覽。適用於特定人設的自動啟動，或在簡單的導覽完成之前隱藏進階導覽。
```json
{ "when": "workspaceFolders[0].name === 'api'" }
```

**`stepMarker`** — 直接在原始程式碼註解中嵌入步驟錨點。設定後，CodeTour 會在檔案中尋找 `// <stepMarker>` 註解，並將其用作步驟位置，而不是（或與其並列）行號。適用於程式碼經常變動且行號不斷偏移的導覽。範例：設定 `"stepMarker": "CT"` 並在原始程式碼檔案中放入 `// CT`。除非使用者要求，否則不要建議這樣做 — 這需要編輯原始程式碼檔案，這是不尋常的。

---

### 步驟類型 — 完整參考

所有步驟類型：**內容** (content，簡介/結束，最多 2 個)、**目錄** (directory)、**檔案+行號** (file+line，主力)、**選取範圍** (selection，程式碼區塊)、**模式** (pattern，正規表達式比對)、**URI** (外部連結)、**檢視** (view，聚焦 VS Code 面板)、**指令** (commands，執行 VS Code 指令)。

> **路徑規則：** `"file"` 和 `"directory"` 必須相對於儲存庫根目錄。不使用絕對路徑，不以 `./` 開頭。

---

### 何時使用各個步驟類型

| 情況 | 步驟類型 |
|-----------|-----------|
| 導覽簡介或結束 | content |
| 「這裡放的是這個資料夾的內容」 | directory |
| 一行程式碼就能說明整個故事 | file + line |
| 重點在於函式/類別主體 | selection |
| 行號會變動，檔案不穩定 | pattern |
| PR / issue / 文件提供了「為什麼」 | uri |
| 讀者應該開啟終端機或檔案總管 | view 或 commands |

---

### 步驟數量校準

根據深度和人設比對步驟。這些是目標，而非硬性限制。

| 深度 | 總步驟數 | 核心路徑步驟 | 備註 |
|-------|-------------|-----------------|-------|
| 快速 | 5–8 | 3–5 | 氛圍編碼者、快速探索者 — 徹底刪減 |
| 標準 | 9–13 | 6–9 | 大多數人設 — 廣度 + 足夠的細節 |
| 深度 | 14–18 | 10–13 | 架構師、RCA — 呈現每個權衡 |

也請隨儲存庫大小調整。3 個檔案的 CLI 不會有 15 個步驟。200 個檔案的單體應用程式不應壓縮為 5 個。

| 儲存庫大小 | 建議的標準深度 |
|-----------|---------------------------|
| 極小 (< 20 個檔案) | 5–8 個步驟 |
| 小型 (20–80 個檔案) | 8–11 個步驟 |
| 中型 (80–300 個檔案) | 10–13 個步驟 |
| 大型 (300+ 個檔案) | 12–15 個步驟 (範圍縮小至相關子系統) |

---

### 編寫出色的描述 — SMIG 公式

每個描述都應依序回答四個問題。您不需要四個段落 — 但每個描述都需要具備這四個元素，即使很簡短。

**S — 情境 (Situation)**：讀者正在看什麼？用一句話奠定背景。
**M — 機制 (Mechanism)**：這段程式碼如何運作？運用了什麼模式、規則或設計？
**I — 影響 (Implication)**：為什麼這對*此人設的特定目標*很重要？
**G — 陷阱 (Gotcha)**：聰明的人在這裡會犯什麼錯？有什麼非顯而易見、脆弱或令人驚訝的地方？

描述應該告訴讀者一些他們無法僅透過閱讀檔案本身就能學到的東西。指出模式名稱、解釋設計決策、標記失敗模式，並交叉引用相關背景。

---

## 敘事弧 — 每個導覽、每個人設

1. **引導方向** — **必須是 `file` 或 `directory` 步驟，切勿僅含內容。**
   使用 `"file": "README.md", "line": 1` 或 `"directory": "src"` 並將您的歡迎詞放入描述中。
   僅含內容的第一步（沒有 `file`、`directory` 或 `uri`）在 VS Code CodeTour 中會呈現為空白頁面 — 這是已知的 VS Code 擴充功能行為，無法調整。

2. **高階地圖** (1–3 個 directory 或 uri 步驟) — 主要模組及其關聯性。
   不需要列出每個資料夾 — 只要此人設需要知道的內容即可。

3. **核心路徑** (file/line、selection、pattern、uri 步驟) — 關鍵的特定程式碼。
   這是導覽的核心。閱讀並敘述。不要走馬看花。

4. **結束** (content) — 讀者現在理解了什麼、他們接下來可以做什麼、
   2–3 個建議的後續導覽。如果已設定 `nextTour`，請在此處依名稱引用。

### 結束步驟

不要摘要 — 讀者剛讀完。相反地，告訴他們現在可以*做*什麼、要避免什麼，並建議 2-3 個後續導覽。

---

## 20 種人設

| 人設 | 目標 | 必須涵蓋 | 避免 |
|---------|------|------------|-------|
| **氛圍編碼者 (Vibecoder)** | 快速掌握氛圍 | 進入點、請求流程、主要模組。最多 8 步。 | 深度探索、邊緣案例 |
| **新進人員** | 結構化上手 | 目錄、設定、業務背景、服務邊界。 | 進階內部細節 |
| **錯誤修復者** | 快速找到根因 | 使用者動作 → 觸發 → 故障點。重現提示 + 測試位置。 | 架構導覽 |
| **RCA 調查員** | 為什麼失敗 | 因果鏈、副作用、競態條件、可觀測性。 | 快樂路徑 |
| **功能說明者** | 單一功能端對端 | 使用者介面 → API → 後端 → 儲存。功能旗標、邊緣案例。 | 無關的功能 |
| **PR 審查者** | 正確審查變更 | 變更故事、不變量、風險區域、審查者檢核清單。為 PR 增加 URI 步驟。 | 無關的背景 |
| **安全性審查者** | 信任邊界 | 認證流程、輸入驗證、秘密處理、敏感接收器。 | 無關的商務邏輯 |
| **重構者** | 安全結構調整 | 接縫 (seams)、隱藏相依性、耦合熱點、安全擷取順序。 | 功能說明 |
| **外部貢獻者** | 在不破壞的情況下貢獻 | 安全區域、程式碼風格、架構地雷。 | 深度內部細節 |
| **技術主管 / 架構師** | 形式與理由 | 模組邊界、設計權衡、風險熱點。 | 逐行導覽 |

---

## 設計導覽系列

當程式碼庫複雜到一個導覽無法妥善涵蓋時，請設計一個系列。
`nextTour` 欄位會將它們鏈結起來：當讀者完成一個導覽時，VS Code 會提議自動啟動下一個導覽。

**在編寫任何導覽之前先規劃系列。** 一個好的系列具有：
- 明確的進階路徑 (廣泛 → 狹窄、引導方向 → 深入探索)
- 導覽之間沒有重複的步驟
- 每個導覽都足夠獨立，本身就很有用

在每個導覽中將 `nextTour` 設定為下一個導覽的 `title`（必須完全相符）。每個導覽都應該足夠獨立，以便自身能發揮作用。

---

## CodeTour 不支援的功能

如果被要求其中任何一項，請明確說明不支援 — 不要建議不存在的替代方案：

| 請求 | 實際情況 |
|---|---|
| **在 X 秒後自動前進到下一步** | 不支援。導覽始終由讀者手動點擊「下一步」。沒有計時器、延遲或自動播放的步驟機制。 |
| **在步驟中嵌入影片或 GIF** | 不支援。說明僅支援 Markdown 文字。 |
| **執行任意 shell 指令** | 不支援。`commands` 只能執行 VS Code 命令（例如 `workbench.action.terminal.focus`），不能執行 shell 指令。 |
| **分支／有條件的下一步** | 不支援。導覽為線性。`when` 控制導覽是否顯示，而不是下一步的選擇。 |
| **顯示步驟但不開啟檔案** | 部分支援 — 僅含內容的步驟可以，但第 1 步必須有 `file` 或 `directory` 錨點，否則 VS Code 會顯示空白頁。 |

---

## 反模式

| 反模式 | 修正方法 |
|---|---|
| **檔案清單式** — 造訪檔案並寫「這個檔案包含...」 | 敘述一個故事；每個步驟應該依賴前一步 |
| **通用的描述** | 指出此程式庫中特有的具體模式或陷阱 |
| **猜測行號** | 永遠不要寫未親自驗證的行號 |
| **忽略使用者角色** | 刪除所有不符合其目標的步驟 |
| **虛構檔案** | 如果檔案不存在，略過該步驟 |

---

## 品質檢查清單 — 在撰寫檔案前驗證

- [ ] 每個 `file` 路徑相對於倉儲根目錄（不可以 `/` 或 `./` 為前綴）
- [ ] 每個 `file` 路徑已閱讀並確認存在
- [ ] 每個 `line` 行號已透過閱讀檔案驗證（不可猜測）
- [ ] 每個 `directory` 相對於倉儲根目錄，且已確認存在
- [ ] 每個 `pattern` 正規表達式會比對到檔案中的實際行
- [ ] 每個 `uri` 為完整且真實的 URL（以 https:// 開頭）
- [ ] `ref` 若設定，為真實的分支／標籤／提交
- [ ] `nextTour` 若設定，必須完全符合另一個 `.tour` 檔案的 `title`
- [ ] 僅建立 `.tour` JSON 檔案 — 不可修改原始程式碼
- [ ] 第一個步驟具有 `file` 或 `directory` 錨點（若第一步僅含內容，VS Code 會顯示空白頁）
- [ ] 導覽以結尾內容步驟收尾，告訴讀者接下來可以做什麼
- [ ] 每個說明回答 SMIG — 情境、機制、影響、注意事項
- [ ] 以使用者角色的優先事項決定步驟選擇（刪除所有不符合其目標的內容）
- [ ] 步驟數量須符合要求的深度與倉儲大小（參見校準表）
- [ ] 最多 2 個僅含內容的步驟（介紹 + 結尾）
- [ ] 所有欄位符合 `references/codetour-schema.json`

---

## 步驟 5：驗證導覽

**編寫完導覽檔案後，務必立即執行驗證器。切勿跳過此步驟。**

```bash
python ~/.agents/skills/code-tour/scripts/validate_tour.py .tours/<name>.tour --repo-root .
```

驗證器會檢查：
- JSON 有效性
- 每個 `file` 路徑都存在，且每個 `line` 都在檔案範圍內
- 每個 `directory` 都存在
- 每個 `pattern` 正規表達式都能編譯，且至少比對到檔案中的一行
- 每個 `uri` 都以 `https://` 開頭
- `nextTour` 與 `.tours/` 中現有的導覽標題相符
- 僅含內容的步驟數量（若 > 2 則發出警告）
- 敘事弧（若沒有引導方向或結束步驟則發出警告）

**在繼續之前修正所有錯誤。** 重新執行直到驗證器回報 ✓ 或僅有警告。警告僅供參考 — 請自行判斷。在驗證通過之前，請勿向使用者展示導覽。

**常見的 VS Code 問題：** 僅含內容的第一步會呈現為空白（請改為錨定到檔案/目錄）。絕對路徑或以 `./` 為前綴的路徑會默默失敗。超出範圍的行號會導致無法捲動到任何地方。

如果您無法執行指令碼，請手動驗證：第 1 步具有 `file`/`directory`、所有路徑都存在、所有行號都在範圍內、`nextTour` 完全相符。

**自動播放：** `isPrimary: true` 加上 `.vscode/settings.json` 中的 `{ "codetour.promptForPrimaryTour": true }` 會在開啟儲存庫時發出提示。對於應顯示在任何分支上的導覽，請省略 `ref`。

**分享：** 對於公開儲存庫，使用者可以在 `https://vscode.dev/github.com/<owner>/<repo>` 開啟導覽，無需安裝。

---

## 步驟 6：總結

編寫完導覽後，告訴使用者：
- 檔案路徑 (`.tours/<name>.tour`)
- 一個段落的摘要，說明導覽涵蓋的內容以及適用對象
- 如果儲存庫是公開的，提供 `vscode.dev` URL（以便他們可以立即分享）
- 2–3 個建議的後續導覽（或系列中的下一個導覽，如果已規劃）
- 任何使用者要求但不存在的檔案（要明確說明 — 不要默默地替代）

---

## 檔案命名

`<persona>-<focus>.tour` — 使用 kebab-case，同時傳達人設與焦點：
```
onboarding-new-joiner.tour
bug-fixer-payment-flow.tour
architect-overview.tour
vibecoder-quickstart.tour
pr-review-auth-refactor.tour
security-auth-boundaries.tour
concept-dependency-injection.tour
rca-login-outage.tour
```
