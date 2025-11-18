import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/TranslationContext';
import type { TranslationData } from '@/lib/translations';

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
  maxLength?: number;
  options?: string[];
  aiFillRule?: string;
  fields?: Field[];
}

// 5个类别
const CATEGORIES = [
  '国际学校',
  '香港本地中学',
  '香港本地小学',
  '香港幼稚园',
  '大学'
];

export default function NewTemplate() {
  const router = useRouter();
  const { baseTemplate } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translationsData, setTranslationsData] = useState<TranslationData>({});
  const [template, setTemplate] = useState({
    schoolId: '',
    schoolName: '',
    program: '',
    description: '',
    category: '国际学校',
    isActive: true,
  });
  const [fields, setFields] = useState<Field[]>([]);

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

  // 如果有 baseTemplate 参数，加载该模板数据
  useEffect(() => {
    if (baseTemplate) {
      loadBaseTemplate(baseTemplate as string);
    }
  }, [baseTemplate]);

  const loadBaseTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const baseData = data.template;
        
        // 复制模板数据，但清空 schoolId 和修改名称
        setTemplate({
          schoolId: '',
          schoolName: `${baseData.schoolName} - 副本`,
          program: baseData.program,
          description: baseData.description,
          category: baseData.category || '国际学校',
          isActive: true
        });
        
        setFields(baseData.fieldsData || []);
      }
    } catch (error) {
      console.error('Error loading base template:', error);
      alert('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 验证必填字段
    if (!template.schoolId || !template.schoolName || !template.program) {
      alert('请填写必填字段：学校ID、学校名称、项目名称');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/templates/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...template,
          fieldsData: fields
        })
      });

      if (response.ok) {
        alert('模板创建成功！');
        router.push('/admin/templates');
      } else {
        const error = await response.json();
        alert(`创建失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('创建失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const newField: Field = {
      id: `field_${Date.now()}`,
      label: '新字段',
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const addSection = () => {
    const newSection: Field = {
      id: `section_${Date.now()}`,
      label: '新分组',
      type: 'section',
      required: false,
      fields: []
    };
    setFields([...fields, newSection]);
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addSubField = (sectionIndex: number) => {
    const newFields = [...fields];
    const section = newFields[sectionIndex];
    if (section.type === 'section') {
      if (!section.fields) section.fields = [];
      section.fields.push({
        id: `field_${Date.now()}`,
        label: '新字段',
        type: 'text',
        required: false,
      });
      setFields(newFields);
    }
  };

  const updateSubField = (sectionIndex: number, fieldIndex: number, updates: Partial<Field>) => {
    const newFields = [...fields];
    const section = newFields[sectionIndex];
    if (section.type === 'section' && section.fields) {
      section.fields[fieldIndex] = { ...section.fields[fieldIndex], ...updates };
      setFields(newFields);
    }
  };

  const deleteSubField = (sectionIndex: number, fieldIndex: number) => {
    const newFields = [...fields];
    const section = newFields[sectionIndex];
    if (section.type === 'section' && section.fields) {
      section.fields = section.fields.filter((_, i) => i !== fieldIndex);
      setFields(newFields);
    }
  };

  return (
    <Layout>
      <Head>
        <title>创建新模板 - 管理后台</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/templates" className="text-primary-600 hover:text-primary-700 flex items-center mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回模板列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">创建新学校模板</h1>
          <p className="text-gray-600 mt-2">填写学校信息并配置申请表单字段</p>
        </div>

        {/* Basic Info */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学校ID（英文，唯一标识）<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={template.schoolId}
                onChange={(e) => setTemplate({ ...template, schoolId: e.target.value })}
                className="input-field"
                placeholder="例如：tsinghua-university-2024"
              />
              <p className="text-sm text-gray-500 mt-1">只能使用小写字母、数字和连字符</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学校名称<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={template.schoolName}
                onChange={(e) => setTemplate({ ...template, schoolName: e.target.value })}
                className="input-field"
                placeholder="例如：清华大学"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目名称<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={template.program}
                onChange={(e) => setTemplate({ ...template, program: e.target.value })}
                className="input-field"
                placeholder="例如：2024年本科招生"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="简短描述这个申请表单"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板类别<span className="text-red-500">*</span>
              </label>
              <select
                value={template.category}
                onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {baseTemplate ? '基于类别模板创建，可以修改为其他类别' : '选择学校申请的类别'}
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={template.isActive}
                onChange={(e) => setTemplate({ ...template, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                启用此模板
              </label>
            </div>
          </div>
        </div>

        {/* Translation Keys Management */}
        {fields.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">字段标签翻译管理</h2>
            <p className="text-sm text-gray-600 mb-4">
              管理模板字段标签的多语言翻译。Key 列显示翻译键字符串。
            </p>
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
                  {getAllFieldLabels(fields).map((labelKey) => {
                    const translation = translationsData[labelKey] || {
                      en: '',
                      'zh-CN': '',
                      'zh-TW': '',
                    };
                    
                    return (
                      <tr key={labelKey} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <code className="text-sm font-mono text-gray-900">{labelKey}</code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {translation['zh-CN'] || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {translation['zh-TW'] || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {translation.en || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fields Configuration */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">表单字段配置</h2>
            <div className="flex space-x-2">
              <button onClick={addSection} className="btn-secondary text-sm flex items-center space-x-1">
                <Plus className="h-4 w-4" />
                <span>添加分组</span>
              </button>
              <button onClick={addField} className="btn-primary text-sm flex items-center space-x-1">
                <Plus className="h-4 w-4" />
                <span>添加字段</span>
              </button>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">还没有添加任何字段</p>
              <div className="flex justify-center space-x-3">
                <button onClick={addSection} className="btn-secondary">
                  添加分组
                </button>
                <button onClick={addField} className="btn-primary">
                  添加字段
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(updates) => updateField(index, updates)}
                  onDelete={() => deleteField(index)}
                  onAddSubField={() => addSubField(index)}
                  onUpdateSubField={(fieldIndex, updates) => updateSubField(index, fieldIndex, updates)}
                  onDeleteSubField={(fieldIndex) => deleteSubField(index, fieldIndex)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
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
            <span>{saving ? '保存中...' : '保存模板'}</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}

// Field Editor Component
function FieldEditor({
  field,
  onUpdate,
  onDelete,
  onAddSubField,
  onUpdateSubField,
  onDeleteSubField,
}: {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
  onAddSubField?: () => void;
  onUpdateSubField?: (index: number, updates: Partial<Field>) => void;
  onDeleteSubField?: (index: number) => void;
}) {
  const fieldTypes = [
    { value: 'text', label: '单行文本' },
    { value: 'textarea', label: '多行文本' },
    { value: 'email', label: '邮箱' },
    { value: 'tel', label: '电话' },
    { value: 'date', label: '日期' },
    { value: 'select', label: '下拉选择' },
    { value: 'number', label: '数字' },
    { value: 'section', label: '分组' },
  ];

  return (
    <div className={`border rounded-lg p-4 ${field.type === 'section' ? 'border-primary-300 bg-primary-50' : 'border-gray-300'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-gray-900">
          {field.type === 'section' ? '📁 分组' : '📝 字段'}
        </h3>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
          title="删除"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            字段ID
          </label>
          <input
            type="text"
            value={field.id}
            onChange={(e) => onUpdate({ id: e.target.value })}
            className="input-field text-sm"
            placeholder="field_id"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            显示名称
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="input-field text-sm"
            placeholder="字段名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            类型
          </label>
          <select
            value={field.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="input-field text-sm"
          >
            {fieldTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">必填</label>
        </div>
      </div>

      {field.type === 'textarea' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大长度
          </label>
          <input
            type="number"
            value={field.maxLength || ''}
            onChange={(e) => onUpdate({ maxLength: parseInt(e.target.value) || undefined })}
            className="input-field text-sm"
            placeholder="例如：800"
          />
        </div>
      )}

      {field.type === 'select' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选项（每行一个）
          </label>
          <textarea
            value={field.options?.join('\n') || ''}
            onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(Boolean) })}
            className="input-field text-sm"
            rows={3}
            placeholder="选项1&#10;选项2&#10;选项3"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          帮助文本
        </label>
        <input
          type="text"
          value={field.helpText || ''}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          className="input-field text-sm"
          placeholder="给用户的提示信息"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          自动填充规则（可选）
        </label>
        <input
          type="text"
          value={field.aiFillRule || ''}
          onChange={(e) => onUpdate({ aiFillRule: e.target.value })}
          className="input-field text-sm"
          placeholder="例如：basicInfo.fullName"
        />
        <p className="text-xs text-gray-500 mt-1">
          常用规则：basicInfo.fullName, basicInfo.email, education[0].school
        </p>
      </div>

      {/* Sub-fields for sections */}
      {field.type === 'section' && (
        <div className="mt-4 pl-4 border-l-2 border-primary-300">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-700">分组内的字段</h4>
            <button
              onClick={onAddSubField}
              className="text-xs btn-primary flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>添加字段</span>
            </button>
          </div>
          {field.fields && field.fields.length > 0 ? (
            <div className="space-y-3">
              {field.fields.map((subField, index) => (
                <FieldEditor
                  key={subField.id}
                  field={subField}
                  onUpdate={(updates) => onUpdateSubField?.(index, updates)}
                  onDelete={() => onDeleteSubField?.(index)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">此分组还没有字段</p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to extract all field label keys from fields
function getAllFieldLabels(fields: Field[]): string[] {
  const keys = new Set<string>();
  
  const processField = (field: Field) => {
    if (field.label) {
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

