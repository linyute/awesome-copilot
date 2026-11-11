# Foundry toolbox

`foundry-agentic-loop` skill 的參考資料：解決方案的 skills、MCP 工具與基礎如何透過單一 Foundry toolbox 提供給其託管 agents。`microsoft-foundry` 擁有命令介面與工具型別 (其 toolbox 指引)，[azd-layout.md](azd-layout.md#azureyaml) 擁有宣告式服務，而 [copilot-sdk-with-toolbox.py](copilot-sdk-with-toolbox.py) 為參考取用端。

## 模型 (Model)

- **toolbox** 將專案連線、skills 與工具包裝在單一 MCP 端點背後。版本是不可變的：每次變更皆會建立新版本，且僅有第一個版本會自動成為預設版本。
- **skill** 為在專案中具備版本控管的 `SKILL.md`（包含 `name` 與 `description` 的 front matter，接著為 Markdown 指示）。Skills 目前處於預覽階段。
- **取用者 (consumer)** URL `<project>/toolboxes/<name>/mcp?api-version=v1` 一律提供預設版本，因此提升 (promote) toolbox 版本可直接套用至 agents 而無需重新部署。**開發者 (developer)** URL `.../toolboxes/<name>/versions/<v>/mcp?api-version=v1` 則會鎖定單一版本。
- 附加的 skills 作為 MCP 資源 (`skill://<name>/SKILL.md`) 抵達，除非 toolbox 鎖定 `version`，否則遵循該 skill 的預設版本。Agent 依每個請求將它們寫入暫存目錄底下，因為託管容器除 `/tmp` 外皆為唯讀；agent 映像檔絕不複製 `skills/`。

## 編寫 (Author)

1. 將每個 skill 編寫於 `skills/<name>/SKILL.md`；其 front matter 中的 `name` 需與資料夾名稱相符。
2. 建構或重複使用每個 MCP 伺服器（基於串流 HTTP 的 FastMCP，使用 [build-skills-catalog.md](build-skills-catalog.md) 中的 `python-mcp-server-generator` 產生）。透過連線存取伺服器，絕不使用硬式編碼的 URL 或密碼秘密。Foundry IQ 基礎亦透過 toolbox 公開（[foundry-iq-grounding.md](foundry-iq-grounding.md)）。
3. 依每個功能組合策劃一個 toolbox：`skills[]`、`connections[]`（連線必須已存在），以及在 `tools[]` 下的無連線內建工具（例如 `web_search` 或 `code_interpreter`）。至多只能有一個工具不具名稱：使用 `name` 命名內建工具，使用 `server_label` 命名 MCP 工具。在工具數量超過約五個之前，新增 `toolbox_search_preview`，它會被計為未具名工具。
4. 載入 skills 的 agents 執行於 Copilot SDK 上，並像參考 agent 一樣取用 toolbox。MAF agents 遵循 microsoft-foundry 在託管 agent 中使用 toolbox 的指引。

## 發佈 (Publish)

- **SDD：** 宣告 `azure.ai.skill`、`azure.ai.connection` 與 `azure.ai.toolbox` 服務（[azd-layout.md](azd-layout.md#azureyaml)）。Deploy 依 `uses` 順序發佈它們並寫入 `TOOLBOX_<NAME>_MCP_ENDPOINT`；將其對應至 agent 的 `TOOLBOX_ENDPOINT`。在未獲升級舊版擴充功能核准的情況下，使用同檔案中的循序 `postprovision` 後備方案。
- **Rapid：** 針對選定的專案使用 CLI 發佈 (`azd ai project set <project-endpoint>`)：

  ```bash
  azd ai skill create claims-policy --file skills/claims-policy/SKILL.md --no-prompt   # 後續版本：azd ai skill update
  azd ai toolbox create claims-tools --from-file toolbox.yaml --no-prompt              # 寫入 TOOLBOX_CLAIMS_TOOLS_MCP_ENDPOINT
  ```

  ```yaml
  # toolbox.yaml
  description: Claims tools
  skills:
    - name: claims-policy          # 省略版本以遵循該 skill 的預設版本
  connections:
    - name: claims-mcp-conn        # RemoteTool (MCP)
    - name: policy-search          # CognitiveSearch 需要 index
      index: policies
  tools:
    - type: web_search
      name: web
  ```

- **變更：** `azd ai toolbox connection add|remove` 與 `azd ai toolbox skill add|remove` 各自會建立版本而不變更預設版本；使用 `azd ai toolbox publish <name> <version>` 提升或復原版本。無連線的內建工具無法在事後新增：需以完整集合重新建立 toolbox。`azd ai skill update <name> --set-default-version <v>` 可更新 skill 預設版本而無需上傳內容。
- **擴充功能：** `azure.ai.toolboxes`、`azure.ai.skills` 與 `azure.ai.connections`，需符合 [azd-layout.md](azd-layout.md#azureyaml) 中的最低版本要求。

## 取用 (Consume)

遵循 [copilot-sdk-foundry.md](copilot-sdk-foundry.md) 與參考 agent：

- 將 URL 保留在 `TOOLBOX_ENDPOINT` 中，絕不使用會被平台覆寫的 `FOUNDRY_*` 名稱。若寫入的 URL 鎖定 `/versions/<v>/`，在 toolbox 變更後重新部署使用該 toolbox 的 agents；記錄每個 agent 所使用的形式。
- 在每個請求中傳送針對 `https://ai.azure.com/.default` 的權杖（cognitiveservices 權杖會收到 401）、`Foundry-Features: Toolboxes=V1Preview`，以及存在時呼叫者的 `x-agent-foundry-call-id`。
- `initialize` 為選用項目；不支援 `prompts/list` 與 `ping`。來自 MCP 的工具命名為 `<server_label>___<tool>`。
- Proxy 不會強制執行 `require_approval`：在 agent 的權限處理常式中核准工具。
- 包裝了 `CONSENT_REQUIRED` 的 `-32006` 錯誤攜帶了 OAuth 連線的每位使用者同意 URL：將其呈現給呼叫者而非進行重試。
- 來自 toolbox 的 HTTP 403 表示呼叫者在專案上缺少 Foundry User 角色；包裝了 403 的 `-32007` 錯誤則來自 MCP 伺服器自身的驗證機制。

## 驗證 (Verify)

- `tools/list` 傳回預期的工具，且 `resources/list` 傳回預期的 `skill://` 項目。
- 託管記錄顯示 skills 寫入暫存目錄底下，且答案顯示每個 skill 皆已套用。
- 在根目錄 `README.md` (rapid) 或 `docs/implementation.md` (SDD) 中記錄 toolbox 名稱、其已發佈的預設版本與 URL 形式。

來源：microsoft-foundry toolbox 與 skills 指引；[Toolbox](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox)；[Skills](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/skills)。
