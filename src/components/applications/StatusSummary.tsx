interface Application {
  id: string;
  status: string;
  [key: string]: any;
}

interface StatusSummaryProps {
  applications: Application[];
  selectedStatus?: string | null;
  onStatusSelect?: (status: string | null) => void;
}

const statusConfig = [
  { 
    key: 'draft', 
    label: '草稿', 
    color: { bg: 'bg-gray-100', text: 'text-gray-800', hover: 'hover:bg-gray-200', border: 'border border-gray-300' },
    filter: (app: Application) => !app.status || app.status === 'draft'
  },
  { 
    key: 'submitted', 
    label: '已提交', 
    color: { bg: 'bg-green-50', text: 'text-green-700', hover: 'hover:bg-green-100', border: '' },
    filter: (app: Application) => app.status === 'submitted'
  }
];

export default function StatusSummary({ 
  applications, 
  selectedStatus,
  onStatusSelect 
}: StatusSummaryProps) {
  // 计算各状态的申请数量
  const statusStats = statusConfig.map(config => ({
    ...config,
    count: applications.filter(config.filter).length
  }));

  if (applications.length === 0) {
    return null;
  }

  return (
    <>
      {statusStats.map((stat) => {
        const isSelected = selectedStatus === stat.key;
        const selectedColor = isSelected ? 'ring-2 ring-offset-2 ring-primary-500' : '';
        
        return (
          <div
            key={stat.key}
            onClick={() => onStatusSelect?.(isSelected ? null : stat.key)}
            className={`${stat.color.bg} ${stat.color.text} ${stat.color.hover} ${stat.color.border} ${selectedColor} rounded-xl p-3 cursor-pointer transition-all duration-200 ${
              onStatusSelect ? '' : 'cursor-default'
            }`}
          >
            <div className="text-xs md:text-sm font-medium">{stat.label}</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{stat.count}</div>
            <div className="text-xs text-gray-500 mt-0.5">个申请</div>
          </div>
        );
      })}
    </>
  );
}

