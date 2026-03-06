---
name: msstore-cli
description: '用於將 Windows 應用程式發佈到 Microsoft Store 的 Microsoft Store 開發者 CLI (msstore)。當被要求設定 Store 認證、列出 Store 應用程式、檢查提交狀態、發佈提交、管理套件發行、為 Store 發佈設定 CI/CD 或與小組中心 (Partner Center) 整合時使用。支援 Windows App SDK/WinUI、UWP、.NET MAUI、Flutter、Electron、React Native 和 PWA 應用程式。'
license: MIT
---

# Microsoft Store 開發者 CLI (msstore) (Microsoft Store Developer CLI (msstore))

Microsoft Store 開發者 CLI (`msstore`) 是一個跨平台命令列介面，用於發佈與管理 Microsoft Store 中的應用程式。它與小組中心 (Partner Center) API 整合，並支援各種應用程式型別的自動化發佈工作流。

## 何時使用此技能 (When to Use This Skill)

在您需要執行以下操作時使用此技能：

- 為 API 存取設定 Store 認證
- 列出您 Store 帳戶中的應用程式
- 檢查提交 (submission) 的狀態
- 向 Store 發佈提交
- 封裝用於 Store 提交的應用程式
- 為 Store 發佈初始化專案
- 管理套件發行 (package flights)（Beta 測試）
- 為自動化 Store 發佈設定 CI/CD 管線
- 管理提交的漸進式推出 (gradual rollouts)
- 以程式化方式更新提交中繼資料

## 先決條件 (Prerequisites)

- Windows 10+、macOS 或 Linux
- .NET 9 Desktop Runtime (Windows) 或 .NET 9 Runtime (macOS/Linux)
- 具有適當權限的小組中心 (Partner Center) 帳戶
- 具有小組中心 API 存取權限的 Azure AD 應用程式註冊
- 透過以下其中一種方法安裝 msstore CLI：
  - **Microsoft Store**：[下載](https://www.microsoft.com/store/apps/9P53PC5S0PHJ)
  - **WinGet**：`winget install "Microsoft Store Developer CLI"`
  - **手動**：從 [GitHub 版本 (Releases)](https://aka.ms/msstoredevcli/releases) 下載

### 小組中心設定 (Partner Center Setup)

在使用 msstore 之前，您需要建立一個具有小組中心存取權限的 Azure AD 應用程式：

1. 前往 [小組中心 (Partner Center)](https://partner.microsoft.com/dashboard)
2. 導覽至 **帳戶設定** > **使用者管理** > **Azure AD 應用程式**
3. 建立一個新的應用程式並記下 **租用戶識別碼 (Tenant ID)**、**用戶端識別碼 (Client ID)** 和 **用戶端密碼 (Client Secret)**
4. 授予該應用程式適當的權限（經理或開發者角色）

## 核心指令參考 (Core Commands Reference)

### info - 列印設定 (info - Print Configuration)

顯示目前的認證設定。

```bash
msstore info
```

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-v, --verbose` | 列印詳細輸出 |

### reconfigure - 設定認證 (reconfigure - Configure Credentials)

設定或更新 Microsoft Store API 認證。

```bash
msstore reconfigure [options]
```

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-t, --tenantId` | Azure AD 租用戶識別碼 |
| `-s, --sellerId` | 小組中心賣家識別碼 |
| `-c, --clientId` | Azure AD 應用程式用戶端識別碼 |
| `-cs, --clientSecret` | 用於驗證的用戶端密碼 |
| `-ct, --certificateThumbprint` | 憑證指紋（用戶端密碼的替代方案） |
| `-cfp, --certificateFilePath` | 憑證檔案路徑（用戶端密碼的替代方案） |
| `-cp, --certificatePassword` | 憑證密碼 |
| `--reset` | 僅重設認證而不進行完整重新設定 |

**範例：**

```bash
# 使用用戶端密碼進行設定
msstore reconfigure --tenantId $TENANT_ID --sellerId $SELLER_ID --clientId $CLIENT_ID --clientSecret $CLIENT_SECRET

# 使用憑證進行設定
msstore reconfigure --tenantId $TENANT_ID --sellerId $SELLER_ID --clientId $CLIENT_ID --certificateFilePath ./cert.pfx --certificatePassword MyPassword
```

### settings - CLI 設定 (settings - CLI Settings)

變更 Microsoft Store 開發者 CLI 的設定。

```bash
msstore settings [options]
```

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-t, --enableTelemetry` | 啟用 (true) 或停用 (false) 遙測 |

#### 設定發行者顯示名稱 (Set Publisher Display Name)

```bash
msstore settings setpdn <publisherDisplayName>
```

為 `init` 指令設定預設的發行者顯示名稱。

### apps - 應用程式管理 (apps - Application Management)

列出並擷取應用程式資訊。

#### 列出應用程式 (List Applications)

```bash
msstore apps list
```

列出您小組中心帳戶中的所有應用程式。

#### 獲取應用程式詳細資訊 (Get Application Details)

```bash
msstore apps get <productId>
```

**引數：**

| 引數 | 說明 |
| -------- | ----------- |
| `productId` | Store 產品識別碼（例如：9NBLGGH4R315） |

**範例：**

```bash
# 獲取特定應用程式的詳細資訊
msstore apps get 9NBLGGH4R315
```

### submission - 提交管理 (submission - Submission Management)

管理 Store 提交。

| 子指令 | 說明 |
| ----------- | ----------- |
| `status` | 獲取提交狀態 |
| `get` | 獲取提交中繼資料與套件資訊 |
| `getListingAssets` | 獲取提交的清單資產 (listing assets) |
| `updateMetadata` | 更新提交中繼資料 |
| `poll` | 持續輪詢提交狀態直到完成 |
| `publish` | 發佈提交 |
| `delete` | 刪除提交 |

#### 獲取提交狀態 (Get Submission Status)

```bash
msstore submission status <productId>
```

#### 獲取提交詳細資訊 (Get Submission Details)

```bash
msstore submission get <productId>
```

#### 更新中繼資料 (Update Metadata)

```bash
msstore submission updateMetadata <productId> <metadata>
```

其中 `<metadata>` 是包含更新後中繼資料的 JSON 字串。由於 JSON 包含殼層會解釋的字元（括號、大括號等），您必須適當引用及/或逸出該值：

- **Bash/Zsh**：將 JSON 用單引號括起來，以便殼層逐字傳遞。
  ```bash
  msstore submission updateMetadata 9NBLGGH4R315 '{"description":"我的更新應用程式"}'
  ```
- **PowerShell**：使用單引號（或在雙引號字串中逸出雙引號）。
  ```powershell
  msstore submission updateMetadata 9NBLGGH4R315 '{"description":"我的更新應用程式"}'
  ```
- **cmd.exe**：在每個內部雙引號前加上反斜槓。
  ```cmd
  msstore submission updateMetadata 9NBLGGH4R315 "{"description":"我的更新應用程式"}"
  ```

> **提示：** 對於複雜或多行的中繼資料，請將 JSON 儲存到檔案中並傳遞其內容，以避免引用問題：
> ```bash
> msstore submission updateMetadata 9NBLGGH4R315 "$(cat metadata.json)"
> ```

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-s, --skipInitialPolling` | 跳過初始狀態輪詢 |

#### 發佈提交 (Publish Submission)

```bash
msstore submission publish <productId>
```

#### 輪詢提交 (Poll Submission)

```bash
msstore submission poll <productId>
```

持續輪詢直到提交狀態為 PUBLISHED（已發佈）或 FAILED（失敗）。

#### 刪除提交 (Delete Submission)

```bash
msstore submission delete <productId>
```

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `--no-confirm` | 跳過確認提示 |

### init - 初始化 Store 專案 (init - Initialize Project for Store)

為 Microsoft Store 發佈初始化專案。自動偵測專案型別並設定 Store 識別。

```bash
msstore init <pathOrUrl> [options]
```

**引數：**

| 引數 | 說明 |
| -------- | ----------- |
| `pathOrUrl` | 專案目錄路徑或 PWA URL |

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-n, --publisherDisplayName` | 發行者顯示名稱 |
| `--package` | 同時封裝專案 |
| `--publish` | 封裝並發佈（隱含 --package） |
| `-f, --flightId` | 發佈到特定的發行 (flight) |
| `-prp, --packageRolloutPercentage` | 漸進式推出百分比 (0-100) |
| `-a, --arch` | 架構：x86, x64, arm64 |
| `-o, --output` | 套件的輸出目錄 |
| `-ver, --version` | 建置時使用的版本 |

**支援的專案型別：**

- Windows App SDK / WinUI 3
- UWP
- .NET MAUI
- Flutter
- Electron
- React Native for Desktop
- PWA (Progressive Web Apps)

**範例：**

```bash
# 初始化 WinUI 專案
msstore init ./my-winui-app

# 初始化 PWA
msstore init https://contoso.com --output ./pwa-package

# 初始化並發佈
msstore init ./my-app --publish
```

### package - 為 Store 封裝 (package - Package for Store)

封裝用於 Microsoft Store 提交的應用程式。

```bash
msstore package <pathOrUrl> [options]
```

**引數：**

| 引數 | 說明 |
| -------- | ----------- |
| `pathOrUrl` | 專案目錄路徑或 PWA URL |

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-o, --output` | 套件的輸出目錄 |
| `-a, --arch` | 架構：x86, x64, arm64 |
| `-ver, --version` | 套件的版本 |

**範例：**

```bash
# 為預設架構封裝
msstore package ./my-app

# 為多個架構封裝
msstore package ./my-app --arch x64,arm64 --output ./packages

# 搭配特定版本封裝
msstore package ./my-app --version 1.2.3.0
```

### publish - 向 Store 發佈 (publish - Publish to Store)

將應用程式發佈到 Microsoft Store。

```bash
msstore publish <pathOrUrl> [options]
```

**引數：**

| 引數 | 說明 |
| -------- | ----------- |
| `pathOrUrl` | 專案目錄路徑或 PWA URL |

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-i, --inputFile` | 現有 .msix 或 .msixupload 檔案的路徑 |
| `-id, --appId` | 應用程式識別碼（如果未初始化） |
| `-nc, --noCommit` | 將提交保持在草稿狀態 |
| `-f, --flightId` | 發佈到特定的發行 (flight) |
| `-prp, --packageRolloutPercentage` | 漸進式推出百分比 (0-100) |

**範例：**

```bash
# 發佈專案
msstore publish ./my-app

# 發佈現有套件
msstore publish ./my-app --inputFile ./packages/MyApp.msixupload

# 以草稿形式發佈
msstore publish ./my-app --noCommit

# 搭配漸進式推出發佈
msstore publish ./my-app --packageRolloutPercentage 10
```

### flights - 套件發行管理 (flights - Package Flight Management)

管理套件發行（Beta 測試小組）。

| 子指令 | 說明 |
| ----------- | ----------- |
| `list` | 列出應用程式的所有發行 |
| `get` | 獲取發行詳細資訊 |
| `delete` | 刪除發行 |
| `create` | 建立新發行 |
| `submission` | 管理發行提交 |

#### 列出發行 (List Flights)

```bash
msstore flights list <productId>
```

#### 獲取發行詳細資訊 (Get Flight Details)

```bash
msstore flights get <productId> <flightId>
```

#### 建立發行 (Create Flight)

```bash
msstore flights create <productId> <friendlyName> --group-ids <group-ids>
```

**選項：**

| 選項 | 說明 |
| ------ | ----------- |
| `-g, --group-ids` | 發行小組識別碼（以逗號分隔） |
| `-r, --rank-higher-than` | 要排在其前面的發行識別碼 |

#### 刪除發行 (Delete Flight)

```bash
msstore flights delete <productId> <flightId>
```

#### 發行提交 (Flight Submissions)

```bash
# 獲取發行提交
msstore flights submission get <productId> <flightId>

# 發佈發行提交
msstore flights submission publish <productId> <flightId>

# 檢查發行提交狀態
msstore flights submission status <productId> <flightId>

# 輪詢發行提交
msstore flights submission poll <productId> <flightId>

# 刪除發行提交
msstore flights submission delete <productId> <flightId>
```

#### 發行推出管理 (Flight Rollout Management)

```bash
# 獲取推出狀態
msstore flights submission rollout get <productId> <flightId>

# 更新推出百分比
msstore flights submission rollout update <productId> <flightId> <percentage>

# 停止推出
msstore flights submission rollout halt <productId> <flightId>

# 完成推出 (100%)
msstore flights submission rollout finalize <productId> <flightId>
```

## 常見工作流 (Common Workflows)

### 工作流 1：第一次設定 Store (Workflow 1: First-Time Store Setup)

```bash
# 1. 安裝 CLI
winget install "Microsoft Store Developer CLI"

# 2. 設定認證（從小組中心獲取）
msstore reconfigure --tenantId $TENANT_ID --sellerId $SELLER_ID --clientId $CLIENT_ID --clientSecret $CLIENT_SECRET

# 3. 驗證設定
msstore info

# 4. 列出您的應用程式以確認存取權限
msstore apps list
```

### 工作流 2：初始化並發佈新應用程式 (Workflow 2: Initialize and Publish New App)

```bash
# 1. 導覽至專案
cd my-winui-app

# 2. 為 Store 初始化（建立/更新應用程式識別碼）
msstore init .

# 3. 封裝應用程式
msstore package . --arch x64,arm64

# 4. 向 Store 發佈
msstore publish .

# 5. 檢查提交狀態
msstore submission status <productId>
```

### 工作流 3：更新現有應用程式 (Workflow 3: Update Existing App)

```bash
# 1. 建置您的更新後應用程式
dotnet publish -c Release

# 2. 封裝並發佈
msstore publish ./my-app

# 或從現有套件發佈
msstore publish ./my-app --inputFile ./artifacts/MyApp.msixupload
```

### 工作流 4：漸進式推出 (Workflow 4: Gradual Rollout)

```bash
# 1. 以初始推出百分比發佈
msstore publish ./my-app --packageRolloutPercentage 10

# 2. 監控並增加推出比例
msstore submission poll <productId>

# 3. （驗證後）完成推出至 100%
# 這會透過小組中心或提交更新來完成
```

### 工作流 5：使用發行進行 Beta 測試 (Workflow 5: Beta Testing with Flights)

```bash
# 1. 先在小組中心建立發行小組
# 然後建立發行
msstore flights create <productId> "Beta 測試員" --group-ids "group-id-1,group-id-2"

# 2. 向發行發佈
msstore publish ./my-app --flightId <flightId>

# 3. 檢查發行提交狀態
msstore flights submission status <productId> <flightId>

# 4. 測試後，向生產環境發佈
msstore publish ./my-app
```

### 工作流 6：CI/CD 管線整合 (Workflow 6: CI/CD Pipeline Integration)

```yaml
# GitHub Actions 範例
name: Publish to Store

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'
      
      - name: Install msstore CLI
        run: winget install "Microsoft Store Developer CLI" --accept-package-agreements --accept-source-agreements
      
      - name: Configure Store credentials
        run: |
          msstore reconfigure --tenantId ${{ secrets.TENANT_ID }} --sellerId ${{ secrets.SELLER_ID }} --clientId ${{ secrets.CLIENT_ID }} --clientSecret ${{ secrets.CLIENT_SECRET }}
      
      - name: Build application
        run: dotnet publish -c Release
      
      - name: Publish to Store
        run: msstore publish ./src/MyApp
```

## 與 winapp CLI 整合 (Integration with winapp CLI)

winapp CLI (v0.2.0+) 透過 `winapp store` 子指令與 msstore 整合：

```bash
# 這些指令是等效的：
msstore reconfigure --tenantId xxx --clientId xxx --clientSecret xxx
winapp store reconfigure --tenantId xxx --clientId xxx --clientSecret xxx

# 列出應用程式
msstore apps list
winapp store apps list

# 發佈
msstore publish ./my-app
winapp store publish ./my-app
```

當您想要針對封裝與發佈使用統一的 CLI 體驗時，請使用 `winapp store`。

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
| ----- | -------- |
| 驗證失敗 | 使用 `msstore info` 驗證認證；重新執行 `msstore reconfigure` |
| 找不到應用程式 | 確保產品識別碼正確；執行 `msstore apps list` 進行驗證 |
| 權限不足 | 在小組中心檢查 Azure AD 應用程式角色（需要經理或開發者） |
| 套件驗證失敗 | 確保套件符合 Store 要求；檢查小組中心以獲取詳細資訊 |
| 提交卡住 | 執行 `msstore submission poll <productId>` 以檢查狀態 |
| 找不到發行 | 透過 `msstore flights list <productId>` 驗證發行識別碼 |
| 推出百分比無效 | 值必須介於 0 到 100 之間 |
| PWA 初始化失敗 | 確保 URL 可公開存取且具有有效的 Web 應用程式資訊清單 |

## 環境變數 (Environment Variables)

此 CLI 支援針對認證使用環境變數：

| 變數 | 說明 |
| -------- | ----------- |
| `MSSTORE_TENANT_ID` | Azure AD 租用戶識別碼 |
| `MSSTORE_SELLER_ID` | 小組中心賣家識別碼 |
| `MSSTORE_CLIENT_ID` | Azure AD 應用程式用戶端識別碼 |
| `MSSTORE_CLIENT_SECRET` | 用戶端密碼 |

## 參考資料 (References)

- [Microsoft Store 開發者 CLI 文件](https://learn.microsoft.com/windows/apps/publish/msstore-dev-cli/overview)
- [CLI 指令參考](https://learn.microsoft.com/windows/apps/publish/msstore-dev-cli/commands)
- [GitHub 存放庫](https://github.com/microsoft/msstore-cli)
- [小組中心 API](https://learn.microsoft.com/windows/uwp/monetize/using-windows-store-services)
- [應用程式提交 API](https://learn.microsoft.com/windows/uwp/monetize/create-and-manage-submissions-using-windows-store-services)
- [套件發行概觀](https://learn.microsoft.com/windows/uwp/publish/package-flights)
- [漸進式套件推出](https://learn.microsoft.com/windows/uwp/publish/gradual-package-rollout)
