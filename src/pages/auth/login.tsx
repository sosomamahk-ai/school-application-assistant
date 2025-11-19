import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitch from '@/components/LanguageSwitch';
import { setAuthTokenCookie } from '@/utils/token';

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const identifier = loginMethod === 'email'
        ? formData.email.trim()
        : formData.username.trim();

      if (!identifier) {
        setError(t('auth.login.identifierRequired'));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.errors.loginFailed'));
      }

      // Save token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthTokenCookie(data.token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('auth.login.title')} - {t('common.appName')}</title>
      </Head>

      <div className="min-h-[100vh] w-full bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center p-0">
        <div className="absolute top-4 right-4">
          <LanguageSwitch variant="minimal" />
        </div>
        <div className="w-full max-w-md px-4 sm:px-6 transform -translate-y-28 md:-translate-y-32">
          <Link href="/" className="flex items-center justify-center space-x-2 pt-4">
            <GraduationCap className="h-12 w-12 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">{t('common.appNameShort')}</span>
          </Link>
          <h2 className="mt-4 text-center text-3xl font-bold text-gray-900">
            {t('auth.login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.login.orText')}{' '}
            <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              {t('auth.login.createAccount')}
            </Link>
          </p>

          <div className="mt-6 bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('auth.login.chooseMethod')}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      loginMethod === 'email'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-primary-300'
                    }`}
                  >
                    {t('auth.login.emailOption')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('username')}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      loginMethod === 'username'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-primary-300'
                    }`}
                  >
                    {t('auth.login.usernameOption')}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-700"
                >
                  {loginMethod === 'email' ? t('auth.login.email') : t('auth.login.username')}
                </label>
                <div className="mt-1">
                  {loginMethod === 'email' ? (
                    <input
                      id="identifier"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required={loginMethod === 'email'}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      placeholder={t('auth.login.emailPlaceholder')}
                    />
                  ) : (
                    <input
                      id="identifier"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required={loginMethod === 'username'}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input-field"
                      placeholder={t('auth.login.usernamePlaceholder')}
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('auth.login.password')}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  {loading ? t('auth.login.signingIn') : t('auth.login.button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

