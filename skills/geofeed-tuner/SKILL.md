---
name: geofeed-tuner
description: >
  每當使用者提到 IP 地理定位摘要 (IP geolocation feeds)、RFC 8805、geofeeds，或需要協助建立、調整、驗證或發布 CSV 格式的自我發布 IP 地理定位摘要時，請使用此技能。目標使用者為網路運營商、ISP、行動電信業者、雲端供應商、代管公司、IXP 或衛星供應商，詢問關於 IP 地理定位準確性或 geofeed 編寫最佳實務的問題。
  協助建立、精煉與改進 CSV 格式的 IP 地理定位摘要，並提供超越 RFC 8805 合規性的專家建議。請勿用於私有或內部 IP 位址管理 — 僅適用於公開可路由的 IP 位址。
license: Apache-2.0
metadata:
  author: Sid Mathur <support@getfastah.com>
  version: "0.0.9"
compatibility: 需要 Python 3
---

# Geofeed Tuner – 建立更好的 IP 地理定位摘要

此技能透過以下方式協助您建立與改進 CSV 格式的 IP 地理定位摘要：
- 確保您的 CSV 格式良好且一致
- 檢查是否符合 [RFC 8805](references/rfc8805.txt) (產業標準)
- 應用從實際部署中學到的 **專家最佳實務**
- 建議在準確性、完整性與隱私方面的改進

## 何時使用此技能

- 當使用者詢問如何 **建立、改進或發布** CSV 格式的 IP 地理定位摘要檔案時，請使用此技能。
- 使用它來 **調整與疑難排解 CSV 地理定位摘要** — 捕捉錯誤、建議改進，並確保超出 RFC 合規性的實際可用性。
- **目標使用者：**
  - 負責公開可路由 IP 位址空間的網路運營商、管理員與工程師
  - 如 ISP、行動電信業者、雲端供應商、代管與託管公司、網際網路交換中心運營商與衛星網際網路供應商等組織
- **請勿使用** 此技能進行私有或內部 IP 位址管理；它 **僅適用於** 公開可路由的 IP 位址。

## 先決條件

- **Python 3** 為必要條件。

## 目錄結構與檔案管理

此技能清楚區分 **發布檔案** (唯讀) 與 **工作檔案** (執行階段產生)。

### 唯讀目錄 (請勿修改)

下列目錄包含靜態發布資產。**請勿在這些目錄中建立、修改或刪除檔案：**

| 目錄      | 用途                                                    |
|-----------|------------------------------------------------------------|
| `assets/` | 靜態資料檔案 (ISO 代碼、範例)                    |
| `references/` | RFC 規範與程式碼片段以供參考         |
| `scripts/` | 可執行程式碼與報表的 HTML 範本檔案        |

### 工作目錄 (產生的內容)

所有產生的、暫時性的與輸出檔案皆存放於這些目錄：

| 目錄       | 用途                                              |
|-----------------|------------------------------------------------------|
| `run/`          | 所有代理程式產生內容的工作目錄    |
| `run/data/`     | 從遠端 URL 下載的 CSV 檔案                |
| `run/report/`   | 產生的 HTML 調整報表                        |

### 檔案管理規則

1. **絕不寫入 `assets/`, `references/`, 或 `scripts/`** — 這些是技能發布的一部分，必須保持不變。
2. **所有下載的輸入檔案** (來自遠端 URL) 必須儲存至 `./run/data/`。
3. **所有產生的 HTML 報表** 必須儲存至 `./run/report/`。
4. **所有產生的 Python 指令碼** 必須儲存至 `./run/`。
5. `run/` 目錄可能會在工作階段之間清除；請勿將永久資料儲存於此。
6. **執行工作目錄：** `./run/` 中的所有產生指令碼，執行時必須以 **技能根目錄** (包含 `SKILL.md` 的目錄) 作為當前工作目錄，以便讓如 `assets/iso3166-1.json` 和 `./run/data/report-data.json` 等相對路徑能正確解析。執行指令碼前，請勿 `cd` 進入 `./run/`。


## 處理管線：循序階段執行

所有階段皆必須 **依序** 執行，從第 1 階段到第 6 階段。每個階段皆取決於前一個階段的成功完成。例如，**結構檢查**必須先完成，**品質分析**才能執行。

階段摘要如下。代理程式必須遵循後續各階段章節中概述的詳細步驟。

| 階段 | 名稱                       | 描述                                                                       |
|-------|----------------------------|-----------------------------------------------------------------------------------|
| 1     | 理解標準    | 審查自我發布 IP 地理定位摘要的 RFC 8805 關鍵要求   |
| 2     | 收集輸入               | 從本地檔案或遠端 URL 收集 IP 子網段資料                            |
| 3     | 檢查與建議       | 驗證 CSV 結構、分析 IP 字首，並檢查資料品質               |
| 4     | 調整資料查詢         | 使用 Fastah 的 MCP 工具擷取調整資料以提高地理定位準確性  |
| 5     | 產生調整報表     | 建立 HTML 報表以摘要分析結果與建議                    |
| 6     | 最終審查               | 驗證報表資料的一致性與完整性                            |

**請勿跳過階段。** 每個階段皆提供後續階段所需的關鍵檢查或資料轉換。


### 執行計畫規則

執行每個階段前，代理程式必須產生一個可見的 TODO 清單。

計畫必須：
- 出現在階段的最開頭
- 依順序列出每個步驟
- 使用核取方塊格式
- 隨步驟完成即時更新


### 第 1 階段：理解標準

此技能強制執行的 RFC 8805 關鍵要求摘要如下。**將此摘要作為您的工作參考。** 僅在邊緣案例、模糊情況，或當使用者詢問此處未涵蓋的標準問題時，才查閱完整的 [RFC 8805 文字](references/rfc8805.txt)。

#### RFC 8805 關鍵事實

**目的：** 自我發布的 IP 地理定位摘要讓網路運營商能以簡單的 CSV 格式發布其 IP 位址空間的權威位置資料，讓地理定位供應商能夠納入營運商提供的更正資訊。

**CSV 欄位順序 (第 2.1.1.1–2.1.1.5 節)：**

| 欄位 | 欄位名稱         | 必要 | 備註                                                      |
|--------|---------------|----------|------------------------------------------------------------|
| 1      | `ip_prefix`   | 是      | CIDR 標記法；IPv4 或 IPv6；必須是網路位址     |
| 2      | `alpha2code`  | 否      | ISO 3166-1 alpha-2 國家代碼；空白或 "ZZ" = 不要進行地理定位 |
| 3      | `region`      | 否      | ISO 3166-2 子區分代碼 (例如 `US-CA`)               |
| 4      | `city`        | 否      | 自由文字城市名稱；無權威驗證集       |
| 5      | `postal_code` | 否      | **已棄用** — 必須保持空白或不填寫             |

**結構規則：**
- 檔案可能包含以 `#` 開頭的註解行 (包含標題，若存在)。
- 標題列為選用；若存在，若以 `#` 開頭則視為註解。
- 檔案必須以 UTF-8 編碼。
- 子網段主機位元不得設定 (例如 `192.168.1.1/24` 為無效；請使用 `192.168.1.0/24`)。
- 僅適用於 **全域可路由** 的單點傳播 (unicast) 位址 — 不適用於私有、迴路、連結本地、多點傳播空間。

**不要進行地理定位 (Do-not-geolocate)：** `alpha2code` 為空或不區分大小寫的 `ZZ` (不論 region/city 值為何) 的條目，皆是運營商不希望對該字首套用地理定位的明確訊號。

**郵遞區號已棄用 (第 2.1.1.5 節)：** 第五欄不得包含郵遞區號。它們對 IP 範圍對映而言過於精細，並引發隱私問題。


### 第 2 階段：收集輸入

- 若使用者尚未提供 IP 子網段或範圍清單 (有時稱為 `inetnum` 或 `inet6num`)，請提示他們提供。接受的輸入格式：
  - 貼上至對話框的文字
  - 本地 CSV 檔案
  - 指向 CSV 檔案的遠端 URL

- 若輸入為 **遠端 URL**：
  - 在處理前嘗試將 CSV 檔案下載至 `./run/data/`。
  - 若發生 HTTP 錯誤 (4xx, 5xx, 逾時或重新導向迴圈)，**請立即停止** 並向使用者回報：
    `無法存取摘要 URL：HTTP {status_code}。請驗證該 URL 是否公開可存取。`
  - 請勿使用不完整或空白的下載檔案進行第 3 階段。

- 若輸入為 **本地檔案**，請直接處理而無需下載。

- **編碼偵測與標準化：**
  1. 首先嘗試以 UTF-8 讀取檔案。
  2. 若引發 `UnicodeDecodeError`，請嘗試 `utf-8-sig` (具 BOM 的 UTF-8)，然後是 `latin-1`。
  3. 成功解碼後，重新編碼並以 UTF-8 寫入工作複本。
  4. 若無任何編碼成功，請停止並回報：`無法解碼輸入檔案。請將其另存為 UTF-8 後再試。`


### 第 3 階段：檢查與建議

#### 執行規則
- 為此階段產生一個 **指令碼**。
- 請勿將此階段與其他階段合併。
- 請勿預先計算未來階段的資料。
- 將輸出儲存為 JSON 檔案：[`./run/data/report-data.json`](./run/data/report-data.json)

#### 結構描述定義

下方的 JSON 結構在第 3 階段期間是 **不可變的**。第 4 階段稍後會將 `TunedEntry` 物件新增至 `Entries` 中的每個物件 — 這是唯一允許的結構描述擴充，並在獨立階段中進行。

JSON 鍵直接對應至如 `{{.CountryCode}}`、`{{.HasError}}` 等範本預留位置。

```json
{
  "InputFile": "",
  "Timestamp": 0,

  "TotalEntries": 0,
  "IpV4Entries": 0,
  "IpV6Entries": 0,
  "InvalidEntries": 0,

  "Errors": 0,
  "Warnings": 0,
  "OK": 0,
  "Suggestions": 0,

  "CityLevelAccuracy": 0,
  "RegionLevelAccuracy": 0,
  "CountryLevelAccuracy": 0,
  "DoNotGeolocate": 0,

  "Entries": [
    {
      "Line": 0,
      "IPPrefix": "",
      "CountryCode": "",
      "RegionCode": "",
      "City": "",

      "Status": "",
      "IPVersion": "",

      "Messages": [
        {
          "ID": "",
          "Type": "",
          "Text": "",
          "Checked": false
        }
      ],

      "HasError": false,
      "HasWarning": false,
      "HasSuggestion": false,
      "DoNotGeolocate": false,
      "GeocodingHint": "",
      "Tunable": false
    }
  ]
}
```

欄位定義：

**頂層中繼資料：**
- `InputFile`: 原始輸入來源，為本地檔名或遠端 URL。
- `Timestamp`: 執行調整時的 Unix Epoch 毫秒數。
- `TotalEntries`: 處理的資料列總數 (不含註解與空白行)。
- `IpV4Entries`: IPv4 子網段條目數。
- `IpV6Entries`: IPv6 子網段條目數。
- `InvalidEntries`: 無法解析 IP 字首與 CSV 解析的條目數。
- `Errors`: `Status` 為 `ERROR` 的條目總數。
- `Warnings`: `Status` 為 `WARNING` 的條目總數。
- `OK`: `Status` 為 `OK` 的條目總數。
- `Suggestions`: `Status` 為 `SUGGESTION` 的條目總數。
- `CityLevelAccuracy`: `City` 非空的有效條目數。
- `RegionLevelAccuracy`: `RegionCode` 非空且 `City` 為空的有效條目數。
- `CountryLevelAccuracy`: `CountryCode` 非空，且 `RegionCode` 與 `City` 皆為空的有效條目數。
- `DoNotGeolocate` (中繼資料): `CountryCode`, `RegionCode`, `City` 皆為空的有效條目數。

**條目欄位：**
- `Entries`: 物件陣列，每列資料一個物件，具有以下個別欄位：
  - `Line`: 原始 CSV 中的 1-based 行號 (計數所有行，含註解與空白)。
  - `IPPrefix`: 標準化後的 CIDR 斜線標記法 IP 字首。
  - `CountryCode`: ISO 3166-1 alpha-2 國家代碼，或空字串。
  - `RegionCode`: ISO 3166-2 地區代碼 (例如 `US-CA`)，或空字串。
  - `City`: 城市名稱，或空字串。
  - `Status`: 指派的最高嚴重性：`ERROR` > `WARNING` > `SUGGESTION` > `OK`。
  - `IPVersion`: `"IPv4"` 或 `"IPv6"`。
  - `Messages`: 訊息物件陣列，每個物件具有：
    - `ID`: 來自下方 **驗證規則參考** 表的字串識別碼 (例如 `"1101"`, `"3301"`)。
    - `Type`: 嚴重性型別：`"ERROR"`, `"WARNING"`, 或 `"SUGGESTION"`。
    - `Text`: 人類可讀的驗證訊息字串。
    - `Checked`: 若驗證規則可自動調整則為 `true`，否則為 `false`。控制報表中核取方塊的 `checked` 或 `disabled` 狀態。
  - `HasError`: 若有任何訊息 `Type` 為 `"ERROR"` 則為 `true`。
  - `HasWarning`: 若有任何訊息 `Type` 為 `"WARNING"` 則為 `true`。
  - `HasSuggestion`: 若有任何訊息 `Type` 為 `"SUGGESTION"` 則為 `true`。
  - `DoNotGeolocate` (條目): 若 `CountryCode` 為空或 `"ZZ"` 則為 `true` — 該條目為明確不要進行地理定位的訊號。
  - `GeocodingHint`: 第 3 階段中一律為空字串 `""`。保留供未來使用。
  - `Tunable`: 若條目中有任何訊息的 `Checked` 為 `true` 則為 `true`。驅動報表中「調整」按鈕的顯示。

#### 驗證規則參考

在為條目新增訊息時，請使用下表中的 `ID`、`Type`、`Text` 與 `Checked` 值。

| ID | 型別 | 文字 | Checked | 條件參考 |
|---|---|---|---|---|
| `1101` | `ERROR` | IP 字首為空 | `false` | IP 字首分析：空白 |
| `1102` | `ERROR` | 無效 IP 字首：無法解析為 IPv4 或 IPv6 網路 | `false` | IP 字首分析：語法無效 |
| `1103` | `ERROR` | RFC 8805 摘要中不允許私有 IP 範圍 | `false` | IP 字首分析：非公開 |
| `3101` | `SUGGESTION` | IPv4 字首異常過大，可能表示輸入錯誤 | `false` | IP 字首分析：IPv4 < /22 |
| `3102` | `SUGGESTION` | IPv6 字首異常過大，可能表示輸入錯誤 | `false` | IP 字首分析：IPv6 < /64 |
| `1201` | `ERROR` | 無效國家代碼：非有效的 ISO 3166-1 alpha-2 值 | `true` | 國家代碼分析：無效 |
| `1301` | `ERROR` | 無效地區格式；預期 COUNTRY-SUBDIVISION (例如 US-CA) | `true` | 地區代碼分析：格式錯誤 |
| `1302` | `ERROR` | 無效地區代碼：非有效的 ISO 3166-2 子區分 | `true` | 地區代碼分析：未知代碼 |
| `1303` | `ERROR` | 地區代碼與指定的國家代碼不符 | `true` | 地區代碼分析：不符 |
| `1401` | `ERROR` | 無效城市名稱：不允許預留位置值 | `false` | 城市名稱分析：預留位置 |
| `1402` | `ERROR` | 無效城市名稱：偵測到縮寫或基於代碼的值 | `true` | 城市名稱分析：縮寫 |
| `2401` | `WARNING` | 城市名稱格式不一致；請考慮標準化數值 | `true` | 城市名稱分析：格式化 |
| `1501` | `ERROR` | RFC 8805 已棄用郵遞區號，基於隱私考量必須移除 | `true` | 郵遞區號檢查 |
| `3301` | `SUGGESTION` | 對於小型領地，地區通常是不必要的；請考慮移除地區值 | `true` | 調整：小型領地地區 |
| `3402` | `SUGGESTION` | 對於小型領地，城市層級的精細度通常是不必要的；請考慮移除城市值 | `true` | 調整：小型領地城市 |
| `3303` | `SUGGESTION` | 當指定城市時建議使用地區代碼；請從下拉式選單選擇地區 | `true` | 調整：指定城市時缺少地區 |
| `3104` | `SUGGESTION` | 請確認此子網段是刻意標記為「不要進行地理定位」，還是缺少位置資料 | `true` | 調整：未指定的地理定位 |

#### 填入訊息

當驗證檢查符合時，使用表格中的值將訊息新增至條目的 `Messages` 陣列：
```python
entry["Messages"].append({
    "ID": "1201",      # 來自表格
    "Type": "ERROR",   # 來自表格
    "Text": "無效國家代碼：非有效的 ISO 3166-1 alpha-2 值",  # 來自表格
    "Checked": True    # 來自表格 (True = 可調整)
})
```

在為條目填入所有訊息後，導出條目層級旗標：
```python
entry["HasError"] = any(m["Type"] == "ERROR" for m in entry["Messages"])
entry["HasWarning"] = any(m["Type"] == "WARNING" for m in entry["Messages"])
entry["HasSuggestion"] = any(m["Type"] == "SUGGESTION" for m in entry["Messages"])
entry["Tunable"] = any(m["Checked"] for m in entry["Messages"])
```

#### 準確性層級計數規則

準確性層級是 **互斥的**。請根據最細緻的非空地理欄位，將每個有效的 (非 ERROR, 非無效) 條目指派到一個分類：

| 條件                                                    | 分類 (Bucket)                      |
|--------------------------------------------------------------|-----------------------------|
| `City` 非空                                          | `CityLevelAccuracy`         |
| `RegionCode` 非空 且 `City` 為空                   | `RegionLevelAccuracy`       |
| `CountryCode` 非空，`RegionCode` 與 `City` 皆為空       | `CountryLevelAccuracy`      |
| `DoNotGeolocate` (條目) 為 `true`                           | `DoNotGeolocate` (中繼資料) |

**請勿計入** 具有 `HasError: true` 的條目，或 `InvalidEntries` 分類中的條目。

代理程式 **必須不**：
- 重新命名欄位
- 新增或移除欄位
- 變更資料型別
- 重新排序鍵值
- 變更巢狀結構
- 包裹物件
- 分割為多個檔案

若數值未知，**請保持空白** — 絕不無中生有。

#### 結構與格式檢查

此階段驗證摘要是否格式良好且可解析。**關鍵結構錯誤**必須在調整程式分析地理定位品質之前解決。

##### CSV 結構

本小節定義 IP 地理定位摘要所使用的 **CSV 格式輸入檔案** 的規則。
目標是確保檔案能可靠地解析並標準化為 **一致的內部表示形式**。

- **CSV 結構檢查**
  - 若可用 `pandas`，請使用它進行 CSV 解析。
  - 否則，請退而使用 Python 內建的 `csv` 模組。

  - 確保 CSV 包含 **恰好 4 或 5 個邏輯欄位**，捨棄超出第五欄的任何欄位。
  - 允許註解行。
  - 標題列 **可能存在，也可能不存在**。
  - 若不存在標題列，請假設隱含的欄位順序：
    ```
    ip_prefix, alpha2code, region, city, postal code (已棄用)
    ```
  - 參考範例輸入檔案：
    [`assets/example/01-user-input-rfc8805-feed.csv`](assets/example/01-user-input-rfc8805-feed.csv)

- **CSV 清理與標準化**
  - 使用等同於下列作業的 Python 邏輯清理並標準化 CSV：
    - 僅選取 **前五欄**。
    - 以 **UTF-8 BOM** 寫入輸出檔案。

  - **註解**
    - 移除 **第一欄以 `#` 開頭** 的註解列。
    - 這同時也會移除以 `#` 開頭的標題列。
    - 使用 **1-based 行號** 作為鍵值，並以完整原始行作為值，建立一個註解對映。同時儲存空白行。
    - 將此對映儲存於 JSON 檔案：[`./run/data/comments.json`](./run/data/comments.json)
    - 範例：`{ "4": "# It's OK for small city states to leave state ISO2 code unspecified" }`

- **備註**
  - 兩種實作路徑 (`pandas` 與內建 `csv`) 必須使用 `utf-8-sig` 編碼寫入輸出，以確保含有 UTF-8 BOM。

#### IP 字首分析
  - 檢查每個條目中 `IPPrefix` 欄位是否存在且非空。
  - 檢查所有條目中是否有重複的 `IPPrefix` 值。
  - 若發現重複，請停止技能並向使用者回報：`偵測到重複的 IP 字首：{ip_prefix_value} 出現在第 {line_numbers} 行`
  - 若無重複，則繼續分析。

  - **檢查**
    - 每個子網段必須使用 `references/` 資料夾中的程式碼片段，乾淨地解析為 **IPv4 或 IPv6 網路**。
    - 子網段必須標準化並以 **CIDR 斜線標記法** 顯示。
      - 單一主機 IPv4 子網段必須表示為 **`/32`**。
      - 單一主機 IPv6 子網段必須表示為 **`/128`**。

  - **ERROR**
    - 回報下列條件為 **ERROR**：

    - **無效子網段語法**
      - 訊息 ID：`1102`

    - **非公開位址空間**
      - 適用於 **私有、迴路、連結本地、多點傳播或非公開** 的子網段
        - 在 Python 中，使用 `./references` 中顯示的 `is_private` 及相關位址屬性來偵測非公開範圍。
      - 訊息 ID：`1103`

  - **SUGGESTION**
    - 回報下列條件為 **SUGGESTION**：

    - **IPv6 子網段異常過大**
      - 短於 `/64` 的字首
      - 訊息 ID：`3102`

    - **IPv4 子網段異常過大**
      - 短於 `/22` 的字首
      - 訊息 ID：`3101`

#### 地理定位品質檢查

分析地理定位資料的 **準確性與一致性**：
  - 國家代碼
  - 地區代碼
  - 城市名稱
  - 已棄用的欄位

此階段在結構檢查通過後執行。

##### 國家代碼分析
  - 使用本地可用的資料表 [`ISO3166-1`](assets/iso3166-1.json) 進行檢查。
    - 具有 ISO 代碼的國家與領地 JSON 陣列
    - 每個物件包含：
      - `alpha_2`：兩字母國家代碼
      - `name`：國家短名稱
      - `flag`：國旗表情符號
    - 此檔案代表 RFC 8805 CSV 中有效 `CountryCode` 值的 **超集合**。
  - 對照 `alpha_2` 屬性檢查條目的 `CountryCode` (RFC 8805 第 2.1.1.2 節，`alpha2code` 欄)。
  - 範例程式碼可在 `references/` 目錄中找到。

  - 若在 [`assets/small-territories.json`](assets/small-territories.json) 中找到該國家，則在內部將該條目標記為小型領地。此旗標用於後續檢查與建議，但 **不會儲存於 JSON 輸出中** (它是暫時的驗證狀態)。

  - **注意：** `small-territories.json` 包含一些歷史/有爭議的代碼 (`AN`, `CS`, `XK`)，這些代碼不存在於 `iso3166-1.json` 中。若條目使用這些代碼作為 `CountryCode`，即使它是小型領地，也會導致國家代碼驗證失敗 (ERROR)。國家代碼 ERROR 優先 — 請勿根據小型領地旗標抑制錯誤。

  - **ERROR**
    - 回報下列條件為 **ERROR**：
    - **無效國家代碼**
      - 條件：`CountryCode` 存在但未在 `alpha_2` 集合中找到
      - 訊息 ID：`1201`

  - **SUGGESTION**
    - 回報下列條件為 **SUGGESTION**：

    - **子網段的地理定位未指定**
      - 條件：子網段的所有地理欄位 (`CountryCode`, `RegionCode`, `City`) 皆為空。
      - 動作： 
        - 將條目的 `DoNotGeolocate` 設定為 `true`。
        - 將條目的 `CountryCode` 設定為 `ZZ`。
      - 訊息 ID：`3104`


##### 地區代碼分析
  - 使用本地可用的資料表 [`ISO3166-2`](assets/iso3166-2.json) 進行檢查。
    - 具有 ISO 指定代碼的國家子區分 JSON 陣列
    - 每個物件包含：
      - `code`：附帶國家代碼前綴的子區分代碼 (例如 `US-CA`)
      - `name`：簡短子區分名稱
    - 此檔案代表 RFC 8805 CSV 中有效 `RegionCode` 值的 **超集合**。
  - 若提供了 `RegionCode` 值 (RFC 8805 第 2.1.1.3 節)：
    - 檢查格式是否符合 `{COUNTRY}-{SUBDIVISION}` (例如 `US-CA`, `AU-NSW`)。
    - 對照 `code` 屬性檢查該數值 (已包含國家代碼前綴)。

  - **小型領地例外：** 若條目為小型領地 **且** `RegionCode` 值等於條目的 `CountryCode` (例如新加坡的國家與地區代碼皆為 `SG`)，則視為該地區可接受 — 跳過該條目的所有地區驗證檢查。小型領地實際上是城市國家，沒有實質的 ISO 3166-2 行政區劃。

  - **ERROR**
    - 回報下列條件為 **ERROR**：
    - **無效地區格式**
      - 條件：`RegionCode` 不符合 `{COUNTRY}-{SUBDIVISION}` **且** 小型領地例外不適用
      - 訊息 ID：`1301`
    - **未知地區代碼**
      - 條件：未在 `code` 集合中找到 `RegionCode` 值 **且** 小型領地例外不適用
      - 訊息 ID：`1302`
    - **國家與地區不符**
      - 條件：`RegionCode` 的國家部分與 `CountryCode` 不符
      - 訊息 ID：`1303`

##### 城市名稱分析

  - 城市名稱僅使用 **啟發式檢查** 進行驗證。
  - 目前 **沒有** 可用於驗證城市名稱的權威資料集。

  - **ERROR**
    - 回報下列條件為 **ERROR**：
    - **預留位置或無意義的值**
      - 條件：預留位置或無意義的值，包含但不限於：
        - `undefined`
        - `Please select`
        - `null`
        - `N/A`
        - `TBD`
        - `unknown`
      - 訊息 ID：`1401`

    - **截斷名稱、縮寫或機場代碼**
      - 條件：不代表有效城市名稱的截斷名稱、縮寫或機場代碼：
        - `LA`
        - `Frft`
        - `sin01`
        - `LHR`
        - `SIN`
        - `MAA`
      - 訊息 ID：`1402`

  - **WARNING**
    - 回報下列條件為 **WARNING**：
    - **格式不一致或拼字問題**
      - 條件：可能降低資料品質的城市名稱格式不一致，例如：
        - `HongKong` 與 `Hong Kong`
        - 大小寫混合或使用非預期的指令碼
      - 訊息 ID：`2401`

##### 郵遞區號檢查
  - RFC 8805 第 2.1.1.5 節明確 **棄用郵遞區號或 ZIP 代碼**。
  - 郵遞區號可能代表極小的人口，且 **不被視為符合隱私標準**，不適合用於對映 IP 位址範圍 (本身具有統計特性)。

  - **ERROR**
    - 回報下列條件為 **ERROR**：
    - **存在郵遞區號**
      - 條件：郵遞區號/ZIP 代碼欄位中存在非空值。
      - 訊息 ID：`1501`

#### 調整與建議

此階段套用超出 RFC 8805 之外的 **專家建議**，這些建議是從實際的地理定位摘要部署中學到的，可改善準確性與可用性。

- **SUGGESTION**
  - 回報下列條件為 **SUGGESTION**：

  - **小型領地指定了地區或城市**
    - 條件：
      - 條目為小型領地
      - `RegionCode` 非空 **或**
      - `City` 非空。
    - 訊息 ID：`3301` (針對地區), `3402` (針對城市)

  - **指定城市時缺少地區代碼**
    - 條件：
      - `City` 非空
      - `RegionCode` 為空
      - 條目 **不是** 小型領地
    - 訊息 ID：`3303`

### 第 4 階段：調整資料查詢

#### 目標
使用 Fastah 的 `rfc8805-row-place-search` 工具查詢所有 `Entries`。

#### 執行規則
- 為負載產生產生一個新的 **指令碼** (讀取資料集並寫入一個或多個負載 JSON 檔案；請勿在此指令碼中呼叫 MCP)。
- 伺服器每個請求僅接受 1000 個條目，因此若超過 1000 個條目，請拆分為多個請求。
- 代理程式必須讀取產生的負載檔案，從中建構請求，並以每次至多 1000 個條目的批次將這些請求傳送至 MCP 伺服器。
- **針對 MCP 失敗：** 若 MCP 伺服器無法存取、回傳錯誤或任何批次皆未回傳結果，請記錄警告並繼續進行第 5 階段。將所有受影響條目的 `TunedEntry` 設定為 `{}`。請勿阻擋報表產生。請清楚通知使用者：`無法取得調整資料查詢；報表將僅顯示驗證結果。`
- 建議 **僅供參考** — **絕不要自動填入**。

#### 步驟 1：建立具有重複資料刪除功能的查詢負載

從以下路徑載入資料集：[./run/data/report-data.json](./run/data/report-data.json)
- 讀取 `Entries` 陣列。每個條目皆將用於建構 MCP 查詢負載。

透過刪除重複的條目來減少伺服器請求：
- 針對 `Entries` 中的每個條目，計算內容雜湊 (CountryCode + RegionCode + City 的雜湊)。
- 建立重複資料刪除對映：`{ contentHash -> { rowKey, payload, entryIndices: [] } }`。rowKey 是一個 UUID，將傳送至 MCP 伺服器以供比對回應。
- 若條目的雜湊已存在，將其在 `Entries` 中的 **0-based 陣列索引** 附加至該重複資料刪除條目的 `entryIndices` 陣列。
- 若雜湊為新，請產生一個 **UUID (rowKey)** 並建立新的重複資料刪除條目。

建構請求批次：
- 從對映中提取唯一條目，並保持重複資料刪除順序。
- 建構每個批次至多 1000 個項目的請求批次。
- 針對每個批次，保留如 `[{ rowKey, payload, entryIndices }, ...]` 的記憶體內結構，以透過 rowKey 將回應對映回原始索引。
- 寫入 MCP 負載檔案時，在每個負載物件中包含 `rowKey` 欄位：

```json
[
    {"rowKey": "550e8400-e29b-41d4-a716-446655440000", "countryCode":"CA","regionCode":"CA-ON","cityName":"Toronto"},
    {"rowKey": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "countryCode":"IN","regionCode":"IN-KA","cityName":"Bangalore"},
    {"rowKey": "6ba7b811-9dad-11d1-80b4-00c04fd430c8", "countryCode":"IN","regionCode":"IN-KA"}
]
```

- 讀取回應時，將每個回應的 `rowKey` 欄位匹配至對應的重複資料刪除條目，以擷取所有相關的 `entryIndices`。

規則：
- 寫入負載至：[./run/data/mcp-server-payload.json](./run/data/mcp-server-payload.json)
- 寫入負載後結束指令碼。

#### 步驟 2：呼叫 Fastah MCP 工具

- Fastah MCP 伺服器的 `mcp.json` 樣式設定範例如下：
```json
    "fastah-ip-geofeed": {
      "type": "http",
      "url": "https://mcp.fastah.ai/mcp"
    }
```
- 伺服器：`https://mcp.fastah.ai/mcp`
- 工具及其結構描述：在第一次 `tools/call` 之前，代理程式 **必須** 傳送 `tools/list` 請求以讀取 **`rfc8805-row-place-search`** 的輸入與輸出結構描述。
  使用探索到的結構描述作為欄位名稱、型別與限制的權威來源。
- 下列僅為說明範例；請隨時參考由 `tools/list` 回傳的結構描述：

  ```json
  [
      {"rowKey": "550e8400-...", "countryCode":"CA", ...},
      {"rowKey": "690e9301-...", "countryCode":"ZZ", ...}
  ]
- 開啟 [./run/data/mcp-server-payload.json](./run/data/mcp-server-payload.json) 並傳送所有已進行重複資料刪除的條目及其 rowKeys。
- 若重複資料刪除後有超過 1000 個條目，請將其拆分為每次至多 1000 個條目的多個請求。
- 伺服器將在每次回應中回傳相同的 `rowKey` 欄位以供對映。
- 請勿使用本地資料。

#### 步驟 3：將調整資料附加至條目

- 產生一個用於附加調整資料的新 **指令碼**。
- 載入 [./run/data/report-data.json](./run/data/report-data.json) 與重複資料刪除對映 (從步驟 1 記憶體中保留，或從負載檔案重新導出)。
- 針對來自 MCP 伺服器的每項回應：
  - 從回應中提取 `rowKey`。
  - 從重複資料刪除對映中查找與該 `rowKey` 相關聯的 `entryIndices` 陣列。
  - 針對該 `entryIndices` 中的每個索引，將最佳比對結果附加至 `Entries[index]`。
- 當有可用資料時，使用來自回應的 **第一項 (最佳) 比對結果**。

若該欄位不存在，則在每個受影響的條目上建立該欄位。將 MCP API 回應鍵對映為 Go 結構欄位名稱：

```json
"TunedEntry": {
  "Name": "",
  "CountryCode": "",
  "RegionCode": "",
  "PlaceType": "",
  "H3Cells": [],
  "BoundingBox": []
}
```

`TunedEntry` 欄位是一個 **單一物件** (非陣列)。它持有來自 MCP 伺服器的最佳比對結果。

**MCP 回應鍵 → JSON 鍵對映：**
| MCP API 回應鍵 | JSON 鍵                   |
|----------------------|----------------------------|
| `placeName`          | `Name`                     |
| `countryCode`        | `CountryCode`              |
| `stateCode`          | `RegionCode`               |
| `placeType`          | `PlaceType`                |
| `h3Cells`            | `H3Cells`                  |
| `boundingBox`        | `BoundingBox`              |

UUID 未匹配的條目 (即 MCP 伺服器針對其 UUID 未回傳回應) 必須收到一個空的 `TunedEntry: {}` 物件 — 絕不要遺漏此欄位。

- 將資料集寫回至：[./run/data/report-data.json](./run/data/report-data.json)
- 規則：
  - 維護所有現有的驗證旗標。
  - 請勿建立額外的中介檔案。


### 第 5 階段：產生調整報表

透過讀取 `./scripts/templates/index.html` 範本，並使用 `./run/data/report-data.json` 與 `./run/data/comments.json` 中的資料來渲染，以產生 **自包含的 HTML 報表**。

將完成的報表寫入 `./run/report/geofeed-report.html`。產生後，嘗試在系統預設瀏覽器 (例如 `webbrowser.open()`) 中開啟。若在無頭環境、CI 管線或沒有瀏覽器的遠端容器中執行，請跳過瀏覽器步驟，改為向使用者呈現檔案路徑，以便他們能開啟或下載。

**該範本使用 Go `html/template` 語法** (`{{.Field}}`, `{{range}}`, `{{if eq}}` 等)。撰寫一個 Python 指令碼來讀取範本、從 JSON 資料檔案建構渲染內容，並在渲染時處理範本預留位置以產生最終 HTML。請勿修改範本檔案本身 — 所有處理皆在渲染時間於 Python 指令碼中進行。

#### 步驟 1：取代中繼資料預留位置

使用 `report-data.json` 中的對應數值取代範本中的每個 `{{.Metadata.X}}` 預留位置。由於 JSON 鍵與範本預留位置相符，對映是直接的 — `{{.Metadata.InputFile}}` 對映至 `InputFile` JSON 鍵，以此類推。

| 範本預留位置                   | JSON 鍵 (`report-data.json`)     |
|----------------------------------------|-----------------------------------|
| `{{.Metadata.InputFile}}`              | `InputFile`                       |
| `{{.Metadata.Timestamp}}`              | `Timestamp`                       |
| `{{.Metadata.TotalEntries}}`           | `TotalEntries`                    |
| `{{.Metadata.IpV4Entries}}`            | `IpV4Entries`                     |
| `{{.Metadata.IpV6Entries}}`            | `IpV6Entries`                     |
| `{{.Metadata.InvalidEntries}}`         | `InvalidEntries`                  |
| `{{.Metadata.Errors}}`                 | `Errors`                          |
| `{{.Metadata.Warnings}}`               | `Warnings`                        |
| `{{.Metadata.Suggestions}}`            | `Suggestions`                     |
| `{{.Metadata.OK}}`                     | `OK`                              |
| `{{.Metadata.CityLevelAccuracy}}`      | `CityLevelAccuracy`               |
| `{{.Metadata.RegionLevelAccuracy}}`    | `RegionLevelAccuracy`             |
| `{{.Metadata.CountryLevelAccuracy}}`   | `CountryLevelAccuracy`            |
| `{{.Metadata.DoNotGeolocate}}`         | `DoNotGeolocate` (中繼資料)       |

**關於 `{{.Metadata.Timestamp}}` 的說明：** 此預留位置出現在 JavaScript `new Date(...)` 呼叫內。請使用原始數值取代它 (在 `<script>` 內的數值常值無需 HTML 跳脫)。所有其他中繼資料數值皆應進行 HTML 跳脫，因為它們出現在 HTML 元素文字內。

#### 步驟 2：取代註解對映預留位置

在範本中定位此模式：
```javascript
const commentMap = {{.Comments}};
```

使用 `./run/data/comments.json` 中的序列化 JSON 物件取代 `{{.Comments}}`。該 JSON 直接嵌入為 JavaScript 物件常值 (非字串內)，因此無需額外跳脫：

```python
comments_json = json.dumps(comments)
template = template.replace("{{.Comments}}", comments_json)
```

#### 步驟 3：展開 Entries 範圍區塊

範本在 `<tbody id="entriesTableBody">` 內包含一個 `{{range .Entries}}...{{end}}` 區塊。請依下列方式處理：

1. **提取** 使用正規表示式的範圍區塊本體。**關鍵：** 該區塊包含巢狀的 `{{end}}` 標籤 (來自 `{{if eq .Status ...}}`, `{{if .Checked}}`, 與 `{{range .Messages}}`)。貪婪性不足的匹配 (如 `\{\{range \.Entries\}\}(.*?)\{\{end\}\}`) 將匹配到 **第一個** 內部 `{{end}}`，從而截斷區塊。請將外部 `{{end}}` 錨定到緊隨其後的 `</tbody>`：
    ```python
    m = re.search(
        r'\{\{range \.Entries\}\}(.*?)\{\{end\}\}\s*</tbody>',
        template,
        re.DOTALL,
    )
    entry_body = m.group(1)  # 單一條目迭代的範本文字
    ```
    這確保您能擷取完整的區塊本體，包含所有三個 `<tr>` 列以及巢狀的 `{{range .Messages}}...{{end}}`。
2. **迭代** `report-data.json` 的 `Entries` 陣列中的每個條目。
3. **展開** 每個條目的區塊本體 (依下方處理順序)。
4. **取代** 整個符合項目 (從 `{{range .Entries}}` 到 `</tbody>`) 為串接後的展開 HTML，後接 `</tbody>`。

**每個條目的處理順序** (最內層結構優先以避免 `{{end}}` 混淆)：
1. 評估 `{{if eq .Status ...}}...{{end}}` 條件 (狀態標記 CSS 類別與圖示)。
2. 評估 `{{if .Checked}}...{{end}}` 條件 (訊息核取方塊)。
3. 展開 `{{range .Messages}}...{{end}}` 內部範圍。
4. 取代簡單的 `{{.Field}}` 預留位置。

**條目欄位對映：**

範圍區塊本體內，針對每個條目取代下列預留位置。由於 JSON 鍵符合範本預留位置，範本預留位置 `{{.X}}` 直接對映至 JSON 鍵 `X`：

| 範本預留位置           | JSON 鍵 (`Entries[]`)       | 備註                                                        |
|--------------------------------|------------------------------|--------------------------------------------------------------|
| `{{.Line}}`                    | `Line`                       | 直接整數值                                         |
| `{{.IPPrefix}}`                | `IPPrefix`                   | HTML 跳脫                                                 |
| `{{.CountryCode}}`             | `CountryCode`                | HTML 跳脫                                                 |
| `{{.RegionCode}}`              | `RegionCode`                 | HTML 跳脫                                                 |
| `{{.City}}`                    | `City`                       | HTML 跳脫                                                 |
| `{{.Status}}`                  | `Status`                     | HTML 跳脫                                                 |
| `{{.HasError}}`                | `HasError`                   | 小寫字串：`"true"` 或 `"false"`                      |
| `{{.HasWarning}}`              | `HasWarning`                 | 小寫字串：`"true"` 或 `"false"`                      |
| `{{.HasSuggestion}}`           | `HasSuggestion`              | 小寫字串：`"true"` 或 `"false"`                      |
| `{{.GeocodingHint}}`           | `GeocodingHint`              | 空字串 `""`                                            |
| `{{.DoNotGeolocate}}`          | `DoNotGeolocate`             | `"true"` 或 `"false"`                                        |
| `{{.Tunable}}`                 | `Tunable`                    | `"true"` 或 `"false"`                                        |
| `{{.TunedEntry.CountryCode}}`  | `TunedEntry.CountryCode`     | 若 `TunedEntry` 為空 `{}` 則為 `""`                           |
| `{{.TunedEntry.RegionCode}}`   | `TunedEntry.RegionCode`      | 若 `TunedEntry` 為空 `{}` 則為 `""`                           |
| `{{.TunedEntry.Name}}`         | `TunedEntry.Name`            | 若 `TunedEntry` 為空 `{}` 則為 `""`                           |
| `{{.TunedEntry.H3Cells}}`      | `TunedEntry.H3Cells`         | 括號包裹之空格分隔值；若為空則為 `"[]"` (請參閱下方格式) |
| `{{.TunedEntry.BoundingBox}}`  | `TunedEntry.BoundingBox`     | 括號包裹之空格分隔值；若為空則為 `"[]"` (請參閱下方格式) |

**`data-h3-cells` 與 `data-bounding-box` 格式：** 這些 **不是 JSON 陣列**。它們是括號包裹、空格分隔的數值。請 **不要** 使用 JSON 序列化 (字串元素周圍無引號，數字間無逗號)。範例：
- `[836752fffffffff 836755fffffffff]` — 正確
- `["836752fffffffff","836755fffffffff"]` — **錯誤**，引號會導致解析失敗
- `[-71.70 10.73 -71.52 10.55]` — 正確
- `[]` — 空值正確格式

##### 評估狀態條件

**在取代簡單 `{{.Field}}` 預留位置「之前」處理這些** — 否則巢狀的 `{{end}}` 標籤會被耗用，導致正規表示式無法匹配。

範本針對狀態標記 CSS 類別與圖示使用 `{{if eq .Status "..."}}` 條件。透過檢查條目的 `status` 值並僅保留匹配的分支文字來評估這些項目。

狀態標記列包含單行上的 **兩個** `{{if eq .Status ...}}...{{end}}` 區塊 — 一個用於 CSS 類別，一個用於圖示。使用具有回呼的 `re.sub` 來解析所有出現的地方：

```python
STATUS_CSS = {"ERROR": "error", "WARNING": "warning", "SUGGESTION": "suggestion", "OK": "ok"}
STATUS_ICON = {
    "ERROR": "bi-x-circle-fill",
    "WARNING": "bi-exclamation-triangle-fill",
    "SUGGESTION": "bi-lightbulb-fill",
    "OK": "bi-check-circle-fill",
}

def resolve_status_if(match_obj, status):
    """從 {{if eq .Status ...}}...{{end}} 區塊中挑選匹配 `status` 的分支。"""
    block = match_obj.group(0)
    # 嘗試每個分支：{{if eq .Status "X"}}val{{else if ...}}val{{else}}val{{end}}
    for st, val in [("ERROR",), ("WARNING",), ("SUGGESTION",)]:
        # 不需泛型解析 — 僅從已知模式對映
    ...
```

更簡單的方法：由於只有兩種已知模式，請將它們視為文字字串取代：
```python
css_class = STATUS_CSS.get(status, "ok")
icon_class = STATUS_ICON.get(status, "bi-check-circle-fill")
body = body.replace(
    '{{if eq .Status "ERROR"}}error{{else if eq .Status "WARNING"}}warning{{else if eq .Status "SUGGESTION"}}suggestion{{else}}ok{{end}}',
    css_class,
)
body = body.replace(
    '{{if eq .Status "ERROR"}}bi-x-circle-fill{{else if eq .Status "WARNING"}}bi-exclamation-triangle-fill{{else if eq .Status "SUGGESTION"}}bi-lightbulb-fill{{else}}bi-check-circle-fill{{end}}',
    icon_class,
)
```
這完全避免了正規表示式，且因為這些確切字串出現在範本中，因此是安全的。

#### 步驟 4：展開巢狀訊息範圍

`{{range .Messages}}...{{end}}` 區塊包含一個 **巢狀的** `{{if .Checked}} checked{{else}} disabled{{end}}` 條件，因此其內部的 `{{end}}` 會導致簡單的非貪婪正規表示式過早匹配。請將正規表示式錨定到 `</td>` (訊息範圍結束 `{{end}}` 後緊接著的標籤) 以擷取完整的區塊本體：

```python
msg_match = re.search(
    r'\{\{range \.Messages\}\}(.*?)\{\{end\}\}\s*(?=</td>)',
    body, re.DOTALL
)
```

先行查詢 `(?=</td>)` 確保正規表示式跳過核取方塊條件的 `{{end}}` (後面接著 `>` 而非 `</td>`)，並僅匹配範圍結束的 `{{end}}` (後面接著空格，然後是 `</td>`)。

針對條目的 `Messages` 陣列中的每則訊息，複製區塊本體並展開：

1. **解析每則訊息的核取方塊條件** (必須在簡單預留位置取代前執行，以移除巢狀 `{{end}}`)：
   ```python
   if msg.get("Checked"):
       msg_body = msg_body.replace(
           '{{if .Checked}} checked{{else}} disabled{{end}}', ' checked'
       )
   else:
       msg_body = msg_body.replace(
           '{{if .Checked}} checked{{else}} disabled{{end}}', ' disabled'
       )
   ```

2. **取代訊息欄位預留位置**：

   | 範本預留位置 | 來源                            | 備註                          |
   |--------------------------|-----------------------------------|--------------------------------|
   | `{{.ID}}`                | `Messages[i].ID`                  | 直接 JSON 字串值  |
   | `{{.Text}}`              | `Messages[i].Text`                | HTML 跳脫                   |

3. **串接** 所有展開後的訊息區塊，並以結果取代原始的 `{{range .Messages}}...{{end}}` 匹配項目 (`msg_match.group(0)`)：
   ```python
   body = body[:msg_match.start()] + "".join(expanded_msgs) + body[msg_match.end():]
   ```

若 `Messages` 為空，請以空字串取代整個匹配區域 (無訊息 div — 僅保留問題標頭)。

#### 輸出保證

- 報表必須能在任何現代瀏覽器中閱讀，且無需額外網路依賴 (CDN 連結已在範本中提供：`leaflet`, `h3-js`, `bootstrap-icons`, Raleway 字型)。
- 嵌入 HTML 的所有數值必須 **HTML 跳脫** (`<`, `>`, `&`, `"`) 以防止呈現問題。
- `commentMap` 嵌入為直接 JavaScript 物件常值 (非字串內)，因此無需 JS 字串跳脫 — 只需發出有效的 JSON。
- 所有數值必須 **僅由分析輸出產生**，不得啟發式重新計算。


### 第 6 階段：最終審查

在向使用者呈現結果之前，使用具體、可檢查的斷言執行最後的驗證。

**檢查 1 — 條目計數完整性**
- 計算原始輸入 CSV 中的非註解、非空白資料列。
- 斷言：`len(entries) in report-data.json == data_row_count`
- 失敗時：`行數不符：輸入有 {N} 個資料列，但報表包含 {M} 個條目。`

**檢查 2 — 摘要計數器完整性**
- 這些計數器基於布林旗標進行 **互斥**，這反映了最高嚴重性的 `Status` 欄位。具有 `HasError: true` 與 `HasWarning: true` 的條目僅計入 `Errors`，絕不計入 `Warnings`。這等同於依條目的 `Status` 欄位計數。
- 斷言下列所有項目；在產生報表前修正任何失敗的項目：
  - `Errors == sum(1 for e in Entries if e['HasError'])`
  - `Warnings == sum(1 for e in Entries if e['HasWarning'] and not e['HasError'])`
  - `Suggestions == sum(1 for e in Entries if e['HasSuggestion'] and not e['HasError'] and not e['HasWarning'])`
  - `OK == sum(1 for e in Entries if not e['HasError'] and not e['HasWarning'] and not e['HasSuggestion'])`
  - `Errors + Warnings + Suggestions + OK == TotalEntries - InvalidEntries`

**檢查 3 — 準確性分類完整性**
- 斷言：`CityLevelAccuracy + RegionLevelAccuracy + CountryLevelAccuracy + DoNotGeolocate == TotalEntries - InvalidEntries`
- **注意：** 第 3 階段定義的準確性分類表示「不計入 `HasError: true` 的條目」，但上述檢查 3 公式使用 `TotalEntries - InvalidEntries` (其中仍包含 ERROR 條目)。這表示 ERROR 條目 (那些解析為有效 IP 但驗證失敗的條目) **確實** 依據地理欄位存在與否計入準確性分類。僅 `InvalidEntries` (無法解析的 IP 字首) 被排除。請依循檢查 3 公式作為權威規則。
- 失敗時，請追蹤並修正分類邏輯後再進行。

**檢查 4 — 沒有重複行號**
- 斷言：`Entries` 中的所有 `Line` 數值皆唯一。
- 失敗時，向使用者回報重複的行號。

**檢查 5 — TunedEntry 完整性**
- 斷言：`Entries` 中的每個物件皆包含 `TunedEntry` 鍵 (即使值為 `{}`)。
- 失敗時，將 `"TunedEntry": {}` 新增至遺失該鍵的任何條目，然後重新儲存 `report-data.json`。

**檢查 6 — 報表檔案存在且非空**
- 確認已寫入 `./run/report/geofeed-report.html` 且檔案大小大於零位元組。
- 失敗時，請在向使用者呈現前重新產生報表。
