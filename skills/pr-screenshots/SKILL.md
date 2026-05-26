---
name: pr-screenshots
description: '在 Pull Request 描述中嵌入變更前後截圖及標註圖像。涵蓋 PR 描述模式、Azure DevOps 和 GitHub 的圖像上傳，以及大小調整的最佳實作。'
---

# PR 截圖 (PR Screenshots)

在 Pull Request (PR) 描述中嵌入變更前後的截圖，讓審查者無需切換分支即可看到視覺上的變更。

## 何時使用此技能

當 PR 涉及視覺變更時，請使用此技能：

- 版面配置、樣式、CSS
- 圖表、儀表板、數據視覺化
- UI 元件、表單、模態視窗 (modals)
- 錯誤訊息、CLI 輸出、日誌格式

## PR 描述模式

將截圖直接放置在 PR 描述主體中。避免將其包裹在 `<details>` 折疊區塊中 — 審查者更有可能查看無需點擊即可直接看到的圖像。

```markdown
**變更前 (Before)** — 簡短描述問題：

![before](變更前圖像連結)

**變更後 (After)** — 簡短描述修復內容：

![after](變更後圖像連結)
```

保持文字簡短。每張圖片用一兩句話描述閱讀者應該注意的地方。讓圖像傳達大部分的訊息。

### 多項變更

對於有多個視覺變更的 PR，請使用帶有標題的單獨「變更前/變更後」配對：

```markdown
## 篩選列對齊

**變更前** — 相鄰按鈕間有 1px 邊框衝突：

![before-filters](連結)

**變更後** — 邊框乾淨重疊，已新增懸停色調：

![after-filters](連結)

## 圖表提示工具 (Tooltip)

**變更前** — 提示工具在容器邊緣被裁切：

![before-tooltip](連結)

**變更後** — 提示工具重新定位以保持可見：

![after-tooltip](連結)
```

## 圖像大小調整

- **以原生 1x 解析度擷取截圖** — 不要使用 PIL 調整大小（會產生偽影）
- **當圖像過大時，在 HTML 中控制顯示尺寸**：
  ```html
  <img src="連結" width="600" alt="描述">
  ```
- **變更前後配對必須使用相同的視口寬度和裁切範圍** — 否則比較將毫無意義

## 上傳圖像

### Azure DevOps

透過 REST API 將圖像作為 PR 附件上傳：

```powershell
$token = az account get-access-token `
    --resource "499b84ac-1321-427f-aa17-267ca6975798" `
    --query accessToken -o tsv

$base = "https://{org}.visualstudio.com/{projectId}/_apis/git/repositories/{repoId}"
$url = "$base/pullRequests/{prId}/attachments/screenshot.png?api-version=7.1-preview.1"

# 使用 HttpClient — Invoke-RestMethod 可能會損壞二進位數據
$client = New-Object System.Net.Http.HttpClient
$client.DefaultRequestHeaders.Authorization = `
    New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)
$content = New-Object System.Net.Http.ByteArrayContent(
    , [System.IO.File]::ReadAllBytes("screenshot.png")
)
$content.Headers.ContentType = `
    [System.Net.Http.Headers.MediaTypeHeaderValue]::new("application/octet-stream")
$resp = $client.PostAsync($url, $content).Result
```

在 PR 描述中引用：

```markdown
![描述](https://{org}.visualstudio.com/{projectId}/_apis/git/repositories/{repoId}/pullRequests/{prId}/attachments/screenshot.png)
```

**Azure DevOps 注意事項：**

- **使用 `{org}.visualstudio.com` 而非 `dev.azure.com/{org}`** — AzDO 的 Markdown 渲染器使用 `.visualstudio.com`。`dev.azure.com` 格式載入速度明顯較慢
- 使用 `POST` 而非 `PUT` (PUT 會回傳 405)
- API 版本必須是 `7.1-preview.1`
- 無法重複使用相同的檔案名稱上傳 — 請使用新名稱（例如 `screenshot-v2.png`）
- 使用 `HttpClient` 而非 `Invoke-RestMethod` — IRM 可能會損壞二進位數據
- 儲存庫相對路徑在 PR 描述中無效 — 必須使用完整 URL
- 不要僅為了 PR 截圖而將圖像提交到分支中

### GitHub

> **⚠️ 進行中。** GitHub 的拖放圖像上傳使用需要瀏覽器 Cookie 的內部端點。目前還沒有乾淨的公開 API 可用於將圖像上傳到 PR 描述。

**目前的變通方法：** 將圖像提交到 `pr-assets` 的孤立分支 (orphan branch)，並透過 blob URL 引用 (`github.com/{owner}/{repo}/blob/pr-assets/{檔案}?raw=true`)。雖然可行但較繁瑣 — 歡迎貢獻更好的方法。

## 指引

1. **在變更前先擷取狀態** — 很容易忘記，之後要重現原始狀態既耗時又容易出錯
2. **保持說明簡短** — 每張圖像用一兩句話指出變更點即可
3. **優先顯示圖像而非折疊區塊** — `<details>` 標籤後的截圖很容易被略過
4. **當變更細微時進行標註** — 當差異不明顯時，請使用 `image-annotations` 技能添加說明框
5. **對齊變更前後配對的視口和裁切範圍**，以確保比較具有意義

## 限制

- GitHub 的圖像上傳需要變通方法（沒有用於 PR 描述圖像的公開 API）
- Azure DevOps 附件檔案名稱無法重複使用 — 請提前規劃命名
- 非常大的圖像 (>10MB) 在某些平台上可能無法內嵌渲染
