#!/usr/bin/env bash
set -euo pipefail

# 沙盒 npm 安裝指令稿 (Sandbox npm Install Script)
# 在本地 ext4 檔案系統上安裝 node_modules 並建立符號連結 (symlink) 到工作區。
# 這可以避免原生二進位檔案 (esbuild, lightningcss, rollup) 在 virtiofs 上當機。

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# 本地 ext4 基礎目錄，用於安裝 node_modules 以避免 virtiofs 當機。
# 如果您的沙盒使用不同的本地檔案系統位置，請變更此路徑。
readonly DEPS_BASE="/home/agent/project-deps"
WORKSPACE_CLIENT=""
INSTALL_PLAYWRIGHT="false"

usage() {
  cat <<EOF
用法: $(basename "$0") [選項]

選項:
  --workspace <路徑>   包含 package.json 的用戶端工作區
  --playwright         安裝 Playwright Chromium 瀏覽器
  --help               顯示此說明訊息

範例:
  bash scripts/install.sh
  bash scripts/install.sh --workspace app/client --playwright
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      if [[ -z "${2:-}" ]]; then
        echo "錯誤：--workspace 需要一個路徑引數"
        usage
        exit 1
      fi
      WORKSPACE_CLIENT="$2"
      shift 2
      ;;
    --playwright)
      INSTALL_PLAYWRIGHT="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "未知選項：$1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$WORKSPACE_CLIENT" ]]; then
  if [[ -f "$PWD/package.json" ]]; then
    WORKSPACE_CLIENT="$PWD"
  elif [[ -f "$REPO_ROOT/package.json" ]]; then
    WORKSPACE_CLIENT="$REPO_ROOT"
  fi
fi

if [[ -n "$WORKSPACE_CLIENT" ]]; then
  WORKSPACE_CLIENT="$(cd "$WORKSPACE_CLIENT" 2>/dev/null && pwd || true)"
fi

if [[ -z "$WORKSPACE_CLIENT" || ! -f "$WORKSPACE_CLIENT/package.json" ]]; then
  echo "找不到包含 package.json 的有效工作區用戶端路徑。"
  echo "請使用 --workspace <路徑> 明確指定。"
  exit 1
fi

echo "=== 沙盒 npm 安裝 ==="
echo "工作區：$WORKSPACE_CLIENT"

# 根據相對於儲存庫根目錄的工作區路徑衍生一個唯一的子目錄。
# 例如 /repo/apps/web -> apps-web, /repo -> <儲存庫基本名稱>
REL_PATH="${WORKSPACE_CLIENT#"$REPO_ROOT"}"
REL_PATH="${REL_PATH#/}"
if [[ -z "$REL_PATH" ]]; then
  REL_PATH="$(basename "$REPO_ROOT")"
fi
# 清理：將路徑分隔符號替換為連字號
DEPS_SUBDIR="${REL_PATH//\//-}"
DEPS_DIR="${DEPS_BASE}/${DEPS_SUBDIR}"

echo "依賴項目錄：$DEPS_DIR"

# 步驟 1：準備本地依賴項目錄
echo "→ 正在準備 $DEPS_DIR..."
if [[ -z "$DEPS_DIR" || "$DEPS_DIR" != "${DEPS_BASE}/"* ]]; then
  echo "錯誤：DEPS_DIR ('$DEPS_DIR') 不在 DEPS_BASE ('$DEPS_BASE') 下。正在中止。"
  exit 1
fi
rm -rf "$DEPS_DIR"
mkdir -p "$DEPS_DIR"
chmod 700 "$DEPS_DIR"
cp "$WORKSPACE_CLIENT/package.json" "$DEPS_DIR/"

# 如果存在 .npmrc 則複製 (私有登錄庫 / 具範圍的套件需要)
# 權限限制為僅限擁有者，因為 .npmrc 可能包含身份驗證權杖
if [[ -f "$WORKSPACE_CLIENT/.npmrc" ]]; then
  cp "$WORKSPACE_CLIENT/.npmrc" "$DEPS_DIR/"
  chmod 600 "$DEPS_DIR/.npmrc"
fi

if [[ -f "$WORKSPACE_CLIENT/package-lock.json" ]]; then
  cp "$WORKSPACE_CLIENT/package-lock.json" "$DEPS_DIR/"
  INSTALL_CMD=(npm ci)
else
  echo "! 找不到 package-lock.json；退而求其次使用 npm install"
  INSTALL_CMD=(npm install)
fi

# 步驟 2：在本地 ext4 上安裝
echo "→ 正在本地 ext4 上執行 ${INSTALL_CMD[*]}..."
cd "$DEPS_DIR" && "${INSTALL_CMD[@]}"

# 步驟 3：建立符號連結到工作區
echo "→ 正在建立 node_modules 符號連結到工作區..."
cd "$WORKSPACE_CLIENT"
rm -rf node_modules
ln -s "$DEPS_DIR/node_modules" node_modules

has_dep() {
  local dep="$1"
  node -e "
    const pkg=require(process.argv[1]);
    const deps={...(pkg.dependencies||{}),...(pkg.devDependencies||{}),...(pkg.optionalDependencies||{})};
    process.exit(deps[process.argv[2]] ? 0 : 1);
  " "$WORKSPACE_CLIENT/package.json" "$dep"
}

verify_one() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "  ✓ $label 確定"
    return 0
  fi

  echo "  ✗ $label 失敗"
  return 1
}

# 步驟 4：當此專案中存在原生二進位檔案時進行驗證
echo "→ 正在驗證原生二進位檔案..."
FAIL=0

if has_dep esbuild; then
  verify_one "esbuild" node -e "require('esbuild').transform('const x: number = 1',{loader:'ts'}).catch(()=>process.exit(1))" || FAIL=1
fi

if has_dep rollup; then
  verify_one "rollup" node -e "import('rollup').catch(()=>process.exit(1))" || FAIL=1
fi

if has_dep lightningcss; then
  verify_one "lightningcss" node -e "try{require('lightningcss')}catch(_){process.exit(1)}" || FAIL=1
fi

if has_dep vite; then
  verify_one "vite" node -e "import('vite').catch(()=>process.exit(1))" || FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then
  echo "✗ 二進位檔案驗證失敗。請嘗試重新執行指令稿 (當機可能是間歇性的)。"
  exit 1
fi

# 步驟 5：選擇性安裝 Playwright
if [[ "$INSTALL_PLAYWRIGHT" == "true" ]]; then
  echo "→ 正在安裝 Playwright 瀏覽器..."
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    npx playwright install --with-deps chromium
  elif command -v sudo &>/dev/null && sudo -n true 2>/dev/null; then
    # 非 root 但有無需密碼的 sudo 可用 — 先安裝瀏覽器再安裝系統依賴項
    npx playwright install chromium
    sudo npx playwright install-deps chromium
  else
    npx playwright install chromium
    echo "⚠ 未安裝系統依賴項 (無 root/sudo 權限)。"
    echo "  Playwright 測試可能會失敗。請執行：sudo npx playwright install-deps chromium"
  fi
fi

echo ""
echo "=== ✓ 沙盒 npm 安裝完成 ==="
echo "請執行 'npm run dev' 來啟動開發伺服器。"
