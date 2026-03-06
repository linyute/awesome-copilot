# 伺服器與基礎架構參考

Web 伺服器、裝載 (hosting)、部署與基礎架構概念。

## Web 伺服器

### 熱門 Web 伺服器

#### Nginx

高效能 Web 伺服器與反向代理。

**功能**：
- 負載平衡 (Load balancing)
- 反向代理 (Reverse proxy)
- 靜態檔案服務
- SSL/TLS 終端 (termination)

**基本設定**：
```nginx
server {
    listen 80;
    server_name example.com;
    
    # 服務靜態檔案
    location / {
        root /var/www/html;
        index index.html;
    }
    
    # 代理至後端
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # SSL 設定
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

#### Apache HTTP Server

廣泛使用的 Web 伺服器。

**功能**：
- 支援 .htaccess
- 模組系統
- 虛擬裝載 (Virtual hosting)

**基本 .htaccess**：
```apache
# 重新導向至 HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 自訂錯誤頁面
ErrorDocument 404 /404.html

# 快取控制
<FilesMatch "\.(jpg|jpeg|png|gif|css|js)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

#### Node.js 伺服器

**Express.js**：
```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('伺服器執行於通訊埠 3000');
});
```

**內建 HTTP 伺服器**：
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Hello World</h1>');
});

server.listen(3000);
```

## 裝載選項

### 靜態裝載

用於靜態網站 (HTML、CSS、JS)。

**平台**：
- **Vercel**：自動化部署、無伺服器函式 (serverless functions)
- **Netlify**：建構自動化、邊緣函式 (edge functions)
- **GitHub Pages**：公開儲存庫免費使用
- **Cloudflare Pages**：快速的全域 CDN
- **AWS S3 + CloudFront**：具延展性，需手動設定

**部署**：
```bash
# Vercel
npx vercel

# Netlify
npx netlify deploy --prod

# GitHub Pages (透過 Git)
git push origin main
```

### 平台即服務 (PaaS)

受管理的應用程式裝載。

**平台**：
- **Heroku**：簡易部署、附加元件
- **Railway**：現代化的開發者體驗
- **Render**：統一平台
- **Google App Engine**：自動縮放
- **Azure App Service**：微軟雲端

**範例 (Heroku)**：
```bash
# 部署
git push heroku main

# 縮放
heroku ps:scale web=2

# 檢視記錄
heroku logs --tail
```

### 基礎設施即服務 (IaaS)

虛擬伺服器 (更多控制權，需更多設定)。

**供應商**：
- **AWS EC2**：亞馬遜虛擬伺服器
- **Google Compute Engine**：Google 虛擬機器 (VM)
- **DigitalOcean Droplets**：簡易 VPS
- **Linode**：開發者友善的 VPS

### 容器化

**Docker**：
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# 建構映像
docker build -t my-app .

# 執行容器
docker run -p 3000:3000 my-app
```

**Docker Compose**：
```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
```

### Kubernetes

容器協調平台。

**概念**：
- **Pods**：最小的可部署單元
- **Services**：公開 Pods
- **Deployments**：管理複本 (replicas)
- **Ingress**：HTTP 路由

## 內容傳遞網路 (CDN)

用於快速內容傳遞的分散式網路。

**優點**：
- 更快的載入速度
- 減少伺服器負載
- DDoS 防護
- 地理分佈

**熱門 CDN**：
- **Cloudflare**：免費層級、DDoS 防護
- **AWS CloudFront**：亞馬遜 CDN
- **Fastly**：邊緣運算 (Edge computing)
- **Akamai**：企業級 CDN

**用於函式庫的 CDN**：
```html
<!-- CDN 裝載的函式庫 -->
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
```

## 網域名稱系統 (DNS)

將網域名稱轉換為 IP 位址。

### DNS 記錄

| 類型 | 用途 | 範例 |
|------|---------|---------|
| A | IPv4 位址 | `example.com → 192.0.2.1` |
| AAAA | IPv6 位址 | `example.com → 2001:db8::1` |
| CNAME | 另一個網域的別名 | `www → example.com` |
| MX | 郵件伺服器 | `mail.example.com` |
| TXT | 文字資訊 | SPF, DKIM 記錄 |
| NS | 名稱伺服器 | DNS 委派 |

**DNS 查閱**：
```bash
# 命令列
nslookup example.com
dig example.com

# JavaScript (非直接 DNS，而是 IP 查閱)
fetch('https://dns.google/resolve?name=example.com')
```

### DNS 傳播 (Propagation)

DNS 變更在全球生效所需的時間 (通常為 24-48 小時)。

## SSL/TLS 憑證

加密用戶端與伺服器之間的資料。

### 憑證類型

- **網域驗證 (DV)**：基本、自動化
- **組織驗證 (OV)**：已驗證的企業
- **延伸驗證 (EV)**：最高等級驗證

### 取得憑證

**Let's Encrypt** (免費)：
```bash
# Certbot
sudo certbot --nginx -d example.com
```

**Cloudflare** (搭配 Cloudflare DNS 免費提供)

### HTTPS 設定

```nginx
# Nginx HTTPS
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}

# 將 HTTP 重新導向至 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## 負載平衡

將流量分佈到多個伺服器。

### 負載平衡演算法

- **輪詢 (Round Robin)**：按順序分配
- **最少連接 (Least Connections)**：傳送至連線數最少的伺服器
- **IP Hash**：根據用戶端 IP 路由
- **權重 (Weighted)**：伺服器具有不同的容量

**Nginx 負載平衡器**：
```nginx
upstream backend {
    server server1.example.com weight=3;
    server server2.example.com;
    server server3.example.com;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

## 反向代理

將要求轉發至後端伺服器的伺服器。

**優點**：
- 負載平衡
- SSL 終端
- 快取
- 安全性 (隱藏後端)

**Nginx 反向代理**：
```nginx
server {
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 快取策略

### 瀏覽器快取

```http
Cache-Control: public, max-age=31536000, immutable
```

### 伺服器端快取

**Redis**：
```javascript
const redis = require('redis');
const client = redis.createClient();

// 快取資料
await client.set('user:1', JSON.stringify(user), {
  EX: 3600 // 1 小時後過期
});

// 擷取快取資料
const cached = await client.get('user:1');
```

### CDN 快取

靜態資產快取在邊緣位置。

## 環境變數

不需硬編碼的設定。

```bash
# .env 檔案
DATABASE_URL=postgresql://localhost/mydb
API_KEY=secret-key-here
NODE_ENV=production
```

```javascript
// 在 Node.js 中存取
require('dotenv').config();
const dbUrl = process.env.DATABASE_URL;
```

**最佳實踐**：
- 永不將 .env 提交至 Git
- 使用 .env.example 作為範本
- 每個環境使用不同值
- 保護秘密值

## 部署策略

### 持續部署 (CD)

程式碼推送時自動部署。

**GitHub Actions**：
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

### 藍綠部署 (Blue-Green Deployment)

兩個相同的環境，切換流量。

### 金絲雀部署 (Canary Deployment)

逐步推出給部分使用者。

### 滾動部署 (Rolling Deployment)

漸進式更新執行個體。

## 程序管理員

保持應用程式執行。

### PM2

```bash
# 啟動應用程式
pm2 start app.js

# 以名稱啟動
pm2 start app.js --name my-app

# 叢集模式 (使用所有 CPU)
pm2 start app.js -i max

# 監視
pm2 monit

# 重新啟動
pm2 restart my-app

# 停止
pm2 stop my-app

# 記錄
pm2 logs

# 啟動指令碼 (重新開機時重啟)
pm2 startup
pm2 save
```

### systemd

Linux 服務管理員。

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Node App

[Service]
ExecStart=/usr/bin/node /path/to/app.js
Restart=always
User=nobody
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable myapp
sudo systemctl start myapp
sudo systemctl status myapp
```

## 監控與記錄 (Logging)

### 應用程式監控

- **New Relic**：APM、監控
- **Datadog**：基礎架構監控
- **Grafana**：視覺化
- **Prometheus**：指標收集

### 記錄彙整

- **Elasticsearch + Kibana**：搜尋並視覺化記錄
- **Splunk**：企業記錄管理
- **Papertrail**：雲端記錄服務

### 運作時間 (Uptime) 監控

- **UptimeRobot**：免費運作時間檢查
- **Pingdom**：監控服務
- **StatusCake**：網站監控

## 安全性最佳實踐

### 伺服器強化 (Hardening)

- 保持軟體更新
- 使用防火牆 (ufw, iptables)
- 停用 root SSH 登入
- 使用 SSH 金鑰 (而非密碼)
- 限制使用者權限
- 定期備份

### 應用程式安全性

- 到處使用 HTTPS
- 實作速率限制 (Rate limiting)
- 驗證所有輸入
- 使用安全性標頭 (Security headers)
- 保持相依性更新
- 定期安全性稽核

## 備份策略

### 資料庫備份

```bash
# PostgreSQL
pg_dump dbname > backup.sql

# MySQL
mysqldump -u user -p dbname > backup.sql

# MongoDB
mongodump --db mydb --out /backup/
```

### 自動化備份

- 每日備份
- 多個保留期
- 異地儲存
- 定期測試還原

## 延展性

### 垂直縮放 (Vertical Scaling)

增加伺服器資源 (CPU, RAM)。

**優點**：簡單  
**缺點**：受限、昂貴

### 水平縮放 (Horizontal Scaling)

增加更多伺服器。

**優點**：無限延展  
**缺點**：複雜，需要負載平衡器

### 資料庫縮放

- **複寫 (Replication)**：讀取複本 (Read replicas)
- **分區 (Sharding)**：將資料拆分到多個資料庫
- **快取**：減少資料庫負載

## 詞彙術語

**涵蓋的關鍵字詞**：
- Apache
- 頻寬 (Bandwidth)
- CDN
- 雲端運算 (Cloud computing)
- CNAME
- DNS
- 網域
- 網域名稱
- 防火牆
- 主機 (Host)
- 盜連 (Hotlink)
- IP 位址
- ISP (網際網路服務供應商)
- 延遲 (Latency)
- localhost
- Nginx
- 來源 (Origin)
- 通訊埠 (Port)
- 代理伺服器 (Proxy servers)
- 往返時間 (Round Trip Time, RTT)
- 伺服器
- 站台 (Site)
- TLD
- Web 伺服器
- 網站

## 其他資源

- [Nginx 文件](https://nginx.org/en/docs/)
- [Docker 文件](https://docs.docker.com/)
- [AWS 文件](https://docs.aws.amazon.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 文件](https://pm2.keymetrics.io/docs/)
