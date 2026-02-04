# Penpot MCP 伺服器設定與疑難排解

安裝、組態以及對 Penpot MCP 伺服器進行疑難排解的完整指南。

## 架構概覽

Penpot MCP 整合需要**三個元件**協同運作：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MCP 用戶端     │────▶│   MCP 伺服器     │◀───▶│  Penpot 外掛程式 │
│ (VS Code/Claude)│     │ (連接埠 4401)    │     │ （在瀏覽器中）    │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 │    WebSocket          │
                                 │  (連接埠 4402)         │
                                 └───────────────────────┘
```

1. **MCP 伺服器** - 向您的 AI 用戶端提供工具（HTTP 連接埠 4401）
2. **外掛程式伺服器** - 供應 Penpot 外掛程式檔案（HTTP 連接埠 4400）
3. **Penpot MCP 外掛程式** - 在 Penpot 瀏覽器中執行，執行設計指令

## 前提條件

- **Node.js v22+** - [下載](https://nodejs.org/)
- **Git** - 用於複製儲存庫
- **現代瀏覽器** - Chrome、Firefox 或基於 Chromium 的瀏覽器

驗證 Node.js 安裝：
```bash
node --version  # 應為 v22.x 或更高版本
npm --version
npx --version
```

## 安裝

### 步驟 1：複製並安裝

```bash
# 複製儲存庫
git clone https://github.com/penpot/penpot-mcp.git
cd penpot-mcp

# 安裝相依性
npm install
```

### 步驟 2：建構並啟動伺服器

```bash
# 建構所有元件並啟動伺服器
npm run bootstrap
```

此指令會：

- 為所有元件安裝相依性
- 建構 MCP 伺服器和外掛程式
- 啟動兩個伺服器（MCP 位於 4401，外掛程式位於 4400）

**預期輸出：**

```txt
MCP Server listening on http://localhost:4401
Plugin server listening on http://localhost:4400
WebSocket server listening on port 4402
```

### 步驟 3：在 Penpot 中載入外掛程式

1. 在瀏覽器中開啟 [Penpot](https://design.penpot.app/)
2. 開啟或建立一個設計檔案
3. 前往 **Plugins** 選單（或按下外掛程式圖示）
4. 點擊 **Load plugin from URL**
5. 輸入：`http://localhost:4400/manifest.json`
6. 外掛程式 UI 將會出現 - 點擊 **"Connect to MCP server"**
7. 狀態應變更為 **"Connected to MCP server"**

> **重要**：在使用 MCP 工具時，請保持外掛程式 UI 開啟。關閉它會中斷與伺服器的連接。

### 步驟 4：組態您的 MCP 用戶端

#### 搭配 GitHub Copilot 的 VS Code

新增至您的 VS Code `settings.json`：

```json
{
  "mcp": {
    "servers": {
      "penpot": {
        "url": "http://localhost:4401/sse"
      }
    }
  }
}
```

或者使用 HTTP 端點：

```json
{
  "mcp": {
    "servers": {
      "penpot": {
        "url": "http://localhost:4401/mcp"
      }
    }
  }
}
```

#### Claude Desktop

Claude Desktop 需要 `mcp-remote` 代理程式（僅限 stdio 傳輸）：

1. 安裝代理程式：

   ```bash
   npm install -g mcp-remote
   ```

2. 編輯 Claude Desktop 組態：
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. 新增 Penpot 伺服器：

   ```json
   {
     "mcpServers": {
       "penpot": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "http://localhost:4401/sse", "--allow-http"]
       }
     }
   }
   ```

4. **完全退出** Claude Desktop（檔案 → 退出，而不僅僅是關閉視窗）並重新啟動

#### Claude Code (CLI)

```bash
claude mcp add penpot -t http http://localhost:4401/mcp
```

## 疑難排解

### 連接問題

#### 「外掛程式無法連接到 MCP 伺服器」

**症狀**：即使點擊了「連接 (Connect)」，外掛程式仍顯示「未連接 (Not connected)」

**解決方案**：

1. 驗證伺服器是否正在執行：
   ```bash
   # 檢查連接埠是否被佔用
   lsof -i :4401  # MCP 伺服器
   lsof -i :4402  # WebSocket
   lsof -i :4400  # 外掛程式伺服器
   ```

2. 重新啟動伺服器：

   ```bash
   # 在 penpot-mcp 目錄中
   npm run start:all
   ```

3. 檢查瀏覽器主控台 (F12) 是否有 WebSocket 錯誤

#### 瀏覽器封鎖本機連接

**症狀**：瀏覽器拒絕從 Penpot 連接到 localhost

**原因**：Chromium 142+ 強制執行私有網路存取 (PNA) 限制

**解決方案**：

1. **Chrome/Chromium**：出現提示時，允許存取本機網路
2. **Brave**：為 Penpot 網站停用 Shield：
   - 點擊網址列中的 Brave Shield 圖示
   - 為此網站關閉 Shield
3. **嘗試使用 Firefox**：Firefox 對這些限制的執行較不嚴格

#### "WebSocket connection failed"

**解決方案**：

1. 檢查防火牆設定 - 允許連接埠 4400, 4401, 4402
2. 如果 VPN 已啟用，請將其停用
3. 檢查是否有使用相同連接埠的衝突應用程式

### MCP 用戶端問題

#### 工具未出現在 VS Code/Claude 中

1. **驗證端點**：

   ```bash
   # 測試 SSE 端點
   curl http://localhost:4401/sse
   
   # 測試 MCP 端點
   curl http://localhost:4401/mcp
   ```

2. **檢查組態語法** - JSON 必須有效
3. 完全**重新啟動 MCP 用戶端**
4. **檢查 MCP 伺服器記錄**：

   ```bash
   # 記錄位於 mcp-server/logs/
   tail -f mcp-server/logs/mcp-server.log
   ```

#### 「工具執行逾時」

**原因**：外掛程式中斷連接或操作時間過長

**解決方案**：

1. 確保 Penpot 中的外掛程式 UI 仍開啟
2. 驗證外掛程式顯示「已連接 (Connected)」狀態
3. 嘗試重新連接：在外掛程式中點擊「中斷連接 (Disconnect)」然後點擊「連接 (Connect)」

### 外掛程式問題

#### 「外掛程式載入失敗」

1. 驗證外掛程式伺服器是否在連接埠 4400 上執行
2. 嘗試直接在瀏覽器中存取 `http://localhost:4400/manifest.json`
3. 清除瀏覽器快取並重新載入 Penpot
4. 移除並重新新增外掛程式

#### 「找不到 penpot 物件」

**原因**：外掛程式未正確初始化或未開啟設計檔案

**解決方案**：

1. 確保您已開啟設計檔案（而不僅僅是儀表板）
2. 開啟檔案後等待幾秒鐘再進行連接
3. 重新整理 Penpot 並重新載入外掛程式

### 伺服器問題

#### 連接埠已被佔用

```bash
# 尋找使用該連接埠的處理程序
lsof -i :4401

# 如果需要，刪除該處理程序
kill -9 <PID>
```

或者透過環境變數組態不同的連接埠：
```bash
PENPOT_MCP_SERVER_PORT=4501 npm run start:all
```

#### 伺服器在啟動時崩潰

1. 檢查 Node.js 版本（必須為 v22+）
2. 刪除 `node_modules` 並重新安裝：

   ```bash
   rm -rf node_modules
   npm install
   npm run bootstrap
   ```

## 組態參考

### 環境變數

| 變數                               | 預設值    | 描述                                   |
| ---------------------------------- | --------- | -------------------------------------- |
| `PENPOT_MCP_SERVER_PORT`           | 4401      | HTTP/SSE 伺服器連接埠                  |
| `PENPOT_MCP_WEBSOCKET_PORT`        | 4402      | WebSocket 伺服器連接埠                 |
| `PENPOT_MCP_SERVER_LISTEN_ADDRESS` | localhost | 伺服器綁定地址                         |
| `PENPOT_MCP_LOG_LEVEL`             | info      | 記錄層級 (trace/debug/info/warn/error) |
| `PENPOT_MCP_LOG_DIR`               | logs      | 記錄檔目錄                             |
| `PENPOT_MCP_REMOTE_MODE`           | false     | 啟用遠端模式（停用檔案系統存取）       |

### 範例：自訂組態

```bash
# 在不同的連接埠執行，並啟用偵錯記錄
PENPOT_MCP_SERVER_PORT=5000 
PENPOT_MCP_WEBSOCKET_PORT=5001 
PENPOT_MCP_LOG_LEVEL=debug 
npm run start:all
```

## 驗證設定

執行此檢查清單以確認一切運作正常：

1. **伺服器執行中**：
   ```bash
   curl -s http://localhost:4401/sse | head -1
   # 應傳回 SSE 串流標頭
   ```

2. **外掛程式已連接**：外掛程式 UI 顯示 "Connected to MCP server"

3. **工具可用**：在您的 MCP 用戶端中，驗證這些工具是否出現：
   - `mcp__penpot__execute_code`
   - `mcp__penpot__export_shape`
   - `mcp__penpot__import_image`
   - `mcp__penpot__penpot_api_info`

4. **測試執行**：要求您的 AI 助手執行一個簡單指令：
   > 「使用 Penpot 取得目前頁面名稱」

## 取得協助

- **GitHub Issues**: [penpot/penpot-mcp/issues](https://github.com/penpot/penpot-mcp/issues)
- **GitHub Discussions**: [penpot/penpot-mcp/discussions](https://github.com/penpot/penpot-mcp/discussions)
- **Penpot 社群**: [community.penpot.app](https://community.penpot.app/)
