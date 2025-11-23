import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Plus, FileText, Clock, CheckCircle, Trash2, Settings, Search, X, Bot, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { getLocalizedSchoolName, LocalizedText } from '@/utils/i18n';
import SchoolSummary from '@/components/applications/SchoolSummary';
import StatusSummary from '@/components/applications/StatusSummary';

interface Application {
  id: string;
  schoolName: string | LocalizedText;
  program: string;
  category?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  templateId?: string;
  templateSchoolId?: string;
  formData?: any;
}

interface Template {
  id: string;
  schoolName: string | LocalizedText;
  program: string;
  description?: string;
  category?: string | null;
}

export default function MyApplication() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoApplyingId, setAutoApplyingId] = useState<string | null>(null);
  const [autoApplyError, setAutoApplyError] = useState<string | null>(null);
  const [autoApplyMessage, setAutoApplyMessage] = useState<string | null>(null);
  const [selectedApplicationCategory, setSelectedApplicationCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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
      console.log('[my-application] Fetching templates from /api/templates...');
      const response = await fetch('/api/templates');
      console.log('[my-application] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[my-application] Raw API response:', data);
        
        // Check response structure
        if (!data) {
          console.error('[my-application] Response data is null or undefined');
          setTemplates([]);
          return;
        }
        
        if (!data.success) {
          console.warn('[my-application] API returned success: false', data);
        }
        
        // Ensure templates array exists and log for debugging
        const templatesList = data.templates || [];
        console.log('[my-application] Processed templates:', {
          count: templatesList.length,
          templates: templatesList.map((t: Template) => ({
            id: t.id,
            schoolName: typeof t.schoolName === 'string' ? t.schoolName : JSON.stringify(t.schoolName),
            program: t.program,
            category: t.category,
            hasDescription: !!t.description
          }))
        });
        
        if (templatesList.length === 0) {
          console.warn('[my-application] No templates found in response. Full response:', JSON.stringify(data, null, 2));
          console.warn('[my-application] Response structure:', {
            hasSuccess: 'success' in data,
            hasTemplates: 'templates' in data,
            dataKeys: Object.keys(data),
            dataType: typeof data
          });
        } else {
          console.log('[my-application] Successfully loaded templates, setting state...');
        }
        
        // Ensure we set the templates even if empty (to trigger re-render)
        setTemplates(templatesList);
      } else {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('[my-application] Failed to fetch templates:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        setTemplates([]);
      }
    } catch (error) {
      console.error('[my-application] Error fetching templates:', error);
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // 并行执行两个 API 调用，减少加载时间
    Promise.all([fetchApplications(), fetchTemplates()]).catch((error) => {
      console.error('Error loading data:', error);
    });
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

  // Check if application has any filled fields
  const hasFilledFields = useMemo(() => {
    const result = new Map<string, boolean>();
    applications.forEach((app) => {
      if (!app.formData || typeof app.formData !== 'object') {
        result.set(app.id, false);
        return;
      }
      const formData = app.formData as Record<string, any>;
      // Check if any field has a value (excluding __structure)
      const hasFilled = Object.keys(formData).some(key => {
        if (key === '__structure') return false;
        const value = formData[key];
        return value !== undefined && value !== null && value !== '';
      });
      result.set(app.id, hasFilled);
    });
    return result;
  }, [applications]);

  const getHasFilledFields = useCallback((application: Application): boolean => {
    return hasFilledFields.get(application.id) ?? false;
  }, [hasFilledFields]);

  const runAutoApply = async (application: Application) => {
    setAutoApplyError(null);
    setAutoApplyMessage(null);
    setAutoApplyingId(application.id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Get template info from application
      const templateId = application.templateId || '';
      const templateSchoolId = application.templateSchoolId || '';

      const res = await fetch('/api/auto-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          schoolId: templateSchoolId,
          templateId: templateId,
          applicationId: application.id
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || '自动申请失败');
      }
      setAutoApplyMessage(data.message || '自动申请流程已完成，请查看最新状态。');
      // Refresh applications list after a short delay to avoid infinite loops
      setTimeout(() => {
        fetchApplications();
      }, 100);
    } catch (err) {
      console.error(err);
      setAutoApplyError(err instanceof Error ? err.message : '自动申请失败，请稍后再试');
    } finally {
      setAutoApplyingId(null);
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
    '香港国际学校': 'international', // Add mapping for 香港国际学校
    '香港本地中学': 'hkSecondary',
    '本地中学': 'hkSecondary',
    '香港本地小学': 'hkPrimary',
    '本地小学': 'hkPrimary',
    '香港幼稚园': 'hkKindergarten',
    '幼稚园': 'hkKindergarten',
    '大学': 'university',
  };

  const getCategoryLabel = (category: string | null | undefined): string => {
    if (!category) return t('admin.templates.category.international');
    const categoryKey = categoryMap[category] || 'international';
    return t(`admin.templates.category.${categoryKey}`) || category;
  };

  // Filter applications by selected category and status
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by category
    if (selectedApplicationCategory) {
      filtered = filtered.filter((app) => {
        const category = app.category || '国际学校';
        const categoryKey = categoryMap[category] || 'international';
        return categoryKey === selectedApplicationCategory;
      });
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter((app) => {
        if (selectedStatus === 'draft') {
          return !app.status || app.status === 'draft';
        }
        if (selectedStatus === 'submitted') {
          return app.status === 'submitted';
        }
        return true;
      });
    }

    return filtered;
    // categoryMap is a constant, no need to include in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications, selectedApplicationCategory, selectedStatus]);

  // Filter templates by category and search term
  const filteredTemplates = useMemo(() => {
    console.log('[my-application] Filtering templates:', {
      totalTemplates: templates.length,
      selectedCategory,
      searchTerm,
      templates: templates.map(t => ({
        id: t.id,
        schoolName: typeof t.schoolName === 'string' ? t.schoolName : JSON.stringify(t.schoolName),
        category: t.category,
        categoryKey: categoryMap[t.category || '国际学校'] || 'international'
      }))
    });

    const filtered = templates.filter((template) => {
      // Filter by category
      if (selectedCategory !== 'all') {
        const templateCategory = template.category || '国际学校';
        const categoryKey = categoryMap[templateCategory] || 'international';
        console.log('[my-application] Category check:', {
          templateId: template.id,
          templateCategory,
          categoryKey,
          selectedCategory,
          matches: categoryKey === selectedCategory
        });
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

    console.log('[my-application] Filtered result:', {
      filteredCount: filtered.length,
      filteredIds: filtered.map(t => t.id),
      filteredDetails: filtered.map(t => ({
        id: t.id,
        schoolName: typeof t.schoolName === 'string' ? t.schoolName : JSON.stringify(t.schoolName),
        category: t.category
      }))
    });

    return filtered;
    // categoryMap is a constant, no need to include in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, selectedCategory, searchTerm, language]);

  // Get unique categories from templates
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(
        templates
          .map((t) => t.category || '国际学校')
          .map((cat) => {
            const key = categoryMap[cat] || 'international';
            return key;
          })
      )
    ).sort();
    
    console.log('[my-application] Categories:', {
      templatesCount: templates.length,
      categories: cats,
      templateCategories: templates.map(t => t.category)
    });
    
    return cats;
    // categoryMap is a constant, no need to include in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);

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

          {/* Auto Apply Messages */}
          {autoApplyError && (
            <div className="bg-red-50 text-red-600 px-4 py-2 text-sm rounded-lg border border-red-100">
              {autoApplyError}
            </div>
          )}
          {autoApplyMessage && !autoApplyError && (
            <div className="bg-green-50 text-green-700 px-4 py-2 text-sm rounded-lg border border-green-100">
              {autoApplyMessage}
            </div>
          )}

          {/* Statistics Summary */}
          {applications.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
              <StatusSummary
                applications={applications}
                selectedStatus={selectedStatus}
                onStatusSelect={setSelectedStatus}
              />
              <SchoolSummary
                applications={applications}
                language={language}
                selectedCategory={selectedApplicationCategory}
                onCategorySelect={setSelectedApplicationCategory}
                getCategoryLabel={getCategoryLabel}
              />
            </div>
          )}

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
            <div>
              {(selectedApplicationCategory || selectedStatus) && (
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-sm text-gray-600">筛选：</span>
                    {selectedStatus && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-primary-700 text-sm">
                        {selectedStatus === 'draft' ? '草稿' : selectedStatus === 'submitted' ? '已提交' : selectedStatus}
                        <button
                          onClick={() => setSelectedStatus(null)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedApplicationCategory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-primary-700 text-sm">
                        {getCategoryLabel(
                          Object.keys(categoryMap).find(key => categoryMap[key] === selectedApplicationCategory) || null
                        )}
                        <button
                          onClick={() => setSelectedApplicationCategory(null)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedApplicationCategory(null);
                        setSelectedStatus(null);
                      }}
                      className="ml-2 text-xs text-primary-600 hover:text-primary-700 underline"
                    >
                      清除所有筛选
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    共 {filteredApplications.length} 个申请
                  </span>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApplications.map((app) => {
                const hasFilled = getHasFilledFields(app);
                const canAutoApply = hasFilled && app.status !== 'submitted';
                return (
                  <div key={app.id} className="card hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(app.status)}
                        <span className="text-sm font-medium text-gray-600">
                          {getStatusText(app.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canAutoApply && (
                          <button
                            onClick={() => runAutoApply(app)}
                            disabled={autoApplyingId === app.id}
                            className="px-3 py-1.5 text-sm flex items-center space-x-1 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            title="自动申请"
                          >
                            {autoApplyingId === app.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>申请中...</span>
                              </>
                            ) : (
                              <>
                                <Bot className="h-4 w-4" />
                                <span>自动申请</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
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
                );
              })}
              </div>
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
              <div className="px-6 pt-4 pb-0 border-b border-gray-200 overflow-x-auto overflow-y-hidden flex-shrink-0">
                <div className="flex space-x-2 min-w-max pb-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
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
                      className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
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
                    {templates.length === 0 && (
                      <div className="mt-4 text-sm text-gray-500">
                        <p>提示：请检查浏览器控制台（F12）查看详细日志</p>
                        <p>如果模版已创建但仍未显示，请检查模版的 isActive 状态</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTemplates.map((template, index) => {
                      let schoolNameDisplay = '';
                      try {
                        schoolNameDisplay = getLocalizedSchoolName(template.schoolName, language);
                      } catch (error) {
                        console.error('Error getting localized school name:', error, template);
                        schoolNameDisplay = typeof template.schoolName === 'string' 
                          ? template.schoolName 
                          : JSON.stringify(template.schoolName);
                      }
                      
                      return (
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
                                {schoolNameDisplay}
                              </h3>
                              <p className="text-gray-600 mt-1">{template.program || '(无项目名称)'}</p>
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
                      );
                    })}
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

