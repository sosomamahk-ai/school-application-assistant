<?php
/**
 * 诊断无效的 Post ID 和 ACF 字段问题
 * 
 * 用于检查可能导致 archive 页面内存错误或 REST API 错误的无效数据
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 在 WordPress 后台访问：工具 > 诊断无效 Posts
 */

// 防止重复加载
if (!function_exists('sosomama_add_diagnose_invalid_posts_menu')) {
    
    // 添加管理菜单
    add_action('admin_menu', 'sosomama_add_diagnose_invalid_posts_menu', 10);
    
    function sosomama_add_diagnose_invalid_posts_menu() {
        add_management_page(
            '诊断无效 Posts',
            '诊断无效 Posts',
            'manage_options',
            'diagnose-invalid-posts',
            'sosomama_diagnose_invalid_posts_page'
        );
    }
    
    function sosomama_diagnose_invalid_posts_page() {
        if (!current_user_can('manage_options')) {
            wp_die('您没有权限访问此页面');
        }
        
        global $wpdb;
        
        ?>
        <div class="wrap">
            <h1>诊断无效 Posts 和 ACF 字段问题</h1>
            
            <?php
            if (isset($_GET['run_diagnosis']) && $_GET['run_diagnosis'] === '1') {
                sosomama_run_invalid_posts_diagnosis();
            } else {
                ?>
                <div class="notice notice-info">
                    <p>此工具将检查可能导致 archive 页面或 REST API 错误的无效数据。</p>
                    <p><strong>检查项目：</strong></p>
                    <ul>
                        <li>检查无效的 post ID（在 term_relationships 中存在但 posts 表中不存在）</li>
                        <li>检查孤立的 meta 数据（post_id 不存在）</li>
                        <li>检查 ACF 字段值类型不匹配</li>
                        <li>检查可能导致 REST API 错误的 post</li>
                    </ul>
                    <p>
                        <a href="<?php echo esc_url(admin_url('tools.php?page=diagnose-invalid-posts&run_diagnosis=1')); ?>" 
                           class="button button-primary">
                            开始诊断
                        </a>
                    </p>
                </div>
                <?php
            }
            ?>
        </div>
        <?php
    }
    
    function sosomama_run_invalid_posts_diagnosis() {
        global $wpdb;
        
        echo '<div class="wrap">';
        echo '<h2>诊断结果</h2>';
        echo '<div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">';
        echo '<pre style="background: #f5f5f5; padding: 15px; overflow-x: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">';
        
        echo "=== 诊断无效 Posts 和 ACF 字段问题 ===\n\n";
        
        // 1. 检查无效的 post ID（在 term_relationships 中存在但 posts 表中不存在）
        echo "1. 检查无效的 post ID（在 taxonomy 关系中但 posts 表中不存在）\n";
        $invalid_posts = $wpdb->get_results("
            SELECT DISTINCT tr.object_id as invalid_post_id
            FROM {$wpdb->term_relationships} tr
            INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            WHERE tt.taxonomy = 'profile_type'
            AND tr.object_id NOT IN (
                SELECT ID FROM {$wpdb->posts} WHERE post_type = 'profile'
            )
            LIMIT 50
        ");
        
        if (!empty($invalid_posts)) {
            echo "   ⚠️  发现 " . count($invalid_posts) . " 个无效的 post ID:\n";
            foreach ($invalid_posts as $post) {
                echo "   - Post ID: {$post->invalid_post_id}\n";
            }
            echo "\n   💡 这些无效的 post ID 可能导致 archive 页面或 REST API 错误\n";
        } else {
            echo "   ✅ 未发现无效的 post ID\n";
        }
        
        echo "\n";
        
        // 2. 检查孤立的 meta 数据
        echo "2. 检查孤立的 meta 数据（post_id 不存在）\n";
        $orphan_meta = $wpdb->get_var("
            SELECT COUNT(DISTINCT post_id)
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
        
        if ($orphan_meta > 0) {
            echo "   ⚠️  发现 {$orphan_meta} 个孤立的 meta 数据记录\n";
            echo "   💡 这些孤立的 meta 数据可能导致内存问题\n";
        } else {
            echo "   ✅ 未发现孤立的 meta 数据\n";
        }
        
        echo "\n";
        
        // 3. 检查可能导致 REST API 错误的 post
        echo "3. 检查可能导致 REST API 错误的 post\n";
        $problematic_posts = $wpdb->get_results("
            SELECT 
                p.ID,
                p.post_title,
                p.post_status,
                COUNT(pm.meta_id) as meta_count
            FROM {$wpdb->posts} p
            INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
            INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE tt.taxonomy = 'profile_type'
            AND p.post_type = 'profile'
            AND (
                p.post_status NOT IN ('publish', 'draft', 'pending', 'private')
                OR p.post_title = ''
                OR p.post_title IS NULL
            )
            GROUP BY p.ID
            LIMIT 20
        ");
        
        if (!empty($problematic_posts)) {
            echo "   ⚠️  发现 " . count($problematic_posts) . " 个可能有问题的 post:\n";
            foreach ($problematic_posts as $post) {
                echo "   - Post ID: {$post->ID}, Title: " . ($post->post_title ?: '(空)') . ", Status: {$post->post_status}, Meta: {$post->meta_count}\n";
            }
        } else {
            echo "   ✅ 未发现明显有问题的 post\n";
        }
        
        echo "\n";
        
        // 4. 检查 ACF 字段值类型问题
        echo "4. 检查 ACF 字段值类型问题\n";
        $acf_type_issues = $wpdb->get_results("
            SELECT 
                post_id,
                meta_key,
                COUNT(*) as count
            FROM {$wpdb->postmeta}
            WHERE post_id IN (
                SELECT object_id 
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                WHERE tt.taxonomy = 'profile_type'
            )
            AND (
                meta_key LIKE 'field_%'
                OR meta_key LIKE '_%'
            )
            AND meta_value IS NULL
            GROUP BY post_id, meta_key
            HAVING count > 1
            LIMIT 20
        ");
        
        if (!empty($acf_type_issues)) {
            echo "   ⚠️  发现可能的 ACF 字段类型问题:\n";
            foreach ($acf_type_issues as $issue) {
                echo "   - Post ID: {$issue->post_id}, Meta Key: {$issue->meta_key}, 空值数量: {$issue->count}\n";
            }
        } else {
            echo "   ✅ 未发现明显的 ACF 字段类型问题\n";
        }
        
        echo "\n";
        
        // 5. 检查特定 post ID（从错误日志中看到的）
        echo "5. 检查错误日志中提到的 post ID\n";
        $error_post_ids = array(21912, 24358); // 从错误日志中提取的 ID
        
        foreach ($error_post_ids as $post_id) {
            $post = get_post($post_id);
            if (!$post) {
                echo "   ❌ Post ID {$post_id}: 不存在\n";
            } else {
                $meta_count = $wpdb->get_var($wpdb->prepare("
                    SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE post_id = %d
                ", $post_id));
                echo "   Post ID {$post_id}: 存在, Title: {$post->post_title}, Status: {$post->post_status}, Meta: {$meta_count}\n";
            }
        }
        
        echo "\n=== 诊断完成 ===\n";
        
        echo '</pre>';
        echo '<p><a href="' . esc_url(admin_url('tools.php?page=diagnose-invalid-posts')) . '" class="button">返回</a></p>';
        echo '</div>';
        echo '</div>';
    }
    
} // 结束 function_exists 检查

