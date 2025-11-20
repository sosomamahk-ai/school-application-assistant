import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useTranslation } from '@/contexts/TranslationContext';
import { Search, PlusCircle, RefreshCw, Save } from 'lucide-react';
import type { RowsChangeData } from 'react-data-grid';
import BulkImportPanel from '@/components/admin/schools/BulkPasteModal';
import SchoolGrid from '@/components/admin/schools/SchoolGrid';
import type { RowValidationMap, School as GridSchool, TemplateOption } from '@/components/admin/schools/types';
import type { AdminSchoolPayload } from '@/utils/admin/schoolImport';

interface ApiSchool {
  id: string;
  name: string;
  shortName: string | null;
  templateId: string;
  applicationStart: string | null;
  applicationEnd: string | null;
  interviewTime: string | null;
  examTime: string | null;
  resultTime: string | null;
  officialLink: string | null;
  notes: string | null;
}

const mapApiSchool = (school: ApiSchool): GridSchool => ({
  id: school.id,
  name: school.name,
  shortName: school.shortName,
  templateId: school.templateId,
  applicationStart: school.applicationStart || '',
  applicationEnd: school.applicationEnd || '',
  interviewTime: school.interviewTime || '',
  examTime: school.examTime || '',
  resultTime: school.resultTime || '',
  officialLink: school.officialLink || '',
  notes: school.notes || ''
});

const DATE_FIELDS: Array<{ key: keyof GridSchool; label: string }> = [
  { key: 'applicationStart', label: '开始申请' },
  { key: 'applicationEnd', label: '截止日期' },
  { key: 'interviewTime', label: '面试时间' },
  { key: 'examTime', label: '笔试时间' },
  { key: 'resultTime', label: '录取结果时间' }
];

export default function AdminSchoolsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<GridSchool[]>([]);
  const [originalRows, setOriginalRows] = useState<Record<string, GridSchool>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');

  const fetchTemplates = useCallback(async () => {
    const response = await fetch('/api/admin/templates', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setTemplates(
        (data.templates || []).map((tpl: any) => ({
          id: tpl.id,
          label: `${tpl.schoolId} ｜ ${tpl.program}`
        }))
      );
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await fetch(`/api/admin/schools?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }
      const data = await response.json();
      const mapped: GridSchool[] = (data.schools || []).map(mapApiSchool);
      const original: Record<string, GridSchool> = {};
      mapped.forEach((row) => {
        original[row.id] = { ...row };
      });
      setOriginalRows(original);
      setSchools(mapped);
      setDirtyMap({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [router, searchTerm]);

  useEffect(() => {
    const tokenInStorage = localStorage.getItem('token');
    if (!tokenInStorage) {
      router.push('/auth/login');
      return;
    }
    fetchTemplates();
  }, [fetchTemplates, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSchools();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchSchools]);

  const templateIdSet = useMemo(() => new Set(templates.map((tpl) => tpl.id)), [templates]);

  const validateRow = useCallback(
    (row: GridSchool) => {
      const errors: string[] = [];
      if (!row.name?.trim()) {
        errors.push('学校名称必填');
      }
      if (!row.templateId) {
        errors.push('请选择模版');
      } else if (!templateIdSet.has(row.templateId)) {
        errors.push('模版 ID 无效，请重新选择');
      }

      DATE_FIELDS.forEach(({ key, label }) => {
        const value = row[key];
        if (!value) return;
        const parsed = new Date(value as string);
        if (Number.isNaN(parsed.getTime())) {
          errors.push(`${label}格式错误`);
        }
      });

      return errors;
    },
    [templateIdSet]
  );

  const validationMap = useMemo<RowValidationMap>(() => {
    const map: RowValidationMap = {};
    schools.forEach((row) => {
      const errors = validateRow(row);
      if (errors.length) {
        map[row.id] = errors;
      }
    });
    return map;
  }, [schools, validateRow]);

  const handleRowsChange = (nextRows: GridSchool[], data: RowsChangeData<GridSchool>) => {
    setSchools(nextRows);
    const indexes = data?.indexes || [];
    setDirtyMap((prev) => {
      const next = { ...prev };
      indexes.forEach((idx) => {
        const row = nextRows[idx];
        if (!row) return;
        const original = originalRows[row.id];
        const isDirty = original ? JSON.stringify(original) !== JSON.stringify(row) : true;
        next[row.id] = isDirty;
      });
      return next;
    });
  };

  const buildRowPayload = (row: GridSchool): AdminSchoolPayload => ({
    templateId: row.templateId,
    name: row.name?.trim() || undefined,
    shortName: row.shortName?.trim() || undefined,
    applicationStart: row.applicationStart || undefined,
    applicationEnd: row.applicationEnd || undefined,
    interviewTime: row.interviewTime || undefined,
    examTime: row.examTime || undefined,
    resultTime: row.resultTime || undefined,
    officialLink: row.officialLink?.trim() || undefined,
    notes: row.notes?.trim() || undefined
  });

  const saveRow = useCallback(
    async (row: GridSchool, options?: { silent?: boolean }) => {
      const errors = validateRow(row);
      if (errors.length) {
        if (!options?.silent) {
          alert(`请先修复以下问题：\n${errors.join('\n')}`);
        }
        return false;
      }

      if (!options?.silent) {
        setSavingRowId(row.id);
      }

      const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      try {
        if (row.id.startsWith('temp-')) {
          const response = await fetch('/api/admin/schools', {
            method: 'POST',
            headers,
            body: JSON.stringify({ rows: [buildRowPayload(row)] })
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            if (!options?.silent) {
              alert(data.error || '新增失败');
            }
            return false;
          }
          await fetchSchools();
          return true;
        }

        const response = await fetch('/api/admin/schools', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ ...buildRowPayload(row), id: row.id })
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (!options?.silent) {
            alert(data.error || '保存失败');
          }
          return false;
        }
        const updatedRow = mapApiSchool((await response.json()).school as ApiSchool);
        setSchools((prev) => prev.map((item) => (item.id === row.id ? updatedRow : item)));
        setOriginalRows((prev) => ({ ...prev, [row.id]: updatedRow }));
        setDirtyMap((prev) => ({ ...prev, [row.id]: false }));
        return true;
      } catch (error) {
        console.error(error);
        if (!options?.silent) {
          alert('保存失败，请稍后再试');
        }
        return false;
      } finally {
        if (!options?.silent) {
          setSavingRowId(null);
        }
      }
    },
    [fetchSchools, validateRow]
  );

  const handleSaveRow = async (row: GridSchool) => {
    await saveRow(row);
  };

  const handleSaveAll = async () => {
    const dirtyRows = schools.filter((row) => row.id.startsWith('temp-') || dirtyMap[row.id]);
    if (!dirtyRows.length) return;
    setSavingAll(true);
    try {
      for (const row of dirtyRows) {
        const success = await saveRow(row, { silent: true });
        if (!success) {
          setSavingAll(false);
          return;
        }
      }
    } finally {
      setSavingAll(false);
    }
  };

  const handleResetRow = (rowId: string) => {
    if (rowId.startsWith('temp-')) {
      setSchools((prev) => prev.filter((row) => row.id !== rowId));
      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
      return;
    }

    const original = originalRows[rowId];
    if (!original) return;
    setSchools((prev) => prev.map((row) => (row.id === rowId ? { ...original } : row)));
    setDirtyMap((prev) => ({ ...prev, [rowId]: false }));
  };

  const handleBulkImport = async (rows: AdminSchoolPayload[]) => {
    const response = await fetch('/api/admin/schools', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rows })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || '导入失败');
    }
    await fetchSchools();
  };

  const handleAddRow = () => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newRow: GridSchool = {
      id: tempId,
      name: '',
      shortName: '',
      templateId: '',
      applicationStart: '',
      applicationEnd: '',
      interviewTime: '',
      examTime: '',
      resultTime: '',
      officialLink: '',
      notes: '',
      isNew: true
    };
    setSchools((prev) => [newRow, ...prev]);
    setDirtyMap((prev) => ({ ...prev, [tempId]: true }));
  };

  const handleDeleteRow = async (row: GridSchool) => {
    if (row.id.startsWith('temp-')) {
      setSchools((prev) => prev.filter((item) => item.id !== row.id));
      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }

    const confirmed = window.confirm(`确认删除「${row.name || row.shortName || '该学校'}」映射吗？`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/schools', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: row.id })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || '删除失败');
        return;
      }
      setSchools((prev) => prev.filter((item) => item.id !== row.id));
      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setOriginalRows((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert('删除失败，请稍后再试');
    }
  };

  const dirtyRows = schools.filter((row) => row.id.startsWith('temp-') || dirtyMap[row.id]);
  const dirtyCount = dirtyRows.length;
  const hasBlockingErrors = dirtyRows.some((row) => validationMap[row.id]?.length);

  return (
    <>
      <Head>
        <title>学校映射管理 - {t('common.appName')}</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-primary-600 font-semibold uppercase tracking-wide">
                学校映射管理中心
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">可申请学校管理</h1>
              <p className="text-gray-500 mt-1">
                支持批量导入与逐行管理，选择官方模版并同步申请时间。
              </p>
            </div>
            <div className="inline-flex bg-gray-100 rounded-full p-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium ${
                  activeTab === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                逐行管理
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium ${
                  activeTab === 'bulk' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                批量导入
              </button>
            </div>
          </div>

          {activeTab === 'manual' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索学校名称或模板 ID"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => fetchSchools()} className="btn-secondary flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    刷新数据
                  </button>
                  <button onClick={handleAddRow} className="btn-secondary flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    新增映射
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={!dirtyCount || savingAll || hasBlockingErrors}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {savingAll ? '保存中...' : `保存全部 (${dirtyCount})`}
                  </button>
                </div>
              </div>

              <div className="bg-white border rounded-3xl shadow-sm p-6 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">逐行管理模式</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      在表格中直接编辑字段，支持 inline 保存 / 重置 / 删除。
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {dirtyCount > 0 ? (
                      <span className="text-primary-600 font-medium">
                        {dirtyCount} 行尚未保存 {hasBlockingErrors ? '（存在校验错误）' : ''}
                      </span>
                    ) : (
                      '所有更改已同步'
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
                  ) : (
                    <SchoolGrid
                      rows={schools}
                      templates={templates}
                      onRowsChange={handleRowsChange}
                      dirtyMap={dirtyMap}
                      onSaveRow={handleSaveRow}
                      onResetRow={handleResetRow}
                      onDeleteRow={handleDeleteRow}
                      savingRowId={savingRowId}
                      validationMap={validationMap}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <BulkImportPanel templates={templates} onSubmit={handleBulkImport} />
          )}
        </div>
      </Layout>
    </>
  );
}


