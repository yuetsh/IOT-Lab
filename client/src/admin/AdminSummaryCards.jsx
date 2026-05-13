import './admin.css';

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
        <article key={key} className="admin-kpi-card">
          <span>{label}</span>
          <strong>{summary[key] ?? 0}{suffix}</strong>
        </article>
      ))}
    </section>
  );
}
