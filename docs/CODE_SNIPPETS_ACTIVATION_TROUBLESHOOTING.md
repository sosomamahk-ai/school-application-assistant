# Code Snippets 激活问题排查指南

## 问题：诊断脚本无法在 Code Snippets 中激活

如果 `diagnose-archive-memory-issue.php` 无法激活，请按以下步骤排查：

## 步骤 1：测试最小版本

首先测试最小版本，确认 Code Snippets 本身是否正常工作：

1. **使用最小测试版本**：`diagnose-archive-memory-minimal.php`
   - 这个版本只添加一个简单的菜单项
   - 如果这个可以激活，说明问题在复杂代码中
   - 如果这个也无法激活，说明是环境问题

2. **测试步骤**：
   - 在 Code Snippets 中创建新代码片段
   - 复制 `diagnose-archive-memory-minimal.php` 的全部内容
   - 保存并尝试激活
   - 如果成功，在 WordPress 后台应该看到：**工具 > 诊断 Archive 内存**

## 步骤 2：检查错误信息

### 2.1 查看 Code Snippets 错误提示

激活时，Code Snippets 通常会显示错误信息：
- **语法错误**：会显示具体的 PHP 语法错误位置
- **致命错误**：会显示 PHP 致命错误
- **警告**：会显示警告信息

**记录下具体的错误信息**，这对解决问题很重要。

### 2.2 检查 WordPress 调试日志

1. **启用 WordPress 调试**（如果还没启用）：
   
   编辑 `wp-config.php` 文件，添加：
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

2. **查看错误日志**：
   - 文件位置：`wp-content/debug.log`
   - 查找与代码片段相关的错误

## 步骤 3：常见问题排查

### 问题 1：函数名冲突

**症状**：激活时提示"函数已存在"或"无法重新声明函数"

**解决方法**：
- 使用 `diagnose-archive-memory-code-snippets.php`（已添加函数存在检查）
- 或检查是否有其他代码片段使用了相同的函数名

### 问题 2：PHP 语法错误

**症状**：激活时提示语法错误

**解决方法**：
1. 检查代码是否完整复制（没有截断）
2. 确保所有引号、括号都正确闭合
3. 使用 PHP 语法检查工具验证

### 问题 3：内存限制

**症状**：激活时页面空白或超时

**解决方法**：
在 `wp-config.php` 中增加内存限制：
```php
define('WP_MEMORY_LIMIT', '256M');
```

### 问题 4：Code Snippets 插件问题

**症状**：所有代码片段都无法激活

**解决方法**：
1. 检查 Code Snippets 插件是否已激活
2. 尝试停用并重新激活插件
3. 检查插件版本是否最新
4. 查看是否有其他插件冲突

## 步骤 4：使用安全版本

如果最小版本可以激活，尝试使用安全版本：

**文件**：`diagnose-archive-memory-code-snippets.php`

**特点**：
- ✅ 添加了函数存在检查，避免冲突
- ✅ 更好的错误处理
- ✅ 使用 `esc_html` 转义输出
- ✅ 检查查询结果是否为空

## 步骤 5：替代方案

如果 Code Snippets 确实无法使用，可以使用以下替代方案：

### 方案 A：直接添加到 functions.php

1. 通过 FTP 或文件管理器访问主题文件
2. 找到：`wp-content/themes/your-theme-name/functions.php`
3. 在文件末尾添加诊断代码
4. 保存文件

### 方案 B：通过 SSH + WP-CLI

如果可以通过 SSH 访问服务器：

```bash
# SSH 连接到服务器
ssh user@your-server.com
cd /www/wwwroot/sosomama.com/public_html

# 使用 WP-CLI 运行诊断脚本
wp eval-file wordpress-snippets/diagnose-archive-memory-issue.php
```

### 方案 C：直接查询数据库

如果无法运行 PHP 脚本，可以直接查询数据库：

```sql
-- 检查重复的 meta 数据
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

## 步骤 6：获取帮助

如果问题仍未解决，请提供以下信息：

1. **Code Snippets 错误信息**（如果有）
2. **WordPress 调试日志**（`wp-content/debug.log` 相关部分）
3. **PHP 版本**
4. **WordPress 版本**
5. **Code Snippets 插件版本**
6. **最小测试版本是否能够激活**

## 推荐使用顺序

1. ✅ 先测试 `diagnose-archive-memory-minimal.php`（最小版本）
2. ✅ 如果成功，使用 `diagnose-archive-memory-code-snippets.php`（安全版本）
3. ✅ 如果失败，使用 SSH + WP-CLI 或直接查询数据库

## 相关文件

- `wordpress-snippets/diagnose-archive-memory-minimal.php` - 最小测试版本
- `wordpress-snippets/diagnose-archive-memory-code-snippets.php` - 安全版本（推荐）
- `wordpress-snippets/diagnose-archive-memory-issue.php` - 原始版本（SSH/WP-CLI 使用）


