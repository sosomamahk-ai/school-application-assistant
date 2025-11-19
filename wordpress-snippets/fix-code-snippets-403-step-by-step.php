<?php
/**
 * WordPress Code Snippets 403 错误修复 - 分步骤版本
 * 
 * 重要：不要一次性添加所有代码！
 * 按照下面的步骤，每次只添加一个方案，测试后再添加下一个。
 */

// ============================================
// 步骤 1：基础 REST API 修复（先添加这个）
// ============================================
// 复制下面的代码到 functions.php，保存并测试

add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);

// ============================================
// 步骤 2：如果步骤1成功，再添加这个（nonce 修复）
// ============================================

add_filter('nonce_life', function($lifetime) {
    return 48 * HOUR_IN_SECONDS;
}, 10);

// ============================================
// 步骤 3：如果步骤2还不够，再添加这个（权限检查）
// ============================================

add_action('admin_init', function() {
    $admin_role = get_role('administrator');
    if ($admin_role && !$admin_role->has_cap('manage_options')) {
        $admin_role->add_cap('manage_options');
    }
}, 1);

// ============================================
// 步骤 4：如果步骤3还不够，再添加这个（Code Snippets 特定路由）
// ============================================

add_action('rest_api_init', function() {
    add_filter('rest_pre_dispatch', function($result, $server, $request) {
        $route = $request->get_route();
        if (strpos($route, 'code-snippets') !== false || strpos($route, 'snippets') !== false) {
            if (current_user_can('manage_options')) {
                return null;
            }
        }
        return $result;
    }, 10, 3);
}, 1);

