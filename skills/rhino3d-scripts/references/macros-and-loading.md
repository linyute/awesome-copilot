# 巨集、載入與執行指令碼

## 命令巨集 (Command Macros) (無需指令碼)

巨集是一串命令列輸入字串。任何 Rhino 接受命令的地方（別名、工具列按鈕、`_ReadCommandFile`），您都可以放置巨集。

### 語法規則

| 權杖 (Token) | 意義 |
|---|---|
| `!` | 在此命令開始之前，**取消** 任何目前正在執行的命令。巨集務必以 `!` 開頭。 |
| `_` | 使用 **英文** (不變) 命令名稱，使巨集可在任何語系中運作。 |
| `-` | 以 **指令碼模式** 執行命令 — 抑制對話方塊，並從巨集字串中接受輸入。 |
| `_Enter` | 在目前提示下按 Enter。 |
| `Pause` | 停止並等待使用者進行互動式輸入。 |
| `;` | 行尾註解。 |
| 換行 (Newline) | 相當於空格 — 作為權杖之間的區隔符號，而非命令結束符號。 |

### 巨集範例

```text
! _-Line 0,0,0 10,0,0
! _-Circle 0,0,0 5 _Enter
! _SelAll _Delete
! _-Properties _Object _Name "MyObject" _EnterEnd _Enter
! _-RunPythonScript "MyScript.py"
```

## 執行儲存的指令碼

### Python (`.py`)

```text
_-RunPythonScript "C:\Users\example\Scripts\MyScript.py"
```

或者，若指令碼資料夾已在搜尋路徑中：

```text
_-RunPythonScript "MyScript.py"
```

`_EditPythonScript` 會開啟舊版編輯器；`_ScriptEditor` (Rhino 8) 會開啟支援 Python 3、VB 和 C# 的統一編輯器。

### RhinoScript (`.rvb`, `.vbs`)

兩個步驟：**載入** 檔案（註冊其 sub/function），然後 **執行** 指定名稱的 sub。

```text
_-LoadScript "MyScript.rvb"
_-RunScript MyMainSub
```

單一 `.rvb` 檔案可以包含多個 sub；`_RunScript` 用於選擇要呼叫哪一個。

### 搜尋路徑

`選項 → 檔案 → 搜尋路徑` — 當您僅使用檔名引用指令碼時，會掃描此處列出的資料夾。若未列出，您必須提供完整路徑。

### 啟動指令碼

`選項 → RhinoScript → 啟動` (以及 `選項 → Python → 啟動`) — 這些清單中的檔案會在 Rhino 開啟時執行一次。適用於註冊自訂命令或別名。

在啟動程式碼中**防範遺漏文件**：

```python
import scriptcontext as sc

def startup():
    if sc.doc is None:
        return

startup()
```

## 工具列按鈕與別名

工具列按鈕的 **Command** 欄位就是一個巨集。要建立一個執行指令碼的按鈕：

```text
! _-RunPythonScript "MyScript.py"
```

將 **工具提示 (Tooltip)** 設定為簡短描述；透過按鈕編輯器設定圖示。

要建立別名：`選項 → 別名 → 新增`。別名名稱會成為輸入的命令；其值為巨集。

## 從指令碼中呼叫巨集

```python
import rhinoscriptsyntax as rs
rs.Command("! _-Line 0,0,0 10,0,0", echo=False)
```

`echo=False` 會抑制命令歷程記錄輸出，但**不會**抑制提示 — 務必使用 `-` 並在巨集字串中完成所有提示。
