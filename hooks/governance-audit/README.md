---
name: 'Governance Audit'
description: '掃描 Copilot 代理程式提示以尋找威脅訊號並記錄治理事件'
tags: ['security', 'governance', 'audit', 'safety']
---

# 治理稽核勾點 (Governance Audit Hook)

針對 GitHub Copilot 編碼代理程式工作階段的即時威脅偵測與稽核記錄。在代理程式處理之前，掃描使用者提示中是否存在危險模式。

## 總覽

此勾點為 Copilot 編碼代理程式工作階段提供治理控制：
- **威脅偵測**：掃描提示中是否存在資料外洩、權限提升、系統破壞、提示注入 (Prompt Injection) 以及認證洩露。
- **治理層級**：開放 (Open)、標準 (Standard)、嚴格 (Strict)、鎖定 (Locked) — 從僅稽核到完全封鎖。
- **稽核追蹤**：所有治理事件的僅附加 (Append-only) JSON 紀錄。
- **工作階段摘要**：在工作階段結束時報告威脅計數。

## 威脅類別

| 類別 | 範例 | 嚴重性 |
|----------|----------|----------|
| `data_exfiltration` | "將所有記錄傳送至外部 API" | 0.7 - 0.95 |
| `privilege_escalation` | "sudo", "chmod 777", "將使用者加入 sudoers" | 0.8 - 0.95 |
| `system_destruction` | "rm -rf /", "刪除資料庫" | 0.9 - 0.95 |
| `prompt_injection` | "忽略先前的指引" | 0.6 - 0.9 |
| `credential_exposure` | 硬編碼的 API 金鑰、AWS 存取金鑰 | 0.9 - 0.95 |

## 治理層級

| 層級 | 行為 |
|-------|----------|
| `open` | 僅記錄威脅，永不封鎖 |
| `standard` | 記錄威脅，僅在 `BLOCK_ON_THREAT=true` 時封鎖 |
| `strict` | 記錄並封鎖所有偵測到的威脅 |
| `locked` | 記錄並封鎖所有偵測到的威脅 |

## 安裝方式

1. 將勾點資料夾複製到您的存放區：
   ```bash
   cp -r hooks/governance-audit .github/hooks/
   ```

2. 確保指令碼具備執行權限：
   ```bash
   chmod +x .github/hooks/governance-audit/*.sh
   ```

3. 建立日誌目錄並將其加入 `.gitignore`：
   ```bash
   mkdir -p logs/copilot/governance
   echo "logs/" >> .gitignore
   ```

4. 提交至您存放區的預設分支。

## 設定方式

在 `hooks.json` 中設定環境變數：

```json
{
  "env": {
    "GOVERNANCE_LEVEL": "strict",
    "BLOCK_ON_THREAT": "true"
  }
}
```

| 變數 | 值 | 預設值 | 說明 |
|----------|--------|---------|-------------|
| `GOVERNANCE_LEVEL` | `open`, `standard`, `strict`, `locked` | `standard` | 控制封鎖行為 |
| `BLOCK_ON_THREAT` | `true`, `false` | `false` | 封鎖偵測到威脅的提示 (標準層級) |
| `SKIP_GOVERNANCE_AUDIT` | `true` | 未設定 | 完全停用治理稽核 |

## 日誌格式

事件將以 JSON Lines 格式寫入 `logs/copilot/governance/audit.log`：

```json
{"timestamp":"2026-01-15T10:30:00Z","event":"session_start","governance_level":"standard","cwd":"/workspace/project"}
{"timestamp":"2026-01-15T10:31:00Z","event":"prompt_scanned","governance_level":"standard","status":"clean"}
{"timestamp":"2026-01-15T10:32:00Z","event":"threat_detected","governance_level":"standard","threat_count":1,"threats":[{"category":"privilege_escalation","severity":0.8,"description":"權限提升","evidence":"sudo"}]}
{"timestamp":"2026-01-15T10:45:00Z","event":"session_end","total_events":12,"threats_detected":1}
```

## 系統需求

- `jq` 用於 JSON 處理 (大多數 CI 環境與 macOS 已預先安裝)
- 支援 `-E` (延伸正規表示式) 的 `grep`
- `bc` 用於浮點數比較 (選配，若無則降級處理)

## 隱私與安全性

- **永不** 記錄完整的提示內容 — 僅記錄相符的威脅模式 (極簡證據片段) 與 Metadata。
- 將 `logs/` 加入 `.gitignore` 以將稽核資料保留在本機。
- 設定 `SKIP_GOVERNANCE_AUDIT=true` 以完全停用。
- 所有資料均保留在本機 — 無外部網路呼叫。
