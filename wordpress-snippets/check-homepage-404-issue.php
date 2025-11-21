<?php
/**
 * 检查主页 404 问题
 * 
 * 诊断工具，帮助找出主页显示 404 的原因
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
add_action('admin_menu', 'sosomama_check_404_menu');

function sosomama_check_404_menu() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    add_management_page(
        '主页 404 检查',
        '主页 404 检查',
        'manage_options',
        'sosomama-check-404',
        'sosomama_check_404_page'
    );
}

// 检查页面
function sosomama_check_404_page() {
    if (!current_user_can('manage_options')) {
        wp_die('您没有权限访问此页面');
    }
    
    // 获取设置
    $show_on_front = get_option('show_on_front', 'posts');
    $page_on_front = get_option('page_on_front', 0);
    
    // 检查主页页面
    $homepage = $page_on_front ? get_post($page_on_front) : null;
    
    // 测试查询
    $test_query = null;
    if ($page_on_front) {
        $test_query = new WP_Query(array(
            'page_id' => $page_on_front,
            'post_type' => 'page',
        ));
    }
    
    // 检查模板文件
    $theme = wp_get_theme();
    $theme_dir = $theme->get_stylesheet_directory();
    $front_page_template = $theme_dir . '/front-page.php';
    $page_template = $theme_dir . '/page.php';
    
    ?>
    <div class="wrap">
        <h1>主页 404 问题诊断</h1>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">WordPress 设置</h2>
            
            <table class="form-table">
                <tr>
                    <th style="width: 200px;">主页显示方式</th>
                    <td>
                        <strong><?php echo $show_on_front === 'page' ? '静态页面' : '最新文章'; ?></strong>
                        <?php if ($show_on_front !== 'page'): ?>
                            <span style="color: red; margin-left: 10px;">⚠️ 应该设置为"静态页面"</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>主页页面 ID</th>
                    <td>
                        <?php if ($page_on_front): ?>
                            <strong><?php echo intval($page_on_front); ?></strong>
                        <?php else: ?>
                            <span style="color: red;">❌ 未设置</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">主页页面检查</h2>
            
            <?php if ($homepage): ?>
                <table class="form-table">
                    <tr>
                        <th style="width: 200px;">页面标题</th>
                        <td><strong><?php echo esc_html($homepage->post_title); ?></strong></td>
                    </tr>
                    <tr>
                        <th>页面状态</th>
                        <td>
                            <span style="color: <?php echo $homepage->post_status === 'publish' ? 'green' : 'red'; ?>;">
                                <strong><?php echo esc_html($homepage->post_status); ?></strong>
                            </span>
                            <?php if ($homepage->post_status !== 'publish'): ?>
                                <span style="color: red; margin-left: 10px;">⚠️ 页面未发布，无法显示！</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th>页面内容</th>
                        <td>
                            <?php if (empty(trim($homepage->post_content))): ?>
                                <span style="color: orange;">⚠️ 页面内容为空</span>
                            <?php else: ?>
                                <span style="color: green;">✅ 有内容（<?php echo strlen($homepage->post_content); ?> 字符）</span>
                                <details style="margin-top: 10px;">
                                    <summary style="cursor: pointer;">查看内容</summary>
                                    <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; max-height: 200px;"><?php echo esc_html($homepage->post_content); ?></pre>
                                </details>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th>页面 URL</th>
                        <td>
                            <a href="<?php echo esc_url(get_permalink($page_on_front)); ?>" target="_blank">
                                <?php echo esc_url(get_permalink($page_on_front)); ?>
                            </a>
                        </td>
                    </tr>
                </table>
            <?php else: ?>
                <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px;">
                    <strong style="color: #721c24;">❌ 错误：页面不存在！</strong>
                    <p>页面 ID <?php echo intval($page_on_front); ?> 不存在。请检查：</p>
                    <ol>
                        <li>页面是否被删除</li>
                        <li>页面 ID 是否正确</li>
                        <li>数据库是否有问题</li>
                    </ol>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">查询测试</h2>
            
            <?php if ($test_query): ?>
                <table class="form-table">
                    <tr>
                        <th style="width: 200px;">找到文章数</th>
                        <td>
                            <strong><?php echo intval($test_query->found_posts); ?></strong>
                            <?php if ($test_query->found_posts === 0): ?>
                                <span style="color: red; margin-left: 10px;">⚠️ 查询未找到页面！</span>
                            <?php else: ?>
                                <span style="color: green; margin-left: 10px;">✅ 查询成功</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th>查询参数</th>
                        <td>
                            <pre style="background: #f5f5f5; padding: 10px; overflow: auto;"><?php print_r($test_query->query_vars); ?></pre>
                        </td>
                    </tr>
                </table>
            <?php else: ?>
                <p style="color: orange;">⚠️ 无法测试查询（页面 ID 未设置）</p>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">模板文件检查</h2>
            
            <table class="form-table">
                <tr>
                    <th style="width: 200px;">front-page.php</th>
                    <td>
                        <?php if (file_exists($front_page_template)): ?>
                            <span style="color: red;">⚠️ 存在</span>
                            <code><?php echo esc_html($front_page_template); ?></code>
                            <p style="color: orange; margin-top: 5px;">这个文件会覆盖 WordPress 的主页设置！</p>
                        <?php else: ?>
                            <span style="color: green;">✅ 不存在</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>page.php</th>
                    <td>
                        <?php if (file_exists($page_template)): ?>
                            <span style="color: green;">✅ 存在</span>
                            <code><?php echo esc_html($page_template); ?></code>
                        <?php else: ?>
                            <span style="color: orange;">⚠️ 不存在（会使用 index.php）</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff3cd; border: 1px solid #ffc107; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">💡 修复建议</h2>
            
            <?php 
            $issues = array();
            
            if ($show_on_front !== 'page') {
                $issues[] = 'WordPress 设置中未选择"静态页面"';
            }
            
            if (!$page_on_front) {
                $issues[] = '未设置主页页面';
            }
            
            if (!$homepage) {
                $issues[] = '主页页面不存在';
            } elseif ($homepage->post_status !== 'publish') {
                $issues[] = '主页页面未发布';
            }
            
            if (file_exists($front_page_template)) {
                $issues[] = '存在 front-page.php 文件，会覆盖主页设置';
            }
            
            if (!empty($issues)): ?>
                <p><strong>发现以下问题：</strong></p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <?php foreach ($issues as $issue): ?>
                        <li><?php echo esc_html($issue); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p style="color: green;"><strong>✅ 未发现明显问题</strong></p>
                <p>如果仍然显示 404，请尝试：</p>
                <ol>
                    <li>使用 <code>fix-homepage-404-strong.php</code> 修复代码片段</li>
                    <li>清除所有缓存</li>
                    <li>检查 .htaccess 文件</li>
                </ol>
            <?php endif; ?>
            
            <h3 style="margin-top: 20px;">快速修复步骤：</h3>
            <ol style="line-height: 2;">
                <li>确保 WordPress 设置中选择"静态页面"</li>
                <li>确保主页页面已发布</li>
                <li>添加 <code>fix-homepage-404-strong.php</code> 代码片段</li>
                <li>如果存在 front-page.php，重命名或删除它</li>
                <li>清除所有缓存</li>
                <li>刷新首页测试</li>
            </ol>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">快速操作</h2>
            
            <p>
                <a href="<?php echo admin_url('options-reading.php'); ?>" class="button button-primary">
                    ⚙️ 打开阅读设置
                </a>
                
                <?php if ($page_on_front): ?>
                    <a href="<?php echo get_edit_post_link($page_on_front); ?>" class="button">
                        📝 编辑主页页面
                    </a>
                <?php endif; ?>
                
                <a href="<?php echo home_url(); ?>" target="_blank" class="button">
                    👁️ 查看首页
                </a>
            </p>
        </div>
    </div>
    
    <style>
        .card {
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
        }
        .card h2 {
            color: #4682B4;
        }
        details {
            margin-top: 10px;
        }
        summary {
            cursor: pointer;
            font-weight: bold;
        }
    </style>
    <?php
}

