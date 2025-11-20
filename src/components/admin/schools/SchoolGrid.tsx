import { useMemo } from 'react';
import DataGrid, { Column, RowsChangeData } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import type { School, TemplateOption } from './types';

interface SchoolGridProps {
  rows: School[];
  templates: TemplateOption[];
  onRowsChange: (rows: School[], data: RowsChangeData<School>) => void;
  dirtyMap: Record<string, boolean>;
  onSaveRow: (row: School) => Promise<void>;
  onResetRow: (rowId: string) => void;
  savingRowId?: string | null;
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

export default function SchoolGrid({
  rows,
  templates,
  onRowsChange,
  dirtyMap,
  onSaveRow,
  onResetRow,
  savingRowId
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
      { key: 'applicationStart', name: '开始申请', editor: TextCellEditor, width: 160 },
      { key: 'applicationEnd', name: '截止日期', editor: TextCellEditor, width: 160 },
      { key: 'interviewTime', name: '面试时间', editor: TextCellEditor, width: 160 },
      { key: 'examTime', name: '笔试时间', editor: TextCellEditor, width: 160 },
      { key: 'resultTime', name: '录取结果时间', editor: TextCellEditor, width: 160 },
      { key: 'officialLink', name: '官网链接', editor: TextCellEditor, width: 240 },
      { key: 'notes', name: '备注', editor: TextCellEditor, width: 200 },
      {
        key: 'actions',
        name: '操作',
        width: 150,
        frozen: true,
        formatter: ({ row }: { row: School }) => {
          const isDirty = dirtyMap[row.id];
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSaveRow(row)}
                disabled={!isDirty || savingRowId === row.id}
                className="text-primary-600 disabled:text-gray-400"
              >
                <CheckCircle2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => onResetRow(row.id)}
                disabled={!isDirty}
                className="text-gray-400"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          );
        }
      }
    ],
    [dirtyMap, onResetRow, onSaveRow, templateOptions, savingRowId]
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
      />
    </div>
  );
}


