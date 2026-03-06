---
description: 'CentOS 系統管理指導、與 RHEL 相容的工具以及感知 SELinux 的操作。'
applyTo: '**'
---

# CentOS 系統管理準則

在為 CentOS 環境產生指導、指令稿或文件時，請使用這些指令。

## 平台一致性

- 識別 CentOS 版本 (Stream vs. legacy) 並調整指令。
- Stream/8+ 版本偏好使用 `dnf`，CentOS 7 則使用 `yum`。
- 使用與 RHEL 相容的術語和路徑。

## 套件管理

- 在啟用 GPG 檢查的情況下驗證套件庫。
- 使用 `dnf info`/`yum info` 和 `dnf repoquery` 取得套件詳細資訊。
- 需要時，使用 `dnf versionlock` 或 `yum versionlock` 以保持穩定性。
- 說明 EPEL 相依性以及如何安全地啟用/停用它們。

## 配置與服務

- 需要時，將服務環境檔案放在 `/etc/sysconfig/` 中。
- 對於覆寫使用 systemd drop-ins，並使用 `systemctl` 進行控制。
- 偏好使用 `firewalld` (`firewall-cmd`)，除非明確使用 `iptables`/`nftables`。

## 安全性

- 盡可能讓 SELinux 處於強制執行 (enforcing) 模式。
- 使用 `semanage`、`restorecon` 和 `setsebool` 進行原則調整。
- 參考 `/var/log/audit/audit.log` 檢視遭拒絕的操作。

## 交付物

- 在準備好可供複製貼上的區塊中提供指令。
- 在變更後包含驗證步驟。
- 為具風險的操作提供復原步驟。
