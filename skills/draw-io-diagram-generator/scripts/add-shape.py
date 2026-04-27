#!/usr/bin/env python3
"""
add-shape.py — 將新的頂點形狀新增至現有的 .drawio 圖表檔案。

用法：
    python scripts/add-shape.py <diagram.drawio> <label> <x> <y> [選項]

範例：
    python scripts/add-shape.py docs/flowchart.drawio "New Step" 400 300
    python scripts/add-shape.py docs/arch.drawio "Decision" 400 400 \\
        --width 160 --height 80 \\
        --style "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"
    python scripts/add-shape.py docs/arch.drawio "Preview Node" 200 200 --dry-run
"""
from __future__ import annotations

import argparse
import hashlib
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path


DEFAULT_STYLE = "rounded=1;whiteSpace=wrap;html=1;"


def _indent_xml(elem: ET.Element, level: int = 0) -> None:
    """就地縮排 XML 樹。取代 ET.indent() 以相容於 Python 3.8。"""
    indent = "\n" + "  " * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indent + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = indent
        for child in elem:
            _indent_xml(child, level + 1)
        # last child tail
        if not child.tail or not child.tail.strip():
            child.tail = indent
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent
    if not level:
        elem.tail = "\n"


def _generate_id(label: str, x: int, y: int) -> str:
    """根據標籤 + 位置 + 時間產生一個短的確定性 ID。"""
    seed = f"{label}:{x}:{y}:{time.time_ns()}"
    return "auto_" + hashlib.sha1(seed.encode()).hexdigest()[:8]


def add_shape(
    path: Path,
    label: str,
    x: int,
    y: int,
    width: int = 120,
    height: int = 60,
    style: str = DEFAULT_STYLE,
    diagram_index: int = 0,
    dry_run: bool = False,
) -> int:
    """
    解析 .drawio 檔案，在指定的圖表頁面中插入新的頂點儲存格，
    並將檔案寫回（除非 dry_run 為 True）。

    傳回值：
        成功傳回 0，失敗傳回 1。
    """
    # 藉由寫入原始位元組來保留原始的 XML 宣告 / 縮排。
    ET.register_namespace("", "")

    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        print(f"錯誤：'{path}' 中的 XML 解析錯誤：{exc}")
        return 1

    mxfile = tree.getroot()
    if mxfile.tag != "mxfile":
        print(f"錯誤：根元件必須是 <mxfile>，得到 <{mxfile.tag}>")
        return 1

    diagrams = mxfile.findall("diagram")
    if diagram_index >= len(diagrams):
        print(
            f"錯誤：圖表頁面索引 {diagram_index} 超出範圍"
            f"（檔案中有 {len(diagrams)} 個圖表）"
        )
        return 1

    diagram = diagrams[diagram_index]
    graph_model = diagram.find("mxGraphModel")
    if graph_model is None:
        print(
            "錯誤：找不到 <mxGraphModel> 作為直接子元件。"
            "不支援壓縮的圖表。"
        )
        return 1

    root_elem = graph_model.find("root")
    if root_elem is None:
        print("錯誤：在 <mxGraphModel> 中找不到 <root> 元件")
        return 1

    # 決定父 ID — 預設為 "1"（預設圖層）
    parent_id = "1"
    existing_ids = {c.get("id") for c in root_elem.findall("mxCell") if c.get("id")}
    if parent_id not in existing_ids:
        # 回退到第一個不是 "0" 的儲存格 ID
        for c in root_elem.findall("mxCell"):
            cid = c.get("id")
            if cid and cid != "0":
                parent_id = cid
                break

    # 產生唯一的 ID
    new_id = _generate_id(label, x, y)
    while new_id in existing_ids:
        new_id = _generate_id(label + "_", x, y)

    # 建立新的 mxCell 元件
    new_cell = ET.Element("mxCell")
    new_cell.set("id", new_id)
    new_cell.set("value", label)
    new_cell.set("style", style)
    new_cell.set("vertex", "1")
    new_cell.set("parent", parent_id)

    geom = ET.SubElement(new_cell, "mxGeometry")
    geom.set("x", str(x))
    geom.set("y", str(y))
    geom.set("width", str(width))
    geom.set("height", str(height))
    geom.set("as", "geometry")

    if dry_run:
        print("測試執行 — 新的儲存格 XML（未寫入）：")
        print(ET.tostring(new_cell, encoding="unicode"))
        print(f"\n將新增至 '{path}' 中的圖表 '{diagram.get('name', diagram_index)}'")
        return 0

    root_elem.append(new_cell)

    # 寫回並保留 XML 宣告（使用 _indent_xml 以相容於 Python 3.8）
    _indent_xml(tree.getroot())
    tree.write(str(path), encoding="utf-8", xml_declaration=True)

    print(
        f"已將形狀 id=\"{new_id}\" 新增至 {path} 的第 {diagram_index} 頁"
        f"（'{diagram.get('name', '')}'）"
    )
    return 0


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="將形狀新增至現有的 .drawio 圖表檔案。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("diagram", help=".drawio 檔案的路徑")
    parser.add_argument("label", help="新形狀的文字標籤")
    parser.add_argument("x", type=int, help="X 座標（像素）")
    parser.add_argument("y", type=int, help="Y 座標（像素）")
    parser.add_argument("--width", type=int, default=120, help="形狀寬度（預設值：120）")
    parser.add_argument("--height", type=int, default=60, help="形狀高度（預設值：60）")
    parser.add_argument(
        "--style",
        default=DEFAULT_STYLE,
        help=f'draw.io 樣式字串（預設值："{DEFAULT_STYLE}"）',
    )
    parser.add_argument(
        "--diagram-index",
        type=int,
        default=0,
        help="要新增至的圖表頁面索引（從 0 開始，預設值：0）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="列印新的儲存格 XML 而不寫入檔案",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    path = Path(args.diagram)

    if not path.exists():
        print(f"錯誤：找不到檔案：{path}")
        return 1
    if not path.is_file():
        print(f"錯誤：不是一個檔案：{path}")
        return 1

    return add_shape(
        path=path,
        label=args.label,
        x=args.x,
        y=args.y,
        width=args.width,
        height=args.height,
        style=args.style,
        diagram_index=args.diagram_index,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
