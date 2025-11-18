import { useState, useEffect, useCallback } from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { Plus, Upload, Download, Edit, Trash2, Eye, Copy, Filter } from 'lucide-react';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/utils/auth';
import { getTokenFromCookieHeader } from '@/utils/token';
import { useTranslation } from '@/contexts/TranslationContext';

interface SchoolTemplate {
  id: string;
  schoolId: string;
  schoolName: string;
  program: string;
  description: string;
  category?: string;
  fieldsData: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category keys for translation
const CATEGORY_KEYS = [
  'all',
  'international',
  'hkSecondary',
  'hkPrimary',
  'hkKindergarten',
  'university'
] as const;

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  'international': 'bg-blue-100 text-blue-800',
  'hkSecondary': 'bg-green-100 text-green-800',
  'hkPrimary': 'bg-yellow-100 text-yellow-800',
  'hkKindergarten': 'bg-pink-100 text-pink-800',
  'university': 'bg-purple-100 text-purple-800'
};

export default function TemplatesAdmin() {
  const router = useRouter();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<SchoolTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // 使用管理员专用API，获取所有模板（包括禁用的）
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched templates:', data);
        setTemplates(data.templates || []);
      } else if (response.status === 401) {
        // 未授权，重定向到登录页
        router.push('/auth/login');
      } else {
        // 处理其他错误
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch templates:', response.status, errorData);
        const errorMsg = errorData.error || t('admin.templates.error.unknown');
        alert(t('admin.templates.error.loadFailed').replace('{error}', errorMsg));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert(t('admin.templates.error.loadFailedNetwork'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTemplates]);

  const handleCreateNew = () => {
    router.push('/admin/templates/new');
  };

  const handleCreateFromTemplate = (templateId: string) => {
    router.push(`/admin/templates/new?baseTemplate=${templateId}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/templates/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.templates.confirmDelete'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert(t('admin.templates.success.delete'));
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(t('admin.templates.error.delete'));
    }
  };

  const handleExportTemplate = (template: SchoolTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.schoolId}-template.json`;
    link.click();
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  // Helper function to get category translation
  const getCategoryTranslation = (categoryKey: string) => {
    return t(`admin.templates.category.${categoryKey}` as any);
  };

  // 筛选模板
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(template => {
        // Map category keys to actual category values
        const categoryMap: Record<string, string> = {
          'international': '国际学校',
          'hkSecondary': '香港本地中学',
          'hkPrimary': '香港本地小学',
          'hkKindergarten': '香港幼稚园',
          'university': '大学'
        };
        return template.category === categoryMap[selectedCategory] || template.category === selectedCategory;
      });

  // 获取系统预设模板（用于"基于模板创建"）- 包括所有以 template- 开头的模板
  const systemTemplates = templates.filter(template => {
    const isSystem = template.schoolId && template.schoolId.startsWith('template-');
    if (isSystem) {
      console.log('Found system template:', template.schoolId, template.schoolName);
    }
    return isSystem;
  });
  
  // 获取用户创建的模板
  const userTemplates = filteredTemplates.filter(template => !template.schoolId || !template.schoolId.startsWith('template-'));

  return (
    <Layout>
      <Head>
        <title>{t('admin.templates.pageTitle')}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.templates.mainTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('admin.templates.description')}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleImport}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>{t('admin.templates.import')}</span>
            </button>
            
            {/* 创建菜单（支持基于模板创建） */}
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{t('admin.templates.createNew')}</span>
              </button>
              
              {showCreateMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        handleCreateNew();
                        setShowCreateMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900">{t('admin.templates.createFromBlank')}</div>
                      <div className="text-sm text-gray-500">{t('admin.templates.createFromBlankDesc')}</div>
                    </button>
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('admin.templates.createFromTemplate')}</div>
                    
                    {systemTemplates.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {t('admin.templates.noSystemTemplates')}
                      </div>
                    ) : (
                      systemTemplates.map((template) => {
                        const categoryKey = Object.entries(CATEGORY_COLORS).find(([_, color]) => 
                          template.category && CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS]
                        )?.[0] || template.category || '';
                        return (
                          <button
                            key={template.id}
                            onClick={() => {
                              handleCreateFromTemplate(template.id);
                              setShowCreateMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{template.schoolName}</div>
                                <div className="text-sm text-gray-500">{template.description}</div>
                              </div>
                              {template.category && (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[categoryKey] || 'bg-gray-100 text-gray-800'}`}>
                                  {template.category}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 类别筛选按钮 */}
        <div className="mb-6 flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
          {CATEGORY_KEYS.map((categoryKey) => {
            const categoryTranslation = getCategoryTranslation(categoryKey);
            const categoryCount = categoryKey === 'all' 
              ? templates.length 
              : templates.filter(template => {
                  const categoryMap: Record<string, string> = {
                    'international': '国际学校',
                    'hkSecondary': '香港本地中学',
                    'hkPrimary': '香港本地小学',
                    'hkKindergarten': '香港幼稚园',
                    'university': '大学'
                  };
                  return template.category === categoryMap[categoryKey] || template.category === categoryKey;
                }).length;
            
            return (
              <button
                key={categoryKey}
                onClick={() => setSelectedCategory(categoryKey)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === categoryKey
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {categoryTranslation}
                {categoryKey !== 'all' && (
                  <span className="ml-2 text-xs opacity-75">
                    ({categoryCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('admin.templates.loading')}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">
              {selectedCategory === 'all'
                ? t('admin.templates.noTemplates')
                : t('admin.templates.noTemplatesCategory', { category: getCategoryTranslation(selectedCategory) }).replace('{category}', getCategoryTranslation(selectedCategory))}
            </p>
            <button onClick={handleCreateNew} className="btn-primary">
              {t('admin.templates.createFirst')}
            </button>
          </div>
        ) : (
          <>
            {/* 系统预设模板 */}
            {systemTemplates.filter(template => {
              if (selectedCategory === 'all') return true;
              const categoryMap: Record<string, string> = {
                'international': '国际学校',
                'hkSecondary': '香港本地中学',
                'hkPrimary': '香港本地小学',
                'hkKindergarten': '香港幼稚园',
                'university': '大学'
              };
              return template.category === categoryMap[selectedCategory] || template.category === selectedCategory;
            }).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="inline-block w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                  {t('admin.templates.systemTemplates')}
                </h2>
                <div className="grid gap-4">
                  {systemTemplates
                    .filter(template => {
                      if (selectedCategory === 'all') return true;
                      const categoryMap: Record<string, string> = {
                        'international': '国际学校',
                        'hkSecondary': '香港本地中学',
                        'hkPrimary': '香港本地小学',
                        'hkKindergarten': '香港幼稚园',
                        'university': '大学'
                      };
                      return template.category === categoryMap[selectedCategory] || template.category === selectedCategory;
                    })
                    .map((template) => (
                      <TemplateCard 
                        key={template.id}
                        template={template}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onExport={handleExportTemplate}
                        onCreateFrom={handleCreateFromTemplate}
                        isSystem={true}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* 用户创建的模板 */}
            {userTemplates.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="inline-block w-1 h-6 bg-green-600 mr-3 rounded"></span>
                  {t('admin.templates.myTemplates')}
                </h2>
                <div className="grid gap-4">
                  {userTemplates.map((template) => (
                    <TemplateCard 
                      key={template.id}
                      template={template}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onExport={handleExportTemplate}
                      onCreateFrom={handleCreateFromTemplate}
                      isSystem={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <ImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchTemplates();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = getTokenFromCookieHeader(req.headers.cookie);

  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    if (decoded.role !== 'admin') {
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      };
    }
  } catch {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }

  return { props: {} };
};

// Template Card Component
function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onExport,
  onCreateFrom,
  isSystem 
}: { 
  template: SchoolTemplate; 
  onEdit: (id: string) => void; 
  onDelete: (id: string) => void; 
  onExport: (template: SchoolTemplate) => void; 
  onCreateFrom: (id: string) => void;
  isSystem: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const CATEGORY_COLORS: Record<string, string> = {
    'international': 'bg-blue-100 text-blue-800',
    'hkSecondary': 'bg-green-100 text-green-800',
    'hkPrimary': 'bg-yellow-100 text-yellow-800',
    'hkKindergarten': 'bg-pink-100 text-pink-800',
    'university': 'bg-purple-100 text-purple-800'
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    const categoryMap: Record<string, string> = {
      '国际学校': 'international',
      '香港本地中学': 'hkSecondary',
      '香港本地小学': 'hkPrimary',
      '香港幼稚园': 'hkKindergarten',
      '大学': 'university'
    };
    const categoryKey = categoryMap[category] || category;
    return CATEGORY_COLORS[categoryKey] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {template.schoolName}
            </h3>
            {template.category && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm ${
              template.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {template.isActive ? t('admin.templates.status.active') : t('admin.templates.status.inactive')}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{template.program}</p>
          <p className="text-sm text-gray-500 mb-3">{template.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{t('admin.templates.label.templateId')} {template.schoolId}</span>
            <span>•</span>
            <span>{t('admin.templates.label.fieldCount')} {Array.isArray(template.fieldsData) ? template.fieldsData.length : 0}</span>
            <span>•</span>
            <span>{t('admin.templates.label.updatedAt')} {new Date(template.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {isSystem && (
            <button
              onClick={() => onCreateFrom(template.id)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('admin.templates.action.createFrom')}
            >
              <Copy className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => router.push(`/admin/templates/preview/${template.id}`)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title={t('admin.templates.action.preview')}
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(template.id)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title={t('admin.templates.action.edit')}
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => onExport(template)}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title={t('admin.templates.action.export')}
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('admin.templates.action.delete')}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Modal Component
function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file && !jsonText) {
      alert(t('admin.templates.import.errorNoInput'));
      return;
    }

    setImporting(true);

    try {
      let templateData;

      if (file) {
        const text = await file.text();
        templateData = JSON.parse(text);
      } else {
        templateData = JSON.parse(jsonText);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/templates/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        alert(t('admin.templates.import.success'));
        onSuccess();
      } else {
        const error = await response.json();
        const errorMsg = error.error || t('admin.templates.error.unknown');
        alert(t('admin.templates.import.error').replace('{error}', errorMsg));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(t('admin.templates.import.errorFormat'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.templates.import.title')}</h2>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.templates.import.uploadFile')}
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {/* Or Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">{t('admin.templates.import.or')}</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* JSON Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.templates.import.pasteJson')}
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={10}
              className="input-field font-mono text-sm"
              placeholder='{"schoolName": "...", "program": "...", ...}'
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={importing}
            >
              {t('admin.templates.import.cancel')}
            </button>
            <button
              onClick={handleImport}
              className="btn-primary"
              disabled={importing}
            >
              {importing ? t('admin.templates.import.importing') : t('admin.templates.import.import')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

