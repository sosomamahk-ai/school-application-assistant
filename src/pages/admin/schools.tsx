import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useTranslation } from '@/contexts/TranslationContext';
import { Search, PlusCircle, RefreshCw } from 'lucide-react';
import BulkPasteModal from '@/components/admin/schools/BulkPasteModal';
import SchoolGrid from '@/components/admin/schools/SchoolGrid';
import type { School as GridSchool, TemplateOption } from '@/components/admin/schools/types';

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

export default function AdminSchoolsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<GridSchool[]>([]);
  const [originalRows, setOriginalRows] = useState<Record<string, GridSchool>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

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
      const mapped: GridSchool[] = (data.schools || []).map((school: ApiSchool) => ({
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
      }));
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

  const handleRowsChange = (nextRows: GridSchool[], data: any) => {
    setSchools(nextRows);
    const row = nextRows[data.indexes[0]];
    if (!row) return;
    const original = originalRows[row.id];
    const isDirty = JSON.stringify(original) !== JSON.stringify(row);
    setDirtyMap((prev) => ({ ...prev, [row.id]: isDirty }));
  };

  const handleSaveRow = async (row: GridSchool) => {
    setSavingRowId(row.id);
    try {
      const response = await fetch('/api/admin/schools', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(row)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || '保存失败');
        return;
      }
      const updatedRow = (await response.json()).school as ApiSchool;
      setSchools((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                id: updatedRow.id,
                name: updatedRow.name,
                shortName: updatedRow.shortName,
                templateId: updatedRow.templateId,
                applicationStart: updatedRow.applicationStart || '',
                applicationEnd: updatedRow.applicationEnd || '',
                interviewTime: updatedRow.interviewTime || '',
                examTime: updatedRow.examTime || '',
                resultTime: updatedRow.resultTime || '',
                officialLink: updatedRow.officialLink || '',
                notes: updatedRow.notes || ''
              }
            : item
        )
      );
      setOriginalRows((prev) => ({ ...prev, [row.id]: row }));
      setDirtyMap((prev) => ({ ...prev, [row.id]: false }));
    } catch (error) {
      console.error(error);
      alert('保存失败');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleResetRow = (rowId: string) => {
    const original = originalRows[rowId];
    if (!original) return;
    setSchools((prev) => prev.map((row) => (row.id === rowId ? { ...original } : row)));
    setDirtyMap((prev) => ({ ...prev, [rowId]: false }));
  };

  const handleBulkImport = async (rows: any[]) => {
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

  return (
    <>
      <Head>
        <title>学校映射管理 - {t('common.appName')}</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">可申请学校管理</h1>
              <p className="text-gray-500 mt-1">Excel 风格录入，快速批量导入 + 模版映射</p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
              <button
                onClick={() => fetchSchools()}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>刷新</span>
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <PlusCircle className="h-5 w-5" />
                <span>批量粘贴导入</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索学校名称或模板 ID"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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
                savingRowId={savingRowId}
              />
            )}
          </div>
        </div>
      </Layout>

      <BulkPasteModal
        open={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onSubmit={handleBulkImport}
      />
    </>
  );
}


