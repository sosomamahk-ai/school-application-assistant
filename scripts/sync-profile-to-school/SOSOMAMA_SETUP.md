# SOSOMAMA.com 快速配置指南

根据您提供的信息，WordPress 站点 URL 是：**https://sosomama.com/**

## 🚀 快速开始（3 步）

### 步骤 1: 设置 WordPress URL

在项目根目录的 `.env` 文件中添加：

```env
WP_BASE_URL=https://sosomama.com
```

或者运行配置脚本，输入这个 URL。

### 步骤 2: 检测 REST API 端点

运行端点检测工具：

```bash
npm run sync:profile-to-school:detect-endpoint
```

这个工具会：
- ✅ 连接到 https://sosomama.com
- ✅ 自动查找 Profile post type 的 REST API 端点
- ✅ 显示可用的端点
- ✅ 可选：自动更新 `.env` 文件

### 步骤 3: 配置认证（如果需要）

根据检测结果，如果端点需要认证，运行：

```bash
npm run sync:profile-to-school:setup
```

## 🔍 手动测试端点

如果自动检测工具无法运行，可以手动测试：

```bash
# 测试 WordPress REST API 是否可用
curl https://sosomama.com/wp-json/wp/v2

# 测试常见的 Profile 端点
curl https://sosomama.com/wp-json/wp/v2/profile?per_page=1

# 查看所有注册的 post types
curl https://sosomama.com/wp-json/wp/v2/types
```

## 📝 常见端点路径

根据 sosomama.com 网站内容，可能的端点包括：

1. `/wp-json/wp/v2/profile` - 最常见的 Profile 端点
2. `/wp-json/wp/v2/school` - 如果 post type 名为 school
3. `/wp-json/wp/v2/profiles` - 复数形式
4. `/wp-json/acf/v3/profile` - 如果使用 ACF to REST API 插件

## ⚙️ 完整配置示例

`.env` 文件配置示例：

```env
# WordPress 配置
WP_BASE_URL=https://sosomama.com
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile

# 认证配置（如果需要）
WP_AUTH_TYPE=none
# 如果站点是公开的，使用 none
# 如果需要认证，使用 basic/bearer/wp-app-password

# 数据库配置（已有）
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 可选配置
BATCH_SIZE=50
LOG_LEVEL=info
```

## 🔐 认证配置

根据 [sosomama.com](https://sosomama.com/) 网站，如果站点是公开的，可能不需要认证。如果 REST API 需要认证：

### 选项 1: 无认证（如果 API 公开）
```env
WP_AUTH_TYPE=none
```

### 选项 2: WordPress Application Password（推荐）
```env
WP_AUTH_TYPE=wp-app-password
WP_AUTH_USERNAME=your-username
WP_AUTH_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

在 WordPress 后台生成 Application Password：
1. 进入 WordPress 后台
2. 用户 → 个人资料
3. 应用程序密码 → 生成新的应用程序密码

## ✅ 验证配置

配置完成后，运行抽样测试：

```bash
# 1. 生成 Prisma Client
npx prisma generate

# 2. 运行抽样测试（dry-run，不修改数据库）
npm run sync:profile-to-school -- --sample 20 --dry-run
```

## 🆘 故障排除

### 问题: 无法连接到 WordPress

**检查**：
- 确认 https://sosomama.com 可以访问
- 检查防火墙或网络设置
- 尝试手动访问：https://sosomama.com/wp-json/wp/v2

### 问题: 端点返回 404

**可能原因**：
- Profile post type 未注册到 REST API
- 端点路径不同
- REST API 被禁用

**解决方案**：
1. 使用检测工具测试不同端点
2. 联系 WordPress 管理员确认 post type 配置
3. 检查 WordPress 设置，确认 REST API 已启用

### 问题: 需要认证但不知道如何配置

**解决方案**：
1. 联系 WordPress 管理员获取认证信息
2. 使用 WordPress Application Password（最安全的方式）
3. 在 WordPress 后台生成 Application Password

## 📞 下一步

1. ✅ 运行端点检测：`npm run sync:profile-to-school:detect-endpoint`
2. ✅ 配置认证信息（如果需要）
3. ✅ 运行抽样测试：`npm run sync:profile-to-school -- --sample 20 --dry-run`
4. ✅ 验证结果后运行完整同步

