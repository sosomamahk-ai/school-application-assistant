# 直接修改 index.php 实现首页设计

## 📋 概述

**可以**直接在 `index.php` 上修改主页设计。在 `index.php` 中添加条件判断，区分首页和其他页面。

## 🎯 WordPress 模板优先级

WordPress 模板加载优先级：

1. **`front-page.php`** - 首页专用（优先级最高）
2. **`home.php`** - 博客首页
3. **`index.php`** - 默认模板（最低优先级，所有页面都会使用）

## ✅ 方法：在 index.php 中添加条件判断

### 方案 A：完全替换 index.php（最简单）

**步骤：**

1. **备份现有的 index.php**
   ```bash
   cp wp-content/themes/your-theme/index.php wp-content/themes/your-theme/index.php.backup
   ```

2. **用新代码替换 index.php**
   
   使用 `index-modified.php` 的内容，它会：
   - 首页显示自定义设计
   - 其他页面使用标准 WordPress 循环

### 方案 B：在现有 index.php 中插入代码（推荐）

如果你不想完全替换，可以在现有 `index.php` 中添加条件判断：

```php
<?php
get_header();

// 判断是否是首页
if (is_front_page() || is_home()) {
    // === 首页自定义代码开始 ===
    
    // 获取参数
    $ranking_posts_count = get_option('sosomama_ranking_posts_count', 10);
    $profile_posts_count = get_option('sosomama_profile_posts_count', 12);
    $show_ranking = get_option('sosomama_show_ranking', true);
    $show_profile = get_option('sosomama_show_profile', true);
    ?>
    
    <div class="sosomama-homepage">
        <!-- 这里插入首页 HTML 代码 -->
        <!-- 从 index-modified.php 复制首页部分 -->
    </div>
    
    <?php
    // 输出样式
    if (function_exists('sosomama_homepage_styles')) {
        sosomama_homepage_styles();
    }
    
    // === 首页自定义代码结束 ===
    
} else {
    // 其他页面：使用原有逻辑
    if (have_posts()) :
        while (have_posts()) : the_post();
            // 你原有的代码
        endwhile;
    endif;
}

get_footer();
?>
```

## 📝 需要添加到 functions.php 的函数

无论使用哪种方式，都需要在主题的 `functions.php` 中添加以下函数（从 `homepage-shortcode.php` 复制）：

### 必须添加的函数：

1. ✅ `sosomama_get_cpt_posts()` - 获取自定义文章类型
2. ✅ `sosomama_get_profile_by_slug()` - 根据 slug 获取 profile
3. ✅ `sosomama_get_post_category_slug()` - 获取文章类别 slug
4. ✅ `sosomama_group_ranking_by_category()` - 按类别分组 ranking
5. ✅ `sosomama_get_category_icon()` - 获取类别图标
6. ✅ `sosomama_homepage_styles()` - 输出样式
7. ✅ `sosomama_get_post_image()` - 获取文章图片
8. ✅ `sosomama_get_post_category()` - 获取文章类别

### 不要添加：

❌ `sosomama_homepage_shortcode()` 函数  
❌ `add_shortcode()` 调用

## 🔧 完整步骤

### 步骤 1：备份文件

```bash
# 备份 index.php
cp wp-content/themes/your-theme/index.php wp-content/themes/your-theme/index.php.backup

# 备份 functions.php
cp wp-content/themes/your-theme/functions.php wp-content/themes/your-theme/functions.php.backup
```

### 步骤 2：修改 index.php

**选项 A：完全替换**
- 复制 `index-modified.php` 的内容到 `index.php`

**选项 B：部分修改**
- 在 `index.php` 中添加 `if (is_front_page() || is_home())` 条件判断
- 在条件内添加首页自定义代码

### 步骤 3：修改 functions.php

打开 `functions.php`，在文件末尾添加：

```php
<?php
// ============================================
// Sosomama 主页功能函数
// ============================================

// 在这里复制 homepage-shortcode.php 中的所有函数
// （除了 sosomama_homepage_shortcode 和 add_shortcode）

// 1. sosomama_get_cpt_posts()
// 2. sosomama_get_profile_by_slug()
// 3. sosomama_get_post_category_slug()
// 4. sosomama_group_ranking_by_category()
// 5. sosomama_get_category_icon()
// 6. sosomama_homepage_styles()
// 等等...
?>
```

### 步骤 4：测试

1. 访问网站首页，检查是否正常显示
2. 访问其他页面，确保原有功能正常

## ⚙️ 配置选项（可选）

在 `functions.php` 中可以设置默认值：

```php
// 设置默认值
if (get_option('sosomama_ranking_posts_count') === false) {
    update_option('sosomama_ranking_posts_count', 10);
}
if (get_option('sosomama_profile_posts_count') === false) {
    update_option('sosomama_profile_posts_count', 12);
}
if (get_option('sosomama_show_ranking') === false) {
    update_option('sosomama_show_ranking', true);
}
if (get_option('sosomama_show_profile') === false) {
    update_option('sosomama_show_profile', true);
}
```

## 🎨 样式自定义

样式已在 `sosomama_homepage_styles()` 函数中定义。如果需要自定义：

1. **修改 functions.php 中的样式函数**
2. **或在主题的 style.css 中覆盖样式**

## 📊 三种方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **修改 index.php** | 直接，简单 | 需要条件判断 | 快速修改 |
| **创建 front-page.php** | 分离清晰，优先级高 | 需要创建新文件 | 推荐方式 |
| **使用 Shortcode** | 灵活，可在任何页面使用 | 需要手动添加 shortcode | 需要灵活性 |

## ⚠️ 注意事项

1. **备份重要**
   - 修改前必须备份 `index.php` 和 `functions.php`

2. **测试**
   - 在生产环境前，先在测试环境测试

3. **条件判断**
   - 使用 `is_front_page()` 或 `is_home()` 确保只影响首页
   - 其他页面应保持原有逻辑

4. **函数存在性检查**
   - 在 `index.php` 中使用 `function_exists()` 检查函数是否存在

5. **主题更新**
   - 如果主题会更新，考虑使用子主题

## 🔄 从 Shortcode 迁移到 index.php

如果你之前使用的是 shortcode 方式：

1. **保留 functions.php 中的函数**
   - 这些函数仍然需要

2. **在 index.php 中替换 shortcode**
   - 将 `<?php echo do_shortcode('[sosomama_homepage]'); ?>` 
   - 替换为直接调用函数和 HTML

3. **删除 shortcode 相关代码**
   - 可以从 `functions.php` 中删除 `sosomama_homepage_shortcode()` 函数
   - 删除 `add_shortcode()` 调用

## ❓ 常见问题

### Q: 修改后首页显示错误？
A: 检查 `functions.php` 中是否包含所有必要的函数。

### Q: 其他页面也被影响了？
A: 确保使用了 `if (is_front_page() || is_home())` 条件判断。

### Q: 样式不生效？
A: 确保 `sosomama_homepage_styles()` 函数已定义并被调用。

### Q: 函数未定义错误？
A: 检查 `functions.php` 是否包含所有辅助函数。

### Q: 主题更新后丢失修改？
A: 使用子主题方式，可以防止主题更新时丢失自定义。

## 🔗 相关文件

- `index-modified.php` - 修改后的 index.php 示例
- `homepage-shortcode.php` - Shortcode 实现（包含所有函数）
- `front-page.php` - 独立的首页模板（推荐方式）
- `HOMEPAGE_TEMPLATE_GUIDE.md` - 主题模板使用指南

---

**建议：** 对于生产环境，如果主题会更新，推荐使用**子主题 + front-page.php**的方式。如果只是快速测试或主题不会更新，可以直接修改 `index.php`。


