# PicGo 自建图床服务

这是一个基于 Node.js 和 Express 的图床后端服务，专为 PicGo 桌面应用设计。

## 更新日志

### v1.1.0
- 修复了路由配置中的路径问题，解决启动时的路径错误
- 增强了安全配置，添加了安全头设置
- 优化了 Nginx 配置文件，提供了更完整的 SSL 和安全设置示例

## 项目结构

```
picgo-server/
├── public/
│   └── uploads/          # 存放上传的图片文件
├── .env                  # 环境变量配置文件
├── index.js              # 主程序文件
├── package.json          # 项目依赖配置
├── PICGO_CONFIG.md       # PicGo 客户端配置指南
└── README.md             # 项目说明文档
```

## 功能特性

1. **安全的文件上传**：
   - API Key 认证机制
   - 文件类型白名单（仅允许 JPEG, PNG, GIF, WebP）
   - 文件大小限制（最大 5MB）
   - 文件重命名（时间戳+随机字符串）

2. **RESTful API**：
   - POST `/api/upload` - 图片上传接口
   - GET `/` - 健康检查接口

3. **跨域支持**：
   - 支持所有来源的 CORS 请求

4. **静态文件服务**：
   - 通过 `/uploads` 路径访问已上传的图片

## 安装与运行

### 1. 克隆项目或下载代码

```bash
git clone <repository-url>
# 或者直接下载源码
```

### 2. 安装依赖

```bash
cd picgo-server
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env` 并修改其中的配置：

```env
# API 密钥，用于验证上传请求
API_KEY=your_secret_api_key_here

# 基础 URL，用于构建返回的图片 URL
BASE_URL=https://your-domain.com
```

### 4. 运行服务

```bash
node index.js
# 或者使用 npm script
npm start
```

服务默认运行在 `http://localhost:3001`

## API 文档

### 上传图片

**Endpoint**: `POST /api/upload`

**Headers**:
- `Content-Type`: `multipart/form-data`
- `Authorization`: `Bearer YOUR_SECRET_API_KEY`

**Body**:
- `file`: 要上传的图片文件

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "imgUrl": "https://your-domain.com/uploads/1715901234567_abcde12345.png"
}
```

**失败响应**:
```json
{
  "success": false,
  "message": "错误描述信息"
}
```

## Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 代理上传 API 到 Node.js 服务
    location /api/upload {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 直接提供上传的静态图片文件
    location /uploads/ {
        alias /path/to/picgo-server/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 代理其他请求到 Node.js 服务（可选）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## PicGo 客户端配置

在 PicGo 客户端中配置"自定义 Web 图床"：

1. **API 地址**: `https://your-domain.com/api/upload`
2. **POST 参数名**: `file`
3. **JSON 路径**: `$.imgUrl`
4. **请求头**: 
   ```
   {
     "Authorization": "Bearer YOUR_SECRET_API_KEY"
   }
   ```

## 安全建议

1. 使用强密码作为 API_KEY
2. 在生产环境中使用 HTTPS
3. 定期检查和清理上传的文件
4. 限制上传频率以防滥用
5. 配置适当的防火墙规则

## 许可证

MIT