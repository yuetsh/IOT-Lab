import { useState, useEffect } from 'react';
import { Button, Input, ListBox, ListBoxItem } from '@heroui/react';
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
        <Input
          value={newName}
          onValueChange={setNewName}
          placeholder="输入公司名称"
          className="max-w-xs"
        />
        <Button type="submit" color="primary">添加</Button>
      </form>
      <ListBox className="max-w-md" aria-label="公司列表">
        {companies.map(c => (
          <ListBoxItem key={c.id} textValue={c.name}>
            <div className="flex items-center justify-between w-full">
              <span>{c.name}</span>
              <Button color="danger" size="sm" onPress={() => handleDelete(c.id)}>删除</Button>
            </div>
          </ListBoxItem>
        ))}
      </ListBox>
    </div>
  );
}
