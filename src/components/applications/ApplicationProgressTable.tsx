import Link from 'next/link';
import { Loader2, Mail, CalendarPlus } from 'lucide-react';
import { getLocalizedSchoolName } from '@/utils/i18n';
import type { UserApplicationRecord } from '@/hooks/useUserApplications';

interface Props {
  records: UserApplicationRecord[];
  onEdit: (record: UserApplicationRecord) => void;
  applyingId?: string | null;
}

const statusLabel: Record<string, string> = {
  draft: '草稿',
  in_progress: '进行中',
  submitted: '已提交'
};

const resultLabel: Record<string, string> = {
  pending: '等待结果',
  admitted: '已录取',
  rejected: '未录取',
  waitlisted: '候补'
};

export default function ApplicationProgressTable({ records, onEdit, applyingId }: Props) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
        <p className="text-lg text-gray-600">还没有申请记录，去学校列表挑选吧。</p>
        <Link href="/schools" className="btn-primary mt-4 inline-block">
          查看学校列表
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">学校</th>
              <th className="px-4 py-3 text-left">进度</th>
              <th className="px-4 py-3 text-left">面试</th>
              <th className="px-4 py-3 text-left">笔试</th>
              <th className="px-4 py-3 text-left">结果</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => {
              const schoolName = getLocalizedSchoolName(record.localizedSchoolName, 'zh-CN');
              const interview = record.interviewTime
                ? new Date(record.interviewTime).toLocaleDateString()
                : '待定';
              const exam = record.examTime ? new Date(record.examTime).toLocaleDateString() : '待定';
              const resultTime = record.resultTime
                ? new Date(record.resultTime).toLocaleDateString()
                : '待定';
              return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{schoolName}</div>
                    <div className="text-xs text-gray-500 mt-1">{record.program}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${record.fillingProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{record.fillingProgress}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {statusLabel[record.applicationStatus || 'draft'] || '草稿'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{interview}</td>
                  <td className="px-4 py-4 text-gray-600">{exam}</td>
                  <td className="px-4 py-4 text-gray-600">
                    <div>{resultLabel[record.result] || '等待结果'}</div>
                    <div className="text-xs text-gray-500">{resultTime}</div>
                  </td>
                  <td className="px-4 py-4 space-y-2">
                    {record.applicationId && (
                      <Link
                        href={`/application/${record.applicationId}`}
                        className="btn-secondary w-full text-center"
                      >
                        继续填写
                      </Link>
                    )}
                    <button
                      onClick={() => onEdit(record)}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      编辑
                    </button>
                    <div className="flex space-x-2">
                      <button className="flex-1 btn-outline text-xs flex items-center justify-center space-x-1">
                        <CalendarPlus className="h-4 w-4" />
                        <span>加日历</span>
                      </button>
                      <button className="flex-1 btn-outline text-xs flex items-center justify-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>邮件提醒</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


