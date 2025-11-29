---
description: '根據官方文件的 Playwright Python AI 測試產生指引。'
applyTo: '**'
---

# Playwright Python 測試產生指引

## 測試撰寫準則

### 程式品質標準
- **定位器**：優先使用面向使用者、以角色為基礎的定位器（get_by_role、get_by_label、get_by_text），提升韌性與無障礙性。
- **斷言**：使用自動重試、以網頁為主的斷言（expect API，例如 expect(page).to_have_title(...)）。除非專門測試元素可見性變化，否則避免使用 expect(locator).to_be_visible()，更具體的斷言通常更可靠。
- **逾時**：依賴 Playwright 內建自動等待機制，避免硬編碼等待或調高預設逾時。
- **清晰度**：測試標題需具描述性（如 def test_navigation_link_works():），明確說明目的。僅在邏輯複雜時加註解，簡單動作如「點擊按鈕」不需註解。

### 測試結構
- **匯入**：每個測試檔案開頭應有 from playwright.sync_api import Page, expect。
- **Fixture**：測試函式以 page: Page 為參數，操作瀏覽器頁面。
- **設定**：每個測試函式開頭執行導航（如 page.goto()）。多個測試共用的設定動作請用標準 Pytest fixture。

### 檔案組織
- **位置**：測試檔案請存放於專屬 tests/ 目錄，或依現有專案結構。
- **命名**：測試檔案必須遵循 test_<功能或頁面>.py 命名規則，Pytest 才能自動發現。
- **範疇**：每個主要功能或頁面建議一個測試檔案。

## 斷言最佳實踐
- **元素數量**：用 expect(locator).to_have_count() 斷言定位器找到的元素數量。
- **文字內容**：用 expect(locator).to_have_text() 斷言精確文字，用 expect(locator).to_contain_text() 斷言部分文字。
- **導航**：用 expect(page).to_have_url() 驗證頁面網址。
- **斷言風格**：優先使用 `expect`，比 `assert` 更適合 UI 測試。

## 範例

```python
import re
import pytest
from playwright.sync_api import Page, expect

@pytest.fixture(scope="function", autouse=True)
def before_each_after_each(page: Page):
    # 每次測試前導向起始網址。
    page.goto("https://playwright.dev/")

def test_main_navigation(page: Page):
    expect(page).to_have_url("https://playwright.dev/")

def test_has_title(page: Page):
    # 斷言標題「包含」指定字串。
    expect(page).to_have_title(re.compile("Playwright"))

def test_get_started_link(page: Page):
    page.get_by_role("link", name="Get started").click()
    
    # 斷言頁面有名為 Installation 的標題。
    expect(page.get_by_role("heading", name="Installation")).to_be_visible()
```

## 測試執行策略

1. **執行**：於終端機用 pytest 指令執行測試。
2. **除錯失敗**：分析測試失敗並找出根本原因
