# RhinoCommon 命名空間地圖 (Namespace Map)

使用此地圖來決定執行特定任務應匯入哪個 `Rhino.*` 命名空間。所有這些都可以在 Python 中透過 `import Rhino` 存取。

## 文件與物件模型 (Document & Object Model)

| 需求 | 命名空間 | 關鍵型別 |
|---|---|---|
| 使用中的文件、單位、公差、復原 (undo) | `Rhino` | `RhinoDoc`, `RhinoApp` |
| 讀取/寫入文件中的物件 | `Rhino.DocObjects` | `RhinoObject`, `ObjectAttributes`, `Layer`, `ObjectType` |
| 表格（圖層、材質、區塊、標註型式） | `Rhino.DocObjects.Tables` | `LayerTable`, `InstanceDefinitionTable`, `MaterialTable` |
| 自訂個別物件的使用者資料 | `Rhino.DocObjects.Custom` | `UserData` |
| 檔案 I/O (.3dm, 匯入/匯出) | `Rhino.FileIO` | `File3dm`, `File3dmObject` |

## 幾何圖形 (Geometry)

| 需求 | 命名空間 | 關鍵型別 |
|---|---|---|
| 點、向量、轉換 (Transform) | `Rhino.Geometry` | `Point3d`, `Vector3d`, `Transform`, `Plane`, `BoundingBox` |
| 曲線 (Curves) | `Rhino.Geometry` | `Curve`, `NurbsCurve`, `PolylineCurve`, `LineCurve`, `ArcCurve` |
| 表面 (Surfaces) 與 breps | `Rhino.Geometry` | `Surface`, `NurbsSurface`, `Brep`, `BrepFace`, `Extrusion` |
| 網格 (Meshes) | `Rhino.Geometry` | `Mesh`, `MeshFace`, `MeshNgon` |
| SubD | `Rhino.Geometry` | `SubD`, `SubDFace`, `SubDEdge` |
| 幾何圖形集合（頂點、邊緣、面清單） | `Rhino.Geometry.Collections` | `MeshVertexList`, `BrepEdgeList` |
| 相交 (Intersections) | `Rhino.Geometry.Intersect` | `Intersection`, `CurveIntersections` |
| 網格精細化 (Mesh refinement) | `Rhino.Geometry.MeshRefinements` | |
| 空間變形 (Morphs) (彎曲、扭轉等) | `Rhino.Geometry.Morphs` | `BendSpaceMorph`, `TwistSpaceMorph` |

## 使用者互動 (User Interaction)

| 需求 | 命名空間 | 關鍵型別 |
|---|---|---|
| 提示、獲取器 (Getters)、命令結果 | `Rhino.Input` / `Rhino.Input.Custom` | `RhinoGet`, `GetObject`, `GetPoint`, `GetOption` |
| 命令（建置外掛程式時） | `Rhino.Commands` | `Command`, `Result` |
| 表單、對話方塊、面板 | `Rhino.UI` | `Dialog`, `Panels`, `RhinoEtoExtensions` |
| UI 控制項 / 資料來源 | `Rhino.UI.Controls` | |
| Gumball (操作軸) | `Rhino.UI.Gumball` | |

## 顯示與算圖 (Display & Rendering)

| 需求 | 命名空間 | 關鍵型別 |
|---|---|---|
| 視圖、顯示管道 (Display conduits)、繪製覆蓋層 (Draw overlays) | `Rhino.Display` | `DisplayPipeline`, `DisplayConduit`, `RhinoViewport` |
| 算圖內容（材質、環境） | `Rhino.Render` | `RenderContent`, `RenderMaterial`, `RenderTexture` |
| 自訂算圖網格 | `Rhino.Render.CustomRenderMeshes` | |
| 後期效果 (Post effects) | `Rhino.Render.PostEffects` | |

## 執行階段與外掛程式 (Runtime & Plugins)

| 需求 | 命名空間 | 關鍵型別 |
|---|---|---|
| 外掛程式生命週期、設定 | `Rhino.PlugIns` | `PlugIn`, `FileImportPlugIn`, `FileExportPlugIn` |
| 同進程 Rhino (從外部 .NET 執行 Rhino) | `Rhino.Runtime.InProcess` | `RhinoCore` |
| 原生互通性 (Native interop)（指標、封送處理） | `Rhino.Runtime.InteropWrappers` | |
| 使用者通知 (快顯通知) | `Rhino.Runtime.Notifications` | |

## 常見模式

```python
import Rhino
import scriptcontext as sc
import System.Drawing

doc = sc.doc                                          # Rhino.RhinoDoc
tol = doc.ModelAbsoluteTolerance                      # float
view = doc.Views.ActiveView                           # Rhino.Display.RhinoView
layer_index = doc.Layers.Add("我的圖層", System.Drawing.Color.Red)

# 從 rhinoscriptsyntax GUID 尋找 Rhino 物件
rhobj = doc.Objects.Find(guid)                        # Rhino.DocObjects.RhinoObject
geom  = rhobj.Geometry                                # Rhino.Geometry.GeometryBase

# 加入具有屬性的幾何圖形
attrs = Rhino.DocObjects.ObjectAttributes()
attrs.LayerIndex = layer_index
attrs.Name = "範例"
new_id = doc.Objects.AddCurve(curve, attrs)
```

## 復原 (Undo)

```python
undo_serial = doc.BeginUndoRecord("批次作業")
try:
    # ... 許多 doc.Objects.* 呼叫 ...
    pass
finally:
    doc.EndUndoRecord(undo_serial)
    doc.Views.Redraw()
```
