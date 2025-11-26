<?php
/**
 * 修复重复的 meta 数据
 * 
 * 用于清理同步过程中可能产生的重复 meta 数据
 * 
 * 使用方法：
 * wp eval-file fix-duplicate-meta.php
 * 或通过浏览器访问（仅管理员）
 */

// 安全：只允许管理员访问
if (!defined('WP_CLI') && (!is_admin() || !current_user_can('manage_options'))) {
    die('Access denied');
}

global $wpdb;

echo "=== 修复重复的 Meta 数据 ===\n\n";

// 查找所有重复的 meta
$duplicates = $wpdb->get_results("
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
        WHERE t.slug = 'hk-is-template' AND tt.taxonomy = 'profile_type'
    )
    GROUP BY post_id, meta_key
    HAVING count > 1
    ORDER BY count DESC
");

if (empty($duplicates)) {
    echo "✅ 未发现重复的 meta 数据\n";
    exit;
}

echo "发现 " . count($duplicates) . " 组重复的 meta 数据\n\n";

$fixed_count = 0;
$deleted_count = 0;

foreach ($duplicates as $dup) {
    $meta_ids = explode(',', $dup->meta_ids);
    // 保留最新的（meta_id 最大的），删除其他的
    $keep_id = array_shift($meta_ids); // 第一个是最大的（ORDER BY DESC）
    
    echo "Post ID: {$dup->post_id}, Meta Key: {$dup->meta_key}, 重复次数: {$dup->count}\n";
    echo "  保留 meta_id: {$keep_id}, 删除: " . implode(', ', $meta_ids) . "\n";
    
    // 删除重复的 meta（保留最新的）
    foreach ($meta_ids as $meta_id) {
        $wpdb->delete(
            $wpdb->postmeta,
            array('meta_id' => $meta_id),
            array('%d')
        );
        $deleted_count++;
    }
    
    $fixed_count++;
}

echo "\n=== 修复完成 ===\n";
echo "修复了 {$fixed_count} 组重复数据\n";
echo "删除了 {$deleted_count} 条重复的 meta 记录\n";

// 如果是通过浏览器访问，输出 HTML 格式
if (!defined('WP_CLI')) {
    echo "<pre>" . ob_get_clean() . "</pre>";
}

