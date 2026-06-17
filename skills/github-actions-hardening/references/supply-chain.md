# 供應鏈 (Supply Chain)

每次在工作流中 `uses:` 一個 Action 時，您都在執行他人的代碼。這些 Action 以您的令牌執行，並且（在高權限觸發器上）還會使用您的秘密，因此它們的完整性就是您的完整性。

## 將第三方 Action 固定 (Pin) 到 Commit SHA

標籤 (`@v4`) 和分支 (`@main`) 是 **可變的 (mutable)** — 上游所有者（或任何破壞他們的人）可以將它們指向新代碼，而無需您更改任何一行。完整的 40 字元 Commit SHA 是不可變的。

```yaml
# 可變 — 標籤可以被移動到惡意代碼
- uses: some-org/some-action@v3

# 已固定 — 永遠使用這個確定的樹狀結構
- uses: some-org/some-action@3f1e0a9c8b7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f # v3.2.1
```

規則：

- 第三方 Action（任何非 `actions/*` 或 `github/*` 的內容）→ **必須** 使用 SHA 固定。將標籤和分支標記為「高 (HIGH)」。
- `@main` / `@master` → 無論發布者是誰，均標記為「高 (HIGH)」；那是未版本化的「最新 (latest)」版本。
- 第一方 `actions/*` → SHA 固定是強化建議（如果僅使用標籤固定，則標記為「低 (LOW)」）。
- 保留尾隨的 `# vX.Y.Z` 註解，以便人類和 Dependabot 可以閱讀預期版本。

這並非理論：在真實事件中，流行 Action 的標籤被指向從引用可變標籤的每個工作流中滲透秘密的代碼。

## 讓 Dependabot 更新固定 (Pin)

SHA 固定會過時。為 `github-actions` 生態系統啟用 Dependabot，以便更新以可審閱的 PR 形式到達（它能理解 `# vX.Y.Z` 註解並更新 SHA）：

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

## 產物 (Artifact) 與快取毒化 (Cache Poisoning)

- 由不受信任的 `pull_request` 構建上傳的產物是 **不受信任的數據**。高權限的 `workflow_run` 可能會下載它，但必須僅將其視為數據 — 絕不執行它，並在提取時驗證路徑（精心設計的產物可能包含 `../` 路徑遍歷條目）。
- 快取是有鍵值的，可以由權限較低的執行生成；在特權上下文中，不要相信快取的構建產出未被篡改。

## 公共儲存庫上的自我代管執行器 (Self-Hosted Runners)

預設（GitHub 代管）執行器是臨時的 — 每個作業都有一個新的虛擬機，完成後即銷毀。**自我代管執行器會持久存在**，因此在其中執行的不受信任的 Fork PR 代碼可以：

- 為下一個作業留下工具/後門，
- 讀取同一台機器上其他儲存庫的檢出內容或憑據，
- 滲透進您的網路。

絕不要在公共 Fork 可以觸發的工作流中使用自我代管執行器。如果必須使用，請使用臨時、隔離、一次性的執行器，並且絕不向 Fork 觸發的作業洩露秘密。

## `checkout` 憑據持久性

`actions/checkout` 預設將令牌寫入 `.git/config`，以便後續的 `git` 步驟可以推送。如果作業隨後執行不受信任的代碼，該代碼可以讀取令牌。當您不需要推送時，請設定 `persist-credentials: false`，特別是在構建/測試不受信任的代碼之前。
