# 驗證 (Validation)

本技能應用於公開存放庫中真實失敗作業的兩次記錄。下方的每個執行 ID、SHA 與命令皆為公開內容，因此每一項都可以重新檢驗或重播。

## 來源

七個步驟、四種失敗類別、驗證檢查清單以及規則，源自於 2026-10-24 在 `shauryagangrade/awesome-ai-prompts` 中發布的 [`ci-gate-diagnosis` prompt](https://github.com/shauryagangrade/awesome-ai-prompts/blob/main/devops-deploy/ci-gate-diagnosis-prompt.md)，當時本技能尚未建立。本技能將該工作流程封裝給 Copilot，並加入了固定格式的報告區塊、基準分支工作樹操作配方、僅限 `pull_request` 的注意事項，以及下方的驗證案例。

## 情境 1：本機綠燈執行，CI 紅燈執行

這是在 GitHub Copilot CLI 內部、在失敗認可的簽出環境上執行的記錄。CLI 版本為 1.0.105，模型為 `gpt-6-luna`（CLI 的預設選項，記錄在其自身的用量記錄中），發出 8 次模型請求，時間為 2026-11-03。該工作樹是完整複製 (full clone)，因此在執行開始前失敗的命令在本機是通過的。

**檢查：** `Docs structure + em dashes`，執行
[40202831763](https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40202831763)，
head 為 `3ba8bf96`，push 至 `main`，2026-10-25 14:33 UTC。

**記錄**，已裁切至失敗步驟：

```text
Job:    Docs structure + em dashes
Step:   Build all-prompts page (deterministic + in sync)
Run:    https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40202831763
Commit: 3ba8bf965671e6db8cb05ed089fe3127de9007ad

##[group]Run python3 scripts/build-all.py --check
python3 scripts/build-all.py --check
shell: /usr/bin/bash -e {0}
##[endgroup]
FAIL stale: website/sitemap.xml
run: python3 scripts/build-all.py to regenerate, or delete removed pages
##[error]Process completed with exit code 1.
```

**提示詞：**

```text
A CI check is failing on this repository and I need to know whether my change caused it.

The failed job log is in ./ci-log.txt. Use the diagnose-ci-gate skill in .github/skills/diagnose-ci-gate/SKILL.md and follow it.

Give me the skill's report, in its format. Do not change any files: I want the diagnosis, not a fix.
```

**回覆**，逐字內容：

````text
I’ll use the supplied job log first, then compare its SHA and failure against the base branch and recent CI evidence.

The run is a `main` push at the checked-out SHA, not a PR check; I’m checking the exact job log and nearby `main` runs now, including whether the generated sitemap was already stale before this commit.

```text
Check:       Docs structure + em dashes on 3ba8bf965671e6db8cb05ed089fe3127de9007ad
First error: FAIL stale: website/sitemap.xml (Build all-prompts page, `python3 scripts/build-all.py --check`)
Class:       pipeline — the generator reads Git history for sitemap dates, but CI’s default checkout is shallow.
Ownership:   pre-existing to 3ba8: the same failure occurred on main at 1c981e9 ([run](https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40202231365)); that commit introduced the Git-history dependency in `scripts/build-all.py:753-768`. 3ba8 changed only `.markdownlint-cli2.jsonc`.
Reproduced:  no — it passes locally on macOS with Python 3.14.7 and full Git history; CI used Ubuntu 24.04, and its Python version is not in the log.
Action:      fix pipeline — fetch the history the generator requires. The later revert at 64aae52 removed that dependency.
Result:      the check passed on the subsequent main run ([40203292949](https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40203292949)); no files changed.
```
````

**事後檢查驗證：**

- `get_git_lastmod()` 在 `1c981e9` 中新增，並在 `64aae52` 中移除。受測的認可 `3ba8bf96` 僅修改了 `.markdownlint-cli2.jsonc`。
- 父認可 `1c981e9` 在執行 [40202231365](https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40202231365) 中於同一個作業失敗，因此問題歸屬如報告所述屬於既有問題。
- 在 `3ba8bf96` 進行完整複製會通過：`OK (144 prompts, 162 files deterministic and in sync)`。而同一個認可的 depth-1 擷取（即 CI 預設的簽出方式）則會失敗並顯示 `FAIL stale: website/sitemap.xml`。
- 在 `64aae52` 的執行 [40203292949](https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40203292949) 已通過。

報告在全部五個重點上均完全正確，而分類是最具價值的部分：由於本機檢查呈現綠燈，技能必須解釋其差異，而非簡單回報「無法重現，可能是不穩定」。其自身註記無法得知 CI 的 Python 版本，也展現了適當的謹慎態度，因為重現嘗試是在 macOS 上進行的。

## 情境 2：重新執行無法修復的 404

執行 [40091680340](https://github.com/shauryagangrade/awesome-ai-prompts/actions/runs/40091680340)，作業為 `New external links (PR only)`，head 為 `5ea9cff6`，時間為 2026-10-24 11:53 UTC。該作業檢查由 Pull Request 新增的 URL：

```text
Checking 18 URL(s) added in `git diff origin/main...5ea9cff6`
[X] https://awesome-ai-prompts.vercel.app/prompt/security-performance/secrets-scanning-response (status 404)
17 of 18 links healthy
##[error]Process completed with exit code 1.
```

- **類別：** 管線 (pipeline)。頁面在 Pull Request 中已正確產生，但該 URL 指向服務 `main` 分支的正式環境部署；該頁面在該次執行結束 66 分鐘後才合併至 `main`。Pull Request 無法讓正式環境 URL 憑空存在，因此無論重試多少次或修改連結，都無法讓此項檢查變綠燈。
- **問題歸屬：** 該 URL 為 Pull Request 中新增的內容。此作業僅在 `pull_request` 上執行，因此沒有可比較的基準分支執行記錄，而記錄中引用的 diff 即為歸屬證據。
- **重現：** 無法再重現為 404，因為該頁面隨後已經部署。確定性的證據在於產生的頁面存在於 `5ea9cff6` 中，但在 `c283b32` 之前的 `main` 中並不存在，而正式環境主機服務的是 `main`。
- **行動：** 修復檢查的目標，而非修改連結。將即時線上檢查保留在排程執行中；在 Pull Request 上，針對建構輸出解析專案自身的主機，或略過由 diff 新增的自行託管 URL。

此情境說明了為何步驟 4 需要處理僅在 `pull_request` 上執行的作業，以及為何管線列包含斷言 Pull Request 無法產生之目標的檢查。
