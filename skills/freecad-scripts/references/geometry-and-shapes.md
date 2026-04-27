# FreeCAD 幾何與形狀 (FreeCAD Geometry and Shapes)

在 FreeCAD 中使用 Part、Mesh 和 Sketcher 模組來建立與操作幾何圖形的參考指南。

## 官方 Wiki 參考

- [建立與操作幾何圖形](https://wiki.freecad.org/Manual:Creating_and_manipulating_geometry)
- [Part 指令碼](https://wiki.freecad.org/Part_scripting)
- [拓撲資料指令碼](https://wiki.freecad.org/Topological_data_scripting)
- [Mesh 指令碼](https://wiki.freecad.org/Mesh_Scripting)
- [Mesh 轉換為 Part](https://wiki.freecad.org/Mesh_to_Part)
- [Sketcher 指令碼](https://wiki.freecad.org/Sketcher_scripting)
- [Drawing API 範例](https://wiki.freecad.org/Drawing_API_example)
- [Part：建立滾珠軸承 I](https://wiki.freecad.org/Scripted_Parts:_Ball_Bearing_-_Part_1)
- [Part：建立滾珠軸承 II](https://wiki.freecad.org/Scripted_Parts:_Ball_Bearing_-_Part_2)
- [直線繪製函式](https://wiki.freecad.org/Line_drawing_function)

## Part 模組 — 形狀階層 (Shape Hierarchy)

OpenCASCADE 拓撲層級（從底層到頂層）：

```
Vertex (頂點) → Edge (邊) → Wire (線) → Face (面) → Shell (殼) → Solid (實體) → CompSolid → Compound (複合體)
```

每一層級皆包含其下方的層級。

## 基本形狀 (Primitive Shapes)

```python
import Part
import FreeCAD as App

# 方塊 (Boxes)
box = Part.makeBox(length, width, height)
box = Part.makeBox(10, 20, 30, App.Vector(0,0,0), App.Vector(0,0,1))

# 圓柱體 (Cylinders)
cyl = Part.makeCylinder(radius, height)
cyl = Part.makeCylinder(5, 20, App.Vector(0,0,0), App.Vector(0,0,1), 360)

# 圓錐體 (Cones)
cone = Part.makeCone(r1, r2, height)

# 球體 (Spheres)
sph = Part.makeSphere(radius)
sph = Part.makeSphere(10, App.Vector(0,0,0), App.Vector(0,0,1), -90, 90, 360)

# 環面 (Torus)
tor = Part.makeTorus(majorR, minorR)

# 平面 (Planes) (無限平面 → 有界平面)
plane = Part.makePlane(length, width)
plane = Part.makePlane(10, 10, App.Vector(0,0,0), App.Vector(0,0,1))

# 螺旋線 (Helix)
helix = Part.makeHelix(pitch, height, radius)

# 楔形 (Wedge)
wedge = Part.makeWedge(xmin, ymin, zmin, z2min, x2min,
                        xmax, ymax, zmax, z2max, x2max)
```

## 曲線與邊 (Curves and Edges)

```python
# 線段 (Line segment)
line = Part.makeLine((0,0,0), (10,0,0))
line = Part.LineSegment(App.Vector(0,0,0), App.Vector(10,0,0)).toShape()

# 圓形 (Circle，完整)
circle = Part.makeCircle(radius)
circle = Part.makeCircle(5, App.Vector(0,0,0), App.Vector(0,0,1))

# 圓弧 (Arc，部分圓)
arc = Part.makeCircle(5, App.Vector(0,0,0), App.Vector(0,0,1), 0, 180)

# 三點弧線 (Arc through 3 points)
arc3 = Part.Arc(App.Vector(0,0,0), App.Vector(5,5,0), App.Vector(10,0,0)).toShape()

# 橢圓 (Ellipse)
ellipse = Part.Ellipse(App.Vector(0,0,0), 10, 5).toShape()

# BSpline 曲線
points = [App.Vector(0,0,0), App.Vector(2,3,0), App.Vector(5,1,0), App.Vector(8,4,0)]
bspline = Part.BSplineCurve()
bspline.interpolate(points)
edge = bspline.toShape()

# 具有控制點的 BSpline (近似)
bspline2 = Part.BSplineCurve()
bspline2.buildFromPoles(points)
edge2 = bspline2.toShape()

# 貝茲曲線 (Bezier curve)
bezier = Part.BezierCurve()
bezier.setPoles([App.Vector(0,0,0), App.Vector(3,5,0),
                  App.Vector(7,5,0), App.Vector(10,0,0)])
edge3 = bezier.toShape()
```

## 線、面與實體 (Wires, Faces, and Solids)

```python
# 從邊建立線 (Wire from edges)
wire = Part.Wire([edge1, edge2, edge3])   # 邊必須首尾相連

# 依排序建立線
wire = Part.Wire(Part.__sortEdges__([edges_list]))

# 從線建立面 (Face from wire，必須封閉且平坦，或為一個曲面)
face = Part.Face(wire)

# 從多條線建立面 (第一條 = 外框，其餘 = 孔洞)
face = Part.Face([outer_wire, hole_wire1, hole_wire2])

# 從面建立殼 (Shell from faces)
shell = Part.Shell([face1, face2, face3])

# 從殼建立實體 (必須封閉)
solid = Part.Solid(shell)

# 複合體 (Compound，分組形狀而不進行合併)
compound = Part.Compound([shape1, shape2, shape3])
```

## 形狀操作 (Shape Operations)

```python
# 布林運算 (Boolean operations)
union = shape1.fuse(shape2)        # 聯集
diff = shape1.cut(shape2)          # 減集
inter = shape1.common(shape2)      # 交集

# 多重聯集 / 多重減集
multi_fuse = shape1.multiFuse([shape2, shape3, shape4])

# 布林運算後清理接縫邊 (Clean seam edges)
clean = union.removeSplitter()

# 圓角 (Fillet，圓形邊)
filleted = solid.makeFillet(radius, solid.Edges)
filleted = solid.makeFillet(radius, [solid.Edges[0], solid.Edges[3]])

# 倒角 (Chamfer)
chamfered = solid.makeChamfer(distance, solid.Edges)
chamfered = solid.makeChamfer(dist1, dist2, [solid.Edges[0]])  # 不對稱

# 位移 (Offset/shell/thicken)
offset = solid.makeOffsetShape(offset_distance, tolerance)
thick = solid.makeThickness([face_to_remove], thickness, tolerance)

# 剖面 (Section，實體與平面的交集曲線)
section = solid.section(Part.makePlane(100, 100, App.Vector(0,0,5)))
```

## 拉伸、旋轉、放樣、掃掠 (Extrude, Revolve, Loft, Sweep)

```python
# 拉伸面或線 (Extrude face or wire)
extruded = face.extrude(App.Vector(0, 0, 10))    # 方向向量

# 旋轉 (Revolve)
revolved = face.revolve(
    App.Vector(0, 0, 0),     # 中心點
    App.Vector(0, 1, 0),     # 軸心
    360                       # 角度 (度)
)

# 在線條/剖面之間放樣 (Loft)
loft = Part.makeLoft([wire1, wire2, wire3], True)   # solid=True

# 掃掠 (管線/Pipe)
sweep = Part.Wire([path_edge]).makePipe(profile_wire)

# 使用 Frenet 框架的掃掠 (管線/PipeShell)
sweep = Part.Wire([path_edge]).makePipeShell(
    [profile_wire],
    True,    # 建立實體
    False    # 使用 Frenet 框架
)
```

## 拓撲探索 (Topological Exploration)

```python
shape = obj.Shape

# 子元素存取
shape.Vertexes          # [Vertex, ...]
shape.Edges             # [Edge, ...]
shape.Wires             # [Wire, ...]
shape.Faces             # [Face, ...]
shape.Shells            # [Shell, ...]
shape.Solids            # [Solid, ...]

# 頂點屬性
v = shape.Vertexes[0]
v.Point                 # FreeCAD.Vector — 3D 座標

# 邊屬性
e = shape.Edges[0]
e.Length
e.Curve                 # 底層幾何曲線 (Line, Circle, BSpline, ...)
e.Vertexes              # 起點與終點頂點
e.firstVertex()         # 第一個頂點
e.lastVertex()          # 最後一個頂點
e.tangentAt(0.5)        # 參數位置的切線
e.valueAt(0.5)          # 參數位置的點
e.parameterAt(vertex)   # 頂點處的參數

# 面屬性
f = shape.Faces[0]
f.Area
f.Surface               # 底層幾何曲面 (Plane, Cylinder, ...)
f.CenterOfMass
f.normalAt(0.5, 0.5)    # (u, v) 參數處的法線
f.Wires                 # 邊界線
f.OuterWire             # 或 Wires[0]

# 邊界框 (Bounding box)
bb = shape.BoundBox
bb.XMin, bb.XMax, bb.YMin, bb.YMax, bb.ZMin, bb.ZMax
bb.Center, bb.DiagonalLength
bb.XLength, bb.YLength, bb.ZLength

# 形狀屬性
shape.Volume
shape.Area
shape.CenterOfMass
shape.ShapeType         # "Solid", "Compound", "Face", 等
shape.isValid()
shape.isClosed()
```

## 草繪器限制參考 (Sketcher Constraints)

| 限制條件 | 語法 | 描述 |
|---|---|---|
| 重合 (Coincident) | `("Coincident", geo1, pt1, geo2, pt2)` | 點重合 |
| 水平 (Horizontal) | `("Horizontal", geo)` | 線為水平 |
| 垂直 (Vertical) | `("Vertical", geo)` | 線為垂直 |
| 平行 (Parallel) | `("Parallel", geo1, geo2)` | 線平行 |
| 垂直 (Perpendicular) | `("Perpendicular", geo1, geo2)` | 線垂直 |
| 相切 (Tangent) | `("Tangent", geo1, geo2)` | 曲線相切 |
| 等長 (Equal) | `("Equal", geo1, geo2)` | 長度/半徑相等 |
| 對稱 (Symmetric) | `("Symmetric", geo1, pt1, geo2, pt2, geoLine)` | 線對稱 |
| 距離 (Distance) | `("Distance", geo1, pt1, geo2, pt2, value)` | 兩點間距離 |
| 水平距離 (DistanceX) | `("DistanceX", geo, pt1, pt2, value)` | 水平距離 |
| 垂直距離 (DistanceY) | `("DistanceY", geo, pt1, pt2, value)` | 垂直距離 |
| 半徑 (Radius) | `("Radius", geo, value)` | 圓/弧半徑 |
| 角度 (Angle) | `("Angle", geo1, geo2, value)` | 線間角度 |
| 固定 (Fixed) | `("Fixed", geo)` | 鎖定幾何 |

點索引：`1` = 起點, `2` = 終點, `3` = 中心 (圓/弧)。
外部幾何索引：`-1` = X 軸, `-2` = Y 軸。

## 網格操作 (Mesh Operations)

```python
import Mesh

# 從檔案建立
mesh = Mesh.Mesh("/path/to/model.stl")

# 從拓撲建立 (頂點 + 面)
verts = [[0,0,0], [10,0,0], [10,10,0], [0,10,0], [5,5,10]]
facets = [[0,1,4], [1,2,4], [2,3,4], [3,0,4], [0,1,2], [0,2,3]]
mesh = Mesh.Mesh([verts[f[0]] + verts[f[1]] + verts[f[2]] for f in facets])

# 網格屬性
mesh.CountPoints
mesh.CountFacets
mesh.Volume
mesh.Area
mesh.isSolid()

# 網格操作
mesh.unite(mesh2)       # 布林聯集
mesh.intersect(mesh2)   # 布林交集
mesh.difference(mesh2)  # 布林減集
mesh.offset(1.0)        # 偏移曲面
mesh.smooth()           # 拉普拉斯平滑化 (Laplacian smoothing)

# 匯出
mesh.write("/path/to/output.stl")
mesh.write("/path/to/output.obj")

# 轉換 Part → Mesh
import MeshPart
mesh = MeshPart.meshFromShape(
    Shape=part_shape,
    LinearDeflection=0.1,
    AngularDeflection=0.523599,  # ~30 度
    Relative=False
)

# 轉換 Mesh → Part
import Part
tolerance = 0.05
shape = Part.Shape()
shape.makeShapeFromMesh(mesh.Topology, tolerance)
solid = Part.makeSolid(shape)
```
