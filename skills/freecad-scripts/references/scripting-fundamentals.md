# FreeCAD 指令碼基礎 (FreeCAD Scripting Fundamentals)

FreeCAD Python 指令碼基礎參考指南：文件模型、控制台、物件、選取與 Python 環境。

## 官方 Wiki 參考

- [A gentle introduction (淺顯易懂的介紹)](https://wiki.freecad.org/Manual:A_gentle_introduction)
- [Python 介紹](https://wiki.freecad.org/Introduction_to_Python)
- [Python 指令碼教學](https://wiki.freecad.org/Python_scripting_tutorial)
- [FreeCAD 指令碼基礎](https://wiki.freecad.org/FreeCAD_Scripting_Basics)
- [指令碼與巨集](https://wiki.freecad.org/Scripting_and_macros)
- [使用巨集](https://wiki.freecad.org/Macros)
- [程式碼片段](https://wiki.freecad.org/Code_snippets)
- [偵錯 (Debugging)](https://wiki.freecad.org/Debugging)
- [效能分析 (Profiling)](https://wiki.freecad.org/Profiling)
- [Python 開發環境](https://wiki.freecad.org/Python_Development_Environment)
- [額外的 Python 模組](https://wiki.freecad.org/Extra_python_modules)
- [FreeCAD 向量數學函式庫](https://wiki.freecad.org/FreeCAD_vector_math_library)
- [嵌入 FreeCAD](https://wiki.freecad.org/Embedding_FreeCAD)
- [嵌入 FreeCADGui](https://wiki.freecad.org/Embedding_FreeCADGui)
- [啟動時執行巨集](https://wiki.freecad.org/Macro_at_Startup)
- [如何安裝巨集](https://wiki.freecad.org/How_to_install_macros)
- [IPython 筆記本整合](https://wiki.freecad.org/IPython_notebook_integration)
- [單位與數量 (Quantity)](https://wiki.freecad.org/Quantity)

## FreeCAD 模組階層

```
FreeCAD (App)          — 核心應用程式、文件、物件、屬性
├── FreeCAD.Vector     — 3D 向量
├── FreeCAD.Rotation   — 四元數旋轉 (Quaternion rotation)
├── FreeCAD.Placement  — 位置 + 旋轉
├── FreeCAD.Matrix     — 4x4 轉換矩陣
├── FreeCAD.Units      — 單位轉換與數量
├── FreeCAD.Console    — 訊息輸出
└── FreeCAD.Base       — 基礎型別

FreeCADGui (Gui)       — GUI 模組 (僅當 GUI 啟用時)
├── Selection          — 選取管理
├── Control            — 任務面板管理
├── ActiveDocument     — GUI 文件包裝器
└── getMainWindow()    — Qt 主視窗
```

## 文件操作 (Document Operations)

```python
import FreeCAD

# 文件生命週期
doc = FreeCAD.newDocument("DocName")
doc = FreeCAD.openDocument("/path/to/file.FCStd")
doc = FreeCAD.ActiveDocument
FreeCAD.setActiveDocument("DocName")
doc.save()
doc.saveAs("/path/to/newfile.FCStd")
FreeCAD.closeDocument("DocName")

# 物件管理
obj = doc.addObject("Part::Feature", "ObjectName")
obj = doc.addObject("Part::FeaturePython", "CustomObj")
obj = doc.addObject("App::DocumentObjectGroup", "Group")
doc.removeObject("ObjectName")

# 物件存取
obj = doc.getObject("ObjectName")
obj = doc.ObjectName                # 屬性語法
all_objs = doc.Objects              # 文件中的所有物件
names = doc.findObjects("Part::Feature")  # 依型別查找

# 重新計算
doc.recompute()                     # 重新計算全部
doc.recompute([obj1, obj2])         # 重新計算特定物件
obj.touch()                         # 標記為需要重新計算
```

## 選取 API (Selection API)

```python
import FreeCADGui

# 取得選取項目
sel = FreeCADGui.Selection.getSelection()          # [obj, ...]
sel = FreeCADGui.Selection.getSelection("DocName") # 來自特定文件
sel_ex = FreeCADGui.Selection.getSelectionEx()      # 詳細資訊

# 選取詳細資訊
for s in sel_ex:
    print(s.Object.Name)           # 父物件
    print(s.SubElementNames)       # ("Face1", "Edge3", ...)
    print(s.SubObjects)            # 實際子形狀
    for pt in s.PickedPoints:
        print(pt)                  # 3D 選取點

# 設定選取項目
FreeCADGui.Selection.addSelection(obj)
FreeCADGui.Selection.addSelection(obj, "Face1")
FreeCADGui.Selection.removeSelection(obj)
FreeCADGui.Selection.clearSelection()

# 選取觀察器 (Selection observer)
class MySelectionObserver:
    def addSelection(self, doc, obj, sub, pos):
        print(f"Selected: {obj}.{sub} at {pos}")
    def removeSelection(self, doc, obj, sub):
        print(f"Deselected: {obj}.{sub}")
    def setSelection(self, doc):
        print(f"Selection set changed in {doc}")
    def clearSelection(self, doc):
        print(f"Selection cleared in {doc}")

obs = MySelectionObserver()
FreeCADGui.Selection.addObserver(obs)
# 之後： FreeCADGui.Selection.removeObserver(obs)
```

## 控制台與記錄 (Console and Logging)

```python
FreeCAD.Console.PrintMessage("一般訊息\n")   # 藍色/預設
FreeCAD.Console.PrintWarning("警告\n")           # 橘色
FreeCAD.Console.PrintError("錯誤\n")               # 紅色
FreeCAD.Console.PrintLog("除錯/記錄訊息\n")            # 僅記錄

# 控制台訊息觀察器
class MyLogger:
    def __init__(self):
        FreeCAD.Console.PrintMessage("記錄器已啟動\n")
    def receive(self, msg):
        # 處理 msg
        pass
```

## 單位與數量 (Units and Quantities)

```python
from FreeCAD import Units

# 建立數量
q = Units.Quantity("10 mm")
q = Units.Quantity("1 in")
q = Units.Quantity(25.4, Units.Unit("mm"))
q = Units.parseQuantity("3.14 rad")

# 轉換
value_mm = float(q)                    # 內部單位 (長度為 mm)
value_in = q.getValueAs("in")          # 轉換為其他單位
value_m = q.getValueAs("m")

# 可用的單位方案：mm/kg/s (FreeCAD 預設), SI, Imperial 等
# 常見單位：mm, m, in, ft, deg, rad, kg, g, lb, s, min, hr
```

## 屬性系統 (Property System)

```python
# 新增屬性至任何 DocumentObject
obj.addProperty("App::PropertyFloat", "MyProp", "GroupName", "工具提示")
obj.MyProp = 42.0

# 檢查屬性是否存在
if hasattr(obj, "MyProp"):
    print(obj.MyProp)

# 屬性中繼資料
obj.getPropertyByName("MyProp")
obj.getTypeOfProperty("MyProp")        # 回傳清單：["App::PropertyFloat"]
obj.getDocumentationOfProperty("MyProp")
obj.getGroupOfProperty("MyProp")

# 設定屬性狀態為唯讀、隱藏等
obj.setPropertyStatus("MyProp", "ReadOnly")
obj.setPropertyStatus("MyProp", "Hidden")
obj.setPropertyStatus("MyProp", "-ReadOnly")   # 移除狀態
# 狀態：ReadOnly, Hidden, Transient, Output, NoRecompute
```
