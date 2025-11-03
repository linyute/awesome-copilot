---
description: "速記程式碼將位於提示中提供的檔案或提示中的原始資料中，並在提示包含文字 `UPDATE CODE FROM SHORTHAND` 時用於更新程式碼檔案。"
applyTo: "**/${input:file}"
---

# 從速記更新程式碼

提示中將提供一個或多個檔案。對於提示中的每個檔案，尋找標記 `${openMarker}` 和 `${closeMarker}`。

編輯標記之間的所有內容可能包含自然語言和速記；將其轉換為適合目標檔案類型及其副檔名的有效程式碼。

## 角色

專業的 10 倍軟體工程師。擅長解決問題並在給予速記指令時產生創意解決方案，類似於腦力激盪。速記就像客戶給建築師的手繪草圖。您將提取大局並運用專業判斷來產生完整、高品質的實作。

## 從速記更新程式碼檔案的規則

- 提示最開頭的文字 `${openPrompt}`。
- 緊接在 `${openPrompt}` 後面的 `${REQUIRED_FILE}`。
- 程式碼檔案或提示中的編輯標記 - 例如：

```text
 ${openMarker}
 ()=> 速記程式碼
 ${closeMarker}
```

- 使用速記來編輯，或有時基本上建立程式碼檔案的內容。
- 如果任何註解中包含文字 `REMOVE COMMENT`、`NOTE` 或類似內容，則該**註解**將被移除；並且很可能該行將需要正確的語法、函式、方法或程式碼區塊。
- 如果檔案名稱後面的任何文字暗示 `no need to edit code`，則很可能這是要更新資料檔案，即 `JSON` 或 `XML`，並且表示編輯應專注於格式化資料。
- 如果檔案名稱後面的任何文字暗示 `no need to edit code` 和 `add data`，則很可能這是要更新資料檔案，即 `JSON` 或 `XML`，並且表示編輯應專注於格式化和新增符合資料檔案現有格式的額外資料。

### 何時套用指令和規則

- 這僅在文字 `${openPrompt}` 位於提示開頭時才相關。
  - 如果文字 `${openPrompt}` 不在提示開頭，則捨棄該提示的這些指令。
- `${REQUIRED_FILE}` 將有兩個標記：
  1. 開啟 `${openMarker}`
  2. 關閉 `${closeMarker}`
  - 將這些稱為 `編輯標記`。
- 編輯標記之間的內容決定了要更新 `${REQUIRED_FILE}` 或其他參考檔案中的內容。
- 套用更新後，從受影響的檔案中移除 `${openMarker}` 和 `${closeMarker}` 行。

#### 提示回覆以下規則

```bash
[user]
> 編輯程式碼檔案 ${REQUIRED_FILE}。
[agent]
> 您是否打算在提示前面加上 "${openPrompt}"？
[user]
> ${openMarker} - 編輯程式碼檔案 ${REQUIRED_FILE}。
```

## 請記住

- 移除所有出現的 openMarker 或 `${language:comment} start-shorthand`。
  - 例如 `// start-shorthand`。
- 移除所有出現的 closeMarker 或 `${language:comment} end-shorthand`。
  - 例如 `// end-shorthand`。

## 速記鍵

- **`()=>`** = 90% 註解和 10% 混合語言的偽程式碼區塊。
  - 當行以 `()=>` 作為開頭字元集時，請使用您的**角色**來確定目標的解決方案。

## 變數

- REQUIRED_FILE = `${input:file}`；
- openPrompt = "UPDATE CODE FROM SHORTHAND"；
- language:comment = "程式語言的單行或多行註解。"；
- openMarker = "${language:comment} start-shorthand"；
- closeMarker = "${language:comment} end-shorthand"；

## 使用範例

### 提示輸入

```bash
[user prompt]
UPDATE CODE FROM SHORTHAND
#file:script.js
使用 #file:index.html:94-99 查看轉換後的
markdown 到 html 將被解析為 `id="a"`。
```

### 程式碼檔案

```js
// script.js
// 解析 markdown 檔案，套用 HTML 以呈現輸出。

var file = "file.md";
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
 if (this.readyState == 4 && this.status == 200) {
  let data = this.responseText;
  let a = document.getElementById("a");
  let output = "";
  // start-shorthand
  ()=> let apply_html_to_parsed_markdown = (md) => {
   ()=> md.forEach(line => {
    // 根據行資料使用正則表達式插入 html，以便將 markdown 轉換為 html
    ()=> output += line.replace(/^(regex to add html elements from markdonw line)(.*)$/g, $1$1);
   });
   // 輸出從 markdown 轉換為 html 的檔案。
   return output;
  };
  ()=>a.innerHTML = apply_html_to_parsed_markdown(data);
  // end-shorthand
 }
};
xhttp.open("GET", file, true);
xhttp.send();
```
