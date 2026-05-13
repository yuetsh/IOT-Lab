import { useState, useEffect } from 'react';
import { api } from '../api';
import ChecklistEditor from './ChecklistEditor';

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [newName, setNewName] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');

  const load = () => api.adminGetDevices()
    .then(d => { setDevices(d); setExpandedIds(new Set(d.map(x => x.id))); })
    .catch(e => setError(e.message));

  useEffect(() => {
    let alive = true;
    api.adminGetDevices()
      .then(d => { if (alive) { setDevices(d); setExpandedIds(new Set(d.map(x => x.id))); } })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.adminCreateDevice(newName.trim());
      setNewName('');
      load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此设备？其所有检测项将一并删除。')) return;
    try {
      await api.adminDeleteDevice(id);
      load();
    } catch (e) { setError(e.message); }
  }

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleVideoUpload(deviceId, file) {
    setError('');
    setUploadProgress(prev => ({ ...prev, [deviceId]: 0 }));
    try {
      const updated = await api.adminUploadDeviceVideo(deviceId, file, (pct) => {
        setUploadProgress(prev => ({ ...prev, [deviceId]: pct }));
      });
      setDevices(prev => prev.map(d => d.id === updated.id ? { ...d, video_filename: updated.video_filename } : d));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadProgress(prev => { const next = { ...prev }; delete next[deviceId]; return next; });
    }
  }

  async function handleVideoDelete(deviceId) {
    setError('');
    try {
      const updated = await api.adminDeleteDeviceVideo(deviceId);
      setDevices(prev => prev.map(d => d.id === updated.id ? { ...d, video_filename: updated.video_filename } : d));
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <h2 className="section-title">物联网设备管理</h2>
      {error && <p className="admin-error">{error}</p>}
      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="admin-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="输入物联网设备名称"
        />
        <button className="admin-btn primary" type="submit">添加设备</button>
      </form>
      <div className="device-manager-list">
        {devices.map(device => (
          <div key={device.id} className="device-manager-item">
            <div className="device-manager-row">
              <button
                className="device-expand-btn"
                onClick={() => toggleExpand(device.id)}
              >
                {expandedIds.has(device.id) ? '▼' : '▶'} {device.name}
                <span className="item-count">({device.checklist_items?.length || 0} 项)</span>
              </button>
              <button className="admin-btn danger" onClick={() => handleDelete(device.id)}>删除</button>
            </div>
            {expandedIds.has(device.id) && (
              <div className="device-content">
                <ChecklistEditor device={device} onUpdate={load} />
                <div className="device-video-panel">
                  <p className="device-video-label">设备检测演示视频</p>
                  {device.video_filename ? (
                    <div className="device-video-preview">
                      <video
                        className="device-video-thumb"
                        src={`/uploads/${device.video_filename}`}
                        controls
                        preload="metadata"
                      />
                      {uploadProgress[device.id] !== undefined ? (
                        <div className="device-video-progress">
                          <div className="device-video-progress-track">
                            <div className="device-video-progress-fill" style={{ width: `${uploadProgress[device.id]}%` }} />
                          </div>
                          <span>{uploadProgress[device.id]}%</span>
                        </div>
                      ) : (
                        <div className="device-video-actions">
                          <label className="admin-btn sm">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={e => e.target.files[0] && handleVideoUpload(device.id, e.target.files[0])}
                            />
                            重新上传
                          </label>
                          <button
                            className="admin-btn danger sm"
                            type="button"
                            onClick={() => handleVideoDelete(device.id)}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    uploadProgress[device.id] !== undefined ? (
                      <div className="device-video-progress">
                        <div className="device-video-progress-track">
                          <div className="device-video-progress-fill" style={{ width: `${uploadProgress[device.id]}%` }} />
                        </div>
                        <span>{uploadProgress[device.id]}%</span>
                      </div>
                    ) : (
                      <label className="device-video-dropzone">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={e => e.target.files[0] && handleVideoUpload(device.id, e.target.files[0])}
                        />
                        <span>点击选择视频</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
