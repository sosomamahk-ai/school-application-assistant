/**
 * Enhanced Translation Management UI
 * Features:
 * - Group by page/component
 * - Auto-scan translation keys
 * - Show missing keys
 * - Inline editing with auto-save
 */

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save, Plus, Search, X, RefreshCw, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import type { TranslationData } from '@/lib/translations';
import type { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import { getTokenFromCookieHeader } from '@/utils/token';
import type { JWTPayload } from '@/utils/auth';

interface ScanResult {
  totalKeys: number;
  uniqueKeys: string[];
  byPage: Array<{
    page: string;
    keys: Array<{
      key: string;
      file: string;
      line: number;
      page?: string;
      component?: string;
    }>;
  }>;
  missingKeys: string[];
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = getTokenFromCookieHeader(req.headers.cookie);

  if (!token) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    if (decoded.role !== 'admin') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return { props: {} };
};

export default function TranslationsAdmin() {
  const router = useRouter();
  const { t, reloadTranslations } = useTranslation();
  const [translations, setTranslations] = useState<TranslationData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveDebounceTimer, setSaveDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTranslations();
    scanTranslations();
  }, []);

  const fetchTranslations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/translations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched translations:', Object.keys(data.translations || {}).length, 'keys');
        setTranslations(data.translations || {});
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch translations:', response.status, errorData);
        alert(`加载翻译失败: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      alert(`加载翻译出错: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const scanTranslations = async () => {
    setScanning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/scan-translations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Scan response:', data);
        if (data.success && data.data) {
          setScanResult(data.data);
        } else {
          console.error('Invalid scan response format:', data);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to scan translations:', response.status, errorData);
        alert(`扫描失败: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error scanning translations:', error);
      alert(`扫描出错: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  const handleTranslationChange = (
    key: string,
    language: 'en' | 'zh-CN' | 'zh-TW',
    value: string
  ) => {
    setTranslations((prev) => {
      const updated = {
        ...prev,
        [key]: {
          ...(prev[key] || { en: '', 'zh-CN': '', 'zh-TW': '' }),
          [language]: value,
        },
      };
      return updated;
    });

    // Auto-save with debounce
    if (autoSaveEnabled) {
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
      }
      const timer = setTimeout(() => {
        handleSave(false);
      }, 2000); // Save after 2 seconds of inactivity
      setSaveDebounceTimer(timer);
    }
  };

  const handleSave = async (showAlert = true) => {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      setSaveDebounceTimer(null);
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations }),
      });

      if (response.ok) {
        if (showAlert) {
          alert(t('admin.translations.saveSuccess'));
        }
        await reloadTranslations();
        await scanTranslations(); // Re-scan to update missing keys
      } else {
        const error = await response.json();
        if (showAlert) {
          alert(error.error || t('admin.translations.saveError'));
        }
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      if (showAlert) {
        alert(t('admin.translations.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddMissingKey = (key: string) => {
    setTranslations((prev) => ({
      ...prev,
      [key]: {
        en: key,
        'zh-CN': '',
        'zh-TW': '',
      },
    }));
  };

  // Get pages from scan result
  const pages = useMemo(() => {
    if (!scanResult || !scanResult.byPage) return [];
    return scanResult.byPage.map((p) => p.page).sort();
  }, [scanResult]);

  // Debug: Log scan result
  useEffect(() => {
    if (scanResult) {
      console.log('Scan result:', scanResult);
    }
  }, [scanResult]);

  // Filter keys based on selected page and search
  const filteredKeys = useMemo(() => {
    let keys: string[] = [];

    if (selectedPage === 'all') {
      // Show all translation keys
      keys = Object.keys(translations);
    } else if (scanResult && scanResult.byPage) {
      // Show keys for selected page
      const pageData = scanResult.byPage.find((p) => p.page === selectedPage);
      if (pageData) {
        keys = pageData.keys.map((k) => k.key);
      } else {
        // Page not found in scan result, return empty
        keys = [];
      }
    } else {
      // No scan result, but show all keys if "all" is selected
      keys = Object.keys(translations);
    }

    // Filter by search query
    if (searchQuery) {
      keys = keys.filter(
        (key) =>
          key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          translations[key]?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          translations[key]?.['zh-CN']?.includes(searchQuery) ||
          translations[key]?.['zh-TW']?.includes(searchQuery)
      );
    }

    // Filter missing keys
    if (showMissingOnly && scanResult && scanResult.missingKeys) {
      keys = keys.filter((key) => scanResult.missingKeys.includes(key));
    }

    return keys.sort();
  }, [selectedPage, searchQuery, showMissingOnly, translations, scanResult]);

  // Get missing keys for selected page
  const missingKeysForPage = useMemo(() => {
    if (!scanResult || selectedPage === 'all') {
      return scanResult?.missingKeys || [];
    }
    const pageData = scanResult.byPage.find((p) => p.page === selectedPage);
    if (!pageData) return [];
    return pageData.keys
      .map((k) => k.key)
      .filter((key) => !translations[key])
      .sort();
  }, [selectedPage, scanResult, translations]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{t('admin.translations.title')} - {t('common.appName')}</title>
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('admin.translations.title')}
            </h1>
            <p className="text-gray-600">{t('admin.translations.description')}</p>
          </div>

          {/* Stats and Actions */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-sm text-gray-500">Total Keys</div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(translations).length}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-500">Scanned Keys</div>
              <div className="text-2xl font-bold text-gray-900">
                {scanResult?.uniqueKeys.length || 0}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-500">Missing Keys</div>
              <div className="text-2xl font-bold text-red-600">
                {scanResult?.missingKeys.length || 0}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-500">Pages</div>
              <div className="text-2xl font-bold text-gray-900">
                {pages.length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page / Component
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Pages</option>
                {pages.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('admin.translations.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMissingOnly}
                  onChange={(e) => setShowMissingOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show Missing Only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Auto-save</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={scanTranslations}
              disabled={scanning}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
              <span>Scan Keys</span>
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? t('admin.translations.saving') : t('admin.translations.save')}</span>
            </button>
            {saving && (
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                Saving...
              </div>
            )}
          </div>

          {/* Missing Keys Alert */}
          {missingKeysForPage.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    {missingKeysForPage.length} missing translation key(s) for this page
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {missingKeysForPage.slice(0, 10).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleAddMissingKey(key)}
                        className="px-3 py-1 text-sm bg-white border border-yellow-300 rounded hover:bg-yellow-100 text-yellow-800"
                      >
                        <Plus className="h-3 w-3 inline mr-1" />
                        {key}
                      </button>
                    ))}
                    {missingKeysForPage.length > 10 && (
                      <span className="px-3 py-1 text-sm text-yellow-700">
                        +{missingKeysForPage.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Translations Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      {t('admin.translations.key')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      {t('admin.translations.english')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      {t('admin.translations.simplifiedChinese')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      {t('admin.translations.traditionalChinese')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        {Object.keys(translations).length === 0
                          ? 'No translations loaded. Please check the console for errors.'
                          : searchQuery || showMissingOnly
                          ? 'No translations found matching your filters'
                          : selectedPage !== 'all' && (!scanResult || !scanResult.byPage)
                          ? 'Please click "Scan Keys" first to load page information, or select "All Pages" to view all translations.'
                          : 'No translations found. Click "Scan Keys" to find translation keys in your code.'}
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((key) => {
                      const isMissing = scanResult?.missingKeys.includes(key);
                      const translation = translations[key] || {
                        en: '',
                        'zh-CN': '',
                        'zh-TW': '',
                      };

                      return (
                        <tr
                          key={key}
                          className={`hover:bg-gray-50 ${isMissing ? 'bg-red-50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm font-mono text-gray-900">{key}</code>
                              {isMissing && (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                  Missing
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={translation.en || ''}
                              onChange={(e) => handleTranslationChange(key, 'en', e.target.value)}
                              placeholder={isMissing ? 'Missing translation' : ''}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                                isMissing ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={translation['zh-CN'] || ''}
                              onChange={(e) => handleTranslationChange(key, 'zh-CN', e.target.value)}
                              placeholder={isMissing ? '缺失翻译' : ''}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                                isMissing ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={translation['zh-TW'] || ''}
                              onChange={(e) => handleTranslationChange(key, 'zh-TW', e.target.value)}
                              placeholder={isMissing ? '缺失翻譯' : ''}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                                isMissing ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredKeys.length} of {Object.keys(translations).length} translations
            {selectedPage !== 'all' && ` (Page: ${selectedPage})`}
          </div>
        </div>
      </Layout>
    </>
  );
}
