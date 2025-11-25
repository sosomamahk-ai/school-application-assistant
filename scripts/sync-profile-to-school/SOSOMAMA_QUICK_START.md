# SOSOMAMA.com 快速配置

您的 WordPress 站点是：**https://sosomama.com**

## 🚀 快速配置（2 步）

### 步骤 1: 检测 REST API 端点

运行端点检测工具自动找到正确的端点：

```bash
npm run sync:profile-to-school:detect-endpoint
```

**这个工具会**：
- ✅ 连接到 https://sosomama.com
- ✅ 自动检测所有可能的 Profile 端点
- ✅ 显示可用的端点和记录数
- ✅ 可选：自动更新 `.env` 文件

**当工具询问 WordPress URL 时，输入：**
```
https://sosomama.com
```

或者先手动在 `.env` 文件中添加：
```env
WP_BASE_URL=https://sosomama.com
```

### 步骤 2: 配置认证（如果需要）

如果端点检测成功，但需要认证，运行配置脚本：

```bash
npm run sync:profile-to-school:setup
```

## 📝 手动配置（如果检测工具不可用）

如果无法运行检测工具，可以在 `.env` 文件中手动添加：

```env
# WordPress 配置
WP_BASE_URL=https://sosomama.com
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile

# 认证配置（如果是公开站点，使用 none）
WP_AUTH_TYPE=none
```

## 🔍 测试端点

手动测试端点是否可用：

```powershell
# 测试 WordPress REST API
curl https://sosomama.com/wp-json/wp/v2

# 测试 Profile 端点（如果存在）
curl https://sosomama.com/wp-json/wp/v2/profile?per_page=1
```

## ✅ 验证配置

配置完成后，运行抽样测试：

```bash
# 1. 生成 Prisma Client
npx prisma generate

# 2. 运行抽样测试（不修改数据库）
npm run sync:profile-to-school -- --sample 20 --dry-run
```

## 📚 完整文档

- **端点检测指南**: `DETECT_ENDPOINT_GUIDE.md`
- **完整配置指南**: `SOSOMAMA_SETUP.md`
- **测试步骤**: `TEST_AND_SYNC_STEPS.md`

