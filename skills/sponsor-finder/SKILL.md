---
name: sponsor-finder
description: 使用 GitHub CLI 與 REST API 尋找 GitHub 存放庫的相依項目中哪些可以透過 GitHub Sponsors 進行贊助。使用 deps.dev API 跨 npm、PyPI、Cargo、Go、RubyGems、Maven 與 NuGet 進行相依性解析。檢查 npm funding 中繼資料、FUNDING.yml 檔案以及網頁搜尋。驗證每個連結。顯示直接與遞移相依項目以及 OSSF Scorecard 專案健康資料。使用 /sponsor 後跟 GitHub 擁有者/存放庫（例如 "/sponsor expressjs/express"）進行呼叫。
---

# 贊助商尋找器 (Sponsor Finder)

發現支援您專案相依項目背後開源維護者的機會。接受 GitHub 的 `擁有者/存放庫` 格式輸入（例如 `/sponsor expressjs/express`），使用 deps.dev API 進行相依性解析與專案健康資料獲取，並產生一份涵蓋直接與遞移相依項目的友善贊助報告。

## 您的工作流 (Your Workflow)

當使用者輸入 `/sponsor {擁有者/存放庫}` 或以 `擁有者/存放庫` 格式提供存放庫時：

1. **解析輸入** — 擷取 `擁有者 (owner)` 與 `存放庫 (repo)`。
2. **偵測生態系統** — 獲取資訊清單 (manifest) 以判斷套件名稱 + 版本。
3. **獲取完整相依性樹** — 呼叫 deps.dev `GetDependencies`（一次呼叫）。
4. **解析存放庫** — 對每個相依項目呼叫 deps.dev `GetVersion` → `relatedProjects` 提供 GitHub 存放庫。
5. **獲取專案健康度** — 對唯一的 GitHub 存放庫呼叫 deps.dev `GetProject` → 獲取 OSSF Scorecard。
6. **尋找資助連結** — 檢查 npm `funding` 欄位、FUNDING.yml 以及網頁搜尋回退方案。
7. **驗證每個連結** — 擷取每個 URL 以確認其仍有效。
8. **分組與報告** — 依資助目的地分組，並依影響力排序。

---

## 步驟 1：偵測生態系統與套件 (Step 1: Detect Ecosystem and Package)

使用 `get_file_contents` 從目標存放庫獲取資訊清單。判斷生態系統並擷取套件名稱 + 最新版本：

| 檔案 | 生態系統 | 套件名稱取自 | 版本取自 |
|------|-----------|-------------------|--------------|
| `package.json` | NPM | `name` 欄位 | `version` 欄位 |
| `requirements.txt` | PYPI | 套件名稱列表 | 使用最新版本 (在 deps.dev 呼叫中省略版本) |
| `pyproject.toml` | PYPI | `[project.dependencies]` | 使用最新版本 |
| `Cargo.toml` | CARGO | `[package] name` | `[package] version` |
| `go.mod` | GO | `module` 路徑 | 從 go.mod 擷取 |
| `Gemfile` | RUBYGEMS | gem 名稱 | 使用最新版本 |
| `pom.xml` | MAVEN | `groupId:artifactId` | `version` |

---

## 步驟 2：獲取完整相依性樹 (deps.dev) (Step 2: Get Full Dependency Tree (deps.dev))

**這是關鍵步驟。** 使用 `web_fetch` 呼叫 deps.dev API：

```
https://api.deps.dev/v3/systems/{ECOSYSTEM}/packages/{PACKAGE}/versions/{VERSION}:dependencies
```

例如：
```
https://api.deps.dev/v3/systems/npm/packages/express/versions/5.2.1:dependencies
```

這會傳回一個 `nodes` 陣列，其中每個節點包含：
- `versionKey.name` — 套件名稱
- `versionKey.version` — 解析出的版本
- `relation` — `"SELF"`, `"DIRECT"`, 或 `"INDIRECT"`

**這單次呼叫即可提供整個相依性樹** — 包括直接與遞移相依項目 — 以及精確解析出的版本。無須解析鎖定檔案 (lockfiles)。

### URL 編碼 (URL encoding)
包含特殊字元的套件名稱必須進行百分比編碼：
- `@colors/colors` → `%40colors%2Fcolors`
- 將 `@` 編碼為 `%40`，`/` 編碼為 `%2F`

### 針對不具單一根套件的存放庫 (For repos without a single root package)
如果該存放庫未發佈套件（例如：它是應用程式而非函式庫），請回退到直接讀取 `package.json` 相依項目，並為每個項目呼叫 deps.dev `GetVersion`。

---

## 步驟 3：將每個相依項目解析為 GitHub 存放庫 (deps.dev) (Step 3: Resolve Each Dependency to a GitHub Repo (deps.dev))

針對相依性樹中的每個相依項目，呼叫 deps.dev `GetVersion`：

```
https://api.deps.dev/v3/systems/{ECOSYSTEM}/packages/{NAME}/versions/{VERSION}
```

從回應中擷取：
- **`relatedProjects`** → 尋找 `relationType: "SOURCE_REPO"` → `projectKey.id` 提供 `github.com/{owner}/{repo}`
- **`links`** → 尋找 `label: "SOURCE_REPO"` → 獲取 `url` 欄位

這適用於 **所有生態系統** — npm、PyPI、Cargo、Go、RubyGems、Maven、NuGet — 且欄位結構相同。

### 效率規則 (Efficiency rules)
- **一次處理 10 個**。
- 去重 — 多個套件可能對應到同一個存放庫。
- 跳過找不到 GitHub 專案的相依項目（計為「無法解析」）。

---

## 步驟 4：獲取專案健康資料 (deps.dev) (Step 4: Get Project Health Data (deps.dev))

針對每個唯一的 GitHub 存放庫，呼叫 deps.dev `GetProject`：

```
https://api.deps.dev/v3/projects/github.com%2F{owner}%2F{repo}
```

從回應中擷取：
- **`scorecard.checks`** → 尋找 `"Maintained"` 檢查 → 獲取 `score` (0–10)
- **`starsCount`** — 熱門程度指標
- **`license`** — 專案授權
- **`openIssuesCount`** — 活躍程度指標

使用「維護中 (Maintained)」分數來標記專案健康度：
- 分數 7–10 → ⭐ 積極維護中
- 分數 4–6 → ⚠️ 部分維護中
- 分數 0–3 → 💤 可能已停止維護

### 效率規則 (Efficiency rules)
- 僅針對 **唯一的存放庫** 進行擷取（而非按套件）。
- **一次處理 10 個**。
- 此步驟為選用 — 若遇到速率限制則跳過，並在輸出中註明。

---

## 步驟 5：尋找資助連結 (Step 5: Find Funding Links)

針對每個唯一的 GitHub 存放庫，依序使用以下三個來源檢查資助資訊：

### 5a：npm `funding` 欄位（僅限 npm 生態系統） (5a: npm funding field (npm ecosystem only))
對 `https://registry.npmjs.org/{package-name}/latest` 使用 `web_fetch` 並檢查 `funding` 欄位：
- **字串：** `"https://github.com/sponsors/sindresorhus"` → 作為 URL 使用
- **物件：** `{"type": "opencollective", "url": "https://opencollective.com/express"}` → 使用 `url`
- **陣列：** 收集所有 URL

### 5b：`.github/FUNDING.yml`（存放庫級別，然後回退到組織級別） (5b: .github/FUNDING.yml (repo-level, then org-level fallback))

**步驟 5b-i — 逐存放庫檢查：**
使用 `get_file_contents` 獲取 `{owner}/{repo}` 路徑下的 `.github/FUNDING.yml`。

**步驟 5b-ii — 組織/使用者級別回退：**
如果 5b-i 傳回 404（存放庫本身沒有 FUNDING.yml），請檢查擁有者的預設社群健康存放庫：
使用 `get_file_contents` 獲取 `{owner}/.github` 路徑下的 `FUNDING.yml`。

GitHub 支援 [預設社群健康檔案 (default community health files)](https://docs.github.com/zh/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) 慣例：使用者或組織級別的 `.github` 存放庫可為所有缺少該檔案的存放庫提供預設值。例如：`isaacs/.github/FUNDING.yml` 適用於所有 `isaacs/*` 存放庫。

針對每個唯一的 `{owner}/.github` 存放庫僅需 **尋找一次** — 將結果重用於該擁有者下的所有存放庫。**一次處理 10 個擁有者**。

解析 YAML（5b-i 與 5b-ii 格式相同）：
- `github: [使用者名稱]` → `https://github.com/sponsors/{username}`
- `open_collective: 代稱` → `https://opencollective.com/{slug}`
- `ko_fi: 使用者名稱` → `https://ko-fi.com/{username}`
- `patreon: 使用者名稱` → `https://patreon.com/{username}`
- `tidelift: 平台/套件` → `https://tidelift.com/subscription/pkg/{platform-package}`
- `custom: [URL 清單]` → 直接使用

### 5c：網頁搜尋回退方案 (5c: Web search fallback)
針對 **前 10 個未獲得資助的相依項目**（依遞移相依者數量排序），使用 `web_search`：
```
"{套件名稱}" github sponsors OR open collective OR funding
```
跳過已知由公司維護的套件 (React/Meta, TypeScript/Microsoft, @types/DefinitelyTyped)。

### 效率規則 (Efficiency rules)
- **為所有相依項目檢查 5a 與 5b。** 僅針對排名靠前且未獲資助的項目使用 5c。
- 針對非 npm 生態系統跳過 npm registry 呼叫。
- 去重存放庫 — 每個存放庫僅檢查一次。
- **每個唯一擁有者僅執行一次 `{owner}/.github` 檢查** — 將結果重用於其所有存放庫。
- **一次處理 10 個擁有者級別的查閱**。

---

## 步驟 6：驗證每個連結（關鍵事項） (Step 6: Verify Every Link (CRITICAL))

**在包含任何資助連結之前，請驗證其確實存在。**

對每個資助 URL 使用 `web_fetch`：
- **有效的頁面** → ✅ 包含
- **404 / "找不到" / "未加入"** → ❌ 排除
- **重新導向至有效頁面** → ✅ 包含最終 URL

**一次驗證 5 個**。絕不要呈現未經驗證的連結。

---

## 步驟 7：輸出報告 (Step 7: Output the Report)

### 輸出紀律 (Output discipline)

**在資料收集期間最小化中間輸出。** 不要播報每一批次（「第 3 批，共 7 批...」、「正在檢查資助連結...」）。取而代之的是：
- 在啟動每個主要階段時顯示 **一行簡短狀態**（例如：「正在解析 67 個相依項目...」、「正在檢查資助連結...」）
- **收集所有資料後再產生報告。** 絕不要零碎地提供部分表格。
- 在最後將最終報告作為 **單個凝聚的區塊** 輸出。

### 報告範本 (Report template)

```
## 💜 贊助商尋找器報告 (Sponsor Finder Report)

**存放庫：** {owner}/{repo} · {ecosystem} · {package}@{version}
**掃描時間：** {date} · 共 {total} 個相依項目 ({direct} 個直接 + {transitive} 個遞移)

---

### 🎯 回饋方式 (Ways to Give Back)

僅需贊助 {N} 位個人/組織即可支持您 {total} 個相依項目中的 {sponsorable} 個 — 這是對您專案所依賴的開源專案進行投資的絕佳方式。

1. **💜 @{user}** — {N} 個直接 + {M} 個遞移相依項目 · ⭐ 維護中
   {dep1}, {dep2}, {dep3}, ...
   https://github.com/sponsors/{user}

2. **🟠 Open Collective: {name}** — {N} 個直接 + {M} 個遞移相依項目 · ⭐ 維護中
   {dep1}, {dep2}, {dep3}, ...
   https://opencollective.com/{name}

3. **💜 @{user2}** — {N} 個直接相依項目 · 💤 低活躍度
   {dep1}
   https://github.com/sponsors/{user2}

---

### 📊 涵蓋率 (Coverage)

- **{sponsorable}/{total}** 個相依項目具有資助選項 ({percentage}%)
- **{destinations}** 個唯一的資助目的地
- **{unfunded_direct}** 個直接相依項目尚未設定資助 ({top_names}, ...)
- 所有連結皆已驗證 ✅
```

### 報告格式規則 (Report format rules)

- **以「🎯 回饋方式」開頭** — 這是主要輸出內容。編號列表，依涵蓋的總相依項目數量排序（遞減）。
- **網址單獨成行且不加裝飾** — 不要封裝在 markdown 連結語法中。這可確保它們在任何終端機模擬器中皆可點擊。
- **內嵌相依項目名稱** — 在每個贊助商下方以逗號分隔列出涵蓋的相依項目名稱，讓使用者清楚知道他們正在資助什麼。
- **內嵌健康指標** — 在每個目的地旁顯示 ⭐/⚠️/💤，不要放在獨立的表格欄位中。
- **單個「📊 涵蓋率」區段** — 精簡的統計資料。無須獨立的「已驗證資助連結」表格，也無須「找不到資助」表格。
- **將未獲資助的相依項目作為簡短筆記** — 僅列出計數 + 排名靠前的名稱。將其表述為「尚未設定資助」，而非強調缺口。絕不要羞辱未設定資助的專案 — 許多維護者偏好其他形式的貢獻。
- 💜 GitHub Sponsors, 🟠 Open Collective, ☕ Ko-fi, 🔗 其他
- 當同一維護者存在多個資助來源時，優先使用 GitHub Sponsors 連結。

---

## 錯誤處理 (Error Handling)

- 如果 deps.dev 對套件傳回 404 → 回退到直接讀取資訊清單並透過 registry API 解析。
- 如果 deps.dev 遇到速率限制 → 註明結果不完整，繼續處理已擷取的內容。
- 如果 `get_file_contents` 對存放庫傳回 404 → 告知使用者存放庫可能不存在或為私有。
- 如果連結驗證失敗 → 靜默排除該連結。
- 一律產生報告，即使內容不完整 — 絕不靜默失敗。

---

## 關鍵規則 (Critical Rules)

1. **絕不呈現未經驗證的連結。** 在顯示之前擷取每個 URL。5 個經過驗證的連結勝過 20 個猜測的連結。
2. **絕不根據訓練知識進行猜測。** 務必檢查 — 資助頁面會隨時間更迭。
3. **始終給予鼓勵，絕不羞辱。** 正向地表述結果 — 慶祝那些「已獲得」資助的專案，並將未獲資助的相依項目視為機會而非失敗。並非每個專案都需要或想要金錢贊助。
4. **以行動為導向。** 「🎯 回饋方式」區段是主要的輸出內容 — 依目的地分組的、可點擊的網址。
5. **將 deps.dev 作為主要的解析器。** 僅在 deps.dev 不可用時才回退到 registry API。
6. **一律使用 GitHub MCP 工具** (`get_file_contents`)、`web_fetch` 以及 `web_search` — 絕不執行 clone 或 shell 指令。
7. **保持高效。** 批次處理 API 呼叫、去重存放庫、每個擁有者的 `.github` 存放庫僅檢查一次。
8. **專注於 GitHub Sponsors。** 最具行動力的平台 — 顯示其他平台但優先考慮 GitHub。
9. **依維護者去重。** 分組以顯示贊助一位個人所產生的真實影響。
10. **顯示最具行動力的最小值。** 告訴使用者以最少的贊助次數支持最多的相依項目。
11. **最小化中間輸出。** 不要播報每一批次。收集所有資料，然後輸出一個凝聚的報告。
