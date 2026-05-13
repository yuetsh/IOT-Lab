'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

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
  limits: { fileSize: 500 * 1024 * 1024 },
});

// GET /
router.get('/', async (req, res) => {
  try {
    const devices = db.getDevicesWithItems();
    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST / [adminAuth]
router.post('/', adminAuth, async (req, res) => {
  try {
    if (!req.body.name || typeof req.body.name !== 'string') {
      return res.status(400).json({ error: '请填写设备名称' });
    }
    const { name, sort_order } = req.body;
    const device = db.createDevice(name, sort_order);
    res.status(201).json(device);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /:id [adminAuth]
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const device = db.updateDevice(req.params.id, name, sort_order);
    res.status(200).json(device);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:id [adminAuth]
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    db.deleteDevice(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
    if (device.video_filename) {
      fs.unlink(path.join(UPLOAD_DIR, device.video_filename), (err) => { if (err) console.error('Failed to unlink video:', err.message); });
    }
    const updated = db.setDeviceVideo(req.params.id, req.file.filename);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:id/video [adminAuth]
router.delete('/:id/video', adminAuth, async (req, res) => {
  try {
    const device = db.getDevice(req.params.id);
    if (!device) return res.status(404).json({ error: '设备不存在' });
    if (device.video_filename) {
      fs.unlink(path.join(UPLOAD_DIR, device.video_filename), (err) => { if (err) console.error('Failed to unlink video:', err.message); });
    }
    const updated = db.clearDeviceVideo(req.params.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
