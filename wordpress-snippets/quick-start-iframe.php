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
 * 加载样式和脚本
 */
function school_app_enqueue_styles() {
    ?>
    <style>
        .school-app-wrapper {
            width: 100%;
            margin: 20px 0;
            position: relative;
        }
        .school-app-iframe {
            border: none;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: block;
            width: 100%;
        }
    </style>
    <script>
    (function() {
        /**
         * 动态计算并设置iframe高度
         * 高度 = 视口高度 - WordPress导航栏高度 - 其他元素高度
         */
        function setIframeHeight() {
            var iframes = document.querySelectorAll('.school-app-iframe');
            if (iframes.length === 0) return;
            
            // 获取视口高度
            var viewportHeight = window.innerHeight;
            
            // 尝试检测WordPress导航栏高度
            var wpHeader = document.querySelector('header, .site-header, #masthead, .wp-site-blocks > header, nav.main-navigation');
            var wpHeaderHeight = 0;
            if (wpHeader) {
                var headerRect = wpHeader.getBoundingClientRect();
                wpHeaderHeight = headerRect.height;
            }
            
            // 尝试检测其他可能占用空间的元素（如面包屑、标题等）
            var contentOffset = 0;
            var wrapper = document.querySelector('.school-app-wrapper');
            if (wrapper) {
                // 获取wrapper距离视口顶部的距离
                var wrapperRect = wrapper.getBoundingClientRect();
                contentOffset = wrapperRect.top;
            }
            
            // 计算可用高度（减去导航栏、padding等）
            // 预留一些空间给margin和padding
            var availableHeight = viewportHeight - contentOffset - 40; // 40px为margin预留
            
            // 确保最小高度
            var minHeight = 600;
            var calculatedHeight = Math.max(availableHeight, minHeight);
            
            // 设置所有iframe的高度
            iframes.forEach(function(iframe) {
                iframe.style.height = calculatedHeight + 'px';
            });
        }
        
        // 页面加载完成后设置高度
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setIframeHeight);
        } else {
            setIframeHeight();
        }
        
        // 监听窗口大小变化
        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setIframeHeight, 100);
        });
        
        // 监听滚动（某些主题的导航栏可能是固定的）
        window.addEventListener('scroll', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setIframeHeight, 100);
        });
        
        // 延迟执行一次，确保所有元素都已渲染
        setTimeout(setIframeHeight, 500);
    })();
    </script>
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

