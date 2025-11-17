import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GraduationCap, User, FileText, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitch from './LanguageSwitch';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">{t.common.appNameShort}</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className={`flex items-center space-x-1 ${router.pathname === '/dashboard' ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">{t.dashboard.myApplications}</span>
              </Link>
              
              <Link 
                href="/profile" 
                className={`flex items-center space-x-1 ${router.pathname === '/profile' ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">{t.profile.title}</span>
              </Link>

              <LanguageSwitch variant="minimal" />
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{t.common.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

