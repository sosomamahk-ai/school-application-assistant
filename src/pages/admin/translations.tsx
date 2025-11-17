import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save, Plus, Search, X } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import type { TranslationData } from '@/lib/translations';
import type { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import { getTokenFromCookieHeader } from '@/utils/token';
import type { JWTPayload } from '@/utils/auth';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newTranslation, setNewTranslation] = useState({
    en: '',
    'zh-CN': '',
    'zh-TW': '',
  });

  useEffect(() => {
    fetchTranslations();
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
        setTranslations(data.translations || {});
      } else {
        console.error('Failed to fetch translations');
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationChange = (
    key: string,
    language: 'en' | 'zh-CN' | 'zh-TW',
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [language]: value,
      },
    }));
  };

  const handleSave = async () => {
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
        alert(t('admin.translations.saveSuccess'));
        await reloadTranslations();
      } else {
        const error = await response.json();
        alert(error.error || t('admin.translations.saveError'));
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      alert(t('admin.translations.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = () => {
    if (!newKey.trim()) {
      alert('Please enter a key');
      return;
    }

    if (translations[newKey]) {
      alert('Key already exists');
      return;
    }

    setTranslations((prev) => ({
      ...prev,
      [newKey]: {
        en: newTranslation.en,
        'zh-CN': newTranslation['zh-CN'],
        'zh-TW': newTranslation['zh-TW'],
      },
    }));

    setNewKey('');
    setNewTranslation({ en: '', 'zh-CN': '', 'zh-TW': '' });
    setShowAddNew(false);
  };

  const handleDelete = (key: string) => {
    if (confirm(`Are you sure you want to delete translation key "${key}"?`)) {
      setTranslations((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const filteredKeys = Object.keys(translations).filter((key) =>
    key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    translations[key].en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    translations[key]['zh-CN'].includes(searchQuery) ||
    translations[key]['zh-TW'].includes(searchQuery)
  );

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

          {/* Actions */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.translations.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddNew(!showAddNew)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>{t('admin.translations.addNew')}</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? t('admin.translations.saving') : t('admin.translations.save')}</span>
              </button>
            </div>
          </div>

          {/* Add New Form */}
          {showAddNew && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.translations.key')}
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g., new.section.key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.translations.english')}
                  </label>
                  <input
                    type="text"
                    value={newTranslation.en}
                    onChange={(e) => setNewTranslation({ ...newTranslation, en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.translations.simplifiedChinese')}
                  </label>
                  <input
                    type="text"
                    value={newTranslation['zh-CN']}
                    onChange={(e) => setNewTranslation({ ...newTranslation, 'zh-CN': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.translations.traditionalChinese')}
                  </label>
                  <input
                    type="text"
                    value={newTranslation['zh-TW']}
                    onChange={(e) => setNewTranslation({ ...newTranslation, 'zh-TW': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddNew}
                    className="w-full btn-primary"
                  >
                    Add
                  </button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.translations.key')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.translations.english')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.translations.simplifiedChinese')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.translations.traditionalChinese')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        {searchQuery ? 'No translations found' : 'No translations'}
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((key) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono text-gray-900">{key}</code>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={translations[key].en || ''}
                            onChange={(e) => handleTranslationChange(key, 'en', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={translations[key]['zh-CN'] || ''}
                            onChange={(e) => handleTranslationChange(key, 'zh-CN', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={translations[key]['zh-TW'] || ''}
                            onChange={(e) => handleTranslationChange(key, 'zh-TW', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(key)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Total translations: {filteredKeys.length} / {Object.keys(translations).length}
          </div>
        </div>
      </Layout>
    </>
  );
}

