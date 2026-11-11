# 可觀察性契約 (Observability contract)

`foundry-agentic-loop` skill 的參考資料：產生的基礎結構必須滿足的端對端監視契約。`foundry-agentic-loop` 宣告意圖（遙測**預設開啟**，單一 Application Insights，無金鑰）；本檔案包含基準基礎結構、各層檢測、agent 可觀察性與內容擷取詳細資料。將 SDK/檢測佈線交由 `appinsights-instrumentation` 處理，角色指派交由 `microsoft-foundry/rbac` 子 skill 處理。

端對端監視**預設開啟**：每個層級 -- **後端、託管 agents、MCP 伺服器與 Foundry 模型** -- 皆輸出 OpenTelemetry 至**單一 Application Insights** 資源，使得單一分散式追蹤能跟隨請求從瀏覽器穿透後端、agent 迴圈、每個工具/MCP 呼叫與每個模型呼叫。產生的 Bicep 必須佈建並予以佈線連接。

## 基準基礎結構 (產生的 Bicep)

- 佈建所有元件共用的**單一 Application Insights** 資源（由 Log Analytics 工作區支援）-- 這是讓 **Application Map** 與端對端交易搜尋能正常運作的關鍵。
- 將其連線字串作為 `APPLICATIONINSIGHTS_CONNECTION_STRING` 插入每個應用程式、agent 與 MCP 伺服器；透過 [`rbac-contract.md`](rbac-contract.md) 中的 **Monitoring Metrics Publisher** 指派，以每個元件的**受控識別**驗證遙測通道 -- **資料平面上無檢測金鑰，無連線字串密碼秘密**。
- 使用 `DefaultAzureCredential` 搭配元件的受控識別用戶端識別碼建構匯出工具憑證，絕不單獨使用 `ManagedIdentityCredential`：相同程式碼在 Azure 中以受控識別身分匯出，在本機則以已登入的開發者身分匯出。Bicep 同樣授與部署主體 **Monitoring Metrics Publisher**，因此 Verify 無需部署即可證明遙測運作。
- **將相同的 Application Insights 資源連接至 Foundry 專案**（Foundry 入口網站 → Agents → Traces → Connect，或專案上的 Application Insights 連線），使 Foundry **伺服器端** agent/模型追蹤落在同一個資源中。
- 授與操作員在該資源上的 **Log Analytics Reader** 權限，使其能查詢遙測。

## 各層檢測 (將佈線交由 `appinsights-instrumentation` 處理)

| 層級 | 檢測方式 | 落在 Application Insights 中的內容 |
| --- | --- | --- |
| **後端** (API) | Azure Monitor OpenTelemetry 發行套件 (`configure_azure_monitor()` / `useAzureMonitor()` / `.UseAzureMonitor()`)；自動檢測傳入 + 傳出 HTTP | 請求/相依性 span、記錄、計量；W3C `traceparent` 傳播至 agents、MCP 伺服器與模型 |
| **託管 agent** (Copilot SDK 或 MAF) | 請參閱下方的 *Agent 可觀察性* | `invoke_agent` / `chat` / `execute_tool` span、GenAI 計量、提示詞與回應 (當開啟內容擷取時) |
| **MCP 伺服器** | 伺服器處理程序上的 Azure Monitor OTel 發行套件；將工具名稱、狀態或錯誤類別、持續時間與輸入/輸出大小或項目數記錄為 span 屬性，絕不記錄引數或結果 (請參閱下方的擷取說明) | 透過傳播的追蹤情境巢狀置於 agent 的 `execute_tool` span 之下的工具呼叫 span |
| **Foundry 模型** | Foundry **伺服器端追蹤** (App Insights 連接後自動進行)，加上從自身程式碼呼叫模型時的模型 SDK 檢測 | `gen_ai` 對話 span：模型、權杖使用量、完成原因與提示詞/回應內容 (當開啟擷取時) |

## Agent 可觀察性

- **MAF** 具備原生檢測 (`ENABLE_INSTRUMENTATION=true`) 並發出 `invoke_agent` / `chat` / `execute_tool` span 與 `gen_ai` 計量。當代管轉接器已匯出至 Application Insights 時，不要啟動第二個匯出工具；否則在啟動時呼叫一次 `configure_azure_monitor(connection_string=os.environ["APPLICATIONINSIGHTS_CONNECTION_STRING"])`。
- **Copilot SDK：** 代管轉接器從 `APPLICATIONINSIGHTS_CONNECTION_STRING` 匯出主機 span。Copilot 執行階段為獨立的產生者：僅在用戶端取得將 `COPILOT_OTLP_ENDPOINT` 指向可連線接收器（例如具備 Azure Monitor 匯出工具的收集器）的 `telemetry` 設定時，它才會透過 OTLP 匯出其 `invoke_agent` / `chat` / `execute_tool` span。參考 agent [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) 在 toolbox 邊界新增其專屬的 span。遵循 [copilot-sdk-foundry.md](copilot-sdk-foundry.md#telemetry) 以取得路由、身分識別與傳遞檢查。
- **Foundry 託管 agents** 自動取得注入的 `APPLICATIONINSIGHTS_CONNECTION_STRING`，且無需變更程式碼即可產生**伺服器端追蹤**（agent 執行、工具呼叫、模型呼叫與交談檢視表）；用戶端檢測則疊加於自有應用程式程式碼之上。

## 擷取完整詳細資料 (請求資料、提示詞、回應)

內容擷取**預設關閉**，因為開啟後 span 會攜帶提示詞、完成內容、工具引數/結果與請求主體（有 PII/密碼秘密風險）。依每個層級開啟：

| 層級 | 擷取內容的旗標 |
| --- | --- |
| MAF | `ENABLE_SENSITIVE_DATA=true` (或 `enable_sensitive_telemetry()`) |
| Copilot 執行階段 | `telemetry={"capture_content": True}` |
| 模型 SDK (OpenAI / Azure AI Inference) | `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true` (或 `AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED=true`) |
| 後端 / MCP 伺服器 | 在預設關閉的設定旗標背後，明確將請求/回應主體與工具引數/結果新增為 span 屬性 |

- **將擷取的內容視為敏感資料：** 將擷取保持關閉，除非使用者核准用於具有合成資料的開發/測試環境。在實際執行環境中將其置於設定之後，在匯出前遮蔽密碼秘密與 PII，並套用實際執行的記錄存取與保留控制措施。
- 為每個元件（前端、後端、agent、mcp-server）設定相異的 **雲端角色名稱 / `service.name`**，使 **Application Map** 能呈現拓撲結構且交易能跨層級相互關聯。
- 將 SDK/檢測佈線交由 `appinsights-instrumentation` 處理，角色指派交由 `microsoft-foundry/rbac` 子 skill 處理。
