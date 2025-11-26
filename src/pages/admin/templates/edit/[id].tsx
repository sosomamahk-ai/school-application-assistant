import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);

  const fetchTemplate = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
      } else {
        alert('模板加载失败');
        router.push('/admin/templates');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('模板加载失败');
      router.push('/admin/templates');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchTemplate]);

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      // First update application dates if changed
      if (template.applicationStartDate !== undefined || template.applicationEndDate !== undefined) {
        const dateResponse = await fetch(`/api/admin/templates/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            applicationStartDate: template.applicationStartDate,
            applicationEndDate: template.applicationEndDate
          })
        });

        if (!dateResponse.ok) {
          const error = await dateResponse.json();
          alert(`更新日期失败: ${error.error || '未知错误'}`);
          return;
        }
      }

      // Then update template data via import endpoint
      const response = await fetch('/api/admin/templates/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        alert('模板更新成功！');
        router.push('/admin/template-list');
      } else {
        const error = await response.json();
        alert(`更新失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!template) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">模板未找到</p>
          <Link href="/admin/templates" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            返回模板列表
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>编辑模板 - {template.schoolName}</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/admin/templates" className="text-primary-600 hover:text-primary-700 flex items-center mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回模板列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">编辑模板：{template.schoolName}</h1>
          <p className="text-gray-600 mt-2">修改学校信息和表单字段配置</p>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申请开始日期
              </label>
              <input
                type="date"
                value={template.applicationStartDate ? new Date(template.applicationStartDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setTemplate({
                    ...template,
                    applicationStartDate: e.target.value ? new Date(e.target.value).toISOString() : null
                  });
                }}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申请结束日期
              </label>
              <input
                type="date"
                value={template.applicationEndDate ? new Date(template.applicationEndDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setTemplate({
                    ...template,
                    applicationEndDate: e.target.value ? new Date(e.target.value).toISOString() : null
                  });
                }}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">JSON 编辑器</h2>
          <p className="text-sm text-gray-600 mb-4">
            您可以直接编辑 JSON 配置。建议先导出备份，再进行修改。
          </p>
          <textarea
            value={JSON.stringify(template, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setTemplate(parsed);
              } catch (error) {
                // 忽略解析错误，继续编辑
              }
            }}
            className="input-field font-mono text-sm"
            rows={30}
            spellCheck={false}
          />
        </div>

        <div className="flex justify-between items-center">
          <Link href="/admin/templates" className="btn-secondary">
            取消
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? '保存中...' : '保存更改'}</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}

