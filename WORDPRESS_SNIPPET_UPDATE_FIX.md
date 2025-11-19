# WordPress Code Snippets 403 错误解决方案

## 可能的原因

1. **文件权限问题**：WordPress 无法写入文件
2. **插件权限限制**：Code Snippets 插件权限不足
3. **服务器安全设置**：某些安全插件阻止了更新

## 解决方法

### 方法 1：检查文件权限

1. 通过 FTP/SFTP 或 cPanel 文件管理器访问服务器
2. 找到 WordPress 安装目录
3. 检查以下目录的权限：
   - `wp-content/plugins/code-snippets/` - 应该是 755
   - `wp-content/uploads/` - 应该是 755
4. 如果权限不对，修改为 755（文件夹）或 644（文件）

### 方法 2：手动编辑 snippet

如果无法通过插件界面更新，可以手动编辑：

1. 通过 FTP/SFTP 访问服务器
2. 找到 `wp-content/plugins/code-snippets/php/snippets/` 目录
3. 找到对应的 snippet 文件（通常是 `snippet-{id}.php`）
4. 直接编辑文件内容
5. 保存后刷新 WordPress 后台

### 方法 3：通过 functions.php 添加

如果 Code Snippets 插件无法使用，可以直接添加到主题的 `functions.php`：

1. WordPress 后台 → 外观 → 主题编辑器
2. 选择 `functions.php`
3. 在文件末尾添加完整的 snippet 代码
4. 保存

**注意**：使用此方法后，如果切换主题，代码会丢失。

### 方法 4：检查安全插件

如果安装了安全插件（如 Wordfence、iThemes Security 等）：

1. 检查是否有"文件编辑保护"功能
2. 临时禁用安全插件
3. 更新 snippet
4. 重新启用安全插件

### 方法 5：使用数据库直接更新

如果熟悉数据库操作：

1. 访问 phpMyAdmin
2. 选择 WordPress 数据库
3. 找到 `wp_snippets` 表（Code Snippets 插件的数据表）
4. 找到对应的 snippet 记录
5. 直接编辑 `code` 字段
6. 保存

---

## 推荐方案

如果以上方法都不行，建议使用**方案 2**（在 Next.js 端强制检测），这样就不需要更新 WordPress snippet 了。

