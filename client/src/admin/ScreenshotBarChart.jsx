import { Card, CardContent, CardHeader } from '@heroui/react';

export default function ScreenshotBarChart({ data }) {
  const max = Math.max(0, ...data.map(item => item.screenshot_count));

  return (
    <Card className="screenshot-chart">
      <CardHeader>
        <span className="text-gray-300 font-extrabold">截图提交量</span>
      </CardHeader>
      <CardContent>
        {max === 0 ? (
          <p className="text-gray-400">暂无截图提交</p>
        ) : (
          <div className="vertical-bars">
            {data.map(item => {
              const height = max ? Math.max(8, Math.round((item.screenshot_count / max) * 100)) : 0;
              return (
                <div key={item.company_id} className="vertical-bar">
                  <span>{item.screenshot_count}</span>
                  <i style={{ height: `${height}%` }} />
                  <strong>{item.company_name}</strong>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
