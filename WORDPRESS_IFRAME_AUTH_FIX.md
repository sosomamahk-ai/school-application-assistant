# WordPress iframe 中 admin 页面跳转问题修复步骤

## 问题原因

在 WordPress iframe 中访问 `/admin/*` 页面时，Next.js 的 `getServerSideProps` 在服务端检查 cookie。如果 cookie 是 `SameSite=Lax`，浏览器在跨域 iframe 中**不会发送**这个 cookie 给服务端，导致服务端认为用户未登录，从而重定向到首页。

## 解决方案

需要确保 cookie 设置为 `SameSite=None; Secure`，这样在 iframe 中才能正常发送。

---

## 详细步骤

### 步骤 1：确认代码已更新

1. 打开 `src/utils/token.ts`，确认代码包含以下逻辑：
   ```typescript
   function resolveCookieAttributes() {
     // ... 检测 iframe 环境
     if (isEmbedded) {
       return { sameSite: 'None', secure: '; Secure' };
     }
     // ...
   }
   ```

2. 如果代码已更新，继续下一步。如果未更新，请先部署最新代码到 Vercel。

### 步骤 2：清除旧的 cookie（重要！）

**在 WordPress 页面中操作：**

1. 打开浏览器开发者工具（F12）
2. 切换到 **Application** 标签（Chrome）或 **Storage** 标签（Firefox）
3. 左侧找到 **Cookies** → 展开 `https://school-application-assistant.vercel.app`
4. 找到名为 `token` 的 cookie
5. **右键点击 `token` cookie → Delete**（删除它）
6. 如果还有其他相关 cookie（如 `user`），也一并删除

**或者使用控制台清除：**
```javascript
// 在浏览器控制台执行
document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
document.cookie = 'token=; Path=/; Max-Age=0; SameSite=None; Secure';
```

### 步骤 3：重新登录

1. 在 WordPress 页面中，访问登录页面（使用 `[school_app_login]` shortcode）
2. 使用你的 admin 账号登录
3. **登录成功后，立即检查 cookie：**

   - 打开开发者工具 → Application → Cookies → `https://school-application-assistant.vercel.app`
   - 找到 `token` cookie
   - **确认以下属性：**
     - `SameSite`: 应该是 `None`（不是 `Lax`）
     - `Secure`: 应该有勾选（✓）
     - `Path`: 应该是 `/`

### 步骤 4：验证 cookie 是否正确发送

1. 在 WordPress 页面中，访问管理页面（例如使用 `[school_app_templates]`）
2. 打开开发者工具 → **Network** 标签
3. 刷新页面
4. 找到对 `/admin/templates` 的请求（可能是 HTML 请求或 API 请求）
5. 点击该请求，查看 **Headers**
6. 在 **Request Headers** 中查找 `Cookie:` 行
7. **确认是否包含 `token=...`**

   - ✅ **如果包含**：cookie 已正确发送，继续步骤 5
   - ❌ **如果不包含**：说明 cookie 仍未正确设置，回到步骤 2 重新操作

### 步骤 5：测试管理页面

1. 在 WordPress 页面中测试以下 shortcode：
   - `[school_app_templates]` - 应该显示模板管理页面
   - `[school_app_users]` - 应该显示用户管理页面
   - `[school_app_translations]` - 应该显示翻译管理页面

2. 如果页面正常显示，问题已解决 ✅

3. 如果仍然跳转回首页，继续步骤 6

### 步骤 6：检查服务端日志（如果步骤 5 失败）

1. 在 Vercel Dashboard 中查看部署日志
2. 访问管理页面时，查看是否有错误日志
3. 检查 `getServerSideProps` 是否收到 token

### 步骤 7：备用方案 - 修改 getServerSideProps（如果以上步骤都失败）

如果 cookie 仍然无法在 iframe 中发送，可以修改服务端代码，允许从 `Authorization` header 读取 token（需要修改客户端 API 调用方式）。

---

## 常见问题排查

### Q1: Cookie 设置了 `SameSite=None` 但仍然不发送？

**检查：**
- Cookie 的 `Secure` 标志必须启用（因为 `SameSite=None` 要求 `Secure`）
- Vercel 域名必须是 HTTPS（默认是 HTTPS）
- 浏览器版本是否支持 `SameSite=None`（Chrome 51+, Firefox 60+, Safari 12+）

### Q2: 登录后 cookie 仍然是 `SameSite=Lax`？

**可能原因：**
- 代码未正确部署到 Vercel
- 浏览器缓存了旧版本的 JavaScript
- 登录逻辑中调用了旧版本的 `setAuthTokenCookie`

**解决方法：**
- 确认 Vercel 部署已更新
- 清除浏览器缓存（Ctrl+Shift+Delete）
- 硬刷新页面（Ctrl+F5）

### Q3: 在 Vercel 直接访问正常，但在 WordPress iframe 中不行？

**这是正常的！** 因为：
- 直接访问时，浏览器会发送 `SameSite=Lax` cookie
- 在 iframe 中，`SameSite=Lax` cookie 不会被发送（跨域限制）
- 必须使用 `SameSite=None; Secure` 才能在 iframe 中发送

### Q4: 如何确认当前是否在 iframe 中？

在浏览器控制台执行：
```javascript
try {
  console.log('Is embedded:', window.self !== window.top);
} catch(e) {
  console.log('Is embedded: true (cross-origin)');
}
```

---

## 验证清单

完成所有步骤后，确认以下项目：

- [ ] `src/utils/token.ts` 已更新并部署
- [ ] 旧的 `token` cookie 已删除
- [ ] 已重新登录
- [ ] 新的 `token` cookie 的 `SameSite` 是 `None`
- [ ] 新的 `token` cookie 的 `Secure` 已启用
- [ ] Network 请求中能看到 `Cookie: token=...` header
- [ ] 三个管理页面都能正常访问

---

## 如果问题仍然存在

请提供以下信息以便进一步排查：

1. 浏览器类型和版本
2. Cookie 的完整属性（截图）
3. Network 请求的 Headers（截图，特别是 Cookie 和 Set-Cookie）
4. Vercel 部署日志中的相关错误
5. 浏览器控制台的任何错误信息

