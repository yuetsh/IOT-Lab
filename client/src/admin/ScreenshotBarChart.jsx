import './admin.css';

export default function ScreenshotBarChart({ data }) {
  const max = Math.max(1, ...data.map(item => item.screenshot_count));
  const sorted = [...data].sort((a, b) => b.screenshot_count - a.screenshot_count);

  return (
    <section className="admin-chart-card screenshot-chart">
      <div className="chart-heading">
        <span>检测记录截图提交量</span>
      </div>
      {max <= 1 && sorted.every(d => d.screenshot_count === 0) ? (
        <p className="admin-empty-inline">暂无检测记录截图提交</p>
      ) : (
        <div className="bottleneck-list">
          {sorted.map(item => {
            const width = Math.max(4, Math.round((item.screenshot_count / max) * 100));
            return (
              <div key={item.company_id} className="bottleneck-row">
                <div className="bottleneck-head">
                  <span className="bottleneck-name">{item.company_name}</span>
                  <strong className="bottleneck-pct">{item.screenshot_count}<em className="bottleneck-unit"> 张</em></strong>
                </div>
                <div className="bottleneck-track">
                  <i style={{ width: `${width}%`, background: '#38bdf8' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
