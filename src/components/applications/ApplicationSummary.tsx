interface ApplicationSummaryProps {
  total: number;
  submitted: number;
  inProgress: number;
  drafts: number;
}

const cards = [
  { key: 'total', label: '总申请数量', color: 'bg-blue-50 text-blue-700' },
  { key: 'inProgress', label: '进行中', color: 'bg-yellow-50 text-yellow-700' },
  { key: 'submitted', label: '已提交', color: 'bg-green-50 text-green-700' },
  { key: 'drafts', label: '草稿', color: 'bg-gray-50 text-gray-600' }
];

export default function ApplicationSummary(stats: ApplicationSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.key} className={`${card.color} rounded-2xl p-4`}>
          <div className="text-sm">{card.label}</div>
          <div className="text-2xl font-bold mt-2">{stats[card.key as keyof ApplicationSummaryProps]}</div>
        </div>
      ))}
    </div>
  );
}


