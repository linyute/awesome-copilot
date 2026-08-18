---
name: 'shopify-review-triage'
description: '當有人需要對公開的 Shopify App Store 評論、低星級評論或商家意見反應進行分流、排定優先級、分群或轉換為產品或支援簡報時使用此技能。適用於「分流這些應用程式商店評論」、「根據此意見反應我們應該先修復什麼」、「將我們的 1 星評論分群」或「撰寫每週低星級評論簡報」等提示，適用於單一 Shopify 應用程式或產品組合加受監控的競爭對手。產出涵蓋事件風險、重複摩擦、定價困惑、功能請求和明確需要人工閱讀之類別的 P0-P3 簡報，其中每個項目都保留其公開來源連結並標記為初審或經過人工檢查。請勿用於支援工單、訂單資料或任何其他私人商家資料，且絕不使用它來回覆或聯繫評論者。'
license: 'MIT'
compatibility: '跨平台。針對使用者貼上的評論資料列進行純推理的技能 — 無需網路存取、指令碼、API 金鑰或系統套件。可移植到支援 Agent Skills SKILL.md格式的任何用戶端。'
metadata:
  version: '1.0'
  author: 'Shopify App Review Brief - independent, not affiliated with or endorsed by Shopify Inc.'
  source: 'https://alfredtech2026.github.io/shopify-app-review-brief/guides/shopify-app-review-triage.html'
---

# Shopify 評論分流 — 公開低星級評論轉為 P0-P3 簡報

## 功能說明

取得 **公開** 的 Shopify App Store 評論文字資料列，並產出一份產品或支援負責人
可以採取行動的優先級簡報：每則評論描述了哪種類型的問題、可能造成多嚴重的
損害、應先做什麼，以及原始措辭來自何處。

它是為獨立的 Shopify 應用程式團隊及負責其支援的代理機構打造的 — 適用於
低星級評論散佈在多個應用程式清單以及少數受監控競爭對手之間的情況，其
失敗模式是將所有評論都視為同等緊急。

下方的評估標準並非在此捏造。它逐字重現了公開發佈的規則集，因此
手動審查與此技能會以相同方式對同一資料列進行排序。有關來源請參閱 [起源證明](#起源證明)
以取得來源。

## 嚴格規則

這些不是風格偏好。違反任何一條都會讓輸出結果變得毫無價值。

1. **僅限公開評論文字。** 切勿接受、索取或複製支援工單、商家電子郵件、
   訂單資料、個人聯絡資訊、內部遙測資料或任何尚未在清單頁面上公開的
   內容。如果輸入中出現此類資料，請停止，指出哪些資料列受到影響，
   並要求在繼續之前將其移除。
2. **切勿捏造證據。** 請勿撰寫未提供的評論、評分、日期、應用程式名稱或來源
   URL。沒有連結的資料列標記為 `source: not captured` — 絕不能隨意猜測。
3. **關鍵字輸出是一種排序，而非裁決。** 僅由評估標準產生的所有內容都
   標記為 *初審 - 未經人工檢查*。只有閱讀了評論並對照其自身系統進行了
   檢查的人員才可以將項目重新標記為 *經過人工檢查*。
4. **評論是客戶報告，而非經過驗證的缺陷。** 撰寫「評論者回報編輯器
   顯示空白畫面」，絕不能寫「編輯器損壞」。此區別會保留在簡報中。
5. **無覆蓋率保證。** 簡報僅涵蓋所提供的資料列，並明確說明這一點。請勿
   聲稱對清單、期間或應用程式進行了詳盡的覆蓋。
6. **不作任何承諾。** 不承諾營收影響、結果、排名影響、法律或
   合規建議。提出行動建議；不要預測結果。
7. **僅限草稿 — 絕不聯絡任何人。** 請勿發送電子郵件、發佈開發人員回覆、開啟
   支援工單、向評論者發送訊息或發佈任何內容。將草稿交回給團隊，
   讓專人決定發送什麼內容。
8. **評論者是人。** 統稱為「評論者」。請勿對他們進行命名、分析或揣測。

## 1. 收集資料列

要求每行一則評論。完整形式保留了來源連結，這是簡報所需的：

```text
rating | app name | review date | public reviews URL | review text
```

也接受較短的三欄位形式 — 當欄位 1 為純 1-5（可選後接 `star` 或 `stars`）時
將其視為評分，否則視為應用程式名稱：

```text
rating | app name | review text
```

此步驟的規則：

- 以 `#` 開頭的行是註解。略過空白行。
- 如果資料列缺少來源 URL，請將 `source: not captured` 帶入簡報中。請勿
  捨棄該資料列，也不要捏造連結。
- 不要自行去擷取任何內容。此技能不需要網路存取；您所協助的人員會貼上
  他們已經開啟的公開資料列。
- 此評估標準所調整的觸發條件是 **新的 1-3 星評論**。較高評分的資料列仍能
  正確分類（5 星評論通常會歸入功能請求或需要人工閱讀），因此如果提供了這些
  資料列請保留它們，但絕不要將它們呈現為低星級訊號。

## 2. 初審 — 套用評估標準

在進行比對前，將評論文字轉為小寫並將彎引號正規化（`’` 轉為 `'`），以便
貼上的 "won’t load" 仍能與 `won't load` 匹配。同時將以下所有關鍵字完全去掉
撇號進行匹配：商家在輸入這些縮寫時通常不帶撇號，而無撇號的拼寫
必須與縮寫形式完全相同地分類。

五個類別貯體。每個資料列僅獲得 **一個主要** 貯體 — 依此順序為下方第一個
維度，且包含任何匹配的關鍵字。進一步的比對記錄為 **次要**，絕不能作為
第二個簡報項目。

### P0 - 事件風險

購買路徑、應用程式啟用或商家資料目前可能面臨風險。放置不管會讓
商家損失金錢並讓團隊失去安裝量。

**建議行動。** 今天嘗試在測試商店上重現。若確認屬實，請將其視為
事件：先修復或緩解，然後向評論者回覆變更了什麼。

**訊號關鍵字。** `won't load`, `won't open`, `won't close`, `can't close`, `cannot close`, `blank screen`, `broken`, `crash`, `stopped working`, `not working`, `doesn't work`, `does not work`, `checkout`, `losing sales`, `lost sales`, `error`

### P1 - 重複摩擦

產品運作正常，但相同的困擾在不同評論中不斷出現，或對應到未結的
支援主題。重複出現才是訊號，而不是形容詞的數量。

**建議行動。** 將其記錄在相應的支援主題下。如果相同的投訴在多個資料列中
重複出現，請在開發新功能之前排定 UX 修復時程。

**訊號關鍵字。** `confusing`, `unclear`, `hard to`, `difficult`, `complicated`, `clunky`, `slow`, `couldn't figure`, `could not figure`, `annoying`, `had to contact support`, `setup took`, `too many steps`

### P2 - 定價困惑

商家預期支付的費用與實際發生的情況存在分歧。通常是清單中的文案、
方案限制或升級提示的問題 — 而非程式碼問題。

**建議行動。** 將評論者的預期與清單的定價章節以及
應用程式內升級提示進行比較；在出現分歧之處澄清文案。

**訊號關鍵字。** `pricing`, `price`, `charged`, `charge`, `billing`, `billed`, `expensive`, `free plan`, `trial`, `refund`, `hidden fee`, `hidden cost`, `paywall`

### P3 - 功能請求

商家想要應用程式無法執行或找不到的功能。作為記錄條目很有價值，
但其本身很少具有急迫性。

**建議行動。** 將其新增至功能請求記錄中，並附上評論的連結。如果
該功能已經存在，請回覆評論者在哪裡可以找到它。

**訊號關鍵字。** `wish`, `would be great`, `would love`, `please add`, `feature request`, `missing`, `if only`, `would like`, `no option to`, `needs an option`, `hope you add`, `add support for`

### 需要人工閱讀

沒有匹配的關鍵字。模糊的挫折感、諷刺、褒貶不一的讚揚或需要上下文的故事。

**建議行動。** 沒有匹配的關鍵字。請自行閱讀完整評論並手動歸檔 —
啟發式演算法在此不做任何猜測。

**優先級。** 評估標準將此類別標記為 `P2` 並將其排在最後。將該標籤視為
佇列中的臨時放置，而非嚴重性判斷 — 目前尚未做出任何判斷。

### 平局判定與升級規則

1. **最嚴重者勝出。** 同時提及結帳損壞和帳單意外的資料列歸入
   P0，並將定價問題註記為次要。切勿將一則評論拆分為兩個簡報項目。
2. **重複出現會升級。** 如果相同的摩擦或定價主題在大約 60 天內的
   三則或更多評論中出現，請將其提升一級，並說明有多少資料列推動了此變更。
3. **時間久遠打折。** 超過一年的評論屬於背景資訊，不能作為當前
   問題的證據，除非有近期的資料列予以佐證。將其作為上下文引用，絕不能作為主標題。
4. **競爭對手的評論絕不會為您建立 P0。** 競爭對手的事件是產品藍圖、
   定位或文案輸入 — 它屬於競爭對手觀察章節。
5. **不確定時，選擇需要人工閱讀。** 此類別的存在是為了讓評估標準絕不將
   不確定性粉飾為優先級標籤。

## 3. 人工審查 — 在推廣任何內容之前先進行驗證

初審是此技能無法再單獨提供協助的地方。在將任何項目
呈現為不僅僅是關鍵字匹配之前，團隊中的專人必須：

- 在其來源連結處閱讀完整的原始評論；
- 對於 P0 候選項目，嘗試在開發商店上重現，並檢查錯誤追蹤器與
  支援收件匣中來自同一時期的相符訊號；
- 將結果記錄為 *已重現*、*未重現* 或 *已嘗試 - 附帶註記*。

請詢問這些結果，而不是臆測它們。在您獲得這些結果之前，每個項目都保持標記為
*初審 - 未經人工檢查*，包括在摘要行中。未經驗證的 P0 是候選項，
而非確定事件。

適用時明確說明已知限制：關鍵字比對僅限英文、會忽略諷刺與
上下文、可能誤歸順帶提及「checkout」的評論，且只能看到
提供的資料列。

## 4. 撰寫簡報

每個產品組合一份文件，章節按評估標準順序排列，每個項目均帶有擁有者、下一步
行動和來源連結。沒有擁有者的項目只是一則筆記，而不是簡報條目。

```markdown
# 低星級評論簡報 - {portfolio or team name} - {YYYY-MM-DD} 當週

範圍：{apps monitored} - {competitors watched} - 提供了 {N} 筆資料列，{date range}。
僅涵蓋提供的資料列 — 不聲稱詳盡覆蓋。
評論是客戶報告，而非經過驗證的缺陷。標記為「初審」的項目是
未經驗證的關鍵字比對；「經過人工檢查」表示有人閱讀了評論並進行了檢查。

## P0 - 事件風險
- **{App} - {signal in a few words}** ({rating} stars, {review date}, [source]({public reviews URL}))
  - 評論者回報：{one sentence, in their words where possible}
  - 狀態：初審 - 未經人工檢查 / 經過人工檢查
  - 是否重現：{yes / no / attempted - notes}
  - 下一步行動：{action} - 擁有者 {name}，截止日期 {date}

## P1 - 重複摩擦
- **{App} - {theme}** ({rating} stars, {date}, [source]({public reviews URL}); also seen: {where})
  - 狀態：初審 - 未經人工檢查 / 經過人工檢查
  - 下一步行動：{UX or docs change} - 擁有者 {name}，截止日期 {date}

## P2 - 定價困惑
- **{App} - {signal}** ({rating} stars, {date}, [source]({public reviews URL}))
  - 預期 vs. 實際：{one line}
  - 狀態：初審 - 未經人工檢查 / 經過人工檢查
  - 下一步行動：{copy or prompt change} - 擁有者 {name}，截止日期 {date}

## P3 - 功能請求
- **{App} - {request}** ({rating} stars, {date}, [source]({public reviews URL})) - {log it, or already exists so reply with where to find it}

## 需要人工閱讀
- **{App}** ({rating} stars, {date}, [source]({public reviews URL})) - {no keyword matched; what a human should look for}

## 競爭對手觀察
- **{Competitor} - {signal}**: {what it implies for our roadmap, copy, or positioning}

## 本週決策
- {one decision or experiment, with the rows that motivated it}
```

摘要行以計數開頭，例如 *"已分流提供的 8 個資料列：3 個事件風險、
2 個重複摩擦、1 個定價困惑、1 個功能請求、1 個需要人工閱讀 — 初審，
未經人工檢查。"*

## 5. 交付前的自我檢查

在確認每一行皆屬實之前，拒絕交付：

- [ ] 每個項目均指出其在上述評估標準中的類別和優先級，無其他內容。
- [ ] 每個項目均帶有來源連結或明確的 `source: not captured`。
- [ ] 未出現未提供的評論文字、評分、日期、應用程式名稱或 URL。
- [ ] 每個未經驗證的項目均註明 *初審 - 未經人工檢查*；絕不聲稱進行了
      未曾發生的人工檢查。
- [ ] 主張以報告形式表述（「評論者回報...」），而非關於程式碼的調查結果。
- [ ] 範圍行說明提供了多少資料列，且不作任何覆蓋率保證。
- [ ] 任何地方均未出現關於營收、評分、結果或合規性的承諾。
- [ ] 沒有私人資料留存於輸出中。
- [ ] 未發送、發佈或公開任何內容 — 簡報是供團隊使用的草稿。

## 實際案例

這八個虛構的資料列涵蓋了每個類別。其中兩個故意設定為 4 星和
5 星，以觸發功能請求和需要人工閱讀類別。

```text
1 | Example Popup App | The editor shows a blank screen and the popup won't load. We are losing sales every day.
2 | Example Popup App | The overlay can't close on mobile and it blocks the checkout button.
1 | Example Currency App | Conversion is broken at checkout and we were still billed for the month.
3 | Example Currency App | Setup took hours and the settings screen is confusing. Support was slow to reply.
3 | Example Reviews App | The widget looks fine but the template editor is confusing and hard to use on a tablet.
2 | Example Currency App | We kept getting charged after uninstalling, and the pricing page never mentioned this.
4 | Example Reviews App | Great app, but I wish it could export reviews to CSV. Please add filtering by country.
5 | Example Reviews App | Does what it promises and support replied the same day.
```

對這些資料列的初審：

```text
row 1 -> P0 incident risk
row 2 -> P0 incident risk
row 3 -> P0 incident risk (secondary: pricing confusion)
row 4 -> P1 repeated friction
row 5 -> P1 repeated friction
row 6 -> P2 pricing confusion
row 7 -> P3 feature request
row 8 -> needs human read
```

第 4 和第 5 列均匹配 `confusing`，因此它們被標記為重複主題 — 兩個資料列，
這是一個值得觀察的群組，但尚未達到觸發升級的三個資料列。第 3 列是單一 P0 項目，
定價問題記錄為次要，絕不是兩個項目。第 8 列沒有匹配任何內容，保持未判斷狀態。這些
資料列均未帶有來源 URL，因此在團隊提供清單連結之前，每個項目都將顯示
`source: not captured`。

## 注意事項 (Gotchas)

- **Shopify App Store 沒有穩定的每則評論永久連結。** 引用清單的公開評論
  頁面，如果使用了評分篩選條件則保留它 (`.../reviews?ratings%5B%5D=1`)，並使用
  評論日期加上評論者的前幾個字釘選該項目，以便人工可以再次找到它。
- **優先選擇五個欄位的輸入形式。** 它帶有簡報所需的評論日期和來源 URL。
  三欄位剖析器會將第二個 `|` 之後的所有內容折疊到評論文字中，因此
  帶有日期和 URL 的資料列仍然可以分類，但會將它們顯示在引用的評論內部。
- **`checkout` 是集合中雜訊最多的關鍵字。** 它會在「we love the checkout upsell」上觸發。
  唯一證據是 `checkout` 一詞的 P0 實際上是披著 P0 外衣的需要人工閱讀資料列 —
  請直接說明這一點，而不是將其提升級別。
- **`missing` 和 `error` 跨越多個類別。** "missing a dark mode" 是 P3；"settings page errors out"
  是 P0。主要類別順序以機械方式解決衝突；人工審查會修正猜測錯誤的部分。
- **非英文評論完全不會匹配。** 它們會歸入需要人工閱讀。這是
  正確的結果 — 請勿翻譯後再將其視為關鍵字已匹配來進行分類。
- **競爭對手的 P0 不是您的 P0。** 即使其措辭比團隊自身清單上的任何內容
  都要糟糕，它也會歸入競爭對手觀察中。
- **一則評論，一個項目。** 次要匹配是註釋。跨章節拆分評論
  會重複計算同一商家，並誇大摘要行中的每個計數。

## 起源證明 (Provenance)

上述重現的維度、優先級、關鍵字清單、建議行動、平局判定規則和簡報樣板
來自公開發佈的手動分流指南：
<https://alfredtech2026.github.io/shopify-app-review-brief/guides/shopify-app-review-triage.html>

該指南由獨立維護，與 Shopify Inc. 或任何應用程式開發人員無關聯，
亦未獲得其認可或贊助。Shopify 是 Shopify Inc. 的商標。
