#!/usr/bin/env python3
"""
將 Excalidraw 函式庫中的圖示新增至圖表中。

此指令碼從 Excalidraw 函式庫讀取圖示 JSON 檔案，將其座標轉換為
目標位置，產生唯一 ID，並將其新增至現有的 Excalidraw 圖表中。
適用於任何 Excalidraw 函式庫 (AWS, GCP, Azure, Kubernetes 等)。

用法：
    python add-icon-to-diagram.py <diagram_path> <icon_name> <x> <y> [選項]

選項：
    --library-path PATH    圖示函式庫目錄的路徑（預設：aws-architecture-icons）
    --label TEXT           在圖示下方新增文字標籤
    --use-edit-suffix      透過 .excalidraw.edit 進行編輯以規避編輯器覆寫問題（預設啟用；使用 --no-use-edit-suffix 即可停用）

範例：
    python add-icon-to-diagram.py diagram.excalidraw EC2 500 300
    python add-icon-to-diagram.py diagram.excalidraw EC2 500 300 --label "網頁伺服器"
    python add-icon-to-diagram.py diagram.excalidraw VPC 200 150 --library-path libraries/gcp-icons
    python add-icon-to-diagram.py diagram.excalidraw EC2 500 300 --use-edit-suffix
"""

import json
import sys
import uuid
from pathlib import Path
from typing import Dict, List, Any, Tuple


def generate_unique_id() -> str:
    """為 Excalidraw 元素產生唯一 ID。"""
    return str(uuid.uuid4()).replace('-', '')[:16]


def calculate_bounding_box(elements: List[Dict[str, Any]]) -> Tuple[float, float, float, float]:
    """計算圖示元素的邊界框 (min_x, min_y, max_x, max_y)。"""
    if not elements:
        return (0, 0, 0, 0)
    
    min_x = float('inf')
    min_y = float('inf')
    max_x = float('-inf')
    max_y = float('-inf')
    
    for element in elements:
        if 'x' in element and 'y' in element:
            x = element['x']
            y = element['y']
            width = element.get('width', 0)
            height = element.get('height', 0)
            
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x + width)
            max_y = max(max_y, y + height)
    
    return (min_x, min_y, max_x, max_y)


def transform_icon_elements(
    elements: List[Dict[str, Any]], 
    target_x: float, 
    target_y: float
) -> List[Dict[str, Any]]:
    """
    將圖示元素轉換為具有唯一 ID 的目標座標。
    
    引數：
        elements: 來自 JSON 檔案的圖示元素
        target_x: 目標 X 座標（左上角位置）
        target_y: 目標 Y 座標（左上角位置）
    
    傳回：
        具有新座標和 ID 的轉換後元素
    """
    if not elements:
        return []
    
    # 計算邊界框
    min_x, min_y, max_x, max_y = calculate_bounding_box(elements)
    
    # 計算偏移量
    offset_x = target_x - min_x
    offset_y = target_y - min_y
    
    # 建立 ID 映射：old_id -> new_id
    id_mapping = {}
    for element in elements:
        if 'id' in element:
            old_id = element['id']
            id_mapping[old_id] = generate_unique_id()
    
    # 建立群組 ID 映射
    group_id_mapping = {}
    for element in elements:
        if 'groupIds' in element:
            for old_group_id in element['groupIds']:
                if old_group_id not in group_id_mapping:
                    group_id_mapping[old_group_id] = generate_unique_id()
    
    # 轉換元素
    transformed = []
    for element in elements:
        new_element = element.copy()
        
        # 更新座標
        if 'x' in new_element:
            new_element['x'] = new_element['x'] + offset_x
        if 'y' in new_element:
            new_element['y'] = new_element['y'] + offset_y
        
        # 更新 ID
        if 'id' in new_element:
            new_element['id'] = id_mapping[new_element['id']]
        
        # 更新群組 ID
        if 'groupIds' in new_element:
            new_element['groupIds'] = [
                group_id_mapping[gid] for gid in new_element['groupIds']
            ]
        
        # 如果存在連結參照，則更新它們
        if 'startBinding' in new_element and new_element['startBinding']:
            if 'elementId' in new_element['startBinding']:
                old_id = new_element['startBinding']['elementId']
                if old_id in id_mapping:
                    new_element['startBinding']['elementId'] = id_mapping[old_id]
        
        if 'endBinding' in new_element and new_element['endBinding']:
            if 'elementId' in new_element['endBinding']:
                old_id = new_element['endBinding']['elementId']
                if old_id in id_mapping:
                    new_element['endBinding']['elementId'] = id_mapping[old_id]
        
        # 如果存在 containerId，則更新它
        if 'containerId' in new_element and new_element['containerId']:
            old_id = new_element['containerId']
            if old_id in id_mapping:
                new_element['containerId'] = id_mapping[old_id]
        
        # 如果存在 boundElements，則更新它們
        if 'boundElements' in new_element and new_element['boundElements']:
            new_bound_elements = []
            for bound_elem in new_element['boundElements']:
                if isinstance(bound_elem, dict) and 'id' in bound_elem:
                    old_id = bound_elem['id']
                    if old_id in id_mapping:
                        bound_elem['id'] = id_mapping[old_id]
                new_bound_elements.append(bound_elem)
            new_element['boundElements'] = new_bound_elements
        
        transformed.append(new_element)
    
    return transformed


def load_icon(icon_name: str, library_path: Path) -> List[Dict[str, Any]]:
    """
    從函式庫載入圖示元素。
    
    引數：
        icon_name: 圖示名稱（例如 "EC2", "VPC"）
        library_path: 圖示函式庫目錄的路徑
    
    傳回：
        圖示元素列表
    """
    icon_file = library_path / "icons" / f"{icon_name}.json"
    
    if not icon_file.exists():
        raise FileNotFoundError(f"找不到圖示檔案：{icon_file}")
    
    with open(icon_file, 'r', encoding='utf-8') as f:
        icon_data = json.load(f)
    
    return icon_data.get('elements', [])


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


def create_text_label(text: str, x: float, y: float) -> Dict[str, Any]:
    """
    建立文字標籤元素。
    
    引數：
        text: 標籤文字
        x: X 座標
        y: Y 座標
    
    傳回：
        文字元素字典
    """
    return {
        "id": generate_unique_id(),
        "type": "text",
        "x": x,
        "y": y,
        "width": len(text) * 10,  # 大約寬度
        "height": 20,
        "angle": 0,
        "strokeColor": "#1e1e1e",
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
        "seed": 1000000000 + hash(text) % 1000000000,
        "version": 1,
        "versionNonce": 2000000000 + hash(text) % 1000000000,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1738195200000,
        "link": None,
        "locked": False,
        "text": text,
        "fontSize": 16,
        "fontFamily": 5,  # Excalifont
        "textAlign": "center",
        "verticalAlign": "top",
        "containerId": None,
        "originalText": text,
        "autoResize": True,
        "lineHeight": 1.25
    }


def add_icon_to_diagram(
    diagram_path: Path,
    icon_name: str,
    x: float,
    y: float,
    library_path: Path,
    label: str = None
) -> None:
    """
    將圖示新增至 Excalidraw 圖表。
    
    引數：
        diagram_path: Excalidraw 圖表檔案的路徑
        icon_name: 要新增的圖示名稱
        x: 目標 X 座標
        y: 目標 Y 座標
        library_path: 圖示函式庫目錄的路徑
        label: 可選的，在圖示下方新增的文字標籤
    """
    # 載入圖示元素
    print(f"正在載入圖示：{icon_name}")
    icon_elements = load_icon(icon_name, library_path)
    print(f"  已載入 {len(icon_elements)} 個元素")
    
    # 轉換圖示元素
    print(f"正在轉換至位置 ({x}, {y})")
    transformed_elements = transform_icon_elements(icon_elements, x, y)
    
    # 計算圖示邊界框以進行標籤定位
    if label and transformed_elements:
        min_x, min_y, max_x, max_y = calculate_bounding_box(transformed_elements)
        icon_width = max_x - min_x
        icon_height = max_y - min_y
        
        # 將標籤放置在圖示下方，置中對齊
        label_x = min_x + (icon_width / 2) - (len(label) * 5)
        label_y = max_y + 10
        
        label_element = create_text_label(label, label_x, label_y)
        transformed_elements.append(label_element)
        print(f"  已新增標籤：'{label}'")
    
    # 載入圖表
    print(f"正在載入圖表：{diagram_path}")
    with open(diagram_path, 'r', encoding='utf-8') as f:
        diagram = json.load(f)
    
    # 新增轉換後的元素
    if 'elements' not in diagram:
        diagram['elements'] = []
    
    original_count = len(diagram['elements'])
    diagram['elements'].extend(transformed_elements)
    print(f"  已新增 {len(transformed_elements)} 個元素（總計：{original_count} -> {len(diagram['elements'])}）")
    
    # 儲存圖表
    print(f"正在儲存圖表")
    with open(diagram_path, 'w', encoding='utf-8') as f:
        json.dump(diagram, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 成功將 '{icon_name}' 圖示新增至圖表中")


def main():
    """主進入點。"""
    if len(sys.argv) < 5:
        print("用法：python add-icon-to-diagram.py <diagram_path> <icon_name> <x> <y> [選項]")
        print("
選項：")
        print("  --library-path PATH    圖示函式庫目錄的路徑")
        print("  --label TEXT           在圖示下方新增文字標籤")
        print("  --use-edit-suffix      透過 .excalidraw.edit 進行編輯以規避編輯器覆寫問題（預設啟用；使用 --no-use-edit-suffix 即可停用）")
        print("
範例：")
        print("  python add-icon-to-diagram.py diagram.excalidraw EC2 500 300")
        print("  python add-icon-to-diagram.py diagram.excalidraw EC2 500 300 --label '網頁伺服器'")
        sys.exit(1)
    
    diagram_path = Path(sys.argv[1])
    icon_name = sys.argv[2]
    x = float(sys.argv[3])
    y = float(sys.argv[4])
    
    # 預設函式庫路徑
    script_dir = Path(__file__).parent
    default_library_path = script_dir.parent / "libraries" / "aws-architecture-icons"
    
    # 解析選擇性引數
    library_path = default_library_path
    label = None
    # 預設：使用編輯後綴以規避編輯器覆寫問題
    use_edit_suffix = True
    
    i = 5
    while i < len(sys.argv):
        if sys.argv[i] == '--library-path':
            if i + 1 < len(sys.argv):
                library_path = Path(sys.argv[i + 1])
                i += 2
            else:
                print("錯誤：--library-path 需要一個路徑引數")
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
    
    if not library_path.exists():
        print(f"錯誤：找不到函式庫路徑：{library_path}")
        sys.exit(1)
    
    try:
        work_path, final_path = prepare_edit_path(diagram_path, use_edit_suffix)
        add_icon_to_diagram(work_path, icon_name, x, y, library_path, label)
        finalize_edit_path(work_path, final_path)
    except Exception as e:
        print(f"錯誤：{e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
