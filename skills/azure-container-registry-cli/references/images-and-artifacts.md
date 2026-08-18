# 映像檔與成品 (Images & Artifacts)

## 目錄
- [匯入映像檔（伺服器端複製）](#匯入映像檔伺服器端複製)
- [存放庫與標籤](#存放庫與標籤)
- [資訊清單](#資訊清單)
- [取消標記 vs 刪除](#取消標記-vs-刪除)
- [清除舊映像檔 (acr purge)](#清除舊映像檔-acr-purge)
- [鎖定映像檔](#鎖定映像檔)
- [保留原則與虛擬刪除](#保留原則與虛擬刪除)
- [成品快取（提取快取）](#成品快取提取快取)
- [儲存用量](#儲存用量)

---

## 匯入映像檔（伺服器端複製）

優先於 `docker pull` + `docker push` — 無本機儲存空間需求，並保持多架構資訊清單完整：

```bash
# 從公用登錄檔匯入
az acr import --name {registry} --source mcr.microsoft.com/hello-world:latest
az acr import --name {registry} --source docker.io/library/nginx:1.27 --image nginx:1.27

# 從相同租用戶中的另一個 ACR 匯入（依資源識別碼，不需要認證）
az acr import --name {registry} \
  --source app:v1 \
  --registry /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ContainerRegistry/registries/{src-registry}

# 從具有認證的私人登錄檔匯入
az acr import --name {registry} --source private.example.com/app:v1 \
  --username {user} --password {password}

# 覆寫現有標籤
az acr import --name {registry} --source docker.io/library/nginx:1.27 --image nginx:1.27 --force
```

## 存放庫與標籤

```bash
az acr repository list --name {registry} --output table

# 標籤，最新的優先，包含摘要 (digest) 與時間戳記
az acr repository show-tags --name {registry} --repository app \
  --orderby time_desc --detail --output table

az acr repository show --name {registry} --image app:v1        # 標籤屬性
az acr repository show --name {registry} --repository app      # 存放庫屬性
```

## 資訊清單

```bash
# 存放庫中所有資訊清單的 Metadata（摘要、標籤、大小、時間戳記）
az acr manifest list-metadata --registry {registry} --name app --output table

# 單一資訊清單的 Metadata / 原始內容
az acr manifest show-metadata --registry {registry} --name app:v1
az acr manifest show --registry {registry} --name app@sha256:{digest}

# 尋找未標記（孤立）的資訊清單
az acr manifest list-metadata --registry {registry} --name app \
  --query "[?tags==null].digest" --output tsv
```

## 取消標記 vs 刪除

```bash
# 取消標記：僅移除標籤；資訊清單 + 圖層仍保留（仍可透過摘要提取）
az acr repository untag --name {registry} --image app:v1

# 依標籤刪除：刪除整個資訊清單及指向它的所有其他標籤
az acr repository delete --name {registry} --image app:v1 --yes

# 依摘要刪除（精確）
az acr repository delete --name {registry} --image app@sha256:{digest} --yes

# 刪除整個存放庫
az acr repository delete --name {registry} --repository app --yes
```

⚠️ 依標籤刪除會刪除底層資訊清單 — 相同映像檔上的其他標籤也會一併消失。若只想淘汰標籤名稱，請先取消標記。

## 清除舊映像檔 (acr purge)

`acr purge` 作為 ACR Task 執行（容器 `mcr.microsoft.com/acr/acr-cli`）：

```bash
# 首先進行模擬測試 — 務必先執行
az acr run --registry {registry} \
  --cmd "acr purge --filter 'app:.*' --ago 30d --untagged --dry-run" /dev/null

# 刪除超過 30 天且符合規則運算式的標籤，以及未標記的資訊清單
az acr run --registry {registry} \
  --cmd "acr purge --filter 'app:.*' --ago 30d --untagged" /dev/null

# 不論建立時間長短，保留最新的 5 個標籤
az acr run --registry {registry} \
  --cmd "acr purge --filter 'app:.*' --ago 0d --keep 5 --untagged" /dev/null

# 排程為每晚執行的工作
az acr task create --registry {registry} --name purge-old-images \
  --cmd "acr purge --filter 'app:.*' --ago 30d --untagged" \
  --context /dev/null --schedule "0 3 * * *"
```

`--filter` 接受 `repository:tag-regex`，且可重複指定多個存放庫。

⚠️ `--untagged` 會忽略 `--ago`：它會刪除**每一個**未標記的資訊清單，包括剛建立的資訊清單（推送中的映像檔、參照者成品）。若最近未標記的資訊清單必須保留，請省略 `--untagged` — 建立時間臨界值僅適用於 `--filter` 匹配的已標記映像檔。

## 鎖定映像檔

防止覆寫或刪除關鍵標籤（例如已發佈的版本）：

```bash
# 唯讀：無法覆寫或刪除
az acr repository update --name {registry} --image app:v1 --write-enabled false

# 無法刪除但仍可覆寫
az acr repository update --name {registry} --image app:v1 --delete-enabled false

# 解鎖
az acr repository update --name {registry} --image app:v1 --write-enabled true --delete-enabled true
```

## 保留原則與虛擬刪除

兩種**無法同時啟用**的不同原則。保留原則需要 **Premium**；虛擬刪除 (預覽) 適用於**所有層級**，但不支援異地複寫或已啟用成品快取的登錄檔。

```bash
# 保留原則 (Premium)：在 N 天後自動刪除未標記的資訊清單（0 = 立即）
az acr config retention update --registry {registry} \
  --status enabled --days 7 --type UntaggedManifests
az acr config retention show --registry {registry}

# 虛擬刪除 (預覽，所有層級)：在 1-90 天內復原已刪除的成品
az acr config soft-delete update --registry {registry} --status enabled --days 7
az acr repository list-deleted --name {registry}
az acr manifest restore --registry {registry} --name app:v1
```

## 成品快取（提取快取）

在您的登錄檔中快取上游映像檔（Docker Hub、MCR、GHCR、quay.io、ECR Public）— 避免速率限制並集中來源管理：

```bash
# 可選：已驗證上游的認證（機密儲存在 Key Vault 中）
az acr credential-set create --registry {registry} --name dockerhub-creds \
  --login-server docker.io \
  --username-id https://{vault}.vault.azure.net/secrets/dh-user \
  --password-id https://{vault}.vault.azure.net/secrets/dh-pass

# 快取規則：docker.io/library/* -> {registry}.azurecr.io/dockerhub/*
az acr cache create --registry {registry} --name dockerhub-cache \
  --source-repo "docker.io/library/*" --target-repo "dockerhub/*" \
  --cred-set dockerhub-creds

az acr cache list --registry {registry} --output table
```

接著 `docker pull {registry}.azurecr.io/dockerhub/nginx:1.27` 會透過快取進行擷取。

## 儲存用量

```bash
# 已取用儲存空間 vs SKU 配額（內建 Basic 10 GB / Standard 100 GB / Premium 500 GB）
az acr show-usage --name {registry} --output table
```

圖層已去重複化並在存放庫之間共用；`show-usage` 回報實際的可計費儲存空間。
