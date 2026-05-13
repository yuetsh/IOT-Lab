import { Card, CardContent, CardHeader } from '@heroui/react';
import { clampPercent, deviceColor } from '../dashboardMetrics';

export default function DeviceBottleneckChart({ data }) {
  const sortedData = [...data].sort((a, b) => (
    clampPercent(a.completion_percent) - clampPercent(b.completion_percent)
    || String(a.device_name).localeCompare(String(b.device_name), 'zh-Hans-CN')
  ));

  return (
    <Card>
      <CardHeader>
        <span className="text-gray-300 font-extrabold">设备瓶颈</span>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="text-gray-400">暂无设备数据</p>
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
      </CardContent>
    </Card>
  );
}
