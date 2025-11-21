# ACF 字段 null 值自动修复工具使用指南

## 问题描述

WordPress 中出现了大量的 ACF（Advanced Custom Fields）错误，日志显示字段值类型不匹配。这些错误通常是由于字段值为 `null` 导致的，需要将其修复为适当的默认值（字符串字段为空字符串，数组字段为空数组等）。

## 工具功能

`fix-acf-null-values.php` 工具可以：

1. ✅ 扫描所有文章、页面和自定义文章类型
2. ✅ 检测所有 ACF 字段中的 `null` 值
3. ✅ 根据字段类型自动修复：
   - 文本类字段（text, textarea, email 等）→ 空字符串 `''`
   - 数字字段（number, range）→ `0`
   - 布尔字段（true_false）→ `false`
   - 数组字段（relationship, post_object, checkbox 等）→ 空数组 `[]`
   - Repeater 和 Group 字段的子字段
4. ✅ 支持预览模式（不实际修改数据）
5. ✅ 提供详细的修复报告

## 安装方法

### 方法 1：使用 Code Snippets 插件（推荐）⭐

1. **安装插件**（如果还没有）
   - 进入 WordPress 后台 → **插件 → 安装插件**
   - 搜索 "Code Snippets" 并安装激活

2. **添加代码片段**
   - 进入 **Snippets → Add New**
   - **Title**: `ACF null 值修复工具`
   - **Code**: 复制 `fix-acf-null-values.php` 文件中的全部代码并粘贴
   - **Code Type**: 选择 `PHP Snippet`
   - **Run snippet**: 选择 `Run snippet everywhere`
   - （可选）**Description**: 添加说明

3. **保存并激活**
   - 点击 **Save Changes and Activate**
   - 代码会立即生效

📌 **重要说明**：Code Snippets 插件将代码存储在数据库中，**不会**修改主题文件。代码通过 WordPress 钩子系统加载，这是最安全的方法。

### 方法 2：手动添加到子主题的 functions.php

如果您想将代码直接添加到文件系统中：

1. **确认子主题存在**
   - 检查 `wp-content/themes/your-child-theme/functions.php` 是否存在
   - 如果不存在，先创建子主题

2. **编辑 functions.php**
   - **方式 A**：通过 WordPress 后台 → **外观 → 主题编辑器** → 选择子主题 → **Theme Functions (functions.php)**
   - **方式 B**：通过 FTP/文件管理器打开 `wp-content/themes/your-child-theme/functions.php`

3. **添加代码**
   - 在文件末尾添加 `fix-acf-null-values.php` 中的全部代码
   - 注意：如果文件已存在 `<?php`，不要重复添加

4. **保存文件**

⚠️ **注意**：
- 务必添加到**子主题**的 `functions.php`，而不是父主题
- 子主题的文件不会被主题更新覆盖
- 编辑前建议备份文件

📖 **详细对比说明**：请查看 `CODE_SNIPPETS_VS_FUNCTIONS_PHP.md` 了解两种方法的详细区别和如何选择。

## 使用方法

### 方法 1：通过管理后台（推荐）

1. 登录 WordPress 后台
2. 进入 **工具 → ACF null 值修复**
3. 工具会自动运行预览模式，显示将要修复的内容
4. 如果发现需要修复的字段，点击 **确认执行修复** 按钮
5. 等待修复完成，查看详细报告

### 方法 2：通过 URL 访问

1. 确保已登录 WordPress 后台（管理员权限）
2. 访问以下 URL 进行预览：
   ```
   https://your-site.com/?fix_acf_null=1
   ```
3. 查看预览报告后，如果需要执行修复，访问：
   ```
   https://your-site.com/?fix_acf_null=1&confirm=true
   ```

### 方法 3：使用 WP-CLI

```bash
# 预览模式（不实际修改）
wp eval-file fix-acf-null-values.php

# 如果需要实际修复，需要修改代码中的 $dry_run = false
```

## 安全说明

⚠️ **重要**：

1. **备份数据库**：在执行修复前，请务必备份数据库！
2. **预览模式**：工具默认使用预览模式，不会实际修改数据
3. **权限检查**：只有管理员（`manage_options` 权限）才能运行此工具
4. **测试环境**：建议先在测试环境中运行，确认无误后再在生产环境使用

## 字段类型修复规则

| 字段类型 | null 值修复为 |
|---------|-------------|
| text, textarea, email, url 等 | 空字符串 `''` |
| number, range | `0` |
| true_false | `false` |
| select, radio | 空字符串 `''` 或默认值 |
| checkbox, relationship, post_object | 空数组 `[]` |
| repeater | 空数组 `[]` |
| group | 空数组 `[]` |
| image, file, gallery | 空字符串 `''` |

## 修复报告说明

工具会生成详细的修复报告，包括：

- **统计信息**：
  - 扫描的文章数
  - 检查的字段数
  - 发现的 null 字段数
  - 已修复的字段数
  - 错误数

- **详细信息**：
  - 文章 ID 和标题
  - 文章类型
  - 字段名称
  - 字段类型
  - 旧值（null）
  - 新值（修复后的值）
  - 修复状态（预览/已修复）

## 故障排除

### 工具页面显示空白？

如果访问 **工具 → ACF null 值修复** 时页面显示空白，请：

1. **运行诊断测试**：
   - 访问：`https://your-site.com/?test_acf_fixer=1`
   - 查看检查结果，根据提示修复问题

2. **查看详细故障排除指南**：
   - 查看 `ACF_FIXER_TROUBLESHOOTING.md` 文件
   - 包含常见问题及解决方案

3. **常见原因**：
   - ACF 插件未激活
   - Code Snippets 代码片段未激活
   - PHP 错误（查看 `wp-content/debug.log`）
   - 权限问题

---

## 常见问题

### Q1: 工具会修复所有字段吗？

A: 是的，工具会扫描所有文章类型（包括自定义文章类型）的所有 ACF 字段，包括 Repeater 和 Group 字段的子字段。

### Q2: 如果字段值不是 null 但有问题怎么办？

A: 此工具专门针对 `null` 值修复。如果字段值类型不匹配但不是 `null`，可能需要其他处理方法。请检查具体的错误日志。

### Q3: 修复后数据会丢失吗？

A: 不会。工具只是将 `null` 值替换为适当的默认值，不会删除已有数据。

### Q4: 可以多次运行吗？

A: 可以。工具会检查每个字段，如果是 `null` 才修复，已修复的字段不会被重复修复。

### Q5: 修复后还需要做什么？

A: 
1. 检查网站是否正常运行
2. 查看错误日志，确认 ACF 错误是否消失
3. 如有必要，重新运行工具进行验证

## 日志位置

修复过程中的错误会记录到 WordPress 调试日志中。要查看日志：

1. 在 `wp-config.php` 中启用调试：
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```
2. 查看日志文件：`wp-content/debug.log`

## 技术支持

如果遇到问题：

1. 检查 WordPress 和 ACF 插件版本是否最新
2. 查看 WordPress 调试日志
3. 确认数据库备份已创建
4. 在测试环境中先运行验证

## 更新日志

- **v1.0.0** (2025-11-21)
  - 初始版本
  - 支持所有常见 ACF 字段类型
  - 支持 Repeater 和 Group 字段
  - 预览模式和修复模式
  - 详细的修复报告

