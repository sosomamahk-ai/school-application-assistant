import { useState } from 'react';
import type { UserApplicationRecord } from '@/hooks/useUserApplications';

interface Props {
  record: UserApplicationRecord | null;
  onClose: () => void;
  onSave: (payload: Partial<UserApplicationRecord>) => Promise<void>;
  saving: boolean;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'notified', label: '已通知' },
  { value: 'exam_completed', label: '已笔试' },
  { value: 'interview_completed', label: '已面试' },
  { value: 'round_1', label: '第一轮' },
  { value: 'round_2', label: '第二轮' },
  { value: 'round_3', label: '第三轮' },
  { value: 'pending_result', label: '等待结果' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'admitted', label: '已录取' }
];

const RESULT_OPTIONS = [
  { value: 'pending', label: '等待结果' },
  { value: 'admitted', label: '已录取' },
  { value: 'rejected', label: '未录取' },
  { value: 'waitlisted', label: '候补' }
];

export default function EditProgressModal({ record, onClose, onSave, saving }: Props) {
  const [progress, setProgress] = useState(record?.fillingProgress ?? 0);
  const [applicationStatus, setApplicationStatus] = useState(record?.applicationStatus ?? 'draft');
  const [interviewTime, setInterviewTime] = useState(record?.interviewTime ?? '');
  const [examTime, setExamTime] = useState(record?.examTime ?? '');
  const [result, setResult] = useState<UserApplicationRecord['result']>(record?.result ?? 'pending');
  const [resultTime, setResultTime] = useState(record?.resultTime ?? '');
  const [notes, setNotes] = useState(record?.notes ?? '');

  if (!record) return null;

  const handleSubmit = async () => {
    await onSave({
      fillingProgress: progress,
      applicationStatus: applicationStatus || 'draft',
      interviewTime: interviewTime || null,
      examTime: examTime || null,
      result: result as UserApplicationRecord['result'],
      resultTime: resultTime || null,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">更新申请进度</h2>
          <p className="text-sm text-gray-500 mt-1">{record.program}</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm text-gray-600">申请状态</label>
            <select
              value={applicationStatus}
              onChange={(e) => setApplicationStatus(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">填写进度（0-100）</label>
            <input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">面试时间</label>
              <input
                type="date"
                value={interviewTime ? interviewTime.slice(0, 10) : ''}
                onChange={(e) => setInterviewTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">笔试时间</label>
              <input
                type="date"
                value={examTime ? examTime.slice(0, 10) : ''}
                onChange={(e) => setExamTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">申请结果</label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as UserApplicationRecord['result'])}
                className="w-full border rounded-lg p-2 mt-1"
              >
                {RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">结果时间</label>
              <input
                type="date"
                value={resultTime ? resultTime.slice(0, 10) : ''}
                onChange={(e) => setResultTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">备注</label>
            <textarea
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
              rows={3}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary px-4 py-2">
            取消
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary px-4 py-2">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}


