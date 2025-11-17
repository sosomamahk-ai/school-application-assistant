import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { Plus, Upload, Download, Edit, Trash2, Eye, Copy, Filter } from 'lucide-react';

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

// 5个类别
const CATEGORIES = [
  '全部',
  '国际学校',
  '香港本地中学',
  '香港本地小学',
  '香港幼稚园',
  '大学'
];

// 类别颜色
const CATEGORY_COLORS: Record<string, string> = {
  '国际学校': 'bg-blue-100 text-blue-800',
  '香港本地中学': 'bg-green-100 text-green-800',
  '香港本地小学': 'bg-yellow-100 text-yellow-800',
  '香港幼稚园': 'bg-pink-100 text-pink-800',
  '大学': 'bg-purple-100 text-purple-800'
};

export default function TemplatesAdmin() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SchoolTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
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
        alert(`加载模板失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('加载模板时发生错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

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
    if (!confirm('确定要删除此模板吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('删除成功');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('删除失败');
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

  // 筛选模板
  const filteredTemplates = selectedCategory === '全部' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // 获取系统预设模板（用于"基于模板创建"）- 包括所有以 template- 开头的模板
  const systemTemplates = templates.filter(t => {
    const isSystem = t.schoolId && t.schoolId.startsWith('template-');
    if (isSystem) {
      console.log('Found system template:', t.schoolId, t.schoolName);
    }
    return isSystem;
  });
  
  // 获取用户创建的模板
  const userTemplates = filteredTemplates.filter(t => !t.schoolId || !t.schoolId.startsWith('template-'));

  return (
    <Layout>
      <Head>
        <title>学校模板管理 - 管理后台</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">学校申请模板管理</h1>
            <p className="text-gray-600 mt-2">创建、编辑和管理学校申请表单模板</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleImport}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>导入模板</span>
            </button>
            
            {/* 创建菜单（支持基于模板创建） */}
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>创建新模板</span>
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
                      <div className="font-medium text-gray-900">从空白创建</div>
                      <div className="text-sm text-gray-500">创建一个全新的模板</div>
                    </button>
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">基于类别模板创建</div>
                    
                    {systemTemplates.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        暂无系统模板，请先在数据库中导入主模板
                      </div>
                    ) : (
                      systemTemplates.map((template) => (
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
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category]}`}>
                                {template.category}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
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
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {category}
              {category !== '全部' && (
                <span className="ml-2 text-xs opacity-75">
                  ({templates.filter(t => t.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">
              {selectedCategory === '全部' 
                ? '还没有任何学校模板' 
                : `还没有"${selectedCategory}"类别的模板`}
            </p>
            <button onClick={handleCreateNew} className="btn-primary">
              创建第一个模板
            </button>
          </div>
        ) : (
          <>
            {/* 系统预设模板 */}
            {systemTemplates.filter(t => selectedCategory === '全部' || t.category === selectedCategory).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="inline-block w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                  系统预设模板
                </h2>
                <div className="grid gap-4">
                  {systemTemplates
                    .filter(t => selectedCategory === '全部' || t.category === selectedCategory)
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
                  我的模板
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

  const CATEGORY_COLORS: Record<string, string> = {
    '国际学校': 'bg-blue-100 text-blue-800',
    '香港本地中学': 'bg-green-100 text-green-800',
    '香港本地小学': 'bg-yellow-100 text-yellow-800',
    '香港幼稚园': 'bg-pink-100 text-pink-800',
    '大学': 'bg-purple-100 text-purple-800'
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[template.category]}`}>
                {template.category}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm ${
              template.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {template.isActive ? '已启用' : '已禁用'}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{template.program}</p>
          <p className="text-sm text-gray-500 mb-3">{template.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>模板ID: {template.schoolId}</span>
            <span>•</span>
            <span>字段数: {Array.isArray(template.fieldsData) ? template.fieldsData.length : 0}</span>
            <span>•</span>
            <span>更新于: {new Date(template.updatedAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {isSystem && (
            <button
              onClick={() => onCreateFrom(template.id)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="基于此模板创建"
            >
              <Copy className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => router.push(`/admin/templates/preview/${template.id}`)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="预览"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(template.id)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => onExport(template)}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="导出为JSON"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
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
      alert('请选择文件或输入 JSON');
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
        alert('导入成功！');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`导入失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('导入失败：JSON 格式错误');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">导入学校模板</h2>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上传 JSON 文件
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
            <span className="px-4 text-gray-500 text-sm">或者</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* JSON Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粘贴 JSON 内容
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
              取消
            </button>
            <button
              onClick={handleImport}
              className="btn-primary"
              disabled={importing}
            >
              {importing ? '导入中...' : '导入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

