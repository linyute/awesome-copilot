# TMT 元件分類法 — 程式碼到威脅模型 DFD 參考

從程式碼分析中識別 DFD 元件的完整參考。
與 Microsoft Threat Modeling Tool (TMT) 元件類型保持一致，以確保 TM7 相容性。
這是所有 TMT 類型分類的**唯一權威檔案**。

**圖表樣式與轉譯規則**請參閱：[diagram-conventions.md](./diagram-conventions.md)
**此檔案涵蓋：** 在程式碼中要尋找什麼、如何分類以及如何命名。

---

## 1. 元件類型

**注意：** TMT ID（例如 `SE.P.TMCore.OSProcess`）僅供分類參考。**請勿將 TMT ID 用作 Mermaid 節點 ID。** 請使用簡潔、易讀的 PascalCase ID（例如 `WebServer`、`SqlDatabase`）。

### 1.1 處理程序類型

| TMT ID | 名稱 | 可識別的程式碼模式 |
|--------|------|---------------------------|
| `SE.P.TMCore.OSProcess` | 作業系統處理程序 | 原生可執行檔案、系統處理程序、產生的處理程序 |
| `SE.P.TMCore.Thread` | 執行緒 | 執行緒池、`Task`、`pthread`、工作執行緒 |
| `SE.P.TMCore.WinApp` | 原生應用程式 | Win32 應用程式、C/C++ 可執行檔案、桌面應用程式 |
| `SE.P.TMCore.NetApp` | 受控應用程式 | .NET 應用程式、C# 服務、F# 程式 |
| `SE.P.TMCore.ThickClient` | 豐富型用戶端 | 桌面 GUI 應用程式、WPF、WinForms、Electron |
| `SE.P.TMCore.BrowserClient` | 瀏覽器用戶端 | SPA、JavaScript 應用程式、WebAssembly |
| `SE.P.TMCore.WebServer` | 網頁伺服器 | IIS、Apache、Nginx、Express、Kestrel |
| `SE.P.TMCore.WebApp` | 網頁應用程式 | ASP.NET、Django、Rails、Spring MVC |
| `SE.P.TMCore.WebSvc` | 網頁服務 | REST API、SOAP、GraphQL 端點 |
| `SE.P.TMCore.VM` | 虛擬機器 | 虛擬機器、容器、Docker |
| `SE.P.TMCore.Win32Service` | Win32 服務 | Windows 服務、`ServiceBase` |
| `SE.P.TMCore.KernelThread` | 核心執行緒 | 核心模組、驅動程式、ring-0 程式碼 |
| `SE.P.TMCore.Modern` | Windows Store 處理程序 | UWP 應用程式、Windows Store 應用程式、沙箱應用程式 |
| `SE.P.TMCore.PlugIn` | 瀏覽器與 ActiveX 外掛程式 | 瀏覽器擴充功能、ActiveX、BHO 外掛程式 |
| `SE.P.TMCore.NonMS` | 在非 Microsoft 作業系統上執行的應用程式 | Linux 應用程式、macOS 應用程式、Unix 處理程序 |

### 1.2 外部互動者類型

| TMT ID | 名稱 | 可識別的程式碼模式 |
|--------|------|---------------------------|
| `SE.EI.TMCore.Browser` | 瀏覽器 | 瀏覽器用戶端、使用者代理、網頁 UI 使用者 |
| `SE.EI.TMCore.AuthProvider` | 授權提供者 | OAuth 伺服器、OIDC 提供者、IdP、SAML |
| `SE.EI.TMCore.WebSvc` | 外部網頁服務 | 外部 API、廠商服務、SaaS 端點 |
| `SE.EI.TMCore.User` | 人類使用者 | 終端使用者、操作員、管理員 |
| `SE.EI.TMCore.Megaservice` | 巨型服務 | 大型雲端平台（Azure、AWS、GCP 服務） |
| `SE.EI.TMCore.WebApp` | 外部網頁應用程式 | 第三方網頁應用程式、外部入口網站 |
| `SE.EI.TMCore.CRT` | Windows 執行階段 | WinRT API、Windows 執行階段元件 |
| `SE.EI.TMCore.NFX` | Windows .NET 執行階段 | .NET Framework、CLR、BCL |
| `SE.EI.TMCore.WinRT` | Windows RT 執行階段 | Windows RT 平台、ARM Windows 應用程式 |

### 1.3 資料儲存類型

| TMT ID | 名稱 | 可識別的程式碼模式 |
|--------|------|---------------------------|
| `SE.DS.TMCore.CloudStorage` | 雲端儲存 | Azure Blob, S3, GCS |
| `SE.DS.TMCore.SQL` | SQL 資料庫 | PostgreSQL, MySQL, SQL Server, SQLite |
| `SE.DS.TMCore.NoSQL` | 非關聯式資料庫 | MongoDB, CosmosDB, Redis, Cassandra |
| `SE.DS.TMCore.FS` | 檔案系統 | 本地檔案、NFS、共用磁碟機 |
| `SE.DS.TMCore.Cache` | 快取 | Redis, Memcached, 記憶體內快取 |
| `SE.DS.TMCore.ConfigFile` | 設定檔 | `.env`, `appsettings.json`, YAML 設定 |
| `SE.DS.TMCore.Cookie` | Cookie | HTTP cookie、工作階段 cookie |
| `SE.DS.TMCore.Registry` | 登錄機碼 | Windows 登錄、系統組態儲存 |
| `SE.DS.TMCore.HTML5LS` | HTML5 區域儲存 | `localStorage`, `sessionStorage`, IndexedDB |
| `SE.DS.TMCore.Device` | 裝置 | 硬體裝置、USB、週邊儲存 |

### 1.4 資料流類型

| TMT ID | 名稱 | 可識別的程式碼模式 |
|--------|------|---------------------------|
| `SE.DF.TMCore.HTTP` | HTTP | `fetch()`, `axios`, `HttpClient`, 無 TLS 的 REST |
| `SE.DF.TMCore.HTTPS` | HTTPS | 經 TLS 加密的 REST, `https://` 端點 |
| `SE.DF.TMCore.Binary` | 二進位 | gRPC, Protobuf, 原始二進位協定 |
| `SE.DF.TMCore.NamedPipe` | 具名管道 | 經由具名管道的 IPC |
| `SE.DF.TMCore.SMB` | SMB | SMB/CIFS 檔案共用 |
| `SE.DF.TMCore.UDP` | UDP | UDP 通訊端、資料報協定 |
| `SE.DF.TMCore.SSH` | SSH | SSH 通道、SFTP、SCP |
| `SE.DF.TMCore.LDAP` | LDAP | LDAP 查詢、AD 查閱 |
| `SE.DF.TMCore.LDAPS` | LDAPS | 經由 TLS 的安全 LDAP |
| `SE.DF.TMCore.IPsec` | IPsec | VPN 通道、IPsec 加密連線 |
| `SE.DF.TMCore.RPC` | RPC 或 DCOM | COM+, DCOM, RPC 呼叫, WCF net.tcp |
| `SE.DF.TMCore.ALPC` | ALPC | 進階區域程序呼叫, Windows IPC |
| `SE.DF.TMCore.IOCTL` | IOCTL 介面 | 裝置 I/O 控制、驅動程式通訊 |

### 1.5 信任邊界類型

**線條邊界：**

| TMT ID | 名稱 | 程式碼指標 |
|--------|------|-----------------|
| `SE.TB.L.TMCore.Internet` | 網際網路邊界 | 公用端點、API 閘道 |
| `SE.TB.L.TMCore.Machine` | 機器邊界 | 處理程序邊界、虛擬機器隔離 |
| `SE.TB.L.TMCore.Kernel` | 核心/使用者模式 | 驅動程式、ring 0/3 轉換 |
| `SE.TB.L.TMCore.AppContainer` | 應用程式容器 | UWP 沙箱、應用程式容器 |

**框線邊界：**

| TMT ID | 名稱 | 程式碼指標 |
|--------|------|-----------------|
| `SE.TB.B.TMCore.CorpNet` | 公司網路 | 公司網路、VPN 邊界 |
| `SE.TB.B.TMCore.Sandbox` | 沙箱 | 沙箱執行環境 |
| `SE.TB.B.TMCore.IEB` | Internet Explorer 邊界 | IE 區域、IE 安全性設定 |
| `SE.TB.B.TMCore.NonIEB` | 其他瀏覽器邊界 | Chrome、Firefox、Edge 安全性內容 |

---

## 2. 信任邊界偵測

當程式碼跨越以下各項時，建立信任邊界 (`subgraph`)：

| 邊界類型 | 程式碼指標 |
|---------------|-----------------|
| **網際網路/公用** | 公用端點、API 閘道、負載平衡器 |
| **機器** | 處理程序邊界、主機隔離 |
| **核心/使用者模式** | 核心呼叫、驅動程式、系統呼叫 |
| **應用程式容器** | UWP 沙箱、容器化應用程式 |
| **公司網路** | 公司網路邊界、VPN |
| **沙箱** | 沙箱執行環境 |

---

## 3. 資料流偵測

尋找這些模式以識別資料流：

| 資料流類型 | 程式碼模式 |
|-----------|---------------|
| **HTTP/HTTPS** | `fetch()`, `axios`, `HttpClient`, REST 呼叫 |
| **SQL 資料庫** | ORM 查詢、SQL 連線、`DbContext` |
| **訊息佇列** | 發佈/訂閱、佇列傳送/接收、Dapr 發佈/訂閱 |
| **檔案 I/O** | 檔案讀取/寫入、Blob 上傳/下載 |
| **gRPC** | Protobuf 呼叫、gRPC 串流 |
| **具名管道** | 經由具名管道的 IPC |
| **SSH** | SSH 通道、SFTP、SCP 傳輸 |
| **LDAP/LDAPS** | 目錄查詢、AD 查閱 |

---

## 4. 程式碼分析檢查清單

分析程式碼時，系統性地識別：

1. **進入點** → 外部互動者 + 入站流
   - API 控制器、事件處理常式、Webhook 端點

2. **服務/邏輯** → 處理程序
   - 商業邏輯類別、服務層、背景工作角色

3. **資料存取** → 資料儲存 + 資料流
   - 存放庫類別、DB 內容、快取用戶端

4. **外部呼叫** → 外部互動者 + 出站流
   - HTTP 用戶端、SDK 整合、第三方 API

5. **安全性邊界** → 信任邊界
   - 驗證中介軟體、網路區段、部署單位

6. **Kubernetes Pod 組成** → Sidecar 共同放置
   - 尋找 Helm 圖表、K8s 資訊清單、部署 YAML
   - 常見的 sidecar：Dapr、MISE、Envoy、Istio 代理、Linkerd、記錄收集器
   - **套用 `diagram-conventions.md` 規則 1** — 標註主機節點，絕不建立獨立的 sidecar 節點

---

## 5. 命名規範

請參閱 [diagram-conventions.md](./diagram-conventions.md) 的「命名規範」章節，了解包含引用規則的完整表格。

---

## 6. 輸出檔案

產生**兩個檔案**以獲得最大靈活性：

### 檔案 1：純 Mermaid (`.mmd`)
- 僅包含原始 Mermaid 程式碼，不含 Markdown 包裝
- 用於：CLI 工具、編輯器、CI/CD、直接轉譯

### 檔案 2：Markdown (`.md`)
- 包含在 ` ```mermaid ` 程式碼圍欄中的 Mermaid
- 包含元件、資料流和邊界摘要表
- 用於：GitHub、VS Code、文件

### 格式比較

| 格式 | 副檔名 | 內容 | 最適合用於 |
|--------|-----------|----------|----------|
| 純 Mermaid | `.mmd` | 原始圖表程式碼 | CLI、編輯器、工具 |
| Markdown | `.md` | 圖表 + 表格 | GitHub、文件、檢視 |
