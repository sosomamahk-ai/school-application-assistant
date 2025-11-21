# Code Snippets vs 子主题 functions.php - 使用指南

## 📌 重要说明

**Code Snippets 插件不会将代码保存到 `functions.php` 文件！**

Code Snippets 是一个独立的代码片段管理系统，它：
- ✅ 将代码存储在数据库中
- ✅ 通过 WordPress 钩子系统动态加载代码
- ✅ 不会修改任何主题文件
- ✅ 可以独立启用/禁用代码片段

---

## 方法对比

| 特性 | Code Snippets 插件 | 子主题 functions.php |
|------|-------------------|---------------------|
| **代码存储位置** | WordPress 数据库 | 文件系统 (`functions.php`) |
| **修改主题文件** | ❌ 不修改 | ✅ 需要修改文件 |
| **启用/禁用** | ✅ 后台一键开关 | ❌ 需要注释/删除代码 |
| **更新主题时** | ✅ 代码保留 | ⚠️ 需确认不会被覆盖 |
| **版本控制** | ❌ 难以追踪 | ✅ 可以用 Git 管理 |
| **灵活性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 方案一：使用 Code Snippets 插件（推荐）⭐

### 优点
- ✅ 不修改主题文件，更新主题时更安全
- ✅ 可以随时启用/禁用，便于测试
- ✅ 代码片段有独立的标题和描述
- ✅ 可以导出/导入代码片段
- ✅ 不需要编辑文件，减少出错风险

### 使用步骤

1. **安装 Code Snippets 插件**（如果还没有）
   - 进入 WordPress 后台
   - **插件 → 安装插件**
   - 搜索 "Code Snippets"
   - 安装并激活

2. **添加代码片段**
   - 进入 **Snippets → Add New**
   - **Title**: 输入标题（如：ACF null 值修复工具）
   - **Code**: 粘贴 `fix-acf-null-values.php` 的全部代码
   - **Description**: （可选）添加说明
   - **Run snippet**: 选择 "Run snippet everywhere"
   - **Code Type**: 选择 "PHP Snippet"

3. **保存并激活**
   - 点击 **Save Changes and Activate**
   - 代码会立即生效

### ⚠️ 重要提示

**Code Snippets 代码不会保存到子主题，而是存储在数据库中！**

如果您想查看存储的代码：
- 进入 **Snippets → All Snippets**
- 点击代码片段标题即可编辑

---

## 方案二：手动添加到子主题 functions.php

### 优点
- ✅ 代码直接可见，便于使用 Git 管理
- ✅ 不依赖插件
- ✅ 可以直接编辑和调试

### 缺点
- ⚠️ 需要编辑文件，有出错风险
- ⚠️ 启用/禁用需要注释代码
- ⚠️ 需要确保子主题的 `functions.php` 存在

### 使用步骤

#### 1. 确认子主题已创建

检查您的子主题目录是否存在，通常在：
```
wp-content/themes/your-child-theme/
├── style.css
└── functions.php
```

#### 2. 打开子主题的 functions.php

**方式 A：通过 WordPress 后台**
1. 进入 **外观 → 主题编辑器**
2. 在右侧选择您的**子主题**
3. 点击 **Theme Functions (functions.php)**

**方式 B：通过 FTP/文件管理器**
1. 连接到您的服务器
2. 导航到 `wp-content/themes/your-child-theme/`
3. 打开或创建 `functions.php` 文件

#### 3. 添加代码

在 `functions.php` 文件末尾添加以下内容：

```php
<?php
/**
 * ACF 字段 null 值自动修复工具
 * 
 * 注意：确保 ABSPATH 检查在文件开头
 * 如果文件已存在其他代码，确保 PHP 开始标签 <?php 不重复
 */

// 将 fix-acf-null-values.php 的全部代码复制到这里
// 从 if (!defined('ABSPATH')) { 开始
// 到文件末尾结束

```

#### 4. 保存文件

- **WordPress 后台**：点击 **Update File**
- **FTP/文件管理器**：保存并上传文件

#### 5. 验证

访问：
```
https://your-site.com/?fix_acf_null=1
```

或进入 **工具 → ACF null 值修复**（如果有管理菜单）

---

## 如何选择？

### 推荐使用 Code Snippets 如果：

✅ 您想要：
- 方便地管理多个代码片段
- 随时启用/禁用代码
- 更新主题时不用担心代码丢失
- 不需要版本控制
- 快速测试代码

### 推荐使用子主题 functions.php 如果：

✅ 您想要：
- 代码直接保存在文件中
- 使用 Git 进行版本控制
- 不依赖插件
- 所有自定义代码集中在一个文件

---

## 两种方法可以同时使用吗？

**可以！** 但需要注意：

⚠️ **不要重复添加**：如果已经在 Code Snippets 中添加了代码，就不要在 `functions.php` 中再次添加，否则会执行两次。

**建议做法**：
- 选择一种方法并坚持使用
- 或者用 Code Snippets 管理临时/测试代码
- 用 `functions.php` 管理稳定的核心功能

---

## 常见问题

### Q1: Code Snippets 的代码在哪里？

A: Code Snippets 将代码存储在 WordPress 数据库的 `wp_snippets` 表中。您可以在 **Snippets → All Snippets** 中查看和管理所有代码片段。

### Q2: 子主题更新后，functions.php 中的代码会丢失吗？

A: 不会。只要您编辑的是**子主题**的 `functions.php`，而不是父主题，代码就会保留。子主题的文件不会被主题更新覆盖。

### Q3: 如何确认子主题的 functions.php 已正确加载？

A: 在 `functions.php` 中添加一个测试函数：
```php
add_action('wp_footer', function() {
    echo '<!-- Child theme functions.php is loaded! -->';
});
```
访问网站首页，查看页面源代码，应该能看到注释。

### Q4: Code Snippets 和 functions.php 哪个性能更好？

A: 性能差异微乎其微。Code Snippets 通过 WordPress 钩子加载，与直接在 `functions.php` 中编写的代码执行方式基本相同。

### Q5: 如何备份 Code Snippets 中的代码？

A: 
- 方法 1：导出代码片段（在代码片段编辑页面）
- 方法 2：复制代码保存到本地文件
- 方法 3：备份 WordPress 数据库

---

## 推荐配置（最佳实践）

### 对于 ACF null 值修复工具：

**我推荐使用 Code Snippets**，因为：

1. ✅ 这是一个工具类代码，可能不需要长期运行
2. ✅ 修复完成后可以禁用，不影响性能
3. ✅ 便于管理和维护
4. ✅ 不会修改主题文件，更安全

### 设置步骤：

1. 安装 Code Snippets 插件
2. 添加代码片段（复制 `fix-acf-null-values.php` 的全部内容）
3. 激活代码片段
4. 使用修复工具（工具 → ACF null 值修复）
5. 修复完成后，可以禁用代码片段（如果想节省资源）

---

## 需要帮助？

如果遇到问题：

1. **Code Snippets 问题**：检查插件是否已激活，代码片段是否已启用
2. **functions.php 问题**：检查语法错误，确认子主题已正确设置
3. **查看日志**：`wp-content/debug.log`

