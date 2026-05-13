import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from '@heroui/react';
import { api } from '../api';
import ProgressSummary from './ProgressSummary';
import DeviceProgressGrid from './DeviceProgressGrid';
import CompanyScreenshotPanel from './CompanyScreenshotPanel';
import './student.css';

export default function StudentDashboard({ company, onChangeCompany }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState(new Set());

  const loadSummary = useCallback(() => {
    setLoading(true);
    setError('');
    return api.getCompanySummary(company.id)
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [company.id]);

  useEffect(() => {
    let alive = true;
    api.getCompanySummary(company.id)
      .then(data => {
        if (alive) setSummary(data);
      })
      .catch(e => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [company.id]);

  async function handleToggle(itemId, checked) {
    if (pendingIds.has(itemId) || !summary) return;

    setPendingIds(prev => new Set(prev).add(itemId));
    setSummary(prev => updateSummaryItem(prev, itemId, checked));

    try {
      if (checked) {
        await api.addProgress(company.id, itemId);
      } else {
        await api.removeProgress(company.id, itemId);
      }
      await loadSummary();
    } catch (e) {
      setError(e.message);
      setSummary(prev => updateSummaryItem(prev, itemId, !checked));
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="student-shell center-msg">
        <Spinner size="lg" />
        <span>加载实验数据...</span>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="student-shell">
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
    <main className="student-shell">
      <header className="student-hero">
        <div>
          <p className="project-eyebrow">设备调试实验平台</p>
          <h1>{company.name} 实验驾驶舱</h1>
          <p className="project-intro">勾选设备调试清单并上传公司实验截图，进度会同步到教师后台。</p>
        </div>
        <Button className="link-btn" variant="ghost" size="sm" onPress={onChangeCompany}>
          切换公司
        </Button>
      </header>

      {error && (
        <Alert className="dashboard-alert" status="danger">
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="student-dashboard-grid">
        <ProgressSummary summary={summary} />
        <CompanyScreenshotPanel
          companyId={company.id}
          summary={summary}
          onUploaded={loadSummary}
        />
      </div>
      <DeviceProgressGrid devices={summary.devices || []} onToggle={handleToggle} />
    </main>
  );
}

function updateSummaryItem(summary, itemId, checked) {
  if (!summary) return summary;
  return {
    ...summary,
    devices: summary.devices.map(device => ({
      ...device,
      checklist_items: device.checklist_items.map(item => (
        item.id === itemId ? { ...item, completed: checked } : item
      )),
    })),
  };
}
