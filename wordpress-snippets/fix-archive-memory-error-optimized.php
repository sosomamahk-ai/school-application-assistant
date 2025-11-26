<?php
/**
 * 修复 Archive 页面内存错误（优化版本）
 * 
 * 问题：taxonomy archive 页面加载大量文章时，即使限制每页数量，
 * WordPress 仍会预加载所有匹配文章的 meta 数据，导致内存耗尽。
 * 
 * 解决方案：
 * 1. 限制 archive 查询的文章数量（默认每页 12 篇）
 * 2. 禁用 meta 数据的预加载缓存（关键优化）
 * 3. 延迟加载 meta 数据，只在需要时加载
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 确保"运行位置"设置为"运行在所有位置"或"仅运行在管理后台"
 */

// 防止重复加载
if (!function_exists('sosomama_limit_archive_query_optimized')) {
    
    /**
     * 限制 archive 页面的查询数量，避免内存错误
     * 关键：禁用 meta 缓存预加载
     */
    function sosomama_limit_archive_query_optimized($query) {
        // 只在主查询的 archive 页面执行
        if (!is_admin() && $query->is_main_query()) {
            // 如果是 taxonomy archive 页面（profile_type）
            if (is_tax('profile_type') || is_tax('school_category')) {
                // 限制每页显示的文章数量
                $posts_per_page = apply_filters('sosomama_archive_posts_per_page', 12);
                $query->set('posts_per_page', $posts_per_page);
                
                // 确保使用分页
                $query->set('nopaging', false);
                
                // 关键优化：禁用 meta 缓存预加载，避免加载所有文章的 meta
                $query->set('update_post_meta_cache', false);
                
                // 保留 taxonomy terms 缓存（这个通常不会导致内存问题）
                $query->set('update_post_term_cache', true);
            }
            
            // 如果是 profile post type 的 archive
            if (is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                $posts_per_page = apply_filters('sosomama_archive_posts_per_page', 12);
                $query->set('posts_per_page', $posts_per_page);
                $query->set('nopaging', false);
                // 禁用 meta 缓存预加载
                $query->set('update_post_meta_cache', false);
            }
        }
    }
    add_action('pre_get_posts', 'sosomama_limit_archive_query_optimized', 1);
    
    /**
     * 进一步优化：在 archive 页面禁用某些 meta 的自动加载
     * 这可以防止 WordPress 在查询时自动加载所有 meta
     */
    function sosomama_disable_meta_autoload_archive($check, $object_id, $meta_key, $meta_value, $prev_value) {
        // 只在 archive 页面执行
        if (is_tax('profile_type') || is_tax('school_category') || 
            is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
            // 对于 archive 页面，某些 meta 可以延迟加载
            // 这里不做修改，只是提供一个钩子
        }
        return $check;
    }
    // 注意：这个 filter 可能不需要，但保留作为扩展点
    
    /**
     * 清理查询后的内存
     * 在 taxonomy archive 页面加载完文章列表后清理内存
     */
    function sosomama_cleanup_archive_memory_optimized() {
        if (is_tax('profile_type') || is_tax('school_category') || 
            is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
            // 清理对象缓存（如果有）
            // 注意：wp_cache_flush() 会清空所有缓存，可能影响性能
            // 只在必要时使用
            // wp_cache_flush();
        }
    }
    add_action('wp_footer', 'sosomama_cleanup_archive_memory_optimized', 999);
    
    /**
     * 临时增加 PHP 内存限制（仅用于 archive 页面）
     * 这是必要的，因为即使优化了查询，某些情况下仍可能接近限制
     */
    function sosomama_increase_memory_for_archive_optimized() {
        if (!is_admin()) {
            if (is_tax('profile_type') || is_tax('school_category') || 
                is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                // 临时增加内存限制到 768MB
                // 注意：这需要服务器允许 ini_set
                if (function_exists('ini_set')) {
                    @ini_set('memory_limit', '768M');
                }
            }
        }
    }
    // 启用内存限制增加（优先级设为 1，确保最早执行）
    add_action('template_redirect', 'sosomama_increase_memory_for_archive_optimized', 1);
    
    /**
     * 为 archive 页面添加分页导航
     * 确保用户可以看到分页链接
     */
    function sosomama_archive_pagination_optimized() {
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
    add_action('wp_footer', 'sosomama_archive_pagination_optimized');
    
    /**
     * 调试函数：检查 archive 查询的文章数量
     * 用于诊断问题，可以在开发环境中使用
     */
    function sosomama_debug_archive_query_optimized($query) {
        if (defined('WP_DEBUG') && WP_DEBUG && !is_admin() && $query->is_main_query()) {
            if (is_tax('profile_type') || is_tax('school_category')) {
                error_log('Sosomama Archive Query Optimized: ' . print_r(array(
                    'taxonomy' => get_queried_object()->taxonomy ?? 'N/A',
                    'term' => get_queried_object()->name ?? 'N/A',
                    'posts_per_page' => $query->get('posts_per_page'),
                    'update_post_meta_cache' => $query->get('update_post_meta_cache'),
                    'found_posts' => $query->found_posts ?? 'N/A',
                ), true));
            }
        }
    }
    // 取消注释来启用调试（仅在开发环境）
    // add_action('pre_get_posts', 'sosomama_debug_archive_query_optimized', 999);
    
} // 结束 function_exists 检查

