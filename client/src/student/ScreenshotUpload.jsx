import { useState, useEffect } from 'react';
import { Alert, Button } from '@heroui/react';
import { api } from '../api';
import './student.css';

export default function ScreenshotUpload({ companyId, deviceId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(e) {
    const nextFile = e.target.files[0] || null;
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
    setStatus('');
    setMessage('');
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      const result = await api.uploadScreenshot(companyId, deviceId, file);
      setStatus('success');
      setMessage('上传成功');
      setFile(null);
      setPreview(null);
      onUploaded?.(result);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  return (
    <div className="screenshot-upload">
      {preview && (
        <div className="upload-preview">
          <img src={preview} alt="预览" />
        </div>
      )}
      <div className="upload-controls">
        <input
          key={status === 'success' ? 'reset' : 'active'}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button
          className="upload-btn"
          onPress={handleUpload}
          isDisabled={!file || status === 'uploading'}
        >
          {status === 'uploading' ? '上传中...' : '上传截图'}
        </Button>
      </div>
      {message && (
        <Alert className="upload-msg" status={status === 'success' ? 'success' : 'danger'}>
          <Alert.Content>
            <Alert.Description>{message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  );
}
