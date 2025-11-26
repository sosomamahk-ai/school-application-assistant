# 调试 Archive 页面内存错误（同步后）

## 问题背景

在 WordPress REST API 同步后，`/profile_type/hk-is-template/` 页面出现内存错误。需要诊断同步操作是否导致了数据问题。

## 诊断方法

### 方法 1：通过 SSH + WP-CLI（推荐）

#### 步骤 1：SSH 连接到服务器

```bash
ssh user@your-server.com
cd /www/wwwroot/sosomama.com/public_html
```

#### 步骤 2：运行诊断脚本

```bash
# 使用 WP-CLI 运行诊断脚本
wp eval-file wordpress-snippets/diagnose-archive-memory-issue.php

# 或者直接使用 PHP
php -r "require 'wp-load.php'; require 'wordpress-snippets/diagnose-archive-memory-issue.php';"
```

#### 步骤 3：查看输出

诊断脚本会检查：
- taxonomy term 下的文章数量
- 异常大的 meta 数据（>100KB）
- 重复的 meta 数据
- 每个文章的 meta 数据总数
- ACF 字段情况
- 最近同步的文章

### 方法 2：通过 MySQL 直接查询

#### 连接到数据库

```bash
mysql -u wordpress_user -p wordpress_db
```

#### 查询 1：检查文章数量

```sql
-- 检查 hk-is-template term 下的文章数量
SELECT COUNT(DISTINCT tr.object_id) as post_count
FROM wp_term_relationships tr
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE t.slug = 'hk-is-template' 
AND tt.taxonomy = 'profile_type';
```

#### 查询 2：检查异常大的 meta 数据

```sql
-- 查找大于 100KB 的 meta 数据
SELECT 
    pm.post_id,
    pm.meta_key,
    LENGTH(pm.meta_value) as meta_size,
    ROUND(LENGTH(pm.meta_value) / 1024 / 1024, 2) as size_mb
FROM wp_postmeta pm
INNER JOIN wp_term_relationships tr ON pm.post_id = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
WHERE t.slug = 'hk-is-template' 
AND tt.taxonomy = 'profile_type'
AND LENGTH(pm.meta_value) > 100000
ORDER BY meta_size DESC
LIMIT 20;
```

#### 查询 3：检查重复的 meta 数据

```sql
-- 查找重复的 meta 数据（同一文章同一 key 有多条记录）
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
LIMIT 20;
```

#### 查询 4：检查每个文章的 meta 数据总数

```sql
-- 检查每个文章的 meta 数据总数和总大小
SELECT 
    p.ID as post_id,
    p.post_title,
    COUNT(pm.meta_id) as meta_count,
    ROUND(SUM(LENGTH(pm.meta_value)) / 1024 / 1024, 2) as total_size_mb
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
WHERE t.slug = 'hk-is-template' 
AND tt.taxonomy = 'profile_type'
GROUP BY p.ID
HAVING meta_count > 100 OR total_size_mb > 0.5
ORDER BY total_size_mb DESC
LIMIT 20;
```

#### 查询 5：检查最近同步的文章

```sql
-- 检查最近 24 小时内修改的文章
SELECT 
    p.ID,
    p.post_title,
    p.post_modified,
    COUNT(pm.meta_id) as meta_count
FROM wp_posts p
INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
INNER JOIN wp_terms t ON tt.term_id = t.term_id
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
WHERE t.slug = 'hk-is-template' 
AND tt.taxonomy = 'profile_type'
AND p.post_modified >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY p.ID
ORDER BY p.post_modified DESC
LIMIT 20;
```

### 方法 3：通过 WordPress 错误日志

#### 查看 PHP 错误日志

```bash
# 查看 WordPress 调试日志
tail -f /www/wwwroot/sosomama.com/public_html/wp-content/debug.log

# 或者查看 PHP 错误日志
tail -f /var/log/php-fpm/error.log
# 或
tail -f /var/log/apache2/error.log
```

#### 启用 WordPress 调试模式

在 `wp-config.php` 中添加：

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

然后访问问题页面，查看 `wp-content/debug.log`。

### 方法 4：通过浏览器临时访问诊断脚本

**⚠️ 注意：仅用于调试，完成后立即删除！**

1. 将 `diagnose-archive-memory-issue.php` 复制到网站根目录
2. 通过浏览器访问：`https://sosomama.com/diagnose-archive-memory-issue.php`
3. **完成后立即删除该文件**

## 常见问题诊断

### 问题 1：发现异常大的 meta 数据

**可能原因**：
- 同步脚本创建了过大的 JSON 数据
- ACF 字段包含大量数据
- 序列化的数据损坏

**解决方法**：
```sql
-- 查看具体内容
SELECT post_id, meta_key, LEFT(meta_value, 500) as preview
FROM wp_postmeta
WHERE post_id = [POST_ID] AND meta_key = '[META_KEY]';

-- 如果确认是错误数据，可以删除
DELETE FROM wp_postmeta
WHERE post_id = [POST_ID] AND meta_key = '[META_KEY]';
```

### 问题 2：发现重复的 meta 数据

**可能原因**：
- 同步脚本重复执行
- `update_post_meta` 使用了错误的参数

**解决方法**：
```sql
-- 查看重复的 meta
SELECT post_id, meta_key, COUNT(*) as count
FROM wp_postmeta
WHERE post_id = [POST_ID] AND meta_key = '[META_KEY]'
GROUP BY post_id, meta_key
HAVING count > 1;

-- 删除重复的 meta（保留最新的）
DELETE pm1 FROM wp_postmeta pm1
INNER JOIN wp_postmeta pm2 
WHERE pm1.post_id = pm2.post_id 
AND pm1.meta_key = pm2.meta_key
AND pm1.meta_id < pm2.meta_id;
```

### 问题 3：文章数量正常但内存仍然不足

**可能原因**：
- 某些文章的 meta 数据异常大
- ACF 字段包含大量嵌套数据
- WordPress 查询优化失效

**解决方法**：
1. 使用查询 4 找出 meta 数据异常的文章
2. 检查这些文章的 ACF 字段
3. 考虑清理不必要的 meta 数据

## 修复脚本

如果发现问题，可以创建修复脚本：

```php
<?php
// fix-duplicate-meta.php
require 'wp-load.php';

global $wpdb;

// 查找并删除重复的 meta（保留最新的）
$duplicates = $wpdb->get_results("
    SELECT post_id, meta_key, COUNT(*) as count
    FROM {$wpdb->postmeta}
    WHERE post_id IN (
        SELECT object_id 
        FROM {$wpdb->term_relationships} tr
        INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
        WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
    )
    GROUP BY post_id, meta_key
    HAVING count > 1
");

foreach ($duplicates as $dup) {
    // 保留最新的 meta，删除旧的
    $wpdb->query($wpdb->prepare("
        DELETE pm1 FROM {$wpdb->postmeta} pm1
        INNER JOIN {$wpdb->postmeta} pm2 
        WHERE pm1.post_id = pm2.post_id 
        AND pm1.meta_key = pm2.meta_key
        AND pm1.meta_id < pm2.meta_id
        AND pm1.post_id = %d
        AND pm1.meta_key = %s
    ", $dup->post_id, $dup->meta_key));
    
    echo "Fixed duplicates for post {$dup->post_id}, meta_key {$dup->meta_key}\n";
}
```

## 预防措施

1. **同步前备份数据库**
2. **同步脚本添加数据验证**
3. **使用 `update_post_meta` 而不是 `add_post_meta`**（避免重复）
4. **限制同步批量大小**
5. **添加同步日志**

## 相关文件

- `wordpress-snippets/diagnose-archive-memory-issue.php` - 诊断脚本
- `scripts/sync-profile-to-school/` - 同步脚本目录

