import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save } from 'lucide-react';
import { FormField } from '@/types';
import { useTranslation } from '@/contexts/TranslationContext';
import FormFieldInput from '@/components/FormFieldInput';
import { MASTER_TEMPLATE_DATA } from '@/data/master-template';

interface TemplateSection {
  id: string;
  label: string;
  type: string;
  fields: FormField[];
}

type RawTemplateOption = string | { label?: unknown; value?: unknown };

type RawTemplateField = {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  aiFillRule?: string;
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  options?: RawTemplateOption[];
};

type RawTemplateSection = {
  id: string;
  label?: string;
  type?: string;
  fields?: RawTemplateField[];
};

const normalizeOptions = (options?: RawTemplateOption[]): string[] | undefined => {
  if (!Array.isArray(options)) {
    return undefined;
  }

  const normalized = options
    .map((option) => {
      if (typeof option === 'string') {
        const trimmed = option.trim();
        return trimmed || null;
      }
      if (option && typeof option === 'object') {
        const label = typeof option.label === 'string' ? option.label.trim() : '';
        const value = typeof option.value === 'string' ? option.value.trim() : '';
        return label || value || null;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeField = (field: RawTemplateField): FormField => ({
  id: field.id,
  label: field.label,
  type: (field.type as FormField['type']) || 'text',
  required: Boolean(field.required),
  aiFillRule: typeof field.aiFillRule === 'string' ? field.aiFillRule : undefined,
  placeholder: typeof field.placeholder === 'string' ? field.placeholder : undefined,
  helpText: typeof field.helpText === 'string' ? field.helpText : undefined,
  maxLength: typeof field.maxLength === 'number' ? field.maxLength : undefined,
  options: normalizeOptions(field.options)
});

const MASTER_PROFILE_SECTIONS: TemplateSection[] = (MASTER_TEMPLATE_DATA.fieldsData as ReadonlyArray<RawTemplateSection>)
  .filter((section) => section.type === 'section' && Array.isArray(section.fields))
  .map((section) => ({
    id: section.id,
    label: section.label ?? section.id,
    type: section.type || 'section',
    fields: (section.fields ?? []).map((field) => normalizeField(field))
  }));

export default function Profile() {
  const router = useRouter();
  const { t, language, translations } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: any }>({});
  const sections = MASTER_PROFILE_SECTIONS;
  const [activeTab, setActiveTab] = useState<string>(() => sections[0]?.id ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        
        // Initialize field values from profile data
        const values: { [key: string]: any } = {};
        
        // Map existing profile fields to field values
        if (data.profile.fullName) values.fullName = data.profile.fullName;
        if (data.profile.phone) values.phone = data.profile.phone;
        if (data.profile.birthday) {
          values.birthday = new Date(data.profile.birthday).toISOString().split('T')[0];
        }
        if (data.profile.nationality) values.nationality = data.profile.nationality;
        
        // Map additional data if it exists
        if (data.profile.additional && typeof data.profile.additional === 'object') {
          Object.assign(values, data.profile.additional);
        }
        
        setFieldValues(values);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [router, fetchProfile]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare profile data with template field values
      const profileData: any = {
        fullName: fieldValues.fullName || profile?.fullName,
        phone: fieldValues.phone || profile?.phone,
        birthday: fieldValues.birthday || profile?.birthday,
        nationality: fieldValues.nationality || profile?.nationality,
        education: profile?.education,
        experiences: profile?.experiences,
        essays: profile?.essays,
        additional: {}
      };
      
      // Store all template field values in additionalData
      sections.forEach(section => {
        section.fields.forEach(field => {
          if (fieldValues[field.id] !== undefined) {
            profileData.additional[field.id] = fieldValues[field.id];
          }
        });
      });
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        alert(t('profile.saveSuccess'));
        // Update local profile state
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  const activeSection = sections.find(s => s.id === activeTab);

  return (
    <>
      <Head>
        <title>{t('profile.title')} - {t('common.appName')}</title>
      </Head>

      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
              <p className="text-gray-600 mt-2">{t('profile.manageInfo')}</p>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? t('common.saving') : t('profile.saveChanges')}</span>
            </button>
          </div>

          {/* Tabs and Content */}
          {sections.length > 0 ? (
            <div className="card">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                  {sections.map((section) => {
                    // Get label in current language
                    let displayLabel = section.label;
                    
                    // Check if label contains slash separator (e.g., "基本信息/basic information")
                    if (section.label.includes('/')) {
                      const parts = section.label.split('/').map(s => s.trim());
                      if (parts.length >= 2) {
                        // First part is usually Chinese, second part is English
                        const chinesePart = parts[0];
                        const englishPart = parts[1];
                        
                        // Determine which part to show based on current language
                        if (language === 'zh-CN' || language === 'zh-TW') {
                          displayLabel = chinesePart;
                        } else {
                          displayLabel = englishPart;
                        }
                      }
                    } else {
                      // Try to get translation if translation key exists
                      const possibleKey = `profile.section.${section.id}`;
                      if (translations[possibleKey]) {
                        displayLabel = translations[possibleKey][language] || translations[possibleKey].en || section.label;
                      }
                    }
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                          ${
                            activeTab === section.id
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              {activeSection && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {activeSection.fields.map((field) => (
                      <div
                        key={field.id}
                        className={
                          field.type === 'textarea' || field.type === 'essay'
                            ? 'md:col-span-2'
                            : ''
                        }
                      >
                        <FormFieldInput
                          field={field}
                          value={fieldValues[field.id] ?? ''}
                          onChange={(value) => updateFieldValue(field.id, value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <p className="text-gray-600">
                {t('profile.noTemplateFields') || 'Template fields are being loaded. Please refresh the page if this message persists.'}
              </p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
