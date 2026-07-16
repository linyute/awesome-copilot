# convert-excel-to-md 的環境設定

請在特定環境中第一次執行 `scripts/convert_excel_to_md.py` 之前，按順序確實遵循以下步驟。不要跳過步驟或自行改用其他方法——這些步驟具有確定性且可安全重複執行。

## 1. 確認 Python 可用（3.10+）

```powershell
python --version
```

- 若此命令失敗（找不到命令），請安裝 Python 3.10 或更新版本：
  - Windows：`winget install --id Python.Python.3.12 -e`
  - macOS：`brew install python@3.12`
  - Linux（Debian/Ubuntu）：`sudo apt-get update && sudo apt-get install -y python3 python3-pip python-is-python3`
- 若回報的版本舊於 3.10，請使用上述相同命令安裝較新的 Python（MarkItDown 需要 3.10+）。

## 2. 確認 pip 可用

```powershell
python -m pip --version
```

- 若此命令失敗，請引導安裝 pip：

```powershell
python -m ensurepip --upgrade
```

## 3. 安裝具備 Excel (.xlsx) 支援的 MarkItDown

使用隨此技能一起附帶的 `scripts/requirements.txt` 檔案，安裝已鎖定版本的可靠相依套件：

```powershell
python -m pip install -r scripts/requirements.txt
```

這會安裝 `markitdown[xlsx]`（MarkItDown 的 XLSX 表格轉換相依套件，包含 `pandas` 和 `openpyxl`）。圖片擷取不需要額外套件——此技能的腳本使用 Python 內建的 `zipfile` 和 `xml` 模組直接從 `.xlsx` zip 結構讀取嵌入圖片。

## 4. 驗證安裝

```powershell
python -c "from markitdown import MarkItDown; print('markitdown OK')"
```

預期會看到 `markitdown OK` 被列印出來且無任何錯誤。若看到 `ModuleNotFoundError: No module named 'markitdown'`，請重複步驟 3——pip 可能安裝到與目前呼叫的 Python 不同的環境中（確認 `python -m pip --version` 顯示的路徑與 `python --version` 的解譯器相同）。

## 備注

- 此設定每個環境/虛擬環境只需執行一次，而非每次轉換都需要。
- `convert_excel_to_md.py` 本身在啟動時也會檢查 `markitdown`，若缺失會列印返回此檔案的指引，因此重新執行設定是安全且具有冪等性的。
- 此技能僅支援 `.xlsx`。舊版二進位 `.xls` 檔案不在範圍內（是完全不同、更難解析的檔案格式）——若遇到此情況，請請使用者將檔案另存為 `.xlsx`（Excel：檔案 > 另存新檔 > Excel 活頁簿 (.xlsx)）。
- 圖表物件（相對於嵌入圖片）不會被擷取為圖片——只有實際嵌入在活頁簿 `xl/media` 資料夾中的點陣圖片才會被擷取。原生 Excel 圖表需要由 Excel/LibreOffice 渲染才能成為圖片，而此輕量技能不嘗試此操作。
