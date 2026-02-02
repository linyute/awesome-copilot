# 工作階段持續性與恢復

跨應用程式重新啟動儲存並還原對話工作階段。

## 範例場景

您希望使用者即使在關閉並重新開啟您的應用程式後，仍能繼續對話。

> **可執行範例：** [recipe/persisting_sessions.py](recipe/persisting_sessions.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python persisting_sessions.py
> ```

### 使用自定義 ID 建立工作階段

```python
from copilot import CopilotClient

client = CopilotClient()
client.start()

# 使用易記的 ID 建立工作階段
session = client.create_session(
    session_id="user-123-conversation",
    model="gpt-5",
)

session.send(prompt="讓我們討論 TypeScript 泛型")

# 工作階段 ID 會被保留
print(session.session_id)  # "user-123-conversation"

# 終止工作階段但將資料保留在磁碟上
session.destroy()
client.stop()
```

### 恢復工作階段

```python
client = CopilotClient()
client.start()

# 恢復先前的工作階段
session = client.resume_session("user-123-conversation")

# 先前的內容已還原
session.send(prompt="我們剛才在討論什麼？")

session.destroy()
client.stop()
```

### 列出可用的工作階段

```python
sessions = client.list_sessions()
for s in sessions:
    print("工作階段：", s["sessionId"])
```

### 永久刪除工作階段

```python
# 從磁碟中移除工作階段及其所有資料
client.delete_session("user-123-conversation")
```

### 獲取工作階段歷程記錄

```python
messages = session.get_messages()
for msg in messages:
    print(f"[{msg['type']}] {msg['data']}")
```

## 最佳實踐

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容
2. **處理缺失的工作階段**：在恢復之前檢查工作階段是否存在
3. **清理舊的工作階段**：定期刪除不再需要的工作階段
