<?php
/**
 * Sosomama.com 主页 Shortcode
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 在WordPress页面或文章中使用短代码: [sosomama_homepage]
 * 
 * 短代码参数：
 * [sosomama_homepage] - 默认显示所有内容
 * [sosomama_homepage ranking_posts="5" profile_posts="10"] - 自定义显示数量
 * [sosomama_homepage show_ranking="no"] - 隐藏排名部分
 */

/**
 * 主页 Shortcode
 */
function sosomama_homepage_shortcode($atts) {
    $atts = shortcode_atts(array(
        'ranking_posts' => 10,      // ranking类型显示的文章数量
        'profile_posts' => 12,      // 每个profile类别显示的文章数量
        'show_ranking' => 'yes',    // 是否显示ranking部分
        'show_profile' => 'yes'     // 是否显示profile部分
    ), $atts);
    
    ob_start();
    
    // 获取ranking文章
    // 由于需要按类别分组，每个类别5个，4个类别需要至少20个文章
    // 但为了确保每个类别都有5个，获取更多文章
    $ranking_posts = array();
    if ($atts['show_ranking'] === 'yes') {
        // 计算需要的文章数量：4个类别 × 5个 = 20个，但为了确保每个类别都能找到文章，获取更多
        // 如果每个类别都需要5个，理论上需要至少每个类别获取5个，所以至少获取30-50个
        $posts_needed = max(intval($atts['ranking_posts']), 50);
        $ranking_posts = sosomama_get_cpt_posts('ranking', $posts_needed);
    }
    
    // 获取profile文章（按类别分组）
    // 使用 slug 映射
    $profile_categories = array(
        'hk-is-template' => '香港国际学校',
        'hk-ls-template' => '香港本地中学',
        'hk-ls-primary-template' => '香港本地小学',
        'hk-kg-template' => '香港幼稚园'
    );
    
    $profile_by_category = array();
    if ($atts['show_profile'] === 'yes') {
        foreach ($profile_categories as $slug => $category_name) {
            $profile_by_category[$category_name] = sosomama_get_profile_by_slug(
                $slug, 
                intval($atts['profile_posts'])
            );
        }
    }
    
    ?>
    <div class="sosomama-homepage">
        
        <?php if (!empty($ranking_posts) && $atts['show_ranking'] === 'yes'): ?>
        <!-- Ranking 部分 -->
        <section class="sosomama-section sosomama-ranking-section">
            <div class="sosomama-section-header">
                <h2 class="sosomama-section-title">
                    <span class="sosomama-icon">📊</span>
                    <span>排行榜</span>
                </h2>
            </div>
            <?php
            // 按 taxonomy "related-profile-type" 分类显示，每个类别最多5个
            // 分类 slug: hk-intl (国际学校), local-sec (本地中学), local-pri (本地小学), hk-kg (幼稚园)
            $ranking_by_category = sosomama_group_ranking_by_category($ranking_posts, 5);
            ?>
            
            <?php if (!empty($ranking_by_category)): ?>
                <!-- 桌面端：并列显示分类 -->
                <div class="sosomama-ranking-categories-wrapper">
                    <?php foreach ($ranking_by_category as $category_name => $posts): ?>
                        <?php 
                        // 确保每个类别最多显示5个
                        $posts = array_slice($posts, 0, 5);
                        if (empty($posts)) continue;
                        ?>
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
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>
        <?php endif; ?>
        
        <?php if ($atts['show_profile'] === 'yes'): ?>
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
    // 输出样式
    sosomama_homepage_styles();
    
    return ob_get_clean();
}
add_shortcode('sosomama_homepage', 'sosomama_homepage_shortcode');

/**
 * 获取自定义文章类型的文章
 */
function sosomama_get_cpt_posts($post_type, $posts_per_page = 10) {
    $args = array(
        'post_type' => $post_type,
        'posts_per_page' => $posts_per_page,
        'post_status' => 'publish',
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    $query = new WP_Query($args);
    return $query->posts;
}

/**
 * 根据 slug 获取 profile 文章
 */
function sosomama_get_profile_by_slug($slug, $posts_per_page = 12) {
    $args = array(
        'post_type' => 'profile',
        'posts_per_page' => $posts_per_page,
        'post_status' => 'publish',
        'orderby' => 'date',
        'order' => 'ASC'  // 从最早发布的开始显示
    );
    
    // 使用 taxonomy "profile_type" 的 slug
    if (taxonomy_exists('profile_type')) {
        $args['tax_query'] = array(
            array(
                'taxonomy' => 'profile_type',
                'field' => 'slug',
                'terms' => $slug
            )
        );
    } else {
        // 回退到其他方式
        $tax_query = array(
            array(
                'taxonomy' => 'school_category',
                'field' => 'slug',
                'terms' => $slug
            )
        );
        
        if (taxonomy_exists('school_category')) {
            $args['tax_query'] = $tax_query;
        }
    }
    
    $query = new WP_Query($args);
    
    // 如果没找到，尝试通过获取所有文章然后手动过滤
    if (empty($query->posts)) {
        $all_posts = sosomama_get_cpt_posts('profile', 200);
        $filtered = array();
        foreach ($all_posts as $post) {
            $post_slug = sosomama_get_post_category_slug($post->ID);
            if ($post_slug === $slug && count($filtered) < $posts_per_page) {
                $filtered[] = $post;
            }
        }
        return $filtered;
    }
    
    return $query->posts;
}

/**
 * 根据类别获取profile文章（保留用于兼容）
 */
function sosomama_get_profile_by_category($category, $posts_per_page = 12) {
    return sosomama_get_profile_by_slug($category, $posts_per_page);
}

/**
 * 获取文章的类别 slug
 */
function sosomama_get_post_category_slug($post_id) {
    // 优先从 taxonomy "profile_type" 获取
    $terms = get_the_terms($post_id, 'profile_type');
    if (!empty($terms) && !is_wp_error($terms)) {
        return $terms[0]->slug;
    }
    
    // 尝试从其他 taxonomy 获取
    $terms = get_the_terms($post_id, 'school_category');
    if (!empty($terms) && !is_wp_error($terms)) {
        return $terms[0]->slug;
    }
    
    return '';
}

/**
 * 按类别分组 ranking 文章（桌面端使用）
 * @param array $ranking_posts 所有 ranking 文章
 * @param int $posts_per_category 每个类别显示的文章数量，默认5
 */
function sosomama_group_ranking_by_category($ranking_posts, $posts_per_category = 5) {
    $grouped = array();
    
    // Taxonomy slug 到类别名称的映射
    $slug_to_category_map = array(
        'hk-intl' => '香港国际学校',
        'local-sec' => '香港本地中学',
        'local-pri' => '香港本地小学',
        'hk-kg' => '香港幼稚园'
    );
    
    // 初始化每个类别的数组
    foreach ($slug_to_category_map as $slug => $category_name) {
        $grouped[$category_name] = array();
    }
    
    // 添加"未分类"类别
    $grouped['未分类'] = array();
    
    foreach ($ranking_posts as $post) {
        $category_name = '未分类';
        $found_category = false;
        
        // 从 taxonomy "related-profile-type" 获取（使用 slug）
        $terms = get_the_terms($post->ID, 'related-profile-type');
        if (!empty($terms) && !is_wp_error($terms)) {
            // 获取第一个 term 的 slug
            $term_slug = $terms[0]->slug;
            
            // 根据 slug 映射到类别名称
            if (isset($slug_to_category_map[$term_slug])) {
                $category_name = $slug_to_category_map[$term_slug];
                $found_category = true;
            }
        }
        
        // 限制每个类别的文章数量
        if (!isset($grouped[$category_name])) {
            $grouped[$category_name] = array();
        }
        
        // 只有当该类别的文章数量少于限制时才添加
        if (count($grouped[$category_name]) < $posts_per_category) {
            $grouped[$category_name][] = $post;
        }
    }
    
    // 移除空的类别
    foreach ($grouped as $category_name => $posts) {
        if (empty($posts)) {
            unset($grouped[$category_name]);
        }
    }
    
    return $grouped;
}

/**
 * 获取文章的类别
 */
function sosomama_get_post_category($post_id) {
    // 优先从 taxonomy "profile_type" 获取
    $terms = get_the_terms($post_id, 'profile_type');
    if (!empty($terms) && !is_wp_error($terms)) {
        return $terms[0]->name;
    }
    
    // 尝试从其他 taxonomy 获取
    $terms = get_the_terms($post_id, 'school_category');
    if (!empty($terms) && !is_wp_error($terms)) {
        return $terms[0]->name;
    }
    
    // 尝试从meta获取
    $category = get_post_meta($post_id, 'category', true);
    if (!empty($category)) {
        return $category;
    }
    
    $profile_type = get_post_meta($post_id, 'profile_type', true);
    if (!empty($profile_type)) {
        return $profile_type;
    }
    
    // 尝试从ACF获取
    if (function_exists('get_field')) {
        $acf_category = get_field('category', $post_id);
        if (!empty($acf_category)) {
            return is_array($acf_category) ? $acf_category[0] : $acf_category;
        }
        
        $acf_profile_type = get_field('profile_type', $post_id);
        if (!empty($acf_profile_type)) {
            return is_array($acf_profile_type) ? $acf_profile_type[0] : $acf_profile_type;
        }
        
        $acf_school_category = get_field('school_category', $post_id);
        if (!empty($acf_school_category)) {
            return is_array($acf_school_category) ? $acf_school_category[0] : $acf_school_category;
        }
    }
    
    return '';
}

/**
 * 获取文章图片
 */
function sosomama_get_post_image($post_id) {
    // 优先使用特色图片
    if (has_post_thumbnail($post_id)) {
        $thumb_id = get_post_thumbnail_id($post_id);
        $thumb_url = wp_get_attachment_image_src($thumb_id, 'medium');
        if (!empty($thumb_url[0])) {
            return $thumb_url[0];
        }
    }
    
    // 尝试从ACF获取logo
    if (function_exists('get_field')) {
        $logo = get_field('logo', $post_id);
        if (!empty($logo)) {
            if (is_array($logo) && isset($logo['url'])) {
                return $logo['url'];
            } elseif (is_string($logo)) {
                return $logo;
            }
        }
    }
    
    return '';
}

/**
 * 获取类别图标
 */
function sosomama_get_category_icon($category) {
    $icons = array(
        '香港国际学校' => '🌍',
        '香港本地中学' => '🎓',
        '香港本地小学' => '📚',
        '香港幼稚园' => '🎨'
    );
    
    return isset($icons[$category]) ? $icons[$category] : '🏫';
}

/**
 * 获取类别归档URL
 */
function sosomama_get_category_archive_url($post_type, $category = '') {
    $url = get_post_type_archive_link($post_type);
    if ($url && !empty($category)) {
        $url = add_query_arg('category', urlencode($category), $url);
    }
    return $url ? $url : home_url();
}

/**
 * 主页样式
 */
function sosomama_homepage_styles() {
    ?>
    <style>
        /* 主容器 */
        .sosomama-homepage {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        /* 区块 */
        .sosomama-section {
            margin-bottom: 60px;
        }
        
        /* 重置所有h标签的默认样式，增强特异性 */
        .sosomama-homepage h1,
        .sosomama-homepage h2,
        .sosomama-homepage h3,
        .sosomama-homepage h4,
        .sosomama-homepage h5,
        .sosomama-homepage h6 {
            margin: 0;
            padding: 0;
            line-height: 1.4;
            font-family: inherit;
        }
        
        /* 区块标题 */
        .sosomama-section-header {
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #4682B4; /* steelblue */
        }
        
        /* 增强特异性：使用更具体的选择器 */
        .sosomama-homepage .sosomama-section h2.sosomama-section-title,
        .sosomama-homepage h2.sosomama-section-title {
            font-size: 1rem !important;
            font-weight: 700 !important;
            color: #4682B4 !important; /* steelblue */
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center;
            gap: 10px;
            line-height: 1.4 !important;
        }
        
        .sosomama-icon {
            font-size: 1.2rem !important;
        }
        
        /* Ranking 类别包装器 - 桌面端并列，一行4组 */
        .sosomama-ranking-categories-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            align-items: flex-start;
        }
        
        /* Ranking 分类组 */
        .sosomama-ranking-category-group {
            flex: 1;
            min-width: calc(25% - 15px); /* 一行4组，减去gap */
            max-width: calc(25% - 15px);
            margin-bottom: 0;
        }
        
        /* 增强特异性 */
        .sosomama-homepage .sosomama-ranking-category-group h3.sosomama-ranking-category-title,
        .sosomama-homepage h3.sosomama-ranking-category-title {
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            color: #2F4F4F !important;
            margin: 0 0 15px 0 !important;
            padding: 10px 0 !important;
            border-bottom: 2px solid #B0C4DE;
            line-height: 1.4 !important;
        }
        
        /* Profile 类别包装器 - 桌面端并列，一行4组 */
        .sosomama-profile-categories-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            align-items: flex-start;
        }
        
        /* 类别组 */
        .sosomama-category-group {
            flex: 1;
            min-width: calc(25% - 15px); /* 一行4组，减去gap */
            max-width: calc(25% - 15px);
            margin-bottom: 0;
        }
        
        /* 增强特异性 */
        .sosomama-homepage .sosomama-category-group h3.sosomama-category-title,
        .sosomama-homepage h3.sosomama-category-title {
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            color: #2F4F4F !important; /* darkslategray */
            margin: 0 0 15px 0 !important;
            padding: 10px 0 !important;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid #B0C4DE; /* lightsteelblue */
            line-height: 1.4 !important;
        }
        
        .sosomama-category-icon {
            font-size: 1.1rem !important;
        }
        
        /* 文章网格 */
        .sosomama-posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }
        
        @media (max-width: 768px) {
            .sosomama-posts-grid {
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 20px;
            }
        }
        
        @media (max-width: 480px) {
            .sosomama-posts-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* 文章卡片 */
        .sosomama-post-card {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(70, 130, 180, 0.15);
            transition: all 0.3s ease;
            border: 1px solid #E0E6ED;
        }
        
        .sosomama-post-card:hover {
            box-shadow: 0 6px 20px rgba(70, 130, 180, 0.25);
            transform: translateY(-4px);
            border-color: #4682B4;
        }
        
        .sosomama-card-link {
            display: block;
            text-decoration: none;
            color: inherit;
        }
        
        /* 图片 */
        .sosomama-card-image {
            width: 100%;
            height: 200px;
            overflow: hidden;
            background: #F5F5F5;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .sosomama-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .sosomama-post-card:hover .sosomama-thumbnail {
            transform: scale(1.05);
        }
        
        /* 内容 */
        .sosomama-card-content {
            padding: 20px;
        }
        
        .sosomama-card-title {
            font-size: 18px;
            font-weight: 600;
            color: #2F4F4F;
            margin: 0 0 10px 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .sosomama-profile-card .sosomama-card-title {
            font-size: 16px;
        }
        
        .sosomama-card-link:hover .sosomama-card-title {
            color: #4682B4;
        }
        
        .sosomama-card-excerpt {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin: 0 0 12px 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .sosomama-card-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            color: #999;
        }
        
        .sosomama-card-date {
            color: #999;
        }
        
        /* 查看更多按钮 */
        .sosomama-view-more {
            text-align: center;
            margin-top: 20px;
        }
        
        .sosomama-view-more-btn {
            display: inline-block;
            padding: 12px 30px;
            background: #4682B4;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s ease;
            border: 2px solid #4682B4;
        }
        
        .sosomama-view-more-btn:hover {
            background: #357ABD;
            border-color: #357ABD;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(70, 130, 180, 0.3);
        }
        
        /* Ranking 列表样式 */
        .sosomama-ranking-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sosomama-ranking-item {
            background: #ffffff;
            border: 1px solid #E0E6ED;
            border-radius: 6px;
            margin-bottom: 8px;
            transition: all 0.3s ease;
        }
        
        .sosomama-ranking-item:hover {
            box-shadow: 0 4px 12px rgba(70, 130, 180, 0.2);
            border-color: #4682B4;
            transform: translateX(4px);
        }
        
        .sosomama-ranking-link {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            text-decoration: none;
            color: inherit;
            gap: 12px;
        }
        
        .sosomama-ranking-number {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            background: #4682B4;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700 !important;
            font-size: 0.8rem !important;
        }
        
        .sosomama-ranking-content {
            flex: 1;
            min-width: 0;
        }
        
        /* 增强特异性：针对h3标题 */
        .sosomama-homepage .sosomama-ranking-item h3.sosomama-ranking-title,
        .sosomama-homepage h3.sosomama-ranking-title {
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            color: #2F4F4F !important;
            margin: 0 0 6px 0 !important;
            padding: 0 !important;
            line-height: 1.4 !important;
        }
        
        .sosomama-ranking-link:hover .sosomama-ranking-title {
            color: #4682B4 !important;
        }
        
        .sosomama-ranking-excerpt {
            font-size: 0.85rem !important;
            color: #666 !important;
            line-height: 1.5 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        
        /* Profile 列表样式（和 ranking 相同） */
        .sosomama-profile-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sosomama-profile-item {
            background: #ffffff;
            border: 1px solid #E0E6ED;
            border-radius: 6px;
            margin-bottom: 8px;
            transition: all 0.3s ease;
        }
        
        .sosomama-profile-item:hover {
            box-shadow: 0 4px 12px rgba(70, 130, 180, 0.2);
            border-color: #4682B4;
            transform: translateX(4px);
        }
        
        .sosomama-profile-link {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            text-decoration: none;
            color: inherit;
            gap: 12px;
        }
        
        .sosomama-profile-number {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            background: #4682B4;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700 !important;
            font-size: 0.8rem !important;
        }
        
        .sosomama-profile-content {
            flex: 1;
            min-width: 0;
        }
        
        /* 增强特异性：针对h4标题 */
        .sosomama-homepage .sosomama-profile-item h4.sosomama-profile-title,
        .sosomama-homepage h4.sosomama-profile-title {
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            color: #2F4F4F !important;
            margin: 0 0 6px 0 !important;
            padding: 0 !important;
            line-height: 1.4 !important;
        }
        
        .sosomama-profile-link:hover .sosomama-profile-title {
            color: #4682B4 !important;
        }
        
        .sosomama-profile-excerpt {
            font-size: 0.85rem !important;
            color: #666 !important;
            line-height: 1.5 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        /* 这个媒体查询已经合并到下面的 @media (max-width: 768px) 中，删除重复 */
        
        /* 响应式调整 */
        @media (max-width: 1024px) {
            /* 平板端：一行2组 */
            .sosomama-ranking-category-group,
            .sosomama-category-group {
                min-width: calc(50% - 10px);
                max-width: calc(50% - 10px);
            }
        }
        
        @media (max-width: 768px) {
            .sosomama-homepage {
                padding: 20px 15px;
            }
            
            .sosomama-section {
                margin-bottom: 40px;
            }
            
            /* 手机端：类别垂直排列 */
            .sosomama-ranking-categories-wrapper,
            .sosomama-profile-categories-wrapper {
                flex-direction: column;
                gap: 25px;
            }
            
            .sosomama-ranking-category-group,
            .sosomama-category-group {
                min-width: 100%;
                max-width: 100%;
                margin-bottom: 25px;
            }
            
            .sosomama-ranking-link,
            .sosomama-profile-link {
                flex-direction: row;
                align-items: center;
                gap: 12px;
                padding: 12px 15px;
            }
            
            .sosomama-ranking-number,
            .sosomama-profile-number {
                width: 28px;
                height: 28px;
                font-size: 0.8rem !important;
                flex-shrink: 0;
            }
            
            .sosomama-ranking-content,
            .sosomama-profile-content {
                flex: 1;
                min-width: 0;
            }
        }
    </style>
    <?php
}

