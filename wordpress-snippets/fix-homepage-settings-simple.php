<?php
/**
 * WordPress 主页设置快速修复工具（简化版）
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 访问 WordPress 后台 → 工具 → 主页修复
 * 
 * 注意：如果无法激活，请检查：
 * - WordPress 版本是否 >= 5.0
 * - PHP 版本是否 >= 7.0
 * - 是否有其他代码片段使用了相同的函数名
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 只在后台加载
if (!is_admin()) {
    return;
}

// 添加管理页面
add_action('admin_menu', 'sosomama_homepage_fix_menu_simple');

function sosomama_homepage_fix_menu_simple() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    add_management_page(
        '主页修复工具',
        '主页修复',
        'manage_options',
        'sosomama-homepage-fix-simple',
        'sosomama_homepage_fix_page_simple'
    );
}

// 修复页面
function sosomama_homepage_fix_page_simple() {
    if (!current_user_can('manage_options')) {
        wp_die('您没有权限访问此页面');
    }
    
    // 处理修复操作
    if (isset($_POST['fix_homepage']) && isset($_POST['_wpnonce']) && wp_verify_nonce($_POST['_wpnonce'], 'fix_homepage_action_simple')) {
        $result = sosomama_fix_homepage_settings_simple();
        if ($result['success']) {
            echo '<div class="notice notice-success is-dismissible"><p><strong>' . esc_html($result['message']) . '</strong></p></div>';
        } else {
            echo '<div class="notice notice-error is-dismissible"><p><strong>' . esc_html($result['message']) . '</strong></p></div>';
        }
    }
    
    // 获取当前设置
    $show_on_front = get_option('show_on_front', 'posts');
    $page_on_front = get_option('page_on_front', 0);
    $homepage_page = $page_on_front ? get_post($page_on_front) : null;
    
    // 查找可能的主页页面
    $all_possible = array();
    
    // 按标题搜索
    $pages = get_pages(array(
        'post_status' => 'any',
        'number' => 50,
    ));
    
    foreach ($pages as $page) {
        $title_lower = strtolower($page->post_title);
        if (strpos($title_lower, '主页') !== false || 
            strpos($title_lower, 'home') !== false ||
            strpos($title_lower, '首页') !== false) {
            $all_possible[] = $page->ID;
        }
    }
    
    $all_possible = array_unique($all_possible);
    
    ?>
    <div class="wrap">
        <h1>主页修复工具</h1>
        
        <div class="card" style="max-width: 900px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">当前设置状态</h2>
            
            <table class="form-table">
                <tr>
                    <th style="width: 150px;">主页显示方式</th>
                    <td>
                        <strong><?php echo $show_on_front === 'page' ? '静态页面' : '最新文章'; ?></strong>
                        <?php if ($show_on_front !== 'page'): ?>
                            <span style="color: red; margin-left: 10px;">⚠️ 应该设置为"静态页面"</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>主页页面</th>
                    <td>
                        <?php if ($homepage_page): ?>
                            <strong><?php echo esc_html($homepage_page->post_title); ?></strong>
                            (ID: <?php echo intval($page_on_front); ?>)
                            <br>
                            <span style="color: <?php echo $homepage_page->post_status === 'publish' ? 'green' : 'red'; ?>;">
                                状态: <?php echo esc_html($homepage_page->post_status); ?>
                            </span>
                            <?php if ($homepage_page->post_status !== 'publish'): ?>
                                <span style="color: red; margin-left: 10px;">⚠️ 页面未发布</span>
                            <?php endif; ?>
                            <br>
                            <a href="<?php echo esc_url(get_edit_post_link($page_on_front)); ?>" class="button" style="margin-top: 5px;">编辑页面</a>
                        <?php else: ?>
                            <span style="color: red;">❌ 未设置主页页面</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>短代码检查</th>
                    <td>
                        <?php
                        if (shortcode_exists('sosomama_homepage')): ?>
                            <span style="color: green;">✅ 短代码已注册</span>
                        <?php else: ?>
                            <span style="color: red;">❌ 短代码未注册（需要激活 homepage-shortcode.php）</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <?php if (!empty($all_possible)): ?>
        <div class="card" style="max-width: 900px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">可能的主页页面</h2>
            <ul>
                <?php foreach ($all_possible as $page_id): 
                    $page = get_post($page_id);
                    if ($page): ?>
                        <li style="margin-bottom: 10px;">
                            <strong><?php echo esc_html($page->post_title); ?></strong>
                            (ID: <?php echo intval($page_id); ?>)
                            - 状态: <span style="color: <?php echo $page->post_status === 'publish' ? 'green' : 'red'; ?>;"><?php echo esc_html($page->post_status); ?></span>
                            <a href="<?php echo esc_url(get_edit_post_link($page_id)); ?>" class="button" style="margin-left: 10px;">编辑</a>
                        </li>
                    <?php endif;
                endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>
        
        <div class="card" style="max-width: 900px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">快速修复</h2>
            
            <form method="post" action="">
                <?php wp_nonce_field('fix_homepage_action_simple'); ?>
                
                <p>点击下面的按钮可以自动修复主页设置：</p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li>✅ 将主页显示方式设置为"静态页面"</li>
                    <li>✅ 自动查找或创建主页页面</li>
                    <li>✅ 确保主页页面已发布</li>
                    <li>✅ 在主页页面中添加短代码（如果缺失）</li>
                </ul>
                
                <p style="margin-top: 20px;">
                    <input type="submit" name="fix_homepage" class="button button-primary button-large" value="执行修复" 
                           onclick="return confirm('确定要修复主页设置吗？');">
                </p>
            </form>
        </div>
        
        <div class="card" style="max-width: 900px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">手动修复步骤</h2>
            <ol style="line-height: 2;">
                <li>进入 <strong>设置</strong> → <strong>阅读</strong></li>
                <li>选择 <strong>"静态页面"</strong></li>
                <li>在 <strong>"主页"</strong> 下拉菜单中选择您的主页页面</li>
                <li>如果主页页面不存在：
                    <ol style="list-style: lower-alpha;">
                        <li>进入 <strong>页面</strong> → <strong>添加新页面</strong></li>
                        <li>标题：<strong>主页</strong></li>
                        <li>内容：输入 <code>[sosomama_homepage]</code></li>
                        <li>点击 <strong>发布</strong></li>
                        <li>回到 <strong>设置</strong> → <strong>阅读</strong>，选择刚创建的页面</li>
                    </ol>
                </li>
                <li>点击 <strong>保存更改</strong></li>
            </ol>
        </div>
    </div>
    <?php
}

// 执行修复
function sosomama_fix_homepage_settings_simple() {
    if (!current_user_can('manage_options')) {
        return array('success' => false, 'message' => '您没有权限执行此操作');
    }
    
    // 1. 设置主页显示方式为静态页面
    update_option('show_on_front', 'page');
    
    // 2. 查找或创建主页页面
    $page_on_front = get_option('page_on_front', 0);
    $homepage_page = null;
    
    // 检查当前设置的主页页面是否存在且已发布
    if ($page_on_front) {
        $homepage_page = get_post($page_on_front);
        if ($homepage_page && $homepage_page->post_status === 'publish') {
            // 检查是否有短代码
            if (strpos($homepage_page->post_content, '[sosomama_homepage]') === false) {
                // 添加短代码
                $updated_content = $homepage_page->post_content;
                if (!empty(trim($updated_content))) {
                    $updated_content .= "\n\n";
                }
                $updated_content .= '[sosomama_homepage]';
                
                $update_result = wp_update_post(array(
                    'ID' => $page_on_front,
                    'post_content' => $updated_content
                ), true);
                
                if (is_wp_error($update_result)) {
                    return array(
                        'success' => false,
                        'message' => '更新页面内容失败：' . $update_result->get_error_message()
                    );
                }
                
                return array(
                    'success' => true,
                    'message' => '主页设置已修复！已在主页页面添加短代码。'
                );
            }
            return array(
                'success' => true,
                'message' => '主页设置正常，无需修复。'
            );
        }
    }
    
    // 查找可能的主页页面
    $pages = get_pages(array(
        'post_status' => 'any',
        'number' => 50,
    ));
    
    $possible_pages = array();
    foreach ($pages as $page) {
        $title_lower = strtolower($page->post_title);
        if (strpos($title_lower, '主页') !== false || 
            strpos($title_lower, 'home') !== false ||
            strpos($title_lower, '首页') !== false) {
            $possible_pages[] = $page;
        }
    }
    
    // 如果找到可能的页面，使用第一个
    if (!empty($possible_pages)) {
        $selected_page = $possible_pages[0];
        
        // 确保页面已发布
        if ($selected_page->post_status !== 'publish') {
            $update_result = wp_update_post(array(
                'ID' => $selected_page->ID,
                'post_status' => 'publish'
            ), true);
            
            if (is_wp_error($update_result)) {
                return array(
                    'success' => false,
                    'message' => '发布页面失败：' . $update_result->get_error_message()
                );
            }
        }
        
        // 检查并添加短代码
        if (strpos($selected_page->post_content, '[sosomama_homepage]') === false) {
            $updated_content = $selected_page->post_content;
            if (!empty(trim($updated_content))) {
                $updated_content .= "\n\n";
            }
            $updated_content .= '[sosomama_homepage]';
            
            $update_result = wp_update_post(array(
                'ID' => $selected_page->ID,
                'post_content' => $updated_content
            ), true);
            
            if (is_wp_error($update_result)) {
                return array(
                    'success' => false,
                    'message' => '更新页面内容失败：' . $update_result->get_error_message()
                );
            }
        }
        
        // 设置为主页
        update_option('page_on_front', $selected_page->ID);
        
        return array(
            'success' => true,
            'message' => sprintf('已找到并设置主页页面："%s" (ID: %d)', 
                $selected_page->post_title, 
                $selected_page->ID
            )
        );
    }
    
    // 如果都没找到，创建新页面
    $new_page_id = wp_insert_post(array(
        'post_title' => '主页',
        'post_content' => '[sosomama_homepage]',
        'post_status' => 'publish',
        'post_type' => 'page',
    ), true);
    
    if (is_wp_error($new_page_id)) {
        return array(
            'success' => false,
            'message' => '创建主页页面失败：' . $new_page_id->get_error_message()
        );
    }
    
    // 设置为主页
    update_option('page_on_front', $new_page_id);
    
    return array(
        'success' => true,
        'message' => sprintf('已创建新的主页页面并设置为主页 (ID: %d)', $new_page_id)
    );
}

