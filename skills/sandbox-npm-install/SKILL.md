---
name: sandbox-npm-install
description: '在 Docker 沙盒環境中安裝 npm 套件。每當您需要在透過 virtiofs 掛載工作區的容器內安裝、重新安裝或更新 node_modules 時，請使用此技能。原生二進位檔案 (esbuild, lightningcss, rollup) 在 virtiofs 上會當機，因此必須將套件安裝在本地 ext4 檔案系統上並建立符號連結。'
---

# 沙盒 npm 安裝 (Sandbox npm Install)

## 何時使用此技能

每當發生以下情況時，請使用此技能：
- 您需要在新的沙盒工作階段中首次安裝 npm 套件
- `package.json` 或 `package-lock.json` 已變更，您需要重新安裝
- 您遇到原生二進位檔案當機，錯誤訊息如 `SIGILL`、`SIGSEGV`、`mmap` 或 `unaligned sysNoHugePageOS`
- `node_modules` 目錄遺失或損壞

## 先決條件

- 具有透過 virtiofs 掛載之工作區的 Docker 沙盒環境
- 容器中可使用 Node.js 和 npm
- 目標工作區中包含 `package.json` 檔案

## 背景

Docker 沙盒工作區通常透過 **virtiofs** (主機與 Linux VM 之間的檔案同步) 掛載。原生 Go 和 Rust 二進位檔案 (esbuild, lightningcss, rollup 等) 在 aarch64 的 virtiofs 上執行時，會因為 mmap 對齊失敗而當機。修復方法是安裝在容器的本地 ext4 檔案系統上，並建立符號連結回到工作區。

## 逐步安裝

從工作區根目錄執行隨附的安裝指令稿：

```bash
bash scripts/install.sh
```

### 常見選項

| 選項 | 說明 |
|---|---|
| `--workspace <路徑>` | 包含 package.json 的目錄路徑 (若省略則自動偵測) |
| `--playwright` | 同時安裝用於 E2E 測試的 Playwright Chromium 瀏覽器 |

### 此指令稿的作用

1. 將 `package.json`、`package-lock.json` 和 `.npmrc` (若存在) 複製到本地 ext4 目錄
2. 在本地檔案系統上執行 `npm ci` (若無鎖定檔案則執行 `npm install`)
3. 將 `node_modules` 符號連結回到工作區
4. 驗證已知的原生二進位檔案 (esbuild, rollup, lightningcss, vite) (若存在)
5. 選擇性安裝 Playwright 瀏覽器和系統相依項 (可用時會使用 `sudo`)

如果驗證失敗，請再次執行指令稿 — 在初始設定期間，當機可能是間歇性的。

## 安裝後驗證

指令稿完成後，驗證您的工具鏈是否正常運作。例如：

```bash
npm test             # 執行專案測試
npm run build        # 建構專案
npm run dev          # 啟動開發伺服器
```

## 重要注意事項

- 本地安裝目錄 (例如 `/home/agent/project-deps`) 是**容器本地的**，不會同步回主機
- `node_modules` 符號連結在主機上顯示為損壞的連結 — 這是無害的，因為 `node_modules` 通常會被 gitignore 忽略
- 在主機上執行 `npm ci` 或 `npm install` 會自然地將符號連結替換為真實目錄
- 在任何 `package.json` 或 `package-lock.json` 變更後，請重新執行安裝指令稿
- 請勿直接在掛載的工作區中執行 `npm ci` 或 `npm install` — 原生二進位檔案會當機

## 疑難排解

| 問題 | 解決方案 |
|---|---|
| 執行開發伺服器時出現 `SIGILL` 或 `SIGSEGV` | 重新執行安裝指令稿；確保您沒有直接在工作區中執行 `npm install` |
| 安裝後找不到 `node_modules` | 檢查符號連結是否存在：`ls -la node_modules` |
| 安裝期間出現權限錯誤 | 確保目前使用者對本地依賴項目錄具有寫入權限 |
| 驗證間歇性失敗 | 重新執行指令稿 — 原生二進位檔案當機在首次載入時可能是非確定性的 |

## Vite 相容性

如果您的專案使用 Vite，您可能需要在 `server.fs.allow` 中允許符號連結路徑。將符號連結目標的父目錄 (例如 `/home/agent/project-deps/`) 新增到您的 Vite 設定中，以便 Vite 可以透過符號連結提供檔案。
