# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **可執行範例：** [recipe/error_handling.py](recipe/error_handling.py)
> 
> ```bash
> cd recipe && pip install -r requirements.txt
> python error_handling.py
> ```

## 範例場景

您需要處理各種錯誤狀況，例如連線失敗、逾時與無效的回應。

## 基本 try-except

```python
from copilot import CopilotClient

client = CopilotClient()

try:
    client.start()
    session = client.create_session(model="gpt-5")

    response = None
    def handle_message(event):
        nonlocal response
        if event["type"] == "assistant.message":
            response = event["data"]["content"]

    session.on(handle_message)
    session.send(prompt="Hello!")
    session.wait_for_idle()

    if response:
        print(response)

    session.destroy()
except Exception as e:
    print(f"錯誤：{e}")
finally:
    client.stop()
```

## 處理特定錯誤類型

```python
import subprocess

try:
    client.start()
except FileNotFoundError:
    print("找不到 Copilot CLI。請先安裝。 সন")
except ConnectionError:
    print("無法連線至 Copilot CLI 伺服器。 সন")
except Exception as e:
    print(f"未預期的錯誤：{e}")
```

## 逾時處理

```python
import signal
from contextlib import contextmanager

@contextmanager
def timeout(seconds):
    def timeout_handler(signum, frame):
        raise TimeoutError("請求逾時")

    old_handler = signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)

session = client.create_session(model="gpt-5")

try:
    session.send(prompt="複雜的問題...")

    # 等待逾時（30 秒）
    with timeout(30):
        session.wait_for_idle()

    print("已收到回應")
except TimeoutError:
    print("請求逾時")
```

## 中止請求

```python
import threading

session = client.create_session(model="gpt-5")

# 開始一個請求
session.send(prompt="寫一個很長的故事...")

# 在某些條件下中止它
def abort_later():
    import time
    time.sleep(5)
    session.abort()
    print("請求已中止")

threading.Thread(target=abort_later).start()
```

## 優雅關閉

```python
import signal
import sys

def signal_handler(sig, frame):
    print("\n正在關閉...")
    errors = client.stop()
    if errors:
        print(f"清理錯誤：{errors}")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
```

## 用於自動清理的上下文管理器 (Context manager)

```python
from copilot import CopilotClient

with CopilotClient() as client:
    client.start()
    session = client.create_session(model="gpt-5")

    # ... 執行工作 ...

    # 離開上下文時會自動呼叫 client.stop()
```

## 最佳實踐

1. **務必進行清理** ：使用 try-finally 或上下文管理器以確保呼叫 `stop()`
2. **處理連線錯誤** ：CLI 可能未安裝或未執行
3. **設定適當的逾時** ：針對長時間執行的請求應設定逾時
4. **記錄錯誤** ：擷取錯誤詳細資訊以進行偵錯

