---
name: nuget-manager
description: '管理 .NET 專案/解決方案中的 NuGet 套件。當要新增、移除或更新 NuGet 套件版本時，請使用此技能。它強制使用 `dotnet` CLI 進行套件管理，並規定僅在更新版本時才能直接編輯檔案，並提供嚴格的操作程序。'
---

# NuGet 管理員 (NuGet Manager)

## 總覽

此技能可確保 .NET 專案中 NuGet 套件管理的一致性與安全性。它優先使用 `dotnet` CLI 以維護專案完整性，並針對版本更新執行嚴格的驗證與還原工作流程。

## 先決條件

- 已安裝 .NET SDK (通常為 .NET 8.0 SDK 或更高版本，或與目標解決方案相容的版本)。
- `PATH` 中可使用 `dotnet` CLI。
- `jq` (JSON 處理器) 或 PowerShell (用於使用 `dotnet package search` 進行版本驗證)。

## 核心規則

1.  **絕對不要**直接編輯 `.csproj`、`.props` 或 `Directory.Packages.props` 檔案來**新增**或**移除**套件。務必使用 `dotnet add package` 和 `dotnet remove package` 指令。
2.  **僅限**在**變更現有套件版本**時才允許**直接編輯**檔案。
3.  **版本更新**必須遵循以下強制性工作流程：
    - 驗證目標版本是否存在於 NuGet 上。
    - 確定版本是由各個專案單獨管理 (`.csproj`) 還是集中管理 (`Directory.Packages.props`)。
    - 在適當的檔案中更新版本字串。
    - 立即執行 `dotnet restore` 以驗證相容性。

## 工作流程

### 新增套件
使用 `dotnet add [<PROJECT>] package <PACKAGE_NAME> [--version <VERSION>]`。
範例：`dotnet add src/MyProject/MyProject.csproj package Newtonsoft.Json`

### 移除套件
使用 `dotnet remove [<PROJECT>] package <PACKAGE_NAME>`。
範例：`dotnet remove src/MyProject/MyProject.csproj package Newtonsoft.Json`

### 更新套件版本
更新版本時，請遵循下列步驟：

1.  **驗證版本是否存在**：
    使用 `dotnet package search` 指令搭配完全比對與 JSON 格式來檢查版本是否存在。
    使用 `jq`：
    `dotnet package search <PACKAGE_NAME> --exact-match --format json | jq -e '.searchResult[].packages[] | select(.version == "<VERSION>")'`
    使用 PowerShell：
    `(dotnet package search <PACKAGE_NAME> --exact-match --format json | ConvertFrom-Json).searchResult.packages | Where-Object { $_.version -eq "<VERSION>" }`
    
2.  **確定版本管理方式**：
    - 在解決方案根目錄搜尋 `Directory.Packages.props`。如果存在，則應透過 `<PackageVersion Include="Package.Name" Version="1.2.3" />` 在該處管理版本。
    - 如果不存在，請檢查個別的 `.csproj` 檔案中的 `<PackageReference Include="Package.Name" Version="1.2.3" />`。

3.  **套用變更**：
    使用新的版本字串修改識別出的檔案。

4.  **驗證穩定性**：
    在專案或解決方案上執行 `dotnet restore`。如果發生錯誤，請還原變更並進行調查。

## 範例

### 使用者：「將 Serilog 新增到 WebApi 專案」
**操作**：執行 `dotnet add src/WebApi/WebApi.csproj package Serilog`。

### 使用者：「將整個解決方案中的 Newtonsoft.Json 更新為 13.0.3」
**操作**：
1. 驗證 13.0.3 是否存在：`dotnet package search Newtonsoft.Json --exact-match --format json` (並解析輸出以確認「13.0.3」存在)。
2. 尋找其定義位置 (例如：`Directory.Packages.props`)。
3. 編輯檔案以更新版本。
4. 執行 `dotnet restore`。
