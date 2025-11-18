import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Education, Experience, FormField } from '@/types';
import { useTranslation } from '@/contexts/TranslationContext';
import FormFieldInput from '@/components/FormFieldInput';

export default function Profile() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [templateFields, setTemplateFields] = useState<FormField[]>([]);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchMainTemplate();
    fetchProfile();
  }, []);

  const fetchMainTemplate = async () => {
    try {
      // Fetch the main template (template-master-all-fields)
      const response = await fetch('/api/templates?schoolId=template-master-all-fields');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.template && Array.isArray(data.template.fields)) {
          setTemplateFields(data.template.fields);
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
              setTemplateFields(mainTemplate.fields);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching main template:', error);
    }
  };

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

  // Initialize field values when template fields are loaded
  useEffect(() => {
    if (templateFields.length > 0 && profile) {
      setFieldValues(prevValues => {
        const values = { ...prevValues };
        let updated = false;
        
        // Initialize any missing field values from profile
        templateFields.forEach(field => {
          if (values[field.id] === undefined) {
            // Try to get value from profile additional data
            if (profile.additional && profile.additional[field.id] !== undefined) {
              values[field.id] = profile.additional[field.id];
              updated = true;
            }
          }
        });
        
        return updated ? values : prevValues;
      });
    }
  }, [templateFields, profile]);

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
      templateFields.forEach(field => {
        if (fieldValues[field.id] !== undefined) {
          profileData.additional[field.id] = fieldValues[field.id];
        }
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

  const addEducation = () => {
    const newEducation: Education = {
      schoolName: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      GPA: ''
    };
    setProfile({
      ...profile,
      education: [...(profile.education || []), newEducation]
    });
  };

  const removeEducation = (index: number) => {
    const updated = [...profile.education];
    updated.splice(index, 1);
    setProfile({ ...profile, education: updated });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, education: updated });
  };

  const addExperience = () => {
    const newExperience: Experience = {
      title: '',
      organization: '',
      description: '',
      startDate: '',
      endDate: ''
    };
    setProfile({
      ...profile,
      experiences: [...(profile.experiences || []), newExperience]
    });
  };

  const removeExperience = (index: number) => {
    const updated = [...profile.experiences];
    updated.splice(index, 1);
    setProfile({ ...profile, experiences: updated });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...profile.experiences];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, experiences: updated });
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

          {/* Dynamic Template Fields */}
          {templateFields.length > 0 ? (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('profile.basicInfo')}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {templateFields.map((field) => (
                  <div key={field.id} className={field.type === 'textarea' || field.type === 'essay' ? 'md:col-span-2' : ''}>
                    <FormFieldInput
                      field={field}
                      value={fieldValues[field.id] || ''}
                      onChange={(value) => updateFieldValue(field.id, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="card">
                <p className="text-gray-600">
                  {t('profile.noTemplateFields') || 'Template fields are being loaded. Please refresh the page if this message persists.'}
                </p>
              </div>
            )
          )}

          {/* Education */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('profile.education')}</h2>
              <button onClick={addEducation} className="btn-secondary flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{t('profile.addEducation')}</span>
              </button>
            </div>

            <div className="space-y-6">
              {profile?.education?.map((edu: Education, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-900">{t('profile.educationItem')} {index + 1}</h3>
                    <button
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.schoolName')}
                      </label>
                      <input
                        type="text"
                        value={edu.schoolName}
                        onChange={(e) => updateEducation(index, 'schoolName', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.degree')}
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.major')}
                      </label>
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => updateEducation(index, 'major', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.gpa')}
                      </label>
                      <input
                        type="text"
                        value={edu.GPA}
                        onChange={(e) => updateEducation(index, 'GPA', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.startDate')}
                      </label>
                      <input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.endDate')}
                      </label>
                      <input
                        type="date"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experiences */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('profile.experiences')}</h2>
              <button onClick={addExperience} className="btn-secondary flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{t('profile.addExperience')}</span>
              </button>
            </div>

            <div className="space-y-6">
              {profile?.experiences?.map((exp: Experience, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-900">{t('profile.experienceItem')} {index + 1}</h3>
                    <button
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.jobTitle')}
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.organization')}
                      </label>
                      <input
                        type="text"
                        value={exp.organization}
                        onChange={(e) => updateExperience(index, 'organization', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.jobDescription')}
                      </label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={3}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.startDate')}
                      </label>
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.endDate')}
                      </label>
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

