import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Pencil, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import type { SchoolItem } from '@/hooks/useSchools';
import { getLocalizedSchoolName } from '@/utils/i18n';

// 类别映射
const categoryMap: Record<string, string> = {
  '国际学校': '国际学校',
  '香港本地中学': '本地中学',
  '香港本地小学': '本地小学',
  '香港幼稚园': '幼稚园',
  '幼稚园': '幼稚园',
  '大学': '大学'
};

const getCategoryLabel = (category: string | null | undefined): string => {
  if (!category) return '国际学校';
  return categoryMap[category] || category;
};

interface SchoolTableProps {
  schools: SchoolItem[];
}

interface Application {
  id: string;
  templateId: string;
  templateSchoolId?: string;
}

export default function SchoolTable({ schools }: SchoolTableProps) {
  const router = useRouter();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  // Fetch user's applications to check if school already has an application
  const fetchUserApplications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingApplications(false);
      return;
    }

    try {
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  useEffect(() => {
    fetchUserApplications();
  }, [fetchUserApplications]);

  // Check if a school already has an application
  const getExistingApplication = (school: SchoolItem): Application | null => {
    return userApplications.find(
      (app) => app.templateId === school.templateId || app.templateSchoolId === school.templateSchoolId
    ) || null;
  };

  const applyForSchool = async (school: SchoolItem) => {
    // Check if application already exists
    const existingApp = getExistingApplication(school);
    if (existingApp) {
      router.push(`/application/${existingApp.id}`);
      return;
    }

    setError(null);
    setStatusMessage(null);
    setApplyingId(school.id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: school.templateId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '创建申请失败');
      }
      const data = await res.json();
      // Refresh applications list
      await fetchUserApplications();
      router.push(`/application/${data.application.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '申请失败，请稍后再试');
    } finally {
      setApplyingId(null);
    }
  };


  const tableRows = useMemo(() => {
    return schools.map((school) => ({
      school,
      id: school.id,
      name: school.name || getLocalizedSchoolName(school.schoolName, 'zh-CN'),
      program: school.program,
      category: school.category,
      nameShort: school.nameShort,
      applicationWindow:
        school.applicationStart && school.applicationEnd
          ? `${new Date(school.applicationStart).toLocaleDateString()} - ${new Date(
              school.applicationEnd
            ).toLocaleDateString()}`
          : '待定',
      interviewTime: school.interviewTime
        ? new Date(school.interviewTime).toLocaleDateString()
        : '待定',
      examTime: school.examTime ? new Date(school.examTime).toLocaleDateString() : '待定',
      resultTime: school.resultTime ? new Date(school.resultTime).toLocaleDateString() : '待定',
      officialLink: school.officialLink,
      permalink: school.permalink,
      notes: school.applicationNotes,
      templateSchoolId: school.templateSchoolId
    }));
  }, [schools]);

  if (schools.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
        <Pencil className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无可申请学校</h3>
        <p className="text-gray-500">请联系管理员添加学校或稍后再试。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm border-b border-red-100">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-4 py-3 text-left">学校</th>
              <th className="px-4 py-3 text-left">学校类别</th>
              <th className="px-4 py-3 text-left">申请窗口</th>
              <th className="px-4 py-3 text-left">笔试时间</th>
              <th className="px-4 py-3 text-left">面试时间</th>
              <th className="px-4 py-3 text-left">结果公布</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  {row.officialLink ? (
                    <Link
                      href={row.officialLink}
                      target="_blank"
                      className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {row.name}
                    </Link>
                  ) : row.permalink ? (
                    <Link
                      href={row.permalink}
                      target="_blank"
                      className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <div className="font-semibold text-gray-900">{row.name}</div>
                  )}
                  {row.nameShort && (
                    <div className="text-xs text-gray-500 mt-1">{row.nameShort}</div>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-600">{getCategoryLabel(row.category)}</td>
                <td className="px-4 py-4 text-gray-600">{row.applicationWindow}</td>
                <td className="px-4 py-4 text-gray-600">{row.examTime}</td>
                <td className="px-4 py-4 text-gray-600">{row.interviewTime}</td>
                <td className="px-4 py-4 text-gray-600">{row.resultTime}</td>
                <td className="px-4 py-4">
                  {(() => {
                    const existingApp = getExistingApplication(row.school);
                    if (existingApp) {
                      return (
                        <Link
                          href={`/application/${existingApp.id}`}
                          className="btn-secondary px-4 py-2 flex items-center space-x-2 text-center"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>已申请</span>
                        </Link>
                      );
                    }
                    return (
                      <button
                        onClick={() => applyForSchool(row.school)}
                        className="btn-primary px-4 py-2 flex items-center space-x-2"
                        disabled={applyingId === row.id || loadingApplications}
                      >
                        {applyingId === row.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>创建中...</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            <span>申请</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


