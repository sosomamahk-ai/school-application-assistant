<?php
/**
 * 诊断 Archive 页面内存错误
 * 
 * 用于检查同步后可能导致内存错误的数据问题：
 * 1. 检查是否有异常大的 meta 数据
 * 2. 检查是否有重复的 meta 数据
 * 3. 检查 taxonomy term 下的文章数量
 * 4. 检查特定文章的 meta 数据大小
 * 
 * 使用方法：
 * 1. 通过 SSH 访问服务器
 * 2. 在 WordPress 根目录运行：wp eval-file diagnose-archive-memory-issue.php
 * 3. 或者通过浏览器访问（临时）：将此文件放在网站根目录，访问 /diagnose-archive-memory-issue.php
 */

// 安全：只允许管理员访问
if (!defined('WP_CLI') && (!is_admin() || !current_user_can('manage_options'))) {
    die('Access denied');
}

global $wpdb;

echo "=== WordPress Archive 内存错误诊断 ===\n\n";

// 1. 检查 taxonomy term 信息
echo "1. 检查 taxonomy term: hk-is-template\n";
$term = get_term_by('slug', 'hk-is-template', 'profile_type');
if ($term) {
    echo "   Term ID: {$term->term_id}\n";
    echo "   Term Name: {$term->name}\n";
    echo "   Term Count: {$term->count}\n";
    
    // 获取该 term 下的所有文章 ID
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
        )
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
        echo "   - Post ID: {$post->post_id}, Title: {$post->post_title}\n";
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
        echo "   - Post ID: {$post->ID}, Title: {$post->post_title}\n";
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

// 如果是通过浏览器访问，输出 HTML 格式
if (!defined('WP_CLI')) {
    echo "<pre>" . ob_get_clean() . "</pre>";
}

