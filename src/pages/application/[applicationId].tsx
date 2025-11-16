import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AIGuidancePanel from '@/components/AIGuidancePanel';
import FormFieldInput from '@/components/FormFieldInput';
import { FormField, ApplicationFormData } from '@/types';
import { ChevronLeft, ChevronRight, Save, Send, Loader2 } from 'lucide-react';

interface ApplicationData {
  id: string;
  template: {
    id: string;
    schoolName: string;
    program: string;
    description?: string;
    fields: FormField[];
  };
  formData: ApplicationFormData;
  status: string;
}

export default function ApplicationForm() {
  const router = useRouter();
  const { applicationId } = router.query;
  
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
      checkAutoFill();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
        setFormData(data.application.formData || {});
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAutoFill = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First, get the application to get its fields
      const appResponse = await fetch(`/api/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!appResponse.ok) return;
      
      const appData = await appResponse.json();
      const fields = appData.application.template.fields;
      
      // Then auto-fill based on user profile
      const response = await fetch('/api/ai/auto-fill', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...data.formData, ...prev }));
      }
    } catch (error) {
      console.error('Error auto-filling:', error);
    }
  };

  const saveApplication = async (updateStatus?: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData,
          status: updateStatus || application?.status
        })
      });

      if (response.ok) {
        if (updateStatus === 'submitted') {
          alert('Application submitted successfully!');
          router.push('/dashboard');
        } else {
          alert('Progress saved!');
        }
      }
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Error saving application');
    } finally {
      setSaving(false);
    }
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const goToNextField = () => {
    if (application && currentFieldIndex < application.template.fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  };

  const goToPreviousField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  const calculateProgress = () => {
    if (!application) return 0;
    const filledFields = application.template.fields.filter(field => {
      const value = formData[field.id];
      return value !== undefined && value !== null && value !== '';
    });
    return Math.round((filledFields.length / application.template.fields.length) * 100);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Application not found</p>
        </div>
      </Layout>
    );
  }

  const currentField = application.template.fields[currentFieldIndex];
  const progress = calculateProgress();

  return (
    <>
      <Head>
        <title>{application.template.schoolName} Application - School Application Assistant</title>
      </Head>

      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.template.schoolName}
                </h1>
                <p className="text-gray-600">{application.template.program}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => saveApplication()}
                  disabled={saving}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Save Progress</span>
                </button>
                <button
                  onClick={() => saveApplication('submitted')}
                  disabled={saving || progress < 100}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  <span>Submit</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllFields(!showAllFields)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {showAllFields ? 'Switch to Step-by-Step Mode' : 'View All Fields'}
              </button>
            </div>
          </div>

          {/* Step-by-Step Mode */}
          {!showAllFields && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Form Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                      Field {currentFieldIndex + 1} of {application.template.fields.length}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={goToPreviousField}
                        disabled={currentFieldIndex === 0}
                        className="btn-secondary disabled:opacity-50 flex items-center space-x-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={goToNextField}
                        disabled={currentFieldIndex === application.template.fields.length - 1}
                        className="btn-primary disabled:opacity-50 flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <FormFieldInput
                    field={currentField}
                    value={formData[currentField.id]}
                    onChange={(value) => updateFieldValue(currentField.id, value)}
                  />
                </div>
              </div>

              {/* AI Guidance Panel */}
              <div className="lg:col-span-1">
                <AIGuidancePanel
                  field={currentField}
                  currentValue={formData[currentField.id]}
                  onSuggestionAccept={(value) => updateFieldValue(currentField.id, value)}
                />
              </div>
            </div>
          )}

          {/* All Fields Mode */}
          {showAllFields && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">All Application Fields</h2>
              <div className="space-y-6">
                {application.template.fields.map((field, index) => (
                  <div key={field.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="text-sm text-gray-500 mb-2">Field {index + 1}</div>
                    <FormFieldInput
                      field={field}
                      value={formData[field.id]}
                      onChange={(value) => updateFieldValue(field.id, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

