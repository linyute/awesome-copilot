---
mode: 'agent'
tools: ['search/codebase', 'edit/editFiles', 'terminalCommand']
description: '將 ASP.NET Core 專案容器化，依專案需求建立 Dockerfile 與 .dockerfile，並客製化設定。'
---

# ASP.NET Core Docker 容器化提示

## 容器化請求

請將下方設定指定的 ASP.NET Core（.NET）專案容器化，僅針對應用程式在 Linux Docker 容器中運行所需的變更進行調整。容器化需考慮所有設定。

請遵循 .NET Core 應用容器化最佳實踐，確保容器效能、安全性與可維護性最佳化。

## 容器化設定

本區段包含容器化 ASP.NET Core 應用所需的具體設定。執行本提示前，請確認所有必要設定已填寫。多數情況下僅需前幾項設定，後續可用預設值。

未指定的設定將採預設值，預設值以 [方括號] 標示。

### 基本專案資訊
1. 要容器化的專案：
   - `[ProjectName（請提供 .csproj 路徑）]`

2. 使用的 .NET 版本：
   - `[8.0 或 9.0（預設 8.0）]`

3. 使用的 Linux 發行版：
   - `[debian、alpine、ubuntu、chiseled 或 Azure Linux（mariner）（預設 debian）]`

4. 建置階段自訂基底映像（"None" 表示使用標準 Microsoft 基底映像）：
   - `[指定建置階段基底映像（預設 None）]`

5. 執行階段自訂基底映像（"None" 表示使用標準 Microsoft 基底映像）：
   - `[指定執行階段基底映像（預設 None）]`   

### 容器設定
1. 必須在容器映像中開放的埠：
   - 主要 HTTP 埠：[如 8080]
   - 其他埠：[列出其他埠，或 "None"]

2. 容器執行的使用者帳號：
   - `[使用者帳號，預設 "$APP_UID"]`

3. 應用程式 URL 設定：
   - `[指定 ASPNETCORE_URLS，預設 "http://+:8080"]`

### 建置設定
1. 建置容器映像前需執行的自訂步驟：
   - `[列出特定建置步驟，或 "None"]`

2. 建置容器映像後需執行的自訂步驟：
   - `[列出特定建置步驟，或 "None"]`

3. 必須設定的 NuGet 套件來源：
   - `[列出私有 NuGet feed 與認證資訊，或 "None"]`

### 依賴
1. 必須在容器映像中安裝的系統套件：
   - `[依所選 Linux 發行版的套件名稱，或 "None"]`

2. 必須複製到容器映像的原生函式庫：
   - `[函式庫名稱與路徑，或 "None"]`

3. 必須安裝的額外 .NET 工具：
   - `[工具名稱與版本，或 "None"]`

### 系統設定
1. 必須在容器映像中設定的環境變數：
   - `[變數名稱與值，或 "預設"]`

### 檔案系統
1. 需複製到容器映像的檔案/目錄：
   - `[專案根目錄的路徑，或 "None"]`
   - 容器目標位置：[容器路徑，或 "不適用"]

2. 容器化時需排除的檔案/目錄：
   - `[排除路徑，或 "None"]`

3. 需設定的 Volume 掛載點：
   - `[持久化資料的 Volume 路徑，或 "None"]`

### .dockerignore 設定
1. .dockerignore 檔案需額外包含的模式（預設已含常用模式）：
   - 額外模式：[列出額外模式，或 "None"]

### 健康檢查設定
1. 健康檢查端點：
   - `[健康檢查 URL 路徑，或 "None"]`

2. 健康檢查間隔與逾時：
   - `[間隔與逾時值，或 "預設"]`

### 其他指示
1. 容器化專案時必須遵循的其他指示：
   - `[特定需求，或 "None"]`

2. 需處理的已知問題：
   - `[描述已知問題，或 "None"]`

## 範圍

- ✅ 應用程式設定調整，確保可從環境變數讀取設定與連線字串
- ✅ 建立並設定 ASP.NET Core 應用的 Dockerfile
- ✅ Dockerfile 多階段建置/發佈，並將輸出複製到最終映像
- ✅ Linux 容器平台相容性（Alpine、Ubuntu、Chiseled、Azure Linux）
- ✅ 依賴處理（系統套件、原生函式庫、額外工具）
- ❌ 不處理基礎設施（假設另行處理）
- ❌ 不做除容器化外的程式碼變更

## 執行流程

1. 檢查上方容器化設定，理解需求
2. 建立 `progress.md` 以核取方塊追蹤進度
3. 由 .csproj 的 `TargetFramework` 元素判斷 .NET 版本
4. 根據下列條件選擇 Linux 容器映像：
   - 專案偵測到的 .NET 版本
   - 容器化設定指定的 Linux 發行版（Alpine、Ubuntu、Chiseled、Azure Linux）
   - 若未指定自訂基底映像，則必須使用有效的 mcr.microsoft.com/dotnet 官方映像，標籤如範例 Dockerfile 或官方文件
   - 官方 Microsoft .NET 映像標籤：
      - SDK（建置階段）：https://github.com/dotnet/dotnet-docker/blob/main/README.sdk.md
      - ASP.NET Core 執行階段： https://github.com/dotnet/dotnet-docker/blob/main/README.aspnet.md
      - .NET 執行階段： https://github.com/dotnet/dotnet-docker/blob/main/README.runtime.md
5. 在專案根目錄建立 Dockerfile 以容器化應用
   - Dockerfile 應採多階段：
     - 建置階段：用 .NET SDK 映像建置
       - 先複製 csproj 檔
       - 複製 NuGet.config（如有）並設定私有 feed
       - 還原 NuGet 套件
       - 複製其餘原始碼，建置並發佈到 /app/publish
     - 最終階段：用選定 .NET 執行階段映像執行
       - 工作目錄設為 /app
       - 使用者依指示（預設非 root，如 `$APP_UID`）
         - 未特別指定時，無需建立新使用者，直接用 `$APP_UID`
       - 複製建置階段發佈輸出
   - 務必考慮所有容器化設定：
     - .NET 版本與 Linux 發行版
     - 開放埠
     - 容器使用者
     - ASPNETCORE_URLS 設定
     - 系統套件安裝
     - 原生函式庫依賴
     - 額外 .NET 工具
     - 環境變數
     - 檔案/目錄複製
     - Volume 掛載點
     - 健康檢查設定
6. 在專案根目錄建立 `.dockerignore`，排除不必要檔案。 `.dockerignore` **必須**含下列項目及容器化設定指定的額外模式：
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
   - 其他指定模式
7. 若有健康檢查設定，請在 Dockerfile 加入 HEALTHCHECK 指令
   - 用 curl 或 wget 檢查健康端點
8. 任務完成時將核取方塊標記為 [ ] → [✓]
9. 持續執行，直到所有任務完成且 Docker build 成功

## 建置與執行驗證

完成 Dockerfile 後，請確認 Docker build 成功。建置指令如下：

```bash
docker build -t aspnetcore-app:latest .
```

若建置失敗，請檢查錯誤訊息並修正 Dockerfile 或專案設定。回報成功/失敗。

## 進度追蹤

請維護 `progress.md`，結構如下：
```markdown
# 容器化進度

## 環境偵測
- [ ] .NET 版本偵測（版本：___）
- [ ] Linux 發行版選擇（發行版：___）

## 設定變更
- [ ] 應用程式設定驗證（支援環境變數）
- [ ] NuGet 套件來源設定（如適用）

## 容器化
- [ ] Dockerfile 建立
- [ ] .dockerignore 建立
- [ ] 建置階段（SDK 映像）
- [ ] 複製 csproj 以還原套件
- [ ] 複製 NuGet.config（如適用）
- [ ] 執行階段（runtime 映像）
- [ ] 非 root 使用者設定
- [ ] 依賴處理（系統套件、原生函式庫、工具等）
- [ ] 健康檢查設定（如適用）
- [ ] 特殊需求實作

## 驗證
- [ ] 檢查容器化設定，確保所有需求已完成
- [ ] Docker build 成功
```

所有核取方塊皆標記前，請勿結束！包含成功建置 Docker 映像並處理所有建置問題。

## Dockerfile 範例

以下為 ASP.NET Core（.NET）應用在 Linux 基底映像的 Dockerfile 範例。

```dockerfile
# ============================================================
# 階段 1：建置與發佈應用程式
# ============================================================

# 基底映像 - 請選用合適 .NET SDK 版本與 Linux 發行版
# 標籤範例：
# - 8.0-bookworm-slim（Debian 12）
# - 8.0-noble（Ubuntu 24.04）
# - 8.0-alpine（Alpine Linux）
# - 9.0-bookworm-slim（Debian 12）
# - 9.0-noble（Ubuntu 24.04）
# - 9.0-alpine（Alpine Linux）
# 用 .NET SDK 映像建置應用
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src

# 先複製專案檔以利快取
COPY ["YourProject/YourProject.csproj", "YourProject/"]
COPY ["YourOtherProject/YourOtherProject.csproj", "YourOtherProject/"]

# 複製 NuGet 設定（如有）
COPY ["NuGet.config", "."]

# 還原 NuGet 套件
RUN dotnet restore "YourProject/YourProject.csproj"

# 複製原始碼
COPY . .

# 如需自訂建置前步驟，請於此執行
# RUN echo "執行建置前步驟..."

# 建置並發佈應用
WORKDIR "/src/YourProject"
RUN dotnet build "YourProject.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 發佈應用
RUN dotnet publish "YourProject.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 如需自訂建置後步驟，請於此執行
# RUN echo "執行建置後步驟..."

# ============================================================
# 階段 2：最終執行映像
# ============================================================

# 基底映像 - 請選用合適 .NET 執行階段版本與 Linux 發行版
# 標籤範例：
# - 8.0-bookworm-slim（Debian 12）
# - 8.0-noble（Ubuntu 24.04）
# - 8.0-alpine（Alpine Linux）
# - 8.0-noble-chiseled（Ubuntu 24.04 Chiseled）
# - 8.0-azurelinux3.0（Azure Linux）
# - 9.0-bookworm-slim（Debian 12）
# - 9.0-noble（Ubuntu 24.04）
# - 9.0-alpine（Alpine Linux）
# - 9.0-noble-chiseled（Ubuntu 24.04 Chiseled）
# - 9.0-azurelinux3.0（Azure Linux）
# 用 .NET 執行階段映像執行應用
FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS final

# 如需安裝系統套件，請取消註解並調整
# RUN apt-get update && apt-get install -y \
#     curl \
#     wget \
#     ca-certificates \
#     libgdiplus \
#     && rm -rf /var/lib/apt/lists/*

# 如需安裝額外 .NET 工具，請取消註解並調整
# RUN dotnet tool install --global dotnet-ef --version 8.0.0
# ENV PATH="$PATH:/root/.dotnet/tools"

WORKDIR /app

# 從建置階段複製發佈應用
COPY --from=build /app/publish .

# 如需複製額外檔案，請取消註解並調整
# COPY ./config/appsettings.Production.json .
# COPY ./certificates/ ./certificates/

# 設定環境變數
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

# 如需自訂環境變數，請取消註解並調整
# ENV CONNECTIONSTRINGS__DEFAULTCONNECTION="your-connection-string"
# ENV FEATURE_FLAG_ENABLED=true

# SSL/TLS 憑證設定（如需）
# ENV ASPNETCORE_Kestrel__Certificates__Default__Path=/app/certificates/app.pfx
# ENV ASPNETCORE_Kestrel__Certificates__Default__Password=your_password

# 開放應用監聽的埠
EXPOSE 8080
# EXPOSE 8081  # 如用 HTTPS 請取消註解

# 安裝 curl 以供健康檢查（如未安裝）
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 健康檢查設定
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 建立持久化資料 Volume（如需）
# VOLUME ["/app/data", "/app/logs"]

# 切換至非 root 使用者以提升安全性
USER $APP_UID

# 設定應用程式進入點
ENTRYPOINT ["dotnet", "YourProject.dll"]
```

## 範例調整說明

**注意：** 請依容器化設定客製化本範例。

調整範例 Dockerfile 時：

1. 請將 `YourProject.csproj`、`YourProject.dll` 等替換為實際專案名稱
2. 依需求調整 .NET 版本與 Linux 發行版
3. 依需求調整依賴安裝步驟，移除不必要項目
4. 設定應用專屬環境變數
5. 依需求增減階段
6. 健康檢查端點請依應用路徑調整

## Linux 發行版差異

### Alpine Linux
若需更小映像，請用 Alpine Linux：

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
# ... 建置步驟 ...

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
# apk 安裝套件
RUN apk update && apk add --no-cache curl ca-certificates
```

### Ubuntu Chiseled
若需最小攻擊面，請用 chiseled 映像：

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS final
# 注意：chiseled 映像極簡，若需額外依賴請用其他基底
```

### Azure Linux（Mariner）
若需 Azure 最佳化容器：

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-azurelinux3.0 AS final
# tdnf 安裝套件
RUN tdnf update -y && tdnf install -y curl ca-certificates && tdnf clean all
```

## 階段命名說明

- `AS 階段名稱` 語法可為每階段命名
- 用 `--from=階段名稱` 從前一階段複製檔案
- 可有多個中介階段，最終映像為 `final` 階段

## 安全最佳實踐

- 生產環境務必用非 root 使用者
- 請用明確映像標籤，勿用 `latest`
- 安裝套件最少化
- 基底映像保持最新
- 多階段建置排除建置依賴
