// 调试脚本，用于检查环境变量和配置
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('=== PicGo 图床服务调试信息 ===');
console.log('当前工作目录:', process.cwd());
console.log('环境变量加载情况:');

// 检查环境变量
console.log('PORT:', process.env.PORT || '未设置 (默认 3000)');
console.log('API_KEY:', process.env.API_KEY ? '已设置 (长度: ' + process.env.API_KEY.length + ')' : '未设置');
console.log('BASE_URL:', process.env.BASE_URL || '未设置 (默认 http://localhost:PORT)');

// 检查 .env 文件是否存在
const envPath = path.join(process.cwd(), '.env');
console.log('.env 文件路径:', envPath);
console.log('.env 文件是否存在:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('.env 文件内容:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent);
}

// 检查上传目录
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
console.log('上传目录路径:', uploadDir);
console.log('上传目录是否存在:', fs.existsSync(uploadDir));

if (fs.existsSync(uploadDir)) {
  const stats = fs.statSync(uploadDir);
  console.log('上传目录权限:', stats.mode);
} else {
  console.log('注意: 上传目录不存在，请确保已创建 public/uploads 目录');
}

console.log('=== 调试结束 ===');