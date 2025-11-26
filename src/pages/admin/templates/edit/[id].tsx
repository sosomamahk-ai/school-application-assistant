import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { getSchoolCategory, validateTemplateDates, type SchoolCategory } from '@/utils/templateDates';

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [schoolCategory, setSchoolCategory] = useState<SchoolCategory>('other');
  const [loadingSchool, setLoadingSchool] = useState(false);

  const fetchSchoolCategory = useCallback(async (schoolId: string) => {
    setLoadingSchool(true);
    try {
      const token = localStorage.getItem('token');
      // Try to get school from database via template relation
      const templateResponse = await fetch(`/api/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        const template = templateData.template;
        
        // Determine category from template category
        const categoryFromTemplate = template?.category || '';
        if (categoryFromTemplate.includes('大学') || categoryFromTemplate.includes('university')) {
          setSchoolCategory('university');
        } else if (categoryFromTemplate.includes('本地中学') || categoryFromTemplate.includes('local-secondary')) {
          setSchoolCategory('local-secondary');
        } else if (categoryFromTemplate.includes('本地小学') || categoryFromTemplate.includes('local-primary')) {
          setSchoolCategory('local-primary');
        } else {
          setSchoolCategory('other');
        }
      } else {
        setSchoolCategory('other');
      }
    } catch (error) {
      console.error('Error fetching school category:', error);
      setSchoolCategory('other');
    } finally {
      setLoadingSchool(false);
    }
  }, [id]);

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
        
        // Fetch school profileType to determine category
        if (data.template?.schoolId) {
          fetchSchoolCategory(data.template.schoolId);
        }
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
  }, [id, router, fetchSchoolCategory]);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id, fetchTemplate]);

  const handleSave = async () => {
    if (!template) return;

    // Validate date fields
    const dateValidationError = validateTemplateDates(
      template,
      schoolCategory,
      template.isApplicationOpenAllYear || false
    );
    if (dateValidationError) {
      alert(dateValidationError);
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      // Clean up template data: convert empty strings to null for date fields
      const cleanTemplate = {
        ...template,
        // Convert empty date strings to null
        applicationStartDate: template.applicationStartDate || null,
        applicationEndDate: template.applicationEndDate || null,
        earlyStartDate: template.earlyStartDate || null,
        earlyEndDate: template.earlyEndDate || null,
        regularStartDate: template.regularStartDate || null,
        regularEndDate: template.regularEndDate || null,
        springStartDate: template.springStartDate || null,
        springEndDate: template.springEndDate || null,
        fallStartDate: template.fallStartDate || null,
        fallEndDate: template.fallEndDate || null,
        centralStartDate: template.centralStartDate || null,
        centralEndDate: template.centralEndDate || null
      };
      
      // Update template data via import endpoint (handles all fields including dates)
      const response = await fetch('/api/admin/templates/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanTemplate)
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

        {/* Application Period Configuration */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">申请时间配置</h2>
          
          {/* Open All Year Checkbox */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isApplicationOpenAllYear"
                checked={template.isApplicationOpenAllYear || false}
                onChange={(e) => {
                  const isOpen = e.target.checked;
                  setTemplate({
                    ...template,
                    isApplicationOpenAllYear: isOpen,
                    // Clear all dates when checked
                    ...(isOpen ? {
                      applicationStartDate: null,
                      applicationEndDate: null,
                      earlyStartDate: null,
                      earlyEndDate: null,
                      regularStartDate: null,
                      regularEndDate: null,
                      springStartDate: null,
                      springEndDate: null,
                      fallStartDate: null,
                      fallEndDate: null,
                      centralStartDate: null,
                      centralEndDate: null,
                    } : {})
                  });
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isApplicationOpenAllYear" className="ml-2 block text-sm font-medium text-gray-700">
                全年可申请 (Open All Year)
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              勾选后将隐藏所有日期字段，表示该学校全年接受申请
            </p>
          </div>

          {/* Date Fields - Only show if not "Open All Year" */}
          {!template.isApplicationOpenAllYear && (
            <div className="space-y-6">
              {/* University Dates */}
              {schoolCategory === 'university' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">大学申请时间</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Early Decision (提前录取)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            开始日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.earlyStartDate ? new Date(template.earlyStartDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, earlyStartDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            结束日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.earlyEndDate ? new Date(template.earlyEndDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, earlyEndDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Regular Decision (常规录取)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            开始日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.regularStartDate ? new Date(template.regularStartDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, regularStartDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            结束日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.regularEndDate ? new Date(template.regularEndDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, regularEndDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Local Primary/Secondary School Dates */}
              {(schoolCategory === 'local-primary' || schoolCategory === 'local-secondary') && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    {schoolCategory === 'local-secondary' ? '本地中学' : '本地小学'}申请时间
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Spring Transfer (春季转学)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            开始日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.springStartDate ? new Date(template.springStartDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, springStartDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            结束日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.springEndDate ? new Date(template.springEndDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, springEndDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Fall Transfer (秋季转学)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            开始日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.fallStartDate ? new Date(template.fallStartDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, fallStartDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            结束日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.fallEndDate ? new Date(template.fallEndDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, fallEndDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Central Allocation (中央派位)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            开始日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.centralStartDate ? new Date(template.centralStartDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, centralStartDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            结束日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={template.centralEndDate ? new Date(template.centralEndDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setTemplate({ ...template, centralEndDate: e.target.value || null })}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Dates (for International Schools and others) */}
              {schoolCategory === 'other' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">申请时间</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        申请开始日期 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={template.applicationStartDate ? new Date(template.applicationStartDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setTemplate({ ...template, applicationStartDate: e.target.value || null })}
                        className="input-field"
                        required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                        申请结束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={template.applicationEndDate ? new Date(template.applicationEndDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setTemplate({ ...template, applicationEndDate: e.target.value || null })}
                className="input-field"
                        required
              />
            </div>
          </div>
                </div>
              )}

              {loadingSchool && (
                <div className="text-sm text-gray-500">
                  正在加载学校类别信息...
                </div>
              )}
            </div>
          )}
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

