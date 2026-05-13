import { Card, Chip } from '@heroui/react';
import ChecklistItem from './ChecklistItem';
import './student.css';

export default function DeviceCard({ device, checkedIds, onToggle }) {
  const total = device.checklist_items?.length || 0;
  const done = device.checklist_items?.filter(i => checkedIds.has(i.id)).length || 0;

  return (
    <Card className="device-card">
      <Card.Header className="device-header">
        <Card.Title>{device.name}</Card.Title>
        <Chip className="progress-badge" color="accent" variant="soft" size="sm">
          {done}/{total}
        </Chip>
      </Card.Header>
      <Card.Content className="checklist">
        {device.checklist_items?.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            checked={checkedIds.has(item.id)}
            onToggle={onToggle}
          />
        ))}
      </Card.Content>
    </Card>
  );
}
