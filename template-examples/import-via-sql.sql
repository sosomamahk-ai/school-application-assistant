-- ============================================
-- 通过 SQL 直接导入学校模板
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 清华大学本科申请模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'tsinghua-undergraduate-2024',
  '清华大学',
  '2024年本科招生',
  '清华大学本科生综合评价招生申请表',
  '[
    {
      "id": "basic_info",
      "label": "基本信息",
      "type": "section",
      "fields": [
        {
          "id": "name",
          "label": "姓名",
          "type": "text",
          "required": true,
          "aiFillRule": "basicInfo.fullName",
          "helpText": "请填写您的真实姓名"
        },
        {
          "id": "gender",
          "label": "性别",
          "type": "select",
          "required": true,
          "options": ["男", "女"],
          "helpText": "请选择性别"
        },
        {
          "id": "id_number",
          "label": "身份证号",
          "type": "text",
          "required": true,
          "helpText": "请填写18位身份证号码"
        },
        {
          "id": "birthday",
          "label": "出生日期",
          "type": "date",
          "required": true,
          "aiFillRule": "basicInfo.birthday"
        },
        {
          "id": "phone",
          "label": "联系电话",
          "type": "tel",
          "required": true,
          "aiFillRule": "basicInfo.phone",
          "helpText": "请填写11位手机号码"
        },
        {
          "id": "email",
          "label": "电子邮箱",
          "type": "email",
          "required": true,
          "helpText": "用于接收申请相关通知"
        }
      ]
    },
    {
      "id": "education_background",
      "label": "教育背景",
      "type": "section",
      "fields": [
        {
          "id": "high_school",
          "label": "就读中学",
          "type": "text",
          "required": true,
          "aiFillRule": "education[0].school",
          "helpText": "请填写您当前就读或毕业的高中"
        },
        {
          "id": "class_name",
          "label": "班级",
          "type": "text",
          "required": true,
          "helpText": "例如：高三(1)班"
        },
        {
          "id": "gpa",
          "label": "平均成绩/GPA",
          "type": "text",
          "required": true,
          "aiFillRule": "education[0].gpa",
          "helpText": "请填写您的平均成绩或GPA"
        },
        {
          "id": "class_rank",
          "label": "年级排名",
          "type": "text",
          "required": false,
          "helpText": "例如：5/500（您的排名/年级总人数）"
        }
      ]
    },
    {
      "id": "major_selection",
      "label": "专业志愿",
      "type": "section",
      "fields": [
        {
          "id": "first_choice",
          "label": "第一志愿专业",
          "type": "text",
          "required": true,
          "helpText": "请填写您的第一志愿专业"
        },
        {
          "id": "second_choice",
          "label": "第二志愿专业",
          "type": "text",
          "required": false,
          "helpText": "可选填"
        },
        {
          "id": "major_reason",
          "label": "专业选择理由",
          "type": "textarea",
          "required": true,
          "maxLength": 500,
          "helpText": "请简要说明您选择该专业的原因（500字以内）"
        }
      ]
    },
    {
      "id": "personal_statement",
      "label": "个人陈述",
      "type": "textarea",
      "required": true,
      "maxLength": 800,
      "helpText": "请结合自身经历，阐述您的学习动机、个人特长和未来规划（800字以内）"
    },
    {
      "id": "awards_honors",
      "label": "获奖情况",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "请列举您在高中期间获得的主要奖项和荣誉"
    },
    {
      "id": "extracurricular",
      "label": "课外活动",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "请简要介绍您参与的课外活动、社团或志愿服务"
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
  "fieldsData" = EXCLUDED."fieldsData",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 2. 北京大学研究生申请模板
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'pku-graduate-2024',
  '北京大学',
  '2024年研究生招生',
  '北京大学研究生入学申请表',
  '[
    {
      "id": "basic_info",
      "label": "基本信息",
      "type": "section",
      "fields": [
        {
          "id": "name",
          "label": "姓名",
          "type": "text",
          "required": true,
          "aiFillRule": "basicInfo.fullName"
        },
        {
          "id": "gender",
          "label": "性别",
          "type": "select",
          "required": true,
          "options": ["男", "女"]
        },
        {
          "id": "id_number",
          "label": "身份证号",
          "type": "text",
          "required": true
        },
        {
          "id": "phone",
          "label": "联系电话",
          "type": "tel",
          "required": true,
          "aiFillRule": "basicInfo.phone"
        },
        {
          "id": "email",
          "label": "电子邮箱",
          "type": "email",
          "required": true
        }
      ]
    },
    {
      "id": "undergraduate_info",
      "label": "本科学习背景",
      "type": "section",
      "fields": [
        {
          "id": "bachelor_school",
          "label": "本科院校",
          "type": "text",
          "required": true,
          "aiFillRule": "education[0].school"
        },
        {
          "id": "bachelor_major",
          "label": "本科专业",
          "type": "text",
          "required": true,
          "aiFillRule": "education[0].major"
        },
        {
          "id": "bachelor_gpa",
          "label": "本科GPA",
          "type": "text",
          "required": true,
          "aiFillRule": "education[0].gpa"
        },
        {
          "id": "graduation_date",
          "label": "毕业时间",
          "type": "date",
          "required": true,
          "aiFillRule": "education[0].endDate"
        }
      ]
    },
    {
      "id": "research_plan",
      "label": "研究计划",
      "type": "textarea",
      "required": true,
      "maxLength": 1500,
      "helpText": "请详细阐述您的研究兴趣、研究计划和职业目标（1000-1500字）"
    },
    {
      "id": "research_experience",
      "label": "科研经历",
      "type": "textarea",
      "required": false,
      "maxLength": 1000,
      "helpText": "请介绍您参与过的科研项目和成果"
    },
    {
      "id": "publications",
      "label": "发表论文",
      "type": "textarea",
      "required": false,
      "maxLength": 500,
      "helpText": "请列出您发表的学术论文（如有）"
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
  "fieldsData" = EXCLUDED."fieldsData",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- 查看导入结果
SELECT "schoolId", "schoolName", "program", "isActive", "createdAt" 
FROM "SchoolFormTemplate" 
ORDER BY "createdAt" DESC;

