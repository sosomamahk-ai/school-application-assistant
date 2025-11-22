import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import {
  FileText,
  User,
  BookOpen,
  ListChecks,
  Settings,
  ArrowRight,
  CheckCircle,
  Plus,
  Eye
} from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const modules = [
    {
      name: t('dashboard.guide.module.myApplication'),
      description: t('dashboard.guide.module.myApplicationDesc'),
      href: '/my-application',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: t('dashboard.guide.module.profile'),
      description: t('dashboard.guide.module.profileDesc'),
      href: '/profile',
      icon: User,
      color: 'bg-green-500'
    },
    {
      name: t('dashboard.guide.module.schools'),
      description: t('dashboard.guide.module.schoolsDesc'),
      href: '/schools',
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      name: t('dashboard.guide.module.overview'),
      description: t('dashboard.guide.module.overviewDesc'),
      href: '/applications/overview',
      icon: ListChecks,
      color: 'bg-orange-500'
    },
    {
      name: t('dashboard.guide.module.settings'),
      description: t('dashboard.guide.module.settingsDesc'),
      href: '/settings',
      icon: Settings,
      color: 'bg-gray-500'
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: t('dashboard.guide.step1'),
      description: t('dashboard.guide.step1Desc'),
      href: '/profile',
      icon: User
    },
    {
      step: 2,
      title: t('dashboard.guide.step2'),
      description: t('dashboard.guide.step2Desc'),
      href: '/schools',
      icon: BookOpen
    },
    {
      step: 3,
      title: t('dashboard.guide.step3'),
      description: t('dashboard.guide.step3Desc'),
      href: '/my-application',
      icon: Plus
    },
    {
      step: 4,
      title: t('dashboard.guide.step4'),
      description: t('dashboard.guide.step4Desc'),
      href: '/my-application',
      icon: Eye
    }
  ];

  return (
    <>
      <Head>
        <title>{t('dashboard.guide.title')} - {t('common.appName')}</title>
      </Head>

      <Layout>
        <div className="space-y-12">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('dashboard.guide.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('dashboard.guide.subtitle')}
            </p>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              {t('dashboard.guide.intro')}
            </p>
          </div>

          {/* System Workflow Overview */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 text-primary-600 mr-2" />
              {t('dashboard.guide.workflow.title')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.step}
                    href={step.href}
                    className="group relative p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                          <span className="text-2xl font-bold text-primary-600 group-hover:text-white">
                            {step.step}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {step.description}
                        </p>
                        <div className="flex items-center text-primary-600 text-sm font-medium">
                          <span>{t('dashboard.guide.goToModule')}</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Module List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('dashboard.guide.modules.title')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="card hover:shadow-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`${module.color} p-3 rounded-lg flex-shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600">
                          {module.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {module.description}
                        </p>
                        <div className="flex items-center text-primary-600 text-sm font-medium">
                          <span>{t('dashboard.guide.goToModule')}</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Links Panel */}
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('dashboard.guide.quickLinks')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/my-application"
                className="btn-primary text-center py-3"
              >
                <FileText className="h-5 w-5 inline-block mr-2" />
                {t('dashboard.guide.module.myApplication')}
              </Link>
              <Link
                href="/profile"
                className="btn-secondary text-center py-3"
              >
                <User className="h-5 w-5 inline-block mr-2" />
                {t('dashboard.guide.module.profile')}
              </Link>
              <Link
                href="/schools"
                className="btn-secondary text-center py-3"
              >
                <BookOpen className="h-5 w-5 inline-block mr-2" />
                {t('dashboard.guide.module.schools')}
              </Link>
              <Link
                href="/settings"
                className="btn-secondary text-center py-3"
              >
                <Settings className="h-5 w-5 inline-block mr-2" />
                {t('dashboard.guide.module.settings')}
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
