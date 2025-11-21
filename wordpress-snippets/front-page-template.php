<?php
/**
 * Template Name: Sosomama 主页模板
 * Description: 显示 ranking 和 profile 文章列表的主页模板
 * 
 * 使用说明：
 * 1. 将此文件复制到你的主题目录（如 wp-content/themes/your-theme/）
 * 2. 在 WordPress 后台创建新页面
 * 3. 在页面编辑器的右侧"页面属性"中选择"Sosomama 主页模板"
 * 4. 设置该页面为首页：设置 > 阅读 > 首页显示 > 选择静态页面
 * 
 * 或者直接在主题的 front-page.php 中使用此代码
 */

get_header(); ?>

<?php
// 获取参数（可以通过页面编辑器中的自定义字段设置）
$ranking_posts_count = get_post_meta(get_the_ID(), 'ranking_posts_count', true) ?: 10;
$profile_posts_count = get_post_meta(get_the_ID(), 'profile_posts_count', true) ?: 12;
$show_ranking = get_post_meta(get_the_ID(), 'show_ranking', true) !== 'no';
$show_profile = get_post_meta(get_the_ID(), 'show_profile', true) !== 'no';

// 获取ranking文章
$ranking_posts = array();
if ($show_ranking) {
    $ranking_posts = sosomama_get_cpt_posts('ranking', intval($ranking_posts_count));
}

// 获取profile文章（按类别分组）
$profile_categories = array(
    'hk-is-template' => '香港国际学校',
    'hk-ls-template' => '香港本地中学',
    'hk-ls-primary-template' => '香港本地小学',
    'hk-kg-template' => '香港幼稚园'
);

$profile_by_category = array();
if ($show_profile) {
    foreach ($profile_categories as $slug => $category_name) {
        $profile_by_category[$category_name] = sosomama_get_profile_by_slug(
            $slug, 
            intval($profile_posts_count)
        );
    }
}
?>

<div class="sosomama-homepage">
    
    <?php if (!empty($ranking_posts) && $show_ranking): ?>
    <!-- Ranking 部分 -->
    <section class="sosomama-section sosomama-ranking-section">
        <div class="sosomama-section-header">
            <h2 class="sosomama-section-title">
                <span class="sosomama-icon">📊</span>
                <span>排行榜</span>
            </h2>
        </div>
        <?php
        // 按 ranking-type 分类显示
        $ranking_by_category = sosomama_group_ranking_by_category($ranking_posts);
        ?>
        
        <?php if (!empty($ranking_by_category)): ?>
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
        <?php else: ?>
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
// 包含辅助函数和样式
require_once get_template_directory() . '/inc/sosomama-homepage-functions.php';
sosomama_homepage_styles();
?>

<?php get_footer(); ?>

