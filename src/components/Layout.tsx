import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  GraduationCap,
  User,
  FileText,
  LogOut,
  Settings,
  Shield,
  Users,
  Menu,
  X,
  BookOpen,
  ListChecks,
  LayoutDashboard
} from 'lucide-react';
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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    htmlEl.classList.add('dashboard-font-scale');
    bodyEl.classList.add('dashboard-font-scale');

    return () => {
      htmlEl.classList.remove('dashboard-font-scale');
      bodyEl.classList.remove('dashboard-font-scale');
    };
  }, []);

  const isAdmin = userRole === 'admin';

  const getLabel = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const primaryLinks = [
    {
      href: '/dashboard',
      label: getLabel('navbar.dashboard', '控制台'),
      icon: LayoutDashboard
    },
    {
      href: '/schools',
      label: getLabel('navbar.schools', '可申请学校'),
      icon: BookOpen
    },
    {
      href: '/my-application',
      label: t('dashboard.title'),
      icon: FileText
    },
    {
      href: '/applications/overview',
      label: getLabel('navbar.applicationsOverview', '申请进度'),
      icon: ListChecks
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
    },
    {
      href: '/admin/schools',
      label: getLabel('navbar.adminSchools', '学校映射管理'),
      icon: LayoutDashboard
    },
    {
      href: '/admin/auto-apply-scripts',
      label: '自动申请脚本',
      icon: FileText
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

  // 统一使用左侧边栏布局（与 WordPress 保持一致）
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white shadow-sm flex-col z-20">
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">{t('common.appNameShort')}</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2 min-w-0 overflow-y-auto">
          {renderLinks(primaryLinks)}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
              {renderLinks(adminLinks)}
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <LanguageSwitch variant="minimal" />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 py-2 px-3 rounded-lg hover:bg-gray-50"
            >
              <LogOut className="h-5 w-5" />
              <span className={`font-medium ${language === 'en' ? 'text-sm' : ''}`}>{t('navbar.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-screen">
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

          <div
            className={`bg-white border-b border-gray-100 shadow-sm transition-all duration-200 ${
              mobileMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'
            }`}
          >
            <div className="px-4 sm:px-6 py-4 space-y-4">
              <div className="space-y-2">{renderLinks(primaryLinks, true)}</div>
              {isAdmin && (
                <div className="pt-3 border-t border-gray-100 space-y-2">{renderLinks(adminLinks, true)}</div>
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

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
