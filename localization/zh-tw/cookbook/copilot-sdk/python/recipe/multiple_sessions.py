#!/usr/bin/env python3

from copilot import CopilotClient

client = CopilotClient()
client.start()

# 建立多個獨立的工作階段
session1 = client.create_session(model="gpt-5")
session2 = client.create_session(model="gpt-5")
session3 = client.create_session(model="claude-sonnet-4.5")

print("已建立 3 個獨立的工作階段")

# 每個工作階段都維護自己的對話歷程記錄
session1.send(prompt="您正在協助一個 Python 專案")
session2.send(prompt="您正在協助一個 TypeScript 專案")
session3.send(prompt="您正在協助一個 Go 專案")

print("已向所有工作階段傳送初始內容")

# 後續訊息保留在各自的內容中
session1.send(prompt="如何建立虛擬環境？")
session2.send(prompt="如何設定 tsconfig？")
session3.send(prompt="如何初始化模組？")

print("已向每個工作階段傳送後續問題")

# 清除所有工作階段
session1.destroy()
session2.destroy()
session3.destroy()
client.stop()

print("所有工作階段已成功銷毀")
