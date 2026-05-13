import { clampPercent, deviceColor, formatCount } from '../dashboardMetrics';
import './admin.css';

export default function DeviceBottleneckChart({ data }) {
  const sortedData = [...data].sort((a, b) => (
    clampPercent(a.completion_percent) - clampPercent(b.completion_percent)
    || String(a.device_name).localeCompare(String(b.device_name), 'zh-Hans-CN')
  ));

  return (
    <section className="admin-chart-card device-bottleneck-card">
      <div className="chart-heading">
        <span>设备检测进度短板</span>
      </div>
      {sortedData.length === 0 ? (
        <p className="admin-empty-inline">暂无设备数据</p>
      ) : (
        <div className="bottleneck-list">
          {sortedData.map((device, di) => {
            const percent = clampPercent(device.completion_percent);
            const devColor = deviceColor(device.device_id, di);
            return (
              <div key={device.device_id} className="bottleneck-row">
                <div className="bottleneck-head">
                  <span className="bottleneck-dot" style={{ background: devColor }} />
                  <span className="bottleneck-name" style={{ color: devColor }}>{device.device_name}</span>
                  <strong className="bottleneck-pct">{percent}%</strong>
                </div>
                <div className="bottleneck-track">
                  <i style={{ width: `${percent}%`, background: devColor }} />
                </div>
                <em className="bottleneck-count">{formatCount(device.completed_items, device.total_items)} 项完成</em>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
