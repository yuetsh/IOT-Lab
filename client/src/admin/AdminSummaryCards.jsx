import './admin.css';

const CARDS = [
  ['average_completion_percent', '平均完成率', '%', 'primary'],
  ['complete_company_count', '全部完成', '', 'complete'],
  ['company_count', '检测小组总数', '', 'neutral'],
  ['screenshot_count', '截图总数', '', 'accent'],
];

export default function AdminSummaryCards({ summary }) {
  return (
    <section className="admin-summary-grid">
      {CARDS.map(([key, label, suffix = '', tone = 'neutral']) => (
        <article key={key} className={`admin-kpi-card kpi-${tone}`}>
          <span>{label}</span>
          <strong>{summary[key] ?? 0}{suffix}</strong>
        </article>
      ))}
    </section>
  );
}
