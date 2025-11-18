/**
 * 拔萃女书院 (Diocesan Girls' School) Template Data
 * System template for DGS HKLSS 2025
 */

export const DGS_TEMPLATE_DATA = {
  schoolId: 'dgs-hkls-2025',
  schoolName: '拔萃女书院',
  program: '包含所有个人资料字段的主模板',
  description: '此模板包含系统中所有可用的个人资料字段，可以在此基础上删减字段来创建具体学校的申请表',
  category: '香港本地中学',
  fieldsData: [
    {
      id: 'basic_info',
      type: 'section',
      label: '基本信息 / Basic Information',
      fields: [
        {
          id: 'chinese_last_name',
          type: 'text',
          label: '中文姓',
          required: true,
          aiFillRule: 'chineseLastName'
        },
        {
          id: 'chinese_first_name',
          type: 'text',
          label: '中文名',
          required: true,
          aiFillRule: 'chineseFirstName'
        },
        {
          id: 'english_last_name',
          type: 'text',
          label: '英文姓 (Last Name)',
          required: true,
          aiFillRule: 'englishLastName'
        },
        {
          id: 'english_first_name',
          type: 'text',
          label: '英文名 (First Name)',
          required: true,
          aiFillRule: 'englishFirstName'
        },
        {
          id: 'preferred_name',
          type: 'text',
          label: '常用名 (Preferred Name)',
          helpText: '如果您希望学校使用特定的称呼',
          required: false,
          aiFillRule: 'preferredName'
        },
        {
          id: 'race',
          type: 'select',
          label: '种族 (Race)',
          options: ['亚裔', '白人', '非裔', '拉丁裔', '混血', '其他'],
          required: false,
          aiFillRule: 'race'
        },
        {
          id: 'gender',
          type: 'select',
          label: '性别 (Gender)',
          options: ['男/Male', '女/Female', '其他/Other', '不愿透露/Prefer not to say'],
          required: true,
          aiFillRule: 'gender'
        },
        {
          id: 'nationality',
          type: 'text',
          label: '国籍 (Nationality)',
          required: true,
          aiFillRule: 'nationality'
        },
        {
          id: 'birthday',
          type: 'date',
          label: '出生日期 (Date of Birth)',
          required: true,
          aiFillRule: 'birthday'
        },
        {
          id: 'passport_number',
          type: 'text',
          label: '护照号码 (Passport Number)',
          required: false,
          aiFillRule: 'passportNumber'
        },
        {
          id: 'hk_id_number',
          type: 'text',
          label: '香港身份证号码 (HKID Number)',
          required: false,
          aiFillRule: 'hkIdNumber'
        },
        {
          id: 'visa_status',
          type: 'select',
          label: '签证情况 (Visa Status)',
          options: ['受养人/Dependent', '永久居民/Permanent Resident', '外籍学生签证/Student Visa', '待办中/Pending'],
          required: false,
          aiFillRule: 'visaStatus'
        }
      ]
    },
    {
      id: 'contact_info',
      type: 'section',
      label: '联系方式 / Contact Information',
      fields: [
        {
          id: 'student_phone',
          type: 'tel',
          label: '学生电话 (Student Phone)',
          required: false,
          aiFillRule: 'studentPhone'
        },
        {
          id: 'student_email',
          type: 'email',
          label: '学生电邮 (Student Email)',
          required: true,
          aiFillRule: 'studentEmail'
        },
        {
          id: 'parent_phone',
          type: 'tel',
          label: '家长电话 (Parent Phone)',
          required: true,
          aiFillRule: 'parentPhone'
        },
        {
          id: 'parent_email',
          type: 'email',
          label: '家长电邮 (Parent Email)',
          required: true,
          aiFillRule: 'parentEmail'
        },
        {
          id: 'home_address',
          type: 'textarea',
          label: '家庭住址 (Home Address)',
          required: true,
          maxLength: 500,
          aiFillRule: 'homeAddress'
        }
      ]
    },
    {
      id: 'language_proficiency',
      type: 'section',
      label: '语言能力 / Language Proficiency',
      fields: [
        {
          id: 'native_language',
          type: 'text',
          label: '母语 (Native Language)',
          required: true,
          aiFillRule: 'nativeLanguage'
        },
        {
          id: 'second_language',
          type: 'text',
          label: '第二外语 (Second Language)',
          required: false,
          aiFillRule: 'secondLanguage'
        },
        {
          id: 'english_proficiency',
          type: 'select',
          label: '英语流利程度 (English Proficiency)',
          options: ['母语/Native', '流利/Fluent', '良好/Good', '基础/Basic'],
          required: false
        },
        {
          id: 'chinese_proficiency',
          type: 'select',
          label: '中文流利程度 (Chinese Proficiency)',
          options: ['母语/Native', '流利/Fluent', '良好/Good', '基础/Basic'],
          required: false
        }
      ]
    },
    {
      id: 'standardized_tests',
      type: 'section',
      label: '标化考试成绩 / Standardized Test Scores',
      fields: [
        {
          id: 'toefl_score',
          type: 'text',
          label: 'TOEFL 成绩',
          helpText: '如：总分 100 (R25/L26/S24/W25)',
          required: false
        },
        {
          id: 'ielts_score',
          type: 'text',
          label: 'IELTS 成绩',
          helpText: '如：Overall 7.0 (R7.5/L7.0/S6.5/W7.0)',
          required: false
        },
        {
          id: 'toefl_junior_score',
          type: 'text',
          label: '小托福 (TOEFL Junior) 成绩',
          required: false
        },
        {
          id: 'cambridge_score',
          type: 'text',
          label: '剑桥英语考试 (KET/PET/FCE) 成绩',
          required: false
        },
        {
          id: 'map_score',
          type: 'text',
          label: 'MAP 成绩',
          helpText: '请注明各科分数',
          required: false
        },
        {
          id: 'cat4_score',
          type: 'text',
          label: 'CAT4 成绩',
          required: false
        },
        {
          id: 'sat_score',
          type: 'text',
          label: 'SAT 成绩',
          helpText: '如：Total 1450 (Math 750, EBRW 700)',
          required: false
        },
        {
          id: 'act_score',
          type: 'text',
          label: 'ACT 成绩',
          required: false
        },
        {
          id: 'other_test_scores',
          type: 'textarea',
          label: '其他考试成绩',
          helpText: '如有其他标化考试成绩，请列出',
          required: false,
          maxLength: 500
        }
      ]
    },
    {
      id: 'current_education',
      type: 'section',
      label: '现有教育背景 / Current Education',
      fields: [
        {
          id: 'current_school_name',
          type: 'text',
          label: '现就读学校 (Current School)',
          required: true,
          aiFillRule: 'education[0].schoolName'
        },
        {
          id: 'current_grade',
          type: 'text',
          label: '现就读年级 (Current Grade/Year)',
          helpText: '如：Grade 9 或 Year 9',
          required: true,
          aiFillRule: 'education[0].endGrade'
        },
        {
          id: 'grade_system',
          type: 'select',
          label: '年级制度 (Grade System)',
          options: ['Grade (12年制)', 'Year (13年制)'],
          required: false,
          aiFillRule: 'education[0].gradeSystem'
        },
        {
          id: 'admission_date',
          type: 'date',
          label: '入学时间 (Admission Date)',
          required: false,
          aiFillRule: 'education[0].admissionDate'
        },
        {
          id: 'gpa',
          type: 'text',
          label: 'GPA / 平均成绩',
          helpText: '如：3.8/4.0 或 85/100',
          required: false
        },
        {
          id: 'academic_transcript',
          type: 'textarea',
          label: '学业成绩说明 (Academic Performance)',
          helpText: '请简要说明您的学业表现、擅长科目等',
          required: false,
          maxLength: 1000
        }
      ]
    },
    {
      id: 'parent_father_info',
      type: 'section',
      label: "父亲信息 / Father's Information",
      fields: [
        {
          id: 'father_name',
          type: 'text',
          label: "父亲姓名 (Father's Name)",
          required: false,
          aiFillRule: 'parents[0].name'
        },
        {
          id: 'father_passport',
          type: 'text',
          label: '父亲护照号码 (Passport Number)',
          required: false,
          aiFillRule: 'parents[0].passportNumber'
        },
        {
          id: 'father_id_number',
          type: 'text',
          label: '父亲身份证号码 (ID Number)',
          required: false,
          aiFillRule: 'parents[0].idNumber'
        },
        {
          id: 'father_visa_status',
          type: 'select',
          label: '父亲签证情况 (Visa Status)',
          options: ['受养人', '永久居民', '工作签证', '待办中'],
          required: false,
          aiFillRule: 'parents[0].visaStatus'
        },
        {
          id: 'father_company',
          type: 'text',
          label: '父亲工作单位 (Company)',
          required: false,
          aiFillRule: 'parents[0].company'
        },
        {
          id: 'father_position',
          type: 'text',
          label: '父亲职位 (Position)',
          required: false,
          aiFillRule: 'parents[0].position'
        },
        {
          id: 'father_work_phone',
          type: 'tel',
          label: '父亲工作电话 (Work Phone)',
          required: false,
          aiFillRule: 'parents[0].workPhone'
        },
        {
          id: 'father_work_email',
          type: 'email',
          label: '父亲工作邮箱 (Work Email)',
          required: false,
          aiFillRule: 'parents[0].workEmail'
        },
        {
          id: 'father_education',
          type: 'select',
          label: '父亲学历 (Education)',
          options: ['高中', '本科', '研究生', '博士'],
          required: false,
          aiFillRule: 'parents[0].education'
        }
      ]
    },
    {
      id: 'parent_mother_info',
      type: 'section',
      label: "母亲信息 / Mother's Information",
      fields: [
        {
          id: 'mother_name',
          type: 'text',
          label: "母亲姓名 (Mother's Name)",
          required: false,
          aiFillRule: 'parents[1].name'
        },
        {
          id: 'mother_passport',
          type: 'text',
          label: '母亲护照号码 (Passport Number)',
          required: false,
          aiFillRule: 'parents[1].passportNumber'
        },
        {
          id: 'mother_id_number',
          type: 'text',
          label: '母亲身份证号码 (ID Number)',
          required: false,
          aiFillRule: 'parents[1].idNumber'
        },
        {
          id: 'mother_visa_status',
          type: 'select',
          label: '母亲签证情况 (Visa Status)',
          options: ['受养人', '永久居民', '工作签证', '待办中'],
          required: false,
          aiFillRule: 'parents[1].visaStatus'
        },
        {
          id: 'mother_company',
          type: 'text',
          label: '母亲工作单位 (Company)',
          required: false,
          aiFillRule: 'parents[1].company'
        },
        {
          id: 'mother_position',
          type: 'text',
          label: '母亲职位 (Position)',
          required: false,
          aiFillRule: 'parents[1].position'
        },
        {
          id: 'mother_work_phone',
          type: 'tel',
          label: '母亲工作电话 (Work Phone)',
          required: false,
          aiFillRule: 'parents[1].workPhone'
        },
        {
          id: 'mother_work_email',
          type: 'email',
          label: '母亲工作邮箱 (Work Email)',
          required: false,
          aiFillRule: 'parents[1].workEmail'
        },
        {
          id: 'mother_education',
          type: 'select',
          label: '母亲学历 (Education)',
          options: ['高中', '本科', '研究生', '博士'],
          required: false,
          aiFillRule: 'parents[1].education'
        }
      ]
    },
    {
      id: 'activities_awards',
      type: 'section',
      label: '活动与获奖 / Activities & Awards',
      fields: [
        {
          id: 'extracurricular_activities',
          type: 'textarea',
          label: '课外活动 (Extracurricular Activities)',
          helpText: '请列出您参加过的课外活动，如：AMC数学竞赛、校足球队、BPhO物理奥赛、学生会、志愿服务等',
          required: false,
          maxLength: 2000
        },
        {
          id: 'leadership_positions',
          type: 'textarea',
          label: '领导职位 (Leadership Positions)',
          helpText: '如：学生会主席、班长、社团负责人等',
          required: false,
          maxLength: 1000
        },
        {
          id: 'honors_awards',
          type: 'textarea',
          label: '荣誉与奖项 (Honors & Awards)',
          helpText: '请列出您获得的各类奖项，包括学术、体育、艺术、竞赛等',
          required: false,
          maxLength: 2000
        },
        {
          id: 'competitions',
          type: 'textarea',
          label: '竞赛经历 (Competition Experience)',
          helpText: '如：AMC、USACO、HKPHO、校际辩论赛等',
          required: false,
          maxLength: 1500
        },
        {
          id: 'volunteer_work',
          type: 'textarea',
          label: '志愿服务 (Volunteer Work)',
          helpText: '请描述您的志愿服务经历',
          required: false,
          maxLength: 1000
        },
        {
          id: 'sports_arts',
          type: 'textarea',
          label: '体育与艺术 (Sports & Arts)',
          helpText: '请描述您的体育或艺术特长和成就',
          required: false,
          maxLength: 1000
        }
      ]
    },
    {
      id: 'special_circumstances',
      type: 'section',
      label: '特殊情况 / Special Circumstances',
      fields: [
        {
          id: 'special_education_needs',
          type: 'textarea',
          label: '特殊教育需求 (Special Education Needs)',
          helpText: '如有任何学习障碍、特殊教育需求，请说明',
          required: false,
          maxLength: 1000,
          aiFillRule: 'specialEducationNeeds'
        },
        {
          id: 'health_conditions',
          type: 'textarea',
          label: '健康情况 (Health Conditions)',
          helpText: '如有需要学校了解的健康状况、过敏等，请说明',
          required: false,
          maxLength: 1000,
          aiFillRule: 'healthConditions'
        },
        {
          id: 'grade_retention_skip',
          type: 'textarea',
          label: '留级或跳级经历 (Grade Retention/Skip)',
          helpText: '如有留级或跳级经历，请说明原因和时间',
          required: false,
          maxLength: 500,
          aiFillRule: 'gradeRetentionOrSkip'
        },
        {
          id: 'siblings_info',
          type: 'textarea',
          label: '兄弟姊妹信息 (Siblings Information)',
          helpText: '如有兄弟姊妹在本校或申请本校，请注明',
          required: false,
          maxLength: 500
        }
      ]
    },
    {
      id: 'essays_statements',
      type: 'section',
      label: '文书与陈述 / Essays & Statements',
      fields: [
        {
          id: 'personal_statement',
          type: 'textarea',
          label: '个人陈述 (Personal Statement)',
          helpText: '请介绍您自己，包括您的兴趣、目标、为什么想加入本校等 (Please introduce yourself, including your interests, goals, and why you want to join this school)',
          required: false,
          maxLength: 3000
        },
        {
          id: 'why_this_school',
          type: 'textarea',
          label: '为什么选择本校 (Why This School)',
          helpText: '请说明您选择本校的原因',
          required: false,
          maxLength: 1500
        },
        {
          id: 'academic_interests',
          type: 'textarea',
          label: '学术兴趣 (Academic Interests)',
          helpText: '请描述您的学术兴趣和未来学习计划',
          required: false,
          maxLength: 1500
        },
        {
          id: 'career_goals',
          type: 'textarea',
          label: '职业目标 (Career Goals)',
          helpText: '请分享您的职业理想和长远目标',
          required: false,
          maxLength: 1000
        },
        {
          id: 'additional_information',
          type: 'textarea',
          label: '补充信息 (Additional Information)',
          helpText: '如有任何其他想让招生办了解的信息，请在此说明',
          required: false,
          maxLength: 2000
        }
      ]
    }
  ],
  isActive: true
};

