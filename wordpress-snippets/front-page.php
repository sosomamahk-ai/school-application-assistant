<?php
/**
 * WordPress 主题模板文件：front-page.php
 * 
 * 这是 WordPress 的主题模板文件，用于显示首页
 * 优先级：front-page.php > home.php > index.php
 * 
 * 使用方法：
 * 1. 将此文件复制到你的 WordPress 主题目录（如 wp-content/themes/your-theme/）
 * 2. 确保主题的 functions.php 中包含辅助函数（见下方的 include 语句）
 * 3. WordPress 会自动使用此文件作为首页模板
 * 
 * 如果需要保留主题的其他功能，可以将此代码整合到主题现有的 front-page.php 中
 */

get_header(); ?>

<?php
// 获取参数（可以通过 WordPress 自定义字段或选项设置）
$ranking_posts_count = get_option('sosomama_ranking_posts_count', 10);
$profile_posts_count = get_option('sosomama_profile_posts_count', 12);
$show_ranking = get_option('sosomama_show_ranking', true);
$show_profile = get_option('sosomama_show_profile', true);

// 包含辅助函数（如果不在 functions.php 中）
// 注意：你需要将 homepage-shortcode.php 中的函数复制到主题的 functions.php 中
// 或者使用以下方式包含（不推荐，但可行）
if (!function_exists('sosomama_get_cpt_posts')) {
    // 如果函数不存在，尝试从插件或其他位置加载
    // 这里建议将所有函数放在主题的 functions.php 中
}
?>

<div class="sosomama-homepage">
    
    <?php if ($show_ranking): ?>
    <!-- Ranking 部分 -->
    <section class="sosomama-section sosomama-ranking-section">
        <div class="sosomama-section-header">
            <h2 class="sosomama-section-title">
                <span class="sosomama-icon">📊</span>
                <span>排行榜</span>
            </h2>
        </div>
        <?php
        // 获取 ranking 文章
        $ranking_posts = sosomama_get_cpt_posts('ranking', intval($ranking_posts_count));
        
        // 按 ranking-type 分类显示
        $ranking_by_category = sosomama_group_ranking_by_category($ranking_posts);
        ?>
        
        <?php if (!empty($ranking_by_category) && !empty($ranking_posts)): ?>
            <!-- 桌面端：并列显示分类 -->
            <div class="sosomama-ranking-categories-wrapper">
                <?php foreach ($ranking_by_category as $category_name => $posts): ?>
                    <div class="sosomama-ranking-category-group">
                        <h3 class="sosomama-ranking-category-title"><?php echo esc_html($category_name); ?></h3>
                        <ul class="sosomama-ranking-list">
                            <?php foreach ($posts as $index => $post): ?>
                                <li class="sosomama-ranking-item">
                                    <a href="<?php echo esc_url(get_permalink($post->ID)); ?>" class="sosomama-ranking-link">
                                        <span class="sosomama-ranking-number"><?php echo $index + 1; ?></span>
                                        <div class="sosomama-ranking-content">
                                            <h3 class="sosomama-ranking-title"><?php echo esc_html($post->post_title); ?></h3>
                                            <?php if (!empty($post->post_excerpt)): ?>
                                                <p class="sosomama-ranking-excerpt"><?php echo esc_html(wp_trim_words($post->post_excerpt, 30)); ?></p>
                                            <?php endif; ?>
                                        </div>
                                        <time class="sosomama-ranking-date" datetime="<?php echo esc_attr(get_the_date('c', $post->ID)); ?>">
                                            <?php echo esc_html(get_the_date('Y年m月d日', $post->ID)); ?>
                                        </time>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php elseif (!empty($ranking_posts)): ?>
            <!-- 无分类：直接显示列表 -->
            <ul class="sosomama-ranking-list">
                <?php foreach ($ranking_posts as $index => $post): ?>
                    <li class="sosomama-ranking-item">
                        <a href="<?php echo esc_url(get_permalink($post->ID)); ?>" class="sosomama-ranking-link">
                            <span class="sosomama-ranking-number"><?php echo $index + 1; ?></span>
                            <div class="sosomama-ranking-content">
                                <h3 class="sosomama-ranking-title"><?php echo esc_html($post->post_title); ?></h3>
                                <?php if (!empty($post->post_excerpt)): ?>
                                    <p class="sosomama-ranking-excerpt"><?php echo esc_html(wp_trim_words($post->post_excerpt, 30)); ?></p>
                                <?php endif; ?>
                            </div>
                            <time class="sosomama-ranking-date" datetime="<?php echo esc_attr(get_the_date('c', $post->ID)); ?>">
                                <?php echo esc_html(get_the_date('Y年m月d日', $post->ID)); ?>
                            </time>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </section>
    <?php endif; ?>
    
    <?php if ($show_profile): ?>
    <!-- Profile 部分 -->
    <section class="sosomama-section sosomama-profile-section">
        <div class="sosomama-section-header">
            <h2 class="sosomama-section-title">
                <span class="sosomama-icon">🏫</span>
                <span>学校资料</span>
            </h2>
        </div>
        
        <?php
        // 获取profile文章（按类别分组）
        $profile_categories = array(
            'hk-is-template' => '香港国际学校',
            'hk-ls-template' => '香港本地中学',
            'hk-ls-primary-template' => '香港本地小学',
            'hk-kg-template' => '香港幼稚园'
        );
        
        $profile_by_category = array();
        foreach ($profile_categories as $slug => $category_name) {
            $profile_by_category[$category_name] = sosomama_get_profile_by_slug(
                $slug, 
                intval($profile_posts_count)
            );
        }
        ?>
        
        <div class="sosomama-profile-categories-wrapper">
            <?php foreach ($profile_categories as $slug => $category_name): ?>
                <?php if (!empty($profile_by_category[$category_name])): ?>
                    <div class="sosomama-category-group">
                        <h3 class="sosomama-category-title">
                            <span class="sosomama-category-icon"><?php echo sosomama_get_category_icon($category_name); ?></span>
                            <?php echo esc_html($category_name); ?>
                        </h3>
                        <ul class="sosomama-profile-list">
                            <?php foreach ($profile_by_category[$category_name] as $index => $post): ?>
                                <li class="sosomama-profile-item">
                                    <a href="<?php echo esc_url(get_permalink($post->ID)); ?>" class="sosomama-profile-link">
                                        <span class="sosomama-profile-number"><?php echo $index + 1; ?></span>
                                        <div class="sosomama-profile-content">
                                            <h4 class="sosomama-profile-title"><?php echo esc_html($post->post_title); ?></h4>
                                            <?php if (!empty($post->post_excerpt)): ?>
                                                <p class="sosomama-profile-excerpt"><?php echo esc_html(wp_trim_words($post->post_excerpt, 30)); ?></p>
                                            <?php endif; ?>
                                        </div>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    </section>
    <?php endif; ?>
    
</div>

<?php
// 输出样式（函数应该在主题的 functions.php 中定义）
if (function_exists('sosomama_homepage_styles')) {
    sosomama_homepage_styles();
}
?>

<?php get_footer(); ?>

