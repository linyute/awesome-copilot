# Python Flask 應用程式參考

> 來源：<https://realpython.com/python-web-applications/>

此參考涵蓋建構 Python 網頁應用程式，包括網頁運作原理、選擇框架、建構與部署 Flask 應用程式，以及理解關鍵的網頁開發概念。

---

## 概觀

Python 提供多種網頁開發方法：

- **網頁框架** (Flask, Django, FastAPI)，負責處理路由、範本和資料
- **代管平台** (Google App Engine, PythonAnywhere, Heroku 等)，用於部署
- **WSGI** (網頁伺服器閘道介面, Web Server Gateway Interface)，作為網頁伺服器與 Python 應用程式之間的標準介面

---

## 網頁如何運作

### HTTP 請求-回應週期

1. 用戶端（瀏覽器）向伺服器發送 **HTTP 請求**
2. 伺服器處理請求並傳回 **HTTP 回應**
3. 瀏覽器轉譯回應內容

### HTTP 方法

| 方法 | 用途 |
|--------|---------|
| `GET` | 從伺服器擷取資料 |
| `POST` | 向伺服器提交資料 |
| `PUT` | 更新伺服器上的現有資料 |
| `DELETE` | 從伺服器移除資料 |

### URL 結構

```
https://example.com:443/path/to/resource?key=value#section
  |         |        |        |              |        |
通訊協定     主機     通訊埠     路徑           查詢字串   片段
```

---

## 選擇 Python 網頁框架

### Flask

- **微框架 (Micro-framework)** -- 核心極簡，透過擴充功能增加功能
- 最適合中小型應用程式、API 和學習
- 內建無資料庫抽象層、表單驗證或其他元件
- 提供各種功能的擴充功能（SQLAlchemy, WTForms, Login 等）

### Django

- **全功能框架 (Full-stack framework)** -- 內建完整功能 (batteries included)
- 最適合具有內建 ORM、管理後台、身分驗證的大型應用程式
- 具有固定的專案結構

### FastAPI

- **現代、快速、非同步框架** -- 建構於 Starlette 和 Pydantic 之上
- 最適合建構具有自動文件的 API
- 內建資料驗證與序列化

---

## 建構 Flask 應用程式

### 安裝

```bash
python -m pip install flask
```

### 極簡應用程式

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 執行應用程式

```bash
# 方法 1：直接執行
python app.py

# 方法 2：使用 Flask CLI
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

---

## 路由

### 基本路由

```python
@app.route('/')
def home():
    return '首頁'

@app.route('/about')
def about():
    return '關於頁面'

@app.route('/contact')
def contact():
    return '聯絡頁面'
```

### 帶有 URL 參數的動態路由

```python
@app.route('/user/<username>')
def show_user(username):
    return f'使用者: {username}'

@app.route('/post/<int:post_id>')
def show_post(post_id):
    return f'文章 ID: {post_id}'
```

### URL 轉換器 (Converters)

| 轉換器 | 描述 |
|-----------|-------------|
| `string` | 接受任何不含斜線的文字（預設） |
| `int` | 接受正整數 |
| `float` | 接受正浮點數 |
| `path` | 類似 `string` 但也接受斜線 |
| `uuid` | 接受 UUID 字串 |

### 指定 HTTP 方法

```python
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return do_login()
    return show_login_form()
```

---

## 使用 Jinja2 建立範本

### 基本範本轉譯

```python
from flask import render_template

@app.route('/hello/<name>')
def hello(name):
    return render_template('hello.html', name=name)
```

### 範本繼承

**基礎範本 (`templates/base.html`):**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>{% block title %}我的應用程式{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
    <nav>
        <a href="{{ url_for('home') }}">首頁</a>
        <a href="{{ url_for('about') }}">關於</a>
    </nav>

    <main>
        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>我的網頁應用程式</p>
    </footer>
</body>
</html>
```

**子範本 (`templates/home.html`):**

```html
{% extends "base.html" %}

{% block title %}首頁{% endblock %}

{% block content %}
    <h1>歡迎來到我的應用程式</h1>
    <p>這是首頁。</p>
{% endblock %}
```

### Jinja2 範本語法

| 語法 | 用途 |
|--------|---------|
| `{{ variable }}` | 輸出變數的值 |
| `{% statement %}` | 執行控制流程語句 |
| `{# comment #}` | 範本註解（不轉譯） |
| `{{ url_for('func') }}` | 為檢視函式產生 URL |
| `{{ url_for('static', filename='style.css') }}` | 為靜態檔案產生 URL |

### 範本中的控制流程

```html
{% if user %}
    <h1>哈囉, {{ user.name }}!</h1>
{% else %}
    <h1>哈囉, 陌生人!</h1>
{% endif %}

<ul>
{% for item in items %}
    <li>{{ item }}</li>
{% endfor %}
</ul>
```

---

## 專案結構

### 建議的 Flask 專案佈局

```
my_flask_app/
    app.py                  # 應用程式進入點
    config.py               # 設定檔
    requirements.txt        # Python 相依項
    static/                 # 靜態檔案 (CSS, JS, 影像)
        style.css
        script.js
    templates/              # Jinja2 HTML 範本
        base.html
        home.html
        about.html
    models.py               # 資料庫模型 (若有使用資料庫)
    forms.py                # WTForms 表單類別
```

### 大型應用程式結構 (Blueprints)

```
my_flask_app/
    app/
        __init__.py         # 應用程式工廠
        models.py
        auth/
            __init__.py
            routes.py
            forms.py
            templates/
                login.html
                register.html
        main/
            __init__.py
            routes.py
            templates/
                home.html
                about.html
    config.py
    requirements.txt
    run.py
```

---

## 處理靜態檔案

Flask 會自動提供 `static/` 目錄中的檔案。

### 在範本中參照靜態檔案

```html
<link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
<script src="{{ url_for('static', filename='script.js') }}"></script>
<img src="{{ url_for('static', filename='images/logo.png') }}" alt="Logo">
```

---

## 資料庫整合

### 使用 Flask-SQLAlchemy

```bash
pip install Flask-SQLAlchemy
```

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'
```

### 建立資料庫

```python
with app.app_context():
    db.create_all()
```

---

## 部署

### 部署至 PythonAnywhere

1. 在 pythonanywhere.com 建立免費帳號
2. 透過 git 或檔案瀏覽器上傳您的程式碼
3. 設定虛擬環境並安裝相依項
4. 設定指向您的 Flask 應用程式的 WSGI 檔案
5. 重新載入網頁應用程式

### 部署至 Heroku

1. 建立 `Procfile`：

```
web: gunicorn app:app
```

1. 建立 `requirements.txt`：

```bash
pip freeze > requirements.txt
```

1. 部署：

```bash
heroku create
git push heroku main
```

### 部署至 Google App Engine

建立 `app.yaml` 設定：

```yaml
runtime: python39
entrypoint: gunicorn -b :$PORT app:app

handlers:
  - url: /static
    static_dir: static
  - url: /.*
    script: auto
```

### WSGI 伺服器

在生產環境中，請使用 WSGI 伺服器而非 Flask 內建的開發伺服器：

| 伺服器 | 描述 |
|--------|-------------|
| **Gunicorn** | 適用於 Unix 的生產級 WSGI 伺服器 |
| **Waitress** | 適用於 Windows 和 Unix 的生產級 WSGI 伺服器 |
| **uWSGI** | 功能齊全且具備多種部署選項的 WSGI 伺服器 |

```bash
# 使用 Gunicorn
pip install gunicorn
gunicorn app:app

# 使用 Waitress
pip install waitress
waitress-serve --port=5000 app:app
```

---

## 環境設定

### 使用環境變數

```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-fallback-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
    DEBUG = os.environ.get('FLASK_DEBUG', False)
```

### 使用 python-dotenv

```bash
pip install python-dotenv
```

建立 `.env` 檔案：

```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///site.db
FLASK_DEBUG=1
```

在應用程式中載入：

```python
from dotenv import load_dotenv
load_dotenv()
```

---

## 關鍵重點

1. **Flask 是一個微框架** -- 它提供路由、範本和請求處理，同時將其他選擇（資料庫、表單、身分驗證）留給擴充功能。
2. **使用 Jinja2 範本繼承**，透過基礎範本和子區塊保持 HTML 的簡潔 (DRY)。
3. **組織您的專案**：採用清晰的結構，分離 `templates/`、`static/` 和 Python 模組。
4. **使用 Blueprints** 處理較大型的應用程式，以將相關路由和範本分組。
5. **切勿在生產環境中使用 Flask 開發伺服器** -- 請使用 Gunicorn、Waitress 或 uWSGI。
6. **將設定儲存在環境變數中**，使用 `python-dotenv` 或平台特定的設定。
7. **使用 `url_for()`** 動態產生 URL，而非硬編碼路徑。
8. **Flask-SQLAlchemy** 為資料庫操作提供方便的 ORM 層。
9. **多個代管平台**支援 Flask 應用程式：PythonAnywhere、Heroku、Google App Engine 等。
