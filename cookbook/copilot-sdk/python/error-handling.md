---
description: '錯誤處理模式範例'
---

# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **可執行範例：** [recipe/error_handling.py](recipe/error_handling.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python error_handling.py
> ```

## 範例情境

您需要處理各種錯誤狀況，例如連線失敗、逾時以及無效的回應。

## 基本 try-except

```python
import asyncio
from copilot import CopilotClient, SessionConfig, MessageOptions, PermissionHandler

async def main():
    client = CopilotClient()

    try:
        await client.start()
        session = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

        response = await session.send_and_wait(MessageOptions(prompt="Hello!"))

        if response:
            print(response.data.content)

        await session.destroy()
    except Exception as e:
        print(f"錯誤：{e}")
    finally:
        await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

## 處理特定錯誤類型

```python
try:
    await client.start()
except FileNotFoundError:
    print("找不到 Copilot CLI。請先安裝它。")
except ConnectionError:
    print("無法連線至 Copilot CLI 伺服器。")
except Exception as e:
    print(f"未預期的錯誤：{e}")
```

## 逾時處理

```python
session = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

try:
    # send_and_wait 接受一個選用的逾時參數（以秒為單位）
    response = await session.send_and_wait(
        MessageOptions(prompt="複雜的問題..."),
        timeout=30.0
    )
    print("已收到回應")
except TimeoutError:
    print("請求逾時")
```

## 中斷請求

```python
session = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

# 開始請求 (非阻塞傳送)
await session.send(MessageOptions(prompt="寫一個很長的故事..."))

# 在某些條件後將其中斷
await asyncio.sleep(5)
await session.abort()
print("請求已中斷")
```

## 優雅的關閉

```python
import signal
import sys

def signal_handler(sig, frame):
    print("\n正在關閉...")
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(client.stop())
    except RuntimeError:
        asyncio.run(client.stop())
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
```

## 最佳實踐

1. **務必清理**：使用 try-finally 確保呼叫了 `await client.stop()`
2. **處理連線錯誤**：CLI 可能未安裝或未執行
3. **設定適當的逾時**：在 `send_and_wait()` 上使用 `timeout` 參數
4. **記錄錯誤**：擷取錯誤詳細資訊以進行除錯
