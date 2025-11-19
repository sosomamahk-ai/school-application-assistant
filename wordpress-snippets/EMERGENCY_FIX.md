# 紧急恢复 - Database Connection Failed

## ⚠️ 紧急情况

添加代码后出现 "Database connection failed" 错误，需要立即恢复。

## 🚨 立即恢复步骤

### 方法 1：通过 FTP/SFTP 删除刚才添加的代码（最快）

1. **连接到服务器**（FileZilla、WinSCP 等）
2. **找到文件**：`wp-content/themes/hello-elementor/functions.php`
3. **下载备份**（如果还没有备份）
4. **编辑文件**，删除文件末尾的这两段代码：

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

5. **保存并上传**
6. **刷新网站**，应该能正常访问了

### 方法 2：恢复备份文件

如果你有备份：
1. 通过 FTP 上传备份的 `functions.php`
2. 覆盖当前文件

### 方法 3：使用 cPanel 文件管理器

1. 登录 cPanel
2. 打开文件管理器
3. 导航到 `wp-content/themes/hello-elementor/`
4. 找到 `functions.php`，右键编辑
5. 删除文件末尾的修复代码
6. 保存

### 方法 4：如果无法访问 FTP

**联系主机提供商**，告诉他们：
- WordPress 网站出现 "Database connection failed"
- 修改了主题的 `functions.php` 文件
- 需要恢复文件或删除最近添加的代码

## 🔍 为什么会出错？

"Database connection failed" 通常表示：
1. **PHP 致命错误**：代码语法错误导致 WordPress 无法加载
2. **服务器暂时问题**：可能是巧合
3. **内存限制**：代码导致内存溢出

但我们添加的代码本身应该是安全的，可能是：
- 文件保存时的编码问题
- PHP 版本兼容性问题
- 文件权限问题

## ✅ 恢复后的下一步

### 方案 A：使用更安全的替代方法

恢复网站后，可以尝试：

**方法 1：使用子主题（推荐）**
1. 创建子主题
2. 在子主题的 `functions.php` 中添加修复代码
3. 这样即使出错，也不会影响父主题

**方法 2：使用 Code Snippets 插件本身**
- 如果还能访问插件界面，尝试创建一个简单的代码片段来测试 REST API

**方法 3：使用插件方式**
- 创建一个简单的自定义插件来添加这些修复代码

### 方案 B：检查是否是其他问题

恢复网站后，检查：
1. **PHP 错误日志**：`wp-content/debug.log`
2. **服务器错误日志**：通过 cPanel 查看
3. **PHP 版本**：确保是兼容的版本

### 方案 C：分步骤添加代码

如果要重新添加修复代码，先只添加第一段：

```php
// Code Snippets 403 修复 - 步骤1
add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);
```

保存并测试，如果没问题再添加第二段。

## 🛠️ 创建子主题（长期解决方案）

为了避免再次出现这个问题，建议创建子主题：

### 创建子主题步骤：

1. **创建文件夹**：
   - `wp-content/themes/hello-elementor-child/`

2. **创建 style.css**：
```css
/*
 Theme Name:   Hello Elementor Child
 Template:     hello-elementor
 Version:      1.0.0
*/

@import url("../hello-elementor/style.css");
```

3. **创建 functions.php**：
```php
<?php
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

4. **激活子主题**：
   - WordPress 后台 → 外观 → 主题
   - 激活 "Hello Elementor Child"

这样即使代码有问题，也可以快速切换回父主题。

## 📞 需要帮助？

如果无法恢复：
1. 联系主机提供商
2. 请求恢复最近的备份
3. 或请求删除 `functions.php` 文件末尾的代码

## ✅ 恢复检查清单

- [ ] 通过 FTP 访问服务器
- [ ] 找到 `functions.php` 文件
- [ ] 删除末尾的修复代码
- [ ] 保存并上传文件
- [ ] 刷新网站，确认恢复正常
- [ ] （可选）创建子主题，在子主题中添加代码

