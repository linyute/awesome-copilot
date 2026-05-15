# `rhinoscriptsyntax` 速查表 (Cheatsheet)

```python
import rhinoscriptsyntax as rs
```

## 使用者輸入 (User Input)

| 函式 | 傳回值 |
|---|---|
| `rs.GetObject(message, filter, preselect, select)` | GUID 或 `None` |
| `rs.GetObjects(message, filter)` | GUID 清單 |
| `rs.GetPoint(message, base_point)` | `Point3d` 或 `None` |
| `rs.GetString(message, default, strings)` | str |
| `rs.GetInteger`, `rs.GetReal` | int / float |
| `rs.GetBoolean(message, items, defaults)` | bool 清單 |

常用的 `rs.filter.*` 旗標 (可使用 OR 組合)：

```
point=1, point_cloud=2, curve=4, surface=8, polysurface=16,
mesh=32, light=256, annotation=512, instance_reference=4096,
text_dot=8192, grip=16384, detail=32768, hatch=65536,
morph_control=131072, sub_d=262144
```

## 建立幾何圖形 (Creating Geometry)

| 函式 | 備註 |
|---|---|
| `rs.AddPoint(point)` | |
| `rs.AddLine(start, end)` | |
| `rs.AddPolyline(points)` | `points` 為 3-tuple 清單 |
| `rs.AddCircle(plane_or_center, radius)` | |
| `rs.AddArc(plane, radius, angle_deg)` | 角度單位為 **度 (degrees)** |
| `rs.AddCurve(points, degree=3)` | 通過控制點的 NURBS |
| `rs.AddInterpCurve(points, degree=3)` | 通過點的 NURBS |
| `rs.AddSphere(center, radius)` | |
| `rs.AddBox(corners)` | `corners` = 8 個點 |
| `rs.AddPlanarSrf(curves)` | 傳回清單 |
| `rs.AddLoftSrf(curves, ...)` | 傳回 GUID 清單 |
| `rs.AddExtrusion(profile, path)` / `rs.ExtrudeCurveStraight` | |

## 物件屬性 (Object Properties)

| 函式 | 用途 |
|---|---|
| `rs.ObjectLayer(id [, layer])` | 取得/設定 |
| `rs.ObjectColor(id [, color])` | RGB 元組 |
| `rs.ObjectName(id [, name])` | |
| `rs.ObjectType(id)` | 符合 `rs.filter.*` 的 int |
| `rs.IsCurve / IsSurface / IsBrep / IsMesh / IsPoint(id)` | |
| `rs.DeleteObject(id)` / `rs.DeleteObjects(ids)` | |
| `rs.CopyObject(id, translation)` | |
| `rs.MoveObject(id, translation)` | |
| `rs.RotateObject(id, center, angle, axis=None, copy=False)` | 角度單位為度 |
| `rs.ScaleObject(id, origin, scale)` | scale 為 3-tuple |

## 曲線 (Curves)

| 函式 | |
|---|---|
| `rs.CurveLength(id)` | |
| `rs.CurveDomain(id)` | `(t0, t1)` |
| `rs.EvaluateCurve(id, t)` | `Point3d` |
| `rs.CurveStartPoint / CurveEndPoint(id)` | |
| `rs.CurveClosestPoint(id, point)` | 參數 `t` |
| `rs.DivideCurve(id, segments, create_points=False, return_points=True)` | |
| `rs.IsCurveClosed / IsCurvePlanar(id)` | |

## 圖層 (Layers)

| 函式 | |
|---|---|
| `rs.AddLayer(name, color=None, visible=True, locked=False, parent=None)` | |
| `rs.CurrentLayer([layer])` | |
| `rs.LayerNames()` | 清單 |
| `rs.LayerVisible(name [, visible])` | |
| `rs.DeleteLayer(name)` | |
| `rs.ObjectsByLayer(name)` | GUID 清單 |

## 文件與視圖 (Document & View)

| 函式 | |
|---|---|
| `rs.UnitAbsoluteTolerance()` | |
| `rs.UnitSystem()` | int (`rs.unit_system_*`) |
| `rs.EnableRedraw(enable)` | **在大量作業時切換此項** |
| `rs.Redraw()` | 強制重新繪製一次 |
| `rs.ViewNames()` / `rs.CurrentView([name])` | |
| `rs.ZoomExtents(view=None, all=False)` | |

## 選取 (Selection)

| 函式 | |
|---|---|
| `rs.SelectedObjects()` | 清單 |
| `rs.SelectObject(id)` / `rs.SelectObjects(ids)` | |
| `rs.UnselectAllObjects()` | |
| `rs.InvertSelectedObjects()` | |

## 從指令碼呼叫巨集

`rs.Command(command_string, echo=True)` 會像在命令列輸入一樣執行巨集。務必加上 `!` (取消) 和 `-` (無對話方塊) 前綴：

```python
rs.Command("! _-Line 0,0,0 10,0,0", echo=False)
```
