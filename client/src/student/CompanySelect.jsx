import { useState, useEffect } from 'react';
import { Alert, Spinner } from '@heroui/react';
import { api } from '../api';
import './student.css';

export default function CompanySelect({ onSelect }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCompanies()
      .then(setCompanies)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="center-msg">
        <Spinner size="lg" />
        <span>加载中...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page">
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>加载失败</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="project-header">
        <div>
          <p className="project-eyebrow">学生实验前台</p>
          <h1>物联网设备检测实验平台</h1>
          <p className="project-intro">
            以检测小组为单位完成实验记录：先勾选各设备检测清单，再上传检测记录截图，教师将在后台查看进度与成果。
          </p>
        </div>
      </header>
      <h2 className="page-title">请选择检测小组</h2>
      {companies.length === 0 && <p className="empty-msg">暂无检测小组，请联系教师添加</p>}
      <div className="company-grid">
        {companies.map((c, index) => (
          <button
            key={c.id}
            type="button"
            className="company-card"
            onClick={() => onSelect(c)}
            aria-label={`选择${c.name}`}
          >
            <span className="company-card-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="company-card-name">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
