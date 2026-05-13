import './admin.css';

export default function ScreenshotBarChart({ data }) {
  const max = Math.max(0, ...data.map(item => item.screenshot_count));

  return (
    <section className="admin-chart-card screenshot-chart">
      <div className="chart-heading">
        <span>检测记录截图提交量</span>
      </div>
      {max === 0 ? (
        <p className="admin-empty-inline">暂无检测记录截图提交</p>
      ) : (
        <div className="vertical-bars">
          {data.map(item => {
            const height = max ? Math.max(8, Math.round((item.screenshot_count / max) * 100)) : 0;
            return (
              <div key={item.company_id} className="vertical-bar">
                <span>{item.screenshot_count}</span>
                <i style={{ height: `${height}%` }} />
                <strong>{item.company_name}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
