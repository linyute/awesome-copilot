# 測試控管環境注意事項 - Claude Code、Codex 與 OpenClaw

本技能是一個單一目錄，符號連結 (symlinked) 至各個代理人測試控管環境 (`~/.claude/skills/ponder`、
`~/.agents/skills/ponder` 及 `~/.codex/skills/ponder`)。此處列出實際會影響您輸入內容的
所有差異。

## 安裝

單一事實來源，從 [`Quinnod345/ponder`](https://github.com/Quinnod345/ponder) 的本機簽出版本透過符號連結至各處：

```sh
git clone https://github.com/Quinnod345/ponder.git ~/code/ponder
~/code/ponder/install.sh
```

它會將 `skill/ponder` 連結至 `~/.claude/skills/ponder`、`~/.agents/skills/ponder` (以及
當 `~/.codex` 存在時的 `~/.codex/skills/ponder`)，並將 `bin/ponder` 連結至 `~/.local/bin`，然後執行
`ponder doctor`。重複執行是安全的 — 它會替換自身的符號連結，並拒絕覆寫實際的
目錄。手動執行的對應指令：

```sh
ln -s ~/code/ponder/skill/ponder ~/.claude/skills/ponder
ln -s ~/code/ponder/skill/ponder ~/.agents/skills/ponder
chmod +x ~/code/ponder/bin/ponder
ln -s ~/code/ponder/bin/ponder ~/.local/bin/ponder
```

`bin/ponder` 是一個 POSIX `sh` 填充碼 (shim)，而非 JavaScript。這是刻意設計的：無副檔名的 JS 檔案會觸發
Node 的模組解析問題。它在執行 `exec node …/lib/cli.js "$@"` 之前會先走訪自身的符號連結鏈，因為
若不這樣做，符號連結到 PATH 的 `ponder` 會去尋找 `~/.local/lib/cli.js`。請勿「修正」這兩個
部分的任何一處。

### Front Matter

僅包含兩個鍵，因為只有這兩個鍵在兩種控管環境中均屬有效：

```yaml
---
name: ponder
description: …
---
```

Codex 額外支援選填的 `metadata:` 區塊 — `disable-model-invocation`
(`~/.codex/skills/zoom-out/SKILL.md`)、`argument-hint` (`~/.codex/skills/handoff/SKILL.md`) 及
`short-description` (`~/.codex/vendor_imports/skills/skills/.curated/linear/SKILL.md`)。Claude Code
則是在頂層直接讀取這些鍵，而非巢狀結構 — 對比其自身的 zoom-out 複本，後者
帶有獨立的 `disable-model-invocation: true`。因此，`metadata:` 區塊會導致單一檔案在兩種安裝環境下
行為不一致，故本技能不使用該區塊。

front matter 必須遵守的另一項規則是 YAML 規範，且它恰好會在一個地方造成問題：純量
不能包含 `: ` (冒號後接空格)。`description` 是一行充滿引號觸發片語的冗長散文，
其中只要有一個遺漏的冒號後接空格，就會使整個區塊無法剖析 — 這在兩種
控管環境中都會導致技能無訊息地無法載入，而非明確報錯。在進行任何編輯之後：

```sh
python3 -c "import yaml,sys; d=yaml.safe_load(open(sys.argv[1]).read().split('---',2)[1]); \
  assert set(d) == {'name','description'}, d.keys(); print('ok:', d['name'], len(d['description']))" \
  ~/code/ponder/skill/ponder/SKILL.md
```

### 檢查安裝狀態

```sh
ls -l ~/.claude/skills/ponder ~/.codex/skills/ponder    # 兩者均應指向 ~/code/ponder/skill/ponder
head -4 ~/.claude/skills/ponder/SKILL.md                 # 透過符號連結確認 front matter 完好
ponder doctor                                            # 引擎是否可連線，以及其可見的範圍
```

在 **Claude Code** 中，該技能隨後會出現在可用技能清單中；`/ponder` 可呼叫它，
Skill 工具搭配 `skill: "ponder"` 亦可。在 **Codex** 中，位於 `$CODEX_HOME/skills` (預設為
`~/.codex/skills`) 下的技能會在安裝後的**下一個回合**被載入，而非當前這一輪 — 若它
未立即觸發，原因便在於此。

## 呼叫方式

兩種控管環境均會根據 `description` 由模型自動呼叫技能，且均接受明確的 `/ponder`。
實務上的差異：Claude Code 每回合都會向模型呈現技能清單，因此觸發片語
能在對話中途可靠觸發。在 Codex 中，於漫長工作階段深處呼叫技能有時
需要明確的 `/ponder` — 若使用者說「繼續深思 (keep pondering)」卻未載入任何內容，請直接依路徑讀取 SKILL.md
並繼續執行，無需爭辯：

```sh
cat ~/code/ponder/skill/ponder/SKILL.md
```

## 子代理人與分散展開 (Subagents and Fan-out)

| | Claude Code | Codex |
|---|---|---|
| 處理程序內子代理人 | **Agent 工具。** 單一訊息中的多次呼叫會平行執行。將文字傳回給父處理程序。 | 無。 |
| 極大型掃描 | **Workflow 工具** - 在批次處理、重試與收集方面優於手動編排的平行代理人。 | 無。 |
| 子處理程序代理人 | 可行，但極少有此必要 | **`codex exec`** - 主要機制 |
| 背景執行 | Bash 工具 `run_in_background`，加上 Monitor 等候特定條件 | `&` + `wait`，或 `nohup … &` 並輪詢輸出檔案 |

對於分散展開至關重要的 `codex exec` 旗標：

```sh
codex exec -C "$PWD" \
  --sandbox workspace-write \
  --skip-git-repo-check \
  -o .ponder/tmp/batch-3.txt \
  "…prompt…"
```

- `-C, --cd <DIR>` - 子處理程序的工作根目錄。
- `-s, --sandbox read-only|workspace-write|danger-full-access` - 子處理程序專屬的沙盒，獨立
  於您的沙盒之外。
- `--add-dir <DIR>` - 額外的可寫入目錄，若工作階段狀態位於工作區外部時需要此設定。
- `-o, --output-last-message <FILE>` - 將子處理程序的最後一則訊息寫入檔案。**這是讓
  分散展開結果可收集的關鍵。** 讓子處理程序將其 JSONL 寫入磁碟，並僅傳回路徑加上
  筆數；此時 `-o` 是您的回條，而非實際承載資料。
- `--output-schema <FILE>` - 最終回應的 JSON 結構描述 (Schema)，用於強制要求結構。
- `--json` - 在 stdout 上以 JSONL 形式輸出事件串流，用於進度監控。
- `--ephemeral` - 磁碟上不保留工作階段檔案，適用於拋棄式批次。

其中兩項屬於關鍵必備設定而非選用設定，且兩者均已在此機器上針對
codex-cli 0.147.0 進行過驗證：

- **`--skip-git-repo-check` 不是過度多慮。** 若無此設定，子處理程序在執行任何工作前就會拒絕執行 —
  `Not inside a trusted directory and --skip-git-repo-check was not specified`，結束代碼 `1`。若對
  非 git 簽出目錄的主題進行分散展開，每個批次都會立即以相同方式失敗，
  看起來像是提示詞問題，但實際並非如此。
- **`codex exec` 即使提示詞作為引數提供時也會讀取 stdin** (`Reading additional input from
  stdin...`)。若使用 `&` 在背景執行，它會繼承父處理程序的 stdin，因此請進行重導向：`… </dev/null &`。
  從 `/dev/null` 它會接收到 EOF 並繼續執行；若面對無人關閉的管道則會陷入停滯。

`codex exec` 會啟動**全新的工作階段**。它不繼承您的任何上下文，並會從 `-C` 載入其專屬的
`AGENTS.md` 鏈。該批次所需的一切都必須置於提示詞或其可讀取的檔案中。

## 工作階段鎖定 (The Session Lock)

**引擎本身具有鎖定機制。無需針對遺失更新 (lost-update) 競爭進行防禦設計 — 不存在此問題。** 本檔案先前的
修訂版本提出了相反陳述，要求您防範一項並不存在的危險。以下是從
`lib/session.js` 讀出並在此機器上重現的真實運作機制。

在執行任何寫入狀態的指令之前，`lockSession()` 會對工作階段目錄取得互斥鎖定：
`units`、`predict`、`grade`、`deliberate`、`delta`、`judge`、`decide`、`apply`、`abort` 以及
`verify --repair`。唯讀指令 — `status`、`report`、`list`、`doctor` 及純粹的
`verify` — 均不取得鎖定，因此即使某次 pass 正在寫入過程中，您也隨時可以查詢工作階段狀態。
`verify` 是唯一鎖定行為取決於旗標的指令，原因顯而易見：加上
`--repair` 會重寫狀態檔案，不加則完全不寫入任何內容。

| | |
|---|---|
| 機制 | `open(.ponder/<slug>/.lock, 'wx')` - 原子性建立互斥檔案。獲勝者將其 pid 與時間戳記寫入檔案中；該檔案的*存在*即代表鎖定 |
| 競爭指令 | 每 60 毫秒輪詢一次 (`Atomics.wait`，不耗費 CPU 旋轉)，最長等候 **10 秒** |
| 等候逾時 | 以結束代碼 **`1`** 結束：`another ponder command is already working on <slug>.` - 並指名該鎖定檔案 |
| 過期回收 | mtime 超過 **120 秒** 的 `.lock` 會被刪除並重新取得。這涵蓋了 `kill -9` 的情況 |
| 正常釋放 | 指令完成時呼叫 `unlink`，加上針對 `process.exit()` 的處理程序 `exit` 勾點 (hook) |
| 無法鎖定的存放區 | 若因 `EEXIST` 以外的任何原因無法建立鎖定，指令會在無鎖定情況下直接執行。安全機制絕不能變成新的故障源 |

**真實競爭中失敗者所見的情況。** 在同一次 pass 中同時觸發兩個 `ponder delta` 呼叫，測試結果如下：

```
A rc=2   error out of order: "ponder delta" satisfies revise, but this session owes judge.
B rc=0   ponder delta - pass 1, 1 delta applied
```

鎖定使它們循序執行，而階段狀態機則完成了剩餘工作。B 取得了鎖定，套用了其批次，
並將階段從 `revise` 推進至 `judge`。A 等候了數毫秒，取得鎖定，從磁碟重新載入
`session.json` — 此時應執行的階段為 `judge`，因此其 `ponder delta` 順序錯誤並以結束代碼 `2` 結束，
未套用任何內容。總帳精確增加了一行，`findings.json` 與之一致，
階段精確推進了一次。同時執行兩個 `ponder decide` 只會記錄一次 pass，而非兩次。針對同一個 slug 同時執行兩次
`ponder start`：不帶 `recursive` 的 `mkdir` 是原子性的所有權宣告，因此第二個呼叫會以結束代碼 `1` 結束，
提示 `session "<slug>" already exists`。

一致性驗證套件鎖定了此行為：在 `concurrency: racing deltas have exactly one winner` 中包含 **45 項檢查**，
在 `concurrency: racing decisions and starts have one winner too` 中另有 14 項檢查，跨三個全新
工作階段執行，因為無鎖定引擎只會在部分時間輸掉競爭。若將 `lockSession` 改為無操作 (no-op)，
這兩組測試均會失敗。

**這對分散展開意味著什麼。** 規則維持不變 — *僅有父處理程序執行 `ponder`* — 但其
原因在於執行順序，而非資料毀損。競爭會有獲勝者與失敗者，而**失敗者的工作會被
拒絕，而非被合併**。呼叫 `ponder delta` 卻未檢查結束代碼的子代理人，會在整批工作
完全未被採納的情況下回報成功。因此：批次代理人將 JSONL 寫入磁碟並傳回路徑加上
筆數，由父處理程序進行串接並發出單一呼叫。這也能將 `f-NNNN` 的指派與總帳
集中於一處，而這正是它們所屬的位置。

兩點實務注意事項。相較於通常在一秒內完成的指令，10 秒的等候時間相當充裕，
但卡在緩慢 OCA 橋接器呼叫 (每次呼叫 5 秒) 的指令可能會超過該時間 — 若佇列中的指令
因鎖定以結束代碼 `1` 結束，請重新執行該指令，而非刪除鎖定檔案。僅在確認建立該檔案的處理程序
已不存在時，才手動刪除 `.lock`；
否則請等候，或讓 120 秒的過期回收機制自動處理。

## 沙盒機制，以及 psql 是否可連線

**此機器上的 Claude Code：** Bash 工具處於沙盒中，但該沙盒並未封鎖 OCA。
經實測驗證：在工具內部執行 `psql "postgres://localhost/oneiro" -tAc "select 1"` 會傳回 `1`。寫入
專案樹狀結構完全正常。若橋接器呼叫確實遭受封鎖，ponder 在設計上會以無訊息方式降級 —
請檢查 `.ponder/<slug>/oca.log`，而非檢查引擎本身。

**此機器上的 Codex：** `~/.codex/config.toml` 設定了 `sandbox_mode = "danger-full-access"` 與
`approval_policy = "never"`，因此 psql 可以正常運作，且狀態可以寫入任何位置。

**在其他任何原則下的 Codex — 包括您自行產生的任何 `codex exec -s workspace-write`。**
以下三點源自 Codex 文件中記載的沙盒語意，**未**在此機器上進行過重現，
因為上述設定使此處無法觸及該失敗路徑。請將其視為預期行為，
並使用 `ponder doctor` 進行檢查，而非逕行假設：

- **在 `workspace-write` 下預設關閉網路。** 透過 TCP 連線至 `postgres://localhost/oneiro` 的
  `psql` 應會失敗。橋接器會傳回 `null`，迴圈維持相同運作，但您會失去先前審議的回憶能力
  以及 OCA 寫入功能。這是設計上的降級行為，並非錯誤 — 但切勿向使用者承諾
  在該沙盒環境中執行的工作階段具備跨工作階段記憶功能。
- **工作區外部的寫入操作會被封鎖。** `~/.ponder/<slug>/` 備用路徑應會失敗。請透過
  `ponder start --project "$PWD"` 將工作階段保留在專案內部，或在產生子處理程序時擴大其沙盒權限 —
  `codex exec --add-dir ~/.ponder`。`--add-dir` 是 **`codex exec`** 的旗標，而非
  ponder 的旗標；`ponder start --add-dir` 會以結束代碼 `1` 結束並提示 `unknown flag --add-dir`。
- **`read-only` 完全無法執行 pass** — 迴圈中的每個指令都會寫入狀態。不寫入任何內容的
  檢視指令 (`status`、`list`、不帶 `--repair` 的 `verify`) 應仍可運作，
  這足以查詢工作階段狀態，但無法推進進度。

`ponder doctor` 可以在一次呼叫中判定這三項狀況：它會印出 OCA 是否可連線，以及哪些
儲存庫根目錄具有可寫入權限。請在子沙盒內部執行它，而非在外部執行。

經驗法則：在任何不熟悉的控管環境中，將 `ponder doctor` 作為第一個執行的指令。它會回報 node、
psql、DSN、OCA 可連線性以及狀態將寫入何處，這正是這兩種環境之間
存在差異的全部關鍵項目。

## 上下文與壓縮 (Context and Compaction)

Claude Code 會對長工作階段進行壓縮，而壓縮是長期 ponder 工作階段中斷最常見的途徑。
Codex 沒有壓縮保證，且在實務上具有較小的有效工作視窗。
兩者的緩解措施相同且已內建於系統中：狀態保存在檔案中，且每個指令都會印出
`NEXT:`。在任何遺失之後，`ponder status` 會告訴您當前應執行的階段；`.ponder/<slug>/ledger.jsonl`
會記錄每一次 pass 所執行的每項操作及其原因。

針對 Codex 的具體實務建議：偏好採用將 JSONL 寫入磁碟並丟棄詳細資訊的循序批次，
而非在單一上下文中容納 40 個單元的完整程式碼。磁碟就是記憶體。

## 路徑

相對於技能的路徑參照 (`references/protocol.md`) 在各個控管環境中的解析方式不同 —
`~/.claude/skills/ponder/references/…` vs `~/.codex/skills/ponder/references/…`。兩者均為指向
同一處的符號連結，因此如有疑慮，請使用存放庫路徑，該路徑永遠是正確的：

```sh
~/code/ponder/skill/ponder/references/protocol.md
~/code/ponder/lenses/ui.md
```

工作階段狀態儲存於 `<project>/.ponder/`。其格式為純 JSON 與 JSONL。當總帳內容值得
跨分支與跨機器保留時，請將其認可至版本控制 — 這種歷史紀錄正是僅供附加 (append-only) 設計的初衷 —
否則請將 `.ponder/` 新增至 `.gitignore`。
切勿認可 `.ponder/tmp/`。

## 已知問題與陷阱

- **`codex exec` 停滯無輸出，包括 `--version`。** 在 macOS 上透過 SSH 或 tmux 啟動 codex 時曾見過此現象：
  這是 macOS Gatekeeper/amfid 針對安裝路徑進行的阻擋。請改為執行該二進位檔的乾淨路徑複本。
- **排隊中的指令因鎖定以結束代碼 `1` 結束。** 這並非資料毀損 — 工作階段鎖定發揮了作用且
  等候時間耗盡。請重新執行該指令。請參閱[工作階段鎖定](#工作階段鎖定)；切勿刪除
  `.lock` 檔案，除非確認建立該檔案的處理程序已結束。
- **技能編輯未生效。** 兩種控管環境均在載入時讀取 SKILL.md；請編輯存放庫複本
  (`~/code/ponder/skill/ponder/SKILL.md`) 並開啟新的回合 — 在 Codex 中則是開啟新工作階段。
- **位於 `:3333` 的 OCA 認知迴圈處理程序未執行。** ponder 中沒有任何功能依賴它；橋接器會
  直接呼叫 `psql`。若有任何訊息暗示並非如此，該訊息是錯誤的。
