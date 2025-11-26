<?php
/**
 * 诊断 Archive 页面内存错误（Code Snippets 版本）
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 在 WordPress 后台访问：工具 > 诊断 Archive 内存问题
 * 
 * 或者在浏览器访问：https://sosomama.com/wp-admin/admin.php?page=diagnose-archive-memory
 */

// 添加管理菜单
add_action('admin_menu', 'sosomama_add_diagnose_menu');

function sosomama_add_diagnose_menu() {
    add_management_page(
        '诊断 Archive 内存问题',
        '诊断 Archive 内存',
        'manage_options',
        'diagnose-archive-memory',
        'sosomama_diagnose_archive_memory_page'
    );
}

function sosomama_diagnose_archive_memory_page() {
    if (!current_user_can('manage_options')) {
        wp_die('您没有权限访问此页面');
    }
    
    global $wpdb;
    
    ?>
    <div class="wrap">
        <h1>WordPress Archive 内存错误诊断</h1>
        
        <?php
        if (isset($_GET['run_diagnosis']) && $_GET['run_diagnosis'] === '1') {
            sosomama_run_diagnosis();
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
                    <a href="<?php echo admin_url('tools.php?page=diagnose-archive-memory&run_diagnosis=1'); ?>" 
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

function sosomama_run_diagnosis() {
    global $wpdb;
    
    echo '<div class="wrap">';
    echo '<h2>诊断结果</h2>';
    echo '<div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">';
    echo '<pre style="background: #f5f5f5; padding: 15px; overflow-x: auto; font-family: monospace; font-size: 12px;">';
    
    // 1. 检查 taxonomy term 信息
    echo "=== WordPress Archive 内存错误诊断 ===\n\n";
    
    echo "1. 检查 taxonomy term: hk-is-template\n";
    $term = get_term_by('slug', 'hk-is-template', 'profile_type');
    if ($term) {
        echo "   Term ID: {$term->term_id}\n";
        echo "   Term Name: {$term->name}\n";
        echo "   Term Count: {$term->count}\n";
        
        // 获取该 term 下的所有文章 ID（使用轻量查询）
        $posts = get_posts(array(
            'post_type' => 'profile',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'tax_query' => array(
                array(
                    'taxonomy' => 'profile_type',
                    'field' => 'slug',
                    'terms' => 'hk-is-template'
                )
            ),
            'no_found_rows' => true,
            'update_post_meta_cache' => false,
            'update_post_term_cache' => false
        ));
        
        echo "   实际文章数量: " . count($posts) . "\n";
        
        if (count($posts) > 1000) {
            echo "   ⚠️  警告：文章数量超过 1000，可能导致内存问题\n";
        }
    } else {
        echo "   ❌ 未找到 term 'hk-is-template'\n";
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
    if ($large_meta) {
        echo "   ⚠️  发现异常大的 meta 数据 (>100KB):\n";
        foreach ($large_meta as $meta) {
            $size_mb = round($meta->meta_size / 1024 / 1024, 2);
            echo "   - Post ID: {$meta->post_id}, Meta Key: {$meta->meta_key}, Size: {$size_mb} MB\n";
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
    if ($duplicates) {
        echo "   ⚠️  发现重复的 meta 数据:\n";
        foreach ($duplicates as $dup) {
            echo "   - Post ID: {$dup->post_id}, Meta Key: {$dup->meta_key}, 重复次数: {$dup->duplicate_count}\n";
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
    if ($posts_with_many_meta) {
        echo "   ⚠️  发现 meta 数据异常的文章:\n";
        foreach ($posts_with_many_meta as $post) {
            $size_mb = round($post->total_meta_size / 1024 / 1024, 2);
            $title = esc_html($post->post_title);
            echo "   - Post ID: {$post->post_id}, Title: {$title}\n";
            echo "     Meta 数量: {$post->meta_count}, 总大小: {$size_mb} MB\n";
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
    
    if ($acf_fields) {
        echo "   发现 " . count($acf_fields) . " 个 ACF 字段\n";
        echo "   前 10 个字段:\n";
        foreach (array_slice($acf_fields, 0, 10) as $field) {
            echo "   - {$field->meta_key}\n";
        }
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
    
    if ($recent_posts) {
        echo "   最近 24 小时内修改的文章:\n";
        foreach ($recent_posts as $post) {
            $title = esc_html($post->post_title);
            echo "   - Post ID: {$post->ID}, Title: {$title}\n";
            echo "     修改时间: {$post->post_modified}, Meta 数量: {$post->meta_count}\n";
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
    echo "   内存限制: {$memory_limit}\n";
    
    echo "\n=== 诊断完成 ===\n";
    
    echo '</pre>';
    echo '<p><a href="' . admin_url('tools.php?page=diagnose-archive-memory') . '" class="button">返回</a></p>';
    echo '</div>';
    echo '</div>';
}


