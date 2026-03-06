# 編寫數學運算式

使用 Markdown 在 GitHub 上顯示數學運算式。

## 關於編寫數學運算式

為了實現數學運算式的清晰溝通，GitHub 支援 Markdown 內以 LaTeX 格式設定的數學運算式。如需詳細資訊，請參閱 Wikibooks 中的 [LaTeX/Mathematics](http://en.wikibooks.org/wiki/LaTeX/Mathematics)。

GitHub 的數學渲染能力使用 MathJax；這是一個開源的基於 JavaScript 的顯示引擎。MathJax 支援廣泛的 LaTeX 巨集，以及幾個實用的無障礙擴充功能。如需詳細資訊，請參閱 [MathJax 文件](http://docs.mathjax.org/en/latest/input/tex/index.html#tex-and-latex-support)和 [MathJax 無障礙擴充功能文件](https://mathjax.github.io/MathJax-a11y/docs/#reader-guide)。

數學運算式渲染在 GitHub 議題、GitHub 討論、提取要求、維基 (Wiki) 和 Markdown 檔案中均可使用。

## 編寫行內運算式

有兩種選項可在您的文字中行內分隔數學運算式。您可以選擇使用錢字號 (`$`) 包圍運算式，或者以 <code>$\`</code> 開始運算式並以 <code>\`$</code> 結束。後者語法在您編寫的運算式包含與 markdown 語法重疊的字元時非常實用。如需詳細資訊，請參閱[基本寫作與格式設定語法](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)。

```text
此句子使用 `$` 分隔符號來顯示行內數學運算式：$\sqrt{3x-1}+(1+x)^2$
```

![呈現後的 Markdown 螢幕擷取畫面，顯示行內數學運算式：3x 減 1 的平方根加上 (1 加 x) 的平方。](https://docs.github.com/assets/images/help/writing/inline-math-markdown-rendering.png)

```text
此句子使用 $\` 和 \`$ 分隔符號來顯示行內數學運算式：$\`\sqrt{3x-1}+(1+x)^2`$
```

![呈現後的 Markdown 螢幕擷取畫面，顯示使用反引號語法的行內數學運算式：3x 減 1 的平方根加上 (1 加 x) 的平方。](https://docs.github.com/assets/images/help/writing/inline-backtick-math-markdown-rendering.png)

## 將運算式編寫為區塊

若要將數學運算式新增為區塊，請開始新的一行並使用兩個錢字號 `$$` 來分隔運算式。

> [!TIP] 如果您是在 .md 檔案中寫作，您需要使用特定的格式設定來建立換行，例如在行尾加上反斜線，如下例所示。如需有關 Markdown 換行的詳細資訊，請參閱[基本寫作與格式設定語法](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#line-breaks)。

```text
**柯西-史瓦茲不等式**\
$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$
```

![呈現後的 Markdown 螢幕擷取畫面，顯示一個複雜的方程式。粗體文字在不等式公式上方顯示為 「柯西-史瓦茲不等式」。](https://docs.github.com/assets/images/help/writing/math-expression-as-a-block-rendering.png)

或者，您可以使用 <code>\`\`\`math</code> 程式碼區塊語法來將數學運算式顯示為區塊。使用此語法，您不需要使用 `$$` 分隔符號。下方的呈現效果與上方相同：

````text
**柯西-史瓦茲不等式**

```math
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
```
````

## 在數學運算式同行及內部編寫錢字號

若要在與數學運算式相同的行中將錢字號顯示為字元，您需要逸出非分隔符號的 `$`，以確保該行正確渲染。

* 在數學運算式內部，請在明確的 `$` 前新增一個 `\` 符號。

  ```text
  此運算式使用 `\$` 來顯示錢字號：$`\sqrt{\$4}`$
  ```

  ![呈現後的 Markdown 螢幕擷取畫面，顯示錢字號前的反斜線如何將錢字號顯示為數學運算式的一部分。](https://docs.github.com/assets/images/help/writing/dollar-sign-within-math-expression.png)

* 在數學運算式外部但在同一行，請在明確的 `$` 周圍使用 span 標籤。

  ```text
  若要將 <span>$</span>100 平分，我們會計算 $100/2$
  ```

  ![呈現後的 Markdown 螢幕擷取畫面，顯示錢字號周圍的 span 標籤如何將錢字號顯示為行內文字，而非數學方程式的一部分。](https://docs.github.com/assets/images/help/writing/dollar-sign-inline-math-expression.png)

## 延伸閱讀

* [MathJax 網站](http://mathjax.org)
* [在 GitHub 上開始編寫與格式化](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github)
* [GitHub Flavored Markdown 規範](https://github.github.com/gfm/)
