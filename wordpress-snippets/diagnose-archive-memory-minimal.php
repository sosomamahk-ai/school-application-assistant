<?php
/**
 * 诊断 Archive 页面内存错误（最小测试版本）
 * 
 * 如果这个版本可以激活，说明问题在复杂代码中
 * 如果这个版本也无法激活，说明是环境或配置问题
 */

// 最简单的测试：只添加菜单
add_action('admin_menu', function() {
    add_management_page(
        '诊断 Archive 内存问题',
        '诊断 Archive 内存',
        'manage_options',
        'diagnose-archive-memory-test',
        function() {
            echo '<div class="wrap"><h1>测试页面</h1><p>如果您看到这个页面，说明代码片段已成功激活！</p></div>';
        }
    );
}, 10);


