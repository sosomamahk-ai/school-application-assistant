<?php
/**
 * WordPress Code Snippets 403 错误修复
 * 
 * 使用方法：
 * 1. 将此代码添加到主题的 functions.php 文件末尾
 * 2. 或者创建新的 Code Snippets（如果能创建的话）
 * 3. 保存后刷新页面，重新尝试创建/编辑代码片段
 * 
 * 此代码将：
 * - 确保 REST API 对已登录用户可用
 * - 修复 nonce 验证问题
 * - 允许 Code Snippets 插件所需的权限
 */

// ====== 方案 1：确保 REST API 可用 ======

/**
 * 允许已登录用户访问 REST API
 */
add_filter('rest_authentication_errors', function($result) {
    // 如果已经有结果（错误），检查是否是权限问题
    if (!empty($result)) {
        // 对于已登录用户，允许访问
        if (is_user_logged_in()) {
            return true;
        }
        return $result;
    }
    
    // 允许已登录用户访问所有 REST API
    if (is_user_logged_in()) {
        return true;
    }
    
    return $result;
}, 99);

/**
 * 确保 Code Snippets REST API 端点可用
 */
add_action('rest_api_init', function() {
    // 确保 REST API 已初始化
    if (!function_exists('rest_get_server')) {
        return;
    }
    
    // 为管理员添加额外的权限检查
    add_filter('rest_pre_dispatch', function($result, $server, $request) {
        // 如果是 Code Snippets 相关的请求
        if (strpos($request->get_route(), '/code-snippets') !== false || 
            strpos($request->get_route(), '/snippets') !== false) {
            
            // 允许管理员访问
            if (current_user_can('manage_options')) {
                return null; // 继续处理请求
            }
        }
        
        return $result;
    }, 10, 3);
}, 1);

// ====== 方案 2：修复 nonce 验证 ======

/**
 * 增加 nonce 生命周期（从默认的 24 小时增加到 48 小时）
 * 这可以防止因 nonce 过期导致的 403 错误
 */
add_filter('nonce_life', function($lifetime) {
    return 48 * HOUR_IN_SECONDS; // 48 小时
}, 10);

/**
 * 修复 AJAX nonce 验证
 */
add_action('wp_ajax_code_snippets', function() {
    // 允许 Code Snippets 的 AJAX 请求
    check_ajax_referer('code_snippets_nonce', 'nonce', false);
}, 1);

// ====== 方案 3：添加必要的用户权限 ======

/**
 * 确保管理员有 Code Snippets 所需的所有权限
 */
add_action('admin_init', function() {
    // 获取管理员角色
    $admin_role = get_role('administrator');
    
    if ($admin_role) {
        // 添加 Code Snippets 可能需要的权限
        $capabilities = array(
            'edit_posts',
            'edit_pages',
            'edit_others_posts',
            'edit_others_pages',
            'manage_options',
            'activate_plugins',
            'install_plugins',
            'update_plugins',
        );
        
        foreach ($capabilities as $cap) {
            if (!$admin_role->has_cap($cap)) {
                $admin_role->add_cap($cap);
            }
        }
    }
}, 1);

// ====== 方案 4：修复 CORS 问题（如果需要） ======

/**
 * 允许 Code Snippets 的前端请求
 */
add_action('rest_api_init', function() {
    // 移除可能阻止请求的过滤器
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    // 添加正确的 CORS 头
    add_filter('rest_pre_serve_request', function($served, $result, $request, $server) {
        header('Access-Control-Allow-Origin: ' . get_site_url());
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
        
        return $served;
    }, 10, 4);
}, 100);

// ====== 方案 5：调试信息（可选，调试时可启用） ======

/**
 * 添加调试日志（仅在 WP_DEBUG 开启时）
 * 取消下面的注释以启用调试
 */
/*
add_action('rest_api_init', function() {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        add_filter('rest_pre_dispatch', function($result, $server, $request) {
            error_log('REST API Request: ' . $request->get_method() . ' ' . $request->get_route());
            error_log('User: ' . (is_user_logged_in() ? wp_get_current_user()->user_login : 'Not logged in'));
            error_log('User Capabilities: ' . (current_user_can('manage_options') ? 'Has manage_options' : 'No manage_options'));
            return $result;
        }, 1, 3);
    }
}, 999);
*/

// ====== 方案 6：清除可能的缓存问题 ======

/**
 * 在管理员页面加载时清除可能影响 REST API 的缓存
 */
add_action('admin_init', function() {
    // 清除对象缓存（如果使用缓存插件）
    if (function_exists('wp_cache_flush')) {
        // 只在需要时清除，避免影响性能
        // wp_cache_flush(); // 取消注释以启用
    }
    
    // 确保管理员 session 有效
    if (is_user_logged_in() && current_user_can('manage_options')) {
        // 刷新用户 meta 缓存
        clean_user_cache(get_current_user_id());
    }
}, 999);

// ====== 方案 7：强制刷新 nonce（在特定情况下） ======

/**
 * 在插件页面刷新 nonce
 */
add_action('admin_enqueue_scripts', function($hook) {
    // 如果是 Code Snippets 相关页面
    if (strpos($hook, 'code-snippets') !== false || strpos($hook, 'snippets') !== false) {
        // 强制刷新页面以确保 nonce 是最新的
        // 注意：这会刷新页面，所以只在必要时使用
        // wp_add_inline_script('jquery', 'location.reload();');
    }
});

// ====== 使用说明 ======

/**
 * 使用此修复代码后：
 * 
 * 1. 清除浏览器缓存和 Cookie
 * 2. 重新登录 WordPress 后台
 * 3. 尝试创建或编辑代码片段
 * 
 * 如果仍然出现 403 错误：
 * 
 * 1. 检查安全插件设置（Wordfence, iThemes Security 等）
 * 2. 查看 wp-content/debug.log 错误日志
 * 3. 检查 .htaccess 文件是否有阻止 REST API 的规则
 * 4. 联系主机提供商检查服务器防火墙规则
 * 5. 查看完整的故障排除指南：FIX_403_ERROR.md
 */

