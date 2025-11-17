-- ============================================
-- 5个类别的预设学校模板
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 先添加 category 字段到现有表（如果还没有）
ALTER TABLE "SchoolFormTemplate" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT '国际学校';

-- 1. 国际学校模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "category",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'template-international-school',
  '[模板] 国际学校',
  '国际学校申请表',
  '适用于国际学校的标准申请模板',
  '国际学校',
  '[
    {
      "id": "student_info",
      "label": "学生信息",
      "type": "section",
      "fields": [
        {"id": "chinese_name", "label": "中文姓名", "type": "text", "required": true, "aiFillRule": "chineseLastName + chineseFirstName"},
        {"id": "english_name", "label": "英文姓名 (English Name)", "type": "text", "required": true, "aiFillRule": "englishFirstName + englishLastName"},
        {"id": "preferred_name", "label": "常用名 (Preferred Name)", "type": "text", "required": false, "aiFillRule": "preferredName"},
        {"id": "gender", "label": "性别 (Gender)", "type": "select", "required": true, "options": ["男/Male", "女/Female"], "aiFillRule": "gender"},
        {"id": "nationality", "label": "国籍 (Nationality)", "type": "text", "required": true, "aiFillRule": "nationality"},
        {"id": "birthday", "label": "出生日期 (Date of Birth)", "type": "date", "required": true, "aiFillRule": "birthday"},
        {"id": "passport", "label": "护照号码 (Passport Number)", "type": "text", "required": false, "aiFillRule": "passportNumber"}
      ]
    },
    {
      "id": "current_education",
      "label": "现有教育背景",
      "type": "section",
      "fields": [
        {"id": "current_school", "label": "现就读学校 (Current School)", "type": "text", "required": true, "aiFillRule": "education[0].schoolName"},
        {"id": "current_grade", "label": "现就读年级 (Current Grade)", "type": "text", "required": true, "aiFillRule": "education[0].endGrade"},
        {"id": "grade_system", "label": "年级制度", "type": "select", "required": true, "options": ["Grade (12年制)", "Year (13年制)"]},
        {"id": "gpa", "label": "平均成绩/GPA", "type": "text", "required": false, "aiFillRule": "education[0].gpa"}
      ]
    },
    {
      "id": "language_proficiency",
      "label": "语言能力",
      "type": "section",
      "fields": [
        {"id": "native_language", "label": "母语 (Native Language)", "type": "text", "required": true, "aiFillRule": "nativeLanguage"},
        {"id": "english_level", "label": "英语水平 (English Proficiency)", "type": "select", "required": true, "options": ["母语/Native", "流利/Fluent", "良好/Good", "基础/Basic"]},
        {"id": "test_scores", "label": "标化考试成绩 (如有)", "type": "textarea", "required": false, "maxLength": 500, "helpText": "TOEFL, IELTS, MAP, CAT4等"}
      ]
    },
    {
      "id": "parent_info",
      "label": "家长信息",
      "type": "section",
      "fields": [
        {"id": "parent_name", "label": "家长姓名 (Parent Name)", "type": "text", "required": true, "aiFillRule": "parents[0].name"},
        {"id": "parent_phone", "label": "联系电话 (Contact Number)", "type": "tel", "required": true, "aiFillRule": "parentPhone"},
        {"id": "parent_email", "label": "电子邮箱 (Email)", "type": "email", "required": true, "aiFillRule": "parentEmail"}
      ]
    },
    {
      "id": "personal_statement",
      "label": "个人陈述 (Personal Statement)",
      "type": "textarea",
      "required": true,
      "maxLength": 1000,
      "helpText": "Please explain why you want to join this school (请说明为什么想加入本校)"
    },
    {
      "id": "special_notes",
      "label": "特殊情况说明",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "特殊教育需求、健康情况等"
    }
  ]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("schoolId") DO UPDATE SET
  "schoolName" = EXCLUDED."schoolName",
  "program" = EXCLUDED."program",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "fieldsData" = EXCLUDED."fieldsData",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 2. 香港本地中学模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "category",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'template-hk-secondary-school',
  '[模板] 香港本地中学',
  '香港中学入学申请表',
  '适用于香港本地中学的标准申请模板',
  '香港本地中学',
  '[
    {
      "id": "student_basic",
      "label": "学生基本资料",
      "type": "section",
      "fields": [
        {"id": "chinese_name", "label": "中文姓名", "type": "text", "required": true, "aiFillRule": "chineseLastName + chineseFirstName"},
        {"id": "english_name", "label": "英文姓名", "type": "text", "required": true, "aiFillRule": "englishFirstName + englishLastName"},
        {"id": "hkid", "label": "香港身份证号码", "type": "text", "required": true, "aiFillRule": "hkIdNumber"},
        {"id": "gender", "label": "性别", "type": "select", "required": true, "options": ["男", "女"], "aiFillRule": "gender"},
        {"id": "birthday", "label": "出生日期", "type": "date", "required": true, "aiFillRule": "birthday"}
      ]
    },
    {
      "id": "current_school",
      "label": "就读学校资料",
      "type": "section",
      "fields": [
        {"id": "primary_school", "label": "就读小学", "type": "text", "required": true, "aiFillRule": "education[0].schoolName"},
        {"id": "current_grade", "label": "现就读年级", "type": "select", "required": true, "options": ["小一", "小二", "小三", "小四", "小五", "小六"]},
        {"id": "chinese_score", "label": "中文成绩", "type": "text", "required": false},
        {"id": "english_score", "label": "英文成绩", "type": "text", "required": false},
        {"id": "math_score", "label": "数学成绩", "type": "text", "required": false}
      ]
    },
    {
      "id": "parent_details",
      "label": "家长资料",
      "type": "section",
      "fields": [
        {"id": "father_name", "label": "父亲姓名", "type": "text", "required": true, "aiFillRule": "parents[0].name"},
        {"id": "father_phone", "label": "父亲电话", "type": "tel", "required": true, "aiFillRule": "parents[0].workPhone"},
        {"id": "mother_name", "label": "母亲姓名", "type": "text", "required": true, "aiFillRule": "parents[1].name"},
        {"id": "mother_phone", "label": "母亲电话", "type": "tel", "required": true, "aiFillRule": "parents[1].workPhone"},
        {"id": "home_address", "label": "家庭住址", "type": "textarea", "required": true, "aiFillRule": "homeAddress"}
      ]
    },
    {
      "id": "activities",
      "label": "课外活动及获奖",
      "type": "textarea",
      "required": false,
      "maxLength": 800,
      "helpText": "请列出学生的课外活动、特长和获奖情况"
    },
    {
      "id": "why_this_school",
      "label": "申请原因",
      "type": "textarea",
      "required": true,
      "maxLength": 500,
      "helpText": "请说明选择本校的原因"
    }
  ]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("schoolId") DO UPDATE SET
  "schoolName" = EXCLUDED."schoolName",
  "program" = EXCLUDED."program",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "fieldsData" = EXCLUDED."fieldsData",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 3. 香港本地小学模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "category",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'template-hk-primary-school',
  '[模板] 香港本地小学',
  '香港小学入学申请表',
  '适用于香港本地小学的标准申请模板',
  '香港本地小学',
  '[
    {
      "id": "child_info",
      "label": "儿童资料",
      "type": "section",
      "fields": [
        {"id": "chinese_name", "label": "中文姓名", "type": "text", "required": true, "aiFillRule": "chineseLastName + chineseFirstName"},
        {"id": "english_name", "label": "英文姓名", "type": "text", "required": true, "aiFillRule": "englishFirstName + englishLastName"},
        {"id": "hkid", "label": "香港身份证号码", "type": "text", "required": false, "aiFillRule": "hkIdNumber"},
        {"id": "birth_cert", "label": "出生证明书号码", "type": "text", "required": true},
        {"id": "gender", "label": "性别", "type": "select", "required": true, "options": ["男", "女"], "aiFillRule": "gender"},
        {"id": "birthday", "label": "出生日期", "type": "date", "required": true, "aiFillRule": "birthday"}
      ]
    },
    {
      "id": "kindergarten_info",
      "label": "幼稚园资料",
      "type": "section",
      "fields": [
        {"id": "kindergarten_name", "label": "就读幼稚园", "type": "text", "required": false, "aiFillRule": "education[0].schoolName"},
        {"id": "kindergarten_grade", "label": "班级", "type": "select", "required": false, "options": ["N班", "K1", "K2", "K3"]}
      ]
    },
    {
      "id": "parent_information",
      "label": "家长资料",
      "type": "section",
      "fields": [
        {"id": "father_chinese_name", "label": "父亲中文姓名", "type": "text", "required": true},
        {"id": "father_english_name", "label": "父亲英文姓名", "type": "text", "required": true},
        {"id": "father_phone", "label": "父亲联络电话", "type": "tel", "required": true, "aiFillRule": "parents[0].workPhone"},
        {"id": "mother_chinese_name", "label": "母亲中文姓名", "type": "text", "required": true},
        {"id": "mother_english_name", "label": "母亲英文姓名", "type": "text", "required": true},
        {"id": "mother_phone", "label": "母亲联络电话", "type": "tel", "required": true, "aiFillRule": "parents[1].workPhone"},
        {"id": "email", "label": "电邮地址", "type": "email", "required": true, "aiFillRule": "parentEmail"},
        {"id": "address", "label": "通讯地址", "type": "textarea", "required": true, "aiFillRule": "homeAddress"}
      ]
    },
    {
      "id": "siblings",
      "label": "兄弟姊妹资料",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "如有兄弟姊妹在本校就读，请注明"
    },
    {
      "id": "special_needs",
      "label": "特殊需要",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "如儿童有任何特殊教育需要或健康状况，请注明",
      "aiFillRule": "specialEducationNeeds"
    }
  ]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("schoolId") DO UPDATE SET
  "schoolName" = EXCLUDED."schoolName",
  "program" = EXCLUDED."program",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "fieldsData" = EXCLUDED."fieldsData",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 4. 香港幼稚园模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "category",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'template-hk-kindergarten',
  '[模板] 香港幼稚园',
  '幼稚园入学申请表',
  '适用于香港幼稚园的标准申请模板',
  '香港幼稚园',
  '[
    {
      "id": "child_details",
      "label": "幼儿资料",
      "type": "section",
      "fields": [
        {"id": "chinese_name", "label": "中文姓名", "type": "text", "required": true, "aiFillRule": "chineseLastName + chineseFirstName"},
        {"id": "english_name", "label": "英文姓名", "type": "text", "required": true, "aiFillRule": "englishFirstName + englishLastName"},
        {"id": "nickname", "label": "小名/暱称", "type": "text", "required": false, "aiFillRule": "preferredName"},
        {"id": "birth_cert", "label": "出生证明书号码", "type": "text", "required": true},
        {"id": "gender", "label": "性别", "type": "select", "required": true, "options": ["男", "女"], "aiFillRule": "gender"},
        {"id": "birthday", "label": "出生日期", "type": "date", "required": true, "aiFillRule": "birthday"}
      ]
    },
    {
      "id": "apply_for",
      "label": "申请班级",
      "type": "section",
      "fields": [
        {"id": "class_level", "label": "申请入读班级", "type": "select", "required": true, "options": ["N班 (2-3岁)", "K1 (3-4岁)", "K2 (4-5岁)", "K3 (5-6岁)"]},
        {"id": "session", "label": "班别", "type": "select", "required": true, "options": ["上午班", "下午班", "全日班"]}
      ]
    },
    {
      "id": "guardian_info",
      "label": "家长/监护人资料",
      "type": "section",
      "fields": [
        {"id": "father_name", "label": "父亲姓名", "type": "text", "required": true},
        {"id": "father_occupation", "label": "父亲职业", "type": "text", "required": false, "aiFillRule": "parents[0].position"},
        {"id": "father_phone", "label": "父亲电话", "type": "tel", "required": true, "aiFillRule": "parents[0].workPhone"},
        {"id": "mother_name", "label": "母亲姓名", "type": "text", "required": true},
        {"id": "mother_occupation", "label": "母亲职业", "type": "text", "required": false, "aiFillRule": "parents[1].position"},
        {"id": "mother_phone", "label": "母亲电话", "type": "tel", "required": true, "aiFillRule": "parents[1].workPhone"},
        {"id": "home_address", "label": "家庭住址", "type": "textarea", "required": true, "aiFillRule": "homeAddress"}
      ]
    },
    {
      "id": "health_info",
      "label": "健康状况",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "如幼儿有任何过敏、健康问题或需要特别照顾的地方，请注明",
      "aiFillRule": "healthConditions"
    },
    {
      "id": "emergency_contact",
      "label": "紧急联络人",
      "type": "section",
      "fields": [
        {"id": "emergency_name", "label": "姓名", "type": "text", "required": true},
        {"id": "emergency_relation", "label": "与幼儿关系", "type": "text", "required": true},
        {"id": "emergency_phone", "label": "联络电话", "type": "tel", "required": true}
      ]
    }
  ]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("schoolId") DO UPDATE SET
  "schoolName" = EXCLUDED."schoolName",
  "program" = EXCLUDED."program",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "fieldsData" = EXCLUDED."fieldsData",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 5. 大学模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "category",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'template-university',
  '[模板] 大学',
  '大学入学申请表',
  '适用于大学本科/研究生的标准申请模板',
  '大学',
  '[
    {
      "id": "personal_info",
      "label": "Personal Information / 个人信息",
      "type": "section",
      "fields": [
        {"id": "full_name", "label": "Full Name / 全名", "type": "text", "required": true, "aiFillRule": "englishFirstName + englishLastName"},
        {"id": "chinese_name", "label": "Chinese Name / 中文姓名", "type": "text", "required": false, "aiFillRule": "chineseLastName + chineseFirstName"},
        {"id": "gender", "label": "Gender / 性别", "type": "select", "required": true, "options": ["Male/男", "Female/女", "Other/其他"], "aiFillRule": "gender"},
        {"id": "nationality", "label": "Nationality / 国籍", "type": "text", "required": true, "aiFillRule": "nationality"},
        {"id": "passport", "label": "Passport Number / 护照号码", "type": "text", "required": true, "aiFillRule": "passportNumber"},
        {"id": "birthday", "label": "Date of Birth / 出生日期", "type": "date", "required": true, "aiFillRule": "birthday"},
        {"id": "email", "label": "Email Address / 电邮", "type": "email", "required": true, "aiFillRule": "studentEmail"},
        {"id": "phone", "label": "Phone Number / 电话", "type": "tel", "required": true, "aiFillRule": "studentPhone"}
      ]
    },
    {
      "id": "academic_background",
      "label": "Academic Background / 学历背景",
      "type": "section",
      "fields": [
        {"id": "high_school", "label": "High School / 中学", "type": "text", "required": true, "aiFillRule": "education[0].schoolName"},
        {"id": "graduation_date", "label": "Graduation Date / 毕业日期", "type": "date", "required": true, "aiFillRule": "education[0].withdrawalDate"},
        {"id": "gpa", "label": "GPA / 平均成绩", "type": "text", "required": false, "aiFillRule": "education[0].gpa"},
        {"id": "sat_score", "label": "SAT Score / SAT成绩", "type": "text", "required": false},
        {"id": "act_score", "label": "ACT Score / ACT成绩", "type": "text", "required": false},
        {"id": "toefl_ielts", "label": "TOEFL/IELTS Score / 托福/雅思成绩", "type": "text", "required": false}
      ]
    },
    {
      "id": "program_choice",
      "label": "Program Selection / 专业选择",
      "type": "section",
      "fields": [
        {"id": "first_major", "label": "First Choice Major / 第一志愿专业", "type": "text", "required": true},
        {"id": "second_major", "label": "Second Choice Major / 第二志愿专业", "type": "text", "required": false},
        {"id": "intended_term", "label": "Intended Term / 入学学期", "type": "select", "required": true, "options": ["Fall / 秋季", "Spring / 春季", "Summer / 夏季"]}
      ]
    },
    {
      "id": "personal_statement",
      "label": "Personal Statement / 个人陈述",
      "type": "textarea",
      "required": true,
      "maxLength": 2000,
      "helpText": "Please describe your academic interests, career goals, and why you want to study at this university / 请描述您的学术兴趣、职业目标以及为什么想在本校就读"
    },
    {
      "id": "extracurricular",
      "label": "Extracurricular Activities / 课外活动",
      "type": "textarea",
      "required": false,
      "maxLength": 1500,
      "helpText": "Leadership positions, volunteer work, competitions, etc. / 领导职位、志愿工作、竞赛等"
    },
    {
      "id": "honors_awards",
      "label": "Honors and Awards / 荣誉与奖项",
      "type": "textarea",
      "required": false,
      "maxLength": 1000,
      "helpText": "Academic awards, competition results, scholarships, etc. / 学术奖项、竞赛成绩、奖学金等"
    }
  ]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("schoolId") DO UPDATE SET
  "schoolName" = EXCLUDED."schoolName",
  "program" = EXCLUDED."program",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "fieldsData" = EXCLUDED."fieldsData",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 查看所有模板及其类别
SELECT "schoolId", "schoolName", "category", "isActive", "createdAt" 
FROM "SchoolFormTemplate" 
ORDER BY "category", "createdAt" DESC;

