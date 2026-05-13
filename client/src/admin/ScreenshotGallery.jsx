import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ScreenshotGallery() {
  const [screenshots, setScreenshots] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => api.adminGetAllScreenshots().then(setScreenshots).catch(e => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => {
    let alive = true;
    api.adminGetAllScreenshots()
      .then(d => { if (alive) setScreenshots(d); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function handleDelete(id) {
    if (!confirm('确认删除此截图？')) return;
    try {
      await api.adminDeleteScreenshot(id);
      load();
    } catch (e) { alert(e.message); }
  }

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg admin-error">{error}</div>;
  if (!screenshots.length) return <div className="center-msg">暂无截图</div>;

  // Group by company_id
  const groups = {};
  for (const s of screenshots) {
    if (!groups[s.company_id]) groups[s.company_id] = { name: s.company_name, shots: [] };
    groups[s.company_id].shots.push(s);
  }

  return (
    <div>
      <h2 className="section-title">截图管理</h2>
      {Object.entries(groups).map(([, group]) => (
        <div key={group.name} className="screenshot-group">
          <h3 className="group-title">{group.name}</h3>
          <div className="screenshot-grid">
            {group.shots.map(s => (
              <div key={s.id} className="screenshot-thumb">
                <img
                  src={`/uploads/${s.filename}`}
                  alt={s.original_name}
                  onClick={() => setLightbox(s)}
                />
                <div className="thumb-info">
                  <span>{s.device_name || '无设备'}</span>
                  <button className="admin-btn danger sm" onClick={() => handleDelete(s.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {lightbox && (
        <dialog open className="lightbox" onClick={() => setLightbox(null)}>
          <img src={`/uploads/${lightbox.filename}`} alt={lightbox.original_name} onClick={e => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </dialog>
      )}
    </div>
  );
}
