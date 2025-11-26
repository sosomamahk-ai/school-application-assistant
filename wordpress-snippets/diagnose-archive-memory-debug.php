<?php
/**
 * 诊断 Archive 页面内存错误（调试版本）
 * 
 * 此版本添加了调试信息，帮助定位菜单不显示的问题
 */

// 防止重复加载
if (!function_exists('sosomama_diagnose_debug_init')) {
    
    // 添加调试信息到管理后台通知
    add_action('admin_notices', 'sosomama_diagnose_debug_notice');
    
    function sosomama_diagnose_debug_notice() {
        // 只在管理员且不在诊断页面本身显示
        if (current_user_can('manage_options') && !isset($_GET['page']) || $_GET['page'] !== 'diagnose-archive-memory-debug') {
            echo '<div class="notice notice-info is-dismissible">';
            echo '<p><strong>诊断脚本调试信息：</strong></p>';
            echo '<ul>';
            echo '<li>函数存在检查：' . (function_exists('sosomama_add_diagnose_menu_debug') ? '✅ 已定义' : '❌ 未定义') . '</li>';
            echo '<li>Hook 已注册：' . (has_action('admin_menu', 'sosomama_add_diagnose_menu_debug') ? '✅ 是' : '❌ 否') . '</li>';
            echo '<li>用户权限：' . (current_user_can('manage_options') ? '✅ 有权限' : '❌ 无权限') . '</li>';
            echo '<li>直接访问：<a href="' . admin_url('tools.php?page=diagnose-archive-memory-debug') . '">点击这里</a></li>';
            echo '</ul>';
            echo '</div>';
        }
    }
    
    // 添加管理菜单 - 使用不同的函数名和页面 slug
    add_action('admin_menu', 'sosomama_add_diagnose_menu_debug', 20);
    
    function sosomama_add_diagnose_menu_debug() {
        // 检查权限
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // 添加菜单项 - 使用不同的 slug 避免冲突
        $result = add_management_page(
            '诊断 Archive 内存问题（调试）',
            '诊断 Archive 内存',
            'manage_options',
            'diagnose-archive-memory-debug',
            'sosomama_diagnose_archive_memory_page_debug'
        );
        
        // 调试：记录菜单是否添加成功
        if ($result === false) {
            error_log('Sosomama Diagnose: Failed to add admin menu');
        } else {
            error_log('Sosomama Diagnose: Admin menu added successfully');
        }
    }
    
    function sosomama_diagnose_archive_memory_page_debug() {
        if (!current_user_can('manage_options')) {
            wp_die('您没有权限访问此页面');
        }
        
        global $wpdb;
        
        ?>
        <div class="wrap">
            <h1>WordPress Archive 内存错误诊断（调试版）</h1>
            
            <div class="notice notice-info">
                <p><strong>调试信息：</strong></p>
                <ul>
                    <li>函数已加载：✅</li>
                    <li>用户权限：<?php echo current_user_can('manage_options') ? '✅ 有权限' : '❌ 无权限'; ?></li>
                    <li>当前用户：<?php echo esc_html(wp_get_current_user()->user_login); ?></li>
                </ul>
            </div>
            
            <?php
            if (isset($_GET['run_diagnosis']) && $_GET['run_diagnosis'] === '1') {
                sosomama_run_diagnosis_debug();
            } else {
                ?>
                <div class="notice notice-info">
                    <p>此工具将检查可能导致 archive 页面内存错误的数据问题。</p>
                    <p><strong>检查项目：</strong></p>
                    <ul>
                        <li>Taxonomy term 下的文章数量</li>
                        <li>异常大的 meta 数据（>100KB）</li>
                        <li>重复的 meta 数据</li>
                        <li>每个文章的 meta 数据总数</li>
                        <li>ACF 字段情况</li>
                        <li>最近修改的文章</li>
                    </ul>
                    <p>
                        <a href="<?php echo esc_url(admin_url('tools.php?page=diagnose-archive-memory-debug&run_diagnosis=1')); ?>" 
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
    
    function sosomama_run_diagnosis_debug() {
        global $wpdb;
        
        echo '<div class="wrap">';
        echo '<h2>诊断结果</h2>';
        echo '<div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">';
        echo '<pre style="background: #f5f5f5; padding: 15px; overflow-x: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">';
        
        // 1. 检查 taxonomy term 信息
        echo "=== WordPress Archive 内存错误诊断 ===\n\n";
        
        echo "1. 检查 taxonomy term: hk-is-template\n";
        $term = get_term_by('slug', 'hk-is-template', 'profile_type');
        if ($term && !is_wp_error($term)) {
            echo "   Term ID: " . esc_html($term->term_id) . "\n";
            echo "   Term Name: " . esc_html($term->name) . "\n";
            echo "   Term Count: " . esc_html($term->count) . "\n";
            
            // 使用轻量查询获取文章数量
            $post_count = $wpdb->get_var($wpdb->prepare("
                SELECT COUNT(DISTINCT p.ID)
                FROM {$wpdb->posts} p
                INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                WHERE t.slug = %s 
                AND tt.taxonomy = 'profile_type'
                AND p.post_type = 'profile'
                AND p.post_status = 'publish'
            ", 'hk-is-template'));
            
            echo "   实际文章数量: " . esc_html($post_count) . "\n";
            
            if ($post_count > 1000) {
                echo "   ⚠️  警告：文章数量超过 1000，可能导致内存问题\n";
            }
        } else {
            echo "   ❌ 未找到 term 'hk-is-template'\n";
            if (is_wp_error($term)) {
                echo "   错误信息: " . esc_html($term->get_error_message()) . "\n";
            }
        }
        
        echo "\n";
        
        // 2. 检查 meta 数据大小
        echo "2. 检查 meta 数据大小\n";
        $meta_size_query = "
            SELECT 
                post_id,
                meta_key,
                LENGTH(meta_value) as meta_size,
                COUNT(*) as meta_count
            FROM {$wpdb->postmeta}
            WHERE post_id IN (
                SELECT object_id 
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
            )
            GROUP BY post_id, meta_key
            HAVING meta_size > 100000
            ORDER BY meta_size DESC
            LIMIT 20
        ";
        
        $large_meta = $wpdb->get_results($meta_size_query);
        if ($large_meta && !empty($large_meta)) {
            echo "   ⚠️  发现异常大的 meta 数据 (>100KB):\n";
            foreach ($large_meta as $meta) {
                $size_mb = round($meta->meta_size / 1024 / 1024, 2);
                echo "   - Post ID: " . esc_html($meta->post_id) . ", Meta Key: " . esc_html($meta->meta_key) . ", Size: " . esc_html($size_mb) . " MB\n";
            }
        } else {
            echo "   ✅ 未发现异常大的 meta 数据\n";
        }
        
        echo "\n";
        
        // 3. 检查重复的 meta 数据
        echo "3. 检查重复的 meta 数据\n";
        $duplicate_meta_query = "
            SELECT 
                post_id,
                meta_key,
                COUNT(*) as duplicate_count
            FROM {$wpdb->postmeta}
            WHERE post_id IN (
                SELECT object_id 
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
            )
            GROUP BY post_id, meta_key
            HAVING duplicate_count > 1
            ORDER BY duplicate_count DESC
            LIMIT 20
        ";
        
        $duplicates = $wpdb->get_results($duplicate_meta_query);
        if ($duplicates && !empty($duplicates)) {
            echo "   ⚠️  发现重复的 meta 数据:\n";
            foreach ($duplicates as $dup) {
                echo "   - Post ID: " . esc_html($dup->post_id) . ", Meta Key: " . esc_html($dup->meta_key) . ", 重复次数: " . esc_html($dup->duplicate_count) . "\n";
            }
            echo "\n   💡 提示：可以运行修复脚本清理重复数据\n";
        } else {
            echo "   ✅ 未发现重复的 meta 数据\n";
        }
        
        echo "\n";
        
        // 4. 检查每个文章的 meta 数据总数
        echo "4. 检查每个文章的 meta 数据总数\n";
        $meta_count_query = "
            SELECT 
                p.ID as post_id,
                p.post_title,
                COUNT(pm.meta_id) as meta_count,
                SUM(LENGTH(pm.meta_value)) as total_meta_size
            FROM {$wpdb->posts} p
            INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
            INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
            GROUP BY p.ID
            HAVING meta_count > 100 OR total_meta_size > 500000
            ORDER BY total_meta_size DESC
            LIMIT 20
        ";
        
        $posts_with_many_meta = $wpdb->get_results($meta_count_query);
        if ($posts_with_many_meta && !empty($posts_with_many_meta)) {
            echo "   ⚠️  发现 meta 数据异常的文章:\n";
            foreach ($posts_with_many_meta as $post) {
                $size_mb = round($post->total_meta_size / 1024 / 1024, 2);
                $title = esc_html($post->post_title);
                echo "   - Post ID: " . esc_html($post->post_id) . ", Title: " . $title . "\n";
                echo "     Meta 数量: " . esc_html($post->meta_count) . ", 总大小: " . esc_html($size_mb) . " MB\n";
            }
        } else {
            echo "   ✅ 未发现 meta 数据异常的文章\n";
        }
        
        echo "\n";
        
        // 5. 检查 ACF 字段
        echo "5. 检查 ACF 字段\n";
        $acf_fields = $wpdb->get_results("
            SELECT DISTINCT meta_key 
            FROM {$wpdb->postmeta}
            WHERE post_id IN (
                SELECT object_id 
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
            )
            AND meta_key LIKE 'field_%'
            LIMIT 50
        ");
        
        if ($acf_fields && !empty($acf_fields)) {
            echo "   发现 " . count($acf_fields) . " 个 ACF 字段\n";
            echo "   前 10 个字段:\n";
            foreach (array_slice($acf_fields, 0, 10) as $field) {
                echo "   - " . esc_html($field->meta_key) . "\n";
            }
        } else {
            echo "   ✅ 未发现 ACF 字段\n";
        }
        
        echo "\n";
        
        // 6. 检查最近同步的文章
        echo "6. 检查最近修改的文章（可能是同步导致的）\n";
        $recent_posts = $wpdb->get_results("
            SELECT 
                p.ID,
                p.post_title,
                p.post_modified,
                COUNT(pm.meta_id) as meta_count
            FROM {$wpdb->posts} p
            INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
            INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE t.slug = 'hk-is-template' 
            AND tt.taxonomy = 'profile_type'
            AND p.post_modified >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY p.ID
            ORDER BY p.post_modified DESC
            LIMIT 10
        ");
        
        if ($recent_posts && !empty($recent_posts)) {
            echo "   最近 24 小时内修改的文章:\n";
            foreach ($recent_posts as $post) {
                $title = esc_html($post->post_title);
                echo "   - Post ID: " . esc_html($post->ID) . ", Title: " . $title . "\n";
                echo "     修改时间: " . esc_html($post->post_modified) . ", Meta 数量: " . esc_html($post->meta_count) . "\n";
            }
        } else {
            echo "   ✅ 最近 24 小时内没有修改的文章\n";
        }
        
        echo "\n";
        
        // 7. 内存使用情况
        echo "7. 当前内存使用情况\n";
        $memory_usage = memory_get_usage(true);
        $memory_peak = memory_get_peak_usage(true);
        $memory_limit = ini_get('memory_limit');
        
        echo "   当前内存使用: " . round($memory_usage / 1024 / 1024, 2) . " MB\n";
        echo "   峰值内存使用: " . round($memory_peak / 1024 / 1024, 2) . " MB\n";
        echo "   内存限制: " . esc_html($memory_limit) . "\n";
        
        echo "\n=== 诊断完成 ===\n";
        
        echo '</pre>';
        echo '<p><a href="' . esc_url(admin_url('tools.php?page=diagnose-archive-memory-debug')) . '" class="button">返回</a></p>';
        echo '</div>';
        echo '</div>';
    }
    
} // 结束 function_exists 检查

