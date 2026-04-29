#!/usr/bin/env bash
# eval-driven-dev 技術的設定腳本。
# 更新技術、安裝/升級 pixie-qa[all]、初始化
# pixie 工作目錄，並在背景啟動 Web UI 伺服器。
#
# 錯誤處理：
#   - 技術更新失敗 → 非致命（繼續使用現有版本）
#   - 已安裝時 pixie-qa 升級失敗 → 非致命
#   - 未安裝 pixie-qa 且安裝失敗 → 致命（結束碼 1）
#   - pixie 初始化失敗 → 致命（結束碼 1）
#   - pixie 啟動失敗 → 致命（結束碼 1）
set -u

echo "=== 正在更新技術 ==="
npx skills update github/awesome-copilot --skill eval-driven-dev -g -y && npx skills update github/awesome-copilot --skill eval-driven-dev -p -y || {
  echo "（技術更新失敗 — 繼續使用現有版本）"
}

echo ""
echo "=== 正在安裝 / 升級 pixie-qa[all] ==="

# 輔助函式：檢查 pixie CLI 是否可匯入
_pixie_available() {
  if [ -f uv.lock ]; then
    uv run python -c "import pixie" 2>/dev/null
  elif [ -f poetry.lock ]; then
    poetry run python -c "import pixie" 2>/dev/null
  else
    python -c "import pixie" 2>/dev/null
  fi
}

# 在嘗試升級前檢查是否已安裝 pixie
PIXIE_WAS_INSTALLED=false
if _pixie_available; then
  PIXIE_WAS_INSTALLED=true
fi

INSTALL_OK=false
if [ -f uv.lock ]; then
  # uv add 會在 requires-python 中的所有 Python 版本間進行通用解析。
  # 如果主專案支援的 Python 版本不包含 pixie-qa（例如 <3.10），uv add 就會失敗。
  # 此時退而使用 uv pip install，這只會針對目前的直譯器。
  if uv add "pixie-qa[all]>=0.8.4,<0.9.0" --upgrade 2>&1; then
    INSTALL_OK=true
  else
    echo "（uv add 失敗 — 退而使用 uv pip install）"
    if uv pip install "pixie-qa[all]>=0.8.4,<0.9.0" 2>&1; then
      INSTALL_OK=true
    fi
  fi
elif [ -f poetry.lock ]; then
  if poetry add "pixie-qa[all]>=0.8.4,<0.9.0"; then
    INSTALL_OK=true
  fi
else
  if pip install --upgrade "pixie-qa[all]>=0.8.4,<0.9.0"; then
    INSTALL_OK=true
  fi
fi

if [ "$INSTALL_OK" = false ]; then
  if [ "$PIXIE_WAS_INSTALLED" = true ]; then
    echo "（pixie-qa 升級失敗 — 繼續使用現有版本）"
  else
    echo ""
    echo "錯誤：未安裝 pixie-qa 且安裝失敗。"
    echo "eval-driven-dev 工作流需要 pixie-qa 套件。"
    echo "請手動安裝並重新執行此腳本。"
    exit 1
  fi
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

if [ $? -ne 0 ]; then
  echo ""
  echo "錯誤：初始化 pixie 工作目錄失敗。"
  echo "請檢查上述錯誤並修正後再繼續。"
  exit 1
fi

echo ""
echo "=== 正在啟動 Web UI 伺服器（背景） ==="
if [ -f uv.lock ]; then
  uv run pixie start
elif [ -f poetry.lock ]; then
  poetry run pixie start
else
  pixie start
fi

if [ $? -ne 0 ]; then
  echo ""
  echo "錯誤：啟動 Web UI 伺服器失敗。"
  echo "請檢查上述錯誤並修正後再繼續。"
  exit 1
fi

echo ""
echo "=== 設定完成 ==="
