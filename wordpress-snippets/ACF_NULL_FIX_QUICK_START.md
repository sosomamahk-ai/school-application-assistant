# ACF null 值修复工具 - 快速启动指南

## 问题

WordPress 日志中出现大量 ACF 字段类型不匹配错误，例如：
```
⚠️ ACF FIELD VALUE TYPE MISMATCH DETECTED
Post ID: 13463
Field Name: sspa_repeater_0_sspa_school
Field Type: relationship
Actual Type: array
```

## 快速修复步骤

### 1. 安装工具（3分钟）

**方式 A：使用 Code Snippets 插件（推荐）**
1. 安装 **Code Snippets** 插件（如果没有）
2. 进入 **Snippets → Add New**
3. 复制 `fix-acf-null-values.php` 的全部代码并粘贴
4. 激活代码片段

**方式 B：添加到 functions.php**
1. 编辑主题的 `functions.php` 文件
2. 在文件末尾粘贴 `fix-acf-null-values.php` 的全部代码
3. 保存文件

### 2. 运行预览（1分钟）

**方式 A：通过管理后台**
1. 登录 WordPress 后台
2. 访问 **工具 → ACF null 值修复**
3. 查看预览报告

**方式 B：通过 URL**
访问：`https://your-site.com/?fix_acf_null=1`

### 3. 执行修复（2分钟）

⚠️ **重要：执行前请备份数据库！**

1. 查看预览报告，确认要修复的字段
2. 点击 **确认执行修复** 按钮
3. 等待修复完成
4. 查看修复报告

### 4. 验证结果

1. 检查 WordPress 错误日志，确认 ACF 错误是否消失
2. 访问之前有错误的页面，确认是否正常
3. 如有需要，可以再次运行工具验证

## 命令行使用（高级）

如果需要批量运行或自动化：

```bash
# 使用 WP-CLI（需要修改代码启用实际修复）
wp eval-file fix-acf-null-values.php
```

## 注意事项

✅ **安全**
- 工具默认使用预览模式，不会实际修改数据
- 只有管理员可以运行
- 可以多次安全运行

⚠️ **警告**
- **务必先备份数据库**
- 建议先在测试环境运行
- 修复后检查网站功能

## 故障排除

### 工具页面显示空白？

如果工具页面显示空白，请访问诊断工具：
```
https://your-site.com/?test_acf_fixer=1
```

查看详细故障排除指南：`ACF_FIXER_TROUBLESHOOTING.md`

---

## 常见问题

**Q: 会修复哪些字段？**
A: 所有文章类型（包括自定义文章类型）的所有 ACF 字段，包括 Repeater 和 Group 的子字段。

**Q: 修复会丢失数据吗？**
A: 不会。只将 `null` 值替换为适当的默认值，不会删除已有数据。

**Q: 可以撤销修复吗？**
A: 如果已备份数据库，可以恢复备份。建议先预览再执行。

## 技术支持

如果遇到问题：
1. 查看 `wp-content/debug.log`
2. 检查 WordPress 和 ACF 版本
3. 确认数据库备份已完成

---

📖 **详细文档**: 查看 `ACF_NULL_FIX_GUIDE.md`

