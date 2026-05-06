#!/usr/bin/env python3
"""azure-architecture-autopilot 圖表引擎的命令列工具。"""
import argparse
import json
import sys
import os
import subprocess
import shutil
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generator import generate_diagram


def main():
    parser = argparse.ArgumentParser(
        description="產生互動式 Azure 架構圖",
        prog="azure-architecture-autopilot"
    )
    parser.add_argument("-s", "--services", help="服務 JSON (字串或檔案路徑)")
    parser.add_argument("-c", "--connections", help="連線 JSON (字串或檔案路徑)")
    parser.add_argument("-t", "--title", default="Azure Architecture", help="圖表標題")
    parser.add_argument("-o", "--output", default="azure-architecture.html", help="輸出檔案路徑")
    parser.add_argument("-f", "--format", choices=["html", "png", "both"], default="html",
                        help="輸出格式：html (預設)、png 或兩者皆有 (html+png)")
    parser.add_argument("--vnet-info", default="", help="VNet CIDR 資訊")
    parser.add_argument("--hierarchy", default="", help="訂閱/資源群組 (RG) 階層 JSON")

    args = parser.parse_args()

    if not args.services or not args.connections:
        parser.error("-s/--services 和 -c/--connections 為必填")

    services = _load_json(args.services, "services")
    connections = _load_json(args.connections, "connections")
    hierarchy = None
    if args.hierarchy:
        hierarchy = _load_json(args.hierarchy, "hierarchy")

    services = _normalize_services(services)
    connections = _normalize_connections(connections)

    html = generate_diagram(
        services=services,
        connections=connections,
        title=args.title,
        vnet_info=args.vnet_info,
        hierarchy=hierarchy,
    )

    # 確定輸出路徑
    out = Path(args.output)
    html_path = out.with_suffix(".html")
    png_path = out.with_suffix(".png")
    svg_path = out.with_suffix(".svg")

    if args.format in ("html", "both"):
        html_path.write_text(html, encoding="utf-8")
        print(f"HTML 已儲存：{html_path}")

    if args.format in ("png", "both"):
        # 寫入暫存 HTML，然後使用 puppeteer/playwright 截圖
        tmp_html = html_path if args.format == "both" else Path(str(png_path) + ".tmp.html")
        if args.format != "both":
            tmp_html.write_text(html, encoding="utf-8")

        success = _html_to_png(tmp_html, png_path)

        if args.format != "both" and tmp_html.exists():
            tmp_html.unlink()

        if success:
            print(f"PNG 已儲存：{png_path}")
        else:
            print(f"警告：PNG 匯出失敗。請安裝 puppeteer (npm i puppeteer) 以支援 PNG。", file=sys.stderr)
            print(f"改為儲存 HTML：{html_path}")
            if not html_path.exists():
                html_path.write_text(html, encoding="utf-8")


def _html_to_png(html_path, png_path, width=1920, height=1080):
    """使用 puppeteer (Node.js) 將 HTML 轉換為 PNG。"""
    node = shutil.which("node")
    if not node:
        return False

    # 嘗試多個 puppeteer 位置
    script = f"""
let puppeteer;
const paths = [
  'puppeteer',
  process.env.TEMP + '/node_modules/puppeteer',
  process.env.HOME + '/node_modules/puppeteer',
  './node_modules/puppeteer'
];
for (const p of paths) {{ try {{ puppeteer = require(p); break; }} catch(e) {{}} }}
if (!puppeteer) {{ console.error('puppeteer not found'); process.exit(1); }}
(async () => {{
  const browser = await puppeteer.launch({{headless: 'new'}});
  const page = await browser.newPage();
  await page.setViewport({{width: {width}, height: {height}}});
  await page.goto('file:///{html_path.resolve().as_posix()}', {{waitUntil: 'networkidle0'}});
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({{path: '{png_path.resolve().as_posix()}'}});
  await browser.close();
}})();
"""
    try:
        result = subprocess.run([node, "-e", script], capture_output=True, text=True, timeout=30)
        return result.returncode == 0 and png_path.exists()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def _load_json(value, name):
    """從字串或檔案路徑載入 JSON。若存在，則從合併的 JSON 中擷取具名金鑰。"""
    data = None
    if os.path.isfile(value):
        with open(value, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        try:
            data = json.loads(value)
        except json.JSONDecodeError as e:
            print(f"錯誤：--{name} 的 JSON 無效：{e}", file=sys.stderr)
            sys.exit(1)

    # 如果 data 是含有具名金鑰的字典，則擷取它（支援合併的 JSON 檔案）
    if isinstance(data, dict) and name in data:
        return data[name]
    return data


def _normalize_services(services):
    """將服務欄位正規化以提高容錯。"""
    for svc in services:
        if isinstance(svc.get("details"), str):
            svc["details"] = [svc["details"]]
        if isinstance(svc.get("private"), str):
            val = svc["private"].lower()
            if val in ("true", "1", "yes", "on"):
                svc["private"] = True
            elif val in ("false", "0", "no", "off"):
                svc["private"] = False
            else:
                # 記錄無效布林值的警告
                print(f"警告：'private' 欄位的布林值 '{svc['private']}' 無效，已預設為 False。", file=sys.stderr)
                svc["private"] = False
    return services


def _normalize_connections(connections):
    """將連線欄位正規化以提高容錯。"""
    for conn in connections:
        if "type" not in conn:
            conn["type"] = "default"
    return connections


if __name__ == "__main__":
    main()
