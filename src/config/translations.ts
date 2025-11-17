/**
 * 多语言翻译配置文件
 * 支持中文和英文，可以轻松扩展到其他语言
 */

export type Language = 'zh' | 'en';

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
      email: string;
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
      email: string;
      password: string;
      confirmPassword: string;
      button: string;
      registering: string;
      hasAccount: string;
      signIn: string;
      alreadyHaveAccount: string;
    };
    errors: {
      passwordMismatch: string;
      passwordTooShort: string;
      registrationFailed: string;
      loginFailed: string;
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
  };
}

export const translations: Record<Language, Translations> = {
  // 中文翻译
  zh: {
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
        email: '邮箱地址',
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
        email: '邮箱地址',
        password: '密码',
        confirmPassword: '确认密码',
        button: '注册',
        registering: '注册中...',
        hasAccount: '已有账户？',
        signIn: '登录',
        alreadyHaveAccount: '已有账户？',
      },
      errors: {
        passwordMismatch: '两次输入的密码不一致',
        passwordTooShort: '密码至少需要6个字符',
        registrationFailed: '注册失败',
        loginFailed: '登录失败',
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
      setupSubtitle: '填写您的信息，让 AI 为您提供更好的申请帮助'
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
      mockNotice: '[这是模拟 AI 响应。添加您的 OpenAI API 密钥以获取个性化内容生成。]'
    }
  },

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
        email: 'Email address',
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
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        button: 'Create account',
        registering: 'Creating account...',
        hasAccount: 'Already have an account?',
        signIn: 'Sign in',
        alreadyHaveAccount: 'Already have an account?',
      },
      errors: {
        passwordMismatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 6 characters',
        registrationFailed: 'Registration failed',
        loginFailed: 'Login failed',
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
      setupSubtitle: 'Fill in your information to get better AI-powered application assistance'
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
      mockNotice: '[This is a mock AI response. Add your OpenAI API key to get personalized content generation.]'
    }
  }
};

export default translations;

