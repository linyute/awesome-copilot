# FreeCAD 參數化物件 (FreeCAD Parametric Objects)

用於建立 FeaturePython 物件、指令碼物件 (scripted objects)、屬性、視圖提供者 (view providers) 以及序列化的參考指南。

## 官方 Wiki 參考

- [建立參數化物件](https://wiki.freecad.org/Manual:Creating_parametric_objects)
- [建立 FeaturePython 物件 (第 I 部分)](https://wiki.freecad.org/Create_a_FeaturePython_object_part_I)
- [建立 FeaturePython 物件 (第 II 部分)](https://wiki.freecad.org/Create_a_FeaturePython_object_part_II)
- [指令碼物件](https://wiki.freecad.org/Scripted_objects)
- [儲存指令碼物件的屬性](https://wiki.freecad.org/Scripted_objects_saving_attributes)
- [指令碼物件遷移](https://wiki.freecad.org/Scripted_objects_migration)
- [具有附件功能的指令碼物件](https://wiki.freecad.org/Scripted_objects_with_attachment)
- [視圖提供者 (Viewprovider)](https://wiki.freecad.org/Viewprovider)
- [樹狀檢視中的自訂圖示](https://wiki.freecad.org/Custom_icon_in_tree_view)
- [屬性 (Properties)](https://wiki.freecad.org/Property)
- [PropertyLink：InList 與 OutList](https://wiki.freecad.org/PropertyLink:_InList_and_OutList)
- [FeaturePython 方法](https://wiki.freecad.org/FeaturePython_methods)

## FeaturePython 物件 — 完整範本

```python
import FreeCAD
import Part

class MyParametricObject:
    """自訂參數化物件的 Proxy 類別。"""

    def __init__(self, obj):
        """初始化並新增屬性。"""
        obj.Proxy = self
        self.Type = "MyParametricObject"

        # 新增自訂屬性
        obj.addProperty("App::PropertyLength", "Length", "Dimensions",
                         "物件長度").Length = 10.0
        obj.addProperty("App::PropertyLength", "Width", "Dimensions",
                         "物件寬度").Width = 10.0
        obj.addProperty("App::PropertyLength", "Height", "Dimensions",
                         "物件高度").Height = 5.0
        obj.addProperty("App::PropertyBool", "Chamfered", "Options",
                         "套用邊緣倒角").Chamfered = False
        obj.addProperty("App::PropertyLength", "ChamferSize", "Options",
                         "倒角尺寸").ChamferSize = 1.0

    def execute(self, obj):
        """文件重新計算時呼叫。在此建構形狀。"""
        shape = Part.makeBox(obj.Length, obj.Width, obj.Height)
        if obj.Chamfered and obj.ChamferSize > 0:
            shape = shape.makeChamfer(obj.ChamferSize, shape.Edges)
        obj.Shape = shape

    def onChanged(self, obj, prop):
        """任何屬性變更時呼叫。"""
        if prop == "Chamfered":
            # 根據 Chamfered 切換顯示/隱藏 ChamferSize
            if obj.Chamfered:
                obj.setPropertyStatus("ChamferSize", "-Hidden")
            else:
                obj.setPropertyStatus("ChamferSize", "Hidden")

    def onDocumentRestored(self, obj):
        """載入文件時呼叫。若有需要請重新初始化。"""
        self.Type = "MyParametricObject"

    def __getstate__(self):
        """序列化 Proxy (用於儲存 .FCStd)。"""
        return {"Type": self.Type}

    def __setstate__(self, state):
        """還原序列化 Proxy (用於載入 .FCStd)。"""
        if state:
            self.Type = state.get("Type", "MyParametricObject")
```

## 視圖提供者 (ViewProvider) — 完整範本

```python
import FreeCADGui
from pivy import coin

class ViewProviderMyObject:
    """控制物件在 3D 檢視與樹狀結構中的顯示方式。"""

    def __init__(self, vobj):
        vobj.Proxy = self
        # 若有需要請新增檢視屬性
        # vobj.addProperty("App::PropertyColor", "Color", "Display", "物件顏色")

    def attach(self, vobj):
        """將視圖提供者附加至視圖物件時呼叫。"""
        self.Object = vobj.Object
        self.standard = coin.SoGroup()
        vobj.addDisplayMode(self.standard, "Standard")

    def getDisplayModes(self, vobj):
        """回傳可用的顯示模式。"""
        return ["Standard"]

    def getDefaultDisplayMode(self):
        """回傳預設顯示模式。"""
        return "Standard"

    def setDisplayMode(self, mode):
        return mode

    def getIcon(self):
        """回傳樹狀檢視的圖示路徑。"""
        return ":/icons/Part_Box.svg"
        # 或回傳 XPM 字串，或 .svg/.png 檔案路徑

    def updateData(self, obj, prop):
        """模型物件的資料變更時呼叫。"""
        pass

    def onChanged(self, vobj, prop):
        """檢視屬性變更時呼叫。"""
        pass

    def doubleClicked(self, vobj):
        """在樹狀結構中按兩下時呼叫。"""
        # 例如，開啟任務面板
        return True

    def setupContextMenu(self, vobj, menu):
        """新增項目至右鍵內容選單。"""
        action = menu.addAction("My Action")
        action.triggered.connect(lambda: self._myAction(vobj))

    def _myAction(self, vobj):
        FreeCAD.Console.PrintMessage("內容選單動作已觸發\n")

    def claimChildren(self):
        """回傳顯示在樹狀階層中的子物件清單。"""
        # 若具有 BaseFeature，可回傳 [self.Object.BaseFeature]
        return []

    def __getstate__(self):
        return None

    def __setstate__(self, state):
        return None
```

## 建立物件

```python
def makeMyObject(name="MyObject"):
    """建立參數化物件的工廠函式。"""
    doc = FreeCAD.ActiveDocument
    if doc is None:
        doc = FreeCAD.newDocument()

    obj = doc.addObject("Part::FeaturePython", name)
    MyParametricObject(obj)

    if FreeCAD.GuiUp:
        ViewProviderMyObject(obj.ViewObject)

    doc.recompute()
    return obj

# 用法
obj = makeMyObject("ChamferedBlock")
obj.Length = 20.0
obj.Chamfered = True
FreeCAD.ActiveDocument.recompute()
```

## 完整屬性型別參考

### 數值屬性

| 型別 | Python | 備註 |
|---|---|---|
| `App::PropertyInteger` | `int` | 標準整數 |
| `App::PropertyFloat` | `float` | 標準浮點數 |
| `App::PropertyLength` | `float` | 具單位長度 (mm) |
| `App::PropertyDistance` | `float` | 距離 (可為負數) |
| `App::PropertyAngle` | `float` | 角度 (度) |
| `App::PropertyArea` | `float` | 具單位面積 |
| `App::PropertyVolume` | `float` | 具單位體積 |
| `App::PropertySpeed` | `float` | 具單位速度 |
| `App::PropertyAcceleration` | `float` | 加速度 |
| `App::PropertyForce` | `float` | 力 |
| `App::PropertyPressure` | `float` | 壓力 |
| `App::PropertyPercent` | `int` | 0-100 整數 |
| `App::PropertyQuantity` | `Quantity` | 通用具單位數值 |
| `App::PropertyIntegerConstraint` | `(val,min,max,step)` | 有界整數 |
| `App::PropertyFloatConstraint` | `(val,min,max,step)` | 有界浮點數 |

### 字串/路徑屬性

| 型別 | Python | 備註 |
|---|---|---|
| `App::PropertyString` | `str` | 文字字串 |
| `App::PropertyFont` | `str` | 字型名稱 |
| `App::PropertyFile` | `str` | 檔案路徑 |
| `App::PropertyFileIncluded` | `str` | 嵌入檔案 |
| `App::PropertyPath` | `str` | 目錄路徑 |

### 布林與枚舉

| 型別 | Python | 備註 |
|---|---|---|
| `App::PropertyBool` | `bool` | 真/假 |
| `App::PropertyEnumeration` | `list`/`str` | 下拉式選單；先設定清單再設定值 |

```python
# 枚舉使用方式
obj.addProperty("App::PropertyEnumeration", "Style", "Options", "樣式選擇")
obj.Style = ["Solid", "Wireframe", "Points"]  # 先設定選項
obj.Style = "Solid"                              # 再設定數值
```

### 幾何屬性

| 型別 | Python | 備註 |
|---|---|---|
| `App::PropertyVector` | `FreeCAD.Vector` | 3D 向量 |
| `App::PropertyVectorList` | `[Vector,...]` | 向量清單 |
| `App::PropertyPlacement` | `Placement` | 位置 + 旋轉 |
| `App::PropertyMatrix` | `Matrix` | 4x4 矩陣 |
| `App::PropertyVectorDistance` | `Vector` | 具單位向量 |
| `App::PropertyPosition` | `Vector` | 具單位位置 |
| `App::PropertyDirection` | `Vector` | 方向向量 |

### 連結屬性

| 型別 | Python | 備註 |
|---|---|---|
| `App::PropertyLink` | obj ref | 連結至一個物件 |
| `App::PropertyLinkList` | `[obj,...]` | 連結至多個物件 |
| `App::PropertyLinkSub` | `(obj, [subs])` | 具子元素的連結 |
| `App::PropertyLinkSubList` | `[(obj,[subs]),...]` | 多個連結與子元素 |
| `App::PropertyLinkChild` | obj ref | 宣告的子連結 |
| `App::PropertyLinkListChild` | `[obj,...]` | 多個宣告的子連結 |

### 形狀與材質

| 型別 | Python | 備註 |
|---|---|---|
| `Part::PropertyPartShape` | `Part.Shape` | 完整形狀 |
| `App::PropertyColor` | `(r,g,b)` | 顏色 (0.0-1.0) |
| `App::PropertyColorList` | `[(r,g,b),...]` | 每個元素的顏色 |
| `App::PropertyMaterial` | `Material` | 材質定義 |

### 容器屬性

| 型別 | Python | 備註 |
|---|---|---|
| `App::PropertyPythonObject` | any | 可序列化 Python 物件 |
| `App::PropertyIntegerList` | `[int,...]` | 整數清單 |
| `App::PropertyFloatList` | `[float,...]` | 浮點數清單 |
| `App::PropertyStringList` | `[str,...]` | 字串清單 |
| `App::PropertyBoolList` | `[bool,...]` | 布林清單 |
| `App::PropertyMap` | `{str:str}` | 字串字典 |

## 物件相依性追蹤

```python
# InList：參照此物件的物件
obj.InList          # [參照 obj 的物件]
obj.InListRecursive # 所有祖先

# OutList：此物件參照的物件
obj.OutList         # [obj 參照的物件]
obj.OutListRecursive # 所有後代
```

## 版本間遷移

```python
class MyParametricObject:
    # ... 現有程式碼 ...

    def onDocumentRestored(self, obj):
        """文件載入時處理版本遷移。"""
        # 新增舊版本不存在的屬性
        if not hasattr(obj, "NewProp"):
            obj.addProperty("App::PropertyFloat", "NewProp", "Group", "Tip")
            obj.NewProp = default_value

        # 重新命名屬性 (複製值，移除舊值)
        if hasattr(obj, "OldPropName"):
            if not hasattr(obj, "NewPropName"):
                obj.addProperty("App::PropertyFloat", "NewPropName", "Group", "Tip")
                obj.NewPropName = obj.OldPropName
            obj.removeProperty("OldPropName")
```

## 附件支援

```python
import Part

class MyAttachableObject:
    def __init__(self, obj):
        obj.Proxy = self
        obj.addExtension("Part::AttachExtensionPython")

    def execute(self, obj):
        # 附件會自動設定 Placement
        if not obj.MapPathParameter:
            obj.positionBySupport()
        # 在原點建立您的形狀；Placement 負責定位
        obj.Shape = Part.makeBox(10, 10, 10)
```
