import { useState } from 'react';
import { api } from '../api';
import './student.css';

export default function ScreenshotUpload({ companyId, deviceId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(''); // '', 'uploading', 'success', 'error'
  const [message, setMessage] = useState('');

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      await api.uploadScreenshot(companyId, deviceId, file);
      setStatus('success');
      setMessage('上传成功！');
      setFile(null);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  return (
    <div className="screenshot-upload">
      <input
        type="file"
        accept="image/*"
        onChange={e => { setFile(e.target.files[0]); setStatus(''); setMessage(''); }}
      />
      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
      >
        {status === 'uploading' ? '上传中...' : '上传截图'}
      </button>
      {message && <span className={`upload-msg ${status}`}>{message}</span>}
    </div>
  );
}
