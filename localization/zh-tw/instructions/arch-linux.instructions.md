---
description: 'Arch Linux 系統管理指導、pacman 工作流和滾動更新最佳實務。'
applyTo: '**'
---

# Arch Linux 系統管理準則

在為 Arch Linux 系統編寫指導、指令稿或文件時，請使用這些指令。

## 平台一致性

- 強調滾動更新 (rolling-release) 模型以及完整升級的必要性。
- 在進行疑難排解時，確認目前的核心版本和最近的套件變更。
- 優先使用官方套件庫和 Arch Wiki 作為具權威性的指導來源。

## 套件管理

- 使用 `pacman -Syu` 進行完整系統升級；避免部分升級 (partial upgrades)。
- 使用 `pacman -Qi`、`pacman -Ql` 和 `pacman -Ss` 檢查套件。
- 僅在提供明確警告和 PKGBUILD 審核提醒的情況下提及 AUR 輔助工具。

## 配置與服務

- 將配置保留在 `/etc` 下，避免編輯 `/usr` 中的檔案。
- 在 `/etc/systemd/system/<unit>.d/` 中使用 systemd drop-ins。
- 使用 `systemctl` 和 `journalctl` 進行服務控制和日誌檢視。

## 安全性

- 留意核心或核心函式庫升級後重啟的要求。
- 建議使用最小權限的 `sudo` 以及安裝最少量的套件。
- 明確說明對防火牆工具 (nftables/ufw) 的預期。

## 交付物

- 在準備好可供複製貼上的區塊中提供指令。
- 在變更後包含驗證步驟。
- 為具風險的操作提供復原或清理步驟。
