import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { getLocalizedSchoolName } from '@/utils/i18n';
import type { UserApplicationRecord } from '@/hooks/useUserApplications';

// 类别映射 - 与 template-list 保持一致
const categoryMap: Record<string, string> = {
  '国际学校': '国际学校',
  '香港国际学校': '国际学校',
  '本地中学': '本地中学',
  '香港本地中学': '本地中学',
  '本地小学': '本地小学',
  '香港本地小学': '本地小学',
  '幼稚园': '幼稚园',
  '香港幼稚园': '幼稚园',
  '大学': '大学',
  '内地学校': '内地学校',
  'unresolved_raw': '未分类'
};

const getCategoryLabel = (category: string | null | undefined): string => {
  if (!category || category === '未分类') return '未分类';
  return categoryMap[category] || category;
};

interface Props {
  records: UserApplicationRecord[];
  onEdit: (record: UserApplicationRecord) => void;
  onDelete?: (record: UserApplicationRecord) => void;
  applyingId?: string | null;
}

const statusLabel: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  notified: '已通知',
  exam_completed: '已笔试',
  interview_completed: '已面试',
  round_1: '第一轮',
  round_2: '第二轮',
  round_3: '第三轮',
  pending_result: '等待结果',
  rejected: '已拒绝',
  admitted: '已录取'
};

const resultLabel: Record<string, string> = {
  pending: '等待结果',
  admitted: '已录取',
  rejected: '未录取',
  waitlisted: '候补'
};

export default function ApplicationProgressTable({ records, onEdit, onDelete, applyingId }: Props) {
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
              <th className="px-4 py-3 text-center whitespace-nowrap">学校</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">学校类别</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">状态</th>
              <th className="px-4 py-3 text-center">进度</th>
              <th className="px-4 py-3 text-center">笔试</th>
              <th className="px-4 py-3 text-center">面试</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">结果</th>
              <th className="px-1 py-3 text-center whitespace-nowrap">操作</th>
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{schoolName}</div>
                    <div className="text-xs text-gray-500 mt-1">{record.nameEnglish || record.program || ''}</div>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {getCategoryLabel(record.category)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {statusLabel[record.applicationStatus || 'draft'] || '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${record.fillingProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{record.fillingProgress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-center">{exam}</td>
                  <td className="px-4 py-4 text-gray-600 text-center">{interview}</td>
                  <td className="px-6 py-4 text-gray-600 text-center whitespace-nowrap">
                    <div>{resultLabel[record.result] || '等待结果'}</div>
                    {resultTime !== '待定' && (
                      <div className="text-xs text-gray-500">{resultTime}</div>
                    )}
                  </td>
                  <td className="px-1 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex gap-2">
                        {record.applicationId && (
                          <Link
                            href={`/application/${record.applicationId}`}
                            className="btn-secondary text-center text-xs py-1.5 px-2 whitespace-nowrap"
                          >
                            继续填写
                          </Link>
                        )}
                        <button
                          onClick={() => onEdit(record)}
                          className="btn-primary flex items-center justify-center text-xs py-1.5 px-2 whitespace-nowrap"
                        >
                          更新进度
                        </button>
                      </div>
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm('确定要删除这个申请吗？此操作不可恢复。')) {
                              onDelete(record);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          title="删除申请"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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


