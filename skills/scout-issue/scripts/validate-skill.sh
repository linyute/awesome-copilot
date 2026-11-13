#!/usr/bin/env bash
# 以有意義的方式驗證 Issue Scout 技能：必要檔案存在、
# SKILL.md 包含完整管線、每個 gh/git 指令格式正確、
# 範例中使用的旗標皆受支援，且快速參考與較深入的文件保持同步。
#
# 從技能資料夾根目錄執行，例如 `cd skills/scout-issue && bash scripts/validate-skill.sh`。
set -euo pipefail

errors=0
fail() {
  echo "  FAIL  $*"
  errors=$((errors + 1))
}

# --- 結構：必要檔案與目錄 ---------------------------
required_files=(SKILL.md LICENSE)
required_dirs=(examples references)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || fail "缺少檔案：$file"
done
for dir in "${required_dirs[@]}"; do
  [[ -d "$dir" ]] || fail "缺少目錄：$dir/"
done

# --- 內容：SKILL.md 必須包含完整管線 ---------------------
skill=SKILL.md
[[ -f "$skill" ]] || exit 1
for heading in "Phase 1: User Interrogation" "Phase 2: Issue Detection" \
  "Phase 3: Issue Analysis & Ranking" "Phase 4: Output Formatting" \
  "Investigation Mode" "Implementation Planning"; do
  if ! grep -qF "## $heading" "$skill"; then
    fail "SKILL.md 缺少標題 \"## $heading\""
  fi
done

# --- 指令驗證：gh/git 子指令路徑與旗標 ---------------
# 有效的 gh 頂層指令及其子指令。
GH_TOPLEVEL="alias api auth browse cache codespace config environment extension gist gpg-key issue label org pr project release repo ruleset search secret ssh-key status variable workflow"
# 接受子指令的頂層群組所允許的子指令（以空白分隔）。
GH_ISSUE_SUBS="list view status create close reopen lock unlock pin unpin"
GH_PR_SUBS="list view diff checkout create close merge reopen lock ready comment review"
GH_REPO_SUBS="view clone create delete fork rename edit"
GH_SEARCH_SUBS="issues prs code"

# 此技能中使用的 gh 指令所支援的旗標（依子指令群組）。
GH_ISSUE_LIST_FLAGS="state,limit,label,assignee,author,search"
GH_ISSUE_VIEW_FLAGS="comments,json,jq"
GH_PR_LIST_FLAGS="state,search,limit,json,jq,base,author"
GH_PR_VIEW_FLAGS="json,jq"
GH_PR_DIFF_FLAGS="name-only,exclude"
GH_SEARCH_FLAGS="state,label,sort,order,limit,search,json,jq,repo"
GH_API_FLAGS="jq,paginate,method,field,raw-field,input,header,cache,silent,preview,hostname,template,verbose,include,slurp"

# git 子指令（來自原始指令碼）
GIT_SUBS="add am annotate apply archive bisect blame branch bundle cat-file check-attr check-ignore check-mailmap check-ref-format checkout cherry cherry-pick clean clone column commit config count-objects credential describe diff diff-files diff-index diff-tree difftool fetch filter-branch for-each-ref format-patch fsck gc get-tar-commit-id grep help init instaweb log ls-files ls-remote ls-tree mailinfo mailsplit merge merge-base merge-file merge-index merge-one-file mergetool mktag mktree mv name-rev notes pack-objects pack-redundant pack-refs patch-id prune prune-packed pull push quilt-pop range-diff reflog remote repack replace request-pull reset restore revert rev-list rev-parse rm send-email shortlog show show-branch show-index show-ref stash status stripspace submodule subtree symbolic-ref tag unpack-file unpack-objects update-index update-ref update-server-info var verify-commit verify-pack verify-tag whatchanged worktree"

check_flags() {
  local file="$1"
  local label="$2"
  local flags_str="$3"
  local rest="$4"
  local flag flag_name

  for flag in $rest; do
    case "$flag" in
      --*) ;;
      *) continue ;;
    esac
    flag_name="${flag#--}"
    flag_name="${flag_name%%=*}"
    if ! echo ",$flags_str," | grep -q ",${flag_name},"; then
      fail "$file：$label 的未知旗標 \"$flag\""
      return 1
    fi
  done
}

check_command() {
  local file="$1"
  local line="$2"
  local cmd sub rest

  case "$line" in
    gh\ *)
      read -r cmd sub rest <<<"$line"
      # 驗證頂層子指令
      if [[ " $GH_TOPLEVEL " != *" $sub "* ]]; then
        fail "$file：未知的 gh 子指令 \"$sub\""
        return
      fi
      # gh api 與 auth 不接受有意義的第二層子指令。
      if [[ "$sub" == "api" ]]; then
        check_flags "$file" "gh api" "$GH_API_FLAGS" "$rest" || true
        return
      fi
      if [[ "$sub" == "auth" ]]; then
        return
      fi
      # 需要第二層子指令的頂層群組
      local subs=""
      case "$sub" in
        issue) subs="$GH_ISSUE_SUBS" ;;
        pr) subs="$GH_PR_SUBS" ;;
        repo) subs="$GH_REPO_SUBS" ;;
        search) subs="$GH_SEARCH_SUBS" ;;
        *) subs="" ;;
      esac
      if [[ -n "$subs" ]]; then
        local second
        read -r second _ <<<"$rest"
        if [[ -z "$second" ]]; then
          fail "$file：gh $sub 缺少子指令"
          return
        fi
        if [[ " $subs " != *" $second "* ]]; then
          fail "$file：未知的 gh $sub 子指令 \"$second\""
          return
        fi
        # 驗證此路徑的旗標
        local flags_str=""
        case "$sub/$second" in
          issue/list) flags_str="$GH_ISSUE_LIST_FLAGS" ;;
          issue/view) flags_str="$GH_ISSUE_VIEW_FLAGS" ;;
          pr/list) flags_str="$GH_PR_LIST_FLAGS" ;;
          pr/view) flags_str="$GH_PR_VIEW_FLAGS" ;;
          pr/diff) flags_str="$GH_PR_DIFF_FLAGS" ;;
          search/issues|search/prs) flags_str="$GH_SEARCH_FLAGS" ;;
        esac
        if [[ -n "$flags_str" ]]; then
          check_flags "$file" "gh $sub $second" "$flags_str" "$rest" || true
        fi
      fi
      ;;
    git\ *)
      read -r cmd sub rest <<<"$line"
      if [[ " $GIT_SUBS " != *" $sub "* ]]; then
        fail "$file：未知的 git 子指令 \"$sub\""
      fi
      ;;
    *)
      # 非 gh/git 指令，跳過
      ;;
  esac
}

# --- 指令：每個 gh/git 指令都必須格式正確 -------------------
check_commands() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  local line
  # 連接反斜線接續行，以便檢查接續行上的旗標。
  while IFS= read -r line; do
    case "$line" in
      gh | git)
        fail "$file：僅有 \"$line\" 指令（是否被截斷？）"
        ;;
      gh\ * | git\ *)
        check_command "$file" "$line"
        ;;
    esac
  done < <(awk '
    /\\$/ {
      sub(/\\$/, " ")
      printf "%s", $0
      next
    }
    { print }
  ' "$file")
}

for f in "$skill" references/*.md examples/*.md; do
  check_commands "$f"
done

# --- 負面測試 Fixtures：驗證每個無效指令都會被捕捉 -------------
# 每個 fixture 皆獨立檢查。預期的失敗會被計數，然後
# 從真實錯誤計數中移除；被接受的 fixture 則是真正的失敗。
negative_fixtures=(
  "gh issue definitely-not-a-subcommand"
  "gh pr view --files"
  "gh issue list --sort updated"
  "git definitely-not-a-subcommand"
  "gh api --invalid-flag"
)
fixture_errors=0
for fixture in "${negative_fixtures[@]}"; do
  before=$errors
  check_command "negative fixture" "$fixture" >/dev/null
  if (( errors > before )); then
    fixture_errors=$((fixture_errors + errors - before))
    errors=$before
  else
    fail "驗證器接受了負面 fixture：$fixture"
  fi
done

# --- 負面測試 Fixture：反斜線接續行上的旗標會被驗證 ---
# check_commands 必須連接接續行；否則指令第二行上的錯誤旗標
# （如 SKILL.md 中的分頁 REST 範例）將會漏掉。
continuation_fixture=$(mktemp)
printf 'gh api "repos/o/r/issues" --paginate \\\n  --invalid-flag\n' >"$continuation_fixture"
before=$errors
check_commands "$continuation_fixture" >/dev/null
if (( errors > before )); then
  fixture_errors=$((fixture_errors + errors - before))
  errors=$before
else
  fail "驗證器接受了反斜線接續指令上的無效旗標"
fi
rm -f "$continuation_fixture"

# --- 同步：快速參考不得捏造指令 -------------------
# 快速參考中的每個 gh/git 子指令對也必須在 SKILL.md 或
# 較深入的參考資料中使用，使速查表不會偏離而記錄語料庫不支援的指令。
check_reference_sync() {
  local quick_ref="$1"
  local known_list pair
  known_list=$({ grep -hoE "^(gh|git) [a-z-]+" "$skill" references/tool-patterns.md references/workflow.md || true; } | sort -u)
  while IFS= read -r pair; do
    if ! grep -qF "$pair" <<<"$known_list"; then
      fail "$quick_ref 使用了 \"$pair\"，但該指令未在 SKILL.md、tool-patterns.md 或 workflow.md 中使用"
    fi
  done < <(grep -hoE "^(gh|git) [a-z-]+" "$quick_ref")
}

check_reference_sync references/quick-reference.md

# --- 迴歸測試：參考同步失敗必須以非零結束 ---------------
# 針對快速參考包含語料庫未記錄之有效指令對的暫存複本執行驗證器。
# 巢狀執行會跳過此迴歸測試以避免遞迴。
if [[ -z "${SCOUT_VALIDATOR_SELF_TEST:-}" ]]; then
  regression_dir=$(mktemp -d)
  cp -R . "$regression_dir/skill"
  printf '\ngh gist list\n' >> "$regression_dir/skill/references/quick-reference.md"
  if ( cd "$regression_dir/skill" && SCOUT_VALIDATOR_SELF_TEST=1 bash scripts/validate-skill.sh >/dev/null 2>&1 ); then
    fail "參考同步迴歸測試：對於包含未記錄指令的快速參考，驗證器卻以 0 結束"
  fi
  rm -rf "$regression_dir"
fi

if (( errors > 0 )); then
  echo ""
  echo "技能驗證失敗：$errors 個錯誤。"
  exit 1
fi

echo ""
echo "技能驗證通過：結構、管線標題、指令、旗標、參考同步，以及已拒絕 $fixture_errors 個負面 fixture(s)。"