import { Card, CardContent } from '@heroui/react';

const CARDS = [
  ['company_count', '公司总数'],
  ['average_completion_percent', '平均完成率', '%'],
  ['complete_company_count', '全部完成'],
  ['screenshot_count', '截图总数'],
];

export default function AdminSummaryCards({ summary }) {
  return (
    <section className="admin-summary-grid">
      {CARDS.map(([key, label, suffix = '']) => (
        <Card key={key}>
          <CardContent>
            <span className="block text-sm text-gray-400 mb-2">{label}</span>
            <strong className="text-3xl font-extrabold text-white">{summary[key] ?? 0}{suffix}</strong>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
