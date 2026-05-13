import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, ModalBody } from '@heroui/react';
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
    if (!confirm('确认删除此截图？')) return;
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
  if (!screenshots.length) return <div className="center-msg">暂无截图</div>;

  const groups = {};
  for (const s of screenshots) {
    if (!groups[s.company_id]) groups[s.company_id] = { name: s.company_name, shots: [] };
    groups[s.company_id].shots.push(s);
  }

  const lightbox = lightboxIdx >= 0 ? screenshots[lightboxIdx] : null;

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
                  onClick={() => setLightboxIdx(screenshots.indexOf(s))}
                />
                <div className="thumb-info">
                  <span className="thumb-name" title={s.original_name}>{s.original_name}</span>
                </div>
                <div className="thumb-actions">
                  <Button color="danger" size="sm" onPress={() => handleDelete(s.id)}>删除</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal
        isOpen={lightboxIdx >= 0}
        onClose={() => setLightboxIdx(-1)}
        size="full"
        className="bg-black/80"
        hideCloseButton
      >
        <ModalBody className="flex items-center justify-center p-0">
          {lightbox && (
            <>
              <img
                src={`/uploads/${lightbox.filename}`}
                alt={lightbox.original_name}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded"
              />
              <Button
                className="fixed top-4 right-4 z-10"
                variant="flat"
                size="sm"
                onPress={() => setLightboxIdx(-1)}
              >
                ✕
              </Button>
              <Button
                className="fixed left-4 top-1/2 -translate-y-1/2 z-10"
                variant="flat"
                size="sm"
                onPress={goPrev}
              >
                ‹
              </Button>
              <Button
                className="fixed right-4 top-1/2 -translate-y-1/2 z-10"
                variant="flat"
                size="sm"
                onPress={goNext}
              >
                ›
              </Button>
              <span className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 rounded-lg bg-black/65 text-white font-semibold z-10">
                {lightbox.company_name} · {lightboxIdx + 1} / {screenshots.length}
              </span>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
