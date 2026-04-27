# 秘密與認證資訊偵測模式 (Secret & Credential Detection Patterns)

在步驟 3 (秘密與公開掃描) 期間載入此檔案。

---

## 高信心程度秘密模式 (High-Confidence Secret Patterns)

這些模式幾乎總是代表一個真實的秘密：

### API 金鑰與權杖 (API Keys & Tokens)
```regex
# OpenAI
sk-[a-zA-Z0-9]{48}

# Anthropic
sk-ant-[a-zA-Z0-9\-_]{90,}

# AWS Access Key
AKIA[0-9A-Z]{16}

# AWS Secret Key (尋找接近 AWS_ACCESS_KEY_ID 賦值的位置)
[0-9a-zA-Z/+]{40}

# GitHub Token
gh[pousr]_[a-zA-Z0-9]{36,}
github_pat_[a-zA-Z0-9]{82}

# Stripe
sk_live_[a-zA-Z0-9]{24,}
rk_live_[a-zA-Z0-9]{24,}

# Twilio Account SID
AC[a-z0-9]{32}
# Twilio API Key
SK[a-z0-9]{32}

# SendGrid
SG\.[a-zA-Z0-9\-_.]{66}

# Slack
xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+
xoxp-[0-9]+-[0-9]+-[0-9]+-[a-zA-Z0-9]+
xapp-[0-9]+-[A-Z0-9]+-[0-9]+-[a-zA-Z0-9]+

# Google API Key
AIza[0-9A-Za-z\-_]{35}

# Google OAuth
[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com

# Cloudflare (接近 CF_API_TOKEN)
[a-zA-Z0-9_\-]{37}

# Mailgun
key-[a-zA-Z0-9]{32}

# Heroku
[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}
```

### 私密金鑰 (Private Keys)
```regex
-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----
-----BEGIN CERTIFICATE-----
```

### 資料庫連線字串 (Database Connection Strings)
```regex
# MongoDB
mongodb(\+srv)?:\/\/[^:]+:[^@]+@

# PostgreSQL / MySQL
(postgres|postgresql|mysql):\/\/[^:]+:[^@]+@

# 帶有密碼的 Redis
redis:\/\/:[^@]+@

# 帶有密碼的一般連線字串
(connection[_-]?string|connstr|db[_-]?url).*password=
```

### 寫死的密碼 (變數名稱訊號)
```regex
# 暗示秘密的變數名稱
(password|passwd|pwd|secret|api_key|apikey|auth_token|access_token|private_key)
  \s*[=:]\s*["'][^"']{8,}["']
```

---

## 基於熵的偵測 (Entropy-Based Detection)

套用於賦值內容中長度 > 20 個字元的字串常值。
高熵 (Shannon 熵 > 4.5 bits/char) + 長度 > 20 = 可能是秘密。

```
計算熵：針對每個字元頻率 p 計算 -sum(p * log2(p))
閾值：> 4.5 bits/char 且 > 20 個字元 且賦值給一個變數
```

要排除的常見誤判 (False positives)：
- Lorem ipsum 文字
- HTML/CSS 內容
- Base64 編碼的非敏感設定 (但應標記並註記)
- UUID/GUID (熵很高但格式可辨識)

---

## 絕對不應該被提交的檔案 (Files That Should Never Be Committed)

如果這些檔案存在於專案根目錄或被 git 追蹤，請進行標記：
```
.env
.env.local
.env.production
.env.staging
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ed25519
credentials.json
service-account.json
gcp-key.json
secrets.yaml
secrets.json
config/secrets.yml
```

同時檢查 `.gitignore` — 如果某個秘密檔案模式不在 .gitignore 中，請標記它。

---

## CI/CD 與 IaC 秘密風險 (CI/CD & IaC Secret Risks)

### GitHub Actions — 標記這些模式：
```yaml
# env: 區塊中的寫死值 (應使用 ${{ secrets.NAME }})
env:
  API_KEY: "actual-value-here"   // 有弱點 (VULNERABLE)

# 列印秘密
- run: echo ${{ secrets.MY_SECRET }}   // 會洩漏到日誌中
```

### Docker — 標記這些：
```dockerfile
# ENV 中的秘密 (會保存在映像層中)
ENV AWS_SECRET_KEY=actual-value

# 作為建構參數 (build args) 傳遞的秘密 (在映像歷史紀錄中可見)
ARG API_KEY=actual-value
```

### Terraform — 標記這些：
```hcl
# 寫死的敏感值 (應使用變數或資料來源)
password = "hardcoded-password"
access_key = "AKIAIOSFODNN7EXAMPLE"
```

---

## 安全模式 (請勿標記) (Safe Patterns (Do NOT flag))

這些是刻意的佔位符 — 識別並跳過：
```
"your-api-key-here"
"<YOUR_API_KEY>"
"${API_KEY}"
"${process.env.API_KEY}"
"os.environ.get('API_KEY')"
"REPLACE_WITH_YOUR_KEY"
"xxx...xxx"
"sk-..." (在文件/註解中)
```
