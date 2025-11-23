import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useTranslation } from '@/contexts/TranslationContext';
import { Search, PlusCircle, RefreshCw, Save, AlertCircle, X } from 'lucide-react';
import type { RowsChangeData } from 'react-data-grid';
import BulkImportPanel from '@/components/admin/schools/BulkPasteModal';
import SchoolGrid from '@/components/admin/schools/SchoolGrid';
import type { RowValidationMap, School as GridSchool, TemplateOption } from '@/components/admin/schools/types';
import type { AdminSchoolPayload } from '@/utils/admin/schoolImport';
import { useWordPressSchools } from '@/hooks/useWordPressSchools';
import WordPressSchoolSelect from '@/components/wordpress/WordPressSchoolSelect';
import WordPressSchoolInfoCard from '@/components/wordpress/WordPressSchoolInfoCard';
import type { WordPressSchool } from '@/types/wordpress';
import { matchWordPressSchoolFromTemplate } from '@/services/wordpressSchoolService';

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
  template?: {
    id: string;
    schoolId: string;
    schoolName: string | Record<string, string>;
    program: string;
    category?: string | null;
  };
}

interface ApiTemplate {
  id: string;
  schoolId: string;
  schoolName: string | Record<string, string>;
  program: string;
  category?: string | null;
  description?: string | null;
}

const buildWordPressKey = (id?: number | null, type?: WordPressSchool['type'] | null) =>
  id ? `${type ?? 'profile'}-${id}` : null;

const mapApiSchool = (
  school: ApiSchool,
  templateWordPressMap: Map<string, WordPressSchool | null>,
  wordpressSchools: WordPressSchool[],
  wpSchoolIndex: Map<string, WordPressSchool>
): GridSchool => {
  let matched: WordPressSchool | null = null;
  let wordpressSchoolId: number | null = null;
  let wordpressSchoolType: 'profile' | 'university' | null = null;
  
  // 策略 1: 优先从 templateWordPressMap 获取（如果模板已经匹配过）
  matched = templateWordPressMap.get(school.templateId) ?? null;
  if (matched) {
    wordpressSchoolId = matched.id;
    wordpressSchoolType = matched.type;
  }
  
  // 策略 2: 如果 map 中没有，尝试从 template.schoolId 解析 WordPress 绑定信息
  // 绑定信息存储在 template.schoolId 中（格式：wp-profile-123 或 profile-123）
  // 这样可以保留已经绑定好的学校，即使 WordPress 数据还没加载完
  if (!matched && school.template?.schoolId) {
    const parsed = (() => {
      const pattern = /^(?:wp-)?(profile|university)[-_]?(\d+)$/i;
      const matched = school.template.schoolId.trim().match(pattern);
      if (matched) {
        return {
          type: matched[1].toLowerCase() as 'profile' | 'university',
          id: Number(matched[2])
        };
      }
      return null;
    })();
    
    if (parsed) {
      // 先保存绑定信息（即使找不到 WordPress 学校对象，也要保留 ID）
      wordpressSchoolId = parsed.id;
      wordpressSchoolType = parsed.type;
      
      // 然后尝试从已加载的 WordPress 数据中查找对象
      const key = `${parsed.type}-${parsed.id}`;
      matched = wpSchoolIndex.get(key) ?? null;
      
      // 如果索引中没有，但 WordPress 数据已加载，尝试查找
      if (!matched && wordpressSchools.length > 0) {
        matched = wordpressSchools.find(
          (wp) => wp.id === parsed.id && wp.type === parsed.type
        ) ?? null;
      }
    }
  }
  
  // 注意：这里不进行名称匹配，因为已经绑定好的学校应该通过 schoolId 找到
  // 名称匹配只在 templates 的 useMemo 中进行（用于显示模板选项）
  // 这样可以避免每次进入页面都重新搜索，减少服务器压力
  
  return {
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
    notes: school.notes || '',
    wordpressSchoolId,
    wordpressSchoolType
  };
};

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
  const {
    data: wordpressData,
    loading: wordpressLoading,
    error: wordpressError,
    refetch: refetchWordPress
  } = useWordPressSchools();
  const wordpressSchools = useMemo(() => wordpressData?.all ?? [], [wordpressData]);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<GridSchool[]>([]);
  const [originalRows, setOriginalRows] = useState<Record<string, GridSchool>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [templateRecords, setTemplateRecords] = useState<ApiTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [activeWordPressRowId, setActiveWordPressRowId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const templates = useMemo<TemplateOption[]>(() => {
    // 创建 WordPress 学校索引，提高查找效率（O(1) 查找）
    const wpSchoolIndex = new Map<string, WordPressSchool>();
    wordpressSchools.forEach((school) => {
      wpSchoolIndex.set(`${school.type}-${school.id}`, school);
    });

    return templateRecords.map((tpl) => {
      // 优化：如果 schoolId 已经包含 WordPress 绑定信息，直接查找，避免名称匹配
      let wordpressSchool: WordPressSchool | null = null;
      
      if (tpl.schoolId) {
        // 尝试解析 WordPress ID（格式：wp-profile-123 或 profile-123）
        const parsed = (() => {
          const pattern = /^(?:wp-)?(profile|university)[-_]?(\d+)$/i;
          const matched = tpl.schoolId.trim().match(pattern);
          if (matched) {
            return {
              type: matched[1].toLowerCase() as 'profile' | 'university',
              id: Number(matched[2])
            };
          }
          return null;
        })();
        
        if (parsed) {
          // 直接从索引中查找，O(1) 时间复杂度
          const key = `${parsed.type}-${parsed.id}`;
          wordpressSchool = wpSchoolIndex.get(key) ?? null;
        }
      }
      
      // 如果没有找到绑定，且 WordPress 学校数据已加载，才进行名称匹配
      // 这样可以避免每次重新进入页面时都重新搜索
      if (!wordpressSchool && wordpressSchools.length > 0) {
        wordpressSchool = matchWordPressSchoolFromTemplate(
          { schoolId: tpl.schoolId, schoolName: tpl.schoolName },
          wordpressSchools
        );
      }
      
      return {
        id: tpl.id,
        label: `${tpl.schoolId} ｜ ${tpl.program}`,
        schoolId: tpl.schoolId,
        schoolName: typeof tpl.schoolName === 'string'
          ? tpl.schoolName
          : tpl.schoolName?.['zh-CN'] ||
            tpl.schoolName?.['zh'] ||
            tpl.schoolName?.['en'] ||
            '',
        program: tpl.program,
        category: tpl.category,
        wordpressSchool: wordpressSchool ?? undefined
      };
    });
  }, [templateRecords, wordpressSchools]);

  const templateWordPressMap = useMemo(() => {
    const map = new Map<string, WordPressSchool | null>();
    templates.forEach((tpl) => {
      map.set(tpl.id, tpl.wordpressSchool ?? null);
    });
    return map;
  }, [templates]);

  const templateIdSet = useMemo(() => new Set(templates.map((tpl) => tpl.id)), [templates]);

  const wordpressIndexByKey = useMemo(() => {
    const map = new Map<string, WordPressSchool>();
    wordpressSchools.forEach((school) => {
      map.set(`${school.type}-${school.id}`, school);
    });
    return map;
  }, [wordpressSchools]);

  const fetchTemplates = useCallback(async () => {
    const response = await fetch('/api/admin/templates', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setTemplateRecords(data.templates || []);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
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
      if (!response.ok) {
        let errorMessage = `加载失败：HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `加载失败：${response.statusText || `HTTP ${response.status}`}`;
        }
        setFetchError(errorMessage);
        console.error('Failed to fetch schools:', errorMessage);
        return;
      }
      const data = await response.json();
      if (!data.success) {
        const errorMessage = data.error || '加载失败：未知错误';
        setFetchError(errorMessage);
        console.error('API returned error:', errorMessage);
        return;
      }
      
      // 创建 WordPress 学校索引（用于快速查找）
      const wpSchoolIndex = new Map<string, WordPressSchool>();
      wordpressSchools.forEach((school) => {
        wpSchoolIndex.set(`${school.type}-${school.id}`, school);
      });
      
      const mapped: GridSchool[] = (data.schools || []).map((item: ApiSchool) =>
        mapApiSchool(item, templateWordPressMap, wordpressSchools, wpSchoolIndex)
      );
      const original: Record<string, GridSchool> = {};
      mapped.forEach((row) => {
        original[row.id] = { ...row };
      });
      setOriginalRows(original);
      setSchools(mapped);
      setDirtyMap({});
      setFetchError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载失败：网络错误';
      setFetchError(errorMessage);
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  }, [router, searchTerm, templateWordPressMap, wordpressSchools]);

  useEffect(() => {
    const tokenInStorage = localStorage.getItem('token');
    if (!tokenInStorage) {
      router.push('/auth/login');
      return;
    }
    // 首次加载时，并行执行模板和学校数据加载，减少等待时间
    const isInitialLoad = searchTerm === '';
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isInitialLoad) {
      // 首次加载：并行执行，不等待
      Promise.all([fetchTemplates(), fetchSchools()]).catch((error) => {
        console.error('Error loading initial data:', error);
      });
    } else {
      // 搜索时：只加载模板（如果还没加载），学校数据使用 debounce
      fetchTemplates();
      timeoutId = setTimeout(() => {
        fetchSchools();
      }, 150);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchTemplates, fetchSchools, router, searchTerm]);

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

  const applyWordPressToRow = useCallback(
    (row: GridSchool, wpSchool: WordPressSchool | null): GridSchool => {
      if (!wpSchool) {
        return {
          ...row,
          wordpressSchoolId: null,
          wordpressSchoolType: null
        };
      }
      const matchedTemplate = templates.find(
        (tpl) =>
          tpl.wordpressSchool &&
          tpl.wordpressSchool.id === wpSchool.id &&
          tpl.wordpressSchool.type === wpSchool.type
      );
      return {
        ...row,
        wordpressSchoolId: wpSchool.id,
        wordpressSchoolType: wpSchool.type,
        name: wpSchool.title,
        shortName: row.shortName || wpSchool.acf?.short_name || row.shortName,
        officialLink: wpSchool.acf?.website || wpSchool.url || row.officialLink,
        templateId: matchedTemplate ? matchedTemplate.id : row.templateId
      };
    },
    [templates]
  );

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

  const handleWordPressSelection = useCallback(
    (selection: WordPressSchool | null) => {
      if (!activeWordPressRowId) {
        setActiveWordPressRowId(null);
        return;
      }
      setSchools((prev) =>
        prev.map((row) => {
          if (row.id !== activeWordPressRowId) return row;
          return applyWordPressToRow(row, selection);
        })
      );
      setDirtyMap((prev) => ({ ...prev, [activeWordPressRowId]: true }));
      setActiveWordPressRowId(null);
    },
    [activeWordPressRowId, applyWordPressToRow]
  );

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
        const responseData = await response.json();
        const updatedSchool = responseData.school as ApiSchool;
        
        // 创建 WordPress 学校索引（用于快速查找）
        const wpSchoolIndex = new Map<string, WordPressSchool>();
        wordpressSchools.forEach((school) => {
          wpSchoolIndex.set(`${school.type}-${school.id}`, school);
        });
        
        // 如果 API 返回的数据没有 template 信息，保留原有的绑定信息
        // 这样可以避免保存后绑定信息丢失
        const updatedRow = mapApiSchool(updatedSchool, templateWordPressMap, wordpressSchools, wpSchoolIndex);
        
        // 如果更新后的行丢失了绑定信息，但原行有绑定信息，保留原行的绑定信息
        const originalRow = originalRows[row.id];
        if (originalRow && 
            originalRow.wordpressSchoolId && 
            originalRow.wordpressSchoolType &&
            (!updatedRow.wordpressSchoolId || !updatedRow.wordpressSchoolType)) {
          // 保留原有的绑定信息
          updatedRow.wordpressSchoolId = originalRow.wordpressSchoolId;
          updatedRow.wordpressSchoolType = originalRow.wordpressSchoolType;
        }
        
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
    [fetchSchools, validateRow, templateWordPressMap, wordpressSchools, originalRows]
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
      isNew: true,
      wordpressSchoolId: null,
      wordpressSchoolType: null
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
  const activeRow = useMemo(
    () => schools.find((row) => row.id === activeWordPressRowId) ?? null,
    [activeWordPressRowId, schools]
  );
  const activeWordPressKey = activeRow
    ? buildWordPressKey(activeRow.wordpressSchoolId, activeRow.wordpressSchoolType)
    : null;
  const activeWordPressSchool: WordPressSchool | null = activeWordPressKey
    ? wordpressIndexByKey.get(activeWordPressKey) ?? null
    : null;

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

          {(wordpressLoading || wordpressError) && (
            <div
              className={clsx(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm',
                wordpressError
                  ? 'border border-red-100 bg-red-50 text-red-600'
                  : 'border border-primary-100 bg-primary-50 text-primary-700'
              )}
            >
              <AlertCircle className="h-4 w-4" />
              {wordpressError ? (
                <>
                  WordPress 学校数据加载失败：{wordpressError}
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => refetchWordPress()}
                  >
                    重试
                  </button>
                </>
              ) : (
                '正在同步 WordPress 学校数据...'
              )}
            </div>
          )}

          {fetchError && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm border border-red-100 bg-red-50 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>学校数据加载失败：{fetchError}</span>
              <button
                type="button"
                className="text-xs underline ml-auto"
                onClick={() => fetchSchools()}
              >
                重试
              </button>
            </div>
          )}

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

              <div className="bg-white border rounded-3xl shadow-sm p-4 space-y-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">逐行管理模式</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
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
                      wordpressSchools={wordpressSchools}
                      onRowsChange={handleRowsChange}
                      dirtyMap={dirtyMap}
                      onSaveRow={handleSaveRow}
                      onResetRow={handleResetRow}
                      onDeleteRow={handleDeleteRow}
                      savingRowId={savingRowId}
                      validationMap={validationMap}
                      onRequestWordPressBinding={(row) => setActiveWordPressRowId(row.id)}
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
      {activeRow && (
        <WordPressPickerModal
          row={activeRow}
          current={activeWordPressSchool}
          schools={wordpressSchools}
          loading={wordpressLoading}
          error={wordpressError}
          onClose={() => setActiveWordPressRowId(null)}
          onSelect={handleWordPressSelection}
        />
      )}
    </>
  );
}

interface WordPressPickerModalProps {
  row: GridSchool;
  current: WordPressSchool | null;
  schools: WordPressSchool[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (selection: WordPressSchool | null) => void;
}

function WordPressPickerModal({
  row,
  current,
  schools,
  loading,
  error,
  onClose,
  onSelect
}: WordPressPickerModalProps) {
  const [selected, setSelected] = useState<WordPressSchool | null>(current ?? null);

  useEffect(() => {
    setSelected(current ?? null);
  }, [current]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">绑定 WordPress 学校</h3>
            <p className="text-sm text-gray-500">
              当前行：{row.name || '未命名'}（模板 ID：{row.templateId || '未选择'}）
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          <WordPressSchoolSelect
            value={selected}
            onChange={setSelected}
            schools={schools}
            loading={loading}
            error={error}
          />
        </div>

        <div className="mt-6">
          <WordPressSchoolInfoCard school={selected} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm text-gray-500 underline"
            onClick={() => {
              setSelected(null);
              onSelect(null);
            }}
          >
            解除绑定
          </button>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                onSelect(selected);
              }}
            >
              绑定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


