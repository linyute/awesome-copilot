# 搭配 Foundry 的 Copilot SDK

僅在需要 Copilot SDK agent、SDK/身分識別疑難排解或相依性封裝後備方案時閱讀。當架構選用 Microsoft Agent Framework 時繼續使用；本秘笈不變更架構預設值。

**秘笈修訂版 3 (2026-10-19)。** 設定與簽章已對照 `github/copilot-sdk` **v1.0.14** 進行原始碼比對，並在下列已安裝套件上重新檢查。"v1.0.14" 標籤代表首個檢查的發行版本，而非上限。這並非主張每個 SDK/執行階段組合皆已通過託管部署。請保留專案核准的相容鎖定版本；在[託管檢查點](hosted-integration-checkpoint.md)記錄並驗證其實際組合。

| 本秘笈使用的介面 | 1.0.14 | 1.0.20 (已安裝檢查) | 更晚版本 |
| --- | --- | --- | --- |
| `create_session(*, provider=..., mcp_servers=...)` 僅限關鍵字引數 | 是 | 是 | 檢視 |
| `send_and_wait(prompt: str, *, request_headers=...)` | 是 | 是 | 檢視 |
| `ProviderConfig.bearer_token_provider` 重新整理回呼 | 是 | 是 | 檢視 |
| `MCPHTTPServerConfig.headers` 靜態字典 (無重新整理回呼) | 是 | 是 | 檢視 |
| `CopilotClient(telemetry=TelemetryConfig)` 與 `get_status().version` | 是 | 是 | 檢視 |
| `azure-ai-agentserver-responses` `ResponseEventStream` 項目 ([託管 agent](foundry-hosted-agent.md#hosted-agent-protocol)) | 2.2.0 | 2.3.0 | 檢視 |

對於未列出的版本，在編寫程式碼前請先檢視這些簽章，並將結果記錄於相容性記錄中。

## 相容性記錄優先

在疑難排解之前，記錄 Python（保留 **3.13**）、`github-copilot-sdk`、Azure Identity、專案/代管轉接器版本、鎖定檔案雜湊值以及**執行中的 Copilot 執行階段版本**。在 v1.0.14 中，用戶端啟動後，`(await client.get_status()).version` 回報該執行階段；`importlib.metadata.version("github-copilot-sdk")` 回報 Python 套件。切勿假設開發者 shell 的 `copilot --version` 就是部署的執行階段。

檢視已安裝的簽章/型別，尤其是 `CopilotClient.create_session`、`CopilotSession.send_and_wait`、`ProviderConfig` 以及代管請求情境存取器。v1.0.14 Python 介面在 `create_session` 中使用關鍵字引數、在 `send_and_wait` 中使用字串提示詞，並使用 `request_headers` 作為每輪次的模型標頭。接受設定/訊息字典的舊版範例不可互換。此版本中 bearer-token 回呼介面處於實驗階段：請檢查執行階段是否支援其通訊協定；切勿在未提示下將不受支援的重新整理回呼替換為靜態權杖。使用 SDK 支援的執行階段發行套件並鎖定已驗證的組合。

## 模型設定與權杖重新整理

針對探索到的相容於 OpenAI 的 **`/openai/v1/`** 基底，使用 `type: "openai"` 與 `wire_api: "responses"`。保留 Basic 範例的實際部署或使用者現有的部署；模型目錄名稱不一定就是其部署名稱。切勿將此路由與原生 `type: "azure"` 僅限主機的秘笈或託管 agent Responses 端點混用。

下列提供者程式碼片段使用 v1.0.14 欄位。在託管執行中，`credential` 必須是經核准的**已部署工作負載**非同步憑證；透過目前的 `microsoft-foundry` 指引選取它。`token_scope` 來自已驗證的端點契約（記錄記載的 Foundry 路徑使用 `https://ai.azure.com/.default`）；針對不同的 Azure 端點請驗證其對象 (audience) 而非逕行假設。

```python
from azure.core.credentials_async import AsyncTokenCredential
from copilot.session import ProviderConfig, ProviderTokenArgs

def model_provider(
    base_url: str,
    token_scope: str,
    credential: AsyncTokenCredential,
) -> ProviderConfig:
    async def refresh_token(_request: ProviderTokenArgs) -> str:
        return (await credential.get_token(token_scope)).token

    return {
        "type": "openai",
        "base_url": base_url,
        "wire_api": "responses",
        "bearer_token_provider": refresh_token,
    }
```

SDK 會在發送對外提供者呼叫前請求權杖；Azure Identity 會處理快取與續訂。為其所屬的用戶端保持該憑證有效，並在關閉時將其關閉。切勿在 `bearer_token`、`.env` 或長效 Authorization 標頭中擷取單一啟動權杖。在模擬過期後測試另一個請求；不應需要新的部署。

使用明確的最低權限權限處理常式（而非不受限制的核准捷徑），搭配已驗證的提供者與部署來建立工作階段。在傳送前先訂閱錯誤與執行事件；單純的 `send_and_wait`/`session.idle` 並非託管 Responses 的成功條件。其逾時不會中止進行中的工作：透過受支援的生命週期 API 明確取消/清理該任務持有的請求。使用檢查點的終端狀態與結構描述驗證。

## 託管呼叫者情境轉發

使用目前代管轉接器的請求情境存取器；驗證其已安裝的 API 而非猜測匯入。針對**容器通訊協定 2.0.0**，記錄記載的對外呼叫者情境標頭為 **`x-agent-foundry-call-id`**。將其不透明數值原封不動轉發至所設定的 Foundry **模型與 toolbox** 請求。平台產生的 **`x-agent-user-id` 為本機分割情境，絕不可對外轉發**。切勿複製所有傳入標頭、信任呼叫者提供的 `x-client-*` 作為身分識別，或傳播傳入的 Authorization/cookies。

- 為每個託管請求擷取允許清單中的情境複本。在 v1.0.14 中透過 `session.send_and_wait(prompt, request_headers=foundry_headers)` 傳遞呼叫識別碼以用於模型請求。對於使用提供者 `headers` 的轉接器，請在每個請求中隔離提供者/工作階段；切勿變更全域標頭字典。
- 將相同請求的呼叫識別碼傳遞至 MCP `tools/list`、skill 載入與 `tools/call` 請求。使用感知平台的 toolbox 用戶端，或為 toolbox 對象取得/重新整理其專屬權杖的請求區域 MCP 轉接器。Copilot 模型的 `bearer_token_provider` **不會**重新整理 MCP 憑證。
- 在 v1.0.14 中，遠端 MCP 設定將 `headers` 公開為靜態字典，而非權杖重新整理回呼。切勿自行發明回呼欄位，或在該處無限期保留啟動 bearer 權杖。請使用受支援的重新整理 MCP 傳輸，或具備明確權杖存留期/重新連線處理的請求範圍連線；保留最低權限的工具核准機制。
- 將 SDK 工作階段、回呼與 MCP 連線繫結至發起呼叫者/輪次。在跨越非同步/處理程序邊界之前擷取請求情境；回呼可能會在代管情境變數之外執行。隔離並行工作階段或將同工作階段的輪次序列化，以避免標頭/結果跨請求交錯。
- 僅將平台情境傳送至預期的受信任 Foundry 端點，絕不傳送至任意工具 URL 或記錄中。Toolbox 連線控管下游憑證。針對純本機測試，缺少平台情境可能是合理的；切勿捏造呼叫識別碼。若部署路徑需要情境而其遺漏，請明確使該探測失敗。

透過遮蔽檢測驗證實際對外標頭的**存在與請求關聯性**，包含兩個並行請求與權杖續訂。切勿僅檢視設定或使用 SDK 模擬物件作為託管執行階段已轉發標頭的證明。

## 遙測 (Telemetry)

在最小切片中、部署之前設定遙測。Python 代管轉接器與 Copilot 執行階段為獨立的遙測產生者：單純的專案連線或 Python 匯出工具無法證明執行階段模型/工具 span 已被匯出。

1. **記錄路由。** 將代管/Copilot SDK 與執行中的執行階段版本、匯出路徑、探索到的接收器端點與匯出身分識別/範圍新增至根目錄 `README.md` (rapid) 或 `docs/implementation.md` (SDD)，並將 Application Insights 資源識別碼新增至 `.azure/deployment-plan.md`。將連線設定保留在適當的部署設定與 Git 忽略的 `.env` 中，而非診斷記錄中。透過 `microsoft-foundry` 解析所選專案連結的 Application Insights；優先使用其 azd 所屬數值而非重複的 metadata。切勿在未提示下使用不同的目的地。
2. **設定主機一次。** 在建構代管轉接器之前載入遙測設定。目前的 AgentServer Core 透過 `microsoft-opentelemetry` 初始化可觀察性，支援使用 `APPLICATIONINSIGHTS_CONNECTION_STRING` 進行 Azure Monitor 匯出，並支援使用 `OTEL_EXPORTER_OTLP_ENDPOINT` 進行 OTLP 匯出。在使用這些設定前請先檢視已安裝轉接器的行為；切勿重複獨立初始化全域提供者/匯出工具。一般 HTTP 用戶端檢測在檢視的原始碼中預設為停用：僅啟用所需的受支援檢測，或在所屬的 MCP/應用程式邊界新增明確 span。
3. **明確設定執行階段。** 將下列 v1.0.14 片段合併至現有用戶端的設定中，而非建立第二個執行階段。`COPILOT_OTLP_ENDPOINT` 為應用程式定義的變數，包含經過驗證、可連線的 OTLP HTTP 接收器基底 URL，而非 Application Insights 連線字串或一般擷取 URL。

   ```python
   import os
   from copilot import CopilotClient

   client = CopilotClient(
       telemetry={
           "otlp_endpoint": os.environ["COPILOT_OTLP_ENDPOINT"],
           "otlp_protocol": "http/protobuf",
           "exporter_type": "otlp-http",
           "capture_content": False,
       },
   )
   ```

   驗證接收器是否支援轉發匯出至預期的 Azure Monitor/Application Insights 目的地。重複使用可運作的路由；在佈建收集器或其他擷取資源前取得核准。原生 Azure Monitor OTLP 擷取需要其探索到的端點、資料收集規則 (DCR) 與驗證；一般連線字串無法設定該路由。切勿將 HTTP/protobuf 用戶端指向僅限 gRPC 的接收器，或假設 Python 主機就是 OTLP 接收器。
4. **檢查實際的匯出工具身分識別。** 針對已安裝版本與選定路由驗證受支援的驗證方式。目前的 Core 原始碼支援使用受控識別進行 Azure Monitor 匯出的 `APPLICATIONINSIGHTS_AUTH_MODE=entra`。直接進行具驗證的 Application Insights 擷取需要實際發送者在元件上擁有適用權限；原生 OTLP 收集器擷取需要收集器身分識別在 DCR 上具備 Monitoring Metrics Publisher 角色。遠端收集器可擁有與 agent 不同的身分識別。部署後重新檢查實際主體，並將目前的角色/資源機制交由 `microsoft-foundry` 處理；切勿不加區別地授與這兩種範圍。
5. **保留分散式追蹤情境。** 將工作階段建立/繼續/傳送維持在預期的作用中代管請求 span 之下。在 OpenTelemetry 可用且已設定的情況下，v1.0.14 Python 會將 W3C `traceparent`/`tracestate` 傳播至執行階段，並在工具回呼周圍還原情境。透過受支援的 MCP 傳輸或所屬邊界檢測保留情境。測試並行請求以確認正確的追蹤/父系關聯；切勿使用全域可變追蹤標頭字典。W3C 追蹤與 `x-agent-foundry-call-id` 驗證情境彼此獨立；兩者無法互相替代。切勿捏造遠端子 span 作為執行證據。
6. **保持內容私密。** 將 Copilot `capture_content=False` 與代管敏感資料擷取保持關閉，除非在具備遮蔽與保留控制措施下獲得明確核准。這些選項不會清理明確的應用程式、轉接器或工具記錄：避免記錄提示詞、完成內容、工具引數/結果、憑證與不透明的呼叫者情境數值。改為記錄安全的識別碼、狀態、持續時間與可用的使用量 metadata。
7. **驗證傳遞與生命週期。** 在請求前啟動檢測，並透過受支援的正常生命週期 API 關閉執行階段/排清所屬匯出工具。記錄取樣設定並確保檢查點探測得以保留，而不無提示地變更實際執行原則。允許有邊界的批次處理/擷取延遲，然後要求已部署探測的代管、模型與必要工具 span 具備正確的追蹤/父系連結以及 agent/版本識別。遵循 Foundry 追蹤工作流程：針對其 Application Insights 結構描述，從依 agent 名稱篩選的 `requests` 開始，並依 `operation_Id` 聯結 `dependencies`。針對原生 OTLP 擷取驗證實際結構描述，而非逕行假設這些資料表。僅限主機的 span、匯出工具啟動與本機模擬物件無法滿足檢查點。

若遺漏 span，在變更程式碼或基礎結構之前，請先檢視產生者啟用狀態、作用中情境、接收器連線能力、目的地/驗證、取樣以及排清/擷取延遲。回報失敗的邊界並保持檢查點封鎖；切勿重新部署未變更的成品以空等遙測資料。

## 相依性封裝後備方案

遠端建構仍為預設值。當伺服器端相依性解析失敗時，首先擷取還原錯誤並更正無效/不相容的需求。針對存取/摘要摘要失敗，遵循已核准的套件摘要指引；切勿停用 TLS 或完整性檢查。若遠端解析仍無法運作，透過 `microsoft-foundry` 使用受支援的**隨附原始碼部署**模式，而非未經請求的容器映像檔移轉。

1. 將已核准的鎖定檔案匯出為完全鎖定且附帶雜湊值的需求檔案，包含可轉移相依性與**目標 Linux wheel 雜湊值**。保留私有摘要/鎖定版本。在全新的任務專屬預備目錄中作業；切勿重複使用 macOS/Windows 虛擬環境。
2. 針對目前記錄記載的 Linux x86_64 Python 3.13 執行階段，將解壓縮的模組安裝至 `packages/`：

   ```bash
   python3.13 -m pip install --require-hashes -r requirements.lock \
     --target packages/ --platform manylinux2014_x86_64 \
     --python-version 3.13 --implementation cp --only-binary=:all:
   ```

   此處的 `requirements.lock` 為匯出的相容於 pip 且雜湊鎖定的檔案。若所需的 wheel 無法取得，請回報套件/平台阻礙；使用具備已驗證成品的相符 Linux 組建，而非無提示地捨棄雜湊值或寄送主機原生二進位檔。
3. 在相符的 Linux/Python 3.13 中驗證匯入與執行階段啟動。Copilot 執行階段/原生資產與 Python wheel 是分開的：解析 SDK 支援的 Linux 執行階段，保留可執行檔權限，並記錄其版本/總和檢查碼。切勿隨附開發者的桌面二進位檔或依賴未經測試的首次啟動下載。
4. 產生扁平的部署封存檔案，根目錄包含進入點、應用程式原始檔、鎖定的需求檔案、必要資產與解壓縮的 `packages/`。使用目前的平台/工具結構描述設定 `runtime: python_3_13` 與 `dependency_resolution: bundled`。檢視封存檔案並確認封裝忽略規則未移除 `packages/`；計算並驗證部署的 ZIP 雜湊值。
5. 從 **Git 與 pytest 探索**（`testpaths`/`norecursedirs` 或存放庫同等設定）中排除預備目錄、`packages/`、執行階段二進位檔與部署封存檔案，但在部署 ZIP 中明確包含必要成品。在 Git 中保留鎖定檔案與封裝指示。從封存中排除 `.env`、快取、憑證與不相關的檔案。
6. 重新部署此變更後的成品一次，重新執行託管檢查點，並記錄隨附打包的原因加上版本/雜湊值。上傳成功或 `active` 狀態不代表驗收通過。事後僅移除任務所建立的預備/除錯資源。

## 具版本控管的來源

- [v1.0.14 BYOK 設定](https://github.com/github/copilot-sdk/blob/v1.0.14/docs/auth/byok.md)
- [v1.0.14 受控識別與權杖重新整理](https://github.com/github/copilot-sdk/blob/v1.0.14/docs/setup/azure-managed-identity.md)
- [v1.0.14 Python 提供者、MCP 與工作階段型別](https://github.com/github/copilot-sdk/blob/v1.0.14/python/copilot/session.py)
- [v1.0.14 用戶端簽章與執行階段狀態](https://github.com/github/copilot-sdk/blob/v1.0.14/python/copilot/client.py)
- [v1.0.14 執行階段遙測設定](https://github.com/github/copilot-sdk/blob/v1.0.14/docs/observability/opentelemetry.md)
- [v1.0.14 Python 追蹤情境傳播](https://github.com/github/copilot-sdk/blob/v1.0.14/python/copilot/_telemetry.py)
- [AgentServer Core 可觀察性原始碼 (動態 main；請驗證已安裝版本)](https://github.com/Azure/azure-sdk-for-python/blob/main/sdk/agentserver/azure-ai-agentserver-core/azure/ai/agentserver/core/_tracing.py)
- [Azure Monitor 原生 OTLP 擷取與 DCR 權限](https://learn.microsoft.com/azure/azure-monitor/containers/opentelemetry-protocol-ingestion)
- [Foundry 平台標頭](https://learn.microsoft.com/azure/foundry/agents/concepts/hosted-agent-contract#platform-request-headers-container-protocol-200)
- [受支援的隨附程式碼部署配置](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent-code#package-the-zip-manually)
