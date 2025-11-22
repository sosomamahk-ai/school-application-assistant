import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useUserApplications } from '@/hooks/useUserApplications';
import ApplicationSummary from '@/components/applications/ApplicationSummary';
import ApplicationProgressTable from '@/components/applications/ApplicationProgressTable';
import EditProgressModal from '@/components/applications/EditProgressModal';
import type { UserApplicationRecord } from '@/hooks/useUserApplications';

export default function ApplicationOverviewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { records, loading, error, stats, updateRecord, refresh } = useUserApplications();
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const currentRecord = records.find((r) => r.id === editing) || null;

  // 根据选中的筛选条件过滤记录
  const filteredRecords = selectedFilter
    ? records.filter((record) => {
        switch (selectedFilter) {
          case 'drafts':
            return !record.applicationStatus || record.applicationStatus === 'draft';
          case 'submitted':
            return record.applicationStatus === 'submitted';
          case 'notified':
            return record.applicationStatus === 'notified';
          case 'examCompleted':
            return record.applicationStatus === 'exam_completed';
          case 'interviewCompleted':
            return record.applicationStatus === 'interview_completed';
          case 'round1':
            return record.applicationStatus === 'round_1';
          case 'round2':
            return record.applicationStatus === 'round_2';
          case 'round3':
            return record.applicationStatus === 'round_3';
          case 'pendingResult':
            return record.applicationStatus === 'pending_result';
          case 'rejected':
            return record.applicationStatus === 'rejected';
          case 'admitted':
            return record.applicationStatus === 'admitted';
          case 'total':
          default:
            return true;
        }
      })
    : records;

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

  const handleDelete = async (record: UserApplicationRecord) => {
    if (!record.applicationId) {
      alert('该申请记录没有关联的申请，无法删除');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/applications/${record.applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // 刷新列表
        await refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '删除失败');
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : '删除失败');
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

          <ApplicationSummary
            {...stats}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />

          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
          ) : (
            <ApplicationProgressTable
              records={filteredRecords}
              onEdit={(record) => setEditing(record.id)}
              onDelete={handleDelete}
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


