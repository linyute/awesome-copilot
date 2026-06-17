# Namecheap API 參考

## 基礎 URL

```
https://api.namecheap.com/xml.response
```

## 身分驗證

所有請求都需要這些通用參數：

| 參數 | 描述 |
|-----------|-------------|
| `ApiUser` | Namecheap 使用者名稱 |
| `ApiKey` | 來自 https://ap.www.namecheap.com/settings/tools/apiaccess/ 的 API 金鑰 |
| `UserName` | 與 ApiUser 相同 |
| `ClientIp` | 用戶端的白名單公共 IP 地址 |
| `Command` | 以 `namecheap.` 為前綴的 API 命令 |

## 設定要求

1. 登入 Namecheap
2. 前往 https://ap.www.namecheap.com/settings/tools/apiaccess/
3. 啟用 API 存取 (API Access)（切換到 ON）
4. 將用戶端的公共 IP 地址添加到白名單
5. 複製生成的 API 金鑰

## 命令

---

### namecheap.domains.getList

列出帳戶中的所有域名。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `ListType` | 否 | `ALL` (預設), `EXPIRING` 或 `EXPIRED` |
| `SearchTerm` | 否 | 過濾域名的關鍵字 |
| `Page` | 否 | 頁碼 (預設: 1) |
| `PageSize` | 否 | 每頁結果數，10-100 (預設: 20) |
| `SortBy` | 否 | `NAME`, `NAME_DESC`, `EXPIREDATE`, `EXPIREDATE_DESC`, `CREATEDATE`, `CREATEDATE_DESC` |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.getList">
    <DomainGetListResult>
      <Domain ID="123" Name="example.com" User="user" Created="01/01/2020"
        Expires="01/01/2025" IsExpired="false" IsLocked="true" AutoRenew="true"
        WhoisGuard="ENABLED" />
    </DomainGetListResult>
    <Paging><TotalItems>5</TotalItems><CurrentPage>1</CurrentPage><PageSize>20</PageSize></Paging>
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.getList

獲取與域名關聯的 DNS 伺服器列表（顯示其使用的是 Namecheap DNS 還是自定義名稱伺服器）。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名（例如 `example.com` 中的 `example`） |
| `TLD` | 是 | 頂級域名（例如 `example.com` 中的 `com`） |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.getList">
    <DomainDNSGetListResult Domain="example.com" IsUsingOurDNS="true">
      <Nameserver>dns1.registrar-servers.com</Nameserver>
      <Nameserver>dns2.registrar-servers.com</Nameserver>
    </DomainDNSGetListResult>
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.getHosts

獲取域名的 DNS 主機記錄。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名（例如 `example.com` 中的 `example`） |
| `TLD` | 是 | 頂級域名（例如 `example.com` 中的 `com`） |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.getHosts">
    <DomainDNSGetHostsResult Domain="example.com" IsUsingOurDNS="true">
      <host HostId="1" Name="@" Type="A" Address="1.2.3.4" MXPref="0" TTL="1800" />
      <host HostId="2" Name="www" Type="CNAME" Address="example.com." MXPref="0" TTL="1800" />
      <host HostId="3" Name="@" Type="MX" Address="mail.example.com." MXPref="10" TTL="1800" />
      <host HostId="4" Name="@" Type="TXT" Address="v=spf1 include:_spf.google.com ~all" MXPref="0" TTL="1800" />
    </DomainDNSGetHostsResult>
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.setHosts

設定（替換）域名的所有 DNS 主機記錄。

**重要：** 此命令會替換所有現有記錄。務必先獲取現有記錄。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |
| `HostNameN` | 是 | 記錄 N 的主機名（例如 `@`, `www`, `mail`） |
| `RecordTypeN` | 是 | 記錄 N 的記錄類型 (A, AAAA, CNAME, MX, TXT 等) |
| `AddressN` | 是 | 記錄 N 的值（IP 地址或目標主機名） |
| `MXPrefN` | 否 | 記錄 N 的 MX 優先級（MX 記錄必填） |
| `TTLN` | 否 | 記錄 N 的 TTL（以秒為單位，預設: 1800） |

記錄從 1 開始編號：`HostName1`, `RecordType1`, `Address1`, `HostName2`, `RecordType2`, `Address2` 等。

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.setHosts">
    <DomainDNSSetHostsResult Domain="example.com" IsSuccess="true" />
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.setDefault

設定域名使用 Namecheap 的預設 DNS 伺服器。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.setDefault">
    <DomainDNSSetDefaultResult Domain="example.com" Updated="true" />
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.setCustom

設定域名使用自定義名稱伺服器（例如 Cloudflare, Route53）。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |
| `Nameservers` | 是 | 以逗號分隔的名稱伺服器列表（最多 12 個，無空格） |

**示例：** `Nameservers=ns1.cloudflare.com,ns2.cloudflare.com`

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.setCustom">
    <DomainDNSSetCustomResult Domain="example.com" Updated="true" />
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.getEmailForwarding

獲取域名的電子郵件轉寄設定。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `DomainName` | 是 | 完整域名（例如 `example.com`） |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.getEmailForwarding">
    <DomainDNSGetEmailForwardingResult Domain="example.com">
      <Forward mailboxid="1" mailbox="info" ForwardTo="user@gmail.com" />
      <Forward mailboxid="2" mailbox="support" ForwardTo="help@company.com" />
    </DomainDNSGetEmailForwardingResult>
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.dns.setEmailForwarding

設定域名的電子郵件轉寄。替換所有現有的轉寄規則。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `DomainName` | 是 | 完整域名（例如 `example.com`） |
| `MailBoxN` | 是 | 規則 N 的信箱名稱（例如 `info`, `support`） |
| `ForwardToN` | 是 | 規則 N 的目標電子郵件地址 |

規則從 1 開始編號：`MailBox1`, `ForwardTo1`, `MailBox2`, `ForwardTo2` 等。
省略所有 MailBox/ForwardTo 參數將刪除所有轉寄規則。

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.dns.setEmailForwarding">
    <DomainDNSSetEmailForwardingResult Domain="example.com" IsSuccess="true" />
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.ns.create

為域名建立子名稱伺服器 (Glue Record)。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |
| `Nameserver` | 是 | 要建立的名稱伺服器主機名（例如 `ns1.example.com`） |
| `IP` | 是 | 名稱伺服器的 IP 地址 |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.ns.create">
    <DomainNSCreateResult Domain="example.com" Nameserver="ns1.example.com" IP="1.2.3.4" IsSuccess="true" />
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.ns.delete

刪除子名稱伺服器。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |
| `Nameserver` | 是 | 要刪除的名稱伺服器主機名 |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.ns.delete">
    <DomainNSDeleteResult Domain="example.com" Nameserver="ns1.example.com" IsSuccess="true" />
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.ns.getInfo

獲取子名稱伺服器的資訊。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |
| `Nameserver` | 是 | 要查詢的名稱伺服器主機名 |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.ns.getInfo">
    <DomainNSInfoResult Domain="example.com" Nameserver="ns1.example.com" IP="1.2.3.4">
      <NameserverStatuses>
        <Status>OK</Status>
      </NameserverStatuses>
    </DomainNSInfoResult>
  </CommandResponse>
</ApiResponse>
```

---

### namecheap.domains.ns.update

更新子名稱伺服器的 IP 地址。

**附加參數：**

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `SLD` | 是 | 二級域名 |
| `TLD` | 是 | 頂級域名 |
| `Nameserver` | 是 | 要更新的名稱伺服器主機名 |
| `OldIP` | 是 | 名稱伺服器目前的 IP 地址 |
| `IP` | 是 | 名稱伺服器的新 IP 地址 |

**回應 XML：**

```xml
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.ns.update">
    <DomainNSUpdateResult Domain="example.com" Nameserver="ns1.example.com" IsSuccess="true" />
  </CommandResponse>
</ApiResponse>
```

## 錯誤回應

```xml
<ApiResponse Status="ERROR">
  <Errors>
    <Err Code="2019166">Domain not found</Err>
  </Errors>
</ApiResponse>
```

常見錯誤代碼：
- `1011102` — 無效的 API 金鑰
- `1011148` — IP 未列入白名單
- `2019166` — 找不到域名
- `2016166` — 域名未使用 Namecheap DNS

## 記錄類型

| 類型 | 描述 | 地址格式 |
|------|-------------|---------------|
| `A` | IPv4 地址 | `1.2.3.4` |
| `AAAA` | IPv6 地址 | `2001:db8::1` |
| `CNAME` | 規範名稱 (Canonical name) | `target.example.com.` |
| `MX` | 郵件交換 (Mail exchange) | `mail.example.com.` (需要 MXPref) |
| `MXE` | MX 等效 (IP) | `1.2.3.4` |
| `TXT` | 文本記錄 | 任何文本值 |
| `URL` | URL 重新導向（未隱藏） | `http://example.com` |
| `URL301` | 永久重新導向 | `http://example.com` |
| `FRAME` | URL 重新導向（隱藏） | `http://example.com` |

## TTL 值

| 秒數 | 易讀格式 |
|---------|---------------|
| 60 | 1 分鐘 |
| 300 | 5 分鐘 |
| 1800 | 30 分鐘 (預設) |
| 3600 | 1 小時 |
| 14400 | 4 小時 |
| 43200 | 12 小時 |
| 86400 | 1 天 |
