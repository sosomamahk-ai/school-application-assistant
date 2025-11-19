# 如何添加 403 错误修复代码

## ⚠️ 重要提示

由于主题编辑器检测到致命错误，我们需要使用其他方法添加代码。

---

## 方法 1：使用 SFTP/FTP（推荐）

### 步骤：

1. **连接到你的服务器**
   - 使用 FileZilla、WinSCP 或其他 FTP 客户端
   - 或使用 cPanel 文件管理器

2. **找到主题文件**
   - 路径：`wp-content/themes/你的主题名称/functions.php`
   - 例如：`wp-content/themes/twentytwentythree/functions.php`

3. **备份原文件**
   - 先下载 `functions.php` 到本地作为备份
   - 如果出错可以恢复

4. **编辑文件**
   - 打开 `functions.php`
   - 滚动到文件**最末尾**
   - 在 `?>` 标签之前（如果有）或文件末尾添加代码
   - 如果没有 `?>` 标签，直接在末尾添加

5. **添加代码**
   - 使用 `fix-code-snippets-403-simple.php` 中的代码（最简单安全）
   - 或按步骤使用 `fix-code-snippets-403-step-by-step.php`

6. **保存并上传**
   - 保存文件
   - 上传回服务器（覆盖原文件）

7. **测试**
   - 访问 WordPress 后台
   - 尝试创建代码片段

---

## 方法 2：使用 cPanel 文件管理器

1. **登录 cPanel**
2. **打开文件管理器**
3. **导航到主题文件夹**
   - `public_html/wp-content/themes/你的主题名称/`
4. **找到 `functions.php`**
5. **右键点击 → 编辑**
6. **滚动到文件末尾**
7. **添加代码**
8. **保存**

---

## 方法 3：使用 WordPress 插件（如果主题编辑器不可用）

### 使用 "Code Snippets" 插件本身（如果还能访问）

1. 如果插件界面还能打开（即使不能保存）
2. 尝试通过数据库直接添加

### 使用 "Insert Headers and Footers" 插件

1. 安装插件：**插件** → **安装插件** → 搜索 "Insert Headers and Footers"
2. 激活插件
3. **设置** → **Insert Headers and Footers**
4. 在 "Functions" 标签页添加代码

---

## 方法 4：分步骤添加（最安全）

### 第一步：只添加最基础的代码

在 `functions.php` 末尾添加：

```php
// Code Snippets 403 修复 - 步骤1
add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);
```

**保存并测试**：
- 访问 WordPress 后台
- 检查网站是否正常
- 尝试创建代码片段

### 第二步：如果第一步成功，添加 nonce 修复

在刚才的代码后面继续添加：

```php
// Code Snippets 403 修复 - 步骤2
add_filter('nonce_life', function($lifetime) {
    return 48 * HOUR_IN_SECONDS;
}, 10);
```

**保存并测试**

### 第三步：如果还需要，添加权限检查

```php
// Code Snippets 403 修复 - 步骤3
add_action('admin_init', function() {
    $admin_role = get_role('administrator');
    if ($admin_role && !$admin_role->has_cap('manage_options')) {
        $admin_role->add_cap('manage_options');
    }
}, 1);
```

---

## 方法 5：通过数据库（高级用户）

⚠️ **警告**：直接编辑数据库有风险，请先备份！

1. **备份数据库**
2. **使用 phpMyAdmin**
3. **找到 `wp_options` 表**
4. **搜索 `option_name` = `theme_mods_你的主题名`**
5. **或搜索包含 `functions.php` 内容的选项**

**不推荐此方法**，因为 WordPress 通常不将 functions.php 存储在数据库中。

---

## 如果添加代码后网站崩溃

### 紧急恢复方法：

1. **通过 FTP/SFTP 访问服务器**
2. **找到 `functions.php`**
3. **删除刚才添加的代码**
4. **或恢复备份文件**

### 如果无法访问 FTP：

1. **使用 cPanel 文件管理器**
2. **或联系主机提供商**
3. **或使用 WordPress 恢复模式**（如果 WordPress 5.2+）

---

## 推荐的代码（最简单安全）

使用 `fix-code-snippets-403-simple.php` 中的代码：

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

这段代码：
- ✅ 非常简短，不容易出错
- ✅ 只做必要的修复
- ✅ 不会影响其他功能
- ✅ 安全可靠

---

## 添加代码的正确位置

### ✅ 正确示例：

```php
<?php
// ... 主题原有的代码 ...

// 在这里添加新代码（文件末尾，在 ?> 之前，如果有的话）
add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);
```

### ❌ 错误示例：

```php
<?php
add_filter(...); // 不要添加在文件开头
// ... 原有代码 ...
```

---

## 验证代码是否正确添加

1. **检查网站是否正常加载**
2. **访问 WordPress 后台**
3. **尝试创建代码片段**
4. **如果还有 403 错误，查看 `wp-content/debug.log`**

---

## 需要帮助？

如果以上方法都不行，可能需要：
1. 检查服务器 PHP 错误日志
2. 联系主机提供商
3. 检查是否有其他插件冲突
4. 查看完整的故障排除指南：`FIX_403_ERROR.md`

