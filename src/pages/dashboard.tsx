import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Plus, FileText, Clock, CheckCircle, Trash2, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Application {
  id: string;
  schoolName: string;
  program: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

interface Template {
  id: string;
  schoolName: string;
  program: string;
  description?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [applications, setApplications] = useState<Application[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppModal, setShowNewAppModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchApplications();
    fetchTemplates();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createApplication = async (templateId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/application/${data.application.id}`);
      }
    } catch (error) {
      console.error('Error creating application:', error);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm(t.dashboard.deleteConfirm)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setApplications(applications.filter(app => app.id !== id));
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">{t.common.loading}</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - School Application Assistant</title>
      </Head>

      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
              <p className="text-gray-600 mt-2">{t.dashboard.subtitle}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/templates"
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>管理模板</span>
              </Link>
              <button
                onClick={() => setShowNewAppModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{t.dashboard.newApplication}</span>
              </button>
            </div>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.dashboard.noApplications}</h3>
              <p className="text-gray-600 mb-6">{t.dashboard.noApplicationsDesc}</p>
              <button
                onClick={() => setShowNewAppModal(true)}
                className="btn-primary"
              >
                {t.dashboard.createFirst}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(app.status)}
                      <span className="text-sm font-medium text-gray-600">
                        {getStatusText(app.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {app.schoolName}
                  </h3>
                  <p className="text-gray-600 mb-4">{app.program}</p>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    {t.dashboard.updated}: {new Date(app.updatedAt).toLocaleDateString()}
                  </div>
                  
                  <Link
                    href={`/application/${app.id}`}
                    className="btn-primary w-full text-center"
                  >
                    {app.status === 'submitted' ? t.dashboard.viewApplication : t.dashboard.continueApplication}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Application Modal */}
        {showNewAppModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t.dashboard.chooseSchool}
              </h2>
              
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
                    onClick={() => {
                      createApplication(template.id);
                      setShowNewAppModal(false);
                    }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.schoolName}
                    </h3>
                    <p className="text-gray-600">{template.program}</p>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-2">{template.description}</p>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowNewAppModal(false)}
                className="btn-secondary w-full mt-6"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

