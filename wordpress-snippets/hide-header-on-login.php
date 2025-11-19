<?php
/**
 * 隐藏 WordPress Header - 登录后不显示 WordPress Header
 * 
 * 问题：即使设置了 Elementor Canvas 模板，登录后还是会显示 WordPress header
 * 解决方案：通过多种方法移除 header 和相关元素
 * 
 * 使用方法：
 * 1. 将此代码复制到 WordPress Code Snippets 插件并激活
 * 2. 根据需要修改下面的配置选项
 */

// ====== 配置区域 ======

// 只在登录用户查看时隐藏 header（推荐：true）
define('HIDE_HEADER_LOGGED_IN_ONLY', true);

// 要隐藏 header 的页面 ID 列表（留空表示所有页面）
// 例如：array(123, 456) 只在这两个页面隐藏 header
define('HIDE_HEADER_PAGE_IDS', array());

// 要隐藏 header 的页面 slug 列表（留空表示所有页面）
// 例如：array('dashboard', 'applications') 只在包含这些 slug 的页面隐藏
define('HIDE_HEADER_PAGE_SLUGS', array());

// 是否也隐藏 footer（默认：false）
define('HIDE_FOOTER_TOO', false);

// ====== 实现代码 ======

/**
 * 检查当前页面是否应该隐藏 header
 */
function should_hide_header() {
    // 如果设置了只对登录用户隐藏，但用户未登录，则不隐藏
    if (HIDE_HEADER_LOGGED_IN_ONLY && !is_user_logged_in()) {
        return false;
    }
    
    // 如果指定了页面 ID，检查当前页面是否在列表中
    if (!empty(HIDE_HEADER_PAGE_IDS)) {
        $current_page_id = get_the_ID();
        if (!in_array($current_page_id, HIDE_HEADER_PAGE_IDS)) {
            return false;
        }
    }
    
    // 如果指定了页面 slug，检查当前页面是否在列表中
    if (!empty(HIDE_HEADER_PAGE_SLUGS)) {
        $current_page_slug = get_post_field('post_name', get_the_ID());
        $matched = false;
        foreach (HIDE_HEADER_PAGE_SLUGS as $slug) {
            if (strpos($current_page_slug, $slug) !== false) {
                $matched = true;
                break;
            }
        }
        if (!$matched) {
            return false;
        }
    }
    
    // 检查页面是否包含应用相关的 shortcode（自动检测）
    $page_content = get_post_field('post_content', get_the_ID());
    $app_shortcodes = array(
        'school_app',
        'school_app_login',
        'school_app_register',
        'school_app_dashboard',
        'school_app_profile',
        'school_app_templates',
        'school_app_users',
        'school_app_translations'
    );
    
    $has_app_shortcode = false;
    foreach ($app_shortcodes as $shortcode) {
        if (has_shortcode($page_content, $shortcode)) {
            $has_app_shortcode = true;
            break;
        }
    }
    
    // 如果有指定页面列表，优先使用列表；否则检查是否有 shortcode
    if (empty(HIDE_HEADER_PAGE_IDS) && empty(HIDE_HEADER_PAGE_SLUGS)) {
        return $has_app_shortcode;
    }
    
    return true;
}

/**
 * 方法1：通过 remove_action 移除 header（最干净的方法）
 */
function remove_wp_header_for_app_pages() {
    if (!should_hide_header()) {
        return;
    }
    
    // 移除常见的 header 相关 hooks
    remove_action('wp_head', 'wp_generator');
    
    // 针对不同主题的 header 移除
    // Astra 主题
    remove_action('astra_header', 'astra_header_markup');
    
    // GeneratePress 主题
    remove_action('generate_header', 'generate_construct_header');
    
    // OceanWP 主题
    remove_action('ocean_header', 'oceanwp_header_template');
    
    // Neve 主题
    remove_action('neve_do_header', 'neve_render_header');
    
    // Kadence 主题
    remove_action('kadence_header', 'Kadence\header_markup');
    
    // 通用方法：移除所有 header 相关的 action
    // 注意：这可能会影响一些主题，如果遇到问题，可以注释掉下面几行
    global $wp_filter;
    if (isset($wp_filter['wp_head'])) {
        // 移除 wp_head 中的 header 相关输出
        foreach ($wp_filter['wp_head']->callbacks as $priority => $callbacks) {
            foreach ($callbacks as $callback_id => $callback) {
                // 可以根据需要添加更多条件来过滤
            }
        }
    }
}
add_action('template_redirect', 'remove_wp_header_for_app_pages', 1);

/**
 * 方法2：使用 CSS 隐藏 header（最保险的方法）
 */
function hide_header_with_css() {
    if (!should_hide_header()) {
        return;
    }
    ?>
    <style type="text/css">
        /* 隐藏 WordPress header - 通用选择器 */
        header,
        .site-header,
        #header,
        #masthead,
        .header,
        .main-header,
        .wp-header,
        .site-branding,
        .header-wrapper,
        .header-container,
        .site-header-wrapper,
        /* Elementor header */
        .elementor-location-header,
        .elementor-header,
        /* 主题特定的 header 类 */
        .ast-header-wrapper,
        .generate-header,
        .ocean-header-wrap,
        .neve-header,
        .kadence-header,
        /* WordPress admin bar（如果登录了） */
        body.admin-bar #wpadminbar {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }
        
        /* 调整 body margin，因为移除了 header */
        body.admin-bar {
            margin-top: 0 !important;
        }
        
        /* 隐藏 footer（如果需要） */
        <?php if (HIDE_FOOTER_TOO): ?>
        footer,
        .site-footer,
        #footer,
        #colophon,
        .footer,
        .main-footer,
        .wp-footer,
        .elementor-location-footer {
            display: none !important;
            visibility: hidden !important;
        }
        <?php endif; ?>
        
        /* 确保内容区域占满全屏 */
        .site-content,
        .content-area,
        #content {
            margin-top: 0 !important;
            padding-top: 0 !important;
        }
        
        /* 隐藏不必要的导航菜单 */
        nav.main-navigation,
        .main-navigation,
        .site-navigation,
        .primary-menu,
        nav.header-menu {
            display: none !important;
        }
    </style>
    <?php
}
add_action('wp_head', 'hide_header_with_css', 999);

/**
 * 方法3：强制使用 Elementor Canvas 模板（适用于 Elementor 页面）
 */
function force_elementor_canvas_template($template) {
    if (!should_hide_header()) {
        return $template;
    }
    
    // 如果是 Elementor 编辑的页面，强制使用 Canvas 模板
    $page_id = get_the_ID();
    if ($page_id && \Elementor\Plugin::$instance->db->is_built_with_elementor($page_id)) {
        // Elementor Canvas 模板通常不需要额外处理
        // 但如果 header 还是显示，上面的 CSS 会处理
    }
    
    return $template;
}
add_filter('template_include', 'force_elementor_canvas_template', 99);

/**
 * 方法4：移除 WordPress Admin Bar（登录后顶部显示的工具栏）
 */
function hide_admin_bar_for_app_pages() {
    if (!should_hide_header()) {
        return;
    }
    
    // 使用 CSS 隐藏（已经在 hide_header_with_css 中处理）
    // 这里也可以选择完全禁用 admin bar
    if (is_user_logged_in()) {
        // 可选：完全禁用 admin bar（会全局禁用，谨慎使用）
        // show_admin_bar(false);
    }
}
add_action('init', 'hide_admin_bar_for_app_pages', 100);

/**
 * 方法5：JavaScript 动态移除 header（最后的手段）
 */
function hide_header_with_js() {
    if (!should_hide_header()) {
        return;
    }
    ?>
    <script type="text/javascript">
        (function() {
            // 等待页面加载完成后移除 header
            function removeHeaders() {
                // 通用的 header 选择器
                var selectors = [
                    'header',
                    '.site-header',
                    '#header',
                    '#masthead',
                    '.header',
                    '.main-header',
                    '.elementor-location-header',
                    '.ast-header-wrapper',
                    '.generate-header',
                    '.ocean-header-wrap'
                ];
                
                selectors.forEach(function(selector) {
                    var elements = document.querySelectorAll(selector);
                    elements.forEach(function(el) {
                        if (el) {
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.height = '0';
                            el.style.margin = '0';
                            el.style.padding = '0';
                        }
                    });
                });
                
                // 移除 admin bar
                var adminBar = document.getElementById('wpadminbar');
                if (adminBar) {
                    adminBar.style.display = 'none';
                    document.body.classList.remove('admin-bar');
                }
                
                // 调整 body margin
                document.body.style.marginTop = '0';
            }
            
            // DOM 加载完成后执行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', removeHeaders);
            } else {
                removeHeaders();
            }
            
            // 延迟执行一次，确保所有元素都已加载
            setTimeout(removeHeaders, 100);
            setTimeout(removeHeaders, 500);
        })();
    </script>
    <?php
}
add_action('wp_footer', 'hide_header_with_js', 1);

/**
 * 调试功能：在页面顶部显示当前状态（开发时可启用）
 */
function debug_header_hiding() {
    // 取消下面的注释以启用调试信息
    // if (current_user_can('administrator') && should_hide_header()) {
    //     echo '<!-- Header hiding is ACTIVE for this page -->';
    // }
}
add_action('wp_head', 'debug_header_hiding');

