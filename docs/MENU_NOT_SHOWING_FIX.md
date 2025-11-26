# 菜单不显示问题修复指南

## 问题描述

代码片段已激活，设置为"Run in administrative area"，已清除缓存，但 WordPress 后台的"工具"菜单下看不到"诊断 Archive 内存"选项。

## 快速解决方案

### 方案 1：使用调试版本（推荐）

1. **停用当前的代码片段**
2. **使用调试版本**：`diagnose-archive-memory-debug.php`
   - 这个版本会在管理后台顶部显示调试信息
   - 包含直接访问链接
   - 使用不同的函数名和页面 slug，避免冲突

3. **激活调试版本后**：
   - 刷新 WordPress 后台
   - 查看页面顶部的通知区域，应该会显示调试信息
   - 点击通知中的"直接访问"链接

### 方案 2：直接访问 URL

即使菜单不显示，页面可能已经注册。尝试直接访问：

```
https://sosomama.com/wp-admin/tools.php?page=diagnose-archive-memory-debug
```

或者（如果使用原版本）：

```
https://sosomama.com/wp-admin/tools.php?page=diagnose-archive-memory
```

### 方案 3：检查 Code Snippets 设置

1. **检查代码片段设置**：
   - 进入 Code Snippets → All Snippets
   - 点击你的代码片段
   - 确认：
     - ✅ **Active** 状态（绿色）
     - ✅ **Run snippet**: "Only run in administration area"
     - ✅ **Code Type**: "PHP Snippet"

2. **尝试重新激活**：
   - 先停用代码片段
   - 保存更改
   - 再重新激活

### 方案 4：检查用户权限

确保当前登录的用户有 `manage_options` 权限（通常是管理员）。

在 WordPress 后台，检查：
- 用户 → 所有用户
- 确认你的用户角色是"管理员"

### 方案 5：检查是否有其他代码冲突

可能有其他代码片段或插件使用了相同的菜单 slug。

**解决方法**：
- 使用调试版本（使用不同的 slug：`diagnose-archive-memory-debug`）
- 或修改原版本的 slug

## 调试步骤

### 步骤 1：检查函数是否加载

在 WordPress 后台任意页面，查看页面源代码（Ctrl+U 或 Cmd+U），搜索：

```
diagnose-archive-memory
```

如果找到，说明代码已加载。

### 步骤 2：检查 WordPress 调试日志

1. **启用调试模式**（如果还没启用）：
   
   编辑 `wp-config.php`：
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

2. **查看日志**：
   - 文件位置：`wp-content/debug.log`
   - 查找包含 "Sosomama Diagnose" 的日志

### 步骤 3：使用调试版本

调试版本会在管理后台显示通知，包含：
- 函数是否已定义
- Hook 是否已注册
- 用户权限检查
- 直接访问链接

## 常见原因

1. **函数名冲突**：其他代码片段使用了相同的函数名
   - ✅ 解决：使用调试版本（不同的函数名）

2. **Hook 优先级问题**：`admin_menu` hook 执行时机问题
   - ✅ 解决：调试版本使用优先级 20

3. **权限问题**：用户没有 `manage_options` 权限
   - ✅ 解决：检查用户角色

4. **菜单 slug 冲突**：其他代码使用了相同的页面 slug
   - ✅ 解决：使用调试版本（不同的 slug）

5. **Code Snippets 加载顺序**：代码片段加载太晚
   - ✅ 解决：确保代码片段已激活

## 推荐操作

1. ✅ **立即使用调试版本**：`diagnose-archive-memory-debug.php`
2. ✅ **查看调试通知**：激活后刷新后台，查看页面顶部
3. ✅ **直接访问链接**：使用通知中的链接或直接访问 URL
4. ✅ **如果仍然不行**：使用 SSH + WP-CLI 或直接查询数据库

## 相关文件

- `wordpress-snippets/diagnose-archive-memory-debug.php` - 调试版本（推荐）
- `wordpress-snippets/diagnose-archive-memory-code-snippets.php` - 原版本
- `wordpress-snippets/diagnose-archive-memory-issue.php` - SSH/WP-CLI 版本


