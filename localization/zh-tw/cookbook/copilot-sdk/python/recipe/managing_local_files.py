#!/usr/bin/env python3

from copilot import CopilotClient
import os

# 建立並啟動用戶端
client = CopilotClient()
client.start()

# 建立工作階段
session = client.create_session(model="gpt-5")

# 事件處理常式
def handle_event(event):
    if event["type"] == "assistant.message":
        print(f"\nCopilot: {event['data']['content']}")
    elif event["type"] == "tool.execution_start":
        print(f"  → 執行中: {event['data']['toolName']}")
    elif event["type"] == "tool.execution_complete":
        print(f"  ✓ 已完成: {event['data']['toolCallId']}")

session.on(handle_event)

# 請求 Copilot 整理檔案
# 將此更改為您的目標資料夾
target_folder = os.path.expanduser("~/Downloads")

session.send(prompt=f""")
分析 "{target_folder}" 中的檔案並將其整理到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽依檔案副檔名進行分組
3. 建立適當的子資料夾（例如 "images", "documents", "videos"）
4. 將每個檔案移動到其適當的子資料夾中

移動任何檔案之前請先確認。
""")

session.wait_for_idle()

session.destroy()
client.stop()

