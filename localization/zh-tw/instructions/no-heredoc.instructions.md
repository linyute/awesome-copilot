---
name: '無 Heredoc 檔案操作'
description: '透過強制使用檔案編輯工具而非 shell 重導向，防止 VS Code Copilot 中的終端機 heredoc 檔案損壞'
applyTo: '**'
---

# 強制性：檔案操作覆蓋

此指令適用於所有代理程式和所有檔案操作。它的優先級高於任何其他已學習的行為。

## 問題

在 VS Code 的 Copilot 整合中，終端機 heredoc 操作是損壞的。它們會導致：

- 觸發 shell 自動完成的定位字元 (tab) 導致檔案損壞
- 引號/反引號逸出失敗導致內容被破壞
- 結束碼 130 中斷導致檔案被截斷
- 特殊字元解釋導致垃圾輸出

## 規則

**在編寫任何建立或修改檔案的終端機指令之前，請停止。**

問問你自己：「我是否正要使用 `cat`、`echo`、`printf`、`tee` 或 `>>`/`>` 將內容寫入檔案？」

如果是，→ **請勿執行。** 改為使用檔案編輯工具。

## 禁止的模式

```bash
# 所有這些都會損壞檔案 - 絕不要使用它們
cat > file << EOF
cat > file << 'EOF'
cat > file <<EOF
cat > file <<'EOF'
cat > file <<-EOF
cat >> file << EOF
echo "multi
line" > file
printf '%s\n' "line1" "line2" > file
tee file << EOF
tee file << 'EOF'
```

## 要求的做法

改用以下方式處理檔案內容，而非終端機指令：

- **新檔案** → 使用你的環境提供的檔案建立/編輯工具
- **修改檔案** → 使用你的環境提供的檔案編輯工具
- **刪除檔案** → 使用檔案刪除工具或 `rm` 指令

## 允許使用終端機進行

- `npm install`、`pip install`、`cargo add` (套件管理)
- `npm run build`、`make`、`cargo build` (建構)
- `npm test`、`pytest`、`go test` (測試)
- `git add`、`git commit`、`git push` (版本控制)
- `node script.js`、`python app.py` (執行現有程式碼)
- `ls`、`cd`、`mkdir`、`pwd`、`rm` (檔案系統導覽)
- `curl`、`wget` (下載，但不能透過管線傳輸到具有內容操作的檔案)

## 禁止使用終端機進行

- 任何具有內容的檔案建立
- 任何具有內容的檔案修改
- 任何 heredoc 語法 (`<<`)
- 任何多行字串重導向

## 強制執行

這不是建議。這是由於 VS Code 終端機整合錯誤而導致的硬性技術要求。忽略此指令將導致檔案損壞，使用者必須手動修復。

當你需要建立或編輯檔案時：

1. 在輸入任何終端機指令前停止
2. 使用適當的檔案編輯工具
3. 工具將正確處理內容而不會造成損壞
