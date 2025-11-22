# WordPress Base URL 配置修复指南

## 🚨 错误信息

如果您看到以下错误：

```
WordPress 学校数据加载失败：Proxy API responded with 500: 
{"error":"WordPress base URL is not configured on the server.","_debug":{"message":"Set WORDPRESS_BASE_URL or NEXT_PUBLIC_WORDPRESS_BASE_URL environment variable"}}
```

这说明 WordPress base URL 环境变量没有配置。

---

## ✅ 快速修复（3 分钟）

### 步骤 1: 确定您的 WordPress 网站 URL

首先，您需要知道您的 WordPress 网站的 URL。例如：
- `https://sosomama.com`
- `https://example.com`
- `https://your-wordpress-site.com`

**注意**：URL 应该：
- ✅ 以 `https://` 开头（或 `http://` 如果是本地开发）
- ✅ 不包含尾部斜杠（例如：使用 `https://sosomama.com` 而不是 `https://sosomama.com/`）

---

### 步骤 2: 配置环境变量

#### 方法 A: 本地开发（.env 文件）

1. **打开项目根目录的 `.env` 文件**

   如果没有 `.env` 文件，创建一个新文件。

2. **添加以下配置**

   ```env
   # WordPress Base URL（从 WordPress 网站加载学校数据）
   WORDPRESS_BASE_URL=https://sosomama.com
   
   # 或者使用 NEXT_PUBLIC_ 前缀（客户端也可以访问）
   NEXT_PUBLIC_WORDPRESS_BASE_URL=https://sosomama.com
   ```

   **选择其中一个**：
   - 如果只需要服务器端访问，使用 `WORDPRESS_BASE_URL`
   - 如果需要客户端也能访问，使用 `NEXT_PUBLIC_WORDPRESS_BASE_URL`

3. **保存文件**

4. **重启开发服务器**

   ```powershell
   # 停止当前服务器（Ctrl+C）
   # 然后重新启动
   npm run dev
   ```

---

#### 方法 B: 生产环境（Vercel）

如果您部署在 Vercel 上：

1. **访问 Vercel 项目页面**

2. **进入设置**
   - 点击顶部菜单 "Settings"
   - 点击左侧 "Environment Variables"

3. **添加环境变量**
   
   点击 "Add" 按钮，然后：
   
   **名称**：
   ```
   WORDPRESS_BASE_URL
   ```
   
   **值**：
   ```
   https://sosomama.com
   ```
   （替换成您的 WordPress URL）
   
   **环境**：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   
   点击 "Save"

4. **重新部署**

   - 点击顶部 "Deployments"
   - 找到最新的部署
   - 点击右侧三个点 "..."
   - 选择 "Redeploy"
   - 等待部署完成

---

### 步骤 3: 验证配置

#### 本地验证

1. **检查环境变量是否正确加载**

   在浏览器控制台或服务器日志中，不应该再看到 "WordPress base URL is not configured" 错误。

2. **测试 WordPress API 端点**

   在浏览器中访问：
   ```
   http://localhost:3000/api/wordpress/schools
   ```

   应该返回学校数据，而不是错误信息。

#### 生产环境验证

1. **访问应用的生产 URL**
   - 例如：`https://your-app.vercel.app`

2. **打开浏览器开发者工具**
   - 按 `F12`
   - 切换到 "Network" 选项卡

3. **刷新页面并查看网络请求**
   - 查找 `/api/wordpress/schools` 请求
   - 应该返回 200 状态码和学校数据

---

## 🔍 常见问题

### Q1: 如何知道我的 WordPress URL 是什么？

**答**：
- 查看您的 WordPress 网站地址栏
- 或者查看 WordPress 后台设置 → 常规 → WordPress 地址 (URL)

### Q2: 我应该使用 WORDPRESS_BASE_URL 还是 NEXT_PUBLIC_WORDPRESS_BASE_URL？

**答**：
- **`WORDPRESS_BASE_URL`**：仅在服务器端可用（API 路由）
- **`NEXT_PUBLIC_WORDPRESS_BASE_URL`**：服务器端和客户端都可用

**推荐**：如果您不确定，使用 `NEXT_PUBLIC_WORDPRESS_BASE_URL`，这样更灵活。

### Q3: 修改了 .env 文件后仍然报错？

**答**：
1. **确保文件已保存**
2. **重启开发服务器**（环境变量只在启动时加载）
   ```powershell
   # 停止服务器 (Ctrl+C)
   npm run dev
   ```
3. **检查文件格式**
   - 确保没有多余的空格
   - 确保值没有用引号包围（除非值本身包含特殊字符）
   - 确保没有注释符号 `#` 在值后面

### Q4: Vercel 上配置后仍然报错？

**答**：
1. **确认环境变量已保存**
   - 回到 Environment Variables 页面
   - 确认变量出现在列表中

2. **确认已重新部署**
   - 添加环境变量后，必须重新部署才会生效
   - Vercel 不会自动重新部署

3. **检查变量名称**
   - 确保大小写完全匹配
   - 确保没有多余的空格

4. **查看部署日志**
   - 在 Deployments 页面
   - 点击最新的部署
   - 查看 "Build Logs"
   - 检查是否有错误信息

### Q5: URL 应该包含尾部斜杠吗？

**答**：**不应该**。
- ✅ 正确：`https://sosomama.com`
- ❌ 错误：`https://sosomama.com/`

代码会自动处理尾部斜杠。

---

## 📋 完整 .env 文件示例

如果您需要完整的 `.env` 文件示例：

```env
# 数据库连接字符串
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT 密钥
JWT_SECRET="your-jwt-secret-here"

# 应用 URL（本地开发）
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# WordPress Base URL（从 WordPress 加载学校数据）
WORDPRESS_BASE_URL="https://sosomama.com"
# 或者
NEXT_PUBLIC_WORDPRESS_BASE_URL="https://sosomama.com"

# OpenAI API Key（可选，AI 功能需要）
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_BASE_URL="https://api.openai.com"
```

---

## ✅ 检查清单

配置完成后，请确认：

- [ ] `.env` 文件中已添加 `WORDPRESS_BASE_URL` 或 `NEXT_PUBLIC_WORDPRESS_BASE_URL`
- [ ] 值设置为正确的 WordPress URL（没有尾部斜杠）
- [ ] 开发服务器已重启（本地开发）
- [ ] Vercel 环境变量已设置（生产环境）
- [ ] Vercel 已重新部署（生产环境）
- [ ] 错误信息已消失
- [ ] 学校映射管理可以正常加载数据

---

## 🆘 仍然有问题？

如果按照以上步骤操作后仍然有问题：

1. **检查 WordPress API 是否可访问**
   
   在浏览器中访问：
   ```
   https://your-wordpress-url.com/wp-json/schools/v1/list
   ```
   
   或者：
   ```
   https://your-wordpress-url.com/wp-json/wp/v2/profile?per_page=10
   ```
   
   应该返回 JSON 数据。如果返回 404 或错误，说明 WordPress API 端点没有正确配置。

2. **查看服务器日志**
   
   在 Vercel 部署日志或本地终端中查看详细的错误信息。

3. **联系技术支持**
   
   提供以下信息：
   - 错误消息的完整内容
   - 您的 WordPress URL
   - 环境变量配置截图
   - 服务器日志（如果可能）

