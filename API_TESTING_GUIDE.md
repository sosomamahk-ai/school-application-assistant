# API 测试指南

## 🚀 快速开始

### 前置条件

1. **启动开发服务器**
   ```bash
   npm run dev
   ```
   服务器会在 `http://localhost:3000` 启动

2. **确保数据库已连接**
   - 检查 `.env` 文件中的 `DATABASE_URL`
   - 确保已运行数据库迁移

## 📝 测试步骤

### 步骤 1: 测试上传模板 API（最简单，无需登录）

#### 方法 A: 使用浏览器控制台

1. 打开浏览器，访问 `http://localhost:3000`
2. 按 `F12` 打开开发者工具
3. 切换到 `Console` 标签
4. 粘贴以下代码并回车：

```javascript
fetch('http://localhost:3000/api/templates/pushFields', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    schoolId: "test_school_001",
    fields: [
      { key: "personal_statement", label: "Personal Statement", type: "text" },
      { key: "cv", label: "CV Upload", type: "file" }
    ]
  })
})
.then(response => response.json())
.then(data => console.log('成功:', data))
.catch(error => console.error('错误:', error));
```

5. 如果看到 `{status: "ok", template: {...}}`，说明 API 工作正常！

#### 方法 B: 使用 PowerShell（Windows）

1. 打开 PowerShell
2. 运行以下命令：

```powershell
$body = @{
    schoolId = "test_school_001"
    fields = @(
        @{
            key = "personal_statement"
            label = "Personal Statement"
            type = "text"
        },
        @{
            key = "cv"
            label = "CV Upload"
            type = "file"
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/templates/pushFields" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 步骤 2: 测试获取模板 API

#### 在浏览器中直接访问

打开浏览器，访问：
```
http://localhost:3000/api/templates/test_school_001
```

如果模板存在，会显示 JSON 数据；如果不存在，会显示 404 错误。

### 步骤 3: 测试保存申请数据 API（需要登录）

#### 3.1 首先登录获取 Token

**使用浏览器控制台：**

```javascript
// 登录
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your-email@example.com',  // 替换为你的邮箱
    password: 'your-password'          // 替换为你的密码
  })
})
.then(response => response.json())
.then(data => {
  console.log('登录成功，Token:', data.token);
  console.log('用户ID:', data.user.id);
  
  // 保存 Token 到变量，后续使用
  window.testToken = data.token;
  window.testUserId = data.user.id;
})
.catch(error => console.error('登录失败:', error));
```

#### 3.2 使用 Token 保存申请数据

```javascript
fetch('http://localhost:3000/api/applicationData/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.testToken}`  // 使用上面保存的 Token
  },
  body: JSON.stringify({
    schoolId: "test_school_001",
    userId: window.testUserId,  // 使用上面保存的 userId
    data: {
      personal_statement: "这是我的个人陈述内容",
      cv: "https://example.com/cv.pdf"
    }
  })
})
.then(response => response.json())
.then(data => console.log('保存成功:', data))
.catch(error => console.error('保存失败:', error));
```

#### 3.3 获取申请数据

```javascript
fetch(`http://localhost:3000/api/applicationData/test_school_001/${window.testUserId}`, {
  headers: {
    'Authorization': `Bearer ${window.testToken}`
  }
})
.then(response => response.json())
.then(data => console.log('申请数据:', data))
.catch(error => console.error('获取失败:', error));
```

## 🛠️ 使用 Postman 测试（推荐）

### 安装 Postman

1. 下载：https://www.postman.com/downloads/
2. 安装并打开 Postman

### 创建请求集合

#### 1. 上传模板

- **请求名称**: Upload Template
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/templates/pushFields`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (选择 raw，格式选择 JSON):
  ```json
  {
    "schoolId": "test_school_001",
    "fields": [
      {
        "key": "personal_statement",
        "label": "Personal Statement",
        "type": "text"
      },
      {
        "key": "cv",
        "label": "CV Upload",
        "type": "file"
      }
    ]
  }
  ```
- 点击 **Send**，应该看到 `{"status":"ok",...}`

#### 2. 获取模板

- **请求名称**: Get Template
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/templates/test_school_001`
- 点击 **Send**，应该看到模板数据

#### 3. 登录获取 Token

- **请求名称**: Login
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/login`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "your-email@example.com",
    "password": "your-password"
  }
  ```
- 点击 **Send**，复制返回的 `token` 值

#### 4. 保存申请数据

- **请求名称**: Save Application Data
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/applicationData/save`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer YOUR_TOKEN_HERE` (替换为步骤 3 获取的 token)
- **Body** (raw JSON):
  ```json
  {
    "schoolId": "test_school_001",
    "userId": "YOUR_USER_ID_HERE",
    "data": {
      "personal_statement": "这是我的个人陈述",
      "cv": "https://example.com/cv.pdf"
    }
  }
  ```

#### 5. 获取申请数据

- **请求名称**: Get Application Data
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/applicationData/test_school_001/YOUR_USER_ID_HERE`
- **Headers**:
  - `Authorization`: `Bearer YOUR_TOKEN_HERE`

## ✅ 验证 API 是否正常工作

### 成功标志

1. **上传模板**：
   - 返回 `{"status":"ok","template":{...}}`
   - 没有错误信息

2. **获取模板**：
   - 返回 JSON 格式的模板数据
   - 或 404（如果模板不存在，这是正常的）

3. **保存申请数据**：
   - 返回 `{"status":"ok","applicationData":{...}}`
   - 没有认证错误

4. **获取申请数据**：
   - 返回之前保存的数据
   - 格式为 `{"personal_statement":"...","cv":"..."}`

### 常见错误

1. **401 Unauthorized**：
   - 需要先登录获取 Token
   - Token 可能已过期，重新登录

2. **404 Not Found**：
   - 检查 URL 是否正确
   - 检查 schoolId 或 userId 是否存在

3. **500 Internal Server Error**：
   - 检查服务器日志
   - 检查数据库连接
   - 检查环境变量配置

## 🎯 完整测试流程示例

```javascript
// 在浏览器控制台中运行完整测试流程

(async function testAPI() {
  try {
    // 1. 上传模板
    console.log('1. 上传模板...');
    const uploadRes = await fetch('http://localhost:3000/api/templates/pushFields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: "test_school_001",
        fields: [
          { key: "personal_statement", label: "Personal Statement", type: "text" }
        ]
      })
    });
    const uploadData = await uploadRes.json();
    console.log('✅ 上传成功:', uploadData);

    // 2. 获取模板
    console.log('\n2. 获取模板...');
    const getTemplateRes = await fetch('http://localhost:3000/api/templates/test_school_001');
    const templateData = await getTemplateRes.json();
    console.log('✅ 获取成功:', templateData);

    // 3. 登录
    console.log('\n3. 登录...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'your-email@example.com',  // 替换为实际邮箱
        password: 'your-password'          // 替换为实际密码
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ 登录成功, Token:', token.substring(0, 20) + '...');

    // 4. 保存申请数据
    console.log('\n4. 保存申请数据...');
    const saveRes = await fetch('http://localhost:3000/api/applicationData/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        schoolId: "test_school_001",
        userId: userId,
        data: {
          personal_statement: "测试内容"
        }
      })
    });
    const saveData = await saveRes.json();
    console.log('✅ 保存成功:', saveData);

    // 5. 获取申请数据
    console.log('\n5. 获取申请数据...');
    const getDataRes = await fetch(
      `http://localhost:3000/api/applicationData/test_school_001/${userId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const appData = await getDataRes.json();
    console.log('✅ 获取成功:', appData);

    console.log('\n🎉 所有测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
})();
```

## 📞 需要帮助？

如果遇到问题：
1. 检查开发服务器是否运行（`npm run dev`）
2. 检查浏览器控制台的错误信息
3. 检查服务器终端的日志
4. 确认数据库连接正常

