import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Plus, FileText, Clock, CheckCircle, Trash2, Settings, Search, X } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { getLocalizedSchoolName, LocalizedText } from '@/utils/i18n';

interface Application {
  id: string;
  schoolName: string | LocalizedText;
  program: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

interface Template {
  id: string;
  schoolName: string | LocalizedText;
  program: string;
  description?: string;
  category?: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchApplications();
    fetchTemplates();
  }, [router, fetchApplications, fetchTemplates]);

  const createApplication = async (templateId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/application/${data.application.id}`);
      }
    } catch (error) {
      console.error('Error creating application:', error);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm(t('dashboard.deleteConfirm'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setApplications(applications.filter(app => app.id !== id));
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': t('dashboard.draft'),
      'in_progress': t('dashboard.inProgress'),
      'submitted': t('dashboard.submitted'),
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  // Category mapping
  const categoryMap: Record<string, string> = {
    '国际学校': 'international',
    '香港本地中学': 'hkSecondary',
    '香港本地小学': 'hkPrimary',
    '香港幼稚园': 'hkKindergarten',
    '幼稚园': 'hkKindergarten',
    '大学': 'university',
  };

  const getCategoryLabel = (category: string | null | undefined): string => {
    if (!category) return t('admin.templates.category.international');
    const categoryKey = categoryMap[category] || 'international';
    return t(`admin.templates.category.${categoryKey}`) || category;
  };

  // Filter templates by category and search term
  const filteredTemplates = templates.filter((template) => {
    // Filter by category
    if (selectedCategory !== 'all') {
      const templateCategory = template.category || '国际学校';
      const categoryKey = categoryMap[templateCategory] || 'international';
      if (categoryKey !== selectedCategory) {
        return false;
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const schoolName = getLocalizedSchoolName(template.schoolName, language).toLowerCase();
      const program = (template.program || '').toLowerCase();
      const description = (template.description || '').toLowerCase();
      
      return (
        schoolName.includes(searchLower) ||
        program.includes(searchLower) ||
        description.includes(searchLower)
      );
    }

    return true;
  });

  // Get unique categories from templates
  const categories = Array.from(
    new Set(
      templates
        .map((t) => t.category || '国际学校')
        .map((cat) => {
          const key = categoryMap[cat] || 'international';
          return key;
        })
    )
  ).sort();

  // Category display order
  const categoryOrder = ['international', 'hkSecondary', 'hkPrimary', 'hkKindergarten', 'university'];
  const sortedCategories = categoryOrder.filter((cat) => categories.includes(cat));

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{t('dashboard.title')} - {t('common.appName')}</title>
      </Head>

      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-gray-600 mt-2">{t('dashboard.subtitle')}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/templates"
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>{t('dashboard.manageTemplates')}</span>
              </Link>
              <button
                onClick={() => setShowNewAppModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{t('dashboard.newApplication')}</span>
              </button>
            </div>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('dashboard.noApplications')}</h3>
              <p className="text-gray-600 mb-6">{t('dashboard.noApplicationsDesc')}</p>
              <button
                onClick={() => setShowNewAppModal(true)}
                className="btn-primary"
              >
                {t('dashboard.createFirst')}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(app.status)}
                      <span className="text-sm font-medium text-gray-600">
                        {getStatusText(app.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {getLocalizedSchoolName(app.schoolName, language)}
                  </h3>
                  <p className="text-gray-600 mb-4">{app.program}</p>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    {t('dashboard.updated')}: {new Date(app.updatedAt).toLocaleDateString()}
                  </div>
                  
                  <Link
                    href={`/application/${app.id}`}
                    className="btn-primary w-full text-center"
                  >
                    {app.status === 'submitted' ? t('dashboard.viewApplication') : t('dashboard.continueApplication')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Application Modal */}
        {showNewAppModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('dashboard.chooseSchool')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowNewAppModal(false);
                      setSelectedCategory('all');
                      setSearchTerm('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('admin.templates.searchPlaceholder') || '搜索学校名称、项目或描述...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-4 border-b border-gray-200 overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('admin.templates.category.all') || '全部'}
                  </button>
                  {sortedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t(`admin.templates.category.${cat}`) || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates List */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm
                        ? (t('admin.templates.noTemplatesSearch')?.replace('{keyword}', searchTerm) || `没有找到与"${searchTerm}"匹配的学校`)
                        : (selectedCategory === 'all'
                          ? t('admin.templates.noTemplates') || '还没有任何学校模板'
                          : (t('admin.templates.noCategoryTemplates')?.replace('{category}', t(`admin.templates.category.${selectedCategory}`)) || `还没有"${t(`admin.templates.category.${selectedCategory}`)}"类别的学校`))}
                    </h3>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-primary-600 hover:text-primary-700 mt-2"
                      >
                        {t('admin.templates.clearSearch') || '清除搜索'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
                        onClick={() => {
                          createApplication(template.id);
                          setShowNewAppModal(false);
                          setSelectedCategory('all');
                          setSearchTerm('');
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {getLocalizedSchoolName(template.schoolName, language)}
                            </h3>
                            <p className="text-gray-600 mt-1">{template.program}</p>
                            {template.description && (
                              <p className="text-sm text-gray-500 mt-2">{template.description}</p>
                            )}
                          </div>
                          {template.category && (
                            <span className="ml-4 px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 whitespace-nowrap">
                              {getCategoryLabel(template.category)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowNewAppModal(false);
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                  className="btn-secondary w-full"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

{process.env.NEXT_PUBLIC_AUTOFILL === "true" && (
  <Link href="/autofill/mapping" className="underline text-blue-600">
    Autofill Mapping (Beta)
  </Link>
)}
