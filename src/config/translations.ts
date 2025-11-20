/**
 * 多语言翻译配置文件
 * 支持英文、简体中文和繁体中文
 * Multi-language translation configuration
 * Supports English, Simplified Chinese, and Traditional Chinese
 */

export type Language = 'en' | 'zh-CN' | 'zh-TW';

export interface Translations {
  common: {
    appName: string;
    appNameShort: string;
    login: string;
    logout: string;
    register: string;
    getStarted: string;
    save: string;
    cancel: string;
    submit: string;
    back: string;
    next: string;
    loading: string;
    error: string;
    success: string;
    delete: string;
    edit: string;
    view: string;
    continue: string;
    saving: string;
    previous: string;
    field: string;
    of: string;
  };
  home: {
    title: string;
    subtitle: string;
    startApplication: string;
    learnMore: string;
    whyChoose: string;
    features: {
      autoFill: { title: string; description: string };
      aiGuidance: { title: string; description: string };
      essayGeneration: { title: string; description: string };
      multipleSchools: { title: string; description: string };
    };
    howItWorks: {
      title: string;
      step1: { title: string; description: string };
      step2: { title: string; description: string };
      step3: { title: string; description: string };
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
    footer: {
      copyright: string;
    };
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      emailOption: string;
      emailPlaceholder: string;
      usernameOption: string;
      username: string;
      usernamePlaceholder: string;
      chooseMethod: string;
      identifierRequired: string;
      password: string;
      button: string;
      signingIn: string;
      noAccount: string;
      signUp: string;
      orText: string;
      createAccount: string;
    };
    register: {
      title: string;
      name: string;
      username: string;
      usernamePlaceholder: string;
      usernameHelp: string;
      email: string;
      password: string;
      confirmPassword: string;
      button: string;
      registering: string;
      hasAccount: string;
      signIn: string;
      alreadyHaveAccount: string;
      noAccount: string;
      joinUs: string;
    };
    errors: {
      passwordMismatch: string;
      passwordTooShort: string;
      registrationFailed: string;
      loginFailed: string;
      usernameInvalid: string;
    };
  };
  profile: {
    title: string;
    basicInfo: string;
    fullName: string;
    phone: string;
    birthday: string;
    nationality: string;
    education: string;
    experiences: string;
    essays: string;
    save: string;
    setupTitle: string;
    setupSubtitle: string;
    manageInfo: string;
    saveChanges: string;
    saveSuccess: string;
    saveError: string;
    addEducation: string;
    addExperience: string;
    educationItem: string;
    experienceItem: string;
    schoolName: string;
    degree: string;
    major: string;
    gpa: string;
    startDate: string;
    endDate: string;
    jobTitle: string;
    organization: string;
    jobDescription: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    noApplications: string;
    noApplicationsDesc: string;
    startNew: string;
    newApplication: string;
    myApplications: string;
    school: string;
    program: string;
    status: string;
    lastUpdated: string;
    updated: string;
    actions: string;
    continue: string;
    continueApplication: string;
    view: string;
    viewApplication: string;
    delete: string;
    deleteConfirm: string;
    createFirst: string;
    chooseSchool: string;
    draft: string;
    inProgress: string;
    submitted: string;
    manageTemplates: string;
  };
  application: {
    title: string;
    fillForm: string;
    autoFill: string;
    aiHelp: string;
    generateWithAI: string;
    improveContent: string;
    saveProgress: string;
    submitApplication: string;
    export: string;
    exportHTML: string;
    exportTXT: string;
    exportJSON: string;
    exportHTMLDesc: string;
    exportTXTDesc: string;
    exportJSONDesc: string;
    progress: string;
    completed: string;
    viewAllFields: string;
    stepByStepMode: string;
    allFieldsMode: string;
    allFields: string;
    notFound: string;
    submitSuccess: string;
    saveSuccess: string;
    saveError: string;
    exportError: string;
    exportHTMLSuccess: string;
    previous: string;
    next: string;
  };
  ai: {
    fieldGuidance: string;
    whatIsThis: string;
    requirements: string;
    examples: string;
    suggestion: string;
    useThis: string;
    generating: string;
    analyzing: string;
    generateContent: string;
    improvements: string;
    improvedVersion: string;
    mockNotice: string;
    aiGuidance: string;
    fieldRequirement: string;
    fieldRequirements: string;
    tipsAndExamples: string;
    useThisSuggestion: string;
    useThisVersion: string;
  };
  settings: {
    title: string;
    subtitle: string;
    changePassword: string;
    changeEmail: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    passwordChanged: string;
    emailChanged: string;
    fillAllFields: string;
    passwordTooShort: string;
    passwordMismatch: string;
    passwordSame: string;
    changePasswordError: string;
    changePasswordFailed: string;
    enterCurrentPassword: string;
    enterNewPassword: string;
    enterConfirmPassword: string;
    changeEmailError: string;
    invalidEmail: string;
    emailSame: string;
    changeEmailFailed: string;
    currentEmail: string;
    currentEmailDesc: string;
    newEmail: string;
    enterNewEmail: string;
    verifyPassword: string;
    enterVerifyPassword: string;
  };
  admin: {
    templateManagement: string;
    manageTemplates: string;
    createTemplate: string;
    importTemplate: string;
    createFromBlank: string;
    createFromTemplate: string;
    systemTemplates: string;
    myTemplates: string;
    allCategories: string;
    noTemplates: string;
    noCategoryTemplates: string;
    createFirstTemplate: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteError: string;
    exportSuccess: string;
    importSuccess: string;
    importError: string;
    importJSONError: string;
    selectFileOrJSON: string;
    uploadJSON: string;
    pasteJSON: string;
    templateId: string;
    fieldCount: string;
    updatedAt: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    searchHint: string;
    searchResults: string;
    searching: string;
    noTemplatesSearch: string;
    noDescription: string;
    tagSystem: string;
    active: string;
    inactive: string;
    preview: string;
    exportJSON: string;
    categories: {
      international: string;
      localSecondary: string;
      localPrimary: string;
      kindergarten: string;
      university: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  // English translations
  en: {
    common: {
      appName: 'School Application Assistant',
      appNameShort: 'Application Assistant',
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      getStarted: 'Get Started',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      continue: 'Continue',
      saving: 'Saving...',
      previous: 'Previous',
      field: 'Field',
      of: 'of',
    },
    home: {
      title: 'Your AI-Powered School Application Assistant',
      subtitle: 'Simplify the application process with intelligent form filling, personalized guidance, and AI-generated essays. Apply to your dream schools with confidence.',
      startApplication: 'Start Your Application',
      learnMore: 'Learn More',
      whyChoose: 'Why Choose Our Platform?',
      features: {
        autoFill: {
          title: 'Smart Auto-Fill',
          description: 'Automatically populate application forms with your saved profile information'
        },
        aiGuidance: {
          title: 'AI Guidance',
          description: 'Get real-time assistance and explanations for every field you need to fill'
        },
        essayGeneration: {
          title: 'Essay Generation',
          description: 'Create compelling essays and personal statements with AI-powered drafts'
        },
        multipleSchools: {
          title: 'Multiple Schools',
          description: 'Apply to multiple schools efficiently with reusable profile data'
        }
      },
      howItWorks: {
        title: 'How It Works',
        step1: {
          title: 'Create Your Profile',
          description: 'Fill in your basic information, education history, and experiences once'
        },
        step2: {
          title: 'Select Your Schools',
          description: 'Choose the schools and programs you want to apply to from our templates'
        },
        step3: {
          title: 'Complete with AI Help',
          description: 'Let AI guide you through each field and generate compelling content'
        }
      },
      cta: {
        title: 'Ready to Get Started?',
        subtitle: 'Join thousands of students who have simplified their application process',
        button: 'Create Free Account'
      },
      footer: {
        copyright: '© 2024 School Application Assistant. All rights reserved.'
      }
    },
    auth: {
      login: {
        title: 'Sign in to your account',
        subtitle: 'Please sign in to your account',
        email: 'Email address',
        emailOption: 'Use email',
        emailPlaceholder: 'you@example.com',
        usernameOption: 'Use username',
        username: 'Username',
        usernamePlaceholder: 'your_username',
        chooseMethod: 'Login method',
        identifierRequired: 'Please enter your email or username',
        password: 'Password',
        button: 'Sign in',
        signingIn: 'Signing in...',
        noAccount: "Don't have an account?",
        signUp: 'Sign up',
        orText: 'Or',
        createAccount: 'create a new account',
      },
      register: {
        title: 'Create your account',
        name: 'Full Name',
        username: 'Username',
        usernamePlaceholder: '3-20 characters, letters/numbers/_',
        usernameHelp: 'Only letters, numbers, and underscores. This will be used for username login.',
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        button: 'Create account',
        registering: 'Creating account...',
        hasAccount: 'Already have an account?',
        signIn: 'Sign in',
        alreadyHaveAccount: 'Already have an account?',
        noAccount: "Don't have an account?",
        joinUs: 'Join us now and start your journey with us',
      },
      errors: {
        passwordMismatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 6 characters',
        registrationFailed: 'Registration failed',
        loginFailed: 'Login failed',
        usernameInvalid: 'Username must be 3-20 letters, numbers, or underscores',
      }
    },
    profile: {
      title: 'Profile',
      basicInfo: 'Basic Information',
      fullName: 'Full Name',
      phone: 'Phone',
      birthday: 'Birthday',
      nationality: 'Nationality',
      education: 'Education',
      experiences: 'Work/Internship Experience',
      essays: 'Personal Statements',
      save: 'Save Profile',
      setupTitle: 'Complete Your Profile',
      setupSubtitle: 'Fill in your information to get better AI-powered application assistance',
      manageInfo: 'Manage your personal information for applications',
      saveChanges: 'Save Changes',
      saveSuccess: 'Profile saved successfully!',
      saveError: 'Failed to save, please try again',
      addEducation: 'Add Education',
      addExperience: 'Add Experience',
      educationItem: 'Education',
      experienceItem: 'Experience',
      schoolName: 'School Name',
      degree: 'Degree',
      major: 'Major',
      gpa: 'GPA',
      startDate: 'Start Date',
      endDate: 'End Date',
      jobTitle: 'Job Title',
      organization: 'Company/Organization',
      jobDescription: 'Job Description'
    },
    dashboard: {
      title: 'My Applications',
      subtitle: 'Manage and track your school applications',
      noApplications: 'No applications yet',
      noApplicationsDesc: 'Start your first application to get going!',
      startNew: 'Start New Application',
      newApplication: 'New Application',
      myApplications: 'My Applications',
      school: 'School',
      program: 'Program',
      status: 'Status',
      lastUpdated: 'Last Updated',
      updated: 'Updated',
      actions: 'Actions',
      continue: 'Continue',
      continueApplication: 'Continue Application',
      view: 'View',
      viewApplication: 'View Application',
      delete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this application?',
      createFirst: 'Create Your First Application',
      chooseSchool: 'Choose a School to Apply',
      draft: 'Draft',
      inProgress: 'In Progress',
      submitted: 'Submitted',
      manageTemplates: 'Manage Templates',
    },
    application: {
      title: 'Application Form',
      fillForm: 'Fill Form',
      autoFill: 'Auto-Fill',
      aiHelp: 'AI Help',
      generateWithAI: 'Generate with AI',
      improveContent: 'Get Improvement Suggestions',
      saveProgress: 'Save Progress',
      submitApplication: 'Submit Application',
      export: 'Export',
      exportHTML: 'Export as HTML',
      exportTXT: 'Export as TXT',
      exportJSON: 'Export as JSON',
      exportHTMLDesc: 'Can be printed as PDF',
      exportTXTDesc: 'Plain text format',
      exportJSONDesc: 'Data backup',
      progress: 'Progress',
      completed: 'Completed',
      viewAllFields: 'View All Fields',
      stepByStepMode: 'Switch to Step-by-Step Mode',
      allFieldsMode: 'All Fields Mode',
      allFields: 'All Application Fields',
      notFound: 'Application not found',
      submitSuccess: 'Application submitted successfully!',
      saveSuccess: 'Progress saved!',
      saveError: 'Error saving application',
      exportError: 'Export failed, please try again',
      exportHTMLSuccess: 'HTML file downloaded!\n\nYou can:\n1. Open the HTML file in your browser\n2. Press Ctrl+P to print\n3. Select "Save as PDF"\n4. Save the PDF file',
      previous: 'Previous',
      next: 'Next',
    },
    ai: {
      fieldGuidance: 'AI Field Guidance',
      whatIsThis: 'What this field requires:',
      requirements: 'Requirements:',
      examples: 'Tips and Examples:',
      suggestion: 'AI Suggestion:',
      useThis: 'Use This Suggestion',
      generating: 'Generating...',
      analyzing: 'Analyzing...',
      generateContent: 'Generate Content with AI',
      improvements: 'Improvement Suggestions',
      improvedVersion: 'Improved Version:',
      mockNotice: '[This is a mock AI response. Add your OpenAI API key to get personalized content generation.]',
      aiGuidance: 'AI Guidance',
      fieldRequirement: 'What this field requires:',
      fieldRequirements: 'Requirements:',
      tipsAndExamples: 'Tips and Examples:',
      useThisSuggestion: 'Use This Suggestion',
      useThisVersion: 'Use This Version',
    },
    settings: {
      title: 'Account Settings',
      subtitle: 'Manage your account information and security settings',
      changePassword: 'Change Password',
      changeEmail: 'Change Email',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      passwordChanged: 'Password changed successfully!',
      emailChanged: 'Email changed successfully!',
      fillAllFields: 'Please fill in all fields',
      passwordTooShort: 'New password must be at least 6 characters',
      passwordMismatch: 'New password and confirm password do not match',
      passwordSame: 'New password cannot be the same as current password',
      changePasswordError: 'Error changing password, please try again',
      changePasswordFailed: 'Failed to change password',
      enterCurrentPassword: 'Please enter current password',
      enterNewPassword: 'Please enter new password (at least 6 characters)',
      enterConfirmPassword: 'Please enter new password again',
      changeEmailError: 'Error changing email, please try again',
      invalidEmail: 'Please enter a valid email address',
      emailSame: 'New email cannot be the same as current email',
      changeEmailFailed: 'Failed to change email',
      currentEmail: 'Current Email',
      currentEmailDesc: 'This is your current email address',
      newEmail: 'New Email',
      enterNewEmail: 'Please enter new email address',
      verifyPassword: 'Current Password (Verify Identity)',
      enterVerifyPassword: 'Please enter current password to verify identity',
    },
    admin: {
      templateManagement: 'School Application Template Management',
      manageTemplates: 'Manage Templates',
      createTemplate: 'Create New Template',
      importTemplate: 'Import Template',
      createFromBlank: 'Create from Blank',
      createFromTemplate: 'Create from Template',
      systemTemplates: 'System Templates',
      myTemplates: 'My Templates',
      allCategories: 'All',
      noTemplates: 'No templates yet',
      noCategoryTemplates: 'No templates in this category yet',
      createFirstTemplate: 'Create First Template',
      deleteConfirm: 'Are you sure you want to delete this template?',
      deleteSuccess: 'Deleted successfully',
      deleteError: 'Failed to delete',
      exportSuccess: 'Export successful',
      importSuccess: 'Import successful!',
      importError: 'Import failed',
      importJSONError: 'Import failed: JSON format error',
      selectFileOrJSON: 'Please select a file or enter JSON',
      uploadJSON: 'Upload JSON File',
      pasteJSON: 'Paste JSON Content',
      templateId: 'Template ID',
      fieldCount: 'Field Count',
      updatedAt: 'Updated',
      searchLabel: 'Search templates',
      searchPlaceholder: 'Search by name, template ID, description...',
      clearSearch: 'Clear search',
      searchHint: 'Enter keywords to filter templates instantly.',
      searchResults: 'Showing results for "{keyword}"',
      searching: 'Searching templates...',
      noTemplatesSearch: 'No templates match "{keyword}".',
      noDescription: 'No description provided yet.',
      tagSystem: 'System template',
      active: 'Active',
      inactive: 'Inactive',
      preview: 'Preview',
      exportJSON: 'Export as JSON',
      categories: {
        international: 'International Schools',
        localSecondary: 'Local Secondary Schools',
        localPrimary: 'Local Primary Schools',
        kindergarten: 'Kindergarten',
        university: 'University',
      },
    },
  },
  // Simplified Chinese translations (简体中文)
  'zh-CN': {
    common: {
      appName: '学校申请助手',
      appNameShort: '申请助手',
      login: '登录',
      logout: '退出',
      register: '注册',
      getStarted: '开始使用',
      save: '保存',
      cancel: '取消',
      submit: '提交',
      back: '返回',
      next: '下一步',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      delete: '删除',
      edit: '编辑',
      view: '查看',
      continue: '继续',
      saving: '保存中...',
      previous: '上一个',
      field: '字段',
      of: '/',
    },
    home: {
      title: 'AI 驱动的学校申请助手',
      subtitle: '通过智能表单填写、个性化指导和 AI 生成的文书，简化申请流程。自信地申请您的梦想学校。',
      startApplication: '开始申请',
      learnMore: '了解更多',
      whyChoose: '为什么选择我们？',
      features: {
        autoFill: {
          title: '智能自动填充',
          description: '使用保存的个人资料自动填充申请表单'
        },
        aiGuidance: {
          title: 'AI 智能指导',
          description: '为每个需要填写的字段提供实时帮助和说明'
        },
        essayGeneration: {
          title: '文书生成',
          description: '使用 AI 创建引人注目的个人陈述和申请文书'
        },
        multipleSchools: {
          title: '多所学校管理',
          description: '通过可重复使用的资料数据高效申请多所学校'
        }
      },
      howItWorks: {
        title: '如何使用',
        step1: {
          title: '创建您的资料',
          description: '一次性填写基本信息、教育经历和工作经验'
        },
        step2: {
          title: '选择学校',
          description: '从我们的模板中选择您想申请的学校和项目'
        },
        step3: {
          title: '在 AI 帮助下完成',
          description: '让 AI 指导您完成每个字段并生成出色的内容'
        }
      },
      cta: {
        title: '准备开始了吗？',
        subtitle: '加入成千上万简化申请流程的学生',
        button: '免费创建账户'
      },
      footer: {
        copyright: '© 2024 学校申请助手。保留所有权利。'
      }
    },
    auth: {
      login: {
        title: '登录到您的账户',
        subtitle: '请使用您的账号进行登录',
        email: '邮箱地址',
        emailOption: '邮箱登录',
        emailPlaceholder: '请输入邮箱地址',
        usernameOption: '用户名登录',
        username: '用户名',
        usernamePlaceholder: '请输入用户名',
        chooseMethod: '登录方式',
        identifierRequired: '请输入邮箱或用户名',
        password: '密码',
        button: '登录',
        signingIn: '登录中...',
        noAccount: '还没有账户？',
        signUp: '注册',
        orText: '或者',
        createAccount: '创建新账户',
      },
      register: {
        title: '创建您的账户',
        name: '姓名',
        username: '用户名',
        usernamePlaceholder: '3-20 个字符，仅限字母/数字/下划线',
        usernameHelp: '仅支持字母、数字和下划线。登录时可选择使用用户名。',
        email: '邮箱地址',
        password: '密码',
        confirmPassword: '确认密码',
        button: '注册',
        registering: '注册中...',
        hasAccount: '已有账户？',
        signIn: '登录',
        alreadyHaveAccount: '已有账户？',
        noAccount: '还没有账户？',
        joinUs: '立即注册加入我们，和我们一起开始旅程吧',
      },
      errors: {
        passwordMismatch: '两次输入的密码不一致',
        passwordTooShort: '密码至少需要6个字符',
        registrationFailed: '注册失败',
        loginFailed: '登录失败',
        usernameInvalid: '用户名需 3-20 位，仅可包含字母、数字或下划线',
      }
    },
    profile: {
      title: '个人资料',
      basicInfo: '基本信息',
      fullName: '全名',
      phone: '电话',
      birthday: '生日',
      nationality: '国籍',
      education: '教育背景',
      experiences: '工作/实习经历',
      essays: '个人陈述',
      save: '保存资料',
      setupTitle: '完善您的资料',
      setupSubtitle: '填写您的信息，让 AI 为您提供更好的申请帮助',
      manageInfo: '管理您的个人信息以用于申请',
      saveChanges: '保存更改',
      saveSuccess: '个人资料保存成功！',
      saveError: '保存失败，请重试',
      addEducation: '添加教育经历',
      addExperience: '添加经历',
      educationItem: '教育经历',
      experienceItem: '经历',
      schoolName: '学校名称',
      degree: '学位',
      major: '专业',
      gpa: 'GPA',
      startDate: '开始日期',
      endDate: '结束日期',
      jobTitle: '职位名称',
      organization: '公司/组织',
      jobDescription: '工作描述',
    },
    dashboard: {
      title: '我的申请',
      subtitle: '管理和跟踪您的学校申请',
      noApplications: '还没有申请',
      noApplicationsDesc: '开始您的第一个申请吧！',
      startNew: '开始新申请',
      newApplication: '新建申请',
      myApplications: '我的申请列表',
      school: '学校',
      program: '项目',
      status: '状态',
      lastUpdated: '最后更新',
      updated: '更新于',
      actions: '操作',
      continue: '继续',
      continueApplication: '继续申请',
      view: '查看',
      viewApplication: '查看申请',
      delete: '删除',
      deleteConfirm: '确定要删除这个申请吗？',
      createFirst: '创建您的第一个申请',
      chooseSchool: '选择要申请的学校',
      draft: '草稿',
      inProgress: '进行中',
      submitted: '已提交',
      manageTemplates: '管理模板',
    },
    application: {
      title: '申请表单',
      fillForm: '填写表单',
      autoFill: '自动填充',
      aiHelp: 'AI 帮助',
      generateWithAI: '使用 AI 生成',
      improveContent: '获取改进建议',
      saveProgress: '保存进度',
      submitApplication: '提交申请',
      export: '导出',
      exportHTML: '导出为 HTML',
      exportTXT: '导出为 TXT',
      exportJSON: '导出为 JSON',
      exportHTMLDesc: '可打印为 PDF',
      exportTXTDesc: '纯文本格式',
      exportJSONDesc: '数据备份',
      progress: '完成进度',
      completed: '已完成',
      viewAllFields: '查看所有字段',
      stepByStepMode: '切换到逐步填写模式',
      allFieldsMode: '所有字段模式',
      allFields: '所有申请字段',
      notFound: '申请未找到',
      submitSuccess: '申请提交成功！',
      saveSuccess: '进度已保存！',
      saveError: '保存申请时出错',
      exportError: '导出失败，请重试',
      exportHTMLSuccess: 'HTML 文件已下载！\n\n您可以：\n1. 在浏览器中打开 HTML 文件\n2. 按 Ctrl+P 打印\n3. 选择"另存为 PDF"\n4. 保存 PDF 文件',
      previous: '上一个',
      next: '下一个',
    },
    ai: {
      fieldGuidance: 'AI 字段指导',
      whatIsThis: '这个字段要求什么：',
      requirements: '要求：',
      examples: '提示和示例：',
      suggestion: 'AI 建议：',
      useThis: '使用此建议',
      generating: '生成中...',
      analyzing: '分析中...',
      generateContent: '使用 AI 生成内容',
      improvements: '改进建议',
      improvedVersion: '改进版本：',
      mockNotice: '[这是模拟 AI 响应。添加您的 OpenAI API 密钥以获取个性化内容生成。]',
      aiGuidance: 'AI 智能指导',
      fieldRequirement: '此字段要求填写：',
      fieldRequirements: '填写要求：',
      tipsAndExamples: '提示与示例：',
      useThisSuggestion: '使用此建议',
      useThisVersion: '使用此版本',
    },
    settings: {
      title: '账户设置',
      subtitle: '管理您的账户信息和安全设置',
      changePassword: '修改密码',
      changeEmail: '修改邮箱',
      currentPassword: '当前密码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      passwordChanged: '密码修改成功！',
      emailChanged: '邮箱修改成功！',
      fillAllFields: '请填写所有字段',
      passwordTooShort: '新密码至少需要6个字符',
      passwordMismatch: '新密码和确认密码不匹配',
      passwordSame: '新密码不能与当前密码相同',
      changePasswordError: '修改密码时发生错误，请重试',
      changePasswordFailed: '修改密码失败',
      enterCurrentPassword: '请输入当前密码',
      enterNewPassword: '请输入新密码（至少6个字符）',
      enterConfirmPassword: '请再次输入新密码',
      changeEmailError: '修改邮箱时发生错误，请重试',
      invalidEmail: '请输入有效的邮箱地址',
      emailSame: '新邮箱不能与当前邮箱相同',
      changeEmailFailed: '修改邮箱失败',
      currentEmail: '当前邮箱',
      currentEmailDesc: '这是您当前使用的邮箱地址',
      newEmail: '新邮箱',
      enterNewEmail: '请输入新邮箱地址',
      verifyPassword: '当前密码（验证身份）',
      enterVerifyPassword: '请输入当前密码以验证身份',
    },
    admin: {
      templateManagement: '学校申请模板管理',
      manageTemplates: '管理模板',
      createTemplate: '创建新模板',
      importTemplate: '导入模板',
      createFromBlank: '从空白创建',
      createFromTemplate: '基于类别模板创建',
      systemTemplates: '系统预设模板',
      myTemplates: '我的模板',
      allCategories: '全部',
      noTemplates: '还没有任何学校模板',
      noCategoryTemplates: '还没有"{category}"类别的模板',
      createFirstTemplate: '创建第一个模板',
      deleteConfirm: '确定要删除此模板吗？',
      deleteSuccess: '删除成功',
      deleteError: '删除失败',
      exportSuccess: '导出成功',
      importSuccess: '导入成功！',
      importError: '导入失败',
      importJSONError: '导入失败：JSON 格式错误',
      selectFileOrJSON: '请选择文件或输入 JSON',
      uploadJSON: '上传 JSON 文件',
      pasteJSON: '粘贴 JSON 内容',
      templateId: '模板ID',
      fieldCount: '字段数',
      updatedAt: '更新于',
      searchLabel: '搜索模板',
      searchPlaceholder: '按名称、ID、描述搜索...',
      clearSearch: '清除搜索',
      searchHint: '输入关键字可即时筛选模板。',
      searchResults: '显示与“{keyword}”相关的结果',
      searching: '正在搜索模板...',
      noTemplatesSearch: '没有找到与“{keyword}”匹配的模板。',
      noDescription: '暂无模板介绍。',
      tagSystem: '系统模板',
      active: '已启用',
      inactive: '已禁用',
      preview: '预览',
      exportJSON: '导出为JSON',
      categories: {
        international: '国际学校',
        localSecondary: '香港本地中学',
        localPrimary: '香港本地小学',
        kindergarten: '香港幼稚园',
        university: '大学',
      },
    },
  },
  // Traditional Chinese translations (繁體中文)
  'zh-TW': {
    common: {
      appName: '學校申請助手',
      appNameShort: '申請助手',
      login: '登入',
      logout: '登出',
      register: '註冊',
      getStarted: '開始使用',
      save: '儲存',
      cancel: '取消',
      submit: '提交',
      back: '返回',
      next: '下一步',
      loading: '載入中...',
      error: '錯誤',
      success: '成功',
      delete: '刪除',
      edit: '編輯',
      view: '查看',
      continue: '繼續',
      saving: '儲存中...',
      previous: '上一個',
      field: '欄位',
      of: '/',
    },
    home: {
      title: 'AI 驅動的學校申請助手',
      subtitle: '透過智能表單填寫、個人化指導和 AI 生成的文書，簡化申請流程。自信地申請您的夢想學校。',
      startApplication: '開始申請',
      learnMore: '了解更多',
      whyChoose: '為什麼選擇我們？',
      features: {
        autoFill: {
          title: '智能自動填充',
          description: '使用儲存的個人資料自動填充申請表單'
        },
        aiGuidance: {
          title: 'AI 智能指導',
          description: '為每個需要填寫的欄位提供即時幫助和說明'
        },
        essayGeneration: {
          title: '文書生成',
          description: '使用 AI 創建引人注目的個人陳述和申請文書'
        },
        multipleSchools: {
          title: '多所學校管理',
          description: '透過可重複使用的資料數據高效申請多所學校'
        }
      },
      howItWorks: {
        title: '如何使用',
        step1: {
          title: '創建您的資料',
          description: '一次性填寫基本信息、教育經歷和工作經驗'
        },
        step2: {
          title: '選擇學校',
          description: '從我們的範本中選擇您想申請的學校和項目'
        },
        step3: {
          title: '在 AI 幫助下完成',
          description: '讓 AI 指導您完成每個欄位並生成出色的內容'
        }
      },
      cta: {
        title: '準備開始了嗎？',
        subtitle: '加入成千上萬簡化申請流程的學生',
        button: '免費創建帳戶'
      },
      footer: {
        copyright: '© 2024 學校申請助手。保留所有權利。'
      }
    },
    auth: {
      login: {
        title: '登入您的帳戶',
        subtitle: '請使用您的帳號進行登入',
        email: '電子郵件地址',
        emailOption: '電子郵件登入',
        emailPlaceholder: '請輸入電子郵件地址',
        usernameOption: '使用者名稱登入',
        username: '使用者名稱',
        usernamePlaceholder: '請輸入使用者名稱',
        chooseMethod: '登入方式',
        identifierRequired: '請輸入電子郵件或使用者名稱',
        password: '密碼',
        button: '登入',
        signingIn: '登入中...',
        noAccount: '還沒有帳戶？',
        signUp: '註冊',
        orText: '或者',
        createAccount: '創建新帳戶',
      },
      register: {
        title: '創建您的帳戶',
        name: '姓名',
        username: '使用者名稱',
        usernamePlaceholder: '3-20 個字元，僅限字母/數字/底線',
        usernameHelp: '僅支援字母、數字與底線。登入時可選擇使用此使用者名稱。',
        email: '電子郵件地址',
        password: '密碼',
        confirmPassword: '確認密碼',
        button: '註冊',
        registering: '註冊中...',
        hasAccount: '已有帳戶？',
        signIn: '登入',
        alreadyHaveAccount: '已有帳戶？',
        noAccount: '還沒有帳戶？',
        joinUs: '立即註冊加入我們，和我們一起開始旅程吧',
      },
      errors: {
        passwordMismatch: '兩次輸入的密碼不一致',
        passwordTooShort: '密碼至少需要6個字元',
        registrationFailed: '註冊失敗',
        loginFailed: '登入失敗',
        usernameInvalid: '使用者名稱需 3-20 位，僅可包含字母、數字或底線',
      }
    },
    profile: {
      title: '個人資料',
      basicInfo: '基本信息',
      fullName: '全名',
      phone: '電話',
      birthday: '生日',
      nationality: '國籍',
      education: '教育背景',
      experiences: '工作/實習經歷',
      essays: '個人陳述',
      save: '儲存資料',
      setupTitle: '完善您的資料',
      setupSubtitle: '填寫您的信息，讓 AI 為您提供更好的申請幫助',
      manageInfo: '管理您的個人信息以用於申請',
      saveChanges: '儲存更改',
      saveSuccess: '個人資料儲存成功！',
      saveError: '儲存失敗，請重試',
      addEducation: '新增教育經歷',
      addExperience: '新增經歷',
      educationItem: '教育經歷',
      experienceItem: '經歷',
      schoolName: '學校名稱',
      degree: '學位',
      major: '專業',
      gpa: 'GPA',
      startDate: '開始日期',
      endDate: '結束日期',
      jobTitle: '職位名稱',
      organization: '公司/組織',
      jobDescription: '工作描述',
    },
    dashboard: {
      title: '我的申請',
      subtitle: '管理和追蹤您的學校申請',
      noApplications: '還沒有申請',
      noApplicationsDesc: '開始您的第一個申請吧！',
      startNew: '開始新申請',
      newApplication: '新建申請',
      myApplications: '我的申請列表',
      school: '學校',
      program: '項目',
      status: '狀態',
      lastUpdated: '最後更新',
      updated: '更新於',
      actions: '操作',
      continue: '繼續',
      continueApplication: '繼續申請',
      view: '查看',
      viewApplication: '查看申請',
      delete: '刪除',
      deleteConfirm: '確定要刪除這個申請嗎？',
      createFirst: '創建您的第一個申請',
      chooseSchool: '選擇要申請的學校',
      draft: '草稿',
      inProgress: '進行中',
      submitted: '已提交',
      manageTemplates: '管理範本',
    },
    application: {
      title: '申請表單',
      fillForm: '填寫表單',
      autoFill: '自動填充',
      aiHelp: 'AI 幫助',
      generateWithAI: '使用 AI 生成',
      improveContent: '獲取改進建議',
      saveProgress: '儲存進度',
      submitApplication: '提交申請',
      export: '匯出',
      exportHTML: '匯出為 HTML',
      exportTXT: '匯出為 TXT',
      exportJSON: '匯出為 JSON',
      exportHTMLDesc: '可列印為 PDF',
      exportTXTDesc: '純文字格式',
      exportJSONDesc: '資料備份',
      progress: '完成進度',
      completed: '已完成',
      viewAllFields: '查看所有欄位',
      stepByStepMode: '切換到逐步填寫模式',
      allFieldsMode: '所有欄位模式',
      allFields: '所有申請欄位',
      notFound: '申請未找到',
      submitSuccess: '申請提交成功！',
      saveSuccess: '進度已儲存！',
      saveError: '儲存申請時出錯',
      exportError: '匯出失敗，請重試',
      exportHTMLSuccess: 'HTML 檔案已下載！\n\n您可以：\n1. 在瀏覽器中打開 HTML 檔案\n2. 按 Ctrl+P 列印\n3. 選擇"另存為 PDF"\n4. 儲存 PDF 檔案',
      previous: '上一個',
      next: '下一個',
    },
    ai: {
      fieldGuidance: 'AI 欄位指導',
      whatIsThis: '這個欄位要求什麼：',
      requirements: '要求：',
      examples: '提示和範例：',
      suggestion: 'AI 建議：',
      useThis: '使用此建議',
      generating: '生成中...',
      analyzing: '分析中...',
      generateContent: '使用 AI 生成內容',
      improvements: '改進建議',
      improvedVersion: '改進版本：',
      mockNotice: '[這是模擬 AI 響應。新增您的 OpenAI API 金鑰以獲取個人化內容生成。]',
      aiGuidance: 'AI 智能指導',
      fieldRequirement: '此欄位要求填寫：',
      fieldRequirements: '填寫要求：',
      tipsAndExamples: '提示與範例：',
      useThisSuggestion: '使用此建議',
      useThisVersion: '使用此版本',
    },
    settings: {
      title: '帳戶設定',
      subtitle: '管理您的帳戶信息和安全設定',
      changePassword: '修改密碼',
      changeEmail: '修改電子郵件',
      currentPassword: '當前密碼',
      newPassword: '新密碼',
      confirmNewPassword: '確認新密碼',
      passwordChanged: '密碼修改成功！',
      emailChanged: '電子郵件修改成功！',
      fillAllFields: '請填寫所有欄位',
      passwordTooShort: '新密碼至少需要6個字元',
      passwordMismatch: '新密碼和確認密碼不匹配',
      passwordSame: '新密碼不能與當前密碼相同',
      changePasswordError: '修改密碼時發生錯誤，請重試',
      changePasswordFailed: '修改密碼失敗',
      enterCurrentPassword: '請輸入當前密碼',
      enterNewPassword: '請輸入新密碼（至少6個字元）',
      enterConfirmPassword: '請再次輸入新密碼',
      changeEmailError: '修改電子郵件時發生錯誤，請重試',
      invalidEmail: '請輸入有效的電子郵件地址',
      emailSame: '新電子郵件不能與當前電子郵件相同',
      changeEmailFailed: '修改電子郵件失敗',
      currentEmail: '當前電子郵件',
      currentEmailDesc: '這是您當前使用的電子郵件地址',
      newEmail: '新電子郵件',
      enterNewEmail: '請輸入新電子郵件地址',
      verifyPassword: '當前密碼（驗證身份）',
      enterVerifyPassword: '請輸入當前密碼以驗證身份',
    },
    admin: {
      templateManagement: '學校申請範本管理',
      manageTemplates: '管理範本',
      createTemplate: '創建新範本',
      importTemplate: '匯入範本',
      createFromBlank: '從空白創建',
      createFromTemplate: '基於類別範本創建',
      systemTemplates: '系統預設範本',
      myTemplates: '我的範本',
      allCategories: '全部',
      noTemplates: '還沒有任何學校範本',
      noCategoryTemplates: '還沒有"{category}"類別的範本',
      createFirstTemplate: '創建第一個範本',
      deleteConfirm: '確定要刪除此範本嗎？',
      deleteSuccess: '刪除成功',
      deleteError: '刪除失敗',
      exportSuccess: '匯出成功',
      importSuccess: '匯入成功！',
      importError: '匯入失敗',
      importJSONError: '匯入失敗：JSON 格式錯誤',
      selectFileOrJSON: '請選擇檔案或輸入 JSON',
      uploadJSON: '上傳 JSON 檔案',
      pasteJSON: '貼上 JSON 內容',
      templateId: '範本ID',
      fieldCount: '欄位數',
      updatedAt: '更新於',
      searchLabel: '搜尋範本',
      searchPlaceholder: '依名稱、ID、描述搜尋...',
      clearSearch: '清除搜尋',
      searchHint: '輸入關鍵字即可即時篩選範本。',
      searchResults: '顯示與「{keyword}」相關的結果',
      searching: '正在搜尋範本...',
      noTemplatesSearch: '沒有找到與「{keyword}」相符的範本。',
      noDescription: '暫無範本介紹。',
      tagSystem: '系統範本',
      active: '已啟用',
      inactive: '已禁用',
      preview: '預覽',
      exportJSON: '匯出為JSON',
      categories: {
        international: '國際學校',
        localSecondary: '香港本地中學',
        localPrimary: '香港本地小學',
        kindergarten: '香港幼稚園',
        university: '大學',
      },
    },
  },
};

export default translations;

