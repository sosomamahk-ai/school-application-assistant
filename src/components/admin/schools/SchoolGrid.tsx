import { useMemo } from 'react';
import DataGrid, { Column, RowsChangeData } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import type { RowValidationMap, School, TemplateOption } from './types';

interface SchoolGridProps {
  rows: School[];
  templates: TemplateOption[];
  onRowsChange: (rows: School[], data: RowsChangeData<School>) => void;
  dirtyMap: Record<string, boolean>;
  onSaveRow: (row: School) => Promise<void>;
  onResetRow: (rowId: string) => void;
  onDeleteRow: (row: School) => void;
  savingRowId?: string | null;
  validationMap: RowValidationMap;
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

export default function SchoolGrid({
  rows,
  templates,
  onRowsChange,
  dirtyMap,
  onSaveRow,
  onResetRow,
  onDeleteRow,
  savingRowId,
  validationMap
}: SchoolGridProps) {
  const templateOptions = useMemo(
    () => templates.map((tpl) => ({ id: tpl.id, label: tpl.label })),
    [templates]
  );

  const columns: Column<School>[] = useMemo(
    () => [
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
    [dirtyMap, onDeleteRow, onResetRow, onSaveRow, templateOptions, savingRowId, validationMap]
  );

  return (
    <div className="border rounded-xl overflow-hidden" style={{ height: '70vh' }}>
      <DataGrid
        className="rdg-light"
        columns={columns}
        rows={rows}
        onRowsChange={onRowsChange}
        rowKeyGetter={(row: School) => row.id}
        defaultColumnOptions={{ resizable: true }}
        rowClass={(row: School) => (validationMap[row.id]?.length ? 'bg-red-50/60' : undefined)}
      />
    </div>
  );
}


