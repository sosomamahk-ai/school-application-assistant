# ACF null 值修复工具 - 故障排除指南

## 🔍 工具页面显示空白？

如果访问 **工具 → ACF null 值修复** 时页面显示空白，请按照以下步骤排查：

---

## 第一步：运行诊断测试

我创建了一个诊断工具，可以帮助您快速定位问题：

### 使用诊断工具

1. **访问诊断页面**：
   ```
   https://your-site.com/?test_acf_fixer=1
   ```

2. **查看检查结果**：
   - ✅ 绿色 = 正常
   - ❌ 红色 = 有问题

3. **根据检查结果修复问题**

### 或者手动检查

如果诊断工具也无法访问，请手动检查以下项目：

---

## 常见问题及解决方案

### 问题 1: ACF 插件未安装或未激活

**症状**：
- 页面空白
- 诊断工具显示 "ACF get_field() 函数不存在"

**解决方案**：

1. **检查 ACF 插件**：
   - 进入 **插件 → 已安装的插件**
   - 确认 **Advanced Custom Fields** 已激活

2. **如果未安装**：
   - 安装并激活 **Advanced Custom Fields** 插件
   - 或者安装 **Advanced Custom Fields PRO**（需要 Pro 版本的功能）

3. **如果已激活但仍有问题**：
   - 尝试停用并重新激活插件
   - 检查插件版本是否最新

---

### 问题 2: Code Snippets 代码片段未正确加载

**症状**：
- 页面空白
- 诊断工具显示 "ACF_Null_Value_Fixer 类未定义"

**解决方案**：

1. **检查代码片段是否激活**：
   - 进入 **Snippets → All Snippets**
   - 确认 "ACF null 值修复工具" 显示为 **Active**（绿色）

2. **如果未激活**：
   - 点击代码片段标题
   - 点击 **Activate** 按钮

3. **如果代码片段不存在**：
   - 重新添加代码片段：
     - 进入 **Snippets → Add New**
     - 复制 `fix-acf-null-values.php` 的全部代码
     - 保存并激活

4. **检查代码语法**：
   - 编辑代码片段时，确保没有语法错误
   - 确保 PHP 开始标签 `<?php` 正确

---

### 问题 3: PHP 致命错误

**症状**：
- 页面完全空白（没有任何内容）
- 可能显示 PHP 错误信息

**解决方案**：

1. **启用 WordPress 调试模式**：
   
   编辑 `wp-config.php` 文件，添加或修改：
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

2. **查看错误日志**：
   - 文件位置：`wp-content/debug.log`
   - 查看最近的错误信息

3. **常见 PHP 错误**：
   - **语法错误**：检查代码是否有语法错误
   - **内存不足**：增加 PHP 内存限制
   - **超时**：增加执行时间限制

4. **检查 PHP 版本**：
   - ACF 和 WordPress 需要 PHP 7.4 或更高版本
   - 推荐使用 PHP 8.0+

---

### 问题 4: 权限问题

**症状**：
- 页面显示 "您没有权限访问此页面"
- 或页面空白

**解决方案**：

1. **确认您有管理员权限**：
   - 进入 **用户 → 所有用户**
   - 确认您的账号角色是 **管理员**

2. **重新登录**：
   - 退出 WordPress 后台
   - 重新登录

3. **检查用户权限**：
   ```php
   // 临时测试：在代码片段中添加
   if (current_user_can('manage_options')) {
       echo '您有管理员权限';
   } else {
       echo '您没有管理员权限';
   }
   ```

---

### 问题 5: 输出缓冲问题

**症状**：
- 页面部分内容显示，但某些部分空白

**解决方案**：

1. **检查其他插件冲突**：
   - 暂时停用其他插件
   - 逐个激活，找出冲突的插件

2. **检查主题冲突**：
   - 切换到默认主题（如 Twenty Twenty-Four）
   - 测试工具是否正常工作

3. **清除缓存**：
   - 清除浏览器缓存
   - 清除 WordPress 缓存（如果使用了缓存插件）
   - 清除服务器缓存

---

### 问题 6: ACF 版本不兼容

**症状**：
- 诊断工具显示 "acf_get_field_groups() 函数不存在"
- 工具无法获取字段组

**解决方案**：

1. **检查 ACF 版本**：
   - 进入 **自定义字段 → 工具**
   - 查看 ACF 版本信息

2. **升级到 ACF Pro**：
   - 如果使用基础版 ACF，可能需要 Pro 版本
   - `acf_get_field_groups()` 是 Pro 版本的功能

3. **或者修改代码**：
   - 如果有基础版 ACF，可能需要使用不同的方法获取字段组

---

## 🔧 快速修复步骤

如果页面仍然空白，请按以下顺序尝试：

### 步骤 1: 启用调试模式

编辑 `wp-config.php`：
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### 步骤 2: 查看错误日志

1. 访问 `wp-content/debug.log`
2. 查看最近的错误信息
3. 根据错误信息修复

### 步骤 3: 重新加载代码

1. **如果使用 Code Snippets**：
   - 进入 **Snippets → All Snippets**
   - 点击代码片段标题
   - 点击 **Deactivate**（停用）
   - 等待几秒
   - 点击 **Activate**（激活）

2. **如果使用 functions.php**：
   - 在代码前后添加空行
   - 保存文件（强制重新加载）

### 步骤 4: 清除所有缓存

1. 清除浏览器缓存（Ctrl+F5 或 Cmd+Shift+R）
2. 清除 WordPress 缓存
3. 清除服务器/CDN 缓存

### 步骤 5: 检查服务器日志

如果上述步骤都无法解决问题，检查服务器错误日志：
- Apache: `/var/log/apache2/error.log` 或类似位置
- Nginx: `/var/log/nginx/error.log` 或类似位置

---

## 📋 诊断检查清单

在寻求帮助前，请确认以下项目：

- [ ] WordPress 版本 >= 5.0
- [ ] PHP 版本 >= 7.4（推荐 8.0+）
- [ ] Advanced Custom Fields 插件已安装并激活
- [ ] ACF Pro 版本（如果需要）
- [ ] Code Snippets 插件已安装并激活（如果使用）
- [ ] 代码片段已激活
- [ ] 用户有管理员权限
- [ ] 已启用调试模式并查看日志
- [ ] 已清除所有缓存
- [ ] 已运行诊断测试（`?test_acf_fixer=1`）

---

## 🆘 获取帮助

如果上述步骤都无法解决问题，请提供以下信息：

1. **诊断测试结果**（访问 `?test_acf_fixer=1`）
2. **错误日志内容**（`wp-content/debug.log` 的相关部分）
3. **WordPress 版本**
4. **PHP 版本**
5. **ACF 版本**
6. **使用的安装方法**（Code Snippets 或 functions.php）
7. **浏览器控制台错误**（F12 开发者工具）

---

## 💡 预防措施

为避免将来出现问题：

1. ✅ **定期更新** WordPress、PHP 和插件
2. ✅ **备份数据库** 和文件
3. ✅ **在测试环境** 先测试新功能
4. ✅ **启用错误日志** 监控问题
5. ✅ **使用子主题** 而不是直接修改主题文件

---

## 🔗 相关资源

- [详细使用指南](./ACF_NULL_FIX_GUIDE.md)
- [快速启动指南](./ACF_NULL_FIX_QUICK_START.md)
- [Code Snippets vs functions.php](./CODE_SNIPPETS_VS_FUNCTIONS_PHP.md)

