import { useState } from 'react';
import CompanyManager from './CompanyManager';
import DeviceManager from './DeviceManager';
import ProgressOverview from './ProgressOverview';
import ScreenshotGallery from './ScreenshotGallery';
import './admin.css';

const TABS = [
  { id: 'companies', label: '公司管理' },
  { id: 'devices', label: '设备管理' },
  { id: 'progress', label: '完成情况' },
  { id: 'screenshots', label: '截图管理' },
];

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('companies');

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">教师管理后台</h2>
        <nav>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`sidebar-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        {activeTab === 'companies' && <CompanyManager />}
        {activeTab === 'devices' && <DeviceManager />}
        {activeTab === 'progress' && <ProgressOverview />}
        {activeTab === 'screenshots' && <ScreenshotGallery />}
      </main>
    </div>
  );
}
