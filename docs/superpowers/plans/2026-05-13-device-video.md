# Device Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin uploads one video per device; all students see it in the device card above the checklist.

**Architecture:** `video_filename` column on `devices` table; two new admin routes (`PUT`/`DELETE /devices/:id/video`) using multer (same pattern as screenshots); `DeviceProgressCard` renders a `<video>` when the field is set.

**Tech Stack:** Node.js + better-sqlite3, Express + multer, React

---

### Task 1: DB — add `video_filename` column + helper functions

**Files:**
- Modify: `server/db.js`

- [ ] **Step 1: Add migration after existing `activity_key` migration (around line 90)**

```js
const deviceColumns = db.prepare('PRAGMA table_info(devices)').all();
if (!deviceColumns.some(col => col.name === 'video_filename')) {
  db.exec('ALTER TABLE devices ADD COLUMN video_filename TEXT');
}
```

- [ ] **Step 2: Add prepared statements inside the `stmts` object (after `deleteDevice`)**

```js
updateDeviceVideo: db.prepare('UPDATE devices SET video_filename = ? WHERE id = ?'),
clearDeviceVideo:  db.prepare('UPDATE devices SET video_filename = NULL WHERE id = ?'),
```

- [ ] **Step 3: Add helper functions (after `deleteDevice` function)**

```js
function setDeviceVideo(id, filename) {
  stmts.updateDeviceVideo.run(filename, id);
  return stmts.getDevice.get(id);
}

function clearDeviceVideo(id) {
  stmts.clearDeviceVideo.run(id);
  return stmts.getDevice.get(id);
}
```

- [ ] **Step 4: Export new functions (add to `module.exports`)**

```js
setDeviceVideo,
clearDeviceVideo,
```

- [ ] **Step 5: Verify server starts without error**

```bash
cd server && node index.js
```

Expected: server starts, no SQLite errors.

- [ ] **Step 6: Commit**

```bash
git add server/db.js
git commit -m "feat: add video_filename column to devices"
```

---

### Task 2: Backend routes — PUT/DELETE `/devices/:id/video`

**Files:**
- Modify: `server/routes/devices.js`

- [ ] **Step 1: Add imports at top of `devices.js` (after existing requires)**

```js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.avi']);

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith('video/') && ALLOWED_VIDEO_EXT.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持视频文件 (.mp4, .webm, .mov, .avi)'));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});
```

- [ ] **Step 2: Add `PUT /:id/video` route (before `module.exports`)**

```js
// PUT /:id/video [adminAuth]
router.put('/:id/video', adminAuth, (req, res, next) => {
  uploadVideo.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择视频文件' });
    const device = db.getDevice(req.params.id);
    if (!device) return res.status(404).json({ error: '设备不存在' });
    // Delete old video if exists
    if (device.video_filename) {
      fs.unlink(path.join(UPLOAD_DIR, device.video_filename), () => {});
    }
    const updated = db.setDeviceVideo(req.params.id, req.file.filename);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

- [ ] **Step 3: Add `DELETE /:id/video` route (before `module.exports`)**

```js
// DELETE /:id/video [adminAuth]
router.delete('/:id/video', adminAuth, async (req, res) => {
  try {
    const device = db.getDevice(req.params.id);
    if (!device) return res.status(404).json({ error: '设备不存在' });
    if (device.video_filename) {
      fs.unlink(path.join(UPLOAD_DIR, device.video_filename), () => {});
    }
    const updated = db.clearDeviceVideo(req.params.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

- [ ] **Step 4: Verify with curl (server must be running)**

```bash
# Should return 404 for non-existent device
curl -s -X DELETE http://localhost:3001/api/devices/999/video -H "x-admin-password: admin123"
```

Expected: `{"error":"设备不存在"}`

- [ ] **Step 5: Commit**

```bash
git add server/routes/devices.js
git commit -m "feat: add PUT/DELETE /devices/:id/video routes"
```

---

### Task 3: API client — two new admin methods

**Files:**
- Modify: `client/src/api.js`

- [ ] **Step 1: Add two methods inside the `adminRequest` IIFE (after `adminDeleteDevice`)**

```js
adminUploadDeviceVideo: (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return adminRequest('PUT', `/devices/${id}/video`, form);
},
adminDeleteDeviceVideo: (id) => adminRequest('DELETE', `/devices/${id}/video`),
```

- [ ] **Step 2: Commit**

```bash
git add client/src/api.js
git commit -m "feat: add adminUploadDeviceVideo and adminDeleteDeviceVideo API methods"
```

---

### Task 4: Admin UI — video upload in DeviceManager

**Files:**
- Modify: `client/src/admin/DeviceManager.jsx`
- Modify: `client/src/admin/admin.css`

- [ ] **Step 1: Add video upload handler inside `DeviceManager` (after `toggleExpand`)**

```js
async function handleVideoUpload(deviceId, file) {
  setError('');
  try {
    const updated = await api.adminUploadDeviceVideo(deviceId, file);
    setDevices(prev => prev.map(d => d.id === updated.id ? { ...d, video_filename: updated.video_filename } : d));
  } catch (e) { setError(e.message); }
}

async function handleVideoDelete(deviceId) {
  setError('');
  try {
    const updated = await api.adminDeleteDeviceVideo(deviceId);
    setDevices(prev => prev.map(d => d.id === updated.id ? { ...d, video_filename: updated.video_filename } : d));
  } catch (e) { setError(e.message); }
}
```

- [ ] **Step 2: Add video section inside the expanded device block (after `<ChecklistEditor>`)**

```jsx
{expandedIds.has(device.id) && (
  <>
    <ChecklistEditor device={device} onUpdate={load} />
    <div className="device-video-admin">
      <p className="device-video-label">设备视频</p>
      {device.video_filename ? (
        <div className="device-video-current">
          <span>{device.video_filename}</span>
          <button
            className="admin-btn danger sm"
            type="button"
            onClick={() => handleVideoDelete(device.id)}
          >
            删除视频
          </button>
        </div>
      ) : (
        <label className="device-video-upload">
          <input
            type="file"
            accept="video/*"
            onChange={e => e.target.files[0] && handleVideoUpload(device.id, e.target.files[0])}
          />
          <span className="admin-btn">选择视频上传</span>
        </label>
      )}
    </div>
  </>
)}
```

Note: replace the existing single `{expandedIds.has(device.id) && <ChecklistEditor ... />}` with the block above.

- [ ] **Step 3: Add CSS to `admin.css` (before the `@media` block)**

```css
.device-video-admin { padding: 12px 0 4px; border-top: 1px solid #1e293b; margin-top: 12px; }
.device-video-label { color: #38bdf8; font-size: 0.78rem; font-weight: 800; margin: 0 0 8px; }
.device-video-current { display: flex; align-items: center; gap: 12px; }
.device-video-current span { color: #94a3b8; font-size: 0.85rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.device-video-upload input[type="file"] { display: none; }
.device-video-upload { cursor: pointer; }
```

- [ ] **Step 4: Verify in browser**
  - Open admin → 设备管理
  - Expand a device, see "设备视频" section
  - Upload a `.mp4` file, confirm filename appears with delete button
  - Click delete, confirm section resets to upload

- [ ] **Step 5: Commit**

```bash
git add client/src/admin/DeviceManager.jsx client/src/admin/admin.css
git commit -m "feat: add video upload UI to DeviceManager"
```

---

### Task 5: Student UI — video player in DeviceProgressCard

**Files:**
- Modify: `client/src/student/DeviceProgressCard.jsx`
- Modify: `client/src/student/student.css`

- [ ] **Step 1: Add video player in `DeviceProgressCard` (between `<header>` and `.device-meter`)**

```jsx
{device.video_filename && (
  <video
    className="device-video-player"
    src={`/uploads/${device.video_filename}`}
    controls
    preload="metadata"
  />
)}
```

- [ ] **Step 2: Add CSS to `student.css` (before the `@media` block)**

```css
.device-video-player { width: 100%; border-radius: 6px; margin: 10px 0 4px; background: #000; max-height: 220px; }
```

- [ ] **Step 3: Verify in browser**
  - Open student dashboard for any company
  - Device with no video: card unchanged
  - Device with video: video player appears above the progress bar, plays correctly

- [ ] **Step 4: Commit**

```bash
git add client/src/student/DeviceProgressCard.jsx client/src/student/student.css
git commit -m "feat: show device video player on student dashboard"
```
