# Python Flask 表單參考

> 來源：<https://testdriven.io/courses/learn-flask/forms/>

此參考涵蓋如何在 Flask 中處理表單，包括處理 GET 與 POST 請求、使用 WTForms 進行表單建立與驗證、實作 CSRF 防護以及管理檔案上傳。

---

## 概觀

Flask 透過以下工具提供處理網頁表單的功能：

- 用於存取提交表單資料的 `request` 物件
- **Flask-WTF** 與 **WTForms**，用於宣告式表單建立、驗證及 CSRF 防護
- 用於轉譯表單 HTML 的 Jinja2 範本
- 用於使用者回饋的快閃訊息 (Flash messages)

---

## Flask 中的基本表單處理

### 處理 GET 與 POST 請求

```python
from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = 'your-secret-key'

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if username == 'admin' and password == 'secret':
            flash('登入成功！', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('無效的認證資訊。', 'error')

    return render_template('login.html')
```

### `request.form` 物件

`request.form` 是一個 `ImmutableMultiDict`，包含來自 POST 與 PUT 請求的已解析表單資料。

| 方法 | 描述 |
|--------|-------------|
| `request.form['key']` | 存取值；若缺失則引發 `400 Bad Request` |
| `request.form.get('key')` | 存取值；若缺失則傳回 `None` |
| `request.form.get('key', 'default')` | 存取值，並提供後備預設值 |
| `request.form.getlist('key')` | 傳回該鍵的所有值清單（用於多選欄位） |

### `request.method` 屬性

用於區分 GET（顯示表單）與 POST（處理提交）：

```python
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # 處理表單提交
        pass
    # GET：顯示表單
    return render_template('register.html')
```

---

## Flask-WTF 與 WTForms

### 安裝

```bash
pip install Flask-WTF
```

Flask-WTF 是一個整合了 WTForms 的 Flask 擴充功能。它提供：

- 開箱即用的 CSRF 防護
- 與 Flask `request` 物件的整合
- Jinja2 範本協助程式
- 檔案上傳支援

### 設定

```python
from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # CSRF 必要設定
app.config['WTF_CSRF_ENABLED'] = True          # 預設為啟用
```

---

## 使用 WTForms 定義表單

### 基本表單類別

```python
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo

class RegistrationForm(FlaskForm):
    username = StringField('使用者名稱', validators=[
        DataRequired(),
        Length(min=3, max=25)
    ])
    email = StringField('電子郵件', validators=[
        DataRequired(),
        Email()
    ])
    password = PasswordField('密碼', validators=[
        DataRequired(),
        Length(min=6)
    ])
    confirm_password = PasswordField('確認密碼', validators=[
        DataRequired(),
        EqualTo('password', message='密碼必須相符。')
    ])
    submit = SubmitField('註冊')
```

### 常見欄位類型

| 欄位類型 | 描述 |
|-----------|-------------|
| `StringField` | 單行文字輸入 |
| `PasswordField` | 密碼輸入（隱藏字元） |
| `TextAreaField` | 多行文字輸入 |
| `IntegerField` | 具有內建型別強制轉換的整數輸入 |
| `FloatField` | 具有內建型別強制轉換的浮點數輸入 |
| `BooleanField` | 核取方塊 (True/False) |
| `SelectField` | 下拉式選取選單 |
| `SelectMultipleField` | 多選下拉式選單 |
| `RadioField` | 選項按鈕群組 |
| `FileField` | 檔案上傳輸入 |
| `HiddenField` | 隱藏輸入欄位 |
| `SubmitField` | 提交按鈕 |
| `DateField` | 日期選取器輸入 |

### 常見驗證程式 (Validators)

| 驗證程式 | 描述 |
|-----------|-------------|
| `DataRequired()` | 欄位不能為空 |
| `Email()` | 必須是有效的電子郵件格式 |
| `Length(min, max)` | 字串長度必須在範圍內 |
| `EqualTo('field')` | 必須與另一個欄位的值相符 |
| `NumberRange(min, max)` | 數值必須在範圍內 |
| `Regexp(regex)` | 必須與提供的規則運算式相符 |
| `URL()` | 必須是有效的 URL |
| `Optional()` | 允許欄位為空 |
| `InputRequired()` | 必須存在原始輸入資料 |
| `AnyOf(values)` | 必須是提供的值之一 |
| `NoneOf(values)` | 不能是提供的任何值 |

---

## 在路由中使用表單

### 帶有 WTForms 的路由

```python
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()

    if form.validate_on_submit():
        # form.validate_on_submit() 檢查：
        # 1. 請求方法是否為 POST？
        # 2. 表單是否通過所有驗證？
        # 3. CSRF 權杖是否有效？

        username = form.username.data
        email = form.email.data
        password = form.password.data

        # 處理資料（例如：儲存至資料庫）
        flash(f'已為 {username} 建立帳號！', 'success')
        return redirect(url_for('login'))

    return render_template('register.html', form=form)
```

### `validate_on_submit()` 方法

此方法結合了兩項檢查：

1. `request.method == 'POST'` -- 確保表單確實已提交
2. `form.validate()` -- 執行表單欄位上的所有驗證程式並檢查 CSRF 權杖 (token)

僅當兩項條件皆滿足時才傳回 `True`。

---

## 在範本中轉譯表單

### 基本範本轉譯

```html
<form method="POST" action="{{ url_for('register') }}">
    {{ form.hidden_tag() }}

    <div>
        {{ form.username.label }}
        {{ form.username(class="form-control", placeholder="輸入使用者名稱") }}
        {% for error in form.username.errors %}
            <span class="error">{{ error }}</span>
        {% endfor %}
    </div>

    <div>
        {{ form.email.label }}
        {{ form.email(class="form-control", placeholder="輸入電子郵件") }}
        {% for error in form.email.errors %}
            <span class="error">{{ error }}</span>
        {% endfor %}
    </div>

    <div>
        {{ form.password.label }}
        {{ form.password(class="form-control") }}
        {% for error in form.password.errors %}
            <span class="error">{{ error }}</span>
        {% endfor %}
    </div>

    <div>
        {{ form.confirm_password.label }}
        {{ form.confirm_password(class="form-control") }}
        {% for error in form.confirm_password.errors %}
            <span class="error">{{ error }}</span>
        {% endfor %}
    </div>

    {{ form.submit(class="btn btn-primary") }}
</form>
```

### 關鍵範本元件

| 元件 | 用途 |
|---------|---------|
| `{{ form.hidden_tag() }}` | 轉譯隱藏的 CSRF 權杖欄位 |
| `{{ form.field.label }}` | 為欄位轉譯 `<label>` 元件 |
| `{{ form.field() }}` | 為欄位轉譯 `<input>` 元件 |
| `{{ form.field(class="...") }}` | 轉譯帶有額外 HTML 屬性的輸入項 |
| `{{ form.field.errors }}` | 欄位的驗證錯誤訊息清單 |
| `{{ form.field.data }}` | 欄位的目前值 |

---

## CSRF 防護

### CSRF 防護如何運作

Flask-WTF 會自動包含 CSRF 防護：

1. 每個工作階段會產生一個唯一的權杖，並嵌入為隱藏表單欄位。
2. 提交表單時，Flask-WTF 會驗證該權杖是否與工作階段權杖相符。
3. 如果權杖缺失或無效，請求將被拒絕並傳回 `400 Bad Request`。

### 包含 CSRF 權杖

在您的範本中，請務必包含以下其中一項：

```html
<!-- 選項 1：隱藏標籤（包含 CSRF 及所有隱藏欄位） -->
{{ form.hidden_tag() }}

<!-- 選項 2：僅包含 CSRF 權杖 -->
{{ form.csrf_token }}
```

### AJAX 請求的 CSRF

對於以 JavaScript 為基礎的表單提交：

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

```javascript
fetch('/api/submit', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify(data)
});
```

---

## 自訂驗證程式

### 內嵌自訂驗證程式

在表單類別上定義一個命名模式為 `validate_<fieldname>` 的方法：

```python
from wtforms import ValidationError

class RegistrationForm(FlaskForm):
    username = StringField('使用者名稱', validators=[DataRequired()])
    email = StringField('電子郵件', validators=[DataRequired(), Email()])

    def validate_username(self, field):
        if field.data.lower() in ['admin', 'root', 'superuser']:
            raise ValidationError('該使用者名稱已被保留。')

    def validate_email(self, field):
        # 檢查資料庫中是否已存在該電子郵件
        if User.query.filter_by(email=field.data).first():
            raise ValidationError('該電子郵件已註冊。')
```

### 可重複使用的自訂驗證程式

```python
from wtforms import ValidationError

def validate_no_special_chars(form, field):
    if not field.data.isalnum():
        raise ValidationError('欄位只能包含字母和數字。')

class MyForm(FlaskForm):
    username = StringField('使用者名稱', validators=[
        DataRequired(),
        validate_no_special_chars
    ])
```

---

## 檔案上傳

### 帶有檔案上傳的表單

```python
from flask_wtf.file import FileField, FileAllowed, FileRequired

class UploadForm(FlaskForm):
    photo = FileField('個人資料相片', validators=[
        FileRequired(),
        FileAllowed(['jpg', 'png', 'gif'], '僅限影像檔案！')
    ])
    submit = SubmitField('上傳')
```

### 在路由中處理檔案上傳

```python
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'static/uploads'

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    form = UploadForm()

    if form.validate_on_submit():
        file = form.photo.data
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        flash('檔案上傳成功！', 'success')
        return redirect(url_for('upload'))

    return render_template('upload.html', form=form)
```

### 多部分表單編碼 (Multipart Form Encoding)

檔案上傳表單必須使用 `enctype="multipart/form-data"`：

```html
<form method="POST" enctype="multipart/form-data">
    {{ form.hidden_tag() }}
    {{ form.photo.label }}
    {{ form.photo() }}
    {{ form.submit() }}
</form>
```

---

## 快閃訊息 (Flash Messages)

### 設定快閃訊息

```python
from flask import flash

flash('操作成功！', 'success')
flash('發生錯誤。', 'error')
flash('請檢查您的輸入。', 'warning')
```

### 在範本中顯示快閃訊息

```html
{% with messages = get_flashed_messages(with_categories=true) %}
    {% if messages %}
        {% for category, message in messages %}
            <div class="alert alert-{{ category }}">
                {{ message }}
            </div>
        {% endfor %}
    {% endif %}
{% endwith %}
```

---

## 關鍵重點

1. **使用 Flask-WTF** 處理表單 -- 它提供 CSRF 防護、驗證以及簡潔的表單定義。
2. **`validate_on_submit()`** 是同時檢查提交與驗證的主要方法。
3. **務必在範本中包含 `{{ form.hidden_tag() }}`** 以啟用 CSRF 防護。
4. **使用 WTForms 驗證程式** 進行簡潔、宣告式的伺服器端驗證。
5. **自訂驗證程式** 可以定義在表單類別內部，或作為可重複使用的函式。
6. **快閃訊息** 為表單動作提供使用者回饋。
7. **檔案上傳** 需要 `enctype="multipart/form-data"` 並應使用 `secure_filename()` 以確保安全。
8. **在 Flask 設定中設定 `SECRET_KEY`** -- 這是 CSRF 權杖和工作階段管理所必需的。
