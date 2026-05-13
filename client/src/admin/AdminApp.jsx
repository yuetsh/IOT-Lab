import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import AdminDashboard from './AdminDashboard';
import CompanyManager from './CompanyManager';
import DeviceManager from './DeviceManager';
import ProgressOverview from './ProgressOverview';
import ScreenshotGallery from './ScreenshotGallery';
import QuizManager from './QuizManager';
import './admin.css';

const TABS = [
  { path: '/admin/dashboard', label: '数据看板' },
  { path: '/admin/companies', label: '公司管理' },
  { path: '/admin/devices', label: '设备管理' },
  { path: '/admin/quizzes', label: '检测管理' },
  { path: '/admin/progress', label: '检测进度' },
  { path: '/admin/screenshots', label: '截图管理' },
];

export default function AdminApp() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">教师管理后台</h2>
        <nav className="flex flex-col">
          {TABS.map(t => (
            <NavLink key={t.path} to={t.path} className="no-underline">
              {({ isActive }) => (
                <Button
                  className={`sidebar-btn w-full justify-start ${isActive ? 'active' : ''}`}
                  variant="light"
                  size="sm"
                >
                  {t.label}
                </Button>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="companies" element={<CompanyManager />} />
          <Route path="devices" element={<DeviceManager />} />
          <Route path="quizzes" element={<QuizManager />} />
          <Route path="progress" element={<ProgressOverview />} />
          <Route path="screenshots" element={<ScreenshotGallery />} />
        </Routes>
      </main>
    </div>
  );
}
