<?php
/**
 * 修复子主题主页显示问题
 * 
 * 这个代码片段会强制 WordPress 使用设置的主页页面，即使主题有 front-page.php
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 刷新网站首页，应该能正常显示设置的主页页面
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 强制使用 WordPress 设置的主页
add_action('template_redirect', 'sosomama_force_homepage_page', 1);

function sosomama_force_homepage_page() {
    // 只在首页执行
    if (!is_front_page()) {
        return;
    }
    
    // 检查是否设置了静态主页
    $show_on_front = get_option('show_on_front');
    $page_on_front = get_option('page_on_front');
    
    if ($show_on_front !== 'page' || !$page_on_front) {
        return;
    }
    
    // 获取主页页面
    $homepage = get_post($page_on_front);
    
    if (!$homepage || $homepage->post_status !== 'publish') {
        return;
    }
    
    // 设置查询为主页页面
    global $wp_query;
    
    // 重置查询
    $wp_query = new WP_Query(array(
        'page_id' => $page_on_front,
        'post_type' => 'page',
    ));
    
    // 设置为主页查询
    $wp_query->is_front_page = true;
    $wp_query->is_home = false;
    $wp_query->is_page = true;
    $wp_query->is_singular = true;
    
    // 使用 page.php 模板（如果存在）
    $template = get_page_template();
    
    if ($template && file_exists($template)) {
        // 使用页面模板
        add_filter('template_include', function($template) use ($page_on_front) {
            // 优先使用 page.php
            $page_template = locate_template(array('page.php', 'singular.php', 'index.php'));
            if ($page_template) {
                return $page_template;
            }
            return $template;
        }, 99);
    }
}

// 另一种方法：直接重写模板加载
add_filter('template_include', 'sosomama_override_front_page_template', 99);

function sosomama_override_front_page_template($template) {
    // 只在首页执行
    if (!is_front_page()) {
        return $template;
    }
    
    // 检查是否设置了静态主页
    $show_on_front = get_option('show_on_front');
    $page_on_front = get_option('page_on_front');
    
    if ($show_on_front !== 'page' || !$page_on_front) {
        return $template;
    }
    
    // 如果当前模板是 front-page.php，改为使用 page.php
    if (basename($template) === 'front-page.php') {
        // 查找 page.php 模板
        $page_template = locate_template(array('page.php', 'singular.php', 'index.php'));
        if ($page_template) {
            return $page_template;
        }
    }
    
    return $template;
}

// 确保主页页面内容正确显示
add_action('the_post', 'sosomama_setup_homepage_post');

function sosomama_setup_homepage_post($post) {
    if (!is_front_page()) {
        return;
    }
    
    $page_on_front = get_option('page_on_front');
    
    if ($page_on_front && $post->ID == $page_on_front) {
        // 确保页面内容正确设置
        setup_postdata($post);
    }
}

