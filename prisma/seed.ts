import { PrismaClient } from '@prisma/client';
import { FormField } from '../src/types';

const prisma = new PrismaClient();

const sampleTemplates = [
  {
    schoolId: 'harvard-graduate',
    schoolName: 'Harvard University',
    program: 'Graduate School of Arts and Sciences',
    description: 'Application for graduate programs at Harvard GSAS',
    fields: [
      {
        id: 'fullName',
        label: 'Full Legal Name',
        type: 'text',
        required: true,
        mapToUserField: 'basicInfo.fullName',
        helpText: 'Please enter your full name as it appears on official documents',
        placeholder: 'John Smith'
      },
      {
        id: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        mapToUserField: 'basicInfo.email',
        helpText: 'Primary email for all communications',
        placeholder: 'john.smith@email.com'
      },
      {
        id: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        mapToUserField: 'basicInfo.phone',
        helpText: 'Include country code',
        placeholder: '+1 (555) 123-4567'
      },
      {
        id: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        mapToUserField: 'basicInfo.birthday'
      },
      {
        id: 'nationality',
        label: 'Nationality',
        type: 'text',
        required: true,
        mapToUserField: 'basicInfo.nationality'
      },
      {
        id: 'undergraduateInstitution',
        label: 'Undergraduate Institution',
        type: 'text',
        required: true,
        aiFillRule: 'Extract from the most recent bachelor degree in education history',
        helpText: 'Name of the institution where you completed your bachelor degree'
      },
      {
        id: 'programInterest',
        label: 'Program of Interest',
        type: 'select',
        required: true,
        options: [
          'Computer Science',
          'Biology',
          'Chemistry',
          'Physics',
          'Mathematics',
          'Economics',
          'Psychology',
          'History',
          'English',
          'Other'
        ],
        helpText: 'Select your intended field of study'
      },
      {
        id: 'statementOfPurpose',
        label: 'Statement of Purpose',
        type: 'essay',
        required: true,
        maxLength: 2000,
        aiFillRule: 'Generate a compelling statement based on user\'s education and experience, explaining their academic interests, research goals, and why they want to pursue graduate study at Harvard',
        helpText: 'Please describe your academic interests, research goals, and reasons for applying (max 2000 characters)',
        mapToUserField: 'essays.statementOfPurpose'
      },
      {
        id: 'researchExperience',
        label: 'Research Experience',
        type: 'textarea',
        required: false,
        maxLength: 1000,
        aiFillRule: 'Summarize relevant research experiences from user profile',
        helpText: 'Describe any research experience you have (max 1000 characters)'
      },
      {
        id: 'academicAchievements',
        label: 'Academic Achievements and Awards',
        type: 'textarea',
        required: false,
        maxLength: 500,
        helpText: 'List your academic honors, awards, and achievements'
      }
    ] as FormField[]
  },
  {
    schoolId: 'stanford-mba',
    schoolName: 'Stanford Graduate School of Business',
    program: 'MBA Program',
    description: 'Application for Stanford GSB MBA Program',
    fields: [
      {
        id: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        mapToUserField: 'basicInfo.fullName'
      },
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        mapToUserField: 'basicInfo.email'
      },
      {
        id: 'phone',
        label: 'Phone',
        type: 'tel',
        required: true,
        mapToUserField: 'basicInfo.phone'
      },
      {
        id: 'currentEmployer',
        label: 'Current Employer',
        type: 'text',
        required: true,
        aiFillRule: 'Extract from most recent work experience',
        helpText: 'Name of your current organization'
      },
      {
        id: 'currentPosition',
        label: 'Current Position',
        type: 'text',
        required: true,
        aiFillRule: 'Extract from most recent work experience',
        helpText: 'Your current job title'
      },
      {
        id: 'yearsOfWorkExperience',
        label: 'Years of Work Experience',
        type: 'select',
        required: true,
        options: ['0-2', '3-4', '5-7', '8-10', '10+'],
        helpText: 'Total years of full-time work experience'
      },
      {
        id: 'essayWhatMatters',
        label: 'Essay A: What matters most to you, and why?',
        type: 'essay',
        required: true,
        maxLength: 1250,
        aiFillRule: 'Generate a personal and reflective essay based on user background, focusing on their core values and what drives them',
        helpText: 'Maximum 1,250 characters (approximately 200 words)'
      },
      {
        id: 'essayWhyStanford',
        label: 'Essay B: Why Stanford?',
        type: 'essay',
        required: true,
        maxLength: 1250,
        aiFillRule: 'Generate an essay explaining why Stanford GSB is the right fit based on user\'s career goals and background',
        helpText: 'Maximum 1,250 characters (approximately 200 words)'
      },
      {
        id: 'leadershipExperience',
        label: 'Leadership Experience',
        type: 'textarea',
        required: true,
        maxLength: 1000,
        aiFillRule: 'Extract and highlight leadership experiences from user profile',
        helpText: 'Describe significant leadership experiences'
      }
    ] as FormField[]
  },
  {
    schoolId: 'mit-engineering',
    schoolName: 'MIT',
    program: 'School of Engineering - Graduate Programs',
    description: 'Application for MIT School of Engineering graduate programs',
    fields: [
      {
        id: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        mapToUserField: 'basicInfo.fullName'
      },
      {
        id: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        mapToUserField: 'basicInfo.email'
      },
      {
        id: 'phoneNumber',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        mapToUserField: 'basicInfo.phone'
      },
      {
        id: 'citizenship',
        label: 'Citizenship',
        type: 'text',
        required: true,
        mapToUserField: 'basicInfo.nationality'
      },
      {
        id: 'programChoice',
        label: 'Degree Program',
        type: 'select',
        required: true,
        options: [
          'Electrical Engineering and Computer Science',
          'Mechanical Engineering',
          'Civil and Environmental Engineering',
          'Chemical Engineering',
          'Biological Engineering',
          'Materials Science and Engineering',
          'Aeronautics and Astronautics',
          'Nuclear Science and Engineering'
        ]
      },
      {
        id: 'degreeObjective',
        label: 'Degree Objective',
        type: 'select',
        required: true,
        options: ['Master of Science', 'Master of Engineering', 'Ph.D.', 'Engineer\'s Degree']
      },
      {
        id: 'statementOfObjectives',
        label: 'Statement of Objectives',
        type: 'essay',
        required: true,
        maxLength: 4000,
        aiFillRule: 'Generate a technical and research-focused statement explaining academic preparation, research interests, and career objectives in engineering',
        helpText: 'Describe your academic background, research interests, and career objectives (max 4000 characters)'
      },
      {
        id: 'researchInterests',
        label: 'Research Interests',
        type: 'textarea',
        required: true,
        maxLength: 1000,
        helpText: 'Describe your specific research interests and potential research areas'
      },
      {
        id: 'technicalSkills',
        label: 'Technical Skills',
        type: 'textarea',
        required: false,
        maxLength: 500,
        helpText: 'List relevant programming languages, tools, and technical skills'
      },
      {
        id: 'publications',
        label: 'Publications and Patents',
        type: 'textarea',
        required: false,
        maxLength: 1000,
        helpText: 'List any publications, patents, or significant technical contributions'
      }
    ] as FormField[]
  }
];

const schoolMeta = {
  'harvard-graduate': {
    name: 'Harvard University (GSAS)',
    shortName: 'Harvard GSAS',
    campusLocation: 'Cambridge, MA',
    gradeRange: 'Graduate',
    officialLink: 'https://gsas.harvard.edu/admissions',
    applicationStart: new Date('2024-09-01T00:00:00.000Z'),
    applicationEnd: new Date('2024-12-15T23:59:59.000Z'),
    interviewTime: new Date('2025-02-10T00:00:00.000Z'),
    examTime: null,
    resultTime: new Date('2025-03-25T00:00:00.000Z'),
    requiredDocuments: [
      'Online application form',
      'Statement of purpose',
      'Resume/CV',
      'Three recommendation letters',
      'Official transcripts'
    ],
    requirements: [
      'Minimum GPA 3.0/4.0',
      'TOEFL/IELTS for non-native English speakers'
    ]
  },
  'stanford-mba': {
    name: 'Stanford GSB MBA',
    shortName: 'Stanford GSB',
    campusLocation: 'Stanford, CA',
    gradeRange: 'MBA',
    officialLink: 'https://www.gsb.stanford.edu/programs/mba/admission',
    applicationStart: new Date('2024-06-01T00:00:00.000Z'),
    applicationEnd: new Date('2024-09-10T23:59:59.000Z'),
    interviewTime: new Date('2024-10-15T00:00:00.000Z'),
    examTime: null,
    resultTime: new Date('2024-12-05T00:00:00.000Z'),
    requiredDocuments: [
      'Online application form',
      'Two recommendation letters',
      'GMAT/GRE score report',
      'TOEFL/IELTS (if applicable)'
    ],
    requirements: [
      'Undergraduate degree or equivalent',
      'Minimum 2 years work experience recommended'
    ]
  },
  'mit-engineering': {
    name: 'MIT School of Engineering',
    shortName: 'MIT SoE',
    campusLocation: 'Cambridge, MA',
    gradeRange: 'Graduate',
    officialLink: 'https://soe.mit.edu/graduate-admissions',
    applicationStart: new Date('2024-07-15T00:00:00.000Z'),
    applicationEnd: new Date('2024-12-01T23:59:59.000Z'),
    interviewTime: new Date('2025-02-01T00:00:00.000Z'),
    examTime: null,
    resultTime: new Date('2025-03-20T00:00:00.000Z'),
    requiredDocuments: [
      'Online application',
      'Official transcripts',
      'Statement of objectives',
      'Three letters of recommendation',
      'GRE (optional for some departments)'
    ],
    requirements: [
      'Demonstrated research experience',
      'Strong quantitative background'
    ]
  }
} as const;

async function main() {
  console.log('Starting seed...');

  // Clear existing templates
  await prisma.application.deleteMany();
  await prisma.school.deleteMany();
  await prisma.schoolFormTemplate.deleteMany();
  console.log('Cleared existing applications, schools, and templates');

  // Create sample templates
  for (const template of sampleTemplates) {
    const createdTemplate = await prisma.schoolFormTemplate.create({
      data: {
        id: template.schoolId,
        schoolId: template.schoolId,
        schoolName: template.schoolName,
        program: template.program,
        description: template.description,
        fieldsData: template.fields as any,
        isActive: true,
        updatedAt: new Date()
      }
    });
    console.log(`Created template: ${template.schoolName} - ${template.program}`);

    const meta = schoolMeta[template.schoolId as keyof typeof schoolMeta];
    if (meta) {
      await prisma.school.create({
        data: {
          id: `${template.schoolId}-school`,
          name: meta?.name || template.schoolName as string,
          templateId: createdTemplate.id,
          shortName: meta.shortName,
          campusLocation: meta.campusLocation,
          gradeRange: meta.gradeRange,
          officialLink: meta.officialLink,
          applicationStart: meta.applicationStart,
          applicationEnd: meta.applicationEnd,
          interviewTime: meta.interviewTime,
          examTime: meta.examTime ?? undefined,
          resultTime: meta.resultTime,
          requiredDocuments: meta.requiredDocuments as any,
          requirements: meta.requirements as any,
          metadataSource: 'seed',
          updatedAt: new Date()
        }
      });
      console.log(`Linked school metadata for ${template.schoolName}`);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

