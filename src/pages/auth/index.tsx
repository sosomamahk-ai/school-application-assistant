import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitch from '@/components/LanguageSwitch';
import { setAuthTokenCookie } from '@/utils/token';

export default function Auth() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');
  
  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    username: '',
    password: ''
  });
  
  // Register form data
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle input focus for floating labels
  useEffect(() => {
    const updateFocus = () => {
      const inputs = document.querySelectorAll('.txtb input');
      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        if (htmlInput.value) {
          htmlInput.classList.add('focus');
        } else {
          htmlInput.classList.remove('focus');
        }
      });
    };

    const handleFocus = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target) {
        target.classList.add('focus');
      }
    };

    const handleBlur = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target && target.value === '') {
        target.classList.remove('focus');
      }
    };

    const inputs = document.querySelectorAll('.txtb input');
    inputs.forEach((input) => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('input', updateFocus);
    });

    // Initial check for values
    updateFocus();

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
        input.removeEventListener('input', updateFocus);
      });
    };
  }, [isSignUp, loginData, registerData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const identifier = loginMethod === 'email'
        ? loginData.email.trim()
        : loginData.username.trim();

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
          password: loginData.password
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    if (registerData.password.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(registerData.username.trim())) {
      setError(t('auth.errors.usernameInvalid'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          username: registerData.username,
          password: registerData.password,
          fullName: registerData.fullName
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
        <title>{isSignUp ? t('auth.register.title') : t('auth.login.title')} - {t('common.appName')}</title>
      </Head>

      <style dangerouslySetInnerHTML={{__html: `
        * {
          box-sizing: border-box;
        }

        .auth-container {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
          position: relative;
          overflow: hidden;
          width: 768px;
          max-width: 100%;
          min-height: 480px;
        }

        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }

        .form-container form {
          background: #fff;
          display: flex;
          flex-direction: column;
          padding: 0 50px;
          height: 100%;
          justify-content: center;
          text-align: center;
        }

        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }

        .sign-up-container {
          left: 0;
          width: 50%;
          z-index: 1;
          opacity: 0;
        }

        .auth-container.right-panel-active .sign-in-container {
          transform: translateX(100%);
        }

        .auth-container.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }

        .overlay {
          background: linear-gradient(120deg, #4682B4, #5F9EA0);
          color: #fff;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .auth-container.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }

        .auth-container.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: absolute;
          top: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 40px;
          height: 100%;
          width: 50%;
          text-align: center;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .overlay-left {
          transform: translateX(-20%);
        }

        .auth-container.right-panel-active .overlay-left {
          transform: translateX(0);
        }

        .overlay-right {
          right: 0;
          transform: translateX(0);
        }

        .auth-container.right-panel-active .overlay-right {
          transform: translateX(20%);
        }

        .txtb {
          border-bottom: 2px solid #adadad;
          position: relative;
          margin: 10px 0;
        }

        .txtb input {
          font-size: 15px;
          color: #333;
          border: none;
          width: 100%;
          outline: none;
          background: none;
          padding: 0 3px;
          height: 35px;
        }

        .txtb span::before {
          content: attr(data-placeholder);
          position: absolute;
          top: 50%;
          left: 5px;
          color: #adadad;
          transform: translateY(-50%);
          transition: 0.5s;
          pointer-events: none;
        }

        .txtb span::after {
          content: '';
          position: absolute;
          left: 0%;
          top: 100%;
          width: 0%;
          height: 2px;
          background: linear-gradient(120deg, #4682B4, #5F9EA0);
          transition: 0.5s;
        }

        .txtb input.focus + span::before {
          top: -5px;
          font-size: 12px;
        }

        .txtb input.focus + span::after {
          width: 100%;
        }

        button.ghost {
          background: transparent;
          border-color: #fff;
          color: #fff;
        }

        .form-container button {
          background: linear-gradient(120deg, #4682B4, #5F9EA0);
          border: none;
          background-size: 200%;
          color: #fff;
          transition: 0.5s;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .form-container button:hover {
          background-position: right;
        }

        .form-container button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .login-method-toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .login-method-toggle button {
          flex: 1;
          padding: 8px;
          font-size: 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
          color: #374151;
        }

        .login-method-toggle button.active {
          background: #4682B4;
          color: #fff;
          border-color: #4682B4;
        }

        @media (max-width: 768px) {
          .auth-container {
            width: 100%;
            min-height: 600px;
          }

          .sign-in-container,
          .sign-up-container {
            width: 100%;
          }

          .overlay-container {
            display: none;
          }

          .auth-container.right-panel-active .sign-in-container {
            transform: translateX(-100%);
          }

          .auth-container.right-panel-active .sign-up-container {
            transform: translateX(0);
          }
        }
      `}} />

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom, #E6F2F8, #ffffff)' }}>
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitch variant="minimal" />
        </div>

        <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`} id="auth-box" style={{ marginTop: '80px' }}>
          {/* Logo and Title - Above the container */}
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-center w-full">
            <Link href="/" className="flex items-center justify-center space-x-2 mb-2">
              <GraduationCap className="h-10 w-10" style={{ color: '#4682B4' }} />
              <span className="text-2xl font-bold" style={{ color: '#1e293b' }}>{t('common.appNameShort')}</span>
            </Link>
          </div>
          {/* Sign Up Form */}
          <div className="form-container sign-up-container">
            <form onSubmit={handleRegister}>
              <h1 className="text-2xl font-bold mb-4">{t('auth.register.title')}</h1>
              
              {error && isSignUp && (
                <div className="error-message">{error}</div>
              )}

              <div className="txtb">
                <input
                  type="text"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  required
                />
                <span data-placeholder={t('auth.register.name')}></span>
              </div>

              <div className="txtb">
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  required
                />
                <span data-placeholder={t('auth.register.username')}></span>
              </div>

              <div className="txtb">
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
                <span data-placeholder={t('auth.register.email')}></span>
              </div>

              <div className="txtb">
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
                <span data-placeholder={t('auth.register.password')}></span>
              </div>

              <div className="txtb">
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                />
                <span data-placeholder={t('auth.register.confirmPassword')}></span>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? t('auth.register.registering') : t('auth.register.button')}
              </button>
            </form>
          </div>

          {/* Sign In Form */}
          <div className="form-container sign-in-container">
            <form onSubmit={handleLogin}>
              <h1 className="text-2xl font-bold mb-2">{t('auth.login.title')}</h1>
              <p className="text-sm text-gray-600 mb-6">{t('auth.login.subtitle') || '请使用您的账号进行登录'}</p>
              
              {error && !isSignUp && (
                <div className="error-message">{error}</div>
              )}

              <div className="login-method-toggle">
                <button
                  type="button"
                  className={loginMethod === 'email' ? 'active' : ''}
                  onClick={() => setLoginMethod('email')}
                >
                  {t('auth.login.emailOption')}
                </button>
                <button
                  type="button"
                  className={loginMethod === 'username' ? 'active' : ''}
                  onClick={() => setLoginMethod('username')}
                >
                  {t('auth.login.usernameOption')}
                </button>
              </div>

              <div className="txtb">
                <input
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  value={loginMethod === 'email' ? loginData.email : loginData.username}
                  onChange={(e) => {
                    if (loginMethod === 'email') {
                      setLoginData({ ...loginData, email: e.target.value });
                    } else {
                      setLoginData({ ...loginData, username: e.target.value });
                    }
                  }}
                  required
                />
                <span data-placeholder={loginMethod === 'email' ? t('auth.login.email') : t('auth.login.username')}></span>
              </div>

              <div className="txtb">
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <span data-placeholder={t('auth.login.password')}></span>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? t('auth.login.signingIn') : t('auth.login.button')}
              </button>
            </form>
          </div>

          {/* Overlay */}
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1 className="text-2xl font-bold mb-4">{t('auth.register.hasAccount')}</h1>
                <p className="mb-4">{t('auth.login.orText')}</p>
                <button className="ghost" onClick={() => setIsSignUp(false)}>
                  {t('auth.login.button')}
                </button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1 className="text-2xl font-bold mb-4">{t('auth.register.noAccount')}</h1>
                <p className="mb-4">{t('auth.register.joinUs')}</p>
                <button className="ghost" onClick={() => setIsSignUp(true)}>
                  {t('auth.register.button')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

