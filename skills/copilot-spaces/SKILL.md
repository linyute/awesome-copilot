---
name: copilot-spaces
description: '使用 Copilot Spaces 為對話提供專案特定上下文。當使用者提到「Copilot 空間 (Space)」、想要從共享知識庫載入上下文、探索可用空間，或詢問以精心策劃的專案文件、程式碼與指令為基礎的問題時，使用此技能。'
---

# Copilot 空間 (Copilot Spaces)

使用 Copilot 空間將精心策劃的專案特定上下文帶入對話中。「空間」是儲存庫、檔案、文件與指令的共享集合，能讓 Copilot 根據您團隊的實際程式碼與知識來產生回應。

## 可用的工具

### MCP 工具 (唯讀)

| 工具 | 用途 |
|------|---------|
| `mcp__github__list_copilot_spaces` | 列出當前使用者可存取的所有空間 |
| `mcp__github__get_copilot_space` | 透過擁有者與名稱載入空間的完整上下文 |

### 透過 `gh api` 使用 REST API (完整 CRUD)

Spaces REST API 支援建立、更新、刪除空間以及管理協作者。MCP 伺服器僅公開讀取操作，因此請使用 `gh api` 進行寫入。

**使用者空間：**

| 方法 | 端點 | 用途 |
|--------|----------|---------|
| `POST` | `/users/{username}/copilot-spaces` | 建立空間 |
| `GET` | `/users/{username}/copilot-spaces` | 列出空間 |
| `GET` | `/users/{username}/copilot-spaces/{number}` | 取得空間 |
| `PUT` | `/users/{username}/copilot-spaces/{number}` | 更新空間 |
| `DELETE` | `/users/{username}/copilot-spaces/{number}` | 刪除空間 |

**組織空間：** 在 `/orgs/{org}/copilot-spaces/...` 下使用相同模式

**協作者：** 在 `.../collaborators` 新增、列出、更新與移除協作者

**權限範圍 (Scope) 需求：** 個人存取權杖 (PAT) 需要 `read:user` 以進行讀取，需要 `user` 以進行寫入。使用 `gh auth refresh -h github.com -s user` 新增權限。

**注意：** 此 API 可運作但尚未出現在公開的 REST API 文件中。可能需要 `copilot_spaces_api` 特性旗標。

## 何時使用空間

- 使用者提到「Copilot 空間」或要求「載入空間」
- 使用者希望獲得以特定專案文件、程式碼或標準為基礎的答案
- 使用者詢問「有哪些可用空間？」或「尋找 X 的空間」
- 使用者需要入職 (Onboarding) 上下文、架構文件或團隊特定的指引
- 使用者想要遵循空間中定義的結構化工作流程（範本、檢查表、多步驟程序）

## 工作流程

### 1. 探索空間

當使用者詢問有哪些可用空間，或您需要尋找正確的空間時：

```
呼叫 mcp__github__list_copilot_spaces
```

這會回傳使用者可存取的所有空間，每個空間皆包含 `name` (名稱) 與 `owner_login` (擁有者登入名稱)。向使用者呈現相關的相符項。

若要篩選特定使用者的空間，請將 `owner_login` 與使用者名稱進行比對（例如：「顯示我的空間」）。

### 2. 載入空間

當使用者指定空間名稱，或您已識別出正確空間時：

```
呼叫 mcp__github__get_copilot_space 並帶入：
  owner: "組織或使用者名稱"    （來自清單的 owner_login）
  name: "空間名稱"            （精確的空間名稱，區分大小寫）
```

這會回傳空間的完整內容：附加的文件、程式碼上下文、自訂指令以及任何其他精心策劃的資料。使用此上下文來強化您的回應。

### 3. 循跡追蹤

空間內容通常會引用外部資源：GitHub 議題 (Issues)、儀表板、儲存庫、討論或其他工具。主動使用其他 MCP 工具獲取這些資源，以收集完整的上下文。例如：
- 空間引用了一個倡議追蹤議題。使用 `issue_read` 取得最新評論。
- 空間連結到一個專案看板。使用專案工具檢查當前狀態。
- 空間提到了儲存庫的大計 (Masterplan)。使用 `get_file_contents` 來讀取它。

### 4. 回答或執行

載入後，根據空間所包含的內容來使用它：

**若空間包含參考資料**（文件、程式碼、標準）：
- 回答關於專案架構、模式或標準的問題
- 產生遵循團隊慣例的程式碼
- 使用專案特定知識來除錯問題

**若空間包含工作流程指令**（範本、逐步程序）：
- 按照定義的工作流程，逐步執行
- 從工作流程指定的來源收集資料
- 以工作流程定義的格式產生輸出
- 在每個步驟後顯示進度，以便使用者引導

### 5. 管理空間 (透過 `gh api`)

當使用者想要建立、更新或刪除空間時，請使用 `gh api`。首先，從列出端點找到空間編號 (number)。

**更新空間的指令：**
```bash
gh api users/{username}/copilot-spaces/{number} \
  -X PUT \
  -f general_instructions="此處為新指令"
```

**同時更新名稱、描述或指令：**
```bash
gh api users/{username}/copilot-spaces/{number} \
  -X PUT \
  -f name="更新後的名稱" \
  -f description="更新後的描述" \
  -f general_instructions="更新後的指令"
```

**建立新空間：**
```bash
gh api users/{username}/copilot-spaces \
  -X POST \
  -f name="我的新空間" \
  -f general_instructions="協助我處理..." \
  -f visibility="private"
```

**附加資源（取代整個資源清單）：**
```json
{
  "resources_attributes": [
    { "resource_type": "free_text", "metadata": { "name": "筆記", "text": "此處為內容" } },
    { "resource_type": "github_issue", "metadata": { "repository_id": 12345, "number": 42 } },
    { "resource_type": "github_file", "metadata": { "repository_id": 12345, "file_path": "docs/guide.md" } }
  ]
}
```

**刪除空間：**
```bash
gh api users/{username}/copilot-spaces/{number} -X DELETE
```

**可更新欄位：** `name`、`description`、`general_instructions`、`icon_type`、`icon_color`、`visibility` ("private"/"public")、`base_role` ("no_access"/"reader")、`resources_attributes`

## 範例

### 範例 1：使用者要求載入空間

**使用者**：「載入無障礙性 (Accessibility) copilot 空間」

**動作**：
1. 呼叫 `mcp__github__get_copilot_space` 並帶入擁有者 `"github"`、名稱 `"Accessibility"`
2. 使用回傳的上下文來回答關於無障礙標準、MAS 分級、合規流程等問題。

### 範例 2：使用者想要尋找空間

**使用者**：「我們的團隊有哪些可用的 copilot 空間？」

**動作**：
1. 呼叫 `mcp__github__list_copilot_spaces`
2. 篩選/呈現與使用者組織或興趣相關的空間
3. 提議載入任何他們感興趣的空間

### 範例 3：以內容為基礎的問題

**使用者**：「使用安全性空間，我們對機密掃描的政策是什麼？」

**動作**：
1. 呼叫 `mcp__github__get_copilot_space` 並帶入適當的擁有者與名稱
2. 在空間內容中尋找相關政策
3. 根據實際的內部文件進行回答

### 範例 4：作為工作流程引擎的空間

**使用者**：「使用 PM 每週更新空間來撰寫我的每週更新」

**動作**：
1. 呼叫 `mcp__github__get_copilot_space` 載入空間。它包含範本格式與逐步指令。
2. 遵循空間的工作流程：從附加的倡議議題中提取資料、收集數據、撰寫各個區段的草稿。
3. 使用其他 MCP 工具獲取空間引用的外部資源（追蹤議題、儀表板）。
4. 在每個區段後顯示草稿，以便使用者審閱並填補空白。
5. 以空間定義的格式產生最終輸出。

### 範例 5：以程式化方式更新空間指令

**使用者**：「更新我的 PM 每週更新空間以包含新的寫作指引」

**動作**：
1. 呼叫 `mcp__github__list_copilot_spaces` 並找到空間編號（例如：19）。
2. 呼叫 `mcp__github__get_copilot_space` 讀取目前指令。
3. 根據要求修改指令文字。
4. 推送更新：
```bash
gh api users/labudis/copilot-spaces/19 -X PUT -f general_instructions="更新後的指令..."
```

## 提示

- 空間名稱**區分大小寫**。請使用來自 `list_copilot_spaces` 的精確名稱。
- 空間可由個人或組織擁有。務必同時提供 `owner` 與 `name`。
- 空間內容可能很大 (20KB+)。若以暫存檔案回傳，請使用 grep 或 view_range 尋找相關區段，而非一次讀取所有內容。
- 若找不到空間，建議列出可用空間以尋找正確名稱。
- 空間會隨底層儲存庫變更而自動更新，因此上下文始終是最新的。
- 某些空間包含應指引您行為的自訂指令（編碼標準、偏好模式、工作流程）。請將其視為指令，而非建議。
- **寫入操作**（針對建立/更新/刪除的 `gh api`）需要 `user` PAT 權限範圍。若寫入操作收到 404 錯誤，請執行 `gh auth refresh -h github.com -s user`。
- 資源更新會**取代整個陣列**。若要新增資源，請包含所有現有資源加上新資源。若要移除資源，請在陣列中包含 `{ "id": 123, "_destroy": true }`。
