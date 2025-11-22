interface School {
  id: string;
  category?: string | null;
  [key: string]: any;
}

interface SchoolCategorySummaryProps {
  schools: School[];
  selectedCategory?: string | null;
  onCategorySelect?: (category: string | null) => void;
}

// 种类映射
const categoryMap: Record<string, string> = {
  '国际学校': 'international',
  '香港本地中学': 'hkSecondary',
  '香港本地小学': 'hkPrimary',
  '香港幼稚园': 'hkKindergarten',
  '幼稚园': 'hkKindergarten',
  '大学': 'university',
};

// 种类显示顺序
const categoryOrder = ['international', 'hkSecondary', 'hkPrimary', 'hkKindergarten', 'university'];

// 种类标签映射（中文）
const categoryLabels: Record<string, string> = {
  'international': '国际学校',
  'hkSecondary': '本地中学',
  'hkPrimary': '本地小学',
  'hkKindergarten': '幼稚园',
  'university': '大学',
};

export default function SchoolCategorySummary({ 
  schools, 
  selectedCategory,
  onCategorySelect
}: SchoolCategorySummaryProps) {
  // 按学校种类分组统计
  const categoryStats = schools.reduce((acc, school) => {
    const category = school.category || '国际学校';
    const categoryKey = categoryMap[category] || 'international';
    
    if (!acc[categoryKey]) {
      acc[categoryKey] = {
        key: categoryKey,
        originalCategory: category,
        count: 0
      };
    }
    acc[categoryKey].count++;
    return acc;
  }, {} as Record<string, { key: string; originalCategory: string; count: number }>);

  // 转换为数组，按预定义顺序排序，并过滤掉数量为0的
  const categoryList = categoryOrder
    .map(key => categoryStats[key])
    .filter(stat => stat && stat.count > 0)
    .map(stat => ({
      ...stat,
      label: categoryLabels[stat.key] || stat.originalCategory
    }));

  if (categoryList.length === 0) {
    return null;
  }

  // 生成颜色类
  const colorClasses = [
    { bg: 'bg-blue-50', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
    { bg: 'bg-green-50', text: 'text-green-700', hover: 'hover:bg-green-100' },
    { bg: 'bg-purple-50', text: 'text-purple-700', hover: 'hover:bg-purple-100' },
    { bg: 'bg-orange-50', text: 'text-orange-700', hover: 'hover:bg-orange-100' },
    { bg: 'bg-teal-50', text: 'text-teal-700', hover: 'hover:bg-teal-100' }
  ];

  return (
    <>
      {categoryList.map((category, index) => {
        const isSelected = selectedCategory === category.key;
        const color = colorClasses[index % colorClasses.length];
        const selectedColor = isSelected ? 'ring-2 ring-offset-2 ring-primary-500' : '';
        
        return (
          <div
            key={category.key}
            onClick={() => onCategorySelect?.(isSelected ? null : category.key)}
            className={`${color.bg} ${color.text} ${color.hover} ${selectedColor} rounded-xl p-3 cursor-pointer transition-all duration-200 ${
              onCategorySelect ? '' : 'cursor-default'
            }`}
            title={category.label}
          >
            <div className="text-xs md:text-sm font-medium truncate mb-1" title={category.label}>
              {category.label}
            </div>
            <div className="text-xl md:text-2xl font-bold">{category.count}</div>
            <div className="text-xs text-gray-500 mt-0.5">所学校</div>
          </div>
        );
      })}
    </>
  );
}

