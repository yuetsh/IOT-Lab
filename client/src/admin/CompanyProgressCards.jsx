import { Card, CardContent, CardHeader, ProgressBar } from '@heroui/react';
import { clampPercent, deviceColor, formatCount, statusLabel, statusTone } from '../dashboardMetrics';

export default function CompanyProgressCards({ companies }) {
  if (!companies.length) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-400">暂无公司，请先添加公司。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="company-card-grid">
      {companies.map(company => {
        const percent = clampPercent(company.completion_percent);
        const tone = statusTone(company.status);
        const borderClass = tone === 'complete' ? 'border-teal-400/70' : tone === 'progress' ? 'border-amber-400/70' : 'border-gray-600';

        return (
          <Card key={company.company_id} className={`${borderClass} border`}>
            <CardHeader>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{company.company_name}</h3>
                <p className="text-sm text-gray-400">
                  {statusLabel(company.status)} · 未完成 {company.unfinished_items} 项 · 截图 {company.screenshot_count} 张
                </p>
              </div>
              <strong className="text-3xl text-white">{percent}%</strong>
            </CardHeader>
            <CardContent>
              <ProgressBar value={percent} color="success" className="mb-3" />
              <div className="company-device-list">
                {company.devices.map((device, di) => {
                  const devicePercent = clampPercent(device.completion_percent);
                  const devColor = deviceColor(device.device_id, di);
                  return (
                    <div key={device.device_id}>
                      <div className="company-device-summary">
                        <span style={{ color: devColor }}>{device.device_name}</span>
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
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
