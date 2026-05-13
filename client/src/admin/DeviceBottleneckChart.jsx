import { clampPercent, deviceColor } from '../dashboardMetrics';
import './admin.css';

export default function DeviceBottleneckChart({ data }) {
  const sortedData = [...data].sort((a, b) => (
    clampPercent(a.completion_percent) - clampPercent(b.completion_percent)
    || String(a.device_name).localeCompare(String(b.device_name), 'zh-Hans-CN')
  ));

  return (
    <section className="admin-chart-card">
      <div className="chart-heading">
        <span>设备检测进度短板</span>
      </div>
      {sortedData.length === 0 ? (
        <p className="admin-empty-inline">暂无设备数据</p>
      ) : (
        <div className="bar-list compact">
          {sortedData.map((device, di) => {
            const percent = clampPercent(device.completion_percent);
            const devColor = deviceColor(device.device_id, di);
            return (
              <div key={device.device_id} className="bar-row">
                <span style={{ color: devColor }}>{device.device_name}</span>
                <div className="bar-track">
                  <i style={{ width: `${percent}%`, background: devColor }} />
                </div>
                <strong>{percent}%</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
