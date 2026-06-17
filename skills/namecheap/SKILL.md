---
name: namecheap
description: '透過 Namecheap API 管理在其註冊的域名 DNS 記錄。列出域名、查看/添加/更新/刪除 DNS 主機分錄（A, AAAA, CNAME, MX, TXT 等），並引導使用者完成 API 設定，包括公共 IP 偵測和憑據配置。當使用者提到 Namecheap、DNS 記錄、域名管理，或想要為其域名添加/更改/刪除 A 記錄、CNAME 記錄、MX 記錄或 TXT 記錄時使用。'
---

# Namecheap DNS 管理 (Namecheap DNS Management)

**公用技能 (UTILITY SKILL)** — 透過 Namecheap API 管理 DNS 記錄。
適用於：「添加 DNS 記錄」、「更新 A 記錄」、「管理 Namecheap 域名」、「設定 CNAME」、「添加 MX 記錄」、「添加 TXT 記錄」、「列出我的域名」、「顯示 DNS 記錄」、「namecheap 設定」、「配置 Namecheap API」、「我的公共 IP 是什麼」
不適用於：域名註冊/購買、SSL 證書管理、代管配置、非 Namecheap DNS 提供商

## 工作流程

### 首次設定

在執行任何 API 命令之前，請驗證憑據已配置：

1. **檢查現有配置** — 尋找 `~/.namecheap-api`
2. 如果未配置，請引導使用者完成設定：
   a. **顯示公共 IP** — 執行 `python3 namecheap.py public-ip` 以顯示使用者的公共 IP
   b. **指示 IP 白名單** — 告訴使用者前往 https://ap.www.namecheap.com/settings/tools/apiaccess/，啟用 API（選擇 ON），並將顯示的 IP 加入白名單
   c. **讓使用者自行運行設定** — 要求使用者直接 **在他們自己的終端機中** 執行 `python3 namecheap.py setup`。該腳本會提示輸入使用者名稱，並透過隱藏提示 (`getpass`) 讀取 API 金鑰，使用 `chmod 600` 寫入 `~/.namecheap-api`，並驗證連線。**絕不要要求使用者在聊天中貼上他們的 API 金鑰，也絕不要記錄、回顯或顯示 API 金鑰數值。** 如果您無法為使用者執行交互式終端，請指示他們自行執行 `setup`，或者在他們自己的 Shell 中將 `NAMECHEAP_API_USER` 和 `NAMECHEAP_API_KEY` 導出為環境變數 — 而不是透過 `ask_user` 收集秘密。
   d. **確認** — 一旦使用者報告設定成功，即可繼續進行 DNS 操作。

### DNS 操作

對所有 API 互動使用 `namecheap.py` 腳本（隨附於此技能目錄中）。它僅需要 Python 3（僅限標準庫 — 無需 `pip install`），並且在 macOS, Linux 和 Windows 上的運作方式相同：

```bash
# 顯示公共 IP（用於設定）
python3 namecheap.py public-ip

# 運行設定流程
python3 namecheap.py setup

# 列出域名
python3 namecheap.py domains.getList

# 獲取域名的名稱伺服器（顯示使用的是 Namecheap DNS 還是自定義）
python3 namecheap.py domains.dns.getList --domain example.com

# 獲取域名的 DNS 記錄
python3 namecheap.py domains.dns.getHosts --domain example.com

# 添加單條記錄（保留現有記錄）
python3 namecheap.py dns.addHost --domain example.com --type A --name www --address 1.2.3.4 --ttl 1800

# 刪除單條記錄
python3 namecheap.py dns.removeHost --domain example.com --type A --name www --address 1.2.3.4

# 從 JSON 檔案替換所有記錄
python3 namecheap.py domains.dns.setHosts --domain example.com --hosts records.json

# 切換到 Namecheap 預設 DNS
python3 namecheap.py domains.dns.setDefault --domain example.com

# 切換到自定義名稱伺服器
python3 namecheap.py domains.dns.setCustom --domain example.com --nameservers ns1.cloudflare.com,ns2.cloudflare.com

# 獲取電子郵件轉寄規則
python3 namecheap.py domains.dns.getEmailForwarding --domain example.com

# 設定電子郵件轉寄（單條規則）
python3 namecheap.py domains.dns.setEmailForwarding --domain example.com --mailbox info --forward-to user@gmail.com

# 設定電子郵件轉寄（從 JSON 檔案）
python3 namecheap.py domains.dns.setEmailForwarding --domain example.com --forwards forwards.json

# 建立子名稱伺服器 (Glue Record)
python3 namecheap.py domains.ns.create --domain example.com --nameserver ns1.example.com --ip 1.2.3.4

# 刪除子名稱伺服器
python3 namecheap.py domains.ns.delete --domain example.com --nameserver ns1.example.com

# 獲取名稱伺服器資訊
python3 namecheap.py domains.ns.getInfo --domain example.com --nameserver ns1.example.com

# 更新名稱伺服器 IP
python3 namecheap.py domains.ns.update --domain example.com --nameserver ns1.example.com --old-ip 1.2.3.4 --ip 5.6.7.8
```

### JSON 檔案格式

`domains.dns.setHosts --hosts records.json` 預期一個包含帶有 Namecheap API 欄位名稱之物件的數組：

```json
[
  { "HostName": "@", "RecordType": "A", "Address": "1.2.3.4", "TTL": 1800 },
  { "HostName": "www", "RecordType": "CNAME", "Address": "@", "TTL": 1800 },
  { "HostName": "@", "RecordType": "MX", "Address": "mail.example.com.", "TTL": 1800, "MXPref": 10 }
]
```

`domains.dns.setEmailForwarding --forwards forwards.json` 預期一個信箱規則數組：

```json
[
  { "MailBox": "info", "ForwardTo": "team@example.net" },
  { "MailBox": "sales", "ForwardTo": "owner@example.net" }
]
```

## 行為

- **始終先檢查憑據。** 在進行任何 API 操作之前，請驗證 `~/.namecheap-api` 是否存在且可讀。如果不存在，請運行設定流程。
- **修改前顯示目前記錄。** 在添加或刪除記錄之前，始終先獲取並顯示目前的 DNS 記錄，以便使用者確認更改。
- **使用 `ask_user` 確認破壞性更改。** 在刪除記錄或使用 `setHosts` 替換所有記錄之前，請與使用者確認。
- **Namecheap `setHosts` API 會替換「所有」記錄。** 絕不要直接調用 `domains.dns.setHosts`，除非您已先獲取了所有現有記錄。對於安全的單條記錄操作，請使用 `dns.addHost` 和 `dns.removeHost` — 它們在內部處理獲取-修改-寫入循環。
- **用通俗語言解釋 TTL。** 當使用者詢問關於 TTL 的問題時，請解釋 1800 = 30 分鐘，3600 = 1 小時等。
- **處理多段 TLD。** 像 `example.co.uk` 這樣的域名具有 SLD=example 和 TLD=co.uk。腳本可以識別一個內建的常用二級後綴列表（例如 `co.uk`, `com.au`, `co.jp`, `com.br`）。此列表是盡力而為的，並非完整的公共後綴數據庫 — 如果具有未列出多段後綴的域名返回 `2019166`（「找不到域名」）錯誤，則 SLD/TLD 拆分可能出錯。在這種情況下，請與使用者確認註冊的域名並報告限制。

## 憑據存儲

憑據存儲在 `~/.namecheap-api` 中：

```bash
NAMECHEAP_API_USER="username"
NAMECHEAP_API_KEY="api-key-here"
```

此檔案必須具有 `600` 權限（僅擁有者可讀寫）。或者，腳本會從 `NAMECHEAP_API_USER` 和 `NAMECHEAP_API_KEY` 環境變數中讀取憑據，當兩者都設定時，環境變數的優先級高於檔案。

## 支援的記錄類型

A, AAAA, CNAME, MX, MXE, TXT, URL, URL301, FRAME

## 參考資料

有關完整的 API 文件（包括請求/回應格式），請參閱 `references/namecheap-api.md`。
