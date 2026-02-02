#!/usr/bin/env python3

from copilot import CopilotClient

client = CopilotClient()
client.start()

# 建立具有易記識別碼的工作階段
session = client.create_session(
    session_id="user-123-conversation",
    model="gpt-5",
)

session.send(prompt="讓我們來討論 TypeScript 泛型 (Generics)")
print(f"工作階段已建立: {session.session_id}")

# 銷毀工作階段但將資料保留在磁碟上
session.destroy()
print("工作階段已銷毀（狀態已持久化）")

# 恢復先前的工作階段
resumed = client.resume_session("user-123-conversation")
print(f"已恢復: {resumed.session_id}")

resumed.send(prompt="我們剛才在討論什麼？")

# 列出工作階段
sessions = client.list_sessions()
print("工作階段:", [s["sessionId"] for s in sessions])

# 永久刪除工作階段
client.delete_session("user-123-conversation")
print("工作階段已刪除")

resumed.destroy()
client.stop()
