import { Card, CardContent } from '@heroui/react';
import DeviceProgressCard from './DeviceProgressCard';
import { deviceColor } from '../dashboardMetrics';

export default function DeviceProgressGrid({ devices, onToggle }) {
  if (!devices.length) {
    return (
      <Card className="student-panel empty-panel">
        <CardContent>
          <p>暂无设备清单，请联系教师添加。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="device-progress-grid">
      {devices.map((device, di) => (
        <DeviceProgressCard
          key={device.id}
          device={device}
          color={deviceColor(device.id, di)}
          onToggle={onToggle}
        />
      ))}
    </section>
  );
}
