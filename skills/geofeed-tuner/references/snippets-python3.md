# Python 3 程式碼範例

- 使用 Python 3 的內建 [`ipaddress` 套件](https://docs.python.org/3/library/ipaddress.html)，並在可用的建構函式中傳遞 `strict=True`。
- 在 IPv4 與 IPv6 位址解析上務必謹慎 — 對於專業網路工程師而言，兩者並不相同。請使用最強大的型別/類別。
- 請記住，子網段 (subnet) 可以包含單一主機：IPv6 請使用 `/128`，IPv4 請使用 `/32`。

## IP 位址與子網段解析

- 使用 [`ipaddress` 中的便利處理函式 (convenience factory functions)](https://docs.python.org/3/library/ipaddress.html#convenience-factory-functions)。

    以下 `ipaddress.ip_address(textAddress)` 範例將文字解析為 `IPv4Address` 和 `IPv6Address` 物件：

    ```python
    ipaddress.ip_address('192.168.0.1')
    ipaddress.ip_address('2001:db8::')
    ```

    以下 `ipaddress.ip_network(address, strict=True)` 範例解析子網段字串並回傳 `IPv4Network` 或 `IPv6Network` 物件，若輸入無效則失敗：

    ```python
    ipaddress.ip_network('192.168.0.0/28', strict=True)
    ```

    以下嚴格模式呼叫會正確地因 `ValueError: 192.168.0.1/30 has host bits set` 而失敗。請要求使用者修正此類錯誤；不要猜測修正：

    ```python
    ipaddress.ip_network('192.168.0.1/30', strict=True)
    ```

- 使用嚴格形式解析器 [`ipaddress.ip_network(address, strict=True)`](https://docs.python.org/3/library/ipaddress.html#ipaddress.ip_network)。

## IP 子網段字典

使用 Python 字典來追蹤子網段及其相關的地理定位屬性。`IPv4Network`, `IPv6Network`, `IPv4Address` 與 `IPv6Address` 皆可雜湊，並可作為字典鍵 (keys)。

## 偵測非公開 IP 範圍

SKILL.md 參考 `is_private` 來偵測非公開範圍。請使用網路的屬性：

```python
import ipaddress

def is_non_public(network):
    """檢查網路是否為非公開 (private, loopback, link-local, multicast, 或 reserved)。
    
    注意：在 Python < 3.11 中，is_private 可能會錯誤地標記某些範圍
    (例如 100.64.0.0/10 CGNAT 空間)。若可用，請使用 is_global 作為主要檢查方式，
    並針對極端情況設定備用檢查。
    """
    addr = network.network_address
    return (
        network.is_private
        or network.is_loopback
        or network.is_link_local
        or network.is_multicast
        or network.is_reserved
        or not network.is_global  # 涵蓋大多數不可路由的空間
    )
```

**Python < 3.11 上 `is_private` 的注意事項：** `100.64.0.0/10` (電信級 NAT) 範圍在舊版 Python 中回傳 `is_private=True` 但 `is_global=False`。由於 CGNAT 空間不可全域路由，針對 RFC 8805 目的將其標記為非公開是正確的。

## ISO 3166-1 國家代碼驗證

從 [assets/iso3166-1.json](../assets/iso3166-1.json) 讀取有效的 ISO 2 位元國家代碼，特別是 `alpha_2` 屬性：

```python
import json

with open('assets/iso3166-1.json') as f:
    data = json.load(f)
    valid_countries = {c['alpha_2'] for c in data['3166-1']}
```

## ISO 3166-2 地區代碼驗證

從 [assets/iso3166-2.json](../assets/iso3166-2.json) 讀取有效的地區代碼，特別是 `code` 屬性。頂層鍵為 `3166-2` (符合 iso3166-1 模式)：

```python
import json

with open('assets/iso3166-2.json') as f:
    data = json.load(f)
    valid_regions = {r['code'] for r in data['3166-2']}
```
