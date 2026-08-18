---
description: '設定 Azure API Management 作為 Microsoft Foundry 與其他 LLM API 前方的 AI (GenAI) 閘道：權杖限制與權杖計量原則、受控識別驗證、具斷路器的後端負載平衡、語意快取以及內容安全 — 以及 Copilot 預設會犯的原則錯誤。'
applyTo: '**/*.xml, **/policies/**, **/*.bicep'
---

# Azure API Management 作為 AI 閘道指示

將 **Azure API Management (APIM)** 作為 **Microsoft Foundry** 模型部署 (Azure OpenAI 與其他提供者) 及任何與 OpenAI 相容之 LLM API 前方的 **AI 閘道**，並使用 APIM 的 **AI 閘道**原則集的指引。當此指引與您的定型資料衝突時，**請遵循此檔案**並對照 Microsoft Learn 進行驗證：https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities

> **實務筆記 (為何存在此檔案)：** 在 Copilot 協助的 APIM 工作中，預設行為通常是 (1) 使用較舊且特定於提供者的 `azure-openai-*` 原則，而非目前與提供者無關的 `llm-*` 原則；(2) 使用無法理解權杖的請求計數原則 (`rate-limit-by-key`) 來對 LLM 流量進行節流；(3) 使用從具名值提取的 `api-key` 標頭而非受控識別對模型後端進行驗證；以及 (4) 以任意順序發出原則元素 — 這會被 APIM 拒絕，因為 **AI 閘道原則元素對順序非常敏感**。這些指示預先載入這些更正，以便 Copilot 在第一次產出時就能產生有效且安全的閘道原則。若有疑問，請以 Microsoft Learn 或 Microsoft Docs MCP 伺服器為依據 — AI 閘道原則介面變更頻繁。

## 核心規則

- **偏好與提供者無關的 `llm-*` 原則** (`llm-token-limit`, `llm-emit-token-metric`, `llm-semantic-cache-lookup`/`-store`, `llm-content-safety`)。它們適用於 OpenAI Chat Completions/Responses、Anthropic Messages (v2 層級) 與 Google Vertex AI。僅在 API 專用於 Azure OpenAI 且有特定理由時才使用 `azure-openai-*` 變體。
- 對於 LLM API，**依權杖而非呼叫次數進行節流**。`rate-limit-by-key` 計算請求數且無視權杖成本；請使用 `llm-token-limit`。
- **使用受控識別對 Foundry 進行驗證**，絕不使用儲存的金鑰。確切的角色與權杖對象 (token audience) 取決於模型類型 (參見[驗證](#驗證--受控識別而非金鑰)) — Azure OpenAI 使用 **Cognitive Services OpenAI User** (`https://cognitiveservices.azure.com`)；其他 Foundry 模型使用 **Cognitive Services User** (`https://ai.azure.com`)。
- **遵守原則元素順序。** 依據每個原則記載的順序設定元素與子元素，並在每個區段 (`inbound`、`backend`、`outbound`、`on-error`) 中保留 `<base />`。
- **檢查每個原則的層級支援 — 各原則有所不同。** Consumption 層級不支援 `llm-token-limit` 與 `llm-content-safety`；`llm-emit-token-metric` 與 `llm-semantic-cache-*` 適用於所有層級 (包含 Consumption)。請驗證每個原則的「適用於」說明，不要憑空假設。
- 偏好設定 APIM **後端**資源 (具備受控識別認證)，而非行內的 `authentication-managed-identity` + `set-header`；匯入 Foundry API 會自動建立此設定。

## 權杖速率限制與配額 — `llm-token-limit`

強制執行每分鐘權杖數 (TPM) 速率限制、固定時間範圍內的權杖配額，或兩者兼具，以任何計數器索引鍵為基準 (訂用帳戶識別碼、IP、JWT 宣告、自訂標頭)。設定 `estimate-prompt-tokens="true"` 以便在超出限制的提示**抵達後端之前**將其拒絕。

```xml
<!-- inbound -->
<llm-token-limit
    counter-key="@(context.Subscription.Id)"
    tokens-per-minute="500"
    token-quota="500000"
    token-quota-period="Monthly"
    estimate-prompt-tokens="true"
    remaining-tokens-variable-name="remainingTokens" />
```

- 超出 **`tokens-per-minute`** 會傳回 `429 Too Many Requests`；超出 **`token-quota`** 會傳回 `403 Forbidden`。用戶端應明確分別處理兩者 — 此處的 403 是配額耗盡訊號，而非驗證失敗。
- `token-quota-period` 必須是 `Hourly`、`Daily`、`Weekly`、`Monthly`、`Yearly` 之一。
- `tokens-per-minute` 或 (`token-quota` + `token-quota-period`) 至少需要提供其一；`counter-key` 則一律必填。
- 對 `counter-key` 使用原則運算式以依應用程式/團隊/租用戶進行限制，例如 `@(context.Request.Headers.GetValueOrDefault("x-team-id","anon"))`。

## 可檢測性 — `llm-emit-token-metric`

將提示/完成/總權杖計量指標發送至 **Application Insights**，以便按取用者歸屬支出費用。新增維度以供稍後在 Azure Monitor 中細分計量指標。

```xml
<!-- inbound -->
<llm-emit-token-metric namespace="llm-metrics">
    <dimension name="API ID" />
    <dimension name="Subscription ID" />
</llm-emit-token-metric>
```

- 計量指標的先決條件 — 三者皆必備，否則原則無法發送任何可用內容：連線至 APIM 執行個體的 Application Insights 記錄器；**為 LLM API 啟用 Application Insights 記錄**；以及**在 Application Insights 中啟用具備維度的自訂計量指標**。
- 發送權杖計量指標**不**需要記錄訊息內容。完整的提示/完成記錄是一個獨立的**選擇加入 (opt-in)** 步驟 — 僅在有明確需求時啟用，因為它可能會持久化儲存 PII、秘密與其他敏感內容。若確實啟用，請套用欄位遮罩、限制記錄讀取權限、設定較短的保留時間範圍，並透過合規/隱私權審查。
- 計量指標來自模型回應的 `usage` 區段。某些 OpenAI 模型 — **特別是在串流時** — 除非請求設定了 `include_usage: true` (`stream_options`)，否則會省略權杖計數，且中斷的串流會導致不準確的計數。請確保用戶端啟用使用量回報，否則計量指標將在無警示下產生不完整資料。
- 適用於所有 API Management 層級 (包含 Consumption)。每個原則最多 5 個自訂維度。
- **保持維度基數 (cardinality) 處於低水平。** Azure Monitor 將自訂計量指標限制在每個訂用帳戶每個區域 50,000 個作用中時間序列 (12 小時範圍)，且序列計數是每個維度相異值的乘積。避免使用高基數維度 (如用戶端 IP 或個別使用者識別碼) — 在正常使用者規模下，它們會輕易突破上限並導致計量指標遺失。偏好穩定的內建維度 (例如 `API ID`、`Subscription ID`)；改為透過記錄/查詢進行個別使用者歸屬分析。

## 驗證 — 受控識別而非金鑰

RBAC 角色**與權杖對象取決於模型類型** — 這常讓人困惑，因為 OpenAI 角色與對象不適用於其他 Foundry 模型：

- **Azure OpenAI 部署** → 指派 **Cognitive Services OpenAI User**；權杖對象為 `https://cognitiveservices.azure.com`。
- **非 OpenAI Foundry 模型** (DeepSeek、Llama、Grok 與其他由 Azure 販售的模型) → 指派 **Cognitive Services User** (OpenAI 角色**無法**授與對這些模型的存取權)；權杖對象為 `https://ai.azure.com`。

在 Foundry 資源上將角色指派給 APIM 的受控識別，然後在閘道進行驗證。行內形式 (展示 Azure OpenAI — 對於非 OpenAI Foundry 模型請將 `resource` 替換為 `https://ai.azure.com`)：

```xml
<!-- inbound -->
<authentication-managed-identity
    resource="https://cognitiveservices.azure.com"
    output-token-variable-name="managed-id-access-token"
    ignore-error="false" />
<set-header name="Authorization" exists-action="override">
    <value>@("Bearer " + (string)context.Variables["managed-id-access-token"])</value>
</set-header>
```

偏好形式：設定一個具備相符對象之受控識別認證的**後端** (Azure OpenAI 為 `https://cognitiveservices.azure.com/`，其他 Foundry 模型為 `https://ai.azure.com/`)，並使用 `<set-backend-service backend-id="..." />` 參照它。這正是直接匯入 Foundry API 時 APIM 所建立的架構。

> **重要事項 — `Authorization` 標頭會被覆寫。** 上方的 `set-header` (以及後端形式) 在請求到達後端*之前*，會將呼叫者的 `Authorization` 替換為 APIM 的受控識別權杖。若下游需要呼叫者的身分識別 (例如按使用者劃分語意快取)，請**先**使用 `<validate-jwt ... output-token-variable-name="callerJwt" />` 擷取它，並從該變數讀取 — 覆寫之後，`Authorization` 保存的是後端身分識別，而非呼叫者的身分。

## 復原能力 — 後端集區、負載平衡與斷路器

**不要**在應用程式程式碼中手動撰寫跨多個 Foundry 端點的重試/容錯移轉。定義一個 APIM **後端集區**，讓閘道進行負載平衡 (循環配置、加權、優先順序、工作階段感知)，並配備遵循後端 `Retry-After` 標頭的**斷路器**。使用 `priority` 偏好 PTU 端點，並後備降級至隨用隨付 (pay-as-you-go)。

```bicep
resource pool 'Microsoft.ApiManagement/service/backends@2023-09-01-preview' = {
  name: '${apimName}/foundry-pool'
  properties: {
    description: 'Load-balanced Foundry endpoints'
    type: 'Pool'
    pool: {
      services: [
        {
          // PTU — 偏好
          id: backend1.id
          priority: 1
          weight: 1
        }
        {
          // PayGo — 後備
          id: backend2.id
          priority: 2
          weight: 1
        }
      ]
    }
  }
}

resource backend1 'Microsoft.ApiManagement/service/backends@2023-09-01-preview' = {
  name: '${apimName}/foundry-ptu'
  properties: {
    url: 'https://<foundry-1>.openai.azure.com/openai'
    protocol: 'http'
    circuitBreaker: {
      rules: [
        {
          name: 'trip-on-backend-failures'
          failureCondition: {
            count: 3
            interval: 'PT1H'
            // 429 = PTU/TPM 飽和 (遵循 Retry-After), 5xx = 後端失敗
            statusCodeRanges: [
              {
                min: 429
                max: 429
              }
              {
                min: 500
                max: 599
              }
            ]
            errorReasons: [
              'Server errors'
            ]
          }
          tripDuration: 'PT1H'
          acceptRetryAfter: true
        }
      ]
    }
  }
}

resource backend2 'Microsoft.ApiManagement/service/backends@2023-09-01-preview' = {
  name: '${apimName}/foundry-paygo'
  properties: {
    url: 'https://<foundry-2>.openai.azure.com/openai'
    protocol: 'http'
  }
}
```

## 語意快取 — `llm-semantic-cache-lookup` / `-store`

透過提示的向量鄰近度快取完成回應，以減少權杖支出與延遲。這**不是**記憶體內部快取：它需要上架至 APIM 的外部 **相容 RediSearch 的快取** (例如 Azure Managed Redis) 與一個**內嵌 (embeddings) 後端**。查詢放在 `inbound`，儲存放在 `outbound`。

```xml
<!-- inbound -->
<llm-semantic-cache-lookup
    score-threshold="0.15"
    embeddings-backend-id="embeddings-backend"
    embeddings-backend-auth="system-assigned"
    ignore-system-messages="true"
    max-message-count="10">
    <!-- 單靠訂用帳戶識別碼會在該訂用帳戶的所有使用者之間共用一個分割區。
         對於使用者特定的回應，請依通過驗證的呼叫者主體進行區分。以先前在 inbound 中由
         validate-jwt 儲存的呼叫者 JWT (output-token-variable-name="callerJwt") 為基準 —
         請勿在此處讀取 Authorization；它在查詢前已被覆寫為 APIM 的受控識別權杖。
         此處使用強制型別轉換，因為泛型 (Jwt) 會在 XML 中放入原始 '<'，這是無效的： -->
    <vary-by>@(context.Variables.ContainsKey("callerJwt") ? ((Jwt)context.Variables["callerJwt"]).Subject : context.Subscription.Id)</vary-by>
</llm-semantic-cache-lookup>
```

```xml
<!-- outbound -->
<llm-semantic-cache-store duration="60" />
```

- 較低的 `score-threshold` = 更嚴格的匹配 (快取命中較少，精確度較高)。依使用案例調整；建議從 `0.05`–`0.15` 開始。
- 使用 `<vary-by>` 在**實際的機密性邊界**上分割快取。僅以 APIM 訂用帳戶識別碼為索引鍵表示共用該訂用帳戶的每位使用者共用一個快取分割區，並可能接收到彼此快取的完成內容 — 這存在資料外洩風險。當回應特定於使用者時，將通過驗證的呼叫者主體新增至 `<vary-by>` 中。在 `inbound` 早期透過 `<validate-jwt output-token-variable-name="callerJwt" ... />` 擷取呼叫者的權杖 (在受控識別步驟覆寫 `Authorization` 之前)，然後使用轉型從儲存的變數建立索引鍵 (泛型 `<Jwt>` 會在 XML 中放入原始 `<`)：`@(context.Variables.ContainsKey("callerJwt") ? ((Jwt)context.Variables["callerJwt"]).Subject : context.Subscription.Id)`。查詢時不要重新讀取 `Authorization` — 到那時它保存的是 APIM 的後端權杖，這會將所有呼叫者折疊至單一分割區中。

## 內容安全 — `llm-content-safety`

在提示**抵達模型之前**透過 **Azure AI Content Safety** 篩檢提示，並選擇性地在模型**回覆之後**篩檢其回應 (完成內容)。設定內容安全後端並設定嚴重程度臨界值。請注意預設值：`shield-prompt` (越獄/提示插入偵測) 與 `enforce-on-completions` 預設皆為 `false`，因此傳入原則**僅篩檢提示** — 設定 `enforce-on-completions="true"` 亦可篩檢模型的完成內容 (或將原則放置於 `outbound` 區段以篩檢回應)。

```xml
<!-- inbound -->
<llm-content-safety backend-id="content-safety-backend" shield-prompt="true">
    <categories output-type="EightSeverityLevels">
        <category name="Hate" threshold="4" />
        <category name="Violence" threshold="4" />
    </categories>
</llm-content-safety>
```

- 臨界值使用 0–7 嚴重程度：`threshold="4"` 允許 0–3 並阻擋 4–7。調高表示較寬鬆，調低表示較嚴格。

## 原則骨架與排序

將 AI 閘道原則保持在正確的區段中，並保留 `<base />`：

```xml
<policies>
  <inbound>
    <base />
    <!-- 驗證呼叫者並在下方覆寫 Authorization 之前儲存其權杖。
         按使用者劃分語意快取時需要此項。請填入您的簽發者/對象。 -->
    <validate-jwt header-name="Authorization" output-token-variable-name="callerJwt" failed-validation-httpcode="401">
      <openid-config url="https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration" />
      <audiences>
        <audience>api://your-api-client-id</audience>
      </audiences>
    </validate-jwt>
    <set-backend-service backend-id="foundry-pool" />
    <authentication-managed-identity resource="https://cognitiveservices.azure.com" output-token-variable-name="mi" />
    <set-header name="Authorization" exists-action="override">
      <value>@("Bearer " + (string)context.Variables["mi"])</value>
    </set-header>
    <llm-content-safety backend-id="content-safety-backend" shield-prompt="true">
      <categories output-type="EightSeverityLevels">
        <category name="Hate" threshold="4" />
      </categories>
    </llm-content-safety>
    <!-- 快取查詢必須在 token-limit/metric 之前：快取命中會使管線短路，
         因此快取的請求不得消耗呼叫者的 TPM/配額。內容安全保持在
         查詢之上，以便每個提示仍受到篩檢。 -->
    <llm-semantic-cache-lookup score-threshold="0.1" embeddings-backend-id="embeddings-backend" embeddings-backend-auth="system-assigned">
      <!-- 依通過驗證的呼叫者 (來自儲存的權杖) 進行分割以防止跨使用者快取外洩。
           使用轉型而非泛型，避免 XML 中出現原始 '<'。 -->
      <vary-by>@(context.Variables.ContainsKey("callerJwt") ? ((Jwt)context.Variables["callerJwt"]).Subject : context.Subscription.Id)</vary-by>
    </llm-semantic-cache-lookup>
    <llm-token-limit counter-key="@(context.Subscription.Id)" tokens-per-minute="500" estimate-prompt-tokens="true" />
    <llm-emit-token-metric namespace="llm-metrics">
      <dimension name="API ID" value="@(context.Api.Id)" />
    </llm-emit-token-metric>
  </inbound>
  <backend><base /></backend>
  <outbound>
    <base />
    <llm-semantic-cache-store duration="60" />
  </outbound>
  <on-error><base /></on-error>
</policies>
```

## Foundry 原生 AI 閘道

Foundry 與 APIM 具備**內建整合**：在 Foundry 入口網站中，您可以建立新的 APIM 執行個體或連結現有的執行個體作為 AI 閘道，然後從 **Operate → Admin → AI Gateway → Token management** 設定個別部署的 TPM 限制與配額 — 這些直接對應至 `llm-token-limit`。連結**現有的** APIM 執行個體有硬性需求：它必須與 Foundry 資源處於**相同的 Microsoft Entra 租用戶與訂用帳戶**中，為 **v2 層級** (Basic v2 / Standard v2 / Premium v2)，且您對其至少需要具備 **API Management Service Contributor** (或 Owner) 角色 — 否則它不會顯示為可選取狀態。若 Foundry 資源**停用了公用網路存取**，APIM 執行個體也必須可透過私人方式連接 — 使用具備私人端點的 Standard v2 或 Premium v2，或插入虛擬網路中的 Premium v2。閘道亦可管控已註冊的**代理人** (在任何地方執行) 以及處於**預覽**階段的 **MCP 工具** (僅路由不使用受控 OAuth 的新 MCP 工具；原則在 Azure 入口網站中套用，而非 Foundry 入口網站)。當儲存機制使用此整合時，請保持自訂原則與 Foundry 管理的組態相容，而非將其覆寫。偏好在 APIM 中將 API 作為**語言模型 API** 或 **Azure AI Foundry API** 匯入，這會自動建立後端、`set-backend-service` 以及選用的權杖/快取/安全原則。

## 事實依據

AI 閘道原則集演進迅速。在定稿原則 XML 之前，請對照 Microsoft Learn (`genai-gateway-capabilities`、個別原則參考頁面) 或 Microsoft Docs MCP 伺服器驗證元素名稱、屬性與排序，不要只依賴定型資料。
