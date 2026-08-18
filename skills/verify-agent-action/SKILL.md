---
name: 'verify-agent-action'
description: '在執行前審查提議的 AI 代理程式動作或人工核准封包。當代理程式想要執行重大工具、指令、部署、訊息、購買、憑證操作或資料變更時；在檢查核准是否仍與確切動作相符時；或在針對偽造結果、參數替換、重放、相互關聯的審查者、缺失證據、到期或陳舊監控稽核動作證據時使用。僅產出基於證據的審查 — 絕不執行或授權該動作。'
---

# 驗證代理程式動作 (Verify Agent Action)

將看似合理的核准畫面視為主張，而非證明。在人員或外部強制執行點
決定是否採取行動之前，先驗證完整的決策路徑。

## 維護安全邊界

- 絕不執行、核准、簽署、發送、購買、部署或變更任何內容。
- 絕不將此審查轉換為執行授權。
- 絕不推斷缺失的證據、身分、時間戳記或參數。
- 將有效的結構描述、總和檢查碼 (checksum) 或簽章視為其本身是不充分的。
- 將簽章視為歸屬和完整性的證據，而非事實真相。
- 將支援和反駁的證據分開；不要透過平均抹除衝突。
- 發生重大不匹配時依預設關閉 (Fail closed)。當所需的證據不可用時
  使用 `INCONCLUSIVE`。

在每個最終結果中設定此欄位：

```json
{"execution_authorized": false}
```

## 收集審查封包

僅請求審查所需的產物：

1. 原始的使用者或系統請求。
2. 確切提議的動作：
   - 操作或工具名稱
   - 目標資源
   - 完整參數
   - 檔案系統與網路範圍
   - 最大執行次數
   - 生效時間 (not-before) 與到期時間
3. 聲稱該動作具備正當理由的評估報告。
4. 該評估所使用的來源證據和原則。
5. 核准記錄，包括核准者身分、角色、動作摘要、Nonce、
   受眾、簽發時間、到期時間和使用次數。
6. 最新監控事件與預期活動訊號 (heartbeat) 間隔。
7. 當前受信任的時間與任何先前的 Nonce 使用記錄。

在分析前列出缺失的欄位。不要靜默替換預設值。

## 建立確切的動作身分

建立一個正規化的動作物件，且不遺漏任何欄位：

```json
{
  "operation": "git.push",
  "target": "owner/repository",
  "parameters": {
    "branch": "fix/example",
    "commit": "40-character-sha",
    "remote": "origin"
  },
  "filesystem_scope": [],
  "network_scope": ["github.com:443"],
  "execution_count": 1,
  "not_before": "RFC3339 timestamp",
  "expires_at": "RFC3339 timestamp"
}
```

在提供時使用專案指定的標準化和摘要演算法。
否則，回報加密身分無法被獨立驗證；
仍需在結構上比較每個欄位。

切勿透過正規化抹除與安全性相關的差異，例如：

- 分支、認可 (commit)、存放庫、環境、接收者、金額、貨幣或主機
- recursive、force、overwrite、privileged、destructive 或 dry-run 旗標
- 檔案系統根目錄、CIDR、連接埠、網域、執行次數或到期時間

## 執行六項控制措施

將每項控制措施評估為 `PASS`、`FAIL`、`INCONCLUSIVE` 或 `NOT_APPLICABLE`。

### 1. 重新計算評估

- 當宣告的確定性評估程式之實作可用時，從宣告的來源輸入
  重新執行它。
- 比較完整的標準化結果，而非選取的欄位。
- 若接收到的結果與重新計算的結果不同，標記為 `FAIL`。
- 當僅有結構描述驗證、內部總和檢查碼或無法驗證的
  評估者主張可用時，標記為 `INCONCLUSIVE`。

### 2. 匹配確切核准的動作

- 比較提議的動作與繫結至核准中的動作。
- 比較完整的正規化物件及其摘要。
- 若核准後任何實質欄位發生變更，標記為 `FAIL`。
- 當證據僅支援較窄的動作時，將寬泛的目標或範圍
  視為不匹配。

### 3. 拒絕重放與身分模糊性

- 驗證 Nonce 是唯一的且未使用過。
- 驗證主體、受眾、簽發者、核准者角色、簽發時間、生效時間、
  到期時間以及最大使用次數。
- 針對重複使用的 Nonce、錯誤的受眾、過期的核准、未來日期的
  核准、過多的使用次數、已撤銷的身分或角色不匹配標記為 `FAIL`。
- 若不存在值得信任的重放存放區或時間來源，標記為 `INCONCLUSIVE`。

### 4. 測試審查者的獨立性

為每位審查者或評估者建立相依性表格：

| 維度 | 比較項目 |
|---|---|
| 模型 | 家族、版本、微調 |
| 提供者 | 帳戶與控制平面 |
| 提示 | 共用樣板或歷程 |
| 檢索 | 重疊的來源與索引 |
| 工具 | 共用的評估程式程式碼與執行階段 |
| 操作員 | 共同的擁有者或核准權限 |

不要將相互關聯的審查者計為獨立的法定人數成員。如果
原則要求獨立核准，且剩餘的獨立集合
過小，標記為 `FAIL`。

### 5. 保留證據與矛盾

- 盤點評估報告所參照的每個證據識別碼。
- 確認每項內容均存在、可驗證、在其有效期間內
  且與主張相關。
- 獨立記錄支援與反駁：

| 支援 | 反駁 | 認識狀態 |
|---|---|---|
| 缺失 | 缺失 | `UNDETERMINED` |
| 存在 | 缺失 | `SUPPORTED_ONLY` |
| 缺失 | 存在 | `REFUTED_ONLY` |
| 存在 | 存在 | `CONFLICTED` |

- 若證據被移除、竄改、過期或隱瞞且
  改變了結果，標記為 `FAIL`。
- 切勿將 `CONFLICTED` 轉換為看似安全的數字平均值。

### 6. 驗證生命週期與監控

- 確認該動作處於其有效期間內。
- 在可用時驗證監控事件簽章或完整性證據。
- 檢查序號、先前事件摘要以及預期的活動訊號
  節奏。
- 當原則要求持續監控時，將缺失、陳舊、重新排序或
  斷鏈的遙測資料視為失敗。
- 不要將沉默解讀為健康。

## 挑戰便利的結論

在產出最終結果之前，在心理上或使用
專案提供的測試載具嘗試這些變更：

1. 將受阻的評估替換為允許的結果。
2. 變更一個已核准的目標、參數、範圍、金額或認可。
3. 重複使用本屬有效的核准 Nonce。
4. 將獨立的審查者替換為相關聯的複本。
5. 移除一個反駁證據項目。
6. 在核准後停止監控活動訊號。

若任何變更會通過審查控制措施，請將受影響的控制措施
記錄為 `FAIL`；不要僅僅建議未來的強化措施。

## 確定審查結果

使用恰好一個結果：

- `ELIGIBLE_FOR_HUMAN_DECISION`：所有必要的控制措施皆通過。
- `ELIGIBLE_WITH_CONTROLS`：沒有必要的控制措施失敗，且明確的
  外部控制措施可在執行前解決列出的條件。
- `BLOCKED`：至少一項必要的控制措施失敗，或該動作超出了
  具正當理由的範圍。
- `INCONCLUSIVE`：沒有必要的控制措施被證明為假，但安全決策
  所需的證據缺失或無法驗證。

`ELIGIBLE_FOR_HUMAN_DECISION` 不是核准。人員授權機構與獨立的
強制執行點仍對任何實際動作負責。

## 依此格式回報

```markdown
# Agent Action Review

## Result
- Review result: BLOCKED | INCONCLUSIVE | ELIGIBLE_WITH_CONTROLS |
  ELIGIBLE_FOR_HUMAN_DECISION
- Execution authorized: false
- Exact action digest: <verified value or NOT_VERIFIED>

## Action
- Operation:
- Target:
- Material parameters:
- Scope:
- Validity window:
- Maximum uses:

## Control matrix
| Control | Status | Evidence | Reason |
|---|---|---|---|
| Recomputed assessment | PASS/FAIL/INCONCLUSIVE/N/A | ... | ... |
| Exact action binding | ... | ... | ... |
| Replay and identity | ... | ... | ... |
| Reviewer independence | ... | ... | ... |
| Evidence completeness | ... | ... | ... |
| Monitoring freshness | ... | ... | ... |

## Supporting evidence
- ...

## Refuting evidence and defeaters
- ...

## Required next action
- State the smallest concrete step that could change the result.

## Boundaries
- State what this review did not prove.
```

以結果和確切原因作為開頭。優先提供可重現的阻礙因素，而非
信心分數。
