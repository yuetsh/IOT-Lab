import DeviceProgressCard from './DeviceProgressCard';
import './student.css';

export default function DeviceProgressGrid({ devices, onToggle }) {
  if (!devices.length) {
    return (
      <section className="student-panel empty-panel">
        <p>暂无设备清单，请联系教师添加。</p>
      </section>
    );
  }

  return (
    <section className="device-progress-grid">
      {devices.map(device => (
        <DeviceProgressCard key={device.id} device={device} onToggle={onToggle} />
      ))}
    </section>
  );
}
