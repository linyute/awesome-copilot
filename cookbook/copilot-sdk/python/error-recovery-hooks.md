# 錯誤恢復 Hook

當工具失效時，讓 LLM 保持調查，而不是帶著部分結果放棄。

## 問題

當 shell 指令傳回錯誤或檔案操作遇到權限遭拒時，LLM 傾向於停止並道歉，而不是嘗試不同的方法。這會在韌性至關重要的代理工作流中產生不完整的結果。

## 解決方案

使用 SDK 的 hook 系統 (`on_post_tool_use`, `on_error_occurred`) 將工具結果按類別分類，並附加提示 LLM 繼續執行的後續指令。

```python
from enum import Enum


class ToolResultCategory(str, Enum):
    SHELL_ERROR = "shell_error"
    PERMISSION_DENIED = "permission_denied"
    NORMAL = "normal"


class SDKErrorCategory(str, Enum):
    CLIENT_ERROR = "client_error"       # 4xx — 不可重試
    TRANSIENT = "transient"             # 5xx / 逾時
    NON_RECOVERABLE = "non_recoverable"


# 工具輸出中代表權限問題的片語
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

CONTINUATION_MESSAGES = {
    ToolResultCategory.SHELL_ERROR: (
        "\n\n[系統筆記：此指令遇到錯誤。這並不代表您應該停止。請嘗試不同的引數、嘗試不同的工具，或繼續執行。]"
    ),
    ToolResultCategory.PERMISSION_DENIED: (
        "\n\n[系統筆記：此特定操作的權限遭拒。請繼續使用替代方法。]"
    ),
}


def classify_tool_result(tool_name: str, result_text: str) -> ToolResultCategory:
    result_lower = result_text.lower()
    if any(phrase in result_lower for phrase in PERMISSION_DENIAL_PHRASES):
        return ToolResultCategory.PERMISSION_DENIED
    if any(phrase in result_lower for phrase in SHELL_ERROR_PHRASES):
        return ToolResultCategory.SHELL_ERROR
    return ToolResultCategory.NORMAL


def classify_sdk_error(error_msg: str, recoverable: bool) -> SDKErrorCategory:
    error_lower = error_msg.lower()
    if any(kw in error_lower for kw in ("timeout", "503", "502", "429", "retry")):
        return SDKErrorCategory.TRANSIENT
    if any(kw in error_lower for kw in ("401", "403", "404", "400", "422")):
        return SDKErrorCategory.CLIENT_ERROR
    return SDKErrorCategory.TRANSIENT if recoverable else SDKErrorCategory.NON_RECOVERABLE
```

## Hook 註冊

將分類器連結到 SDK 的 hook 系統：

```python
def on_post_tool_use(input_data, env):
    """在失敗的工具結果中附加後續提示。"""
    tool_name = input_data.get("toolName", "")
    result = str(input_data.get("toolResult", ""))
    category = classify_tool_result(tool_name, result)
    if category in CONTINUATION_MESSAGES:
        return {"toolResult": result + CONTINUATION_MESSAGES[category]}
    return None


def on_error_occurred(input_data, env):
    """重試暫時性錯誤，優雅地跳過不可恢復的錯誤。"""
    error_msg = input_data.get("error", "")
    recoverable = input_data.get("recoverable", False)
    category = classify_sdk_error(error_msg, recoverable)
    if category == SDKErrorCategory.TRANSIENT:
        return {"errorHandling": "retry", "retryCount": 2}
    return {
        "errorHandling": "skip",
        "userNotification": "發生錯誤 — 正在繼續調查。",
    }
```

## 提示

- **為您的領域調整片語清單** — 從實際的工具輸出中新增模式。
- **記錄分類類別**，以便您可以追蹤每種失敗模式觸發的頻率以及 LLM 是否真的恢復。
- **限制後續深度** — 如果同一個工具連續失敗 3 次以上，請讓 LLM 放棄而不是陷入迴圈。
- `SYSTEM NOTE` 框架效果很好，因為 LLM 會將其視為權威指令而非使用者評論。

## 可執行的範例

請參閱 [`recipe/error_recovery_hooks.py`](recipe/error_recovery_hooks.py) 以取得完整的工作範例。
