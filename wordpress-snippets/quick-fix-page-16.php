<?php
/**
 * 快速修复页面 ID 16 的工具
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 访问 WordPress 后台，会自动显示修复选项
 * 
 * 功能：
 * - 检查页面 ID 16 的状态
 * - 清理页面内容
 * - 重置页面设置
 * - 创建备用页面（如果需要）
 */

// 添加管理通知
add_action('admin_notices', 'sosomama_page_16_fix_notice');

function sosomama_page_16_fix_notice() {
    // 只在特定页面显示
    $screen = get_current_screen();
    if ($screen && ($screen->id === 'page' || $screen->id === 'edit-page')) {
        $page_16 = get_post(16);
        if ($page_16) {
            $issues = array();
            
            // 检查问题
            if ($page_16->post_status !== 'publish') {
                $issues[] = '页面未发布';
            }
            if (empty(trim($page_16->post_content))) {
                $issues[] = '页面内容为空';
            }
            if (strpos($page_16->post_content, '[sosomama_homepage]') === false) {
                $issues[] = '缺少主页短代码';
            }
            
            if (!empty($issues)) {
                ?>
                <div class="notice notice-warning">
                    <p><strong>页面 ID 16 存在问题：</strong></p>
                    <ul style="list-style: disc; margin-left: 20px;">
                        <?php foreach ($issues as $issue): ?>
                            <li><?php echo esc_html($issue); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <p>
                        <a href="<?php echo admin_url('admin.php?page=sosomama-page-diagnose&page_id=16'); ?>" class="button">
                            🔍 诊断并修复
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=sosomama-quick-fix-page-16'); ?>" class="button button-primary">
                            ⚡ 快速修复
                        </a>
                    </p>
                </div>
                <?php
            }
        }
    }
}

// 添加快速修复页面
add_action('admin_menu', 'sosomama_quick_fix_page_16_menu');

function sosomama_quick_fix_page_16_menu() {
    add_management_page(
        '快速修复页面 16',
        '修复页面 16',
        'manage_options',
        'sosomama-quick-fix-page-16',
        'sosomama_quick_fix_page_16_page'
    );
}

// 快速修复页面
function sosomama_quick_fix_page_16_page() {
    $page_id = 16;
    $page = get_post($page_id);
    
    // 处理修复操作
    if (isset($_POST['quick_fix']) && check_admin_referer('quick_fix_page_16')) {
        $result = sosomama_quick_fix_page_16($page_id);
        if ($result['success']) {
            echo '<div class="notice notice-success"><p><strong>✅ ' . esc_html($result['message']) . '</strong></p></div>';
            // 刷新页面信息
            $page = get_post($page_id);
        } else {
            echo '<div class="notice notice-error"><p><strong>❌ ' . esc_html($result['message']) . '</strong></p></div>';
        }
    }
    
    if (!$page) {
        ?>
        <div class="wrap">
            <h1>快速修复页面 16</h1>
            <div class="notice notice-error">
                <p><strong>页面 ID 16 不存在！</strong></p>
            </div>
            <p>
                <a href="<?php echo admin_url('admin.php?page=sosomama-homepage-fix'); ?>" class="button">
                    返回主页修复工具
                </a>
            </p>
        </div>
        <?php
        return;
    }
    
    // 诊断问题
    $issues = array();
    if ($page->post_status !== 'publish') {
        $issues[] = '页面未发布';
    }
    if (empty(trim($page->post_content))) {
        $issues[] = '页面内容为空';
    }
    if (strpos($page->post_content, '[sosomama_homepage]') === false) {
        $issues[] = '缺少主页短代码';
    }
    
    $has_issues = !empty($issues);
    
    ?>
    <div class="wrap">
        <h1>快速修复页面 16</h1>
        
        <div class="card" style="max-width: 900px; margin-top: 20px;">
            <h2>当前状态</h2>
            
            <table class="form-table">
                <tr>
                    <th>页面标题</th>
                    <td><strong><?php echo esc_html($page->post_title); ?></strong></td>
                </tr>
                <tr>
                    <th>页面状态</th>
                    <td>
                        <span style="color: <?php echo $page->post_status === 'publish' ? 'green' : 'red'; ?>;">
                            <strong><?php echo esc_html($page->post_status); ?></strong>
                        </span>
                    </td>
                </tr>
                <tr>
                    <th>内容长度</th>
                    <td><?php echo strlen($page->post_content); ?> 字符</td>
                </tr>
                <tr>
                    <th>包含短代码</th>
                    <td>
                        <?php if (strpos($page->post_content, '[sosomama_homepage]') !== false): ?>
                            <span style="color: green;">✅ 是</span>
                        <?php else: ?>
                            <span style="color: red;">❌ 否</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
            
            <?php if ($has_issues): ?>
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px;">
                    <strong>⚠️ 发现以下问题：</strong>
                    <ul style="list-style: disc; margin-left: 20px; margin-top: 10px;">
                        <?php foreach ($issues as $issue): ?>
                            <li><?php echo esc_html($issue); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php else: ?>
                <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin-top: 15px;">
                    <strong>✅ 页面状态正常</strong>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 900px; margin-top: 20px;">
            <h2>快速修复</h2>
            
            <form method="post" action="">
                <?php wp_nonce_field('quick_fix_page_16'); ?>
                
                <p>点击下面的按钮将自动修复所有问题：</p>
                <ul>
                    <li>✅ 确保页面状态为"已发布"</li>
                    <li>✅ 清理页面内容（移除可能的问题字符）</li>
                    <li>✅ 添加主页短代码 <code>[sosomama_homepage]</code></li>
                    <li>✅ 重置页面模板为默认</li>
                </ul>
                
                <p style="margin-top: 20px;">
                    <input type="submit" name="quick_fix" class="button button-primary button-large" value="⚡ 执行快速修复" 
                           onclick="return confirm('确定要修复页面 ID 16 吗？这将覆盖当前页面内容。');">
                </p>
            </form>
        </div>
        
        <div class="card" style="max-width: 900px; margin-top: 20px;">
            <h2>其他选项</h2>
            
            <p>
                <a href="<?php echo admin_url('admin.php?page=sosomama-page-diagnose&page_id=16'); ?>" class="button">
                    🔍 详细诊断
                </a>
                
                <a href="<?php echo get_edit_post_link(16); ?>" class="button">
                    📝 编辑页面
                </a>
                
                <?php if (class_exists('\Elementor\Plugin')): ?>
                    <a href="<?php echo admin_url('post.php?post=16&action=elementor'); ?>" class="button">
                        🎨 Elementor 编辑
                    </a>
                <?php endif; ?>
                
                <a href="<?php echo get_permalink(16); ?>" target="_blank" class="button">
                    👁️ 查看前台
                </a>
            </p>
        </div>
        
        <div class="card" style="max-width: 900px; margin-top: 20px; background: #fff3cd; border-color: #ffc107;">
            <h2>💡 如果修复后仍然无法打开</h2>
            
            <p><strong>建议创建新页面作为主页：</strong></p>
            <ol>
                <li>进入 <strong>页面</strong> → <strong>添加新页面</strong></li>
                <li>标题：<strong>主页</strong></li>
                <li>内容：<code>[sosomama_homepage]</code></li>
                <li>点击 <strong>发布</strong></li>
                <li>进入 <strong>设置</strong> → <strong>阅读</strong></li>
                <li>在"主页"下拉菜单中选择新创建的页面</li>
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
            border-bottom: 2px solid #4682B4;
            padding-bottom: 10px;
        }
    </style>
    <?php
}

// 执行快速修复
function sosomama_quick_fix_page_16($page_id) {
    $page = get_post($page_id);
    if (!$page) {
        return array('success' => false, 'message' => '页面不存在');
    }
    
    $fixes = array();
    
    // 1. 确保页面已发布
    if ($page->post_status !== 'publish') {
        wp_update_post(array(
            'ID' => $page_id,
            'post_status' => 'publish'
        ));
        $fixes[] = '页面状态已设置为"已发布"';
    }
    
    // 2. 清理并设置内容
    $content = '[sosomama_homepage]';
    
    // 如果原来有内容且包含短代码，保留短代码部分
    $old_content = $page->post_content;
    if (!empty($old_content) && strpos($old_content, '[sosomama_homepage]') !== false) {
        // 提取短代码
        preg_match('/\[sosomama_homepage[^\]]*\]/', $old_content, $matches);
        if (!empty($matches[0])) {
            $content = $matches[0];
        }
    }
    
    wp_update_post(array(
        'ID' => $page_id,
        'post_content' => $content
    ));
    $fixes[] = '页面内容已清理并设置短代码';
    
    // 3. 重置页面模板
    delete_post_meta($page_id, '_wp_page_template');
    $fixes[] = '页面模板已重置';
    
    // 4. 清除缓存
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
    if (class_exists('\Elementor\Plugin')) {
        \Elementor\Plugin::$instance->files_manager->clear_cache();
    }
    $fixes[] = '缓存已清除';
    
    return array(
        'success' => true,
        'message' => '修复完成！' . implode('；', $fixes)
    );
}


