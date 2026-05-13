import { useState, useEffect } from 'react';
import { api } from '../api';

export default function CompanyManager() {
  const [companies, setCompanies] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = () => api.adminGetCompanies().then(setCompanies).catch(e => setError(e.message));
  useEffect(() => {
    let alive = true;
    api.adminGetCompanies()
      .then(d => { if (alive) setCompanies(d); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.adminCreateCompany(newName.trim());
      setNewName('');
      load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此公司？相关进度和截图将一并删除。')) return;
    try {
      await api.adminDeleteCompany(id);
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <h2 className="section-title">公司管理</h2>
      {error && <p className="admin-error">{error}</p>}
      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="admin-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="输入公司名称"
        />
        <button className="admin-btn primary" type="submit">添加</button>
      </form>
      <ul className="item-list">
        {companies.map(c => (
          <li key={c.id} className="item-row">
            <span>{c.name}</span>
            <button className="admin-btn danger" onClick={() => handleDelete(c.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
