const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载环境变量
dotenv.config();

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 安全头设置
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 启用 CORS，允许所有来源的请求
app.use(cors());

// 静态文件服务，提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 配置 Multer 中间件
const storage = multer.diskStorage({
  // 设置文件存储位置
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  // 设置文件名
  filename: function (req, file, cb) {
    // 获取文件扩展名
    const ext = path.extname(file.originalname);
    // 生成新的文件名：时间戳 + 随机字符串 + 扩展名
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

// 创建文件过滤器，只允许特定类型的图片上传
const fileFilter = (req, file, cb) => {
  // 允许的 MIME 类型
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    // 接受文件
    cb(null, true);
  } else {
    // 拒绝文件
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置 Multer 上传对象
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // 限制文件大小为 5MB
    fileSize: 5 * 1024 * 1024
  }
});

// API 密钥验证中间件
const authenticateApiKey = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = process.env.API_KEY;
  
  // 记录请求信息用于调试
  console.log('收到上传请求:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    hasAuthHeader: !!authHeader,
    expectedApiKey: apiKey ? '已设置' : '未设置'
  });
  
  // 检查 Authorization 头是否存在
  if (!authHeader) {
    console.log('缺少认证信息');
    return res.status(401).json({
      success: false,
      message: '缺少认证信息'
    });
  }
  
  // 检查是否为 Bearer Token 格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('认证格式错误:', authHeader);
    return res.status(401).json({
      success: false,
      message: '认证格式错误'
    });
  }
  
  const token = parts[1];
  if (!token) {
    console.log('Token 为空');
    return res.status(401).json({
      success: false,
      message: '认证格式错误'
    });
  }
  
  // 验证 API 密钥
  if (token !== apiKey) {
    console.log('API 密钥无效:', { received: token, expected: apiKey });
    return res.status(401).json({
      success: false,
      message: '无效的 API 密钥'
    });
  }
  
  console.log('API 密钥验证通过');
  // 验证通过，继续处理请求
  next();
};

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PicGo 图床服务正在运行'
  });
});

// 文件上传接口
app.post('/api/upload', authenticateApiKey, upload.single('file'), (req, res) => {
  try {
    // 检查是否有文件被上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }
    
    // 构建图片访问 URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const imgUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // 返回成功响应
    res.status(200).json({
      success: true,
      imgUrl: imgUrl
    });
  } catch (error) {
    // 处理意外错误
    console.error('上传过程中发生错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  // 处理 Multer 文件大小超限错误
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制（最大 5MB）'
      });
    }
  }
  
  // 处理其他错误
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`PicGo 图床服务正在运行在端口 ${PORT}`);
  console.log(`上传目录: ${path.join(__dirname, 'public/uploads')}`);
});