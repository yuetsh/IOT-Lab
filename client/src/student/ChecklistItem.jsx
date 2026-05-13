export default function ChecklistItem({ item, checked, onToggle }) {
  return (
    <label className="checklist-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onToggle(item.id, e.target.checked)}
      />
      <span>{item.label}</span>
    </label>
  );
}
