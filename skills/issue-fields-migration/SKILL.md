---
name: issue-fields-migration
description: '將欄位值從 GitHub Project V2 欄位或儲存庫標籤遷移至組織級議題欄位。當使用者需要批次複製 Metadata (優先順序、狀態、日期、文字、數字) 從專案欄位或標籤到議題欄位，或者當他們詢問有關將專案欄位資料或標籤遷移、轉移或複製到議題欄位時，請使用此技能。'
---

# 議題欄位遷移 (Issue Fields Migration)

將欄位值從 Project V2 欄位或儲存庫標籤批次複製到組織級議題欄位。此技能將引導您探索欄位對應、預覽變更，並在執行遷移時提供進度報告。支援兩種遷移來源：專案欄位 (單一專案) 及儲存庫標籤 (一個或多個儲存庫)。

## 何時使用

- 使用者新增了與現有專案欄位重疊的組織級議題欄位
- 使用者希望在刪除舊專案欄位之前，將專案欄位的值複製到議題欄位
- 使用者詢問有關將專案欄位資料「遷移」、「轉移」或「複製」到議題欄位
- 使用者希望將儲存庫標籤 (例如：p0, p1, p2, p3) 轉換為議題欄位值 (例如：Priority 欄位)
- 使用者詢問有關採用議題欄位後取代標籤或清理標籤的問題

## 前置條件

- 目標組織必須已啟用議題欄位 (issue fields)
- 議題欄位必須已存在於組織級別
- 對於專案欄位遷移：議題欄位必須已新增至該專案
- 對於標籤遷移：標籤必須存在於目標儲存庫中
- 使用者必須具備儲存庫的寫入權限 (若要遷移專案欄位，則也需具備專案權限)
- `gh` CLI 必須已通過適當權限範圍 (scopes) 的驗證

## 可用的工具

### MCP 工具 (讀取操作)

| 工具 | 用途 |
|------|---------|
| `mcp__github__projects_list` | 列出專案欄位 (`list_project_fields`)、列出帶有數值的專案項目 (`list_project_items`) |
| `mcp__github__projects_get` | 取得特定專案欄位或項目的詳細資訊 |

### CLI / REST API

| 操作 | 命令 |
|-----------|---------|
| 列出組織議題欄位 | `gh api /orgs/{org}/issue-fields -H "X-GitHub-Api-Version: 2026-03-10"` |
| 讀取議題欄位值 | `gh api /repos/{owner}/{repo}/issues/{number}/issue-field-values -H "X-GitHub-Api-Version: 2026-03-10"` |
| 寫入議題欄位值 | `gh api /repositories/{repo_id}/issues/{number}/issue-field-values -X POST -H "X-GitHub-Api-Version: 2026-03-10" --input -` |
| 取得儲存庫 ID | `gh api /repos/{owner}/{repo} --jq .id` |
| 列出儲存庫標籤 | `gh label list -R {owner}/{repo} --limit 1000 --json name,color,description` |
| 依標籤列出議題 | `gh issue list -R {owner}/{repo} --label "{name}" --state all --json number,title,labels --limit 1000` |
| 從議題中移除標籤 | `gh api /repos/{owner}/{repo}/issues/{number}/labels/{label_name} -X DELETE` |

完整 API 詳細資訊請參閱 [references/issue-fields-api.md](references/issue-fields-api.md), [references/projects-api.md](references/projects-api.md), 以及 [references/labels-api.md](references/labels-api.md)。

## 工作流程

### 步驟 0：遷移來源

詢問使用者要遷移的內容：

1. **「您是要遷移標籤還是專案欄位？」**
   - **標籤**：請繼續執行下方的 [標籤遷移流程](#標籤遷移流程)。
   - **專案欄位**：請繼續執行下方的 [專案欄位遷移流程](#專案欄位遷移流程)。

2. 如果使用者選擇 **標籤**：
   - 詢問：「哪些組織和儲存庫包含這些標籤？」
   - 詢問：「您想要遷移哪些標籤？」(他們可以指定標籤名稱，或是要求「先讓我看標籤清單」)

3. 如果使用者選擇 **專案欄位**：
   - 詢問：「您可以分享專案連結，或是告訴我組織名稱與專案編號嗎？」
   - 詢問：「您想要遷移哪個欄位？」

---

### 標籤遷移流程

當使用者想要將儲存庫標籤轉換為議題欄位值時，請使用此流程。標籤僅能對應至 `single_select` 類型的議題欄位 (每個標籤名稱對應至一個選項值)。

#### 階段 L1：輸入與標籤探索

1. 詢問使用者：要遷移的 **組織名稱** 與 **儲存庫**。
2. 從各個儲存庫獲取標籤：

```bash
gh label list -R {owner}/{repo} --limit 1000 --json name,color,description
```

3. 獲取組織議題欄位：

```bash
gh api /orgs/{org}/issue-fields \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --jq '.[] | {id, name, content_type, options: [.options[]?.name]}'
```

4. **篩選** (針對含有眾多標籤的儲存庫)：如果儲存庫有超過 50 個標籤，請依常用前綴 (例如：`priority-*`, `team-*`, `type-*`) 或顏色進行分組。在對應之前，讓使用者透過「顯示符合 priority 的標籤」或「顯示藍色標籤」進行篩選。切勿一次列出超過 100 個標籤。

5. 詢問使用者哪些標籤對應至哪個議題欄位及選項。支援以下模式：
   - **單一標籤對應單一欄位**：例如，標籤 "bug" → Type 欄位，"Bug" 選項
   - **多個標籤對應單一欄位** (批次)：例如，標籤 p0, p1, p2, p3 → Priority 欄位及其對應選項
   - **多個標籤對應多個欄位**：例如，p1 → Priority + frontend → Team。將其視為個別的對應組別處理。

6. **自動建議對應關係**：針對每個標籤，嘗試使用以下模式 (依序) 比對議題欄位選項：
   - **完全符合** (不區分大小寫)：標籤 `Bug` → 選項 `Bug`
   - **前綴數字** (`{prefix}-{n}` → `{P}{n}`)：標籤 `priority-1` → 選項 `P1`
   - **去除分隔符號** (連字號、底線、空格)：標籤 `good_first_issue` → 選項 `Good First Issue`
   - **子字串包含**：標籤 `type: bug` → 選項 `Bug`

   一次呈現所有建議，供使用者確認、修正或略過。

**範例輸出：**

```
github/my-repo 中的標籤 (僅顯示相關項目)：
  p0, p1, p2, p3, bug, enhancement, frontend, backend

組織議題欄位 (single_select)：
  Priority: Critical, P0, P1, P2, P3
  Type: Bug, Feature, Task
  Team: Frontend, Backend, Design

建議的對應關係：
  標籤 "p0" → Priority "P0"
  標籤 "p1" → Priority "P1"
  標籤 "p2" → Priority "P2"
  標籤 "p3" → Priority "P3"
  標籤 "bug" → Type "Bug"
  標籤 "frontend" → Team "Frontend"
  標籤 "backend" → Team "Backend"
  標籤 "enhancement" → (無自動比對項目；略過或手動對應)

是否確認、調整或新增更多對應？
```

#### 階段 L2：衝突偵測

在定案標籤對選項的對應後，請檢查是否有衝突。當一個議題擁有多個對應至**相同**議題欄位的標籤時，即會發生衝突 (因為 single_select 欄位僅能存放一個值)。

1. 依目標議題欄位對標籤對應進行分組。
2. 針對擁有多個標籤來源的每個欄位，記錄潛在的衝突。
3. 詢問使用者衝突解決策略：
   - **第一個符合項**：使用第一個找到的符合標籤 (依標籤對應清單的順序)
   - **略過**：略過含有衝突標籤的議題並進行回報
   - **手動**：呈現每個衝突，由使用者決定

**範例：**

```
潛在衝突：標籤 "p0" 與 "p1" 皆對應至 Priority 欄位。
若議題同時擁有這兩個標籤，應以哪個值為準？

選項：
  1. 第一個符合項 (使用 "p0"，因為它在對應清單中排在前面)
  2. 略過有衝突的議題
  3. 由我逐一決定
```

#### 階段 L3：執行前檢查與資料掃描

1. 針對每個儲存庫，驗證寫入權限並快取 `repository_id`：

```bash
gh api /repos/{owner}/{repo} --jq '{full_name, id, permissions: .permissions}'
```

2. 針對對應關係中的每個標籤，獲取符合的議題：

```bash
gh issue list -R {owner}/{repo} --label "{label_name}" --state all \
  --json number,title,labels,type --limit 1000
```

   **警告**：`--limit 1000` 會在背景自動截斷結果。若您預期某個標籤可能含有超過 1,000 個議題，請手動分頁或先驗證總數 (例如：`gh issue list --label "X" --state all --json number | jq length`)。

   **PR 篩選**：`gh issue list` 會回傳議題與 PR。請在 `--json` 輸出中包含 `type`，且若使用者僅想遷移議題，請篩選出 `type == "Issue"`。

3. 若**所有選定的標籤皆回報 0 個議題**，請停止並告知使用者。建議：嘗試不同的標籤、檢查拼字，或嘗試不同的儲存庫。切勿在遷移內容為空的情況下繼續執行。

4. 針對多儲存庫遷移，請對所有指定的儲存庫重複此步驟。

5. 針對找到的每個議題：
   - 檢查該議題是否已具備目標議題欄位的值 (若已設定則略過)。
   - 偵測多標籤衝突 (議題擁有兩個對應至同一欄位的標籤)。
   - 套用在階段 L2 選擇的衝突解決策略。
   - 分類為：**遷移**、**略過 (已設定)**、**略過 (衝突)**，或 **略過 (無符合標籤)**。

#### 階段 L4：預覽 / 試執行 (Dry-Run)

在進行任何寫入操作前呈現摘要。

**範例預覽：**

```
標籤遷移預覽

來源：github/my-repo 中的標籤
目標欄位：Priority, Type, Team

| 類別                | 數量 |
|-------------------------|-------|
| 待遷移議題       |   156 |
| 已設定 (略過)      |    12 |
| 衝突標籤 (略過)|    3 |
| 帶有標籤的議題總數|   171 |

標籤細目：
  "p1" → Priority "P1": 42 個議題
  "p2" → Priority "P2": 67 個議題
  "p3" → Priority "P3": 38 個議題
  "bug" → Type "Bug": 9 個議題

變更範例 (前 5 項)：
  github/my-repo#101: Priority → "P1"
  github/my-repo#203: Priority → "P2", Type → "Bug"
  github/my-repo#44:  Priority → "P3"
  github/my-repo#310: Priority → "P1"
  github/my-repo#7:   Type → "Bug"

遷移後，您是否也想從議題中移除已遷移的標籤？(選填)

估計時間：約 24 秒 (156 次 API 呼叫，每次約 0.15 秒)

是否繼續執行？
```

#### 階段 L5：執行

1. 針對每個待遷移的議題，寫入議題欄位值 (端點與專案欄位遷移相同)：

```bash
echo '{"issue_field_values": [{"field_id": FIELD_ID, "value": "OPTION_NAME"}]}' | \
  gh api /repositories/{repo_id}/issues/{number}/issue-field-values \
    -X POST \
    -H "X-GitHub-Api-Version: 2026-03-10" \
    --input -
```

   將 `FIELD_ID` 替換為整數欄位 ID (例如：`1`)，並將 `OPTION_NAME` 替換為選項名稱字串。

2. 若使用者選擇移除標籤，請在成功寫入欄位後移除各個已遷移標籤：

```bash
gh api /repos/{owner}/{repo}/issues/{number}/labels/{label_name} -X DELETE
```

   針對包含空格或特殊字元的標籤名稱進行 URL 編碼。

3. **節奏控制**：呼叫之間延遲 100 毫秒。遇到 HTTP 429 回應時，執行指數型退避 (1s, 2s, 4s, 最高至 30s)。
4. **進度**：每 25 個項目報告一次 (例如：「已遷移 75/156 個議題...」)。
5. **錯誤處理**：記錄失敗項目但繼續執行。分開記錄標籤移除失敗的情況。
6. **最終摘要**：

```
標籤遷移已完成

| 結果                | 數量 |
|-----------------------|-------|
| 已設定欄位            |   153 |
| 已移除標籤        |   153 |
| 已略過               |    15 |
| 失敗 (欄位寫入)  |     2 |
| 失敗 (標籤移除) |     1 |

失敗項目：
  github/my-repo#501: 403 Forbidden (權限不足)
  github/my-repo#88:  422 Validation failed (該儲存庫不提供此欄位)
  github/my-repo#120: 標籤移除失敗 (404，標籤已不存在)
```

---

### 專案欄位遷移流程

當使用者想要將 GitHub Project V2 欄位的值複製到對應的組織級議題欄位時，請使用此流程。

請依序執行以下六個階段。執行前請務必進行預覽。

#### 階段 P1：輸入與探索

1. 詢問使用者：**組織名稱** 與 **專案編號** (或專案 URL)。
2. 獲取專案欄位：

```bash
# 使用 MCP 工具
mcp__github__projects_list(owner: "{org}", project_number: {n}, method: "list_project_fields")
```

3. 獲取組織議題欄位：

```bash
gh api /orgs/{org}/issue-fields \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --jq '.[] | {id, name, content_type, options: [.options[]?.name]}'
```

4. **過濾代理 (proxy) 欄位**：在專案啟用議題欄位後，部分專案欄位會顯示為 `options: []` 為空的「代理」項目 (針對 single-select 類型)。這些項目僅是組織議題欄位的鏡像，應予忽略。僅比對具有實際選項值的專案欄位。

5. 依名稱 (不區分大小寫) 且類型相容的欄位進行自動比對：

| 專案欄位類型 | 議題欄位類型 | 是否相容？ |
|-------------------|-----------------|-------------|
| TEXT | text | 是，直接複製 |
| SINGLE_SELECT | single_select | 是，需進行選項對應 |
| NUMBER | number | 是，直接複製 |
| DATE | date | 是，直接複製 |
| ITERATION | (無) | 無對應類型；發出警告並略過 |

6. 以表格形式呈現建議的欄位對應。讓使用者確認、調整或略過欄位。

**範例輸出：**

```
找到 3 個潛在的欄位對應：

| # | 專案欄位      | 類型          | 議題欄位        | 狀態     |
|---|-------------------|---------------|--------------------|------------|
| 1 | Priority (renamed) | SINGLE_SELECT | Priority           | 自動比對 |
| 2 | Due Date           | DATE          | Due Date           | 自動比對 |
| 3 | Sprint             | ITERATION     | (無對應項目)    | 已略過    |

是否繼續執行欄位 1 與 2 的遷移？您也可以新增手動對應。
```

#### 階段 P2：選項對應 (僅限 single-select 欄位)

針對每組符合的 single-select 欄位：

1. 比較專案欄位與議題欄位之間的選項名稱 (不區分大小寫)。
2. 自動比對名稱相同的選項。
3. 針對任何未對應的專案欄位選項，在一份摘要中呈現**所有**未對應選項，並要求使用者一次提供所有對應關係。切勿逐一詢問；請將其批次處理為單次互動。
4. 顯示最終選項對應表以供確認。

**範例輸出：**

```
"Release - Target" 的選項對應：

自動比對 (不區分大小寫)：
  "GA" → "GA"
  "Private Preview" → "Private Preview"
  "Public Preview" → "Public Preview"

未對應的專案選項 (需要您的輸入)：
  1. "Internal Only" → 對應至哪個議題欄位選項？(或略過)
  2. "Retired" → 對應至哪個議題欄位選項？(或略過)
  3. "Beta" → 對應至哪個議題欄位選項？(或略過)
  4. "Deprecated" → 對應至哪個議題欄位選項？(或略過)

尚未對應的可選議題欄位選項："Internal", "Sunset", "Beta Testing", "End of Life"

請提供上述所有 4 個選項的對應 (例如："1→Internal, 2→Sunset, 3→Beta Testing, 4→skip")。
```

#### 階段 P3：執行前檢查

在掃描項目之前，驗證對每個可能涉及之儲存庫的寫入權限：

1. 從專案項目 (第一頁) 中，收集一組唯一的 `{owner}/{repo}` 值。
2. 針對每個唯一的儲存庫，驗證已驗證使用者具備 Issues 寫入權限：

```bash
gh api /repos/{owner}/{repo} --jq '{full_name, permissions: .permissions}'
```

3. 若有任何儲存庫顯示 `push: false` 或 `triage: false`，請在繼續之前警告使用者。這些儲存庫中的項目將在寫入時失敗。
4. 現在快取各儲存庫的 `repository_id` (整數)；您將在階段 P6 中用到它：

```bash
gh api /repos/{owner}/{repo} --jq .id
```

#### 階段 P4：資料掃描

1. 使用 MCP 獲取所有專案項目。**重要**：對於含有超過約 200 個項目的專案，`gh api graphql --paginate` 可能不穩定 (它會串接 JSON 回應且缺乏適當分隔符號，並可能發生逾時)。請使用內部處理分頁的 MCP 工具，或使用明確的游標分頁機制：

```bash
# 偏好方式：使用 MCP 工具 (自動處理分頁)
mcp__github__projects_list(owner: "{org}", project_number: {n}, method: "list_project_items")

# 針對大型專案的備案：手動游標分頁
# 每頁獲取 100 個項目，每次推進游標。
# 在獲取下一頁之前先處理當前頁面，以避免記憶體問題。
# 儲存進度 (頁碼或最後一個游標)，以便在發生中斷時能繼續執行。
```

2. 針對每個項目：
   - 若為草稿項目 (非實際議題) 則略過。
   - 擷取來源專案欄位值。
   - 若來源數值為空則略過。
   - 檢查該議題是否已具備目標議題欄位的值：

```bash
gh api /repos/{owner}/{repo}/issues/{number}/issue-field-values \
  -H "X-GitHub-Api-Version: 2026-03-10"
```

   - 若議題欄位已具備數值，請略過 (保留現有資料)。

3. 將各項目分類為：
   - **遷移**：具備來源值且無現有目標值
   - **略過 (已設定)**：目標議題欄位已具備數值
   - **略過 (無來源)**：此項目的專案欄位為空
   - **略過 (草稿)**：項目為草稿，非實際議題
   - **略過 (未對應選項)**：single-select 的值未進行對應

#### 階段 P5：預覽 / 試執行 (Dry-Run)

在進行任何寫入操作前呈現摘要。

**若使用者要求試執行 (dry-run)**：顯示完整的詳細報告 (每個議題及其目前數值、建議的新數值及略過原因) 並停止。不執行操作。

**否則 (預覽模式)**：顯示摘要計數及變更範例，然後要求確認。

**範例預覽：**

```
專案 #42 的遷移預覽

待遷移欄位：Priority, Due Date

| 類別               | 數量 |
|------------------------|-------|
| 待遷移項目       |   847 |
| 已設定 (略過)     |    23 |
| 無來源值 (略過) |   130 |
| 草稿項目 (略過)     |    12 |
| 專案項目總數    | 1,012 |

變更範例 (前 5 項)：
  github/repo-a#101: Priority → "High"
  github/repo-a#203: Priority → "Medium", Due Date → "2025-03-15"
  github/repo-b#44:  Priority → "Low"
  github/repo-a#310: Due Date → "2025-04-01"
  github/repo-c#7:   Priority → "Critical"

估計時間：約 127 秒 (847 次 API 呼叫，每次約 0.15 秒)

是否繼續遷移？這將更新 3 個儲存庫中的 847 個議題。
```

#### 階段 P6：執行

1. 使用在階段 P3 快取的 `repository_id` 數值。

2. 針對每個待遷移項目，寫入議題欄位值：

```bash
echo '{"issue_field_values": [{"field_id": FIELD_ID, "value": "VALUE"}]}' | \
  gh api /repositories/{repo_id}/issues/{number}/issue-field-values \
    -X POST \
    -H "X-GitHub-Api-Version: 2026-03-10" \
    --input -
```

   將 `FIELD_ID` 替換為整數欄位 ID (例如：`1`)，並將 `VALUE` 替換為數值字串。

3. **節奏控制**：在 API 呼叫之間加入 100 毫秒延遲。針對 HTTP 429 回應，執行指數型退避 (1s, 2s, 4s, 最高至 30s)。
4. **進度**：每 25 個項目報告一次狀態 (例如：「已遷移 75/847 個項目...」)。
5. **錯誤處理**：記錄失敗項目但繼續處理剩餘項目。
6. **最終摘要**：

```
遷移已完成

| 結果  | 數量 |
|---------|-------|
| 成功 |   842 |
| 已略過 |   165 |
| 失敗  |     5 |

失敗項目：
  github/repo-a#501: 403 Forbidden (權限不足)
  github/repo-b#88:  422 Validation failed (該儲存庫不提供此欄位)
  ...
```

## 重要備註

- **寫入端點特性**：用於寫入議題欄位值的 REST API 使用 `repository_id` (整數)，而非 `owner/repo`。請務必先使用 `gh api /repos/{owner}/{repo} --jq .id` 查閱儲存庫 ID。
- **Single-select 數值**：REST API 接受選項**名稱**作為字串 (而非選項 ID)。這使得專案欄位與標籤的對應變得簡單明瞭。
- **讀回數值**：從 API 回應讀取議題欄位值時，請使用 `.single_select_option.name` 取得人類可讀的數值。`.value` 屬性會回傳內部選項 ID (如 `1201` 之類的整數)，而非顯示名稱。
- **API 版本標頭**：所有議題欄位端點皆要求 `X-GitHub-Api-Version: 2026-03-10`。
- **跨儲存庫項目**：專案可能包含來自多個儲存庫的議題。請快取每個儲存庫的儲存庫 ID 以避免重複查閱。
- **保留現有值**：切勿覆寫已設定的議題欄位值。請略過這些項目。
- **反覆項目 (Iteration) 欄位**：無對應的議題欄位。請務必警告使用者並略過。
- **草稿項目**：未連結至實際議題的專案項目無法擁有議題欄位值。請略過並加註說明。
- **標籤作用域為儲存庫**：不同於專案欄位，標籤是個別存在於各個儲存庫中的。相同的標籤名稱可能存在於多個儲存庫中；遷移作業將個別套用於各儲存庫。
- **標籤衝突**：一個議題可能擁有多個對應至同一個 single_select 欄位的標籤。執行前請務必偵測並解決這些衝突。
- **標籤移除為選填**：遷移後，使用者可能希望保留標籤作為備份或將其移除。移除前請務必詢問。
- **對標籤名稱進行 URL 編碼**：含有空格或特殊字元的標籤名稱，在 REST API 路徑中使用時必須進行 URL 編碼 (例如：`good%20first%20issue`)。
- **大規模遷移的腳本生成**：針對超過 100 個議題的遷移，請產生獨立的 shell 腳本，而非透過代理程式逐一執行 API 呼叫。這樣速度較快、可恢復執行，且能避免代理程式逾時問題。
- **等冪性 (Idempotent) 遷移**：重新執行遷移是安全的。已具備目標欄位值的議題將被略過。這意味著您可以安全地恢復執行先前中斷的遷移，而不會重複工作。
- **`--limit 1000` 截斷**：`gh issue list --limit 1000` 會在達到 1,000 個結果時自動停止且不發出通知。針對含有更多議題的標籤，請使用 `--jq` 與游標分頁，或是執行多個篩選後的查詢 (例如：依日期範圍)。
- **macOS bash 版本**：macOS 內建的 bash 為 3.x 版本，不支援 `declare -A` (關聯陣列)。產生的腳本應使用符合 POSIX 標準的結構，或註明不相容性並建議使用 `brew install bash`。
- **議題 vs PR**：`gh issue list` 會回傳議題與提取要求 (Pull Request)。若遷移目標僅限議題，請在 `--json` 輸出中包含 `type` 並篩選 `type == "Issue"`。

## 範例

### 範例 1：完整遷移

**使用者**：「我需要將我們專案中的 Priority 數值遷移至新的組織 Priority 議題欄位」

**動作**：遵循階段 P1-P6。探索欄位、對應選項、檢查權限、掃描項目、預覽、執行。

### 範例 2：僅執行試執行 (Dry-Run)

**使用者**：「請讓我看看如果我從專案 #42 遷移欄位會發生什麼事，但先不要實際執行」

**動作**：僅遵循階段 P1-P5。呈現完整的試執行報告，列出每個項目。不執行操作。

### 範例 3：多個欄位

**使用者**：「將專案 #15 的 Priority 與 Due Date 遷移至議題欄位」

**動作**：相同的工作流程，但單次處理兩個欄位。在資料掃描期間，收集每個項目所有已對應欄位的數值。在單次 API 呼叫中為每個議題寫入所有欄位值。

### 範例 4：單一標籤至議題欄位

**使用者**：「我想將 'bug' 標籤遷移至 Type 議題欄位」

**動作**：引導至標籤遷移流程。詢問組織/儲存庫、列出標籤、確認對應關係：標籤 "bug" → Type 欄位 "Bug" 選項。掃描帶有該標籤的議題、預覽、執行。詢問遷移後是否移除標籤。

### 範例 5：多個標籤至單一欄位 (批次)

**使用者**：「我們有 p0, p1, p2, p3 標籤，並希望將它們轉換為 Priority 議題欄位」

**動作**：引導至標籤遷移流程。將所有四個標籤對應至 Priority 欄位選項 (p0→P0, p1→P1, p2→P2, p3→P3)。檢查衝突 (擁有多個優先順序標籤的議題)。在一個摘要中預覽所有變更。單次執行。選擇性地從已遷移議題中移除所有四個標籤。

### 範例 6：跨儲存庫標籤遷移且移除標籤

**使用者**：「將 'frontend' 與 'backend' 標籤遷移至 github/issues, github/memex 與 github/mobile 中的 Team 議題欄位，然後移除舊標籤」

**動作**：引導至標籤遷移流程。確認儲存庫與標籤對應： "frontend"→Team "Frontend", "backend"→Team "Backend"。掃描這三個儲存庫中帶有這些標籤的議題。偵測衝突 (同時帶有兩個標籤的議題)。跨儲存庫預覽。執行欄位寫入，然後從已遷移議題中移除標籤。報告各儲存庫統計數據。
