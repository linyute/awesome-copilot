# Python 作為網頁框架參考

> 來源：<https://www.topcoder.com/thrive/articles/python-as-web-framework-the-flask-basics>

此參考涵蓋透過 Flask 將 Python 作為網頁框架使用，包括設定、路由、範本、請求與回應處理、表單處理以及建構實用的網頁應用程式。

---

## 概觀

Flask 是一個用 Python 編寫的輕量級 **WSGI** (網頁伺服器閘道介面, Web Server Gateway Interface) 網頁框架。它被歸類為微框架 (micro-framework)，因為它不需要特定的工具或函式庫。Flask 沒有資料庫抽象層、表單驗證或任何其他已有第三方函式庫提供常見功能的元件。

### 為什麼選擇 Flask？

- **輕量且模組化** -- 僅包含您需要的內容
- **易於學習** -- 啟動所需的樣板程式碼極少
- **靈活** -- 不強制要求專案結構或相依性
- **可擴充** -- 擁有豐富的擴充功能生態系統，可增加功能
- **文件齊全** 且擁有活躍的社群
- **內建開發伺服器** 與偵錯工具

---

## 安裝與設定

### 先決條件

- Python 3.7+
- pip (Python 套件管理員)

### 安裝 Flask

```bash
pip install flask
```

### 驗證安裝

```python
import flask
print(flask.__version__)
```

### 虛擬環境 (建議)

```bash
# 建立虛擬環境
python -m venv venv

# 啟用 (Linux/macOS)
source venv/bin/activate

# 啟用 (Windows)
venv\Scripts\activate

# 在虛擬環境中安裝 Flask
pip install flask
```

---

## 建立基本的 Flask 應用程式

### Hello World

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return '<h1>Hello, World!</h1>'

if __name__ == '__main__':
    app.run(debug=True)
```

### 理解程式碼

| 元件 | 用途 |
|-----------|---------|
| `Flask(__name__)` | 建立 Flask 應用程式實例；`__name__` 協助 Flask 定位資源 |
| `@app.route('/')` | 一個將 URL 路徑對應到 Python 函式的裝飾器 |
| `app.run(debug=True)` | 啟動開發伺服器，並具備自動重新載入與偵錯工具 |

### 執行應用程式

```bash
python app.py
```

預設情況下，應用程式執行於 `http://127.0.0.1:5000/`。

### 偵錯模式 (Debug Mode)

偵錯模式提供：

- **自動重新載入器 (Auto-reloader)** -- 在程式碼變更時重新啟動伺服器
- **互動式偵錯工具** -- 在瀏覽器中顯示回溯 (traceback)，並附帶互動式 Python 主控台
- **詳細的錯誤頁面** -- 顯示完整的錯誤詳細資訊，而非通用的「500 Internal Server Error」

**警告：** 切勿在生產環境中啟用偵錯模式 -- 這會允許執行任意程式碼。

---

## 路由

### 基本路由

```python
@app.route('/')
def index():
    return '首頁'

@app.route('/hello')
def hello():
    return 'Hello, World!'

@app.route('/about')
def about():
    return '關於頁面'
```

### 變數規則（動態 URL）

```python
@app.route('/user/<username>')
def show_user_profile(username):
    return f'使用者: {username}'

@app.route('/post/<int:post_id>')
def show_post(post_id):
    return f'文章 {post_id}'

@app.route('/path/<path:subpath>')
def show_subpath(subpath):
    return f'子路徑: {subpath}'
```

### URL 轉換器 (Converters)

| 轉換器 | 描述 | 範例 |
|-----------|-------------|---------|
| `string` | 接受任何不含斜線的文字（預設） | `/user/<username>` |
| `int` | 接受正整數 | `/post/<int:post_id>` |
| `float` | 接受正浮點數 | `/price/<float:amount>` |
| `path` | 接受包含斜線的文字 | `/file/<path:filepath>` |
| `uuid` | 接受 UUID 字串 | `/item/<uuid:item_id>` |

### 使用 `url_for()` 建立 URL

```python
from flask import url_for

@app.route('/')
def index():
    return '索引'

@app.route('/login')
def login():
    return '登入'

@app.route('/user/<username>')
def profile(username):
    return f'{username} 的個人檔案'

# 用法：
with app.test_request_context():
    print(url_for('index'))                  # /
    print(url_for('login'))                  # /login
    print(url_for('profile', username='John'))  # /user/John
```

### HTTP 方法

```python
from flask import request

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return do_the_login()
    else:
        return show_the_login_form()
```

---

## 使用 Jinja2 建立範本

Flask 使用 Jinja2 範本引擎來轉譯 HTML。

### 轉譯範本

```python
from flask import render_template

@app.route('/hello/')
@app.route('/hello/<name>')
def hello(name=None):
    return render_template('hello.html', name=name)
```

### 範本檔案 (`templates/hello.html`)

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <title>哈囉</title>
</head>
<body>
    {% if name %}
        <h1>哈囉, {{ name }}!</h1>
    {% else %}
        <h1>Hello, World!</h1>
    {% endif %}
</body>
</html>
```

### 範本語法

| 語法 | 用途 | 範例 |
|--------|---------|---------|
| `{{ ... }}` | 表達式輸出 | `{{ user.name }}` |
| `{% ... %}` | 語句（控制流程） | `{% if user %}...{% endif %}` |
| `{# ... #}` | 註解（不轉譯） | `{# 這是註解 #}` |

### 範本繼承

**基礎範本 (`base.html`):**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <title>{% block title %}預設標題{% endblock %}</title>
</head>
<body>
    <header>
        {% block header %}
            <h1>我的網站</h1>
        {% endblock %}
    </header>

    <main>
        {% block content %}{% endblock %}
    </main>

    <footer>
        {% block footer %}
            <p>頁尾內容</p>
        {% endblock %}
    </footer>
</body>
</html>
```

**子範本 (`home.html`):**

```html
{% extends "base.html" %}

{% block title %}首頁{% endblock %}

{% block content %}
    <h2>歡迎！</h2>
    <p>這是首頁。</p>
{% endblock %}
```

### 迴圈與條件判斷

```html
<!-- For 迴圈 -->
<ul>
{% for item in navigation %}
    <li><a href="{{ item.href }}">{{ item.caption }}</a></li>
{% endfor %}
</ul>

<!-- 條件判斷 -->
{% if users %}
    <ul>
    {% for user in users %}
        <li>{{ user.username }}</li>
    {% endfor %}
    </ul>
{% else %}
    <p>找不到使用者。</p>
{% endif %}
```

---

## 請求與回應

### Request 物件

```python
from flask import request

@app.route('/login', methods=['POST', 'GET'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if valid_login(username, password):
            return log_the_user_in(username)
        else:
            error = '無效的使用者名稱/密碼'

    return render_template('login.html', error=error)
```

### Request 物件屬性

| 屬性 | 描述 |
|-----------|-------------|
| `request.method` | HTTP 方法（GET、POST 等） |
| `request.form` | 來自 POST/PUT 請求的表單資料 |
| `request.args` | URL 查詢字串參數 |
| `request.files` | 上傳的檔案 |
| `request.cookies` | 請求 Cookie |
| `request.headers` | 請求標頭 |
| `request.json` | 已解析的 JSON 資料（若內容類型為 JSON） |
| `request.data` | 原始請求資料（位元組形式） |
| `request.url` | 請求的完整 URL |
| `request.path` | URL 路徑（不含查詢字串） |

### 查詢字串參數

```python
# URL: /search?q=flask&page=2
@app.route('/search')
def search():
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    return f'搜尋內容: {query}, 頁碼: {page}'
```

### 回應 (Responses)

```python
from flask import make_response, jsonify

# 簡單的字串回應
@app.route('/')
def index():
    return 'Hello World'

# 帶有狀態碼的回應
@app.route('/not-found')
def not_found():
    return '找不到頁面', 404

# 自訂回應物件
@app.route('/custom')
def custom():
    response = make_response('自訂回應')
    response.headers['X-Custom-Header'] = 'custom-value'
    return response

# JSON 回應
@app.route('/api/data')
def api_data():
    return jsonify({'name': 'Flask', 'version': '2.0'})
```

---

## 表單處理

### HTML 表單

```html
<form method="POST" action="/submit">
    <label for="name">姓名：</label>
    <input type="text" id="name" name="name" required>

    <label for="email">電子郵件：</label>
    <input type="email" id="email" name="email" required>

    <label for="message">訊息：</label>
    <textarea id="message" name="message" required></textarea>

    <button type="submit">提交</button>
</form>
```

### 處理表單資料

```python
@app.route('/submit', methods=['GET', 'POST'])
def submit():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')

        # 驗證資料
        if not name or not email or not message:
            return render_template('form.html', error='所有欄位皆為必填。')

        # 處理資料（儲存至資料庫、傳送電子郵件等）
        return render_template('success.html', name=name)

    return render_template('form.html')
```

---

## 靜態檔案

預設情況下，Flask 會從 `static/` 資料夾提供靜態檔案。

### 提供靜態檔案

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
<script src="{{ url_for('static', filename='js/main.js') }}"></script>
<img src="{{ url_for('static', filename='images/logo.png') }}" alt="Logo">
```

### 靜態檔案組織

```
static/
    css/
        style.css
    js/
        main.js
    images/
        logo.png
```

---

## 工作階段 (Sessions) 與 Cookie

### 使用工作階段

```python
from flask import session

app.secret_key = 'your-secret-key'

@app.route('/login', methods=['POST'])
def login():
    session['username'] = request.form['username']
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('index'))

@app.route('/')
def index():
    if 'username' in session:
        return f'已登入為 {session["username"]}'
    return '您尚未登入'
```

### 設定 Cookie

```python
from flask import make_response

@app.route('/set-cookie')
def set_cookie():
    response = make_response('Cookie 已設定！')
    response.set_cookie('username', 'flask_user', max_age=3600)
    return response

@app.route('/get-cookie')
def get_cookie():
    username = request.cookies.get('username')
    return f'使用者名稱: {username}'
```

---

## 錯誤處理

### 自訂錯誤頁面

```python
@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(error):
    return render_template('500.html'), 500
```

### 中止請求

```python
from flask import abort

@app.route('/user/<int:user_id>')
def get_user(user_id):
    user = find_user(user_id)
    if user is None:
        abort(404)
    return render_template('user.html', user=user)
```

---

## 重新導向 (Redirects)

```python
from flask import redirect, url_for

@app.route('/old-page')
def old_page():
    return redirect(url_for('new_page'))

@app.route('/new-page')
def new_page():
    return '這是新頁面。'

# 帶有狀態碼的重新導向
@app.route('/moved')
def moved():
    return redirect(url_for('new_page'), code=301)
```

---

## Flask 擴充功能

用於建構網頁應用程式的常見 Flask 擴充功能：

| 擴充功能 | 用途 |
|-----------|---------|
| **Flask-SQLAlchemy** | 資料庫 ORM 整合 |
| **Flask-WTF** | 搭配 WTForms 的表單處理與 CSRF 防護 |
| **Flask-Login** | 使用者工作階段管理與身分驗證 |
| **Flask-Mail** | 電子郵件傳送支援 |
| **Flask-Migrate** | 透過 Alembic 進行資料庫遷移管理 |
| **Flask-RESTful** | 建構 REST API |
| **Flask-CORS** | 跨來源資源共用 (CORS) 支援 |
| **Flask-Caching** | 回應快取 |
| **Flask-Limiter** | API 端點的速率限制 |

---

## 關鍵重點

1. **Flask 是一個微框架** -- 它提供基本要素（路由、範本、請求處理），並讓您為其他功能選擇擴充功能。
2. **路由將 URL 對應到函式**，使用 `@app.route()` 裝飾器，並支援動態 URL 參數與多種 HTTP 方法。
3. **Jinja2 範本**支援繼承、迴圈、條件判斷和變數輸出，用於建構動態 HTML 頁面。
4. **`request` 物件**提供對表單資料、查詢參數、標頭、Cookie 和上傳檔案的存取。
5. **使用 `url_for()`** 動態建立 URL，而非硬編碼路徑。
6. **偵錯模式**對於開發至關重要，但在生產環境中必須停用。
7. **虛擬環境**可隔離專案相依性，應始終使用。
8. **靜態檔案**由 `static/` 目錄提供，並使用 `url_for('static', filename='...')` 進行參照。
9. **工作階段**提供伺服器端使用者狀態管理，需要設定 `SECRET_KEY`。
10. **Flask 擴充功能**為資料庫、表單、身分驗證、電子郵件等提供模組化功能。
