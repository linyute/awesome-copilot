#!/bin/bash
# 主要發佈指令碼
# 參數：$1 = index.html 的路徑，$2 = 儲存庫名稱，$3 = 可見性 (private|public)，$4 = 說明
set -euo pipefail

HTML_FILE="$1"
REPO_NAME="$2"
VISIBILITY="${3:-public}"
DESCRIPTION="${4:-透過 publish-to-pages 發佈}"

USERNAME=$(gh api user --jq '.login')

# 檢查儲存庫是否已存在
if gh repo view "$USERNAME/$REPO_NAME" &>/dev/null; then
    echo "錯誤：儲存庫 $USERNAME/$REPO_NAME 已存在"
    exit 1
fi

# 建立儲存庫
gh repo create "$REPO_NAME" --"$VISIBILITY" --description "$DESCRIPTION"

# 複製、推送、啟用 Pages
TMPDIR=$(mktemp -d)
git clone "https://github.com/$USERNAME/$REPO_NAME.git" "$TMPDIR"

HTML_DIR=$(dirname "$HTML_FILE")

# 將 HTML 檔案複製為 index.html
cp "$HTML_FILE" "$TMPDIR/index.html"

# 如果資產目錄與 HTML 檔案並列存在，則將其複製
if [ -d "$HTML_DIR/assets" ]; then
    cp -r "$HTML_DIR/assets" "$TMPDIR/assets"
    echo "已複製 assets/ 目錄 ($(find "$HTML_DIR/assets" -type f | wc -l) 個檔案)"
fi

cd "$TMPDIR"
git add -A
git commit -m "發佈內容"
git push origin main

# 啟用 GitHub Pages
gh api "repos/$USERNAME/$REPO_NAME/pages" -X POST -f source[branch]=main -f source[path]=/ 2>/dev/null || true

echo "REPO_URL=https://github.com/$USERNAME/$REPO_NAME"
echo "PAGES_URL=https://$USERNAME.github.io/$REPO_NAME/"
echo ""
echo "GitHub Pages 可能需要 1-2 分鐘才能部署。"

# 清理
rm -rf "$TMPDIR"
