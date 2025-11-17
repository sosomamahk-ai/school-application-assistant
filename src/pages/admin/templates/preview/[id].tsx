import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PreviewTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
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
  }, [id, fetchTemplate]);

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
        <title>预览模板 - {template.schoolName}</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/admin/templates" className="text-primary-600 hover:text-primary-700 flex items-center mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回模板列表
          </Link>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              📋 这是模板预览页面。下面显示的是用户填写申请表时会看到的表单。
            </p>
          </div>
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.schoolName}</h1>
            <p className="text-xl text-gray-600 mb-4">{template.program}</p>
            {template.description && (
              <p className="text-gray-600 mb-6">{template.description}</p>
            )}
          </div>
        </div>

        {/* Form Preview */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">申请表单预览</h2>
          <div className="space-y-6">
            {renderFields(template.fieldsData)}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function renderFields(fields: any[]) {
  if (!fields || !Array.isArray(fields)) {
    return <p className="text-gray-500">此模板没有配置字段</p>;
  }

  return fields.map((field: any, index: number) => {
    if (field.type === 'section') {
      return (
        <div key={index} className="border-l-4 border-primary-500 pl-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{field.label}</h3>
          {field.fields && Array.isArray(field.fields) && (
            <div className="space-y-4">
              {field.fields.map((subField: any, subIndex: number) => (
                <div key={subIndex}>
                  {renderField(subField)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <div key={index}>{renderField(field)}</div>;
  });
}

function renderField(field: any) {
  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const helpText = field.helpText && (
    <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
  );

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'date':
    case 'number':
      return (
        <div>
          {label}
          <input
            type={field.type}
            className="input-field"
            placeholder={`输入${field.label}`}
            disabled
          />
          {helpText}
          {field.aiFillRule && (
            <p className="text-xs text-blue-600 mt-1">
              🤖 自动填充规则: {field.aiFillRule}
            </p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            className="input-field"
            rows={field.maxLength ? Math.min(Math.ceil(field.maxLength / 80), 10) : 4}
            placeholder={`输入${field.label}`}
            disabled
          />
          {field.maxLength && (
            <p className="text-sm text-gray-500 mt-1">
              最多 {field.maxLength} 字
            </p>
          )}
          {helpText}
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select className="input-field" disabled>
            <option>请选择</option>
            {field.options && field.options.map((option: string, i: number) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
          {helpText}
        </div>
      );

    default:
      return (
        <div>
          {label}
          <p className="text-gray-500 text-sm">未知字段类型: {field.type}</p>
        </div>
      );
  }
}

