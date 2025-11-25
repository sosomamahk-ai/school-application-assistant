# WordPress Profile 端点检测指南

## 问题：不知道 REST API 端点是什么？

如果您不知道 WordPress Profile post type 的 REST API 端点是什么，可以使用自动检测工具。

## 🚀 自动检测端点

### 方法 1: 使用自动检测脚本（推荐）

运行自动检测脚本：

```bash
npm run sync:profile-to-school:detect-endpoint
```

这个脚本会：

1. ✅ 检查 WordPress REST API 连接
2. ✅ 获取所有注册的 post types
3. ✅ 自动测试常见的端点路径
4. ✅ 显示所有可用的端点
5. ✅ 推荐最佳端点
6. ✅ 可选：自动更新 .env 文件

### 示例输出

```
═══════════════════════════════════════════════════════════
WordPress Profile REST API 端点检测工具
═══════════════════════════════════════════════════════════

WordPress URL: http://localhost:3000

步骤 1: 检查 WordPress REST API 连接...
✅ WordPress REST API 可访问

步骤 2: 获取所有注册的 post types...
✅ 找到 5 个 post types:
   - post
   - page
   - profile
   - university
   - attachment

步骤 3: 测试可能的端点...
测试 /wp-json/wp/v2/profile... ✅ 可用 (150 条记录)
     示例: ID 123 - Example School 1
     示例: ID 124 - Example School 2

═══════════════════════════════════════════════════════════
检测结果
═══════════════════════════════════════════════════════════

✅ 找到以下可用的端点:

1. /wp-json/wp/v2/profile
   记录数: 150
   示例记录:
     - ID 123: Example School 1
     - ID 124: Example School 2

═══════════════════════════════════════════════════════════
推荐配置
═══════════════════════════════════════════════════════════

推荐的端点: /wp-json/wp/v2/profile

在 .env 文件中添加或更新:

WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile

是否自动更新 .env 文件？(y/n): y
✅ 已更新 .env 文件: WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile
```

### 自动更新 .env 文件

脚本会询问是否自动更新 `.env` 文件。如果选择 "y"，会自动添加或更新：

```env
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile
```

也可以使用 `--auto-update` 参数自动更新，不询问：

```bash
npm run sync:profile-to-school:detect-endpoint -- --auto-update
```

## 🔍 方法 2: 手动检测

### 步骤 1: 检查 WordPress REST API 基础路径

```bash
curl http://localhost:3000/wp-json/wp/v2
```

如果成功，会返回 JSON 格式的所有可用端点。

### 步骤 2: 获取所有 post types

```bash
curl http://localhost:3000/wp-json/wp/v2/types
```

这会显示所有注册的 post types 及其 REST API 端点。

### 步骤 3: 测试常见端点

WordPress REST API 端点通常遵循以下模式：

```
/wp-json/wp/v2/<post-type-name>
```

常见的 Profile 相关端点：

1. `/wp-json/wp/v2/profile` - 单数形式（最常见）
2. `/wp-json/wp/v2/profiles` - 复数形式
3. `/wp-json/wp/v2/school` - 如果 post type 名为 school
4. `/wp-json/wp/v2/schools` - 复数形式

测试端点：

```bash
# 测试 /wp-json/wp/v2/profile
curl http://localhost:3000/wp-json/wp/v2/profile?per_page=1

# 如果返回 JSON 数组，说明端点正确
# 如果返回 404，说明端点不存在
```

### 步骤 4: 确认端点

如果端点返回类似以下内容，说明端点正确：

```json
[
  {
    "id": 123,
    "slug": "example-school",
    "title": {
      "rendered": "Example School"
    },
    ...
  }
]
```

## 📝 方法 3: 查看 WordPress 代码

如果您有 WordPress 主题或插件的代码访问权限，可以查看：

### 查找 post type 注册

搜索 `register_post_type` 函数：

```php
register_post_type('profile', array(
    'public' => true,
    'show_in_rest' => true,  // 必须为 true
    'rest_base' => 'profile', // REST API 端点名称
    ...
));
```

REST API 端点将是：`/wp-json/wp/v2/<rest_base>`

### 如果没有设置 `rest_base`

如果没有设置 `rest_base`，默认使用 post type 名称。

## ❓ 常见问题

### Q: 端点返回 404

**可能原因**：
1. Post type 未注册到 REST API（`show_in_rest` 未设置为 `true`）
2. Post type 名称不同
3. 端点路径不同

**解决方案**：
1. 检查 WordPress 后台，确认 post type 名称
2. 检查 `register_post_type` 代码，确认 `show_in_rest` 为 `true`
3. 尝试不同的端点路径

### Q: 端点存在但返回空数组

**可能原因**：
1. 没有已发布的 profile posts
2. 认证权限不足
3. Post type 未正确注册

**解决方案**：
1. 在 WordPress 后台创建并发布一个 profile post
2. 检查认证配置
3. 使用检测脚本验证端点

### Q: 检测脚本找不到端点

**解决方案**：
1. 确认 WordPress 站点运行正常
2. 检查 `WP_BASE_URL` 配置
3. 尝试手动访问 `http://your-site/wp-json/wp/v2/types`
4. 联系 WordPress 管理员获取端点信息

## 📚 相关文档

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Register Post Type](https://developer.wordpress.org/reference/functions/register_post_type/)

## 🔧 快速命令

```bash
# 检测端点（交互式）
npm run sync:profile-to-school:detect-endpoint

# 检测端点（自动更新 .env）
npm run sync:profile-to-school:detect-endpoint -- --auto-update

# 测试特定端点
curl http://localhost:3000/wp-json/wp/v2/profile?per_page=1

# 查看所有 post types
curl http://localhost:3000/wp-json/wp/v2/types
```

