'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

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
      return res.status(400).json({ error: 'name is required' });
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

module.exports = router;
