import './admin.css';

const COLORS = {
  complete: '#14b8a6',
  in_progress: '#f59e0b',
  not_started: '#64748b',
};

export default function CompletionDonut({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const stops = data.map(item => {
    const start = total ? (cursor / total) * 100 : 0;
    cursor += item.count;
    const end = total ? (cursor / total) * 100 : 0;
    return `${COLORS[item.status]} ${start}% ${end}%`;
  }).join(', ');

  return (
    <section className="admin-chart-card">
      <div className="chart-heading">
        <span>完成状态占比</span>
        <strong>{total} 家</strong>
      </div>
      <div className="donut-row">
        <div
          className="completion-donut"
          style={{ background: total ? `conic-gradient(${stops})` : '#1e293b' }}
          aria-label="公司完成状态占比"
        >
          <span>{total}</span>
        </div>
        <div className="donut-legend">
          {data.map(item => (
            <div key={item.status}>
              <i style={{ backgroundColor: COLORS[item.status] }} />
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
