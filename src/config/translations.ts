/**
 * 应用翻译配置文件
 * 修改此文件中的文案即可更改整个应用的显示语言
 */

export const translations = {
  // 通用
  common: {
    appName: '学校申请助手',
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
  },

  // 首页
  home: {
    title: 'AI 驱动的学校申请助手',
    subtitle: '通过智能表单填写、个性化指导和 AI 生成的文书，简化申请流程。自信地申请您的梦想学校。',
    startApplication: '开始申请',
    learnMore: '了解更多',
    features: {
      autoFill: {
        title: '智能自动填充',
        description: '使用保存的个人资料自动填充申请表单'
      },
      aiGuidance: {
        title: 'AI 指导',
        description: '为每个需要填写的字段提供实时帮助和说明'
      },
      essayGeneration: {
        title: '文书生成',
        description: '使用 AI 创建引人注目的个人陈述和申请文书'
      },
      multipleSchools: {
        title: '多所学校',
        description: '通过可重复使用的资料数据高效申请多所学校'
      }
    },
    howItWorks: {
      title: '如何使用',
      step1: {
        title: '创建您的资料',
        description: '一次性填写基本信息、教育经历和经验'
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

  // 认证页面
  auth: {
    login: {
      title: '登录到您的账户',
      email: '邮箱',
      password: '密码',
      button: '登录',
      noAccount: '还没有账户？',
      signUp: '注册'
    },
    register: {
      title: '创建您的账户',
      name: '姓名',
      email: '邮箱',
      password: '密码',
      button: '注册',
      hasAccount: '已有账户？',
      signIn: '登录'
    }
  },

  // 个人资料
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

  // 学校列表
  schools: {
    title: '选择学校',
    available: '可申请的学校',
    apply: '申请',
    applied: '已申请',
    viewApplication: '查看申请'
  },

  // 申请表单
  application: {
    title: '申请表单',
    fillForm: '填写表单',
    autoFill: '自动填充',
    aiHelp: 'AI 帮助',
    generateWithAI: '使用 AI 生成',
    improveContent: '获取改进建议',
    saveProgress: '保存进度',
    submitApplication: '提交申请',
    draft: '草稿',
    inProgress: '进行中',
    submitted: '已提交'
  },

  // AI 功能
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
  },

  // 仪表板
  dashboard: {
    title: '我的申请',
    noApplications: '您还没有开始任何申请',
    startNew: '开始新申请',
    myApplications: '我的申请列表',
    school: '学校',
    program: '项目',
    status: '状态',
    lastUpdated: '最后更新',
    actions: '操作',
    continue: '继续',
    view: '查看'
  }
};

export default translations;

