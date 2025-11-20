import Head from 'next/head';
import Layout from '@/components/Layout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useSchools } from '@/hooks/useSchools';
import SchoolFilters from '@/components/schools/SchoolFilters';
import SchoolTable from '@/components/schools/SchoolTable';

export default function SchoolsPage() {
  const { t } = useTranslation();
  const {
    loading,
    error,
    schools,
    filters,
    setSearch,
    setCategory,
    categories,
    categoryLabels
  } = useSchools();

  return (
    <>
      <Head>
        <title>可申请学校 - {t('common.appName')}</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">可申请学校</h1>
            <p className="text-gray-600 mt-2">
              查看当前开放申请的学校，点击「申请」即可快速创建对应模版的申请表。
            </p>
          </div>
          <SchoolFilters
            search={filters.search}
            onSearch={setSearch}
            category={filters.category}
            onCategory={setCategory}
            categories={categories}
            categoryLabels={categoryLabels}
          />
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
          ) : (
            <SchoolTable schools={schools} />
          )}
        </div>
      </Layout>
    </>
  );
}


