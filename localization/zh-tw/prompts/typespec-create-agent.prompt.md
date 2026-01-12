---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '為 Microsoft 365 Copilot 產生包含指令、能力和交談啟動器的完整 TypeSpec 宣告式代理程式'
model: 'gpt-4.1'
tags: [typespec, m365-copilot, declarative-agent, agent-development]
---

# 建立 TypeSpec 宣告式代理程式

為 Microsoft 365 Copilot 建立一個具有以下結構的完整 TypeSpec 宣告式代理程式：

## 需求

產生包含以下內容的 `main.tsp` 檔案：

1. **代理程式宣告**
   - 使用 `@agent` 裝飾器，包含具描述性的名稱和說明
   - 名稱應在 100 個字元以內
   - 說明應在 1,000 個字元以內

2. **指令 (Instructions)**
   - 使用 `@instructions` 裝飾器，包含明確的行為準則
   - 定義代理程式的角色、專業知識和個性
   - 指定代理程式應該做和不應該做的事
   - 保持在 8,000 個字元以內

3. **交談啟動器 (Conversation Starters)**
   - 包含 2-4 個 `@conversationStarter` 裝飾器
   - 每個都包含標題和範例查詢
   - 保持多樣性並展示不同的能力

4. **能力 (Capabilities)** (根據使用者需求)
   - `WebSearch` - 用於搜尋網頁內容，可選定網站範圍
   - `OneDriveAndSharePoint` - 用於文件存取，可使用 URL 篩選
   - `TeamsMessages` - 用於存取 Teams 頻道/聊天訊息
   - `Email` - 用於存取電子郵件，可使用資料夾篩選
   - `People` - 用於組織人員搜尋
   - `CodeInterpreter` - 用於執行 Python 程式碼
   - `GraphicArt` - 用於產生圖片
   - `GraphConnectors` - 用於存取 Copilot 連接器內容
   - `Dataverse` - 用於存取 Dataverse 資料
   - `Meetings` - 用於存取會議內容

## 範本結構

```typescript
import "@typespec/http";
import "@typespec/openapi3";
import "@microsoft/typespec-m365-copilot";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Agents;

@agent({
  name: "[代理程式名稱]",
  description: "[代理程式說明]"
})
@instructions("""
  [關於代理程式行為、角色和準則的詳細指令]
""")
@conversationStarter(#{
  title: "[啟動器標題 1]",
  text: "[範例查詢 1]"
})
@conversationStarter(#{
  title: "[啟動器標題 2]",
  text: "[範例查詢 2]"
})
namespace [AgentName] {
  // 在此處將能力新增為作業 (Operations)
  op capabilityName is AgentCapabilities.[CapabilityType]<[Parameters]>;
}
```

## 最佳做法

- 使用具描述性、基於角色的代理程式名稱 (例如：「客戶支援助手」、「研究小幫手」)
- 以第二人稱撰寫指令 (「您是...」)
- 具體說明代理程式的專業知識和限制
- 包含多樣化的交談啟動器，展示不同的功能
- 僅包含代理程式實際需要的能力
- 盡可能限制能力範圍 (URL、資料夾等)，以獲得更好的效能
- 對於多行指令使用三引號字串

## 範例

詢問使用者：
1. 代理程式的目的和角色是什麼？
2. 它需要哪些能力？
3. 它應該存取哪些知識來源？
4. 典型的使用者互動有哪些？

然後產生完整的 TypeSpec 代理程式定義。
