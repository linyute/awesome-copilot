# 錯誤分析：多輪對話 (Error Analysis: Multi-Turn Conversations)

對複雜的多輪對話追蹤 (traces) 進行除錯。

## 方法 (The Approach)

1. **端到端優先 (End-to-end first)** - 對話是否達成了目標？
2. **尋找第一個失敗點 (Find first failure)** - 向後追溯至根本原因
3. **簡化 (Simplify)** - 在進行多輪除錯前，先嘗試單輪對話
4. **N-1 測試** - 隔離「輪次特定問題」與「能力問題」

## 尋找第一個上游失敗點 (Find First Upstream Failure)

```
第 1 輪：使用者詢問航班 ✓
第 2 輪：助理詢問日期 ✓
第 3 輪：使用者提供日期 ✓
第 4 輪：助理搜尋了錯誤的日期 ← 第一個失敗點 (FIRST FAILURE)
第 5 輪：顯示錯誤的航班 (後果)
第 6 輪：使用者感到挫折 (後果)
```

焦點應放在第 4 輪，而非第 6 輪。

## 先行簡化 (Simplify First)

在對多輪對話進行除錯之前，先測試單輪對話：

```python
# 如果單輪對話也失敗 → 問題在於擷取/知識
# 如果單輪對話通過 → 問題在於對話內容 (context)
response = chat("電子產品的退貨政策是什麼？")
```

## N-1 測試

將第 1 輪至第 N-1 輪作為內容 (context)，測試第 N 輪：

```python
context = conversation[:n-1]
response = chat_with_context(context, user_message_n)
# 與實際的第 N 輪進行比較
```

這可以隔離出錯誤是源自於內容 (context) 還是底層能力。

## 檢查清單 (Checklist)

1. 對話是否達成了目標？(E2E)
2. 哪一輪首先出錯？
3. 您能否透過單輪對話重現問題？
4. 錯誤是源自於內容還是能力？(N-1 測試)
