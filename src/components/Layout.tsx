import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap, User, FileText, LogOut, Settings, Shield, Users, Menu, X } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitch from './LanguageSwitch';
import { clearAuthTokenCookie } from '@/utils/token';
import { isWordPressEnvironment } from '@/utils/wordpress';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [userRole, setUserRole] = useState<string>('user');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isWordPress, setIsWordPress] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'user');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // 检测WordPress环境
    setIsWordPress(isWordPressEnvironment());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuthTokenCookie();
    router.push('/');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  const isAdmin = userRole === 'admin';

  const primaryLinks = [
    {
      href: '/dashboard',
      label: t('dashboard.title'),
      icon: FileText
    },
    {
      href: '/profile',
      label: t('profile.title'),
      icon: User
    },
    {
      href: '/settings',
      label: t('settings.title'),
      icon: Settings
    }
  ];

  const adminLinks = [
    {
      href: '/admin/templates',
      label: t('admin.templates.title'),
      icon: Shield
    },
    {
      href: '/admin/users',
      label: t('admin.userManagement'),
      icon: Users
    },
    {
      href: '/admin/translations',
      label: t('admin.translations.title'),
      icon: Settings
    }
  ];

  const renderLinks = (links: typeof primaryLinks, isMobile = false) =>
    links.map(({ href, label, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        className={`flex items-center space-x-2 py-2 ${
          router.pathname === href ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
        } ${isMobile ? 'px-2' : ''}`}
      >
        <Icon className="h-5 w-5" />
        <span className={`font-medium ${language === 'en' ? 'text-sm' : ''}`}>{label}</span>
      </Link>
    ));

  // WordPress环境：使用左侧sidebar布局
  if (isWordPress) {
    return (
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Sidebar Navigation - 固定不动 */}
        <aside className="w-64 bg-white shadow-sm flex-shrink-0 hidden lg:block fixed left-0 top-0 h-screen">
          <div className="h-full flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">{t('common.appNameShort')}</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {renderLinks(primaryLinks)}
              
              {isAdmin && (
                <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                  {renderLinks(adminLinks)}
                </div>
              )}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <LanguageSwitch variant="minimal" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 text-gray-700 hover:text-red-600 py-2 rounded-lg hover:bg-gray-50"
              >
                <LogOut className="h-5 w-5" />
                <span className={`font-medium ${language === 'en' ? 'text-sm' : ''}`}>{t('navbar.logout')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Top Navigation */}
        <div className="lg:hidden w-full">
          <nav className="bg-white shadow-sm">
            <div className="px-4 sm:px-6">
              <div className="flex justify-between items-center h-16">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <GraduationCap className="h-6 w-6 text-primary-600" />
                  <span className="text-lg font-bold text-gray-900">{t('common.appNameShort')}</span>
                </Link>
                
                <button
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-300"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Navigation Menu */}
          <div className={`bg-white border-b border-gray-100 shadow-sm transition-all duration-200 ${mobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
            <div className="px-4 sm:px-6 py-4 space-y-4">
              <div className="space-y-2">
                {renderLinks(primaryLinks, true)}
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {renderLinks(adminLinks, true)}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <LanguageSwitch variant="minimal" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span className={`font-medium ${language === 'en' ? 'text-sm' : ''}`}>{t('navbar.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width in WordPress, 左侧留出sidebar空间 */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto lg:ml-64">
          {children}
        </main>
      </div>
    );
  }

  // 正常环境：使用顶部导航栏布局
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">{t('common.appNameShort')}</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className={`hidden md:flex items-center ${language === 'en' ? 'space-x-4' : 'space-x-6'}`}>
                {renderLinks(primaryLinks)}
                {isAdmin && (
                  <div className={`flex items-center ${language === 'en' ? 'space-x-3' : 'space-x-4'}`}>
                    {renderLinks(adminLinks)}
                  </div>
                )}
                <LanguageSwitch variant="minimal" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span className={`font-medium ${language === 'en' ? 'text-sm' : ''}`}>{t('navbar.logout')}</span>
                </button>
              </div>

              <button
                className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-300"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className={`md:hidden bg-white border-b border-gray-100 shadow-sm transition-all duration-200 ${mobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
        <div className="px-4 sm:px-6 py-4 space-y-4">
          <div className="space-y-2">
            {renderLinks(primaryLinks, true)}
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {renderLinks(adminLinks, true)}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <LanguageSwitch variant="minimal" />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span className={`font-medium ${language === 'en' ? 'text-sm' : ''}`}>{t('navbar.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
