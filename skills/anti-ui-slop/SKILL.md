---
name: anti-ui-slop
description: '阻止編碼代理人交付平庸粗糙的通用 UI。使用 UIZZE 的 800,000+ 個真實 Web 與 iOS 畫面來建構符合產品特性的介面、定義設計合約、涵蓋必要狀態，並執行嚴格的完工把關。當在 Codex、Claude Code、Cursor、Copilot 或其他編碼代理人中設計、實作、重新設計、審查或進行發布前檢閱 Web 或 iOS 介面時使用。觸發詞包括 "anti-ui-slop"、"stop UI slop"、"ground this UI in real screens" 或 "run the UI finish gate"。'
license: MIT
metadata:
  version: "1.2.13"
  author: "UIZZE <business@uizze.com>"
  compatibility: "專為 Claude Code、Codex、Cursor 與 GitHub Copilot 設計；適用於任何能讀取專案檔案與擷取 URL 的代理人。"
  tags: "ui-design, design-system, design-review, frontend, web-ui, ios-ui"
---

> **阻止 AI 編碼代理人交付平庸粗糙的通用 UI。**

# 停止製造 UI 劣質品 (UI Slop)

透過 [UIZZE](https://uizze.com)，以 800,000+ 個真實 Web 與 iOS 畫面建構符合產品特性的 UI。

![Stop Making UI Slop with UIZZE](https://uizze.com/landing/anti-ui-slop-skill-banner.png)

## 概觀

使用產品需求簡介、現有 UI、元件與本地設計系統來打造深思熟慮的介面。Uizze 提供聚焦的設計指引，並在有幫助時提供少數相關的視覺參考。

## 先決條件

- 要建構、重新設計或檢閱的畫面或元件 — 檔案路徑或簡短描述。
- 產品的現有元件、設計 Token 與視覺語言，使建構工作能延伸既有基礎，而非重新發明新系統。
- 選用存取付費版 Uizze MCP 以取得聚焦的參考資料與託管素材。

## 身分驗證

- 免費技能與公開目錄可在無需帳戶、權杖、MCP 連線、相依性、指令碼或可執行檔的情況下運作。
- 選用的完整 UIZZE MCP 可使用主機的標準連線與身分驗證流程。在未取得實際主機結果前，絕不要宣稱其已連線。

## 從產品出發進行設計

在設計前請先研讀需求簡介、現有 UI、元件、Token 與各項限制。它們的優先權永遠高於本技能。維持熟悉的互動慣例，並使產品本身的物件、工作流程與優先事項在視覺上清晰明確。不要為了追求新穎而製造新穎。

## 載入單一行動手冊

針對目前的請求至多選擇一個檔案：

- 全新介面或重大重新設計：`reference/new-work.md`
- 產品或儀表板工作：`reference/operate.md`
- 調整與潤飾：`reference/polish.md`
- 簡化或提煉：`reference/distill.md`
- 明確稽核：`reference/audit.md`
- 原生 iOS 工作：`reference/ios.md`

不要載入第二本行動手冊。請運用判斷力，而非將其中的範例視為檢查清單。

## 選用的 Uizze 佐證

在使用付費 MCP 之前，請先閱讀 `references/uizze-reference-policy.md`。它明確提供 `find_ui_references` 與 `find_ui_materials`。僅在具體未解決的視覺或素材問題能受益於佐證時才使用它們。如果它們未傳回任何內容，請靜默繼續。

## 完成

完成要求的範疇。在環境支援時，渲染並檢視一次。修復可觀察到的損壞，例如裁切、重疊、失真媒體、無法存取的控制項或無回應的互動。維持簡潔的交接說明。
