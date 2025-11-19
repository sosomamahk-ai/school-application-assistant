# Code Snippets 403 错误 - 针对你的情况

## 问题分析

你修改了 `api-integration.php` 代码片段后出现了 403 错误。**403 错误通常是保存代码片段时的问题，而不是代码内容本身的问题**。

## 可能的原因

1. **REST API 权限问题**：Code Snippets 插件使用 REST API 保存代码，你的修改触发了权限检查
2. **nonce 验证过期**：编辑时间过长，安全令牌过期
3. **代码片段太长了**：某些情况下，超大的代码片段可能触发安全限制
4. **临时服务器问题**：保存时的临时网络或服务器问题

## 解决方案

### 方案 1：先修复 REST API 权限（必须先做）

在使用 Code Snippets 之前，必须先修复 REST API 权限问题。

**通过 FTP/SFTP 或 cPanel 文件管理器**：

1. 找到 `wp-content/themes/你的主题名称/functions.php`
2. 在文件**末尾**添加以下代码：

```php
// Code Snippets 403 修复
add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);

add_filter('nonce_life', function($lifetime) {
    return 48 * HOUR_IN_SECONDS;
}, 10);
```

3. 保存文件
4. **清除浏览器缓存，重新登录 WordPress**
5. 然后尝试保存你的代码片段

### 方案 2：检查你的代码是否有语法错误

虽然你的代码看起来没有明显的语法错误，但让我指出可能的问题：

#### 你提供的代码版本 vs 原始版本的区别：

**你的版本**（简化版）：
```php
function school_app_build_embed_url($path = '/', $query = array()) {
    $base = rtrim(SCHOOL_APP_WEB_URL, '/');
    $relative = '/' . ltrim($path, '/');

    if (empty($query)) {
        return $base . $relative;
    }

    if (is_string($query)) {
        $query_string = ltrim($query, '?&');
    } else {
        $query_string = http_build_query($query);
    }

    return $base . $relative . (strlen($query_string) ? '?' . $query_string : '');
}
```

**原始版本**（包含 embed=true 参数）：
```php
function school_app_build_embed_url($path = '/', $query = array()) {
    $base = rtrim(SCHOOL_APP_WEB_URL, '/');
    $relative = '/' . ltrim($path, '/');

    // 自动添加 embed=true 参数，帮助 Next.js 检测 iframe 环境
    $query_params = array('embed' => 'true');
    
    if (!empty($query)) {
        if (is_string($query)) {
            parse_str(ltrim($query, '?&'), $parsed);
            $query_params = array_merge($query_params, $parsed);
        } else {
            $query_params = array_merge($query_params, $query);
        }
    }

    $query_string = http_build_query($query_params);
    return $base . $relative . (strlen($query_string) ? '?' . $query_string : '');
}
```

**区别**：原始版本会自动添加 `embed=true` 参数，这对 Next.js 检测 iframe 环境很重要。

#### 建议

1. **如果 `embed=true` 参数对你的应用很重要**，使用原始版本（`api-integration-fixed.php`）
2. **如果你的简化版本也能工作**，可以继续使用你的版本

### 方案 3：尝试更新代码片段（分步骤）

如果添加了 REST API 修复代码后仍然遇到 403：

1. **先尝试保存一个小的测试代码片段**：
   ```php
   <?php
   // 测试代码
   add_action('wp_head', function() {
       echo '<!-- Code Snippets Test -->';
   });
   ```
   看看能否成功保存

2. **如果测试代码能保存**，说明插件本身没问题，可能是你的代码片段太大或有其他问题

3. **如果测试代码也不能保存**，说明是 REST API 权限问题，需要继续排查

### 方案 4：检查代码片段是否有问题

**可能的问题**：

1. **缺少 PHP 开始标签**：确保代码开头有 `<?php`
2. **函数名冲突**：确保所有函数名都是唯一的
3. **语法错误**：使用 PHP 语法检查器验证

**快速语法检查方法**：
在命令行运行（如果有服务器访问权限）：
```bash
php -l api-integration.php
```

或在在线 PHP 语法检查器中验证。

### 方案 5：使用正确的代码版本

我已经创建了 `api-integration-fixed.php`，这是原始版本的修正版，包含：
- ✅ 自动添加 `embed=true` 参数
- ✅ 正确的 URL 构建逻辑
- ✅ 完整的语法验证

**推荐使用这个版本**，因为它包含了重要的 `embed=true` 参数，这对 iframe 嵌入很重要。

## 推荐的解决步骤

### 第一步：修复 REST API（必须）

通过 FTP/SFTP 在 `functions.php` 中添加：

```php
add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);
```

### 第二步：清除缓存并重新登录

1. 清除浏览器缓存
2. 清除 WordPress Cookie
3. 重新登录

### 第三步：尝试更新代码片段

1. 进入 Code Snippets 插件
2. 编辑你的代码片段
3. 使用 `api-integration-fixed.php` 中的代码（推荐）
4. 或继续使用你的版本（如果确定不需要 `embed=true`）

### 第四步：如果还是不行

1. 先保存一个小的测试代码片段
2. 检查 `wp-content/debug.log` 错误日志
3. 查看浏览器控制台（F12）的网络请求，看具体是哪个请求返回 403

## 你的代码片段（已修正）

我已经创建了 `api-integration-fixed.php`，这是建议使用的版本。它与原始版本的主要区别是保留了 `embed=true` 参数自动添加功能。

如果你确定不需要 `embed=true` 参数，你也可以使用你提供的简化版本，但建议先用修复后的版本测试。

## 注意事项

1. **代码本身通常不会导致 403**：403 通常是权限问题，不是代码语法问题
2. **必须先修复 REST API**：否则无法保存任何代码片段
3. **`embed=true` 参数很重要**：如果你的 Next.js 应用依赖这个参数来检测 iframe 环境，必须保留它

## 需要帮助？

如果按照上述步骤仍然无法解决：

1. 查看 `wp-content/debug.log` 文件
2. 检查浏览器控制台的网络请求
3. 查看 `FIX_403_ERROR.md` 获取更详细的故障排除指南

