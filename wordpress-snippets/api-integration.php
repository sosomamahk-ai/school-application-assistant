<?php
/**
 * School Application Assistant - API Integration (完整集成方式)
 * 
 * 使用说明：
 * 1. 将此代码复制到 WordPress Code Snippets 插件
 * 2. 修改 SCHOOL_APP_API_URL 为您的 API URL
 * 3. 激活代码片段
 * 4. 使用提供的短代码和函数
 * 
 * 可用短代码：
 * [school_app_dashboard] - 显示申请列表
 * [school_app_login] - 显示登录表单
 * [school_app_register] - 显示注册表单
 * [school_app_profile] - 显示资料编辑
 * [school_app_templates] - 显示学校模板列表
 */

// ====== 配置区域 ======
define('SCHOOL_APP_API_URL', 'YOUR_API_URL'); // 例如: https://your-api.vercel.app

/**
 * API 客户端类
 */
class SchoolApplicationAPI {
    private $api_url;
    
    public function __construct() {
        $this->api_url = SCHOOL_APP_API_URL;
    }
    
    /**
     * 发送 API 请求
     */
    private function request($endpoint, $method = 'GET', $data = null, $token = null) {
        $url = $this->api_url . $endpoint;
        
        $args = array(
            'method' => $method,
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30
        );
        
        if ($token) {
            $args['headers']['Authorization'] = 'Bearer ' . $token;
        }
        
        if ($data && in_array($method, array('POST', 'PUT'))) {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($code >= 400) {
            return array('error' => $data['error'] ?? 'Request failed');
        }
        
        return $data;
    }
    
    // 认证相关
    public function register($email, $password, $fullName) {
        return $this->request('/api/auth/register', 'POST', compact('email', 'password', 'fullName'));
    }
    
    public function login($email, $password) {
        return $this->request('/api/auth/login', 'POST', compact('email', 'password'));
    }
    
    // 用户资料
    public function getProfile($token) {
        return $this->request('/api/profile', 'GET', null, $token);
    }
    
    public function updateProfile($token, $profileData) {
        return $this->request('/api/profile', 'PUT', $profileData, $token);
    }
    
    // 学校模板
    public function getTemplates() {
        return $this->request('/api/templates', 'GET');
    }
    
    public function getTemplate($templateId) {
        return $this->request("/api/templates/{$templateId}", 'GET');
    }
    
    // 申请管理
    public function getApplications($token) {
        return $this->request('/api/applications', 'GET', null, $token);
    }
    
    public function createApplication($token, $templateId) {
        return $this->request('/api/applications', 'POST', compact('templateId'), $token);
    }
    
    public function getApplication($token, $applicationId) {
        return $this->request("/api/applications/{$applicationId}", 'GET', null, $token);
    }
    
    public function updateApplication($token, $applicationId, $formData, $status = null) {
        $data = array('formData' => $formData);
        if ($status) $data['status'] = $status;
        return $this->request("/api/applications/{$applicationId}", 'PUT', $data, $token);
    }
    
    // AI 功能
    public function getFieldGuidance($token, $field) {
        return $this->request('/api/ai/field-guidance', 'POST', compact('field'), $token);
    }
    
    public function generateEssay($token, $field, $additionalPrompt = null) {
        return $this->request('/api/ai/generate-essay', 'POST', compact('field', 'additionalPrompt'), $token);
    }
    
    public function autoFill($token, $fields) {
        return $this->request('/api/ai/auto-fill', 'POST', compact('fields'), $token);
    }
}

// 创建全局实例
global $school_app_api;
$school_app_api = new SchoolApplicationAPI();

/**
 * 获取当前用户的 Token
 */
function school_app_get_token() {
    return isset($_COOKIE['school_app_token']) ? $_COOKIE['school_app_token'] : null;
}

/**
 * 短代码：登录表单
 */
function school_app_login_shortcode() {
    ob_start();
    ?>
    <div class="school-app-login">
        <form id="school-app-login-form" class="app-form">
            <h2>登录申请助手</h2>
            
            <div class="form-group">
                <label for="login-email">邮箱地址</label>
                <input type="email" id="login-email" name="email" required class="form-control">
            </div>
            
            <div class="form-group">
                <label for="login-password">密码</label>
                <input type="password" id="login-password" name="password" required class="form-control">
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">登录</button>
            
            <div id="login-message" class="message"></div>
            
            <p class="form-footer">
                还没有账户？<a href="/register">立即注册</a>
            </p>
        </form>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#school-app-login-form').on('submit', function(e) {
            e.preventDefault();
            
            var $form = $(this);
            var $btn = $form.find('button[type="submit"]');
            var $message = $('#login-message');
            
            $btn.prop('disabled', true).text('登录中...');
            $message.html('');
            
            var formData = {
                email: $('#login-email').val(),
                password: $('#login-password').val()
            };
            
            $.ajax({
                url: '<?php echo SCHOOL_APP_API_URL; ?>/api/auth/login',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        // 保存 token
                        document.cookie = 'school_app_token=' + response.token + '; path=/; max-age=604800';
                        
                        $message.html('<p class="success">登录成功！正在跳转...</p>');
                        
                        // 跳转到 dashboard
                        setTimeout(function() {
                            window.location.href = '/applications';
                        }, 1000);
                    }
                },
                error: function(xhr) {
                    var error = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : '登录失败，请重试';
                    $message.html('<p class="error">' + error + '</p>');
                    $btn.prop('disabled', false).text('登录');
                }
            });
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('school_app_login', 'school_app_login_shortcode');

/**
 * 短代码：注册表单
 */
function school_app_register_shortcode() {
    ob_start();
    ?>
    <div class="school-app-register">
        <form id="school-app-register-form" class="app-form">
            <h2>注册账户</h2>
            
            <div class="form-group">
                <label for="register-name">姓名</label>
                <input type="text" id="register-name" name="fullName" required class="form-control">
            </div>
            
            <div class="form-group">
                <label for="register-email">邮箱地址</label>
                <input type="email" id="register-email" name="email" required class="form-control">
            </div>
            
            <div class="form-group">
                <label for="register-password">密码</label>
                <input type="password" id="register-password" name="password" required class="form-control" minlength="6">
                <small>至少 6 个字符</small>
            </div>
            
            <div class="form-group">
                <label for="register-confirm">确认密码</label>
                <input type="password" id="register-confirm" name="confirmPassword" required class="form-control">
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">注册</button>
            
            <div id="register-message" class="message"></div>
            
            <p class="form-footer">
                已有账户？<a href="/login">立即登录</a>
            </p>
        </form>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#school-app-register-form').on('submit', function(e) {
            e.preventDefault();
            
            var password = $('#register-password').val();
            var confirm = $('#register-confirm').val();
            var $message = $('#register-message');
            
            if (password !== confirm) {
                $message.html('<p class="error">两次输入的密码不一致</p>');
                return;
            }
            
            var $btn = $(this).find('button[type="submit"]');
            $btn.prop('disabled', true).text('注册中...');
            $message.html('');
            
            var formData = {
                fullName: $('#register-name').val(),
                email: $('#register-email').val(),
                password: password
            };
            
            $.ajax({
                url: '<?php echo SCHOOL_APP_API_URL; ?>/api/auth/register',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        document.cookie = 'school_app_token=' + response.token + '; path=/; max-age=604800';
                        $message.html('<p class="success">注册成功！正在跳转...</p>');
                        setTimeout(function() {
                            window.location.href = '/profile';
                        }, 1000);
                    }
                },
                error: function(xhr) {
                    var error = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : '注册失败，请重试';
                    $message.html('<p class="error">' + error + '</p>');
                    $btn.prop('disabled', false).text('注册');
                }
            });
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('school_app_register', 'school_app_register_shortcode');

/**
 * 短代码：申请列表 Dashboard
 */
function school_app_dashboard_shortcode() {
    global $school_app_api;
    
    $token = school_app_get_token();
    
    if (!$token) {
        return '<div class="school-app-notice"><p>请先<a href="/login">登录</a>以查看您的申请</p></div>';
    }
    
    $applications = $school_app_api->getApplications($token);
    
    if (isset($applications['error'])) {
        return '<div class="school-app-error"><p>加载失败：' . esc_html($applications['error']) . '</p></div>';
    }
    
    $apps = $applications['applications'] ?? array();
    
    ob_start();
    ?>
    <div class="school-app-dashboard">
        <div class="dashboard-header">
            <h2>我的申请</h2>
            <a href="/create-application" class="btn btn-primary">创建新申请</a>
        </div>
        
        <?php if (empty($apps)): ?>
            <div class="no-applications">
                <div class="empty-state">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <h3>还没有申请</h3>
                    <p>创建您的第一个申请，开始申请之旅</p>
                    <a href="/create-application" class="btn btn-primary">创建申请</a>
                </div>
            </div>
        <?php else: ?>
            <div class="applications-grid">
                <?php foreach ($apps as $app): ?>
                    <div class="application-card">
                        <div class="card-header">
                            <span class="status-badge status-<?php echo esc_attr($app['status']); ?>">
                                <?php 
                                $status_text = array(
                                    'draft' => '草稿',
                                    'in_progress' => '进行中',
                                    'submitted' => '已提交'
                                );
                                echo esc_html($status_text[$app['status']] ?? $app['status']);
                                ?>
                            </span>
                        </div>
                        
                        <h3 class="school-name"><?php echo esc_html($app['schoolName']); ?></h3>
                        <p class="program-name"><?php echo esc_html($app['program']); ?></p>
                        
                        <div class="card-meta">
                            <span class="update-time">
                                更新于 <?php echo date('Y年m月d日', strtotime($app['updatedAt'])); ?>
                            </span>
                        </div>
                        
                        <div class="card-footer">
                            <a href="/application?id=<?php echo esc_attr($app['id']); ?>" class="btn btn-secondary btn-block">
                                <?php echo $app['status'] === 'submitted' ? '查看申请' : '继续填写'; ?>
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('school_app_dashboard', 'school_app_dashboard_shortcode');

/**
 * 短代码：学校模板列表
 */
function school_app_templates_shortcode() {
    global $school_app_api;
    
    $token = school_app_get_token();
    
    if (!$token) {
        return '<div class="school-app-notice"><p>请先<a href="/login">登录</a>以创建申请</p></div>';
    }
    
    $result = $school_app_api->getTemplates();
    
    if (isset($result['error'])) {
        return '<div class="school-app-error"><p>加载失败：' . esc_html($result['error']) . '</p></div>';
    }
    
    $templates = $result['templates'] ?? array();
    
    ob_start();
    ?>
    <div class="school-app-templates">
        <h2>选择学校</h2>
        <p class="subtitle">选择一个学校开始您的申请</p>
        
        <div class="templates-grid">
            <?php foreach ($templates as $template): ?>
                <div class="template-card">
                    <h3><?php echo esc_html($template['schoolName']); ?></h3>
                    <p class="program"><?php echo esc_html($template['program']); ?></p>
                    <?php if (!empty($template['description'])): ?>
                        <p class="description"><?php echo esc_html($template['description']); ?></p>
                    <?php endif; ?>
                    <form method="post" class="create-application-form">
                        <input type="hidden" name="template_id" value="<?php echo esc_attr($template['id']); ?>">
                        <button type="submit" class="btn btn-primary btn-block">选择此学校</button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('.create-application-form').on('submit', function(e) {
            e.preventDefault();
            
            var templateId = $(this).find('input[name="template_id"]').val();
            var token = getCookie('school_app_token');
            
            $.ajax({
                url: '<?php echo SCHOOL_APP_API_URL; ?>/api/applications',
                type: 'POST',
                contentType: 'application/json',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                data: JSON.stringify({ templateId: templateId }),
                success: function(response) {
                    if (response.success) {
                        window.location.href = '/application?id=' + response.application.id;
                    }
                },
                error: function(xhr) {
                    alert('创建失败：' + (xhr.responseJSON?.error || '请重试'));
                }
            });
        });
        
        function getCookie(name) {
            var value = "; " + document.cookie;
            var parts = value.split("; " + name + "=");
            if (parts.length == 2) return parts.pop().split(";").shift();
        }
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('school_app_templates', 'school_app_templates_shortcode');

/**
 * 加载样式
 */
function school_app_load_styles() {
    ?>
    <style>
        /* 通用样式 */
        .school-app-notice,
        .school-app-error {
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
        }
        .school-app-notice {
            background: #e3f2fd;
            color: #1976d2;
        }
        .school-app-error {
            background: #ffebee;
            color: #c62828;
        }
        
        /* 表单样式 */
        .app-form {
            max-width: 500px;
            margin: 40px auto;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .app-form h2 {
            margin: 0 0 30px 0;
            text-align: center;
            color: #1a202c;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #4a5568;
        }
        .form-control {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s;
        }
        .form-control:focus {
            outline: none;
            border-color: #0ea5e9;
            box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
        }
        .form-group small {
            display: block;
            margin-top: 4px;
            color: #718096;
            font-size: 14px;
        }
        .form-footer {
            text-align: center;
            margin-top: 20px;
            color: #718096;
        }
        .form-footer a {
            color: #0ea5e9;
            text-decoration: none;
            font-weight: 600;
        }
        
        /* 按钮样式 */
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        .btn-primary {
            background: #0ea5e9;
            color: white;
        }
        .btn-primary:hover {
            background: #0284c7;
        }
        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
        .btn-secondary:hover {
            background: #d1d5db;
        }
        .btn-block {
            display: block;
            width: 100%;
        }
        
        /* 消息样式 */
        .message {
            margin-top: 20px;
        }
        .message .success {
            padding: 12px;
            background: #d4edda;
            color: #155724;
            border-radius: 6px;
            margin: 0;
        }
        .message .error {
            padding: 12px;
            background: #f8d7da;
            color: #721c24;
            border-radius: 6px;
            margin: 0;
        }
        
        /* Dashboard 样式 */
        .school-app-dashboard {
            padding: 20px;
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .dashboard-header h2 {
            margin: 0;
            font-size: 32px;
            color: #1a202c;
        }
        
        /* 申请卡片网格 */
        .applications-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
        }
        .application-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            transition: all 0.3s;
        }
        .application-card:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            transform: translateY(-2px);
        }
        .card-header {
            margin-bottom: 16px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }
        .status-draft {
            background: #f3f4f6;
            color: #6b7280;
        }
        .status-in_progress {
            background: #fef3c7;
            color: #92400e;
        }
        .status-submitted {
            background: #d1fae5;
            color: #065f46;
        }
        .school-name {
            margin: 0 0 8px 0;
            font-size: 20px;
            color: #1a202c;
        }
        .program-name {
            margin: 0 0 16px 0;
            color: #6b7280;
        }
        .card-meta {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        .update-time {
            font-size: 14px;
            color: #9ca3af;
        }
        
        /* 空状态 */
        .no-applications {
            padding: 60px 20px;
        }
        .empty-state {
            text-align: center;
            max-width: 400px;
            margin: 0 auto;
        }
        .empty-state svg {
            color: #d1d5db;
            margin-bottom: 24px;
        }
        .empty-state h3 {
            margin: 0 0 12px 0;
            font-size: 24px;
            color: #1a202c;
        }
        .empty-state p {
            margin: 0 0 24px 0;
            color: #6b7280;
        }
        
        /* 模板网格 */
        .school-app-templates {
            padding: 20px;
        }
        .school-app-templates h2 {
            margin: 0 0 8px 0;
            font-size: 32px;
            color: #1a202c;
        }
        .school-app-templates .subtitle {
            margin: 0 0 32px 0;
            color: #6b7280;
            font-size: 18px;
        }
        .templates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 24px;
        }
        .template-card {
            background: white;
            border-radius: 12px;
            padding: 28px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            transition: all 0.3s;
        }
        .template-card:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            transform: translateY(-2px);
        }
        .template-card h3 {
            margin: 0 0 8px 0;
            font-size: 22px;
            color: #1a202c;
        }
        .template-card .program {
            margin: 0 0 12px 0;
            color: #0ea5e9;
            font-weight: 600;
        }
        .template-card .description {
            margin: 0 0 20px 0;
            color: #6b7280;
            line-height: 1.6;
        }
        
        /* 响应式 */
        @media (max-width: 768px) {
            .dashboard-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
            }
            .applications-grid,
            .templates-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
    <?php
}
add_action('wp_head', 'school_app_load_styles');

?>

