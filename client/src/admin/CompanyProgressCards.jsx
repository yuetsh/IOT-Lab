import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './admin.css';

export default function CompanyProgressCards({ companies }) {
  if (!companies.length) {
    return (
      <section className="admin-chart-card">
        <p className="admin-empty-inline">暂无公司，请先添加公司。</p>
      </section>
    );
  }

  return (
    <section className="company-card-grid">
      {companies.map(company => {
        const percent = clampPercent(company.completion_percent);
        return (
          <article key={company.company_id} className={`company-progress-card ${statusTone(company.status)}`}>
            <header>
              <div>
                <h3>{company.company_name}</h3>
                <p>{statusLabel(company.status)} · 未完成 {company.unfinished_items} 项 · 截图 {company.screenshot_count} 张</p>
              </div>
              <strong>{percent}%</strong>
            </header>
            <div className="company-meter">
              <i style={{ width: `${percent}%` }} />
            </div>
            <div className="company-device-list">
              {company.devices.map(device => {
                const devicePercent = clampPercent(device.completion_percent);
                return (
                  <div key={device.device_id}>
                    <span>{device.device_name}</span>
                    <div className="mini-track">
                      <i className={statusTone(device.status)} style={{ width: `${devicePercent}%` }} />
                    </div>
                    <em>{formatCount(device.completed_items, device.total_items)}</em>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
