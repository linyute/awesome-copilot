# 無金鑰身分識別與 RBAC 契約 (Keyless identity & RBAC contract)

`foundry-agentic-loop` skill 的參考資料：部署所建立的主體 → 範圍 → 角色矩陣：包含**佈建時產生的 Bicep**，加上用於託管 agent 執行階段執行個體身分識別（僅在 agent 部署後存在）的具等冪性 **`postdeploy` 攔截勾點**。`foundry-agentic-loop` 宣告意圖（受控識別 + 最低權限 RBAC，控制/資料平面上無管理員金鑰或連線字串）；本檔案包含完整矩陣與備註。將精確角色 GUID 與 `Microsoft.Authorization/roleAssignments` 語法交由受維護的 `microsoft-foundry/rbac` 子 skill 處理。

此處包含兩個矩陣，回答不同的問題：

| 矩陣 | 主體 | 何時適用 |
| --- | --- | --- |
| [執行階段矩陣](#執行階段矩陣服務受控識別) (下方) | 解決方案的**受控識別** | 由部署建立：佈建時的 Bicep，加上用於執行階段執行個體列的 `postdeploy` 攔截勾點 |
| [部署者必備條件](#部署者必備條件預檢) | 執行迴圈的**呼叫者** | 必須在**佈建之前**即已存在，否則佈建會在進行到一半時中斷 |

## 執行階段矩陣 (服務受控識別)

每個元件皆使用**受控識別**（優先選用使用者指派）與**最低權限 RBAC** 進行驗證 -- 控制/資料平面上無管理員金鑰，無連線字串。

| 主體 (受控識別) | 範圍 / 目標資源 | Azure 角色 | 原因 |
| --- | --- | --- | --- |
| 前端 container app | Azure Container Registry (ACR) | **AcrPull** | 提取前端容器映像檔 |
| 後端 container app | Azure Container Registry (ACR) | **AcrPull** | 提取後端容器映像檔 |
| 後端 container app | Foundry **AI 帳戶** (AI Services / Foundry 帳戶) | **Foundry User** | 叫用 Foundry 託管 agents |
| Foundry **專案**受控識別 | Azure Container Registry (ACR) | **Container Registry Repository Reader** (或 **AcrPull**) | 在執行階段提取**託管 agent 映像檔** |
| Foundry **專案**受控識別 | Foundry **AI 帳戶** | **Foundry User** | 專案代理中介的模型推論 (通常在專案建立時自動指派) |
| 託管 agent **執行階段執行個體**受控識別 | Foundry **AI 帳戶** | **Cognitive Services OpenAI User** (若呼叫非 OpenAI 帳戶功能則加 **Foundry User**) | **BYOK 直接推論** (Copilot SDK / MAF 使用自身權杖呼叫模型端點) |
| 託管 agent **執行階段執行個體**受控識別 | Foundry **專案** | **Foundry User** | 執行階段 skill 下載 (`AIProjectClient` skills API 需要 `agents/read`；若無託管叫用會傳回 500) |
| 託管 agent **agent 身分識別** (`agentIdentityId`) | 每個下游工具/基礎資源 (Storage, AI Search / Foundry IQ 支援服務, Cosmos, Key Vault, ...) | 資源的資料角色 (例如 **Storage Blob Data Contributor**, **Search Index Data Reader**) | 預設 toolbox MCP 路徑：Agent Service 使用 agent 身分識別代理中介工具與基礎存取 |
| 託管 agent **執行階段執行個體受控識別** | Azure AI Search (Foundry IQ 支援服務) | **Search Index Data Reader** | 僅限應急出口：使用 `DefaultAzureCredential` 進行程式碼內直接 Search / Foundry IQ 擷取；不屬於預設 toolbox 路徑 |
| Foundry **專案**受控識別 | Log Analytics 工作區 | **Log Analytics Data Reader** | 僅當 **Foundry Evals** 在範圍內時 (讀取追蹤) |
| 前端 container app | Application Insights | **Monitoring Metrics Publisher** | 傳送遙測 |
| 後端 container app | Application Insights | **Monitoring Metrics Publisher** | 傳送遙測 |
| 託管 agent **執行階段執行個體**受控識別 | Application Insights | **Monitoring Metrics Publisher** | 傳送遙測 |
| MCP 伺服器 (container app) | Application Insights | **Monitoring Metrics Publisher** | 傳送遙測 |
| 部署主體 (`AZURE_PRINCIPAL_ID` 中的 `principalId`) | Application Insights | **Monitoring Metrics Publisher** | 本機 Verify 執行傳送遙測 (唯一的非服務列) |

- 將 **Foundry User** 的範圍限制在 **AI 帳戶**（而非單一專案），讓後端能叫用其中的任何託管 agent。Foundry User 為重新命名後的 Azure AI User；在 Bicep 中，請依定義 ID 引用內建角色，絕不使用顯示名稱。
- **模型推論取決於推論路徑。** 以 **agent 身分識別** 進行的專案代理中介推論涵蓋在*隱含存取*中 — 不需要角色。**BYOK 直接推論**（Copilot SDK / MAF agent 使用來自 `DefaultAzureCredential` 的權杖呼叫模型端點）驗證為**執行階段執行個體受控識別**，該身分**沒有**隱含存取 — 需在 **AI 帳戶**範圍授與 **Cognitive Services OpenAI User**，否則推論會以 `401 PermissionDenied` 失敗。**blueprint** 主體拒絕角色指派 (`PrincipalTypeNotSupported`)；其用戶端識別碼僅用於 MCP Easy Auth 允許清單中。azd 僅會自動指派 `Foundry User` 給共用的專案 agent 身分識別，因此需在具等冪性的 `postdeploy` 攔截勾點中建立執行階段執行個體列（[部署後的授權](azd-layout.md#grants-after-deploy)）。
- 將 **Cognitive Services OpenAI User** 的範圍限制在託管模型部署的 AI 帳戶。
- **工具/MCP 與預設 Foundry IQ 基礎存取是針對 `agentIdentityId` 授權，而非執行階段 MI** — Agent Service 為 `AgenticIdentityToken`/`AgenticIdentity` 連線代理中介 agent 身分識別權杖。在**發佈**時，agent 可能會取得**新**的 `agentIdentityId`；請重複這些指派（共用專案的角色不會沿用）。
- **執行階段執行個體 MI 的 Search 存取是應急出口，而非基準。** 僅在 agent 執行程式碼內直接 Search / Foundry IQ 擷取而非取用代理中介的 toolbox 基礎工具時，才授與 **Search Index Data Reader** 給執行階段執行個體 MI。執行個體身分識別是在部署/發佈時鑄造的，因此若使用了應急出口，請讓該授權在 `postdeploy` 攔截勾點中具可重現性。請參閱 [`foundry-iq-grounding.md`](foundry-iq-grounding.md#escape-hatch-direct-in-code-retrieval)。
- 將 **AcrPull** 的範圍限制在登錄檔，並使用受控識別提取映像檔 - 保持 ACR 管理員使用者為停用狀態。
- 將角色指派給每個應用程式/agent 的身分識別，而非共用主體，以確保矩陣維持最低權限且具備可稽核性。

## 部署者必備條件 (預檢)

上述執行階段矩陣的每一列皆**由部署建立**，這表示執行迴圈的呼叫者既需要建立資源的權限，*也*需要寫入這些角色指派的權限。缺少呼叫者權限在開始時不會清楚報錯 - 它們會在需要該權限的第一個操作時失敗，且**是在部分資源已存在之後**。

因此，這些指派必須在**佈建之前**由 [RBAC 預檢](rbac-preflight.md)進行驗證，該預檢會比對此表格與呼叫者的有效指派，並在單一清單中回報所有缺口。

| 主體 | 範圍 | Azure 角色 | 原因 |
| --- | --- | --- | --- |
| 呼叫者 (部署主體) | 訂用帳戶 | **Contributor** | 建立資源群組與參考架構中的每個資源 |
| 呼叫者 (部署主體) | 訂用帳戶 | **Role Based Access Control Administrator** | `Microsoft.Authorization/roleAssignments/write` - Bicep 與 `postdeploy` 攔截勾點建立執行階段矩陣列 |
| 呼叫者 (部署主體) | 現有資源群組 | **Contributor** | 在現有群組中建立解決方案的每個資源 |
| 呼叫者 (部署主體) | 現有資源群組 | **Role Based Access Control Administrator** | 在群組中寫入執行階段矩陣列 (ACR 提取、App Insights 發布者、Foundry 存取) |
| 呼叫者 (部署主體) | 現有 Foundry **AI 帳戶** | **Foundry Account Owner** | 建立專案、模型部署與帳戶資源 (控制平面) |
| 呼叫者 (部署主體) | 現有 Foundry **專案** | **Foundry Project Manager**，或 **Foundry User** 加上帳戶控制平面角色 | 建立與發佈託管 agents、skills、toolboxes (資料平面) 與專案連線 (控制平面) |

- **較廣泛滿足較狹窄。** **Owner** 可滿足 Contributor *與* Role Based Access Control Administrator；**User Access Administrator** 可滿足 Role Based Access Control Administrator；**Foundry Owner** 可滿足兩個 Foundry 列；Owner、Contributor 與 Cognitive Services Contributor 可滿足帳戶列。因此，具備完整權限的呼叫者會回報無缺口，而非出現大量誤報。
- **控制平面不等於資料平面。** Owner、Contributor 與 Foundry Account Owner 不包含 `dataActions`，因此訂用帳戶 Owner 仍無法建立 agents、skills 或 toolboxes，直到它在專案上也持有 **Foundry User** 為止。Foundry User 不包含寫入動作，因此需要帳戶控制平面角色才能建立專案連線。
- **比對角色定義 ID。** Azure AI 角色已重新命名為 Foundry 角色，舊的顯示名稱已無法解析；預檢與 Bicep 皆使用內建角色定義 ID。
- **計入繼承。** 訂用帳戶上的指派適用於其下的資源群組以及 Foundry 帳戶與專案；預檢會解析有效指派（繼承與衍生自群組），而非僅限直接指派。
- **現有資源群組取代訂用帳戶列。** 當執行部署至已存在的群組時，改為適用其各列；訂用帳戶授權仍可透過繼承滿足這些需求。SDD 建立 `rg-<env>`，因此其首次佈建會檢查訂用帳戶列。
- **Foundry 範圍僅在帳戶/專案存在後才存在。** 在綠地執行中，帳戶與專案由部署建立，因此預檢會檢查將允許其建立的繼承訂用帳戶範圍權限，並在具體 Foundry 範圍提供時（針對現有專案的棕地執行）重新檢查這些範圍。
- 預先一次性將這些權限授與呼叫者 - 切勿透過降級回退至管理員金鑰或連線字串來繞過缺口，這會破壞上述的無金鑰契約。
