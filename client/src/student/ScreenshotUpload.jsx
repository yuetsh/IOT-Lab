import { useState, useEffect } from 'react';
import { Alert, Button } from '@heroui/react';
import { api } from '../api';
import './student.css';

export default function ScreenshotUpload({ companyId, deviceId, onUploaded, onPreviewChange, dropzone = false }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedScreenshot, setUploadedScreenshot] = useState(null);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selectFile(nextFile) {
    if (nextFile && !nextFile.type.startsWith('image/')) {
      setFile(null);
      setPreview(null);
      setStatus('error');
      setMessage('请选择图片文件');
      return;
    }

    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
    setUploadedScreenshot(null);
    setStatus('');
    setMessage('');
  }

  function handleFileChange(e) {
    selectFile(e.target.files[0] || null);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    selectFile(e.dataTransfer.files[0] || null);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      const result = await api.uploadScreenshot(companyId, deviceId, file);
      setStatus('success');
      setMessage('截图已上传');
      setFile(null);
      setPreview(null);
      setUploadedScreenshot(result);
      onUploaded?.(result);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  const uploadedPreview = uploadedScreenshot?.filename ? `/uploads/${uploadedScreenshot.filename}` : null;
  const previewSrc = preview || uploadedPreview;
  const previewAlt = preview ? '待上传截图预览' : '已上传截图预览';
  const selectedLabel = file?.name || uploadedScreenshot?.original_name || uploadedScreenshot?.filename;

  useEffect(() => {
    onPreviewChange?.(previewSrc, selectedLabel);
  }, [onPreviewChange, previewSrc, selectedLabel]);

  if (dropzone) {
    return (
      <div className="screenshot-upload screenshot-upload-dropzone">
        {previewSrc ? (
          <div className="upload-merged">
            <img className="upload-merged-preview" src={previewSrc} alt={previewAlt} />
            <div className="upload-merged-actions">
              <label className="upload-merged-repick">
                <input
                  key={status === 'success' ? 'reset' : 'active'}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                重新选择
              </label>
              <Button
                className="upload-btn upload-btn-prominent"
                onPress={handleUpload}
                isDisabled={!file || status === 'uploading'}
              >
                {status === 'uploading' ? '上传中...' : '上传截图'}
              </Button>
            </div>
            {selectedLabel && <p className="preview-filename">{selectedLabel}</p>}
          </div>
        ) : (
          <>
            <label
              className={`upload-dropzone ${dragActive ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                key={status === 'success' ? 'reset' : 'active'}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <span className="dropzone-icon">+</span>
              <span className="dropzone-copy">
                <strong>拖拽截图到这里</strong>
                <small>也可以点击此区域选择图片</small>
              </span>
            </label>
            <Button
              className="upload-btn upload-btn-prominent"
              onPress={handleUpload}
              isDisabled={!file || status === 'uploading'}
            >
              {status === 'uploading' ? '上传中...' : '上传截图'}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="screenshot-upload">
      {previewSrc && (
        <div className="upload-preview uploaded-preview">
          <img src={previewSrc} alt={previewAlt} />
          {uploadedScreenshot && !file && (
            <span>已上传：{uploadedScreenshot.original_name || uploadedScreenshot.filename}</span>
          )}
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
