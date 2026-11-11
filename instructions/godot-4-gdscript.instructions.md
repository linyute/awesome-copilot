---
description: '避免在 Godot 4 專案中使用 Godot 3 語法：GDScript 2.0 註解、await、setter、@rpc、具型別的訊號與 Callable'
applyTo: '**/*.gd'
---

# Godot 4 GDScript 2.0（禁止 Godot 3 語法）

## GDScript 2.0 語法（絕不使用 Godot 3）
| Godot 3（錯誤） | Godot 4（使用） |
|---|---|
| `export var speed = 5` / `export(int) var` | `@export var speed: float = 5.0` (`@export_range`, `@export_enum`, `@export_group`) |
| `onready var x = $X` | `@onready var x: Node2D = $X` |
| `tool` | `@tool`（第一行） |
| `yield(get_tree().create_timer(1), "timeout")` | `await get_tree().create_timer(1.0).timeout` |
| `yield(obj, "signal")` | `await obj.signal_name` |
| `var x setget set_x, get_x` | `var x: int:` 搭配 `set(value):` / `get:` 區塊 |
| `puppet` 函式 | `@rpc`（僅授權；Godot 4 預設值） |
| `remote` 函式 | `@rpc("any_peer")` |
| `remotesync` 函式 | `@rpc("any_peer", "call_local")` |
| `puppetsync` 函式 | `@rpc("call_local")` |
| `master` 函式 | 無直接對應；使用 `@rpc("any_peer")` + `multiplayer.get_remote_sender_id()` 檢查 |
| `funcref(obj, "m")` | `Callable(obj, "m")` 或直接使用 `obj.m` |
| `PoolStringArray`, `PoolVector2Array` | `PackedStringArray`, `PackedVector2Array` |
- 在所有地方使用靜態型別：`var hp: int = 100`、`func hit(dmg: int) -> void:`。推斷型別請使用 `:=`。
- 生命週期覆寫（`_ready`、`_process`）不再自動呼叫父類別；擴充指令碼類別時請呼叫 `super()`。
- 在有幫助的地方，對輸入動作/群組使用 `StringName` 常值 `&"action"`，對 NodePath 使用 `^"path"`。

## 訊號與 Callable
- 宣告具型別的訊號：`signal health_changed(new_value: int)`。
- 使用 Signal 物件進行連線：`button.pressed.connect(_on_button_pressed)`。絕不使用 Godot 3 形式 `connect("pressed", self, "_on_button_pressed")`。
- 使用 `.bind()` 繫結額外引數：`enemy.died.connect(_on_enemy_died.bind(enemy))`。旗標：`connect(callable, CONNECT_ONE_SHOT)`。
- 使用 `health_changed.emit(hp)` 發送，而非 `emit_signal("health_changed", hp)`。
- 使用 `sig.disconnect(callable)` 中斷連線；請先檢查 `sig.is_connected(callable)`。
- 小型處理常式請使用 lambda：`timer.timeout.connect(func(): queue_free())`。
- 優先使用訊號（「向下呼叫，向上發送訊號」），而非 `get_parent().get_parent()` 鏈。
