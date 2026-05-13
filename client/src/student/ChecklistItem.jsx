import { Checkbox } from '@heroui/react';

export default function ChecklistItem({ item, checked, onToggle }) {
  return (
    <Checkbox
      className="checklist-item"
      isSelected={checked}
      onChange={isSelected => onToggle(item.id, isSelected)}
    >
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>{item.label}</Checkbox.Content>
    </Checkbox>
  );
}
