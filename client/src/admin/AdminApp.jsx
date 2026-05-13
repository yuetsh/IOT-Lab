import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CompanyManager from './CompanyManager';
import DeviceManager from './DeviceManager';
import ProgressOverview from './ProgressOverview';
import ScreenshotGallery from './ScreenshotGallery';
import QuizManager from './QuizManager';
import './admin.css';

const TABS = [
  { path: '/admin/dashboard', label: '数据看板' },
  { path: '/admin/companies', label: '小组管理' },
  { path: '/admin/devices', label: '设备管理' },
  { path: '/admin/quizzes', label: '检测管理' },
  { path: '/admin/progress', label: '检测进度' },
  { path: '/admin/screenshots', label: '检测记录' },
];

export default function AdminApp() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">物联网检测教师后台</h2>
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
