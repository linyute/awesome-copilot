# GDPR 參考 — 資料權利、當責與治理 (Data Rights, Accountability & Governance)

當您需要下列相關實作細節時，請載入此檔案：
使用者權利端點、資料主體請求 (DSR) 工作流程、處理活動記錄 (RoPA)、同意管理。

---

## 使用者權利實作 (第 15–22 條)

每一項權利在系統上線前，**必須** 具備已測試的 API 端點或已記錄的後台流程。請在 **30 個日曆天內** 回應已驗證的請求。

| 權利 | 條款 | 工程實作 |
|---|---|---|
| 存取權 | 15 | `GET /api/v1/me/data-export` — 所有個人資料，JSON 或 CSV |
| 更正權 | 16 | `PUT /api/v1/me/profile` — 傳播至所有下游儲存區 |
| 刪除權 (被遺忘權) | 17 | `DELETE /api/v1/me` — 依據刪除檢查清單清除所有儲存區 |
| 限制處理權 | 18 | 使用者記錄上的 `ProcessingRestricted` 旗標；限制非必要處理 |
| 資料可攜權 | 20 | 同存取端點；結構化、機器可讀 (JSON) |
| 反對權 | 21 | 基於合法利益之處理的退出端點；立即執行 |
| 自動化決策 | 22 | 公開人工審查路徑 + 邏輯說明 |

### 刪除檢查清單 — 必須涵蓋所有儲存區

當呼叫 `DELETE /api/v1/me` 時，刪除管線 **必須** 清除：

- 主要關聯式資料庫 (匿名化或刪除資料列)
- 讀取複本 (Read replicas)
- 搜尋索引 (Elasticsearch, Azure Cognitive Search 等)
- 記憶體快取 (Redis, IMemoryCache)
- 物件儲存 (S3, Azure Blob — 個人圖片、文件)
- 電子郵件服務記錄 (Brevo, SendGrid — 傳送記錄)
- 分析平台 (Mixpanel, Amplitude, GA4 — 使用者刪除 API)
- 稽核記錄 (匿名化識別欄位 — 請勿刪除事件本身)
- 備份 (記錄備份存留時間 TTL；接受備份自然過期)
- CDN 邊緣快取 (若個人資料可能被快取，請進行清除)
- 第三方子處理器 (觸發其刪除 API 或記錄手動步驟)

### 資料匯出格式 (`GET /api/v1/me/data-export`)

```json
{
  "exportedAt": "2025-03-30T10:00:00Z",
  "subject": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-15T08:30:00Z"
  },
  "profile": { ... },
  "orders": [ ... ],
  "consents": [ ... ],
  "auditEvents": [ ... ]
}
```

- **必須** 是機器可讀格式 (JSON 優先，CSV 次之)。
- **必須** 不是 PDF 截圖或 HTML 頁面。
- **必須** 包含 RoPA 中針對該使用者列出的所有儲存區。

### DSR 追蹤器 (後台)

實作一個 **資料主體請求 (Data Subject Request) 追蹤器**，包含：
- 請求收到日期
- 請求型別 (存取 / 更正 / 刪除 / 可攜 / 限制 / 反對)
- 驗證狀態 (身分已確認 y/n)
- 截止日期 (收到日期 + 30 天)
- 指派處理人員
- 完成日期與結果
- 備註

自動化主要儲存區的清理作業；針對第三方儲存區記錄手動步驟。

---

## 處理活動記錄 (RoPA)

以動態文件 (Markdown, YAML 或 JSON) 形式維護，並在儲存庫中進行版本控制。
每當出現 **任何** 引入處理活動的新功能時，請務必更新。

### 每個處理活動的最低要求欄位

```yaml
- name: "User account management"
  purpose: "建立並管理使用者帳戶以進行服務存取"
  legalBasis: "合約 (第 6(1)(b) 條)"
  dataSubjects: ["已註冊使用者"]
  personalDataCategories: ["姓名", "電子郵件", "密碼雜湊", "IP 位址"]
  recipients: ["內部工程團隊", "Brevo (電子郵件傳送)"]
  retentionPeriod: "帳戶生命週期 + 12 個月"
  transfers:
    outside_eea: true
    safeguard: "Brevo — 標準契約條款 (SCCs)"
  securityMeasures: ["TLS 1.3", "AES-256 靜態加密", "bcrypt 密碼雜湊"]
  dpia_required: false
```

### 法律依據選項 (第 6 條)

| 依據 | 何時使用 |
|---|---|
| `合約 (6(1)(b))` | 為履行服務合約所必要的處理 |
| `合法利益 (6(1)(f))` | 防止詐騙、安全性、分析 (需要平衡測試) |
| `同意 (6(1)(a))` | 行銷、非必要 Cookies、選用剖析 |
| `法律義務 (6(1)(c))` | 稅務記錄、反洗錢 |
| `重大利益 (6(1)(d))` | 僅限緊急情況 |
| `公共任務 (6(1)(e))` | 公共當局 |

---

## 同意管理 (Consent Management)

### 必須

- 將同意儲存為 **不可變事件記錄 (immutable event log)**，而非可變更的布林旗標。
- 記錄：同意內容、時間、隱私權政策版本、機制。
- **有條件地** 載入分析 / 行銷 SDK — 僅在獲得同意後才載入。
- 提供與給予同意一樣簡單的撤銷同意機制。

### 同意儲存區結構描述 (最低要求)

```sql
CREATE TABLE ConsentRecords (
    Id          UUID PRIMARY KEY,
    UserId      UUID NOT NULL,
    Purpose     VARCHAR(100) NOT NULL,   -- 例如 "marketing_emails", "analytics"
    Granted     BOOLEAN NOT NULL,
    PolicyVersion VARCHAR(20) NOT NULL,
    ConsentedAt TIMESTAMPTZ NOT NULL,
    IpAddressHash VARCHAR(64),           -- 已匿名化 IP 的 HMAC-SHA256
    UserAgent   VARCHAR(500)
);
```

### 必須不

- **必須不** 預先勾選同意核取方塊。
- **必須不** 將行銷同意與服務提供同意綑綁在一起。
- **必須不** 將服務存取設定為行銷同意的條件。
- **必須不** 使用暗黑模式 (例如「全部接受」很明顯，「拒絕」卻隱藏起來)。

---

## 子處理器管理 (Sub-processor Management)

維護一份 **子處理器清單**，並在每個觸及個人資料的新 SaaS 工具或雲端服務加入時更新。

每個子處理器的最低要求欄位：

| 欄位 | 範例 |
|---|---|
| 名稱 | Brevo |
| 服務 | 交易式電子郵件 |
| 傳輸的資料類別 | 電子郵件地址、姓名、電子郵件內容 |
| 處理位置 | 歐盟 (巴黎) |
| 已簽署 DPA | 2024-01-10 |
| DPA URL / 參考 | [連結] |
| 適用 SCCs | 不適用 (歐盟境內) |

**必須** 每年以及在任何變更發生時審查子處理器清單。
**必須不** 在簽署 DPA 之前允許資料流向新的子處理器。

---

## DPIA 觸發條件 (第 35 條)

在極有可能導致高風險的處理作業前，**必須** 進行 DPIA。觸發條件包括：

- 對個人具有重大影響的系統性與廣泛剖析
- 特殊類別資料 (健康、生物辨識、種族、性傾向、宗教) 的大規模處理
- 對公開存取區域進行系統性監控 (CCTV、位置追蹤)
- 大規模處理兒童資料
- 隱私影響不明的創新技術
- 匹配或組合來自多個來源的資料集

如有疑慮：請務必進行 DPIA。並記錄結果。
