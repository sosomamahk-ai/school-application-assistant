<?php
/**
 * 终极修复主页 404 问题
 * 
 * 在最早阶段修复主页查询，确保不会出现 404
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 清除所有缓存
 * 4. 刷新首页
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 在最早阶段修复查询（优先级最高）
add_action('wp', 'sosomama_fix_homepage_ultimate', 1);
add_action('parse_request', 'sosomama_fix_homepage_parse_request', 1);
add_filter('pre_get_posts', 'sosomama_fix_homepage_pre_get_posts', 999);
add_action('template_redirect', 'sosomama_fix_homepage_template_redirect_ultimate', 1);

// 修复解析请求
function sosomama_fix_homepage_parse_request($wp) {
    // 只在首页执行
    if (!isset($wp->query_vars['pagename']) && 
        !isset($wp->query_vars['page_id']) && 
        empty($wp->query_vars)) {
        
        // 检查是否设置了静态主页
        $show_on_front = get_option('show_on_front');
        $page_on_front = get_option('page_on_front');
        
        if ($show_on_front === 'page' && $page_on_front) {
            $homepage = get_post($page_on_front);
            
            if ($homepage && $homepage->post_status === 'publish') {
                // 设置查询变量
                $wp->query_vars['page_id'] = $page_on_front;
                $wp->query_vars['pagename'] = $homepage->post_name;
                $wp->query_vars['post_type'] = 'page';
            }
        }
    }
}

// 修复预查询
function sosomama_fix_homepage_pre_get_posts($query) {
    // 只在主查询和首页执行
    if (!$query->is_main_query()) {
        return;
    }
    
    // 检查是否是首页
    if (is_admin() || !$query->is_front_page()) {
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
    
    // 强制设置查询参数
    $query->set('page_id', $page_on_front);
    $query->set('p', $page_on_front);
    $query->set('post_type', 'page');
    $query->set('posts_per_page', 1);
    $query->set('post__in', array($page_on_front));
    $query->set('name', '');
    $query->set('pagename', '');
    
    // 设置查询标志
    $query->is_front_page = true;
    $query->is_home = false;
    $query->is_page = true;
    $query->is_singular = true;
    $query->is_404 = false;
    $query->is_archive = false;
    $query->is_search = false;
}

// 修复 wp 动作
function sosomama_fix_homepage_ultimate() {
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
    
    global $wp_query;
    
    // 如果查询没有文章，强制设置
    if (!$wp_query->have_posts() || $wp_query->is_404) {
        // 创建新查询
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
        
        // 确保有文章
        if ($wp_query->have_posts()) {
            $wp_query->the_post();
        }
    }
}

// 修复模板重定向
function sosomama_fix_homepage_template_redirect_ultimate() {
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
    
    global $wp_query;
    
    // 如果仍然是 404，强制修复
    if ($wp_query->is_404 || !$wp_query->have_posts()) {
        // 完全重置查询
        wp_reset_query();
        
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
        
        // 设置全局 post
        if ($wp_query->have_posts()) {
            $wp_query->the_post();
            global $post;
            $post = $wp_query->posts[0];
            setup_postdata($post);
        }
    }
}

// 修复模板加载
add_filter('template_include', 'sosomama_fix_homepage_template_ultimate', 999);

function sosomama_fix_homepage_template_ultimate($template) {
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
        $page_template = locate_template(array('page.php', 'singular.php', 'index.php'));
        if ($page_template) {
            return $page_template;
        }
    }
    
    // 确保使用正确的模板
    $page_template = get_page_template();
    if ($page_template && file_exists($page_template) && basename($page_template) !== 'front-page.php') {
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

// 确保文章数据在循环中正确
add_action('loop_start', 'sosomama_fix_homepage_loop_start');

function sosomama_fix_homepage_loop_start($query) {
    if (!is_front_page() || !$query->is_main_query()) {
        return;
    }
    
    $page_on_front = get_option('page_on_front');
    
    if (!$page_on_front) {
        return;
    }
    
    // 如果循环中没有文章，添加主页页面
    if (!$query->have_posts()) {
        $homepage = get_post($page_on_front);
        
        if ($homepage && $homepage->post_status === 'publish') {
            $query->posts = array($homepage);
            $query->post_count = 1;
            $query->found_posts = 1;
            $query->max_num_pages = 1;
            
            // 设置当前文章
            global $post;
            $post = $homepage;
            setup_postdata($post);
        }
    }
}

// 添加调试信息
add_action('wp_footer', 'sosomama_homepage_debug_ultimate');

function sosomama_homepage_debug_ultimate() {
    if (!is_front_page() || !current_user_can('manage_options')) {
        return;
    }
    
    global $wp_query, $post;
    
    echo "\n<!-- ========== 主页调试信息（终极版） ==========\n";
    echo "show_on_front: " . esc_html(get_option('show_on_front')) . "\n";
    echo "page_on_front: " . intval(get_option('page_on_front')) . "\n";
    echo "is_front_page: " . ($wp_query->is_front_page ? 'true' : 'false') . "\n";
    echo "is_404: " . ($wp_query->is_404 ? 'true' : 'false') . "\n";
    echo "is_page: " . ($wp_query->is_page ? 'true' : 'false') . "\n";
    echo "have_posts: " . ($wp_query->have_posts() ? 'true' : 'false') . "\n";
    echo "post_count: " . intval($wp_query->post_count) . "\n";
    
    if ($post) {
        echo "current_post_ID: " . intval($post->ID) . "\n";
        echo "current_post_title: " . esc_html($post->post_title) . "\n";
    }
    
    echo "query_vars: " . print_r($wp_query->query_vars, true) . "\n";
    echo "========================================== -->\n";
}

// 清除重写规则（如果需要）
add_action('init', 'sosomama_flush_rewrite_rules_once');

function sosomama_flush_rewrite_rules_once() {
    $flushed = get_option('sosomama_rewrite_flushed');
    
    if (!$flushed) {
        flush_rewrite_rules();
        update_option('sosomama_rewrite_flushed', true);
    }
}

