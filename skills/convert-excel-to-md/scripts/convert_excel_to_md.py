#!/usr/bin/env python3
"""使用 Microsoft 的 MarkItDown 將 Excel (.xlsx) 活頁簿轉換為 Markdown，
並將內嵌影像擷取至實際檔案中並置於正確的
工作表下（MarkItDown 的 XLSX 轉換器僅將工作表資料擷取為表格 —— 它
完全不支援內嵌影像）。

用法：
    python convert_excel_to_md.py <input> [-o OUTPUT] [--recursive]

<input> 可以是：
  - 單一 .xlsx 檔案的路徑，或
  - 目錄的路徑（批次模式：轉換直接位於其底下的每個 .xlsx 檔案；
    傳遞 --recursive 以遞迴至子目錄）。

輸出：
  對於每個來源 .xlsx（命名為「<name>.xlsx」），將建立一個資料夾
  包含 Markdown 和其影像，採用以下版面配置：

      <name>/
          img/
              Sheet1_img001.<ext>
              Sheet2_img001.<ext>
              ...
          <name>.md

  MarkItDown 將每個工作表轉譯為其專屬的「## <SheetName>」區段與
  Markdown 表格。此指令碼獨立地將內嵌影像對應至它們
  所屬的工作表（透過 .xlsx 壓縮檔的繪圖關係），並在該工作表的
  表格正後方、下一個「## 」標題之前插入「#### Images in this sheet」區塊。
  這是針對每個工作表的置放（非
  精確的儲存格位置），這是 MarkItDown 穩定
  輸出錨點所允許的最細粒度。

  - 單一檔案模式：在來源檔案旁邊建立「<name>/」資料夾，
    或者如果指定了 -o/--output（視為精確的目的地資料夾）則在該處建立。
  - 批次/目錄模式：在每個來源檔案旁邊建立「<name>/」資料夾，
    或者如果指定了 -o/--output（視為父目錄，若不存在則建立）則在該處建立，
    當使用 --recursive 時會保留相對子資料夾結構。
  - 如果活頁簿沒有內嵌影像，則不會建立「img/」資料夾或
    「Images in this sheet」區段。

結束代碼：
  0 - 所有請求的轉換均成功
  1 - 一個或多個轉換失敗（批次模式中的部分成功）
  2 - 未安裝所需的相依性（"markitdown"）
  3 - 無效的輸入（找不到路徑，或單一檔案輸入不是 .xlsx）
"""
import argparse
import posixpath
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

EXIT_OK = 0
EXIT_CONVERSION_FAILED = 1
EXIT_MISSING_DEPENDENCY = 2
EXIT_INVALID_INPUT = 3

_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
_MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
_A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

# 匹配 MarkItDown 的每個工作表標題，例如 "## Sheet1"
_SHEET_HEADER_RE = re.compile(r"^## (.+)$", re.MULTILINE)


def _import_markitdown():
    """匯入 MarkItDown，如果不存在則失敗並顯示清楚、可操作的訊息。"""
    try:
        from markitdown import MarkItDown
        return MarkItDown
    except ImportError:
        print(
            "錯誤：未安裝 'markitdown' 套件。\n"
            "請參閱此技能的 references/setup.md，或執行：\n"
            '    pip install "markitdown[xlsx]"',
            file=sys.stderr,
        )
        sys.exit(EXIT_MISSING_DEPENDENCY)


def _normalize_rel_path(base_dir: str, target: str) -> str:
    """解析相對於包含參照它的部分的目錄之關係目標
    （可能是相對的，例如 '../media/image1.png'）。"""
    if target.startswith("/"):
        return target.lstrip("/")
    return posixpath.normpath(posixpath.join(base_dir, target))


def _sheet_name_to_media(xlsx_path: Path):
    """透過走訪 workbook.xml -> worksheet -> drawing -> media 關係，
    以每個工作表在文件中的順序傳回 {sheet_name: [media_zip_path, ...]}。
    如果任何內容遺失/損毀則傳回 {}（優雅地退回 —— 影像將
    不會為該工作表進行擷取）。"""
    try:
        with zipfile.ZipFile(xlsx_path) as z:
            names = set(z.namelist())
            if "xl/workbook.xml" not in names or "xl/_rels/workbook.xml.rels" not in names:
                return {}
            workbook_xml = z.read("xl/workbook.xml")
            workbook_rels_xml = z.read("xl/_rels/workbook.xml.rels")

            sheet_rid = {}
            for sheet_el in ET.fromstring(workbook_xml).iter(f"{{{_MAIN_NS}}}sheet"):
                name = sheet_el.get("name")
                rid = sheet_el.get(f"{{{_R_NS}}}id")
                if name and rid:
                    sheet_rid[name] = rid

            rid_target = {}
            for rel in ET.fromstring(workbook_rels_xml).findall(f"{{{_REL_NS}}}Relationship"):
                rid_target[rel.get("Id")] = rel.get("Target")

            result = {}
            for sheet_name, rid in sheet_rid.items():
                target = rid_target.get(rid)
                if not target:
                    continue
                # workbook.xml.rels 目標通常相對於 "xl/"，
                # 但 OOXML 也允許套件絕對路徑目標（以 "/" 開頭）。
                sheet_path = _normalize_rel_path("xl", target)
                if sheet_path not in names or "/" not in sheet_path:
                    continue
                sheet_dir, sheet_file = sheet_path.rsplit("/", 1)
                sheet_rels_path = f"{sheet_dir}/_rels/{sheet_file}.rels"
                if sheet_rels_path not in names:
                    continue

                drawing_rid = None
                for d in ET.fromstring(z.read(sheet_path)).iter(f"{{{_MAIN_NS}}}drawing"):
                    drawing_rid = d.get(f"{{{_R_NS}}}id")
                    break
                if not drawing_rid:
                    continue

                drawing_target = None
                for rel in ET.fromstring(z.read(sheet_rels_path)).findall(f"{{{_REL_NS}}}Relationship"):
                    if rel.get("Id") == drawing_rid:
                        drawing_target = rel.get("Target")
                        break
                if not drawing_target:
                    continue
                drawing_path = _normalize_rel_path(sheet_dir, drawing_target)
                if drawing_path not in names or "/" not in drawing_path:
                    continue
                drawing_dir, drawing_file = drawing_path.rsplit("/", 1)
                drawing_rels_path = f"{drawing_dir}/_rels/{drawing_file}.rels"
                if drawing_rels_path not in names:
                    continue

                drawing_rel_map = {}
                for rel in ET.fromstring(z.read(drawing_rels_path)).findall(f"{{{_REL_NS}}}Relationship"):
                    drawing_rel_map[rel.get("Id")] = rel.get("Target")

                media_paths = []
                for blip in ET.fromstring(z.read(drawing_path)).iter(f"{{{_A_NS}}}blip"):
                    embed_rid = blip.get(f"{{{_R_NS}}}embed")
                    if not embed_rid:
                        continue
                    rel_target = drawing_rel_map.get(embed_rid)
                    if not rel_target:
                        continue
                    media_path = _normalize_rel_path(drawing_dir, rel_target)
                    if media_path in names:
                        media_paths.append(media_path)

                if media_paths:
                    result[sheet_name] = media_paths
            return result
    except (zipfile.BadZipFile, KeyError, OSError, ET.ParseError):
        return {}


def _sanitize_filename_part(name: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", name).strip("_")
    return safe or "sheet"


def extract_images(xlsx_path: Path, img_dir: Path):
    """從 xlsx_path 擷取內嵌影像，依工作表名稱群組。
    按每個工作表順序傳回 {sheet_name: [filename, ...]}。檔案命名為
    '<sanitized_sheet_name>_img{N:03d}.<ext>'。"""
    sheet_media = _sheet_name_to_media(xlsx_path)
    if not sheet_media:
        return {}

    written = {}
    with zipfile.ZipFile(xlsx_path) as z:
        names_in_zip = set(z.namelist())
        for sheet_idx, (sheet_name, media_paths) in enumerate(sheet_media.items(), start=1):
            safe_name = f"sheet{sheet_idx:03d}_{_sanitize_filename_part(sheet_name)}"
            files = []
            for idx, media_path in enumerate(media_paths, start=1):
                if media_path not in names_in_zip:
                    print(f"警告：在 {xlsx_path} 中找不到 {media_path}", file=sys.stderr)
                    continue
                ext = Path(media_path).suffix.lstrip(".").lower() or "bin"
                if ext == "jpg":
                    ext = "jpeg"
                out_name = f"{safe_name}_img{idx:03d}.{ext}"
                img_dir.mkdir(parents=True, exist_ok=True)
                (img_dir / out_name).write_bytes(z.read(media_path))
                files.append(out_name)
            if files:
                written[sheet_name] = files
    return written


def insert_sheet_images(markdown_text: str, sheet_images) -> str:
    """在每個工作表的區段正後方（在下一個 '## ' 標題或文字結尾之前）
    插入一個 '#### Images in this sheet' 區塊。如果工作表沒有
    影像，或完全找不到 '## ' 標題，則該部分的文字將保持不變
    傳回。"""
    if not sheet_images:
        return markdown_text
    matches = list(_SHEET_HEADER_RE.finditer(markdown_text))
    if not matches:
        return markdown_text

    pieces = []
    last_end = 0
    for i, m in enumerate(matches):
        sheet_name = m.group(1).removesuffix("\r")
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown_text)
        pieces.append(markdown_text[last_end:start])
        section = markdown_text[start:end].rstrip("\n")
        images = sheet_images.get(sheet_name)
        if images:
            section += "\n\n#### Images in this sheet\n\n"
            section += "\n".join(f"![{name}](img/{name})" for name in images)
        pieces.append(section + "\n\n")
        last_end = end
    pieces.append(markdown_text[last_end:])
    return "".join(pieces).rstrip() + "\n"


def convert_one(md, source: Path, dest_dir: Path) -> bool:
    """將單一 .xlsx 檔案轉換為包含 Markdown 檔案和
    已擷取影像之 'img/' 資料夾的 '<name>/' 資料夾。成功時傳回 True。"""
    try:
        result = md.convert(str(source))
    except Exception as exc:  # noqa: BLE001 - surface any conversion error
        print(f"失敗  {source} -> {exc}", file=sys.stderr)
        return False

    try:
        img_dir = dest_dir / "img"
        if dest_dir.exists():
            if img_dir.exists():
              shutil.rmtree(img_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)
        sheet_images = extract_images(source, img_dir)
        text = insert_sheet_images(result.text_content, sheet_images)
        md_path = dest_dir / f"{source.stem}.md"
        md_path.write_text(text, encoding="utf-8")
    except OSError as exc:
        print(f"失敗  {source} -> 無法在 {dest_dir} 中寫入輸出：{exc}", file=sys.stderr)
        return False

    img_count = sum(len(v) for v in sheet_images.values())
    img_note = f", {img_count} image(s)" if img_count else ""
    print(f"確定      {source} -> {md_path}{img_note}")
    return True


def find_xlsx_files(root: Path, recursive: bool):
    """傳回 root 直接/遞迴底下的 (xlsx_files, skipped_count)。"""
    pattern_iter = root.rglob("*") if recursive else root.iterdir()
    xlsx_files = []
    skipped = 0
    for entry in pattern_iter:
        if entry.is_dir():
            continue
        if entry.suffix.lower() == ".xlsx":
            xlsx_files.append(entry)
        else:
            skipped += 1
    return sorted(xlsx_files), skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("input", help="指向 .xlsx 檔案或 .xlsx 檔案目錄的路徑")
    parser.add_argument(
        "-o", "--output",
        help=(
            "「<name>/」輸出的目的地資料夾（單一檔案模式），"
            "或在其下建立每個「<name>/」輸出資料夾的"
            "父目錄（批次模式）"
        ),
    )
    parser.add_argument(
        "--recursive", action="store_true",
        help="當輸入為目錄時，也搜尋子目錄",
    )
    args = parser.parse_args()

    #MarkItDown = _import_markitdown()
    #md = MarkItDown()

    source = Path(args.input)
    if not source.exists():
        print(f"錯誤：找不到輸入路徑：{source}", file=sys.stderr)
        return EXIT_INVALID_INPUT

    if source.is_file() and source.suffix.lower() != ".xlsx":
         print(
             f"錯誤：不支援的檔案類型 '{source.suffix}'。"
             "此技能僅轉換 .xlsx 檔案。",
             file=sys.stderr,
         )
         return EXIT_INVALID_INPUT

    MarkItDown = _import_markitdown()
    md = MarkItDown()

    if source.is_file():
        dest_dir = Path(args.output) if args.output else source.parent / source.stem
        return EXIT_OK if convert_one(md, source, dest_dir) else EXIT_CONVERSION_FAILED

    # 目錄 / 批次模式
    xlsx_files, skipped = find_xlsx_files(source, args.recursive)
    if skipped:
        print(f"提示：已略過 {source} 中的 {skipped} 個非 .xlsx 檔案")
    if not xlsx_files:
        print(f"錯誤：在 {source} 下找不到 .xlsx 檔案", file=sys.stderr)
        return EXIT_INVALID_INPUT

    out_dir = Path(args.output) if args.output else None
    success_count = 0
    for xlsx_path in xlsx_files:
        if out_dir is not None:
            rel = xlsx_path.relative_to(source)
            dest_dir = out_dir / rel.parent / xlsx_path.stem
        else:
            dest_dir = xlsx_path.parent / xlsx_path.stem
        if convert_one(md, xlsx_path, dest_dir):
            success_count += 1

    total = len(xlsx_files)
    print(f"\n已轉換 {success_count}/{total} 個檔案。")
    return EXIT_OK if success_count == total else EXIT_CONVERSION_FAILED


if __name__ == "__main__":
    sys.exit(main())
