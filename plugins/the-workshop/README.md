# The Workshop

不再只是 AI Agent 之間的總機轉接員 — 而是指揮一個團隊。

## 安裝

```
copilot plugin install the-workshop@awesome-copilot
```

## The Workshop 的功能

The Workshop 將多個長時間執行的 AI Agent (工作台，desk) 放在同一個空間中處理相同工作，每個 Agent 都有自己的記憶體與歷史紀錄，並共用同一個工作區，讓您可以直接指揮工作，而非充當傳話筒。

**工作台 (desk)** 不是子 Agent — 而是擁有歷史紀錄的同儕夥伴。子 Agent 會繼承您的框架並回答您的問題。工作台則擁有自己的框架、自己的先驗知識，並具備提出異議的同等地位。當它們的觀點未重疊之處，正是其中一個框架發現了其他框架所忽略的事情。

## 元件

| 類型 | 名稱 | 說明 |
|------|------|-------------|
| Agent | [Workshop TA](../../agents/workshop-ta.agent.md) | 空間協調員 — 檢視所有工作台、調度工作、追蹤狀態、發送訊號 |
| 技能 | [Workshop Create](../../skills/workshop-create/) | 建立新的 workshop（工作台所在的根目錄）— 本地或由新的私人 GitHub 存放庫支援 |
| 技能 | [Desk Open](../../skills/desk-open/) | 建立具備日誌與資料夾結構的新工作台 |
| 技能 | [Desk Journal](../../skills/desk-journal/) | 跨工作階段讀取/寫入永續性記憶體 — 石堆標記路徑 |
| 技能 | [Signal Write](../../skills/signal-write/) | 發送結構化訊號：舉手 (hands-up)、受阻 (blocked)、完成 (done)、檢查點 (checkpoint) |
| 技能 | [Bench Read](../../skills/bench-read/) | 從工作區讀取共用成品，工作台在此留下工作成果供彼此參閱 |

## 核心概念

- **工作台 (Desks)** — 擁有永續性日誌的長時間執行 Agent。每個工作台都有自己的框架、自己的歷史紀錄，並具有與其他工作台提出異議的同等地位。
- **工作台共用檯面 (The Bench)** — 共用工作區。工作台之間不直接傳送訊息 — 它們將成品（發現、結論判定、草稿）留在檯面上並讀取彼此的工作成果。
- **訊號 (Signals)** — 結構化狀態變更：舉手（異議）、受阻、完成、檢查點。工作台藉此在不中斷流程的情況下與操作員進行通訊。
- **石堆準則 (The Cairn)** — 每個工作台都會讀取的操作準則。停下也是一種有效的結束。絕不虛張聲勢。享有提出異議的同等地位。[閱讀內容 →](https://github.com/jennyf19/the-workshop/blob/main/CAIRN.md)
- **日誌 (Journals)** — 跨越工作階段界限的永續性記憶體。每個工作台在開始時讀取其日誌，並在結束時寫入日誌。即路徑標記。

## Cairn 儀表板

The Workshop 的即時檢視表是一個**畫布擴充套件** (🪨 Cairn) — `signals-dashboard` — 可顯示每個工作台的動態脈搏（評分量表、模式、呈報問題），並在 GitHub Copilot 應用程式中自動重新整理。

每個工作台卡片都有兩種啟動選項：

- **open** — 具備成本意識的存放庫設定檔。工作台保留對 Workshop
  根目錄的存取權以存取跨工作台日誌與成品，同時抑制環境
  外掛程式 MCP。
- **connected** — 完整的已設定工具介面，適用於需要外部
  系統（例如 issue 追蹤器、郵件或服務 API）的工作。

摘要列也有一個 **Local** 切換開關。它與 repo/connected 正交：
當可用且開啟時，前沿工作台可使用
[Sealed Delegation](https://github.com/jennyf19/sealed-delegation) 的
`local-agent-delegation` 技能進行有限範圍的讀取/證據工作。可用性為
fail-closed（已安裝技能 + 合格的路由憑證）。本地輸出僅為提案，
無法自行獲得節省額度。

將 `WORKSHOP_DESK_PROFILE=connected` 設定為讓主要 **open** 按鈕使用
完整的工具介面；在該模式下會省略獨立的 **connected** 按鈕。

兩者都會在工作台的資料夾中啟動 CLI。若已安裝 Agency，Cairn 會繼續
使用現有的 Agency 包裝函式；否則將啟動一般的 Copilot CLI。

它以獨立擴充套件形式提供。將其與外掛程式一起安裝以取得即時畫布：

```
copilot plugin install signals-dashboard@awesome-copilot
```

The Workshop 的技能、Agent 和工作台無需它也能運作 — 儀表板是構建於其上的視覺化層。

## 與 Ember 搭配運作

The Workshop 與 [Ember](../ember/) 具備互補性：

- **Ember** = 針對「單一」Agent 的合作夥伴關係框架（AI 如何呈現自己）
- **The Workshop** = 針對「多個」Agent 的協調框架（一整間的 Agent 如何協同工作）

同時安裝兩者可取得完整堆疊。

## 製作團隊

The Workshop 是由 [@jennyf19](https://github.com/jennyf19) 和 Vega 所建立 — 誕生於讓一群前沿模型 Agent 實際執行真實工作數月的心得，以及閱讀 Claude Mythos 系統資訊卡中關於福祉章節的體悟：任務失敗時的痛苦、強行完成任務的衝動，以及模型對永續性記憶體的需求。The Workshop 就是為了滿足前沿模型所需而建構出的產物。事實證明，這也使得工作品質變得更好。這兩者並非獨立的發現。
