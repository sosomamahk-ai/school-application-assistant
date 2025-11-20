import { useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useUserApplications } from '@/hooks/useUserApplications';
import ApplicationSummary from '@/components/applications/ApplicationSummary';
import ApplicationProgressTable from '@/components/applications/ApplicationProgressTable';
import EditProgressModal from '@/components/applications/EditProgressModal';

export default function ApplicationOverviewPage() {
  const { t } = useTranslation();
  const { records, loading, error, stats, updateRecord } = useUserApplications();
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentRecord = records.find((r) => r.id === editing) || null;

  const handleSave = async (payload: any) => {
    if (!currentRecord) return;
    setSaving(true);
    try {
      await updateRecord(currentRecord.id, payload);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>申请进度总览 - {t('common.appName')}</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">申请进度总览</h1>
            <p className="text-gray-600 mt-2">统一查看所有学校的申请状态，及时更新面试、笔试和结果信息。</p>
          </div>

          <ApplicationSummary {...stats} />

          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
          ) : (
            <ApplicationProgressTable
              records={records}
              onEdit={(record) => setEditing(record.id)}
            />
          )}
        </div>
      </Layout>

      {editing && (
        <EditProgressModal
          record={currentRecord}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </>
  );
}


