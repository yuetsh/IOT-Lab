import { useState, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardContent } from '@heroui/react';
import { api } from '../api';
import { deviceColor } from '../dashboardMetrics';

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

  const companies = [...new Map(data.map(r => [r.company_id, r.company_name])).entries()]
    .map(([id, name]) => ({ id, name }));
  const devices = [...new Map(data.map(r => [r.device_id, r.device_name])).entries()]
    .map(([id, name]) => ({ id, name }));

  const matrix = {};
  for (const row of data) {
    const key = `${row.company_id}-${row.device_id}`;
    if (!matrix[key]) matrix[key] = { completed: 0, total: 0 };
    matrix[key].total++;
    if (row.completed) matrix[key].completed++;
  }

  const columns = [
    { key: 'company', label: '公司' },
    ...devices.map((d, di) => ({ key: `device-${d.id}`, label: d.name, deviceId: d.id, deviceIndex: di })),
  ];

  const rows = companies.map(c => {
    const row = { key: String(c.id), company: c.name };
    devices.forEach(d => {
      const cell = matrix[`${c.id}-${d.id}`] || { completed: 0, total: 0 };
      row[`device-${d.id}`] = cell;
    });
    return row;
  });

  return (
    <div>
      <h2 className="section-title">完成情况</h2>
      <Table aria-label="公司完成情况" className="mb-8">
        <TableHeader columns={columns}>
          {column => (
            <TableColumn key={column.key}>
              {column.deviceId !== undefined
                ? <span style={{ color: deviceColor(column.deviceId, column.deviceIndex) }}>{column.label}</span>
                : column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {row => (
            <TableRow key={row.key}>
              {columnKey => {
                if (columnKey === 'company') {
                  return <TableCell className="font-semibold">{row.company}</TableCell>;
                }
                const cell = row[columnKey];
                const allDone = cell.total > 0 && cell.completed === cell.total;
                return (
                  <TableCell className={allDone ? 'text-teal-400 font-bold bg-teal-400/10' : ''}>
                    {cell.completed}/{cell.total}
                  </TableCell>
                );
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex gap-4 flex-wrap">
        {stats.map((s, si) => {
          const sc = deviceColor(s.device_id, si);
          return (
            <Card key={s.device_id} className="min-w-[120px] text-center" style={{ borderLeft: `3px solid ${sc}` }}>
              <CardContent>
                <p className="text-sm mb-1" style={{ color: sc }}>{s.device_name}</p>
                <p className="text-2xl font-extrabold text-teal-300">{s.completed_count}/{s.total_companies}</p>
                <p className="text-xs text-gray-400 mt-0.5">组完成全部</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
