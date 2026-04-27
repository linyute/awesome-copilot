---
description: '建立無障礙檢視表範例'
---

# 建立無障礙檢視表

建立一個 CLI 應用程式，使用 Playwright MCP 伺服器來分析網頁的無障礙程度，並產生符合 WCAG 標準的詳細報告，且可選擇是否要產生測試。

> **可執行範例：** [recipe/accessibility_report.py](recipe/accessibility_report.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python accessibility_report.py
> ```

## 範例情境

您想要稽核網站的無障礙合規性。此工具使用 Playwright 導覽至指定的 URL，擷取無障礙快照，並產生涵蓋 WCAG 準則的結構化報告，例如地標 (landmarks)、標題階層、焦點管理以及觸控目標。它也可以產生 Playwright 測試檔案，以便將未來的無障礙檢查自動化。

## 先決條件

```bash
pip install github-copilot-sdk
```

您還需要 `npx` (已安裝 Node.js) 才能使用 Playwright MCP 伺服器。

## 用法

```bash
python accessibility_report.py
# 系統提示時輸入一個 URL
```

## 完整範例：accessibility_report.py

```python
#!/usr/bin/env python3

import asyncio
from copilot import (
    CopilotClient,
    SessionConfig,
    MessageOptions,
    SessionEvent,
    PermissionHandler,
)

# ============================================================================
# 主要應用程式
# ============================================================================

async def main():
    print("=== 無障礙檢視表產生器 ===\n")

    url = input("輸入要分析的 URL：").strip()

    if not url:
        print("未提供 URL。正在結束。")
        return

    # 確保 URL 有協定
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    print(f"\n正在分析：{url}")
    print("請稍候...\n")

    # 建立具有 Playwright MCP 伺服器的 Copilot 用戶端
    client = CopilotClient()
    await client.start()

    session = await client.create_session(SessionConfig(
        model="claude-opus-4.6",
        streaming=True,
        mcp_servers={
            "playwright": {
                "type": "local",
                "command": "npx",
                "args": ["@playwright/mcp@latest"],
                "tools": ["*"],
            }
        },
        on_permission_request=PermissionHandler.approve_all))

    done = asyncio.Event()

    # 設定串流事件處理
    def handle_event(event: SessionEvent):
        if event.type.value == "assistant.message_delta":
            print(event.data.delta_content or "", end="", flush=True)
        elif event.type.value == "session.idle":
            done.set()
        elif event.type.value == "session.error":
            print(f"\n錯誤：{event.data.message}")
            done.set()

    session.on(handle_event)

    prompt = f"""
    使用 Playwright MCP 伺服器來分析此網頁的無障礙程度：{url}
    
    請：
    1. 使用 playwright-browser_navigate 導覽至該 URL
    2. 使用 playwright-browser_snapshot 擷取無障礙快照
    3. 分析快照並提供詳細的無障礙檢視表
    
    使用表情符號指示器格式化檢視表：
    - 📊 無障礙檢視表標題
    - ✅ 執行良好的項目（包含類別、狀態、詳細資訊的表格）
    - ⚠️ 發現的問題（包含嚴重性、問題、WCAG 準則、建議的表格）
    - 📋 統計摘要（連結、標題、可聚焦元素、地標）
    - ⚙️ 優先建議

    使用 ✅ 表示通過，🔴 表示嚴重性高的問題，🟡 表示嚴重性中等的問題，❌ 表示缺失的項目。
    包含來自網頁分析的實際發現。
    """

    await session.send(MessageOptions(prompt=prompt))
    await done.wait()

    print("\n\n=== 檢視表完成 ===\n")

    # 提示使用者產生測試
    generate_tests = input(
        "您想要產生 Playwright 無障礙測試嗎？(y/n)："
    ).strip().lower()

    if generate_tests in ("y", "yes"):
        done.clear()

        detect_language_prompt = """
        分析目前的工作目錄以偵測主要程式語言。
        僅以偵測到的語言名稱和簡短說明進行回應。
        如果未偵測到專案，建議預設為 "TypeScript"。
        """

        print("\n正在偵測專案語言...\n")
        await session.send(MessageOptions(prompt=detect_language_prompt))
        await done.wait()

        language = input(
            "\n\n確認測試使用的語言（或輸入其他語言）："
        ).strip()
        if not language:
            language = "TypeScript"

        done.clear()

        test_generation_prompt = f"""
        根據您剛才為 {url} 產生的無障礙檢視表，
        使用 {language} 建立 Playwright 無障礙測試。
        
        包含以下測試：lang 屬性、title、標題階層、alt 文字、
        地標、跳過導覽、焦點指示器和觸控目標。
        使用 Playwright 的無障礙測試功能並附上實用的註解。
        輸出完整的測試檔案。
        """

        print("\n正在產生無障礙測試...\n")
        await session.send(MessageOptions(prompt=test_generation_prompt))
        await done.wait()

        print("\n\n=== 測試已產生 ===")

    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

## 運作方式

1. **Playwright MCP 伺服器**：設定執行 `@playwright/mcp` 的本機 MCP 伺服器，以提供瀏覽器自動化工具。
2. **串流輸出**：使用 `streaming=True` 和 `ASSISTANT_MESSAGE_DELTA` 事件進行即時 Token 輸出。
3. **無障礙快照**：Playwright 的 `browser_snapshot` 工具可擷取網頁的完整無障礙樹。
4. **結構化檢視表**：提示詞會產生具有表情符號嚴重性指示器且與 WCAG 一致的格式化檢視表。
5. **測試產生**：選擇性偵測專案語言並產生 Playwright 無障礙測試。

## 關鍵概念

### MCP 伺服器設定

此範例設定了一個與會話同時執行的本機 MCP 伺服器：

```python
session = await client.create_session(SessionConfig(
    mcp_servers={
        "playwright": {
            "type": "local",
            "command": "npx",
            "args": ["@playwright/mcp@latest"],
            "tools": ["*"],
        }
    },
        on_permission_request=PermissionHandler.approve_all))
```

這賦予模型存取 Playwright 瀏覽器工具的能力，例如 `browser_navigate`、`browser_snapshot` 和 `browser_click`。

### 使用事件進行串流

與 `send_and_wait` 不同，此範例使用串流進行即時輸出：

```python
def handle_event(event: SessionEvent):
    if event.type.value == "assistant.message_delta":
        print(event.data.delta_content or "", end="", flush=True)
    elif event.type.value == "session.idle":
        done.set()

session.on(handle_event)
```

## 範例互動

```
=== 無障礙檢視表產生器 ===

輸入要分析的 URL：github.com

正在分析：https://github.com
請稍候...

📊 無障礙檢視表：GitHub (github.com)

✅ 執行良好的項目
| 類別 | 狀態 | 詳細資訊 |
|----------|--------|---------|
| 語言 | ✅ 通過 | lang="en" 設定正確 |
| 頁面標題 | ✅ 通過 | "GitHub" 可辨識 |
| 標題階層 | ✅ 通過 | 正確的 H1/H2 結構 |
| 影像 | ✅ 通過 | 所有影像都有 alt 文字 |

⚠️ 發現的問題
| 嚴重性 | 問題 | WCAG 準則 | 建議 |
|----------|-------|----------------|----------------|
| 🟡 中等 | 部分連結缺少說明性文字 | 2.4.4 | 為僅有圖示的連結新增 aria-label |

📋 統計摘要
- 連結總數：47
- 標題總數：8 (1× H1，階層正確)
- 可聚焦元素：52
- 發現的地標：banner ✅, navigation ✅, main ✅, footer ✅

=== 檢視表完成 ===

您想要產生 Playwright 無障礙測試嗎？(y/n)：y

正在偵測專案語言...
偵測到 TypeScript (找到 package.json)

確認測試使用的語言（或輸入其他語言）： 

正在產生無障礙測試...
[產生的測試檔案輸出...]

=== 測試已產生 ===
```
