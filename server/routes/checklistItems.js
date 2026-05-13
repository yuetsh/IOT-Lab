'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

// POST / [adminAuth]
router.post('/', adminAuth, async (req, res) => {
  try {
    const { device_id, label, sort_order } = req.body;
    const item = db.createChecklistItem(device_id, label, sort_order);
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /:id [adminAuth]
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { label, sort_order } = req.body;
    const item = db.updateChecklistItem(req.params.id, label, sort_order);
    res.status(200).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:id [adminAuth]
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    db.deleteChecklistItem(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
