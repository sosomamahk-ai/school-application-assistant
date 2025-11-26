import { useCallback, useEffect, useMemo, useState } from 'react';

export type ApplicationResult = 'pending' | 'admitted' | 'rejected' | 'waitlisted';

export interface UserApplicationRecord {
  id: string;
  schoolId: string;
  wpid?: number | null;
  localizedSchoolName: string | { [lang: string]: string };
  nameEnglish?: string | null;
  program?: string | null;
  category?: string | null;
  applicationId?: string | null;
  applicationStatus?: string | null;
  fillingProgress: number;
  interviewTime?: string | null;
  examTime?: string | null;
  result: ApplicationResult;
  resultTime?: string | null;
  notes?: string | null;
  updatedAt: string;
}

export function useUserApplications() {
  const [records, setRecords] = useState<UserApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/user-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '获取申请记录失败');
      }
      const data = await res.json();
      setRecords(data.applications || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const stats = useMemo(() => {
    const total = records.length;
    const drafts = records.filter((r) => !r.applicationStatus || r.applicationStatus === 'draft').length;
    const submitted = records.filter((r) => r.applicationStatus === 'submitted').length;
    const notified = records.filter((r) => r.applicationStatus === 'notified').length;
    const examCompleted = records.filter((r) => r.applicationStatus === 'exam_completed').length;
    const interviewCompleted = records.filter((r) => r.applicationStatus === 'interview_completed').length;
    const round1 = records.filter((r) => r.applicationStatus === 'round_1').length;
    const round2 = records.filter((r) => r.applicationStatus === 'round_2').length;
    const round3 = records.filter((r) => r.applicationStatus === 'round_3').length;
    const pendingResult = records.filter((r) => r.applicationStatus === 'pending_result').length;
    const rejected = records.filter((r) => r.applicationStatus === 'rejected').length;
    const admitted = records.filter((r) => r.applicationStatus === 'admitted').length;
    
    return { 
      total, 
      drafts, 
      submitted, 
      notified,
      examCompleted, 
      interviewCompleted, 
      round1, 
      round2, 
      round3, 
      pendingResult, 
      rejected, 
      admitted 
    };
  }, [records]);

  const updateRecord = async (id: string, payload: Partial<UserApplicationRecord>) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/user-applications', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id, ...payload })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '更新失败');
    }
    const updated = await res.json();
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, ...payload } : record))
    );
    return updated;
  };

  return {
    records,
    loading,
    error,
    stats,
    refresh: fetchRecords,
    updateRecord
  };
}


