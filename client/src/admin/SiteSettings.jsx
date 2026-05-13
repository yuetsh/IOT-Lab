import { useState } from 'react';
import { api } from '../api';
import './admin.css';

export default function SiteSettings() {
  const [confirming, setConfirming] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const handleReset = async () => {
    setResetting(true);
    setResetMsg('');
    try {
      await api.adminResetData();
      setResetMsg('数据已全部清空，包括数据库记录和上传的图片视频。');
      setConfirming(false);
    } catch (e) {
      setResetMsg(`重置失败: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const result = await api.adminSeedData();
      setSeedMsg(result.message || '种子数据注入成功');
    } catch (e) {
      setSeedMsg(`注入失败: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <p>系统管理</p>
          <h1>网站设置</h1>
        </div>
      </header>

      <div className="site-settings-grid">
        <section className="admin-chart-card danger-section">
          <h2 className="danger-heading">危险操作</h2>
          <p className="action-desc">
            清空所有数据，包括检测小组、设备、检查项、检测进度、检测记录截图、视频文件及题库数据。此操作不可恢复。
          </p>

          {!confirming ? (
            <button className="admin-btn danger" onClick={() => setConfirming(true)}>
              重置所有数据
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="admin-btn danger" onClick={handleReset} disabled={resetting}>
                {resetting ? '重置中...' : '确认重置'}
              </button>
              <button className="admin-btn" onClick={() => setConfirming(false)} disabled={resetting}>
                取消
              </button>
            </div>
          )}

          {resetMsg && (
            <p className={`action-toast ${resetMsg.startsWith('重置失败') ? 'error' : 'success'}`}>
              {resetMsg}
            </p>
          )}
        </section>

        <section className="admin-chart-card site-action-section">
          <h2 className="action-heading">种子数据</h2>
          <p className="action-desc">
            注入演示用种子数据，包括检测小组、设备、检查项、检测进度、截图记录及题库。注入前会先清空现有数据。
          </p>

          <button className="admin-btn primary" onClick={handleSeed} disabled={seeding}>
            {seeding ? '注入中...' : '注入种子数据'}
          </button>

          {seedMsg && (
            <p className={`action-toast ${seedMsg.startsWith('注入失败') ? 'error' : 'success'}`}>
              {seedMsg}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
