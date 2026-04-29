"""
錯誤恢復 Hook
====================
示範如何分類工具結果和 SDK 錯誤，然後使用 Hook
讓 LLM 保持調查，而不是在失敗時放棄。

執行：
    python error_recovery_hooks.py

需求：
    pip install copilot-sdk
"""

import asyncio
from enum import Enum

from copilot import CopilotClient, SubprocessConfig


# ---------------------------------------------------------------------------
# 分類列舉
# ---------------------------------------------------------------------------

class ToolResultCategory(str, Enum):
    SHELL_ERROR = "shell_error"
    PERMISSION_DENIED = "permission_denied"
    NORMAL = "normal"


class SDKErrorCategory(str, Enum):
    CLIENT_ERROR = "client_error"       # 4xx — 不可重試
    TRANSIENT = "transient"             # 5xx / 逾時
    NON_RECOVERABLE = "non_recoverable"


# ---------------------------------------------------------------------------
# 偵測片語 — 根據您的領域擴展這些內容
# ---------------------------------------------------------------------------

PERMISSION_DENIAL_PHRASES = [
    "permission denied",
    "access denied",
    "not permitted",
    "operation not allowed",
    "eacces",
    "eperm",
    "403 forbidden",
]

SHELL_ERROR_PHRASES = [
    "command not found",
    "no such file or directory",
    "exit code",
    "errno",
    "traceback",
]


# ---------------------------------------------------------------------------
# 附加到失敗工具結果的後續訊息
# ---------------------------------------------------------------------------

CONTINUATION_MESSAGES = {
    ToolResultCategory.SHELL_ERROR: (
        "\n\n[系統筆記：此指令遇到錯誤。這並不代表您應該停止。請嘗試不同的引數、嘗試不同的工具，或繼續執行。]"
    ),
    ToolResultCategory.PERMISSION_DENIED: (
        "\n\n[系統筆記：此特定操作的權限遭拒。請繼續使用替代方法。]"
    ),
}


# ---------------------------------------------------------------------------
# 分類器
# ---------------------------------------------------------------------------

def classify_tool_result(tool_name: str, result_text: str) -> ToolResultCategory:
    """將工具的輸出分類為失敗類別。"""
    result_lower = result_text.lower()

    if any(phrase in result_lower for phrase in PERMISSION_DENIAL_PHRASES):
        return ToolResultCategory.PERMISSION_DENIED

    if any(phrase in result_lower for phrase in SHELL_ERROR_PHRASES):
        return ToolResultCategory.SHELL_ERROR

    return ToolResultCategory.NORMAL


def classify_sdk_error(error_msg: str, recoverable: bool) -> SDKErrorCategory:
    """為重試/跳過決定分類 SDK 等級的錯誤。"""
    error_lower = error_msg.lower()

    if any(kw in error_lower for kw in ("timeout", "503", "502", "429", "retry")):
        return SDKErrorCategory.TRANSIENT

    if any(kw in error_lower for kw in ("401", "403", "404", "400", "422")):
        return SDKErrorCategory.CLIENT_ERROR

    return SDKErrorCategory.TRANSIENT if recoverable else SDKErrorCategory.NON_RECOVERABLE


# ---------------------------------------------------------------------------
# SDK Hook
# ---------------------------------------------------------------------------

def on_post_tool_use(input_data, env):
    """在失敗的工具結果中附加後續提示。"""
    tool_name = input_data.get("toolName", "")
    result = str(input_data.get("toolResult", ""))

    category = classify_tool_result(tool_name, result)
    print(f"  [hook] {tool_name} -> {category.value}")

    if category in CONTINUATION_MESSAGES:
        return {"toolResult": result + CONTINUATION_MESSAGES[category]}
    return None


def on_error_occurred(input_data, env):
    """重試暫時性錯誤，優雅地跳過不可恢復的錯誤。"""
    error_msg = input_data.get("error", "")
    recoverable = input_data.get("recoverable", False)

    category = classify_sdk_error(error_msg, recoverable)
    print(f"  [hook] SDK 錯誤 -> {category.value}: {error_msg[:80]}")

    if category == SDKErrorCategory.TRANSIENT:
        return {"errorHandling": "retry", "retryCount": 2}
    return {
        "errorHandling": "skip",
        "userNotification": "發生錯誤 — 正在繼續調查。",
    }


# ---------------------------------------------------------------------------
# 示範：獨立分類測試
# ---------------------------------------------------------------------------

def demo_classification():
    """顯示分類在範例輸出上的運作情況。"""
    samples = [
        ("bash", "ls: cannot access '/root': Permission denied"),
        ("bash", "grep: command not found"),
        ("read_file", '{"lines": ["INFO startup complete"]}'),
        ("bash", "cat: /etc/shadow: Operation not permitted"),
    ]

    print("分類示範：")
    print("-" * 60)
    for tool, output in samples:
        cat = classify_tool_result(tool, output)
        print(f"  {tool:15s} | {cat.value:20s} | {output[:50]}")
    print()

    error_samples = [
        ("Connection timeout after 30s", True),
        ("HTTP 503 Service Unavailable", True),
        ("HTTP 404 Not Found", False),
        ("Unexpected server error", False),
    ]

    print("SDK 錯誤分類示範：")
    print("-" * 60)
    for msg, recoverable in error_samples:
        cat = classify_sdk_error(msg, recoverable)
        print(f"  recoverable={recoverable!s:5s} | {cat.value:20s} | {msg}")


# ---------------------------------------------------------------------------
# 示範：連結到實際工作階段
# ---------------------------------------------------------------------------

async def demo_with_session():
    """建立註冊了 Hook 的工作階段 (需要 Copilot 驗證)。"""
    client = CopilotClient(
        SubprocessConfig(log_level="info", use_stdio=True),
        auto_start=True,
    )
    await client.start()

    try:
        session = await client.create_session(
            hooks={
                "on_post_tool_use": on_post_tool_use,
                "on_error_occurred": on_error_occurred,
            }
        )
        # 傳送一個可能觸發工具使用的提示
        response = await session.send_message(
            "列出 /tmp 中的檔案，然後嘗試讀取 /etc/shadow。"
            "如果您無法讀取它，請解釋原因並繼續執行。"
        )
        print(f"\n代理回覆：\n{response}")
    finally:
        await client.stop()


if __name__ == "__main__":
    # 始終執行獨立示範
    demo_classification()

    # 取消註釋以測試即時工作階段：
    # asyncio.run(demo_with_session())
