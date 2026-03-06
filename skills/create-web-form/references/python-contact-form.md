# Python 聯絡表單參考

> 來源：<https://mailtrap.io/blog/python-contact-form/>

此參考涵蓋如何使用 Python 建構聯絡表單，包括建立 HTML 表單、使用 Flask 處理表單提交、使用 `smtplib` 傳送電子郵件以及驗證使用者輸入。

---

## 概觀

Python 聯絡表單通常涉及：

- 一個用於使用者輸入（姓名、電子郵件、訊息）的 **HTML 前端**
- 一個用於接收和處理表單資料的 **Python 後端**（通常使用 Flask 或 Django）
- 一個用於遞送提交表單內容的**電子郵件傳送機制**（使用 `smtplib` 或交易式電子郵件 API）
- **輸入驗證**，包含用戶端（HTML5 屬性）與伺服器端（Python 邏輯）

---

## 設定 Flask 專案

### 安裝 Flask

```bash
pip install Flask
```

### 基本專案結構

```
contact-form/
    app.py
    templates/
        contact.html
        success.html
    static/
        style.css
```

### 極簡 Flask 應用程式

```python
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('contact.html')

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 建立 HTML 聯絡表單

### 基本聯絡表單範本

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聯絡我們</title>
</head>
<body>
    <h1>聯絡我們</h1>
    <form method="POST" action="/contact">
        <div>
            <label for="name">姓名：</label>
            <input type="text" id="name" name="name" required />
        </div>
        <div>
            <label for="email">電子郵件：</label>
            <input type="email" id="email" name="email" required />
        </div>
        <div>
            <label for="subject">主旨：</label>
            <input type="text" id="subject" name="subject" required />
        </div>
        <div>
            <label for="message">訊息：</label>
            <textarea id="message" name="message" rows="5" required></textarea>
        </div>
        <button type="submit">傳送訊息</button>
    </form>
</body>
</html>
```

### 關鍵 HTML 表單屬性

| 屬性  | 描述 |
|------------|-------------|
| `method`   | HTTP 方法 -- 聯絡表單請使用 `POST` 以確保資料不會顯示在 URL 中 |
| `action`   | 處理表單資料的伺服器端點 (endpoint) |
| `required` | 強制執行用戶端驗證的 HTML5 屬性 |
| `name`     | 識別提交表單資料中每個欄位的名稱 |

---

## 在 Flask 中處理表單提交

### 處理 POST 請求

```python
from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = 'your-secret-key'

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')

        # 驗證輸入內容
        if not name or not email or not message:
            flash('請填寫所有必填欄位。', 'error')
            return redirect(url_for('contact'))

        # 傳送電子郵件
        send_email(name, email, subject, message)

        flash('您的訊息已成功傳送！', 'success')
        return redirect(url_for('contact'))

    return render_template('contact.html')
```

### 存取表單資料

Flask 提供 `request.form` 來存取提交的表單資料：

| 方法 | 描述 |
|--------|-------------|
| `request.form['key']` | 若索引鍵 (key) 缺失則引發 `KeyError` |
| `request.form.get('key')` | 若索引鍵缺失則傳回 `None`（較安全） |
| `request.form.get('key', 'default')` | 若索引鍵缺失則傳回預設值 |

---

## 使用 `smtplib` 傳送電子郵件

### 基本電子郵件傳送函式

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(name, email, subject, message):
    sender_email = "your-email@example.com"
    receiver_email = "recipient@example.com"
    password = "your-email-password"

    # 建立電子郵件訊息
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = f"聯絡表單： {subject}"

    # 電子郵件主體
    body = f"""
    收到新的聯絡表單提交：

    姓名： {name}
    電子郵件： {email}
    主旨： {subject}
    訊息： {message}
    """
    msg.attach(MIMEText(body, 'plain'))

    # 傳送電子郵件
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.send_message(msg)
    except Exception as e:
        print(f"傳送電子郵件時發生錯誤： {e}")
        raise
```

### 常見 SMTP 伺服器設定

| 提供商 | SMTP 伺服器 | 通訊埠 (TLS) | 通訊埠 (SSL) |
|----------|-------------|------------|------------|
| Gmail | `smtp.gmail.com` | 587 | 465 |
| Outlook | `smtp-mail.outlook.com` | 587 | -- |
| Yahoo | `smtp.mail.yahoo.com` | 587 | 465 |
| Mailtrap (測試用) | `sandbox.smtp.mailtrap.io` | 587 | 465 |

### 使用環境變數管理認證資訊

切勿硬編碼電子郵件認證資訊。請改用環境變數：

```python
import os

SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
```

---

## 伺服器端驗證

### 驗證表單輸入

```python
import re

def validate_contact_form(name, email, message):
    errors = []

    if not name or len(name.strip()) < 2:
        errors.append('姓名長度必須至少為 2 個字元。')

    if not email or not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        errors.append('請提供有效的電子郵件地址。')

    if not message or len(message.strip()) < 10:
        errors.append('訊息長度必須至少為 10 個字元。')

    return errors
```

### 將驗證整合至路由中

```python
@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        subject = request.form.get('subject', '').strip()
        message = request.form.get('message', '').strip()

        errors = validate_contact_form(name, email, message)

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('contact.html',
                                   name=name, email=email,
                                   subject=subject, message=message)

        send_email(name, email, subject, message)
        flash('訊息已成功傳送！', 'success')
        return redirect(url_for('contact'))

    return render_template('contact.html')
```

---

## 使用 Mailtrap 進行電子郵件測試

Mailtrap 提供一個安全的沙箱 SMTP 伺服器，用於在不將郵件寄送到真實收件匣的情況下測試電子郵件傳送功能。

### Mailtrap 設定

```python
import smtplib
from email.mime.text import MIMEText

def send_test_email(name, email, subject, message):
    sender = "from@example.com"
    receiver = "to@example.com"

    body = f"姓名： {name}
電子郵件： {email}
主旨： {subject}
訊息： {message}"

    msg = MIMEText(body)
    msg['Subject'] = f"聯絡表單： {subject}"
    msg['From'] = sender
    msg['To'] = receiver

    with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
        server.login("your_mailtrap_username", "your_mailtrap_password")
        server.sendmail(sender, receiver, msg.as_string())
```

---

## 使用 Flask-Mail 擴充功能

Flask-Mail 簡化了 Flask 應用程式中的電子郵件設定與傳送流程。

### 安裝與設定

```bash
pip install Flask-Mail
```

```python
from flask import Flask
from flask_mail import Mail, Message

app = Flask(__name__)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')

mail = Mail(app)
```

### 使用 Flask-Mail 傳送電子郵件

```python
@app.route('/contact', methods=['POST'])
def contact():
    name = request.form.get('name')
    email = request.form.get('email')
    subject = request.form.get('subject')
    message_body = request.form.get('message')

    msg = Message(
        subject=f"聯絡表單： {subject}",
        recipients=['admin@example.com'],
        reply_to=email
    )
    msg.body = f"寄件人： {name} ({email})

{message_body}"

    try:
        mail.send(msg)
        flash('訊息已成功傳送！', 'success')
    except Exception as e:
        flash('發生錯誤。請稍後再試。', 'error')

    return redirect(url_for('contact'))
```

---

## CSRF 防護

跨站請求偽造 (CSRF) 防護可防止惡意網站代表使用者提交表單。

### 使用 Flask-WTF 進行 CSRF 防護

```bash
pip install Flask-WTF
```

```python
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email

class ContactForm(FlaskForm):
    name = StringField('姓名', validators=[DataRequired()])
    email = StringField('電子郵件', validators=[DataRequired(), Email()])
    subject = StringField('主旨', validators=[DataRequired()])
    message = TextAreaField('訊息', validators=[DataRequired()])
    submit = SubmitField('傳送訊息')
```

在範本中包含 CSRF 權杖：

```html
<form method="POST" action="/contact">
    {{ form.hidden_tag() }}
    <!-- 表單欄位放在這裡 -->
</form>
```

---

## 完整範例應用程式

```python
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

def send_email(name, email, subject, message):
    sender = os.environ.get('MAIL_USERNAME')
    receiver = os.environ.get('MAIL_RECIPIENT')
    password = os.environ.get('MAIL_PASSWORD')

    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = receiver
    msg['Subject'] = f"聯絡表單： {subject}"

    body = f"姓名： {name}
電子郵件： {email}
主旨： {subject}

{message}"
    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP(os.environ.get('SMTP_SERVER', 'smtp.gmail.com'), 587) as server:
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)

@app.route('/')
def home():
    return redirect(url_for('contact'))

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        subject = request.form.get('subject', '').strip()
        message = request.form.get('message', '').strip()

        if not all([name, email, message]):
            flash('請填寫所有必填欄位。', 'error')
            return render_template('contact.html')

        try:
            send_email(name, email, subject, message)
            flash('您的訊息已傳送！', 'success')
        except Exception:
            flash('訊息傳送失敗。請再試一次。', 'error')

        return redirect(url_for('contact'))

    return render_template('contact.html')

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 關鍵重點

1. **使用 Flask** 作為輕量級 Python 網頁框架，透過 `request.form` 處理聯絡表單提交。
2. **使用 `smtplib`** 或 **Flask-Mail** 從聯絡表單傳送電子郵件。
3. **驗證輸入內容**，包含用戶端（HTML5 `required`, `type="email"`）與伺服器端（Python 規則運算式、長度檢查）。
4. **切勿硬編碼認證資訊** -- 請使用環境變數或 `.env` 檔案。
5. **使用 Mailtrap** 或類似服務進行電子郵件遞送測試，避免傳送到真實收件匣。
6. **加入 CSRF 防護**：使用 Flask-WTF 防範跨站請求偽造攻擊。
7. **快閃訊息 (Flash messages)** 為成功的提交與驗證錯誤提供使用者回饋。
8. **使用 `MIMEMultipart`** 建構包含標頭與主體內容的格式良好電子郵件訊息。
