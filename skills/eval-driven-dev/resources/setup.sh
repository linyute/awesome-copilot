#!/usr/bin/env bash
# eval-driven-dev 技能的設定腳本。
# 更新技能、安裝/升級 pixie-qa[all]、初始化
# pixie 工作目錄，並在背景啟動網頁介面伺服器。
# 失敗是非致命的 — 即使此處的某個步驟被環境
# 阻礙，工作流程仍會繼續執行。
set -u

echo "=== 正在更新技能 ==="
npx skills update || echo "(已跳過技能更新)"

echo ""
echo "=== 正在安裝 / 升級 pixie-qa[all] ==="
if [ -f uv.lock ]; then
  uv add "pixie-qa[all]>=0.6.1,<0.7.0" --upgrade
elif [ -f poetry.lock ]; then
  poetry add "pixie-qa[all]>=0.6.1,<0.7.0"
else
  pip install --upgrade "pixie-qa[all]>=0.6.1,<0.7.0"
fi

echo ""
echo "=== 正在初始化 pixie 工作目錄 ==="
if [ -f uv.lock ]; then
  uv run pixie init
elif [ -f poetry.lock ]; then
  poetry run pixie init
else
  pixie init
fi

echo ""
echo "=== 正在背景啟動網頁介面伺服器 ==="
if [ -f uv.lock ]; then
  uv run pixie start
elif [ -f poetry.lock ]; then
  poetry run pixie start
else
  pixie start
fi

echo ""
echo "=== 設定完成 ==="
