# 編譯語言的 CodeQL 建構模式

關於 CodeQL 如何處理編譯語言分析的詳細參考，包括建構模式、自動建構行為、執行器要求和硬體規格。

## 建構模式概觀

CodeQL 為編譯語言提供三種建構模式：

| 模式 | 描述 | 何時使用 |
|---|---|---|
| `none` | 在不建構的情況下分析原始碼。透過啟發式推斷相依性。 | 預設設定；快速掃描；類似直譯式的分析 |
| `autobuild` | 自動偵測並執行建構系統。 | 當 `none` 產生的結果不準確時；存在 Kotlin 程式碼時 |
| `manual` | 使用者提供明確的建構指令。 | 複雜的建構系統；自動建構失敗；自訂建構需求 |

## C/C++

### 支援的建構模式
`none`、`autobuild`、`manual`

**預設設定模式：** `none`

### 不建構 (`none`)
- 透過原始程式檔副檔名推斷編譯單元
- 透過檢查程式碼庫推斷編譯旗標和包含路徑 (Include paths)
- 不需要正常運作的建構指令

**準確性考量：**
- 如果程式碼嚴重依賴現有標頭檔中不存在的自訂巨集/定義，則準確性可能會較低
- 當程式碼庫有許多外部相依性時，準確性可能會受損

**提高準確性：**
- 將自訂巨集/定義置於原始程式檔包含的標頭檔中
- 確保外部相依性 (標頭檔) 在系統包含目錄或工作區中可用
- 在目標平台上執行擷取 (例如：為 Windows 專案使用 Windows 執行器)

### 自動建構 (Autobuild)

**Windows 自動偵測：**
1. 在最接近根目錄處對 `.sln` 或 `.vcxproj` 呼叫 `MSBuild.exe`
2. 如果在相同深度有多個檔案，則嘗試建構所有檔案
3. 回退至建構指令碼：`build.bat`、`build.cmd`、`build.exe`

**Linux/macOS 自動偵測：**
1. 在根目錄中尋找建構系統
2. 如果找不到，則在子目錄中搜尋唯一的建構系統
3. 執行適當的組態/建構指令

**支援的建構系統：** MSBuild、Autoconf、Make、CMake、qmake、Meson、Waf、SCons、Linux Kbuild、建構指令碼

### 執行器要求 (C/C++)
- **Ubuntu：** `gcc` 編譯器；可能需要 `clang` 或 `msvc`。建構工具：`msbuild`、`make`、`cmake`、`bazel`。公用程式：`python`、`perl`、`lex`、`yacc`。
- **自動安裝相依性：** 設定 `CODEQL_EXTRACTOR_CPP_AUTOINSTALL_DEPENDENCIES=true` (在 GitHub 代管的執行器上預設啟用；在自行裝載的執行器上停用)。需要具備無密碼 `sudo apt-get` 的 Ubuntu。
- **Windows：** PATH 中需有 `powershell.exe`

## C\#

### 支援的建構模式
`none`、`autobuild`、`manual`

**預設設定模式：** `none`

### 不建構 (`none`)
- 使用來自以下位置的啟發式方法還原相依性：`*.csproj`、`*.sln`、`nuget.config`、`packages.config`、`global.json`、`project.assets.json`
- 如果已為組織設定，則使用私人 NuGet 摘要 (Feed)
- 為提高準確性而產生額外的原始程式檔：
  - 全域 `using` 指示詞 (隱含 `using` 功能)
  - ASP.NET Core `.cshtml` → `.cs` 轉換

**準確性考量：**
- 需要網際網路存取或私人 NuGet 摘要
- 同一 NuGet 相依性的多個版本可能會導致問題 (CodeQL 會挑選較新的版本)
- 多個 .NET framework 版本可能會影響準確性
- 類別名稱衝突會導致遺失核心呼叫目標

### 自動建構 (Autobuild)

**Windows 自動偵測：**
1. 在最接近根目錄處對 `.sln` 或 `.csproj` 執行 `dotnet build`
2. 在解決方案/專案檔案上執行 `MSBuild.exe`
3. 建構指令碼：`build.bat`、`build.cmd`、`build.exe`

**Linux/macOS 自動偵測：**
1. 在最接近根目錄處對 `.sln` 或 `.csproj` 執行 `dotnet build`
2. 在解決方案/專案檔案上執行 `MSbuild`
3. 建構指令碼：`build`、`build.sh`

### 注入的編譯器旗標 (手動建構)

CodeQL 追蹤器會將這些旗標注入 C# 編譯器呼叫中：

| 旗標 | 用途 |
|---|---|
| `/p:MvcBuildViews=true` | 針對安全性分析預編譯 ASP.NET MVC 檢視表 |
| `/p:UseSharedCompilation=false` | 停用共用編譯伺服器 (追蹤器檢查所需) |
| `/p:EmitCompilerGeneratedFiles=true` | 將產生的原始程式檔寫入磁碟以便擷取 |

> `/p:EmitCompilerGeneratedFiles=true` 可能會導致舊版專案或 `.sqlproj` 檔案出現問題。

### 執行器要求 (C#)
- **.NET Core：** .NET SDK (用於 `dotnet`)
- **.NET Framework (Windows)：** Microsoft Build Tools + NuGet CLI
- **.NET Framework (Linux/macOS)：** Mono 執行階段 (`mono`、`msbuild`、`nuget`)
- **`build-mode: none`：** 需要網際網路存取或私人 NuGet 摘要

## Go

### 支援的建構模式
`autobuild`、`manual` (不支援 `none` 模式)

**預設設定模式：** `autobuild`

### 自動建構 (Autobuild)

自動偵測順序：
1. 呼叫 `make`、`ninja`、`./build` 或 `./build.sh`，直到其中一個成功且 `go list ./...` 可行為止
2. 如果皆未成功，則尋找 `go.mod` (`go get`)、`Gopkg.toml` (`dep ensure -v`) 或 `glide.yaml` (`glide install`)
3. 如果找不到相依性管理器，則為 `GOPATH` 重新排列目錄並使用 `go get`
4. 擷取所有 Go 程式碼 (類似於 `go build ./...`)

**預設設定**會自動偵測 `go.mod` 並安裝相容的 Go 版本。

### 擷取器選項

| 環境變數 | 預設值 | 描述 |
|---|---|---|
| `CODEQL_EXTRACTOR_GO_OPTION_EXTRACT_TESTS` | `false` | 在分析中包含 `_test.go` 檔案 |
| `CODEQL_EXTRACTOR_GO_OPTION_EXTRACT_VENDOR_DIRS` | `false` | 包含 `vendor/` 目錄 |

## Java/Kotlin

### 支援的建構模式
- **Java：** `none`、`autobuild`、`manual`
- **Kotlin：** `autobuild`、`manual` (不支援 `none` 模式)

**預設設定模式：**
- 僅 Java：`none`
- Kotlin 或 Java+Kotlin：`autobuild`

> 如果將 Kotlin 程式碼新增至使用 `none` 模式的儲存庫，請停用並重新啟用預設設定以切換至 `autobuild`。

### 不建構 (`none`) — 僅限 Java
- 執行 Gradle 或 Maven 以獲取相依性資訊 (非實際建構)
- 查詢每個根建構檔案；衝突時偏好較新的相依性版本
- 如果已設定，則使用私人 Maven 註冊表

**準確性考量：**
- 無法查詢相依性的建構指令碼可能會導致準確度猜測錯誤
- 將會遺漏正常建構過程中產生的程式碼
- 同一相依性的多個版本 (CodeQL 會挑選較新的版本)
- 多個 JDK 版本 — CodeQL 使用找到的最高版本；較低版本的檔案可能僅會部分分析
- 類別名稱衝突會導致遺失核心呼叫目標

### 自動建構 (Autobuild)

**自動偵測順序：**
1. 在根目錄搜尋 Gradle、Maven、Ant 建構檔案
2. 執行找到的第一個 (Gradle 優先於 Maven)
3. 否則，搜尋建構指令碼

**建構系統：** Gradle、Maven、Ant

### 執行器要求 (Java)
- JDK (適用於專案的適當版本)
- Gradle 及/或 Maven
- 網際網路存取或私人成品存放庫 (用於 `none` 模式)

## Rust

### 支援的建構模式
`none`、`autobuild`、`manual`

**預設設定模式：** `none`

## Swift

### 支援的建構模式
`autobuild`、`manual` (不支援 `none` 模式)

**預設設定模式：** `autobuild`

**執行器要求：** 僅限 macOS 執行器。不支援 Actions Runner Controller (ARC) — 僅限 Linux。

> macOS 執行器較昂貴；考慮僅掃描建構步驟以最佳化成本。

## 多語言矩陣範例

### 混合建構模式

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - language: c-cpp
        build-mode: manual
      - language: csharp
        build-mode: autobuild
      - language: java-kotlin
        build-mode: none
```

### 條件式手動建構步驟

```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v4

  - name: Initialize CodeQL
    uses: github/codeql-action/init@v4
    with:
      languages: ${{ matrix.language }}
      build-mode: ${{ matrix.build-mode }}

  - if: matrix.build-mode == 'manual'
    name: Build C/C++ code
    run: |
      make bootstrap
      make release

  - name: Perform CodeQL Analysis
    uses: github/codeql-action/analyze@v4
    with:
      category: "/language:${{ matrix.language }}"
```

### 特定 OS 的執行器

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - language: javascript-typescript
        build-mode: none
        runner: ubuntu-latest
      - language: swift
        build-mode: autobuild
        runner: macos-latest
      - language: csharp
        build-mode: autobuild
        runner: windows-latest

jobs:
  analyze:
    runs-on: ${{ matrix.runner }}
```

## 硬體要求

### 建議規格 (自行裝載執行器)

| 程式碼庫大小 | 程式碼行數 | 記憶體 (RAM) | CPU 核心數 | 磁碟 |
|---|---|---|---|---|
| 小型 | < 100K | 8 GB+ | 2 | SSD, ≥14 GB |
| 中型 | 100K – 1M | 16 GB+ | 4–8 | SSD, ≥14 GB |
| 大型 | > 1M | 64 GB+ | 8 | SSD, ≥14 GB |

### 效能提示
- 為所有程式碼庫大小使用 SSD 儲存裝置
- 確保有足夠的磁碟空間供檢出 + 建構 + CodeQL 資料使用
- 使用 `--threads=0` 以使用所有可用的 CPU 核心
- 啟用相依性快取以減少分析時間
- 在準確性可接受的情況下考慮使用 `none` 建構模式 — 比 `autobuild` 快得多

## 相依性快取

### 進階設定工作流程

```yaml
- uses: github/codeql-action/init@v4
  with:
    languages: java-kotlin
    dependency-caching: true
```

| 值 | 行為 |
|---|---|
| `false` / `none` / `off` | 停用 (進階設定的預設值) |
| `restore` | 僅還原現有快取 |
| `store` | 僅儲存新快取 |
| `true` / `full` / `on` | 還原並儲存快取 |

在 GitHub 代管的執行器上，預設設定會自動啟用快取。
