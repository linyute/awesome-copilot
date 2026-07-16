#!/usr/bin/env python3
"""使用 Microsoft 的 MarkItDown 將 PDF 文件轉換為 Markdown，並透過
PyMuPDF 將內嵌影像擷取至實際檔案中（MarkItDown 的 PDF
轉換器僅擷取文字/表格 —— 它完全不會偵測或發出任何
內嵌影像的內容）。

用法：
    python convert_pdf_to_md.py <input> [-o OUTPUT] [--recursive]

<input> 可以是：
  - 單一 .pdf 檔案的路徑，或
  - 目錄的路徑（批次模式：轉換直接位於其底下的每個 .pdf 檔案；
    傳遞 --recursive 以遞迴至子目錄）。

輸出：
  對於每個來源 .pdf（命名為「<name>.pdf」），將建立一個資料夾包含
  Markdown 和其影像，採用以下版面配置：

      <name>/
          img/
              page001_img001.<ext>
              page001_img002.<ext>
              page002_img001.<ext>
              ...
          <name>.md

  重要：MarkItDown 的 PDF 文字擷取在傳回的 Markdown 中無法保留可靠的
  每頁標記（頁面只是被拼接在一起，
  或者在某些情況下作為單一未標記的文字區塊傳回）。
  這意味著沒有安全的方法可以確切知道影像在行內應該放在哪裡。
  此指令碼不是猜測並承擔將影像錯誤置於錯誤段落旁邊的風險，
  而是在 Markdown 的結尾附加一個明確標記的「## Extracted Images」區段，
  且每個包含影像的頁面都有一個「### Page N」子標題。
  這是一個深思熟慮、誠實的折衷方案 —— 將影像區段與主體文字分開閱讀。

  - 單一檔案模式：在來源檔案旁邊建立「<name>/」資料夾，
    或者如果指定了 -o/--output（視為精確目的地資料夾）則在該處建立。
  - 批次/目錄模式：在每個來源檔案旁邊建立「<name>/」資料夾，
    或者如果指定了 -o/--output（視為父目錄，若不存在則建立）則在該處建立，
    當使用 --recursive 時會保留相對子資料夾結構。
  - 如果文件沒有內嵌影像，則不會建立「img/」資料夾或「Extracted Images」區段。

結束代碼：
  0 - 所有請求的轉換均成功
  1 - 一個或多個轉換失敗（批次模式中的部分成功）
  2 - 未安裝所需的相依性（"markitdown" 或 "pymupdf"）
  3 - 無效的輸入（找不到路徑，或單一檔案輸入不是 .pdf）
"""
import argparse
import sys
import hashlib
import shutil
from pathlib import Path

EXIT_OK = 0
EXIT_CONVERSION_FAILED = 1
EXIT_MISSING_DEPENDENCY = 2
EXIT_INVALID_INPUT = 3


def _import_markitdown():
    """匯入 MarkItDown，如果不存在則失敗並顯示清楚、可操作的訊息。"""
    try:
        from markitdown import MarkItDown
        return MarkItDown
    except ImportError:
        print(
            "錯誤：未安裝 'markitdown' 套件。\n"
            "請參閱此技能的 references/setup.md，或執行：\n"
            '    pip install "markitdown[pdf]"',
            file=sys.stderr,
        )
        sys.exit(EXIT_MISSING_DEPENDENCY)


def _import_fitz():
    """匯入 PyMuPDF（模組名稱為 'fitz'），如果不存在則失敗並顯示清楚的訊息。"""
    try:
        import fitz
        import hashlib
        return fitz
    except ImportError:
        print(
            "錯誤：未安裝 'pymupdf' 套件（影像擷取所需）。\n"
            "請參閱此技能的 references/setup.md，或執行：\n"
            "    pip install pymupdf",
            file=sys.stderr,
        )
        sys.exit(EXIT_MISSING_DEPENDENCY)


def extract_images(fitz, pdf_path: Path, img_dir: Path):
  """從 pdf_path 擷取內嵌影像，依 1 開始的頁碼群組。
  按每頁影像順序傳回 {page_num: [filename, ...]}。檔案命名為
  'page{P:03d}_img{N:03d}.<ext>'。損毀/無法讀取的影像將被
  略過並顯示警告，而不是中止整個轉換。

  結合並去重複兩個來源：
    1. 透過 page.get_images(full=True) 取得影像 XObjects —— 涵蓋
       現代 PDF 中大部分的內嵌影像。
    2. 透過 page.get_text("dict") 取得行內影像區塊 —— 涵蓋直接儲存
       在頁面內容資料流中的影像，這些是 get_images() 完全遺漏的。
  去重複是透過影像位元組雜湊，因此無論是哪個來源回報，相同的點陣圖
  在同一頁上都絕不會寫入兩次。"""
  written_by_page = {}
  try:
    doc = fitz.open(str(pdf_path))
  except Exception as exc:  # noqa: BLE001
    print(f"警告：無法開啟 {pdf_path} 以進行影像擷取：{exc}", file=sys.stderr)
    return written_by_page

  try:
    for page_index in range(len(doc)):
      page = doc[page_index]
      page_label = page_index + 1
      seen_hashes: set = set()
      raw_images: list[tuple[bytes, str]] = []  # (image_bytes, ext)

      # --- 來源 1：XObject 影像 ---
      try:
        xobjects = page.get_images(full=True)
      except Exception as exc:  # noqa: BLE001
        print(
          f"警告：列舉 {pdf_path} 的第 {page_label} 頁 XObject 影像失敗：{exc}",
          file=sys.stderr,
        )
        xobjects = []

      for img in xobjects:
        xref = img[0]
        try:
          base_image = doc.extract_image(xref)
        except Exception as exc:  # noqa: BLE001
          print(
            f"警告：擷取 {pdf_path} 第 {page_label} 頁的 XObject 影像 xref={xref} 失敗：{exc}",
            file=sys.stderr,
          )
          continue
        img_bytes = base_image.get("image") or b""
        if not img_bytes:
          continue
        ext = (base_image.get("ext") or "png").lower()
        raw_images.append((img_bytes, ext))

      # --- 來源 2：透過 get_text("dict") 取得行內影像 ---
      try:
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_IMAGES).get("blocks", [])
      except Exception as exc:  # noqa: BLE001
        print(
          f"警告：擷取 {pdf_path} 第 {page_label} 頁的文字/影像字典失敗：{exc}",
          file=sys.stderr,
        )
        blocks = []

      for block in blocks:
        # 影像區塊的類型為 1
        if block.get("type") != 1:
          continue
        img_bytes = block.get("image") or b""
        if not img_bytes:
          continue
        # 從區塊的 "ext" 鍵衍生副檔名（fitz 會設定此項）
        ext = (block.get("ext") or "png").lower()
        raw_images.append((img_bytes, ext))

      # --- 寫入去重複的影像 ---
      page_files = []
      img_idx = 1
      for img_bytes, ext in raw_images:
        h = hashlib.sha256(img_bytes).digest()
        if h in seen_hashes:
          continue
        seen_hashes.add(h)
        out_name = f"page{page_label:03d}_img{img_idx:03d}.{ext}"
        img_dir.mkdir(parents=True, exist_ok=True)
        (img_dir / out_name).write_bytes(img_bytes)
        page_files.append(out_name)
        img_idx += 1

      if page_files:
        written_by_page[page_label] = page_files
  finally:
    doc.close()

  return written_by_page


def build_image_appendix(written_by_page) -> str:
    """建立 '## Extracted Images' 附錄文字。如果為空則傳回 ""。"""
    if not written_by_page:
        return ""
    lines = ["", "## Extracted Images", ""]
    for page_num in sorted(written_by_page):
        lines.append(f"### Page {page_num}")
        lines.append("")
        for name in written_by_page[page_num]:
            lines.append(f"![{name}](img/{name})")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def convert_one(md, fitz, source: Path, dest_dir: Path) -> bool:
    """將單一 .pdf 檔案轉換為包含 Markdown 檔案和
    已擷取影像之 'img/' 資料夾的 '<name>/' 資料夾。成功時傳回 True。"""
    try:
        result = md.convert(str(source))
    except Exception as exc:  # noqa: BLE001 - surface any conversion error
        print(f"失敗  {source} -> {exc}", file=sys.stderr)
        return False

    try:
        if dest_dir.exists():
            shutil.rmtree(dest_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)
        written_by_page = extract_images(fitz, source, dest_dir / "img")
        appendix = build_image_appendix(written_by_page)
        text = result.text_content.rstrip("\n")
        full_text = f"{text}\n{appendix}" if appendix else f"{text}\n"
        md_path = dest_dir / f"{source.stem}.md"
        md_path.write_text(full_text, encoding="utf-8")
    except OSError as exc:
        print(f"失敗  {source} -> 無法在 {dest_dir} 中寫入輸出：{exc}", file=sys.stderr)
        return False

    img_count = sum(len(v) for v in written_by_page.values())
    img_note = f", {img_count} image(s)" if img_count else ""
    print(f"確定      {source} -> {md_path}{img_note}")
    return True


def find_pdf_files(root: Path, recursive: bool):
    """傳回 root 直接/遞迴底下的 (pdf_files, skipped_count)。"""
    pattern_iter = root.rglob("*") if recursive else root.iterdir()
    pdf_files = []
    skipped = 0
    for entry in pattern_iter:
        if entry.is_dir():
            continue
        if entry.suffix.lower() == ".pdf":
            pdf_files.append(entry)
        else:
            skipped += 1
    return sorted(pdf_files), skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("input", help="指向 .pdf 檔案或 .pdf 檔案目錄的路徑")
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
    #fitz = _import_fitz()
    #md = MarkItDown()

    source = Path(args.input)
    if not source.exists():
        print(f"錯誤：找不到輸入路徑：{source}", file=sys.stderr)
        return EXIT_INVALID_INPUT

    if source.is_file() and source.suffix.lower() != ".pdf":
         print(
             f"錯誤：不支援的檔案類型 '{source.suffix}'。"
             "此技能僅轉換 .pdf 檔案。",
             file=sys.stderr,
         )
         return EXIT_INVALID_INPUT

    MarkItDown = _import_markitdown()
    fitz = _import_fitz()
    md = MarkItDown()

    if source.is_file():
        dest_dir = Path(args.output) if args.output else source.parent / source.stem
        return EXIT_OK if convert_one(md, fitz, source, dest_dir) else EXIT_CONVERSION_FAILED

    # 目錄 / 批次模式
    pdf_files, skipped = find_pdf_files(source, args.recursive)
    if skipped:
        print(f"提示：已略過 {source} 中的 {skipped} 個非 .pdf 檔案")
    if not pdf_files:
        print(f"錯誤：在 {source} 下找不到 .pdf 檔案", file=sys.stderr)
        return EXIT_INVALID_INPUT

    out_dir = Path(args.output) if args.output else None
    success_count = 0
    for pdf_path in pdf_files:
        if out_dir is not None:
            rel = pdf_path.relative_to(source)
            dest_dir = out_dir / rel.parent / pdf_path.stem
        else:
            dest_dir = pdf_path.parent / pdf_path.stem
        if convert_one(md, fitz, pdf_path, dest_dir):
            success_count += 1

    total = len(pdf_files)
    print(f"\n已轉換 {success_count}/{total} 個檔案。")
    return EXIT_OK if success_count == total else EXIT_CONVERSION_FAILED


if __name__ == "__main__":
    sys.exit(main())
