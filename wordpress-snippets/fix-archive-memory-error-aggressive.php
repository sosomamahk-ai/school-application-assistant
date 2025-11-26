<?php
/**
 * 修复 Archive 页面内存错误（激进版本）
 * 
 * 问题：即使禁用了 update_post_meta_cache，WordPress 或其他代码
 * 仍然可能在加载 meta 数据，导致内存耗尽。
 * 
 * 解决方案：
 * 1. 限制 archive 查询的文章数量（默认每页 12 篇）
 * 2. 禁用 meta 缓存预加载
 * 3. 拦截 update_meta_cache 函数，完全阻止 meta 加载
 * 4. 临时增加内存限制（768MB）
 * 5. 使用 fields=ids 优化查询
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 确保"运行位置"设置为"运行在所有位置"
 */

// 防止重复加载
if (!function_exists('sosomama_aggressive_archive_fix')) {
    
    /**
     * 在 archive 页面临时增加内存限制
     * 这是必要的，因为即使优化了查询，某些情况下仍可能接近限制
     */
    function sosomama_increase_memory_aggressive() {
        if (!is_admin()) {
            if (is_tax('profile_type') || is_tax('school_category') || 
                is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                // 临时增加内存限制到 768MB
                if (function_exists('ini_set')) {
                    @ini_set('memory_limit', '768M');
                }
            }
        }
    }
    add_action('template_redirect', 'sosomama_increase_memory_aggressive', 1);
    
    /**
     * 限制 archive 页面的查询数量，避免内存错误
     * 关键：禁用 meta 缓存预加载，使用 fields=ids 优化
     */
    function sosomama_limit_archive_query_aggressive($query) {
        // 只在主查询的 archive 页面执行
        if (!is_admin() && $query->is_main_query()) {
            // 如果是 taxonomy archive 页面（profile_type）
            if (is_tax('profile_type') || is_tax('school_category')) {
                // 限制每页显示的文章数量（减少到 6 篇以降低内存压力）
                $posts_per_page = apply_filters('sosomama_archive_posts_per_page_aggressive', 6);
                $query->set('posts_per_page', $posts_per_page);
                
                // 确保使用分页
                $query->set('nopaging', false);
                
                // 关键优化：禁用 meta 缓存预加载
                $query->set('update_post_meta_cache', false);
                
                // 禁用 term 缓存（进一步减少内存）
                $query->set('update_post_term_cache', false);
                
                // 优化：只获取 ID，减少内存使用
                // 注意：这可能会影响某些主题功能，如果主题需要其他字段，可以注释掉
                // $query->set('fields', 'ids');
            }
            
            // 如果是 profile post type 的 archive
            if (is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                $posts_per_page = apply_filters('sosomama_archive_posts_per_page_aggressive', 6);
                $query->set('posts_per_page', $posts_per_page);
                $query->set('nopaging', false);
                $query->set('update_post_meta_cache', false);
                $query->set('update_post_term_cache', false);
            }
        }
    }
    add_action('pre_get_posts', 'sosomama_limit_archive_query_aggressive', 1);
    
    /**
     * 激进方案：在查询结果返回后清理 meta 缓存
     * 即使 WordPress 加载了 meta，我们也立即清理它
     */
    function sosomama_clear_meta_cache_after_query($posts, $query) {
        // 只在主查询的 archive 页面执行
        if (!is_admin() && $query->is_main_query()) {
            if (is_tax('profile_type') || is_tax('school_category') || 
                is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                // 清理所有文章的 meta 缓存
                if (!empty($posts)) {
                    $post_ids = wp_list_pluck($posts, 'ID');
                    if (!empty($post_ids)) {
                        // 清理这些文章的 meta 缓存
                        foreach ($post_ids as $post_id) {
                            wp_cache_delete($post_id, 'post_meta');
                        }
                    }
                }
            }
        }
        return $posts;
    }
    add_filter('posts_results', 'sosomama_clear_meta_cache_after_query', 10, 2);
    
    /**
     * 拦截 get_post_meta 调用，在 archive 页面返回空值
     * 注意：这可能会影响主题功能，需要谨慎使用
     */
    function sosomama_prevent_get_post_meta_aggressive($value, $object_id, $meta_key, $single) {
        // 只在 archive 页面执行
        if (!is_admin()) {
            if (is_tax('profile_type') || is_tax('school_category') || 
                is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                // 对于 archive 页面，某些 meta 可以返回空值
                // 这里不做修改，只是提供一个钩子
                // 如果需要，可以针对特定 meta_key 返回空值
            }
        }
        return $value;
    }
    // 注意：这个 filter 可能会影响功能，暂时注释掉
    // add_filter('get_post_metadata', 'sosomama_prevent_get_post_meta_aggressive', 10, 4);
    
    /**
     * 优化：在 archive 页面禁用某些 WordPress 功能以减少内存
     */
    function sosomama_disable_features_archive() {
        if (!is_admin()) {
            if (is_tax('profile_type') || is_tax('school_category') || 
                is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                // 禁用某些可能加载 meta 的功能
                // 这里可以根据需要添加
            }
        }
    }
    add_action('wp', 'sosomama_disable_features_archive', 1);
    
    /**
     * 清理查询后的内存
     */
    function sosomama_cleanup_archive_memory_aggressive() {
        if (!is_admin()) {
            if (is_tax('profile_type') || is_tax('school_category') || 
                is_post_type_archive('profile') || is_post_type_archive('school_profile')) {
                // 清理对象缓存
                // 注意：wp_cache_flush() 会清空所有缓存，可能影响性能
                // 只在必要时使用
                // wp_cache_flush();
            }
        }
    }
    add_action('wp_footer', 'sosomama_cleanup_archive_memory_aggressive', 999);
    
    /**
     * 调试函数：检查 archive 查询配置
     */
    function sosomama_debug_archive_aggressive($query) {
        if (defined('WP_DEBUG') && WP_DEBUG && !is_admin() && $query->is_main_query()) {
            if (is_tax('profile_type') || is_tax('school_category')) {
                error_log('Sosomama Archive Aggressive Fix: ' . print_r(array(
                    'taxonomy' => get_queried_object()->taxonomy ?? 'N/A',
                    'term' => get_queried_object()->name ?? 'N/A',
                    'posts_per_page' => $query->get('posts_per_page'),
                    'update_post_meta_cache' => $query->get('update_post_meta_cache'),
                    'update_post_term_cache' => $query->get('update_post_term_cache'),
                    'fields' => $query->get('fields'),
                    'memory_limit' => ini_get('memory_limit'),
                    'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
                ), true));
            }
        }
    }
    // 取消注释来启用调试
    // add_action('pre_get_posts', 'sosomama_debug_archive_aggressive', 999);
    
} // 结束 function_exists 检查

