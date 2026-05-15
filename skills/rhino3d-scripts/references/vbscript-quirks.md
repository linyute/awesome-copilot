# RhinoScript 的 VBScript 訣竅與注意點 (Quirks)

在編寫 `.rvb` / `.vbs` 檔案時常見的陷阱，對於習慣 C 系列語言或 Python 的人來說並不直觀。

## 務必以 `Option Explicit` 開頭

若無此項，拼錯變數名稱會默默建立一個設為 `Empty` 的新 `Variant`。每個 `.rvb` 檔案都應以以下內容開頭：

```vbscript
Option Explicit
```

## 沒有區塊作用域 (Block Scope)

`Sub`/`Function` 內部的所有 `Dim` 宣告都會被提升 (hoisted) 到頂部。`If` 區塊內部的 `Dim` 在 `If` 結束後仍然可見。迴圈計數器在迴圈結束後依然存在。

## `Nothing` vs `Empty` vs `Null`

| 哨兵值 (Sentinel) | 測試方法 | 意義 |
|---|---|---|
| `Empty` | `IsEmpty(x)` | 已 `Dim` 但從未賦值 |
| `Null` | `IsNull(x)` | 明確的「無值」 — `Rhino.GetObject` 取消時的傳回值 |
| `Nothing` | `x Is Nothing` | 指向空值的**物件**引用 — 僅適用於 `Set` 變數 |

錯誤的哨兵值會默默地傳回 false。

## 括號會改變語義

```vbscript
Foo a, b              ' 呼叫 Sub 或 Function (捨棄傳回值)
Call Foo(a, b)        ' 呼叫 Sub 或 Function (捨棄傳回值)
x = Foo(a, b)         ' 呼叫 Function 並擷取傳回值
Foo(a, b)             ' 多個引數的 sub 會出現語法錯誤 (SYNTAX ERROR)

Foo(x)                ' 呼叫 Foo 並以「傳值 (ByVal)」方式傳遞 x，即使 Foo 宣告為 ByRef
Foo x                 ' 尊重 Foo 的 ByRef 宣告
```

如果 Sub 修改了其引數但變動未生效 — 檢查您是否將引數包在了括號內。

## 預設為 `ByRef` (傳址)

與大多數語言不同，VBScript **預設以傳址方式** 傳遞引數。函式可以變動呼叫者的變數。請明確標示：

```vbscript
Sub Increment(ByRef n)
    n = n + 1
End Sub
```

## 陣列以 0 為基底，使用 `UBound` 而非 `Length`

```vbscript
Dim arr(2)            ' 三個元素：arr(0), arr(1), arr(2)
For i = 0 To UBound(arr)
    arr(i) = i * 10
Next
```

`Dim arr(n)` 會建立 `n+1` 個元素。`ReDim Preserve arr(newSize)` 用於調整大小（僅能調整多維陣列的最後一維）。

## 物件指派需要 `Set`

```vbscript
Set fso = CreateObject("Scripting.FileSystemObject")    ' 正確
fso = CreateObject("Scripting.FileSystemObject")        ' 執行階段錯誤 (RUNTIME ERROR)
```

只要等號右側是物件（COM 物件、RegExp、Dictionary），就必須使用 `Set`。

## 錯誤處理是手動的

```vbscript
On Error Resume Next
Rhino.AddCircle Array(0,0,0), -1
If Err.Number <> 0 Then
    Rhino.Print "失敗：" & Err.Description
    Err.Clear
End If
On Error GoTo 0           ' 恢復正常的錯誤行為
```

`On Error Resume Next` 會抑制 **所有** 錯誤，直到執行 `On Error GoTo 0`。忘記恢復是常見的 bug。

## 點 (Points) 是具有 3 個元素的陣列

Rhino 要求 `Array(x, y, z)`。2 個元素的陣列 (`Array(x, y)`) 會引發型別不符錯誤。

```vbscript
Dim pt
pt = Array(1.0, 2.0, 3.0)
Rhino.AddPoint pt
```

## 字串串接使用 `&` 而非 `+`

字串的 `+` 僅在 **兩側** 均為字串時才有效。若其中一側是數字，`+` 會執行數值加法並引發型別不符。始終使用 `&`：

```vbscript
Rhino.Print "計數：" & n
```

## `For Each` 需要 `Variant`

```vbscript
Dim item
For Each item In someCollection
    ' ...
Next
```

迴圈變數必須是 `Variant`。您不能宣告 `Dim item As Long`（VBScript 沒有具備型別的 `Dim`）。
