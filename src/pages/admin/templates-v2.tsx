import { useState, useEffect, useCallback } from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Plus, 
  Loader2, 
  ToggleLeft, 
  ToggleRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/utils/auth';
import { getTokenFromCookieHeader } from '@/utils/token';
import { useTranslation } from '@/contexts/TranslationContext';
import type { WordPressSchool } from '@/types/wordpress';

interface ProfileWithTemplate extends WordPressSchool {
  templateId?: string;
  template?: {
    id: string;
    schoolId: string;
    isActive: boolean;
    fieldsData: any;
    school?: {
      nameShort?: string | null;
      permalink?: string | null;
    } | null;
  } | null;
  hasTemplate: boolean;
  templateStatus: 'pending' | 'created';
  profileType?: string;
  profileTypeSlug?: string | null;
  schoolProfileType?: string | null;
  unresolvedReason?: string;
}

interface GroupedProfiles {
  [key: string]: ProfileWithTemplate[];
}

interface TemplatesPageData {
  profiles: GroupedProfiles;
  stats: {
    total: number;
    withTemplate: number;
    withoutTemplate: number;
    byType: Record<string, number>;
    unresolved?: number;
  };
}

const PROFILE_TYPES: Array<{ key: string; label: string; isWarning?: boolean }> = [
  { key: '国际学校', label: '国际学校' },
  { key: '本地中学', label: '本地中学' },
  { key: '本地小学', label: '本地小学' },
  { key: '幼稚园', label: '幼稚园' },
  { key: 'unresolved_raw', label: '未分类 (需检查)', isWarning: true }
];

export default function TemplatesManagementV2() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<TemplatesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('国际学校');
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'created' | 'pending'>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/templates-v2', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        router.push('/auth/login');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch profiles:', response.status, errorData);
        alert(errorData.error || '加载数据失败');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      alert('加载数据失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleActive = async (templateId: string, currentStatus: boolean) => {
    if (updating.has(templateId)) return;

    setUpdating(prev => new Set(prev).add(templateId));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '更新失败');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      alert('更新失败，请重试');
    } finally {
      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
    }
  };

  const handleCreateTemplate = async (profile: ProfileWithTemplate) => {
    const profileKey = `${profile.type}-${profile.id}`;
    if (creating.has(profileKey)) return;

    setCreating(prev => new Set(prev).add(profileKey));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/templates/create-from-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileId: profile.id,
          profileType: profile.type
        })
      });

      if (response.ok) {
        const result = await response.json();
        const templateId = result.template?.id;
        
        if (templateId) {
          // 跳转到模版编辑页面
          router.push(`/admin/templates/edit/${templateId}`);
        } else {
          alert('模板创建成功！');
          await fetchData();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '创建失败');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('创建失败，请重试');
    } finally {
      setCreating(prev => {
        const next = new Set(prev);
        next.delete(profileKey);
        return next;
      });
    }
  };

  const handleDelete = async (templateId: string, schoolName: string) => {
    if (!confirm(`确定要删除"${schoolName}"的模板吗？此操作不可恢复。`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('模板删除成功！');
        await fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('删除失败，请重试');
    }
  };

  const handlePreview = (templateId: string) => {
    router.push(`/admin/templates/preview/${templateId}`);
  };

  const handleEdit = (templateId: string) => {
    router.push(`/admin/templates/edit/${templateId}`);
  };

  const handleExport = async (templateId: string, schoolName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const templates = result.templates || [];
        const template = templates.find((t: any) => t.id === templateId);
        
        if (template) {
          const dataStr = JSON.stringify(template, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${schoolName}-template.json`;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          alert('未找到模板数据');
        }
      } else {
        alert('导出失败');
      }
    } catch (error) {
      console.error('Error exporting template:', error);
      alert('导出失败，请重试');
    }
  };

  const getFieldCount = (fieldsData: any): number => {
    if (!fieldsData) return 0;
    if (Array.isArray(fieldsData)) {
      return fieldsData.length;
    }
    if (typeof fieldsData === 'object') {
      // Count fields recursively
      let count = 0;
      const countFields = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => {
            if (item && typeof item === 'object') {
              if ('id' in item && item.id) count++;
              if ('fields' in item && item.fields) countFields(item.fields);
            }
          });
        } else if (obj && typeof obj === 'object') {
          Object.values(obj).forEach(value => {
            if (Array.isArray(value)) {
              countFields(value);
            } else if (value && typeof value === 'object') {
              if ('id' in value && value.id) count++;
              if ('fields' in value && value.fields) countFields(value.fields);
            }
          });
        }
      };
      countFields(fieldsData);
      return count;
    }
    return 0;
  };

  // Filter profiles based on filterStatus
  const allProfiles = data?.profiles[activeTab] || [];
  const currentProfiles = filterStatus === 'all' 
    ? allProfiles
    : filterStatus === 'created'
    ? allProfiles.filter(p => p.templateStatus === 'created')
    : allProfiles.filter(p => p.templateStatus === 'pending');

  return (
    <Layout>
      <Head>
        <title>模版列表</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">模版列表</h1>
          <p className="text-gray-600 mt-2">基于 WordPress 学校档案的模板管理</p>
        </div>

        {/* Stats */}
        {data?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              className={`card cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'all' ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setFilterStatus('all')}
            >
              <div className="text-sm text-gray-600">总学校数</div>
              <div className="text-2xl font-bold text-gray-900">{data.stats.total}</div>
            </div>
            <div 
              className={`card cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'created' ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => setFilterStatus('created')}
            >
              <div className="text-sm text-gray-600">已创建模板</div>
              <div className="text-2xl font-bold text-green-600">{data.stats.withTemplate}</div>
            </div>
            <div 
              className={`card cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'pending' ? 'ring-2 ring-orange-500' : ''
              }`}
              onClick={() => setFilterStatus('pending')}
            >
              <div className="text-sm text-gray-600">待创建模板</div>
              <div className="text-2xl font-bold text-orange-600">{data.stats.withoutTemplate}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {PROFILE_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setActiveTab(type.key)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === type.key
                    ? type.isWarning 
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {type.isWarning && <AlertTriangle className="inline h-4 w-4 mr-1" />}
                {type.label}
                {data?.stats.byType[type.key] && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    type.isWarning ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'
                  }`}>
                    {data.stats.byType[type.key]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : currentProfiles.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">当前分类下没有学校</p>
          </div>
        ) : (
          <>
            {activeTab === 'unresolved_raw' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">
                      无法从 WordPress 获取 profile_type
                    </h3>
                    <p className="text-sm text-yellow-700">
                      这些学校无法从 WordPress REST API 获取 profile_type taxonomy 数据。
                      请检查 WordPress 端的以下设置：
                    </p>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                      <li>确保 <code className="bg-yellow-100 px-1 rounded">profile_type</code> taxonomy 的 <code className="bg-yellow-100 px-1 rounded">show_in_rest</code> 设置为 <code className="bg-yellow-100 px-1 rounded">true</code></li>
                      <li>确保 post type <code className="bg-yellow-100 px-1 rounded">school_profile</code> 的 <code className="bg-yellow-100 px-1 rounded">show_in_rest</code> 设置为 <code className="bg-yellow-100 px-1 rounded">true</code></li>
                      <li>检查 post 的 <code className="bg-yellow-100 px-1 rounded">post_status</code> 是否为 <code className="bg-yellow-100 px-1 rounded">publish</code></li>
                      <li>确认 REST API 权限允许访问这些数据</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学校名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      简称 (name_short)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学校类别
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      模版 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      字段数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      模版状态
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProfiles.map((profile) => {
                    const template = profile.template;
                    const fieldCount = template?.fieldsData ? getFieldCount(template.fieldsData) : 0;
                    
                    return (
                      <tr key={`${profile.type}-${profile.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{profile.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {template?.school?.nameShort || profile.nameShort || profile.acf?.name_short || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {profile.profileType === 'unresolved_raw' ? (
                            <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              未分类
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {profile.profileType || profile.category || activeTab}
                            </span>
                          )}
                          {profile.schoolProfileType && (
                            <div className="text-xs text-gray-500 mt-1">
                              school_profile_type: {profile.schoolProfileType}
                            </div>
                          )}
                          {profile.unresolvedReason && (
                            <div className="text-xs text-gray-500 mt-1">
                              原因: {profile.unresolvedReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 font-mono">
                            {template?.schoolId || profile.templateId || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {fieldCount > 0 ? fieldCount : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {profile.templateStatus === 'created' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已创建
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              待创建
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {profile.templateStatus === 'created' && template ? (
                              <>
                                {/* Toggle Active */}
                                <button
                                  onClick={() => handleToggleActive(template.id, template.isActive)}
                                  disabled={updating.has(template.id)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title={template.isActive ? '禁用' : '启用'}
                                >
                                  {updating.has(template.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : template.isActive ? (
                                    <ToggleRight className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>

                                {/* Preview */}
                                <button
                                  onClick={() => handlePreview(template.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="预览"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => handleEdit(template.id)}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="编辑"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>

                                {/* Export */}
                                <button
                                  onClick={() => handleExport(template.id, profile.title)}
                                  className="text-green-600 hover:text-green-900"
                                  title="导出为 JSON"
                                >
                                  <Download className="h-4 w-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(template.id, profile.title)}
                                  className="text-red-600 hover:text-red-900"
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleCreateTemplate(profile)}
                                disabled={creating.has(`${profile.type}-${profile.id}`)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="基于此模版创建"
                              >
                                {creating.has(`${profile.type}-${profile.id}`) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    创建中
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    创建模板
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
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

