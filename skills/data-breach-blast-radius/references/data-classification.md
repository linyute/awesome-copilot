# 資料分類分類法

一套用於識別程式碼庫中敏感資料的全面分類法。每個與這些模式相符的欄位、資料行、模型屬性或變數都應列入清單，並分配適當的敏感度層級。

---

## 第 1 級 — 災難性 (若暴露會造成不可逆的損害)

### 生物辨識資料
**偵測模式 (欄位名稱 / 資料行名稱)：**
- `fingerprint`, `thumbprint`, `retina_scan`, `iris_scan`, `face_id`, `facial_recognition`
- `voice_print`, `voice_biometric`, `gait_analysis`, `dna_profile`, `genetic_data`
- `biometric_template`, `biometric_hash`, `faceEmbedding`, `face_vector`

**偵測模式 (資料值 / 格式)：**
- 生物辨識命名的欄位中 > 512 位元組的 Base64 編碼 blob
- 名為 `biometric_*`, `face_*`, `fingerprint_*` 資料表中的二進位資料行 (Binary columns)

### 政府核發的識別碼
**偵測模式：**
- `ssn`, `social_security_number`, `social_security`, `sin` (加拿大), `nino` (英國), `tfn` (澳洲)
- `passport_number`, `passport_no`, `passport_id`
- `drivers_license`, `drivers_licence`, `dl_number`, `license_number`
- `national_id`, `national_identification`, `id_number`, `id_card_number`
- `tax_id`, `tin`, `ein`, `itin`, `vat_number`, `fiscal_code`
- `aadhaar`, `pan_number` (印度), `cpf`, `cnpj` (巴西), `rut` (智利/哥倫比亞)
- `nric`, `fin` (新加坡), `my_kad` (馬來西亞), `nik` (印尼)

**值的正規運算式 (Regex) 模式：**
```
SSN:          \b\d{3}-\d{2}-\d{4}\b
英國 NINO:    \b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b
CPF (巴西):   \b\d{3}\.\d{3}\.\d{3}-\d{2}\b
Aadhaar:      \b\d{4}\s\d{4}\s\d{4}\b
```

### 健康與醫療資料 (HIPAA 規範下的 PHI)
**偵測模式：**
- `diagnosis`, `icd_code`, `icd10`, `icd11`, `snomed`, `loinc_code`
- `medication`, `prescription`, `drug_name`, `dosage`, `treatment`
- `medical_record_number`, `mrn`, `patient_id`, `encounter_id`
- `lab_result`, `test_result`, `pathology`, `radiology`
- `mental_health`, `psychiatric`, `therapy_notes`, `counseling`
- `hiv_status`, `std_status`, `substance_abuse`, `addiction`
- `insurance_id`, `insurance_member_id`, `health_plan_id`, `claim_number`
- `fhir_resource`, `hl7_message`, `dicom_data`
- `disability`, `handicap`, `chronic_condition`
- `pregnancy`, `reproductive_health`, `fertility`

### 驗證憑證
**偵測模式：**
- `password`, `passwd`, `pwd`, `hashed_password`, `password_hash`, `password_digest`
- `private_key`, `secret_key`, `api_key`, `api_secret`, `api_token`
- `access_token`, `refresh_token`, `bearer_token`, `id_token`, `jwt_token`
- `oauth_token`, `oauth_secret`, `oauth_access_token`
- `mfa_secret`, `totp_secret`, `otp_secret`, `backup_codes`
- `session_token`, `session_id`, `auth_token`
- `client_secret`, `client_credential`
- `private_key_pem`, `rsa_private`, `ecdsa_private`

---

## 第 2 級 — 關鍵 (高度監管風險)

### 付款卡資料 (PCI-DSS)
**偵測模式：**
- `card_number`, `pan`, `primary_account_number`, `credit_card`, `debit_card`
- `cvv`, `cvc`, `cvv2`, `card_verification`, `security_code`
- `card_expiry`, `expiration_date`, `exp_date`, `expiry_month`, `expiry_year`
- `cardholder_name`, `card_holder`
- `iban`, `bic`, `swift_code`, `routing_number`, `account_number`, `sort_code`
- `bank_account`, `bank_details`, `wire_transfer`

**值的正規運算式模式：**
```
Visa:            \b4[0-9]{12}(?:[0-9]{3})?\b
Mastercard:      \b5[1-5][0-9]{14}\b
Amex:            \b3[47][0-9]{13}\b
一般 PAN:        \b[0-9]{13,19}\b (在名為 PAN 的欄位中)
CVV:             \b[0-9]{3,4}\b (在名為 cvv 的欄位中)
IBAN:            \b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b
```

### 身份組合 (組合後具有高度重新識別風險)
**共同構成第 2 級的組合：**
- 全名 + 出生日期
- 全名 + 地址 (街道層級)
- 電子郵件 + 出生日期 + 性別
- 電話號碼 + 地址

**偵測模式：**
- `full_name`, `first_name` + `last_name` (作為獨立欄位 — 請注意兩者皆存在)
- `date_of_birth`, `dob`, `birth_date`, `birthdate`, `birthday`
- `home_address`, `street_address`, `address_line1`, `postal_address`
- `gender`, `sex`, `pronoun` (當與其他識別碼結合時)

---

## 第 3 級 — 高 (觸發法規通知)

### 聯絡資訊
**偵測模式：**
- `email`, `email_address`, `user_email`, `contact_email`, `primary_email`
- `phone`, `phone_number`, `mobile`, `mobile_number`, `cell_phone`, `telephone`
- `whatsapp_number`, `signal_number`

**正規運算式模式：**
```
電子郵件： \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b
電話：     \+?[0-9\s\-\(\)]{7,20}  (在名為 phone 的欄位中)
```

### 精確位置資料
**偵測模式：**
- `latitude`, `longitude`, `lat`, `lng`, `lat_lng`, `coordinates`, `geo_point`
- `gps_location`, `precise_location`, `real_time_location`
- `home_location`, `work_location`

**註：** 城市層級的位置為第 4 級；街道層級或 GPS 座標為第 3 級。

### 網路識別碼
**偵測模式：**
- `ip_address`, `ip`, `client_ip`, `remote_addr`, `x_forwarded_for`
- `mac_address`, `device_mac`, `hardware_id`
- `imei`, `imsi`, `device_id`, `advertising_id`, `idfa`, `gaid`

### 驗證成品
**偵測模式：**
- `session_id`, `cookie_value`, `csrf_token` (如果是長期有效且可識別使用者的)
- `remember_me_token`, `persistent_session`

---

## 第 4 級 — 提升 (與隱私相關)

### 部分個人識別碼
**偵測模式：**
- `first_name`, `last_name`, `display_name`, `username` (當單獨出現時)
- `profile_picture`, `avatar_url`
- `city`, `state`, `country`, `region`, `zip_code`, `postal_code`
- `time_zone`, `locale`, `language_preference`

### 行為與分析資料
**偵測模式：**
- `user_agent`, `browser`, `device_type`, `os`
- `search_query`, `search_history`, `browsing_history`
- `purchase_history`, `order_history`, `transaction_history`
- `click_event`, `page_view`, `session_duration`
- `preferences`, `interests`, `tags`, `segments`

### 財務背景 (非卡片)
**偵測模式：**
- `salary`, `income`, `net_worth`, `credit_score`, `credit_rating`
- `account_balance`, `wallet_balance`, `subscription_tier`

---

## 第 5 級 — 標準 (無直接隱私影響)

- 系統設定值 (非秘密)
- 公開的使用者內容 (部落格文章、公開個人檔案)
- 匿名化的彙總統計資料
- 非個人參考資料 (產品目錄、國家代碼)
- 無外部暴露的內部系統識別碼

---

## AI 分析的偵測指引

### 框架特定模式

**Django / Python：**
```python
# 敏感欄位通常出現在 models.py
class User(models.Model):
    email = models.EmailField()           # 第 3 級
    date_of_birth = models.DateField()    # 第 2 級 (與名稱結合時)
    ssn = models.CharField(max_length=11) # 第 1 級
```

**TypeScript / Prisma：**
```prisma
model User {
  email       String    // 第 3 級
  phoneNumber String?   // 第 3 級
  dateOfBirth DateTime? // 第 2 級 (組合時)
  cardNumber  String?   // 第 2 級 PCI-DSS
}
```

**Java / Spring / JPA：**
```java
@Entity
public class Patient {
    @Column(name = "diagnosis")  // 第 1 級 PHI
    private String diagnosis;
    
    @Column(name = "ssn")        // 第 1 級
    private String ssn;
}
```

**C# / EF Core：**
```csharp
public class UserProfile {
    public string Email { get; set; }        // 第 3 級
    public string PassportNumber { get; set; } // 第 1 級
    public DateTime DateOfBirth { get; set; }  // 第 2 級
}
```

### 記錄陳述式模式 (高風險 — 經常被忽視)
```python
# 錯誤 — 記錄了 PII
logger.info(f"User {user.email} logged in from {request.remote_addr}")
logger.debug(f"Payment for card {card_number}")

# 在記錄呼叫中尋找以下內容：
# .info(), .debug(), .warn(), .error(), console.log(), System.out.println()
```

### API 回應外洩 (序列化程式/DTO 模式)
```typescript
// 檢查回應物件中是否包含這些欄位
// 即使沒有被請求 — 過度擷取是一個常見的暴露向量
{
  "id": "...",
  "email": "...",          // 第 3 級
  "phone": "...",          // 第 3 級 
  "dateOfBirth": "...",    // 第 2 級 — 是否應回傳？
  "passwordHash": "...",   // 第 1 級 — 絕不應回傳
  "ssn": "...",            // 第 1 級 — 絕不應回傳
}
```

---

## 彙總風險評估

組合攻擊 — 結合後變得更敏感的資料：

| 單獨存在 | 結合項 | 組合後的層級 | 風險 |
|-------|--------------|---------------|------|
| 電子郵件 (T3) | 密碼雜湊 (T1) | 第 1 級 | 帳號盜用 |
| 名稱 (T4) | 出生日期 (T2) + 地址 (T2) | 第 2 級 | 完整的身份重建 |
| IP 地址 (T3) | 時間戳記 + 使用者 ID | 第 2 級 | 行為特徵分析 |
| 城市 (T4) | 購買歷史 (T4) | 第 3 級 | 去匿名化風險 |
| 健康類別 (T4) | 名稱 + 電子郵件 | 第 1 級 | 觸發 HIPAA 規範 |

**規則：** 始終評估欄位的組合，而不僅僅是孤立的評估。
