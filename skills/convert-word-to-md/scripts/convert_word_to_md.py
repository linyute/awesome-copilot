#!/usr/bin/env python3
"""使用 Microsoft 的 MarkItDown 將 Word (.docx) 文件轉換為 Markdown，
並將內嵌影像擷取至實際檔案中（MarkItDown 僅發出
截斷的 `data:image/...;base64...` 預留位置，而非實際影像資料）。

用法：
    python convert_word_to_md.py <input> [-o OUTPUT] [--recursive]

<input> 可以是：
  - 單一 .docx 檔案的路徑，或
  - 目錄的路徑（批次模式：轉換直接位於其底下的每個 .docx 檔案；
    傳遞 --recursive 以遞迴至子目錄）。

輸出：
  對於每個來源 .docx（命名為「<name>.docx」），將建立一個資料夾
  包含 Markdown 和其影像，採用以下版面配置：

      <name>/
          img/
              img001.<ext>
              img002.<ext>
              ...
          <name>.md          （影像參照是相對的：img/imgNNN.ext）

  - 單一檔案模式：在來源檔案旁邊建立「<name>/」資料夾，
    或者如果指定了 -o/--output（視為精確目的地資料夾）則在該處建立。
  - 批次/目錄模式：在每個來源檔案旁邊建立「<name>/」資料夾，
    或者如果指定了 -o/--output（視為父目錄，若不存在則建立）則在該處建立，
    當使用 --recursive 時會保留相對子資料夾結構。
  - 如果文件沒有內嵌影像，則不會建立「img/」資料夾。

結束代碼：
  0 - 所有請求的轉換均成功
  1 - 一個或多個轉換失敗（批次模式中的部分成功）
  2 - 未安裝所需的相依性（"markitdown"）
  3 - 無效的輸入（找不到路徑，或單一檔案輸入不是 .docx）
"""
import argparse
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

_W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
_R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

# MarkItDown 將影像內嵌為常值截斷的預留位置，例如
# ![alt](data:image/png;base64...) —— 非實際 base64 資料。此模式
# 匹配該預留位置，以便將其替換為實際相對路徑。
_PLACEHOLDER_IMAGE_RE = re.compile(
    r'!\[([^\]]*)\]\(data:image/[a-zA-Z0-9.+-]+;base64[^)]*\)'
)


def _import_markitdown():
    """匯入 MarkItDown，如果不存在則失敗並顯示清楚、可操作的訊息。"""
    try:
        from markitdown import MarkItDown
        return MarkItDown
    except ImportError:
        print(
            "錯誤：未安裝 'markitdown' 套件。\n"
            "請參閱此技能的 references/setup.md，或執行：\n"
            '    pip install "markitdown[docx]"',
            file=sys.stderr,
        )
        sys.exit(EXIT_MISSING_DEPENDENCY)


def _document_order_media(docx_path: Path):
    """依影像在 word/document.xml 中出現的順序傳回 [(rel_id, media_zip_path), ...]
    （透過 r:embed / r:id），並透過
    word/_rels/document.xml.rels 進行解析。如果文件沒有本文
    部分或沒有影像，則傳回 []（例如損毀的 docx 會優雅地退回）。"""
    try:
        with zipfile.ZipFile(docx_path) as z:
            if "word/document.xml" not in z.namelist() or \
               "word/_rels/document.xml.rels" not in z.namelist():
                return []
            rels_xml = z.read("word/_rels/document.xml.rels")
            doc_xml = z.read("word/document.xml")
    except (zipfile.BadZipFile, KeyError, OSError):
        return []

    try:
         rels_root = ET.fromstring(rels_xml)
         doc_root = ET.fromstring(doc_xml)
    except ET.ParseError:
         return []

    rel_map = {}
    for rel in rels_root.findall(f"{{{_REL_NS}}}Relationship"):
        rel_map[rel.get("Id")] = rel.get("Target")

    ordered_rel_ids = []
    for elem in doc_root.iter():
        tag = elem.tag.rsplit("}", 1)[-1]
        if tag == "blip":
            rid = elem.get(f"{{{_R_NS}}}embed")
        elif tag == "imagedata":
            rid = elem.get(f"{{{_R_NS}}}id")
        else:
            rid = None
        if rid:
            ordered_rel_ids.append(rid)
    ordered_media = []
    for rid in ordered_rel_ids:
        target = rel_map.get(rid)
        if not target or "media/" not in target:
            continue
        import posixpath
        media_path = (
            target.lstrip("/")
            if target.startswith("/")
            else posixpath.normpath(
                 target if target.startswith("word/") else posixpath.join("word", target)
             )
        )
        ordered_media.append((rid, media_path))
    return ordered_media


def _extract_images(docx_path: Path, img_dir: Path):
    """從 docx_path 擷取內嵌影像至 img_dir，檔名為 img001.ext、
    img002.ext，... 依文件順序。傳回寫入的檔案名稱清單
    （相對於 img_dir），並依該相同順序排列。"""
    ordered_media = _document_order_media(docx_path)
    if not ordered_media:
        return []

    written = []
    with zipfile.ZipFile(docx_path) as z:
        names_in_zip = set(z.namelist())
        for idx, (rid, media_path) in enumerate(ordered_media, start=1):
            if media_path not in names_in_zip:
                print(f"警告：在 {docx_path} 中找不到 {media_path} (rel {rid})", file=sys.stderr)
                continue
            ext = Path(media_path).suffix.lstrip(".").lower() or "bin"
            if ext == "jpg":
                ext = "jpeg"
            out_name = f"img{idx:03d}.{ext}"
            img_dir.mkdir(parents=True, exist_ok=True)
            (img_dir / out_name).write_bytes(z.read(media_path))
            written.append(out_name)
    return written


def _rewrite_image_refs(markdown_text: str, image_files) -> str:
    """將 MarkItDown 截斷的 base64 影像預留位置替換為實際的
    相對 img/imgNNN.ext 參照，由左至右順序。如果
    計數不匹配（非預期），則預留位置會保持不變，
    以避免不匹配參照的風險。"""
    matches = list(_PLACEHOLDER_IMAGE_RE.finditer(markdown_text))
    if not matches:
        return markdown_text
    if len(matches) != len(image_files):
        print(
            f"警告：在 Markdown 中找到 {len(matches)} 個影像預留位置，但"
            f"已擷取 {len(image_files)} 個影像檔案；保留預留位置"
            "不替換，以避免不匹配參照的風險。",
            file=sys.stderr,
        )
        return markdown_text

    counter = {"i": 0}

    def _replace(m):
        name = image_files[counter["i"]]
        counter["i"] += 1
        return f"![{m.group(1)}](img/{name})"

    return _PLACEHOLDER_IMAGE_RE.sub(_replace, markdown_text)


def convert_one(md, source: Path, dest_dir: Path) -> bool:
    """將單一 .docx 檔案轉換為包含 Markdown 檔案和
    已擷取影像之 'img/' 資料夾的 '<name>/' 資料夾。成功時傳回 True。"""
    try:
      result = md.convert(str(source))
    except ImportError as exc:
      print(
        f"錯誤：轉換 '{source.name}' 所需的相依性未安裝。\n"
        f"  {exc}\n"
        "請參閱此技能的 references/setup.md，或執行：\n"
        '    pip install "markitdown[docx]"',
        file=sys.stderr,
      )
      sys.exit(EXIT_MISSING_DEPENDENCY)
    except Exception as exc:  # noqa: BLE001 - surface any conversion error
        print(f"失敗  {source} -> {exc}", file=sys.stderr)
        return False

    try:
        if dest_dir.exists():
            shutil.rmtree(dest_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)
        image_files = _extract_images(source, dest_dir / "img")
        text = _rewrite_image_refs(result.text_content, image_files)
        md_path = dest_dir / f"{source.stem}.md"
        md_path.write_text(text, encoding="utf-8")
    except OSError as exc:
        print(f"失敗  {source} -> 無法在 {dest_dir} 中寫入輸出：{exc}", file=sys.stderr)
        return False

    img_note = f", {len(image_files)} image(s)" if image_files else ""
    print(f"確定      {source} -> {md_path}{img_note}")
    return True


def find_docx_files(root: Path, recursive: bool):
    """傳回 root 直接/遞迴底下的 (docx_files, skipped_count)。"""
    pattern_iter = root.rglob("*") if recursive else root.iterdir()
    docx_files = []
    skipped = 0
    for entry in pattern_iter:
        if entry.is_dir():
            continue
        if entry.suffix.lower() == ".docx":
            docx_files.append(entry)
        else:
            skipped += 1
    return sorted(docx_files), skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("input", help="指向 .docx 檔案或 .docx 檔案目錄的路徑")
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

    if source.is_file() and source.suffix.lower() != ".docx":
         print(
             f"錯誤：不支援的檔案類型 '{source.suffix}'。"
             "此技能僅轉換 .docx 檔案。",
             file=sys.stderr,
         )
         return EXIT_INVALID_INPUT

    MarkItDown = _import_markitdown()
    md = MarkItDown()

    if source.is_file():
        dest_dir = Path(args.output) if args.output else source.parent / source.stem
        return EXIT_OK if convert_one(md, source, dest_dir) else EXIT_CONVERSION_FAILED

    # 目錄 / 批次模式
    docx_files, skipped = find_docx_files(source, args.recursive)
    if skipped:
        print(f"提示：已略過 {source} 中的 {skipped} 個非 .docx 檔案")
    if not docx_files:
        print(f"錯誤：在 {source} 下找不到 .docx 檔案", file=sys.stderr)
        return EXIT_INVALID_INPUT

    out_dir = Path(args.output) if args.output else None
    success_count = 0
    for docx_path in docx_files:
        if out_dir is not None:
            rel = docx_path.relative_to(source)
            dest_dir = out_dir / rel.parent / docx_path.stem
        else:
            dest_dir = docx_path.parent / docx_path.stem
        if convert_one(md, docx_path, dest_dir):
            success_count += 1

    total = len(docx_files)
    print(f"\n已轉換 {success_count}/{total} 個檔案。")
    return EXIT_OK if success_count == total else EXIT_CONVERSION_FAILED


if __name__ == "__main__":
    sys.exit(main())
