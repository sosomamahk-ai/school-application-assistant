import Head from 'next/head';
import Link from 'next/link';
import { GraduationCap, FileText, Sparkles, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitch from '@/components/LanguageSwitch';

export default function Home() {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>School Application Assistant - AI-Powered Application Helper</title>
        <meta name="description" content="Simplify your school applications with AI assistance" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">{t('common.appNameShort')}</span>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitch variant="minimal" />
                <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 font-medium">
                  {t('common.login')}
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  {t('home.getStarted')}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('home.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
                {t('home.startApplication')}
              </Link>
              <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                {t('home.learnMore')}
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('home.whyChoose')}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.autoFill.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.autoFill.description')}
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Sparkles className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.aiGuidance.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.aiGuidance.description')}
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.essayGeneration.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.essayGeneration.description')}
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.multipleSchools.title')}</h3>
              <p className="text-gray-600">
                {t('home.features.multipleSchools.description')}
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              {t('home.howItWorks.title')}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.howItWorks.step1.title')}</h3>
                <p className="text-gray-600">
                  {t('home.howItWorks.step1.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.howItWorks.step2.title')}</h3>
                <p className="text-gray-600">
                  {t('home.howItWorks.step2.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.howItWorks.step3.title')}</h3>
                <p className="text-gray-600">
                  {t('home.howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">{t('home.cta.title')}</h2>
            <p className="text-xl mb-8 text-primary-100">
              {t('home.cta.subtitle')}
            </p>
            <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-primary-50 font-semibold py-3 px-8 rounded-lg text-lg inline-block transition-colors duration-200">
              {t('home.cta.button')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6" />
                <span className="text-lg font-semibold">{t('common.appNameShort')}</span>
              </div>
              <p className="text-gray-400">
                {t('home.footer.copyright')}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

