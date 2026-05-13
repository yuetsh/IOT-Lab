'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

// GET /admin/overview [adminAuth] — must be before /:company_id to avoid param capture
router.get('/admin/overview', adminAuth, async (req, res) => {
  try {
    const overview = db.getAdminOverview();
    res.json(overview);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/all [adminAuth]
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const progress = db.getAllProgress();
    res.json(progress);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/stats [adminAuth]
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /company/:company_id/summary
router.get('/company/:company_id/summary', async (req, res) => {
  try {
    const summary = db.getCompanyDashboardSummary(req.params.company_id);
    if (!summary) return res.status(404).json({ error: '检测小组不存在' });
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /:company_id
router.get('/:company_id', async (req, res) => {
  try {
    const items = db.getProgressForCompany(req.params.company_id);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { company_id, checklist_item_id } = req.body;
    db.addProgress(company_id, checklist_item_id);
    res.status(201).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:company_id/:item_id
router.delete('/:company_id/:item_id', async (req, res) => {
  try {
    db.removeProgress(req.params.company_id, req.params.item_id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
