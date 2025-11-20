/* eslint-disable @next/next/no-img-element */
import clsx from 'clsx';
import type { WordPressSchool } from '@/types/wordpress';

interface WordPressSchoolInfoCardProps {
  school?: WordPressSchool | null;
  variant?: 'full' | 'compact';
  className?: string;
  showAction?: boolean;
  actionLabel?: string;
}

const ESSENTIAL_KEYS = ['district', 'curriculum', 'tuitionFee', 'website', 'phone', 'grades'];

const formatTuitionFee = (value: unknown): string | null => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      maximumFractionDigits: 0
    }).format(value);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
};

const formatValue = (key: string, value: unknown): string | null => {
  if (value == null) return null;
  if (key === 'tuitionFee') {
    return formatTuitionFee(value);
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(' / ') || null;
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .filter((item) => typeof item === 'string')
      .join(' / ');
  }
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
};

const getInitial = (text?: string) => (text ? text.charAt(0).toUpperCase() : 'S');

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2 text-sm text-gray-600">
    <span className="text-gray-500">{label}：</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

export default function WordPressSchoolInfoCard({
  school,
  variant = 'full',
  className,
  showAction = true,
  actionLabel = '查看学校资料'
}: WordPressSchoolInfoCardProps) {
  if (!school) {
    return (
      <div
        className={clsx(
          'rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500',
          className
        )}
      >
        暂未绑定 WordPress 学校
      </div>
    );
  }

  const essentials = ESSENTIAL_KEYS.map((key) => {
    const value = formatValue(key, school.acf?.[key]);
    return value ? { key, label: keyMap[key] ?? key, value } : null;
  }).filter(Boolean) as Array<{ key: string; label: string; value: string }>;

  if (variant === 'compact') {
    return (
      <div className={clsx('flex items-center gap-3 rounded-xl border border-gray-200 p-3', className)}>
        <Avatar school={school} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span>{school.title}</span>
            <CategoryBadge category={school.category} />
          </div>
          <div className="text-xs text-gray-500">
            {[school.acf?.district, school.acf?.curriculum].filter(Boolean).join(' · ')}
          </div>
        </div>
        {showAction && school.url && (
          <a
            href={school.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            {actionLabel}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm bg-white', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Avatar school={school} size="lg" />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{school.title}</h3>
            <CategoryBadge category={school.category} />
          </div>
          <p className="text-sm text-gray-500">
            {[school.acf?.district, school.acf?.curriculum].filter(Boolean).join(' · ') || '暂无补充信息'}
          </p>
        </div>
        {showAction && school.url && (
          <a
            href={school.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100"
          >
            {actionLabel}
          </a>
        )}
      </div>

      {essentials.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {essentials.map((item) => (
            <InfoRow key={item.key} label={item.label} value={item.value} />
          ))}
        </div>
      )}
    </div>
  );
}

const keyMap: Record<string, string> = {
  district: '校区',
  curriculum: '课程体系',
  tuitionFee: '学费',
  website: '官网',
  phone: '电话',
  grades: '年级'
};

const Avatar = ({ school, size = 'md' }: { school: WordPressSchool; size?: 'md' | 'lg' }) => {
  const dimension = size === 'lg' ? 64 : 48;
  if (school.logo) {
    return (
      <img
        src={school.logo}
        alt={`${school.title} logo`}
        className="rounded-xl border border-gray-100 object-cover bg-white"
        style={{ width: dimension, height: dimension }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-primary-100 text-primary-600 font-semibold"
      style={{ width: dimension, height: dimension }}
    >
      {getInitial(school.title)}
    </div>
  );
};

const CategoryBadge = ({ category }: { category?: string }) => {
  if (!category) return null;
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
      {category}
    </span>
  );
};


