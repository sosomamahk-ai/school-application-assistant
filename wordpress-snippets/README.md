# WordPress 集成快速指南 🚀

## 📁 文件说明

这个文件夹包含 WordPress 集成所需的代码片段：

| 文件 | 用途 | 难度 |
|------|------|------|
| `quick-start-iframe.php` | iframe 嵌入方式（最简单） | ⭐ |
| `api-integration.php` | 完整 API 集成（推荐） | ⭐⭐⭐ |
| `hide-header-on-login.php` | 隐藏 WordPress Header（登录后） | ⭐⭐ |
| `check-acf-config.php` | ACF 配置检查和修复工具 | ⭐⭐ |

---

## 🎯 方案一：iframe 嵌入（5分钟）

### 适合场景
- 快速测试和演示
- 不需要深度定制
- 独立的功能模块

### 使用步骤

#### 1. 部署 Next.js 应用

```bash
# 在项目根目录
cd school-application-assistant

# 部署到 Vercel（最简单）
npm install -g vercel
vercel deploy --prod
```

记录您的应用 URL，例如：`https://your-app.vercel.app`

#### 2. 添加 Code Snippet

1. 在 WordPress 后台，进入 **Snippets** → **Add New**
2. 复制 `quick-start-iframe.php` 的内容
3. 修改第 15 行：
   ```php
   define('SCHOOL_APP_URL', 'https://your-app.vercel.app'); // 改成你的 URL
   ```
4. 保存并激活

#### 3. 在 Elementor 中使用

创建新页面：
1. 添加 "Shortcode" 小部件
2. 输入短代码：

```
[school_app]                          显示 Dashboard
[school_app page="profile"]           显示用户资料
[school_app page="auth/login"]        显示登录页面
[school_app page="auth/register"]     显示注册页面
```

#### 4. 创建完整的应用页面

建议创建以下页面：

| 页面 | URL | 短代码 |
|------|-----|--------|
| 申请列表 | `/applications` | `[school_app page="dashboard"]` |
| 用户资料 | `/my-profile` | `[school_app page="profile"]` |
| 登录 | `/app-login` | `[school_app page="auth/login" height="600px"]` |
| 注册 | `/app-register` | `[school_app page="auth/register" height="700px"]` |

**完成！** 您的应用已经可以使用了。

---

## 🎨 方案二：API 集成（推荐）

### 适合场景
- 需要与 WordPress 主题完美融合
- 想要完全控制样式
- 提供最佳用户体验

### 使用步骤

#### 1. 部署 Next.js 应用（同上）

#### 2. 配置 CORS

在 Next.js 项目中，编辑每个 API 文件，在开头添加：

```typescript
// 例如：src/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 添加 CORS 头
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://your-wordpress-site.com',
    'http://localhost' // 本地开发
  ];
  
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ... 原有代码
}
```

或者使用 `next.config.js` 统一配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://your-wordpress-site.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

重新部署：
```bash
vercel deploy --prod
```

#### 3. 添加 Code Snippet

1. 在 WordPress 后台，进入 **Snippets** → **Add New**
2. 复制 `api-integration.php` 的完整内容
3. 修改第 22 行：
   ```php
   define('SCHOOL_APP_API_URL', 'https://your-api.vercel.app');
   ```
4. 保存并激活

#### 4. 创建 WordPress 页面

使用 Elementor 创建以下页面：

##### 登录页面 (`/login`)
```
[school_app_login]
```

##### 注册页面 (`/register`)
```
[school_app_register]
```

##### 申请列表页面 (`/applications`)
```
[school_app_dashboard]
```

##### 创建申请页面 (`/create-application`)
```
[school_app_templates]
```

#### 5. 添加到菜单

在 WordPress 后台：
1. **外观** → **菜单**
2. 添加自定义链接：
   - **申请助手** → `/applications`
   - **我的资料** → `/profile`

**完成！** 完整集成的应用已经可以使用。

---

## 🔧 常见问题

### Q1: iframe 无法显示内容

**原因**: X-Frame-Options 限制

**解决方案**: 在 Next.js 中添加配置

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
}
```

### Q2: API 请求 CORS 错误

**错误信息**: `Access-Control-Allow-Origin` 缺失

**解决方案**: 参考上面的 CORS 配置步骤

### Q3: 登录后没有保存状态

**原因**: Cookie 没有正确保存

**解决方案**: 检查：
1. API URL 使用 HTTPS（不是 HTTP）
2. WordPress 和 API 在同一顶级域名下
3. 浏览器允许第三方 Cookie

### Q4: 样式显示不正常

**原因**: CSS 冲突

**解决方案**: 在 Code Snippet 中添加更具体的选择器：

```css
/* 在 api-integration.php 的样式部分 */
.school-app-dashboard .btn {
    /* 添加 !important 提高优先级 */
    background: #0ea5e9 !important;
}
```

### Q5: 即使设置了 Elementor Canvas，登录后还是显示 WordPress Header

**原因**: 
- 某些主题会强制显示 header
- WordPress Admin Bar（登录后的顶部工具栏）默认显示
- Elementor Canvas 模板可能无法完全覆盖主题设置

**解决方案**: 使用 `hide-header-on-login.php` 代码片段

1. 在 WordPress 后台，进入 **Code Snippets** → **Add New**
2. 复制 `hide-header-on-login.php` 的内容
3. 根据需要修改配置（默认会自动检测包含应用 shortcode 的页面）
4. 保存并激活

**详细说明**: 请查看 `HIDE_HEADER_GUIDE.md` 获取完整指南。

**快速配置示例**:
```php
// 只在登录用户查看时隐藏 header（推荐）
define('HIDE_HEADER_LOGGED_IN_ONLY', true);

// 指定特定页面 ID 隐藏 header
define('HIDE_HEADER_PAGE_IDS', array(123, 456));

// 指定特定页面 slug 隐藏 header
define('HIDE_HEADER_PAGE_SLUGS', array('dashboard', 'applications'));
```

---

## 🎨 自定义样式

### 修改主题颜色

在 Code Snippet 的 `<style>` 部分修改：

```css
/* 主色调 */
.btn-primary {
    background: #YOUR_COLOR !important;
}

/* 状态徽章 */
.status-badge {
    /* 自定义样式 */
}
```

### 使用 WordPress 主题样式

```php
// 在短代码中使用主题的按钮类
<button class="btn btn-primary wp-block-button__link">
    按钮文字
</button>
```

---

## 📱 响应式设计

代码片段已经包含响应式设计，在移动设备上会自动适配。

如需自定义移动端样式：

```css
@media (max-width: 768px) {
    .school-app-dashboard {
        padding: 10px;
    }
    
    .applications-grid {
        grid-template-columns: 1fr;
    }
}
```

---

## 🚀 性能优化

### 1. 懒加载 iframe

```php
<iframe loading="lazy" ...>
```

已在 `quick-start-iframe.php` 中包含。

### 2. 缓存 API 响应

```php
// 在 API 客户端类中添加
private function cache_get($key) {
    return get_transient('school_app_' . $key);
}

private function cache_set($key, $value, $expiration = 300) {
    set_transient('school_app_' . $key, $value, $expiration);
}
```

### 3. 异步加载 JavaScript

```php
wp_enqueue_script('school-app-script', $url, array('jquery'), '1.0', true);
// 最后一个参数 true 表示在页脚加载
```

---

## 🔐 安全建议

1. **使用 HTTPS**
   - 确保 WordPress 和 API 都使用 HTTPS
   - 在 `.env` 中配置 SSL

2. **验证用户权限**
   ```php
   if (!is_user_logged_in()) {
       return '请先登录';
   }
   ```

3. **Token 安全**
   - 使用 HttpOnly Cookie
   - 设置合理的过期时间
   - 定期刷新 Token

4. **输入验证**
   ```php
   $email = sanitize_email($_POST['email']);
   $text = sanitize_text_field($_POST['text']);
   ```

---

## 📈 下一步

完成集成后，您可以：

1. **自定义模板**
   - 在数据库中添加更多学校模板
   - 使用 Prisma Studio 管理

2. **扩展功能**
   - 添加文件上传
   - 集成支付系统
   - 邮件通知

3. **优化体验**
   - 添加加载动画
   - 改进错误提示
   - 多语言支持

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看浏览器控制台 (F12)
2. 查看 WordPress 错误日志
3. 检查 API 响应

提供以下信息便于调试：
- WordPress 版本
- PHP 版本
- 错误信息截图
- 网络请求详情

---

## 📞 技术支持

- GitHub Issues
- WordPress 插件论坛
- 项目文档

**祝您集成顺利！** 🎉

