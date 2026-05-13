import { clampPercent, deviceColor, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './admin.css';

export default function CompanyProgressCards({ companies }) {
  if (!companies.length) {
    return (
      <section className="admin-chart-card">
        <p className="admin-empty-inline">暂无检测小组，请先添加检测小组。</p>
      </section>
    );
  }

  return (
    <section className="company-card-grid">
      {[...companies].sort((a, b) => (b.completion_percent ?? 0) - (a.completion_percent ?? 0)).map((company, idx) => {
        const percent = clampPercent(company.completion_percent);
        return (
          <article key={company.company_id} className={`company-progress-card ${statusTone(company.status)}`}>
            <header>
              <div className="company-header-left">
                <span className="company-rank">#{idx + 1}</span>
                <h3>{company.company_name}</h3>
                <p>{statusLabel(company.status)} · 未完成 {company.unfinished_items} 项 · 检测记录截图 {company.screenshot_count} 张</p>
              </div>
              <strong>{percent}%</strong>
            </header>
            <div className="company-meter">
              <i style={{ width: `${percent}%` }} />
            </div>
            <div className="company-device-list">
              {company.devices.map((device, di) => {
                const devicePercent = clampPercent(device.completion_percent);
                const devColor = deviceColor(device.device_id, di);
                return (
                  <div key={device.device_id}>
                    <div className="company-device-summary">
                      <span style={{ color: devColor, fontWeight: 600 }}>{device.device_name}</span>
                      <div className="mini-track">
                        <i style={{ width: `${devicePercent}%`, background: devColor }} />
                      </div>
                      <em>{formatCount(device.completed_items, device.total_items)}</em>
                    </div>
                    <ul className="company-device-options">
                      {(device.checklist_items || []).map(item => (
                        <li key={item.id} className={item.completed ? 'complete' : 'idle'}>
                          <span>{item.completed ? '✓' : '○'}</span>
                          {item.label}
                        </li>
                      ))}
                    </ul>
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
