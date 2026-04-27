---
name: freecad-scripts
description: '撰寫 FreeCAD Python 指令碼、巨集與自動化的專家技能。在被要求建立 FreeCAD 模型、參數化物件、Part/Mesh/Sketcher 指令碼、工作台工具、使用 PySide 的 GUI 對話方塊、Coin3D 場景圖操作，或執行任何 FreeCAD Python API 任務時使用。涵蓋 FreeCAD 指令碼基礎、幾何建立、FeaturePython 物件、介面工具與巨集開發。'
---

# FreeCAD 指令碼 (FreeCAD Scripts)

為 FreeCAD CAD 應用程式產生生產品質 Python 指令碼的專家技能。能轉譯 3D 建模任務的速記、準程式碼 (quasi-code) 與自然語言描述，並將其轉譯為正確的 FreeCAD Python API 呼叫。

## 何時使用此技能

- 為 FreeCAD 內建主控台或巨集系統撰寫 Python 指令碼
- 建立或操作 3D 幾何圖形 (Part, Mesh, Sketcher, Path, FEM)
- 建立具有自訂屬性的參數化 FeaturePython 物件
- 在 FreeCAD 內使用 PySide/Qt 開發 GUI 工具
- 透過 Pivy 操作 Coin3D 場景圖
- 建立自訂工作台或 Gui 指令
- 使用巨集自動化重複的 CAD 操作
- 在網格 (mesh) 與實體 (solid) 表示之間轉換
- 進行 FEM 分析、光線追蹤 (raytracing) 或繪圖匯出的指令碼編寫

## 先決條件

- 已安裝 FreeCAD (建議 0.19+；最新 API 建議 0.21+/1.0+)
- Python 3.x (隨 FreeCAD 附帶)
- GUI 開發：PySide2 (隨 FreeCAD 附帶)
- 場景圖開發：Pivy (隨 FreeCAD 附帶)

## FreeCAD Python 環境

FreeCAD 嵌入了 Python 直譯器。指令碼在可使用這些關鍵模組的環境中執行：

```python
import FreeCAD          # 核心模組 (別名為 'App')
import FreeCADGui       # GUI 模組 (別名為 'Gui') — 僅在 GUI 模式下使用
import Part             # Part 工作台 — BRep/OpenCASCADE 形狀
import Mesh             # Mesh 工作台 — 三角化網格
import Sketcher         # Sketcher 工作台 — 2D 約束草圖
import Draft            # Draft 工作台 — 2D 繪圖工具
import Arch             # Arch/BIM 工作台
import Path             # Path/CAM 工作台
import FEM              # FEM 工作台
import TechDraw         # TechDraw 工作台 (取代 Drawing)
import BOPTools         # 布林運算
import CompoundTools    # 複合形狀公用程式
```

### FreeCAD 文件模型

```python
# 建立或存取文件
doc = FreeCAD.newDocument("MyDoc")
doc = FreeCAD.ActiveDocument

# 新增物件
box = doc.addObject("Part::Box", "MyBox")
box.Length = 10.0
box.Width = 10.0
box.Height = 10.0

# 重新計算
doc.recompute()

# 存取物件
obj = doc.getObject("MyBox")
obj = doc.MyBox  # 也支援屬性存取

# 移除物件
doc.removeObject("MyBox")
```

## 核心概念

### 向量與放置 (Vectors and Placements)

```python
import FreeCAD

# 向量 (Vectors)
v1 = FreeCAD.Vector(1, 0, 0)
v2 = FreeCAD.Vector(0, 1, 0)
v3 = v1.cross(v2)          # 叉積
d = v1.dot(v2)              # 點積
v4 = v1 + v2                # 加法
length = v1.Length           #  величину
v_norm = FreeCAD.Vector(v1)
v_norm.normalize()           # 原地標準化

# 旋轉 (Rotations)
rot = FreeCAD.Rotation(FreeCAD.Vector(0, 0, 1), 45)  # 軸, 角度(度)
rot = FreeCAD.Rotation(0, 0, 45)                       # 歐拉角 (偏航, 俯仰, 滾轉)

# 放置 (Placements) (位置 + 方向)
placement = FreeCAD.Placement(
    FreeCAD.Vector(10, 20, 0),    # 平移
    FreeCAD.Rotation(0, 0, 45),   # 旋轉
    FreeCAD.Vector(0, 0, 0)       # 旋轉中心
)
obj.Placement = placement

# 矩陣 (4x4 轉換矩陣)
import math
mat = FreeCAD.Matrix()
mat.move(FreeCAD.Vector(10, 0, 0))
mat.rotateZ(math.radians(45))
```

### 幾何圖形的建立與操作 (Part 模組)

Part 模組封裝了 OpenCASCADE 並提供 BRep 實體建模功能：

```python
import FreeCAD
import Part

# --- 基本形狀 ---
box = Part.makeBox(10, 10, 10)               # 長, 寬, 高
cyl = Part.makeCylinder(5, 20)               # 半徑, 高
sphere = Part.makeSphere(10)                  # 半徑
cone = Part.makeCone(5, 2, 10)               # r1, r2, 高
torus = Part.makeTorus(10, 2)                 # 大半徑, 小半徑

# --- 線條與邊 ---
edge1 = Part.makeLine((0, 0, 0), (10, 0, 0))
edge2 = Part.makeLine((10, 0, 0), (10, 10, 0))
edge3 = Part.makeLine((10, 10, 0), (0, 0, 0))
wire = Part.Wire([edge1, edge2, edge3])

# 圓形與圓弧
circle = Part.makeCircle(5)                   # 半徑
arc = Part.makeCircle(5, FreeCAD.Vector(0, 0, 0),
                       FreeCAD.Vector(0, 0, 1), 0, 180)  # 起始/結束角度

# --- 面 ---
face = Part.Face(wire)                        # 從封閉線建立

# --- 從面/線建立實體 ---
extrusion = face.extrude(FreeCAD.Vector(0, 0, 10))       # 拉伸
revolved = face.revolve(FreeCAD.Vector(0, 0, 0),
                         FreeCAD.Vector(0, 0, 1), 360)    # 旋轉

# --- 布林運算 ---
fused = box.fuse(cyl)           # 聯集
cut = box.cut(cyl)              # 減集
common = box.common(cyl)        # 交集
fused_clean = fused.removeSplitter()  # 清理接縫

# --- 圓角與倒角 ---
filleted = box.makeFillet(1.0, box.Edges)          # 半徑, 邊
chamfered = box.makeChamfer(1.0, box.Edges)        # 距離, 邊

# --- 放樣與掃掠 ---
loft = Part.makeLoft([wire1, wire2], True)          # 線, 實體
swept = Part.Wire([path_edge]).makePipeShell([profile_wire],
                                              True, False)  # 實體, frenet

# --- BSpline 曲線 ---
from FreeCAD import Vector
points = [Vector(0,0,0), Vector(1,2,0), Vector(3,1,0), Vector(4,3,0)]
bspline = Part.BSplineCurve()
bspline.interpolate(points)
edge = bspline.toShape()

# --- 顯示在文件中 ---
Part.show(box, "MyBox")    # 快速顯示 (加入到活動文件)
# 或明確地：
doc = FreeCAD.ActiveDocument or FreeCAD.newDocument()
obj = doc.addObject("Part::Feature", "MyShape")
obj.Shape = box
doc.recompute()
```

### 拓撲探索 (Topological Exploration)

```python
shape = obj.Shape

# 存取子元素
shape.Vertexes    # Vertex 物件清單
shape.Edges       # Edge 物件清單
shape.Wires       # Wire 物件清單
shape.Faces       # Face 物件清單
shape.Shells      # Shell 物件清單
shape.Solids      # Solid 物件清單

# 邊界框
bb = shape.BoundBox
print(bb.XMin, bb.XMax, bb.YMin, bb.YMax, bb.ZMin, bb.ZMax)
print(bb.Center)

# 屬性
shape.Volume
shape.Area
shape.Length       # 用於邊/線
face.Surface       # 底層幾何曲面
edge.Curve         # 底層幾何曲線

# 形狀型別
shape.ShapeType    # "Solid", "Shell", "Face", "Wire", "Edge", "Vertex", "Compound"
```

### 網格模組 (Mesh Module)

```python
import Mesh

# 從頂點與面建立網格
mesh = Mesh.Mesh()
mesh.addFacet(
    0.0, 0.0, 0.0,   # 頂點 1
    1.0, 0.0, 0.0,   # 頂點 2
    0.0, 1.0, 0.0    # 頂點 3
)

# 匯入/匯出
mesh = Mesh.Mesh("/path/to/file.stl")
mesh.write("/path/to/output.stl")

# 轉換 Part 形狀為 Mesh
import Part
import MeshPart
shape = Part.makeBox(1, 1, 1)
mesh = MeshPart.meshFromShape(Shape=shape, LinearDeflection=0.1,
                                AngularDeflection=0.5)

# 轉換 Mesh 為 Part 形狀
shape = Part.Shape()
shape.makeShapeFromMesh(mesh.Topology, 0.05)  # 容差
solid = Part.makeSolid(shape)
```

### 草繪器模組 (Sketcher Module)

```python
# 在 XY 平面上建立草圖
sketch = doc.addObject("Sketcher::SketchObject", "MySketch")
sketch.Placement = FreeCAD.Placement(
    FreeCAD.Vector(0, 0, 0),
    FreeCAD.Rotation(0, 0, 0, 1)
)

# 新增幾何圖形 (回傳幾何索引)
idx_line = sketch.addGeometry(Part.LineSegment(
    FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(10, 0, 0)))
idx_circle = sketch.addGeometry(Part.Circle(
    FreeCAD.Vector(5, 5, 0), FreeCAD.Vector(0, 0, 1), 3))

# 新增限制條件
sketch.addConstraint(Sketcher.Constraint("Coincident", 0, 2, 1, 1))
sketch.addConstraint(Sketcher.Constraint("Horizontal", 0))
sketch.addConstraint(Sketcher.Constraint("DistanceX", 0, 1, 0, 2, 10.0))
sketch.addConstraint(Sketcher.Constraint("Radius", 1, 3.0))
sketch.addConstraint(Sketcher.Constraint("Fixed", 0, 1))
# 限制型別：Coincident, Horizontal, Vertical, Parallel, Perpendicular,
#   Tangent, Equal, Symmetric, Distance, DistanceX, DistanceY, Radius, Angle,
#   Fixed (Block), InternalAlignment

doc.recompute()
```

### 草圖模組 (Draft Module)

```python
import Draft
import FreeCAD

# 2D 形狀
line = Draft.makeLine(FreeCAD.Vector(0,0,0), FreeCAD.Vector(10,0,0))
circle = Draft.makeCircle(5)
rect = Draft.makeRectangle(10, 5)
poly = Draft.makePolygon(6, radius=5)   # 六邊形

# 操作
moved = Draft.move(obj, FreeCAD.Vector(10, 0, 0), copy=True)
rotated = Draft.rotate(obj, 45, FreeCAD.Vector(0,0,0),
                        axis=FreeCAD.Vector(0,0,1), copy=True)
scaled = Draft.scale(obj, FreeCAD.Vector(2,2,2), center=FreeCAD.Vector(0,0,0),
                      copy=True)
offset = Draft.offset(obj, FreeCAD.Vector(1,0,0))
array = Draft.makeArray(obj, FreeCAD.Vector(15,0,0),
                         FreeCAD.Vector(0,15,0), 3, 3)
```

## 建立參數化物件 (FeaturePython)

FeaturePython 物件是自訂參數化物件，具有觸發重新計算的屬性：

```python
import FreeCAD
import Part

class MyBox:
    """自訂參數化方塊。"""

    def __init__(self, obj):
        obj.Proxy = self
        obj.addProperty("App::PropertyLength", "Length", "Dimensions",
                         "方塊長度").Length = 10.0
        obj.addProperty("App::PropertyLength", "Width", "Dimensions",
                         "方塊寬度").Width = 10.0
        obj.addProperty("App::PropertyLength", "Height", "Dimensions",
                         "方塊高度").Height = 10.0

    def execute(self, obj):
        """文件重新計算時呼叫。"""
        obj.Shape = Part.makeBox(obj.Length, obj.Width, obj.Height)

    def onChanged(self, obj, prop):
        """屬性變更時呼叫。"""
        pass

    def __getstate__(self):
        return None

    def __setstate__(self, state):
        return None


class ViewProviderMyBox:
    """自訂圖示與顯示設定的視圖提供者。"""

    def __init__(self, vobj):
        vobj.Proxy = self

    def getIcon(self):
        return ":/icons/Part_Box.svg"

    def attach(self, vobj):
        self.Object = vobj.Object

    def updateData(self, obj, prop):
        pass

    def onChanged(self, vobj, prop):
        pass

    def __getstate__(self):
        return None

    def __setstate__(self, state):
        return None


# --- 用法 ---
doc = FreeCAD.ActiveDocument or FreeCAD.newDocument("Test")
obj = doc.addObject("Part::FeaturePython", "CustomBox")
MyBox(obj)
ViewProviderMyBox(obj.ViewObject)
doc.recompute()
```

### 常見屬性類型

| 屬性類型 | Python 類型 | 說明 |
|---|---|---|
| `App::PropertyBool` | `bool` | 布林值 |
| `App::PropertyInteger` | `int` | 整數 |
| `App::PropertyFloat` | `float` | 浮點數 |
| `App::PropertyString` | `str` | 字串 |
| `App::PropertyLength` | `float` (單位) | 長度（含單位） |
| `App::PropertyAngle` | `float` (度) | 角度（度） |
| `App::PropertyVector` | `FreeCAD.Vector` | 3D 向量 |
| `App::PropertyPlacement` | `FreeCAD.Placement` | 位置與旋轉 |
| `App::PropertyLink` | 物件參考 | 連結到其他物件 |
| `App::PropertyLinkList` | 參考清單 | 連結多個物件 |
| `App::PropertyEnumeration` | `list`/`str` | 下拉選單/列舉 |
| `App::PropertyFile` | `str` | 檔案路徑 |
| `App::PropertyColor` | `tuple` | RGB 顏色（0.0-1.0） |
| `App::PropertyPythonObject` | any | 可序列化的 Python 物件 |

## 建立 GUI 工具

### GUI 指令

```python
import FreeCAD
import FreeCADGui

class MyCommand:
    """自訂工具列/選單指令。"""

    def GetResources(self):
        return {
            "Pixmap": ":/icons/Part_Box.svg",
            "MenuText": "My Custom Command",
            "ToolTip": "Creates a custom box",
            "Accel": "Ctrl+Shift+B"
        }

    def IsActive(self):
        return FreeCAD.ActiveDocument is not None

    def Activated(self):
        # Command logic here
        FreeCAD.Console.PrintMessage("Command activated\n")

FreeCADGui.addCommand("My_CustomCommand", MyCommand())
```

### PySide 對話方塊

```python
from PySide2 import QtWidgets, QtCore, QtGui

class MyDialog(QtWidgets.QDialog):
    def __init__(self, parent=None):
        super().__init__(parent or FreeCADGui.getMainWindow())
        self.setWindowTitle("My Tool")
        self.setMinimumWidth(300)

        layout = QtWidgets.QVBoxLayout(self)

        # Input fields
        self.label = QtWidgets.QLabel("Length:")
        self.spinbox = QtWidgets.QDoubleSpinBox()
        self.spinbox.setRange(0.1, 1000.0)
        self.spinbox.setValue(10.0)
        self.spinbox.setSuffix(" mm")

        form = QtWidgets.QFormLayout()
        form.addRow(self.label, self.spinbox)
        layout.addLayout(form)

        # Buttons
        btn_layout = QtWidgets.QHBoxLayout()
        self.btn_ok = QtWidgets.QPushButton("OK")
        self.btn_cancel = QtWidgets.QPushButton("Cancel")
        btn_layout.addWidget(self.btn_ok)
        btn_layout.addWidget(self.btn_cancel)
        layout.addLayout(btn_layout)

        self.btn_ok.clicked.connect(self.accept)
        self.btn_cancel.clicked.connect(self.reject)

# Usage
dialog = MyDialog()
if dialog.exec_() == QtWidgets.QDialog.Accepted:
    length = dialog.spinbox.value()
    FreeCAD.Console.PrintMessage(f"Length: {length}\n")
```

### 任務面板（建議用於 FreeCAD 整合）

```python
class MyTaskPanel:
    """顯示於左側側邊欄的任務面板。"""

    def __init__(self):
        self.form = QtWidgets.QWidget()
        layout = QtWidgets.QVBoxLayout(self.form)
        self.spinbox = QtWidgets.QDoubleSpinBox()
        self.spinbox.setValue(10.0)
        layout.addWidget(QtWidgets.QLabel("Length:"))
        layout.addWidget(self.spinbox)

    def accept(self):
        # Called when user clicks OK
        length = self.spinbox.value()
        FreeCAD.Console.PrintMessage(f"Accepted: {length}\n")
        FreeCADGui.Control.closeDialog()
        return True

    def reject(self):
        FreeCADGui.Control.closeDialog()
        return True

    def getStandardButtons(self):
        return int(QtWidgets.QDialogButtonBox.Ok |
                   QtWidgets.QDialogButtonBox.Cancel)

# Show the panel
panel = MyTaskPanel()
FreeCADGui.Control.showDialog(panel)
```

## Coin3D 場景圖（Pivy）

```python
from pivy import coin
import FreeCADGui

# Access the scenegraph root
sg = FreeCADGui.ActiveDocument.ActiveView.getSceneGraph()

# Add a custom separator with a sphere
sep = coin.SoSeparator()
mat = coin.SoMaterial()
mat.diffuseColor.setValue(1.0, 0.0, 0.0)  # Red
trans = coin.SoTranslation()
trans.translation.setValue(10, 10, 10)
sphere = coin.SoSphere()
sphere.radius.setValue(2.0)
sep.addChild(mat)
sep.addChild(trans)
sep.addChild(sphere)
sg.addChild(sep)

# Remove later
sg.removeChild(sep)
```

## 建立自訂工作台

```python
import FreeCADGui

class MyWorkbench(FreeCADGui.Workbench):
    MenuText = "My Workbench"
    ToolTip = "A custom workbench"
    Icon = ":/icons/freecad.svg"

    def Initialize(self):
        """Called at workbench activation."""
        import MyCommands  # Import your command module
        self.appendToolbar("My Tools", ["My_CustomCommand"])
        self.appendMenu("My Menu", ["My_CustomCommand"])

    def Activated(self):
        pass

    def Deactivated(self):
        pass

    def GetClassName(self):
        return "Gui::PythonWorkbench"

FreeCADGui.addWorkbench(MyWorkbench)
```

## 巨集最佳實務

```python
# Standard macro header
# -*- coding: utf-8 -*-
# FreeCAD Macro: MyMacro
# Description: Brief description of what the macro does
# Author: YourName
# Version: 1.0
# Date: 2026-04-07

import FreeCAD
import Part
from FreeCAD import Base

# Guard for GUI availability
if FreeCAD.GuiUp:
    import FreeCADGui
    from PySide2 import QtWidgets, QtCore

def main():
    doc = FreeCAD.ActiveDocument
    if doc is None:
        FreeCAD.Console.PrintError("No active document\n")
        return

    if FreeCAD.GuiUp:
        sel = FreeCADGui.Selection.getSelection()
        if not sel:
            FreeCAD.Console.PrintWarning("No objects selected\n")

    # ... macro logic ...

    doc.recompute()
    FreeCAD.Console.PrintMessage("Macro completed\n")

if __name__ == "__main__":
    main()
```

### 選取處理

```python
# Get selected objects
sel = FreeCADGui.Selection.getSelection()           # List of objects
sel_ex = FreeCADGui.Selection.getSelectionEx()       # Extended (sub-elements)

for selobj in sel_ex:
    obj = selobj.Object
    for sub in selobj.SubElementNames:
        print(f"{obj.Name}.{sub}")
        shape = obj.getSubObject(sub)  # Get sub-shape

# Select programmatically
FreeCADGui.Selection.addSelection(doc.MyBox)
FreeCADGui.Selection.addSelection(doc.MyBox, "Face1")
FreeCADGui.Selection.clearSelection()
```

### 主控台輸出

```python
FreeCAD.Console.PrintMessage("Info message\n")
FreeCAD.Console.PrintWarning("Warning message\n")
FreeCAD.Console.PrintError("Error message\n")
FreeCAD.Console.PrintLog("Debug/log message\n")
```

## 常見模式

### 由草圖建立參數化 Pad (拉伸)

```python
doc = FreeCAD.ActiveDocument

# Create sketch
sketch = doc.addObject("Sketcher::SketchObject", "Sketch")
sketch.addGeometry(Part.LineSegment(FreeCAD.Vector(0,0,0), FreeCAD.Vector(10,0,0)))
sketch.addGeometry(Part.LineSegment(FreeCAD.Vector(10,0,0), FreeCAD.Vector(10,10,0)))
sketch.addGeometry(Part.LineSegment(FreeCAD.Vector(10,10,0), FreeCAD.Vector(0,10,0)))
sketch.addGeometry(Part.LineSegment(FreeCAD.Vector(0,10,0), FreeCAD.Vector(0,0,0)))
# Close with coincident constraints
for i in range(3):
    sketch.addConstraint(Sketcher.Constraint("Coincident", i, 2, i+1, 1))
sketch.addConstraint(Sketcher.Constraint("Coincident", 3, 2, 0, 1))

# Pad (PartDesign)
pad = doc.addObject("PartDesign::Pad", "Pad")
pad.Profile = sketch
pad.Length = 5.0
sketch.Visibility = False
doc.recompute()
```

### 匯出形狀

```python
# STEP 匯出
Part.export([doc.MyBox], "/path/to/output.step")

# STL 匯出（網格）
import Mesh
Mesh.export([doc.MyBox], "/path/to/output.stl")

# IGES 匯出
Part.export([doc.MyBox], "/path/to/output.iges")

# 使用 importlib 匯出多種格式
import importlib
importlib.import_module("importOBJ").export([doc.MyBox], "/path/to/output.obj")
```

### 單位與量

```python
# FreeCAD 在內部使用 mm
q = FreeCAD.Units.Quantity("10 mm")
q_inch = FreeCAD.Units.Quantity("1 in")
print(q_inch.getValueAs("mm"))  # 25.4

# 解析帶單位的使用者輸入
q = FreeCAD.Units.parseQuantity("2.5 in")
value_mm = float(q)  # 以 mm 為內部單位的數值
```

## 補償規則 (Quasi-Coder 整合)

在轉譯 FreeCAD 指令碼的簡寫或準程式碼時：

1. **術語對映**：「box」→ `Part.makeBox()`，「cylinder」→ `Part.makeCylinder()`，「sphere」→ `Part.makeSphere()`，「merge/combine/join」→ `.fuse()`，「subtract/cut/remove」→ `.cut()`，「intersect」→ `.common()`，「round edges/fillet」→ `.makeFillet()`，「bevel/chamfer」→ `.makeChamfer()`
2. **隱含文件**：如果未提及文件處理，請包裹在標準 `doc = FreeCAD.ActiveDocument or FreeCAD.newDocument()` 中
3. **單位假設**：除非另有說明，否則預設為毫米
4. **重新計算**：修改後務必呼叫 `doc.recompute()`
5. **GUI 防護**：當指令碼可能在無頭模式 (headless) 下執行時，請將 GUI 相關程式碼包裹在 `if FreeCAD.GuiUp:` 中
6. **Part.show()**：使用 `Part.show(shape, "Name")` 進行快速顯示，或使用 `doc.addObject("Part::Feature", "Name")` 來建立命名後的持久物件

## 參考

### 主要連結

- [Python 程式碼編寫](https://wiki.freecad.org/Manual:A_gentle_introduction#Writing_Python_code)
- [操作 FreeCAD 物件](https://wiki.freecad.org/Manual:A_gentle_introduction#Manipulating_FreeCAD_objects)
- [向量與放置](https://wiki.freecad.org/Manual:A_gentle_introduction#Vectors_and_Placements)
- [建立與操作幾何圖形](https://wiki.freecad.org/Manual:Creating_and_manipulating_geometry)
- [建立參數化物件](https://wiki.freecad.org/Manual:Creating_parametric_objects)
- [建立介面工具](https://wiki.freecad.org/Manual:Creating_interface_tools)
- [Python](https://en.wikipedia.org/wiki/Python_%28programming_language%29)
- [Python 介紹](https://wiki.freecad.org/Introduction_to_Python)
- [Python 指令碼教學](https://wiki.freecad.org/Python_scripting_tutorial)
- [FreeCAD 指令碼基礎](https://wiki.freecad.org/FreeCAD_Scripting_Basics)
- [Gui 指令](https://wiki.freecad.org/Gui_Command)

### 隨附參考文件

請參閱 [references/](references/) 目錄以取得主題分類指南：

1. [scripting-fundamentals.md](references/scripting-fundamentals.md) — 核心指令碼、文件模型、控制台
2. [geometry-and-shapes.md](references/geometry-and-shapes.md) — Part, Mesh, Sketcher, 拓撲
3. [parametric-objects.md](references/parametric-objects.md) — FeaturePython, 屬性, 指令碼物件
4. [gui-and-interface.md](references/gui-and-interface.md) — PySide, 對話方塊, 任務面板, Coin3D
5. [workbenches-and-advanced.md](references/workbenches-and-advanced.md) — 工作台, 巨集, FEM, Path, 食譜
