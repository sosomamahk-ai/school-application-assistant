# 如何调用 POST /api/admin/sync-schools API

## 前置要求

1. **管理员账户**：需要一个role为`admin`的用户账户
2. **JWT Token**：需要先登录获取token
3. **API地址**：本地开发使用 `http://localhost:3000`，生产环境使用你的Vercel URL

## 方法1: 使用PowerShell脚本（推荐）

创建一个PowerShell脚本来完成登录和调用：

```powershell
# sync-schools.ps1

# 配置
$baseUrl = "http://localhost:3000"  # 或你的生产URL
$email = "your-admin-email@example.com"
$password = "your-password"

# 步骤1: 登录获取token
Write-Host "正在登录..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        identifier = $email
        password = $password
    } | ConvertTo-Json)

if (-not $loginResponse.token) {
    Write-Host "登录失败: $($loginResponse.error)" -ForegroundColor Red
    exit 1
}

$token = $loginResponse.token
Write-Host "登录成功！" -ForegroundColor Green

# 步骤2: 调用sync-schools API
Write-Host "`n正在同步WordPress学校数据..." -ForegroundColor Cyan
try {
    $syncResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/sync-schools" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    Write-Host "`n同步完成！" -ForegroundColor Green
    Write-Host "结果:" -ForegroundColor Cyan
    Write-Host "  - 成功同步: $($syncResponse.synced) 所学校" -ForegroundColor White
    Write-Host "  - 错误数量: $($syncResponse.errors)" -ForegroundColor $(if ($syncResponse.errors -gt 0) { "Yellow" } else { "White" })
    Write-Host "  - 耗时: $($syncResponse.duration)" -ForegroundColor White
    
    if ($syncResponse.errorsList -and $syncResponse.errorsList.Count -gt 0) {
        Write-Host "`n错误列表:" -ForegroundColor Yellow
        $syncResponse.errorsList | ForEach-Object {
            Write-Host "  - School ID $($_.wpId): $($_.error)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "`n同步失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "详细信息: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
```

**使用方法**：
```powershell
# 编辑脚本，填入你的邮箱和密码
notepad sync-schools.ps1

# 运行脚本
.\sync-schools.ps1
```

## 方法2: 使用curl命令

### 步骤1: 登录获取token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-admin-email@example.com",
    "password": "your-password"
  }'
```

响应示例：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "...",
    "role": "admin"
  }
}
```

### 步骤2: 使用token调用sync API

```bash
# 将TOKEN替换为上面获取的token
curl -X POST http://localhost:3000/api/admin/sync-schools \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## 方法3: 使用PowerShell一行命令

```powershell
# 先登录获取token（替换邮箱和密码）
$token = (Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body (@{identifier="your-email@example.com";password="your-password"} | ConvertTo-Json)).token

# 调用sync API
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/sync-schools" -Method POST -Headers @{Authorization="Bearer $token";"Content-Type"="application/json"}
```

## 方法4: 在浏览器开发者工具中调用

1. **打开浏览器开发者工具**（F12）
2. **登录你的管理员账户**（在应用中）
3. **打开Console标签**
4. **运行以下代码**：

```javascript
// 从localStorage获取token（如果前端存储了token）
const token = localStorage.getItem('token');

// 或者从cookie获取（如果使用cookie）
// const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

if (!token) {
  console.error('未找到token，请先登录');
} else {
  fetch('/api/admin/sync-schools', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('同步结果:', data);
    if (data.success) {
      console.log(`✅ 成功同步 ${data.synced} 所学校`);
    } else {
      console.error('❌ 同步失败:', data.error);
    }
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
}
```

## 方法5: 创建Node.js测试脚本

创建 `scripts/sync-schools.js`：

```javascript
const fetch = require('node-fetch');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const EMAIL = process.env.ADMIN_EMAIL || 'your-admin-email@example.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'your-password';

async function syncSchools() {
  try {
    // 步骤1: 登录
    console.log('正在登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: EMAIL,
        password: PASSWORD
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.token) {
      console.error('登录失败:', loginData.error);
      process.exit(1);
    }

    console.log('✅ 登录成功');

    // 步骤2: 调用sync API
    console.log('\n正在同步WordPress学校数据...');
    const syncResponse = await fetch(`${BASE_URL}/api/admin/sync-schools`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });

    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log('\n✅ 同步完成！');
      console.log(`   成功同步: ${syncData.synced} 所学校`);
      console.log(`   错误数量: ${syncData.errors}`);
      console.log(`   耗时: ${syncData.duration}`);
      
      if (syncData.errorsList && syncData.errorsList.length > 0) {
        console.log('\n⚠️  错误列表:');
        syncData.errorsList.forEach(err => {
          console.log(`   - School ID ${err.wpId}: ${err.error}`);
        });
      }
    } else {
      console.error('\n❌ 同步失败:', syncData.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('请求失败:', error.message);
    process.exit(1);
  }
}

syncSchools();
```

运行：
```bash
# 设置环境变量
export ADMIN_EMAIL="your-email@example.com"
export ADMIN_PASSWORD="your-password"

# 运行脚本
node scripts/sync-schools.js
```

## 响应示例

成功响应：
```json
{
  "success": true,
  "message": "Successfully synced 150 schools",
  "synced": 150,
  "errors": 0,
  "errorsList": [],
  "duration": "5234ms"
}
```

有错误的响应：
```json
{
  "success": true,
  "message": "Sync completed with errors",
  "synced": 148,
  "errors": 2,
  "errorsList": [
    {
      "wpId": 123,
      "error": "Unique constraint violation"
    },
    {
      "wpId": 456,
      "error": "Database connection timeout"
    }
  ],
  "duration": "6234ms"
}
```

## 故障排除

### 错误: 403 Forbidden
- **原因**：用户不是管理员
- **解决**：确保用户role为`admin`

### 错误: 401 Unauthorized
- **原因**：Token无效或过期
- **解决**：重新登录获取新token

### 错误: 500 Internal Server Error
- **原因**：服务器错误
- **解决**：检查服务器日志，确保WordPress API可访问

## 验证同步结果

同步完成后，验证：

1. **检查数据库**：
   ```sql
   SELECT COUNT(*) FROM "School" WHERE "nameShort" IS NOT NULL;
   ```

2. **检查API**：
   ```bash
   GET /api/schools
   # 应该返回所有学校的nameShort字段
   ```

3. **检查前端**：
   - 访问 `/schools` 页面
   - 所有学校都应该显示 `name_short`

