/* eslint-disable @next/next/no-img-element */
import { useMemo } from 'react';
import DataGrid, { Column, RowsChangeData } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, LinkIcon } from 'lucide-react';
import type { RowValidationMap, School, TemplateOption } from './types';
import type { WordPressSchool, WordPressSchoolType } from '@/types/wordpress';

interface SchoolGridProps {
  rows: School[];
  templates: TemplateOption[];
  wordpressSchools: WordPressSchool[];
  onRowsChange: (rows: School[], data: RowsChangeData<School>) => void;
  dirtyMap: Record<string, boolean>;
  onSaveRow: (row: School) => Promise<void>;
  onResetRow: (rowId: string) => void;
  onDeleteRow: (row: School) => void;
  savingRowId?: string | null;
  validationMap: RowValidationMap;
  onRequestWordPressBinding: (row: School) => void;
}

const TemplateEditor = (props: any) => {
  const { row, onRowChange, templates } = props;
  return (
    <select
      className="w-full border-none focus:ring-0 bg-transparent"
      value={row.templateId || ''}
      onChange={(e) => onRowChange({ ...row, templateId: e.target.value }, true)}
    >
      <option value="">选择模版</option>
      {templates.map((tpl: TemplateOption) => (
        <option key={tpl.id} value={tpl.id}>
          {tpl.label}
        </option>
      ))}
    </select>
  );
};

const TextCellEditor = ({ row, column, onRowChange }: any) => (
  <input
    className="w-full border-none bg-transparent focus:outline-none"
    value={row[column.key] ?? ''}
    onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value }, true)}
    autoFocus
  />
);

const formatDateValue = (value?: string | null) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const DateCellEditor = ({ row, column, onRowChange }: any) => (
  <input
    type="date"
    className="w-full border-none bg-transparent focus:outline-none"
    value={formatDateValue(row[column.key])}
    onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value || '' }, true)}
  />
);

const buildWordPressKey = (id?: number | null, type?: WordPressSchoolType | null) =>
  id ? `${type ?? 'profile'}-${id}` : null;

export default function SchoolGrid({
  rows,
  templates,
  wordpressSchools,
  onRowsChange,
  dirtyMap,
  onSaveRow,
  onResetRow,
  onDeleteRow,
  savingRowId,
  validationMap,
  onRequestWordPressBinding
}: SchoolGridProps) {
  const templateOptions = useMemo(
    () => templates.map((tpl) => ({ id: tpl.id, label: tpl.label })),
    [templates]
  );
  const wordpressMap = useMemo(() => {
    const map = new Map<string, WordPressSchool>();
    wordpressSchools.forEach((school) => {
      map.set(`${school.type}-${school.id}`, school);
    });
    return map;
  }, [wordpressSchools]);

  const columns: Column<School>[] = useMemo(
    () => [
      {
        key: 'wordpressSchool',
        name: 'WordPress 学校',
        width: 320,
        resizable: true,
        formatter: ({ row }: { row: School }) => {
          const key = buildWordPressKey(row.wordpressSchoolId, row.wordpressSchoolType ?? null);
          const wpSchool = key ? wordpressMap.get(key) : undefined;

          if (!wpSchool) {
            return (
              <button
                type="button"
                className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600"
                onClick={() => onRequestWordPressBinding(row)}
              >
                绑定 WordPress 学校
              </button>
            );
          }

          return (
            <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-2">
              <div className="flex items-center gap-3">
                {wpSchool.logo ? (
                  <img
                    src={wpSchool.logo}
                    alt={wpSchool.title}
                    className="h-10 w-10 rounded-lg border border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    {wpSchool.title.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{wpSchool.title}</p>
                  <p className="text-xs text-gray-500">
                    {[wpSchool.category, wpSchool.acf?.district].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <a
                  href={wpSchool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  查看学校资料
                </a>
                <button
                  type="button"
                  className="text-gray-500 hover:text-primary-600"
                  onClick={() => onRequestWordPressBinding(row)}
                >
                  更换
                </button>
              </div>
            </div>
          );
        }
      },
      { key: 'name', name: '学校名称', editor: TextCellEditor, width: 220 },
      { key: 'shortName', name: '简称', editor: TextCellEditor, width: 140 },
      {
        key: 'templateId',
        name: '模版',
        width: 220,
        editor: (p: any) => <TemplateEditor {...p} templates={templateOptions} />,
        formatter: ({ row }: { row: School }) => {
          const tpl = templateOptions.find((t) => t.id === row.templateId);
          return tpl?.label || '未映射';
        }
      },
      { key: 'applicationStart', name: '开始申请', editor: DateCellEditor, width: 160 },
      { key: 'applicationEnd', name: '截止日期', editor: DateCellEditor, width: 160 },
      { key: 'interviewTime', name: '面试时间', editor: DateCellEditor, width: 160 },
      { key: 'examTime', name: '笔试时间', editor: DateCellEditor, width: 160 },
      { key: 'resultTime', name: '录取结果时间', editor: DateCellEditor, width: 160 },
      { key: 'officialLink', name: '官网链接', editor: TextCellEditor, width: 240 },
      { key: 'notes', name: '备注', editor: TextCellEditor, width: 200 },
      {
        key: 'actions',
        name: '操作',
        width: 150,
        frozen: true,
        formatter: ({ row }: { row: School }) => {
          const isDirty = dirtyMap[row.id];
          const validationErrors = validationMap[row.id] || [];
          return (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSaveRow(row)}
                  disabled={!isDirty || !!validationErrors.length || savingRowId === row.id}
                  className="text-primary-600 disabled:text-gray-400"
                  title={validationErrors.length ? '请先修复校验错误' : '保存当前行'}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onResetRow(row.id)}
                  disabled={!isDirty}
                  className="text-gray-400 disabled:text-gray-300"
                  title="撤销修改"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDeleteRow(row)}
                  className="text-red-500 hover:text-red-600"
                  title="删除此映射"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              {validationErrors.length > 0 && (
                <div className="flex items-center text-xs text-red-500 gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{validationErrors[0]}</span>
                </div>
              )}
            </div>
          );
        }
      }
    ],
    [
      dirtyMap,
      onDeleteRow,
      onResetRow,
      onSaveRow,
      templateOptions,
      savingRowId,
      validationMap,
      wordpressMap,
      onRequestWordPressBinding
    ]
  );

  return (
    <div className="border rounded-xl overflow-hidden" style={{ height: '85vh', minHeight: '600px' }}>
      <DataGrid
        className="rdg-light"
        columns={columns}
        rows={rows}
        onRowsChange={onRowsChange}
        rowKeyGetter={(row: School) => row.id}
        defaultColumnOptions={{ resizable: true }}
        rowClass={(row: School) => (validationMap[row.id]?.length ? 'bg-red-50/60' : undefined)}
        rowHeight={96}
      />
    </div>
  );
}


