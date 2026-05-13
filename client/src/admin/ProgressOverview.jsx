import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ProgressOverview() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api.adminGetAllProgress(), api.adminGetStats()])
      .then(([progress, stats]) => {
        if (alive) { setData(progress); setStats(stats); }
      })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg admin-error">{error}</div>;
  if (!data.length) return <div className="center-msg">暂无数据</div>;

  // Build matrix: companies × devices
  const companies = [...new Map(data.map(r => [r.company_id, r.company_name])).entries()]
    .map(([id, name]) => ({ id, name }));
  const devices = [...new Map(data.map(r => [r.device_id, r.device_name])).entries()]
    .map(([id, name]) => ({ id, name }));

  // count per (company, device): {completed, total}
  const matrix = {};
  for (const row of data) {
    const key = `${row.company_id}-${row.device_id}`;
    if (!matrix[key]) matrix[key] = { completed: 0, total: 0 };
    matrix[key].total++;
    if (row.completed) matrix[key].completed++;
  }

  return (
    <div>
      <h2 className="section-title">完成情况</h2>
      <div className="table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th>公司</th>
              {devices.map(d => <th key={d.id}>{d.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id}>
                <td className="company-cell">{c.name}</td>
                {devices.map(d => {
                  const cell = matrix[`${c.id}-${d.id}`] || { completed: 0, total: 0 };
                  const allDone = cell.total > 0 && cell.completed === cell.total;
                  return (
                    <td key={d.id} className={`progress-cell ${allDone ? 'done' : ''}`}>
                      {cell.completed}/{cell.total}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="stats-row">
        {stats.map(s => (
          <div key={s.device_id} className="stat-card">
            <div className="stat-name">{s.device_name}</div>
            <div className="stat-count">{s.completed_count}/{s.total_companies}</div>
            <div className="stat-label">组完成全部</div>
          </div>
        ))}
      </div>
    </div>
  );
}
