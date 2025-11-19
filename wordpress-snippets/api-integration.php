
/**
 * School Application Assistant - Vercel 页面 iframe 嵌入方案
 *
 * 使用说明：
 * 1. 按需修改 SCHOOL_APP_WEB_URL，指向你在 Vercel 上的生产网址（保持 https）。
 * 2. 将整个文件复制到 WordPress Code Snippets / functions.php 并启用。
 * 3. 在 WordPress 页面使用短代码：
 *    - [school_app_login] - 登录页面
 *    - [school_app_register] - 注册页面
 *    - [school_app_dashboard] - 申请列表
 *    - [school_app_profile] - 个人资料
 *    - [school_app_templates] - 模板管理（管理员）
 *    - [school_app_users] - 用户管理（管理员）
 *    - [school_app_translations] - 翻译管理（管理员）
 * 4. 所有短代码都支持参数：height（默认 1000px）、path（可覆盖默认路径）。
 * 5. 在 Vercel 端允许被 iframe 嵌入：设置 Content-Security-Policy 中的 frame-ancestors
 *    或在中间件里添加响应头 `X-Frame-Options: ALLOWALL`（按需限制域名）。
 * 6. 登录若依赖 cookie，需要把 auth cookie 设置为 `SameSite=None; Secure`，这样 WordPress
 *    域名下的 iframe 才能携带会话；或者改为 localStorage + postMessage 传 token。
 *
 * iframe 方式的好处是：Vercel 页面更新后，WordPress 里展示的内容自动保持一致。
 */

if (!defined('SCHOOL_APP_WEB_URL')) {
    // 这里替换成你的生产域名，例如 https://school-app.vercel.app
    define('SCHOOL_APP_WEB_URL', 'https://school-application-assistant.vercel.app/');
}

/**
 * 组装 iframe 需要的 URL
 */
function school_app_build_embed_url($path = '/', $query = array()) {
    $base = rtrim(SCHOOL_APP_WEB_URL, '/');
    $relative = '/' . ltrim($path, '/');

    if (empty($query)) {
        return $base . $relative;
    }

    if (is_string($query)) {
        $query_string = ltrim($query, '?&');
    } else {
        $query_string = http_build_query($query);
    }

    return $base . $relative . (strlen($query_string) ? '?' . $query_string : '');
}

/**
 * 通用 iframe 渲染器
 */
function school_app_render_iframe_shortcode($atts = array(), $default_path = '/') {
    $atts = shortcode_atts(
        array(
            'path' => $default_path,
            'height' => '1000px',
            'scrolling' => 'yes',
            'query' => '',
            'container_class' => ''
        ),
        $atts,
        'school_app_iframe'
    );

    $src = school_app_build_embed_url($atts['path'], $atts['query']);

    ob_start();
    ?>
    <div class="school-app-embed-container <?php echo esc_attr($atts['container_class']); ?>" data-path="<?php echo esc_attr($atts['path']); ?>">
        <iframe
            src="<?php echo esc_url($src); ?>"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allow="clipboard-write; fullscreen"
            scrolling="<?php echo esc_attr($atts['scrolling']); ?>"
            style="width: 100%; border: 0; min-height: <?php echo esc_attr($atts['height']); ?>;"
        ></iframe>
        <noscript>
            <p>请开启 JavaScript 以加载申请助手：<a href="<?php echo esc_url($src); ?>" target="_blank" rel="noopener">直接打开</a></p>
        </noscript>
    </div>
    <?php
    return ob_get_clean();
}

// === 短代码 ===
function school_app_login_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/auth/login');
}
add_shortcode('school_app_login', 'school_app_login_shortcode');

function school_app_register_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/auth/register');
}
add_shortcode('school_app_register', 'school_app_register_shortcode');

function school_app_dashboard_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/dashboard');
}
add_shortcode('school_app_dashboard', 'school_app_dashboard_shortcode');

function school_app_profile_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/profile');
}
add_shortcode('school_app_profile', 'school_app_profile_shortcode');

function school_app_templates_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/admin/templates');
}
add_shortcode('school_app_templates', 'school_app_templates_shortcode');

function school_app_users_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/admin/users');
}
add_shortcode('school_app_users', 'school_app_users_shortcode');

function school_app_translations_shortcode($atts = array()) {
    return school_app_render_iframe_shortcode($atts, '/admin/translations');
}
add_shortcode('school_app_translations', 'school_app_translations_shortcode');

/**
 * 注入基础样式 & JS（只负责容器样式，页面 UI 交给 Vercel）
 */
function school_app_enqueue_iframe_assets() {
    ?>
    <style>
        .school-app-embed-container {
            position: relative;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
        }
        .school-app-embed-container iframe {
            display: block;
            width: 100%;
            background: #fff;
            border-radius: 0;
            box-shadow: none;
        }
    </style>
    <script>
        window.addEventListener('message', function(event) {
            if (!event.data || typeof event.data !== 'object') return;
            if (event.data.type !== 'school-app-resize') return;

            var iframes = document.querySelectorAll('.school-app-embed-container iframe');
            iframes.forEach(function(frame) {
                if (frame.contentWindow === event.source) {
                    frame.style.minHeight = (event.data.height || 800) + 'px';
                }
            });
        });
    </script>
    <?php
}
add_action('wp_head', 'school_app_enqueue_iframe_assets');

