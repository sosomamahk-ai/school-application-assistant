# 隐藏 WordPress Header 指南

## 问题描述

即使在 Elementor 中设置了 **Canvas** 模板（无 header/footer），WordPress 仍然会显示 header，特别是在用户登录后。这个问题很常见，因为：

1. 某些主题会强制显示 header
2. WordPress Admin Bar（登录后顶部工具栏）默认显示
3. Elementor Canvas 模板可能无法完全覆盖主题设置

## 解决方案

我们提供了一个多层次的解决方案 `hide-header-on-login.php`，它使用多种方法确保 header 被完全隐藏。

## 快速开始

### 方法一：自动检测（推荐）

如果你在页面中使用了应用相关的 shortcode（如 `[school_app_login]`），代码会自动检测并隐藏 header。

**步骤：**

1. 将 `hide-header-on-login.php` 复制到 WordPress Code Snippets
2. 修改配置（可选）：
   ```php
   // 只在登录用户查看时隐藏（推荐保持 true）
   define('HIDE_HEADER_LOGGED_IN_ONLY', true);
   
   // 是否也隐藏 footer（默认 false）
   define('HIDE_FOOTER_TOO', false);
   ```
3. 激活代码片段
4. 完成！现在所有包含应用 shortcode 的页面都会自动隐藏 header

### 方法二：指定页面 ID

如果你只想在特定页面隐藏 header：

```php
// 在配置区域修改
define('HIDE_HEADER_PAGE_IDS', array(123, 456)); // 替换为你的页面 ID
```

**如何查找页面 ID：**
- 在 WordPress 后台编辑页面时，查看浏览器地址栏：`post.php?post=123&action=edit`，123 就是页面 ID

### 方法三：指定页面 Slug

如果你更熟悉页面 slug（URL 路径）：

```php
// 在配置区域修改
define('HIDE_HEADER_PAGE_SLUGS', array('dashboard', 'applications', 'login'));
```

**页面 slug 示例：**
- 页面 URL: `https://yoursite.com/dashboard` → slug: `dashboard`
- 页面 URL: `https://yoursite.com/applications` → slug: `applications`

## 工作原理

代码使用**五种方法**确保 header 被隐藏，按优先级顺序：

### 1. CSS 隐藏（主要方法）
使用 `display: none !important` 强制隐藏所有 header 元素。这是最可靠的方法。

### 2. PHP Hooks 移除
尝试移除主题的 header 渲染 hooks（针对常见主题）。

### 3. JavaScript 动态移除
作为后备方案，在页面加载后使用 JavaScript 移除 header。

### 4. Admin Bar 隐藏
隐藏 WordPress 登录后的顶部工具栏。

### 5. 强制 Elementor Canvas
确保 Elementor 页面使用 Canvas 模板。

## 支持的 WordPress 主题

代码已经针对以下常见主题进行了优化：

- ✅ **Astra**
- ✅ **GeneratePress**
- ✅ **OceanWP**
- ✅ **Neve**
- ✅ **Kadence**
- ✅ **Astra**（以及其他基于标准 WordPress 结构的主题）

如果你的主题不在列表中，CSS 隐藏方法仍然会工作，因为它使用了通用的选择器。

## 配置选项详解

### HIDE_HEADER_LOGGED_IN_ONLY

```php
define('HIDE_HEADER_LOGGED_IN_ONLY', true);
```

- `true`：只在登录用户查看时隐藏 header（推荐）
- `false`：所有访客查看时也隐藏 header

**为什么推荐 true？**
- 保持网站首页和公开页面的正常显示
- 只在用户登录后访问应用页面时隐藏 header
- 更好的用户体验

### HIDE_FOOTER_TOO

```php
define('HIDE_FOOTER_TOO', false);
```

- `true`：同时隐藏 footer
- `false`：只隐藏 header，保留 footer

### HIDE_HEADER_PAGE_IDS

```php
define('HIDE_HEADER_PAGE_IDS', array());
```

指定页面 ID 列表。如果设置为空数组 `array()`，则使用自动检测（检查 shortcode）。

**示例：**
```php
// 只在页面 ID 为 123 和 456 的页面隐藏 header
define('HIDE_HEADER_PAGE_IDS', array(123, 456));
```

### HIDE_HEADER_PAGE_SLUGS

```php
define('HIDE_HEADER_PAGE_SLUGS', array());
```

指定页面 slug 列表。支持部分匹配（如果 slug 包含指定字符串即匹配）。

**示例：**
```php
// 在 slug 包含 'dashboard'、'app' 或 'login' 的页面隐藏 header
define('HIDE_HEADER_PAGE_SLUGS', array('dashboard', 'app', 'login'));
```

## 常见问题

### Q1: Header 还是显示，怎么办？

**解决步骤：**

1. **检查是否正确激活代码片段**
   - 在 WordPress 后台 → Code Snippets 确认代码已激活

2. **启用调试模式**（临时）
   ```php
   // 在 hide-header-with_css() 函数中添加：
   echo '<!-- DEBUG: Header hiding active -->';
   ```
   然后查看页面源代码，检查是否有调试信息

3. **检查主题特定的 header 类名**
   - 使用浏览器开发者工具（F12）检查 header 元素的实际类名
   - 在 CSS 部分添加对应的选择器

4. **提高 CSS 优先级**
   - 代码已经使用了 `!important`，但如果还是不行，可以检查是否有内联样式覆盖

### Q2: 隐藏 header 后，页面顶部有空白？

**原因：** 主题可能在 body 上设置了 margin-top 来为 header 留空间。

**解决方案：** 代码已经包含了 `body { margin-top: 0 !important; }`，如果还有问题，检查：

```css
/* 在 hide_header_with_css() 的 CSS 部分添加 */
body {
    margin-top: 0 !important;
    padding-top: 0 !important;
}

.site-content {
    margin-top: 0 !important;
    padding-top: 0 !important;
}
```

### Q3: 想要在特定条件下显示 header？

**示例：** 只在移动设备上隐藏 header

```php
function should_hide_header() {
    // 原有的检查...
    
    // 添加移动设备检测
    $is_mobile = wp_is_mobile();
    if (!$is_mobile) {
        return false; // 桌面端显示 header
    }
    
    return true; // 移动端隐藏 header
}
```

### Q4: Elementor Canvas 模板还是显示 header？

即使使用了 Elementor Canvas 模板，某些主题还是会显示 header。这是因为：

1. **主题强制显示 header**：某些主题在 functions.php 中强制添加 header
2. **缓存问题**：浏览器或插件缓存了旧版本
3. **优先级问题**：主题的 header 渲染优先级高于 Elementor

**解决方案：**
- 使用我们提供的代码片段（已经处理了这些问题）
- 清除所有缓存（浏览器、WordPress 插件、CDN）
- 检查主题设置，看是否有"始终显示 header"的选项

### Q5: 如何只隐藏 header，但保留 logo？

如果你需要保留 logo 但隐藏其他 header 元素：

```css
/* 在 hide_header_with_css() 中添加 */
.site-header .site-logo,
.site-header .custom-logo {
    display: block !important;
}
```

## 测试检查清单

激活代码后，请测试以下场景：

- [ ] 未登录用户访问页面 → header 应正常显示（如果设置了 `HIDE_HEADER_LOGGED_IN_ONLY = true`）
- [ ] 登录用户访问包含应用 shortcode 的页面 → header 应被隐藏
- [ ] 登录用户访问普通页面 → header 应正常显示（除非设置了页面列表）
- [ ] 检查不同设备（桌面、平板、手机）
- [ ] 检查不同浏览器（Chrome、Firefox、Safari、Edge）
- [ ] 检查 WordPress Admin Bar 是否被隐藏（登录后）

## 最佳实践

1. **先测试再上线**
   - 在测试环境中先测试
   - 使用 `HIDE_HEADER_PAGE_IDS` 或 `HIDE_HEADER_PAGE_SLUGS` 限制范围

2. **使用自动检测**
   - 如果没有特殊需求，使用默认的自动检测（shortcode 检测）
   - 这样更灵活，不需要手动维护页面列表

3. **保留 footer**
   - 除非确实需要，否则保留 footer
   - Footer 通常包含重要信息（版权、链接等）

4. **定期检查**
   - 主题更新后，检查 header 是否正常隐藏
   - 如果更换主题，可能需要调整配置

## 技术支持

如果遇到问题：

1. 检查浏览器控制台是否有 JavaScript 错误
2. 检查 WordPress 错误日志
3. 临时禁用其他插件，看是否有冲突
4. 查看页面源代码，确认 CSS 和 JavaScript 是否正确加载

## 相关文件

- `hide-header-on-login.php` - 主要代码文件
- `api-integration.php` - WordPress 集成代码（包含 shortcode 定义）
- `README.md` - 集成指南

---

**最后更新**：2024年

