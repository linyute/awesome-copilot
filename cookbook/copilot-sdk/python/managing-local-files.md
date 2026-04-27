---
description: '使用 Metadata 對檔案進行分組範例'
---

# 使用 Metadata 對檔案進行分組

使用 Copilot 根據檔案的 Metadata 智慧地組織資料夾中的檔案。

> **可執行範例：** [recipe/managing_local_files.py](recipe/managing_local_files.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> python managing_local_files.py
> ```

## 範例情境

您有一個包含許多檔案的資料夾，並希望根據 Metadata（例如檔案類型、建立日期、大小或其他屬性）將它們組織到子資料夾中。Copilot 可以分析這些檔案並建議或執行分組策略。

## 範例程式碼

```python
import asyncio
import os
from copilot import (
    CopilotClient,
    SessionConfig,
    MessageOptions,
    SessionEvent,
    PermissionHandler,
)

async def main():
    # 建立並啟動用戶端
    client = CopilotClient()
    await client.start()

    # 建立會話
    session = await client.create_session(SessionConfig(model="gpt-5",
        on_permission_request=PermissionHandler.approve_all))

    done = asyncio.Event()

    # 事件處理
    def handle_event(event: SessionEvent):
        if event.type.value == "assistant.message":
            print(f"\nCopilot：{event.data.content}")
        elif event.type.value == "tool.execution_start":
            print(f"  → 執行中：{event.data.tool_name}")
        elif event.type.value == "tool.execution_complete":
            print(f"  ✓ 已完成：{event.data.tool_call_id}")
        elif event.type.value == "session.idle":
            done.set()

    session.on(handle_event)

    # 要求 Copilot 組織檔案
    target_folder = os.path.expanduser("~/Downloads")

    await session.send(MessageOptions(prompt=f"""
分析 "{target_folder}" 中的檔案並將其組織到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽按檔案副檔名進行的分組
3. 建立適當的子資料夾（例如 "images", "documents", "videos"）
4. 將每個檔案移動到適當的子資料夾

在移動任何檔案前，請先進行確認。
"""))

    await done.wait()

    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

## 分組策略

### 按檔案副檔名

```python
# 將檔案分組如下：
# images/   -> .jpg, .png, .gif
# documents/ -> .pdf, .docx, .txt
# videos/   -> .mp4, .avi, .mov
```

### 按建立日期

```python
# 將檔案分組如下：
# 2024-01/ -> 2024 年 1 月建立的檔案
# 2024-02/ -> 2024 年 2 月建立的檔案
```

### 按檔案大小

```python
# 將檔案分組如下：
# tiny-under-1kb/
# small-under-1mb/
# medium-under-100mb/
# large-over-100mb/
```

## 預覽模式 (Dry-run)

為了安全起見，您可以要求 Copilot 只預覽變更：

```python
await session.send(MessageOptions(prompt=f"""
分析 "{target_folder}" 中的檔案並向我展示您將如何按照
檔案類型進行組織。請勿移動任何檔案 - 只需向我展示計畫即可。
"""))
```

## 使用 AI 分析進行自訂分組

讓 Copilot 根據檔案內容決定最佳分組方式：

```python
await session.send(MessageOptions(prompt=f"""
檢視 "{target_folder}" 中的檔案並建議一種邏輯組織方式。
考慮：
- 檔案名稱及其可能包含的內容
- 檔案類型及其典型用途
- 可能表示專案或事件的日期模式

提出具有描述性且實用的資料夾名稱。
"""))
```

## 安全考量

1. **移動前確認**：要求 Copilot 在執行移動操作前進行確認
2. **處理重複項目**：考慮如果存在相同名稱的檔案時該怎麼辦
3. **保留原始檔案**：對於重要的檔案，請考慮複製而非移動
