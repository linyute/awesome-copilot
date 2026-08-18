# 神經多樣性友善設計 — 看板背後的原則 (Neurodivergent-friendly design — principles behind the board)

此看板建構在成熟的**友善對待執行功能 (executive-function–friendly)** 設計原則之上 —
與具備 ADHD/EF 感知能力的工具所使用的模式相同。它旨在幫助*每個人*專注，並對
神經多樣性人群提供真正的支援。兩條基本規則：

- **不要醫療化或主觀假設。** 切勿診斷使用者或將其稱為「ADHD 模式」。將其建構為
  適合所有人的專注友善設計。每項功能設計皆為可選項。
- **神經多樣性是異質性的。**「遇見一個 ADHD 患者，你只了解了一種 ADHD 的樣貌。」
  因此這些是*可設定的支援*，而不是規範性的系統。

> 來源：立足於公認來源的既有執行功能 / ADHD 設計知識 — 請參閱
> 本文件末尾的**來源**（CHADD 的執行功能、Simply Psychology 的替身輔助，
> 以及 W3C/MDN 的減少動態效果無障礙功能）。這些是教育參考資料，
> 而非系統性文獻回顧或臨床指引。

## 挑戰 → 原則 → 功能

| 執行功能挑戰 | 設計原則 | 看板中的功能 |
|---|---|---|
| **任務啟動** — 開始是一道牆（啟動能量） | 縮小第一步；使「下一步」清晰明確 | 代理程式行為：提供一個微小的第一步行動；**專注模式**以呈現單一任務 |
| **時間盲** — 截止時間感覺很抽象，直到迫在眉睫 | 讓時間具體化 + 可見 | 即時**時鐘**；溫和的**到期倒數**（「剩餘 2 小時 10 分」），過期時顯示柔和琥珀色，絕非紅色 |
| **工作記憶 / 物體恆存** — 離開視線，拋諸腦後 | 保持可見 + 外部化 | 始終開啟的畫布；作為當天外部記憶的**動能摘要** |
| **不知所措** — 長清單導致癱瘓 | 減少可見負載；一次只做一件事 | **專注模式**調暗除一項以外的所有內容；順延使清單保持簡短 |
| **多巴胺 / 獎勵** — 由興趣與急迫性驅動；需要立即回報 | 即時、可見的獎勵 + 新鮮感 | 進度環、紙花效果、動能摘要；**開始即算數**（切換為進行中 — 夥伴可以在摘要中記錄它）；輪換鼓勵語句 |
| **完美主義 / 羞恥感螺旋** — 漏掉一項 → 放棄整個系統 | 無懲罰；部分計分；輕鬆推遲 | **「非今日」順延**（無逾期羞恥感）；「進行中」計入進度；順延項目離開環形計算 |
| **分心雜念** — 偶然的想法將您拉離任務 | 無摩擦擷取，稍後處理 | **🧠 腦力傾倒盒**（「先暫存，繼續前進」） |
| **任務切換 / 轉換** | 明確的「下一步是什麼」交接 | 代理程式行為：指明下一步的一件事，提供專注模式 |
| **替身輔助 (Body-doubling)** — 有夥伴在場專注度提升 | 成為房間裡的另一人 | 整個前提：您*透過與 AI 夥伴對話*來驅動看板 |
| **感官 / 動態敏感** | 平靜基底，可選刺激 | **減少動態效果切換**（關閉紙花/轉場）；預設遵循 `prefers-reduced-motion` |
| **自我調節 / 內感受** — 在注意到自己狀態前就做出反應 | 先無評判地*定位自己* | **基準線之上/之下簽到**（源自 Conscious Leadership）；低於基準線會悄悄軟化夥伴的建議 |
| **動機 / 自我對話** — 光禿禿的待辦清單毫無樂趣 | 溫和、自主選擇的意圖 | **每日箴言** — 自行設定或 🔄 建議，依據簽到調整（低於基準線時穩定心緒，高於基準線時提供動能） |
| **優先級不知所措** — 每件事看起來都同樣緊急 | 將*重要*與*緊急*分開 | **艾森豪象限**（優先處理 / 排程 / 委派 / 稍後）+ **依優先級排序** + 🧭 白話圖例 |
| **主動權 / 擁有感** — 僵化的系統會被放棄 | 讓人們塑造自己的工具 | **拖曳重新排序**（或 ▲/▼ / 鍵盤）、**可編輯標籤**、即時**新增任務**（可移除新增的任務） |
| **收尾 / 反思** — 沒有標記的日子會模糊混在一起 | 以溫和、具體的總結結束 | **一日結束儲存** — 下載或複製 Markdown 總結；貼給夥伴以記錄日誌並規劃明天 |

## 最重要的部分是行為，而不是介面裝飾

UI 設計固然重要，但最大的 EF 支援是**夥伴如何展現**：縮小第一步、建議一件事、
慶祝開始、切勿羞辱未完成的事項、自由提供順延、暫存分心雜念、讓時間具體化、
防止過載。這些都編寫在 `SKILL.md`（「友善對待執行功能的行為」）中。一個漂亮的看板如果
搭配一個令人產生羞恥感、包攬一切的夥伴，將完全失去意義。

## 來源

上述原則背後的教育參考資料（連結於 2026-07-27 進行驗證）。非臨床指引；
神經多樣性是異質性的，因此請將這些視為需要調整的支援，而不是規則。

- **執行功能 — 任務啟動、啟動能量、時間管理、工作記憶** —
  CHADD (Children and Adults with ADHD)，領先的 ADHD 非營利組織：
  - *Executive Function Skills* — https://chadd.org/about-adhd/executive-function-skills/
  - *Executive Function Issues and ADHD* (Brown & Barkley 模型) —
    https://chadd.org/attention-article/executive-function-issues-and-adhd/
- **替身輔助 (Body doubling)** — 在夥伴在場的情況下專注度提升；看板的核心前提
  （「透過與您的 AI 對話來驅動它」）— Simply Psychology, *Body Doubling and ADHD* —
  https://www.simplypsychology.com/articles/body-doubling-adhd
- **減少動態效果 / 感官敏感度** — 減少動態效果切換以及遵循作業系統
  `prefers-reduced-motion` 設定背後的原理：
  - MDN, *`prefers-reduced-motion`* —
    https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  - W3C WCAG 2.1, *Understanding SC 2.3.3: Animation from Interactions* —
    https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- **基準線之上/之下 —「定位自己」**（抵達簽到）— The Conscious Leadership
  Group, *Locating Yourself: A Key to Conscious Leadership* —
  https://conscious.is/video/locating-yourself-a-key-to-conscious-leadership
- **重要 vs. 緊急**（艾森豪象限標籤 +「排程是優秀工作所在之處」）：
  - Asana, *The Eisenhower Matrix* — https://asana.com/resources/eisenhower-matrix
  - Todoist, *The Eisenhower Matrix* — https://todoist.com/productivity-methods/eisenhower-matrix
- **自我慈悲 (Self-compassion)**（箴言溫和、無羞辱的框架）— Dr. Kristin Neff,
  self-compassion.org — https://self-compassion.org/

ADDitude Magazine (additudemag.com) 是另一個廣泛使用、專注於 ADHD 的資源，
值得搜尋以深入閱讀有關任務啟動、時間盲和替身輔助的內容。
