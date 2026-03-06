---
name: mcp-configure
description: 為 GitHub Copilot 設定搭配您的 Dataverse 環境的 MCP 伺服器。
---

# 為 GitHub Copilot 設定 Dataverse MCP (Configure Dataverse MCP for GitHub Copilot)

此技能為 GitHub Copilot 設定 Dataverse MCP 伺服器，並使用您組織的環境 URL。每個組織都使用根據組織識別碼產生的唯一伺服器名稱進行註冊（例如：`DataverseMcporgbc9a965c`）。如果使用者提供了 URL，則為：$ARGUMENTS。

## 說明 (Instructions)

### 0. 詢問 MCP 範圍 (Ask for MCP scope)

詢問使用者想要全域設定 MCP 伺服器還是僅針對此專案設定：

> 您想要如何設定 Dataverse MCP 伺服器：
> 1. **全域 (Globally)**（可在所有專案中使用）
> 2. **僅限專案 (Project-only)**（僅在此專案中可用）

根據他們的選擇，設定 `CONFIG_PATH` 變數：
- **全域**：`~/.copilot/mcp-config.json`（使用使用者的主目錄）
- **專案**：`.mcp/copilot/mcp.json`（相對於目前工作目錄）

儲存此路徑以供步驟 1 和 6 使用。

### 1. 檢查已設定的 MCP 伺服器 (Check already-configured MCP servers)

讀取位於 `CONFIG_PATH`（在步驟 0 中確定）的 MCP 設定檔，以檢查是否已有設定好的伺服器。

該設定檔是一個具有以下結構的 JSON 檔案：

```json
{
  "mcpServers": {
    "ServerName1": {
      "type": "http",
      "url": "https://example.com/api/mcp"
    }
  }
}
```

或者它可能使用 `"servers"` 而非 `"mcpServers"` 作為頂層鍵值。

從已設定的伺服器中擷取所有 `url` 值，並將其儲存為 `CONFIGURED_URLS`。例如：

```json
["https://orgfbb52bb7.crm.dynamics.com/api/mcp"]
```

如果檔案不存在或為空，則將 `CONFIGURED_URLS` 視為空列表 (`[]`)。此步驟絕不能阻礙技能的執行。

### 2. 詢問如何獲取環境 URL (Ask how to get the environment URL)

詢問使用者：

> 您想要如何提供 Dataverse 環境 URL？
> 1. **自動探索 (Auto-discover)** — 從您的 Azure 帳戶列出可用的環境（需要 Azure CLI）
> 2. **手動輸入 (Manual entry)** — 直接輸入 URL

根據他們的選擇：
- 如果是 **自動探索**：繼續執行步驟 2a
- 如果是 **手動輸入**：跳至步驟 2b

### 2a. 自動探索環境 (Auto-discover environments)

**檢查先決條件：**
- 驗證是否已安裝 Azure CLI (`az`)（使用 `which az` 或在 Windows 上使用 `where az` 檢查）
- 如果未安裝，請告知使用者並回退到步驟 2b

**進行 API 呼叫：**

1. 檢查使用者是否已登入 Azure CLI：
   ```bash
   az account show
   ```
   如果失敗，請提示使用者登入：
   ```bash
   az login
   ```

2. 獲取 Power Apps API 的存取權杖：
   ```bash
   az account get-access-token --resource https://service.powerapps.com/ --query accessToken --output tsv
   ```

3. 呼叫 Power Apps API 以列出環境：
   ```
   GET https://api.powerapps.com/providers/Microsoft.PowerApps/environments?api-version=2016-11-01
   Authorization: Bearer {token}
   Accept: application/json
   ```

4. 解析 JSON 回應，並篩選出 `properties?.linkedEnvironmentMetadata?.instanceUrl` 不為 null 的環境。

5. 對於每個匹配的環境，擷取：
   - `properties.displayName` 作為 `displayName`
   - `properties.linkedEnvironmentMetadata.instanceUrl`（移除末尾斜槓）作為 `instanceUrl`

6. 以此格式建立環境清單：
   ```json
   [
     { "displayName": "我的組織 (預設)", "instanceUrl": "https://orgfbb52bb7.crm.dynamics.com" },
     { "displayName": "另一個環境", "instanceUrl": "https://orgabc123.crm.dynamics.com" }
   ]
   ```

**如果 API 呼叫成功**，請繼續執行步驟 3。

**如果 API 呼叫失敗**（使用者未登入、網路錯誤、找不到環境或任何其他錯誤），請告知使用者發生了什麼問題，並回退到步驟 2b。

### 2b. 手動輸入 — 詢問 URL (Manual entry — ask for the URL)

要求使用者直接提供其環境 URL：

> 請輸入您的 Dataverse 環境 URL。
>
> 範例：`https://myorg.crm10.dynamics.com`
>
> 您可以在 Power Platform 系統管理中心的「環境」下找到此資訊。

然後跳至步驟 4。

### 3. 要求使用者選擇一個環境 (Ask the user to select an environment)

將環境呈現為編號列表。對於每個環境，檢查 `CONFIGURED_URLS` 中的任何 URL 是否以該環境的 `instanceUrl` 開頭 — 如果是，請在該行末尾附加 **(已設定)**。

> 我在您的帳戶中找到了以下 Dataverse 環境。您想要設定哪一個？
>
> 1. 我的組織 (預設) — `https://orgfbb52bb7.crm.dynamics.com` **(已設定)**
> 2. 另一個環境 — `https://orgabc123.crm.dynamics.com`
>
> 請輸入您選擇的編號，或輸入 "manual" 以自行輸入 URL。

如果使用者選擇了已設定的環境，請在繼續之前確認他們是否要重新註冊（例如：更改端點型別）。

如果使用者輸入 "manual"，請回退到步驟 2b。

### 4. 確認選取的 URL (Confirm the selected URL)

取所選環境的 `instanceUrl`（或手動輸入的 URL），並去除任何末尾斜槓。這就是剩餘技能步驟中使用的 `USER_URL`。

### 5. 確認使用者想要「預覽」還是「正式發佈 (GA)」端點 (Confirm if the user wants "Preview" or "Generally Available (GA)" endpoint)

詢問使用者：

> 您想要使用哪個端點？
> 1. **正式發佈 (Generally Available, GA)** — `/api/mcp`（建議使用）
> 2. **預覽 (Preview)** — `/api/mcp_preview`（最新功能，可能不穩定）

根據他們的選擇：
- 如果是 **GA**：將 `MCP_URL` 設定為 `{USER_URL}/api/mcp`
- 如果是 **預覽**：將 `MCP_URL` 設定為 `{USER_URL}/api/mcp_preview`

### 6. 註冊 MCP 伺服器 (Register the MCP server)

更新位於 `CONFIG_PATH`（在步驟 0 中確定）的 MCP 設定檔，以增加新伺服器。

從 `USER_URL` **產生唯一的伺服器名稱**：
1. 從 URL 擷取子網域（組織識別碼）
   - 範例：`https://orgbc9a965c.crm10.dynamics.com` → `orgbc9a965c`
2. 在前面加上 `DataverseMcp` 以建立伺服器名稱
   - 範例：`DataverseMcporgbc9a965c`

這就是 `SERVER_NAME`。

**更新設定檔：**

1. 如果 `CONFIG_PATH` 是針對 **專案範圍** 的設定 (`.mcp/copilot/mcp.json`)，請先確保目錄存在：
   ```bash
   mkdir -p .mcp/copilot
   ```

2. 讀取位於 `CONFIG_PATH` 的現有設定檔，如果不存在則建立一個新的空設定：
   ```json
   {}
   ```

3. 確定要使用哪個頂層鍵值：
   - 如果設定中已有 `"servers"`，則使用它
   - 否則，使用 `"mcpServers"`

4. 增加或更新伺服器條目：
   ```json
   {
     "mcpServers": {
       "{SERVER_NAME}": {
         "type": "http",
         "url": "{MCP_URL}"
       }
     }
   }
   ```

5. 將更新後的設定寫回 `CONFIG_PATH`，並使用正確的 JSON 格式（2 空格縮排）。

**重要事項：**
- 不要覆蓋設定檔中的其他條目
- 保留現有的結構與格式
- 如果 `SERVER_NAME` 已經存在，請使用新的 `MCP_URL` 更新它

繼續執行步驟 7。

### 7. 確認成功並指示重新啟動 (Confirm success and instruct restart)

告知使用者：

> ✅ 已在 `{MCP_URL}` 為 GitHub Copilot 設定 Dataverse MCP 伺服器。
>
> 設定已儲存至：`{CONFIG_PATH}`
>
> **重要事項：您必須重新啟動編輯器，變更才會生效。**
>
> 重新啟動您的編輯器或重新載入視窗，之後您將能夠：
> - 列出 Dataverse 環境中的所有資料表
> - 查詢任何資料表中的記錄
> - 建立、更新或刪除記錄
> - 探索您的結構描述 (schema) 與關聯性

### 8. 疑難排解 (Troubleshooting)

如果發生問題，請協助使用者檢查：

- URL 格式是否正確 (`https://<org>.<region>.dynamics.com`)
- 他們是否具有 Dataverse 環境的存取權限
- 環境 URL 是否與 Power Platform 系統管理中心顯示的內容相符
- 他們的環境管理員是否已在「允許的使用者端 (Allowed Clients)」清單中啟用了 "Dataverse CLI MCP"
- 他們的環境是否已啟用 Dataverse MCP，以及如果他們嘗試使用預覽端點，該端點是否已啟用
- 對於專案範圍的設定，請確保 `.mcp/copilot/mcp.json` 檔案已成功建立
- 對於全域設定，請檢查 `~/.copilot/` 目錄的權限
