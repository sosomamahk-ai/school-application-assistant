# WordPress Archive 页面内存错误修复指南

## 问题描述

访问 `https://sosomama.com/profile_type/hk-is-template/` 时出现以下错误：

```
Fatal error: Allowed memory size of 536870912 bytes exhausted (tried to allocate 40960 bytes) 
in /www/wwwroot/sosomama.com/public_html/wp-includes/meta.php on line 1202
```

## 问题原因

1. **文章数量过多**：`hk-is-template` 这个 taxonomy term 下有大量文章（可能有数千篇）
2. **一次性加载**：WordPress 默认尝试一次性加载所有匹配的文章及其 meta 数据
3. **内存耗尽**：加载所有文章的 meta 数据（ACF 字段、自定义字段等）导致内存超出 512MB 限制

## 解决方案

### 方案 1：限制 Archive 查询数量（推荐）✅

**这是最佳解决方案**，通过限制每页显示的文章数量并使用分页来避免内存问题。

#### 实施步骤

1. **将修复代码添加到 WordPress**

   将 `wordpress-snippets/fix-archive-memory-error.php` 文件的内容添加到：
   - **方法 A**：WordPress 主题的 `functions.php` 文件
   - **方法 B**：使用 Code Snippets 插件添加代码片段

2. **代码功能说明**

   - 限制 taxonomy archive 页面每页只显示 12 篇文章（可配置）
   - 自动启用分页功能
   - 优化查询性能，缓存 meta 和 taxonomy 数据

3. **自定义每页文章数量**

   如果需要修改每页显示的文章数量，可以在 `functions.php` 中添加：

   ```php
   // 修改每页显示 24 篇文章
   add_filter('sosomama_archive_posts_per_page', function() {
       return 24;
   });
   ```

### 方案 2：增加 PHP 内存限制（临时方案）⚠️

如果方案 1 不够，可以临时增加 PHP 内存限制。

#### 方法 A：修改 wp-config.php

在 `wp-config.php` 文件开头添加：

```php
define('WP_MEMORY_LIMIT', '768M');
define('WP_MAX_MEMORY_LIMIT', '768M');
```

#### 方法 B：修改 php.ini（需要服务器权限）

```ini
memory_limit = 768M
```

**注意**：这只是临时方案，根本问题仍然存在。建议优先使用方案 1。

### 方案 3：优化 Archive 模板（进阶）

如果使用自定义 archive 模板，可以进一步优化：

1. **使用轻量查询**：只加载必要的字段
2. **延迟加载**：使用 AJAX 加载更多文章
3. **缓存**：使用 WordPress 缓存插件

## 实施步骤（详细）

### 步骤 1：备份网站

在进行任何修改前，**务必备份网站和数据库**。

### 步骤 2：添加修复代码

#### 选项 A：通过 functions.php（推荐用于主题修改）

1. 通过 FTP/SFTP 或 WordPress 文件管理器访问网站文件
2. 导航到：`wp-content/themes/your-theme-name/functions.php`
3. 在文件末尾添加 `fix-archive-memory-error.php` 的所有内容
4. 保存文件

#### 选项 B：通过 Code Snippets 插件（推荐用于生产环境）

1. 安装并激活 Code Snippets 插件
2. 创建新代码片段
3. 复制 `fix-archive-memory-error.php` 的内容
4. 保存并激活

### 步骤 3：清除缓存

- 清除 WordPress 缓存（如果使用缓存插件）
- 清除浏览器缓存
- 清除 CDN 缓存（如果使用 CDN）

### 步骤 4：测试

1. 访问 `https://sosomama.com/profile_type/hk-is-template/`
2. 确认页面正常加载
3. 检查分页功能是否正常
4. 确认可以浏览多页内容

## 验证修复

访问以下 URL 确认修复成功：

- ✅ `https://sosomama.com/profile_type/hk-is-template/` - 应该正常加载
- ✅ `https://sosomama.com/profile_type/hk-is-template/page/2/` - 分页应该工作
- ✅ `https://sosomama.com/profile_type/hk-ls-template/` - 其他 taxonomy 也应该正常

## 故障排除

### 问题 1：页面仍然显示内存错误

**可能原因**：
- 代码未正确添加到 functions.php
- 有语法错误
- 缓存未清除

**解决方法**：
1. 检查 WordPress 错误日志（`wp-content/debug.log`）
2. 确认代码已保存且无语法错误
3. 临时禁用所有插件，确认是否有插件冲突
4. 检查是否有其他代码覆盖了查询限制

### 问题 2：分页不显示

**可能原因**：
- 主题不支持分页
- 每页文章数量设置过大

**解决方法**：
1. 检查主题是否包含 `paginate_links()` 或分页功能
2. 减少每页文章数量（修改过滤器）
3. 查看主题文档，了解如何添加分页

### 问题 3：其他页面受影响

**可能原因**：
- 查询限制应用范围过广

**解决方法**：
代码已经做了条件检查，只影响 taxonomy archive 页面。如果其他页面有问题，检查条件判断是否正确。

## 性能优化建议

除了修复内存问题，还可以考虑以下优化：

1. **使用缓存插件**：如 WP Super Cache、W3 Total Cache
2. **优化数据库**：定期清理和优化 WordPress 数据库
3. **使用 CDN**：加速静态资源加载
4. **图片优化**：压缩和懒加载图片
5. **限制插件**：禁用不必要的插件

## 相关文件

- `wordpress-snippets/fix-archive-memory-error.php` - 修复代码
- `wordpress-snippets/homepage-shortcode.php` - 相关辅助函数

## 技术支持

如果问题仍未解决，请检查：

1. WordPress 版本和 PHP 版本兼容性
2. 主题是否有自定义的 archive 查询
3. 是否有插件干扰查询
4. 服务器错误日志

## 更新日志

- **2024-12-19**：初始版本，添加查询限制和分页支持


