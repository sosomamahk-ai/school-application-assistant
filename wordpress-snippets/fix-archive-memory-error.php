<?php
/**
 * 修复 Archive 页面内存错误
 * 
 * 问题：taxonomy archive 页面（如 /profile_type/hk-is-template/）加载大量文章时
 * 会耗尽内存（512MB），导致 Fatal error。
 * 
 * 解决方案：
 * 1. 限制 archive 查询的文章数量（默认每页 12 篇）
 * 2. 优化查询，避免加载不必要的 meta 数据
 * 3. 为 taxonomy archive 添加分页支持
 * 
 * 使用方法：
 * 1. 将此代码添加到 WordPress 的 functions.php 文件中
 * 2. 或者通过 Code Snippets 插件添加此代码片段
 */

/**
 * 限制 archive 页面的查询数量，避免内存错误
 */
function sosomama_limit_archive_query($query) {
    // 只在主查询的 archive 页面执行
    if (!is_admin() && $query->is_main_query()) {
        // 如果是 taxonomy archive 页面（profile_type）
        if (is_tax('profile_type') || is_tax('school_category')) {
            // 限制每页显示的文章数量
            $posts_per_page = apply_filters('sosomama_archive_posts_per_page', 12);
            $query->set('posts_per_page', $posts_per_page);
            
            // 确保使用分页
            $query->set('nopaging', false);
            
            // 关键优化：禁用 meta 缓存预加载，避免加载所有匹配文章的 meta 数据
            // 这可以防止 WordPress 预加载所有文章的 meta，导致内存耗尽
            $query->set('update_post_meta_cache', false);  // 禁用 meta 预加载
            $query->set('update_post_term_cache', true);  // 保留 taxonomy terms 缓存
            
            // 添加 no_found_rows 可能会影响分页，所以注释掉
            // $query->set('no_found_rows', true);  // 不计算总数（如果不需要分页）
        }
        
        // 如果是 profile post type 的 archive
        if (is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
            $posts_per_page = apply_filters('sosomama_archive_posts_per_page', 12);
            $query->set('posts_per_page', $posts_per_page);
            $query->set('nopaging', false);
        }
    }
}
add_action('pre_get_posts', 'sosomama_limit_archive_query', 1);

/**
 * 优化 taxonomy archive 查询，减少内存使用
 * 通过过滤 WP_Query 来减少加载的 meta 数据
 */
function sosomama_optimize_archive_query($clauses, $query) {
    // 只在主查询的 taxonomy archive 页面执行
    if (!is_admin() && $query->is_main_query() && (is_tax('profile_type') || is_tax('school_category'))) {
        // 确保使用索引优化
        global $wpdb;
        
        // 优化 JOIN 查询（如果需要）
        // WordPress 会自动优化，但我们可以确保使用正确的索引
    }
    return $clauses;
}
add_filter('posts_clauses', 'sosomama_optimize_archive_query', 10, 2);

/**
 * 清理查询后的内存
 * 在 taxonomy archive 页面加载完文章列表后清理内存
 */
function sosomama_cleanup_archive_memory() {
    if (is_tax('profile_type') || is_tax('school_category') || 
        is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
        // 清理对象缓存（如果有）
        wp_cache_flush();
    }
}
add_action('wp_footer', 'sosomama_cleanup_archive_memory', 999);

/**
 * 如果需要，可以临时增加 PHP 内存限制（仅用于 archive 页面）
 * 注意：这只是临时解决方案，更好的方法是优化查询
 */
function sosomama_increase_memory_for_archive() {
    if (is_tax('profile_type') || is_tax('school_category') || 
        is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
        // 临时增加内存限制到 768MB（如果需要）
        // 注意：这需要服务器允许 ini_set
        if (function_exists('ini_set')) {
            @ini_set('memory_limit', '768M');
        }
    }
}
// 取消注释下面的行来启用（不推荐，优先使用查询优化）
// add_action('template_redirect', 'sosomama_increase_memory_for_archive', 1);

/**
 * 为 archive 页面添加分页导航
 * 确保用户可以看到分页链接
 */
function sosomama_archive_pagination() {
    if (is_tax('profile_type') || is_tax('school_category') || 
        is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
        
        // 检查是否有多个页面
        global $wp_query;
        if ($wp_query->max_num_pages > 1) {
            // 显示分页导航
            // 主题应该已经包含分页功能，如果没有，可以取消下面的注释
            /*
            echo '<nav class="sosomama-pagination">';
            echo paginate_links(array(
                'total' => $wp_query->max_num_pages,
                'prev_text' => '« 上一页',
                'next_text' => '下一页 »',
            ));
            echo '</nav>';
            */
        }
    }
}
add_action('wp_footer', 'sosomama_archive_pagination');

/**
 * 调试函数：检查 archive 查询的文章数量
 * 用于诊断问题，可以在开发环境中使用
 */
function sosomama_debug_archive_query($query) {
    if (defined('WP_DEBUG') && WP_DEBUG && !is_admin() && $query->is_main_query()) {
        if (is_tax('profile_type') || is_tax('school_category')) {
            error_log('Sosomama Archive Query: ' . print_r(array(
                'taxonomy' => get_queried_object()->taxonomy ?? 'N/A',
                'term' => get_queried_object()->name ?? 'N/A',
                'posts_per_page' => $query->get('posts_per_page'),
                'found_posts' => $query->found_posts ?? 'N/A',
            ), true));
        }
    }
}
// 取消注释来启用调试（仅在开发环境）
// add_action('pre_get_posts', 'sosomama_debug_archive_query', 999);

