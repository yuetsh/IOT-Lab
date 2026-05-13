import './student.css';

export default function ChecklistItem({ item, checked, color, onToggle }) {
  return (
    <div
      className={`checklist-card${checked ? ' checked' : ''}`}
      style={checked ? { borderColor: color, background: `${color}14` } : undefined}
      onClick={() => onToggle(item.id, !checked)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(item.id, !checked); }}
    >
      <span className="check-dot" style={checked ? { background: color, borderColor: color } : undefined}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="check-label">{item.label}</span>
    </div>
  );
}
