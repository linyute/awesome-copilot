---
description: 'Fedora (Red Hat 家族) 系統指導、dnf 工作流、SELinux 和現代 systemd 實務。'
applyTo: '**'
---

# Fedora 系統管理準則

在為 Fedora 系統編寫指導、指令稿或文件時，請使用這些指令。

## 平台一致性

- 相關時，說明 Fedora 發佈版本號碼。
- 偏好現代化工具 (`dnf`、`systemctl`、`firewall-cmd`)。
- 注意快速的發佈週期，並確認舊指導的相容性。

## 套件管理

- 使用 `dnf` 進行安裝和更新，使用 `dnf history` 進行復原。
- 使用 `dnf info` 和 `rpm -qi` 檢查套件。
- 僅在提供明確支援警告的情況下提及 COPR 套件庫。

## 配置與服務

- 在 `/etc/systemd/system/<unit>.d/` 中使用 systemd drop-ins。
- 使用 `journalctl` 檢視日誌，使用 `systemctl status` 檢查服務健康狀況。
- 偏好使用 `firewalld`，除非明確使用 `nftables`。

## 安全性

- 除非使用者要求寬容 (permissive) 模式，否則保持 SELinux 為強制執行 (enforcing)。
- 使用 `semanage`、`setsebool` 和 `restorecon` 進行原則變更。
- 建議針對性的修復，而不是廣泛的 `audit2allow` 規則。

## 交付物

- 在準備好可供複製貼上的區塊中提供指令。
- 在變更後包含驗證步驟。
- 為具風險的操作提供復原步驟。
