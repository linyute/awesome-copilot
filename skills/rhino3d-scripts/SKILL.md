---
name: rhino3d-scripts
description: 'Rhinoceros 3D (Rhino 8 及更高版本) 的腳本編寫與調試。當需要編寫 RhinoScript (VBScript / .rvb / .vbs)、RhinoPython 或基於 RhinoCommon 的腳本；自動化 Rhino 建模任務；建立指令巨集；操作 Rhino 幾何體、圖層、圖塊或文件物件；從視埠拾取物件；控制重繪和復原；或從 Rhino 指令碼編輯器載入並執行腳本時使用。涵蓋 `rhinoscriptsyntax`、`scriptcontext`、`Rhino.*` RhinoCommon 命名空間 (`Rhino.Geometry`, `Rhino.DocObjects`, `Rhino.Input`, `Rhino.UI`, `Rhino.Display`, `Rhino.FileIO`) 以及 Rhino 8 統一指令碼編輯器。'
---

# Rhino 3D 指令碼編寫技能

編寫生產品質的 Rhinoceros 3D 指令碼。涵蓋三種指令碼編寫介面 (RhinoScript/VBScript、RhinoPython、直接 RhinoCommon .NET) 和 Rhino 8+ 指令碼編輯器。

## 何時使用此技能

- 使用者要求編寫、編輯或調試 `.rvb`、`.vbs` 或 `.py` Rhino 指令碼
- 使用者想要 Rhino **指令巨集 (command macro)** 或想要自動化一系列 Rhino 指令
- 使用者想要透過程式碼操作幾何體、圖層、圖塊、材質、視埠或註解
- 使用者提到 `rhinoscriptsyntax`, `scriptcontext`, `RhinoCommon`, `Rhino.Geometry`, `RhinoDoc` 或指令碼編輯器
- 使用者想要在 Rhino 內部拾取物件、提示輸入或建立小型 UI
- 使用者詢問如何載入、執行或分發指令碼 (啟動指令碼、別名、工具列按鈕)

## 選擇指令碼編寫介面

根據任務選擇介面，而不是根據個人偏好。對於新工作，建議預設使用 Python。

| 介面 | 何時選擇 | 副檔名 |
|---|---|---|
| **RhinoPython** (`rhinoscriptsyntax` + RhinoCommon) | 新指令碼的預設值。最佳生態系統，易讀，可完整存取 RhinoCommon。 | `.py` |
| **RhinoScript** (VBScript) | 維護舊版 `.rvb`/`.vbs` 檔案；與 VBA/COM 整合。 | `.rvb`, `.vbs` |
| **RhinoCommon (C#/.NET) 透過指令碼編輯器** | 效能關鍵迴圈，複雜幾何體，利用 .NET 函式庫。 | `.cs` |
| **指令巨集** | 現有 Rhino 指令的純序列；無邏輯。 | 工具列/別名 |

巨集 **不是** 指令碼 — 它是一串指令列輸入 (例如 `! _-Line 0,0,0 10,0,0 _Enter`)。當您需要變數、迴圈或條件式時，請立即使用指令碼。

## 先決條件

- Rhino 7 或更高版本 (強烈建議 Rhino 8 — 統一指令碼編輯器在同一個視窗中支援 Python 3、VB 和 C#)。
- 指令碼編輯器：輸入 `_ScriptEditor` (Rhino 8) 或 `_EditPythonScript` / `_EditScript` (舊版)。
- 從指令列執行已儲存的檔案：`_-RunPythonScript` 或 `_LoadScript` + `_RunScript`。

## 核心模式 (Core Patterns)

### Python：最小骨架

```python
import rhinoscriptsyntax as rs
import scriptcontext as sc
import Rhino

def main():
    obj_id = rs.GetObject("Select a curve", filter=rs.filter.curve, preselect=True)
    if not obj_id:
        return
    length = rs.CurveLength(obj_id)
    print("Length: {0:.4f}".format(length))

if __name__ == "__main__":
    main()
```

### Python：直接使用 RhinoCommon

```python
import Rhino
import scriptcontext as sc

doc = sc.doc  # Rhino.RhinoDoc.ActiveDoc
tol = doc.ModelAbsoluteTolerance

circle = Rhino.Geometry.Circle(Rhino.Geometry.Point3d(0, 0, 0), 5.0)
curve_id = doc.Objects.AddCircle(circle)
doc.Views.Redraw()
```

### VBScript：最小骨架

```vbscript
Option Explicit

Call Main()

Sub Main()
    Dim strObject
    strObject = Rhino.GetObject("Select a curve", 4)  ' 4 = 曲線過濾器
    If IsNull(strObject) Then Exit Sub
    Rhino.Print "Length: " & Rhino.CurveLength(strObject)
End Sub
```

### 使用自訂過濾器拾取物件 (Python, RhinoCommon)

```python
import Rhino
import scriptcontext as sc

go = Rhino.Input.Custom.GetObject()
go.SetCommandPrompt("Select breps")
go.GeometryFilter = Rhino.DocObjects.ObjectType.Brep
go.SubObjectSelect = False
go.GetMultiple(1, 0)
if go.CommandResult() != Rhino.Commands.Result.Success:
    pass
else:
    ids = [go.Object(i).ObjectId for i in range(go.ObjectCount)]
```

## 逐步工作流程

### 快速批量修改大量物件

1. 停用重繪：`rs.EnableRedraw(False)`。
2. 將修改包裹在單一復原記錄中：`undo = doc.BeginUndoRecord("My Op")` … `doc.EndUndoRecord(undo)`。
3. 在迴圈內直接使用 RhinoCommon (跳過 `rhinoscriptsyntax` 的額外開銷)。
4. 在 `try`/`finally` 中重新啟用重繪並呼叫 `doc.Views.Redraw()`，這樣崩潰永遠不會導致視埠凍結。

### 將指令碼分發給隊友

1. 將 `.py` / `.rvb` 儲存在磁碟上的某個位置。
2. 將資料夾新增至 `Options → Files → Search paths`，以便 Rhino 可以按名稱找到它。
3. 建立工具列按鈕或別名，其巨集為：
   - Python: `! _-RunPythonScript "MyScript.py"`
   - RhinoScript: `! _-LoadScript "MyScript.rvb" _-RunScript MySubName`
4. 開頭的 `!` 會取消任何執行中的指令；`-` 以指令碼 (無對話框) 模式執行指令。

### 在 Rhino 啟動時執行程式碼

1. 將 `.rvb`/`.py` 放在搜尋路徑中。
2. `Tools → Options → RhinoScript` (或 `Python`) → 新增至 **Startup** 清單。檔案會在每個工作階段執行一次。

## 陷阱 (Gotchas)

- **`rhinoscriptsyntax` 傳回 GUID，RhinoCommon 傳回物件。** 混合使用是可以的，但 `doc.Objects.Find(guid)` 是從 `rs.*` ID 到 `RhinoObject` 的橋樑。
- **座標系統因介面而異。** Python 使用 `(x, y, z)` 元組 *或* `Rhino.Geometry.Point3d`；VBScript 使用 3 元素 `Array(x, y, z)`。永遠不要透過 COM 將 Python 清單傳遞給 VBScript 輔助程式。
- **VBScript 預設關閉 `Option Explicit`。** 拼字錯誤會靜默建立新變數。務必在 `.rvb` 檔案頂部新增 `Option Explicit`。
- **VBScript 沒有區塊範圍。** `Sub` 內的所有 `Dim` 都會提升到程序的頂部。迴圈計數器會洩漏。
- **在 VBScript 中 `Nothing`、`Empty` 和 `Null` 是不同的。** 使用 `IsNull` 檢查 `Rhino.GetObject` 失敗，`IsEmpty` 用於未初始化的 `Variant`，`Is Nothing` 用於物件參考。
- **括號會改變 VBScript 中的呼叫語意。** `Call Foo(a, b)` 和 `Foo a, b` 是有效的；`Foo(a, b)` (沒有 `Call`，有括號) **不是**對 Sub 的呼叫 — 這是多引數 Sub 的語法錯誤，也是單引數 Sub 的強制 `ByVal`。
- **容差 (Tolerance) 是針對每個文件設定的。** 務必讀取 `doc.ModelAbsoluteTolerance` 而不是硬編碼 `0.001`；使用者在 mm、m、英吋等單位下工作。
- **長迴圈應輪詢 `Rhino.RhinoApp.EscapeKeyPressed`** 以便使用者可以取消。否則 Rhino 會看起來凍結。
- **GUID 字串 vs `System.Guid`。** `rhinoscriptsyntax` 接受兩者；RhinoCommon 需要 `System.Guid`。如果需要，請使用 `System.Guid(str_id)` 轉換。
- **不要在緊密迴圈內呼叫 `doc.Views.Redraw()`。** 在迴圈外切換一次重繪。
- **`.rvb` 只是改名後的 `.vbs`**，具有 Rhino 特定的副檔名，因此 Rhino 的 `LoadScript` 可以識別它。使用相同的 VBScript 引擎。
- **`Rhino.RhinoApp.IsHeadless` 可能不存在於舊版 Rhino 8 組建中。** 使用 `getattr(Rhino.RhinoApp, "IsHeadless", None)` 並在嘗試使用前檢查是否為 `None`。回退到啟發式 (例如 `sc.doc.Views.Count == 0`) 或假設存在 GUI。
- **`RhinoMath` 位於 `Rhino.RhinoMath`，而不是 `Rhino.DocObjects.RhinoMath`。** 存取 `Rhino.DocObjects.RhinoMath` 會引發 `AttributeError`。
- **`doc.Objects.AddBrep()` 在失敗時傳回 `System.Guid.Empty`。** 在 Rhino 8 CPython 中，`System` 命名空間可能無法直接匯入；將傳回值檢查為字串：`str(obj_id) == "00000000-0000-0000-0000-000000000000"`。
- **`rhinoscriptsyntax` 沒有類型存根 (type stubs)。** 靜態分析器 (Pylance/Pyright) 會將 `import rhinoscriptsyntax as rs` 標記為無法解析。在匯入行上使用 `# type: ignore` 隱藏警告；該模組在 Rhino 執行時總是可用的。
- **永遠不要以 Python 標準函式庫模組命名指令碼** (例如 `random.py`, `math.py`, `os.py`)。IronPython 2.7 (`_-RunPythonScript`) 會先搜尋指令碼目錄再搜尋標準函式庫，因此標準函式庫內的任何 `import random` (例如 `tempfile` 在內部匯入了 `random`) 都會改為找到您的檔案，並因為 `Cannot import name <X>` 而失敗。CPython 3 (`rhinocode`) 不受影響，因為它會先解析標準函式庫。重新命名指令碼或避免匯入會拉入被遮蔽名稱的模組。
- **模擬破折號 (Em dashes) 和其他非 ASCII 字元會靜默中斷 `_-RunPythonScript` (IronPython 2.7)。** `rhinocode script` 使用 CPython 3 (預設為 UTF-8)，因此同一個檔案在那裡運作良好，導致失敗原因不明顯。IronPython 2.7 在第一個違規位元組處引發 `SyntaxError: Non-ASCII character '\xe2'`。最常見的罪魁禍首是 **模擬破折號** (`--` 被許多編輯器自動轉換為 `--`)。將 `# -*- coding: utf-8 -*-` 新增為每個必須在兩個執行環境下執行的指令碼的第一行，並將印刷字元替換為 ASCII 等價物：模擬破折號 `--`、箭頭 `->`、乘號 `x`。

## 故障排除 (Troubleshooting)

| 症狀 | 修復 |
|---|---|
| `rs.GetObject` 立即傳回 `None` | 使用者按了 Escape，或您的 `filter` 排除了所有項目。重新檢查 `rs.filter.*` 旗標。 |
| 按名稱執行時顯示“無法找到指令碼” | 資料夾不在 `Options → Files → Search paths` 中。 |
| VBScript 座標上的 `Type mismatch` | 您傳遞了 2 元素陣列。Rhino 需要 3 元素 `Array(x, y, z)`。 |
| Python `ImportError: No module named Rhino` | 您在 Rhino 外部執行 CPython。RhinoCommon 僅在 Rhino 的嵌入式 Python 中可用 (或透過 `rhino3dm` 進行唯讀檔案工作)。 |
| 建立的幾何體未顯示 | 您忘記了 `doc.Views.Redraw()`，或者 `rs.EnableRedraw(False)` 從未重新啟用。 |
| 復原僅復原批次的最後一個物件 | 將批次包裹在 `BeginUndoRecord` / `EndUndoRecord` 中。 |
| 指令碼單獨運作但作為啟動指令碼失敗 | 啟動是在開啟任何文件之前執行的 — 當 `sc.doc is None` 時，提早返回或跳過依賴文件的操作。 |
| `rs.Command("...")` 傳回 `False` | 巨集字串格式錯誤。加上 `!` 和 `-` 前綴，以 `_Enter` 或值結束每個提示。 |
| `AttributeError: type object 'RhinoApp' has no attribute 'IsHeadless'` | 屬性是在較新的 Rhino 8 組建中新增的。使用 `getattr(Rhino.RhinoApp, "IsHeadless", None)` 並防止 `None`。 |
| `rhinocode script` 忽略指令碼路徑後的引數 | rhinocode 將額外的 token 串接在檔案 URI 上。透過暫存檔或 Rhino 對話框傳遞資料。請參閱 `references/macros-and-loading.md`。 |
| 使用 `_-RunPythonScript` 時標準函式庫 (例如 `tempfile`, `os`) 內部出現 `Cannot import name <X>` | 指令碼檔名遮蔽了標準函式庫模組 (例如 `random.py` 遮蔽了 `random`)。IronPython 2.7 會先搜尋指令碼目錄。重新命名指令碼，或刪除拉入被遮蔽模組的 `import` 並用直接替代方案取代 (例如透過 `os.environ` 讀取 `%TEMP%` 而不是 `import tempfile`)。 |
| `SyntaxError: Non-ASCII character '\xe2' ... but no encoding declared` | IronPython 2.7 (`_-RunPythonScript`) 遇到了模擬破折號或類似字元。將 `# -*- coding: utf-8 -*-` 新增為第一行，或替換字元：模擬破折號 `--`、箭頭 `->`。同樣的檔案在 `rhinocode` (CPython 3) 下執行良好，這掩蓋了問題。 |

## 參考資料 (References)

- [references/rhinoscriptsyntax-cheatsheet.md](references/rhinoscriptsyntax-cheatsheet.md) — 按類別分類的最常用 `rs.*` 函式。
- [references/rhinocommon-map.md](references/rhinocommon-map.md) — 針對特定任務匯入哪個命名空間。
- [references/macros-and-loading.md](references/macros-and-loading.md) — 指令列巨集語法，`LoadScript` / `RunScript`，搜尋路徑。
- [references/vbscript-quirks.md](references/vbscript-quirks.md) — 與 RhinoScript 相關的 VBScript 專屬陷阱。

### 上游文件

- RhinoScript 登陸頁：<https://docs.mcneel.com/rhino/8/help/en-us/information/rhinoscripting.htm>
- 開發者中心：<https://developer.rhino3d.com/>
- RhinoCommon API 索引：<https://mcneel.github.io/rhinocommon-api-docs/api/RhinoCommon/html/R_Project_RhinoCommon.htm>
- 範例指令碼儲存庫：<https://github.com/mcneel/rhino-developer-samples/tree/8/rhinoscript>
