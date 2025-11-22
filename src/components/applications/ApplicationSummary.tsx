interface ApplicationSummaryProps {
  total: number;
  drafts: number;
  submitted: number;
  notified: number;
  examCompleted: number;
  interviewCompleted: number;
  round1: number;
  round2: number;
  round3: number;
  pendingResult: number;
  rejected: number;
  admitted: number;
  selectedFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

const cards = [
  { key: 'total', label: '总申请数量', color: 'bg-blue-50 text-blue-700', hoverColor: 'hover:bg-blue-100' },
  { key: 'drafts', label: '草稿', color: 'bg-gray-50 text-gray-600', hoverColor: 'hover:bg-gray-100' },
  { key: 'submitted', label: '已提交', color: 'bg-green-50 text-green-700', hoverColor: 'hover:bg-green-100' },
  { key: 'notified', label: '已通知', color: 'bg-teal-50 text-teal-700', hoverColor: 'hover:bg-teal-100' },
  { key: 'examCompleted', label: '已笔试', color: 'bg-purple-50 text-purple-700', hoverColor: 'hover:bg-purple-100' },
  { key: 'interviewCompleted', label: '已面试', color: 'bg-indigo-50 text-indigo-700', hoverColor: 'hover:bg-indigo-100' },
  { key: 'round1', label: '第一轮', color: 'bg-yellow-50 text-yellow-700', hoverColor: 'hover:bg-yellow-100' },
  { key: 'round2', label: '第二轮', color: 'bg-orange-50 text-orange-700', hoverColor: 'hover:bg-orange-100' },
  { key: 'round3', label: '第三轮', color: 'bg-red-50 text-red-700', hoverColor: 'hover:bg-red-100' },
  { key: 'pendingResult', label: '等待结果', color: 'bg-cyan-50 text-cyan-700', hoverColor: 'hover:bg-cyan-100' },
  { key: 'rejected', label: '已拒绝', color: 'bg-red-100 text-red-800', hoverColor: 'hover:bg-red-200' },
  { key: 'admitted', label: '已录取', color: 'bg-emerald-50 text-emerald-700', hoverColor: 'hover:bg-emerald-100' }
];

export default function ApplicationSummary({ selectedFilter, onFilterChange, ...stats }: ApplicationSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const isSelected = selectedFilter === card.key;
        const baseColor = card.color;
        const selectedColor = isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : '';
        
        return (
          <div
            key={card.key}
            onClick={() => onFilterChange?.(selectedFilter === card.key ? null : card.key)}
            className={`${baseColor} ${card.hoverColor} ${selectedColor} rounded-xl p-3 cursor-pointer transition-all duration-200 ${
              onFilterChange ? '' : 'cursor-default'
            }`}
          >
            <div className="text-xs md:text-sm">{card.label}</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{stats[card.key as keyof Omit<ApplicationSummaryProps, 'selectedFilter' | 'onFilterChange'>]}</div>
          </div>
        );
      })}
    </div>
  );
}


