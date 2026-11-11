"""參考託管 agent：GitHub Copilot SDK + Foundry toolbox (透過 MCP 的工具與 skill)。

僅供參考：copilot-sdk-foundry.md 為規範範本，若有任何衝突以該文件為主。針對
github-copilot-sdk 1.0.14 編寫並於 1.0.20 重新檢查；請先檢視已安裝的 API。從 `azd ai agent init`
所樣板產生的 Responses 處理常式呼叫 `run_turn`：在啟動時建立一個憑證與一個用戶端，
並在關閉時將其關閉，從轉接器的已驗證請求情境存取器傳遞請求的 `x-agent-foundry-call-id`，
並在訊息之前將傳回的工具呼叫以輸出項目串流傳輸 (foundry-hosted-agent.md)。將具有
consent_url 的 ToolboxError 作為答案傳回給呼叫者：首次使用 OAuth 連線時每位使用者需要登入一次。

    pip install "github-copilot-sdk[telemetry]" azure-identity

環境變數 (在 azure.yaml 中 agent 的 `env`；FOUNDRY_* 與 AGENT_* 為平台保留字)：
  TOOLBOX_ENDPOINT                取用者 URL <project>/toolboxes/<name>/mcp?api-version=v1，
                                  從 TOOLBOX_<NAME>_MCP_ENDPOINT 對應；它提供預設版本。
  MODEL_API_BASE_URL              探索到的 .../openai/v1/ 基底及其部署。託管時為
  AZURE_AI_MODEL_DEPLOYMENT_NAME  必要；本機環境下，未設定表示使用 Copilot 預設模型。
  COPILOT_OTLP_ENDPOINT           執行階段 span 的選用性 OTLP HTTP 接收器。

附加至 toolbox 的 skill 為 MCP 資源 (skill://<name>/SKILL.md)，其遵循各 skill
的預設版本，因此發佈 skill 不需要重新部署。對於多檔案 skill 或 toolbox 外部的
skill，請使用 microsoft-foundry 中的 Skills API 下載。驗證所提供的內容主體保留了
其 frontmatter；load_skills 會在遺漏時將其重建。
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import tempfile
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx
from azure.core.credentials_async import AsyncTokenCredential
from azure.identity.aio import DefaultAzureCredential
from copilot import CopilotClient, SessionEventType, Tool, ToolInvocation, ToolResult
from copilot.generated.rpc import PermissionDecisionApproveOnce, PermissionDecisionReject
from copilot.generated.session_events import PermissionRequestCustomTool, PermissionRequestRead
from copilot.session import ProviderConfig, ProviderTokenArgs
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

log = logging.getLogger("agent")
tracer = trace.get_tracer(__name__)

SCOPE = "https://ai.azure.com/.default"  # 模型與 toolbox 受眾；cognitiveservices 會收到 401
TOOLBOX_ENDPOINT = os.environ["TOOLBOX_ENDPOINT"]
MODEL_BASE_URL = os.getenv("MODEL_API_BASE_URL")
MODEL_DEPLOYMENT = os.getenv("AZURE_AI_MODEL_DEPLOYMENT_NAME")
if bool(MODEL_BASE_URL) != bool(MODEL_DEPLOYMENT):
    # 若僅設定其中一個而遺漏另一個，會無提示地降級回退至 Copilot 預設模型。
    raise RuntimeError("請同時設定 MODEL_API_BASE_URL 與 AZURE_AI_MODEL_DEPLOYMENT_NAME，或兩者皆不設定。")
WRITABLE = Path(tempfile.gettempdir())  # 託管容器除暫存目錄外皆為唯讀
SKILL_URI = re.compile(r"skill://([A-Za-z0-9_-]+)/SKILL\.md")
TURN_TIMEOUT = 300.0


@dataclass
class ToolCall:
    """單一 toolbox 呼叫，以 function_call 與 function_call_output 項目發出。"""

    call_id: str
    name: str
    arguments: str
    output: str


@dataclass
class Turn:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)


class ToolboxError(RuntimeError):
    """Toolbox JSON-RPC 錯誤；當連線需要使用者同意時會設定 `consent_url`。"""

    def __init__(self, message: str, consent_url: str | None = None) -> None:
        super().__init__(message)
        self.consent_url = consent_url


def _toolbox_error(error: dict[str, Any]) -> ToolboxError:
    message = str(error.get("message", ""))
    if error.get("code") == -32006 and "{" in message:
        try:  # -32006 在人類可讀的前綴之後將各來源錯誤包裝為 JSON
            for source in json.loads(message[message.index("{") :]).get("errors", []):
                nested = source.get("error") or {}
                if nested.get("code") == "CONSENT_REQUIRED":
                    url = nested.get("message")
                    name = source.get("name", "A toolbox connection")
                    return ToolboxError(f"{name} needs consent: open {url}, sign in, then retry.", url)
        except (ValueError, AttributeError):
            pass
    return ToolboxError(f"Toolbox error {error.get('code')}: {message or 'unknown'}")


class _Bearer(httpx.Auth):
    """為每個請求新增權杖；Azure Identity 會快取並續訂權杖。"""

    def __init__(self, credential: AsyncTokenCredential) -> None:
        self._credential = credential

    async def async_auth_flow(self, request: httpx.Request):
        request.headers["Authorization"] = f"Bearer {(await self._credential.get_token(SCOPE)).token}"
        yield request


class McpBridge:
    """Toolbox MCP 端點的請求範圍 (request-scoped) JSON-RPC 用戶端；initialize 為選用。"""

    def __init__(self, credential: AsyncTokenCredential, call_id: str | None) -> None:
        headers = {"Foundry-Features": "Toolboxes=V1Preview"}
        if call_id:  # 原封不動轉發呼叫者情境；切勿捏造
            headers["x-agent-foundry-call-id"] = call_id
        self._http = httpx.AsyncClient(auth=_Bearer(credential), headers=headers, timeout=60.0)
        self._next_id = 0

    async def __aenter__(self) -> McpBridge:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        await self._http.aclose()

    async def rpc(self, method: str, params: dict[str, Any], target: str = "") -> dict[str, Any]:
        """MCP 用戶端 span 中的單一 JSON-RPC 呼叫，不記錄任何引數或結果。"""
        self._next_id += 1
        payload = {"jsonrpc": "2.0", "id": self._next_id, "method": method, "params": params}
        name = f"{method} {target}".strip()
        with tracer.start_as_current_span(
            name, record_exception=False, set_status_on_exception=False
        ) as span:
            span.set_attribute("mcp.method.name", method)
            if method == "tools/call":
                span.set_attribute("gen_ai.tool.name", target)
            try:
                response = await self._http.post(TOOLBOX_ENDPOINT, json=payload)
                response.raise_for_status()
                body = response.json()
                if "error" in body:
                    raise _toolbox_error(body["error"])
            except Exception as exc:
                span.set_status(Status(StatusCode.ERROR))
                span.set_attribute("error.type", type(exc).__name__)
                raise
        return body.get("result") or {}


def _call_handler(toolbox: McpBridge, mcp_name: str, calls: list[ToolCall]):
    async def handler(invocation: ToolInvocation) -> ToolResult:
        arguments = invocation.arguments if isinstance(invocation.arguments, dict) else {}
        try:
            result = await toolbox.rpc("tools/call", {"name": mcp_name, "arguments": arguments}, mcp_name)
        except Exception as exc:  # 回報給模型；模型可以重試或解釋
            output, outcome = str(exc), ToolResult(result_type="failure", error=str(exc))
        else:
            texts = [c.get("text", "") for c in result.get("content", []) if c.get("type") == "text"]
            output = "\n".join(t for t in texts if t) or json.dumps(result)
            failed = bool(result.get("isError"))
            outcome = ToolResult(
                text_result_for_llm=output,
                result_type="failure" if failed else "success",
                error=output if failed else None,
            )
        calls.append(ToolCall(invocation.tool_call_id, mcp_name, json.dumps(arguments), output))
        return outcome

    return handler


def toolbox_tools(toolbox: McpBridge, listed: list[dict[str, Any]], calls: list[ToolCall]) -> list[Tool]:
    """將每個 tools/list 項目包裝為 SDK 工具；來自 MCP 的名稱外觀如 label___tool。"""
    tools: dict[str, Tool] = {}
    sources: dict[str, str] = {}
    for spec in listed:
        mcp_name = spec["name"]
        name = re.sub(r"[.-]", "_", mcp_name)  # SDK 工具名稱不接受點號與連字號
        if name in sources:
            # 捨棄其中一個會無提示地改變 agent 的功能；改為將工具重新命名。
            raise ValueError(f"Toolbox tools {sources[name]!r} and {mcp_name!r} both map to {name!r}.")
        sources[name] = mcp_name
        tools[name] = Tool(
            name=name,
            description=spec.get("description") or mcp_name,
            parameters=spec.get("inputSchema") or {"type": "object", "properties": {}},
            handler=_call_handler(toolbox, mcp_name, calls),
        )
    return list(tools.values())


async def load_skills(toolbox: McpBridge, skills_dir: Path) -> list[str]:
    """將每個 toolbox skill 寫入 <skills_dir>/<name>/SKILL.md 供 SDK skill 載入器使用。"""
    names: list[str] = []
    for resource in (await toolbox.rpc("resources/list", {})).get("resources", []):
        match = SKILL_URI.fullmatch(resource.get("uri", ""))
        if not match:
            continue  # skill://index.json、封存檔案及其他資源
        name = match.group(1)
        read = await toolbox.rpc("resources/read", {"uri": resource["uri"]}, name)
        body = "".join(c.get("text", "") for c in read.get("contents", []))
        if not body.lstrip().startswith("---"):
            description = json.dumps(resource.get("description") or name)
            body = f"---\nname: {name}\ndescription: {description}\n---\n\n{body}"
        (skills_dir / name).mkdir(parents=True, exist_ok=True)
        (skills_dir / name / "SKILL.md").write_text(body, encoding="utf-8")
        names.append(name)
    return names


def model_provider(credential: AsyncTokenCredential) -> ProviderConfig:
    async def refresh_token(_request: ProviderTokenArgs) -> str:
        return (await credential.get_token(SCOPE)).token

    return {
        "type": "openai",
        "base_url": MODEL_BASE_URL,
        "wire_api": "responses",
        "bearer_token_provider": refresh_token,
    }


def least_privilege(tool_names: set[str], skills_dir: Path) -> Callable[[Any, Any], Any]:
    """核准此輪次 (turn) 的 toolbox 工具及其 skill 的讀取；拒絕所有其他項目。"""

    def decide(request: Any, _invocation: Any) -> Any:
        if isinstance(request, PermissionRequestCustomTool) and request.tool_name in tool_names:
            return PermissionDecisionApproveOnce()
        if isinstance(request, PermissionRequestRead):
            if Path(request.resolved_path or request.path).resolve().is_relative_to(skills_dir):
                return PermissionDecisionApproveOnce()
        return PermissionDecisionReject(feedback="Not permitted for this agent.")

    return decide


def log_event(event: Any) -> None:
    """僅記錄安全識別碼：絕不記錄提示詞、引數、結果或呼叫者情境。"""
    data = event.data
    if event.type == SessionEventType.SESSION_ERROR:
        log.error(
            "session error type=%s code=%s status=%s request=%s",
            data.error_type, data.error_code, data.status_code, data.service_request_id,
        )
    elif event.type == SessionEventType.TOOL_EXECUTION_START:
        log.info("tool start %s id=%s", data.tool_name, data.tool_call_id)
    elif event.type == SessionEventType.TOOL_EXECUTION_COMPLETE:
        log.info("tool done id=%s success=%s", data.tool_call_id, data.success)


def new_client() -> CopilotClient:
    """每個處理程序一個 Copilot 執行階段。"""
    options: dict[str, Any] = {}
    if not os.access(Path.home(), os.W_OK):  # 工作階段狀態預設為 ~/.copilot
        options["base_directory"] = str(WRITABLE / "copilot")
    if endpoint := os.getenv("COPILOT_OTLP_ENDPOINT"):
        options["telemetry"] = {
            "otlp_endpoint": endpoint,
            "otlp_protocol": "http/protobuf",
            "exporter_type": "otlp-http",
            "capture_content": False,
        }
    return CopilotClient(**options)


async def run_turn(
    client: CopilotClient, credential: AsyncTokenCredential, prompt: str, call_id: str | None = None
) -> Turn:
    """執行單一請求，具備其專屬的 toolbox 連線、skills 目錄與工作階段。"""
    calls: list[ToolCall] = []
    headers = {"x-agent-foundry-call-id": call_id} if call_id else None
    options: dict[str, Any] = {}
    if MODEL_BASE_URL:
        options = {"provider": model_provider(credential), "model": MODEL_DEPLOYMENT}
    async with McpBridge(credential, call_id) as toolbox:
        tools = toolbox_tools(toolbox, (await toolbox.rpc("tools/list", {})).get("tools", []), calls)
        with tempfile.TemporaryDirectory(prefix="turn-", dir=WRITABLE) as workdir:
            skills_dir = Path(workdir).resolve() / "skills"
            await load_skills(toolbox, skills_dir)
            async with await client.create_session(
                **options,
                tools=tools,
                skill_directories=[str(skills_dir)],
                working_directory=workdir,
                on_permission_request=least_privilege({tool.name for tool in tools}, skills_dir),
                on_event=log_event,
            ) as session:
                try:
                    reply = await session.send_and_wait(
                        prompt, request_headers=headers, timeout=TURN_TIMEOUT
                    )
                except TimeoutError:
                    await session.abort()  # 單純逾時會讓該輪次繼續執行
                    raise
    if reply is None or not reply.data.content:
        raise RuntimeError("工作階段已結束，但未收到 assistant 訊息。")
    return Turn(reply.data.content, calls)


async def main() -> None:
    """本機冒煙測試：`az login`，設定 TOOLBOX_ENDPOINT，可選設定模型組合。"""
    logging.basicConfig(level=logging.INFO)
    async with DefaultAzureCredential() as credential, new_client() as client:
        try:
            turn = await run_turn(client, credential, "Which tools and skills can you use? Be brief.")
        except ToolboxError as exc:
            if exc.consent_url is None:
                raise
            print(exc)
            return
        for call in turn.tool_calls:
            print(f"tool {call.name}: {len(call.output)} chars")
        print(turn.text)


if __name__ == "__main__":
    asyncio.run(main())
