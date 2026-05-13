import ChecklistItem from './ChecklistItem';
import './student.css';

export default function DeviceCard({ device, checkedIds, onToggle }) {
  const total = device.checklist_items?.length || 0;
  const done = device.checklist_items?.filter(i => checkedIds.has(i.id)).length || 0;

  return (
    <div className="device-card">
      <div className="device-header">
        <h2>{device.name}</h2>
        <span className="progress-badge">{done}/{total}</span>
      </div>
      <div className="checklist">
        {device.checklist_items?.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            checked={checkedIds.has(item.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
