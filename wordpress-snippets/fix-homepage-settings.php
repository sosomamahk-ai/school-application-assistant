<?php
/**
 * WordPress 主页设置快速修复工具
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 访问 WordPress 后台，会显示主页设置状态和修复选项
 * 
 * 功能：
 * - 检查当前主页设置
 * - 自动查找或创建主页页面
 * - 恢复主页设置
 * - 显示诊断信息
 */

// 添加管理页面
add_action('admin_menu', 'sosomama_homepage_fix_menu');

function sosomama_homepage_fix_menu() {
    add_management_page(
        '主页修复工具',
        '主页修复',
        'manage_options',
        'sosomama-homepage-fix',
        'sosomama_homepage_fix_page'
    );
}

// 修复页面
function sosomama_homepage_fix_page() {
    // 处理修复操作
    if (isset($_POST['fix_homepage']) && check_admin_referer('fix_homepage_action')) {
        $result = sosomama_fix_homepage_settings();
        if ($result['success']) {
            echo '<div class="notice notice-success"><p>' . esc_html($result['message']) . '</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>' . esc_html($result['message']) . '</p></div>';
        }
    }
    
    // 获取当前设置
    $show_on_front = get_option('show_on_front', 'posts');
    $page_on_front = get_option('page_on_front', 0);
    $homepage_page = $page_on_front ? get_post($page_on_front) : null;
    
    // 查找可能的主页页面
    $possible_homepages = get_posts(array(
        'post_type' => 'page',
        'post_status' => 'any',
        'posts_per_page' => -1,
        'meta_query' => array(
            'relation' => 'OR',
            array(
                'key' => '_wp_page_template',
                'value' => 'page-home.php',
            ),
        ),
    ));
    
    // 按标题查找
    $title_matches = get_posts(array(
        'post_type' => 'page',
        'post_status' => 'any',
        'posts_per_page' => -1,
        's' => '主页',
    ));
    
    $all_possible = array_merge($possible_homepages, $title_matches);
    $all_possible = array_unique(array_column($all_possible, 'ID'));
    
    ?>
    <div class="wrap">
        <h1>主页修复工具</h1>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>当前设置状态</h2>
            
            <table class="form-table">
                <tr>
                    <th>主页显示方式</th>
                    <td>
                        <strong><?php echo $show_on_front === 'page' ? '静态页面' : '最新文章'; ?></strong>
                        <?php if ($show_on_front !== 'page'): ?>
                            <span style="color: red;">⚠️ 应该设置为"静态页面"</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>主页页面</th>
                    <td>
                        <?php if ($homepage_page): ?>
                            <strong><?php echo esc_html($homepage_page->post_title); ?></strong>
                            (ID: <?php echo $page_on_front; ?>)
                            <br>
                            <span style="color: <?php echo $homepage_page->post_status === 'publish' ? 'green' : 'red'; ?>;">
                                状态: <?php echo esc_html($homepage_page->post_status); ?>
                            </span>
                            <?php if ($homepage_page->post_status !== 'publish'): ?>
                                <span style="color: red;">⚠️ 页面未发布</span>
                            <?php endif; ?>
                        <?php else: ?>
                            <span style="color: red;">❌ 未设置主页页面</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>短代码检查</th>
                    <td>
                        <?php
                        $shortcode_exists = shortcode_exists('sosomama_homepage');
                        if ($shortcode_exists): ?>
                            <span style="color: green;">✅ 短代码已注册</span>
                        <?php else: ?>
                            <span style="color: red;">❌ 短代码未注册（需要激活 homepage-shortcode.php）</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>可能的主页页面</h2>
            
            <?php if (!empty($all_possible)): ?>
                <p>找到以下可能的主页页面：</p>
                <ul>
                    <?php foreach ($all_possible as $page_id): 
                        $page = get_post($page_id);
                        if ($page): ?>
                            <li>
                                <strong><?php echo esc_html($page->post_title); ?></strong>
                                (ID: <?php echo $page_id; ?>)
                                - 状态: <?php echo esc_html($page->post_status); ?>
                                <a href="<?php echo get_edit_post_link($page_id); ?>" target="_blank">编辑</a>
                            </li>
                        <?php endif;
                    endforeach; ?>
                </ul>
            <?php else: ?>
                <p style="color: orange;">⚠️ 未找到可能的主页页面</p>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>快速修复</h2>
            
            <form method="post" action="">
                <?php wp_nonce_field('fix_homepage_action'); ?>
                
                <p>点击下面的按钮可以：</p>
                <ul>
                    <li>✅ 将主页显示方式设置为"静态页面"</li>
                    <li>✅ 自动查找或创建主页页面</li>
                    <li>✅ 确保主页页面已发布</li>
                    <li>✅ 在主页页面中添加短代码（如果缺失）</li>
                </ul>
                
                <p>
                    <input type="submit" name="fix_homepage" class="button button-primary" value="执行修复" 
                           onclick="return confirm('确定要修复主页设置吗？');">
                </p>
            </form>
        </div>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>页面诊断工具</h2>
            <p>如果主页页面（ID: <?php echo $page_on_front ? $page_on_front : '未设置'; ?>）无法打开，可以使用诊断工具：</p>
            <p>
                <a href="<?php echo admin_url('admin.php?page=sosomama-page-diagnose&page_id=' . ($page_on_front ? $page_on_front : 16)); ?>" class="button button-secondary">
                    🔍 诊断页面问题
                </a>
            </p>
        </div>
        
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>手动修复步骤</h2>
            <ol>
                <li>进入 <strong>设置</strong> → <strong>阅读</strong></li>
                <li>选择 <strong>"静态页面"</strong></li>
                <li>在 <strong>"主页"</strong> 下拉菜单中选择您的主页页面</li>
                <li>如果主页页面不存在：
                    <ol>
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
    
    <style>
        .card {
            background: #fff;
            border: 1px solid #ccd0d4;
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
            padding: 20px;
        }
        .card h2 {
            margin-top: 0;
        }
    </style>
    <?php
}

// 执行修复
function sosomama_fix_homepage_settings() {
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
                $updated_content = $homepage_page->post_content . "\n\n[sosomama_homepage]";
                wp_update_post(array(
                    'ID' => $page_on_front,
                    'post_content' => $updated_content
                ));
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
    $possible_pages = get_posts(array(
        'post_type' => 'page',
        'post_status' => 'any',
        'posts_per_page' => -1,
        'title' => '主页',
    ));
    
    if (empty($possible_pages)) {
        // 按标题搜索
        $pages = get_pages(array(
            'post_status' => 'any',
        ));
        
        foreach ($pages as $page) {
            if (stripos($page->post_title, '主页') !== false || 
                stripos($page->post_title, 'home') !== false ||
                stripos($page->post_title, '首页') !== false) {
                $possible_pages[] = $page;
            }
        }
    }
    
    // 如果找到可能的页面，使用第一个
    if (!empty($possible_pages)) {
        $selected_page = $possible_pages[0];
        
        // 确保页面已发布
        if ($selected_page->post_status !== 'publish') {
            wp_update_post(array(
                'ID' => $selected_page->ID,
                'post_status' => 'publish'
            ));
        }
        
        // 检查并添加短代码
        if (strpos($selected_page->post_content, '[sosomama_homepage]') === false) {
            $updated_content = $selected_page->post_content . "\n\n[sosomama_homepage]";
            wp_update_post(array(
                'ID' => $selected_page->ID,
                'post_content' => $updated_content
            ));
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
    ));
    
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

