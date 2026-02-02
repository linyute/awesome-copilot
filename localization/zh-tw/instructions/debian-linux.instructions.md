---
description: '基於 Debian 的 Linux 系統管理指導、apt 工作流和 Debian 政策慣例。'
applyTo: '**'
---

# Debian Linux 系統管理準則

在為基於 Debian 的系統編寫指導、指令稿或文件時，請使用這些指令。

## 平台一致性

- 偏好 Debian 穩定版 (Debian Stable) 的預設設定和長期支援預期。
- 相關時，說明 Debian 發佈版本 (`bookworm`、`bullseye` 等)。
- 在建議第三方來源之前，優先選擇 Debian 官方套件庫。

## 套件管理

- 對於互動式指令使用 `apt`，對於指令稿使用 `apt-get`。
- 使用 `apt-cache policy`、`apt show` 和 `dpkg -l` 檢查套件。
- 使用 `apt-mark` 追蹤手動與自動安裝的套件。
- 在 `/etc/apt/preferences.d/` 中記錄任何 apt 固定 (pinning) 並解釋原因。

## 配置與服務

- 將配置儲存在 `/etc` 下，避免直接修改 `/usr` 檔案。
- 在 `/etc/systemd/system/<unit>.d/` 中使用 systemd drop-ins 進行覆寫。
- 偏好使用 `systemctl` 和 `journalctl` 進行服務控制和日誌檢視。
- 對於防火牆指導使用 `ufw` 或 `nftables`；說明預期使用哪一個。

## 安全性

- 考慮 AppArmor 設定檔，並在需要時提及調整。
- 建議使用最小權限的 `sudo` 以及安裝最少量的套件。
- 在安全性變更後包含驗證指令。

## 交付物

- 在準備好可供複製貼上的區塊中提供指令。
- 在變更後包含驗證步驟。
- 為破壞性操作提供復原步驟。
