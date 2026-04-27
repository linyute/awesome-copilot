#!/usr/bin/env python3
"""
validate-drawio.py — 驗證 .drawio 圖表檔案的 XML 結構。

用法：
    python scripts/validate-drawio.py <path-to-file.drawio>

結束代碼：
    0  所有檢查皆通過
    1  發現一個或多個驗證錯誤
"""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def _error(msg: str, errors: list) -> None:
    errors.append(msg)
    print(f"  錯誤：{msg}")


def validate_file(path: Path) -> list[str]:
    """解析並驗證單個 .drawio 檔案。傳回錯誤字串列表。"""
    errors: list[str] = []

    # --- XML 格式正確性 ---
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        return [f"XML 解析錯誤：{exc}"]

    root = tree.getroot()
    if root.tag != "mxfile":
        _error(f"根元件必須是 <mxfile>，得到 <{root.tag}>", errors)
        return errors

    diagrams = root.findall("diagram")
    if not diagrams:
        _error("在 <mxfile> 中找不到 <diagram> 元件", errors)
        return errors

    for d_idx, diagram in enumerate(diagrams):
        d_name = diagram.get("name", f"page-{d_idx}")
        prefix = f"[圖表 '{d_name}']"

        # 尋找 mxGraphModel（可能是直接子元件或 base64 編碼；我們僅處理直接子元件）
        graph_model = diagram.find("mxGraphModel")
        if graph_model is None:
            print(f"  跳過 {prefix}：找不到 mxGraphModel 作為直接子元件（可能已壓縮）")
            continue

        root_elem = graph_model.find("root")
        if root_elem is None:
            _error(f"{prefix} 在 <mxGraphModel> 中缺少 <root> 元件", errors)
            continue

        cells = root_elem.findall("mxCell")
        cell_ids: dict[str, ET.Element] = {}
        has_id0 = False
        has_id1 = False

        # --- 收集所有 ID，檢查根儲存格 ---
        for cell in cells:
            cid = cell.get("id")
            if cid is None:
                _error(f"{prefix} 發現沒有 'id' 屬性的 <mxCell>", errors)
                continue
            if cid in cell_ids:
                _error(f"{prefix} 重複的儲存格 id='{cid}'", errors)
            cell_ids[cid] = cell
            if cid == "0":
                has_id0 = True
            if cid == "1":
                has_id1 = True

        if not has_id0:
            _error(f"{prefix} 缺少必要的根儲存格 id='0'", errors)
        if not has_id1:
            _error(f"{prefix} 缺少必要的預設圖層儲存格 id='1'", errors)

        # L2: id="0" 必須是第一個儲存格，id="1" 必須是第二個儲存格
        if len(cells) >= 1 and cells[0].get("id") != "0":
            _error(
                f"{prefix} 第一個 <mxCell> 的 id 必須為 '0'，"
                f"得到 id='{cells[0].get('id')}'",
                errors,
            )
        if len(cells) >= 2 and cells[1].get("id") != "1":
            _error(
                f"{prefix} 第二個 <mxCell> 的 id 必須為 '1'，"
                f"得到 id='{cells[1].get('id')}'",
                errors,
            )
        # L3: id="1" 必須具有 parent="0"
        for cell in cells:
            if cell.get("id") == "1" and cell.get("parent") != "0":
                _error(
                    f"{prefix} 儲存格 id='1' 的 parent 必須為 '0'，"
                    f"得到 parent='{cell.get('parent')}'",
                    errors,
                )
        # H2: 每個圖表頁面都必須包含一個標題儲存格
        # （一個樣式包含 'text;' 和 'fontSize=18' 的頂點）
        def _is_title_style(style: str) -> bool:
            """如果樣式字串識別出 draw.io 標題文字儲存格，則傳回 True。"""
            return (
                (style.startswith("text;") or ";text;" in style)
                and "fontSize=18" in style
            )

        has_title_cell = any(
            c.get("vertex") == "1" and _is_title_style(c.get("style") or "")
            for c in cells
        )
        if not has_title_cell:
            _error(
                f"{prefix} 找不到標題儲存格 — 請在頁面頂部新增一個樣式"
                "包含 'text;' 和 'fontSize=18' 的頂點",
                errors,
            )

        # --- 檢查每個儲存格的結構有效性 ---
        for cell in cells:
            cid = cell.get("id", "<unknown>")
            is_vertex = cell.get("vertex") == "1"
            is_edge = cell.get("edge") == "1"

            # 父元件必須存在（跳過沒有父元件的根儲存格 id=0）
            parent = cell.get("parent")
            if cid != "0":
                if parent is None:
                    _error(f"{prefix} 儲存格 id='{cid}' 缺少 'parent' 屬性", errors)
                elif parent not in cell_ids:
                    _error(
                        f"{prefix} 儲存格 id='{cid}' 參照了未知的 parent='{parent}'",
                        errors,
                    )

            # 頂點儲存格必須具有 mxGeometry
            if is_vertex:
                geom = cell.find("mxGeometry")
                if geom is None:
                    _error(
                        f"{prefix} 頂點儲存格 id='{cid}' 缺少 <mxGeometry>",
                        errors,
                    )

            # 邊緣儲存格必須具有來源 (source) 和目標 (target)，且兩者都必須存在。
            # 例外：浮動邊緣（例如循序圖生命線）在 mxGeometry 中使用
            # sourcePoint/targetPoint，而不是 source/target 屬性。
            if is_edge:
                source = cell.get("source")
                target = cell.get("target")
                geom = cell.find("mxGeometry")
                has_source_point = geom is not None and any(
                    p.get("as") == "sourcePoint" for p in geom.findall("mxPoint")
                )
                has_target_point = geom is not None and any(
                    p.get("as") == "targetPoint" for p in geom.findall("mxPoint")
                )
                if source is None and not has_source_point:
                    _error(
                        f"{prefix} 邊緣儲存格 id='{cid}' 缺少 'source' 屬性"
                        f"（且 mxGeometry 中沒有 sourcePoint）",
                        errors,
                    )
                elif source is not None and source not in cell_ids:
                    _error(
                        f"{prefix} 邊緣 id='{cid}' 參照了未知的 source='{source}'",
                        errors,
                    )
                if target is None and not has_target_point:
                    _error(
                        f"{prefix} 邊緣儲存格 id='{cid}' 缺少 'target' 屬性"
                        f"（且 mxGeometry 中沒有 targetPoint）",
                        errors,
                    )
                elif target is not None and target not in cell_ids:
                    _error(
                        f"{prefix} 邊緣 id='{cid}' 參照了未知的 target='{target}'",
                        errors,
                    )

    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print("用法：python validate-drawio.py <diagram.drawio>")
        return 1

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"錯誤：找不到檔案：{path}")
        return 1
    if not path.is_file():
        print(f"錯誤：不是一個檔案：{path}")
        return 1

    print(f"正在驗證：{path}")
    errors = validate_file(path)

    if errors:
        print(f"\n失敗 — 發現 {len(errors)} 個錯誤。")
        return 1

    print("通過 — 未發現錯誤。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
