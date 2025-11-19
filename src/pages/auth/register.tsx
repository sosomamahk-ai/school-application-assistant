import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitch from '@/components/LanguageSwitch';
import { setAuthTokenCookie } from '@/utils/token';

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username.trim())) {
      setError(t('auth.errors.usernameInvalid'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
            username: formData.username,
          password: formData.password,
          fullName: formData.fullName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.errors.registrationFailed'));
      }

      // Save token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthTokenCookie(data.token);

      // Redirect to profile setup
      router.push('/profile/setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('auth.register.title')} - {t('common.appName')}</title>
      </Head>

      <div
        className="w-full bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center p-0"
        style={{ minHeight: 'max(800px, 100vh)' }}
      >
        <div className="absolute top-4 right-4">
          <LanguageSwitch variant="minimal" />
        </div>
        <div className="w-full max-w-md px-4 sm:px-6 flex flex-col max-h-[95vh] md:max-h-[90vh]">
          <div className="flex-shrink-0 pt-4 text-center">
            <Link href="/" className="flex items-center justify-center space-x-2">
              <GraduationCap className="h-12 w-12 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">{t('common.appNameShort')}</span>
            </Link>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              {t('auth.register.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.register.hasAccount')}{' '}
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>

          <div className="mt-6 bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 flex-1 overflow-y-auto">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  {t('auth.register.name')}
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  {t('auth.register.username')}
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                    placeholder={t('auth.register.usernamePlaceholder')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('auth.register.usernameHelp')}</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('auth.register.email')}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('auth.register.password')}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  {t('auth.register.confirmPassword')}
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth.register.registering') : t('auth.register.button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

