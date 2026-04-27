# 有弱點與高風險套件觀察清單 (Vulnerable & High-Risk Package Watchlist)

在步驟 2 (相依性稽核) 期間載入此檔案。檢查專案鎖定檔案 (lock files) 中的版本。

---

## npm / Node.js

| 套件 (Package) | 有弱點的版本 | 問題 | 安全版本 |
|---------|-------------------|-------|--------------|
| lodash | < 4.17.21 | 原型污染 (Prototype pollution) (CVE-2021-23337) | >= 4.17.21 |
| axios | < 1.6.0 | SSRF、開放式重新導向 (open redirect) | >= 1.6.0 |
| jsonwebtoken | < 9.0.0 | 演算法混淆規避 (Algorithm confusion bypass) | >= 9.0.0 |
| node-jose | < 2.2.0 | 金鑰混淆 (Key confusion) | >= 2.2.0 |
| shelljs | < 0.8.5 | 規則運算式阻斷服務 (ReDoS) | >= 0.8.5 |
| tar | < 6.1.9 | 路徑走訪 (Path traversal) | >= 6.1.9 |
| minimist | < 1.2.6 | 原型污染 | >= 1.2.6 |
| qs | < 6.7.3 | 原型污染 | >= 6.7.3 |
| express | < 4.19.2 | 開放式重新導向 | >= 4.19.2 |
| multer | < 1.4.4 | 阻斷服務 (DoS) | >= 1.4.4-lts.1 |
| xml2js | < 0.5.0 | 原型污染 | >= 0.5.0 |
| fast-xml-parser | < 4.2.4 | ReDoS | >= 4.2.4 |
| semver | < 7.5.2 | ReDoS | >= 7.5.2 |
| tough-cookie | < 4.1.3 | 原型污染 | >= 4.1.3 |
| word-wrap | < 1.2.4 | ReDoS | >= 1.2.4 |
| vm2 | 全部 (ANY) | 沙箱逃逸 (Sandbox escape) (已棄置) | 改用 isolated-vm |
| serialize-javascript | < 3.1.0 | XSS | >= 3.1.0 |
| node-fetch | < 2.6.7 | 開放式重新導向 | >= 2.6.7 或 3.x |

### 標記模式 (不論版本)：
- 相依性中出現 `eval` 或 `vm.runInContext`
- 任何從未知發佈者拉取 `node-gyp` 原生附加元件 (native addons) 的套件
- 每週下載次數 < 1000 次但生產環境程式碼需要的套件 (供應鏈風險)

---

## Python / pip

| 套件 (Package) | 有弱點的版本 | 問題 | 安全版本 |
|---------|-------------------|-------|--------------|
| Pillow | < 10.0.1 | 多項 CVE、緩衝區溢位 (buffer overflow) | >= 10.0.1 |
| cryptography | < 41.0.0 | OpenSSL 弱點 | >= 41.0.0 |
| PyYAML | < 6.0 | 透過 yaml.load() 執行的任意程式碼 | >= 6.0 |
| paramiko | < 3.4.0 | 身份驗證規避 (Authentication bypass) | >= 3.4.0 |
| requests | < 2.31.0 | 代理伺服器驗證資訊洩漏 | >= 2.31.0 |
| urllib3 | < 2.0.7 | 標頭隱碼攻擊 (Header injection) | >= 2.0.7 |
| Django | < 4.2.16 | 各式各樣 (Various) | >= 4.2.16 |
| Flask | < 3.0.3 | 各式各樣 | >= 3.0.3 |
| Jinja2 | < 3.1.4 | HTML 屬性隱碼攻擊 | >= 3.1.4 |
| sqlalchemy | < 2.0.28 | 各式各樣 | >= 2.0.28 |
| aiohttp | < 3.9.4 | SSRF、路徑走訪 | >= 3.9.4 |
| werkzeug | < 3.0.3 | 各式各樣 | >= 3.0.3 |

---

## Java / Maven

| 套件 (Package) | 有弱點的版本 | 問題 |
|---------|-------------------|-------|
| log4j-core | 2.0-2.14.1 | Log4Shell 遠端程式碼執行 (RCE) (CVE-2021-44228) — 嚴重 (CRITICAL) |
| log4j-core | 2.15.0 | 修復不完全 — 仍有弱點 |
| Spring Framework | < 5.3.28, < 6.0.13 | 多項 CVE |
| Spring Boot | < 3.1.4 | 各式各樣 |
| Jackson-databind | < 2.14.0 | 反序列化 (Deserialization) |
| Apache Commons Text | < 1.10.0 | Text4Shell RCE (CVE-2022-42889) |
| Apache Struts | < 6.3.0 | 各式各樣 RCE |
| Netty | < 4.1.94 | HTTP 請求走私 (HTTP request smuggling) |

---

## Ruby / Gems

| Gem | 有弱點的版本 | 問題 |
|-----|-------------------|-------|
| rails | < 7.1.3 | 各式各樣 | 
| nokogiri | < 1.16.2 | XXE、各式各樣 |
| rexml | < 3.2.7 | ReDoS |
| rack | < 3.0.9 | 各式各樣 |
| devise | < 4.9.3 | 各式各樣 |

---

## Rust / Cargo

| Crate | 問題 |
|-------|-------|
| openssl | 請檢查諮詢資料庫以獲取目前版本 |
| hyper | 請檢查諮詢資料庫以獲取目前版本 |

參考資料：https://rustsec.org/advisories/

---

## Go

參考資料：https://pkg.go.dev/vuln/ 以及 https://vuln.go.dev

常見風險模式：
- `golang.org/x/crypto` — 檢查版本是否在目前版本的 6 個月內
- 任何直接使用 `syscall` 套件的相依性 — 請仔細審查

---

## 一般紅旗指標 (General Red Flags) (任何生態系統)

標記任何符合下列條件的相依性：
1. 超過 2 年未更新且具有 > 10 個未解決的安全性問題
2. 維護者已發布安全性諮詢並將其棄置
3. 來自未知發佈者的已知套件分叉 (Typosquatting，域名搶註/拼寫錯誤劫持)
4. 名稱與熱門套件僅差一個字元 (例如 `lodash` 與 `1odash`)
5. 最近移交給新的擁有者 (檢查 git 歷史紀錄 / npm 移交通知)
