<?php
/**
 * 检查子主题和模板文件对主页的影响
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 访问 WordPress 后台 → 工具 → 主题主页检查
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
add_action('admin_menu', 'sosomama_theme_homepage_check_menu');

function sosomama_theme_homepage_check_menu() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    add_management_page(
        '主题主页检查',
        '主题主页检查',
        'manage_options',
        'sosomama-theme-homepage-check',
        'sosomama_theme_homepage_check_page'
    );
}

// 检查页面
function sosomama_theme_homepage_check_page() {
    if (!current_user_can('manage_options')) {
        wp_die('您没有权限访问此页面');
    }
    
    // 获取主题信息
    $theme = wp_get_theme();
    $parent_theme = $theme->parent();
    $is_child_theme = $parent_theme ? true : false;
    
    // 检查模板文件
    $template_files = sosomama_check_template_files($theme, $parent_theme);
    
    // 检查 WordPress 设置
    $wp_settings = sosomama_check_wp_settings();
    
    // 检查主题设置
    $theme_settings = sosomama_check_theme_settings();
    
    ?>
    <div class="wrap">
        <h1>主题主页检查工具</h1>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">主题信息</h2>
            
            <table class="form-table">
                <tr>
                    <th style="width: 200px;">当前主题</th>
                    <td><strong><?php echo esc_html($theme->get('Name')); ?></strong> (<?php echo esc_html($theme->get('Version')); ?>)</td>
                </tr>
                <tr>
                    <th>是否子主题</th>
                    <td>
                        <?php if ($is_child_theme): ?>
                            <span style="color: orange;">⚠️ 是，父主题：<strong><?php echo esc_html($parent_theme->get('Name')); ?></strong></span>
                        <?php else: ?>
                            <span style="color: green;">✅ 否</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>主题目录</th>
                    <td><code><?php echo esc_html($theme->get_stylesheet_directory()); ?></code></td>
                </tr>
                <?php if ($is_child_theme): ?>
                <tr>
                    <th>父主题目录</th>
                    <td><code><?php echo esc_html($parent_theme->get_stylesheet_directory()); ?></code></td>
                </tr>
                <?php endif; ?>
            </table>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">WordPress 设置</h2>
            
            <table class="form-table">
                <tr>
                    <th style="width: 200px;">主页显示方式</th>
                    <td>
                        <strong><?php echo $wp_settings['show_on_front'] === 'page' ? '静态页面' : '最新文章'; ?></strong>
                        <?php if ($wp_settings['show_on_front'] !== 'page'): ?>
                            <span style="color: red; margin-left: 10px;">⚠️ 应该设置为"静态页面"</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>主页页面 ID</th>
                    <td>
                        <?php if ($wp_settings['page_on_front']): ?>
                            <strong><?php echo intval($wp_settings['page_on_front']); ?></strong>
                            <?php 
                            $homepage = get_post($wp_settings['page_on_front']);
                            if ($homepage): ?>
                                - <?php echo esc_html($homepage->post_title); ?>
                                (状态: <span style="color: <?php echo $homepage->post_status === 'publish' ? 'green' : 'red'; ?>;"><?php echo esc_html($homepage->post_status); ?></span>)
                            <?php else: ?>
                                <span style="color: red;">⚠️ 页面不存在！</span>
                            <?php endif; ?>
                        <?php else: ?>
                            <span style="color: red;">❌ 未设置</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">模板文件检查</h2>
            
            <p><strong>WordPress 模板层次结构：</strong> WordPress 会按以下顺序查找模板文件，找到的第一个会被使用。</p>
            
            <table class="widefat">
                <thead>
                    <tr>
                        <th>模板文件</th>
                        <th>优先级</th>
                        <th>状态</th>
                        <th>位置</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($template_files as $file): ?>
                        <tr>
                            <td><code><?php echo esc_html($file['name']); ?></code></td>
                            <td><?php echo intval($file['priority']); ?></td>
                            <td>
                                <?php if ($file['exists']): ?>
                                    <span style="color: red;">⚠️ 存在</span>
                                    <?php if ($file['is_child']): ?>
                                        <span style="color: orange;">(子主题)</span>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <span style="color: green;">✅ 不存在</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($file['exists']): ?>
                                    <code><?php echo esc_html($file['path']); ?></code>
                                <?php else: ?>
                                    <em>未找到</em>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <?php 
            $problematic_files = array_filter($template_files, function($file) {
                return $file['exists'] && $file['priority'] <= 2; // front-page.php 或 home.php
            });
            
            if (!empty($problematic_files)): ?>
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px;">
                    <strong>⚠️ 发现问题：</strong>
                    <p>以下模板文件可能会覆盖您的主页设置：</p>
                    <ul style="list-style: disc; margin-left: 20px;">
                        <?php foreach ($problematic_files as $file): ?>
                            <li><code><?php echo esc_html($file['name']); ?></code> 
                                <?php if ($file['is_child']): ?>
                                    (在子主题中)
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                    <p style="margin-top: 10px;">
                        <strong>解决方案：</strong> 这些文件会强制显示特定内容，忽略 WordPress 的主页设置。
                        您可以：
                    </p>
                    <ol style="list-style: decimal; margin-left: 20px;">
                        <li>重命名或删除这些文件（建议先备份）</li>
                        <li>修改这些文件，使其支持 WordPress 的主页设置</li>
                    </ol>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">主题设置检查</h2>
            
            <table class="form-table">
                <?php foreach ($theme_settings as $key => $value): ?>
                    <tr>
                        <th style="width: 200px;"><?php echo esc_html($key); ?></th>
                        <td>
                            <?php if (is_array($value) || is_object($value)): ?>
                                <pre style="background: #f5f5f5; padding: 10px; overflow: auto;"><?php print_r($value); ?></pre>
                            <?php else: ?>
                                <code><?php echo esc_html($value); ?></code>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </table>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff3cd; border: 1px solid #ffc107; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">💡 解决方案</h2>
            
            <h3>方案 1：检查并修复模板文件（推荐）</h3>
            <ol style="line-height: 2;">
                <li>进入 <strong>外观</strong> → <strong>主题文件编辑器</strong>（或通过 FTP）</li>
                <li>检查子主题目录中是否有以下文件：
                    <ul>
                        <li><code>front-page.php</code> - 这个文件会强制覆盖主页</li>
                        <li><code>home.php</code> - 这个文件会影响主页显示</li>
                    </ul>
                </li>
                <li>如果这些文件存在：
                    <ul>
                        <li><strong>选项 A：</strong> 重命名这些文件（如改为 <code>front-page.php.bak</code>）</li>
                        <li><strong>选项 B：</strong> 修改这些文件，添加对 WordPress 主页设置的支持</li>
                    </ul>
                </li>
            </ol>
            
            <h3>方案 2：使用 page.php 模板</h3>
            <ol style="line-height: 2;">
                <li>确保子主题中有 <code>page.php</code> 文件</li>
                <li>如果没有，从父主题复制一个</li>
                <li>确保 <code>page.php</code> 能正常显示页面内容</li>
            </ol>
            
            <h3>方案 3：临时切换到父主题</h3>
            <ol style="line-height: 2;">
                <li>进入 <strong>外观</strong> → <strong>主题</strong></li>
                <li>切换到父主题</li>
                <li>测试主页是否正常显示</li>
                <li>如果正常，说明问题在子主题中</li>
            </ol>
            
            <h3>方案 4：修复 front-page.php（如果存在）</h3>
            <p>如果子主题中有 <code>front-page.php</code>，可以修改它来支持 WordPress 设置：</p>
            <pre style="background: #f5f5f5; padding: 15px; overflow: auto; margin-top: 10px;"><code><?php echo esc_html('<?php
// 检查是否设置了静态主页
$show_on_front = get_option(\'show_on_front\');
$page_on_front = get_option(\'page_on_front\');

if ($show_on_front === \'page\' && $page_on_front) {
    // 使用 WordPress 设置的主页
    $homepage = get_post($page_on_front);
    if ($homepage && $homepage->post_status === \'publish\') {
        // 显示主页内容
        setup_postdata($homepage);
        get_header();
        the_content();
        get_footer();
        exit;
    }
}

// 否则使用默认的 front-page.php 内容
get_header();
// ... 您的默认内容 ...
get_footer();
?>'); ?></code></pre>
        </div>
        
        <div class="card" style="max-width: 1000px; margin-top: 20px; background: #fff; border: 1px solid #ccd0d4; padding: 20px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4682B4; padding-bottom: 10px;">快速操作</h2>
            
            <p>
                <a href="<?php echo admin_url('options-reading.php'); ?>" class="button button-primary">
                    ⚙️ 打开阅读设置
                </a>
                
                <a href="<?php echo admin_url('themes.php'); ?>" class="button">
                    🎨 管理主题
                </a>
                
                <?php if ($wp_settings['page_on_front']): ?>
                    <a href="<?php echo get_edit_post_link($wp_settings['page_on_front']); ?>" class="button">
                        📝 编辑主页页面
                    </a>
                <?php endif; ?>
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
        .card h3 {
            color: #2F4F4F;
            margin-top: 20px;
        }
        .widefat {
            margin-top: 15px;
        }
        pre {
            font-size: 12px;
        }
    </style>
    <?php
}

// 检查模板文件
function sosomama_check_template_files($theme, $parent_theme) {
    $files = array();
    $theme_dir = $theme->get_stylesheet_directory();
    $parent_dir = $parent_theme ? $parent_theme->get_stylesheet_directory() : '';
    
    // WordPress 模板层次结构（主页相关）
    $templates = array(
        array('name' => 'front-page.php', 'priority' => 1, 'description' => '最高优先级，会覆盖所有主页设置'),
        array('name' => 'home.php', 'priority' => 2, 'description' => '如果 front-page.php 不存在，会使用这个'),
        array('name' => 'index.php', 'priority' => 3, 'description' => '最后的备选'),
    );
    
    foreach ($templates as $template) {
        $child_path = $theme_dir . '/' . $template['name'];
        $parent_path = $parent_dir ? $parent_dir . '/' . $template['name'] : '';
        
        $exists_in_child = file_exists($child_path);
        $exists_in_parent = $parent_path && file_exists($parent_path);
        
        $files[] = array(
            'name' => $template['name'],
            'priority' => $template['priority'],
            'description' => $template['description'],
            'exists' => $exists_in_child || $exists_in_parent,
            'is_child' => $exists_in_child,
            'path' => $exists_in_child ? $child_path : ($exists_in_parent ? $parent_path : ''),
        );
    }
    
    return $files;
}

// 检查 WordPress 设置
function sosomama_check_wp_settings() {
    return array(
        'show_on_front' => get_option('show_on_front', 'posts'),
        'page_on_front' => get_option('page_on_front', 0),
        'page_for_posts' => get_option('page_for_posts', 0),
    );
}

// 检查主题设置
function sosomama_check_theme_settings() {
    $settings = array();
    
    // 检查主题自定义器设置
    $theme_mods = get_theme_mods();
    if (!empty($theme_mods)) {
        $settings['主题自定义器设置'] = '已设置 ' . count($theme_mods) . ' 项';
        
        // 检查可能影响主页的设置
        $homepage_related = array();
        foreach ($theme_mods as $key => $value) {
            if (stripos($key, 'home') !== false || 
                stripos($key, 'front') !== false ||
                stripos($key, 'page') !== false) {
                $homepage_related[$key] = $value;
            }
        }
        if (!empty($homepage_related)) {
            $settings['主页相关设置'] = $homepage_related;
        }
    } else {
        $settings['主题自定义器设置'] = '未设置';
    }
    
    return $settings;
}

