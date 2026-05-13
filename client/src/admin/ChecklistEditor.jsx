import { useState } from 'react';
import { api } from '../api';

export default function ChecklistEditor({ device, onUpdate }) {
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setError('');
    try {
      await api.adminCreateItem(device.id, newLabel.trim(), device.checklist_items?.length || 0);
      setNewLabel('');
      onUpdate();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(itemId) {
    try {
      await api.adminDeleteItem(itemId);
      onUpdate();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="checklist-editor">
      {error && <p className="admin-error">{error}</p>}
      <ul className="item-list">
        {device.checklist_items?.map(item => (
          <li key={item.id} className="item-row indent">
            <span>{item.label}</span>
            <button className="admin-btn danger sm" onClick={() => handleDelete(item.id)}>删除</button>
          </li>
        ))}
      </ul>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="admin-input"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="新增检查项"
        />
        <button className="admin-btn primary sm" type="submit">添加</button>
      </form>
    </div>
  );
}
