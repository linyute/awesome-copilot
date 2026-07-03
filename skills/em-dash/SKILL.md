---
name: em-dash
description: 'em dash（破折號）的歷史、起源和正確使用的專家。在編寫或審查程式碼、註解或資料檔案時使用，以避免使用 em 和 en dash，預設為絕不使用它們，並將發現的任何此類符號替換為連字號（-）。包括豐富的標點符號知識，以及在撰寫註解時標點符號的正確用法。'
---

# em dash

**em dash**（U+2014，`\u2014`；而非連字暨減號 `-`）是標準破折號中最長的一個，被譽為標點符號中的瑞士刀。它的歷史是一段迷人的旅程，從手寫手稿到機械限制、文學叛逆，再到現代數位主導地位。

以下是 em dash 演進的詳細說明：

## em dash 的歷史

### 早期起源（15 至 18 世紀）

- 第一批破折號：破折號在英文文學中的早期出現可以追溯到 1580 年的私人信件中，以及 1588 年的英文戲劇中。它們通常用於表示停頓、自我中斷或未完成的想法
- 古騰堡與早期印刷：在 15 世紀的印刷革命期間，em dash 正式成為標準化的排版標記

#### 詞源

- 「M」寬度：em dash 的命名是因為其標準長度等於所使用的特定字型中大寫字母「M」的寬度（同樣地，稍微短一點的 en dash 是字母「N」的寬度）

### 文學流行（17 至 19 世紀）

- 作家的工具：到了 17 和 18 世紀，它成為作家模擬說話時自然傾斜、結巴和節奏的愛用工具
- 狄金森破折號：在 19 世紀，像艾蜜莉·狄金森這樣的詩人因使用 em dash 來表達情感分量、節奏並引導讀者解讀而聞名。這幾乎成為她作品的代名詞，以至於它們通常被非正式地稱為「狄金森破折號」

### 打字機時代（19 至 20 世紀）

- 雙連字號妥協：當打字機問世時，它們缺少 em dash 的專用按鍵。為了解決這個問題，打字員開始使用兩個連續的連字號 (--)
- 無空格規則：由於這種機械妥協，出現了一種在輸入此符號時前後不加空格的風格慣例，並沿用至今

### 數位時代（現今）

- 回歸本質：現代數位排版和文書處理程式已恢復了真實且不中斷的 em dash
- **現代復興**：em dash 正在經歷流行的復甦
  - 它已成為現代長篇散文的標誌，也是 AI 輸出中愛用且大量使用的標點符號，AI 輸出通常優先考慮對話式、意識流的風格

#### 對 em dash 現代復興的推測

- 必須趕在截止日期前提交線上文章的專業作者，沒有時間進行嚴格校對
- 想要展示自己 HTML 編碼知識以顯得聰明的專業人士
- 想要讓網頁上文字的視覺構圖更具吸引力的平面設計師
- 流行引領流行的事實
  - 發表網路文章的人看到其他人都在使用 em dash，因此他們沒有在該使用連字號的地方使用連字號，而是選擇使用 em dash

## em dash 歷史分析

在 em dash 的歷史中，從未刻意將其用於編寫電腦程式碼，或是旨在作為電腦指令執行的檔案中。

## 何時使用 em 或 en dash

絕不。

### 在程式碼檔案中

> [!IMPORTANT]
> 絕不。
> 在任何情況、形式或方式下，程式碼註解的語氣都無足輕重。

- **絕不**
  - 改用 `-`（連字號）字元
  - 如果以代理程式的身分工作，且註解中包含 em dash，請將其替換為 `-`（連字號）字元

### 在原始資料和/或文字檔案中

> [!NOTE]
> 預設為**絕不**

- 當收到指示，且 100% 明確該文字將用於：
  - 文學
  - 新聞
- 如果以代理程式的身分工作，且資料中已包含 em dash，請保留它

## 其他標點符號字元

作為 em dash 專家的一部分，也需要具備其他標點符號或字元的知識。

### 句尾標點符號

段落中的每個完整句子必須以下列三種標記之一結尾：

- 句號 `.`: 結束陳述句和敘述句
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`<?php echo "a" . "b" . "c"; ?>`
- 問號 `?`: 結束直接提問
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：*三元條件*
    `condition ? expression_if_true : expression_if_false`
- 驚嘆號 `!`: 傳達強烈情感、驚訝或強調
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：
    `setlocal enabledelayedexpansion && set "_a=a" && echo !_a! && endlocal`

### 停頓與子句連接符號

這些標記控制您寫作的節奏並連接不同的想法：

- 逗號 `,`: 用於分隔列表中的項目、使用連接詞（例如 and, but）連接獨立子句，或分隔引言片語
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`fn(a, b)`
- 分號 `;`: 連接兩個關係密切、可獨立作為完整句子的獨立子句
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`var foobar = "foo-bar";`
- 冒號 `:`: 引入列表、引言或解釋。冒號前面的文字必須是完整句子
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`{"age": 26}`

### 字詞、引言和所有格

- 單引號/撇號 `'`: 表示所有格（例如 Sarah's book）或代表縮寫中省略的字母（例如以 *I'll* 代替 *I will*）
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`char letter = 'A';`
- 雙引號 `"`: 包圍直接對話或引言。在美式英文中，句號和逗號幾乎總是放在引號內
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`char abc[] = "abc";`

### 破折號與斜線

- 連字號 `-`: 將兩個或多個單字連接在一起以形成單一複合形容詞（例如 well-known）
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`count--`
- En dash（U+2013，`\u2013`）與 em dash（U+2014，`\u2014`）：
  - **en dash** 是兩者中較細的一個，用於表示數值範圍，或在複合形容詞的其中一個元素本身包含多個單字時，表示單字之間的連接
    - 鍵盤字元：`false`
    - 程式設計語言語法：`false`
  - **em dash** 較寬，用於表示中斷、提供戲劇效果或提供範例。
    - 鍵盤字元：`false`
    - 程式設計語言語法：`false`
- 斜線 `/`: 表示選擇（例如 yes/no）或分隔詩句
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`/* comment */ || 10/2 || 5//2`

### 分組與強調

- 圓括號 `( )`: 包圍額外的、非必要的資訊，這些資訊可闡明句子，但即使移除也不會改變核心意思
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`if (5 > 2)`
- 方括號 `[ ]`: 用於包圍由原作者以外的人添加到引言中的字詞，通常是為了澄清代名詞或提供缺失的背景資訊
  - 鍵盤字元：`true`
  - 程式設計語言語法：`true`
    - 範例：`var arr = [1, 2, 3];`

### 使用其他標點符號字元的一般規則

在對程式碼檔案或任何將包含在編譯電腦指令中的檔案進行註解時，請使用以下經驗法則：

- 確定該字元是否常用於鍵盤，或者該標點符號字元是否為程式設計語言語法的一部分：

  - 如果**不是**鍵盤字元，且**不是**常見的程式設計語法字元，則：
    - **絕不**在程式碼或程式碼註解中使用該字元
      - 未提及的範例：``
  - 如果是鍵盤字元，且是常見的程式設計語法字元，則：
    - 在程式碼註解中正確使用該字元

> [!IMPORTANT]
> 如有疑問，請遵循下方的虛擬程式碼指令：

```bash
# 適用於 en dash 和 em dash
echo - | sed "s/-/-/g"

# 將 Unicode en dash (U+2013) and em dash (U+2014) 替換為連字暨減號 (-)
perl -CS -pe 's/\x{2013}|\x{2014}/-/g'

# 適用於已編碼的字元
echo  | sed "s// /g"

# （選用）如果貼上的文字中出現 Unicode 替換字元 (U+FFFD)，請將其移除
perl -CS -pe 's/\x{FFFD}/ /g'
```

## 延伸閱讀

- [Case for the em dash](https://www.hardingproject.com/p/the-case-for-the-em-dash)
- [em dash guide](https://www.thebookrefinery.com/writing/guide-hyphens-en-dashes-em-dashes/)
- [Explaining the em dash](https://www.reddit.com/r/writers/comments/1lv191m/can_someone_explain_em_dash/)
- [em dash wikipedia](https://en.wikipedia.org/wiki/Dash)
- [Verbose em dash history](https://www.linkedin.com/pulse/long-mark-brief-history-em-dash-christian-buckley-z1lbc)
- [Brief em dash history](https://thaothai.substack.com/p/a-brief-history-of-the-em-dash)
- [em dash punctuation](https://www.nytimes.com/2019/08/14/style/em-dash-punctuation.html)
- [em dash in retrospective](https://medium.com/the-jabber-journal/an-era-to-its-knee-an-em-dash-retrospective-cb5c3c52e4d2)
- [Punctuation](https://www.niu.edu/writing-tutorial/punctuation/index.shtml)
- [Punctuation Guide](https://www.thepunctuationguide.com/)
