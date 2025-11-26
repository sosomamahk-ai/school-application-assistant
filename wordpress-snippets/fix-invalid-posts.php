<?php
/**
 * 修复无效的 Post ID 和孤立 Meta 数据
 * 
 * 用于清理可能导致 archive 页面或 REST API 错误的无效数据
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 在 WordPress 后台访问：工具 > 修复无效 Posts
 */

// 防止重复加载
if (!function_exists('sosomama_add_fix_invalid_posts_menu')) {
    
    // 添加管理菜单
    add_action('admin_menu', 'sosomama_add_fix_invalid_posts_menu', 10);
    
    function sosomama_add_fix_invalid_posts_menu() {
        add_management_page(
            '修复无效 Posts',
            '修复无效 Posts',
            'manage_options',
            'fix-invalid-posts',
            'sosomama_fix_invalid_posts_page'
        );
    }
    
    function sosomama_fix_invalid_posts_page() {
        if (!current_user_can('manage_options')) {
            wp_die('您没有权限访问此页面');
        }
        
        global $wpdb;
        
        ?>
        <div class="wrap">
            <h1>修复无效 Posts 和孤立 Meta 数据</h1>
            
            <?php
            if (isset($_POST['fix_invalid']) && isset($_POST['_wpnonce']) && wp_verify_nonce($_POST['_wpnonce'], 'fix_invalid_action')) {
                $dry_run = isset($_POST['dry_run']) && $_POST['dry_run'] === '1';
                $fix_type = sanitize_text_field($_POST['fix_type'] ?? 'all');
                
                sosomama_run_fix_invalid_posts($fix_type, $dry_run);
            } else {
                ?>
                <div class="notice notice-warning">
                    <p><strong>⚠️ 警告：</strong>此操作将删除无效的数据。建议先运行诊断工具确认问题。</p>
                </div>
                
                <div class="notice notice-info">
                    <p>此工具将清理可能导致 archive 页面或 REST API 错误的无效数据。</p>
                    <p><strong>修复项目：</strong></p>
                    <ul>
                        <li>删除无效的 taxonomy 关系（post 不存在）</li>
                        <li>删除孤立的 meta 数据（post_id 不存在）</li>
                    </ul>
                </div>
                
                <form method="post" action="">
                    <?php wp_nonce_field('fix_invalid_action'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="fix_type">修复类型</label>
                            </th>
                            <td>
                                <select name="fix_type" id="fix_type">
                                    <option value="all">所有问题</option>
                                    <option value="invalid_relationships">仅无效的 taxonomy 关系</option>
                                    <option value="orphan_meta">仅孤立的 meta 数据</option>
                                </select>
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
                        <input type="submit" name="fix_invalid" class="button button-primary" value="开始修复">
                    </p>
                </form>
                <?php
            }
            ?>
        </div>
        <?php
    }
    
    function sosomama_run_fix_invalid_posts($fix_type = 'all', $dry_run = true) {
        global $wpdb;
        
        echo '<div class="wrap">';
        echo '<h2>修复结果</h2>';
        echo '<div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">';
        echo '<pre style="background: #f5f5f5; padding: 15px; overflow-x: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">';
        
        if ($dry_run) {
            echo "=== 预览模式：不会实际删除数据 ===\n\n";
        } else {
            echo "=== 修复无效 Posts 和孤立 Meta 数据 ===\n\n";
        }
        
        $total_deleted = 0;
        
        // 1. 修复无效的 taxonomy 关系
        if ($fix_type === 'all' || $fix_type === 'invalid_relationships') {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "修复无效的 taxonomy 关系\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
            
            $invalid_relationships = $wpdb->get_results("
                SELECT DISTINCT tr.object_id, tr.term_taxonomy_id
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                WHERE tt.taxonomy = 'profile_type'
                AND tr.object_id NOT IN (
                    SELECT ID FROM {$wpdb->posts} WHERE post_type = 'profile'
                )
            ");
            
            if (!empty($invalid_relationships)) {
                echo "发现 " . count($invalid_relationships) . " 个无效的 taxonomy 关系\n\n";
                
                $deleted_count = 0;
                foreach ($invalid_relationships as $rel) {
                    echo "删除关系: object_id={$rel->object_id}, term_taxonomy_id={$rel->term_taxonomy_id}\n";
                    
                    if (!$dry_run) {
                        $deleted = $wpdb->delete(
                            $wpdb->term_relationships,
                            array(
                                'object_id' => $rel->object_id,
                                'term_taxonomy_id' => $rel->term_taxonomy_id
                            ),
                            array('%d', '%d')
                        );
                        if ($deleted) {
                            $deleted_count++;
                        }
                    } else {
                        $deleted_count++;
                    }
                }
                
                echo "\n删除了 {$deleted_count} 个无效的 taxonomy 关系\n\n";
                $total_deleted += $deleted_count;
            } else {
                echo "✅ 未发现无效的 taxonomy 关系\n\n";
            }
        }
        
        // 2. 修复孤立的 meta 数据
        if ($fix_type === 'all' || $fix_type === 'orphan_meta') {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "修复孤立的 meta 数据\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
            
            // 先统计
            $orphan_count = $wpdb->get_var("
                SELECT COUNT(*)
                FROM {$wpdb->postmeta}
                WHERE post_id NOT IN (
                    SELECT ID FROM {$wpdb->posts}
                )
                AND post_id IN (
                    SELECT object_id 
                    FROM {$wpdb->term_relationships} tr
                    INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                    WHERE tt.taxonomy = 'profile_type'
                )
            ");
            
            if ($orphan_count > 0) {
                echo "发现 {$orphan_count} 条孤立的 meta 数据\n";
                echo "正在删除...\n\n";
                
                if (!$dry_run) {
                    $deleted = $wpdb->query("
                        DELETE pm FROM {$wpdb->postmeta} pm
                        WHERE pm.post_id NOT IN (
                            SELECT ID FROM {$wpdb->posts}
                        )
                        AND pm.post_id IN (
                            SELECT object_id 
                            FROM {$wpdb->term_relationships} tr
                            INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                            WHERE tt.taxonomy = 'profile_type'
                        )
                    ");
                    
                    echo "删除了 {$deleted} 条孤立的 meta 数据\n\n";
                    $total_deleted += $deleted;
                } else {
                    echo "将删除 {$orphan_count} 条孤立的 meta 数据（预览模式）\n\n";
                    $total_deleted += $orphan_count;
                }
            } else {
                echo "✅ 未发现孤立的 meta 数据\n\n";
            }
        }
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "=== 修复完成 ===\n";
        if ($dry_run) {
            echo "将删除 {$total_deleted} 条无效数据（预览模式）\n";
            echo "\n💡 提示：取消勾选预览模式后再次运行，将实际删除这些数据。\n";
        } else {
            echo "删除了 {$total_deleted} 条无效数据\n";
        }
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        echo '</pre>';
        echo '<p><a href="' . esc_url(admin_url('tools.php?page=fix-invalid-posts')) . '" class="button">返回</a></p>';
        echo '</div>';
        echo '</div>';
    }
    
} // 结束 function_exists 检查

