# 快速诊断指南（SSH/Console）

## 🚀 快速开始（5 分钟）

### 步骤 1：SSH 连接到服务器

```bash
ssh user@your-server.com
cd /www/wwwroot/sosomama.com/public_html
```

### 步骤 2：运行诊断脚本

```bash
# 方法 A：使用 WP-CLI（推荐）
wp eval-file wordpress-snippets/diagnose-archive-memory-issue.php

# 方法 B：直接使用 PHP
php -r "require 'wp-load.php'; require 'wordpress-snippets/diagnose-archive-memory-issue.php';"
```

### 步骤 3：查看诊断结果

脚本会输出：
- ✅ 文章数量
- ⚠️ 异常大的 meta 数据
- ⚠️ 重复的 meta 数据
- ⚠️ 每个文章的 meta 数据统计

## 🔍 快速 SQL 查询

如果无法运行 PHP 脚本，可以直接查询数据库：

```bash
mysql -u wordpress_user -p wordpress_db
```

### 查询 1：检查文章数量

```sql
SELECT COUNT(DISTINCT tr.object_id) as post_count
FROM wp_term_relationships tr
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE t.slug = 'hk-is-template' 
AND tt.taxonomy = 'profile_type';
```

**预期结果**：如果数量 > 1000，可能是文章数量过多导致的问题。

### 查询 2：检查异常大的 meta 数据

```sql
SELECT 
    pm.post_id,
    pm.meta_key,
    ROUND(LENGTH(pm.meta_value) / 1024 / 1024, 2) as size_mb
FROM wp_postmeta pm
INNER JOIN wp_term_relationships tr ON pm.post_id = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE t.slug = 'hk-is-template' 
AND tt.taxonomy = 'profile_type'
AND LENGTH(pm.meta_value) > 100000
ORDER BY LENGTH(pm.meta_value) DESC
LIMIT 10;
```

**预期结果**：如果发现 > 1MB 的 meta 数据，这可能是问题所在。

### 查询 3：检查重复的 meta 数据

```sql
SELECT 
    post_id,
    meta_key,
    COUNT(*) as duplicate_count
FROM wp_postmeta
WHERE post_id IN (
    SELECT object_id 
    FROM wp_term_relationships tr
    INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    INNER JOIN wp_terms t ON tt.term_id = t.term_id
    WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
)
GROUP BY post_id, meta_key
HAVING duplicate_count > 1
ORDER BY duplicate_count DESC
LIMIT 10;
```

**预期结果**：如果发现重复数据，同步脚本可能有问题。

## 🛠️ 常见问题修复

### 问题 1：发现重复的 meta 数据

运行修复脚本：

```bash
wp eval-file wordpress-snippets/fix-duplicate-meta.php
```

或手动修复：

```sql
-- 查看重复的 meta
SELECT post_id, meta_key, COUNT(*) as count
FROM wp_postmeta
WHERE post_id = [POST_ID] AND meta_key = '[META_KEY]'
GROUP BY post_id, meta_key
HAVING count > 1;

-- 删除重复的（保留最新的）
DELETE pm1 FROM wp_postmeta pm1
INNER JOIN wp_postmeta pm2 
WHERE pm1.post_id = pm2.post_id 
AND pm1.meta_key = pm2.meta_key
AND pm1.meta_id < pm2.meta_id
AND pm1.post_id = [POST_ID]
AND pm1.meta_key = '[META_KEY]';
```

### 问题 2：发现异常大的 meta 数据

检查具体内容：

```sql
SELECT post_id, meta_key, LEFT(meta_value, 1000) as preview
FROM wp_postmeta
WHERE post_id = [POST_ID] AND meta_key = '[META_KEY]';
```

如果是错误数据，可以删除：

```sql
DELETE FROM wp_postmeta
WHERE post_id = [POST_ID] AND meta_key = '[META_KEY]';
```

### 问题 3：文章数量过多

临时解决方案：限制 archive 查询

将 `wordpress-snippets/fix-archive-memory-error.php` 添加到 `functions.php`。

## 📊 查看错误日志

### WordPress 调试日志

```bash
tail -f wp-content/debug.log
```

### PHP 错误日志

```bash
# PHP-FPM
tail -f /var/log/php-fpm/error.log

# Apache
tail -f /var/log/apache2/error.log

# Nginx + PHP-FPM
tail -f /var/log/nginx/error.log
```

## 🔧 启用调试模式

在 `wp-config.php` 中添加：

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

然后访问问题页面，查看 `wp-content/debug.log`。

## 📝 诊断检查清单

- [ ] 运行诊断脚本
- [ ] 检查文章数量（是否 > 1000？）
- [ ] 检查异常大的 meta 数据（是否 > 1MB？）
- [ ] 检查重复的 meta 数据
- [ ] 查看错误日志
- [ ] 检查最近同步的文章

## 🆘 需要帮助？

如果问题仍未解决，请提供：

1. 诊断脚本的完整输出
2. 错误日志的相关内容
3. SQL 查询的结果
4. 同步脚本的执行日志


