# Signals Dashboard 外掛程式

即時 Workshop 儀表板，具備代理人訊號、誠實度校準、成本感知
工作台設定檔（`repo` / `connected`），以及預設關閉 (fail-closed) 的本地委派。

## 安裝

```bash
copilot plugin install signals-dashboard@awesome-copilot
```

## 功能特點

- 即時工作台訊號、分數長條圖、模式與呈報機制
- 成本感知 **開啟** (repo) 與 **連線** 工作台啟動設定檔
- **本地委派** 切換開關：可用時，前沿工作台可使用已安裝的 `local-agent-delegation` 技能進行具邊界的讀取/佐證資料工作
- 預設關閉的可用性（技能 + 合格路由收據）；無靜默節省額度

## 來源

標準實作：[jennyf19/the-workshop](https://github.com/jennyf19/the-workshop)。  
本地工作者執行時期：[jennyf19/sealed-delegation](https://github.com/jennyf19/sealed-delegation)。

此外掛程式屬於 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 授權條款

MIT
