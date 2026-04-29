#!/bin/bash
# 修正所有 Markdown 檔案中行尾符號的腳本

echo "正在規範化 Markdown 檔案中的行尾符號..."

# 尋找所有 Markdown 檔案並將 CRLF 轉換為 LF
find . -name "*.md" -type f -exec sed -i 's/\r$//' {} \;

echo "完成！所有 Markdown 檔案現在都使用 LF 行尾符號。"
