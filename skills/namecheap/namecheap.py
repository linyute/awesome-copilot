#!/usr/bin/env python3
"""Namecheap API DNS 管理的 CLI 包裝器。

僅使用 Python 標準函式庫（無第三方依賴）。認證資訊
從 ``~/.namecheap-api``（或環境變數）讀取，且絕不會在
命令列中傳遞，因此不會透過 ``ps``/shell 歷史記錄洩漏。
"""

import argparse
import getpass
import json
import os
import re
import stat
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

API_URL = "https://api.namecheap.com/xml.response"
CONFIG_FILE = os.path.join(os.path.expanduser("~"), ".namecheap-api")

# 已知多部分（二級）公用後置。盡力而為的清單，非完整的
# 公用後置資料庫。對於未列出的後置，網域將在最後一個點
# 分割，這對於單標籤 TLD (.com, .io, .dev, ...) 是正確的。
MULTI_PART_SUFFIXES = {
    "co.uk", "org.uk", "me.uk", "ac.uk", "gov.uk", "net.uk", "ltd.uk", "plc.uk",
    "com.au", "net.au", "org.au", "id.au",
    "co.nz", "net.nz", "org.nz",
    "co.za", "org.za",
    "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
    "co.kr", "or.kr", "ne.kr",
    "com.br", "net.br", "org.br",
    "com.cn", "net.cn", "org.cn",
    "co.in", "net.in", "org.in",
    "com.mx", "org.mx",
    "com.sg", "edu.sg",
    "com.tr",
    "co.il", "org.il",
}

# 在程序生命週期內快取的公用 IP。
_public_ip = None


# --- 輸出輔助函式 -------------------------------------------------------

_USE_COLOR = sys.stdout.isatty()


def _c(code, text):
    return f"\033[{code}m{text}\033[0m" if _USE_COLOR else text


def err(msg):
    print(_c("0;31", "錯誤:") + " " + msg, file=sys.stderr)


def success(msg):
    print(_c("0;32", "\u2713") + " " + msg)


def info(msg):
    print(_c("0;36", "\u2139") + " " + msg)


def warn(msg):
    print(_c("1;33", "\u26a0") + " " + msg)


class NamecheapError(Exception):
    """當 API 回傳 Status="ERROR" 回應時引發。"""


# --- 配置 --------------------------------------------------------

def load_config():
    """回傳 (api_user, api_key)，優先使用環境變數，其次是配置檔案。"""
    api_user = os.environ.get("NAMECHEAP_API_USER")
    api_key = os.environ.get("NAMECHEAP_API_KEY")
    if api_user and api_key:
        return api_user, api_key

    if os.path.isfile(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as fh:
            content = fh.read()
        # 檔案使用 shell 風格的 KEY="value" 行以保持向後相容性。
        pattern = re.compile(r'^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$', re.MULTILINE)
        values = {m.group(1): m.group(2) for m in pattern.finditer(content)}
        api_user = api_user or values.get("NAMECHEAP_API_USER")
        api_key = api_key or values.get("NAMECHEAP_API_KEY")

    return api_user, api_key


def check_credentials():
    api_user, api_key = load_config()
    if not api_user or not api_key:
        err("未配置 Namecheap API 認證資訊。")
        print()
        print("執行 'python3 namecheap.py setup' 來配置您的認證資訊。")
        print()
        print("您需要：")
        print("  1. 您的 Namecheap 使用者名稱")
        print("  2. 來自此處的 API 金鑰：https://ap.www.namecheap.com/settings/tools/apiaccess/")
        print("  3. 在 API 設定中將您的公用 IP 加入白名單")
        sys.exit(1)
    return api_user, api_key


def save_config(api_user, api_key):
    with open(CONFIG_FILE, "w", encoding="utf-8") as fh:
        fh.write(f'NAMECHEAP_API_USER="{api_user}"\n')
        fh.write(f'NAMECHEAP_API_KEY="{api_key}"\n')
    os.chmod(CONFIG_FILE, stat.S_IRUSR | stat.S_IWUSR)  # 600


# --- 網路 -----------------------------------------------------------

def _http_get(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": "namecheap-skill/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 (僅限 https)
        return resp.read().decode("utf-8", errors="replace")


def get_public_ip():
    """解析一次公用 IP 並為後續呼叫快取它。"""
    global _public_ip
    if _public_ip:
        return _public_ip
    for url in ("https://api.ipify.org", "https://ifconfig.me"):
        try:
            ip = _http_get(url, timeout=10).strip()
            if ip:
                _public_ip = ip
                return ip
        except Exception:
            continue
    _public_ip = "unknown"
    return _public_ip


def _strip_namespaces(root):
    for elem in root.iter():
        if isinstance(elem.tag, str) and "}" in elem.tag:
            elem.tag = elem.tag.split("}", 1)[1]
    return root


def _check_error(root):
    if (root.attrib.get("Status") or "").upper() == "ERROR":
        messages = []
        for e in root.iter("Err"):
            code = e.attrib.get("Number") or e.attrib.get("Code") or ""
            text = (e.text or "").strip()
            messages.append(f"[{code}] {text}" if code else text)
        raise NamecheapError("; ".join(m for m in messages if m) or "未知的 API 錯誤")


def api_request(command, params=None):
    """發送 Namecheap API GET 請求並回傳解析後的（已移除命名空間的）根節點。

    API 金鑰在此程序內被編碼到請求 URL 中；它絕不會作為
    命令列參數傳遞，因此不會透過 ``ps`` 或 shell
    歷史記錄洩漏。值由 ``urllib`` 進行 URL 編碼。
    """
    api_user, api_key = check_credentials()
    query = {
        "ApiUser": api_user,
        "ApiKey": api_key,
        "UserName": api_user,
        "Command": f"namecheap.{command}",
        "ClientIp": get_public_ip(),
    }
    for key, value in (params or {}).items():
        if value is not None and value != "":
            query[key] = value

    url = f"{API_URL}?{urllib.parse.urlencode(query)}"
    body = _http_get(url, timeout=30)
    root = _strip_namespaces(ET.fromstring(body))
    _check_error(root)
    return root


def _attr(root, tag, name, default=""):
    for elem in root.iter(tag):
        return elem.attrib.get(name, default)
    return default


# --- 網域解析 -------------------------------------------------------

def parse_domain(domain):
    """將已註冊的網域拆分為 (SLD, TLD)，處理多部分 TLD。"""
    domain = domain.strip().rstrip(".").lower()
    labels = domain.split(".")
    if len(labels) >= 3 and ".".join(labels[-2:]) in MULTI_PART_SUFFIXES:
        tld = ".".join(labels[-2:])
        sld = ".".join(labels[:-2])
    elif len(labels) >= 2:
        tld = labels[-1]
        sld = ".".join(labels[:-1])
    else:
        tld = ""
        sld = domain
    return sld, tld


# --- 命令 -------------------------------------------------------------

def cmd_public_ip(_args):
    print(get_public_ip())


def cmd_setup(_args):
    print("=== Namecheap API 設定 ===\n")
    public_ip = get_public_ip()
    info("您的公用 IP 位址是：" + _c("0;36", public_ip))
    print()
    print("請確保此 IP 已在以下網址加入白名單：")
    print("  https://ap.www.namecheap.com/settings/tools/apiaccess/")
    print()

    existing_user, existing_key = load_config()
    if existing_user and existing_key:
        info(f"發現使用者 {existing_user} 的現有配置")
        print("\n正在測試 API 連線...")
        try:
            api_request("domains.getList", {"PageSize": "1"})
            success("API 連線成功！")
        except Exception as exc:  # noqa: BLE001
            err(f"API 連線失敗：{exc}")
        print()
        answer = input("更新儲存的認證資訊？ [y/N]: ").strip().lower()
        if answer not in ("y", "yes"):
            info("保留現有認證資訊。")
            return
        print()

    print("輸入您的 Namecheap 認證資訊：\n")
    api_user = input("  API 使用者名稱: ").strip()
    api_key = getpass.getpass("  API 金鑰 (隱藏): ").strip()
    print()

    if not api_user or not api_key:
        err("使用者名稱和 API 金鑰皆為必填。")
        sys.exit(1)

    save_config(api_user, api_key)
    success(f"認證資訊已儲存至 {CONFIG_FILE}")
    print("\n正在測試 API 連線...")
    try:
        # 直接使用剛輸入的認證資訊進行驗證呼叫。
        os.environ["NAMECHEAP_API_USER"] = api_user
        os.environ["NAMECHEAP_API_KEY"] = api_key
        api_request("domains.getList", {"PageSize": "1"})
        success("API 連線成功！")
    except Exception as exc:  # noqa: BLE001
        warn("API 連線失敗。請檢查：")
        print("  1. API 存取已在 Namecheap 設定頁面啟用 (ON)")
        print(f"  2. IP 位址 {public_ip} 已加入白名單")
        print("  3. 您的 API 金鑰正確")
        print(f"  (詳細資訊: {exc})")


def cmd_domains_list(args):
    params = {"ListType": args.type, "Page": str(args.page), "PageSize": str(args.page_size)}
    if args.search:
        params["SearchTerm"] = args.search
    info("正在獲取網域清單...")
    root = api_request("domains.getList", params)

    print()
    print(f"{'網域':<30} {'過期日':<12} {'已鎖定':<12} {'自動續約':<10}")
    print(f"{'------':<30} {'-------':<12} {'------':<12} {'----------':<10}")
    for d in root.iter("Domain"):
        print("{:<30} {:<12} {:<12} {:<10}".format(
            d.attrib.get("Name", ""),
            d.attrib.get("Expires", ""),
            d.attrib.get("IsLocked", ""),
            d.attrib.get("AutoRenew", ""),
        ))
    print()


def _print_hosts(root):
    print()
    print(f"{'主機':<20} {'類型':<8} {'位址':<40} {'TTL':<8} {'MX 優先權':<6}")
    print(f"{'----':<20} {'----':<8} {'-------':<40} {'---':<8} {'------':<6}")
    for h in root.iter("host"):
        print("{:<20} {:<8} {:<40} {:<8} {:<6}".format(
            h.attrib.get("Name", ""),
            h.attrib.get("Type", ""),
            h.attrib.get("Address", ""),
            h.attrib.get("TTL", "1800"),
            h.attrib.get("MXPref", "-"),
        ))
    print()


def cmd_dns_get_hosts(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在獲取 {args.domain} 的 DNS 記錄 (SLD={sld}, TLD={tld})...")
    root = api_request("domains.dns.getHosts", {"SLD": sld, "TLD": tld})
    _print_hosts(root)


def _existing_hosts(root):
    """將現有的主機記錄回傳為字典清單。"""
    records = []
    for h in root.iter("host"):
        records.append({
            "name": h.attrib.get("Name", ""),
            "type": h.attrib.get("Type", ""),
            "address": h.attrib.get("Address", ""),
            "ttl": h.attrib.get("TTL", "1800"),
            "mxpref": h.attrib.get("MXPref", ""),
        })
    return records


def _hosts_to_params(sld, tld, records):
    params = {"SLD": sld, "TLD": tld}
    i = 1
    for r in records:
        if not (r["name"] and r["type"] and r["address"]):
            continue
        params[f"HostName{i}"] = r["name"]
        params[f"RecordType{i}"] = r["type"]
        params[f"Address{i}"] = r["address"]
        params[f"TTL{i}"] = r.get("ttl") or "1800"
        mxpref = r.get("mxpref")
        if mxpref not in (None, ""):
            # MX 優先權 0 是有效的，因此對於 MX 記錄始終發送 MXPref；
            # 對於其他記錄類型，僅轉發非零值。
            if r["type"].upper() == "MX" or mxpref != "0":
                params[f"MXPref{i}"] = mxpref
        i += 1
    return params, i - 1


def cmd_dns_set_hosts(args):
    if not os.path.isfile(args.hosts):
        err(f"找不到主機檔案：{args.hosts}")
        sys.exit(1)
    with open(args.hosts, "r", encoding="utf-8") as fh:
        raw = json.load(fh)

    records = []
    for r in raw:
        records.append({
            "name": r.get("HostName", ""),
            "type": r.get("RecordType", ""),
            "address": r.get("Address", ""),
            "ttl": str(r.get("TTL", "") or ""),
            "mxpref": str(r.get("MXPref", "") or ""),
        })

    sld, tld = parse_domain(args.domain)
    params, count = _hosts_to_params(sld, tld, records)
    if count == 0:
        err(f"在 {args.hosts} 中找不到有效的主機記錄")
        sys.exit(1)

    info(f"正在為 {args.domain} 設定 {count} 條 DNS 記錄...")
    root = api_request("domains.dns.setHosts", params)
    if _attr(root, "DomainDNSSetHostsResult", "IsSuccess").lower() == "true":
        success(f"{args.domain} 的 DNS 記錄已成功更新！")
    else:
        err("更新 DNS 記錄失敗。")
        sys.exit(1)


def cmd_dns_add_host(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在獲取 {args.domain} 的現有 DNS 記錄...")
    root = api_request("domains.dns.getHosts", {"SLD": sld, "TLD": tld})
    records = _existing_hosts(root)
    records.append({
        "name": args.name,
        "type": args.type.upper(),
        "address": args.address,
        "ttl": args.ttl,
        "mxpref": args.mxpref or "",
    })
    params, _ = _hosts_to_params(sld, tld, records)

    info(f"正在新增 {args.type.upper()} 記錄：{args.name} -> {args.address}")
    result = api_request("domains.dns.setHosts", params)
    if _attr(result, "DomainDNSSetHostsResult", "IsSuccess").lower() == "true":
        success(f"已新增 DNS 記錄：{args.name} {args.type} {args.address}")
    else:
        err("新增 DNS 記錄失敗。")
        sys.exit(1)


def cmd_dns_remove_host(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在獲取 {args.domain} 的現有 DNS 記錄...")
    root = api_request("domains.dns.getHosts", {"SLD": sld, "TLD": tld})

    kept = []
    removed = False
    for r in _existing_hosts(root):
        if (not removed and r["name"] == args.name
                and r["type"].upper() == args.type.upper()
                and (not args.address or r["address"] == args.address)):
            removed = True
            info(f"正在移除記錄：{r['name']} {r['type']} {r['address']}")
            continue
        kept.append(r)

    if not removed:
        err("找不到相符的記錄可移除。")
        sys.exit(1)

    params, count = _hosts_to_params(sld, tld, kept)
    if count == 0:
        err("無法移除最後一條 DNS 記錄。Namecheap 要求至少有一條記錄。")
        sys.exit(1)

    info(f"正在更新 {args.domain} 的 DNS 記錄...")
    result = api_request("domains.dns.setHosts", params)
    if _attr(result, "DomainDNSSetHostsResult", "IsSuccess").lower() == "true":
        success("DNS 記錄已成功移除！")
    else:
        err("移除 DNS 記錄失敗。")
        sys.exit(1)


def cmd_dns_get_list(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在獲取 {args.domain} 的名稱伺服器...")
    root = api_request("domains.dns.getList", {"SLD": sld, "TLD": tld})

    using = _attr(root, "DomainDNSGetListResult", "IsUsingOurDNS", "unknown")
    print()
    info(f"正在使用 Namecheap DNS: {using}")
    print("\n名稱伺服器:")
    for ns in root.iter("Nameserver"):
        if ns.text:
            print(f"  - {ns.text.strip()}")
    print()


def cmd_dns_set_default(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在將 {args.domain} 設定為使用 Namecheap 預設 DNS...")
    root = api_request("domains.dns.setDefault", {"SLD": sld, "TLD": tld})
    if _attr(root, "DomainDNSSetDefaultResult", "Updated").lower() == "true":
        success(f"網域 {args.domain} 現在使用 Namecheap 預設 DNS！")
    else:
        err("設定預設 DNS 失敗。")
        sys.exit(1)


def cmd_dns_set_custom(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在將 {args.domain} 設定為使用自訂名稱伺服器：{args.nameservers}")
    root = api_request(
        "domains.dns.setCustom",
        {"SLD": sld, "TLD": tld, "Nameservers": args.nameservers},
    )
    if _attr(root, "DomainDNSSetCustomResult", "Updated").lower() == "true":
        success(f"網域 {args.domain} 現在使用自訂名稱伺服器！")
    else:
        err("設定自訂名稱伺服器失敗。")
        sys.exit(1)


def cmd_dns_get_email_forwarding(args):
    info(f"正在獲取 {args.domain} 的電子郵件轉發...")
    root = api_request("domains.dns.getEmailForwarding", {"DomainName": args.domain})

    print()
    print(f"{'信箱':<20} {'轉發至':<40}")
    print(f"{'-------':<20} {'-----------':<40}")
    for fwd in root.iter("Forward"):
        mailbox = (fwd.attrib.get("mailbox") or fwd.attrib.get("MailBox")
                   or fwd.attrib.get("Mailbox") or "")
        forward_to = (fwd.attrib.get("ForwardTo") or fwd.attrib.get("forwardto")
                      or (fwd.text or "").strip())
        print(f"{mailbox + '@' + args.domain:<20} {forward_to:<40}")
    print()


def cmd_dns_set_email_forwarding(args):
    params = {"DomainName": args.domain}

    if args.mailbox and args.forward_to:
        params["MailBox1"] = args.mailbox
        params["ForwardTo1"] = args.forward_to
    elif args.forwards:
        if not os.path.isfile(args.forwards):
            err(f"找不到轉發檔案：{args.forwards}")
            sys.exit(1)
        with open(args.forwards, "r", encoding="utf-8") as fh:
            rules = json.load(fh)
        i = 1
        for rule in rules:
            mailbox = rule.get("MailBox") or rule.get("mailbox") or ""
            forward_to = rule.get("ForwardTo") or rule.get("forwardto") or ""
            if mailbox and forward_to:
                params[f"MailBox{i}"] = mailbox
                params[f"ForwardTo{i}"] = forward_to
                i += 1
    else:
        err("請提供 --mailbox/--forward-to 或 --forwards <file.json>")
        sys.exit(1)

    info(f"正在為 {args.domain} 設定電子郵件轉發...")
    root = api_request("domains.dns.setEmailForwarding", params)
    if _attr(root, "DomainDNSSetEmailForwardingResult", "IsSuccess").lower() == "true":
        success(f"{args.domain} 的電子郵件轉發已更新！")
    else:
        err("設定電子郵件轉發失敗。")
        sys.exit(1)


def cmd_ns_create(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在建立名稱伺服器 {args.nameserver} -> {args.ip}...")
    root = api_request(
        "domains.ns.create",
        {"SLD": sld, "TLD": tld, "Nameserver": args.nameserver, "IP": args.ip},
    )
    if _attr(root, "DomainNSCreateResult", "IsSuccess").lower() == "true":
        success(f"名稱伺服器 {args.nameserver} 已建立！")
    else:
        err("建立名稱伺服器失敗。")
        sys.exit(1)


def cmd_ns_delete(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在刪除名稱伺服器 {args.nameserver}...")
    root = api_request(
        "domains.ns.delete",
        {"SLD": sld, "TLD": tld, "Nameserver": args.nameserver},
    )
    if _attr(root, "DomainNSDeleteResult", "IsSuccess").lower() == "true":
        success(f"名稱伺服器 {args.nameserver} 已刪除！")
    else:
        err("刪除名稱伺服器失敗。")
        sys.exit(1)


def cmd_ns_get_info(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在獲取名稱伺服器 {args.nameserver} 的資訊...")
    root = api_request(
        "domains.ns.getInfo",
        {"SLD": sld, "TLD": tld, "Nameserver": args.nameserver},
    )
    ns_ip = _attr(root, "DomainNSInfoResult", "IP", "unknown")
    print()
    print(f"名稱伺服器: {args.nameserver}")
    print(f"IP 位址:    {ns_ip}")
    statuses = [s.text.strip() for s in root.iter("Status") if s.text and s.text.strip()]
    if statuses:
        print(f"狀態:       {', '.join(statuses)}")
    print()


def cmd_ns_update(args):
    sld, tld = parse_domain(args.domain)
    info(f"正在更新名稱伺服器 {args.nameserver}: {args.old_ip} -> {args.ip}...")
    root = api_request(
        "domains.ns.update",
        {"SLD": sld, "TLD": tld, "Nameserver": args.nameserver,
         "OldIP": args.old_ip, "IP": args.ip},
    )
    if _attr(root, "DomainNSUpdateResult", "IsSuccess").lower() == "true":
        success(f"名稱伺服器 {args.nameserver} 已更新至 {args.ip}！")
    else:
        err("更新名稱伺服器失敗。")
        sys.exit(1)


# --- 參數解析 -----------------------------------------------------

def build_parser():
    parser = argparse.ArgumentParser(
        prog="namecheap.py",
        description="Namecheap DNS 管理 CLI",
    )
    sub = parser.add_subparsers(dest="command", metavar="<命令>")

    sub.add_parser("setup", help="配置 API 認證資訊並測試連線").set_defaults(func=cmd_setup)
    sub.add_parser("public-ip", help="顯示您的公用 IP 位址").set_defaults(func=cmd_public_ip)

    p = sub.add_parser("domains.getList", help="列出您的 Namecheap 網域")
    p.add_argument("--type", default="ALL")
    p.add_argument("--search", default="")
    p.add_argument("--page", type=int, default=1)
    p.add_argument("--page-size", type=int, default=20)
    p.set_defaults(func=cmd_domains_list)

    p = sub.add_parser("domains.dns.getList", help="獲取網域的名稱伺服器")
    p.add_argument("--domain", required=True)
    p.set_defaults(func=cmd_dns_get_list)

    p = sub.add_parser("domains.dns.getHosts", help="獲取網域的 DNS 記錄")
    p.add_argument("--domain", required=True)
    p.set_defaults(func=cmd_dns_get_hosts)

    p = sub.add_parser("domains.dns.setHosts", help="設定所有 DNS 記錄 (從 JSON 檔案)")
    p.add_argument("--domain", required=True)
    p.add_argument("--hosts", required=True)
    p.set_defaults(func=cmd_dns_set_hosts)

    p = sub.add_parser("domains.dns.setDefault", help="使用 Namecheap 預設 DNS")
    p.add_argument("--domain", required=True)
    p.set_defaults(func=cmd_dns_set_default)

    p = sub.add_parser("domains.dns.setCustom", help="使用自訂名稱伺服器")
    p.add_argument("--domain", required=True)
    p.add_argument("--nameservers", required=True)
    p.set_defaults(func=cmd_dns_set_custom)

    p = sub.add_parser("domains.dns.getEmailForwarding", help="獲取電子郵件轉發規則")
    p.add_argument("--domain", required=True)
    p.set_defaults(func=cmd_dns_get_email_forwarding)

    p = sub.add_parser("domains.dns.setEmailForwarding", help="設定電子郵件轉發規則")
    p.add_argument("--domain", required=True)
    p.add_argument("--mailbox", default="")
    p.add_argument("--forward-to", default="")
    p.add_argument("--forwards", default="")
    p.set_defaults(func=cmd_dns_set_email_forwarding)

    p = sub.add_parser("domains.ns.create", help="建立子名稱伺服器 (Glue Record)")
    p.add_argument("--domain", required=True)
    p.add_argument("--nameserver", required=True)
    p.add_argument("--ip", required=True)
    p.set_defaults(func=cmd_ns_create)

    p = sub.add_parser("domains.ns.delete", help="刪除子名稱伺服器")
    p.add_argument("--domain", required=True)
    p.add_argument("--nameserver", required=True)
    p.set_defaults(func=cmd_ns_delete)

    p = sub.add_parser("domains.ns.getInfo", help="獲取名稱伺服器資訊")
    p.add_argument("--domain", required=True)
    p.add_argument("--nameserver", required=True)
    p.set_defaults(func=cmd_ns_get_info)

    p = sub.add_parser("domains.ns.update", help="更新名稱伺服器 IP")
    p.add_argument("--domain", required=True)
    p.add_argument("--nameserver", required=True)
    p.add_argument("--old-ip", required=True)
    p.add_argument("--ip", required=True)
    p.set_defaults(func=cmd_ns_update)

    p = sub.add_parser("dns.addHost", help="新增單條 DNS 記錄 (保留現有記錄)")
    p.add_argument("--domain", required=True)
    p.add_argument("--type", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--address", required=True)
    p.add_argument("--ttl", default="1800")
    p.add_argument("--mxpref", default="")
    p.set_defaults(func=cmd_dns_add_host)

    p = sub.add_parser("dns.removeHost", help="移除單條 DNS 記錄")
    p.add_argument("--domain", required=True)
    p.add_argument("--type", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--address", default="")
    p.set_defaults(func=cmd_dns_remove_host)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "command", None):
        parser.print_help()
        return 1
    try:
        args.func(args)
    except NamecheapError as exc:
        err(f"API 回傳錯誤：{exc}")
        return 1
    except urllib.error.URLError as exc:
        err(f"網路錯誤：{exc}")
        return 1
    except (OSError, ET.ParseError, json.JSONDecodeError) as exc:
        err(str(exc))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
