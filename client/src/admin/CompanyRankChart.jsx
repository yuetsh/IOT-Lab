import { Card, CardContent, CardHeader, ProgressBar } from '@heroui/react';
import { clampPercent } from '../dashboardMetrics';

export default function CompanyRankChart({ data }) {
  return (
    <Card className="rank-chart">
      <CardHeader>
        <span className="text-gray-300 font-extrabold">公司完成率排行</span>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-gray-400">暂无公司数据</p>
        ) : (
          <div className="bar-list">
            {data.map(company => {
              const percent = clampPercent(company.completion_percent);
              return (
                <div key={company.company_id} className="bar-row">
                  <span>{company.company_name}</span>
                  <ProgressBar value={percent} color="success" className="h-2" />
                  <strong>{percent}%</strong>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
