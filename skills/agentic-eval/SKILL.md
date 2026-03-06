---
name: agentic-eval
description: |
  評估與改進 AI 代理輸出結果的模式與技術。在以下情況使用此技能：
  - 實作自我批評與反思迴圈
  - 為品質關鍵的生成建構評估者-優化者流程
  - 建立測試驅動的程式碼精煉工作流
  - 設計基於量表或以 LLM 為評審的評估系統
  - 為代理輸出（程式碼、報告、分析）加入疊代改進
  - 衡量並提升代理回應品質
---

# 代理式評估模式 (Agentic Evaluation Patterns)

透過疊代評估與精煉來實現自我改進的模式。

## 概覽

評估模式使代理能夠評估並改進其自身的輸出，從單次生成轉向疊代精煉迴圈。

```
生成 (Generate) → 評估 (Evaluate) → 批評 (Critique) → 精煉 (Refine) → 輸出 (Output)
    ↑                                                            │
    └────────────────────────────────────────────────────────────┘
```

## 何時使用

- **品質關鍵的生成**：需要高準確性的程式碼、報告、分析
- **具有明確評估標準的任務**：存在定義好的成功指標
- **需要特定標準的內容**：風格指南、合規性、格式化

---

## 模式 1：基本反思 (Basic Reflection)

代理透過自我批評來評估並改進自身的輸出。

```python
def reflect_and_refine(task: str, criteria: list[str], max_iterations: int = 3) -> str:
    """透過反思迴圈進行生成。"""
    output = llm(f"完成此任務：\n{task}")

    for i in range(max_iterations):
        # 自我批評
        critique = llm(f"""
        根據標準評估此輸出：{criteria}
        輸出：{output}
        將每項評為：PASS/FAIL（通過/失敗），並以 JSON 形式提供意見回饋。
        """)

        critique_data = json.loads(critique)
        all_pass = all(c["status"] == "PASS" for c in critique_data.values())
        if all_pass:
            return output

        # 根據批評進行精煉
        failed = {k: v["feedback"] for k, v in critique_data.items() if v["status"] == "FAIL"}
        output = llm(f"進行改進以解決以下問題：{failed}\n原始內容：{output}")

    return output
```

**關鍵洞察**：使用結構化的 JSON 輸出，以便對批評結果進行可靠的剖析 (parsing)。

---

## 模式 2：評估者-優化者 (Evaluator-Optimizer)

將生成與評估拆分為獨立的元件，以明確職責。

```python
class EvaluatorOptimizer:
    def __init__(self, score_threshold: float = 0.8):
        self.score_threshold = score_threshold

    def generate(self, task: str) -> str:
        return llm(f"完成：{task}")

    def evaluate(self, output: str, task: str) -> dict:
        return json.loads(llm(f"""
        評估此任務的輸出：{task}
        輸出：{output}
        回傳 JSON：{{"overall_score": 0-1, "dimensions": {{"accuracy": ..., "clarity": ...}}}}
        """))

    def optimize(self, output: str, feedback: dict) -> str:
        return llm(f"根據意見回饋進行優化：{feedback}\n輸出：{output}")

    def run(self, task: str, max_iterations: int = 3) -> str:
        output = self.generate(task)
        for _ in range(max_iterations):
            evaluation = self.evaluate(output, task)
            if evaluation["overall_score"] >= self.score_threshold:
                break
            output = self.optimize(output, evaluation)
        return output
```

---

## 模式 3：程式碼專用的反思 (Code-Specific Reflection)

用於程式碼生成的測試驅動精煉迴圈。

```python
class CodeReflector:
    def reflect_and_fix(self, spec: str, max_iterations: int = 3) -> str:
        code = llm(f"為以下內容編寫 Python 程式碼：{spec}")
        tests = llm(f"為以下內容生成 pytest 測試：{spec}\n程式碼：{code}")

        for _ in range(max_iterations):
            result = run_tests(code, tests)
            if result["success"]:
                return code
            code = llm(f"修復錯誤：{result['error']}\n程式碼：{code}")
        return code
```

---

## 評估策略

### 基於結果 (Outcome-Based)
評估輸出是否達到了預期結果。

```python
def evaluate_outcome(task: str, output: str, expected: str) -> str:
    return llm(f"輸出是否達到了預期結果？任務：{task}，預期：{expected}，輸出：{output}")
```

### 以 LLM 為評審 (LLM-as-Judge)
使用 LLM 來比較輸出結果並進行排名。

```python
def llm_judge(output_a: str, output_b: str, criteria: str) -> str:
    return llm(f"比較輸出 A 和 B 的 {criteria}。哪個更好，為什麼？")
```

### 基於量表 (Rubric-Based)
根據加權維度對輸出進行評分。

```python
RUBRIC = {
    "accuracy": {"weight": 0.4},
    "clarity": {"weight": 0.3},
    "completeness": {"weight": 0.3}
}

def evaluate_with_rubric(output: str, rubric: dict) -> float:
    scores = json.loads(llm(f"為每個維度評分 1-5：{list(rubric.keys())}\n輸出：{output}"))
    return sum(scores[d] * rubric[d]["weight"] for d in rubric) / 5
```

---

## 最佳實踐

| 實踐 | 原理 |
| --- | --- |
| **明確的標準** | 預先定義具體、可衡量的評估標準 |
| **疊代限制** | 設定最大疊代次數 (3-5) 以防止無限迴圈 |
| **收斂檢查** | 如果輸出分數在兩次疊代之間沒有改善，則停止 |
| **記錄歷史** | 保留完整的軌跡，以便進行除錯和分析 |
| **結構化輸出** | 使用 JSON 以便對評估結果進行可靠的剖析 |

---

## 快速入門檢查表

```markdown
## 評估實作檢查表

### 設定
- [ ] 定義評估標準/量表
- [ ] 設定「足夠好」的分數閾值
- [ ] 配置最大疊代次數（預設為 3）

### 實作
- [ ] 實作 generate() 函式
- [ ] 實作具備結構化輸出的 evaluate() 函式
- [ ] 實作 optimize() 函式
- [ ] 串聯精煉迴圈

### 安全性
- [ ] 加入收斂偵測
- [ ] 記錄所有疊代以進行除錯
- [ ] 優雅地處理評估剖析失敗的情況
```
