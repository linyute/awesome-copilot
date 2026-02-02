# 數學運算式轉換為 HTML

## 編寫行內運算式

### Markdown

```markdown
此句子使用 `$` 分隔符號來顯示行內數學運算式：$\sqrt{3x-1}+(1+x)^2$
```

### 剖析後的 HTML

```html
<p>此句子使用 <code>$</code> 分隔符號來顯示行內數學運算式：
 <math-renderer><math xmlns="http://www.w3.org/1998/Math/MathML">
  <msqrt>
   <mn>3</mn>
   <mi>x</mi>
   <mo>−</mo>
   <mn>1</mn>
  </msqrt>
  <mo>+</mo>
  <mo>(</mo>
  <mn>1</mn>
  <mo>+</mo>
  <mi>x</mi>
  <msup>
   <mo>)</mo>
   <mn>2</mn>
  </msup>
</math>
</math-renderer>
</p>
```

### Markdown

```markdown
此句子使用 $\` 和 `\$` 分隔符號來顯示行內數學運算式：$`\sqrt{3x-1}+(1+x)^2`$
```

### 剖析後的 HTML

```html
<p>此句子使用
 <math-renderer>
  <math xmlns="http://www.w3.org/1998/Math/MathML">
   <mo>‘</mo>
   <mi>a</mi>
   <mi>n</mi>
   <mi>d</mi>
   <mo>‘</mo>
  </math>
 </math-renderer> 分隔符號來顯示行內數學運算式：
 <math-renderer>
  <math xmlns="http://www.w3.org/1998/Math/MathML">
   <msqrt>
    <mn>3</mn>
    <mi>x</mi>
    <mo>−</mo>
    <mn>1</mn>
   </msqrt>
   <mo>+</mo>
   <mo stretchy="false">(</mo>
   <mn>1</mn>
   <mo>+</mo>
   <mi>x</mi>
   <msup>
    <mo stretchy="false">)</mo>
    <mn>2</mn>
   </msup>
  </math>
 </math-renderer>
</p>
```

---

## 編寫區塊運算式

### Markdown

```markdown
**柯西-史瓦茲不等式**\
$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$
```

### 剖析後的 HTML

```html
<p>
  <strong>柯西-史瓦茲不等式</strong><br>
  <math-renderer>
    <math xmlns="http://www.w3.org/1998/Math/MathML">
      <msup>
        <mrow>
          <mo>(</mo>
          <munderover>
            <mo>∑</mo>
            <mrow>
              <mi>k</mi>
              <mo>=</mo>
              <mn>1</mn>
            </mrow>
            <mi>n</mi>
          </munderover>
          <msub>
            <mi>a</mi>
            <mi>k</mi>
          </msub>
          <msub>
            <mi>b</mi>
            <mi>k</mi>
          </msub>
          <mo>)</mo>
        </mrow>
        <mn>2</mn>
      </msup>
      <mo>≤</mo>
      <mrow>
        <mo>(</mo>
        <munderover>
          <mo>∑</mo>
          <mrow>
            <mi>k</mi>
            <mo>=</mo>
            <mn>1</mn>
          </mrow>
          <mi>n</mi>
        </munderover>
        <msubsup>
          <mi>a</mi>
          <mi>k</mi>
          <mn>2</mn>
        </msubsup>
        <mo>)</mo>
      </mrow>
      <mrow>
        <mo>(</mo>
        <munderover>
          <mo>∑</mo>
          <mrow>
            <mi>k</mi>
            <mo>=</mo>
            <mn>1</mn>
          </mrow>
          <mi>n</mi>
        </munderover>
        <msubsup>
          <mi>b</mi>
          <mi>k</mi>
          <mn>2</mn>
        </msubsup>
        <mo>)</mo>
      </mrow>
    </math>
  </math-renderer>
</p>
```

### Markdown

```markdown
**柯西-史瓦茲不等式**

    ```math
    \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
    ```
```

### 剖析後的 HTML

```html
<p><strong>柯西-史瓦茲不等式</strong></p>

<math-renderer>
  <math xmlns="http://www.w3.org/1998/Math/MathML">
    <msup>
      <mrow>
        <mo>(</mo>
        <munderover>
          <mo>∑</mo>
          <mrow>
            <mi>k</mi>
            <mo>=</mo>
            <mn>1</mn>
          </mrow>
          <mi>n</mi>
        </munderover>
        <msub>
          <mi>a</mi>
          <mi>k</mi>
        </msub>
        <msub>
          <mi>b</mi>
          <mi>k</mi>
        </msub>
        <mo>)</mo>
      </mrow>
      <mn>2</mn>
    </msup>
    <mo>≤</mo>
    <mrow>
      <mo>(</mo>
      <munderover>
        <mo>∑</mo>
        <mrow>
          <mi>k</mi>
          <mo>=</mo>
          <mn>1</mn>
        </mrow>
        <mi>n</mi>
      </munderover>
      <msubsup>
        <mi>a</mi>
        <mi>k</mi>
        <mn>2</mn>
      </msubsup>
      <mo>)</mo>
    </mrow>
    <mrow>
      <mo>(</mo>
      <munderover>
        <mo>∑</mo>
        <mrow>
          <mi>k</mi>
          <mo>=</mo>
          <mn>1</mn>
        </mrow>
        <mi>n</mi>
      </munderover>
      <msubsup>
        <mi>b</mi>
        <mi>k</mi>
        <mn>2</mn>
      </msubsup>
      <mo>)</mo>
    </mrow>
  </math>
</math-renderer>
```

### Markdown

```markdown
方程式 $a^2 + b^2 = c^2$ 是畢氏定理。
```

### 剖析後的 HTML

```html
<p>方程式
 <math-renderer><math xmlns="http://www.w3.org/1998/Math/MathML">
  <msup>
    <mi>a</mi>
    <mn>2</mn>
  </msup>
  <mo>+</mo>
  <msup>
    <mi>b</mi>
    <mn>2</mn>
  </msup>
  <mo>=</mo>
  <msup>
    <mi>c</mi>
    <mn>2</mn>
  </msup>
 </math></math-renderer> 是畢氏定理。
</p>
```

### Markdown

```
$$ 
\int_0^\infty e^{-x} dx = 1
$$ 
```

### 剖析後的 HTML

```html
<p><math-renderer><math xmlns="http://www.w3.org/1998/Math/MathML">
  <msubsup>
    <mo>∫</mo>
    <mn>0</mn>
    <mi>∞</mi>
  </msubsup>
  <msup>
    <mi>e</mi>
    <mrow>
      <mo>−</mo>
      <mi>x</mi>
    </mrow>
  </msup>
  <mi>d</mi>
  <mi>x</mi>
  <mo>=</mo>
  <mn>1</mn>
</math></math-renderer></p>
```

---

## 在數學運算式中行內包含錢字號

### Markdown

```markdown
此運算式使用 `\$` 來顯示錢字號：$`\sqrt{\$4}`$
```

### 剖析後的 HTML

```html
<p>此運算式使用
 <code>\$</code> 來顯示錢字號：
 <math-renderer>
  <math xmlns="http://www.w3.org/1998/Math/MathML">
   <msqrt>
    <mi>$</mi>
    <mn>4</mn>
   </msqrt>
  </math>
 </math-renderer>
</p>
```

### Markdown

```markdown
若要將 <span>$</span>100 平分，我們會計算 $100/2$
```

### 剖析後的 HTML

```html
<p>若要將
 <span>$</span>100 平分，我們會計算
 <math-renderer>
  <math xmlns="http://www.w3.org/1998/Math/MathML">
   <mn>100</mn>
   <mrow data-mjx-texclass="ORD">
    <mo>/</mo>
   </mrow>
   <mn>2</mn>
  </math>
 </math-renderer>
</p>
```
