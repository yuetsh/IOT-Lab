import { useState, useEffect } from 'react';
import { api } from '../api';
import ChecklistEditor from './ChecklistEditor';

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [newName, setNewName] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [error, setError] = useState('');

  const load = () => api.adminGetDevices()
    .then(d => { setDevices(d); setExpandedIds(new Set(d.map(x => x.id))); })
    .catch(e => setError(e.message));

  useEffect(() => {
    let alive = true;
    api.adminGetDevices()
      .then(d => { if (alive) { setDevices(d); setExpandedIds(new Set(d.map(x => x.id))); } })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.adminCreateDevice(newName.trim());
      setNewName('');
      load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此设备？其所有打勾项目将一并删除。')) return;
    try {
      await api.adminDeleteDevice(id);
      load();
    } catch (e) { setError(e.message); }
  }

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <h2 className="section-title">设备管理</h2>
      {error && <p className="admin-error">{error}</p>}
      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="admin-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="输入设备名称"
        />
        <button className="admin-btn primary" type="submit">添加设备</button>
      </form>
      <div className="device-manager-list">
        {devices.map(device => (
          <div key={device.id} className="device-manager-item">
            <div className="device-manager-row">
              <button
                className="device-expand-btn"
                onClick={() => toggleExpand(device.id)}
              >
                {expandedIds.has(device.id) ? '▼' : '▶'} {device.name}
                <span className="item-count">({device.checklist_items?.length || 0} 项)</span>
              </button>
              <button className="admin-btn danger" onClick={() => handleDelete(device.id)}>删除</button>
            </div>
            {expandedIds.has(device.id) && (
              <ChecklistEditor device={device} onUpdate={load} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
