# 如何查看 Cookie 的完整属性（包括 SameSite）

## 方法 1：使用浏览器控制台（推荐）

在 WordPress 页面的 iframe 中登录后，打开浏览器控制台（F12 → Console），执行以下命令：

```javascript
// 方法 1：查看所有 cookie 的详细信息
document.cookie.split(';').forEach(cookie => {
  console.log('Cookie:', cookie.trim());
});

// 方法 2：检查 token cookie 是否存在
const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
console.log('Token cookie:', tokenCookie);

// 方法 3：使用更详细的方法检查（需要访问 iframe）
// 注意：如果 WordPress 和 Vercel 是不同域名，需要先切换到 iframe 的上下文
```

## 方法 2：在 Application/Storage 标签中查看

### Chrome/Edge：
1. F12 → **Application** 标签
2. 左侧 **Cookies** → 展开 `https://school-application-assistant.vercel.app`
3. 点击 `token` cookie
4. 在右侧面板查看所有属性：
   - **Name**: token
   - **Value**: (token 值)
   - **Domain**: school-application-assistant.vercel.app
   - **Path**: /
   - **Expires**: (过期时间)
   - **Size**: (大小)
   - **HttpOnly**: (如果有)
   - **Secure**: ✓ 或 ✗
   - **SameSite**: None / Lax / Strict

**如果 SameSite 列没有显示：**
- 右键点击表格标题行（Name, Value, Domain 等）
- 勾选 **SameSite** 列

### Firefox：
1. F12 → **Storage** 标签
2. 左侧 **Cookies** → 展开 `https://school-application-assistant.vercel.app`
3. 点击 `token` cookie
4. 在右侧查看属性，SameSite 应该显示在列表中

## 方法 3：使用 Network 标签验证

1. F12 → **Network** 标签
2. 在 WordPress 页面中访问管理页面（如 `[school_app_templates]`）
3. 找到对 `https://school-application-assistant.vercel.app/admin/templates` 的请求
4. 点击该请求
5. 查看 **Request Headers** 部分
6. 查找 `Cookie:` 行
7. 应该看到类似：`Cookie: token=eyJhbGc...`（如果 cookie 正确发送）

**如果 Request Headers 中没有 `Cookie:` 行，说明 cookie 没有被发送。**

## 方法 4：使用 JavaScript 验证 iframe 环境

在 WordPress 页面的 iframe 中，打开控制台执行：

```javascript
// 检查是否在 iframe 中
try {
  const isEmbedded = window.self !== window.top;
  console.log('是否在 iframe 中:', isEmbedded);
} catch(e) {
  console.log('是否在 iframe 中: true (跨域)');
}

// 检查当前 cookie 设置
console.log('当前所有 cookie:', document.cookie);

// 尝试读取 token cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const token = getCookie('token');
console.log('Token 是否存在:', !!token);
console.log('Token 值:', token ? token.substring(0, 20) + '...' : 'null');
```

## 方法 5：检查 Cookie 设置代码是否执行

在登录成功后，在控制台执行：

```javascript
// 手动设置 cookie 来测试
document.cookie = 'test_cookie=test_value; Path=/; Max-Age=3600; SameSite=None; Secure';
console.log('测试 cookie 已设置');

// 检查测试 cookie
console.log('测试 cookie:', document.cookie.includes('test_cookie'));
```

## 如果 SameSite 仍然是 Lax

如果检查后发现 cookie 的 SameSite 仍然是 `Lax`，可能的原因：

1. **代码未正确部署**：确认 `src/utils/token.ts` 的最新代码已部署到 Vercel
2. **浏览器缓存**：清除缓存并硬刷新（Ctrl+Shift+Delete 或 Ctrl+F5）
3. **登录逻辑问题**：确认登录成功后确实调用了 `setAuthTokenCookie`

## 验证步骤

1. ✅ 在 WordPress iframe 中登录
2. ✅ 打开控制台，执行上述 JavaScript 命令
3. ✅ 检查 Application/Storage 标签中的 cookie 属性
4. ✅ 访问管理页面，检查 Network 请求是否包含 Cookie header
5. ✅ 如果 SameSite 是 None 且 Secure 已启用，但 cookie 仍未发送，可能是浏览器隐私设置问题

