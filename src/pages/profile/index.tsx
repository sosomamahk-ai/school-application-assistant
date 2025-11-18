import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save } from 'lucide-react';
import { FormField } from '@/types';
import { useTranslation } from '@/contexts/TranslationContext';
import FormFieldInput from '@/components/FormFieldInput';

interface TemplateSection {
  id: string;
  label: string;
  type: string;
  fields: FormField[];
}

export default function Profile() {
  const router = useRouter();
  const { t, language, translations } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: any }>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMainTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/templates?schoolId=template-master-all-fields');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.template && Array.isArray(data.template.fields)) {
          // Parse sections from fieldsData
          const parsedSections: TemplateSection[] = data.template.fields
            .filter((item: any) => item.type === 'section' && Array.isArray(item.fields))
            .map((item: any) => ({
              id: item.id,
              label: item.label,
              type: item.type,
              fields: item.fields || []
            }));
          
          setSections(parsedSections);
          
          // Set first tab as active
          setActiveTab(prev => prev || (parsedSections.length > 0 ? parsedSections[0].id : ''));
        }
      } else {
        // Fallback: try to find any template starting with "template-"
        const allTemplatesResponse = await fetch('/api/templates');
        if (allTemplatesResponse.ok) {
          const allData = await allTemplatesResponse.json();
          if (allData.success && Array.isArray(allData.templates)) {
            const mainTemplate = allData.templates.find((t: any) => 
              t.schoolId && t.schoolId.startsWith('template-')
            );
            if (mainTemplate && Array.isArray(mainTemplate.fields)) {
              const parsedSections: TemplateSection[] = mainTemplate.fields
                .filter((item: any) => item.type === 'section' && Array.isArray(item.fields))
                .map((item: any) => ({
                  id: item.id,
                  label: item.label,
                  type: item.type,
                  fields: item.fields || []
                }));
              
              setSections(parsedSections);
              
              setActiveTab(prev => prev || (parsedSections.length > 0 ? parsedSections[0].id : ''));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching main template:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchMainTemplate();
    fetchProfile();
  }, [router, fetchMainTemplate]);

  const fetchProfile = async () => {
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
  };

  // Initialize field values when sections are loaded
  useEffect(() => {
    if (sections.length > 0 && profile) {
      setFieldValues(prevValues => {
        const values = { ...prevValues };
        let updated = false;
        
        // Initialize any missing field values from profile
        sections.forEach(section => {
          section.fields.forEach(field => {
            if (values[field.id] === undefined) {
              // Try to get value from profile additional data
              if (profile.additional && profile.additional[field.id] !== undefined) {
                values[field.id] = profile.additional[field.id];
                updated = true;
              }
            }
          });
        });
        
        return updated ? values : prevValues;
      });
    }
  }, [sections, profile]);

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
                          value={fieldValues[field.id] || ''}
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
