# 使用多個工作階段

同時管理多個獨立的對話。

> **可執行範例：** [recipe/multiple_sessions.py](recipe/multiple_sessions.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python multiple_sessions.py
> ```

## 範例場景

您需要同時執行多個對話，每個對話都有其自己的內容與歷程記錄。

## Python

```python
from copilot import CopilotClient

client = CopilotClient()
client.start()

# 建立多個獨立的工作階段
session1 = client.create_session(model="gpt-5")
session2 = client.create_session(model="gpt-5")
session3 = client.create_session(model="claude-sonnet-4.5")

# 每個工作階段都維護自己的對話歷程記錄
session1.send(prompt="您正在協助處理一個 Python 專案")
session2.send(prompt="您正在協助處理一個 TypeScript 專案")
session3.send(prompt="您正在協助處理一個 Go 專案")

# 後續訊息會保留在各自的內容中
session1.send(prompt="如何建立虛擬環境？")
session2.send(prompt="如何設定 tsconfig？")
session3.send(prompt="如何初始化模組？")

# 清理所有工作階段
session1.destroy()
session2.destroy()
session3.destroy()
client.stop()
```

## 自定義工作階段 ID

使用自定義 ID 以便於追蹤：

```python
session = client.create_session(
    session_id="user-123-chat",
    model="gpt-5"
)

print(session.session_id)  # "user-123-chat"
```

## 列出工作階段

```python
sessions = client.list_sessions()
for session_info in sessions:
    print(f"工作階段：{session_info['sessionId']}")
```

## 刪除工作階段

```python
# 刪除特定的工作階段
client.delete_session("user-123-chat")
```

## 使用案例

- **多使用者應用程式**：每個使用者一個工作階段
- **多任務工作流**：針對不同任務使用獨立的工作階段
- **A/B 測試**：比較來自不同模型的回應
