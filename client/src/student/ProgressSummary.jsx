import { Card, CardContent, ProgressBar } from '@heroui/react';
import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';

export default function ProgressSummary({ summary }) {
  const percent = clampPercent(summary.completion_percent);
  const tone = statusTone(summary.status);

  return (
    <Card className={`student-panel progress-summary ${tone}`}>
      <CardContent>
        <p className="panel-label">总体完成率</p>
        <div className="progress-number">{percent}%</div>
        <p className="panel-muted">
          已完成 {formatCount(summary.completed_items, summary.total_items)} 项 · {statusLabel(summary.status)}
        </p>
        <ProgressBar value={percent} color="success" className="mt-3" aria-label={`总体完成率 ${percent}%`} />
      </CardContent>
    </Card>
  );
}
