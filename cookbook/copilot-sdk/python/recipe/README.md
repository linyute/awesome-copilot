# 可執行的食譜範例

此資料夾包含針對每份 Cookbook 食譜的獨立、可執行的 Python 範例。每個檔案都可以直接作為 Python 指令碼執行。

## 先決條件

- Python 3.8 或更高版本
- 安裝相依性（這會從 PyPI 安裝 SDK）：

```bash
pip install -r requirements.txt
```

## 執行範例

每個 `.py` 檔案都是一個完整、可執行的程式，並具有執行權限：

```bash
python <檔名>.py
# 或在類 Unix 系統上：
./<檔名>.py
```

### 可用的食譜

| 食譜                 | 命令                             | 說明                                       |
| -------------------- | -------------------------------- | ------------------------------------------ |
| 錯誤處理             | `python error_handling.py`       | 示範錯誤處理模式                           |
| 多個工作階段         | `python multiple_sessions.py`    | 管理多個獨立的對話                         |
| 管理本機檔案         | `python managing_local_files.py` | 使用 AI 分組組織檔案                       |
| PR 視覺化            | `python pr_visualization.py`     | 產生 PR 時長圖表                           |
| 持續性工作階段       | `python persisting_sessions.py`  | 跨重新啟動儲存並恢復工作階段               |

### 帶有引數的範例

**針對特定儲存庫的 PR 視覺化：**

```bash
python pr_visualization.py --repo github/copilot-sdk
```

**管理本機檔案（先編輯檔案以更改目標資料夾）：**

```bash
# 先編輯 managing_local_files.py 中的 target_folder 變數
python managing_local_files.py
```

## 本機 SDK 開發

`requirements.txt` 會從 PyPI 安裝 Copilot SDK 套件。這意味著：

- 您可以獲得 SDK 的最新穩定版本
- 無需從原始碼建置
- 非常適合在您的專案中使用 SDK

如果您想要使用本機開發版本，請編輯 requirements.txt 以使用 `-e ../..` 進行可編輯模式開發。

## Python 最佳實踐

這些範例遵循 Python 慣例：

- PEP 8 命名（函式與變數使用 snake_case）
- 用於直接執行的 Shebang 行
- 正確的例外處理
- 在適當情況下使用型別提示
- 標準函式庫用法

## 虛擬環境（建議）

針對隔離開發：

```bash
# 建立虛擬環境
python -m venv venv

# 啟動它
# Windows:
venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

# 安裝相依性
pip install -r requirements.txt
```

## 學習資源

- [Python 文件](https://docs.python.org/3/)
- [PEP 8 風格指南](https://pep8.org/)
- [GitHub Copilot SDK for Python](https://github.com/github/copilot-sdk/blob/main/python/README.md)
- [上層 Cookbook](../README.md)
