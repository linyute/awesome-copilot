# FreeCAD 工作台與進階主題 (FreeCAD Workbenches and Advanced Topics)

工作台建立、巨集、FEM 指令碼、Path/CAM 指令碼與進階操作指南。

## 官方 Wiki 參考

- [工作台建立 (Workbench creation)](https://wiki.freecad.org/Workbench_creation)
- [指令碼教學 (Script tutorial)](https://wiki.freecad.org/Scripts)
- [巨集食譜 (Macros recipes)](https://wiki.freecad.org/Macros_recipes)
- [FEM 指令碼 (FEM scripting)](https://wiki.freecad.org/FEM_Tutorial_Python)
- [Path 指令碼 (Path scripting)](https://wiki.freecad.org/Path_scripting)
- [光線追蹤指令碼 (Raytracing scripting)](https://wiki.freecad.org/Raytracing_API_example)
- [Svg 命名空間](https://wiki.freecad.org/Svg_Namespace)
- [Python](https://wiki.freecad.org/Python)
- [PythonOCC](https://wiki.freecad.org/PythonOCC)

## 自訂工作台 — 完整範本

### 目錄結構

```
MyWorkbench/
├── __init__.py          # 空或最簡版本
├── Init.py              # 於 FreeCAD 啟動時執行 (無 GUI)
├── InitGui.py           # 於 GUI 啟動時執行 (定義工作台)
├── MyCommands.py        # 指令實作
├── Resources/
│   ├── icons/
│   │   ├── MyWorkbench.svg
│   │   └── MyCommand.svg
│   └── translations/    # 選用 i18n
└── README.md
```

### Init.py

```python
# 於 FreeCAD 啟動時執行 (GUI 之前)
# 註冊匯入器/匯出器、新增模組路徑等。
import FreeCAD
FreeCAD.addImportType("My Format (*.myf)", "MyImporter")
FreeCAD.addExportType("My Format (*.myf)", "MyExporter")
```

### InitGui.py

```python
import FreeCADGui

class MyWorkbench(FreeCADGui.Workbench):
    """自訂 FreeCAD 工作台。"""

    MenuText = "My Workbench"
    ToolTip = "用於專業任務的自訂工作台"

    def __init__(self):
        import os
        self.__class__.Icon = os.path.join(
            os.path.dirname(__file__), "Resources", "icons", "MyWorkbench.svg"
        )

    def Initialize(self):
        """工作台首次啟用時呼叫。"""
        import MyCommands  # 延遲匯入

        # 定義工具列
        self.appendToolbar("My Tools", [
            "My_CreateBox",
            "Separator",    # 工具列分隔符號
            "My_EditObject"
        ])

        # 定義選單
        self.appendMenu("My Workbench", [
            "My_CreateBox",
            "My_EditObject"
        ])

        # 子選單
        self.appendMenu(["My Workbench", "Advanced"], [
            "My_AdvancedCommand"
        ])

        import FreeCAD
        FreeCAD.Console.PrintMessage("My Workbench 已初始化\n")

    def Activated(self):
        """切換至工作台時呼叫。"""
        pass

    def Deactivated(self):
        """離開工作台時呼叫。"""
        pass

    def ContextMenu(self, recipient):
        """針對右鍵內容選單呼叫。"""
        self.appendContextMenu("My Tools", ["My_CreateBox"])

    def GetClassName(self):
        return "Gui::PythonWorkbench"

FreeCADGui.addWorkbench(MyWorkbench)
```

### MyCommands.py

```python
import FreeCAD
import FreeCADGui
import os

ICON_PATH = os.path.join(os.path.dirname(__file__), "Resources", "icons")

class CmdCreateBox:
    def GetResources(self):
        return {
            "Pixmap": os.path.join(ICON_PATH, "MyCommand.svg"),
            "MenuText": "建立方塊",
            "ToolTip": "建立參數化方塊"
        }

    def IsActive(self):
        return FreeCAD.ActiveDocument is not None

    def Activated(self):
        import Part
        doc = FreeCAD.ActiveDocument
        box = Part.makeBox(10, 10, 10)
        Part.show(box, "MyBox")
        doc.recompute()

class CmdEditObject:
    def GetResources(self):
        return {
            "Pixmap": ":/icons/edit-undo.svg",
            "MenuText": "編輯物件",
            "ToolTip": "編輯選取的物件"
        }

    def IsActive(self):
        return len(FreeCADGui.Selection.getSelection()) > 0

    def Activated(self):
        sel = FreeCADGui.Selection.getSelection()[0]
        FreeCAD.Console.PrintMessage(f"編輯 {sel.Name}\n")

# 註冊指令
FreeCADGui.addCommand("My_CreateBox", CmdCreateBox())
FreeCADGui.addCommand("My_EditObject", CmdEditObject())
```

### 安裝工作台

將工作台資料夾放置於以下其中一個路徑：

```python
# 使用者巨集資料夾
FreeCAD.getUserMacroDir(True)

# 使用者模組 (Mod) 資料夾 (建議)
os.path.join(FreeCAD.getUserAppDataDir(), "Mod")

# 系統模組 (Mod) 資料夾
os.path.join(FreeCAD.getResourceDir(), "Mod")
```

## FEM 指令碼 (FEM Scripting)

```python
import FreeCAD
import ObjectsFem
import Fem
import femmesh.femmesh2mesh

doc = FreeCAD.ActiveDocument

# 取得要分析的實體物件 (必須已存在於文件中)
obj = doc.getObject("Body") or doc.Objects[0]

# 建立分析
analysis = ObjectsFem.makeAnalysis(doc, "Analysis")

# 建立求解器
solver = ObjectsFem.makeSolverCalculixCcxTools(doc, "Solver")
analysis.addObject(solver)

# 材質
material = ObjectsFem.makeMaterialSolid(doc, "Steel")
mat = material.Material
mat["Name"] = "Steel"
mat["YoungsModulus"] = "210000 MPa"
mat["PoissonRatio"] = "0.3"
mat["Density"] = "7900 kg/m^3"
material.Material = mat
analysis.addObject(material)

# 固定限制
fixed = ObjectsFem.makeConstraintFixed(doc, "Fixed")
fixed.References = [(obj, "Face1")]
analysis.addObject(fixed)

# 力限制
force = ObjectsFem.makeConstraintForce(doc, "Force")
force.References = [(obj, "Face6")]
force.Force = 1000.0  # 牛頓
force.Direction = (obj, ["Edge1"])
force.Reversed = False
analysis.addObject(force)

# 網格
mesh = ObjectsFem.makeMeshGmsh(doc, "FEMMesh")
mesh.Part = obj
mesh.CharacteristicLengthMax = 5.0
analysis.addObject(mesh)

doc.recompute()

# 執行求解器
from femtools import ccxtools
fea = ccxtools.FemToolsCcx(analysis, solver)
fea.update_objects()
fea.setup_working_dir()
fea.setup_ccx()
fea.write_inp_file()
fea.ccx_run()
fea.load_results()
```

## Path/CAM 指令碼 (Path/CAM Scripting)

```python
import Path
import FreeCAD

# 建立路徑
commands = []
commands.append(Path.Command("G0", {"X": 0, "Y": 0, "Z": 5}))   # 快速移動
commands.append(Path.Command("G1", {"X": 10, "Y": 0, "Z": 0, "F": 100}))  # 進給
commands.append(Path.Command("G1", {"X": 10, "Y": 10, "Z": 0}))
commands.append(Path.Command("G1", {"X": 0, "Y": 10, "Z": 0}))
commands.append(Path.Command("G1", {"X": 0, "Y": 0, "Z": 0}))
commands.append(Path.Command("G0", {"Z": 5}))   # 退刀

path = Path.Path(commands)

# 加入至文件
doc = FreeCAD.ActiveDocument
path_obj = doc.addObject("Path::Feature", "MyPath")
path_obj.Path = path

# G-code 輸出
gcode = path.toGCode()
print(gcode)
```

## 常見食譜 (Common Recipes)

### 鏡像形狀 (Mirror a Shape)

```python
import Part
import FreeCAD
shape = obj.Shape
mirrored = shape.mirror(FreeCAD.Vector(0,0,0), FreeCAD.Vector(1,0,0))  # 關於 YZ 平面鏡像
Part.show(mirrored, "Mirrored")
```

### 形狀陣列 (Array of Shapes)

```python
import Part
import FreeCAD

def linear_array(shape, direction, count, spacing):
    """建立線性陣列複合體。"""
    shapes = []
    for i in range(count):
        offset = FreeCAD.Vector(direction)
        offset.multiply(i * spacing)
        moved = shape.copy()
        moved.translate(offset)
        shapes.append(moved)
    return Part.Compound(shapes)

result = linear_array(obj.Shape, FreeCAD.Vector(1,0,0), 5, 15.0)
Part.show(result, "Array")
```

### 環形陣列 (Circular/Polar Array)

```python
import Part
import FreeCAD
import math

def polar_array(shape, axis, center, count):
    """建立環形陣列複合體。"""
    shapes = []
    angle = 360.0 / count
    for i in range(count):
        rot = FreeCAD.Rotation(axis, angle * i)
        placement = FreeCAD.Placement(FreeCAD.Vector(0,0,0), rot, center)
        moved = shape.copy()
        moved.Placement = placement
        shapes.append(moved)
    return Part.Compound(shapes)

result = polar_array(obj.Shape, FreeCAD.Vector(0,0,1), FreeCAD.Vector(0,0,0), 8)
Part.show(result, "PolarArray")
```

### 測量形狀間的距離 (Measure Distance Between Shapes)

```python
dist = shape1.distToShape(shape2)
# 回傳：(最小距離, [(shape1 上的點, shape2 上的點), ...], ...)
min_dist = dist[0]
closest_points = dist[1]  # (向量, 向量) 對清單
```

### 建立管線 (Tube/Pipe)

```python
import Part

outer_cyl = Part.makeCylinder(outer_radius, height)
inner_cyl = Part.makeCylinder(inner_radius, height)
tube = outer_cyl.cut(inner_cyl)
Part.show(tube, "Tube")
```

### 指定面顏色 (Assign Color to Faces)

```python
# 設定每個面的顏色
obj.ViewObject.DiffuseColor = [
    (1.0, 0.0, 0.0, 0.0),   # Face1 = 紅色
    (0.0, 1.0, 0.0, 0.0),   # Face2 = 綠色
    (0.0, 0.0, 1.0, 0.0),   # Face3 = 藍色
    # ... 每個面一個元組, (R, G, B, 透明度)
]

# 或設定整個物件的單一顏色
obj.ViewObject.ShapeColor = (0.8, 0.2, 0.2)
```

### 批次匯出所有物件 (Batch Export All Objects)

```python
import FreeCAD
import Part
import os

doc = FreeCAD.ActiveDocument
export_dir = "/path/to/export"

if doc is None:
    FreeCAD.Console.PrintMessage("沒有可匯出的活動文件。\n")
else:
    os.makedirs(export_dir, exist_ok=True)

    for obj in doc.Objects:
        if hasattr(obj, "Shape") and obj.Shape.Solids:
            filepath = os.path.join(export_dir, f"{obj.Name}.step")
            Part.export([obj], filepath)
            FreeCAD.Console.PrintMessage(f"已匯出 {filepath}\n")
```

### 計時器 / 進度條 (Timer / Progress Bar)

```python
from PySide2 import QtWidgets, QtCore

# 簡單進度對話方塊
progress = QtWidgets.QProgressDialog("處理中...", "取消", 0, total_steps)
progress.setWindowModality(QtCore.Qt.WindowModal)

for i in range(total_steps):
    if progress.wasCanceled():
        break
    # ... 執行工作 ...
    progress.setValue(i)

progress.setValue(total_steps)
```

### 程式化執行巨集 (Run a Macro Programmatically)

```python
import FreeCADGui
import runpy

# 執行巨集檔案
FreeCADGui.runCommand("Std_Macro")  # 開啟巨集對話方塊

# 僅執行受信任的巨集。建議使用明確路徑與更明確的執行器。
runpy.run_path("/path/to/macro.py", run_name="__main__")

# 或使用具有相同受信任、明確路徑的 FreeCAD 巨集執行器
FreeCADGui.doCommand('import runpy; runpy.run_path("/path/to/macro.py", run_name="__main__")')
```
