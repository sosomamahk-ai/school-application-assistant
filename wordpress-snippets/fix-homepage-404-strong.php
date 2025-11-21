<?php
/**
 * 强力修复主页 404 问题
 * 
 * 这个代码片段会强制修复主页显示问题，即使出现 404 错误
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 刷新网站首页
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 最高优先级修复主页查询
add_action('parse_query', 'sosomama_fix_homepage_query_strong', 1);
add_action('template_redirect', 'sosomama_fix_homepage_redirect_strong', 1);
add_filter('template_include', 'sosomama_fix_homepage_template_strong', 999);

// 修复查询
function sosomama_fix_homepage_query_strong($query) {
    // 只在主查询和首页执行
    if (!$query->is_main_query() || !is_front_page()) {
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
    
    if (!$homepage) {
        return;
    }
    
    // 强制设置查询参数
    $query->set('page_id', $page_on_front);
    $query->set('post_type', 'page');
    $query->set('posts_per_page', 1);
    $query->set('post__in', array($page_on_front));
    
    // 设置查询标志
    $query->is_front_page = true;
    $query->is_home = false;
    $query->is_page = true;
    $query->is_singular = true;
    $query->is_404 = false;
    
    // 重置查询
    $query->query_vars['page_id'] = $page_on_front;
    $query->query_vars['pagename'] = '';
    $query->query_vars['name'] = '';
}

// 修复重定向
function sosomama_fix_homepage_redirect_strong() {
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
    
    if (!$homepage) {
        // 如果页面不存在，显示错误信息
        add_action('wp_footer', function() use ($page_on_front) {
            if (current_user_can('manage_options')) {
                echo '<!-- 主页修复提示：页面 ID ' . intval($page_on_front) . ' 不存在 -->';
            }
        });
        return;
    }
    
    if ($homepage->post_status !== 'publish') {
        // 如果页面未发布，显示错误信息
        add_action('wp_footer', function() use ($homepage) {
            if (current_user_can('manage_options')) {
                echo '<!-- 主页修复提示：页面 "' . esc_html($homepage->post_title) . '" 未发布 -->';
            }
        });
        return;
    }
    
    // 强制设置全局查询
    global $wp_query;
    
    // 创建新的查询
    $wp_query = new WP_Query(array(
        'page_id' => $page_on_front,
        'post_type' => 'page',
        'posts_per_page' => 1,
    ));
    
    // 设置查询标志
    $wp_query->is_front_page = true;
    $wp_query->is_home = false;
    $wp_query->is_page = true;
    $wp_query->is_singular = true;
    $wp_query->is_404 = false;
    $wp_query->is_archive = false;
    $wp_query->is_search = false;
    
    // 设置当前文章
    if ($wp_query->have_posts()) {
        $wp_query->the_post();
    }
}

// 修复模板
function sosomama_fix_homepage_template_strong($template) {
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
    
    // 获取主页页面
    $homepage = get_post($page_on_front);
    
    if (!$homepage || $homepage->post_status !== 'publish') {
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
    
    // 确保使用正确的模板
    $page_template = get_page_template();
    if ($page_template && file_exists($page_template)) {
        return $page_template;
    }
    
    // 查找可用的页面模板
    $templates = array('page.php', 'singular.php', 'index.php');
    $found_template = locate_template($templates);
    
    if ($found_template) {
        return $found_template;
    }
    
    return $template;
}

// 确保文章数据正确设置
add_action('wp', 'sosomama_setup_homepage_post_data_strong');

function sosomama_setup_homepage_post_data_strong() {
    if (!is_front_page()) {
        return;
    }
    
    $page_on_front = get_option('page_on_front');
    
    if (!$page_on_front) {
        return;
    }
    
    global $wp_query, $post;
    
    // 如果查询没有文章，手动设置
    if (!$wp_query->have_posts()) {
        $homepage = get_post($page_on_front);
        
        if ($homepage && $homepage->post_status === 'publish') {
            $wp_query->posts = array($homepage);
            $wp_query->post_count = 1;
            $wp_query->found_posts = 1;
            $wp_query->max_num_pages = 1;
            
            // 设置当前文章
            $post = $homepage;
            setup_postdata($post);
        }
    }
}

// 添加调试信息（仅管理员可见）
add_action('wp_footer', 'sosomama_homepage_debug_info');

function sosomama_homepage_debug_info() {
    if (!is_front_page() || !current_user_can('manage_options')) {
        return;
    }
    
    $show_on_front = get_option('show_on_front');
    $page_on_front = get_option('page_on_front');
    
    echo "\n<!-- 主页调试信息\n";
    echo "show_on_front: " . esc_html($show_on_front) . "\n";
    echo "page_on_front: " . intval($page_on_front) . "\n";
    
    if ($page_on_front) {
        $homepage = get_post($page_on_front);
        if ($homepage) {
            echo "页面标题: " . esc_html($homepage->post_title) . "\n";
            echo "页面状态: " . esc_html($homepage->post_status) . "\n";
        } else {
            echo "错误: 页面不存在！\n";
        }
    }
    
    global $wp_query;
    echo "is_front_page: " . ($wp_query->is_front_page ? 'true' : 'false') . "\n";
    echo "is_404: " . ($wp_query->is_404 ? 'true' : 'false') . "\n";
    echo "have_posts: " . ($wp_query->have_posts() ? 'true' : 'false') . "\n";
    echo "post_count: " . intval($wp_query->post_count) . "\n";
    echo "-->\n";
}

