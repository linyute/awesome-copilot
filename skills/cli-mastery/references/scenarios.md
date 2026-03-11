# 情境挑戰 (Scenario Challenges)

將這些呈現為真實世界的狀況。詢問使用者他們會使用哪些指令/快捷鍵。
針對每個步驟使用帶有選項的 `ask_user`。

## 情境 1：壓力下的緊急修復檢閱 (Hotfix Review Under Pressure)
> 生產環境的錯誤修復已就緒。您需要檢查 Diff、執行程式碼檢閱，並因為正在直播而隱藏敏感資料。

**答案：** `/streamer-mode` → `/diff` → `/review @src/payment.ts`

## 情境 2：上下文視窗救援 (Context Window Rescue)
> 您的工作階段非常龐大且模型品質正在下降。在縮減雜訊的同時保持連續性。

**答案：** `/context` → `/compact` → `/resume` (或使用 `--continue` 重新啟動)

## 情境 3：自主重構衝刺 (Autonomous Refactor Sprint)
> 您希望 Agent 在檢閱計畫並設定權限後，以最少的提示執行重構。

**答案：** `Shift+Tab` (計畫模式) → 驗證計畫 → `/allow-all` → 以自動駕駛模式執行

## 情境 4：企業入職 (Enterprise Onboarding)
> 為新的團隊存放庫設定自訂 Agent、存放庫指令和 MCP 整合。

**答案：** 將 Agent 設定檔加入 `.github/agents/`，驗證 `/instructions`，然後使用 `/mcp add`

## 情境 5：高效編輯工作階段 (Power Editing Session)
> 您正在撰寫一段很長的提示，需要快速編輯而不遺失上下文。

**答案：** `Ctrl+G` (在編輯器中開啟)，`Ctrl+A` (跳至開頭)，`Ctrl+K` (修剪)

## 情境 6：Agent 編排 (Agent Orchestration)
> 您正在領導一個複雜的專案：理解程式碼、執行測試、重構，然後進行檢閱。

**答案：** `explore` Agent (理解) → `task` Agent (測試) → `general-purpose` (重構) → `code-review` (驗證)

## 情境 7：新專案設定 (New Project Setup)
> 您複製了一個新存放庫，需要設定 Copilot CLI 以獲得最大生產力。

**答案：** `/init` → `/model` → `/mcp add` (如果需要) → `Shift+Tab` 進入第一個任務的計畫模式

## 情境 8：生產環境安全 (Production Safety)
> 從樣板工作切換到生產環境部署指令碼。

**答案：** `/reset-allowed-tools` → 計畫模式 → 在每次提交前執行 `/review`
