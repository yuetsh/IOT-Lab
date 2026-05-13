import { useState, useEffect } from 'react';
import { Button, Input, Accordion, AccordionItem } from '@heroui/react';
import { api } from '../api';
import ChecklistEditor from './ChecklistEditor';

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [newName, setNewName] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');

  const load = () => api.adminGetDevices()
    .then(d => { setDevices(d); setExpandedKeys(new Set(d.map(x => String(x.id)))); })
    .catch(e => setError(e.message));

  useEffect(() => {
    let alive = true;
    api.adminGetDevices()
      .then(d => { if (alive) { setDevices(d); setExpandedKeys(new Set(d.map(x => String(x.id)))); } })
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
    if (!confirm('确认删除此设备？其所有打勾项目将一并删除。')) return;
    try {
      await api.adminDeleteDevice(id);
      load();
    } catch (e) { setError(e.message); }
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
      <h2 className="section-title">设备管理</h2>
      {error && <p className="admin-error">{error}</p>}
      <form className="add-form" onSubmit={handleAdd}>
        <Input
          value={newName}
          onValueChange={setNewName}
          placeholder="输入设备名称"
          className="max-w-xs"
        />
        <Button type="submit" color="primary">添加设备</Button>
      </form>
      <Accordion
        className="device-manager-list"
        selectedKeys={expandedKeys}
        onSelectionChange={setExpandedKeys}
      >
        {devices.map(device => (
          <AccordionItem
            key={String(device.id)}
            title={device.name}
            subtitle={`${device.checklist_items?.length || 0} 项`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{device.name} 的检查项</span>
              <Button color="danger" size="sm" onPress={() => handleDelete(device.id)}>删除设备</Button>
            </div>
            <div className="device-content">
              <ChecklistEditor device={device} onUpdate={load} />
              <div className="device-video-panel">
                <p className="device-video-label">设备视频</p>
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
                        <Button
                          color="danger"
                          size="sm"
                          onPress={() => handleVideoDelete(device.id)}
                        >
                          删除
                        </Button>
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
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
