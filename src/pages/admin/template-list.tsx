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
  AlertTriangle,
  Search as SearchIcon,
  X as XIcon
} from 'lucide-react';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/utils/auth';
import { getTokenFromCookieHeader } from '@/utils/token';
import { useTranslation } from '@/contexts/TranslationContext';
import type { WordPressSchool } from '@/types/wordpress';

interface Script {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileWithTemplate extends WordPressSchool {
  schoolNameDb?: string | null;
  schoolId?: string; // The actual school.id from database
  templateId?: string;
  template?: {
    id: string;
    schoolId: string;
    isActive: boolean;
    fieldsData: any;
    school?: {
      name?: string | null;
      nameShort?: string | null;
      permalink?: string | null;
    } | null;
  } | null;
  hasTemplate: boolean;
  templateStatus: 'pending' | 'created';
  profileType?: string;
  profileTypeSlug?: string | null;
  schoolProfileType?: string | null;
  classificationSource?: 'school_profile_type' | 'taxonomy' | 'post_type';
  unresolvedReason?: string;
  scripts?: Script[];
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
  { key: '内地学校', label: '内地学校' },
  { key: '大学', label: '大学' },
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileWithTemplate[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  
  // Script management states
  const [showCreateScriptModal, setShowCreateScriptModal] = useState(false);
  const [showEditScriptModal, setShowEditScriptModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<ProfileWithTemplate | null>(null);
  const [selectedScripts, setSelectedScripts] = useState<Script[]>([]);
  const [scriptName, setScriptName] = useState('');
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/template-list', {
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

  const performSearch = useCallback(async (term: string) => {
    const normalized = term.trim();
    if (normalized.length < 2) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('未登录，请先登录');
        router.push('/auth/login');
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      const response = await fetch(`/api/admin/templates/search?q=${encodeURIComponent(normalized)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/login');
        return;
      }

      const result = await response.json();

      if (response.ok) {
        setSearchResults(result.results || []);
        setLastSearchQuery(normalized);
      } else {
        setSearchError(result.error || '搜索失败');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching templates:', error);
      setSearchError('搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const term = searchTerm.trim();

    if (term.length < 2) {
      setSearchResults(null);
      setSearchError(null);
      setLastSearchQuery('');
      return;
    }

    const handler = setTimeout(() => {
      performSearch(term);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, performSearch]);

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
      if (!token) {
        alert('未登录，请先登录');
        router.push('/auth/login');
        return;
      }

      console.log('[template-list] Creating template for profile:', {
        profileId: profile.id,
        profileType: profile.type,
        profileTitle: profile.title
      });

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

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[template-list] Failed to parse response:', responseText);
        throw new Error(`服务器返回了无效的响应: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        const templateId = result.template?.id;
        
        if (!templateId) {
          console.error('[template-list] Template created but ID missing:', result);
          alert(`模板创建成功，但未返回模板ID。响应: ${JSON.stringify(result)}`);
          await fetchData();
          return;
        }

        console.log('[template-list] Template created successfully, redirecting to edit page:', templateId);
        // 跳转到模版编辑页面
        router.push(`/admin/templates/edit/${templateId}`);
      } else {
        // Handle error response
        const errorMessage = result.message || result.error || '创建失败';
        const errorCode = result.code || 'UNKNOWN';
        
        console.error('[template-list] Template creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          code: errorCode,
          fullResponse: result
        });

        // Show detailed error message
        let userMessage = errorMessage;
        if (result.code === 'P2002') {
          userMessage = '模板已存在，无法重复创建';
        } else if (response.status === 404) {
          userMessage = '找不到对应的 WordPress 档案';
        } else if (response.status === 403) {
          userMessage = '权限不足，需要管理员权限';
        } else if (response.status === 400) {
          userMessage = `请求错误: ${errorMessage}`;
        }

        alert(`创建失败: ${userMessage}`);
      }
    } catch (error: any) {
      console.error('[template-list] Error creating template:', {
        error: error?.message || error,
        stack: error?.stack,
        profileId: profile.id,
        profileType: profile.type
      });
      
      const errorMessage = error?.message || '网络错误或服务器无响应';
      alert(`创建失败: ${errorMessage}`);
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
      if (!token) {
        alert('未登录，请先登录');
        router.push('/auth/login');
        return;
      }

      console.log('[template-list] Deleting template:', { templateId, schoolName });

      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[template-list] Failed to parse delete response:', responseText);
        throw new Error(`服务器返回了无效的响应: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        console.log('[template-list] Template deleted successfully:', templateId);
        alert('模板删除成功！');
        // Refresh the list to update the UI
        await fetchData();
      } else {
        const errorMessage = result.message || result.error || '删除失败';
        console.error('[template-list] Delete failed:', {
          status: response.status,
          error: errorMessage,
          templateId
        });
        alert(`删除失败: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('[template-list] Error deleting template:', {
        error: error?.message || error,
        templateId,
        schoolName
      });
      alert(`删除失败: ${error?.message || '网络错误或服务器无响应'}`);
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

  // Script management functions
  const openCreateScriptModal = (profile: ProfileWithTemplate) => {
    // Get school ID from profile - need to find the actual school ID
    // The profile.id is wpId, we need to find the school by wpId
    setSelectedSchool(profile);
    setScriptName('');
    setShowCreateScriptModal(true);
  };

  const openEditScriptModal = async (profile: ProfileWithTemplate) => {
    setSelectedSchool(profile);
    const scripts = profile.scripts || [];
    setSelectedScripts(scripts);
    
    if (scripts.length === 0) {
      alert('该学校没有脚本');
      return;
    }
    
    if (scripts.length === 1) {
      setSelectedScriptId(scripts[0].id);
      setScriptName(scripts[0].name);
      setShowEditScriptModal(true);
    } else {
      // Multiple scripts - show selection
      setShowEditScriptModal(true);
      if (scripts.length > 0) {
        setSelectedScriptId(scripts[0].id);
        setScriptName(scripts[0].name);
      }
    }
  };

  const handleCreateScript = async () => {
    if (!selectedSchool || !scriptName.trim()) {
      alert('请输入脚本名称');
      return;
    }

    if (!selectedSchool.schoolId) {
      alert('无法确定学校ID');
      return;
    }

    setScriptLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/scripts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolId: selectedSchool.schoolId,
          name: scriptName.trim()
        })
      });

      if (response.ok) {
        alert('脚本创建成功！');
        setShowCreateScriptModal(false);
        setScriptName('');
        await fetchData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`创建失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Error creating script:', error);
      alert(`创建失败: ${error?.message || '网络错误'}`);
    } finally {
      setScriptLoading(false);
    }
  };

  const handleUpdateScript = async () => {
    if (!selectedScriptId || !scriptName.trim()) {
      alert('请选择脚本并输入名称');
      return;
    }

    setScriptLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/scripts/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedScriptId,
          name: scriptName.trim()
        })
      });

      if (response.ok) {
        alert('脚本更新成功！');
        setShowEditScriptModal(false);
        setScriptName('');
        setSelectedScriptId(null);
        await fetchData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`更新失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Error updating script:', error);
      alert(`更新失败: ${error?.message || '网络错误'}`);
    } finally {
      setScriptLoading(false);
    }
  };

  const handleDeleteScript = async (profile: ProfileWithTemplate) => {
    const scripts = profile.scripts || [];
    
    if (scripts.length === 0) {
      alert('该学校没有脚本');
      return;
    }

    let scriptToDelete: Script;
    
    if (scripts.length === 1) {
      scriptToDelete = scripts[0];
    } else {
      // Multiple scripts - show selection modal
      setSelectedSchool(profile);
      setSelectedScripts(scripts);
      setSelectedScriptId(scripts[0].id);
      // We'll use a simple prompt for now, but could enhance with a modal
      const scriptList = scripts.map((s, idx) => `${idx + 1}. ${s.name} (ID: ${s.id})`).join('\n');
      const choice = prompt(`该学校有 ${scripts.length} 个脚本：\n${scriptList}\n\n请输入要删除的脚本编号 (1-${scripts.length}):`);
      if (!choice) return;
      
      const scriptIndex = parseInt(choice) - 1;
      if (isNaN(scriptIndex) || scriptIndex < 0 || scriptIndex >= scripts.length) {
        alert('无效的脚本编号');
        return;
      }
      
      scriptToDelete = scripts[scriptIndex];
    }

    if (!confirm(`确定要删除脚本"${scriptToDelete.name}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/scripts/${scriptToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('脚本删除成功！');
        await fetchData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`删除失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Error deleting script:', error);
      alert(`删除失败: ${error?.message || '网络错误'}`);
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

  const filterProfilesByStatus = useCallback((profiles: ProfileWithTemplate[]) => {
    if (filterStatus === 'all') return profiles;
    return profiles.filter((profile) =>
      filterStatus === 'created' ? profile.templateStatus === 'created' : profile.templateStatus === 'pending'
    );
  }, [filterStatus]);

  // Filter profiles based on filterStatus
  const allProfiles = data?.profiles[activeTab] || [];
  const currentProfiles = filterProfilesByStatus(allProfiles);
  const filteredSearchResults = searchResults ? filterProfilesByStatus(searchResults) : null;
  const hasActiveSearch = searchTerm.trim().length >= 2;
  const tableProfiles = hasActiveSearch ? (filteredSearchResults || []) : currentProfiles;
  const isTableLoading = hasActiveSearch ? searchLoading : loading;
  const isTableEmpty = !isTableLoading && tableProfiles.length === 0;

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
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
            {PROFILE_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setActiveTab(type.key)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0
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

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索学校名称 / 英文名 / 简称（至少输入 2 个字符）"
              className="w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="清除搜索"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
            {searchLoading && hasActiveSearch && (
              <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary-500" />
            )}
          </div>
          <div className="text-sm text-gray-500">
            {hasActiveSearch
              ? searchLoading
                ? `正在搜索 “${searchTerm.trim()}”...`
                : `找到 ${tableProfiles.length} 条与 “${lastSearchQuery || searchTerm.trim()}” 匹配的结果`
              : '输入至少 2 个字符开始搜索，清空输入恢复原列表'}
          </div>
        </div>
        {searchError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {searchError}
          </div>
        )}

        {/* Table */}
        {isTableLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">{hasActiveSearch ? '搜索中...' : '加载中...'}</p>
          </div>
        ) : isTableEmpty ? (
          hasActiveSearch ? (
            <div className="card text-center py-12">
              <p className="text-gray-600">没有找到与 “{lastSearchQuery || searchTerm.trim()}” 匹配的学校</p>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600">当前分类下没有学校</p>
            </div>
          )
        ) : (
          <>
            {!hasActiveSearch && activeTab === 'unresolved_raw' && (
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
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学校中文名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学校名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      简称
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学校类别
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      模版状态
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      模版操作
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      脚本操作
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      模版 ID
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      字段数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableProfiles.map((profile) => {
                    const template = profile.template;
                    const fieldCount = template?.fieldsData ? getFieldCount(template.fieldsData) : 0;
                    const permalink = profile.permalink || template?.school?.permalink || null;
                    const displaySchoolName = profile.schoolNameDb || template?.school?.name || profile.title;
                    
                    return (
                      <tr key={`${profile.type}-${profile.id}`} className="hover:bg-gray-50">
                        <td className="px-4 py-4 align-top whitespace-normal break-words max-w-xs">
                          {permalink ? (
                            <a
                              href={permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                            >
                              {displaySchoolName}
                            </a>
                          ) : (
                            <span className="text-gray-900 font-medium text-sm">{displaySchoolName}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top whitespace-normal break-words max-w-xs">
                          <div className="text-sm font-medium text-gray-900">{profile.title}</div>
                        </td>
                        <td className="px-4 py-4 align-top whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {template?.school?.nameShort || profile.nameShort || profile.acf?.name_short || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
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
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
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
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            {profile.hasTemplate && template ? (
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
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            {(!profile.scripts || profile.scripts.length === 0) ? (
                              <button
                                onClick={() => openCreateScriptModal(profile)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-[goldenrod] hover:bg-[#daa520] disabled:opacity-50 disabled:cursor-not-allowed"
                                title="创建脚本"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                创建脚本
                              </button>
                            ) : (
                              <>
                                <span className="text-xs text-gray-500 mr-1" title={`脚本(${profile.scripts.length})`}>
                                  ({profile.scripts.length})
                                </span>
                                <button
                                  onClick={() => openCreateScriptModal(profile)}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="再创建"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openEditScriptModal(profile)}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="编辑"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteScript(profile)}
                                  className="text-red-600 hover:text-red-900"
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-500 font-mono">
                            {template?.schoolId || profile.templateId || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center min-w-[80px]">
                          <div className="text-sm text-gray-500">
                            {fieldCount > 0 ? fieldCount : '-'}
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

        {/* Create Script Modal */}
        {showCreateScriptModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">创建脚本</h2>
                  <button
                    onClick={() => {
                      setShowCreateScriptModal(false);
                      setScriptName('');
                      setSelectedSchool(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="关闭"
                    aria-label="关闭"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedSchool.title}</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    脚本名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                    placeholder="请输入脚本名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateScriptModal(false);
                    setScriptName('');
                    setSelectedSchool(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateScript}
                  disabled={scriptLoading || !scriptName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scriptLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Script Modal */}
        {showEditScriptModal && selectedSchool && selectedScripts.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">编辑脚本</h2>
                  <button
                    onClick={() => {
                      setShowEditScriptModal(false);
                      setScriptName('');
                      setSelectedScriptId(null);
                      setSelectedSchool(null);
                      setSelectedScripts([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="关闭"
                    aria-label="关闭"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedSchool.title}</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                {selectedScripts.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择脚本
                    </label>
                    <select
                      value={selectedScriptId || ''}
                      onChange={(e) => {
                        const scriptId = parseInt(e.target.value);
                        setSelectedScriptId(scriptId);
                        const script = selectedScripts.find(s => s.id === scriptId);
                        setScriptName(script?.name || '');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="选择脚本"
                    >
                      {selectedScripts.map((script) => (
                        <option key={script.id} value={script.id}>
                          {script.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    脚本名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                    placeholder="请输入脚本名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus={selectedScripts.length === 1}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditScriptModal(false);
                    setScriptName('');
                    setSelectedScriptId(null);
                    setSelectedSchool(null);
                    setSelectedScripts([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateScript}
                  disabled={scriptLoading || !scriptName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scriptLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    '更新'
                  )}
                </button>
              </div>
            </div>
          </div>
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

