---
name: sponsor-finder
description: 尋找 GitHub 儲存庫的哪些相依性可以透過 GitHub Sponsors 進行贊助。使用 deps.dev API 進行跨 npm、PyPI、Cargo、Go、RubyGems、Maven 和 NuGet 的相依性解析。檢查 npm 贊助 Metadata、FUNDING.yml 檔案和網頁搜尋。驗證每個連結。顯示具有 OSSF 計分卡健康資料的直接和遞移相依性。透過提供 GitHub 擁有者/儲存庫進行叫用 (例如「尋找 expressjs/express 中的可贊助相依性」)。
---

# 贊助尋找器 (Sponsor Finder)

尋找儲存庫的哪些開源相依性接受透過 GitHub Sponsors (或 Open Collective、Ko-fi 等) 進行贊助。接受 GitHub `擁有者/儲存庫` 格式，使用 deps.dev API 進行相依性解析和專案健康資料獲取，並產生一份經過驗證的贊助報告，涵蓋直接和遞移相依性。

## 您的工作流程

當使用者以 `擁有者/儲存庫` 格式提供儲存庫時：

1. **解析輸入** — 擷取 `擁有者` 和 `儲存庫`。
2. **偵測生態系統** — 獲取資訊清單以確定套件名稱 + 版本。
3. **獲取完整的相依性樹狀結構** — deps.dev `GetDependencies` (一次呼叫)。
4. **解析儲存庫** — 為每個相依性執行 deps.dev `GetVersion` → `relatedProjects` 提供 GitHub 儲存庫。
5. **獲取專案健康狀況** — 為唯一儲存庫執行 deps.dev `GetProject` → OSSF 計分卡。
6. **尋找贊助連結** — npm `funding` 欄位、FUNDING.yml、網頁搜尋備用方案。
7. **驗證每個連結** — 獲取每個 URL 以確認其有效。
8. **分組並報告** — 依贊助目標分組，並依影響力排序。

---

## 步驟 1：偵測生態系統和套件

使用 `get_file_contents` 從目標儲存庫獲取資訊清單。確定生態系統並擷取套件名稱 + 最新版本：

| 檔案 | 生態系統 | 套件名稱來源 | 版本來源 |
|------|-----------|-------------------|--------------|
| `package.json` | NPM | `name` 欄位 | `version` 欄位 |
| `requirements.txt` | PYPI | 套件名稱列表 | 使用最新版本 (在 deps.dev 呼叫中省略版本) |
| `pyproject.toml` | PYPI | `[project.dependencies]` | 使用最新版本 |
| `Cargo.toml` | CARGO | `[package] name` | `[package] version` |
| `go.mod` | GO | `module` 路徑 | 從 go.mod 中擷取 |
| `Gemfile` | RUBYGEMS | gem 名稱 | 使用最新版本 |
| `pom.xml` | MAVEN | `groupId:artifactId` | `version` |

---

## 步驟 2：獲取完整的相依性樹狀結構 (deps.dev)

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
- `versionKey.version` — 解析後的版本
- `relation` — `"SELF"`、`"DIRECT"` 或 `"INDIRECT"`

**這單次呼叫即可提供完整的相依性樹狀結構** — 包括直接和遞移相依性 — 並具有確切的解析版本。無需解析鎖定檔案 (lockfiles)。

### URL 編碼
包含特殊字元的套件名稱必須經過百分比編碼：
- `@colors/colors` → `%40colors%2Fcolors`
- 將 `@` 編碼為 `%40`，將 `/` 編碼為 `%2F`

### 針對沒有單一根套件的儲存庫
如果儲存庫未發佈套件 (例如它是應用程式而非函式庫)，則備用方案是直接讀取 `package.json` 的相依性，並為每個相依性呼叫 deps.dev `GetVersion`。

---

## 步驟 3：將每個相依性解析為 GitHub 儲存庫 (deps.dev)

針對樹狀結構中的每個相依性，呼叫 deps.dev `GetVersion`：

```
https://api.deps.dev/v3/systems/{ECOSYSTEM}/packages/{NAME}/versions/{VERSION}
```

從回應中擷取：
- **`relatedProjects`** → 尋找 `relationType: "SOURCE_REPO"` → `projectKey.id` 提供 `github.com/{擁有者}/{儲存庫}`
- **`links`** → 尋找 `label: "SOURCE_REPO"` → `url` 欄位

這適用於**所有生態系統** — npm、PyPI、Cargo、Go、RubyGems、Maven、NuGet — 且具有相同的欄位結構。

### 效率規則
- 以 **10 個一組** 的批次進行處理。
- 去重 — 多個套件可能映射到同一個儲存庫。
- 跳過找不到 GitHub 專案的相依性 (計為「無法解析」)。

---

## 步驟 4：獲取專案健康資料 (deps.dev)

針對每個唯一的 GitHub 儲存庫，呼叫 deps.dev `GetProject`：

```
https://api.deps.dev/v3/projects/github.com%2F{擁有者}%2F{儲存庫}
```

從回應中擷取：
- **`scorecard.checks`** → 尋找 `"Maintained"` 檢查 → `score` (0–10)
- **`starsCount`** — 受歡迎程度指標
- **`license`** — 專案授權
- **`openIssuesCount`** — 活躍程度指標

使用 Maintained 分數來標記專案健康狀況：
- 分數 7–10 → ⭐ 主動維護中
- 分數 4–6 → ⚠️ 部分維護中
- 分數 0–3 → 💤 可能未維護

### 效率規則
- 僅為**唯一儲存庫**獲取資料 (而非按套件)。
- 以 **10 個一組** 的批次進行處理。
- 此步驟為選用 — 如果受速率限制則跳過，並在輸出中註明。

---

## 步驟 5：尋找贊助連結

針對每個唯一的 GitHub 儲存庫，依序使用三個來源檢查贊助資訊：

### 5a：npm `funding` 欄位 (僅限 npm 生態系統)
在 `https://registry.npmjs.org/{套件名稱}/latest` 上使用 `web_fetch` 並檢查 `funding` 欄位：
- **字串：** `"https://github.com/sponsors/sindresorhus"` → 作為 URL 使用
- **物件：** `{"type": "opencollective", "url": "https://opencollective.com/express"}` → 使用 `url`
- **陣列：** 收集所有 URL

### 5b：`.github/FUNDING.yml`
使用 `get_file_contents` 獲取 `{擁有者}/{儲存庫}` 路徑下的 `.github/FUNDING.yml`。

解析 YAML：
- `github: [使用者名稱]` → `https://github.com/sponsors/{使用者名稱}`
- `open_collective: slug` → `https://opencollective.com/{slug}`
- `ko_fi: 使用者名稱` → `https://ko-fi.com/{使用者名稱}`
- `patreon: 使用者名稱` → `https://patreon.com/{使用者名稱}`
- `tidelift: 平台/套件` → `https://tidelift.com/subscription/pkg/{平台-套件}`
- `custom: [URL 列表]` → 原樣使用

### 5c：網頁搜尋備用方案
針對**前 10 個未獲贊助的相依性** (依遞移相依項數量排序)，使用 `web_search`：
```
"{套件名稱}" github sponsors OR open collective OR funding
```
跳過已知由企業維護的套件 (React/Meta、TypeScript/Microsoft、@types/DefinitelyTyped)。

### 效率規則
- **針對所有相依性檢查 5a 和 5b。** 僅針對前幾個未獲贊助的相依性使用 5c。
- 針對非 npm 生態系統，跳過 npm 登錄呼叫。
- 去重儲存庫 — 每個儲存庫僅檢查一次。

---

## 步驟 6：驗證每個連結 (關鍵)

**在包含「任何」贊助連結之前，請先驗證其是否存在。**

對每個贊助 URL 使用 `web_fetch`：
- **有效頁面** → ✅ 包含
- **404 / 「找不到」 / 「未加入」** → ❌ 排除
- **重導向至有效頁面** → ✅ 包含最終 URL

以 **5 個一組** 的批次進行驗證。絕不提供未經驗證的連結。

---

## 步驟 7：輸出報告

```
## 💜 贊助尋找器報告

**儲存庫：** {擁有者}/{儲存庫}
**掃描時間：** {目前日期}
**生態系統：** {ecosystem} · {package}@{version}

---

### 摘要

- 共有 **{total}** 個相依性 ({direct} 個直接 + {transitive} 個遞移)
- **{resolved}** 個已解析為 GitHub 儲存庫
- 💜 **{sponsorable}** 個具有經過驗證的贊助連結 ({percentage}%)
- **{destinations}** 個唯一的贊助目標
- 所有連結已驗證 ✅

---

### 已驗證的贊助連結

| 相依性 | 儲存庫 | 贊助方式 | 直接？ | 驗證方式 |
|------------|------|---------|---------|--------------|
| {name} | [{擁有者}/{儲存庫}](https://github.com/{擁有者}/{儲存庫}) | 💜 [GitHub Sponsors](https://github.com/sponsors/{user}) | ✅ | FUNDING.yml |
| {name} | [{擁有者}/{儲存庫}](https://github.com/{擁有者}/{儲存庫}) | 🟠 [Open Collective](https://opencollective.com/{slug}) | ⛓️ | npm funding |
| ... | ... | ... | ... | ... |

直接相依性使用 ✅，遞移相依性使用 ⛓️。

---

### 贊助目標 (依影響力排序)

| 目標 | 相依性 | 健康狀況 | 連結 |
|-------------|------|--------|------|
| 🟠 Open Collective: {name} | {N} 個直接 | ⭐ 維護中 | [opencollective.com/{name}](https://opencollective.com/{name}) |
| 💜 @{user} | {N} 個直接 + {M} 個遞移 | ⭐ 維護中 | [github.com/sponsors/{user}](https://github.com/sponsors/{user}) |
| ... | ... | ... | ... |

依相依性總數 (直接 + 遞移) 遞減排序。

---

### 未找到已驗證的贊助

| 相依性 | 儲存庫 | 原因 | 直接？ |
|------------|------|-----|---------|
| {name} | {擁有者}/{儲存庫} | 企業 (Meta) | ✅ |
| {name} | {擁有者}/{儲存庫} | 無 FUNDING.yml 或 Metadata | ⛓️ |
| ... | ... | ... | ... |

僅顯示前 10 個未獲贊助的直接相依性。如果更多，請註明「...以及另外 {N} 個」。

---

### 💜 {percentage}% 已驗證贊助涵蓋率 · {destinations} 個目標 · {sponsorable} 個相依性
### 💡 僅需贊助 {N} 個人/組織，即可涵蓋所有 {sponsorable} 個獲贊助的相依性
```

### 格式說明
- **直接？** 欄位：✅ = 直接相依性，⛓️ = 遞移相依性
- **健康狀況** 欄位：⭐ 維護中 (7+), ⚠️ 部分 (4–6), 💤 低 (0–3) — 來自 OSSF 計分卡
- **驗證方式**：`FUNDING.yml`、`npm funding`、`PyPI metadata`、`網頁搜尋`
- 💜 GitHub Sponsors、🟠 Open Collective、☕ Ko-fi、🔗 其他
- 當存在多個贊助來源時，優先考慮 GitHub Sponsors 連結
- **💡 摘要行** 告訴使用者涵蓋所有內容所需的最少贊助數量

---

## 錯誤處理

- 如果 deps.dev 對套件傳回 404 → 備用方案是直接讀取資訊清單並透過登錄 API 進行解析。
- 如果 deps.dev 受速率限制 → 註明部分結果，並繼續處理已獲取的內容。
- 如果 `get_file_contents` 對儲存庫傳回 404 → 告知使用者儲存庫可能不存在或為私有。
- 如果連結驗證失敗 → 靜默排除該連結。
- 始終產生報告，即使只有部分結果 — 絕不靜默失敗。

---

## 關鍵規則

1. **絕不提供未經驗證的連結。** 在顯示之前獲取每個 URL。5 個經過驗證的連結 > 20 個猜測的連結。
2. **絕不根據訓練知識進行猜測。** 始終進行檢查 — 贊助頁面會隨時間而變更。
3. **保持透明。** 顯示「驗證方式」和「直接？」欄位，以便使用者瞭解資料。
4. **將 deps.dev 作為主要的解析器。** 僅在 deps.dev 不可用時才使用登錄 API 作為備用。
5. **始終使用 GitHub MCP 工具** (`get_file_contents`)、`web_fetch` 和 `web_search` — 絕不執行複製 (clone) 或使用 Shell。
6. **保持效率。** 批次處理 API 呼叫、去重儲存庫、尊重抽樣限制。
7. **聚焦於 GitHub Sponsors。** 最具體可執行的平台 — 顯示其他平台但優先考慮 GitHub。
8. **依維護者進行去重。** 分組顯示贊助一個人的真實影響力。
9. **顯示具體可執行的最小值。** 💡 行告訴使用者涵蓋所有獲贊助相依性所需的最少贊助次數。
