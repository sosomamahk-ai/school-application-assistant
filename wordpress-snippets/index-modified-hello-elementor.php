<?php
/**
 * The site's entry point.
 *
 * Loads the relevant template part,
 * the loop is executed (when needed) by the relevant template part.
 *
 * @package HelloElementor
 * 
 * Modified: 添加了首页自定义设计
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

get_header();

$is_elementor_theme_exist = function_exists( 'elementor_theme_do_location' );

// === 首页自定义处理开始 ===
if ( is_front_page() || is_home() ) {
    // 检查是否使用 Elementor 主题位置
    if ( $is_elementor_theme_exist && elementor_theme_do_location( 'archive' ) ) {
        // 如果 Elementor 处理了首页，则不使用自定义代码
        // Elementor 会处理，这里什么都不做
    } else {
        // 不使用 Elementor 时，使用自定义首页设计
        
        // ====================================================================
        // ========== 首页 Section 配置区域（集中管理所有参数） ==========
        // ====================================================================
        
        // 初始化 sections 配置数组
        $sections_config = array();
        
        // 通用的 taxonomy slug 到类别名称映射（用于 ranking 和 summer-school）
        $common_slug_to_category_map = array(
            'hk-intl' => '香港国际学校',
            'local-sec' => '香港本地中学',
            'local-pri' => '香港本地小学',
            'hk-kg' => '香港幼稚园'
        );
        
        // Profile section 使用的 taxonomy slug 映射
        $profile_slug_to_category_map = array(
            'hk-is-template' => '香港国际学校',
            'hk-ls-template' => '香港本地中学',
            'hk-ls-primary-template' => '香港本地小学',
            'hk-kg-template' => '香港幼稚园'
        );
        
        // ====================================================================
        // Section 1: 排行榜 (Ranking)
        // ====================================================================
        $sections_config['ranking'] = array(
            'show' => get_option('sosomama_show_ranking', true),              // 是否显示此 section
            'post_type_key' => 'ranking',                                     // Custom Post Type Key
            'post_type_name' => '排行榜',                                      // Custom Post Type Name (显示名称)
            'taxonomy' => 'related-profile-type',                             // 分类采用的 Taxonomy
            'taxonomy_slugs' => $common_slug_to_category_map,                 // Taxonomy 项的 Slug 映射
            'display_posts_number' => max(intval(get_option('sosomama_ranking_posts_count', 50)), 50), // 获取的文章总数
            'posts_per_category' => 6,                                        // 每个类别显示的文章数量
            'icon' => '📊',                                                    // Section 图标
            'subtitle' => '最新・最受家长关注的学校排行',                      // Section 副标题
            'show_category_icon' => false,                                    // 是否显示类别图标
            'archive_url' => 'https://sosomama.com/ranking-archive/'          // Section 大标题链接
        );
        
        // ====================================================================
        // Section 2: 学校资料 (Profile)
        // ====================================================================
        // Profile section 的类别链接映射
        $profile_category_url_map = array(
            '香港国际学校' => 'https://sosomama.com/profile_type/hk-is-template/',
            '香港本地中学' => 'https://sosomama.com/profile_type/hk-ls-template/',
            '香港本地小学' => 'https://sosomama.com/profile_type/hk-ls-primary-template/',
            '香港幼稚园' => 'https://sosomama.com/profile_type/hk-kg-template/'
        );
        
        $sections_config['profile'] = array(
            'show' => get_option('sosomama_show_profile', true),              // 是否显示此 section
            'post_type_key' => 'profile',                                     // Custom Post Type Key
            'post_type_name' => '学校资料',                                    // Custom Post Type Name (显示名称)
            'taxonomy' => 'profile_type',                                      // 分类采用的 Taxonomy
            'taxonomy_slugs' => $profile_slug_to_category_map,                 // Taxonomy 项的 Slug 映射
            'display_posts_number' => intval(get_option('sosomama_profile_posts_count', 12)), // 获取的文章总数
            'posts_per_category' => 10,                                       // 每个类别显示的文章数量
            'icon' => '🏫',                                                    // Section 图标
            'subtitle' => '为你整理各类学校的最新信息',                         // Section 副标题
            'show_category_icon' => true,                                     // 是否显示类别图标
            'archive_url' => 'https://sosomama.com/profiles-archive/',        // Section 大标题链接
            'category_url_map' => $profile_category_url_map                   // 类别小标题链接映射
        );
        
        // ====================================================================
        // Section 3: 暑期学校 (Summer School)
        // ====================================================================
        $sections_config['summer_school'] = array(
            'show' => get_option('sosomama_show_summer_school', true),        // 是否显示此 section
            'post_type_key' => 'summer-school',                                // Custom Post Type Key
            'post_type_name' => '暑期学校',                                    // Custom Post Type Name (显示名称)
            'taxonomy' => 'related-profile-type',                             // 分类采用的 Taxonomy
            'taxonomy_slugs' => $common_slug_to_category_map,                 // Taxonomy 项的 Slug 映射
            'display_posts_number' => max(intval(get_option('sosomama_summer_school_posts_count', 50)), 50), // 获取的文章总数
            'posts_per_category' => 5,                                        // 每个类别显示的文章数量
            'icon' => '☀️',                                                    // Section 图标
            'subtitle' => '精选暑期学校项目推荐',                              // Section 副标题
            'show_category_icon' => false,                                    // 是否显示类别图标
            'archive_url' => 'https://sosomama.com/summer-school-archive/'    // Section 大标题链接
        );
        
        // ====================================================================
        // 添加新 Section 示例（复制下面的代码块并修改参数）
        // ====================================================================
        /*
        $sections_config['new_section'] = array(
            'show' => true,                                                   // 是否显示此 section
            'post_type_key' => 'your-post-type',                              // Custom Post Type Key
            'post_type_name' => '新Section名称',                               // Custom Post Type Name (显示名称)
            'taxonomy' => 'your-taxonomy',                                    // 分类采用的 Taxonomy
            'taxonomy_slugs' => array(                                         // Taxonomy 项的 Slug 映射
                'slug1' => '类别1',
                'slug2' => '类别2',
                'slug3' => '类别3',
                'slug4' => '类别4'
            ),
            'display_posts_number' => 50,                                     // 获取的文章总数
            'posts_per_category' => 5,                                        // 每个类别显示的文章数量
            'icon' => '🎯',                                                    // Section 图标
            'subtitle' => 'Section 副标题',                                    // Section 副标题
            'show_category_icon' => false                                     // 是否显示类别图标
        );
        */
        
        // ====================================================================
        // ========== 配置区域结束 ==========
        // ====================================================================
        
        // 定义必要的辅助函数（如果不在 functions.php 中）
        if (!function_exists('sosomama_get_cpt_posts')) {
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
        }
        
        if (!function_exists('sosomama_get_profile_by_slug')) {
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
        }
        
        if (!function_exists('sosomama_get_post_category_slug')) {
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
        }
        
        // 通用的按taxonomy分组函数（参数化版本）
        if (!function_exists('sosomama_group_posts_by_taxonomy')) {
            function sosomama_group_posts_by_taxonomy($posts, $taxonomy, $slug_to_category_map, $posts_per_category = 5, $keep_empty_categories = false) {
                $grouped = array();
                
                // 初始化每个类别的数组
                foreach ($slug_to_category_map as $slug => $category_name) {
                    $grouped[$category_name] = array();
                }
                
                // 添加"未分类"类别
                $grouped['未分类'] = array();
                
                // 如果 taxonomy 不存在，尝试查找可用的 taxonomy
                $actual_taxonomy = $taxonomy;
                if (!taxonomy_exists($taxonomy)) {
                    // 尝试查找文章类型相关的 taxonomy
                    if (!empty($posts)) {
                        $sample_post = $posts[0];
                        $taxonomies = get_object_taxonomies($sample_post->post_type);
                        // 优先尝试 profile_type 或 school_category
                        if (in_array('profile_type', $taxonomies)) {
                            $actual_taxonomy = 'profile_type';
                        } elseif (in_array('school_category', $taxonomies)) {
                            $actual_taxonomy = 'school_category';
                        } elseif (!empty($taxonomies)) {
                            // 使用第一个找到的 taxonomy
                            $actual_taxonomy = $taxonomies[0];
                        }
                    }
                }
                
                // 创建一个反向映射，用于灵活匹配（将 slug 的关键部分提取出来）
                $flexible_slug_map = array();
                foreach ($slug_to_category_map as $slug => $category_name) {
                    // 提取关键部分（移除 '-template', '-intl' 等后缀）
                    $key_parts = preg_split('/[-_]/', $slug);
                    // 保留主要的标识符（如 'hk', 'intl', 'ls', 'primary', 'kg'）
                    $flexible_slug_map[$category_name] = array(
                        'exact' => $slug,
                        'parts' => $key_parts
                    );
                }
                
                foreach ($posts as $post) {
                    $category_name = '未分类';
                    $found_category = false;
                    
                    // 从指定的 taxonomy 获取（使用 slug）
                    $terms = get_the_terms($post->ID, $actual_taxonomy);
                    if (!empty($terms) && !is_wp_error($terms)) {
                        // 遍历所有 terms，查找匹配的 slug
                        foreach ($terms as $term) {
                            $term_slug = $term->slug;
                            
                            // 1. 直接匹配 slug
                            if (isset($slug_to_category_map[$term_slug])) {
                                $category_name = $slug_to_category_map[$term_slug];
                                $found_category = true;
                                break;
                            }
                            
                            // 2. 尝试灵活的匹配（匹配关键部分）
                            $term_parts = preg_split('/[-_]/', $term_slug);
                            foreach ($flexible_slug_map as $cat_name => $slug_info) {
                                // 检查是否有足够的关键部分匹配
                                $matching_parts = 0;
                                foreach ($term_parts as $term_part) {
                                    if (in_array($term_part, $slug_info['parts'])) {
                                        $matching_parts++;
                                    }
                                }
                                // 如果匹配的关键部分数量 >= 2，认为匹配成功
                                if ($matching_parts >= 2) {
                                    $category_name = $cat_name;
                                    $found_category = true;
                                    break 2; // 跳出两层循环
                                }
                            }
                            
                            // 3. 尝试部分匹配（字符串包含）
                            if (!$found_category) {
                                foreach ($slug_to_category_map as $config_slug => $cat_name) {
                                    // 如果 term slug 包含配置 slug，或者配置 slug 包含 term slug
                                    if (strpos($term_slug, $config_slug) !== false || strpos($config_slug, $term_slug) !== false) {
                                        $category_name = $cat_name;
                                        $found_category = true;
                                        break 2; // 跳出两层循环
                                    }
                                }
                            }
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
                
                // 移除空的类别（除非设置了 keep_empty_categories）
                if (!$keep_empty_categories) {
                    foreach ($grouped as $category_name => $posts) {
                        if (empty($posts)) {
                            unset($grouped[$category_name]);
                        }
                    }
                }
                
                return $grouped;
            }
        }
        
        // 保留旧函数以保持兼容性
        if (!function_exists('sosomama_group_ranking_by_category')) {
            function sosomama_group_ranking_by_category($ranking_posts, $posts_per_category = 5) {
                $slug_to_category_map = array(
                    'hk-intl' => '香港国际学校',
                    'local-sec' => '香港本地中学',
                    'local-pri' => '香港本地小学',
                    'hk-kg' => '香港幼稚园'
                );
                return sosomama_group_posts_by_taxonomy($ranking_posts, 'related-profile-type', $slug_to_category_map, $posts_per_category);
            }
        }
        
        if (!function_exists('sosomama_get_category_icon')) {
            function sosomama_get_category_icon($category) {
                $icons = array(
                    '香港国际学校' => '🌍',
                    '香港本地中学' => '🎓',
                    '香港本地小学' => '📚',
                    '香港幼稚园' => '🎨'
                );
                
                return isset($icons[$category]) ? $icons[$category] : '🏫';
            }
        }
        
        // 通用的section渲染函数（统一参数化）
        if (!function_exists('sosomama_render_category_section')) {
            function sosomama_render_category_section($section_config) {
                // 检查是否显示
                if (isset($section_config['show']) && !$section_config['show']) {
                    return;
                }
                
                // 获取参数
                $post_type_key = $section_config['post_type_key'];              // custom post type key
                $post_type_name = $section_config['post_type_name'];           // custom post type name (显示名称)
                $taxonomy = $section_config['taxonomy'];                        // taxonomy
                $taxonomy_slugs = $section_config['taxonomy_slugs'];            // slug of the taxonomy items
                $display_posts_number = $section_config['display_posts_number']; // display posts number
                $posts_per_category = isset($section_config['posts_per_category']) ? $section_config['posts_per_category'] : 5;
                
                // Profile section 使用特殊逻辑（按原本的方式，直接通过 tax_query 获取）
                if ($post_type_key === 'profile' && function_exists('sosomama_get_profile_by_slug')) {
                    $grouped_posts = array();
                    foreach ($taxonomy_slugs as $slug => $category_name) {
                        $posts = sosomama_get_profile_by_slug($slug, $posts_per_category);
                        if (!empty($posts)) {
                            $grouped_posts[$category_name] = $posts;
                        }
                    }
                } else {
                    // 其他 section 使用通用逻辑
                    // 获取文章
                    $posts = sosomama_get_cpt_posts($post_type_key, $display_posts_number);
                    
                    if (empty($posts)) {
                        return;
                    }
                    
                    // 处理 taxonomy
                    $actual_taxonomy = $taxonomy;
                    if (!taxonomy_exists($taxonomy)) {
                        // 尝试备用 taxonomy
                        if (taxonomy_exists('school_category')) {
                            $actual_taxonomy = 'school_category';
                        } elseif (taxonomy_exists('profile_type')) {
                            $actual_taxonomy = 'profile_type';
                        }
                    }
                    
                    // 按taxonomy分组
                    $grouped_posts = sosomama_group_posts_by_taxonomy($posts, $actual_taxonomy, $taxonomy_slugs, $posts_per_category, false);
                }
                
                if (empty($grouped_posts)) {
                    return;
                }
                
                // 渲染HTML
                $archive_url = isset($section_config['archive_url']) ? $section_config['archive_url'] : '';
                ?>
                <section class="sosomama-block">
                    <div class="sosomama-block-header">
                        <div class="sosomama-block-title">
                            <span class="icon"><?php echo esc_html($section_config['icon']); ?></span>
                            <?php if (!empty($archive_url)): ?>
                            <h2><a href="<?php echo esc_url($archive_url); ?>" class="section-title-link"><?php echo esc_html($post_type_name); ?></a></h2>
                            <?php else: ?>
                            <h2><?php echo esc_html($post_type_name); ?></h2>
                            <?php endif; ?>
                        </div>
                        <?php if (!empty($section_config['subtitle'])): ?>
                        <div class="sosomama-block-subtitle"><?php echo esc_html($section_config['subtitle']); ?></div>
                        <?php endif; ?>
                    </div>
                    <div class="grid-4">
                        <?php foreach ($grouped_posts as $category_name => $category_posts): ?>
                        <?php 
                        // 跳过"未分类"类别，只显示配置的类别
                        if ($category_name === '未分类') {
                            continue;
                        }
                        // 确保是配置的类别
                        $is_configured = false;
                        foreach ($taxonomy_slugs as $slug => $cat_name) {
                            if ($cat_name === $category_name) {
                                $is_configured = true;
                                break;
                            }
                        }
                        if (!$is_configured) {
                            continue;
                        }
                        ?>
                        <div class="card-group">
                            <h4 class="card-group-title">
                                <?php
                                // 检查是否有类别链接映射（仅用于学校资料）
                                $category_url = '';
                                if (isset($section_config['category_url_map']) && isset($section_config['category_url_map'][$category_name])) {
                                    $category_url = $section_config['category_url_map'][$category_name];
                                }
                                ?>
                                <?php if (!empty($category_url)): ?>
                                    <a href="<?php echo esc_url($category_url); ?>" class="category-title-link">
                                        <?php if (isset($section_config['show_category_icon']) && $section_config['show_category_icon'] && function_exists('sosomama_get_category_icon')): ?>
                                            <?php echo sosomama_get_category_icon($category_name); ?>
                                        <?php endif; ?>
                                        <?php echo esc_html($category_name); ?>
                                    </a>
                                <?php else: ?>
                                    <?php if (isset($section_config['show_category_icon']) && $section_config['show_category_icon'] && function_exists('sosomama_get_category_icon')): ?>
                                        <?php echo sosomama_get_category_icon($category_name); ?>
                                    <?php endif; ?>
                                    <?php echo esc_html($category_name); ?>
                                <?php endif; ?>
                            </h4>
                            <ul class="ranking-list">
                                <?php foreach (array_slice($category_posts, 0, $posts_per_category) as $index => $post): ?>
                                <li>
                                    <a href="<?php echo esc_url(get_permalink($post->ID)); ?>" class="list-item">
                                        <div class="number"><?php echo $index + 1; ?></div>
                                        <div class="info">
                                            <div class="title"><?php echo esc_html($post->post_title); ?></div>
                                            <?php if ($post->post_excerpt): ?>
                                            <div class="excerpt">
                                                <?php echo wp_trim_words($post->post_excerpt, 15); ?>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                    </a>
                                </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </section>
                <?php
            }
        }
        
        // 检查函数是否存在后执行
        if (function_exists('sosomama_get_cpt_posts')) {
        ?>
        
            <div class="sosomama-homepage">
                
                <?php
                // ====================================================================
                // Section 渲染区域（按配置顺序渲染）
                // ====================================================================
                
                // Section 1: 排行榜
                if (isset($sections_config['ranking'])) {
                    sosomama_render_category_section($sections_config['ranking']);
                }
                
                // Section 2: 学校资料
                if (isset($sections_config['profile'])) {
                    sosomama_render_category_section($sections_config['profile']);
                }
                
                // Section 3: 暑期学校
                if (isset($sections_config['summer_school'])) {
                    sosomama_render_category_section($sections_config['summer_school']);
                }
                
                // ====================================================================
                // 添加新 Section 渲染（复制下面的代码块）
                // ====================================================================
                /*
                if (isset($sections_config['new_section'])) {
                    sosomama_render_category_section($sections_config['new_section']);
                }
                */
                ?>
                
            </div>
            
            <?php
            // 内嵌样式（不依赖外部函数）
            ?>
            <style>
                /* ---- 全局容器 ---- */
                .sosomama-homepage {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    font-family: "Inter", -apple-system, BlinkMacSystemFont, Arial, sans-serif;
                    color: #1a1a1a;
                }
                
                /* ---- 模块块状区域 ---- */
                .sosomama-block {
                    margin-bottom: 70px;
                }
                
                /* ---- 标题区 ---- */
                .sosomama-block-header {
                    margin-bottom: 30px;
                }
                
                .sosomama-block-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .sosomama-block-title h2 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #4682B4; /* steelblue */
                    margin: 0;
                }
                
                .sosomama-block-title h2 .section-title-link {
                    color: #4682B4; /* steelblue */
                    text-decoration: none;
                    transition: color .25s ease;
                }
                
                .sosomama-block-title h2 .section-title-link:hover {
                    color: #CC9955; /* goldenrod */
                }
                
                .sosomama-block-title .icon {
                    font-size: 1.6rem;
                }
                
                .sosomama-block-subtitle {
                    margin-top: 6px;
                    font-size: 0.95rem;
                    color: #708090; /* slategray */
                }
                
                /* ---- 4 栏网格 ---- */
                .grid-4 {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 25px;
                }
                
                @media(max-width: 1024px){
                    .grid-4 {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media(max-width: 768px){
                    .grid-4 {
                        grid-template-columns: 1fr;
                    }
                }
                
                /* ---- 卡片组 ---- */
                .card-group {
                    background: #fff;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e5e8ef;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.05);
                }
                
                .card-group-title {
                    font-size: 1rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                    padding-left: 12px;
                    border-left: 4px solid #4682B4; /* steelblue */
                    color: #2F4F4F; /* darkslategray */
                }
                
                .card-group-title .category-title-link {
                    color: #4682B4; /* steelblue */
                    text-decoration: none;
                    transition: color .25s ease;
                }
                
                .card-group-title .category-title-link:hover {
                    color: #CC9955; /* steelblue */
                }
                
                /* ---- 列表条目 ---- */
                .ranking-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                
                .list-item {
                    display: flex;
                    gap: 12px;
                    padding: 14px 10px;
                    border-radius: 8px;
                    text-decoration: none;
                    border: 1px solid transparent;
                    color: inherit;
                    transition: all .25s ease;
                }
                
                .list-item:hover {
                    background: #F0F8FF; /* aliceblue */
                    border-color: #87CEEB; /* skyblue */
                    box-shadow: 0 4px 12px rgba(70,130,180,0.2); /* steelblue with opacity */
                }
                
                /* ---- 每条的序号 ---- */
                .number {
                    width: 22px;
                    height: 22px;
                    background: #4682B4; /* steelblue */
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-weight: 700;
                    border-radius: 10px;
                    flex-shrink: 0;
                }
                
                /* ---- 标题 ---- */
                .title {
                    font-weight: 600;
                    color: #2F4F4F; /* darkslategray */
                    font-size: 0.95rem;
                }
                
                .list-item:hover .title {
                    color: #4682B4; /* steelblue */
                }
                
                .excerpt {
                    margin-top: 4px;
                    font-size: 0.82rem;
                    color: #555;
                    line-height: 1.4;
                    max-height: 34px;
                    overflow: hidden;
                }
            </style>
            <?php
        } else {
            // 如果函数不存在，回退到原有的 archive 模板
            get_template_part( 'template-parts/archive' );
        }
    }
}
// === 首页自定义处理结束 ===
// 以下保持原有逻辑，用于其他页面
elseif ( is_singular() ) {
	if ( ! $is_elementor_theme_exist || ! elementor_theme_do_location( 'single' ) ) {
		get_template_part( 'template-parts/single' );
	}
} elseif ( is_archive() ) {
	if ( ! $is_elementor_theme_exist || ! elementor_theme_do_location( 'archive' ) ) {
		get_template_part( 'template-parts/archive' );
	}
} elseif ( is_search() ) {
	if ( ! $is_elementor_theme_exist || ! elementor_theme_do_location( 'archive' ) ) {
		get_template_part( 'template-parts/search' );
	}
} else {
	if ( ! $is_elementor_theme_exist || ! elementor_theme_do_location( 'single' ) ) {
		get_template_part( 'template-parts/404' );
	}
}

get_footer();

