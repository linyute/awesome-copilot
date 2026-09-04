# 標籤 (Labels)

標籤是具有名稱、色彩與選用
說明的儲存庫層級物件。將標籤套用至 Issue 與建立標籤是分開的
操作，因此在使用標籤之前，請先列出儲存庫的標籤，而非假設
某個名稱存在。

`gh label` 與 `gh issue` 命令作用於目前的儲存庫；若要
以另一個儲存庫為目標，請新增 `--repo {owner}/{repo}`。`gh api` 沒有 `--repo` 旗標：它會
從目前儲存庫填入 `{owner}` 與 `{repo}` 預留位置，因此在其他位置工作時，請設定
`GH_REPO={owner}/{repo}` 或將值直接寫入路徑中。

GitHub MCP 伺服器的標籤工具需要非預設的 `labels` 工具集，
且無法在 Issue 上新增或移除單一標籤，因此本參考
指南全程使用 `gh` CLI。

## 列出標籤

`gh label list` 僅傳回前 30 個標籤。當
結果決定了標籤是否存在時，請務必傳遞 `--limit`，
否則在任何具有較大標籤集的儲存庫上，答案都會是錯誤的。

```bash
gh label list --limit 1000
```

搜尋名稱與描述，並傳回結構化輸出：

```bash
gh label list --limit 1000 --search "triage"
gh label list --limit 1000 --json name,color,description --jq '.[] | "\(.name) (#\(.color))"'
```

依名稱而非建立順序排序：

```bash
gh label list --limit 1000 --sort name --order asc
```

## 建立標籤

僅有名稱為必填項目。色彩為六個十六進位字元且**不帶**前綴 `#`；
省略時將指派隨機色彩。描述必須在 100 個
字元以內。

```bash
gh label create "needs-triage" \
  --color FBCA04 \
  --description "Awaiting maintainer review"
```

建立已存在的標籤會失敗。使用 `--force` 建立標籤，或在其已存在時
更新其色彩與描述，這可使初始化標籤集的作業
具備可重複性：

```bash
gh label create "needs-triage" --color FBCA04 --force
```

## 重新命名或變更標籤色彩

僅傳送變更的內容。`--name` 設定新名稱。

```bash
gh label edit "needs-triage" --name "triage"
gh label edit "triage" --color D93F0B --description "Awaiting maintainer review"
```

## 刪除標籤

刪除標籤會將其從每個帶有該標籤的 Issue 與 Pull Request 中移除。
在無互動提示的情況下執行時，必須加上 `--yes`。僅在
明確要求時才刪除標籤。

```bash
gh label delete "triage" --yes
```

## 跨儲存庫複製標籤

將來源儲存庫的標籤複製到目前儲存庫中，並略過
已存在的名稱。`--force` 則會覆寫它們。

```bash
gh label clone {owner}/{source-repo}
```

## 檢視 Issue 的標籤

```bash
gh issue view {issue_number} --json labels --jq '.labels[].name'
```

## 新增標籤至 Issue

新增至 Issue 上已有的標籤中。若有多個標籤，請重複使用該旗標。

```bash
gh issue edit {issue_number} --add-label "bug" --add-label "needs-triage"
```

## 從 Issue 移除標籤

```bash
gh issue edit {issue_number} --remove-label "needs-triage"
```

## 取代 Issue 上的所有標籤

`gh issue edit` 支援新增與移除，但無法取代整個標籤集。請改用 API
端點：`PUT` 會捨棄既有標籤並設定所提供的標籤。

```bash
gh api repos/{owner}/{repo}/issues/{issue_number}/labels \
  -X PUT \
  -f 'labels[]=bug'
```

## 從 Issue 移除所有標籤

```bash
gh api repos/{owner}/{repo}/issues/{issue_number}/labels -X DELETE
```

## 預設標籤

GitHub 會在新的儲存庫中建立這些標籤：
`accessibility`、`bug`、`documentation`、`duplicate`、`enhancement`、
`good first issue`、`help wanted`、`invalid`、`question`、`wontfix`。

維護者可以重新命名或刪除其中任何標籤，因此請檢查確認而非主觀假設。
`isDefault` 欄位可將它們與儲存庫自行新增的標籤區隔開來：

```bash
gh label list --limit 1000 --json name,isDefault --jq '.[] | select(.isDefault | not) | .name'
```

## 使用規則

- 在套用標籤之前先列出儲存庫的標籤，使所使用的名稱符合
  儲存庫現有的分類體系。列出時請傳遞 `--limit`；預設的 30 個會
  靜默隱藏其餘標籤。
- 明確建立標籤（包含色彩與描述），而不要依賴
  為 Issue 套用標籤時順帶產生的副作用名稱。
- 色彩為六個十六進位字元，開頭不帶 `#`。
- 描述必須在 100 個字元以內。
- 使用 `--add-label` 與 `--remove-label` 來變更 Issue 的部分標籤。
  它們會保留其餘標籤完好無損。
- 僅在明確要求取代時才取代 Issue 的整個標籤集。
  請先讀取目前的標籤，其餘情況優先使用新增與移除：
  `PUT` 會捨棄未在呼叫中指名的所有標籤。
- 標籤名稱的比對不區分大小寫，並以給定的大小寫形式儲存。
- 包含空格的標籤名稱請用引號括起來。
- 在無提示執行時，傳遞 `--yes` 給 `gh label delete`，並在刪除前
  先詢問：標籤將從每個帶有它的 Issue 中消失。
- 當組織已設定 Issue 類型時，優先使用 Issue 類型
  而非標籤進行分類。
