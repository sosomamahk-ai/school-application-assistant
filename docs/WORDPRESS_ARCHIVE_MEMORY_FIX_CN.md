# WordPress Archive 页面内存错误修复指南（中文）

## 🔴 问题描述

访问 `https://sosomama.com/profile_type/hk-is-template/` 时出现错误：

```
Fatal error: Allowed memory size of 536870912 bytes exhausted (tried to allocate 40960 bytes) 
in /www/wwwroot/sosomama.com/public_html/wp-includes/meta.php on line 1202
```

**错误原因**：该分类下有太多文章，WordPress 尝试一次性加载所有文章的 meta 数据，导致内存不足（512MB 耗尽）。

## ✅ 解决方案

### 方法 1：限制每页文章数量（推荐）

通过限制每页显示的文章数量并使用分页功能来解决内存问题。

#### 实施步骤

**步骤 1：备份网站** ⚠️
- 在进行任何修改前，务必备份网站和数据库

**步骤 2：添加修复代码**

有两种方式添加代码：

**方式 A：通过 Code Snippets 插件（推荐）**

1. 如果还没有安装 Code Snippets 插件，先安装并激活
2. 在 WordPress 后台：代码片段 > 添加新代码片段
3. 代码片段标题：`修复 Archive 页面内存错误`
4. 复制 `wordpress-snippets/fix-archive-memory-error.php` 文件的全部内容
5. 粘贴到代码框中
6. 点击"保存更改并激活"

**方式 B：直接修改 functions.php**

1. 通过 FTP 或 WordPress 文件管理器访问主题文件
2. 找到：`wp-content/themes/你的主题名/functions.php`
3. 在文件末尾添加 `fix-archive-memory-error.php` 的所有内容
4. 保存文件

**步骤 3：清除缓存**
- 清除 WordPress 缓存（如果使用缓存插件）
- 清除浏览器缓存

**步骤 4：测试**

访问以下页面确认修复成功：
- ✅ `https://sosomama.com/profile_type/hk-is-template/` - 应该正常加载
- ✅ 页面底部应该显示分页导航（如果有超过 12 篇文章）

### 方法 2：增加 PHP 内存限制（临时方案）

如果方法 1 不够用，可以临时增加内存限制。

**修改 wp-config.php**：

1. 找到网站根目录的 `wp-config.php` 文件
2. 在文件开头 `<?php` 之后添加：

```php
define('WP_MEMORY_LIMIT', '768M');
define('WP_MAX_MEMORY_LIMIT', '768M');
```

3. 保存文件

**注意**：这只是临时方案，根本解决方案还是使用方法 1 限制查询数量。

## 🔧 自定义设置

### 修改每页显示的文章数量

默认每页显示 12 篇文章。如需修改，在 `functions.php` 或 Code Snippets 中添加：

```php
// 修改为每页显示 24 篇文章
add_filter('sosomama_archive_posts_per_page', function() {
    return 24;
});
```

## 📋 功能说明

修复代码会自动：

1. ✅ 限制 taxonomy archive 页面每页只显示 12 篇文章
2. ✅ 自动启用分页功能
3. ✅ 优化查询性能，缓存数据
4. ✅ 只影响 archive 页面，不影响其他页面

## 🐛 故障排除

### 问题 1：页面仍然报错

**检查清单**：
- [ ] 代码是否已正确添加并激活？
- [ ] 是否有 PHP 语法错误？（查看错误日志）
- [ ] 是否清除了缓存？
- [ ] 是否有插件冲突？（临时禁用所有插件测试）

### 问题 2：看不到分页导航

**可能原因**：主题不支持分页或文章数量不足

**解决方法**：
- 确认该分类下是否有超过 12 篇文章
- 检查主题是否有分页功能
- 可以联系主题开发者添加分页支持

### 问题 3：其他页面受影响

修复代码已经做了精确的条件判断，只影响以下页面：
- `profile_type` taxonomy archive 页面
- `school_category` taxonomy archive 页面
- `profile` post type archive 页面

其他页面不受影响。

## 📞 需要帮助？

如果问题仍未解决，请提供以下信息：

1. WordPress 版本
2. PHP 版本
3. 主题名称
4. 错误日志内容（`wp-content/debug.log`）
5. 已安装的插件列表

## 📁 相关文件

- `wordpress-snippets/fix-archive-memory-error.php` - 修复代码
- `docs/WORDPRESS_ARCHIVE_MEMORY_FIX.md` - 英文详细文档

## ⚡ 快速修复（5 分钟）

如果你熟悉 WordPress，最快的方法是：

1. 安装 Code Snippets 插件
2. 创建新代码片段，复制 `fix-archive-memory-error.php` 的内容
3. 激活代码片段
4. 清除缓存
5. 测试页面

完成！页面应该可以正常加载了。


