#!/usr/bin/env python3
"""
Excalidraw 函式庫分割器

此指令碼將 Excalidraw 函式庫檔案 (*.excalidrawlib) 分割為個別的
圖示 JSON 檔案，並產生一個 reference.md 檔案以便於查詢。

此指令碼預期以下結構：
  skills/excalidraw-diagram-generator/libraries/{icon-set-name}/
    {icon-set-name}.excalidrawlib  (請先放置此檔案)

用法：
    python split-excalidraw-library.py <path-to-library-directory>

範例：
    python split-excalidraw-library.py skills/excalidraw-diagram-generator/libraries/aws-architecture-icons/
"""

import json
import os
import re
import sys
from pathlib import Path


def sanitize_filename(name: str) -> str:
    """
    淨化圖示名稱以建立有效的檔名。

    引數：
        name: 原始圖示名稱

    傳回：
        對所有平台都安全的淨化後檔名
    """
    # 將空格替換為連字號
    filename = name.replace(' ', '-')

    # 移除或替換特殊字元
    filename = re.sub(r'[^\w\-.]', '', filename)

    # 移除多個連續的連字號
    filename = re.sub(r'-+', '-', filename)

    # 移除前導/尾隨連字號
    filename = filename.strip('-')

    return filename


def find_library_file(directory: Path) -> Path:
    """
    在指定的目錄中尋找 .excalidrawlib 檔案。

    引數：
        directory: 要搜尋的目錄

    傳回：
        函式庫檔案的路徑

    引發：
        SystemExit: 如果找不到函式庫檔案或找到多個函式庫檔案
    """
    library_files = list(directory.glob('*.excalidrawlib'))

    if len(library_files) == 0:
        print(f"錯誤：在 {directory} 中找不到 .excalidrawlib 檔案")
        print(f"請先在 {directory} 中放置一個 .excalidrawlib 檔案。")
        sys.exit(1)

    if len(library_files) > 1:
        print(f"錯誤：在 {directory} 中找到多個 .excalidrawlib 檔案")
        print(f"請在 {directory} 中僅保留一個函式庫檔案。")
        sys.exit(1)

    return library_files[0]


def split_library(library_dir: str) -> None:
    """
    將 Excalidraw 函式庫檔案分割為個別的圖示檔案。

    引數：
        library_dir: 包含 .excalidrawlib 檔案的目錄路徑
    """
    library_dir = Path(library_dir)

    if not library_dir.exists():
        print(f"錯誤：找不到目錄：{library_dir}")
        sys.exit(1)

    if not library_dir.is_dir():
        print(f"錯誤：路徑不是目錄：{library_dir}")
        sys.exit(1)

    # 尋找函式庫檔案
    library_path = find_library_file(library_dir)
    print(f"找到函式庫：{library_path.name}")

    # 載入函式庫檔案
    print(f"正在載入函式庫資料...")
    with open(library_path, 'r', encoding='utf-8') as f:
        library_data = json.load(f)

    # 驗證函式庫結構
    if 'libraryItems' not in library_data:
        print("錯誤：無效的函式庫檔案格式（缺少 'libraryItems'）")
        sys.exit(1)

    # 建立圖示目錄
    icons_dir = library_dir / 'icons'
    icons_dir.mkdir(exist_ok=True)
    print(f"輸出目錄：{library_dir}")

    # 處理每個函式庫項目（圖示）
    library_items = library_data['libraryItems']
    icon_list = []

    print(f"正在處理 {len(library_items)} 個圖示...")

    for item in library_items:
        # 取得圖示名稱
        icon_name = item.get('name', 'Unnamed')

        # 建立淨化後的檔名
        filename = sanitize_filename(icon_name) + '.json'

        # 儲存圖示資料
        icon_path = icons_dir / filename
        with open(icon_path, 'w', encoding='utf-8') as f:
            json.dump(item, f, ensure_ascii=False, indent=2)

        # 新增到參考列表
        icon_list.append({
            'name': icon_name,
            'filename': filename
        })

        print(f"  ✓ {icon_name} → {filename}")

    # 按名稱排序圖示列表
    icon_list.sort(key=lambda x: x['name'])

    # 產生 reference.md
    library_name = library_path.stem
    reference_path = library_dir / 'reference.md'
    with open(reference_path, 'w', encoding='utf-8') as f:
        f.write(f"# {library_name} 參考\n\n")
        f.write(f"此目錄包含從 `{library_path.name}` 提取的 {len(icon_list)} 個圖示。\n\n")
        f.write("## 可用圖示\n\n")
        f.write("| 圖示名稱 | 檔名 |\n")
        f.write("|-----------|----------|\n")

        for icon in icon_list:
            f.write(f"| {icon['name']} | `icons/{icon['filename']}` |\n")

        f.write("\n## 用法\n\n")
        f.write("每個圖示 JSON 檔案都包含在 Excalidraw 中渲染該圖示所需的完整 `elements` 陣列。\n")
        f.write("您可以將這些檔案中的元素複製到您的 Excalidraw 圖表中。\n")

    print(f"\n✅ 成功將函式庫分割為 {len(icon_list)} 個圖示")
    print(f"📄 參考文件已建立：{reference_path}")
    print(f"📁 圖示目錄：{icons_dir}")


def main():
    """主進入點。"""
    if hasattr(sys.stdout, "reconfigure"):
        # 確保在 Windows 主控台上有一致的 UTF-8 輸出。
        sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        print("用法：python split-excalidraw-library.py <path-to-library-directory>")
        print("\n範例：")
        print("  python split-excalidraw-library.py skills/excalidraw-diagram-generator/libraries/aws-architecture-icons/")
        print("\n注意：目錄應包含一個 .excalidrawlib 檔案。")
        sys.exit(1)

    library_dir = sys.argv[1]
    split_library(library_dir)


if __name__ == '__main__':
    main()
