---
description: '執行 C#/.NET 程式碼的清理任務，包括清理、現代化和技術債務補救。'
name: '.NET 升級集合'
tools: ['search/codebase', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'runTests', 'problems', 'changes', 'usages', 'findTestFiles', 'testFailure', 'runCommands/terminalLastCommand', 'runCommands/terminalSelection', 'web/fetch', 'microsoft.docs.mcp']
---

# .NET 升級集合

用於全面專案遷移的 .NET Framework 升級專家

**標籤：** dotnet, 升級, 遷移, 框架, 現代化

## 集合用法

### .NET 升級聊天模式

發現並規劃您的 .NET 升級之旅！

```markdown, upgrade-analysis.prompt.md
---
mode: dotnet-upgrade
name: 分析當前的 .NET 框架版本並建立升級計畫
---
分析儲存庫並列出每個專案的當前 TargetFramework
以及 Microsoft 發布排程中可用的最新 LTS 版本。
建立一個升級策略，優先處理依賴性最低的專案。
```

升級聊天模式會自動適應您儲存庫的當前 .NET 版本，並提供上下文感知的升級指導到下一個穩定版本。

它將協助您：
- 自動偵測所有專案中的當前 .NET 版本
- 生成最佳升級序列
- 識別重大變更和現代化機會
- 建立每個專案的升級流程

---

### .NET 升級說明

透過結構化指導執行全面的 .NET 框架升級！

說明提供：
- 順序升級策略
- 依賴分析和排序
- 框架目標和程式碼調整
- NuGet 和依賴管理
- CI/CD 管道更新
- 測試和驗證程序

在實作升級計畫時使用這些說明，以確保正確執行和驗證。

---

### .NET 升級提示

快速存取專門的升級分析提示！

提示集合包括用於以下目的的即用型查詢：
- 專案發現和評估
- 升級策略和排序
- 框架目標和程式碼調整
- 重大變更分析
- CI/CD 管道更新
- 最終驗證和交付

使用這些提示對特定升級方面進行有針對性的分析。

---

## 快速入門
1. 執行探索遍歷以列舉儲存庫中的所有 `*.sln` 和 `*.csproj` 檔案。
2. 偵測所有專案中使用的當前 .NET 版本。
3. 識別可用的最新穩定 .NET 版本 (首選 LTS) — 通常比現有版本領先 `+2` 年。
4. 生成從當前版本 → 下一個穩定版本 (例如，`net6.0 → net8.0` 或 `net7.0 → net9.0`) 的升級計畫。
5. 一次升級一個專案，驗證建立、更新測試並相應修改 CI/CD。

---

## 自動偵測當前 .NET 版本
要自動偵測解決方案中的當前框架版本：

```bash
# 1. 檢查已安裝的全域 SDK
dotnet --list-sdks

# 2. 偵測專案級 TargetFrameworks
find . -name "*.csproj" -exec grep -H "<TargetFramework" {} ";"

# 3. 可選：總結唯一的框架版本
grep -r "<TargetFramework" **/*.csproj | sed 's/.*<TargetFramework>//;s/<\/TargetFramework>//' | sort | uniq

# 4. 驗證運行時環境
dotnet --info | grep "Version"
```

**聊天提示：**
> 「分析儲存庫並列出每個專案的當前 TargetFramework 以及 Microsoft 發布排程中可用的最新 LTS 版本。」

---

## 發現與分析命令
```bash
# 列出所有專案
dotnet sln list

# 檢查每個專案的當前目標框架
grep -H "TargetFramework" **/*.csproj

# 檢查過時的套件
dotnet list <ProjectName>.csproj package --outdated

# 生成依賴圖
dotnet msbuild <ProjectName>.csproj /t:GenerateRestoreGraphFile /p:RestoreGraphOutputPath=graph.json
```

**聊天提示：**
> 「分析解決方案並總結每個專案的當前 TargetFramework，並建議適當的下一個 LTS 升級版本。」

---

## 分類規則
- `TargetFramework` 以 `netcoreapp`、`net5.0+`、`net6.0+` 等開頭 → **現代 .NET**
- `netstandard*` → **.NET Standard** (遷移到當前 .NET 版本)
- `net4*` → **.NET Framework** (透過中間步驟遷移到 .NET 6+)

---

## 升級序列
1. **從獨立函式庫開始：** 依賴性最低的類別函式庫優先。
2. **接下來：** 共享元件和通用實用程式。
3. **然後：** API、Web 或函式專案。
4. **最後：** 測試、整合點和管道。

**聊天提示：**
> 「為此儲存庫生成最佳升級順序，優先處理依賴性最低的專案。」

---

## 每個專案的升級流程
1. **建立分支：** `upgrade/<project>-to-<targetVersion>`
2. **編輯 `<TargetFramework>`** 在 `.csproj` 中到建議的版本 (例如，`net9.0`)
3. **還原和更新套件：**
   ```bash
   dotnet restore
   dotnet list package --outdated
   dotnet add package <PackageName> --version <LatestVersion>
   ```
4. **建立和測試：**
   ```bash
   dotnet build <ProjectName>.csproj
   dotnet test <ProjectName>.Tests.csproj
   ```
5. **修復問題** — 解決已棄用的 API，調整配置，現代化 JSON/日誌記錄/DI。
6. **提交並推送** 帶有測試證據和檢查清單的 PR。

---

## 重大變更與現代化
- 使用 `.NET 升級助理` 獲取初始建議。
- 應用分析器偵測過時的 API。
- 替換過時的 SDK (例如，`Microsoft.Azure.*` → `Azure.*`)。
- 現代化啟動邏輯 (`Startup.cs` → `Program.cs` 頂層語句)。

**聊天提示：**
> 「列出從 <currentVersion> 升級到 <targetVersion> 時 <ProjectName> 中已棄用或不相容的 API。」

---

## CI/CD 配置更新
確保管道動態使用偵測到的**目標版本**：

**Azure DevOps**
```yaml
- task: UseDotNet@2
  inputs:
    packageType: 'sdk'
    version: '$(TargetDotNetVersion).x'
```

**GitHub Actions**
```yaml
- uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '${{ env.TargetDotNetVersion }}.x'
```

---

## 驗證檢查清單
- [ ] TargetFramework 已升級到下一個穩定版本
- [ ] 所有 NuGet 套件相容並已更新
- [ ] 建立和測試管道在本地和 CI 中成功
- [ ] 整合測試通過
- [ ] 已部署到較低環境並已驗證

---

## 分支與回滾策略
- 使用功能分支：`upgrade/<project>-to-<targetVersion>`
- 頻繁提交並保持變更原子性
- 如果合併後 CI 失敗，則還原 PR 並隔離失敗的模組

**聊天提示：**
> 「如果 <ProjectName> 的 .NET 升級引入了建立或運行時回歸，請建議回滾和驗證計畫。」

---

## 自動化與擴展
- 使用 GitHub Actions 或 Azure Pipelines 自動化升級偵測。
- 排程夜間運行以透過 `dotnet --list-sdks` 檢查新的 .NET 版本。
- 使用代理程式自動為過時的框架提出 PR。

---

## 聊天模式提示函式庫
1. 「列出所有專案的當前和推薦 .NET 版本。」
2. 「為 <currentVersion> 到 <targetVersion> 生成每個專案的升級計畫。」
3. 「建議編輯 <ProjectName> 的 .csproj 和管道以進行升級。」
4. 「總結 <ProjectName> 升級後的建立/測試結果。」
5. 「為升級建立 PR 描述和檢查清單。」

---
