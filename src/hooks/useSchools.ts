import { useCallback, useEffect, useMemo, useState } from 'react';

export interface SchoolItem {
  id: string;
  templateId: string;
  templateSchoolId: string;
  name: string;
  schoolName: string | { [lang: string]: string };
  program: string;
  category?: string | null;
  campusLocation?: string | null;
  gradeRange?: string | null;
  applicationStart?: string | null;
  applicationEnd?: string | null;
  interviewTime?: string | null;
  examTime?: string | null;
  resultTime?: string | null;
  applicationMaterials?: string[];
  applicationRequirements?: string[];
  officialLink?: string | null;
  permalink?: string | null;
  applicationNotes?: string | null;
}

export type SchoolFilters = {
  search: string;
  category: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  international: '国际学校',
  hkSecondary: '香港本地中学',
  hkPrimary: '香港本地小学',
  hkKindergarten: '香港幼稚园',
  university: '大学'
};

export function useSchools() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SchoolFilters>({ search: '', category: 'all' });

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/schools');
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setSchools(data.schools || []);
    } catch (err) {
      console.error(err);
      setError('加载学校列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // 类别映射（用于筛选）
  const categoryKeyMap: Record<string, string> = {
    '国际学校': 'international',
    '香港本地中学': 'hkSecondary',
    '香港本地小学': 'hkPrimary',
    '香港幼稚园': 'hkKindergarten',
    '幼稚园': 'hkKindergarten',
    '大学': 'university',
  };

  const filteredSchools = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase();
    return schools.filter((school) => {
      if (filters.category !== 'all') {
        const schoolCategory = school.category || '国际学校';
        const schoolCategoryKey = categoryKeyMap[schoolCategory] || 'international';
        // 支持按类别key或原始类别值筛选
        if (schoolCategoryKey !== filters.category && schoolCategory !== filters.category) {
          return false;
        }
      }
      if (!searchLower) return true;
      const combined = [
        school.name,
        typeof school.schoolName === 'string'
          ? school.schoolName
          : Object.values(school.schoolName || {}).join(' '),
        school.program,
        school.templateSchoolId,
        school.campusLocation,
        school.gradeRange
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return combined.includes(searchLower);
    });
    // categoryKeyMap is a constant, no need to include in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, schools]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    schools.forEach((school) => {
      unique.add(school.category || 'international');
    });
    return Array.from(unique).sort();
  }, [schools]);

  const setSearch = (search: string) => setFilters((prev) => ({ ...prev, search }));
  const setCategory = (category: string) => setFilters((prev) => ({ ...prev, category }));

  return {
    loading,
    error,
    schools: filteredSchools,
    rawSchools: schools,
    filters,
    setSearch,
    setCategory,
    categories,
    categoryLabels: CATEGORY_LABELS
  };
}


