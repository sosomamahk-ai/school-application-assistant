/**
 * Unified Translation System
 * Flat key structure: "section.item" format
 * Example: "login.button", "navbar.home", "form.submit"
 */

export type Language = 'en' | 'zh-CN' | 'zh-TW';

export interface TranslationData {
  [key: string]: {
    en: string;
    'zh-CN': string;
    'zh-TW': string;
  };
}

// Master translations - this will be loaded from JSON file or API
export const translations: TranslationData = {
  // Common
  'common.appName': {
    en: 'School Application Assistant',
    'zh-CN': '学校申请助手',
    'zh-TW': '學校申請助手',
  },
  'common.appNameShort': {
    en: 'Application Assistant',
    'zh-CN': '申请助手',
    'zh-TW': '申請助手',
  },
  'common.loading': {
    en: 'Loading...',
    'zh-CN': '加载中...',
    'zh-TW': '載入中...',
  },
  'common.saving': {
    en: 'Saving...',
    'zh-CN': '保存中...',
    'zh-TW': '儲存中...',
  },
  'common.save': {
    en: 'Save',
    'zh-CN': '保存',
    'zh-TW': '儲存',
  },
  'common.cancel': {
    en: 'Cancel',
    'zh-CN': '取消',
    'zh-TW': '取消',
  },
  'common.submit': {
    en: 'Submit',
    'zh-CN': '提交',
    'zh-TW': '提交',
  },
  'common.delete': {
    en: 'Delete',
    'zh-CN': '删除',
    'zh-TW': '刪除',
  },
  'common.edit': {
    en: 'Edit',
    'zh-CN': '编辑',
    'zh-TW': '編輯',
  },
  'common.view': {
    en: 'View',
    'zh-CN': '查看',
    'zh-TW': '查看',
  },
  'common.back': {
    en: 'Back',
    'zh-CN': '返回',
    'zh-TW': '返回',
  },
  'common.next': {
    en: 'Next',
    'zh-CN': '下一步',
    'zh-TW': '下一步',
  },
  'common.previous': {
    en: 'Previous',
    'zh-CN': '上一个',
    'zh-TW': '上一個',
  },
  'common.continue': {
    en: 'Continue',
    'zh-CN': '继续',
    'zh-TW': '繼續',
  },
  'common.error': {
    en: 'Error',
    'zh-CN': '错误',
    'zh-TW': '錯誤',
  },
  'common.success': {
    en: 'Success',
    'zh-CN': '成功',
    'zh-TW': '成功',
  },

  // Navigation
  'navbar.home': {
    en: 'Home',
    'zh-CN': '首页',
    'zh-TW': '首頁',
  },
  'navbar.dashboard': {
    en: 'Dashboard',
    'zh-CN': '控制台',
    'zh-TW': '控制台',
  },
  'navbar.profile': {
    en: 'Profile',
    'zh-CN': '个人资料',
    'zh-TW': '個人資料',
  },
  'navbar.settings': {
    en: 'Settings',
    'zh-CN': '设置',
    'zh-TW': '設定',
  },
  'navbar.schools': {
    en: 'School List',
    'zh-CN': '学校列表',
    'zh-TW': '學校列表',
  },
  'navbar.applicationsOverview': {
    en: 'Applications Overview',
    'zh-CN': '申请进度',
    'zh-TW': '申請進度',
  },
  'navbar.adminSchools': {
    en: 'School Mapping Management',
    'zh-CN': '学校映射管理',
    'zh-TW': '學校映射管理',
  },
  'navbar.logout': {
    en: 'Logout',
    'zh-CN': '退出',
    'zh-TW': '登出',
  },

  // Auth
  'auth.login.title': {
    en: 'Sign in to your account',
    'zh-CN': '登录到您的账户',
    'zh-TW': '登入您的帳戶',
  },
  'auth.login.subtitle': {
    en: 'Please sign in to your account',
    'zh-CN': '请使用您的账号进行登录',
    'zh-TW': '請使用您的帳號進行登入',
  },
  'auth.login.email': {
    en: 'Email address',
    'zh-CN': '邮箱地址',
    'zh-TW': '電子郵件地址',
  },
  'auth.login.emailOption': {
    en: 'Use email',
    'zh-CN': '邮箱登录',
    'zh-TW': '電子郵件登入',
  },
  'auth.login.emailPlaceholder': {
    en: 'you@example.com',
    'zh-CN': '请输入邮箱地址',
    'zh-TW': '請輸入電子郵件地址',
  },
  'auth.login.usernameOption': {
    en: 'Use username',
    'zh-CN': '用户名登录',
    'zh-TW': '使用者名稱登入',
  },
  'auth.login.username': {
    en: 'Username',
    'zh-CN': '用户名',
    'zh-TW': '使用者名稱',
  },
  'auth.login.usernamePlaceholder': {
    en: 'your_username',
    'zh-CN': '请输入用户名',
    'zh-TW': '請輸入使用者名稱',
  },
  'auth.login.chooseMethod': {
    en: 'Login method',
    'zh-CN': '登录方式',
    'zh-TW': '登入方式',
  },
  'auth.login.identifierRequired': {
    en: 'Please enter your email or username',
    'zh-CN': '请输入邮箱或用户名',
    'zh-TW': '請輸入電子郵件或使用者名稱',
  },
  'auth.login.password': {
    en: 'Password',
    'zh-CN': '密码',
    'zh-TW': '密碼',
  },
  'auth.login.button': {
    en: 'Sign in',
    'zh-CN': '登录',
    'zh-TW': '登入',
  },
  'auth.login.signingIn': {
    en: 'Signing in...',
    'zh-CN': '登录中...',
    'zh-TW': '登入中...',
  },
  'auth.login.noAccount': {
    en: "Don't have an account?",
    'zh-CN': '还没有账户？',
    'zh-TW': '還沒有帳戶？',
  },
  'auth.login.signUp': {
    en: 'Sign up',
    'zh-CN': '注册',
    'zh-TW': '註冊',
  },
  'auth.login.orText': {
    en: 'Or',
    'zh-CN': '或',
    'zh-TW': '或',
  },
  'auth.login.createAccount': {
    en: 'create an account',
    'zh-CN': '创建账户',
    'zh-TW': '創建帳戶',
  },
  'auth.register.title': {
    en: 'Create your account',
    'zh-CN': '创建您的账户',
    'zh-TW': '創建您的帳戶',
  },
  'auth.register.name': {
    en: 'Full Name',
    'zh-CN': '姓名',
    'zh-TW': '姓名',
  },
  'auth.register.username': {
    en: 'Username',
    'zh-CN': '用户名',
    'zh-TW': '使用者名稱',
  },
  'auth.register.usernamePlaceholder': {
    en: '3-20 characters, letters/numbers/_',
    'zh-CN': '3-20 个字符，仅限字母/数字/下划线',
    'zh-TW': '3-20 個字元，僅限字母/數字/底線',
  },
  'auth.register.usernameHelp': {
    en: 'Letters, numbers, and underscores only. Use for username login.',
    'zh-CN': '仅支持字母、数字和下划线，可用于用户名登录。',
    'zh-TW': '僅支援字母、數字與底線，可用於使用者名稱登入。',
  },
  'auth.register.email': {
    en: 'Email',
    'zh-CN': '电子邮箱',
    'zh-TW': '電子郵箱',
  },
  'auth.register.password': {
    en: 'Password',
    'zh-CN': '密码',
    'zh-TW': '密碼',
  },
  'auth.register.confirmPassword': {
    en: 'Confirm Password',
    'zh-CN': '确认密码',
    'zh-TW': '確認密碼',
  },
  'auth.register.button': {
    en: 'Create account',
    'zh-CN': '注册',
    'zh-TW': '註冊',
  },
  'auth.register.registering': {
    en: 'Creating account...',
    'zh-CN': '注册中...',
    'zh-TW': '註冊中...',
  },
  'auth.register.hasAccount': {
    en: 'Already have an account?',
    'zh-CN': '已有账户？',
    'zh-TW': '已有帳戶？',
  },
  'auth.register.noAccount': {
    en: "Don't have an account?",
    'zh-CN': '还没有账户？',
    'zh-TW': '還沒有帳戶？',
  },
  'auth.register.joinUs': {
    en: 'Join us now and start your journey with us',
    'zh-CN': '立即注册加入我们，和我们一起开始旅程吧',
    'zh-TW': '立即註冊加入我們，和我們一起開始旅程吧',
  },
  'auth.register.signIn': {
    en: 'Sign in',
    'zh-CN': '登录',
    'zh-TW': '登入',
  },
  'auth.errors.passwordMismatch': {
    en: 'Passwords do not match',
    'zh-CN': '两次输入的密码不一致',
    'zh-TW': '兩次輸入的密碼不一致',
  },
  'auth.errors.passwordTooShort': {
    en: 'Password must be at least 6 characters',
    'zh-CN': '密码至少需要6个字符',
    'zh-TW': '密碼至少需要6個字元',
  },
  'auth.errors.loginFailed': {
    en: 'Login failed',
    'zh-CN': '登录失败',
    'zh-TW': '登入失敗',
  },
  'auth.errors.usernameInvalid': {
    en: 'Username must be 3-20 letters, numbers, or underscores',
    'zh-CN': '用户名需 3-20 位，仅可包含字母、数字或下划线',
    'zh-TW': '使用者名稱需 3-20 位，僅可包含字母、數字或底線',
  },
  'auth.errors.registrationFailed': {
    en: 'Registration failed',
    'zh-CN': '注册失败',
    'zh-TW': '註冊失敗',
  },

  // Home
  'home.title': {
    en: 'Your AI-Powered School Application Assistant',
    'zh-CN': 'AI 驱动的学校申请助手',
    'zh-TW': 'AI 驅動的學校申請助手',
  },
  'home.subtitle': {
    en: 'Simplify the application process with intelligent form filling, personalized guidance, and AI-generated essays.',
    'zh-CN': '通过智能表单填写、个性化指导和 AI 生成的文书，简化申请流程。',
    'zh-TW': '透過智能表單填寫、個人化指導和 AI 生成的文書，簡化申請流程。',
  },
  'home.startApplication': {
    en: 'Start Your Application',
    'zh-CN': '开始申请',
    'zh-TW': '開始申請',
  },
  'home.learnMore': {
    en: 'Learn More',
    'zh-CN': '了解更多',
    'zh-TW': '了解更多',
  },
  'home.getStarted': {
    en: 'Get Started',
    'zh-CN': '开始使用',
    'zh-TW': '開始使用',
  },
  'home.whyChoose': {
    en: 'Why Choose Our Platform?',
    'zh-CN': '为什么选择我们？',
    'zh-TW': '為什麼選擇我們？',
  },
  'home.features.autoFill.title': {
    en: 'Smart Auto-Fill',
    'zh-CN': '智能自动填充',
    'zh-TW': '智能自動填充',
  },
  'home.features.autoFill.description': {
    en: 'Automatically populate application forms with your saved profile information',
    'zh-CN': '使用保存的个人资料自动填充申请表单',
    'zh-TW': '使用儲存的個人資料自動填充申請表單',
  },
  'home.features.aiGuidance.title': {
    en: 'AI Guidance',
    'zh-CN': 'AI 智能指导',
    'zh-TW': 'AI 智能指導',
  },
  'home.features.aiGuidance.description': {
    en: 'Get real-time assistance and explanations for every field you need to fill',
    'zh-CN': '为每个需要填写的字段提供实时帮助和说明',
    'zh-TW': '為每個需要填寫的欄位提供即時幫助和說明',
  },
  'home.features.essayGeneration.title': {
    en: 'Essay Generation',
    'zh-CN': '文书生成',
    'zh-TW': '文書生成',
  },
  'home.features.essayGeneration.description': {
    en: 'Create compelling essays and personal statements with AI-powered drafts',
    'zh-CN': '使用 AI 创建引人注目的个人陈述和申请文书',
    'zh-TW': '使用 AI 創建引人注目的個人陳述和申請文書',
  },
  'home.features.multipleSchools.title': {
    en: 'Multiple Schools',
    'zh-CN': '多所学校管理',
    'zh-TW': '多所學校管理',
  },
  'home.features.multipleSchools.description': {
    en: 'Apply to multiple schools efficiently with reusable profile data',
    'zh-CN': '通过可重复使用的资料数据高效申请多所学校',
    'zh-TW': '透過可重複使用的資料數據高效申請多所學校',
  },
  'home.howItWorks.title': {
    en: 'How It Works',
    'zh-CN': '如何使用',
    'zh-TW': '如何使用',
  },
  'home.howItWorks.step1.title': {
    en: 'Create Your Profile',
    'zh-CN': '创建您的资料',
    'zh-TW': '創建您的資料',
  },
  'home.howItWorks.step1.description': {
    en: 'Fill in your basic information, education history, and experiences once',
    'zh-CN': '一次性填写基本信息、教育经历和工作经验',
    'zh-TW': '一次性填寫基本信息、教育經歷和工作經驗',
  },
  'home.howItWorks.step2.title': {
    en: 'Select Your Schools',
    'zh-CN': '选择学校',
    'zh-TW': '選擇學校',
  },
  'home.howItWorks.step2.description': {
    en: 'Choose the schools and programs you want to apply to from our templates',
    'zh-CN': '从我们的模板中选择您想申请的学校和项目',
    'zh-TW': '從我們的範本中選擇您想申請的學校和項目',
  },
  'home.howItWorks.step3.title': {
    en: 'Complete with AI Help',
    'zh-CN': '在 AI 帮助下完成',
    'zh-TW': '在 AI 幫助下完成',
  },
  'home.howItWorks.step3.description': {
    en: 'Let AI guide you through each field and generate compelling content',
    'zh-CN': '让 AI 指导您完成每个字段并生成出色的内容',
    'zh-TW': '讓 AI 指導您完成每個欄位並生成出色的內容',
  },
  'home.cta.title': {
    en: 'Ready to Get Started?',
    'zh-CN': '准备开始了吗？',
    'zh-TW': '準備開始了嗎？',
  },
  'home.cta.subtitle': {
    en: 'Join thousands of students who have simplified their application process',
    'zh-CN': '加入成千上万简化申请流程的学生',
    'zh-TW': '加入成千上萬簡化申請流程的學生',
  },
  'home.cta.button': {
    en: 'Create Free Account',
    'zh-CN': '免费创建账户',
    'zh-TW': '免費創建帳戶',
  },
  'home.footer.copyright': {
    en: '© 2024 School Application Assistant. All rights reserved.',
    'zh-CN': '© 2024 学校申请助手。保留所有权利。',
    'zh-TW': '© 2024 學校申請助手。保留所有權利。',
  },
  'common.login': {
    en: 'Login',
    'zh-CN': '登录',
    'zh-TW': '登入',
  },

  // Dashboard
  'dashboard.title': {
    en: 'My Applications',
    'zh-CN': '我的申请',
    'zh-TW': '我的申請',
  },
  'dashboard.subtitle': {
    en: 'Manage and track your school applications',
    'zh-CN': '管理和跟踪您的学校申请',
    'zh-TW': '管理和追蹤您的學校申請',
  },
  'dashboard.noApplications': {
    en: 'No applications yet',
    'zh-CN': '还没有申请',
    'zh-TW': '還沒有申請',
  },
  'dashboard.noApplicationsDesc': {
    en: 'Start your first application to get going!',
    'zh-CN': '开始您的第一个申请吧！',
    'zh-TW': '開始您的第一個申請吧！',
  },
  'dashboard.newApplication': {
    en: 'New Application',
    'zh-CN': '新建申请',
    'zh-TW': '新建申請',
  },
  'dashboard.continueApplication': {
    en: 'Continue Application',
    'zh-CN': '继续申请',
    'zh-TW': '繼續申請',
  },
  'dashboard.viewApplication': {
    en: 'View Application',
    'zh-CN': '查看申请',
    'zh-TW': '查看申請',
  },
  'dashboard.deleteConfirm': {
    en: 'Are you sure you want to delete this application?',
    'zh-CN': '确定要删除这个申请吗？',
    'zh-TW': '確定要刪除這個申請嗎？',
  },
  'dashboard.chooseSchool': {
    en: 'Choose a School to Apply',
    'zh-CN': '选择要申请的学校',
    'zh-TW': '選擇要申請的學校',
  },
  'dashboard.manageTemplates': {
    en: 'Manage Templates',
    'zh-CN': '管理模板',
    'zh-TW': '管理範本',
  },
  'dashboard.createFirst': {
    en: 'Create Your First Application',
    'zh-CN': '创建您的第一个申请',
    'zh-TW': '創建您的第一個申請',
  },
  'dashboard.updated': {
    en: 'Updated',
    'zh-CN': '更新于',
    'zh-TW': '更新於',
  },
  'dashboard.draft': {
    en: 'Draft',
    'zh-CN': '草稿',
    'zh-TW': '草稿',
  },
  'dashboard.inProgress': {
    en: 'In Progress',
    'zh-CN': '进行中',
    'zh-TW': '進行中',
  },
  'dashboard.submitted': {
    en: 'Submitted',
    'zh-CN': '已提交',
    'zh-TW': '已提交',
  },
  'dashboard.guide.title': {
    en: 'System Usage Guide',
    'zh-CN': '系统使用指南',
    'zh-TW': '系統使用指南',
  },
  'dashboard.guide.subtitle': {
    en: 'Welcome! Learn how to use the School Application Assistant system',
    'zh-CN': '欢迎！了解如何使用学校申请助手系统',
    'zh-TW': '歡迎！了解如何使用學校申請助手系統',
  },
  'dashboard.guide.intro': {
    en: 'This dashboard provides an overview of all available features and modules. Follow the steps below to get started with your school applications.',
    'zh-CN': '此控制台提供所有可用功能和模块的概览。按照以下步骤开始您的学校申请。',
    'zh-TW': '此控制台提供所有可用功能和模組的概覽。按照以下步驟開始您的學校申請。',
  },
  'dashboard.guide.workflow.title': {
    en: 'System Workflow',
    'zh-CN': '系统工作流程',
    'zh-TW': '系統工作流程',
  },
  'dashboard.guide.step1': {
    en: 'Complete Your Profile',
    'zh-CN': '完善您的个人资料',
    'zh-TW': '完善您的個人資料',
  },
  'dashboard.guide.step1Desc': {
    en: 'Fill in your personal information that will be used across all applications',
    'zh-CN': '填写您的个人信息，这些信息将用于所有申请',
    'zh-TW': '填寫您的個人信息，這些信息將用於所有申請',
  },
  'dashboard.guide.step2': {
    en: 'View School List and Create Application',
    'zh-CN': '查看学校列表创建申请',
    'zh-TW': '查看學校列表創建申請',
  },
  'dashboard.guide.step2Desc': {
    en: 'View all available schools and programs you can apply to',
    'zh-CN': '查看所有可申请的学校和项目',
    'zh-TW': '查看所有可申請的學校和項目',
  },
  'dashboard.guide.step3': {
    en: 'Complete Application Form and Submit',
    'zh-CN': '完善申请表并提交申请',
    'zh-TW': '完善申請表並提交申請',
  },
  'dashboard.guide.step3Desc': {
    en: 'Select a school and start filling out the application form',
    'zh-CN': '选择学校并开始填写申请表',
    'zh-TW': '選擇學校並開始填寫申請表',
  },
  'dashboard.guide.step4': {
    en: 'Track Your Application Progress',
    'zh-CN': '跟踪您的申请进度',
    'zh-TW': '追蹤您的申請進度',
  },
  'dashboard.guide.step4Desc': {
    en: 'Monitor the status of all your applications in one place',
    'zh-CN': '在一个地方监控所有申请的状态',
    'zh-TW': '在一個地方監控所有申請的狀態',
  },
  'dashboard.guide.modules.title': {
    en: 'Available Modules',
    'zh-CN': '可用模块',
    'zh-TW': '可用模組',
  },
  'dashboard.guide.module.myApplication': {
    en: 'My Applications',
    'zh-CN': '我的申请',
    'zh-TW': '我的申請',
  },
  'dashboard.guide.module.myApplicationDesc': {
    en: 'View and manage all your school applications. Create new applications, track status, and continue editing existing ones.',
    'zh-CN': '查看和管理您的所有学校申请。创建新申请、跟踪状态并继续编辑现有申请。',
    'zh-TW': '查看和管理您的所有學校申請。創建新申請、追蹤狀態並繼續編輯現有申請。',
  },
  'dashboard.guide.module.profile': {
    en: 'Profile Settings',
    'zh-CN': '个人资料设置',
    'zh-TW': '個人資料設定',
  },
  'dashboard.guide.module.profileDesc': {
    en: 'Manage your personal information, contact details, and other profile data used in applications.',
    'zh-CN': '管理您的个人信息、联系方式和用于申请的其他资料数据。',
    'zh-TW': '管理您的個人信息、聯繫方式和用於申請的其他資料數據。',
  },
  'dashboard.guide.module.schools': {
    en: 'Available Schools',
    'zh-CN': '可申请学校',
    'zh-TW': '可申請學校',
  },
  'dashboard.guide.module.schoolsDesc': {
    en: 'Browse all available schools and programs you can apply to.',
    'zh-CN': '浏览所有可申请的学校和项目。',
    'zh-TW': '瀏覽所有可申請的學校和項目。',
  },
  'dashboard.guide.module.overview': {
    en: 'Applications Overview',
    'zh-CN': '申请进度',
    'zh-TW': '申請進度',
  },
  'dashboard.guide.module.overviewDesc': {
    en: 'View a comprehensive overview of all your applications and their current status.',
    'zh-CN': '查看所有申请及其当前状态的综合概览。',
    'zh-TW': '查看所有申請及其當前狀態的綜合概覽。',
  },
  'dashboard.guide.module.settings': {
    en: 'Account Settings',
    'zh-CN': '账户设置',
    'zh-TW': '帳戶設定',
  },
  'dashboard.guide.module.settingsDesc': {
    en: 'Configure your account preferences, notification settings, and system preferences.',
    'zh-CN': '配置您的账户偏好、通知设置和系统偏好。',
    'zh-TW': '配置您的帳戶偏好、通知設定和系統偏好。',
  },
  'dashboard.guide.quickLinks': {
    en: 'Quick Links',
    'zh-CN': '快速链接',
    'zh-TW': '快速連結',
  },
  'dashboard.guide.goToModule': {
    en: 'Go to Module',
    'zh-CN': '前往模块',
    'zh-TW': '前往模組',
  },

  // Profile
  'profile.title': {
    en: 'Profile',
    'zh-CN': '个人资料',
    'zh-TW': '個人資料',
  },
  'profile.manageInfo': {
    en: 'Manage your personal information for applications',
    'zh-CN': '管理您的个人信息以用于申请',
    'zh-TW': '管理您的個人信息以用於申請',
  },
  'profile.saveChanges': {
    en: 'Save Changes',
    'zh-CN': '保存更改',
    'zh-TW': '儲存更改',
  },
  'profile.saveSuccess': {
    en: 'Profile saved successfully!',
    'zh-CN': '个人资料保存成功！',
    'zh-TW': '個人資料儲存成功！',
  },
  'profile.saveError': {
    en: 'Failed to save, please try again',
    'zh-CN': '保存失败，请重试',
    'zh-TW': '儲存失敗，請重試',
  },
  'profile.basicInfo': {
    en: 'Basic Information',
    'zh-CN': '基本信息',
    'zh-TW': '基本信息',
  },
  'profile.fullName': {
    en: 'Full Name',
    'zh-CN': '全名',
    'zh-TW': '全名',
  },
  'profile.phone': {
    en: 'Phone',
    'zh-CN': '电话',
    'zh-TW': '電話',
  },
  'profile.birthday': {
    en: 'Birthday',
    'zh-CN': '生日',
    'zh-TW': '生日',
  },
  'profile.nationality': {
    en: 'Nationality',
    'zh-CN': '国籍',
    'zh-TW': '國籍',
  },
  'profile.education': {
    en: 'Education',
    'zh-CN': '教育背景',
    'zh-TW': '教育背景',
  },
  'profile.addEducation': {
    en: 'Add Education',
    'zh-CN': '添加教育经历',
    'zh-TW': '新增教育經歷',
  },
  'profile.educationItem': {
    en: 'Education',
    'zh-CN': '教育经历',
    'zh-TW': '教育經歷',
  },
  'profile.schoolName': {
    en: 'School Name',
    'zh-CN': '学校名称',
    'zh-TW': '學校名稱',
  },
  'profile.degree': {
    en: 'Degree',
    'zh-CN': '学位',
    'zh-TW': '學位',
  },
  'profile.major': {
    en: 'Major',
    'zh-CN': '专业',
    'zh-TW': '專業',
  },
  'profile.gpa': {
    en: 'GPA',
    'zh-CN': 'GPA',
    'zh-TW': 'GPA',
  },
  'profile.startDate': {
    en: 'Start Date',
    'zh-CN': '开始日期',
    'zh-TW': '開始日期',
  },
  'profile.endDate': {
    en: 'End Date',
    'zh-CN': '结束日期',
    'zh-TW': '結束日期',
  },
  'profile.experiences': {
    en: 'Work/Internship Experience',
    'zh-CN': '工作/实习经历',
    'zh-TW': '工作/實習經歷',
  },
  'profile.addExperience': {
    en: 'Add Experience',
    'zh-CN': '添加经历',
    'zh-TW': '新增經歷',
  },
  'profile.experienceItem': {
    en: 'Experience',
    'zh-CN': '经历',
    'zh-TW': '經歷',
  },
  'profile.jobTitle': {
    en: 'Job Title',
    'zh-CN': '职位名称',
    'zh-TW': '職位名稱',
  },
  'profile.organization': {
    en: 'Company/Organization',
    'zh-CN': '公司/组织',
    'zh-TW': '公司/組織',
  },
  'profile.jobDescription': {
    en: 'Job Description',
    'zh-CN': '工作描述',
    'zh-TW': '工作描述',
  },

  // Application
  'application.title': {
    en: 'Application Form',
    'zh-CN': '申请表单',
    'zh-TW': '申請表單',
  },
  'application.saveProgress': {
    en: 'Save Progress',
    'zh-CN': '保存进度',
    'zh-TW': '儲存進度',
  },
  'application.submitApplication': {
    en: 'Submit Application',
    'zh-CN': '提交申请',
    'zh-TW': '提交申請',
  },
  'application.export': {
    en: 'Export',
    'zh-CN': '导出',
    'zh-TW': '匯出',
  },
  'application.progress': {
    en: 'Progress',
    'zh-CN': '完成进度',
    'zh-TW': '完成進度',
  },
  'application.completed': {
    en: 'Completed',
    'zh-CN': '已完成',
    'zh-TW': '已完成',
  },
  'application.viewAllFields': {
    en: 'View All Fields',
    'zh-CN': '查看所有字段',
    'zh-TW': '查看所有欄位',
  },
  'application.stepByStepMode': {
    en: 'Switch to Step-by-Step Mode',
    'zh-CN': '切换到逐步填写模式',
    'zh-TW': '切換到逐步填寫模式',
  },
  'application.allFields': {
    en: 'All Application Fields',
    'zh-CN': '所有申请字段',
    'zh-TW': '所有申請欄位',
  },
  'application.notFound': {
    en: 'Application not found',
    'zh-CN': '申请未找到',
    'zh-TW': '申請未找到',
  },
  'application.submitSuccess': {
    en: 'Application submitted successfully!',
    'zh-CN': '申请提交成功！',
    'zh-TW': '申請提交成功！',
  },
  'application.saveSuccess': {
    en: 'Progress saved!',
    'zh-CN': '进度已保存！',
    'zh-TW': '進度已儲存！',
  },
  'application.saveError': {
    en: 'Error saving application',
    'zh-CN': '保存申请时出错',
    'zh-TW': '儲存申請時出錯',
  },

  // AI Guidance
  'ai.guidance.title': {
    en: 'AI Guidance',
    'zh-CN': 'AI 智能指导',
    'zh-TW': 'AI 智能指導',
  },
  'ai.guidance.whatIsThis': {
    en: 'What this field requires:',
    'zh-CN': '此字段要求填写：',
    'zh-TW': '此欄位要求填寫：',
  },
  'ai.guidance.requirements': {
    en: 'Requirements:',
    'zh-CN': '填写要求：',
    'zh-TW': '填寫要求：',
  },
  'ai.guidance.examples': {
    en: 'Tips and Examples:',
    'zh-CN': '提示与示例：',
    'zh-TW': '提示與範例：',
  },
  'ai.guidance.suggestion': {
    en: 'AI Suggestion:',
    'zh-CN': 'AI 建议：',
    'zh-TW': 'AI 建議：',
  },
  'ai.guidance.useThis': {
    en: 'Use This Suggestion',
    'zh-CN': '使用此建议',
    'zh-TW': '使用此建議',
  },
  'ai.guidance.generating': {
    en: 'Generating...',
    'zh-CN': '生成中...',
    'zh-TW': '生成中...',
  },
  'ai.guidance.analyzing': {
    en: 'Analyzing...',
    'zh-CN': '分析中...',
    'zh-TW': '分析中...',
  },
  'ai.guidance.generateContent': {
    en: 'Generate Content with AI',
    'zh-CN': '使用 AI 生成内容',
    'zh-TW': '使用 AI 生成內容',
  },
  'ai.guidance.improvements': {
    en: 'Improvement Suggestions',
    'zh-CN': '改进建议',
    'zh-TW': '改進建議',
  },
  'ai.guidance.improvedVersion': {
    en: 'Improved Version:',
    'zh-CN': '改进版本：',
    'zh-TW': '改進版本：',
  },
  'ai.guidance.useThisVersion': {
    en: 'Use This Version',
    'zh-CN': '使用此版本',
    'zh-TW': '使用此版本',
  },

  // Settings
  'settings.title': {
    en: 'Account Settings',
    'zh-CN': '账户设置',
    'zh-TW': '帳戶設定',
  },
  'settings.subtitle': {
    en: 'Manage your account information and security settings',
    'zh-CN': '管理您的账户信息和安全设置',
    'zh-TW': '管理您的帳戶信息和安全設定',
  },
  'settings.changePassword': {
    en: 'Change Password',
    'zh-CN': '修改密码',
    'zh-TW': '修改密碼',
  },
  'settings.changeEmail': {
    en: 'Change Email',
    'zh-CN': '修改邮箱',
    'zh-TW': '修改電子郵件',
  },
  'settings.currentPassword': {
    en: 'Current Password',
    'zh-CN': '当前密码',
    'zh-TW': '當前密碼',
  },
  'settings.newPassword': {
    en: 'New Password',
    'zh-CN': '新密码',
    'zh-TW': '新密碼',
  },
  'settings.confirmNewPassword': {
    en: 'Confirm New Password',
    'zh-CN': '确认新密码',
    'zh-TW': '確認新密碼',
  },
  'settings.passwordChanged': {
    en: 'Password changed successfully!',
    'zh-CN': '密码修改成功！',
    'zh-TW': '密碼修改成功！',
  },
  'settings.emailChanged': {
    en: 'Email changed successfully!',
    'zh-CN': '邮箱修改成功！',
    'zh-TW': '電子郵件修改成功！',
  },
  'settings.currentEmail': {
    en: 'Current Email',
    'zh-CN': '当前邮箱',
    'zh-TW': '當前電子郵件',
  },
  'settings.newEmail': {
    en: 'New Email',
    'zh-CN': '新邮箱',
    'zh-TW': '新電子郵件',
  },
  'settings.currentEmailDescription': {
    en: 'This is your current email address',
    'zh-CN': '这是您当前使用的邮箱地址',
    'zh-TW': '這是您當前使用的電子郵件地址',
  },
  'settings.emailPassword': {
    en: 'Current Password (for verification)',
    'zh-CN': '当前密码（验证身份）',
    'zh-TW': '當前密碼（驗證身份）',
  },
  'settings.emailPasswordPlaceholder': {
    en: 'Enter your current password to verify identity',
    'zh-CN': '请输入当前密码以验证身份',
    'zh-TW': '請輸入當前密碼以驗證身份',
  },
  'settings.currentPasswordPlaceholder': {
    en: 'Enter your current password',
    'zh-CN': '请输入当前密码',
    'zh-TW': '請輸入當前密碼',
  },
  'settings.newPasswordPlaceholder': {
    en: 'Enter new password (at least 6 characters)',
    'zh-CN': '请输入新密码（至少6个字符）',
    'zh-TW': '請輸入新密碼（至少6個字元）',
  },
  'settings.confirmPasswordPlaceholder': {
    en: 'Re-enter new password',
    'zh-CN': '请再次输入新密码',
    'zh-TW': '請再次輸入新密碼',
  },
  'settings.newEmailPlaceholder': {
    en: 'Enter new email address',
    'zh-CN': '请输入新邮箱地址',
    'zh-TW': '請輸入新電子郵件地址',
  },
  'settings.changePasswordButton': {
    en: 'Change Password',
    'zh-CN': '修改密码',
    'zh-TW': '修改密碼',
  },
  'settings.changeEmailButton': {
    en: 'Change Email',
    'zh-CN': '修改邮箱',
    'zh-TW': '修改電子郵件',
  },
  'settings.fillAllFields': {
    en: 'Please fill in all fields',
    'zh-CN': '请填写所有字段',
    'zh-TW': '請填寫所有欄位',
  },
  'settings.passwordTooShort': {
    en: 'New password must be at least 6 characters',
    'zh-CN': '新密码至少需要6个字符',
    'zh-TW': '新密碼至少需要6個字元',
  },
  'settings.passwordMismatch': {
    en: 'New password and confirm password do not match',
    'zh-CN': '新密码和确认密码不匹配',
    'zh-TW': '新密碼和確認密碼不匹配',
  },
  'settings.passwordSame': {
    en: 'New password cannot be the same as current password',
    'zh-CN': '新密码不能与当前密码相同',
    'zh-TW': '新密碼不能與當前密碼相同',
  },
  'settings.invalidEmail': {
    en: 'Please enter a valid email address',
    'zh-CN': '请输入有效的邮箱地址',
    'zh-TW': '請輸入有效的電子郵件地址',
  },
  'settings.emailSame': {
    en: 'New email cannot be the same as current email',
    'zh-CN': '新邮箱不能与当前邮箱相同',
    'zh-TW': '新電子郵件不能與當前電子郵件相同',
  },
  'settings.changePasswordFailed': {
    en: 'Failed to change password',
    'zh-CN': '修改密码失败',
    'zh-TW': '修改密碼失敗',
  },
  'settings.changeEmailFailed': {
    en: 'Failed to change email',
    'zh-CN': '修改邮箱失败',
    'zh-TW': '修改電子郵件失敗',
  },
  'settings.changePasswordError': {
    en: 'An error occurred while changing password, please try again',
    'zh-CN': '修改密码时发生错误，请重试',
    'zh-TW': '修改密碼時發生錯誤，請重試',
  },
  'settings.changeEmailError': {
    en: 'An error occurred while changing email, please try again',
    'zh-CN': '修改邮箱时发生错误，请重试',
    'zh-TW': '修改電子郵件時發生錯誤，請重試',
  },

  // Admin
  'admin.templates.title': {
    en: 'Template Management',
    'zh-CN': '模板管理',
    'zh-TW': '範本管理',
  },
  'admin.templates.pageTitle': {
    en: 'School Template Management - Admin Panel',
    'zh-CN': '学校模板管理 - 管理后台',
    'zh-TW': '學校範本管理 - 管理後台',
  },
  'admin.templates.mainTitle': {
    en: 'School Application Template Management',
    'zh-CN': '学校申请模板管理',
    'zh-TW': '學校申請範本管理',
  },
  'admin.templates.description': {
    en: 'Create, edit and manage school application form templates',
    'zh-CN': '创建、编辑和管理学校申请表单模板',
    'zh-TW': '創建、編輯和管理學校申請表單範本',
  },
  'admin.templates.createNew': {
    en: 'Create New Template',
    'zh-CN': '创建新模板',
    'zh-TW': '創建新範本',
  },
  'admin.templates.import': {
    en: 'Import Template',
    'zh-CN': '导入模板',
    'zh-TW': '匯入範本',
  },
  'admin.templates.createFromBlank': {
    en: 'Create from Blank',
    'zh-CN': '从空白创建',
    'zh-TW': '從空白創建',
  },
  'admin.templates.createFromBlankDesc': {
    en: 'Create a brand new template',
    'zh-CN': '创建一个全新的模板',
    'zh-TW': '創建一個全新的範本',
  },
  'admin.templates.createFromTemplate': {
    en: 'Create from Category Template',
    'zh-CN': '基于类别模板创建',
    'zh-TW': '基於類別範本創建',
  },
  'admin.templates.noSystemTemplates': {
    en: 'No system templates available, please import master templates to database first',
    'zh-CN': '暂无系统模板，请先在数据库中导入主模板',
    'zh-TW': '暫無系統範本，請先在資料庫中匯入主範本',
  },
  'admin.templates.category.all': {
    en: 'All',
    'zh-CN': '全部',
    'zh-TW': '全部',
  },
  'admin.templates.category.international': {
    en: 'International School',
    'zh-CN': '国际学校',
    'zh-TW': '國際學校',
  },
  'admin.templates.category.hkSecondary': {
    en: 'Local Secondary',
    'zh-CN': '香港本地中学',
    'zh-TW': '香港本地中學',
  },
  'admin.templates.category.hkPrimary': {
    en: 'Local Primary',
    'zh-CN': '香港本地小学',
    'zh-TW': '香港本地小學',
  },
  'admin.templates.category.hkKindergarten': {
    en: 'Kindergarten',
    'zh-CN': '幼稚园',
    'zh-TW': '幼稚園',
  },
  'admin.templates.category.university': {
    en: 'University',
    'zh-CN': '大学',
    'zh-TW': '大學',
  },
  'admin.templates.loading': {
    en: 'Loading...',
    'zh-CN': '加载中...',
    'zh-TW': '載入中...',
  },
  'admin.templates.searchLabel': {
    en: 'Search templates',
    'zh-CN': '搜索模板',
    'zh-TW': '搜尋範本',
  },
  'admin.templates.searchPlaceholder': {
    en: 'Search by name, template ID, description...',
    'zh-CN': '按名称、ID、描述搜索...',
    'zh-TW': '依名稱、ID、描述搜尋...',
  },
  'admin.templates.clearSearch': {
    en: 'Clear search',
    'zh-CN': '清除搜索',
    'zh-TW': '清除搜尋',
  },
  'admin.templates.searchHint': {
    en: 'Enter keywords to filter templates instantly.',
    'zh-CN': '输入关键字可即时筛选模板。',
    'zh-TW': '輸入關鍵字即可即時篩選範本。',
  },
  'admin.templates.searchResults': {
    en: 'Showing results for "{keyword}"',
    'zh-CN': '显示与“{keyword}”相关的结果',
    'zh-TW': '顯示與「{keyword}」相關的結果',
  },
  'admin.templates.searching': {
    en: 'Searching templates...',
    'zh-CN': '正在搜索模板...',
    'zh-TW': '正在搜尋範本...',
  },
  'admin.templates.noTemplates': {
    en: 'No school templates yet',
    'zh-CN': '还没有任何学校模板',
    'zh-TW': '還沒有任何學校範本',
  },
  'admin.templates.noTemplatesCategory': {
    en: 'No templates in "{category}" category',
    'zh-CN': '还没有"{category}"类别的模板',
    'zh-TW': '還沒有"{category}"類別的範本',
  },
  'admin.templates.createFirst': {
    en: 'Create First Template',
    'zh-CN': '创建第一个模板',
    'zh-TW': '創建第一個範本',
  },
  'admin.templates.noTemplatesSearch': {
    en: 'No templates match "{keyword}".',
    'zh-CN': '没有找到与“{keyword}”匹配的模板。',
    'zh-TW': '沒有找到與「{keyword}」相符的範本。',
  },
  'admin.templates.systemTemplates': {
    en: 'System Preset Templates',
    'zh-CN': '系统预设模板',
    'zh-TW': '系統預設範本',
  },
  'admin.templates.myTemplates': {
    en: 'My Templates',
    'zh-CN': '我的模板',
    'zh-TW': '我的範本',
  },
  'admin.templates.status.active': {
    en: 'Active',
    'zh-CN': '已启用',
    'zh-TW': '已啟用',
  },
  'admin.templates.status.inactive': {
    en: 'Inactive',
    'zh-CN': '已禁用',
    'zh-TW': '已禁用',
  },
  'admin.templates.tag.system': {
    en: 'System template',
    'zh-CN': '系统模板',
    'zh-TW': '系統範本',
  },
  'admin.templates.label.templateId': {
    en: 'Template ID:',
    'zh-CN': '模板ID:',
    'zh-TW': '範本ID:',
  },
  'admin.templates.label.fieldCount': {
    en: 'Fields:',
    'zh-CN': '字段数:',
    'zh-TW': '欄位數:',
  },
  'admin.templates.label.updatedAt': {
    en: 'Updated:',
    'zh-CN': '更新于:',
    'zh-TW': '更新於:',
  },
  'admin.templates.action.createFrom': {
    en: 'Create from this template',
    'zh-CN': '基于此模板创建',
    'zh-TW': '基於此範本創建',
  },
  'admin.templates.action.preview': {
    en: 'Preview',
    'zh-CN': '预览',
    'zh-TW': '預覽',
  },
  'admin.templates.action.edit': {
    en: 'Edit',
    'zh-CN': '编辑',
    'zh-TW': '編輯',
  },
  'admin.templates.action.export': {
    en: 'Export as JSON',
    'zh-CN': '导出为JSON',
    'zh-TW': '匯出為JSON',
  },
  'admin.templates.noDescription': {
    en: 'No description provided yet.',
    'zh-CN': '暂无模板介绍。',
    'zh-TW': '暫無範本介紹。',
  },
  'admin.templates.action.delete': {
    en: 'Delete',
    'zh-CN': '删除',
    'zh-TW': '刪除',
  },
  'admin.templates.confirmDelete': {
    en: 'Are you sure you want to delete this template?',
    'zh-CN': '确定要删除此模板吗？',
    'zh-TW': '確定要刪除此範本嗎？',
  },
  'admin.templates.error.loadFailed': {
    en: 'Failed to load templates: {error}',
    'zh-CN': '加载模板失败: {error}',
    'zh-TW': '載入範本失敗: {error}',
  },
  'admin.templates.error.loadFailedNetwork': {
    en: 'An error occurred while loading templates, please check your network connection',
    'zh-CN': '加载模板时发生错误，请检查网络连接',
    'zh-TW': '載入範本時發生錯誤，請檢查網路連線',
  },
  'admin.templates.error.unknown': {
    en: 'Unknown error',
    'zh-CN': '未知错误',
    'zh-TW': '未知錯誤',
  },
  'admin.templates.success.delete': {
    en: 'Deleted successfully',
    'zh-CN': '删除成功',
    'zh-TW': '刪除成功',
  },
  'admin.templates.error.delete': {
    en: 'Failed to delete',
    'zh-CN': '删除失败',
    'zh-TW': '刪除失敗',
  },
  'admin.templates.error.cannotDeleteMaster': {
    en: 'Cannot delete master template. The master template is a system template and cannot be deleted. It contains all available fields and is essential for creating new school templates.',
    'zh-CN': '无法删除主模板。主模板是系统模板，不能删除。它包含所有可用字段，是创建新学校模板所必需的。',
    'zh-TW': '無法刪除主模板。主模板是系統範本，不能刪除。它包含所有可用欄位，是建立新學校範本所必需的。',
  },
  'admin.templates.action.deleteDisabledMaster': {
    en: 'Cannot delete master template (system template)',
    'zh-CN': '无法删除主模板（系统模板）',
    'zh-TW': '無法刪除主模板（系統範本）',
  },
  'admin.templates.action.createMaster': {
    en: 'Create Master Template',
    'zh-CN': '创建主模板',
    'zh-TW': '創建主範本',
  },
  'admin.templates.createMasterDesc': {
    en: 'Create the master template with all available fields',
    'zh-CN': '创建包含所有可用字段的主模板',
    'zh-TW': '創建包含所有可用欄位的主範本',
  },
  'admin.templates.createMasterModal.title': {
    en: 'Create a New Master Template',
    'zh-CN': '创建新的主模板',
    'zh-TW': '創建新的主範本',
  },
  'admin.templates.createMasterModal.description': {
    en: 'Use the master field library to generate a system template. You can customize the school ID, display name, category, and status.',
    'zh-CN': '使用主字段库生成系统模板。可以自定义学校 ID、显示名称、分类和状态。',
    'zh-TW': '使用主欄位庫建立系統範本。可以自訂學校 ID、顯示名稱、分類與狀態。',
  },
  'admin.templates.createMasterModal.field.schoolId': {
    en: 'School ID',
    'zh-CN': '学校 ID',
    'zh-TW': '學校 ID',
  },
  'admin.templates.createMasterModal.field.schoolIdHelp': {
    en: 'Must start with {prefix}. Only letters, numbers, and hyphens are recommended.',
    'zh-CN': '必须以 {prefix} 开头，建议只使用字母、数字和连字符。',
    'zh-TW': '必須以 {prefix} 開頭，建議只使用字母、數字與連字號。',
  },
  'admin.templates.createMasterModal.field.schoolNameZhCN': {
    en: 'School Name (Simplified Chinese)',
    'zh-CN': '学校名称（简体中文）',
    'zh-TW': '學校名稱（簡體中文）',
  },
  'admin.templates.createMasterModal.field.schoolNameZhTW': {
    en: 'School Name (Traditional Chinese)',
    'zh-CN': '学校名称（繁体中文）',
    'zh-TW': '學校名稱（繁體中文）',
  },
  'admin.templates.createMasterModal.field.schoolNameEn': {
    en: 'School Name (English)',
    'zh-CN': '学校名称（英文）',
    'zh-TW': '學校名稱（英文）',
  },
  'admin.templates.createMasterModal.field.program': {
    en: 'Program',
    'zh-CN': '项目',
    'zh-TW': '項目',
  },
  'admin.templates.createMasterModal.field.description': {
    en: 'Description',
    'zh-CN': '描述',
    'zh-TW': '描述',
  },
  'admin.templates.createMasterModal.field.category': {
    en: 'Category',
    'zh-CN': '分类',
    'zh-TW': '分類',
  },
  'admin.templates.createMasterModal.field.isActive': {
    en: 'Mark as active (students can see this template)',
    'zh-CN': '标记为启用（学生可见）',
    'zh-TW': '標記為啟用（學生可見）',
  },
  'admin.templates.createMasterModal.cancel': {
    en: 'Cancel',
    'zh-CN': '取消',
    'zh-TW': '取消',
  },
  'admin.templates.createMasterModal.submit': {
    en: 'Create Template',
    'zh-CN': '创建模板',
    'zh-TW': '建立範本',
  },
  'admin.templates.createMasterModal.submitting': {
    en: 'Creating...',
    'zh-CN': '创建中...',
    'zh-TW': '建立中...',
  },
  'admin.templates.createMasterModal.schoolIdRequired': {
    en: 'Please enter a school ID.',
    'zh-CN': '请输入学校 ID。',
    'zh-TW': '請輸入學校 ID。',
  },
  'admin.templates.confirmCreateMaster': {
    en: 'Are you sure you want to create the master template? This will create a template with all available fields that can be used as a base for creating school-specific templates.',
    'zh-CN': '确定要创建主模板吗？这将创建包含所有可用字段的模板，可以作为创建具体学校模板的基础。',
    'zh-TW': '確定要創建主範本嗎？這將創建包含所有可用欄位的範本，可以作為創建具體學校範本的基礎。',
  },
  'admin.templates.success.createMaster': {
    en: 'Master template created successfully!',
    'zh-CN': '主模板创建成功！',
    'zh-TW': '主範本創建成功！',
  },
  'admin.templates.error.createMaster': {
    en: 'Failed to create master template',
    'zh-CN': '创建主模板失败',
    'zh-TW': '創建主範本失敗',
  },
  'admin.templates.import.title': {
    en: 'Import School Template',
    'zh-CN': '导入学校模板',
    'zh-TW': '匯入學校範本',
  },
  'admin.templates.import.uploadFile': {
    en: 'Upload JSON File',
    'zh-CN': '上传 JSON 文件',
    'zh-TW': '上傳 JSON 檔案',
  },
  'admin.templates.import.or': {
    en: 'or',
    'zh-CN': '或者',
    'zh-TW': '或者',
  },
  'admin.templates.import.pasteJson': {
    en: 'Paste JSON Content',
    'zh-CN': '粘贴 JSON 内容',
    'zh-TW': '貼上 JSON 內容',
  },
  'admin.templates.import.cancel': {
    en: 'Cancel',
    'zh-CN': '取消',
    'zh-TW': '取消',
  },
  'admin.templates.import.importing': {
    en: 'Importing...',
    'zh-CN': '导入中...',
    'zh-TW': '匯入中...',
  },
  'admin.templates.import.import': {
    en: 'Import',
    'zh-CN': '导入',
    'zh-TW': '匯入',
  },
  'admin.templates.import.success': {
    en: 'Imported successfully!',
    'zh-CN': '导入成功！',
    'zh-TW': '匯入成功！',
  },
  'admin.templates.import.error': {
    en: 'Import failed: {error}',
    'zh-CN': '导入失败: {error}',
    'zh-TW': '匯入失敗: {error}',
  },
  'admin.templates.import.errorFormat': {
    en: 'Import failed: JSON format error',
    'zh-CN': '导入失败：JSON 格式错误',
    'zh-TW': '匯入失敗：JSON 格式錯誤',
  },
  'admin.templates.import.errorNoInput': {
    en: 'Please select a file or enter JSON',
    'zh-CN': '请选择文件或输入 JSON',
    'zh-TW': '請選擇檔案或輸入 JSON',
  },
  'admin.translations.title': {
    en: 'Translation Management',
    'zh-CN': '翻译管理',
    'zh-TW': '翻譯管理',
  },
  'admin.translations.description': {
    en: 'Manage all translations for the application',
    'zh-CN': '管理应用程序的所有翻译',
    'zh-TW': '管理應用程式的所有翻譯',
  },
  'admin.translations.key': {
    en: 'Key',
    'zh-CN': '键',
    'zh-TW': '鍵',
  },
  'admin.translations.english': {
    en: 'English',
    'zh-CN': '英文',
    'zh-TW': '英文',
  },
  'admin.translations.simplifiedChinese': {
    en: 'Simplified Chinese',
    'zh-CN': '简体中文',
    'zh-TW': '簡體中文',
  },
  'admin.translations.traditionalChinese': {
    en: 'Traditional Chinese',
    'zh-CN': '繁体中文',
    'zh-TW': '繁體中文',
  },
  'admin.translations.save': {
    en: 'Save Translations',
    'zh-CN': '保存翻译',
    'zh-TW': '儲存翻譯',
  },
  'admin.translations.saving': {
    en: 'Saving...',
    'zh-CN': '保存中...',
    'zh-TW': '儲存中...',
  },
  'admin.translations.saveSuccess': {
    en: 'Translations saved successfully!',
    'zh-CN': '翻译保存成功！',
    'zh-TW': '翻譯儲存成功！',
  },
  'admin.translations.saveError': {
    en: 'Failed to save translations',
    'zh-CN': '保存翻译失败',
    'zh-TW': '儲存翻譯失敗',
  },
  'admin.translations.addNew': {
    en: 'Add New Translation',
    'zh-CN': '添加新翻译',
    'zh-TW': '新增翻譯',
  },
  'admin.translations.search': {
    en: 'Search translations...',
    'zh-CN': '搜索翻译...',
    'zh-TW': '搜尋翻譯...',
  },
  'admin.userManagement': {
    en: 'User Management',
    'zh-CN': '用户管理',
    'zh-TW': '用戶管理',
  },
  'admin.users.title': {
    en: 'User Management',
    'zh-CN': '用户管理',
    'zh-TW': '用戶管理',
  },
  'admin.users.subtitle': {
    en: 'View, search and manage all user accounts in the system',
    'zh-CN': '查看、搜索并管理系统中的所有用户账号',
    'zh-TW': '查看、搜尋並管理系統中的所有用戶帳號',
  },
  'admin.users.totalUsers': {
    en: 'Total Users',
    'zh-CN': '用户总数',
    'zh-TW': '用戶總數',
  },
  'admin.users.admins': {
    en: 'Admins',
    'zh-CN': '管理员',
    'zh-TW': '管理員',
  },
  'admin.users.normalUsers': {
    en: 'Regular Users',
    'zh-CN': '普通用户',
    'zh-TW': '普通用戶',
  },
  'admin.users.search': {
    en: 'Search',
    'zh-CN': '搜索',
    'zh-TW': '搜尋',
  },
  'admin.users.searchLabel': {
    en: 'Search (Email / Name)',
    'zh-CN': '搜索（邮箱 / 姓名）',
    'zh-TW': '搜尋（電子郵件 / 姓名）',
  },
  'admin.users.searchPlaceholder': {
    en: 'Enter email or name keyword',
    'zh-CN': '输入邮箱或姓名关键字',
    'zh-TW': '輸入電子郵件或姓名關鍵字',
  },
  'admin.users.roleFilter': {
    en: 'Role Filter',
    'zh-CN': '角色筛选',
    'zh-TW': '角色篩選',
  },
  'admin.users.all': {
    en: 'All',
    'zh-CN': '全部',
    'zh-TW': '全部',
  },
  'admin.users.admin': {
    en: 'Admin',
    'zh-CN': '管理员',
    'zh-TW': '管理員',
  },
  'admin.users.user': {
    en: 'Regular User',
    'zh-CN': '普通用户',
    'zh-TW': '普通用戶',
  },
  'admin.users.refresh': {
    en: 'Refresh',
    'zh-CN': '刷新',
    'zh-TW': '重新整理',
  },
  'admin.users.refreshTitle': {
    en: 'Refresh list',
    'zh-CN': '刷新列表',
    'zh-TW': '重新整理列表',
  },
  'admin.users.reset': {
    en: 'Reset',
    'zh-CN': '重置',
    'zh-TW': '重置',
  },
  'admin.users.resetTitle': {
    en: 'Clear filters',
    'zh-CN': '清除筛选',
    'zh-TW': '清除篩選',
  },
  'admin.users.name': {
    en: 'Name',
    'zh-CN': '姓名',
    'zh-TW': '姓名',
  },
  'admin.users.email': {
    en: 'Email',
    'zh-CN': '邮箱',
    'zh-TW': '電子郵件',
  },
  'admin.users.role': {
    en: 'Role',
    'zh-CN': '角色',
    'zh-TW': '角色',
  },
  'admin.users.registeredAt': {
    en: 'Registered At',
    'zh-CN': '注册时间',
    'zh-TW': '註冊時間',
  },
  'admin.users.actions': {
    en: 'Actions',
    'zh-CN': '操作',
    'zh-TW': '操作',
  },
  'admin.users.loading': {
    en: 'Loading user data...',
    'zh-CN': '正在加载用户数据...',
    'zh-TW': '正在載入用戶資料...',
  },
  'admin.users.noUsers': {
    en: 'No user data available',
    'zh-CN': '暂无用户数据',
    'zh-TW': '暫無用戶資料',
  },
  'admin.users.downgrade': {
    en: 'Downgrade',
    'zh-CN': '降级',
    'zh-TW': '降級',
  },
  'admin.users.upgradeToAdmin': {
    en: 'Upgrade to Admin',
    'zh-CN': '升级为管理员',
    'zh-TW': '升級為管理員',
  },
  'admin.users.delete': {
    en: 'Delete',
    'zh-CN': '删除',
    'zh-TW': '刪除',
  },
  'admin.users.confirmDowngrade': {
    en: 'Are you sure you want to downgrade {email} to a regular user?',
    'zh-CN': '确定要将 {email} 降级为普通用户吗？',
    'zh-TW': '確定要將 {email} 降級為普通用戶嗎？',
  },
  'admin.users.confirmUpgrade': {
    en: 'Are you sure you want to upgrade {email} to an administrator?',
    'zh-CN': '确定要将 {email} 升级为管理员吗？',
    'zh-TW': '確定要將 {email} 升級為管理員嗎？',
  },
  'admin.users.confirmDelete': {
    en: 'Are you sure you want to permanently delete {email}? This action cannot be undone.',
    'zh-CN': '确定要永久删除 {email} 吗？此操作不可恢复。',
    'zh-TW': '確定要永久刪除 {email} 嗎？此操作無法復原。',
  },
  'admin.users.loadFailed': {
    en: 'Failed to load user list',
    'zh-CN': '加载用户列表失败',
    'zh-TW': '載入用戶列表失敗',
  },
  'admin.users.loadError': {
    en: 'Load failed',
    'zh-CN': '加载失败',
    'zh-TW': '載入失敗',
  },
  'admin.users.updateRoleFailed': {
    en: 'Failed to update role',
    'zh-CN': '更新角色失败',
    'zh-TW': '更新角色失敗',
  },
  'admin.users.deleteFailed': {
    en: 'Failed to delete user',
    'zh-CN': '删除用户失败',
    'zh-TW': '刪除用戶失敗',
  },
};

// Helper function to get translation with fallback
export function getTranslation(
  key: string,
  language: Language,
  translations: TranslationData
): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key; // Fallback to key if not found
  }
  return translation[language] || translation.en || key;
}

// Load translations from file or API
export async function loadTranslations(): Promise<TranslationData> {
  try {
    // Try to load from API first (for admin updates)
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/translations');
      if (response.ok) {
        const data = await response.json();
        const apiTranslations = data.translations || {};
        // Merge with defaults (API translations override defaults)
        return { ...translations, ...apiTranslations };
      }
    }
  } catch (error) {
    console.warn('Failed to load translations from API, using defaults');
  }
  return translations;
}

