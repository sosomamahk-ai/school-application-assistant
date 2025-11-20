import { Search } from 'lucide-react';

interface SchoolFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  category: string;
  onCategory: (value: string) => void;
  categories: string[];
  categoryLabels: Record<string, string>;
}

export default function SchoolFilters({
  search,
  onSearch,
  category,
  onCategory,
  categories,
  categoryLabels
}: SchoolFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="搜索学校名称 / 模版 ID / 地区"
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategory('all')}
          className={`px-4 py-2 rounded-full text-sm ${
            category === 'all'
              ? 'bg-primary-500 text-white shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm ${
              category === cat
                ? 'bg-primary-500 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>
    </div>
  );
}


