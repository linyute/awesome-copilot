#!/usr/bin/env python3
"""將 PDF 轉換為 HTML 簡報。

每一頁都會被渲染為 PNG 圖片（透過 pdftoppm）。支援大型檔案的外部資產
模式，以避免產生巨大的單一 HTML 檔案。

需求：poppler-utils (pdftoppm)
"""

import argparse
import base64
import glob
import os
import subprocess
import sys
import tempfile
from pathlib import Path


def get_page_count(pdf_path):
    """如果可用，則使用 pdfinfo 取得頁數。"""
    try:
        result = subprocess.run(["pdfinfo", pdf_path], capture_output=True, text=True)
        for line in result.stdout.splitlines():
            if line.startswith("Pages:"):
                return int(line.split(":")[1].strip())
    except:
        pass
    return None


def convert(pdf_path: str, output_path: str | None = None, dpi: int = 150, external_assets=None):
    pdf_path = str(Path(pdf_path).resolve())
    if not Path(pdf_path).exists():
        print(f"錯誤：找不到 {pdf_path}")
        sys.exit(1)

    if subprocess.run(["which", "pdftoppm"], capture_output=True).returncode != 0:
        print("錯誤：找不到 pdftoppm。請安裝 poppler-utils：")
        print("  apt install poppler-utils  # Debian/Ubuntu")
        print("  brew install poppler       # macOS")
        sys.exit(1)

    file_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)

    if file_size_mb > 150:
        print(f"警告：PDF 檔案大小為 {file_size_mb:.0f}MB — 轉換可能會很慢且耗費記憶體。")

    page_count = get_page_count(pdf_path)

    # 自動偵測外部資產模式
    if external_assets is None:
        external_assets = file_size_mb > 20 or (page_count is not None and page_count > 50)
        if external_assets:
            print(f"自動啟用外部資產模式（檔案：{file_size_mb:.1f}MB，頁數：{page_count or '未知'}）")

    output = output_path or str(Path(pdf_path).with_suffix('.html'))
    output_dir = Path(output).parent

    if external_assets:
        assets_dir = output_dir / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmpdir:
        prefix = os.path.join(tmpdir, "page")
        result = subprocess.run(
            ["pdftoppm", "-png", "-r", str(dpi), pdf_path, prefix],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"轉換 PDF 時發生錯誤：{result.stderr}")
            sys.exit(1)

        pages = sorted(glob.glob(f"{prefix}-*.png"))
        if not pages:
            print("錯誤：PDF 未渲染出任何頁面")
            sys.exit(1)

        slides_html = []
        for i, page_path in enumerate(pages, 1):
            with open(page_path, "rb") as f:
                page_bytes = f.read()

            if external_assets:
                img_name = f"img-{i:03d}.png"
                (assets_dir / img_name).write_bytes(page_bytes)
                src = f"assets/{img_name}"
            else:
                b64 = base64.b64encode(page_bytes).decode()
                src = f"data:image/png;base64,{b64}"

            slides_html.append(
                f'<section class="slide">'
                f'<div class="slide-inner">'
                f'<img src="{src}" alt="第 {i} 頁">'
                f'</div></section>'
            )

    title = Path(pdf_path).stem.replace("-", " ").replace("_", " ")

    html = f'''<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ height: 100%; overflow: hidden; background: #000; }}
.slide {{ width: 100vw; height: 100vh; display: none; align-items: center; justify-content: center; }}
.slide.active {{ display: flex; }}
.slide-inner {{ display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }}
.slide-inner img {{ max-width: 100%; max-height: 100%; object-fit: contain; }}
.progress {{ position: fixed; bottom: 0; left: 0; height: 4px; background: #0366d6; transition: width 0.3s; z-index: 100; }}
.counter {{ position: fixed; bottom: 12px; right: 20px; font-size: 14px; color: rgba(255,255,255,0.4); z-index: 100; }}
</style>
</head>
<body>
{chr(10).join(slides_html)}
<div class="progress" id="progress"></div>
<div class="counter" id="counter"></div>
<script>
const slides = document.querySelectorAll('.slide');
let current = 0;
function show(n) {{
    slides.forEach(s => s.classList.remove('active'));
    current = Math.max(0, Math.min(n, slides.length - 1));
    slides[current].classList.add('active');
    document.getElementById('progress').style.width = ((current + 1) / slides.length * 100) + '%';
    document.getElementById('counter').textContent = (current + 1) + ' / ' + slides.length;
}}
document.addEventListener('keydown', e => {{
    if (e.key === 'ArrowRight' || e.key === ' ') {{ e.preventDefault(); show(current + 1); }}
    if (e.key === 'ArrowLeft') {{ e.preventDefault(); show(current - 1); }}
}});
let touchStartX = 0;
document.addEventListener('touchstart', e => {{ touchStartX = e.changedTouches[0].screenX; }});
document.addEventListener('touchend', e => {{
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) {{ diff > 0 ? show(current - 1) : show(current + 1); }}
}});
document.addEventListener('click', e => {{
    if (e.clientX > window.innerWidth / 2) show(current + 1);
    else show(current - 1);
}});
show(0);
</script>
</body></html>'''

    Path(output).write_text(html, encoding='utf-8')
    output_size = os.path.getsize(output)

    print(f"已轉換至：{output}")
    print(f"頁數：{len(slides_html)}")
    print(f"輸出大小：{output_size / (1024*1024):.1f}MB")
    print(f"外部資產：{'是' if external_assets else '否'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="將 PDF 轉換為 HTML 簡報")
    parser.add_argument("input", help=".pdf 檔案的路徑")
    parser.add_argument("output", nargs="?", help="輸出 HTML 路徑（預設值：同名並使用 .html）")
    parser.add_argument("--external-assets", action="store_true", default=None,
                        help="將頁面圖片另存為 assets/ 目錄中的獨立檔案（針對大型檔案自動偵測）")
    parser.add_argument("--no-external-assets", action="store_true",
                        help="即使是大型檔案也強制使用內嵌 base64")
    parser.add_argument("--dpi", type=int, default=150, help="渲染 DPI（預設值：150）")
    args = parser.parse_args()

    ext_assets = None
    if args.external_assets:
        ext_assets = True
    elif args.no_external_assets:
        ext_assets = False

    convert(args.input, args.output, dpi=args.dpi, external_assets=ext_assets)
