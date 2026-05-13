import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export default function ScreenshotGallery() {
  const [screenshots, setScreenshots] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(-1);
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
    if (!confirm('确认删除此检测记录截图？')) return;
    try {
      await api.adminDeleteScreenshot(id);
      load();
    } catch (e) { alert(e.message); }
  }

  const goPrev = useCallback(() => {
    setLightboxIdx(i => (i > 0 ? i - 1 : screenshots.length - 1));
  }, [screenshots.length]);

  const goNext = useCallback(() => {
    setLightboxIdx(i => (i < screenshots.length - 1 ? i + 1 : 0));
  }, [screenshots.length]);

  useEffect(() => {
    function onKey(e) {
      if (lightboxIdx < 0) return;
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') setLightboxIdx(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, goPrev, goNext]);

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg admin-error">{error}</div>;
  if (!screenshots.length) return <div className="center-msg">暂无检测记录截图</div>;

  // Group by company_id
  const groups = {};
  for (const s of screenshots) {
    if (!groups[s.company_id]) groups[s.company_id] = { name: s.company_name, shots: [] };
    groups[s.company_id].shots.push(s);
  }

  const lightbox = lightboxIdx >= 0 ? screenshots[lightboxIdx] : null;

  return (
    <div>
      <h2 className="section-title">检测记录截图管理</h2>
      {Object.entries(groups).map(([, group]) => (
        <div key={group.name} className="screenshot-group">
          <h3 className="group-title">{group.name}</h3>
          <div className="screenshot-grid">
            {group.shots.map(s => (
              <div key={s.id} className="screenshot-thumb">
                <img
                  src={`/uploads/${s.filename}`}
                  alt={s.original_name}
                  onClick={() => setLightboxIdx(screenshots.indexOf(s))}
                />
                <div className="thumb-info">
                  <span className="thumb-name" title={s.original_name}>{s.original_name}</span>
                </div>
                <div className="thumb-actions">
                  <button className="admin-btn danger sm" onClick={() => handleDelete(s.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {lightbox && (
        <dialog open className="lightbox" onClick={() => setLightboxIdx(-1)}>
          <img
            src={`/uploads/${lightbox.filename}`}
            alt={lightbox.original_name}
            onClick={e => e.stopPropagation()}
          />
          <button className="lightbox-close" onClick={() => setLightboxIdx(-1)}>✕</button>
          <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); goPrev(); }}>
            ‹
          </button>
          <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); goNext(); }}>
            ›
          </button>
          <span className="lightbox-counter">{lightbox.company_name} · {lightboxIdx + 1} / {screenshots.length}</span>
        </dialog>
      )}
    </div>
  );
}
