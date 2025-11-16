<?php
/**
 * School Application Assistant - Quick Start (iframe 方式)
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 将 YOUR_APP_URL 替换为您的应用 URL（部署后的 Vercel URL）
 * 3. 激活代码片段
 * 4. 在 Elementor 页面中使用短代码: [school_app]
 * 
 * 短代码使用示例：
 * [school_app] - 显示 Dashboard
 * [school_app page="profile"] - 显示用户资料
 * [school_app page="auth/login" height="600px"] - 显示登录页面
 */

// ====== 配置区域 ======
define('SCHOOL_APP_URL', 'YOUR_APP_URL'); // 例如: https://your-app.vercel.app

/**
 * 短代码：显示应用页面
 */
function school_application_assistant_shortcode($atts) {
    // 短代码参数
    $atts = shortcode_atts(array(
        'page' => 'dashboard',
        'height' => '800px',
        'width' => '100%'
    ), $atts);
    
    $page = esc_attr($atts['page']);
    $height = esc_attr($atts['height']);
    $width = esc_attr($atts['width']);
    
    // 构建 URL
    $app_url = SCHOOL_APP_URL . '/' . $page;
    
    // 如果 WordPress 用户已登录，传递用户信息
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $params = array(
            'wp_email' => $current_user->user_email,
            'wp_name' => $current_user->display_name,
            'wp_id' => $current_user->ID
        );
        $app_url .= '?' . http_build_query($params);
    }
    
    // 生成 iframe HTML
    $html = sprintf(
        '<div class="school-app-wrapper">
            <iframe 
                src="%s" 
                width="%s" 
                height="%s" 
                frameborder="0"
                class="school-app-iframe"
                allow="clipboard-write"
                loading="lazy"
            ></iframe>
        </div>',
        esc_url($app_url),
        $width,
        $height
    );
    
    return $html;
}
add_shortcode('school_app', 'school_application_assistant_shortcode');

/**
 * 加载样式
 */
function school_app_enqueue_styles() {
    ?>
    <style>
        .school-app-wrapper {
            width: 100%;
            margin: 20px 0;
        }
        .school-app-iframe {
            border: none;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: block;
        }
        /* 响应式设计 */
        @media (max-width: 768px) {
            .school-app-iframe {
                height: 600px !important;
            }
        }
    </style>
    <?php
}
add_action('wp_head', 'school_app_enqueue_styles');

/**
 * 在页面菜单中添加应用链接（可选）
 */
function school_app_add_menu_items($items, $args) {
    // 只在主菜单中添加
    if ($args->theme_location == 'primary') {
        $items .= '<li class="menu-item"><a href="/applications">申请助手</a></li>';
    }
    return $items;
}
// 取消下面的注释以启用菜单项
// add_filter('wp_nav_menu_items', 'school_app_add_menu_items', 10, 2);

?>

