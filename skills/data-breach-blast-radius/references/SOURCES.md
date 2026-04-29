# 來源與驗證

此技能中的每個數據、公式和分類均取自公開可驗證的主要來源。建立此檔案是為了讓貢獻者、審查者和使用者在信任輸出之前，能獨立驗證所有主張。

**如果你發現某個數字錯誤、過時或缺少引用 — 請針對此檔案提交 PR。**

---

## 資料分類標準

### GDPR 特殊類別 (第 1 級分類基礎)
- **來源：** 歐盟法規 (EU) 2016/679 — 第 9 條「處理特殊類別的個人資料」
- **URL：** https://gdpr-info.eu/art-9-gdpr/
- **內容說明：** 生物辨識資料、健康資料、遺傳資料、種族/族裔起源、政治觀點、宗教信仰、性生活/性取向均為「特殊類別」，需要明確同意。
- **我們的用途：** 這些直接對應到 `data-classification.md` 中的第 1 級。

### PCI-DSS 資料分類
- **來源：** PCI 安全標準委員會 — PCI DSS v4.0 (2022 年 3 月)
- **URL：** https://www.pcisecuritystandards.org/document_library/
- **內容說明：** 主要帳號 (PAN)、持卡人姓名、到期日、服務代碼 = 持卡人資料。CVV = 敏感驗證資料。兩者都必須受到保護。
- **我們的用途：** 對應到 `data-classification.md` 中的第 2 級 PCI-DSS。

### HIPAA 受保護健康資訊 (PHI) 定義
- **來源：** 45 CFR 第 160 部分和第 164 部分 (醫療保險流通與責任法案)
- **URL：** https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html
- **內容說明：** 使健康資料成為「受保護」的 18 項 HIPAA 識別碼 — 包括姓名、地理資料、日期、電話號碼、電子郵件、SSN、病歷號碼、健康計畫 ID 等。
- **我們的用途：** `data-classification.md` 中的第 1 級 PHI 欄位。

---

## GDPR 罰款公式

**來源：** 歐盟法規 (EU) 2016/679 — 第 83 條「施加行政罰款的一般條件」
**URL：** https://gdpr-info.eu/art-83-gdpr/

**確切法律文本 (第 83.4 條)：**
> 「對違反下列規定者，應...處以最高 10,000,000 歐元的行政罰款，或者如果是企業，則最高為上一財政年度全球年度總營業額的 2%，以較高者為準...」

**確切法律文本 (第 83.5 條)：**
> 「對違反下列規定者，應...處以最高 20,000,000 歐元的行政罰款，或者如果是企業，則最高為上一財政年度全球年度總營業額的 4%，以較高者為準...」

**我們的公式：** 直接轉錄自第 83.4 條 (第 1 級違規) 和第 83.5 條 (第 2 級違規)。未加入任何解釋。

**用於校準的歷史罰款 (皆經公開驗證)：**

| 罰款 | 組織 | 年份 | 來源 URL |
|------|-------------|------|------------|
| 12 億歐元 | Meta (愛爾蘭 DPC) | 2023 | https://www.dataprotection.ie/en/news-media/press-releases/data-protection-commission-announces-decision-in-meta-ireland-inquiry |
| 7.46 億歐元 | Amazon (盧森堡) | 2021 | https://iapp.org/news/a/amazon-hit-with-887m-fine-for-gdpr-violations/ |
| 2.25 億歐元 | WhatsApp (愛爾蘭 DPC) | 2021 | https://www.dataprotection.ie/en/news-media/press-releases/data-protection-commission-announces-decision-in-whatsapp-inquiry |
| 1.5 億歐元 | Google (法國 CNIL) | 2022 | https://www.cnil.fr/en/cookies-cnil-fines-google-150-million-euros-and-facebook-60-million-euros |
| 3530 萬歐元 | H&M (漢堡 DPA) | 2020 | https://www.datenschutz-hamburg.de/news/detail/article/hamburgische-beauftragte-fuer-datenschutz-und-informationsfreiheit-verhaengt-bussgeld-gegen-hm.html |
| 2200 萬歐元 | 英國航空 (ICO) | 2020 | https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2020/10/ico-fines-british-airways-20m-for-data-breach-affecting-more-than-400-000-customers/ |
| 1840 萬歐元 | 萬豪酒店 (ICO) | 2020 | https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2020/10/ico-fines-marriott-international-inc18-4million-for-failing-to-keep-customers-personal-data-secure/ |

---

## CCPA / CPRA 罰款公式

**來源：** 加州民法典 § 1798.155(a) — 加州消費者隱私法
**URL：** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.155

> **註 (截至 2025 年 6 月 30 日)：** Stats. 2025, Ch. 20, Sec. 1 (AB 137) 修訂了 § 1798.155。行政罰款金額現在位於 **(a) 小節**。舊有參考 `§ 1798.155(b)` 的罰款金額在修訂後的文本下是不正確的。請至上述 URL 驗證任何未來的變更。

**確切法條文本 (§ 1798.155(a) 修訂版)：**
> 「任何違反本標題的企業、服務提供者、承包商或其他人員，應承擔每次違規不超過二千五百美元 ($2,500) 的行政罰款，或每次故意違規不超過七千五百美元 ($7,500) 的行政罰款...」

**私人起訴權 (Private Right of Action) 來源：** 加州民法典 § 1798.150
**URL：** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.150

**確切法條文本：**
> 「任何消費者，其未經加密且未經脫敏的個人資訊...遭受未經授權的存取和外洩...可以提起民事訴訟，要求賠償...金額每位消費者每次事故不低於一百美元 ($100) 且不超過七百五十美元 ($750)，或實際損害賠償，以較高者為準...」

**我們的公式：** 直接轉錄。每次違規 $2,500 / $7,500 逐字取自 § 1798.155(a) (2025 年 6 月 30 日修訂版)。$100 – $750 的私人起訴權逐字取自 § 1798.150。

---

## HIPAA 罰款公式

**來源：** 45 CFR § 160.404 — 民事罰金
**URL：** https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-160/subpart-D/section-160.404

**來源 (HHS 懲罰分級說明)：** HHS 民權辦公室 (OCR)
**URL：** https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/index.html

**HHS OCR 懲罰分級 (目前經 2024 年通貨膨脹調整後的金額)：**
- 分級 A (不知情)：每次違規 $137 – $68,928，年度上限 $2,067,813
- 分級 B (有正當理由)：$1,379 – $68,928，年度上限 $2,067,813
- 分級 C (故意忽視，已修正)：$13,785 – $68,928，年度上限 $2,067,813
- 分級 D (故意忽視，未修正)：$68,928 – $1,919,173，年度上限 $1,919,173

**最新金額 URL：** https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/examples/all-cases/index.html

**關於我們數據的註記：** `regulatory-impact.md` 中的美元金額符合 HHS 經 2024 年通貨膨脹調整後的懲罰分級。HHS 每年會調整這些金額。請務必至 HHS OCR 網站驗證當前年份的數據。

**刑事處罰來源：** 42 U.S.C. § 1320d-6
**URL：** https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title42-section1320d-6

---

## LGPD 罰款公式

**來源：** 巴西一般資料保護法 (LGPD) — 第 13.709/2018 號法律，第 52 條
**URL：** https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

**確切文本 (第 52 條，I)：** 對私法人或集團在巴西上一財政年度營收處以最高 2% 的罰款，每次違規限額為 50,000,000 雷亞爾 (五千萬雷亞爾)。

**我們的公式：** 逐字取自第 52 條。

---

## 新加坡 PDPA 罰款公式

**來源：** 2012 年個人資料保護法 (新加坡) — 第 48J 條
**URL：** https://sso.agc.gov.sg/Act/PDPA2012

**最高罰款：** 根據 2021 年修訂版，每次外洩最高 100 萬新元，或在新加坡年度營業額的 10% (如果營業額超過 1000 萬新元) — 以較高者為準。

---

## 外洩成本基準

**來源：** IBM Security — 「資料外洩成本報告」(自 2005 年起每年發佈)
**URL：** https://www.ibm.com/reports/data-breach
**發佈者：** IBM Security + Ponemon Institute
**方法論 (2024 年版)：** 對 16 個國家/地區 17 個產業的 604 個組織進行調查。每次外洩涉及 2,170 – 113,954 筆受損紀錄。

**最新驗證數據 (IBM 2024 年版)：**
| 指標 | 值 | 來源 |
|--------|-------|--------|
| 全球平均總成本 | 488 萬美元 | IBM 2024, p.4 |
| 醫療保健每筆紀錄成本 | 408 美元 | IBM 2024, p.12 |
| 每筆紀錄平均成本 (所有產業) | 165 美元 | IBM 2024, p.11 |
| 識別外洩的平均時間 | 194 天 | IBM 2024, p.15 |
| 圍堵外洩的平均時間 | 73 天 | IBM 2024, p.15 |
| 超過 200 天的外洩額外成本 | +102 萬美元 | IBM 2024, p.16 |
| 採用 AI/ML 安全性所減少的成本 | -222 萬美元 | IBM 2024, p.20 |
| 事故反應 (IR) 規畫所減少的成本 | -23.2 萬美元 | IBM 2024, p.21 |
| 員工培訓所減少的成本 | -25.8 萬美元 | IBM 2024, p.21 |

**2025 年更新：** 位於上述 URL 的 IBM 2025 年報告指出全球平均成本從 488 萬美元下降了 9%。確切的 2025 年數據需要下載報告 PDF。**技能維護者：請在每年新版本發佈時更新此表。**

---

## 外洩通知期限

| 法規 | 期限 | 來源 |
|-----------|---------|--------|
| GDPR | 72 小時 | GDPR 第 33.1 條 — https://gdpr-info.eu/art-33-gdpr/ |
| 英國 GDPR | 72 小時 | 英國 GDPR 第 33 條 (保留的歐盟法律) — https://ico.org.uk/for-organisations/report-a-breach/ |
| HIPAA | 60 天 | 45 CFR § 164.412 — https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-D/section-164.412 |
| CCPA | 「最及時」 | 加州民法典 § 1798.82 — https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.82 |
| 新加坡 PDPA | 3 個日曆天 | PDPA 第 26D 條 — https://sso.agc.gov.sg/Act/PDPA2012 |
| 澳洲隱私法 | 30 天 | 1988 年隱私法, APP 1 + NDB 計劃 — https://www.oaic.gov.au/privacy/notifiable-data-breaches |
| 巴西 LGPD | 2 個工作天 (ANPD 指引) | ANPD 第 2/2022 號決議 — https://www.gov.br/anpd/pt-br |
| 日本 APPI | 3 – 5 個工作天 (2022 年修訂) | 個人資訊保護法第 26 條 — https://www.ppc.go.jp/en/legal/ |
| 加拿大 PIPEDA | 盡快且可行 | PIPEDA 第 10.1 條 — https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/ |

---

## 影響範圍公式基礎

評分公式結構改編自既有的風險量化框架：

| 組件 | 依據 |
|-----------|---------|
| 層級權重 × 暴露可能性 | OWASP 風險評級方法論 — https://owasp.org/www-community/OWASP_Risk_Rating_Methodology |
| 完整性因素 | FAIR (資訊風險因素分析) 模型 — https://www.fairinstitute.org/ |
| 母體規模標準化 | CVSS v4.0 攻擊規模 (Attack Scale) 指標 — https://www.first.org/cvss/v4-0/ |
| 背景乘數 | GDPR 敘述 (Recitals) 75, 91 (特殊類別會增加風險等級) — https://gdpr-info.eu/recital-75-gdpr/ |

**此公式「不是」什麼：** 它不是法律認可的標準。它是一個基於公認風險框架的規畫啟發式工具，產生相對得分以比較各暴露向量 — 而非對外洩成本的絕對預測。

---

## 何者為估計值 vs. 何者為確切數據

| 項目 | 狀態 | 註記 |
|------|--------|-------|
| GDPR 最高罰款 (2000 萬歐元 / 4% 營業額) | **確切** — 逐字取自第 83.5 條 | 這是法律規定 |
| CCPA 罰款 ($2,500 / $7,500) | **確切** — 逐字取自 § 1798.155(a) (2025 年修訂版) | 這是法律規定 |
| HIPAA 分級金額 | **2024 年確切數據** — HHS 通貨膨脹調整 | 每年更新 |
| 影響範圍得分 (Blast Radius Score) | **估計值** — 啟發式規畫工具 | 非法律或保險數據 |
| 財務影響範圍 ($X – $Y) | **估計值** — IBM 基準 + 套用到母體的罰款公式 | 非預測值 |
| 「可能的」罰款金額 | **估計值** — 基於歷史罰款模式 | 實際罰款隨監管機構而有巨大差異 |
| 通知期限 | **確切** — 逐字取自法律 | 這是硬性的法律期限 |
