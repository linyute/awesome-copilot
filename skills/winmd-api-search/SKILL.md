---
name: winmd-api-search
description: '尋找並探索 Windows 桌面 API。在建構需要平台能力的特性時使用 —— 如相機、檔案存取、通知、UI 控制項、AI/ML、感測器、網路等。探索適用於特定任務的 API 並獲取完整的類型細節 (方法、屬性、事件、列舉值)。'
license: 完整條款請參閱 LICENSE.txt
---

# WinMD API 搜尋 (WinMD API Search)

此技能協助您尋找適用於任何能力的 Windows API 並獲取其完整細節。它會搜尋包含下列來源所有 WinMD Metadata 的本機快取：

- **Windows Platform SDK** —— 所有 `Windows.*` WinRT API (始終可用，無需還原)
- **WinAppSDK / WinUI** —— 作為快取產生器中的基準內容隨附 (始終可用，無需還原)
- **NuGet 套件** —— 已還原專案中任何包含 `.winmd` 檔案的其他套件
- **專案輸出的 WinMD** —— 產生 `.winmd` 作為建構輸出的類別庫 (C++/WinRT, C#)

即使是在沒有進行還原或建構的全新複製 (clone) 環境中，您仍可獲得完整的 Platform SDK + WinAppSDK 涵蓋範圍。

## 何時使用此技能 (When to Use This Skill)

- 使用者想要建構一項特性，而您需要尋找哪個 API 提供該能力
- 使用者詢問「我該如何執行 X？」，其中 X 涉及平台特性 (相機、檔案、通知、感測器、AI 等)
- 在撰寫程式碼前，您需要類型的確切方法、屬性、事件或列舉值
- 您不確定在 UI 或系統任務中該使用哪個控制項、類別或介面

## 前置作業 (Prerequisites)

- **.NET SDK 8.0 或更新版本** —— 建構快取產生器所需。若未安裝，請從 [dotnet.microsoft.com](https://dotnet.microsoft.com/download) 下載。

## 快取設定 (首次使用前必須執行) (Cache Setup (Required Before First Use))

所有查詢與搜尋指令皆讀取自本機 JSON 快取。**在執行任何查詢之前，您必須先產生快取。**

```powershell
# 針對儲存庫中的所有專案 (建議首次執行時使用)
.\.github\skills\winmd-api-search\scripts\Update-WinMdCache.ps1

# 針對單一專案
.\.github\skills\winmd-api-search\scripts\Update-WinMdCache.ps1 -ProjectDir <專案資料夾>
```

基準涵蓋範圍 (Platform SDK + WinAppSDK) 不需要專案還原或建構。對於額外的 NuGet 套件，專案需要執行 `dotnet restore` (這會產生 `project.assets.json`) 或具備 `packages.config` 檔案。

快取儲存於 `Generated Files\winmd-cache\`，並按「套件+版本」進行去重處理。

### 哪些內容會被索引 (What gets indexed)

| 來源 | 何時可用 |
|--------|----------------|
| Windows Platform SDK | 始終可用 (從本機 SDK 安裝路徑讀取) |
| WinAppSDK (最新版) | 始終可用 (作為基準隨附於快取產生器中) |
| WinAppSDK 執行階段 | 當系統已安裝時 (透過 `Get-AppxPackage` 偵測) |
| 專案 NuGet 套件 | 執行 `dotnet restore` 之後或具備 `packages.config` 時 |
| 專案輸出的 `.winmd` | 專案建構之後 (產生 WinMD 的類別庫) |

> **註：** 此快取目錄應加入 `.gitignore` —— 它是產生的檔案，而非原始碼。

## 如何使用 (How to Use)

根據情況選擇對應的路徑：

---

### 探索 —— 「我不知道該使用哪個 API」 (Discover — "I don't know which API to use")

使用者用自己的話描述一項能力。您需要找到正確的 API。

**0. 確保快取存在**

如果快取尚未產生，請先執行 `Update-WinMdCache.ps1` —— 參見上方的 [快取設定](#快取設定-首次使用前必須執行)。

**1. 翻譯使用者語言 → 搜尋關鍵字**

將使用者的日常語言對應到程式設計術語。嘗試多種變化：

| 使用者描述 | 建議嘗試的搜尋關鍵字 (依序) |
|-----------|-----------------------------------|
| 「拍一張照片」 | `camera`, `capture`, `photo`, `MediaCapture` |
| 「從磁碟載入」 | `file open`, `picker`, `FileOpen`, `StorageFile` |
| 「描述其中的內容」 | `image description`, `Vision`, `Recognition` |
| 「顯示彈出視窗」 | `dialog`, `flyout`, `popup`, `ContentDialog` |
| 「拖放」 | `drag`, `drop`, `DragDrop` |
| 「儲存設定」 | `settings`, `ApplicationData`, `LocalSettings` |

先從簡單的日常單字開始。如果結果不佳或不相關，再嘗試更具技術性的變化。

**2. 執行搜尋**

```powershell
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action search -Query "<關鍵字>"
```

這會回傳排序後的命名空間，以及首選匹配類型與 **JSON 檔案路徑**。

如果結果 **分數較低 (低於 60) 或不相關**，請改為搜尋線上文件：

1. 使用網頁搜尋在 Microsoft Learn 上尋找正確的 API，例如：
   - `site:learn.microsoft.com/uwp/api <能力關鍵字>` 搜尋 `Windows.*` API
   - `site:learn.microsoft.com/windows/windows-app-sdk/api/winrt <能力關鍵字>` 搜尋 `Microsoft.*` WinAppSDK API
2. 閱讀文件頁面以識別哪個類型符合使用者需求。
3. 確定類型名稱後，回到此處使用 `-Action members` 或 `-Action enums` 獲取確切的本機簽章。

**3. 讀取 JSON 以選擇正確的 API**

讀取搜尋結果中提供的路徑檔案。該 JSON 包含該命名空間中的所有類型 —— 完整的成員、簽章、參數、回傳類型與列舉值。

閱讀並決定哪些類型與成員符合使用者需求。

**4. 查閱官方文件獲取背景資訊**

快取僅包含簽章 —— 不包含說明或使用指引。如需解釋、範例與備註，請在 Microsoft Learn 上查閱該類型：

| 命名空間前綴 | 文件基準 URL |
|-----------------|----------------------|
| `Windows.*` | `https://learn.microsoft.com/uwp/api/{完整類型的完整名稱}` |
| `Microsoft.*` (WinAppSDK) | `https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/{完整類型的完整名稱}` |

例如，`Microsoft.UI.Xaml.Controls.NavigationView` 對應至：
`https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.navigationview`

**5. 利用 API 知識回答問題或撰寫程式碼**

---

### 查閱 —— 「我知道 API，向我顯示細節」 (Lookup — "I know the API, show me the details")

您已經知道 (或懷疑) 類型或命名空間名稱。直接查閱：

```powershell
# 獲取已知類型的所有成員
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action members -TypeName "Microsoft.UI.Xaml.Controls.NavigationView"

# 獲取列舉值
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action enums -TypeName "Microsoft.UI.Xaml.Visibility"

# 列出命名空間中的所有類型
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action types -Namespace "Microsoft.UI.Xaml.Controls"

# 瀏覽命名空間
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action namespaces -Filter "Microsoft.UI"
```

如果您需要比 `-Action members` 顯示內容更完整的細節，請使用 `-Action search` 獲取 JSON 檔案路徑，然後直接讀取該 JSON 檔案。

---

### 其他指令 (Other Commands)

```powershell
# 列出已快取的專案
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action projects

# 列出專案的套件
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action packages

# 顯示統計數據
.\.github\skills\winmd-api-search\scripts\Invoke-WinMdQuery.ps1 -Action stats
```

> 如果僅快取了一個專案，系統會自動選取 `-Project`。
> 如果存在多個專案，請加上 `-Project <名稱>` (使用 `-Action projects` 查看可用名稱)。
> 在掃描模式下，資訊清單名稱會包含短雜湊後綴以避免衝突；若名稱無歧義，您可以傳遞不含後綴的基本專案名稱。

## 搜尋評分 (Search Scoring)

搜尋會根據您的查詢對類型名稱與成員名稱進行排名：

| 分數 | 匹配類型 | 範例 |
|-------|-----------|---------|
| 100 | 完全匹配 | `Button` → `Button` |
| 80 | 開頭匹配 | `Navigation` → `NavigationView` |
| 60 | 包含字串 | `Dialog` → `ContentDialog` |
| 50 | PascalCase 字首 | `ASB` → `AutoSuggestBox` |
| 40 | 多關鍵字「且 (AND)」匹配 | `navigation item` → `NavigationViewItem` |
| 20 | 模糊字元匹配 | `NavVw` → `NavigationView` |

結果按命名空間分組。評分較高的命名空間會優先顯示。

## 疑難排解 (Troubleshooting)

| 問題 | 修正方法 |
|-------|-----|
| 「找不到快取 (Cache not found)」 | 執行 `Update-WinMdCache.ps1` |
| 「快取了多個專案」 | 加入 `-Project <名稱>` |
| 「找不到命名空間」 | 使用 `-Action namespaces` 列出可用的命名空間 |
| 「找不到類型」 | 使用完整限定名稱 (例如：`Microsoft.UI.Xaml.Controls.Button`) |
| NuGet 更新後快取過期 | 重新執行 `Update-WinMdCache.ps1` |
| 快取出現在 Git 歷史中 | 將 `Generated Files/` 加入 `.gitignore` |

## 參考資料 (References)

- [Windows Platform SDK API 參考](https://learn.microsoft.com/uwp/api/) —— `Windows.*` 命名空間的文件
- [Windows App SDK API 參考](https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/) —— `Microsoft.*` WinAppSDK 命名空間的文件
