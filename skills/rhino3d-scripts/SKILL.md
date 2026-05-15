---
name: rhino3d-scripts
description: '針對 Rhinoceros 3D（Rhino 8 及更新版本）編寫與偵錯指令碼。當被要求編寫 RhinoScript (VBScript / .rvb / .vbs)、RhinoPython 或基於 RhinoCommon 的指令碼時使用；自動化 Rhino 建模任務；建立命令巨集；操作 Rhino 幾何圖形、圖層、區塊或文件物件；從視圖中選取物件；控制重新繪製與復原；或從 Rhino 指令碼編輯器載入並執行指令碼。涵蓋 `rhinoscriptsyntax`、`scriptcontext`、`Rhino.*` RhinoCommon 命名空間（`Rhino.Geometry`、`Rhino.DocObjects`、`Rhino.Input`、`Rhino.UI`、`Rhino.Display`、`Rhino.FileIO`）以及 Rhino 8 統一指令碼編輯器。'
---

# Rhino 3D 指令碼編寫技能

為 Rhinoceros 3D 編寫生產品質的指令碼。涵蓋三種指令碼介面（RhinoScript/VBScript、RhinoPython、直接使用 RhinoCommon .NET）以及 Rhino 8+ 指令碼編輯器。

## 何時使用此技能

- 使用者要求編寫、編輯或偵錯 `.rvb`、`.vbs` 或 `.py` Rhino 指令碼
- 使用者想要 Rhino **命令巨集** 或想要自動化一系列 Rhino 命令
- 使用者想要透過程式碼操作幾何圖形、圖層、區塊、材質、視圖或註解
- 使用者提到 `rhinoscriptsyntax`、`scriptcontext`、`RhinoCommon`、`Rhino.Geometry`、`RhinoDoc` 或指令碼編輯器
- 使用者想要選取物件、提示輸入或在 Rhino 內部建立小型 UI
- 使用者詢問如何載入、執行或分發指令碼（啟動指令碼、別名、工具列按鈕）

## 選擇指令碼介面

根據任務而非偏好選擇介面。對於新工作，預設建議使用 Python。

| 介面 | 何時選擇 | 檔案副檔名 |
|---|---|---|
| **RhinoPython** (`rhinoscriptsyntax` + RhinoCommon) | 新指令碼的預設選擇。具有最佳生態系統、易讀，且具備完整的 RhinoCommon 存取權限。 | `.py` |
| **RhinoScript** (VBScript) | 維護舊版 `.rvb`/`.vbs` 檔案；與 VBA/COM 整合。 | `.rvb`, `.vbs` |
| **透過指令碼編輯器的 RhinoCommon (C#/.NET)** | 效能關鍵的迴圈、複雜幾何圖形、利用 .NET 函式庫。 | `.cs` |
| **命令巨集 (Command macro)** | 現有 Rhino 命令的純序列；不含邏輯。 | 工具列/別名 |

巨集 **不是** 指令碼 — 它是命令列輸入字串（例如 `! _-Line 0,0,0 10,0,0 _Enter`）。一旦您需要變數、迴圈或條件判斷，就應使用指令碼。

## 先決條件

- Rhino 7 或更新版本（強烈建議使用 Rhino 8 — 統一指令碼編輯器在單一視窗中支援 Python 3、VB 和 C#）。
- 指令碼編輯器：輸入 `_ScriptEditor` (Rhino 8) 或 `_EditPythonScript` / `_EditScript` (舊版)。
- 從命令列執行儲存的檔案，使用 `_-RunPythonScript` 或 `_LoadScript` + `_RunScript`。

## 核心模式

### Python：極簡鷹架 (scaffold)

```python
import rhinoscriptsyntax as rs
import scriptcontext as sc
import Rhino

def main():
    obj_id = rs.GetObject("選取一條曲線", filter=rs.filter.curve, preselect=True)
    if not obj_id:
        return
    length = rs.CurveLength(obj_id)
    print("長度：{0:.4f}".format(length))

if __name__ == "__main__":
    main()
```

### Python：直接操作 RhinoCommon

```python
import Rhino
import scriptcontext as sc

doc = sc.doc  # Rhino.RhinoDoc.ActiveDoc
tol = doc.ModelAbsoluteTolerance

circle = Rhino.Geometry.Circle(Rhino.Geometry.Point3d(0, 0, 0), 5.0)
curve_id = doc.Objects.AddCircle(circle)
doc.Views.Redraw()
```

### VBScript：極簡鷹架 (scaffold)

```vbscript
Option Explicit

Call Main()

Sub Main()
    Dim strObject
    strObject = Rhino.GetObject("選取一條曲線", 4)  ' 4 = 曲線篩選器
    If IsNull(strObject) Then Exit Sub
    Rhino.Print "長度：" & Rhino.CurveLength(strObject)
End Sub
```

### 使用自訂篩選器選取物件 (Python, RhinoCommon)

```python
import Rhino
import scriptcontext as sc

go = Rhino.Input.Custom.GetObject()
go.SetCommandPrompt("選取 brep")
go.GeometryFilter = Rhino.DocObjects.ObjectType.Brep
go.SubObjectSelect = False
go.GetMultiple(1, 0)
if go.CommandResult() != Rhino.Commands.Result.Success:
    pass
else:
    ids = [go.Object(i).ObjectId for i in range(go.ObjectCount)]
```

## 逐步工作流程

### 快速大量修改多個物件

1. 停用重新繪製：`rs.EnableRedraw(False)`。
2. 將變動封裝在單一復原記錄中：`undo = doc.BeginUndoRecord("我的操作")` … `doc.EndUndoRecord(undo)`。
3. 在迴圈中直接使用 RhinoCommon（跳過 `rhinoscriptsyntax` 的額外開銷）。
4. 在 `try`/`finally` 中重新啟用重新繪製並呼叫 `doc.Views.Redraw()`，以確保當機時視圖不會被凍結。

### 分發指令碼給團隊成員

1. 將 `.py` / `.rvb` 儲存在磁碟某處。
2. 將該資料夾加入 `選項 → 檔案 → 搜尋路徑`，以便 Rhino 可以按名稱找到它。
3. 建立工具列按鈕或別名，其巨集為：
   - Python: `! _-RunPythonScript "MyScript.py"`
   - RhinoScript: `! _-LoadScript "MyScript.rvb" _-RunScript MySubName`
4. 開頭的 `!` 會取消任何執行中的命令；`-` 以指令碼（無對話方塊）模式執行命令。

### 在 Rhino 啟動時執行程式碼

1. 將 `.rvb`/`.py` 放在搜尋路徑中。
2. `工具 → 選項 → RhinoScript`（或 `Python`） → 加入 **啟動 (Startup)** 清單。該檔案會在每次工作階段執行一次。

## 訣竅與注意點 (Gotchas)

- **`rhinoscriptsyntax` 傳回 GUID，RhinoCommon 傳回物件。** 混合使用是可以的，但 `doc.Objects.Find(guid)` 是從 `rs.*` ID 橋接到 `RhinoObject` 的橋樑。
- **不同介面的座標表示方式不同。** Python 使用 `(x, y, z)` 元組 *或* `Rhino.Geometry.Point3d`；VBScript 使用 3 個元素的 `Array(x, y, z)`。絕不要透過 COM 將 Python 清單傳遞給 VBScript 協助工具。
- **VBScript 預設關閉 `Option Explicit`。** 拼字錯誤會默默建立新變數。務必在 `.rvb` 檔案頂部加入 `Option Explicit`。
- **VBScript 沒有區塊作用域。** `Sub` 內部的所有 `Dim` 都會被提升到程序的頂部。迴圈計數器會洩漏。
- **VBScript 中的 `Nothing`、`Empty` 和 `Null` 是不同的。** 使用 `IsNull` 判斷 `Rhino.GetObject` 是否失敗，`IsEmpty` 判斷未初始化的 `Variant`，`Is Nothing` 判斷物件引用。
- **VBScript 中的括號會改變呼叫語義。** `Call Foo(a, b)` 和 `Foo a, b` 是有效的；`Foo(a, b)`（不含 `Call` 且帶括號）**不是** 對 Sub 的呼叫 — 對於多個引數的 sub 是語法錯誤，對於單一引數則是強制的 `ByVal`。
- **公差是針對每個文件的。** 始終讀取 `doc.ModelAbsoluteTolerance` 而不是硬編碼 `0.001`；使用者工作的單位可能是 mm、m、英吋等。
- **長迴圈應輪詢 `Rhino.RhinoApp.EscapeKeyPressed`**，以便使用者可以取消。否則 Rhino 會看起來像凍結了。
- **GUID 字串 vs `System.Guid`。** `rhinoscriptsyntax` 兩者皆可接受；RhinoCommon 則要求 `System.Guid`。如有需要，使用 `System.Guid(str_id)` 進行轉換。
- **不要在緊密迴圈中呼叫 `doc.Views.Redraw()`。** 在迴圈外切換一次重新繪製。
- **`.rvb` 其實就是重新命名的 `.vbs`**，帶有 Rhino 特定副檔名以便 Rhino 的 `LoadScript` 識別。使用的是相同的 VBScript 引擎。

## 疑難排解

| 徵狀 | 修復方法 |
|---|---|
| `rs.GetObject` 立即傳回 `None` | 使用者按下了 Esc，或您的 `filter` 過濾掉了所有內容。請重新檢查 `rs.filter.*` 旗標。 |
| 按名稱執行時出現「找不到指令碼」 | 該資料夾不在 `選項 → 檔案 → 搜尋路徑` 中。 |
| VBScript 在座標上出現 `Type mismatch` | 您傳遞了 2 個元素的陣列。Rhino 要求 3 個元素的 `Array(x, y, z)`。 |
| Python 出現 `ImportError: No module named Rhino` | 您正在 Rhino 外部執行 CPython。RhinoCommon 僅在 Rhino 嵌入的 Python 中可用（或透過 `rhino3dm` 進行唯讀檔案操作）。 |
| 建立的幾何圖形未出現 | 您忘記了 `doc.Views.Redraw()`，或 `rs.EnableRedraw(False)` 未被重新啟用。 |
| 復原操作僅復原了批次中的最後一個物件 | 將批次操作封裝在 `BeginUndoRecord` / `EndUndoRecord` 中。 |
| 指令碼單獨運作正常，但在啟動指令碼中失敗 | 啟動指令碼在開啟任何文件之前執行 — 當 `sc.doc is None` 時請提早傳回或跳過文件相依的工作。 |
| `rs.Command("...")` 傳回 `False` | 巨集字串格式不正確。開頭使用 `!` 和 `-`，每個提示後接 `_Enter` 或數值。 |

## 參考資料

- [references/rhinoscriptsyntax-cheatsheet.md](references/rhinoscriptsyntax-cheatsheet.md) — 依類別區分最常用的 `rs.*` 函式。
- [references/rhinocommon-map.md](references/rhinocommon-map.md) — 執行特定任務應匯入哪個命名空間。
- [references/macros-and-loading.md](references/macros-and-loading.md) — 命令列巨集語法、`LoadScript` / `RunScript`、搜尋路徑。
- [references/vbscript-quirks.md](references/vbscript-quirks.md) — 與 RhinoScript 相關的 VBScript 陷阱。

### 上游文件

- RhinoScript 登陸頁面：<https://docs.mcneel.com/rhino/8/help/en-us/information/rhinoscripting.htm>
- 開發者中心：<https://developer.rhino3d.com/>
- RhinoCommon API 索引：<https://mcneel.github.io/rhinocommon-api-docs/api/RhinoCommon/html/R_Project_RhinoCommon.htm>
- 範例指令碼儲存庫：<https://github.com/mcneel/rhino-developer-samples/tree/8/rhinoscript>
