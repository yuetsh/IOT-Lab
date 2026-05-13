import { useState, useEffect } from 'react';
import { api } from '../api';
import DeviceCard from './DeviceCard';
import './student.css';

export default function CompanyWorkspace({ company, onChangeCompany }) {
  const [devices, setDevices] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getDevices(), api.getProgress(company.id)])
      .then(([devs, progressIds]) => {
        setDevices(devs);
        setCheckedIds(new Set(progressIds));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [company.id]);

  async function handleToggle(itemId, checked) {
    if (pendingIds.has(itemId)) return;
    setPendingIds(prev => new Set(prev).add(itemId));
    setCheckedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(itemId) : next.delete(itemId);
      return next;
    });
    try {
      if (checked) {
        await api.addProgress(company.id, itemId);
      } else {
        await api.removeProgress(company.id, itemId);
      }
    } catch {
      setCheckedIds(prev => {
        const next = new Set(prev);
        checked ? next.delete(itemId) : next.add(itemId);
        return next;
      });
    } finally {
      setPendingIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
    }
  }

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg error">{error}</div>;

  return (
    <div className="page">
      <header className="workspace-header">
        <h1>{company.name}</h1>
        <button className="link-btn" onClick={onChangeCompany}>切换公司</button>
      </header>
      <div className="device-list">
        {devices.length === 0 && <p className="empty-msg">暂无设备，请联系教师添加</p>}
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            checkedIds={checkedIds}
            companyId={company.id}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
