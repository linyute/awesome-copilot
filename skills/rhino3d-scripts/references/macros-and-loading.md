# 巨集、載入與執行指令碼

## 指令巨集 (無須指令碼)

巨集是一串指令列輸入。在 Rhino 接受指令的任何地方 (別名、工具列按鈕、`_ReadCommandFile`)，您都可以放置一個巨集。

### 語法規則

| Token | 含義 |
|---|---|
| `!` | **取消**在此之前執行的任何正在執行的指令。請務必以 `!` 開頭。 |
| `_` | 使用 **英文** (不變量) 指令名稱，這樣巨集在任何地區設定下都能運作。 |
| `-` | 以 **指令碼模式 (script mode)** 執行指令 — 隱藏對話框，接受來自巨集字串的輸入。 |
| `_Enter` | 在當前提示下按下 Enter。 |
| `Pause` | 停止並等待使用者以互動方式提供此輸入。 |
| `;` | 行尾註解。 |
| 換行符號 | 與空格相同 — Token 之間的分隔符號，而不是指令終止符。 |

### 巨集範例

```text
! _-Line 0,0,0 10,0,0
! _-Circle 0,0,0 5 _Enter
! _SelAll _Delete
! _-Properties _Object _Name "MyObject" _EnterEnd _Enter
! _-RunPythonScript "MyScript.py"
```

## 執行已儲存的指令碼

### Python (`.py`)

```text
_-RunPythonScript "C:\Users\example\Scripts\MyScript.py"
```

或者，如果指令碼資料夾在搜尋路徑上：

```text
_-RunPythonScript "MyScript.py"
```

`_EditPythonScript` 開啟舊版編輯器；`_ScriptEditor` (Rhino 8) 開啟包含 Python 3、VB 和 C# 的統一編輯器。

### RhinoScript (`.rvb`, `.vbs`)

兩個步驟：**載入**檔案 (註冊其 Sub/Function)，然後 **執行**具名的 Sub。

```text
_-LoadScript "MyScript.rvb"
_-RunScript MyMainSub
```

單一 `.rvb` 可以包含許多 Sub；`_RunScript` 選擇要呼叫哪一個。

### 搜尋路徑

`Options → Files → Search paths` — 當您透過純檔名參考指令碼時，會掃描此處列出的資料夾。如果沒有，您必須提供完整路徑。

### 啟動指令碼

`Options → RhinoScript → Startup` (以及 `Options → Python → Startup`) — 這些清單中的檔案會在 Rhino 開啟時執行一次。可用於註冊自訂指令或別名。

**在啟動程式碼中防止遺失文件：**

```python
import scriptcontext as sc

def startup():
    if sc.doc is None:
        return

startup()
```

## 工具列按鈕與別名

工具列按鈕的 **Command** 欄位只是一個巨集。要製作執行您指令碼的按鈕：

```text
! _-RunPythonScript "MyScript.py"
```

將 **Tooltip** 設定為簡短描述；透過按鈕編輯器設定圖示。

要建立別名：`Options → Aliases → New`。別名名稱會變成輸入的指令；其值為巨集。

## 從指令碼呼叫巨集

```python
import rhinoscriptsyntax as rs
rs.Command("! _-Line 0,0,0 10,0,0", echo=False)
```

`echo=False` 會隱藏指令記錄輸出，但 **不會** 隱藏提示 — 務必使用 `-` 並在巨集字串中完成每個提示。

## rhinocode CLI (Rhino 8)

`rhinocode` 是 Rhino 8 的指令列工具，用於從外部終端機對執行中的 Rhino 例項執行指令碼和指令。

### 基本指令

```text
rhinocode script "C:\path\to\MyScript.py"            # 執行 Python 指令碼
rhinocode command "_Circle 0,0,0 5 _Enter"           # 執行 Rhino 指令
rhinocode --rhino <instance-id> script "MyScript.py" # 目標為特定的例項
```

`<instance-id>` 看起來像 `rhinocode_remotepipe_75029`。在 Rhino 的標題列中尋找 ID，或在 Rhino 中執行 `StartScriptServer`，它會將管線名稱列印到指令列。

### 架構 — 管線伺服器 (pipe server)

rhinocode **不會** 產生新的 Rhino 進程。它連線到 Rhino 公開的持久伺服器 (`StartScriptServer`)。指令碼在該伺服器進程中執行，這意味著：

- **環境變數是隔離的。** 在呼叫 Shell 中設定的變數 (`set FOO=bar`) 在指令碼內部透過 `os.environ` 不可見。伺服器在您的 Shell 啟動之前就已經啟動了。
- **`os.getcwd()` 是伺服器的工作目錄**，而不是您呼叫 rhinocode 的目錄。請勿依賴它來設定輸出路徑；請明確傳遞路徑。
- **`print()` 輸出會被管線傳回** 給呼叫的終端機 — 請隨意使用它來獲取狀態訊息。

### 將資料傳遞給指令碼

rhinocode 不支援指令碼路徑後的位置引數 — 任何額外的 Token 都會被串接到檔案 URI 上，導致「檔案不存在」錯誤。解決方法：

|通道|方式|備註|
|---|---|---|
|暫存檔|呼叫者將檔案寫入已知位置；指令碼讀取並刪除它。|使用從 `__file__` 衍生的路徑 (見下文)，而不是 `%TEMP%` — 伺服器可能會解析出不同的暫存目錄。|
|Rhino 對話框|指令碼呼叫 `rhinoscriptsyntax.ListBox` / `GetString`|總是有效；使用者會在 Rhino 中看到提示。|

### `__file__` 是一個 URI

透過 rhinocode 執行時，`__file__` 被設定為一個帶有 URL 編碼字元的 `file:///` URI (空格變為 `%20`)。在使用它作為檔案系統路徑之前，請先解碼它：

```python
import os, sys, urllib.parse

def _script_dir():
    raw = __file__
    if raw.startswith("file:///"):
        raw = urllib.parse.unquote(raw[len("file:///"):])
        if sys.platform == "win32":
            raw = raw.replace("/", os.sep)
    return os.path.dirname(os.path.abspath(raw))
```
