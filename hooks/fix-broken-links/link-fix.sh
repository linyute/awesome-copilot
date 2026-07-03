#!/bin/bash
# fix-broken-links - link-fix.sh
#
# 代理程式編輯檔案後 (postToolUse)：取得它剛剛變更的檔案，
# 擷取每個 http(s) URL，並使用 curl 檢查每一個。
#   • 傳遞檔案路徑時（已編輯的檔案，從 hook 承載資料（payload）注入，或
#     在命令列上提供），任何非 200 的 URL 都會取得拼字變形
#     （http/https、www、結尾斜線），然後交給 Copilot CLI 代理程式以取得更多
#     替代方案，接著是互動式選單以進行 替換/移除/跳過。
#   • 在沒有檔案參數時，它僅列出損壞的連結 - 沒有替代
#     尋找，也沒有提示。
# 無論哪種方式，通用錨點文字都會被標記為 SEO 說明。
#
# 純 bash + grep/sed/curl，加上選用的 Copilot CLI 代理程式交接以取得建議。
# 涵蓋：HTML · Markdown · JS/TS · JSON · CSS · SQL · 範本（皆透過 URL 掃描）
# 需要：curl, grep, sed  |  選用：copilot  |  觸發條件：postToolUse
set -uo pipefail

# 下方的代理程式交接會呼叫 `copilot`，這本身可能會重新觸發此 hook。
# 子執行會標記此環境變數；如果存在此變數則立即退出，
# 以免發生遞迴呼叫。
[ -n "${FIX_BROKEN_LINKS_AGENT:-}" ] && exit 0

LIMIT=50
TIMEOUT=10
UA='Mozilla/5.0 (compatible; fix-broken-links/1.0)'
AGENT_MODEL='gpt-5-mini'   # 用於建議交接的輕量、低 token 模型
AGENT_TIMEOUT=60           # 代理程式逾時前的秒數
# 當 `timeout` 可用時，使用它來限制代理程式呼叫（coreutils；在
# 某些極簡/Git-Bash 設定中不存在），否則無限制地執行 copilot。
if command -v timeout >/dev/null 2>&1; then AGENT_RUN="timeout ${AGENT_TIMEOUT}"; else AGENT_RUN=""; fi
WEB_RE='\.(html?|xhtml|md|markdown|mdx|js|jsx|ts|tsx|vue|svelte|json|jsonl|css|sql|erb|jinja|j2|twig|ejs|pug|hbs)$'

command -v curl >/dev/null 2>&1 || { printf 'fix-broken-links: 找不到 curl\n' >&2; exit 0; }

# ── Hook 標準輸入 ─────────────────────────────────────────────────────────────
# 當作為 postToolUse hook 呼叫時，從 JSON 承載資料（payload）中擷取已編輯的檔案，
# 並將其作為位置參數注入，以便 collect_input 能夠取得它們。
_HOOK=""
if [ "$#" -eq 0 ] && [ ! -t 0 ]; then
  _HOOK=1                      # 作為 hook 呼叫：標準輸入攜帶工具承載資料
  _INPUT=$(cat)
  if command -v jq >/dev/null 2>&1; then
    _TOOL=$(printf '%s' "$_INPUT" | jq -r '.toolName // .tool_name // empty' 2>/dev/null)
    case "$_TOOL" in
      editFiles|edit|write|str_replace_editor|create_file|multiEdit|applyPatch)
        # 僅限此編輯工具剛剛變更的檔案 - 絕不進行更廣泛的存放庫掃描。
        mapfile -t _FILES < <(
          printf '%s' "$_INPUT" \
            | jq -r '.tool_input.files[]? // .toolInput.files[]? // .tool_input.path // .toolInput.path // empty' 2>/dev/null
        )
        [ "${#_FILES[@]}" -gt 0 ] && set -- "${_FILES[@]}"
        ;;
      "")
        # 無工具內容 - 透過管道輸入手動呼叫，直接進入下一階段
        ;;
      *)
        # 不同的工具（bash、read 等）- 無需檢查
        exit 0
        ;;
    esac
  fi
fi

# 非空的位置列表表示呼叫者傳遞了檔案：來自
# 上述 hook 承載資料的已編輯檔案，或在命令列上給出的路徑。只有在這種情況下，我們才會執行
# 完整的修復流程（尋找替代方案，然後提示修復）。如果不含
# 參數，我們只列出損壞的連結 - 不尋找替代方案，也沒有提示。
[ "$#" -gt 0 ] && HAVE_PARAMS=1 || HAVE_PARAMS=0

# 互動式輸入來自終端機，因為標準輸入可能攜帶 hook JSON。
# 透過實際開啟 /dev/tty 來進行探測 - 僅僅進行 -r/-w 測試可能會在開啟失敗的情況下通過。
TTY=/dev/tty
if { true >/dev/tty; } 2>/dev/null && { true </dev/tty; } 2>/dev/null; then
  TTY=/dev/tty
else
  TTY=""
fi
ask() {
  local p="$1" ans=""
  [ -z "$TTY" ] && { printf '%s' ""; return; }
  printf '%s' "$p" > "$TTY"
  IFS= read -r ans < "$TTY" || ans=""
  printf '%s' "$ans"
}

# ── 輔助函式 ───────────────────────────────────────────────────────────────────

http_status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" --location -A "$UA" "$1" 2>/dev/null
}

# 逸出 ERE 中介字元，以便字面字串可以安全地在 bash 的
# [[ =~ ]] 模式中使用。只有真正的中介字元會被逸出 - 反斜線逸出
# 普通字元（例如 '\:'）在 ERE 中是未定義的，且會導致比對失敗。
re_escape() {
  local s="$1" out="" c i bs='\' meta='.^$*+?()[]{}|\'
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    if [[ "$meta" == *"$c"* ]]; then out+="$bs$c"; else out+="$c"; fi
  done
  printf '%s' "$out"
}

# 將整個檔案讀入變數，並保留換行符。
read_file() { IFS= read -rd '' "$1" < "$2" || true; }

# 逸出 glob 中介字元（\ * ? [），以便在
# ${var//pattern/repl} 中字面比對字串，否則該模式會被解釋為 glob。URL
# 和 Markdown 連結範圍通常包含 ? 和 [ ]，因此這對於
# 正確的固定字串替換是必要的。
glob_escape() {
  local s="$1" out="" c i
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      '\'|'*'|'?'|'[') out+="\\$c" ;;
      *) out+="$c" ;;
    esac
  done
  printf '%s' "$out"
}

# 列印檔案中的每個 http(s) URL，修剪結尾標點符號並去重。
extract_urls() {
  grep -oiE 'https?://[^"'\''<> )]+' "$1" 2>/dev/null \
    | sed -E 's/[.,;:]+$//' \
    | sort -u
}

# 會降低 SEO 的通用錨點文字。
seo_scan() {
  grep -oiE '<a[^>]*>[[:space:]]*(click here|click|here|read more|more|this page|this|learn more|see more|view|visit|details|info)[[:space:]]*</a>' "$1" 2>/dev/null
  grep -oiE '\[(click here|click|here|read more|more|this page|learn more|see more|details|info)\]\(' "$1" 2>/dev/null
}

# 嘗試常見的 URL 變形；回應第一個傳回 200 的 URL，否則不傳回任何內容。
find_variation() {
  local url="$1" scheme rest host path cand
  scheme="${url%%://*}"
  rest="${url#*://}"
  host="${rest%%/*}"
  if [ "$rest" = "$host" ]; then path=""; else path="/${rest#*/}"; fi

  local cands=()
  case "$scheme" in
    http)  cands+=("https://${host}${path}") ;;
    https) cands+=("http://${host}${path}") ;;
  esac
  if [[ "$host" == www.* ]]; then
    cands+=("${scheme}://${host#www.}${path}")
  else
    cands+=("${scheme}://www.${host}${path}")
  fi
  if [ -n "$path" ] && [[ "$path" != */ ]] && [[ "${path##*/}" != *.* ]]; then
    cands+=("${url%/}/")
  fi

  for cand in "${cands[@]}"; do
    [ "$cand" = "$url" ] && continue
    [ "$(http_status "$cand")" = "200" ] && { printf '%s' "$cand"; return 0; }
  done
  return 1
}

# 將損壞的連結提交給 Copilot CLI 代理程式，並讓其提議替代方案。
# 這是一個特意設計的輕量、低 token 交接：向小型模型傳送單個非互動式
# 提示詞，且不啟用任何工具 - 代理程式根據其自身的知識進行回答，
# 因此我們這邊沒有網頁擷取、沒有權限提示，也沒有封存
# 尋找。模型可能會加上散文字首，因此我們從輸出中的
# 任何位置提取 http(s) token，修剪結尾標點符號，捨棄損壞的 URL
# 本身，並去重（不區分大小寫）。最多 MAX 行，每行一個 URL。
agent_alts() {
  local url="$1" max="$2" prompt out prompt_url
  command -v copilot >/dev/null 2>&1 || return 0
  prompt_url="$(sanitize_prompt_url "$url")"
  prompt="在 $((AGENT_TIMEOUT - 5)) 秒內，為損壞的連結 ${prompt_url} 尋找最多 ${max} 個可用的替代 URL。請依序考慮：1. 路徑和/或網頁拼字；2. web.archive.org/wayback；3. 使用重新導向目標的重新導向；4. 連結文字的內容，以解決此問題。僅輸出 URL，每行一個，請勿包含：說明文字、編號、Markdown、反引號、特殊字元或後置格式化。"
  # FIX_BROKEN_LINKS_AGENT 會標記子執行，以便重入的 hook 提早退出。
  out="$(FIX_BROKEN_LINKS_AGENT=1 $AGENT_RUN copilot -p "$prompt" \
          -s --no-color --model "$AGENT_MODEL" --available-tools 2>/dev/null)"
  # 如果 copilot 發生錯誤、逾時或沒有產生任何內容，則不提供替代方案。
  [ $? -eq 0 ] && [ -n "$out" ] || return 0
  printf '%s\n' "$out" \
    | grep -oiE 'https?://[^][:space:]"'\''<>)]+' \
    | sed -E 's/[.,;:]+$//' \
    | awk -v bad="$url" 'tolower($0) != tolower(bad) && !seen[tolower($0)]++' \
    | head -n "$max"
}

# 輸出最多 MAX 個可行的損壞連結替代 URL，最佳的排在最前面：
#   1. 有效的配置/www/斜線變形（經即時驗證為 200）
#   2. 由 Copilot CLI 代理程式提議的替代方案（參見 agent_alts)
# 輸出以換行符分隔並去重（不區分大小寫）。第一行
# 是 `r` 所使用的內容；其餘則成為有編號的替代方案。
suggest_alts() {
  local url="$1" max="${2:-6}" cand key
  local -A seen=()
  local out=()

  cand="$(find_variation "$url")" && [ -n "$cand" ] && { out+=("$cand"); seen["${cand,,}"]=1; }

  while IFS= read -r cand; do
    [ "${#out[@]}" -ge "$max" ] && break
    [ -z "$cand" ] && continue
    key="${cand,,}"; [ -n "${seen[$key]:-}" ] && continue
    out+=("$cand"); seen[$key]=1
  done < <(agent_alts "$url" "$max")

  [ "${#out[@]}" -eq 0 ] && return 0
  printf '%s\n' "${out[@]}"
}

# 準備要在殼層（shell）建構的提示字串中安全嵌入的 URL。
# 這是對源自文件內容的值進行的縱深防禦。
sanitize_prompt_url() {
  local s="$1"
  s="${s//$'\r'/ }"
  s="${s//$'\n'/ }"
  s="${s//\`/\\\`}"
  s="${s//\$/\\\$}"
  printf '%s' "$s"
}

# 在檔案中隨處替換字面 URL（純 bash，無正規表示式）。
replace_url() {
  local file="$1" old="$2" new="$3" content pat
  read_file content "$file"
  pat="$(glob_escape "$old")"
  printf '%s' "${content//$pat/$new}" > "$file"
}

# 移除連結包裝但保留可見文字：
#   <a href="URL">文字</a>  ->  文字
#   [文字](URL)             ->  文字
# 每個匹配的包裝都會透過字面替換換成其內部文字。
remove_link() {
  local file="$1" url="$2" content esc re pat
  read_file content "$file"
  esc="$(re_escape "$url")"
  for re in \
    '<a[^>]*href="'"$esc"'"[^>]*>([^<]*)</a>' \
    "<a[^>]*href='${esc}'[^>]*>([^<]*)</a>" \
    '\[([^]]*)\]\('"$esc"'[^)]*\)'; do
    while [[ $content =~ $re ]]; do
      # 匹配的跨度通常包含 [ 和 ] (Markdown)，它們是 glob
      # 中介字元，因此在字面替換之前對其進行逸出。
      pat="$(glob_escape "${BASH_REMATCH[0]}")"
      content="${content//$pat/${BASH_REMATCH[1]}}"
    done
  done
  printf '%s' "$content" > "$file"
}

# ── 檔案探索 ──────────────────────────────────────────────────────────────────

collect_input() {
  if [ "$#" -gt 0 ]; then printf '%s\n' "$@"; return; fi
  # 作為 hook 觸發，但承載資料（payload）未攜帶（網頁）檔案：不執行任何動作，而不是
  # 回復為掃描無關檔案 - 此 hook 僅檢查已編輯的檔案。
  [ -n "$_HOOK" ] && return
  local out=""
  if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    out="$({ git diff --name-only HEAD; git diff --name-only --cached; } 2>/dev/null)"
  fi
  if [ -n "$out" ]; then printf '%s\n' "$out"; return; fi
  find . -type d \( -name .git -o -name node_modules -o -name dist -o -name build \
    -o -name .next -o -name .venv -o -name __pycache__ \) -prune \
    -o -type f -print 2>/dev/null
}

declare -A SEEN
FILES=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  case "$f" in */node_modules/*|*/.git/*|*/dist/*|*/build/*) continue ;; esac
  printf '%s\n' "$f" | grep -qiE "$WEB_RE" || continue
  [ -n "${SEEN[$f]:-}" ] && continue
  SEEN[$f]=1
  FILES+=("$f")
done < <(collect_input "$@")

[ "${#FILES[@]}" -eq 0 ] && exit 0

# ── 掃描 ──────────────────────────────────────────────────────────────────────

B_FILE=(); B_URL=(); B_STATUS=(); B_ALT=()
SEO_LINES=()

for file in "${FILES[@]}"; do
  while IFS= read -r line; do
    [ -n "$line" ] && SEO_LINES+=("$file: $line")
  done < <(seo_scan "$file")

  mapfile -t urls < <(extract_urls "$file")
  [ "${#urls[@]}" -eq 0 ] && continue

  if [ "$HAVE_PARAMS" = "1" ] && [ "${#urls[@]}" -gt "$LIMIT" ]; then
    ans="$(ask "  ${file} 有 ${#urls[@]} 個連結（限制為 ${LIMIT}）。是否繼續？ [Y/n] ")"
    case "$ans" in n|N|no|NO) continue ;; esac
  fi

  printf '\n  正在檢查 %s 中的 %d 個連結 ...\n' "$file" "${#urls[@]}"
  for url in "${urls[@]}"; do
    status="$(http_status "$url")"
    [ "$status" = "200" ] && continue
    printf '    損壞 (%s) %s\n' "$status" "$url"
    # 僅在傳遞檔案時尋找替代方案；否則僅列出。
    alts=""
    [ "$HAVE_PARAMS" = "1" ] && alts="$(suggest_alts "$url" 6)"
    B_FILE+=("$file"); B_URL+=("$url"); B_STATUS+=("$status"); B_ALT+=("$alts")
  done
done

# ── SEO 報告 ──────────────────────────────────────────────────────────────────

if [ "${#SEO_LINES[@]}" -gt 0 ]; then
  printf '\n%s\n  SEO 錨點問題（請考慮使用具描述性的連結文字）\n' "------------------------------------------------------------"
  for s in "${SEO_LINES[@]}"; do printf '    %s\n' "$s"; done
fi

if [ "${#B_URL[@]}" -eq 0 ]; then
  printf '\n  未發現損壞的連結。\n\n'
  exit 0
fi

# ── 互動式修復 ─────────────────────────────────────────────────────────────────

printf '\n%s\n  fix-broken-links 報告\n%s\n' "============================================================" "============================================================"

declare -A CHANGED
n="${#B_URL[@]}"
for ((i=0; i<n; i++)); do
  file="${B_FILE[$i]}"; url="${B_URL[$i]}"; status="${B_STATUS[$i]}"
  printf '\n  [%d] %s\n' "$((i+1))" "$file"
  printf '    URL : %s\n' "$url"
  note=""; case "$status" in ERR|000|TIMEOUT) note="  (無法連線)" ;; esac
  printf '    HTTP: %s%s\n' "$status" "$note"

  # 無檔案參數 → 僅限報告：列出損壞的連結並繼續。
  [ "$HAVE_PARAMS" = "1" ] || continue

  alts=(); [ -n "${B_ALT[$i]}" ] && mapfile -t alts <<< "${B_ALT[$i]}"
  printf '\n'
  if [ "${#alts[@]}" -gt 0 ]; then
    printf '    r  替換 -> %s\n' "${alts[0]}"
    for ((k=1; k<${#alts[@]}; k++)); do
      printf '    %d  替換 -> %s\n' "$k" "${alts[$k]}"
    done
  fi
  printf '    d  移除連結，保留文字\n'
  printf '    c  自訂替換 URL\n'
  printf '    s  跳過\n'

  if [ -z "$TTY" ]; then
    printf '    （無終端機 - 僅進行報告）\n'
    continue
  fi

  while true; do
    ch="$(ask '  > ')"
    case "$ch" in
      s|"") break ;;
      d) remove_link "$file" "$url"; CHANGED[$file]=1; printf '    已移除\n'; break ;;
      r) if [ "${#alts[@]}" -gt 0 ]; then
           replace_url "$file" "$url" "${alts[0]}"; CHANGED[$file]=1; printf '    已替換 -> %s\n' "${alts[0]}"; break
         fi
         printf '    無可用建議\n' ;;
      [1-9]) if [ "$ch" -lt "${#alts[@]}" ]; then
               replace_url "$file" "$url" "${alts[$ch]}"; CHANGED[$file]=1; printf '    已替換 -> %s\n' "${alts[$ch]}"; break
             else printf '    無效的選擇\n'; fi ;;
      c) u="$(ask '  URL: ')"
         if [ -n "$u" ]; then replace_url "$file" "$url" "$u"; CHANGED[$file]=1; printf '    已替換\n'; break; fi ;;
      *) printf '    無效的選擇\n' ;;
    esac
  done
done

if [ "${CHANGED[*]+x}" = x ] && [ "${#CHANGED[@]}" -gt 0 ]; then
  printf '\n  %d 個檔案已更新：\n' "${#CHANGED[@]}"
  for f in "${!CHANGED[@]}"; do printf '    %s\n' "$f"; done
  printf '\n'
fi
exit 0
