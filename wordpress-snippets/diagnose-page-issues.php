<?php
/**
 * WordPress 页面诊断和修复工具
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 访问 WordPress 后台 → 工具 → 页面诊断
 * 
 * 功能：
 * - 诊断指定页面的问题
 * - 检查页面内容、短代码、模板等
 * - 提供修复选项
 */

// 添加管理页面
add_action('admin_menu', 'sosomama_page_diagnose_menu');

function sosomama_page_diagnose_menu() {
    add_management_page(
        '页面诊断工具',
        '页面诊断',
        'manage_options',
        'sosomama-page-diagnose',
        'sosomama_page_diagnose_page'
    );
}

// 诊断页面
function sosomama_page_diagnose_page() {
    $page_id = isset($_GET['page_id']) ? intval($_GET['page_id']) : 16;
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    // 处理修复操作
    if ($action === 'fix' && isset($_POST['fix_page']) && check_admin_referer('fix_page_action')) {
        $result = sosomama_fix_page_issues($page_id);
        if ($result['success']) {
            echo '<div class="notice notice-success"><p>' . esc_html($result['message']) . '</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>' . esc_html($result['message']) . '</p></div>';
        }
    }
    
    // 获取页面信息
    $page = get_post($page_id);
    
    if (!$page) {
        echo '<div class="notice notice-error"><p>页面 ID ' . $page_id . ' 不存在！</p></div>';
        return;
    }
    
    // 诊断页面
    $diagnostics = sosomama_diagnose_page($page);
    
    ?>
    <div class="wrap">
        <h1>页面诊断工具</h1>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px;">
            <h2>页面信息</h2>
            
            <table class="form-table">
                <tr>
                    <th>页面 ID</th>
                    <td><strong><?php echo $page->ID; ?></strong></td>
                </tr>
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
                        <?php if ($page->post_status !== 'publish'): ?>
                            <span style="color: red;">⚠️ 页面未发布，无法在前台显示</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>页面模板</th>
                    <td>
                        <?php 
                        $template = get_page_template_slug($page->ID);
                        echo $template ? esc_html($template) : '<em>默认模板</em>';
                        ?>
                    </td>
                </tr>
                <tr>
                    <th>页面 URL</th>
                    <td>
                        <a href="<?php echo get_permalink($page->ID); ?>" target="_blank">
                            <?php echo get_permalink($page->ID); ?>
                        </a>
                    </td>
                </tr>
                <tr>
                    <th>编辑链接</th>
                    <td>
                        <a href="<?php echo get_edit_post_link($page->ID); ?>" class="button">
                            编辑页面
                        </a>
                        <?php if (class_exists('\Elementor\Plugin')): ?>
                            <a href="<?php echo admin_url('post.php?post=' . $page->ID . '&action=elementor'); ?>" class="button">
                                使用 Elementor 编辑
                            </a>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px;">
            <h2>诊断结果</h2>
            
            <?php foreach ($diagnostics as $category => $items): ?>
                <h3><?php echo esc_html($category); ?></h3>
                <table class="widefat">
                    <thead>
                        <tr>
                            <th style="width: 200px;">检查项</th>
                            <th>状态</th>
                            <th>详情</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($items as $item): ?>
                            <tr>
                                <td><strong><?php echo esc_html($item['name']); ?></strong></td>
                                <td>
                                    <?php if ($item['status'] === 'ok'): ?>
                                        <span style="color: green;">✅ 正常</span>
                                    <?php elseif ($item['status'] === 'warning'): ?>
                                        <span style="color: orange;">⚠️ 警告</span>
                                    <?php else: ?>
                                        <span style="color: red;">❌ 错误</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo wp_kses_post($item['message']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endforeach; ?>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px;">
            <h2>页面内容分析</h2>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                <strong>内容长度：</strong> <?php echo strlen($page->post_content); ?> 字符
            </div>
            
            <details>
                <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">查看原始内容（点击展开）</summary>
                <textarea readonly style="width: 100%; height: 200px; font-family: monospace; font-size: 12px;"><?php echo esc_textarea($page->post_content); ?></textarea>
            </details>
            
            <?php
            // 检查短代码
            $shortcodes = sosomama_extract_shortcodes($page->post_content);
            if (!empty($shortcodes)): ?>
                <div style="margin-top: 15px;">
                    <strong>发现的短代码：</strong>
                    <ul>
                        <?php foreach ($shortcodes as $shortcode): ?>
                            <li><code><?php echo esc_html($shortcode); ?></code></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px;">
            <h2>修复选项</h2>
            
            <form method="post" action="<?php echo admin_url('admin.php?page=sosomama-page-diagnose&page_id=' . $page_id . '&action=fix'); ?>">
                <?php wp_nonce_field('fix_page_action'); ?>
                
                <table class="form-table">
                    <tr>
                        <th>修复操作</th>
                        <td>
                            <label>
                                <input type="checkbox" name="fix_status" value="1" 
                                       <?php checked($page->post_status !== 'publish'); ?>>
                                确保页面状态为"已发布"
                            </label>
                            <br><br>
                            
                            <label>
                                <input type="checkbox" name="fix_content" value="1">
                                清理页面内容中的潜在问题字符
                            </label>
                            <br><br>
                            
                            <label>
                                <input type="checkbox" name="fix_template" value="1">
                                重置页面模板为默认
                            </label>
                            <br><br>
                            
                            <label>
                                <input type="checkbox" name="add_shortcode" value="1"
                                       <?php checked(strpos($page->post_content, '[sosomama_homepage]') === false); ?>>
                                添加主页短代码（如果缺失）
                            </label>
                            <br><br>
                            
                            <label>
                                <input type="checkbox" name="clear_cache" value="1">
                                清除页面缓存
                            </label>
                        </td>
                    </tr>
                </table>
                
                <p>
                    <input type="submit" name="fix_page" class="button button-primary" value="执行修复" 
                           onclick="return confirm('确定要修复这个页面吗？');">
                </p>
            </form>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px;">
            <h2>快速操作</h2>
            
            <p>
                <a href="<?php echo admin_url('post.php?post=' . $page_id . '&action=edit'); ?>" class="button">
                    📝 使用经典编辑器编辑
                </a>
                
                <?php if (class_exists('\Elementor\Plugin')): ?>
                    <a href="<?php echo admin_url('post.php?post=' . $page_id . '&action=elementor'); ?>" class="button">
                        🎨 使用 Elementor 编辑
                    </a>
                <?php endif; ?>
                
                <a href="<?php echo get_permalink($page_id); ?>" target="_blank" class="button">
                    👁️ 查看前台页面
                </a>
                
                <a href="<?php echo admin_url('admin.php?page=sosomama-page-diagnose&page_id=' . $page_id); ?>" class="button">
                    🔄 刷新诊断
                </a>
            </p>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff3cd; border-color: #ffc107;">
            <h2>💡 手动修复建议</h2>
            
            <ol>
                <li><strong>如果页面无法打开：</strong>
                    <ul>
                        <li>尝试使用经典编辑器（不是 Elementor）打开页面</li>
                        <li>检查页面内容是否有特殊字符或格式问题</li>
                        <li>尝试复制内容到新页面</li>
                    </ul>
                </li>
                <li><strong>如果 Elementor 无法打开：</strong>
                    <ul>
                        <li>检查 Elementor 插件是否已激活</li>
                        <li>尝试禁用其他插件，看是否有冲突</li>
                        <li>检查 PHP 错误日志</li>
                    </ul>
                </li>
                <li><strong>如果页面内容不显示：</strong>
                    <ul>
                        <li>检查短代码是否正确：<code>[sosomama_homepage]</code></li>
                        <li>确认主页短代码代码片段已激活</li>
                        <li>检查页面模板设置</li>
                    </ul>
                </li>
                <li><strong>创建新页面作为备选：</strong>
                    <ul>
                        <li>如果当前页面无法修复，可以创建新页面</li>
                        <li>复制短代码到新页面</li>
                        <li>在设置中更换主页页面</li>
                    </ul>
                </li>
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
        .card h3 {
            margin-top: 20px;
            color: #4682B4;
        }
        .widefat {
            margin-top: 10px;
        }
        details {
            margin-top: 10px;
        }
        summary {
            padding: 10px;
            background: #f0f0f0;
            border-radius: 4px;
        }
    </style>
    <?php
}

// 诊断页面
function sosomama_diagnose_page($page) {
    $diagnostics = array();
    
    // 基本检查
    $diagnostics['基本检查'] = array();
    
    $diagnostics['基本检查'][] = array(
        'name' => '页面存在',
        'status' => 'ok',
        'message' => '页面 ID ' . $page->ID . ' 存在'
    );
    
    $diagnostics['基本检查'][] = array(
        'name' => '页面状态',
        'status' => $page->post_status === 'publish' ? 'ok' : 'error',
        'message' => $page->post_status === 'publish' 
            ? '页面已发布' 
            : '页面状态为"' . $page->post_status . '"，需要发布才能显示'
    );
    
    // 内容检查
    $diagnostics['内容检查'] = array();
    
    $content_length = strlen($page->post_content);
    $diagnostics['内容检查'][] = array(
        'name' => '内容长度',
        'status' => $content_length > 0 ? 'ok' : 'warning',
        'message' => $content_length > 0 
            ? '内容长度为 ' . $content_length . ' 字符' 
            : '页面内容为空'
    );
    
    // 检查是否有短代码
    $has_shortcode = has_shortcode($page->post_content, 'sosomama_homepage');
    $diagnostics['内容检查'][] = array(
        'name' => '主页短代码',
        'status' => $has_shortcode ? 'ok' : 'warning',
        'message' => $has_shortcode 
            ? '找到主页短代码 [sosomama_homepage]' 
            : '未找到主页短代码，页面可能无法显示内容'
    );
    
    // 检查短代码是否注册
    $shortcode_registered = shortcode_exists('sosomama_homepage');
    $diagnostics['内容检查'][] = array(
        'name' => '短代码注册',
        'status' => $shortcode_registered ? 'ok' : 'error',
        'message' => $shortcode_registered 
            ? '短代码已注册' 
            : '短代码未注册，需要激活 homepage-shortcode.php 代码片段'
    );
    
    // 检查特殊字符
    $has_special_chars = preg_match('/[^\x20-\x7E\s]/u', $page->post_content);
    $diagnostics['内容检查'][] = array(
        'name' => '特殊字符',
        'status' => !$has_special_chars ? 'ok' : 'warning',
        'message' => !$has_special_chars 
            ? '未发现异常特殊字符' 
            : '发现特殊字符，可能影响页面显示'
    );
    
    // 模板检查
    $diagnostics['模板检查'] = array();
    
    $template = get_page_template_slug($page->ID);
    $diagnostics['模板检查'][] = array(
        'name' => '页面模板',
        'status' => empty($template) ? 'ok' : 'ok',
        'message' => empty($template) 
            ? '使用默认模板' 
            : '使用模板：' . $template
    );
    
    // Elementor 检查
    if (class_exists('\Elementor\Plugin')) {
        $diagnostics['Elementor 检查'] = array();
        
        $is_built_with_elementor = \Elementor\Plugin::$instance->db->is_built_with_elementor($page->ID);
        $diagnostics['Elementor 检查'][] = array(
            'name' => 'Elementor 构建',
            'status' => $is_built_with_elementor ? 'ok' : 'warning',
            'message' => $is_built_with_elementor 
                ? '页面使用 Elementor 构建' 
                : '页面未使用 Elementor 构建'
        );
        
        $elementor_data = get_post_meta($page->ID, '_elementor_data', true);
        $diagnostics['Elementor 检查'][] = array(
            'name' => 'Elementor 数据',
            'status' => !empty($elementor_data) ? 'ok' : 'warning',
            'message' => !empty($elementor_data) 
                ? 'Elementor 数据存在' 
                : '未找到 Elementor 数据'
        );
    }
    
    // 权限检查
    $diagnostics['权限检查'] = array();
    
    $can_edit = current_user_can('edit_post', $page->ID);
    $diagnostics['权限检查'][] = array(
        'name' => '编辑权限',
        'status' => $can_edit ? 'ok' : 'error',
        'message' => $can_edit 
            ? '您有权限编辑此页面' 
            : '您没有权限编辑此页面'
    );
    
    return $diagnostics;
}

// 提取短代码
function sosomama_extract_shortcodes($content) {
    $shortcodes = array();
    preg_match_all('/\[([^\]]+)\]/', $content, $matches);
    if (!empty($matches[1])) {
        $shortcodes = $matches[1];
    }
    return array_unique($shortcodes);
}

// 修复页面问题
function sosomama_fix_page_issues($page_id) {
    $page = get_post($page_id);
    if (!$page) {
        return array('success' => false, 'message' => '页面不存在');
    }
    
    $fixes = array();
    
    // 修复状态
    if (isset($_POST['fix_status']) && $page->post_status !== 'publish') {
        wp_update_post(array(
            'ID' => $page_id,
            'post_status' => 'publish'
        ));
        $fixes[] = '页面状态已设置为"已发布"';
    }
    
    // 修复内容
    if (isset($_POST['fix_content'])) {
        $content = $page->post_content;
        // 清理潜在问题字符
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $content);
        // 规范化换行符
        $content = str_replace(array("\r\n", "\r"), "\n", $content);
        
        wp_update_post(array(
            'ID' => $page_id,
            'post_content' => $content
        ));
        $fixes[] = '页面内容已清理';
    }
    
    // 修复模板
    if (isset($_POST['fix_template'])) {
        delete_post_meta($page_id, '_wp_page_template');
        $fixes[] = '页面模板已重置为默认';
    }
    
    // 添加短代码
    if (isset($_POST['add_shortcode']) && strpos($page->post_content, '[sosomama_homepage]') === false) {
        $content = $page->post_content;
        if (!empty(trim($content))) {
            $content .= "\n\n";
        }
        $content .= '[sosomama_homepage]';
        
        wp_update_post(array(
            'ID' => $page_id,
            'post_content' => $content
        ));
        $fixes[] = '已添加主页短代码';
    }
    
    // 清除缓存
    if (isset($_POST['clear_cache'])) {
        // WordPress 缓存
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        // Elementor 缓存
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }
        $fixes[] = '缓存已清除';
    }
    
    if (empty($fixes)) {
        return array('success' => true, 'message' => '未选择任何修复选项');
    }
    
    return array(
        'success' => true,
        'message' => '修复完成：' . implode('；', $fixes)
    );
}


