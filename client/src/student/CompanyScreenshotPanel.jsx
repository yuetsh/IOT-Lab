import ScreenshotUpload from './ScreenshotUpload';
import './student.css';

export default function CompanyScreenshotPanel({ companyId, summary, onUploaded }) {
  return (
    <section className="student-panel screenshot-panel">
      <div className="panel-heading-row">
        <div>
          <p className="panel-label">公司截图凭证</p>
          <h2>上传实验截图</h2>
        </div>
        <strong>{summary.screenshot_count || 0} 张</strong>
      </div>
      <p className="panel-muted">截图按公司归档，教师后台会按公司查看提交情况。</p>
      {summary.latest_screenshot && (
        <p className="latest-shot">
          最近上传：{summary.latest_screenshot.original_name || summary.latest_screenshot.filename}
        </p>
      )}
      <ScreenshotUpload companyId={companyId} onUploaded={onUploaded} />
    </section>
  );
}
