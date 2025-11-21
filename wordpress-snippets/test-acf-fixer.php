<?php
/**
 * ACF null 值修复工具 - 诊断测试页面
 * 
 * 使用此文件可以诊断工具页面空白的问题
 * 
 * 使用方法：
 * 1. 访问：https://your-site.com/?test_acf_fixer=1
 * 2. 查看输出信息
 */

if (!defined('ABSPATH')) {
    // 如果不是从 WordPress 加载，尝试加载 WordPress
    require_once('../../../wp-load.php');
}

// 检查是否启用调试模式
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// 测试 URL 参数
if (isset($_GET['test_acf_fixer'])) {
    // 检查权限
    if (!current_user_can('manage_options')) {
        die('错误：您没有管理员权限。请先登录 WordPress 后台。');
    }
    
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ACF Fixer 诊断测试</title>';
    echo '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .success{color:green;} .error{color:red;} .info{color:blue;} pre{background:white;padding:10px;border:1px solid #ddd;}</style>';
    echo '</head><body>';
    echo '<h1>ACF null 值修复工具 - 诊断测试</h1>';
    
    $checks = array();
    
    // 检查 1: WordPress 是否加载
    if (defined('ABSPATH')) {
        $checks[] = array('status' => 'success', 'message' => 'WordPress 已加载');
    } else {
        $checks[] = array('status' => 'error', 'message' => 'WordPress 未加载');
        echo '<p class="error">致命错误：WordPress 未加载</p>';
        echo '</body></html>';
        exit;
    }
    
    // 检查 2: 用户权限
    if (current_user_can('manage_options')) {
        $checks[] = array('status' => 'success', 'message' => '用户有管理员权限');
    } else {
        $checks[] = array('status' => 'error', 'message' => '用户没有管理员权限');
    }
    
    // 检查 3: ACF 插件是否安装
    if (function_exists('get_field')) {
        $checks[] = array('status' => 'success', 'message' => 'ACF get_field() 函数存在');
    } else {
        $checks[] = array('status' => 'error', 'message' => 'ACF get_field() 函数不存在 - ACF 插件可能未安装');
    }
    
    // 检查 4: ACF Pro 函数
    if (function_exists('acf_get_field_groups')) {
        $checks[] = array('status' => 'success', 'message' => 'ACF acf_get_field_groups() 函数存在');
    } else {
        $checks[] = array('status' => 'error', 'message' => 'ACF acf_get_field_groups() 函数不存在 - 可能需要 ACF Pro 版本');
    }
    
    if (function_exists('acf_get_fields')) {
        $checks[] = array('status' => 'success', 'message' => 'ACF acf_get_fields() 函数存在');
    } else {
        $checks[] = array('status' => 'error', 'message' => 'ACF acf_get_fields() 函数不存在');
    }
    
    // 检查 5: 类是否存在
    if (class_exists('ACF_Null_Value_Fixer')) {
        $checks[] = array('status' => 'success', 'message' => 'ACF_Null_Value_Fixer 类已定义');
        
        // 尝试实例化
        try {
            $fixer = new ACF_Null_Value_Fixer();
            $checks[] = array('status' => 'success', 'message' => 'ACF_Null_Value_Fixer 类可以实例化');
        } catch (Exception $e) {
            $checks[] = array('status' => 'error', 'message' => '无法实例化 ACF_Null_Value_Fixer 类: ' . $e->getMessage());
        }
    } else {
        $checks[] = array('status' => 'error', 'message' => 'ACF_Null_Value_Fixer 类未定义 - 代码片段可能未加载');
    }
    
    // 检查 6: 管理菜单函数
    if (function_exists('acf_null_fixer_admin_page')) {
        $checks[] = array('status' => 'success', 'message' => 'acf_null_fixer_admin_page() 函数存在');
    } else {
        $checks[] = array('status' => 'error', 'message' => 'acf_null_fixer_admin_page() 函数不存在 - 管理菜单代码可能未加载');
    }
    
    // 显示检查结果
    echo '<h2>检查结果</h2>';
    echo '<table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:white;">';
    echo '<tr><th>状态</th><th>检查项</th></tr>';
    foreach ($checks as $check) {
        $color = $check['status'] === 'success' ? 'green' : 'red';
        echo '<tr>';
        echo '<td style="color:' . $color . ';"><strong>' . strtoupper($check['status']) . '</strong></td>';
        echo '<td>' . htmlspecialchars($check['message']) . '</td>';
        echo '</tr>';
    }
    echo '</table>';
    
    // 显示 PHP 信息
    echo '<h2>PHP 信息</h2>';
    echo '<ul>';
    echo '<li>PHP 版本: ' . phpversion() . '</li>';
    echo '<li>WordPress 版本: ' . (defined('WP_VERSION') ? WP_VERSION : '未知') . '</li>';
    echo '<li>是否启用调试模式: ' . (defined('WP_DEBUG') && WP_DEBUG ? '是' : '否') . '</li>';
    echo '<li>错误报告级别: ' . error_reporting() . '</li>';
    echo '</ul>';
    
    // 显示已加载的插件
    echo '<h2>已激活的插件</h2>';
    if (function_exists('get_plugins')) {
        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        echo '<ul>';
        foreach ($active_plugins as $plugin) {
            $plugin_name = isset($all_plugins[$plugin]) ? $all_plugins[$plugin]['Name'] : $plugin;
            echo '<li>' . htmlspecialchars($plugin_name) . '</li>';
        }
        echo '</ul>';
    }
    
    // 检查最近的错误
    echo '<h2>最近的错误日志</h2>';
    $log_file = WP_CONTENT_DIR . '/debug.log';
    if (file_exists($log_file)) {
        $log_content = file_get_contents($log_file);
        $log_lines = explode("\n", $log_content);
        $recent_lines = array_slice($log_lines, -20);
        echo '<pre>' . htmlspecialchars(implode("\n", $recent_lines)) . '</pre>';
    } else {
        echo '<p class="info">debug.log 文件不存在。如果要启用日志，请在 wp-config.php 中添加：</p>';
        echo '<pre>define(\'WP_DEBUG\', true);
define(\'WP_DEBUG_LOG\', true);
define(\'WP_DEBUG_DISPLAY\', false);</pre>';
    }
    
    // 提供链接
    echo '<h2>快速链接</h2>';
    echo '<ul>';
    echo '<li><a href="' . admin_url('admin.php?page=fix-acf-null') . '">访问修复工具页面</a></li>';
    echo '<li><a href="' . admin_url('admin.php?page=snippets') . '">查看 Code Snippets</a></li>';
    echo '<li><a href="' . admin_url('plugins.php') . '">查看已安装的插件</a></li>';
    echo '</ul>';
    
    echo '</body></html>';
    exit;
}

