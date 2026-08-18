# IP Geolocation Tools by Fastah Inc.

此外掛模組適用於希望以 RFC 8805 格式微調與發佈 IP 地理位置摘要的網路維運工程師。它由一個 AI 技能和一個相關聯的 MCP 伺服器組成，該伺服器將地理位置地名進行地理編碼以對應至真實城市以確保準確性。

## 安裝

```sh
# Using Copilot CLI
copilot plugin install fastah-ip-geo-tools@awesome-copilot
```

## 包含內容

### 技能

| 技能 | 說明 |
|-------|-------------|
| `geofeed-tuner` | 遵循 RFC 8805 並採用來自實際部署的主觀最佳做法，驗證、微調並改進 CSV 格式的 IP 地理位置摘要。使用 Fastah MCP 進行微調資料查閱。 |

## 先決條件

- 執行產生的驗證與微調指令碼需要 **Python 3**。

## 來源

此外掛模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群導向的 GitHub Copilot 擴充功能集合。

最初開發於 [fastah/ip-geofeed-skills](https://github.com/fastah/ip-geofeed-skills)。

## 授權條款

Apache-2.0
