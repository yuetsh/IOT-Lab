import { useState } from 'react';
import { Button, Input, ListBox, ListBoxItem } from '@heroui/react';
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
        <ListBox className="mb-2" aria-label={`${device.name} 检查项`}>
          {device.checklist_items.map((item, index) => (
            <ListBoxItem key={item.id} textValue={item.label}>
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xs font-bold text-gray-500 w-5 text-right shrink-0">{index + 1}</span>
                <span className="flex-1">{item.label}</span>
                <Button color="danger" size="sm" onPress={() => handleDelete(item.id)}>删除</Button>
              </div>
            </ListBoxItem>
          ))}
        </ListBox>
      ) : (
        <p className="cl-empty">暂无检查项</p>
      )}
      <form className="cl-add" onSubmit={handleAdd}>
        <Input
          className="flex-1"
          value={newLabel}
          onValueChange={setNewLabel}
          placeholder="输入检查项内容"
        />
        <Button type="submit" color="primary" size="sm">添加</Button>
      </form>
    </div>
  );
}
