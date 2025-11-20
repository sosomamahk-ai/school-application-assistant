/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Search, XCircle, ExternalLink } from 'lucide-react';
import type { WordPressSchool } from '@/types/wordpress';
import { WORDPRESS_SCHOOL_CATEGORIES } from '@/types/wordpress';
import { useWordPressSchools } from '@/hooks/useWordPressSchools';

interface WordPressSchoolSelectProps {
  value?: WordPressSchool | null;
  onChange?: (school: WordPressSchool | null) => void;
  schools?: WordPressSchool[];
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_PLACEHOLDER = '从 WordPress 学校库中选择';

export default function WordPressSchoolSelect({
  value = null,
  onChange,
  schools: providedSchools,
  loading: loadingProp,
  error: errorProp,
  placeholder = DEFAULT_PLACEHOLDER,
  allowClear = true,
  className,
  disabled
}: WordPressSchoolSelectProps) {
  const shouldAutoFetch = !providedSchools;
  const { data, loading: hookLoading, error: hookError, refetch } = useWordPressSchools({
    autoFetch: shouldAutoFetch
  });

  const schools = useMemo(() => providedSchools ?? data?.all ?? [], [providedSchools, data]);
  const loading = loadingProp ?? hookLoading;
  const error = errorProp ?? hookError;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const target = event.target as Node;
      if (containerRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filteredSchools = useMemo(() => {
    if (!search.trim()) {
      return schools;
    }
    const keyword = search.trim().toLowerCase();
    return schools.filter((school) => {
      const tokens = [
        school.title,
        school.category,
        school.acf?.district,
        school.acf?.curriculum,
        school.acf?.website
      ]
        .filter(Boolean)
        .map((token) => String(token).toLowerCase());
      return tokens.some((token) => token.includes(keyword));
    });
  }, [schools, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, WordPressSchool[]>();
    filteredSchools.forEach((school) => {
      const key = school.category || '其他';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(school);
    });
    WORDPRESS_SCHOOL_CATEGORIES.forEach((category) => {
      if (groups.has(category)) {
        groups.set(
          category,
          groups.get(category)!.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
        );
      }
    });
    return groups;
  }, [filteredSchools]);

  const orderedCategories = [
    ...WORDPRESS_SCHOOL_CATEGORIES.filter((category) => grouped.has(category)),
    ...Array.from(grouped.keys()).filter((key) => !WORDPRESS_SCHOOL_CATEGORIES.includes(key as any))
  ];

  const handleSelect = (school: WordPressSchool) => {
    onChange?.(school);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.(null);
  };

  const renderSchoolItem = (school: WordPressSchool) => {
    const isActive = value?.id === school.id;
    return (
      <button
        key={school.id}
        type="button"
        className={clsx(
          'w-full rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-primary-200 hover:bg-primary-50',
          isActive && 'border-primary-300 bg-primary-50'
        )}
        onClick={() => handleSelect(school)}
      >
        <div className="flex items-center gap-3">
          <Avatar school={school} size={36} />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span>{school.title}</span>
              <CategoryBadge category={school.category} />
            </div>
            <div className="text-xs text-gray-500">
              {[school.acf?.district, school.acf?.curriculum].filter(Boolean).join(' · ')}
            </div>
          </div>
          {school.url && (
            <a
              href={school.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary-500"
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        className={clsx(
          'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left shadow-sm transition',
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : 'border-gray-200 bg-white hover:border-primary-300',
          open && 'border-primary-400 ring-2 ring-primary-100'
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          if (!schools.length && !loading) {
            void refetch();
          }
        }}
      >
        <div className="flex items-center gap-3">
          {value ? (
            <>
              <Avatar school={value} size={40} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{value.title}</p>
                <p className="text-xs text-gray-500">
                  {[value.category, value.acf?.district].filter(Boolean).join(' · ') || '未提供地区'}
                </p>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowClear && value && (
            <button
              type="button"
              className="text-gray-400 hover:text-red-500"
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
          <span className="text-xs text-gray-400">{open ? '收起' : '展开'}</span>
        </div>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="搜索学校、课程或地区"
              autoFocus
            />
          </div>

          {loading && (
            <div className="py-6 text-center text-sm text-gray-500">正在加载 WordPress 数据...</div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              加载失败：{error}
              <button
                type="button"
                className="ml-2 text-xs underline"
                onClick={() => refetch()}
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
              {orderedCategories.length === 0 && (
                <div className="py-6 text-center text-sm text-gray-500">没有找到匹配的学校</div>
              )}

              {orderedCategories.map((category) => {
                const items = grouped.get(category) ?? [];
                if (!items.length) return null;
                return (
                  <div key={category}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {category}
                    </p>
                    <div className="space-y-2">{items.map((school) => renderSchoolItem(school))}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Avatar = ({ school, size }: { school: WordPressSchool; size: number }) => {
  if (school.logo) {
    return (
      <img
        src={school.logo}
        alt={`${school.title} logo`}
        className="rounded-xl border border-gray-100 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 font-semibold"
      style={{ width: size, height: size }}
    >
      {school.title.charAt(0).toUpperCase()}
    </div>
  );
};

const CategoryBadge = ({ category }: { category?: string }) => {
  if (!category) return null;
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{category}</span>;
};


