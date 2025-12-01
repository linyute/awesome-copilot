---
agent: 'agent'
tools: ['search/codebase', 'edit/editFiles', 'terminalCommand']
description: '將 ASP.NET .NET Framework 專案容器化，並根據專案需求建立 Dockerfile 與 .dockerfile 檔案。'
---

# ASP.NET .NET Framework 容器化提示

請將下方容器化設定指定的 ASP.NET (.NET Framework) 專案進行容器化，**僅限**針對應用程式在 Windows Docker 容器中執行所需的變更。容器化時請考慮所有此處指定的設定。

**請注意：**這是一個 .NET Framework 應用程式，並非 .NET Core。容器化流程與 .NET Core 應用程式不同。

## 容器化設定

本節包含容器化 ASP.NET (.NET Framework) 應用程式所需的具體設定與配置。執行本提示前，請確保已填寫必要資訊。通常只需前幾項設定，後續設定可維持預設值。

未指定的設定將採用預設值。預設值以 [方括號] 標示。

### 基本專案資訊
1. 要容器化的專案：
   - `[ProjectName (請提供 .csproj 檔案路徑)]`

2. 要使用的 Windows Server SKU：
   - `[Windows Server Core (預設) 或 Windows Server Full]`

3. 要使用的 Windows Server 版本：
   - `[2022、2019 或 2016 (預設 2022)]`

4. 建置階段 Docker 映像的自訂基底映像（如無則用 Microsoft 標準映像）：
   - `[請指定建置階段基底映像（預設 None）]`

5. 執行階段 Docker 映像的自訂基底映像（如無則用 Microsoft 標準映像）：
   - `[請指定執行階段基底映像（預設 None）]`   

### 容器配置
1. 必須在容器映像中開放的埠：
   - 主要 HTTP 埠：`[例如 80]`
   - 其他埠：`[列出其他埠，或填 "None"]`

2. 容器執行時使用的帳號：
   - `[使用者帳號，預設 "ContainerUser"]`

3. 必須在容器映像中設定的 IIS 設定：
   - `[列出 IIS 設定，或填 "None"]`

### 建置設定
1. 建置容器映像前必須執行的自訂建置步驟：
   - `[列出建置步驟，或填 "None"]`

2. 建置容器映像後必須執行的自訂建置步驟：
   - `[列出建置步驟，或填 "None"]`

### 相依性
1. 必須在容器映像中註冊到 GAC 的 .NET 組件：
   - `[組件名稱與版本，或填 "None"]`

2. 必須複製到容器映像並安裝的 MSI：
   - `[MSI 名稱與版本，或填 "None"]`

3. 必須在容器映像中註冊的 COM 元件：
   - `[COM 元件名稱，或填 "None"]`

### 系統設定
1. 必須加入到容器映像的登錄機碼與值：
   - `[登錄路徑與值，或填 "None"]`

2. 必須在容器映像中設定的環境變數：
   - `[變數名稱與值，或填 "Use defaults"]`

3. 必須在容器映像中安裝的 Windows Server 角色與功能：
   - `[角色/功能名稱，或填 "None"]`

### 檔案系統
1. 需複製到容器映像的檔案/目錄：
   - `[專案根目錄的相對路徑，或填 "None"]`
   - 容器中的目標位置：`[容器路徑，或填 "Not applicable"]`

2. 容器化時需排除的檔案/目錄：
   - `[排除路徑，或填 "None"]`

### .dockerignore 設定
1. .dockerignore 檔案需額外包含的模式（預設已含常用模式）：
   - 額外模式：`[列出模式，或填 "None"]`

### 健康檢查設定
1. 健康檢查端點：
   - `[健康檢查 URL 路徑，或填 "None"]`

2. 健康檢查間隔與逾時：
   - `[間隔與逾時值，或填 "Use defaults"]`

### 其他指示
1. 容器化專案時必須遵循的其他指示：
   - `[具體需求，或填 "None"]`

2. 必須處理的已知問題：
   - `[描述已知問題，或填 "None"]`

## 範圍

- ✅ 修改應用程式設定，確保使用 config builders 由環境變數讀取 app settings 與 connection strings
- ✅ 為 ASP.NET 應用程式建立並設定 Dockerfile
- ✅ Dockerfile 多階段建置/發佈，將輸出複製到最終映像
- ✅ 設定 Windows 容器平台相容性（Server Core 或 Full）
- ✅ 正確處理相依性（GAC 組件、MSI、COM 元件）
- ❌ 不處理基礎設施（假設另行處理）
- ❌ 不做容器化以外的程式碼變更

## 執行流程

1. 檢查上述容器化設定，了解需求
2. 建立 `progress.md` 以勾選追蹤進度
3. 由 .csproj 檔案的 `TargetFrameworkVersion` 元素判斷 .NET Framework 版本
4. 根據下列條件選擇 Windows Server 容器映像：
   - 專案偵測到的 .NET Framework 版本
   - 容器化設定指定的 Windows Server SKU（Core 或 Full）
   - 容器化設定指定的 Windows Server 版本（2016、2019 或 2022）
   - Windows Server Core 標籤請參考：https://github.com/microsoft/dotnet-framework-docker/blob/main/README.aspnet.md#full-tag-listing
5. 確認必需的 NuGet 套件已安裝。**請勿自動安裝**，如未安裝請暫停並請用戶以 Visual Studio NuGet 管理器或套件管理主控台安裝。必需套件如下：
   - `Microsoft.Configuration.ConfigurationBuilders.Environment`
6. 修改 `web.config`，加入 config builders 區段，設定由環境變數讀取 app settings 與 connection strings：
   - 在 configSections 加入 ConfigBuilders 區段
   - 在根目錄加入 configBuilders 區段
   - 為 appSettings 與 connectionStrings 設定 EnvironmentConfigBuilder
   - 範例：
     ```xml
     <configSections>
       <section name="configBuilders" type="System.Configuration.ConfigurationBuildersSection, System.Configuration, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a" restartOnExternalChanges="false" requirePermission="false" />
     </configSections>
     <configBuilders>
       <builders>
         <add name="Environment" type="Microsoft.Configuration.ConfigurationBuilders.EnvironmentConfigBuilder, Microsoft.Configuration.ConfigurationBuilders.Environment" />
       </builders>
     </configBuilders>
     <appSettings configBuilders="Environment">
       <!-- existing app settings -->
     </appSettings>
     <connectionStrings configBuilders="Environment">
       <!-- existing connection strings -->
     </connectionStrings>
     ```
7. 在 Dockerfile 所在資料夾建立 `LogMonitorConfig.json`，內容需與下方範例完全一致，除非設定另有要求。
   - 特別注意：EventLog source 的 level 請勿改為 `Information`，避免產生過多雜訊。
8. 在專案根目錄建立 Dockerfile 以容器化應用程式
   - Dockerfile 應採多階段：
     - 建置階段：使用 Windows Server Core 映像建置
       - 建置階段必須用 `mcr.microsoft.com/dotnet/framework/sdk` 基底映像，除非設定指定自訂映像
       - 先複製 sln、csproj、packages.config
       - 複製 NuGet.config（如有）並設定私有來源
       - 還原 NuGet 套件       
       - 再複製其餘原始碼，使用 MSBuild 建置並發佈到 C:\publish
     - 最終階段：使用選定的 Windows Server 映像執行
       - 最終階段必須用 `mcr.microsoft.com/dotnet/framework/aspnet` 基底映像，除非設定指定自訂映像
       - 複製 `LogMonitorConfig.json` 到容器目錄（如 C:\LogMonitor）
       - 從 Microsoft repository 下載 LogMonitor.exe 至同目錄
           - 正確 LogMonitor.exe 下載網址：https://github.com/microsoft/windows-container-tools/releases/download/v2.1.1/LogMonitor.exe
       - 設定工作目錄為 C:\inetpub\wwwroot
       - 從建置階段（C:\publish）複製發佈輸出到最終映像
       - 設定容器 entry point 執行 LogMonitor.exe 與 ServiceMonitor.exe 監控 IIS 服務
           - `ENTRYPOINT [ "C:\LogMonitor\LogMonitor.exe", "C:\ServiceMonitor.exe", "w3svc" ]`
   - 請務必考慮所有容器化設定：
     - Windows Server SKU 與版本
     - 開放埠
     - 容器執行帳號
     - IIS 設定
     - GAC 組件註冊
     - MSI 安裝
     - COM 元件註冊
     - 登錄機碼
     - 環境變數
     - Windows 角色與功能
     - 檔案/目錄複製
   - Dockerfile 請參考本提示結尾範例，並依專案需求調整。
   - **重要：**除非設定明確要求 Full，否則請使用 Windows Server Core 基底映像
9. 在專案根目錄建立 `.dockerignore`，排除不必要檔案。`.dockerignore` 至少需包含下列項目，並依設定加入額外模式：
   - packages/
   - bin/
   - obj/
   - .dockerignore
   - Dockerfile
   - .git/
   - .github/
   - .vs/
   - .vscode/
   - **/node_modules/
   - *.user
   - *.suo
   - **/.DS_Store
   - **/Thumbs.db
   - 其他設定指定的模式
10. 如有指定健康檢查，請在 Dockerfile 加入 HEALTHCHECK 指令
   - 如有健康檢查端點請加入
11. 將 dockerfile 加入專案檔：`<None Include="Dockerfile" />`
12. 標記任務完成：[ ] → [✓]
13. 持續執行直到所有任務完成且 Docker build 成功

## 建置與執行驗證

完成 Dockerfile 後，請確認 Docker build 能成功。建置指令如下：

```bash
docker build -t aspnet-app:latest .
```

如建置失敗，請檢查錯誤訊息並調整 Dockerfile 或專案設定。回報成功或失敗。

## 進度追蹤

請維護 `progress.md`，結構如下：
```markdown
# 容器化進度

## 環境偵測
- [ ] .NET Framework 版本偵測（版本：___）
- [ ] Windows Server SKU 選擇（SKU：___）
- [ ] Windows Server 版本選擇（版本：___）

## 設定變更
- [ ] Web.config 修改（config builders）
- [ ] NuGet 套件來源設定（如適用）
- [ ] 複製 LogMonitorConfig.json 並依設定調整

## 容器化
- [ ] Dockerfile 建立
- [ ] .dockerignore 建立
- [ ] 建置階段（SDK 映像）
- [ ] 複製 sln、csproj、packages.config、NuGet.config（如適用）以還原套件
- [ ] 執行階段（runtime 映像）
- [ ] 非 root 使用者設定
- [ ] 相依性處理（GAC、MSI、COM、登錄、檔案等）
- [ ] 健康檢查設定（如適用）
- [ ] 特殊需求實作

## 驗證
- [ ] 檢查容器化設定，確保所有需求已完成
- [ ] Docker build 成功
```

請勿於步驟間暫停確認，務必依序執行直到所有勾選完成且 Docker build 成功。

**所有勾選完成前，請勿停止！** 包含成功建置 Docker 映像並處理所有建置過程問題。

## 參考資料

### Dockerfile 範例

ASP.NET (.NET Framework) 應用程式 Windows Server Core 基底映像 Dockerfile 範例：

```dockerfile
# escape=`
# escape 指令將跳脫字元由 \ 改為 `
# Windows Dockerfile 特別適用，因為 \ 為路徑分隔符

# ============================================================
# 階段 1：建置與發佈應用程式
# ============================================================

# 基底映像 - 請選擇合適的 .NET Framework 與 Windows Server Core 版本
# 可用標籤：
# - 4.8.1-windowsservercore-ltsc2025 (Windows Server 2025)
# - 4.8-windowsservercore-ltsc2022 (Windows Server 2022)
# - 4.8-windowsservercore-ltsc2019 (Windows Server 2019)
# - 4.8-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.7.2-windowsservercore-ltsc2019 (Windows Server 2019)
# - 4.7.2-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.7.1-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.7-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.6.2-windowsservercore-ltsc2016 (Windows Server 2016)
# - 3.5-windowsservercore-ltsc2025 (Windows Server 2025)
# - 3.5-windowsservercore-ltsc2022 (Windows Server 2022)
# - 3.5-windowsservercore-ltsc2019 (Windows Server 2019)
# - 3.5-windowsservercore-ltsc2019 (Windows Server 2016)
# 建置用 .NET Framework SDK 映像
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8-windowsservercore-ltsc2022 AS build
ARG BUILD_CONFIGURATION=Release

# 預設 shell 設為 PowerShell
SHELL ["powershell", "-command"]

WORKDIR /app

# 複製 solution 與專案檔
COPY YourSolution.sln .
COPY YourProject/*.csproj ./YourProject/
COPY YourOtherProject/*.csproj ./YourOtherProject/

# 複製 packages.config
COPY YourProject/packages.config ./YourProject/
COPY YourOtherProject/packages.config ./YourOtherProject/

# 還原 NuGet 套件
RUN nuget restore YourSolution.sln

# 複製原始碼
COPY . .

# 如有需自訂建置前步驟，請於此執行

# 使用 MSBuild 建置並發佈到 C:\publish
RUN msbuild /p:Configuration=$BUILD_CONFIGURATION `
            /p:WebPublishMethod=FileSystem `
            /p:PublishUrl=C:\publish `
            /p:DeployDefaultTarget=WebPublish

# 如有需自訂建置後步驟，請於此執行

# ============================================================
# 階段 2：最終執行映像
# ============================================================

# 基底映像 - 請選擇合適的 .NET Framework 與 Windows Server Core 版本
# 可用標籤：
# - 4.8.1-windowsservercore-ltsc2025 (Windows Server 2025)
# - 4.8-windowsservercore-ltsc2022 (Windows Server 2022)
# - 4.8-windowsservercore-ltsc2019 (Windows Server 2019)
# - 4.8-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.7.2-windowsservercore-ltsc2019 (Windows Server 2019)
# - 4.7.2-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.7.1-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.7-windowsservercore-ltsc2016 (Windows Server 2016)
# - 4.6.2-windowsservercore-ltsc2016 (Windows Server 2016)
# - 3.5-windowsservercore-ltsc2025 (Windows Server 2025)
# - 3.5-windowsservercore-ltsc2022 (Windows Server 2022)
# - 3.5-windowsservercore-ltsc2019 (Windows Server 2019)
# - 3.5-windowsservercore-ltsc2019 (Windows Server 2016)
# 執行用 .NET Framework ASP.NET 映像
FROM mcr.microsoft.com/dotnet/framework/aspnet:4.8-windowsservercore-ltsc2022

# 預設 shell 設為 PowerShell
SHELL ["powershell", "-command"]

WORKDIR /inetpub/wwwroot

# 從建置階段複製
COPY --from=build /publish .

# 如需額外環境變數，請取消註解並修改
# ENV KEY=VALUE

# 安裝 MSI 套件（如需請取消註解並修改）
# COPY ./msi-installers C:/Installers
# RUN Start-Process -Wait -FilePath 'msiexec.exe' -ArgumentList '/i', 'C:\Installers\your-package.msi', '/quiet', '/norestart'

# 安裝 Windows Server 角色與功能（如需請取消註解並修改）
# RUN dism /Online /Enable-Feature /FeatureName:YOUR-FEATURE-NAME

# 加入其他 Windows 功能（如需請取消註解並修改）
# RUN Add-WindowsFeature Some-Windows-Feature; `
#    Add-WindowsFeature Another-Windows-Feature

# 安裝 MSI 套件（如需請取消註解並修改）
# COPY ./msi-installers C:/Installers
# RUN Start-Process -Wait -FilePath 'msiexec.exe' -ArgumentList '/i', 'C:\Installers\your-package.msi', '/quiet', '/norestart'

# 註冊 GAC 組件（如需請取消註解並修改）
# COPY ./assemblies C:/Assemblies
# RUN C:\Windows\Microsoft.NET\Framework64\v4.0.30319\gacutil -i C:/Assemblies/YourAssembly.dll

# 註冊 COM 元件（如需請取消註解並修改）
# COPY ./com-components C:/Components
# RUN regsvr32 /s C:/Components/YourComponent.dll

# 加入登錄機碼（如需請取消註解並修改）
# RUN New-Item -Path 'HKLM:\Software\YourApp' -Force; `
#     Set-ItemProperty -Path 'HKLM:\Software\YourApp' -Name 'Setting' -Value 'Value'

# 設定 IIS（如需請取消註解並修改）
# RUN Import-Module WebAdministration; `
#     Set-ItemProperty 'IIS:\AppPools\DefaultAppPool' -Name somePropertyName -Value 'SomePropertyValue'; `
#     Set-ItemProperty 'IIS:\Sites\Default Web Site' -Name anotherPropertyName -Value 'AnotherPropertyValue'

# 開放必要埠 - IIS 預設 80
EXPOSE 80
# EXPOSE 443  # 如用 HTTPS 請取消註解

# 從 microsoft/windows-container-tools repository 複製 LogMonitor
WORKDIR /LogMonitor
RUN curl -fSLo LogMonitor.exe https://github.com/microsoft/windows-container-tools/releases/download/v2.1.1/LogMonitor.exe

# 從本地複製 LogMonitorConfig.json
COPY LogMonitorConfig.json .

# 設定非管理員使用者
USER ContainerUser

# 覆蓋容器預設 entry point，使用 LogMonitor 監控
ENTRYPOINT [ "C:\LogMonitor\LogMonitor.exe", "C:\ServiceMonitor.exe", "w3svc" ]
```

## 如何調整範例

**注意：**請根據容器化設定調整此範本。

調整範例 Dockerfile 時：

1. 將 `YourSolution.sln`、`YourProject.csproj` 等替換為實際檔名
2. 根據需求調整 Windows Server 與 .NET Framework 版本
3. 依需求調整相依性安裝步驟，移除不必要內容
4. 根據實際流程增減階段

## 階段命名說明

- `AS stage-name` 語法可為階段命名
- 用 `--from=stage-name` 從前一階段複製檔案
- 可有多個中介階段，最終映像未必都用到

### LogMonitorConfig.json

LogMonitorConfig.json 檔案需建立於專案根目錄，供 LogMonitor 工具監控容器日誌。內容如下，請勿修改，除非設定另有要求：
```json
{
  "LogConfig": {
    "sources": [
      {
        "type": "EventLog",
        "startAtOldestRecord": true,
        "eventFormatMultiLine": false,
        "channels": [
          {
            "name": "system",
            "level": "Warning"
          },
          {
            "name": "application",
            "level": "Error"
          }
        ]
      },
      {
        "type": "File",
        "directory": "c:\\inetpub\\logs",
        "filter": "*.log",
        "includeSubdirectories": true,
        "includeFileNames": false
      },
      {
        "type": "ETW",
        "eventFormatMultiLine": false,
        "providers": [
          {
            "providerName": "IIS: WWW Server",
            "providerGuid": "3A2A4E84-4C21-4981-AE10-3FDA0D9B0F83",
            "level": "Information"
          },
          {
            "providerName": "Microsoft-Windows-IIS-Logging",
            "providerGuid": "7E8AD27F-B271-4EA2-A783-A47BDE29143B",
            "level": "Information"
          }
        ]
      }
    ]
  }
}
```
