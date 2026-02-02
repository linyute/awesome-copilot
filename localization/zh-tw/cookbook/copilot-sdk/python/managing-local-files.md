# 按 Metadata 將檔案分組

使用 Copilot 根據檔案的 Metadata 智慧地組織資料夾中的檔案。

> **可執行範例：** [recipe/managing_local_files.py](recipe/managing_local_files.py)
> 
> ```bash
> cd recipe && pip install -r requirements.txt
> python managing_local_files.py
> ```

## 範例場景

您有一個包含許多檔案的資料夾，並希望根據檔案類型、建立日期、大小或其他屬性等 Metadata 將它們組織到子資料夾中。Copilot 可以分析檔案並建議或執行分組策略。

## 範例程式碼

```python
from copilot import CopilotClient
import os

# 建立並啟動用戶端
client = CopilotClient()
client.start()

# 建立工作階段
session = client.create_session(model="gpt-5")

# 事件處理程式
def handle_event(event):
    if event["type"] == "assistant.message":
        print(f"\nCopilot: {event['data']['content']}")
    elif event["type"] == "tool.execution_start":
        print(f"  → 執行中：{event['data']['toolName']}")
    elif event["type"] == "tool.execution_complete":
        print(f"  ✓ 已完成：{event['data']['toolCallId']}")

session.on(handle_event)

# 要求 Copilot 組織檔案
target_folder = os.path.expanduser("~/Downloads")

session.send(prompt=f""
分析 "{target_folder}" 中的檔案並將其組織到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽按副檔名進行的分組
3. 建立適當的子資料夾（例如 "images"、"documents"、"videos"）
4. 將每個檔案移動到其適當的子資料夾

在移動任何檔案之前請先確認。
""")

session.wait_for_idle()

client.stop()
```

## 分組策略

### 按副檔名

```python
# 檔案分組如下：
# images/   -> .jpg, .png, .gif
# documents/ -> .pdf, .docx, .txt
# videos/   -> .mp4, .avi, .mov
```

### 按建立日期

```python
# 檔案分組如下：
# 2024-01/ -> 2024 年 1 月建立的檔案
# 2024-02/ -> 2024 年 2 月建立的檔案
```

### 按檔案大小

```python
# 檔案分組如下：
# tiny-under-1kb/
# small-under-1mb/
# medium-under-100mb/
# large-over-100mb/
```

## 試執行模式 (Dry-run mode)

為了安全起見，您可以要求 Copilot 僅預覽變更：

```python
session.send(prompt=f""
分析 "{target_folder}" 中的檔案，並向我展示您將如何按檔案類型
組織它們。不要移動任何檔案 - 只需向我展示計畫。
""")
```

## 使用 AI 分析進行自定義分組

讓 Copilot 根據檔案內容決定最佳分組：

```python
session.send(prompt=f""
查看 "{target_folder}" 中的檔案並建議一個邏輯組織方式。
考慮：
- 檔案名稱及其可能包含的內容
- 檔案類型及其典型用途
- 可能指示專案或事件的日期模式

提議具有描述性且實用的資料夾名稱。
""")
```

## 安全考量

1. **移動前確認**：要求 Copilot 在執行移動之前進行確認
2. **處理重複項**：考慮如果存在同名檔案會發生什麼情況
3. **保留原始檔案**：對於重要檔案，考慮使用複製而非移動
