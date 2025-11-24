import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useTranslation } from '@/contexts/TranslationContext';
import { getLocalizedSchoolName, LocalizedText } from '@/utils/i18n';
import { GraduationCap, BookOpen, Users, Baby, School } from 'lucide-react';

interface SchoolRecord {
  id: string;
  templateId: string | null;
  templateSchoolId: string | null;
  schoolName: string | LocalizedText;
  name: string;
  nameEnglish?: string | null;
  program?: string | null;
  category?: string | null;
  nameShort?: string | null;
  name_short?: string | null;
  permalink?: string | null;
  applicationStart?: string | null;
  applicationEnd?: string | null;
  country?: string | null;
  location?: string | null;
  bandType?: string | null;
  hasApplication?: boolean;
  applicationId?: string | null;
  wpId?: number | null;
}

const categoryMap: Record<string, string> = {
  '国际学校': '国际学校',
  '香港国际学校': '国际学校',
  '香港本地中学': '本地中学',
  '本地中学': '本地中学',
  '香港本地小学': '本地小学',
  '本地小学': '本地小学',
  '香港幼稚园': '幼稚园',
  '幼稚园': '幼稚园',
  '大学': '大学'
};

// Extract category from schoolId if it follows the new format: {name_short}-{category_abbr}-{year}
// Category abbreviations: is (国际学校), ls (本地中学), lp (本地小学), kg (幼稚园), un (大学)
const extractCategoryFromSchoolId = (schoolId: string | null | undefined): string | null => {
  if (!schoolId) return null;
  
  // Match pattern: {name_short}-{category_abbr}-{year}
  const match = schoolId.match(/-([a-z]{2})-\d{4}$/);
  if (match) {
    const abbr = match[1];
    const abbrMap: Record<string, string> = {
      'is': '国际学校',
      'ls': '本地中学',
      'lp': '本地小学',
      'kg': '幼稚园',
      'un': '大学'
    };
    return abbrMap[abbr] || null;
  }
  
  return null;
};

const getCategoryLabel = (
  category: string | null | undefined,
  templateSchoolId?: string | null
): string => {
  // First try to use the category field
  if (category) {
    return categoryMap[category] || category;
  }
  
  // If category is null/undefined, try to extract from schoolId (for new format templates)
  if (templateSchoolId) {
    const extractedCategory = extractCategoryFromSchoolId(templateSchoolId);
    if (extractedCategory) {
      return extractedCategory;
    }
  }
  
  // Default fallback
  return '国际学校';
};

const categoryIcons: Record<string, any> = {
  '国际学校': GraduationCap,
  '本地中学': School,
  '本地小学': BookOpen,
  '幼稚园': Baby,
  '大学': Users
};

export default function SchoolsPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [schoolRecords, setSchoolRecords] = useState<SchoolRecord[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch schools with template data
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch('/api/schools');
      if (response.ok) {
        const data = await response.json();
        const schoolList: SchoolRecord[] = (data.schools || [])
          .filter((school: any) => school.templateId)
          .map((school: any) => ({
            ...school,
            schoolName: school.schoolName ?? school.name
          }));
        setSchoolRecords(schoolList);
      }
    } catch (error) {
      console.error('Error fetching school records:', error);
    }
  }, []);

  // Fetch user applications to check which schools have been applied
  const fetchApplications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    Promise.all([fetchSchools(), fetchApplications()]).finally(() => {
      setLoading(false);
    });
  }, [mounted, router, fetchSchools, fetchApplications]);

  // Enrich templates with WordPress data and application status
  const enrichedTemplates = useMemo(() => {
    return schoolRecords.map((record) => {
      const application = applications.find(
        (app) => app.templateId === record.templateId
      );

      const schoolName = record.schoolName ?? record.name;
      const nameShort =
        record.nameShort || record.name_short || null;

      return {
        ...record,
        schoolName,
        nameShort,
        permalink: record.permalink || null,
        applicationStart: record.applicationStart || null,
        applicationEnd: record.applicationEnd || null,
        hasApplication: !!application,
        applicationId: application?.id || null
      };
    });
  }, [schoolRecords, applications]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) return enrichedTemplates;
    return enrichedTemplates.filter((template) => {
      const category = getCategoryLabel(template.category, template.templateSchoolId);
      return category === selectedCategory;
    });
  }, [enrichedTemplates, selectedCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const statsMap: Record<string, number> = {
      '国际学校': 0,
      '本地中学': 0,
      '本地小学': 0,
      '幼稚园': 0,
      '大学': 0
    };

    enrichedTemplates.forEach((template) => {
      const category = getCategoryLabel(template.category, template.templateSchoolId);
      if (statsMap.hasOwnProperty(category)) {
        statsMap[category]++;
      }
    });

    return statsMap;
  }, [enrichedTemplates]);

  const handleApply = async (template: SchoolRecord) => {
    if (!template.templateId) {
      alert('该学校暂未提供在线模板');
      return;
    }

    if (template.hasApplication && template.applicationId) {
      // Already applied, navigate to application
      router.push(`/application/${template.applicationId}`);
      return;
    }

    // Create new application
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template.templateId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to the new application
        if (data.application?.id) {
          router.push(`/application/${data.application.id}`);
        } else {
          // Refresh to update the list
          await fetchApplications();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '创建申请失败');
      }
    } catch (error) {
      console.error('Error creating application:', error);
      alert('创建申请失败，请重试');
    }
  };

  return (
    <>
      <Head>
        <title>学校列表 - {t('common.appName')}</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {!mounted || loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">可申请学校</h1>
                <p className="text-gray-600 mt-2">浏览并申请您感兴趣的学校</p>
              </div>

              {/* Statistics Box */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats).map(([category, count]) => {
                  const Icon = categoryIcons[category] || GraduationCap;
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(isSelected ? null : category)}
                      className={`card p-4 text-center transition-all hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600 mt-1">{category}</div>
                    </button>
                  );
                })}
              </div>

              {/* Schools Table */}
              <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left whitespace-nowrap">学校名称</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">学校类别</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">开始申请时间</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">结束申请时间</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTemplates.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                            {selectedCategory ? `暂无"${selectedCategory}"类别的学校` : '暂无可用学校'}
                          </td>
                        </tr>
                      ) : (
                        filteredTemplates.map((template) => {
                          const schoolName = getLocalizedSchoolName(template.schoolName, language);
                          return (
                            <tr key={template.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                {template.permalink ? (
                                  <a
                                    href={template.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-gray-900 hover:text-primary-600 hover:underline"
                                  >
                                    {schoolName}
                                  </a>
                                ) : (
                                  <div className="font-semibold text-gray-900">{schoolName}</div>
                                )}
                                {template.nameShort && (
                                  <div className="text-xs text-gray-500 mt-1">{template.nameShort}</div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <span className="text-sm text-gray-600">
                                  {getCategoryLabel(template.category, template.templateSchoolId)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center text-gray-600">
                                {template.applicationStart
                                  ? new Date(template.applicationStart).toLocaleDateString('zh-CN')
                                  : '待定'}
                              </td>
                              <td className="px-4 py-4 text-center text-gray-600">
                                {template.applicationEnd
                                  ? new Date(template.applicationEnd).toLocaleDateString('zh-CN')
                                  : '待定'}
                              </td>
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                {template.hasApplication ? (
                                  <Link
                                    href={`/application/${template.applicationId}`}
                                    className="btn-secondary text-center text-xs py-1.5 px-3 whitespace-nowrap"
                                  >
                                    已申请
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => handleApply(template)}
                                    className="btn-primary text-center text-xs py-1.5 px-3 whitespace-nowrap"
                                  >
                                    申请
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
