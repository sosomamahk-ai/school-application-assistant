import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { Lock, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { setAuthTokenCookie } from '@/utils/token';
import { useTranslation } from '@/contexts/TranslationContext';

export default function Settings() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 修改邮箱表单
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: ''
  });
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // 获取当前用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setEmailForm(prev => ({ ...prev, newEmail: user.email || '' }));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // 验证表单
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('settings.fillAllFields'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('settings.passwordTooShort'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError(t('settings.passwordSame'));
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPasswordSuccess(false), 5000);
      } else {
        setPasswordError(data.error || t('settings.changePasswordFailed'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(t('settings.changePasswordError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);

    // 验证表单
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      setEmailError(t('settings.fillAllFields'));
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      setEmailError(t('settings.invalidEmail'));
      return;
    }

    if (emailForm.newEmail === currentUser?.email) {
      setEmailError(t('settings.emailSame'));
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newEmail: emailForm.newEmail,
          currentPassword: emailForm.currentPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSuccess(true);
        // 更新localStorage中的用户信息和token
        const updatedUser = { ...currentUser, email: data.user?.email || emailForm.newEmail };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (data.token) {
          localStorage.setItem('token', data.token);
          setAuthTokenCookie(data.token);
        }
        setCurrentUser(updatedUser);
        setEmailForm({ ...emailForm, currentPassword: '' });
        
        setTimeout(() => setEmailSuccess(false), 5000);
      } else {
        setEmailError(data.error || t('settings.changeEmailFailed'));
      }
    } catch (error) {
      console.error('Error changing email:', error);
      setEmailError(t('settings.changeEmailError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{t('settings.title')} - {t('common.appName')}</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-gray-600 mt-2">{t('settings.subtitle')}</p>
        </div>

        {/* 修改密码 */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-6">
            <Lock className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">{t('settings.changePassword')}</h2>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{t('settings.passwordChanged')}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.currentPassword')}
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field"
                placeholder={t('settings.currentPasswordPlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.newPassword')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field"
                placeholder={t('settings.newPasswordPlaceholder')}
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.confirmNewPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field"
                placeholder={t('settings.confirmPasswordPlaceholder')}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? t('common.saving') : t('settings.changePasswordButton')}</span>
            </button>
          </form>
        </div>

        {/* 修改邮箱 */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Mail className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">{t('settings.changeEmail')}</h2>
          </div>

          {emailSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{t('settings.emailChanged')}</span>
            </div>
          )}

          {emailError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{emailError}</span>
            </div>
          )}

          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div>
              <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.currentEmail')}
              </label>
              <input
                id="currentEmail"
                type="email"
                value={currentUser?.email || ''}
                className="input-field bg-gray-50"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">{t('settings.currentEmailDescription')}</p>
            </div>

            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.newEmail')}
              </label>
              <input
                id="newEmail"
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                className="input-field"
                placeholder={t('settings.newEmailPlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="emailPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.emailPassword')}
              </label>
              <input
                id="emailPassword"
                type="password"
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                className="input-field"
                placeholder={t('settings.emailPasswordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? t('common.saving') : t('settings.changeEmailButton')}</span>
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

