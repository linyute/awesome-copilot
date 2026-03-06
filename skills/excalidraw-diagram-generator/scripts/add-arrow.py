#!/usr/bin/env python3
"""
在 Excalidraw 圖表中的元素之間新增箭頭（連接）。

用法：
    python add-arrow.py <diagram_path> <from_x> <from_y> <to_x> <to_y> [選項]

選項：
    --style {solid|dashed|dotted}    箭頭線條樣式（預設：solid）
    --color HEX                      箭頭顏色（預設：#1e1e1e）
    --label TEXT                     在箭頭上新增文字標籤
    --use-edit-suffix                透過 .excalidraw.edit 進行編輯以規避編輯器覆寫問題（預設啟用；使用 --no-use-edit-suffix 即可停用）

範例：
    python add-arrow.py diagram.excalidraw 300 200 500 300
    python add-arrow.py diagram.excalidraw 300 200 500 300 --label "HTTP"
    python add-arrow.py diagram.excalidraw 300 200 500 300 --style dashed --color "#7950f2"
    python add-arrow.py diagram.excalidraw 300 200 500 300 --use-edit-suffix
"""

import json
import sys
import uuid
from pathlib import Path
from typing import Dict, Any


def generate_unique_id() -> str:
    """為 Excalidraw 元素產生唯一 ID。"""
    return str(uuid.uuid4()).replace('-', '')[:16]


def prepare_edit_path(diagram_path: Path, use_edit_suffix: bool) -> tuple[Path, Path | None]:
    """
    準備安全編輯路徑以規避編輯器覆寫問題。

    傳回：
        (work_path, final_path)
        - work_path: 編輯期間讀取/寫入的檔案路徑
        - final_path: 重新命名回的檔案路徑（如果不使用則為 None）
    """
    if not use_edit_suffix:
        return diagram_path, None

    if diagram_path.suffix != ".excalidraw":
        return diagram_path, None

    edit_path = diagram_path.with_suffix(diagram_path.suffix + ".edit")

    if diagram_path.exists():
        if edit_path.exists():
            raise FileExistsError(f"編輯檔案已存在：{edit_path}")
        diagram_path.rename(edit_path)

    return edit_path, diagram_path


def finalize_edit_path(work_path: Path, final_path: Path | None) -> None:
    """藉由將 .edit 重新命名回 .excalidraw 來完成編輯（如果需要）。"""
    if final_path is None:
        return

    if final_path.exists():
        final_path.unlink()

    work_path.rename(final_path)


def create_arrow(
    from_x: float,
    from_y: float,
    to_x: float,
    to_y: float,
    style: str = "solid",
    color: str = "#1e1e1e",
    label: str = None
) -> list:
    """
    建立一個箭頭元素。
    
    引數：
        from_x: 起始 X 座標
        from_y: 起始 Y 座標
        to_x: 結束 X 座標
        to_y: 結束 Y 座標
        style: 線條樣式（實線、虛線、點線）
        color: 箭頭顏色
        label: 箭頭上的選擇性文字標籤
    
    傳回：
        元素列表（箭頭和選擇性標籤）
    """
    elements = []
    
    # 箭頭元素
    arrow = {
        "id": generate_unique_id(),
        "type": "arrow",
        "x": from_x,
        "y": from_y,
        "width": to_x - from_x,
        "height": to_y - from_y,
        "angle": 0,
        "strokeColor": color,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": style,
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "index": "a0",
        "roundness": {
            "type": 2
        },
        "seed": 1000000000 + hash(f"{from_x}{from_y}{to_x}{to_y}") % 1000000000,
        "version": 1,
        "versionNonce": 2000000000 + hash(f"{from_x}{from_y}{to_x}{to_y}") % 1000000000,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1738195200000,
        "link": None,
        "locked": False,
        "points": [
            [0, 0],
            [to_x - from_x, to_y - from_y]
        ],
        "startBinding": None,
        "endBinding": None,
        "startArrowhead": None,
        "endArrowhead": "arrow",
        "lastCommittedPoint": None
    }
    elements.append(arrow)
    
    # 選擇性標籤
    if label:
        mid_x = (from_x + to_x) / 2 - (len(label) * 5)
        mid_y = (from_y + to_y) / 2 - 10
        
        label_element = {
            "id": generate_unique_id(),
            "type": "text",
            "x": mid_x,
            "y": mid_y,
            "width": len(label) * 10,
            "height": 20,
            "angle": 0,
            "strokeColor": color,
            "backgroundColor": "transparent",
            "fillStyle": "solid",
            "strokeWidth": 2,
            "strokeStyle": "solid",
            "roughness": 1,
            "opacity": 100,
            "groupIds": [],
            "frameId": None,
            "index": "a0",
            "roundness": None,
            "seed": 1000000000 + hash(label) % 1000000000,
            "version": 1,
            "versionNonce": 2000000000 + hash(label) % 1000000000,
            "isDeleted": False,
            "boundElements": [],
            "updated": 1738195200000,
            "link": None,
            "locked": False,
            "text": label,
            "fontSize": 14,
            "fontFamily": 5,
            "textAlign": "center",
            "verticalAlign": "top",
            "containerId": None,
            "originalText": label,
            "autoResize": True,
            "lineHeight": 1.25
        }
        elements.append(label_element)
    
    return elements


def add_arrow_to_diagram(
    diagram_path: Path,
    from_x: float,
    from_y: float,
    to_x: float,
    to_y: float,
    style: str = "solid",
    color: str = "#1e1e1e",
    label: str = None
) -> None:
    """
    將箭頭新增至 Excalidraw 圖表。
    
    引數：
        diagram_path: Excalidraw 圖表檔案的路徑
        from_x: 起始 X 座標
        from_y: 起始 Y 座標
        to_x: 結束 X 座標
        to_y: 結束 Y 座標
        style: 線條樣式（實線、虛線、點線）
        color: 箭頭顏色
        label: 選擇性文字標籤
    """
    print(f"正在建立箭頭，從 ({from_x}, {from_y}) 到 ({to_x}, {to_y})")
    arrow_elements = create_arrow(from_x, from_y, to_x, to_y, style, color, label)
    
    if label:
        print(f"  帶有標籤：'{label}'")
    
    # 載入圖表
    print(f"正在載入圖表：{diagram_path}")
    with open(diagram_path, 'r', encoding='utf-8') as f:
        diagram = json.load(f)
    
    # 新增箭頭元素
    if 'elements' not in diagram:
        diagram['elements'] = []
    
    original_count = len(diagram['elements'])
    diagram['elements'].extend(arrow_elements)
    print(f"  已新增 {len(arrow_elements)} 個元素（總計：{original_count} -> {len(diagram['elements'])}）")
    
    # 儲存圖表
    print(f"正在儲存圖表")
    with open(diagram_path, 'w', encoding='utf-8') as f:
        json.dump(diagram, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 成功將箭頭新增至圖表中")


def main():
    """主進入點。"""
    if len(sys.argv) < 6:
        print("用法：python add-arrow.py <diagram_path> <from_x> <from_y> <to_x> <to_y> [選項]")
        print("
選項：")
        print("  --style {solid|dashed|dotted}    線條樣式（預設：solid）")
        print("  --color HEX                      顏色（預設：#1e1e1e）")
        print("  --label TEXT                     箭頭上的文字標籤")
        print("  --use-edit-suffix                透過 .excalidraw.edit 進行編輯以規避編輯器覆寫問題（預設啟用；使用 --no-use-edit-suffix 即可停用）")
        print("
範例：")
        print("  python add-arrow.py diagram.excalidraw 300 200 500 300")
        print("  python add-arrow.py diagram.excalidraw 300 200 500 300 --label 'HTTP'")
        sys.exit(1)
    
    diagram_path = Path(sys.argv[1])
    from_x = float(sys.argv[2])
    from_y = float(sys.argv[3])
    to_x = float(sys.argv[4])
    to_y = float(sys.argv[5])
    
    # 解析選擇性引數
    style = "solid"
    color = "#1e1e1e"
    label = None
    # 預設：使用編輯後綴以規避編輯器覆寫問題
    use_edit_suffix = True
    
    i = 6
    while i < len(sys.argv):
        if sys.argv[i] == '--style':
            if i + 1 < len(sys.argv):
                style = sys.argv[i + 1]
                if style not in ['solid', 'dashed', 'dotted']:
                    print(f"錯誤：無效樣式 '{style}'。必須為：solid, dashed 或 dotted")
                    sys.exit(1)
                i += 2
            else:
                print("錯誤：--style 需要一個引數")
                sys.exit(1)
        elif sys.argv[i] == '--color':
            if i + 1 < len(sys.argv):
                color = sys.argv[i + 1]
                i += 2
            else:
                print("錯誤：--color 需要一個引數")
                sys.exit(1)
        elif sys.argv[i] == '--label':
            if i + 1 < len(sys.argv):
                label = sys.argv[i + 1]
                i += 2
            else:
                print("錯誤：--label 需要一個文字引數")
                sys.exit(1)
        elif sys.argv[i] == '--use-edit-suffix':
            use_edit_suffix = True
            i += 1
        elif sys.argv[i] == '--no-use-edit-suffix':
            use_edit_suffix = False
            i += 1
        else:
            print(f"錯誤：未知選項：{sys.argv[i]}")
            sys.exit(1)
    
    # 驗證輸入
    if not diagram_path.exists():
        print(f"錯誤：找不到圖表檔案：{diagram_path}")
        sys.exit(1)
    
    try:
        work_path, final_path = prepare_edit_path(diagram_path, use_edit_suffix)
        add_arrow_to_diagram(work_path, from_x, from_y, to_x, to_y, style, color, label)
        finalize_edit_path(work_path, final_path)
    except Exception as e:
        print(f"錯誤：{e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
