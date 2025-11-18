import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save, Send, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { getLocalizedSchoolName, LocalizedText } from '@/utils/i18n';
import ApplicationForm, {
  ApplicationFormState,
  ApplicationField,
  ApplicationTab
} from '@/components/ApplicationForm';
import type { FormField } from '@/types';
import type { StructuredFormData, TemplateNode } from '@/utils/templates';
import { TEMPLATE_CHILD_COLLECTION_KEYS } from '@/utils/templates';

interface ApiApplication {
  id: string;
  template: {
    id: string;
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
    accumulator.push({
      id: node.id,
      label: node.label || node.id,
      type: mapFieldType(node.type),
      value: values[node.id] ?? ''
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
          value: values[field.id] ?? ''
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

  const handleSave = async (nextStatus?: 'submitted') => {
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
          status: nextStatus ?? application?.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save application');
      }

      if (nextStatus === 'submitted') {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving application:', error);
      alert('保存失败，请稍后再试。');
    } finally {
      setSaving(false);
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
          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{formState.name}</h1>
              <p className="text-gray-600">{application.template.program}</p>
              <p className="mt-2 text-sm text-gray-500">完成进度：{completion}%</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>保存进度</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave('submitted')}
                disabled={saving || completion < 100}
                className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                <span>提交申请</span>
              </button>
            </div>
          </div>

          {formTabs.length > 0 ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <ApplicationForm
                application={formState}
                onApplicationChange={handleApplicationChange}
              />
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
