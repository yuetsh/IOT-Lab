'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './server/uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST / — upload screenshot
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { company_id, device_id } = req.body;
    const filename = req.file.filename;
    const original_name = req.file.originalname;
    const id = db.createScreenshot(company_id, device_id || null, filename, original_name);
    res.status(201).json({ id, filename, original_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET / [adminAuth]
router.get('/', adminAuth, async (req, res) => {
  try {
    const screenshots = db.getScreenshots();
    res.json(screenshots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /:company_id
router.get('/:company_id', async (req, res) => {
  try {
    const screenshots = db.getScreenshotsForCompany(req.params.company_id);
    res.json(screenshots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:id [adminAuth]
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const filename = db.deleteScreenshot(req.params.id);
    if (filename) {
      const filepath = path.join(UPLOAD_DIR, filename);
      fs.unlink(filepath, () => {}); // best-effort, ignore errors
    }
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
