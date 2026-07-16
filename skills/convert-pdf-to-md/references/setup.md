# convert-pdf-to-md 的環境設定

請完全依序遵循這些步驟，然後再於特定環境中首次執行 `scripts/convert_pdf_to_md.py`。請勿跳過步驟或臨摹替代方案——這些步驟的撰寫旨在確保其確定性且能安全地重複執行。

## 1. 檢查 Python 是否可用 (3.10+)

```powershell
python --version
```

- 如果此步驟失敗（找不到命令），請安裝 Python 3.10 或更新版本：
  - Windows: `winget install --id Python.Python.3.12 -e`
  - macOS: `brew install python@3.12`
  - Linux (Debian/Ubuntu): `sudo apt-get update && sudo apt-get install -y python3 python3-pip python-is-python3`
- 如果回報的版本舊於 3.10，請使用上述相同的命令安裝較新的 Python（MarkItDown 需要 3.10+）。

## 2. 檢查 pip 是否可用

```powershell
python -m pip --version
```

- 如果此步驟失敗，請引導安裝 pip：

```powershell
python -m ensurepip --upgrade
```

## 3. 安裝支援 PDF 的 MarkItDown，以及用於影像擷取的 PyMuPDF

使用此技能隨附的 `scripts/requirements.txt` 檔案來安裝已釘選且已知良好的相依性版本：

```powershell
python -m pip install -r scripts/requirements.txt
```

這會拉取 `markitdown[pdf]` 和 `pymupdf>=1.24.0`。PyMuPDF（匯入為 `fitz`）需要單獨安裝，因為 MarkItDown 的 PDF 轉換器僅擷取文字和表格——它完全不支援嵌入影像，因此此技能的腳本會自行進行擷取。

## 4. 驗證安裝

```powershell
python -c "from markitdown import MarkItDown; import fitz; print('markitdown + pymupdf OK')"
```

預期會看到列印出 `markitdown + pymupdf OK` 且無錯誤。如果您看到 `ModuleNotFoundError`，請重複步驟 3——pip 可能正安裝至與被呼叫的 Python 環境不同的環境中（檢查 `python -m pip --version` 顯示的路徑是否與 `python --version` 的解譯器相同）。

## 備註

- 此設定在每個環境/虛擬環境中只需執行一次，而不是每次轉換都要執行。
- `convert_pdf_to_md.py` 本身在啟動時也會檢查 `markitdown` 和 `fitz`，如果缺少其中任一個，則會列印指向此檔案的指標，因此重複執行設定是安全且冪等的。
- 此技能僅支援 `.pdf`——這是 MarkItDown 唯一的 PDF 家族格式，因此這裡不需要擔心舊版格式（不像 Word 的 `.doc` 或 Excel 的 `.xls`）。
- 掃描/僅含影像的 PDF（無嵌入文字層）在 MarkItDown 中將產生極少或不產生任何文字，因為它不執行 OCR。影像本身仍會被擷取並附加，但在這種情況下文字主體可能為空或幾近空白——如果發生這種情況，請向使用者說明。
