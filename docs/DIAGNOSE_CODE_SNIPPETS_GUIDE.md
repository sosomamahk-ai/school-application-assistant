# 诊断脚本 Code Snippets 使用指南

## 问题

原始的 `diagnose-archive-memory-issue.php` 文件设计为独立运行（通过 WP-CLI 或直接访问），无法在 Code Snippets 中激活。

## 解决方案

我创建了两个可以在 Code Snippets 中使用的版本：

### 版本 1：Admin 菜单版本（推荐）⭐

**文件**：`wordpress-snippets/diagnose-archive-memory-issue-admin.php`

**使用方法**：

1. 打开 Code Snippets 插件
2. 创建新代码片段
3. 标题：`诊断 Archive 内存问题`
4. 复制 `diagnose-archive-memory-issue-admin.php` 的全部内容
5. 粘贴到代码框中
6. **重要**：在"运行位置"选择"仅运行在管理后台"
7. 保存并激活

**访问方式**：

激活后，在 WordPress 后台：
- 导航到：**工具 > 诊断 Archive 内存**
- 点击"开始诊断"按钮

**优点**：
- ✅ 安全（仅管理员可访问）
- ✅ 界面友好
- ✅ 可以随时访问
- ✅ 完整的诊断功能

### 版本 2：URL 参数版本（快速）

**文件**：`wordpress-snippets/diagnose-archive-memory-simple.php`

**使用方法**：

1. 打开 Code Snippets 插件
2. 创建新代码片段
3. 标题：`诊断 Archive 内存问题（快速版）`
4. 复制 `diagnose-archive-memory-simple.php` 的全部内容
5. 粘贴到代码框中
6. 保存并激活

**访问方式**：

激活后，在浏览器访问（需要先登录为管理员）：
```
https://sosomama.com/?diagnose_archive=1
```

**优点**：
- ✅ 快速访问
- ✅ 简化版，查询更快
- ✅ 适合快速诊断

**缺点**：
- ⚠️ 需要记住 URL 参数
- ⚠️ 诊断完成后建议禁用

## 推荐使用流程

### 第一次诊断（推荐使用 Admin 菜单版本）

1. 使用 `diagnose-archive-memory-issue-admin.php`
2. 在 WordPress 后台访问：**工具 > 诊断 Archive 内存**
3. 查看完整的诊断结果

### 快速检查（使用 URL 参数版本）

1. 使用 `diagnose-archive-memory-simple.php`
2. 访问 `https://sosomama.com/?diagnose_archive=1`
3. 快速查看关键信息

## 诊断内容

两个版本都会检查：

1. ✅ Taxonomy term 信息（文章数量）
2. ✅ 异常大的 meta 数据（>100KB）
3. ✅ 重复的 meta 数据
4. ✅ 每个文章的 meta 数据统计
5. ✅ 内存使用情况

Admin 版本额外检查：
- ACF 字段列表
- 最近修改的文章

## 安全提示

- ✅ 两个版本都只允许管理员访问
- ✅ 诊断完成后，URL 参数版本建议禁用
- ✅ Admin 菜单版本可以保留，方便随时诊断

## 故障排除

### 问题 1：Code Snippets 显示语法错误

**解决方法**：
- 检查是否完整复制了所有代码
- 确保没有额外的空行或特殊字符
- 检查 PHP 标签是否正确

### 问题 2：访问时显示"Access denied"

**解决方法**：
- 确保当前用户是管理员
- 检查用户权限：`manage_options`

### 问题 3：菜单不显示

**解决方法**：
- 确保代码片段已激活
- 检查"运行位置"设置（Admin 版本应选择"仅运行在管理后台"）
- 清除浏览器缓存

## 下一步

诊断完成后，根据结果：

1. **如果发现重复的 meta 数据**：
   - 使用 `fix-duplicate-meta.php` 修复

2. **如果文章数量过多**：
   - 使用 `fix-archive-memory-error.php` 限制查询

3. **如果发现异常大的 meta 数据**：
   - 检查具体内容，可能需要手动清理

## 修复重复 Meta 数据

### Code Snippets 版本（推荐）⭐

**文件**：`wordpress-snippets/fix-duplicate-meta-code-snippets.php`

**使用方法**：

1. 打开 Code Snippets 插件
2. 创建新代码片段
3. 标题：`修复重复 Meta 数据`
4. 复制 `fix-duplicate-meta-code-snippets.php` 的全部内容
5. 粘贴到代码框中
6. **重要**：在"运行位置"选择"仅运行在管理后台"
7. 保存并激活

**访问方式**：

激活后，在 WordPress 后台：
- 导航到：**工具 > 修复重复 Meta**
- 选择要修复的 profile_type term（或选择"所有"）
- 可以选择"预览模式"先查看会删除的数据
- 点击"开始修复"

**功能特点**：
- ✅ 支持所有 profile_type terms（不只是 hk-is-template）
- ✅ 可以一次性修复所有 terms
- ✅ 预览模式：可以先查看会删除的数据，不实际删除
- ✅ 安全（仅管理员可访问）
- ✅ 界面友好

## 相关文件

- `wordpress-snippets/diagnose-archive-memory-issue-admin.php` - Admin 菜单版本
- `wordpress-snippets/diagnose-archive-memory-simple.php` - URL 参数版本
- `wordpress-snippets/diagnose-archive-memory-issue.php` - 原始版本（SSH/WP-CLI 使用）
- `wordpress-snippets/fix-duplicate-meta-code-snippets.php` - 修复重复 meta 数据（Code Snippets 版本）⭐
- `wordpress-snippets/fix-duplicate-meta.php` - 修复重复 meta 数据（SSH/WP-CLI 使用）
- `wordpress-snippets/fix-archive-memory-error.php` - 修复 archive 查询

