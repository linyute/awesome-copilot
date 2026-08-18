---
name: 'desk-journal'
description: '撰寫、附加或讀取工作桌日誌條目。日誌是持久記憶 — 在會話邊界之間留存的內容。良好的條目包含：完成了什麼、目前狀態、下一步。'
---

# 工作桌日誌 (Desk Journal)

管理工作桌的日誌 — 跨越會話邊界留存的
持久記憶。

## 何時使用

- **會話結束：** 寫下完成了什麼、目前狀態、下一步
- **會話開始：** 閱讀日誌以從上次中斷處繼續
- **會話中期檢查點：** 記錄重大進展或決策
- **工作桌結束收尾：** 在關閉工作桌時撰寫最終摘要

## 如何撰寫日誌條目

附加至 `desks/<desk-name>/journal.md`。每個條目都是一個章節：

```markdown
## <date> — <short summary>
- **Worked on:** <what was done this session>
- **Current state:** <where things stand right now>
- **Next step:** <what the next session should pick up>
```

### 指引

- **具體明確。**「進行了安全性掃描」對下一個會話
  毫無用處。「掃描了存放庫 A、B、C 的 CWE-502；在 A 中
  發現 3 項調查結果，B 和 C 中為 0 項；調查結果已分流至工作台」—
  這才是一條軌跡。
- **包含無效的方法。** 死胡同很有價值 — 它們可以防止
  下一個會話走相同的冤枉路。
- **保持簡短。** 日誌是路標，而不是日記。
  每個條目 3-5 行。如果您需要更多內容，重要上下文
  應作為獨立產物發佈在工作台上。
- **務必包含下一步。** 下一個會話從零開始。
  如果沒有下一步，它就必須重新推導所有內容。

## 工作桌收尾條目

當工作桌正在收尾結束時（不僅僅是會話結束，而是
工作桌本身關閉）：

```markdown
## <date> — Desk closed
- **Summary:** <what this desk accomplished overall>
- **Artifacts:** <what's on the bench from this desk>
- **Handoff:** <anything another desk or the operator needs to know>
```

## 閱讀日誌

在會話開始時，閱讀工作桌的日誌以獲取上下文。
最新的條目是最重要的 — 它包含目前狀態和
下一步。較早的條目在需要時提供歷史記錄。

## 原則

- 日誌是石堆標記 (cairn) — 留下的石頭讓下一位旅行者找到
  前進的路。每個條目都是一塊石頭。
- 誠實重於完整。「我卡在 X 上且不知道原因」
  比沉默更有用。
- 日誌是給下一個會話使用的，而不是給目前會話使用的。
  為對您剛做過的事情一無所知的人撰寫。
