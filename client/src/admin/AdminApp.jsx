import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import CompanyManager from './CompanyManager';
import DeviceManager from './DeviceManager';
import ProgressOverview from './ProgressOverview';
import ScreenshotGallery from './ScreenshotGallery';
import './admin.css';

const TABS = [
  { path: 'companies', label: '公司管理' },
  { path: 'devices', label: '设备管理' },
  { path: 'progress', label: '完成情况' },
  { path: 'screenshots', label: '截图管理' },
];

export default function AdminApp() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">教师管理后台</h2>
        <nav>
          {TABS.map(t => (
            <NavLink
              key={t.path}
              to={t.path}
              className={({ isActive }) => `sidebar-btn${isActive ? ' active' : ''}`}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Navigate to="companies" replace />} />
          <Route path="companies" element={<CompanyManager />} />
          <Route path="devices" element={<DeviceManager />} />
          <Route path="progress" element={<ProgressOverview />} />
          <Route path="screenshots" element={<ScreenshotGallery />} />
        </Routes>
      </main>
    </div>
  );
}
