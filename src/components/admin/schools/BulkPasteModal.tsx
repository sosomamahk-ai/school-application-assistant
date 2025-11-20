import { useState } from 'react';
import { X } from 'lucide-react';
import { parsePastedTable, AdminSchoolPayload } from '@/utils/admin/schoolImport';

interface BulkPasteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rows: AdminSchoolPayload[]) => Promise<void>;
}

export default function BulkPasteModal({ open, onClose, onSubmit }: BulkPasteModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<AdminSchoolPayload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleParse = () => {
    try {
      const { rows } = parsePastedTable(rawText);
      setParsedRows(rows);
      setError(rows.length === 0 ? '未能识别任何有效的模板 ID，请检查粘贴内容。' : null);
    } catch (err) {
      console.error(err);
      setError('解析失败，请检查格式。');
      setParsedRows([]);
    }
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      setError('请先粘贴并解析数据');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsedRows);
      setRawText('');
      setParsedRows([]);
      onClose();
    } catch (err) {
      console.error(err);
      setError('导入失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">批量粘贴导入</h2>
            <p className="text-sm text-gray-500 mt-1">支持直接从 Excel / Google Sheets 复制整块数据</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">粘贴区域</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="第一行包含列名，如：学校名称	模板ID	开始申请时间..."
              rows={8}
              className="w-full border rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500 mt-2">
              自动识别列名：学校名称 / 模板ID / 开始申请时间 / 截止日期 / 面试时间 / 笔试时间 / 录取结果时间 / 申请资料 / 申请要求 / 官网链接等。
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleParse} className="btn-secondary px-4 py-2">
              解析预览
            </button>
            <span className="text-sm text-gray-500">{parsedRows.length} 行有效数据</span>
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>

          {parsedRows.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600">学校</th>
                    <th className="px-3 py-2 text-left text-gray-600">模板</th>
                    <th className="px-3 py-2 text-left text-gray-600">开始</th>
                    <th className="px-3 py-2 text-left text-gray-600">截止</th>
                    <th className="px-3 py-2 text-left text-gray-600">面试</th>
                    <th className="px-3 py-2 text-left text-gray-600">笔试</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.name || '-'}</td>
                      <td className="px-3 py-2">{row.templateId}</td>
                      <td className="px-3 py-2">{row.applicationStart || '-'}</td>
                      <td className="px-3 py-2">{row.applicationEnd || '-'}</td>
                      <td className="px-3 py-2">{row.interviewTime || '-'}</td>
                      <td className="px-3 py-2">{row.examTime || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary px-4 py-2">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || parsedRows.length === 0}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            {submitting ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
}


