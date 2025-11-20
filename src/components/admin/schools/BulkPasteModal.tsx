import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { parsePastedTable, AdminSchoolPayload } from '@/utils/admin/schoolImport';
import type { TemplateOption } from './types';

interface BulkImportPanelProps {
  templates: TemplateOption[];
  onSubmit: (rows: AdminSchoolPayload[]) => Promise<void>;
}

const PREVIEW_COLUMNS: Array<{ key: keyof AdminSchoolPayload | 'templateLabel'; label: string }> = [
  { key: 'name', label: '学校名称' },
  { key: 'templateLabel', label: '映射模板' },
  { key: 'applicationStart', label: '开始申请' },
  { key: 'applicationEnd', label: '截止日期' },
  { key: 'interviewTime', label: '面试时间' },
  { key: 'examTime', label: '笔试时间' },
  { key: 'resultTime', label: '出结果时间' }
];

export default function BulkImportPanel({ templates, onSubmit }: BulkImportPanelProps) {
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<AdminSchoolPayload[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [parsedAt, setParsedAt] = useState<number | null>(null);

  const templateLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach((tpl) => {
      map.set(tpl.id, tpl.label);
    });
    return map;
  }, [templates]);

  const templateIdSet = useMemo(() => new Set(templates.map((tpl) => tpl.id)), [templates]);

  const formatIssues = (issues: { line: number; message: string }[]) =>
    issues.map((issue) => `第 ${issue.line} 行：${issue.message}`);

  const handleParse = () => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      setMessages(['请先粘贴从 Excel / Sheets 复制的内容。']);
      setParsedRows([]);
      setParsedHeaders([]);
      return;
    }

    const result = parsePastedTable(rawText);
    const templateIssues: string[] = [];

    result.rows.forEach((row, idx) => {
      if (!templateIdSet.has(row.templateId)) {
        templateIssues.push(`第 ${idx + 2} 行：模板 ID「${row.templateId}」在系统中不存在。`);
      }
    });

    setParsedRows(result.rows);
    setParsedHeaders(result.headers);
    setMessages([...formatIssues(result.issues), ...templateIssues]);
    setParsedAt(Date.now());
  };

  const resetState = () => {
    setRawText('');
    setParsedRows([]);
    setParsedHeaders([]);
    setMessages([]);
    setParsedAt(null);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      setMessages(['请先粘贴并点击「解析预览」。']);
      return;
    }
    if (messages.some((msg) => msg.includes('不存在') || msg.includes('缺少'))) {
      setMessages((prev) => ['请先修复下方错误，再尝试导入。', ...prev]);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsedRows);
      resetState();
      setMessages(['导入成功，数据已写入系统。']);
    } catch (error) {
      console.error(error);
      setMessages(['导入失败，请稍后重试或联系管理员。']);
    } finally {
      setSubmitting(false);
    }
  };

  const issueType = messages.some((msg) => msg.includes('错误') || msg.includes('不存在')) ? 'error' : 'info';

  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">批量文本导入</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">一键粘贴 Excel / Sheets 数据</h2>
          <p className="text-sm text-gray-500 mt-1">
            首行请包含列名，系统会自动识别常见字段（学校、模板ID、时间、链接、备注等）。
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetState} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            清空
          </button>
          <button onClick={handleParse} className="btn-secondary flex items-center gap-2">
            解析预览
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || parsedRows.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? '导入中...' : '提交导入'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">粘贴区域</label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          placeholder="示例：学校名称<TAB>模板ID<TAB>开始申请..."
          className="w-full border rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">已识别列</p>
          <p className="text-lg font-semibold mt-1">{parsedHeaders.length || '-'}</p>
          {parsedHeaders.length > 0 && (
            <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-2">
              {parsedHeaders.map((header) => (
                <span key={header} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {header || '未命名'}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">有效行数</p>
          <p className="text-lg font-semibold mt-1">{parsedRows.length}</p>
          {parsedAt && <p className="text-xs text-gray-400 mt-2">最近解析：{new Date(parsedAt).toLocaleTimeString()}</p>}
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">模板校验</p>
          <p className="text-lg font-semibold mt-1">
            {parsedRows.length
              ? `${parsedRows.filter((row) => templateIdSet.has(row.templateId)).length}/${parsedRows.length}`
              : '-'}
          </p>
          <p className="text-xs text-gray-400 mt-2">模板来自系统接口（/api/admin/templates）</p>
        </div>
      </div>

      {messages.length > 0 && (
        <div
          className={`rounded-xl border p-4 flex gap-3 ${
            issueType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-primary-200 bg-primary-50 text-primary-800'
          }`}
        >
          {issueType === 'error' ? (
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
          ) : (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-1" />
          )}
          <div className="space-y-1 text-sm">
            {messages.map((msg, idx) => (
              <p key={`${msg}-${idx}`}>{msg}</p>
            ))}
          </div>
        </div>
      )}

      {parsedRows.length > 0 && (
        <div className="border rounded-2xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <p className="font-medium text-gray-700">解析预览</p>
            <p className="text-sm text-gray-500">最多展示前 50 行</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  {PREVIEW_COLUMNS.map((column) => (
                    <th key={column.key} className="px-3 py-2 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 50).map((row, idx) => (
                  <tr key={`${row.templateId}-${idx}`} className="border-t last:border-b-0">
                    {PREVIEW_COLUMNS.map((column) => {
                      if (column.key === 'templateLabel') {
                        return (
                          <td key={column.key} className="px-3 py-2">
                            {templateLabelMap.get(row.templateId) || `ID: ${row.templateId}`}
                          </td>
                        );
                      }
                      const value = row[column.key as keyof AdminSchoolPayload];
                      return <td key={column.key} className="px-3 py-2">{value || '-'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


