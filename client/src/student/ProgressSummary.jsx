import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './student.css';

export default function ProgressSummary({ summary }) {
  const percent = clampPercent(summary.completion_percent);
  const tone = statusTone(summary.status);

  return (
    <section className={`student-panel progress-summary ${tone}`}>
      <div>
        <p className="panel-label">总体完成率</p>
        <div className="progress-number">{percent}%</div>
        <p className="panel-muted">
          已完成 {formatCount(summary.completed_items, summary.total_items)} 项 · {statusLabel(summary.status)}
        </p>
      </div>
      <div className="summary-meter" aria-label={`总体完成率 ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
