import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save, Download, Loader2, Bot } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { getLocalizedSchoolName, LocalizedText } from '@/utils/i18n';
import ApplicationForm, {
  ApplicationFormState,
  ApplicationField,
  ApplicationTab
} from '@/components/ApplicationForm';
import AIGuidancePanel from '@/components/AIGuidancePanel';
import type { FormField } from '@/types';
import type { StructuredFormData, TemplateNode } from '@/utils/templates';
import { TEMPLATE_CHILD_COLLECTION_KEYS } from '@/utils/templates';

interface ApiApplication {
  id: string;
  template: {
    id: string;
    schoolId: string;
    schoolName: string | LocalizedText;
    program: string;
    description?: string;
    fields: FormField[];
  };
  formData: StructuredFormData;
  status: string;
}

type StructuredFormDataState = StructuredFormData | Record<string, any>;
const FALLBACK_TAB_TITLE = '申请内容';
type TemplateFieldOption = { label?: unknown; value?: unknown } | string;

const fieldHasValue = (field: ApplicationField): boolean => {
  if (field.type === 'checkbox') {
    return Boolean(field.value);
  }
  return field.value !== undefined && field.value !== null && field.value !== '';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatFieldValue = (field: ApplicationField): string => {
  if (!fieldHasValue(field)) {
    return '（未填写）';
  }

  if (field.type === 'checkbox') {
    return field.value ? '是' : '否';
  }

  return String(field.value ?? '');
};

const buildPrintableHtml = ({
  schoolName,
  programName,
  completion,
  tabs
}: {
  schoolName: string;
  programName?: string;
  completion: number;
  tabs: ApplicationTab[];
}) => {
  const generatedAt = new Date().toLocaleString('zh-CN');
  const tabSections = tabs
    .map((tab) => {
      const rows = tab.fields
        .map(
          (field) => `
            <tr>
              <td>${escapeHtml(field.label)}</td>
              <td>${escapeHtml(formatFieldValue(field))}</td>
            </tr>
          `
        )
        .join('');

      return `
        <section class="tab-section">
          <h2>${escapeHtml(tab.title)}</h2>
          <table>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </section>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(schoolName)} - 申请导出</title>
      <style>
        body {
          font-family: "Noto Sans SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 24px;
          background: #f8fafc;
          color: #0f172a;
        }
        .container {
          max-width: 960px;
          margin: 0 auto;
          background: #ffffff;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
        }
        header {
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 24px;
          padding-bottom: 16px;
        }
        header h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }
        .meta {
          font-size: 14px;
          color: #475569;
        }
        .progress-bar {
          margin-top: 16px;
          background: #e2e8f0;
          border-radius: 999px;
          height: 10px;
          overflow: hidden;
        }
        .progress-bar span {
          display: block;
          height: 100%;
          background: #0ea5e9;
          width: ${completion}%;
        }
        .tab-section {
          margin-bottom: 32px;
        }
        .tab-section h2 {
          font-size: 20px;
          margin-bottom: 12px;
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
        }
        td {
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          vertical-align: top;
        }
        td:first-child {
          width: 35%;
          font-weight: 600;
          background: #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${escapeHtml(schoolName)}</h1>
          <div class="meta">
            ${programName ? `<div>项目：${escapeHtml(programName)}</div>` : ''}
            <div>导出时间：${escapeHtml(generatedAt)}</div>
            <div>完成进度：${completion}%</div>
          </div>
          <div class="progress-bar"><span></span></div>
        </header>
        ${tabSections}
      </div>
    </body>
  </html>`;
};

function normalizeFieldOptions(options?: unknown): ApplicationField['options'] {
  if (!Array.isArray(options)) {
    return undefined;
  }

  return options
    .map((entry) => {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        return trimmed ? { label: trimmed, value: trimmed } : null;
      }

      if (entry && typeof entry === 'object') {
        const option = entry as Exclude<TemplateFieldOption, string>;
        const rawLabel = typeof option.label === 'string' ? option.label.trim() : '';
        const rawValue = typeof option.value === 'string' ? option.value.trim() : '';
        const label = rawLabel || rawValue;
        const value = rawValue || rawLabel;
        if (!label && !value) {
          return null;
        }
        return {
          label: label || value,
          value: value || label
        };
      }

      return null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

function getChildNodes(node?: TemplateNode): TemplateNode[] {
  if (!node) {
    return [];
  }
  const children: TemplateNode[] = [];
  TEMPLATE_CHILD_COLLECTION_KEYS.forEach((key) => {
    const value = node[key];
    if (Array.isArray(value)) {
      children.push(...value);
    }
  });
  return children;
}

function mapFieldType(nodeType?: string): ApplicationField['type'] {
  switch (nodeType) {
    case 'textarea':
    case 'essay':
      return 'textarea';
    case 'select':
      return 'select';
    case 'checkbox':
      return 'checkbox';
    case 'date':
      return 'date';
    case 'number':
      return 'number';
    case 'text':
    default:
      return 'text';
  }
}

function collectLeafFields(
  node: TemplateNode,
  values: StructuredFormDataState,
  accumulator: ApplicationField[]
): void {
  const children = getChildNodes(node);
  if (children.length === 0 && node.id) {
    const { required, helpText, placeholder, aiFillRule, options } = node as TemplateNode & {
      required?: boolean;
      helpText?: unknown;
      placeholder?: unknown;
      aiFillRule?: unknown;
      options?: unknown;
    };

    accumulator.push({
      id: node.id,
      label: node.label || node.id,
      type: mapFieldType(node.type),
      value: values[node.id] ?? '',
      required: Boolean(required),
      helpText: typeof helpText === 'string' ? helpText : undefined,
      placeholder: typeof placeholder === 'string' ? placeholder : undefined,
      aiFillRule: typeof aiFillRule === 'string' ? aiFillRule : undefined,
      options: normalizeFieldOptions(options)
    });
    return;
  }

  children.forEach((child) => collectLeafFields(child, values, accumulator));
}

function buildTabsFromStructure(
  structureInput: TemplateNode[] | TemplateNode | undefined,
  values: StructuredFormDataState,
  fallbackFields?: FormField[]
): ApplicationTab[] {
  const structureArray: TemplateNode[] = Array.isArray(structureInput)
    ? structureInput
    : structureInput
      ? [structureInput]
      : [];

  const resolvedTabs: TemplateNode[] = [];

  structureArray.forEach((node) => {
    if (node.tabs && Array.isArray(node.tabs) && node.tabs.length > 0) {
      resolvedTabs.push(...node.tabs);
    } else {
      resolvedTabs.push(node);
    }
  });

  const tabs: ApplicationTab[] = resolvedTabs
    .map((node, index) => {
      const fields: ApplicationField[] = [];
      collectLeafFields(node, values, fields);
      return {
        id: node.id || `tab-${index + 1}`,
        title: node.label || `Tab ${index + 1}`,
        fields
      };
    })
    .filter((tab) => tab.fields.length > 0);

  if (tabs.length === 0 && fallbackFields && fallbackFields.length > 0) {
    return [
      {
        id: 'tab-default',
        title: FALLBACK_TAB_TITLE,
        fields: fallbackFields.map<ApplicationField>((field) => ({
          id: field.id,
          label: field.label,
          type: mapFieldType(field.type),
          value: values[field.id] ?? '',
          required: field.required,
          helpText: field.helpText,
          placeholder: field.placeholder,
          options: field.options?.map((option) => ({ label: option, value: option })),
          aiFillRule: field.aiFillRule
        }))
      }
    ];
  }

  return tabs;
}

export default function ApplicationPage() {
  const router = useRouter();
  const { applicationId } = router.query;
  const { language } = useTranslation();

  const [application, setApplication] = useState<ApiApplication | null>(null);
  const [formData, setFormData] = useState<StructuredFormDataState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [exportScope, setExportScope] = useState<'all' | 'filled'>('all');
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [autoApplying, setAutoApplying] = useState(false);
  const [autoApplyError, setAutoApplyError] = useState<string | null>(null);
  const [autoApplyMessage, setAutoApplyMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!applicationId || typeof applicationId !== 'string') {
      return;
    }

    let cancelled = false;

    const fetchApplication = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const [, payload] = token.split('.');
        if (payload) {
          const decoded = JSON.parse(atob(payload));
          if (decoded?.userId) {
            setCurrentUserId(decoded.userId);
          }
        }
      } catch (err) {
        console.warn('Failed to decode token payload', err);
      }

      setLoading(true);

      try {
      const response = await fetch(`/api/applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` }
      });

        if (!response.ok) {
          throw new Error('Failed to fetch application');
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        setApplication(data.application);
        setFormData(data.application.formData || {});
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
        if (!cancelled) {
      setLoading(false);
    }
      }
    };

    fetchApplication();

    return () => {
      cancelled = true;
    };
  }, [applicationId, router]);

  const handleApplicationChange = (nextApplication: ApplicationFormState) => {
    setFormData((previous) => {
      const base: StructuredFormDataState =
        previous && typeof previous === 'object' ? { ...previous } : {};
      nextApplication.tabs.forEach((tab) => {
        tab.fields.forEach((field) => {
          base[field.id] = field.value ?? '';
        });
      });
      base.__structure = previous?.__structure;
      return base;
    });
  };

  const formTabs = useMemo<ApplicationTab[]>(() => {
    if (!application) {
      return [];
    }
    const structure = formData.__structure as TemplateNode[] | TemplateNode | undefined;
    return buildTabsFromStructure(structure, formData, application.template.fields);
  }, [application, formData]);

  useEffect(() => {
    if (formTabs.length === 0) {
      setActiveFieldId(null);
      return;
    }

    if (activeFieldId) {
      const exists = formTabs.some((tab) => tab.fields.some((field) => field.id === activeFieldId));
      if (exists) {
        return;
      }
    }

    const firstField = formTabs[0]?.fields[0];
    setActiveFieldId(firstField ? firstField.id : null);
  }, [formTabs, activeFieldId]);

  const activeField = useMemo<ApplicationField | null>(() => {
    if (!activeFieldId) {
      return null;
    }
    for (const tab of formTabs) {
      const found = tab.fields.find((field) => field.id === activeFieldId);
      if (found) {
        return found;
      }
    }
    return null;
  }, [formTabs, activeFieldId]);

  const templateFieldMap = useMemo(() => {
    const map = new Map<string, FormField>();
    application?.template.fields.forEach((field) => {
      map.set(field.id, field);
    });
    return map;
  }, [application]);

  const activeGuidanceField = useMemo<FormField | null>(() => {
    if (!activeField) {
      return null;
    }
    if (templateFieldMap.has(activeField.id)) {
      return templateFieldMap.get(activeField.id)!;
    }

    const normalizedType: FormField['type'] =
      activeField.type === 'textarea'
        ? 'textarea'
        : activeField.type === 'select'
          ? 'select'
          : activeField.type === 'date'
            ? 'date'
            : 'text';

    return {
      id: activeField.id,
      label: activeField.label,
      type: normalizedType,
      required: Boolean(activeField.required),
      placeholder: activeField.placeholder,
      helpText: activeField.helpText,
      aiFillRule: activeField.aiFillRule,
      options: activeField.options?.map((option) => option.label)
    };
  }, [activeField, templateFieldMap]);

  const handleGuidanceSuggestion = useCallback(
    (value: string) => {
      if (!activeField) {
        return;
      }
      setFormData((previous) => {
        const next: StructuredFormDataState =
          previous && typeof previous === 'object' ? { ...previous } : {};
        next[activeField.id] = value;
        return next;
      });
    },
    [activeField]
  );

  const syncApplicationData = useCallback(
    async (dataToSync: StructuredFormDataState) => {
      if (!application?.template?.schoolId || !currentUserId) {
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      try {
        const response = await fetch('/api/applicationData/save', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            schoolId: application.template.schoolId,
            userId: currentUserId,
            data: dataToSync
          })
        });
        if (!response.ok) {
          console.warn('Failed to sync application data', await response.text());
        }
      } catch (error) {
        console.error('Error syncing application data:', error);
      }
    },
    [application?.template?.schoolId, currentUserId]
  );

  const formState = useMemo<ApplicationFormState | null>(() => {
    if (!application) {
      return null;
    }
    return {
      id: application.id,
      name: getLocalizedSchoolName(application.template.schoolName, language),
      tabs: formTabs
    };
  }, [application, formTabs, language]);

  const completion = useMemo(() => {
    if (formTabs.length === 0) {
      return 0;
    }

    const allFields = formTabs.flatMap((tab) => tab.fields);
    if (allFields.length === 0) {
      return 0;
    }

    const filled = allFields.filter((field) => {
      if (field.type === 'checkbox') {
        return Boolean(field.value);
      }
      return field.value !== undefined && field.value !== null && field.value !== '';
    }).length;

    return Math.round((filled / allFields.length) * 100);
  }, [formTabs]);

  const handleSave = async () => {
    if (!applicationId || typeof applicationId !== 'string') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData,
          status: application?.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save application');
      }

      await syncApplicationData(formData);
      setSaveNotification({ type: 'success', message: '进度已成功保存。' });
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => setSaveNotification(null), 3000);
    } catch (error) {
      console.error('Error saving application:', error);
      setSaveNotification({ type: 'error', message: '保存失败，请稍后重试。' });
      alert('保存失败，请稍后再试。');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!formState) {
      return;
    }

    const tabsToExport =
      exportScope === 'filled'
        ? formState.tabs.filter((tab) => tab.fields.some((field) => fieldHasValue(field)))
        : formState.tabs;

    if (tabsToExport.length === 0) {
      alert('当前没有可导出的页面内容，请先填写或取消筛选条件。');
      return;
    }

    const schoolName = formState.name;
    const programName = application?.template.program;
    const html = buildPrintableHtml({
      schoolName,
      programName,
      completion,
      tabs: tabsToExport
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateLabel = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `${schoolName}-申请-${exportScope === 'filled' ? '仅有内容' : '全部'}-${dateLabel}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check if form has any filled fields
  const hasFilledFields = useMemo(() => {
    if (formTabs.length === 0) {
      return false;
    }
    const allFields = formTabs.flatMap((tab) => tab.fields);
    return allFields.some((field) => fieldHasValue(field));
  }, [formTabs]);

  const canAutoApply = hasFilledFields && application?.status !== 'submitted';

  const handleAutoApply = async () => {
    if (!application || !canAutoApply) {
      return;
    }

    setAutoApplyError(null);
    setAutoApplyMessage(null);
    setAutoApplying(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const res = await fetch('/api/auto-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          schoolId: application.template.schoolId,
          templateId: application.template.id,
          applicationId: application.id
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || '自动申请失败');
      }

      setAutoApplyMessage(data.message || '自动申请流程已完成，请查看最新状态。');
      
      // Refresh application data
      const response = await fetch(`/api/applications/${application.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const appData = await response.json();
        setApplication(appData.application);
        setFormData(appData.application.formData || {});
      }
    } catch (err) {
      console.error(err);
      setAutoApplyError(err instanceof Error ? err.message : '自动申请失败，请稍后再试');
    } finally {
      setAutoApplying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!application || !formState) {
    return (
      <Layout>
        <div className="py-12 text-center text-gray-600">无法加载申请内容。</div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>
          {getLocalizedSchoolName(application.template.schoolName, language)} Application - School Application Assistant
        </title>
      </Head>

      <Layout>
        <div className="space-y-6">
          {saveNotification && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                saveNotification.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {saveNotification.message}
            </div>
          )}
          {autoApplyError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {autoApplyError}
            </div>
          )}
          {autoApplyMessage && !autoApplyError && (
            <div className="rounded-2xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
              {autoApplyMessage}
            </div>
          )}
          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{formState.name}</h1>
              <p className="text-gray-600">{application.template.program}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>完成进度</span>
                  <span>{completion}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-primary-600 transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
              <div className="flex flex-col text-sm text-gray-600">
                <label htmlFor="exportScope" className="mb-1">
                  导出范围
                </label>
                <select
                  id="exportScope"
                  value={exportScope}
                  onChange={(event) => setExportScope(event.currentTarget.value as 'all' | 'filled')}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="all">全部页面</option>
                  <option value="filled">仅导出有内容的页面</option>
                </select>
              </div>
              {canAutoApply && (
                <button
                  type="button"
                  onClick={handleAutoApply}
                  disabled={autoApplying}
                  className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {autoApplying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>自动申请中...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-5 w-5" />
                      <span>自动申请</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>导出申请</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>保存进度</span>
              </button>
            </div>
          </div>

          {formTabs.length > 0 ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <div className="min-w-0">
                  <ApplicationForm
                    application={formState}
                    onApplicationChange={handleApplicationChange}
                    onFieldFocus={(field) => setActiveFieldId(field.id)}
                  />
                </div>
                <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
                  {activeGuidanceField ? (
                    <AIGuidancePanel
                      field={activeGuidanceField}
                      currentValue={
                        activeField && typeof activeField.value === 'string' ? activeField.value : undefined
                      }
                      onSuggestionAccept={handleGuidanceSuggestion}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
                      选择任意字段以查看 AI 填写指导。
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-600 shadow-sm">
              当前申请没有可填写的字段。
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
