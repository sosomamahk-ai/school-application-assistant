import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useTranslation } from '@/contexts/TranslationContext';
import { Bot, Plus, CheckCircle, XCircle, Loader2, FileCode } from 'lucide-react';

interface Template {
  id: string;
  schoolId: string;
  schoolName: string | Record<string, string>;
  program: string;
}

interface Script {
  id: string;
  schoolId: string;
  name: string;
  applyUrl: string;
  supportsLogin: boolean;
  description: string;
  filePath: string;
  isRegistered: boolean;
}

export default function AdminAutoApplyScriptsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [applyUrl, setApplyUrl] = useState('');
  const [supportsLogin, setSupportsLogin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    // 检查用户角色
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          console.warn('当前用户不是管理员，无法访问此页面');
          setError('需要管理员权限才能访问此页面');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    fetchTemplates();
    fetchScripts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auto-apply-scripts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScripts(data.scripts || []);
      }
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScript = async () => {
    if (!selectedTemplate || !applyUrl.trim()) {
      setError('请选择学校并填写申请URL');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      setError('找不到选中的模板');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/auto-apply-scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          schoolId: template.schoolId,
          schoolName: typeof template.schoolName === 'string' 
            ? template.schoolName 
            : template.schoolName?.['zh-CN'] || template.schoolName?.['en'] || 'School',
          applyUrl: applyUrl.trim(),
          supportsLogin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建脚本失败');
      }

      setSuccess(`脚本创建成功！文件位置：${data.filePath}`);
      setShowCreateModal(false);
      setSelectedTemplate('');
      setApplyUrl('');
      setSupportsLogin(false);
      fetchScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建脚本失败');
    } finally {
      setCreating(false);
    }
  };

  const getSchoolName = (template: Template): string => {
    if (typeof template.schoolName === 'string') {
      return template.schoolName;
    }
    return template.schoolName?.['zh-CN'] || template.schoolName?.['en'] || template.schoolId;
  };

  return (
    <>
      <Head>
        <title>自动申请脚本管理 - {t('common.appName')}</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">自动申请脚本管理</h1>
              <p className="text-gray-500 mt-1">
                为学校创建和管理自动申请脚本，无需手动编写代码
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              创建新脚本
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {success}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : scripts.length === 0 ? (
              <div className="text-center py-16">
                <Bot className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有创建任何脚本</h3>
                <p className="text-gray-500 mb-6">点击"创建新脚本"按钮开始创建</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  创建第一个脚本
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">学校</th>
                      <th className="px-4 py-3 text-left">学校ID</th>
                      <th className="px-4 py-3 text-left">申请URL</th>
                      <th className="px-4 py-3 text-left">需要登录</th>
                      <th className="px-4 py-3 text-left">注册状态</th>
                      <th className="px-4 py-3 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {scripts.map((script) => (
                      <tr key={script.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold text-gray-900">{script.name}</td>
                        <td className="px-4 py-4 text-gray-600 font-mono text-xs">{script.schoolId}</td>
                        <td className="px-4 py-4 text-gray-600">
                          <a
                            href={script.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            {script.applyUrl}
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          {script.supportsLogin ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">是</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">否</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {script.isRegistered ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              已注册
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">未注册</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            className="text-primary-600 hover:text-primary-700 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(script.filePath);
                              alert('文件路径已复制到剪贴板');
                            }}
                          >
                            查看文件
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 创建脚本模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">创建自动申请脚本</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null);
                    setSelectedTemplate('');
                    setApplyUrl('');
                    setSupportsLogin(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择学校 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">请选择学校...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {getSchoolName(template)} - {template.program} ({template.schoolId})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    选择要创建自动申请脚本的学校
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    申请页面URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    placeholder="https://school.edu/apply"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    学校的在线申请表单页面地址
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supportsLogin}
                      onChange={(e) => setSupportsLogin(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      申请前需要登录
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    如果学校的申请页面需要先登录才能访问，请勾选此项
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 提示</h3>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>系统会自动生成脚本文件并注册到系统中</li>
                    <li>脚本会自动匹配表单字段，无需手动配置</li>
                    <li>如果字段匹配失败，可以稍后手动编辑脚本文件</li>
                    <li>创建后可以在"可申请学校"页面测试自动申请功能</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null);
                    setSelectedTemplate('');
                    setApplyUrl('');
                    setSupportsLogin(false);
                  }}
                  className="btn-secondary"
                  disabled={creating}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateScript}
                  disabled={creating || !selectedTemplate || !applyUrl.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <FileCode className="h-4 w-4" />
                      创建脚本
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

