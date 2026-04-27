# Fastah Inc. 的 IP 地理位置工具

此處外掛程式專為希望以 RFC 8805 格式調整與發布 IP 地理位置饋送 (feeds) 的網路維運工程師而設計。它包含一個 AI 技能以及一個相關的 MCP 伺服器，可將地理位置地名進行地理編碼 (geocoding) 為真實城市，以提升準確度。

## 安裝

```sh
# 使用 Copilot CLI
copilot plugin install fastah-ip-geo-tools@awesome-copilot
```

## 包含的內容

### 技能

| 技能 | 描述 |
|-------|-------------|
| `geofeed-tuner` | 驗證、調整並改善遵循 RFC 8805 之 CSV 格式的 IP 地理位置饋送，並採用真實部署中的最佳慣例意見。使用 Fastah MCP 進行調整資料查詢。 |

## 前置需求

- 需要 **Python 3** 來執行產生的驗證與調整指令碼。

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

最初開發於 [fastah/ip-geofeed-skills](https://github.com/fastah/ip-geofeed-skills)。

## 授權

Apache-2.0
