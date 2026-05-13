import { useEffect, useState } from 'react';
import AdminSummaryCards from './AdminSummaryCards';
import CompletionDonut from './CompletionDonut';
import CompanyRankChart from './CompanyRankChart';
import ScreenshotBarChart from './ScreenshotBarChart';
import DeviceBottleneckChart from './DeviceBottleneckChart';
import CompanyProgressCards from './CompanyProgressCards';
import { api } from '../api';
import './admin.css';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.adminGetOverview()
      .then(data => { if (alive) setOverview(data); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <p>教师管理后台</p>
          <h1>各家公司完成情况</h1>
        </div>
      </header>

      <AdminSummaryCards summary={overview.summary} />

      <div className="admin-chart-grid">
        <CompletionDonut data={overview.status_distribution} />
        <CompanyRankChart data={overview.company_rankings} />
        <ScreenshotBarChart data={overview.screenshot_chart} />
        <DeviceBottleneckChart data={overview.device_bottlenecks} />
      </div>

      <div className="admin-section-head">
        <h2>公司完成卡</h2>
        <p>按公司查看总完成率、截图数和各设备完成情况。</p>
      </div>
      <CompanyProgressCards companies={overview.company_cards} />
    </div>
  );
}
