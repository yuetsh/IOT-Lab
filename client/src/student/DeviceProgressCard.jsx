import { Chip } from '@heroui/react';
import ChecklistItem from './ChecklistItem';
import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './student.css';

export default function DeviceProgressCard({ device, color, onToggle }) {
  const percent = clampPercent(device.completion_percent);
  const tone = statusTone(device.status);

  return (
    <article className={`student-panel device-progress-card ${tone}`}>
      <header className="device-progress-head">
        <div>
          <p className="panel-label">设备</p>
          <h3 style={{ color }}>{device.name}</h3>
        </div>
        <Chip className="progress-badge" color="accent" variant="soft" size="sm">
          {formatCount(device.completed_items, device.total_items)}
        </Chip>
      </header>
      <div className={`device-card-body${device.video_filename ? ' has-video' : ''}`}>
        {device.video_filename && (
          <video
            className="device-video-player"
            src={`/uploads/${device.video_filename}`}
            controls
            preload="metadata"
          />
        )}
        <div className="device-card-checklist">
          <div className="device-meter" aria-label={`${device.name} 完成率 ${percent}%`}>
            <span style={{ width: `${percent}%`, background: color }} />
          </div>
          <p className="panel-muted">{percent}% · {statusLabel(device.status)}</p>
          <div className="checklist">
            {device.checklist_items.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                checked={Boolean(item.completed)}
                color={color}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
