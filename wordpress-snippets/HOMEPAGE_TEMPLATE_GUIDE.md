# WordPress 首页模板实现指南

## 📋 概述

有两种方式实现 WordPress 首页设计：

1. **使用 Shortcode**（当前方式）
   - 优点：灵活，可以在任何页面使用
   - 缺点：需要手动添加 shortcode

2. **直接修改主题模板文件**（推荐）
   - 优点：自动应用到首页，更符合 WordPress 标准
   - 缺点：需要访问主题文件

## 🎯 方法一：使用 Shortcode（当前方式）

当前使用的方式，已在 `homepage-shortcode.php` 中实现。

**使用步骤：**
1. 复制 `homepage-shortcode.php` 到 WordPress Code Snippets 插件
2. 激活代码片段
3. 在 WordPress 页面中使用：`[sosomama_homepage]`

## 🎯 方法二：直接修改主题模板（推荐）

### 方式 A：创建 `front-page.php`（最简单）

WordPress 模板优先级：
- `front-page.php` - 最高优先级（首页专用）
- `home.php` - 次优先级
- `index.php` - 最低优先级（默认模板）

**步骤：**

1. **复制文件到主题目录**
   ```bash
   # 复制 front-page.php 到你的主题目录
   cp wordpress-snippets/front-page.php wp-content/themes/your-theme/front-page.php
   ```

2. **将函数添加到主题的 functions.php**
   
   打开你的主题 `functions.php` 文件，将 `homepage-shortcode.php` 中的所有函数复制进去（去掉 shortcode 注册部分）：
   
   ```php
   // 在 functions.php 中添加以下函数：
   // - sosomama_get_cpt_posts()
   // - sosomama_get_profile_by_slug()
   // - sosomama_get_post_category_slug()
   // - sosomama_group_ranking_by_category()
   // - sosomama_get_category_icon()
   // - sosomama_homepage_styles()
   // 等等...
   ```

3. **WordPress 会自动使用 front-page.php 作为首页**

### 方式 B：修改现有的 `index.php`

如果你想修改现有的 `index.php`：

1. **备份现有的 index.php**
   ```bash
   cp wp-content/themes/your-theme/index.php wp-content/themes/your-theme/index.php.backup
   ```

2. **编辑 index.php**
   
   在 `index.php` 的开头添加条件判断：
   
   ```php
   <?php
   /**
    * 首页特殊处理
    */
   if (is_front_page() || is_home()) {
       // 如果是首页，加载自定义模板
       include get_template_directory() . '/templates/homepage-custom.php';
       exit;
   }
   
   // 其他页面使用原有逻辑
   // ... 原有代码 ...
   ```

3. **创建自定义模板文件**
   
   创建 `wp-content/themes/your-theme/templates/homepage-custom.php`，内容参考 `front-page.php`

### 方式 C：使用子主题（推荐用于生产环境）

如果你想保持主题更新而不丢失自定义：

1. **创建子主题**
   
   在 `wp-content/themes/` 目录下创建新文件夹，如 `your-theme-child`

2. **创建 style.css**
   ```css
   /*
   Theme Name: Your Theme Child
   Template: your-theme
   */
   ```

3. **创建 functions.php**
   ```php
   <?php
   // 加载父主题样式
   function child_theme_enqueue_styles() {
       wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
   }
   add_action('wp_enqueue_scripts', 'child_theme_enqueue_styles');
   
   // 添加所有辅助函数
   // ... 复制 homepage-shortcode.php 中的函数 ...
   ?>
   ```

4. **创建 front-page.php**
   ```php
   <?php
   // 复制 front-page.php 的内容
   ?>
   ```

5. **激活子主题**
   - 在 WordPress 后台：外观 > 主题
   - 激活子主题

## 📁 文件结构

```
wp-content/themes/your-theme/
├── style.css
├── functions.php          # 添加辅助函数
├── front-page.php         # 首页模板（新建）
└── header.php
└── footer.php
```

## 🔧 需要添加到 functions.php 的函数

从 `homepage-shortcode.php` 复制以下函数到主题的 `functions.php`：

1. `sosomama_get_cpt_posts()` - 获取自定义文章类型
2. `sosomama_get_profile_by_slug()` - 根据 slug 获取 profile
3. `sosomama_get_post_category_slug()` - 获取文章类别 slug
4. `sosomama_group_ranking_by_category()` - 按类别分组 ranking
5. `sosomama_get_category_icon()` - 获取类别图标
6. `sosomama_homepage_styles()` - 输出样式

**注意：** 不要复制 `sosomama_homepage_shortcode()` 函数和 `add_shortcode()` 调用。

## ⚙️ 配置选项

在 WordPress 后台或 `functions.php` 中可以设置：

```php
// 设置默认值
update_option('sosomama_ranking_posts_count', 10);
update_option('sosomama_profile_posts_count', 12);
update_option('sosomama_show_ranking', true);
update_option('sosomama_show_profile', true);
```

## 🎨 样式自定义

样式已在 `sosomama_homepage_styles()` 函数中定义。如果需要自定义：

1. **修改 functions.php 中的样式**
2. **或者在子主题的 style.css 中覆盖样式**

## 📝 注意事项

1. **备份重要文件**
   - 修改主题文件前，先备份！

2. **使用子主题**
   - 如果主题会更新，强烈建议使用子主题

3. **测试**
   - 在生产环境前，先在测试环境测试

4. **性能**
   - 模板方式比 shortcode 稍快（减少一次函数调用）

## 🔄 从 Shortcode 迁移到模板

如果你想从 shortcode 方式迁移到模板方式：

1. 在主题中添加 `front-page.php`
2. 将函数添加到 `functions.php`
3. 删除页面中的 shortcode
4. 设置 WordPress 首页：设置 > 阅读 > 首页显示 > 你的最新文章

## ❓ 常见问题

### Q: 修改后首页不显示？
A: 检查 WordPress 设置：设置 > 阅读 > 首页显示，确保不是设置为静态页面。

### Q: 样式不生效？
A: 确保 `sosomama_homepage_styles()` 函数被调用，检查 CSS 优先级。

### Q: 函数未定义错误？
A: 确保所有辅助函数都已添加到 `functions.php`。

### Q: 主题更新后丢失修改？
A: 使用子主题方式，可以防止主题更新时丢失自定义。

## 🔗 相关文件

- `homepage-shortcode.php` - Shortcode 实现（当前方式）
- `front-page.php` - 主题模板实现（推荐方式）
- `HOMEPAGE_SHORTCODE_GUIDE.md` - Shortcode 使用指南

---

**建议：** 对于生产环境，推荐使用方式 C（子主题 + front-page.php），这样既安全又灵活。

