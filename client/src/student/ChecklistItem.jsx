import { Checkbox } from '@heroui/react';

export default function ChecklistItem({ item, checked, color, onToggle }) {
  return (
    <Checkbox
      className={`checklist-card${checked ? ' checked' : ''}`}
      style={checked ? { borderColor: color, background: `${color}14` } : undefined}
      isSelected={checked}
      onValueChange={next => onToggle(item.id, next)}
    >
      {item.label}
    </Checkbox>
  );
}
