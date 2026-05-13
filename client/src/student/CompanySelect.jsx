import { useState, useEffect } from 'react';
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

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg error">{error}</div>;

  return (
    <div className="page">
      <h1 className="page-title">请选择您的公司</h1>
      {companies.length === 0 && <p className="empty-msg">暂无公司，请联系教师添加</p>}
      <div className="company-grid">
        {companies.map(c => (
          <button key={c.id} className="company-card" onClick={() => onSelect(c)}>
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
