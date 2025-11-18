import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { TranslationData } from '@/lib/translations';

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTranslations, setSavingTranslations] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [translationsData, setTranslationsData] = useState<TranslationData>({});

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

  // Fetch translations data
  useEffect(() => {
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/translations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTranslationsData(data.translations || {});
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
  };

  const handleTranslationChange = (
    key: string,
    language: 'en' | 'zh-CN' | 'zh-TW',
    value: string
  ) => {
    setTranslationsData((prev) => {
      const updated = {
        ...prev,
        [key]: {
          ...(prev[key] || { en: '', 'zh-CN': '', 'zh-TW': '' }),
          [language]: value,
        },
      };
      return updated;
    });
  };

  const handleSaveTranslations = async () => {
    setSavingTranslations(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations: translationsData }),
      });

      if (response.ok) {
        alert('翻译保存成功！');
        // Refresh translations to get updated data
        await fetchTranslations();
      } else {
        const error = await response.json();
        alert(`保存失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingTranslations(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
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
        router.push('/admin/templates');
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

        {/* Translation Keys Management */}
        {template?.fieldsData && Array.isArray(template.fieldsData) && template.fieldsData.length > 0 && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">字段标签翻译管理</h2>
                <p className="text-sm text-gray-600 mt-1">
                  管理模板字段标签的多语言翻译。可以直接编辑并保存翻译。
                </p>
              </div>
              <button
                onClick={handleSaveTranslations}
                disabled={savingTranslations}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>{savingTranslations ? '保存中...' : '保存翻译'}</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Simplified Chinese
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Traditional Chinese
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      English
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getAllFieldLabels(template.fieldsData).map((labelKey) => {
                    const translation = translationsData[labelKey] || {
                      en: '',
                      'zh-CN': '',
                      'zh-TW': '',
                    };
                    const isEmpty = !translation.en && !translation['zh-CN'] && !translation['zh-TW'];
                    
                    return (
                      <tr key={labelKey} className={`hover:bg-gray-50 ${isEmpty ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4">
                          <code className="text-sm font-mono text-gray-900">{labelKey}</code>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={translation['zh-CN'] || ''}
                            onChange={(e) => handleTranslationChange(labelKey, 'zh-CN', e.target.value)}
                            placeholder="简体中文翻译"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                              isEmpty ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={translation['zh-TW'] || ''}
                            onChange={(e) => handleTranslationChange(labelKey, 'zh-TW', e.target.value)}
                            placeholder="繁體中文翻譯"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                              isEmpty ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={translation.en || ''}
                            onChange={(e) => handleTranslationChange(labelKey, 'en', e.target.value)}
                            placeholder="English translation"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                              isEmpty ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

// Helper function to extract all field label keys from fields
function getAllFieldLabels(fields: any[]): string[] {
  const keys = new Set<string>();
  
  const processField = (field: any) => {
    if (field.id) {
      // Generate translation key from field label
      // Format: template.field.{fieldId}
      const key = `template.field.${field.id}`;
      keys.add(key);
    }
    
    // Process nested fields in sections
    if (field.fields && Array.isArray(field.fields)) {
      field.fields.forEach(processField);
    }
  };
  
  fields.forEach(processField);
  
  return Array.from(keys).sort();
}

