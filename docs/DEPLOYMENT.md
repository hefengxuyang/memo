# Memo 前端部署指南

本文档详细说明如何将 Memo Web Frontend 部署到各种环境。

## 目录

- [部署前准备](#部署前准备)
- [本地开发部署](#本地开发部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [云平台部署](#云平台部署)
- [CDN 配置](#cdn-配置)
- [监控和日志](#监控和日志)

## 部署前准备

### 1. 环境检查

确保满足以下要求：

- [ ] 后端 API 服务已部署并可访问
- [ ] 已完成所有测试（`npm test`）
- [ ] 已进行跨浏览器测试
- [ ] 已运行性能审计（Lighthouse）
- [ ] 已配置正确的 API URL
- [ ] 已设置适当的环境变量

### 2. 构建检查清单

- [ ] 更新 API 基础 URL 为生产环境地址
- [ ] 设置 `ENVIRONMENT` 为 `production`
- [ ] 移除开发调试代码
- [ ] 验证所有资源路径正确
- [ ] 检查 CORS 配置
- [ ] 测试错误处理

### 3. 文件准备

需要部署的文件：
```
.
├── index.html
├── css/
│   ├── variables.css
│   ├── main.css
│   ├── utilities.css
│   ├── interactive-states.css
│   └── components/
│       ├── task-list.css
│       ├── task-item.css
│       ├── task-form.css
│       └── notification.css
└── js/
    ├── main.js
    ├── config.js
    ├── api-client.js
    ├── state-manager.js
    ├── task-service.js
    ├── ui-controller.js
    ├── components/
    │   ├── task-list.js
    │   ├── task-form.js
    │   ├── task-item.js
    │   └── notification.js
    └── utils/
        ├── errors.js
        ├── validators.js
        ├── date-formatter.js
        └── performance.js
```

## 本地开发部署

### 方式一：Python HTTP 服务器

```bash
# Python 3
python3 -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

访问：`http://localhost:3000`

### 方式二：Node.js HTTP 服务器

```bash
# 使用 http-server
npx http-server -p 3000

# 或安装后使用
npm install -g http-server
http-server -p 3000
```

### 方式三：PHP 内置服务器

```bash
php -S localhost:3000
```

### 方式四：使用 VS Code Live Server

1. 安装 Live Server 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## 生产环境部署

### Nginx 部署

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# macOS
brew install nginx
```

#### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/memo`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 证书配置
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 网站根目录
    root /var/www/memo;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # 静态文件缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理（可选）
    location /api/ {
        proxy_pass http://backend-server:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 头（如果后端未设置）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PATCH, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # 处理 OPTIONS 请求
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### 3. 部署文件

```bash
# 创建目录
sudo mkdir -p /var/www/memo

# 复制文件
sudo cp -r index.html css js /var/www/memo/

# 设置权限
sudo chown -R www-data:www-data /var/www/memo
sudo chmod -R 755 /var/www/memo
```

#### 4. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/memo /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### Apache 部署

#### 1. 安装 Apache

```bash
# Ubuntu/Debian
sudo apt install apache2

# CentOS/RHEL
sudo yum install httpd
```

#### 2. 配置 Apache

创建配置文件 `/etc/apache2/sites-available/memo.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # 重定向到 HTTPS
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    DocumentRoot /var/www/memo
    
    # SSL 配置
    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert.pem
    SSLCertificateKeyFile /path/to/ssl/key.pem
    
    <Directory /var/www/memo>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # 前端路由支持
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Gzip 压缩
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>
    
    # 缓存配置
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType text/html "access plus 0 seconds"
    </IfModule>
    
    # API 代理（可选）
    ProxyPass /api/ http://backend-server:8080/api/
    ProxyPassReverse /api/ http://backend-server:8080/api/
    
    # 安全头
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

#### 3. 启用模块和配置

```bash
# 启用必要的模块
sudo a2enmod rewrite ssl headers expires deflate proxy proxy_http

# 启用站点配置
sudo a2ensite memo

# 测试配置
sudo apache2ctl configtest

# 重启 Apache
sudo systemctl restart apache2
```

## Docker 部署

### 1. 创建 Dockerfile

```dockerfile
# 使用 Nginx Alpine 作为基础镜像
FROM nginx:alpine

# 维护者信息
LABEL maintainer="your-email@example.com"

# 复制前端文件到 Nginx 默认目录
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 创建 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # 静态文件缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3. 创建 .dockerignore

```
node_modules
tests
docs
*.md
.git
.gitignore
.eslintrc.cjs
jest.config.js
package.json
package-lock.json
```

### 4. 构建和运行

```bash
# 构建镜像
docker build -t memo-frontend:latest .

# 运行容器
docker run -d \
  --name memo-frontend \
  -p 3000:80 \
  --restart unless-stopped \
  memo-frontend:latest

# 查看日志
docker logs -f todo-frontend

# 停止容器
docker stop todo-frontend

# 删除容器
docker rm todo-frontend
```

### 5. Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: todo-frontend
    ports:
      - "3000:80"
    environment:
      - API_BASE_URL=http://backend:8080
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - todo-network

  backend:
    image: memo-backend:latest
    container_name: todo-backend
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - todo-network

networks:
  todo-network:
    driver: bridge
```

运行：
```bash
docker-compose up -d
```

## 云平台部署

### Netlify 部署

#### 方式一：拖放部署

1. 访问 [Netlify](https://www.netlify.com/)
2. 登录并点击 "Add new site" → "Deploy manually"
3. 将项目文件夹拖放到部署区域

#### 方式二：Git 集成

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 Netlify 中连接仓库
3. 配置构建设置：
   - Build command: (留空)
   - Publish directory: `.`
4. 添加环境变量（可选）
5. 点击 "Deploy site"

#### 配置文件 `netlify.toml`

```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Vercel 部署

#### 方式一：CLI 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

#### 方式二：Git 集成

1. 访问 [Vercel](https://vercel.com/)
2. 导入 Git 仓库
3. 配置项目设置
4. 部署

#### 配置文件 `vercel.json`

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-api.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### GitHub Pages 部署

#### 1. 配置仓库

1. 创建 GitHub 仓库
2. 推送代码到 `main` 分支
3. 进入仓库 Settings → Pages
4. 选择 Source: `main` 分支
5. 保存

#### 2. 自动部署（GitHub Actions）

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

### AWS S3 + CloudFront 部署

#### 1. 创建 S3 存储桶

```bash
# 创建存储桶
aws s3 mb s3://memo-frontend

# 配置静态网站托管
aws s3 website s3://memo-frontend \
  --index-document index.html \
  --error-document index.html

# 设置存储桶策略
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::memo-frontend/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket memo-frontend \
  --policy file://bucket-policy.json
```

#### 2. 上传文件

```bash
# 同步文件到 S3
aws s3 sync . s3://memo-frontend \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude "tests/*" \
  --exclude "*.md"

# 设置缓存头
aws s3 cp s3://memo-frontend/css/ s3://memo-frontend/css/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000,public,immutable"

aws s3 cp s3://memo-frontend/js/ s3://memo-frontend/js/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000,public,immutable"
```

#### 3. 配置 CloudFront

```bash
# 创建 CloudFront 分发
aws cloudfront create-distribution \
  --origin-domain-name memo-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

## CDN 配置

### Cloudflare 配置

1. 添加网站到 Cloudflare
2. 更新 DNS 记录指向源服务器
3. 配置缓存规则：
   - CSS/JS: 缓存 1 年
   - HTML: 不缓存
4. 启用 Auto Minify（HTML、CSS、JS）
5. 启用 Brotli 压缩
6. 配置 Page Rules

### 缓存策略

```
# 静态资源（CSS、JS、图片）
Cache-Control: public, max-age=31536000, immutable

# HTML 文件
Cache-Control: no-store, no-cache, must-revalidate

# API 响应
Cache-Control: no-cache, must-revalidate
```

## 监控和日志

### 1. 错误监控

集成 Sentry（可选）：

```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production',
    release: 'memo-frontend@1.0.0'
  });
</script>
```

### 2. 性能监控

使用 Google Analytics 或其他分析工具：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. 日志收集

Nginx 访问日志：
```bash
tail -f /var/log/nginx/access.log
```

Nginx 错误日志：
```bash
tail -f /var/log/nginx/error.log
```

## 回滚策略

### 1. 保留旧版本

```bash
# 备份当前版本
sudo cp -r /var/www/memo /var/www/memo.backup.$(date +%Y%m%d)

# 部署新版本
sudo cp -r new-version/* /var/www/memo/

# 如需回滚
sudo rm -rf /var/www/memo
sudo cp -r /var/www/memo.backup.20240115 /var/www/memo
sudo systemctl restart nginx
```

### 2. Git 版本控制

```bash
# 标记版本
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 回滚到特定版本
git checkout v1.0.0
# 重新部署
```

## 安全最佳实践

1. **使用 HTTPS**: 始终使用 SSL/TLS 加密
2. **设置安全头**: CSP、X-Frame-Options、X-Content-Type-Options
3. **定期更新**: 保持依赖和服务器软件最新
4. **限制访问**: 使用防火墙和访问控制
5. **监控日志**: 定期检查访问和错误日志
6. **备份数据**: 定期备份配置和数据
7. **DDoS 防护**: 使用 CDN 和 DDoS 防护服务

## 故障排除

### 问题：404 错误

**原因**: 前端路由配置不正确

**解决**: 确保服务器配置了 SPA 路由回退到 index.html

### 问题：CORS 错误

**原因**: 后端未设置正确的 CORS 头

**解决**: 
1. 在后端配置 CORS
2. 或使用代理转发 API 请求

### 问题：静态资源加载失败

**原因**: 路径配置错误

**解决**: 检查资源路径是否正确，使用相对路径

## 总结

本文档涵盖了 Memo 前端的各种部署方式。根据你的需求选择合适的部署方案：

- **开发测试**: 使用本地 HTTP 服务器
- **小型项目**: Netlify、Vercel、GitHub Pages
- **企业应用**: Nginx/Apache + Docker
- **大规模应用**: AWS S3 + CloudFront + CDN

记得在部署前完成所有测试，并配置适当的监控和日志系统。
