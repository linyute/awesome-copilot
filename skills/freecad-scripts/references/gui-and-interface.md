# FreeCAD GUI 與介面 (FreeCAD GUI and Interface)

用於建構 FreeCAD 使用者介面的參考指南：PySide/Qt 對話方塊、任務面板、Gui 指令，以及透過 Pivy 進行的 Coin3D 場景圖操作。

## 官方 Wiki 參考

- [建立介面工具](https://wiki.freecad.org/Manual:Creating_interface_tools)
- [Gui 指令](https://wiki.freecad.org/Gui_Command)
- [定義一個指令](https://wiki.freecad.org/Command)
- [PySide](https://wiki.freecad.org/PySide)
- [PySide 初學者範例](https://wiki.freecad.org/PySide_Beginner_Examples)
- [PySide 中階範例](https://wiki.freecad.org/PySide_Intermediate_Examples)
- [PySide 進階範例](https://wiki.freecad.org/PySide_Advanced_Examples)
- [PySide 使用片段](https://wiki.freecad.org/PySide_usage_snippets)
- [介面建立](https://wiki.freecad.org/Interface_creation)
- [對話方塊建立](https://wiki.freecad.org/Dialog_creation)
- [使用各種小工具建立對話方塊](https://wiki.freecad.org/Dialog_creation_with_various_widgets)
- [建立對話方塊以讀取與寫入檔案](https://wiki.freecad.org/Dialog_creation_reading_and_writing_files)
- [建立對話方塊以設定顏色](https://wiki.freecad.org/Dialog_creation_setting_colors)
- [建立對話方塊以顯示影像與動態 GIF](https://wiki.freecad.org/Dialog_creation_image_and_animated_GIF)
- [Qt 範例](https://wiki.freecad.org/Qt_Example)
- [3D 檢視](https://wiki.freecad.org/3D_view)
- [Coin 場景圖](https://wiki.freecad.org/Scenegraph)
- [Pivy](https://wiki.freecad.org/Pivy)

## Gui 指令 (Gui Command)

在 FreeCAD 中新增工具列按鈕與選單項目的標準方式：

```python
import FreeCAD
import FreeCADGui

class MyCommand:
    """一個已註冊的 FreeCAD 指令。"""

    def GetResources(self):
        return {
            "Pixmap": ":/icons/Part_Box.svg",    # 圖示 (內建或自訂路徑)
            "MenuText": "My Command",
            "ToolTip": "執行有用的動作",
            "Accel": "Ctrl+Shift+M",             # 鍵盤快速鍵
            "CmdType": "ForEdit"                  # 選用：ForEdit, Alter 等
        }

    def IsActive(self):
        """若指令應啟用則回傳 True。"""
        return FreeCAD.ActiveDocument is not None

    def Activated(self):
        """指令觸發時呼叫。"""
        FreeCAD.Console.PrintMessage("指令已啟用！\n")
        # 開啟任務面板：
        panel = MyTaskPanel()
        FreeCADGui.Control.showDialog(panel)

# 註冊指令 (名稱必須唯一)
FreeCADGui.addCommand("My_Command", MyCommand())
```

## 任務面板 (側邊欄整合)

任務面板會出現在 FreeCAD 的左側邊欄 — 這是建構互動式工具的首選方式：

```python
import FreeCAD
import FreeCADGui
from PySide2 import QtWidgets, QtCore

class MyTaskPanel:
    """側邊欄任務面板。"""

    def __init__(self):
        # 建構小工具
        self.form = QtWidgets.QWidget()
        self.form.setWindowTitle("我的工具")
        layout = QtWidgets.QVBoxLayout(self.form)

        # 輸入小工具
        self.length_spin = QtWidgets.QDoubleSpinBox()
        self.length_spin.setRange(0.1, 10000.0)
        self.length_spin.setValue(10.0)
        self.length_spin.setSuffix(" mm")
        self.length_spin.setDecimals(2)

        self.width_spin = QtWidgets.QDoubleSpinBox()
        self.width_spin.setRange(0.1, 10000.0)
        self.width_spin.setValue(10.0)
        self.width_spin.setSuffix(" mm")

        self.height_spin = QtWidgets.QDoubleSpinBox()
        self.height_spin.setRange(0.1, 10000.0)
        self.height_spin.setValue(5.0)
        self.height_spin.setSuffix(" mm")

        self.fillet_check = QtWidgets.QCheckBox("套用圓角 (Apply fillet)")

        # 表單佈局
        form_layout = QtWidgets.QFormLayout()
        form_layout.addRow("長度 (Length):", self.length_spin)
        form_layout.addRow("寬度 (Width):", self.width_spin)
        form_layout.addRow("高度 (Height):", self.height_spin)
        form_layout.addRow(self.fillet_check)
        layout.addLayout(form_layout)

        # 值變更時進行即時預覽
        self.length_spin.valueChanged.connect(self._preview)
        self.width_spin.valueChanged.connect(self._preview)
        self.height_spin.valueChanged.connect(self._preview)

    def _preview(self):
        """更新 3D 檢視中的預覽。"""
        pass  # 建構並顯示臨時形狀

    def accept(self):
        """使用者按一下 OK 時呼叫。"""
        import Part
        doc = FreeCAD.ActiveDocument
        shape = Part.makeBox(
            self.length_spin.value(),
            self.width_spin.value(),
            self.height_spin.value()
        )
        Part.show(shape, "MyBox")
        doc.recompute()
        FreeCADGui.Control.closeDialog()
        return True

    def reject(self):
        """使用者按一下 Cancel 時呼叫。"""
        FreeCADGui.Control.closeDialog()
        return True

    def getStandardButtons(self):
        """要顯示的按鈕。"""
        return int(QtWidgets.QDialogButtonBox.Ok |
                   QtWidgets.QDialogButtonBox.Cancel)

    def isAllowedAlterSelection(self):
        return True

    def isAllowedAlterView(self):
        return True

    def isAllowedAlterDocument(self):
        return True

# 顯示：
# FreeCADGui.Control.showDialog(MyTaskPanel())
```

### 具有多個小工具的任務面板 (Multi-Form)

```python
class MultiFormPanel:
    def __init__(self):
        self.form = [self._buildPage1(), self._buildPage2()]

    def _buildPage1(self):
        w = QtWidgets.QWidget()
        w.setWindowTitle("頁面 1")
        # ... 加入小工具 ...
        return w

    def _buildPage2(self):
        w = QtWidgets.QWidget()
        w.setWindowTitle("頁面 2")
        # ... 加入小工具 ...
        return w
```

## 獨立 PySide 對話方塊 (Standalone PySide Dialogs)

```python
import FreeCAD
import FreeCADGui
from PySide2 import QtWidgets, QtCore, QtGui

class MyDialog(QtWidgets.QDialog):
    def __init__(self, parent=None):
        super().__init__(parent or (FreeCADGui.getMainWindow() if FreeCAD.GuiUp else None))
        self.setWindowTitle("我的對話方塊")
        self.setWindowFlags(self.windowFlags() | QtCore.Qt.WindowStaysOnTopHint)

        layout = QtWidgets.QVBoxLayout(self)

        # 組合方塊
        self.combo = QtWidgets.QComboBox()
        self.combo.addItems(["選項 A", "選項 B", "選項 C"])
        layout.addWidget(self.combo)

        # 滑桿
        self.slider = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        self.slider.setRange(1, 100)
        self.slider.setValue(50)
        layout.addWidget(self.slider)

        # 文字輸入
        self.line_edit = QtWidgets.QLineEdit()
        self.line_edit.setPlaceholderText("輸入名稱...")
        layout.addWidget(self.line_edit)

        # 按鈕方塊
        buttons = QtWidgets.QDialogButtonBox(
            QtWidgets.QDialogButtonBox.Ok | QtWidgets.QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
```

### 載入 .ui 檔案

```python
import os
from PySide2 import QtWidgets, QtUiTools, QtCore

def loadUiFile(ui_path):
    """載入 Qt Designer .ui 檔案。"""
    loader = QtUiTools.QUiLoader()
    file = QtCore.QFile(ui_path)
    file.open(QtCore.QFile.ReadOnly)
    widget = loader.load(file)
    file.close()
    return widget

# 在任務面板中：
class UiTaskPanel:
    def __init__(self):
        ui_path = os.path.join(os.path.dirname(__file__), "panel.ui")
        self.form = loadUiFile(ui_path)
        # 透過 Qt Designer 中設定的 objectName 存取小工具
        self.form.myButton.clicked.connect(self._onButton)
```

### 檔案對話方塊 (File Dialogs)

```python
# 開啟檔案
path, _ = QtWidgets.QFileDialog.getOpenFileName(
    FreeCADGui.getMainWindow(),
    "開啟檔案",
    "",
    "STEP 檔案 (*.step *.stp);;所有檔案 (*)"
)

# 儲存檔案
path, _ = QtWidgets.QFileDialog.getSaveFileName(
    FreeCADGui.getMainWindow(),
    "儲存檔案",
    "",
    "STL 檔案 (*.stl);;所有檔案 (*)"
)

# 選擇目錄
path = QtWidgets.QFileDialog.getExistingDirectory(
    FreeCADGui.getMainWindow(),
    "選擇目錄"
)
```

### 訊息框 (Message Boxes)

```python
QtWidgets.QMessageBox.information(None, "資訊", "作業已完成。")
QtWidgets.QMessageBox.warning(None, "警告", "可能有問題。")
QtWidgets.QMessageBox.critical(None, "錯誤", "發生錯誤。")

result = QtWidgets.QMessageBox.question(
    None, "確認", "您確定嗎？",
    QtWidgets.QMessageBox.Yes | QtWidgets.QMessageBox.No
)
if result == QtWidgets.QMessageBox.Yes:
    pass  # 繼續
```

### 輸入對話方塊 (Input Dialogs)

```python
text, ok = QtWidgets.QInputDialog.getText(None, "輸入", "輸入名稱：")
value, ok = QtWidgets.QInputDialog.getDouble(None, "輸入", "數值：", 10.0, 0, 1000, 2)
choice, ok = QtWidgets.QInputDialog.getItem(None, "選擇", "選取：", ["A","B","C"], 0, False)
```

## Coin3D / Pivy 場景圖

FreeCAD 的 3D 檢視使用 Coin3D (Open Inventor)。Pivy 提供 Python 繫結。

```python
from pivy import coin
import FreeCADGui

# 取得場景圖根節點
sg = FreeCADGui.ActiveDocument.ActiveView.getSceneGraph()

# --- 基本形狀 ---
sep = coin.SoSeparator()

# 材質 (顏色)
mat = coin.SoMaterial()
mat.diffuseColor.setValue(0.0, 0.8, 0.2)  # RGB 0-1
mat.transparency.setValue(0.3)             # 0=不透明, 1=隱形

# 轉換
transform = coin.SoTransform()
transform.translation.setValue(10, 0, 0)
transform.rotation.setValue(coin.SbVec3f(0,0,1), 0.785)  # 軸, 角度(rad)
transform.scaleFactor.setValue(2, 2, 2)

# 形狀
sphere = coin.SoSphere()
sphere.radius.setValue(3.0)

cube = coin.SoCube()
cube.width.setValue(5)
cube.height.setValue(5)
cube.depth.setValue(5)

cylinder = coin.SoCylinder()
cylinder.radius.setValue(2)
cylinder.height.setValue(10)

# 組裝
sep.addChild(mat)
sep.addChild(transform)
sep.addChild(sphere)
sg.addChild(sep)

# --- 線條 ---
line_sep = coin.SoSeparator()
coords = coin.SoCoordinate3()
coords.point.setValues(0, 3, [[0,0,0], [10,0,0], [10,10,0]])
line_set = coin.SoLineSet()
line_set.numVertices.setValue(3)
line_sep.addChild(coords)
line_sep.addChild(line_set)
sg.addChild(line_sep)

# --- 點 ---
point_sep = coin.SoSeparator()
style = coin.SoDrawStyle()
style.pointSize.setValue(5)
coords = coin.SoCoordinate3()
coords.point.setValues(0, 3, [[0,0,0], [5,5,0], [10,0,0]])
points = coin.SoPointSet()
point_sep.addChild(style)
point_sep.addChild(coords)
point_sep.addChild(points)
sg.addChild(point_sep)

# --- 文字 ---
text_sep = coin.SoSeparator()
trans = coin.SoTranslation()
trans.translation.setValue(0, 0, 5)
font = coin.SoFont()
font.name.setValue("Arial")
font.size.setValue(16)
text = coin.SoText2()       # 2D 螢幕對齊文字
text.string.setValue("Hello")
text_sep.addChild(trans)
text_sep.addChild(font)
text_sep.addChild(text)
sg.addChild(text_sep)

# --- 清理 ---
sg.removeChild(sep)
sg.removeChild(line_sep)
```

## 檢視操作 (View Manipulation)

```python
view = FreeCADGui.ActiveDocument.ActiveView

# 相機操作
view.viewIsometric()
view.viewFront()
view.viewTop()
view.viewRight()
view.fitAll()
view.setCameraOrientation(FreeCAD.Rotation(0, 0, 0))
view.setCameraType("Perspective")   # 或 "Orthographic"

# 儲存影像
view.saveImage("/path/to/screenshot.png", 1920, 1080, "White")

# 取得相機資訊
cam = view.getCameraNode()
```
