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
      {device.checklist_items?.length > 0 ? (
        <ol className="cl-list">
          {device.checklist_items.map((item, index) => (
            <li key={item.id} className="cl-item">
              <span className="cl-index">{index + 1}</span>
              <span className="cl-label">{item.label}</span>
              <button className="admin-btn danger sm" type="button" onClick={() => handleDelete(item.id)}>删除</button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cl-empty">暂无检查项</p>
      )}
      <form className="cl-add" onSubmit={handleAdd}>
        <input
          className="admin-input cl-input"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="输入检查项内容"
        />
        <button className="admin-btn primary sm" type="submit">添加</button>
      </form>
    </div>
  );
}
