# WordPress iframe 中 Admin 页面跳转问题 - 解决方案总结

## 问题描述

在 WordPress iframe 中访问 `/admin/*` 页面（模板管理、用户管理、翻译管理）时，会自动跳转回首页。

## 根本原因

1. **Cookie SameSite 属性问题**：在 WordPress iframe 中，如果 cookie 的 `SameSite` 属性是 `Lax`，浏览器不会在跨域 iframe 请求中发送 cookie 给服务端。
2. **服务端认证失败**：Next.js 的 `getServerSideProps` 在服务端检查 cookie，如果收不到 token cookie，会重定向到首页。
3. **检测逻辑问题**：初始的 iframe 检测逻辑在某些情况下无法正确识别 iframe 环境。

## 解决方案

### 核心修改

1. **增强 iframe 检测逻辑** (`src/utils/token.ts`)：
   - 多种检测方法：`window.self !== window.top`、URL 参数、referrer 检查、`window.frameElement`、localStorage 标记
   - 如果 referrer 与当前域名不同，强制使用 `SameSite=None; Secure`
   - 支持通过 `localStorage.setItem('__is_in_iframe__', 'true')` 手动标记

2. **登录后自动修复** (`src/pages/auth/login.tsx`)：
   - 登录成功后，检查 iframe 环境
   - 如果检测到 iframe，自动重新设置 cookie 为 `SameSite=None; Secure`

3. **WordPress Snippet 更新** (`wordpress-snippets/api-integration.php`)：
   - 自动在 iframe URL 中添加 `?embed=true` 参数（如果 snippet 可以更新）

## 当前工作状态

✅ **问题已解决**：管理页面可以正常访问，不再跳转。

### 当前工作流程

1. 用户在 WordPress iframe 中登录
2. 检测到 referrer 是 `sosomama.com`（WordPress 域名），与当前域名不同
3. 自动设置 cookie 为 `SameSite=None; Secure`
4. 服务端能正常收到 cookie，认证通过
5. 管理页面正常显示

## 使用说明

### 正常使用

现在可以直接使用，无需额外操作：
- 在 WordPress 页面中登录
- 访问管理页面 shortcode：`[school_app_templates]`、`[school_app_users]`、`[school_app_translations]`
- 页面应该正常显示

### 如果遇到问题

如果将来再次遇到跳转问题，可以：

1. **手动设置 iframe 标记**（在登录前）：
   ```javascript
   localStorage.setItem('__is_in_iframe__', 'true');
   ```

2. **手动修复 cookie**（登录后）：
   ```javascript
   const token = localStorage.getItem('token');
   if (token) {
     document.cookie = `token=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=None; Secure`;
     console.log('✅ Cookie 已修复');
   }
   ```

## 技术细节

### Cookie 设置逻辑

```javascript
// 检测 iframe 环境
if (isEmbedded || referrerDifferent || localStorage.getItem('__is_in_iframe__') === 'true') {
  // 使用 SameSite=None; Secure
  document.cookie = `token=${token}; Path=/; Max-Age=604800; SameSite=None; Secure`;
} else {
  // 使用 SameSite=Lax
  document.cookie = `token=${token}; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
}
```

### 检测方法优先级

1. `window.self !== window.top` - 最直接的方法
2. URL 参数 `embed=true` - 如果 WordPress snippet 添加了参数
3. Referrer 检查 - 如果 referrer 与当前域名不同
4. `window.frameElement` - 检查是否有父窗口
5. localStorage 标记 - 手动设置的标记

## 后续优化建议

1. **WordPress Snippet 自动设置标记**：
   - 如果 WordPress snippet 可以更新，添加代码自动设置 `localStorage.setItem('__is_in_iframe__', 'true')`
   - 这样即使其他检测方法失败，也能正常工作

2. **环境变量配置**：
   - 可以添加环境变量 `FORCE_IFRAME_MODE=true`，强制所有 cookie 使用 `SameSite=None`
   - 适用于完全在 iframe 中使用的场景

3. **监控和日志**：
   - 可以添加错误监控，如果检测失败但实际在 iframe 中，记录日志
   - 帮助发现边缘情况

## 相关文件

- `src/utils/token.ts` - Cookie 设置和 iframe 检测逻辑
- `src/pages/auth/login.tsx` - 登录后自动修复 cookie
- `wordpress-snippets/api-integration.php` - WordPress shortcode 定义

## 测试验证

✅ 登录后 cookie 正确设置为 `SameSite=None; Secure`
✅ 管理页面可以正常访问，不再跳转
✅ 服务端能正常收到 cookie，认证通过

---

**最后更新**：2024年（问题已解决）

