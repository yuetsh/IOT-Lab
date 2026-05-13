import { clampPercent, statusTone } from '../dashboardMetrics';
import './admin.css';

export default function CompanyRankChart({ data }) {
  return (
    <section className="admin-chart-card rank-chart">
      <div className="chart-heading">
        <span>公司完成率排行</span>
      </div>
      {data.length === 0 ? (
        <p className="admin-empty-inline">暂无公司数据</p>
      ) : (
        <div className="bar-list">
          {data.map(company => {
            const percent = clampPercent(company.completion_percent);
            return (
              <div key={company.company_id} className="bar-row">
                <span>{company.company_name}</span>
                <div className="bar-track">
                  <i className={statusTone(company.status)} style={{ width: `${percent}%` }} />
                </div>
                <strong>{percent}%</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
