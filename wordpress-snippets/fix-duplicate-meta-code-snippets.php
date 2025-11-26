<?php
/**
 * 修复重复的 meta 数据（Code Snippets 版本）
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 在 WordPress 后台访问：工具 > 修复重复 Meta 数据
 * 
 * 此版本支持所有 profile_type taxonomy terms，不只是 hk-is-template
 */

// 防止重复加载
if (!function_exists('sosomama_add_fix_duplicate_meta_menu')) {
    
    // 添加管理菜单
    add_action('admin_menu', 'sosomama_add_fix_duplicate_meta_menu', 10);
    
    function sosomama_add_fix_duplicate_meta_menu() {
        add_management_page(
            '修复重复 Meta 数据',
            '修复重复 Meta',
            'manage_options',
            'fix-duplicate-meta',
            'sosomama_fix_duplicate_meta_page'
        );
    }
    
    function sosomama_fix_duplicate_meta_page() {
        if (!current_user_can('manage_options')) {
            wp_die('您没有权限访问此页面');
        }
        
        global $wpdb;
        
        ?>
        <div class="wrap">
            <h1>修复重复的 Meta 数据</h1>
            
            <?php
            // 处理修复请求
            if (isset($_POST['fix_duplicates']) && isset($_POST['_wpnonce']) && wp_verify_nonce($_POST['_wpnonce'], 'fix_duplicates_action')) {
                $target_slug = isset($_POST['profile_type_slug']) ? sanitize_text_field($_POST['profile_type_slug']) : '';
                $dry_run = isset($_POST['dry_run']) && $_POST['dry_run'] === '1';
                
                sosomama_run_fix_duplicates($target_slug, $dry_run);
            } else {
                // 显示选择界面
                ?>
                <div class="notice notice-info">
                    <p>此工具将清理同步过程中可能产生的重复 meta 数据。</p>
                    <p><strong>功能说明：</strong></p>
                    <ul>
                        <li>查找指定 profile_type term 下所有文章的重复 meta 数据</li>
                        <li>保留最新的 meta 记录（meta_id 最大的），删除旧的重复记录</li>
                        <li>支持所有 profile_type terms（hk-is-template, hk-ls-template, hk-ls-primary-template, hk-kg-template 等）</li>
                    </ul>
                </div>
                
                <form method="post" action="">
                    <?php wp_nonce_field('fix_duplicates_action'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="profile_type_slug">Profile Type Slug</label>
                            </th>
                            <td>
                                <select name="profile_type_slug" id="profile_type_slug" required>
                                    <option value="">-- 选择或输入 --</option>
                                    <option value="hk-is-template">hk-is-template (国际学校)</option>
                                    <option value="hk-ls-template">hk-ls-template (本地学校)</option>
                                    <option value="hk-ls-primary-template">hk-ls-primary-template (本地小学)</option>
                                    <option value="hk-kg-template">hk-kg-template (幼儿园)</option>
                                    <option value="all">所有 profile_type terms</option>
                                </select>
                                <p class="description">
                                    选择要修复的 profile_type term，或选择"所有"来修复所有 terms。<br>
                                    也可以手动输入其他 term slug。
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="dry_run">预览模式（不实际删除）</label>
                            </th>
                            <td>
                                <label>
                                    <input type="checkbox" name="dry_run" value="1" checked>
                                    启用预览模式（只显示会删除的数据，不实际删除）
                                </label>
                            </td>
                        </tr>
                    </table>
                    
                    <p class="submit">
                        <input type="submit" name="fix_duplicates" class="button button-primary" value="开始修复">
                    </p>
                </form>
                
                <hr>
                
                <h2>快速修复所有 Terms</h2>
                <p>点击下面的按钮可以快速修复所有 profile_type terms 的重复 meta 数据：</p>
                <form method="post" action="" style="display: inline;">
                    <?php wp_nonce_field('fix_duplicates_action'); ?>
                    <input type="hidden" name="profile_type_slug" value="all">
                    <input type="hidden" name="dry_run" value="0">
                    <input type="submit" name="fix_duplicates" class="button button-secondary" 
                           value="修复所有 Terms（实际删除）" 
                           onclick="return confirm('确定要修复所有 profile_type terms 的重复 meta 数据吗？此操作将实际删除重复数据。');">
                </form>
                <?php
            }
            ?>
        </div>
        <?php
    }
    
    function sosomama_run_fix_duplicates($target_slug = '', $dry_run = true) {
        global $wpdb;
        
        echo '<div class="wrap">';
        echo '<h2>修复结果</h2>';
        echo '<div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">';
        echo '<pre style="background: #f5f5f5; padding: 15px; overflow-x: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">';
        
        if ($dry_run) {
            echo "=== 预览模式：不会实际删除数据 ===\n\n";
        } else {
            echo "=== 修复重复的 Meta 数据 ===\n\n";
        }
        
        // 确定要处理的 terms
        $terms_to_process = array();
        
        if ($target_slug === 'all' || empty($target_slug)) {
            // 获取所有 profile_type terms
            $all_terms = get_terms(array(
                'taxonomy' => 'profile_type',
                'hide_empty' => false,
            ));
            
            if (!is_wp_error($all_terms) && !empty($all_terms)) {
                foreach ($all_terms as $term) {
                    $terms_to_process[] = $term->slug;
                }
                echo "将处理所有 profile_type terms: " . implode(', ', $terms_to_process) . "\n\n";
            } else {
                echo "❌ 未找到任何 profile_type terms\n";
                echo '</pre>';
                echo '<p><a href="' . esc_url(admin_url('tools.php?page=fix-duplicate-meta')) . '" class="button">返回</a></p>';
                echo '</div>';
                echo '</div>';
                return;
            }
        } else {
            // 验证 term 是否存在
            $term = get_term_by('slug', $target_slug, 'profile_type');
            if ($term && !is_wp_error($term)) {
                $terms_to_process[] = $target_slug;
                echo "将处理 term: {$target_slug} ({$term->name})\n\n";
            } else {
                echo "❌ 未找到 term: {$target_slug}\n";
                echo '</pre>';
                echo '<p><a href="' . esc_url(admin_url('tools.php?page=fix-duplicate-meta')) . '" class="button">返回</a></p>';
                echo '</div>';
                echo '</div>';
                return;
            }
        }
        
        $total_fixed = 0;
        $total_deleted = 0;
        
        // 处理每个 term
        foreach ($terms_to_process as $term_slug) {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "处理 term: {$term_slug}\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
            
            // 查找该 term 下所有重复的 meta
            $duplicates = $wpdb->get_results($wpdb->prepare("
                SELECT 
                    post_id, 
                    meta_key, 
                    COUNT(*) as count,
                    GROUP_CONCAT(meta_id ORDER BY meta_id DESC) as meta_ids
                FROM {$wpdb->postmeta}
                WHERE post_id IN (
                    SELECT object_id 
                    FROM {$wpdb->term_relationships} tr
                    INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                    INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                    WHERE t.slug = %s AND tt.taxonomy = 'profile_type'
                )
                GROUP BY post_id, meta_key
                HAVING count > 1
                ORDER BY count DESC
            ", $term_slug));
            
            if (empty($duplicates)) {
                echo "✅ {$term_slug}: 未发现重复的 meta 数据\n\n";
                continue;
            }
            
            echo "发现 " . count($duplicates) . " 组重复的 meta 数据\n\n";
            
            $fixed_count = 0;
            $deleted_count = 0;
            
            foreach ($duplicates as $dup) {
                $meta_ids = explode(',', $dup->meta_ids);
                // 保留最新的（meta_id 最大的），删除其他的
                $keep_id = array_shift($meta_ids); // 第一个是最大的（ORDER BY DESC）
                
                echo "Post ID: {$dup->post_id}, Meta Key: {$dup->meta_key}, 重复次数: {$dup->count}\n";
                echo "  保留 meta_id: {$keep_id}, 将删除: " . implode(', ', $meta_ids) . "\n";
                
                if (!$dry_run) {
                    // 删除重复的 meta（保留最新的）
                    foreach ($meta_ids as $meta_id) {
                        $deleted = $wpdb->delete(
                            $wpdb->postmeta,
                            array('meta_id' => intval($meta_id)),
                            array('%d')
                        );
                        if ($deleted) {
                            $deleted_count++;
                        }
                    }
                } else {
                    // 预览模式：只计数
                    $deleted_count += count($meta_ids);
                }
                
                $fixed_count++;
            }
            
            echo "\n{$term_slug} 修复结果:\n";
            echo "  修复了 {$fixed_count} 组重复数据\n";
            if ($dry_run) {
                echo "  将删除 {$deleted_count} 条重复的 meta 记录（预览模式）\n";
            } else {
                echo "  删除了 {$deleted_count} 条重复的 meta 记录\n";
            }
            echo "\n";
            
            $total_fixed += $fixed_count;
            $total_deleted += $deleted_count;
        }
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "=== 修复完成 ===\n";
        echo "总共修复了 {$total_fixed} 组重复数据\n";
        if ($dry_run) {
            echo "将删除 {$total_deleted} 条重复的 meta 记录（预览模式）\n";
            echo "\n💡 提示：取消勾选预览模式后再次运行，将实际删除这些重复数据。\n";
        } else {
            echo "删除了 {$total_deleted} 条重复的 meta 记录\n";
        }
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        echo '</pre>';
        echo '<p><a href="' . esc_url(admin_url('tools.php?page=fix-duplicate-meta')) . '" class="button">返回</a></p>';
        echo '</div>';
        echo '</div>';
    }
    
} // 结束 function_exists 检查
