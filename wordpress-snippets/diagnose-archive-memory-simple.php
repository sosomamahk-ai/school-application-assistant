<?php
/**
 * 诊断 Archive 页面内存错误（简化版 - Code Snippets 可用）
 * 
 * 使用方法：
 * 1. 将此代码添加到 Code Snippets 插件
 * 2. 激活代码片段
 * 3. 在浏览器访问：https://sosomama.com/?diagnose_archive=1
 * 
 * 注意：访问后请立即删除此代码或禁用，避免安全风险
 */

// 添加诊断页面（仅管理员可访问）
add_action('init', 'sosomama_diagnose_archive_init');

function sosomama_diagnose_archive_init() {
    // 只允许管理员访问，且必须通过 URL 参数触发
    if (isset($_GET['diagnose_archive']) && $_GET['diagnose_archive'] === '1' && current_user_can('manage_options')) {
        sosomama_run_diagnosis_simple();
        exit;
    }
}

function sosomama_run_diagnosis_simple() {
    global $wpdb;
    
    header('Content-Type: text/plain; charset=utf-8');
    
    echo "=== WordPress Archive 内存错误诊断 ===\n\n";
    
    // 1. 检查 taxonomy term 信息
    echo "1. 检查 taxonomy term: hk-is-template\n";
    $term = get_term_by('slug', 'hk-is-template', 'profile_type');
    if ($term) {
        echo "   Term ID: {$term->term_id}\n";
        echo "   Term Name: {$term->name}\n";
        echo "   Term Count: {$term->count}\n";
        
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
        
        echo "   实际文章数量: {$post_count}\n";
        
        if ($post_count > 1000) {
            echo "   ⚠️  警告：文章数量超过 1000，可能导致内存问题\n";
        }
    } else {
        echo "   ❌ 未找到 term 'hk-is-template'\n";
    }
    
    echo "\n";
    
    // 2. 检查异常大的 meta 数据
    echo "2. 检查异常大的 meta 数据 (>100KB)\n";
    $large_meta = $wpdb->get_results("
        SELECT 
            post_id,
            meta_key,
            ROUND(LENGTH(meta_value) / 1024 / 1024, 2) as size_mb
        FROM {$wpdb->postmeta}
        WHERE post_id IN (
            SELECT object_id 
            FROM {$wpdb->term_relationships} tr
            INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
            WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
        )
        AND LENGTH(meta_value) > 100000
        ORDER BY LENGTH(meta_value) DESC
        LIMIT 10
    ");
    
    if ($large_meta) {
        echo "   ⚠️  发现异常大的 meta 数据:\n";
        foreach ($large_meta as $meta) {
            echo "   - Post ID: {$meta->post_id}, Meta Key: {$meta->meta_key}, Size: {$meta->size_mb} MB\n";
        }
    } else {
        echo "   ✅ 未发现异常大的 meta 数据\n";
    }
    
    echo "\n";
    
    // 3. 检查重复的 meta 数据
    echo "3. 检查重复的 meta 数据\n";
    $duplicates = $wpdb->get_results("
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
        LIMIT 10
    ");
    
    if ($duplicates) {
        echo "   ⚠️  发现重复的 meta 数据:\n";
        foreach ($duplicates as $dup) {
            echo "   - Post ID: {$dup->post_id}, Meta Key: {$dup->meta_key}, 重复次数: {$dup->duplicate_count}\n";
        }
    } else {
        echo "   ✅ 未发现重复的 meta 数据\n";
    }
    
    echo "\n";
    
    // 4. 检查 meta 数据总数
    echo "4. 检查 meta 数据统计\n";
    $meta_stats = $wpdb->get_row("
        SELECT 
            COUNT(DISTINCT post_id) as total_posts,
            COUNT(*) as total_meta,
            ROUND(AVG(meta_count), 2) as avg_meta_per_post,
            MAX(meta_count) as max_meta_per_post
        FROM (
            SELECT 
                post_id,
                COUNT(*) as meta_count
            FROM {$wpdb->postmeta}
            WHERE post_id IN (
                SELECT object_id 
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
            )
            GROUP BY post_id
        ) as stats
    ");
    
    if ($meta_stats) {
        echo "   总文章数: {$meta_stats->total_posts}\n";
        echo "   总 meta 记录数: {$meta_stats->total_meta}\n";
        echo "   平均每篇文章 meta 数: {$meta_stats->avg_meta_per_post}\n";
        echo "   单篇文章最大 meta 数: {$meta_stats->max_meta_per_post}\n";
        
        if ($meta_stats->max_meta_per_post > 100) {
            echo "   ⚠️  警告：某些文章的 meta 数据过多\n";
        }
    }
    
    echo "\n";
    
    // 5. 内存使用情况
    echo "5. 当前内存使用情况\n";
    $memory_usage = memory_get_usage(true);
    $memory_peak = memory_get_peak_usage(true);
    $memory_limit = ini_get('memory_limit');
    
    echo "   当前内存使用: " . round($memory_usage / 1024 / 1024, 2) . " MB\n";
    echo "   峰值内存使用: " . round($memory_peak / 1024 / 1024, 2) . " MB\n";
    echo "   内存限制: {$memory_limit}\n";
    
    echo "\n=== 诊断完成 ===\n";
    echo "\n⚠️  安全提示：诊断完成后请禁用此代码片段\n";
}


