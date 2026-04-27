# CodeQL SARIF 輸出參考

CodeQL 分析產生的 SARIF v2.1.0 輸出的詳細參考。在解釋或處理 CodeQL 掃描結果時使用此文件。

## 關於 SARIF

SARIF（靜態分析結果交換格式，Static Analysis Results Interchange Format）是一種用於表示靜態分析工具輸出的標準化 JSON 格式。CodeQL 產生 SARIF v2.1.0（規格：`sarifv2.1.0`）。

- 規格：[OASIS SARIF v2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)
- 結構：[sarif-schema-2.1.0.json](https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json)
- 格式類型：`sarifv2.1.0`（傳遞給 `--format` 旗標）

## 頂層結構

### `sarifLog` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `$schema` | ✅ | SARIF 結構連結 |
| `version` | ✅ | SARIF 規格版本 (`"2.1.0"`) |
| `runs` | ✅ | 包含每個語言單一 `run` 物件的陣列 |

### `run` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `tool` | ✅ | 工具資訊 (`toolComponent`) |
| `artifacts` | ✅ | 結果中引用的每個檔案的成品物件陣列 |
| `results` | ✅ | `result` 物件陣列 |
| `newLineSequences` | ✅ | 換行字元序列 |
| `columnKind` | ✅ | 欄位計數方法 |
| `properties` | ✅ | 包含識別格式的 `semmle.formatSpecifier` |

## 工具資訊

### `tool` 物件

包含單一 `driver` 屬性。

### `toolComponent` 物件 (Driver)

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `name` | ✅ | `"CodeQL command-line toolchain"` |
| `organization` | ✅ | `"GitHub"` |
| `version` | ✅ | CodeQL 發布版本 (例如：`"2.19.0"`) |
| `rules` | ✅ | 用於可用/執行規則的 `reportingDescriptor` 物件陣列 |

## 規則

### `reportingDescriptor` 物件 (規則)

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `id` | ✅ | 來自 `@id` 查詢屬性的規則識別碼 (例如：`cpp/unsafe-format-string`)。如果定義了 `@opaqueid` 則使用之。 |
| `name` | ✅ | 與查詢中的 `@id` 屬性相同 |
| `shortDescription` | ✅ | 來自 `@name` 查詢屬性 |
| `fullDescription` | ✅ | 來自 `@description` 查詢屬性 |
| `defaultConfiguration` | ❌ | 帶有 `enabled` (true/false) 的 `reportingConfiguration`，且 `level` 基於 `@severity`。如果未指定 `@severity` 則省略。 |

### 嚴重性對應

| CodeQL `@severity` | SARIF `level` |
|---|---|
| `error` | `error` |
| `warning` | `warning` |
| `recommendation` | `note` |

## 結果

### `result` 物件

預設情況下，結果按唯一的訊息格式字串和主要位置進行分組。在相同位置具有相同訊息的兩個結果將顯示為單一結果。使用 `--ungroup-results` 停用分組。

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `ruleId` | ✅ | 規則識別碼 (與 `reportingDescriptor.id` 匹配) |
| `ruleIndex` | ✅ | `rules` 陣列中的索引 |
| `message` | ✅ | 問題描述。可能包含連結到 `relatedLocations` 的 SARIF「帶有預留位置的訊息」。 |
| `locations` | ✅ | 包含單一 `location` 物件的陣列 |
| `partialFingerprints` | ✅ | 包含至少用於去重 (deduplication) 的 `primaryLocationLineHash` 的字典 |
| `codeFlows` | ❌ | 對於 `@kind path-problem` 查詢，填入一個或多個 `codeFlow` 物件 |
| `relatedLocations` | ❌ | 當訊息具有預留位置選項時填入；每個唯一位置包含一次 |
| `suppressions` | ❌ | 如果被隱藏：單一 `@kind: IN_SOURCE` 的 `suppression` 物件。如果未隱藏但其他結果被隱藏：空陣列。否則：未設定。 |

### 指紋 (Fingerprints)

`partialFingerprints` 包含：
- `primaryLocationLineHash` — 基於主要位置上下文的指紋

GitHub 使用它來追蹤跨提交的警示，並避免重複通知。

## 位置 (Locations)

### `location` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `physicalLocation` | ✅ | 實際檔案位置 |
| `id` | ❌ | 存在於 `relatedLocations` 陣列中 |
| `message` | ❌ | 存在於 `relatedLocations` 和 `threadFlowLocation.location` 中 |

### `physicalLocation` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `artifactLocation` | ✅ | 檔案引用 |
| `region` | ❌ | 對於文字檔案位置存在 |
| `contextRegion` | ❌ | 當位置具有相關聯的程式碼片段時存在 |

### `region` 物件

可能會產生兩種類型的區域：

**行/列偏移區域 (Line/Column Offset Regions)：**

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `startLine` | ✅ | 起始行號 |
| `startColumn` | ❌ | 如果等於預設值 1 則省略 |
| `endLine` | ❌ | 如果與 `startLine` 相同則省略 |
| `endColumn` | ✅ | 結束列號 |
| `snippet` | ❌ | 原始程式碼片段 |

**字元偏移區域 (Character Offset Regions)：**

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `charOffset` | ✅ | 從檔案開頭起的字元偏移量 |
| `charLength` | ✅ | 以字元計的長度 |
| `snippet` | ❌ | 原始程式碼片段 |

> 取用者應穩健地處理這兩種類型的區域。

## 成品 (Artifacts)

### `artifact` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `location` | ✅ | `artifactLocation` 物件 |
| `index` | ✅ | 成品的索引 |
| `contents` | ❌ | 使用 `--sarif-add-file-contents` 時填入 `artifactContent` |

### `artifactLocation` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `uri` | ✅ | 檔案路徑 (相對或絕對) |
| `index` | ✅ | 索引引用 |
| `uriBaseId` | ❌ | 當檔案相對於已知的抽象位置 (例如：原始碼根目錄) 時設定 |

## 程式碼流程 (Path Problems)

對於 `@kind path-problem` 的查詢，結果包含顯示資料流路徑的程式碼流程資訊。

### `codeFlow` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `threadFlows` | ✅ | `threadFlow` 物件陣列 |

### `threadFlow` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `locations` | ✅ | `threadFlowLocation` 物件陣列 |

### `threadFlowLocation` 物件

| 屬性 | 總是被產生 | 描述 |
|---|:---:|---|
| `location` | ✅ | 此流程步驟的 `location` 物件 |

## 自動化詳情 (Automation Details)

來自 `github/codeql-action/analyze` 的 `category` 值在 SARIF 輸出中顯示為 `<run>.automationDetails.id`。

範例：
```json
{
  "automationDetails": {
    "id": "/language:javascript-typescript"
  }
}
```

## SARIF 的關鍵 CLI 旗標

| 旗標 | 效果 |
|---|---|
| `--format=sarif-latest` | 產生 SARIF v2.1.0 輸出 |
| `--sarif-category=<cat>` | 設定結果分類的 `automationDetails.id` |
| `--sarif-add-file-contents` | 在 `artifact.contents` 中包含原始檔案內容 |
| `--ungroup-results` | 分別報告每一次出現（不按位置 + 訊息去重） |
| `--output=<file>` | 將 SARIF 寫入指定檔案 |

## 第三方 SARIF 支援

從非 CodeQL 工具上傳 SARIF 時，請確保填寫這些屬性，以在 GitHub 上獲得最佳結果。

### 建議的 `reportingDescriptor` 屬性

| 屬性 | 必填 | 描述 |
|---|:---:|---|
| `id` | ✅ | 唯一的規則識別碼 |
| `name` | ❌ | 規則名稱（最多 255 個字元） |
| `shortDescription.text` | ✅ | 簡潔描述（最多 1024 個字元） |
| `fullDescription.text` | ✅ | 完整描述（最多 1024 個字元） |
| `defaultConfiguration.level` | ❌ | 預設嚴重性：`note`、`warning`、`error` |
| `help.text` | ✅ | 文字格式的文件 |
| `help.markdown` | ❌ | Markdown 格式的文件（如果可用則顯示） |
| `properties.tags[]` | ❌ | 用於篩選的標籤（例如：`security`） |
| `properties.precision` | ❌ | `very-high`、`high`、`medium`、`low` — 影響顯示順序 |
| `properties.problem.severity` | ❌ | 非安全性嚴重性：`error`、`warning`、`recommendation` |
| `properties.security-severity` | ❌ | 安全性查詢評分 0.0–10.0。對應於：>9.0=critical, 7.0–8.9=high, 4.0–6.9=medium, 0.1–3.9=low |

### 原始檔案位置要求

- 儘可能使用相對路徑（相對於儲存庫根目錄）
- 絕對 URI 會使用原始碼根目錄轉換為相對路徑
- 原始碼根目錄可透過以下方式設定：
  - `github/codeql-action/analyze` 的 `checkout_path` 輸入
  - SARIF 上傳 API 的 `checkout_uri` 參數
  - SARIF 檔案中的 `invocations[0].workingDirectory.uri`
- 跨執行需要一致的檔案路徑以維持指紋穩定性
- 符號連結檔案必須使用解析後的（非符號連結）URI

### 指紋要求

- 帶有 `primaryLocationLineHash` 的 `partialFingerprints` 可防止跨提交的重複警示
- CodeQL SARIF 自動包含指紋
- 第三方 SARIF：如果缺失，`upload-sarif` 動作會計算指紋
- 不帶指紋的 API 上傳可能會產生重複警示

## 上傳限制

### 檔案大小
- 最大：**10 MB** (gzip 壓縮)
- 如果太大：縮小查詢範圍、移除 `--sarif-add-file-contents` 或拆分為多次上傳

### 物件計數限制

| 物件 | 最大值 |
|---|---|
| 每個檔案的執行次數 | 20 |
| 每次執行的結果數 | 25,000 |
| 每次執行的規則數 | 25,000 |
| 每次執行的工具擴充功能數 | 100 |
| 每個結果的執行緒流位置數 | 10,000 |
| 每個結果的位置數 | 1,000 |
| 每個規則的標籤數 | 20 |

超過這些限制的檔案將被拒絕。請使用不同的 `--sarif-category` 值將分析拆分到多個 SARIF 上傳。

### 驗證

上傳前使用 [Microsoft SARIF 驗證器](https://sarifweb.azurewebsites.net/) 驗證 SARIF 檔案。

## 回溯相容性

- 標記為「總是被產生」的欄位在未來版本中永遠不會被移除
- 非總是被產生的欄位可能會更改其出現的情況
- 可能會添加新欄位而不進行破壞性變更
- 取用者應穩健地處理可選欄位的存在與否
