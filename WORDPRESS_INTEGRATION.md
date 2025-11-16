# 🔌 WordPress 集成指南

将 School Application Assistant 集成到 WordPress + Elementor 网站的完整方案。

---

## 📋 集成方案对比

| 方案 | 难度 | 用户体验 | 维护性 | 推荐度 |
|------|------|---------|--------|--------|
| 1. iframe 嵌入 | ⭐ | ⭐⭐ | ⭐⭐⭐ | 适合快速测试 |
| 2. REST API 集成 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ **推荐** |
| 3. WordPress 插件 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 最专业 |
| 4. 子域名 + SSO | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 适合大型项目 |

---

## 🚀 方案一：iframe 嵌入（最简单，5分钟）

### 适用场景
- 快速测试和演示
- 不需要深度集成
- 独立的功能模块

### 实现步骤

#### 1. 部署 Next.js 应用

将应用部署到 Vercel 或其他平台，获得 URL（例如：`https://your-app.vercel.app`）

#### 2. 在 WordPress 中使用 Code Snippet

在 Code Snippet 中添加短代码：

```php
<?php
/**
 * Shortcode: 学校申请助手
 * 使用方式: [school_application_assistant]
 */
function school_application_assistant_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '800px',
        'page' => 'dashboard'
    ), $atts);
    
    $app_url = 'https://your-app.vercel.app';
    $page = esc_attr($atts['page']);
    $height = esc_attr($atts['height']);
    
    // 如果用户已登录 WordPress，传递用户信息
    $user_data = '';
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $user_data = '?email=' . urlencode($current_user->user_email) . 
                    '&name=' . urlencode($current_user->display_name);
    }
    
    return sprintf(
        '<iframe 
            src="%s/%s%s" 
            width="100%%" 
            height="%s" 
            frameborder="0"
            style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
            allow="clipboard-write"
        ></iframe>',
        $app_url,
        $page,
        $user_data,
        $height
    );
}
add_shortcode('school_application_assistant', 'school_application_assistant_shortcode');
?>
```

#### 3. 在 Elementor 中使用

创建新页面或编辑现有页面：

1. 添加 "Shortcode" 小部件
2. 输入：`[school_application_assistant]`
3. 或指定页面：`[school_application_assistant page="dashboard" height="1000px"]`

#### 4. 可用的页面参数

```php
// 显示 Dashboard
[school_application_assistant page="dashboard"]

// 显示用户资料
[school_application_assistant page="profile"]

// 显示注册页面
[school_application_assistant page="auth/register"]

// 显示登录页面
[school_application_assistant page="auth/login"]
```

### 优点
✅ 实现简单，5分钟完成  
✅ 维护独立，互不影响  
✅ 可以快速更新

### 缺点
❌ 样式可能不完全一致  
❌ 需要处理跨域问题  
❌ 用户体验略差（独立的滚动条）

---

## 🎯 方案二：REST API 集成（推荐）

### 适用场景
- 需要深度集成
- 保持 WordPress 的用户体验
- 想要完全控制前端样式

### 架构设计

```
WordPress 网站
├── 前端 UI (Elementor + Custom CSS)
├── PHP 后端逻辑 (Code Snippet)
└── API 调用
    ↓
Next.js 后端 API
├── /api/auth/*
├── /api/profile/*
├── /api/applications/*
└── /api/ai/*
```

### 实现步骤

#### 1. 部署 Next.js 后端

只部署 API 部分，前端用 WordPress 重建：

```bash
# 在 .env 中添加
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
ALLOWED_ORIGINS=https://your-wordpress-site.com
```

#### 2. 在 Next.js 中添加 CORS 支持

创建 `src/middleware/cors.ts`：

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export function corsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
```

在每个 API 文件开头使用：

```typescript
import { corsMiddleware } from '@/middleware/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (corsMiddleware(req, res)) return;
  
  // ... 原有代码
}
```

#### 3. 创建 WordPress API 封装类

在 Code Snippet 中添加：

```php
<?php
/**
 * School Application API 客户端
 */
class SchoolApplicationAPI {
    private $api_url;
    
    public function __construct() {
        $this->api_url = 'https://your-api.vercel.app';
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
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
    
    /**
     * 用户注册
     */
    public function register($email, $password, $fullName) {
        return $this->request('/api/auth/register', 'POST', array(
            'email' => $email,
            'password' => $password,
            'fullName' => $fullName
        ));
    }
    
    /**
     * 用户登录
     */
    public function login($email, $password) {
        return $this->request('/api/auth/login', 'POST', array(
            'email' => $email,
            'password' => $password
        ));
    }
    
    /**
     * 获取用户资料
     */
    public function getProfile($token) {
        return $this->request('/api/profile', 'GET', null, $token);
    }
    
    /**
     * 更新用户资料
     */
    public function updateProfile($token, $profileData) {
        return $this->request('/api/profile', 'PUT', $profileData, $token);
    }
    
    /**
     * 获取学校模板列表
     */
    public function getTemplates() {
        return $this->request('/api/templates', 'GET');
    }
    
    /**
     * 获取用户申请列表
     */
    public function getApplications($token) {
        return $this->request('/api/applications', 'GET', null, $token);
    }
    
    /**
     * 创建新申请
     */
    public function createApplication($token, $templateId) {
        return $this->request('/api/applications', 'POST', array(
            'templateId' => $templateId
        ), $token);
    }
    
    /**
     * 获取特定申请
     */
    public function getApplication($token, $applicationId) {
        return $this->request('/api/applications/' . $applicationId, 'GET', null, $token);
    }
    
    /**
     * 更新申请
     */
    public function updateApplication($token, $applicationId, $formData, $status = null) {
        $data = array('formData' => $formData);
        if ($status) {
            $data['status'] = $status;
        }
        return $this->request('/api/applications/' . $applicationId, 'PUT', $data, $token);
    }
    
    /**
     * AI 字段指导
     */
    public function getFieldGuidance($token, $field) {
        return $this->request('/api/ai/field-guidance', 'POST', array(
            'field' => $field
        ), $token);
    }
    
    /**
     * AI 生成 Essay
     */
    public function generateEssay($token, $field, $additionalPrompt = null) {
        return $this->request('/api/ai/generate-essay', 'POST', array(
            'field' => $field,
            'additionalPrompt' => $additionalPrompt
        ), $token);
    }
    
    /**
     * AI 自动填充
     */
    public function autoFill($token, $fields) {
        return $this->request('/api/ai/auto-fill', 'POST', array(
            'fields' => $fields
        ), $token);
    }
}

// 创建全局实例
global $school_app_api;
$school_app_api = new SchoolApplicationAPI();
?>
```

#### 4. 创建 WordPress 页面模板

在 Code Snippet 中添加短代码：

```php
<?php
/**
 * Dashboard 短代码
 */
function school_app_dashboard_shortcode() {
    global $school_app_api;
    
    // 检查用户是否登录
    $token = isset($_COOKIE['school_app_token']) ? $_COOKIE['school_app_token'] : null;
    
    if (!$token) {
        return '<p>请先登录。<a href="/login">点击这里登录</a></p>';
    }
    
    // 获取申请列表
    $applications = $school_app_api->getApplications($token);
    
    if (isset($applications['error'])) {
        return '<p>错误：' . esc_html($applications['error']) . '</p>';
    }
    
    // 渲染 HTML
    ob_start();
    ?>
    <div class="school-app-dashboard">
        <div class="dashboard-header">
            <h2>我的申请</h2>
            <button id="new-application-btn" class="btn btn-primary">创建新申请</button>
        </div>
        
        <div class="applications-grid">
            <?php if (empty($applications['applications'])): ?>
                <div class="no-applications">
                    <p>您还没有任何申请</p>
                    <button class="btn btn-primary">创建第一个申请</button>
                </div>
            <?php else: ?>
                <?php foreach ($applications['applications'] as $app): ?>
                    <div class="application-card">
                        <div class="card-header">
                            <span class="status-badge status-<?php echo esc_attr($app['status']); ?>">
                                <?php echo esc_html(ucfirst($app['status'])); ?>
                            </span>
                        </div>
                        <h3><?php echo esc_html($app['schoolName']); ?></h3>
                        <p><?php echo esc_html($app['program']); ?></p>
                        <div class="card-footer">
                            <span class="update-time">
                                更新于: <?php echo date('Y-m-d', strtotime($app['updatedAt'])); ?>
                            </span>
                            <a href="/application/?id=<?php echo esc_attr($app['id']); ?>" class="btn btn-secondary">
                                继续填写
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <style>
        .school-app-dashboard {
            padding: 20px;
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .applications-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .application-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-draft {
            background: #e0e0e0;
            color: #666;
        }
        .status-in_progress {
            background: #fff3cd;
            color: #856404;
        }
        .status-submitted {
            background: #d4edda;
            color: #155724;
        }
        .btn {
            padding: 10px 20px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 600;
        }
        .btn-primary {
            background: #0ea5e9;
            color: white;
        }
        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
    </style>
    <?php
    return ob_get_clean();
}
add_shortcode('school_app_dashboard', 'school_app_dashboard_shortcode');

/**
 * 登录表单短代码
 */
function school_app_login_shortcode() {
    ob_start();
    ?>
    <div class="school-app-login">
        <form id="school-app-login-form" class="login-form">
            <h2>登录</h2>
            <div class="form-group">
                <label>邮箱</label>
                <input type="email" name="email" required class="form-control">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" name="password" required class="form-control">
            </div>
            <button type="submit" class="btn btn-primary btn-block">登录</button>
            <div id="login-message"></div>
        </form>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#school-app-login-form').on('submit', function(e) {
            e.preventDefault();
            
            var formData = {
                email: $('input[name="email"]').val(),
                password: $('input[name="password"]').val()
            };
            
            $.ajax({
                url: 'https://your-api.vercel.app/api/auth/login',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        // 保存 token 到 cookie
                        document.cookie = 'school_app_token=' + response.token + '; path=/; max-age=604800';
                        // 重定向到 dashboard
                        window.location.href = '/dashboard';
                    }
                },
                error: function(xhr) {
                    var error = xhr.responseJSON ? xhr.responseJSON.error : '登录失败';
                    $('#login-message').html('<p class="error">' + error + '</p>');
                }
            });
        });
    });
    </script>
    
    <style>
        .school-app-login {
            max-width: 400px;
            margin: 50px auto;
        }
        .login-form {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .btn-block {
            width: 100%;
        }
        .error {
            color: red;
            margin-top: 10px;
        }
    </style>
    <?php
    return ob_get_clean();
}
add_shortcode('school_app_login', 'school_app_login_shortcode');
?>
```

#### 5. 在 Elementor 中使用

1. 创建新页面 `/dashboard`
2. 添加 Shortcode 小部件
3. 输入：`[school_app_dashboard]`

创建登录页面 `/login`：
1. 添加 Shortcode 小部件
2. 输入：`[school_app_login]`

### 优点
✅ 完全控制前端样式  
✅ 与 WordPress 主题完美融合  
✅ 可以利用 Elementor 的设计能力  
✅ 用户体验最佳

### 缺点
❌ 需要重写前端代码  
❌ 维护工作量较大  
❌ 需要处理 AJAX 和状态管理

---

## 🔌 方案三：开发 WordPress 插件（最专业）

### 适用场景
- 需要最专业的集成
- 计划长期维护和发展
- 想要发布到 WordPress 插件市场

### 插件结构

```
school-application-assistant-wp/
├── school-application-assistant.php    # 主插件文件
├── includes/
│   ├── class-api-client.php          # API 客户端
│   ├── class-admin.php               # 管理界面
│   └── class-shortcodes.php          # 短代码
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── templates/
    ├── dashboard.php
    ├── profile.php
    └── application-form.php
```

### 主插件文件

创建 `school-application-assistant.php`：

```php
<?php
/**
 * Plugin Name: School Application Assistant
 * Plugin URI: https://your-site.com
 * Description: AI-powered school application helper
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://your-site.com
 * Text Domain: school-app
 */

if (!defined('ABSPATH')) {
    exit;
}

// 定义常量
define('SCHOOL_APP_VERSION', '1.0.0');
define('SCHOOL_APP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SCHOOL_APP_PLUGIN_URL', plugin_dir_url(__FILE__));

// 加载类文件
require_once SCHOOL_APP_PLUGIN_DIR . 'includes/class-api-client.php';
require_once SCHOOL_APP_PLUGIN_DIR . 'includes/class-admin.php';
require_once SCHOOL_APP_PLUGIN_DIR . 'includes/class-shortcodes.php';

// 初始化插件
function school_app_init() {
    // 注册短代码
    $shortcodes = new School_App_Shortcodes();
    $shortcodes->register();
    
    // 加载样式和脚本
    add_action('wp_enqueue_scripts', 'school_app_enqueue_assets');
}
add_action('plugins_loaded', 'school_app_init');

// 加载资源
function school_app_enqueue_assets() {
    wp_enqueue_style(
        'school-app-style',
        SCHOOL_APP_PLUGIN_URL . 'assets/css/style.css',
        array(),
        SCHOOL_APP_VERSION
    );
    
    wp_enqueue_script(
        'school-app-script',
        SCHOOL_APP_PLUGIN_URL . 'assets/js/main.js',
        array('jquery'),
        SCHOOL_APP_VERSION,
        true
    );
    
    // 传递变量到 JS
    wp_localize_script('school-app-script', 'schoolAppConfig', array(
        'apiUrl' => get_option('school_app_api_url', 'https://your-api.vercel.app'),
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('school_app_nonce')
    ));
}

// 激活插件时的钩子
register_activation_hook(__FILE__, 'school_app_activate');
function school_app_activate() {
    // 创建必要的数据库表或设置默认选项
    add_option('school_app_api_url', 'https://your-api.vercel.app');
}

// 停用插件时的钩子
register_deactivation_hook(__FILE__, 'school_app_deactivate');
function school_app_deactivate() {
    // 清理工作
}
```

### 安装插件

1. 将插件文件夹上传到 `/wp-content/plugins/`
2. 在 WordPress 后台激活插件
3. 在设置中配置 API URL

### 优点
✅ 最专业的解决方案  
✅ 易于安装和管理  
✅ 可以发布给其他人使用  
✅ 更新和维护方便

### 缺点
❌ 开发工作量最大  
❌ 需要 WordPress 插件开发经验

---

## 🌐 方案四：子域名 + 单点登录

### 适用场景
- 想要完全独立的应用
- 但需要与 WordPress 用户系统集成
- 大型项目

### 架构

```
主站: www.your-site.com (WordPress)
应用: app.your-site.com (Next.js)
API:  api.your-site.com (Next.js API)
```

### SSO 实现

#### 1. 在 WordPress 创建 SSO 端点

```php
<?php
/**
 * SSO Token 生成
 */
function school_app_generate_sso_token() {
    if (!is_user_logged_in()) {
        wp_send_json_error(array('message' => 'Not logged in'));
    }
    
    $user = wp_get_current_user();
    $secret = get_option('school_app_sso_secret');
    
    $payload = array(
        'user_id' => $user->ID,
        'email' => $user->user_email,
        'name' => $user->display_name,
        'exp' => time() + 300 // 5 分钟过期
    );
    
    $token = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $token, $secret);
    
    wp_send_json_success(array(
        'token' => $token . '.' . $signature,
        'redirect_url' => 'https://app.your-site.com/sso/verify'
    ));
}
add_action('wp_ajax_school_app_sso_token', 'school_app_generate_sso_token');
?>
```

#### 2. 在 Next.js 创建 SSO 验证页面

创建 `src/pages/sso/verify.tsx`：

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SSOVerify() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      verifySSO(token as string);
    }
  }, [token]);

  const verifySSO = async (token: string) => {
    try {
      const response = await fetch('/api/auth/sso-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.appToken);
        router.push('/dashboard');
      } else {
        router.push('/auth/login?error=sso_failed');
      }
    } catch (error) {
      router.push('/auth/login?error=sso_error');
    }
  };

  return <div>Verifying...</div>;
}
```

---

## 📊 方案选择建议

### 如果您想要...

| 需求 | 推荐方案 |
|------|---------|
| 快速测试功能 | 方案一：iframe 嵌入 |
| 完美的用户体验 | 方案二：REST API 集成 |
| 长期专业项目 | 方案三：WordPress 插件 |
| 独立但集成登录 | 方案四：子域名 + SSO |

### 我的推荐

**对于您的情况（WordPress + Elementor + Code Snippet）**，我推荐：

1. **短期/测试**: 使用**方案一（iframe）**，快速上线
2. **中期优化**: 迁移到**方案二（REST API）**，提升体验
3. **长期发展**: 考虑**方案三（插件）**，专业化

---

## 🛠️ 快速开始（推荐流程）

### 第一步：使用 iframe 快速测试（今天）

1. 部署 Next.js 到 Vercel
2. 复制上面的 iframe 短代码到 Code Snippet
3. 在 Elementor 页面使用短代码

### 第二步：准备 REST API 集成（1-2周后）

1. 添加 CORS 支持
2. 复制 API 客户端类到 Code Snippet
3. 逐步替换页面

### 第三步：考虑插件化（如果需要）

如果功能受欢迎，可以开发完整插件。

---

## 📞 需要帮助？

如果在集成过程中遇到问题，请告诉我：
1. 您选择了哪个方案
2. 遇到了什么具体问题
3. 错误信息是什么

我会提供详细的解决方案！

