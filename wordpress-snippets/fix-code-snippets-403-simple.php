<?php
/**
 * WordPress Code Snippets 403 错误修复 - 简化安全版
 * 
 * 使用方法：
 * 1. 先尝试添加第一部分（方案1），保存并测试
 * 2. 如果第一部分没问题，再添加第二部分（方案2）
 * 3. 逐步添加，避免一次性添加太多代码导致错误
 */

// ====== 方案 1：确保 REST API 可用（最基础，先添加这个） ======

add_filter('rest_authentication_errors', function($result) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    return $result;
}, 99);

// ====== 方案 2：增加 nonce 生命周期（如果方案1不够，再添加这个） ======

add_filter('nonce_life', function($lifetime) {
    return 48 * HOUR_IN_SECONDS;
}, 10);

