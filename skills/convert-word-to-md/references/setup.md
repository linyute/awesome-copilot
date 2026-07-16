# convert-word-to-md 的環境設定

請完全依序遵循這些步驟，然後再於特定環境中首次執行 `scripts/convert_word_to_md.py`。請勿跳過步驟或臨摹替代方案——這些步驟的撰寫旨在確保其確定性且能安全地重複執行。

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

## 3. 安裝支援 Word (.docx) 的 MarkItDown

使用此技能隨附的 `scripts/requirements.txt` 檔案來安裝已釘選且已知良好的相依性版本：

```powershell
python -m pip install -r scripts/requirements.txt
```

這會拉取 `markitdown[docx]`（MarkItDown 的 Word 轉換相依性，其中包含用於解析 `.docx` 檔案的 `mammoth`）。不需要額外的套件——此技能的腳本會使用 MarkItDown 內建的 Word 轉換器。

## 4. 驗證安裝

```powershell
python -c "from markitdown import MarkItDown; print('markitdown OK')"
```

預期會看到列印出 `markitdown OK` 且無錯誤。如果您看到 `ModuleNotFoundError: No module named 'markitdown'`，請重複步驟 3——pip 可能正安裝至與被呼叫的 Python 環境不同的環境中（檢查 `python -m pip --version` 顯示的路徑是否與 `python --version` 的解譯器相同）。

## 備註

- 此設定在每個環境/虛擬環境中只需執行一次，而不是每次轉換都要執行。
- `convert_word_to_md.py` 本身在啟動時也會檢查 `markitdown`，如果缺少，則會列印指向此檔案的指標，因此重複執行設定是安全且冪等的。
- 此技能僅支援 `.docx`。舊版二進位 `.doc` 檔案已超出範圍——如果遇到該檔案，請要求使用者將其另存為 `.docx`（例如，透過 Word 的「另存新檔」）。
