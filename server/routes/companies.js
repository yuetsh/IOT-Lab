'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

// GET /
router.get('/', async (req, res) => {
  try {
    const companies = db.getCompanies();
    res.json(companies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST / [adminAuth]
router.post('/', adminAuth, async (req, res) => {
  try {
    if (!req.body.name || typeof req.body.name !== 'string') {
      return res.status(400).json({ error: '请填写检测小组名称' });
    }
    const company = db.createCompany(req.body.name);
    res.status(201).json(company);
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: '检测小组名称已存在' });
    }
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:id [adminAuth]
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    db.deleteCompany(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
