---
name: security-review
description: 'AI 驅動的程式碼庫安全性掃描器，能像安全性研究人員一樣對程式碼進行推理 — 追蹤資料流、理解元件互動，並捕捉模式匹配工具遺漏的弱點。當被要求掃描程式碼中的安全性弱點、尋找錯誤、檢查 SQL 隱碼攻擊、XSS、指令隱碼攻擊、公開的 API 金鑰、寫死的秘密、不安全的相依性、存取控制問題，或任何如「我的程式碼安全嗎？」、「審查安全性問題」、「稽核此程式碼庫」或「檢查弱點」的請求時，請使用此技能。涵蓋 JavaScript、TypeScript、Python、Java、PHP、Go、Ruby 和 Rust 的隱碼攻擊缺陷、身份驗證和存取控制錯誤、秘密公開、弱密碼學、不安全的相依性以及商業邏輯問題。'
---

# 安全性審查 (Security Review)

這是一個 AI 驅動的安全性掃描器，能像人類安全性研究人員一樣對您的程式碼庫進行推理 — 
追蹤資料流、理解元件互動，並捕捉模式匹配工具
遺漏的弱點。

## 何時使用此技能 (When to Use This Skill)

當請求涉及以下內容時，請使用此技能：

- 掃描程式碼庫或檔案以尋找安全性弱點
- 執行安全性審查或弱點檢查
- 檢查 SQL 隱碼攻擊、XSS、指令隱碼攻擊或其他隱碼攻擊缺陷
- 在程式碼中尋找公開的 API 金鑰、寫死的秘密或認證資訊
- 稽核相依性以尋找已知的 CVE
- 審查身份驗證、授權或存取控制邏輯
- 偵測不安全的密碼學或弱隨機性
- 執行資料流分析以將使用者輸入追蹤到危險的接收端 (sinks)
- 任何如「我的程式碼安全嗎？」、「掃描此檔案」或「檢查我的儲存庫是否有弱點」的請求語句
- 執行 `/security-review` 或 `/security-review <路徑>`

## 此技能如何運作 (How This Skill Works)

與匹配模式的傳統靜態分析工具不同，此技能：
1. **像安全性研究人員一樣閱讀程式碼** — 理解情境、意圖和資料流
2. **跨檔案追蹤** — 遵循使用者輸入如何在您的應用程式中移動
3. **自我驗證發現** — 重新檢查每項結果以過濾誤判 (False positives)
4. **指定嚴重性評等** — 嚴重 (CRITICAL) / 高 (HIGH) / 中 (MEDIUM) / 低 (LOW) / 資訊 (INFO)
5. **提議針對性的修補程式** — 每項發現都包含具體的修復方案
6. **需要人工核准** — 不會自動套用任何內容；您始終先進行審查

## 執行工作流程 (Execution Workflow)

每次請**依序**遵循以下步驟：

### 步驟 1 — 範圍解析 (Scope Resolution)
確定要掃描的內容：
- 如果提供了路徑 (`/security-review src/auth/`)，僅掃描該範圍
- 如果未提供路徑，則從根目錄開始掃描**整個專案**
- 識別正在使用的語言和框架 (檢查 package.json、requirements.txt、
  go.mod、Cargo.toml、pom.xml、Gemfile、composer.json 等)
- 閱讀 `references/language-patterns.md` 以載入語言特定的弱點模式

### 步驟 2 — 相依性稽核 (Dependency Audit)
在掃描原始碼之前，先稽核相依性 (快速獲勝)：
- **Node.js**：檢查 `package.json` + `package-lock.json` 以尋找已知有弱點的套件
- **Python**：檢查 `requirements.txt` / `pyproject.toml` / `Pipfile`
- **Java**：檢查 `pom.xml` / `build.gradle`
- **Ruby**：檢查 `Gemfile.lock`
- **Rust**：檢查 `Cargo.toml`
- **Go**：檢查 `go.sum`
- 標記具有已知 CVE、已棄置的密碼學函式庫或版本過於陳舊的固定版本套件
- 閱讀 `references/vulnerable-packages.md` 以獲取精選的觀察清單

### 步驟 3 — 秘密與公開掃描 (Secrets & Exposure Scan)
掃描所有檔案 (包括設定、env、CI/CD、Dockerfile、IaC) 以尋找：
- 寫死的 API 金鑰、權杖、密碼、私密金鑰
- 意外提交的 `.env` 檔案
- 註解或除錯日誌中的秘密
- 雲端認證資訊 (AWS、GCP、Azure、Stripe、Twilio 等)
- 嵌入了認證資訊的資料庫連線字串
- 閱讀 `references/secret-patterns.md` 以獲取要套用的規則運算式模式和熵啟發式

### 步驟 4 — 弱點深度掃描 (Vulnerability Deep Scan)
這是核心掃描。對程式碼進行推理 — 不要只是匹配模式。
閱讀 `references/vuln-categories.md` 以獲取每個類別的完整詳細資訊。

**隱碼攻擊缺陷 (Injection Flaws)**
- SQL 隱碼攻擊：具有字串插補的原生查詢、ORM 誤用、二次 SQL 隱碼攻擊
- XSS：未逸出的輸出、dangerouslySetInnerHTML、innerHTML、範本隱碼攻擊
- 指令隱碼攻擊：帶有使用者輸入的 exec/spawn/system
- LDAP、XPath、標頭、日誌隱碼攻擊

**身份驗證與存取控制 (Authentication & Access Control)**
- 敏感端點遺漏身份驗證
- 物件等級授權失效 (BOLA/IDOR)
- JWT 弱點 (alg:none、弱金鑰、無過期驗證)
- 會話固定 (Session fixation)、遺漏 CSRF 保護
- 權限提升路徑
- 批次賦值 (Mass assignment) / 參數污染 (parameter pollution)

**資料處理 (Data Handling)**
- 敏感資料在日誌、錯誤訊息或 API 回應中
- 遺漏靜態或傳輸中加密
- 不安全的反序列化
- 路徑走訪 / 目錄走訪
- XXE (XML 外部實體) 處理
- SSRF (伺服器端請求偽造)

**密碼學 (Cryptography)**
- 出於安全性目的使用 MD5、SHA1、DES
- 寫死的 IV 或鹽值 (salts)
- 弱隨機數產生 (將 Math.random() 用於權杖)
- 遺漏 TLS 憑證驗證

**商業邏輯 (Business Logic)**
- 競爭條件 (Race conditions / TOCTOU)
- 金融計算中的整數溢位
- 敏感端點遺漏速率限制
- 可預測的資源識別碼

### 步驟 5 — 跨檔案資料流分析 (Cross-File Data Flow Analysis)
After the per-file scan, perform a **holistic review**:
- Trace user-controlled input from entry points (HTTP params, headers, body, file uploads)
  all the way to sinks (DB queries, exec calls, HTML output, file writes)
- Identify vulnerabilities that only appear when looking at multiple files together
- Check for insecure trust boundaries between services or modules

### 步驟 6 — 自我驗證程序 (Self-Verification Pass)
針對每一項發現：
1. 以全新的視角重新閱讀相關程式碼
2. 詢問：「這真的可以被利用嗎？或者我漏掉了什麼清理程序？」
3. 檢查框架或中介軟體是否已在上游處理了此問題
4. 降級或捨棄非真實弱點的發現
5. 指定最終嚴重性：嚴重 (CRITICAL) / 高 (HIGH) / 中 (MEDIUM) / 低 (LOW) / 資訊 (INFO)

### 步驟 7 — 產生安全性報告 (Generate Security Report)
依照 `references/report-format.md` 中定義的格式輸出完整報告。

### 步驟 8 — 提議修補程式 (Propose Patches)
針對每一項嚴重 (CRITICAL) 和高 (HIGH) 發現，產生具體的修補程式：
- 顯示有弱點的程式碼 (之前)
- 顯示已修復的程式碼 (之後)
- 解釋變更了什麼以及為什麼
- 保留原始程式碼風格、變數名稱和結構
- 在行內新增註解解釋修復方式

明確聲明：**「在套用之前請審查每個修補程式。目前尚未進行任何變更。」**

## 嚴重性指南 (Severity Guide)

| Severity | Meaning | Example |
|----------|---------|---------|
| 🔴 CRITICAL | Immediate exploitation risk, data breach likely | SQLi, RCE, auth bypass |
| 🟠 HIGH | Serious vulnerability, exploit path exists | XSS, IDOR, hardcoded secrets |
| 🟡 MEDIUM | Exploitable with conditions or chaining | CSRF, open redirect, weak crypto |
| 🔵 LOW | Best practice violation, low direct risk | Verbose errors, missing headers |
| ⚪ INFO | Observation worth noting, not a vulnerability | Outdated dependency (no CVE) |

## 輸出規則 (Output Rules)

- **一律**先產生髮現摘要表 (依嚴重性計數)
- **絕不**自動套用任何修補程式 — 僅提供修補程式供人工審查
- **一律**為每項發現包含信心評等 (高 / 中 / 低)
- **依類別分組**發現，而非依檔案分組
- **保持具體** — 包含檔案路徑、行號和確切的有弱點程式碼片段
- **解釋風險** — 攻擊者可以利用此弱點做什麼？請使用淺顯易懂的語言
- 如果程式碼庫乾淨，請明確說明：「未發現弱點」，並說明已掃描的內容

## 參考檔案 (Reference Files)

如需詳細的偵測指南，請根據需要載入以下參考檔案：

- `references/vuln-categories.md` — Deep reference for every vulnerability category with detection signals, safe patterns, and escalation checkers
  - 搜尋模式：`SQL injection`、`XSS`、`command injection`、`SSRF`、`BOLA`、`IDOR`、`JWT`、`CSRF`、`secrets`、`cryptography`、`race condition`、`path traversal`
- `references/secret-patterns.md` — Regex patterns, entropy-based detection, and CI/CD secret risks
  - 搜尋模式：`API key`、`token`、`private key`、`connection string`、`entropy`、`.env`、`GitHub Actions`、`Docker`、`Terraform`
- `references/language-patterns.md` — Framework-specific vulnerability patterns for JavaScript, Python, Java, PHP, Go, Ruby, and Rust
  - 搜尋模式：`Express`、`React`、`Next.js`、`Django`、`Flask`、`FastAPI`、`Spring Boot`、`PHP`、`Go`、`Rails`、`Rust`
- `references/vulnerable-packages.md` — Curated CVE watchlist for npm, pip, Maven, Rubygems, Cargo, and Go modules
  - 搜尋模式：`lodash`、`axios`、`jsonwebtoken`、`Pillow`、`log4j`、`nokogiri`、`CVE`
- `references/report-format.md` — Structured output template for security reports with finding cards, dependency audit, secrets scan, and patch proposal formatting
  - 搜尋模式：`report`、`format`、`template`、`finding`、`patch`、`summary`、`confidence`
