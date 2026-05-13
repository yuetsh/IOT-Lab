import { useState, useEffect } from 'react';
import { Alert, Button, Chip, Spinner } from '@heroui/react';
import { api } from '../api';
import DeviceCard from './DeviceCard';
import ScreenshotUpload from './ScreenshotUpload';
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

  if (loading) {
    return (
      <div className="center-msg">
        <Spinner size="lg" />
        <span>加载中...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page">
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>加载失败</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="project-header">
        <p className="project-eyebrow">学生实验前台</p>
        <h1>设备调试实验平台</h1>
        <p className="project-intro">
          本项目以公司为单位记录实验完成情况。请按活动顺序完成设备清单勾选，并上传实验截图作为成果凭证。
        </p>
      </header>

      <header className="workspace-header">
        <div>
          <p className="workspace-label">当前公司</p>
          <h2>{company.name}</h2>
        </div>
        <Button className="link-btn" variant="ghost" size="sm" onPress={onChangeCompany}>
          切换公司
        </Button>
      </header>
      <section className="workspace-section activity-section">
        <div className="section-title-row">
          <Chip className="activity-index" color="success" variant="soft" size="sm">活动一</Chip>
          <h2 className="section-heading">设备清单的勾选</h2>
        </div>
        <p className="section-description">
          按设备逐项确认调试任务，已完成的项目请及时勾选，进度会同步到教师后台。
        </p>
        <div className="device-list">
          {devices.length === 0 && <p className="empty-msg">暂无设备，请联系教师添加</p>}
          {devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              checkedIds={checkedIds}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </section>

      <section className="workspace-section activity-section">
        <div className="section-title-row">
          <Chip className="activity-index" color="success" variant="soft" size="sm">活动二</Chip>
          <h2 className="section-heading">截图上传</h2>
        </div>
        <p className="section-description">
          上传实验过程或结果截图，作为本公司实验完成情况的补充记录。
        </p>
        <div className="screenshot-standalone">
          <ScreenshotUpload companyId={company.id} />
        </div>
      </section>
    </div>
  );
}
