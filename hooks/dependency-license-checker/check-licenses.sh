#!/bin/bash

# Dependency License Checker Hook (相依套件授權檢查 Hook)
# 在工作階段結束時，掃描新增加的相依套件是否符合授權規範 (GPL, AGPL 等)
# 在提交前執行。
#
# 環境變數：
#   LICENSE_MODE        - "warn" (僅記錄) 或 "block" (違規時非零值退出) (預設: warn)
#   SKIP_LICENSE_CHECK  - "true" 以完全停用 (預設: 未設定)
#   LICENSE_LOG_DIR     - 檢查日誌目錄 (預設: logs/copilot/license-checker)
#   BLOCKED_LICENSES    - 要標記的逗號分隔 SPDX ID (預設: Copyleft 集合)
#   LICENSE_ALLOWLIST   - 要跳過的逗號分隔套件名稱 (預設: 未設定)

set -euo pipefail

# ---------------------------------------------------------------------------
# 若已停用則提前退出
# ---------------------------------------------------------------------------
if [[ "${SKIP_LICENSE_CHECK:-}" == "true" ]]; then
  echo "⏭️  已跳過授權檢查 (SKIP_LICENSE_CHECK=true)"
  exit 0
fi

# 確保我們位於 git 儲存庫中
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "⚠️  不在 git 儲存庫中，跳過授權檢查"
  exit 0
fi

# ---------------------------------------------------------------------------
# 設定
# ---------------------------------------------------------------------------
MODE="${LICENSE_MODE:-warn}"
LOG_DIR="${LICENSE_LOG_DIR:-logs/copilot/license-checker}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FINDING_COUNT=0

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/check.log"

# 預設阻擋的授權 (Copyleft / 限制性)
DEFAULT_BLOCKED="GPL-2.0,GPL-2.0-only,GPL-2.0-or-later,GPL-3.0,GPL-3.0-only,GPL-3.0-or-later,AGPL-1.0,AGPL-3.0,AGPL-3.0-only,AGPL-3.0-or-later,LGPL-2.0,LGPL-2.1,LGPL-2.1-only,LGPL-2.1-or-later,LGPL-3.0,LGPL-3.0-only,LGPL-3.0-or-later,SSPL-1.0,EUPL-1.1,EUPL-1.2,OSL-3.0,CPAL-1.0,CPL-1.0,CC-BY-SA-4.0,CC-BY-NC-4.0,CC-BY-NC-SA-4.0"

BLOCKED_LIST=()
IFS=',' read -ra BLOCKED_LIST <<< "${BLOCKED_LICENSES:-$DEFAULT_BLOCKED}"

# 解析允許清單
ALLOWLIST=()
if [[ -n "${LICENSE_ALLOWLIST:-}" ]]; then
  IFS=',' read -ra ALLOWLIST <<< "$LICENSE_ALLOWLIST"
fi

# ---------------------------------------------------------------------------
# 輔助函式
# ---------------------------------------------------------------------------
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'
}

is_allowlisted() {
  local pkg="$1"
  for entry in "${ALLOWLIST[@]}"; do
    entry=$(printf '%s' "$entry" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "$entry" ]] && continue
    if [[ "$pkg" == "$entry" ]]; then
      return 0
    fi
  done
  return 1
}

is_blocked_license() {
  local license="$1"
  local license_lower
  license_lower=$(printf '%s' "$license" | tr '[:upper:]' '[:lower:]')
  for blocked in "${BLOCKED_LIST[@]}"; do
    blocked=$(printf '%s' "$blocked" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "$blocked" ]] && continue
    local blocked_lower
    blocked_lower=$(printf '%s' "$blocked" | tr '[:upper:]' '[:lower:]')
    # 子字串比對以處理 SPDX 變體和複合表達式
    if [[ "$license_lower" == *"$blocked_lower"* ]]; then
      return 0
    fi
  done
  return 1
}

# ---------------------------------------------------------------------------
# 階段 1：檢測每個生態系統的新增相依套件
# ---------------------------------------------------------------------------
NEW_DEPS=()

# npm / yarn / pnpm — package.json
if git diff HEAD -- package.json &>/dev/null; then
  while IFS= read -r line; do
    # 比對新增行，例如:  "package-name": "^1.0.0"
    pkg=$(printf '%s' "$line" | sed -n 's/^+[[:space:]]*"\([^"]*\)"[[:space:]]*:[[:space:]]*"[^"]*".*/\1/p')
    if [[ -n "$pkg" && "$pkg" != "name" && "$pkg" != "version" && "$pkg" != "description" && "$pkg" != "main" && "$pkg" != "scripts" && "$pkg" != "dependencies" && "$pkg" != "devDependencies" && "$pkg" != "peerDependencies" && "$pkg" != "optionalDependencies" ]]; then
      NEW_DEPS+=("npm:$pkg")
    fi
  done < <(git diff HEAD -- package.json 2>/dev/null | grep '^+' | grep -v '^+++')
fi

# pip — requirements.txt
if git diff HEAD -- requirements.txt &>/dev/null; then
  while IFS= read -r line; do
    # 跳過註解和空白行
    clean=$(printf '%s' "$line" | sed 's/^+//')
    [[ "$clean" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$clean" ]] && continue
    # 提取 ==, >=, <=, ~=, != 等之前的套件名稱
    pkg=$(printf '%s' "$clean" | sed 's/[[:space:]]*[><=!~].*//' | sed 's/[[:space:]]*//')
    if [[ -n "$pkg" ]]; then
      NEW_DEPS+=("pip:$pkg")
    fi
  done < <(git diff HEAD -- requirements.txt 2>/dev/null | grep '^+' | grep -v '^+++')
fi

# pip — pyproject.toml
if git diff HEAD -- pyproject.toml &>/dev/null; then
  while IFS= read -r line; do
    # 比對包含引號相依套件字串的新增行
    pkg=$(printf '%s' "$line" | sed -n 's/^+[[:space:]]*"\([A-Za-z0-9_-]*\).*/\1/p')
    if [[ -n "$pkg" ]]; then
      NEW_DEPS+=("pip:$pkg")
    fi
  done < <(git diff HEAD -- pyproject.toml 2>/dev/null | grep '^+' | grep -v '^+++')
fi

# Go — go.mod
if git diff HEAD -- go.mod &>/dev/null; then
  while IFS= read -r line; do
    # 比對新增的 require 條目，例如: +	github.com/foo/bar v1.2.3
    pkg=$(printf '%s' "$line" | sed -n 's/^+[[:space:]]*\([a-zA-Z0-9._/-]*\.[a-zA-Z0-9._/-]*\)[[:space:]].*/\1/p')
    if [[ -n "$pkg" && "$pkg" != "module" && "$pkg" != "go" && "$pkg" != "require" ]]; then
      NEW_DEPS+=("go:$pkg")
    fi
  done < <(git diff HEAD -- go.mod 2>/dev/null | grep '^+' | grep -v '^+++')
fi

# Ruby — Gemfile
if git diff HEAD -- Gemfile &>/dev/null; then
  while IFS= read -r line; do
    # 比對新增的 gem 行，例如: +gem 'package-name'
    pkg=$(printf '%s' "$line" | sed -n "s/^+[[:space:]]*gem[[:space:]]*['\"\`]\([^'\"\`]*\)['\"\`].*/\1/p")
    if [[ -n "$pkg" ]]; then
      NEW_DEPS+=("ruby:$pkg")
    fi
  done < <(git diff HEAD -- Gemfile 2>/dev/null | grep '^+' | grep -v '^+++')
fi

# Rust — Cargo.toml
if git diff HEAD -- Cargo.toml &>/dev/null; then
  while IFS= read -r line; do
    # 比對新增的相依套件條目，例如: +package-name = "1.0"  或  +package-name = { version = "1.0" }
    pkg=$(printf '%s' "$line" | sed -n 's/^+[[:space:]]*\([a-zA-Z0-9_-]*\)[[:space:]]*=.*/\1/p')
    if [[ -n "$pkg" && "$pkg" != "name" && "$pkg" != "version" && "$pkg" != "edition" && "$pkg" != "authors" && "$pkg" != "description" && "$pkg" != "license" && "$pkg" != "repository" && "$pkg" != "rust-version" ]]; then
      NEW_DEPS+=("rust:$pkg")
    fi
  done < <(git diff HEAD -- Cargo.toml 2>/dev/null | grep '^+' | grep -v '^+++')
fi

# 若未找到新的相依套件，則清潔退出
if [[ ${#NEW_DEPS[@]} -eq 0 ]]; then
  echo "✅ 沒有檢測到新的相依套件"
  printf '{"timestamp":"%s","event":"license_check_complete","mode":"%s","status":"clean","dependencies_checked":0}\n' \
    "$TIMESTAMP" "$MODE" >> "$LOG_FILE"
  exit 0
fi

echo "🔍 正在檢查 ${#NEW_DEPS[@]} 個新相依套件的授權..."

# ---------------------------------------------------------------------------
# 階段 2：檢查每個相依套件的授權
# ---------------------------------------------------------------------------
RESULTS=()

get_license() {
  local ecosystem="$1"
  local pkg="$2"
  local license="UNKNOWN"

  case "$ecosystem" in
    npm)
      # 主要：檢查 node_modules
      if [[ -f "node_modules/$pkg/package.json" ]]; then
        if command -v jq &>/dev/null; then
          license=$(jq -r '.license // "UNKNOWN"' "node_modules/$pkg/package.json" 2>/dev/null || echo "UNKNOWN")
        else
          license=$(grep -oE '"license"\s*:\s*"[^"]*"' "node_modules/$pkg/package.json" 2>/dev/null | head -1 | sed 's/.*"license"\s*:\s*"//;s/"//' || echo "UNKNOWN")
        fi
      fi
      # 回退：npm view
      if [[ "$license" == "UNKNOWN" ]] && command -v npm &>/dev/null; then
        license=$(timeout 5 npm view "$pkg" license 2>/dev/null || echo "UNKNOWN")
      fi
      ;;
    pip)
      # 主要：pip show
      if command -v pip &>/dev/null; then
        license=$(timeout 5 pip show "$pkg" 2>/dev/null | grep -i '^License:' | sed 's/^[Ll]icense:[[:space:]]*//' || echo "UNKNOWN")
      elif command -v pip3 &>/dev/null; then
        license=$(timeout 5 pip3 show "$pkg" 2>/dev/null | grep -i '^License:' | sed 's/^[Ll]icense:[[:space:]]*//' || echo "UNKNOWN")
      fi
      ;;
    go)
      # 檢查模組快取的 LICENSE 檔案
      local gopath="${GOPATH:-$HOME/go}"
      local mod_dir="$gopath/pkg/mod/$pkg"
      # 嘗試尋找最新的版本目錄
      if [[ -d "$gopath/pkg/mod" ]]; then
        local found_dir
        found_dir=$(find "$gopath/pkg/mod" -maxdepth 4 -path "*${pkg}@*" -type d 2>/dev/null | head -1)
        if [[ -n "$found_dir" ]]; then
          local lic_file
          lic_file=$(find "$found_dir" -maxdepth 1 -iname 'LICENSE*' -type f 2>/dev/null | head -1)
          if [[ -n "$lic_file" ]]; then
            # 針對常見授權識別碼的關鍵字比對
            if grep -qiE 'GNU GENERAL PUBLIC LICENSE' "$lic_file" 2>/dev/null; then
              if grep -qiE 'Version 3' "$lic_file" 2>/dev/null; then
                license="GPL-3.0"
              elif grep -qiE 'Version 2' "$lic_file" 2>/dev/null; then
                license="GPL-2.0"
              else
                license="GPL"
              fi
            elif grep -qiE 'GNU LESSER GENERAL PUBLIC' "$lic_file" 2>/dev/null; then
              license="LGPL"
            elif grep -qiE 'GNU AFFERO GENERAL PUBLIC' "$lic_file" 2>/dev/null; then
              license="AGPL-3.0"
            elif grep -qiE 'MIT License' "$lic_file" 2>/dev/null; then
              license="MIT"
            elif grep -qiE 'Apache License' "$lic_file" 2>/dev/null; then
              license="Apache-2.0"
            elif grep -qiE 'BSD' "$lic_file" 2>/dev/null; then
              license="BSD"
            fi
          fi
        fi
      fi
      ;;
    ruby)
      # gem spec
      if command -v gem &>/dev/null; then
        license=$(timeout 5 gem spec "$pkg" license 2>/dev/null | grep -v '^---' | grep -v '^\.\.\.' | sed 's/^- //' | head -1 || echo "UNKNOWN")
        [[ -z "$license" ]] && license="UNKNOWN"
      fi
      ;;
    rust)
      # cargo metadata
      if command -v cargo &>/dev/null; then
        if command -v jq &>/dev/null; then
          license=$(timeout 5 cargo metadata --format-version 1 2>/dev/null | jq -r ".packages[] | select(.name == \"$pkg\") | .license // \"UNKNOWN\"" 2>/dev/null | head -1 || echo "UNKNOWN")
        fi
      fi
      ;;
  esac

  # 正規化空白/僅空白為 UNKNOWN
  license=$(printf '%s' "$license" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  [[ -z "$license" ]] && license="UNKNOWN"

  printf '%s' "$license"
}

for dep in "${NEW_DEPS[@]}"; do
  ecosystem="${dep%%:*}"
  pkg="${dep#*:}"

  license=$(get_license "$ecosystem" "$pkg")
  RESULTS+=("$ecosystem	$pkg	$license")
done

# ---------------------------------------------------------------------------
# 階段 3 & 4：核對阻擋清單和允許清單
# ---------------------------------------------------------------------------
VIOLATIONS=()

for result in "${RESULTS[@]}"; do
  IFS=$'\t' read -r ecosystem pkg license <<< "$result"

  # 階段 4：跳過允許清單中的套件
  if [[ ${#ALLOWLIST[@]} -gt 0 ]] && is_allowlisted "$pkg"; then
    continue
  fi

  # 階段 3：核對阻擋清單
  if is_blocked_license "$license"; then
    VIOLATIONS+=("$pkg	$ecosystem	$license	BLOCKED")
    FINDING_COUNT=$((FINDING_COUNT + 1))
  fi
done

# ---------------------------------------------------------------------------
# 階段 5：輸出與記錄
# ---------------------------------------------------------------------------
echo ""
printf "  %-30s %-12s %-30s %s\n" "套件" "生態系統" "授權" "狀態"
printf "  %-30s %-12s %-30s %s\n" "-------" "---------" "-------" "------"

for result in "${RESULTS[@]}"; do
  IFS=$'\t' read -r ecosystem pkg license <<< "$result"

  status="OK"
  if [[ ${#ALLOWLIST[@]} -gt 0 ]] && is_allowlisted "$pkg"; then
    status="ALLOWLISTED"
  elif is_blocked_license "$license"; then
    status="BLOCKED"
  fi

  printf "  %-30s %-12s %-30s %s\n" "$pkg" "$ecosystem" "$license" "$status"
done

echo ""

# 建立 JSON 發現陣列
FINDINGS_JSON="["
FIRST=true
for violation in "${VIOLATIONS[@]}"; do
  IFS=$'\t' read -r pkg ecosystem license status <<< "$violation"
  if [[ "$FIRST" != "true" ]]; then
    FINDINGS_JSON+=","
  fi
  FIRST=false
  FINDINGS_JSON+="{\"package\":\"$(json_escape "$pkg")\",\"ecosystem\":\"$(json_escape "$ecosystem")\",\"license\":\"$(json_escape "$license")\",\"status\":\"$(json_escape "$status")\"}"
done
FINDINGS_JSON+="]"

# 寫入結構化日誌條目
printf '{"timestamp":"%s","event":"license_check_complete","mode":"%s","dependencies_checked":%d,"violation_count":%d,"violations":%s}\n' \
  "$TIMESTAMP" "$MODE" "${#RESULTS[@]}" "$FINDING_COUNT" "$FINDINGS_JSON" >> "$LOG_FILE"

if [[ $FINDING_COUNT -gt 0 ]]; then
  echo "⚠️  發現 $FINDING_COUNT 個授權違規："
  echo ""
  for violation in "${VIOLATIONS[@]}"; do
    IFS=$'\t' read -r pkg ecosystem license status <<< "$violation"
    echo "  - $pkg ($ecosystem): $license"
  done
  echo ""

  if [[ "$MODE" == "block" ]]; then
    echo "🚫 工作階段已阻擋：請在提交前解決上述授權違規。"
    echo "   將 LICENSE_MODE=warn 設定為僅記錄而不阻擋，或將套件加入 LICENSE_ALLOWLIST。"
    exit 1
  else
    echo "💡 請檢閱上述違規。將 LICENSE_MODE=block 設定為防止在有授權問題時提交。"
  fi
else
  echo "✅ 所有 ${#RESULTS[@]} 個相依套件皆有合規的授權"
fi

exit 0
