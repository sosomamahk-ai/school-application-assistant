<?php
/**
 * ACF 配置检查和修复工具
 * 
 * 使用方法：
 * 1. 将此代码添加到 WordPress Code Snippets 或 functions.php
 * 2. 访问 WordPress 后台，在 URL 后添加 ?check_acf_config=1
 * 3. 或者创建一个管理页面来运行检查
 * 
 * 此工具会检查：
 * 1. ACF to REST API 插件是否安装并激活
 * 2. ACF 字段名是否为 name_short
 * 3. ACF 字段是否设置为在 REST API 中可见
 */

// 添加管理菜单项
add_action('admin_menu', 'acf_config_checker_menu');
function acf_config_checker_menu() {
    add_management_page(
        'ACF 配置检查',
        'ACF 配置检查',
        'manage_options',
        'acf-config-checker',
        'acf_config_checker_page'
    );
}

// 检查页面
function acf_config_checker_page() {
    if (!current_user_can('manage_options')) {
        wp_die('权限不足');
    }
    
    ?>
    <div class="wrap">
        <h1>ACF 配置检查工具</h1>
        <p>此工具将检查 ACF 相关配置是否正确设置。</p>
        
        <?php
        if (isset($_GET['run_check'])) {
            acf_config_checker_run_checks();
        } else {
            ?>
            <p>
                <a href="<?php echo admin_url('tools.php?page=acf-config-checker&run_check=1'); ?>" 
                   class="button button-primary">
                    运行检查
                </a>
            </p>
            <?php
        }
        ?>
    </div>
    <?php
}

// 执行检查
function acf_config_checker_run_checks() {
    $results = array();
    
    // 检查 1: ACF to REST API 插件
    $results['plugin'] = acf_config_check_plugin();
    
    // 检查 2: ACF 字段名
    $results['field_name'] = acf_config_check_field_name();
    
    // 检查 3: ACF 字段在 REST API 中可见
    $results['rest_visible'] = acf_config_check_rest_visible();
    
    // 显示结果
    acf_config_checker_display_results($results);
}

// 检查 1: ACF to REST API 插件
function acf_config_check_plugin() {
    $result = array(
        'check' => 'ACF to REST API 插件',
        'status' => 'unknown',
        'message' => '',
        'details' => array(),
        'fix' => ''
    );
    
    // 检查插件是否激活
    if (!function_exists('acf')) {
        $result['status'] = 'fail';
        $result['message'] = '❌ ACF 插件未安装或未激活';
        $result['fix'] = '请安装并激活 Advanced Custom Fields (ACF) 插件';
        return $result;
    }
    
    // 检查 ACF to REST API 插件
    $acf_to_rest_active = false;
    
    // 方法 1: 检查插件文件
    if (file_exists(WP_PLUGIN_DIR . '/acf-to-rest-api/acf-to-rest-api.php')) {
        $acf_to_rest_active = is_plugin_active('acf-to-rest-api/acf-to-rest-api.php');
    }
    
    // 方法 2: 检查类是否存在
    if (!$acf_to_rest_active && class_exists('ACF_To_REST_API')) {
        $acf_to_rest_active = true;
    }
    
    // 方法 3: 检查 REST API 端点是否注册
    if (!$acf_to_rest_active) {
        global $wp_rest_server;
        if ($wp_rest_server) {
            $routes = $wp_rest_server->get_routes();
            $acf_to_rest_active = isset($routes['/acf/v3/(?P<post_type>[\w\-\_]+)/(?P<id>[\d]+)']);
        }
    }
    
    if ($acf_to_rest_active) {
        $result['status'] = 'pass';
        $result['message'] = '✅ ACF to REST API 插件已安装并激活';
    } else {
        $result['status'] = 'warning';
        $result['message'] = '⚠️  ACF to REST API 插件可能未安装或未激活';
        $result['fix'] = '请安装并激活 ACF to REST API 插件：
1. 在 WordPress 后台，进入 插件 → 安装插件
2. 搜索 "ACF to REST API"
3. 安装并激活插件
4. 或者从 https://wordpress.org/plugins/acf-to-rest-api/ 下载';
    }
    
    $result['details'] = array(
        'acf_installed' => function_exists('acf'),
        'acf_to_rest_detected' => $acf_to_rest_active
    );
    
    return $result;
}

// 检查 2: ACF 字段名
function acf_config_check_field_name() {
    $result = array(
        'check' => 'ACF 字段名',
        'status' => 'unknown',
        'message' => '',
        'details' => array(),
        'fix' => ''
    );
    
    if (!function_exists('acf')) {
        $result['status'] = 'fail';
        $result['message'] = '❌ ACF 插件未安装，无法检查字段名';
        return $result;
    }
    
    // 获取所有字段组
    $field_groups = acf_get_field_groups();
    $found_name_short = false;
    $field_locations = array();
    
    foreach ($field_groups as $field_group) {
        $fields = acf_get_fields($field_group['ID']);
        
        foreach ($fields as $field) {
            if ($field['name'] === 'name_short') {
                $found_name_short = true;
                $field_locations[] = array(
                    'field_group' => $field_group['title'],
                    'field_label' => $field['label'],
                    'field_name' => $field['name'],
                    'field_type' => $field['type']
                );
            }
        }
    }
    
    if ($found_name_short) {
        $result['status'] = 'pass';
        $result['message'] = '✅ 找到 name_short 字段';
        $result['details'] = array(
            'locations' => $field_locations
        );
    } else {
        // 查找类似的字段名
        $similar_fields = array();
        foreach ($field_groups as $field_group) {
            $fields = acf_get_fields($field_group['ID']);
            foreach ($fields as $field) {
                $field_name_lower = strtolower($field['name']);
                if (strpos($field_name_lower, 'name') !== false && 
                    strpos($field_name_lower, 'short') !== false) {
                    $similar_fields[] = array(
                        'field_group' => $field_group['title'],
                        'field_label' => $field['label'],
                        'field_name' => $field['name']
                    );
                }
            }
        }
        
        $result['status'] = 'fail';
        $result['message'] = '❌ 未找到 name_short 字段';
        $result['details'] = array(
            'similar_fields' => $similar_fields
        );
        $result['fix'] = '请在 ACF 中创建名为 name_short 的字段：
1. 进入 WordPress 后台 → 自定义字段 → 字段组
2. 编辑相关的字段组（或创建新字段组）
3. 添加新字段，字段名设置为 name_short
4. 字段类型可以是 文本 或 文本区域
5. 确保字段组应用到 profile 或相应的 post type';
    }
    
    return $result;
}

// 检查 3: ACF 字段在 REST API 中可见
function acf_config_check_rest_visible() {
    $result = array(
        'check' => 'ACF 在 REST API 中可见',
        'status' => 'unknown',
        'message' => '',
        'details' => array(),
        'fix' => ''
    );
    
    if (!function_exists('acf')) {
        $result['status'] = 'fail';
        $result['message'] = '❌ ACF 插件未安装，无法检查 REST API 可见性';
        return $result;
    }
    
    // 获取所有字段组
    $field_groups = acf_get_field_groups();
    $name_short_field_groups = array();
    $rest_visible_count = 0;
    
    foreach ($field_groups as $field_group) {
        $has_name_short = false;
        $fields = acf_get_fields($field_group['ID']);
        
        foreach ($fields as $field) {
            if ($field['name'] === 'name_short') {
                $has_name_short = true;
                break;
            }
        }
        
        if ($has_name_short) {
            // 检查字段组是否在 REST API 中可见
            // ACF Pro 有 show_in_rest 选项
            $show_in_rest = isset($field_group['show_in_rest']) ? $field_group['show_in_rest'] : false;
            
            $name_short_field_groups[] = array(
                'title' => $field_group['title'],
                'key' => $field_group['key'],
                'show_in_rest' => $show_in_rest,
                'location' => $field_group['location']
            );
            
            if ($show_in_rest) {
                $rest_visible_count++;
            }
        }
    }
    
    if (count($name_short_field_groups) === 0) {
        $result['status'] = 'fail';
        $result['message'] = '❌ 未找到包含 name_short 字段的字段组';
        $result['fix'] = '请先创建 name_short 字段';
    } else if ($rest_visible_count === count($name_short_field_groups)) {
        $result['status'] = 'pass';
        $result['message'] = '✅ 所有包含 name_short 的字段组都设置为在 REST API 中可见';
        $result['details'] = array(
            'field_groups' => $name_short_field_groups
        );
    } else {
        $result['status'] = 'warning';
        $result['message'] = '⚠️  部分字段组未设置为在 REST API 中可见';
        $result['details'] = array(
            'field_groups' => $name_short_field_groups,
            'rest_visible_count' => $rest_visible_count,
            'total_count' => count($name_short_field_groups)
        );
        $result['fix'] = '请为包含 name_short 的字段组启用 REST API 可见性：
1. 进入 WordPress 后台 → 自定义字段 → 字段组
2. 编辑包含 name_short 字段的字段组
3. 在字段组设置中，找到 "Show in REST API" 选项
4. 启用该选项
5. 保存字段组';
    }
    
    return $result;
}

// 显示结果
function acf_config_checker_display_results($results) {
    ?>
    <div class="wrap">
        <h2>检查结果</h2>
        
        <?php foreach ($results as $key => $result): ?>
            <div class="notice notice-<?php echo $result['status'] === 'pass' ? 'success' : ($result['status'] === 'warning' ? 'warning' : 'error'); ?>" style="padding: 15px; margin: 20px 0;">
                <h3><?php echo esc_html($result['check']); ?></h3>
                <p><strong><?php echo esc_html($result['message']); ?></strong></p>
                
                <?php if (!empty($result['details'])): ?>
                    <details style="margin-top: 10px;">
                        <summary>详细信息</summary>
                        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow-x: auto;"><?php 
                            echo esc_html(print_r($result['details'], true)); 
                        ?></pre>
                    </details>
                <?php endif; ?>
                
                <?php if (!empty($result['fix'])): ?>
                    <div style="margin-top: 15px; padding: 10px; background: #fff; border-left: 4px solid #0073aa;">
                        <strong>修复建议：</strong>
                        <div style="margin-top: 5px; white-space: pre-line;"><?php echo esc_html($result['fix']); ?></div>
                    </div>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
        
        <p>
            <a href="<?php echo admin_url('tools.php?page=acf-config-checker'); ?>" class="button">
                返回
            </a>
            <a href="<?php echo admin_url('tools.php?page=acf-config-checker&run_check=1'); ?>" class="button button-primary">
                重新检查
            </a>
        </p>
    </div>
    <?php
}

// 如果通过 URL 参数直接访问
if (isset($_GET['check_acf_config']) && current_user_can('manage_options')) {
    add_action('admin_init', function() {
        acf_config_checker_run_checks();
        exit;
    });
}

