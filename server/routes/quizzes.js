'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { QUIZ_STAGES } = require('../quizSummary');

function isKnownStage(stage_key) {
  return QUIZ_STAGES.some(stage => stage.stage_key === stage_key);
}

function isKnownQuestion(stage_key) {
  return db.getAdminQuizStages().some(stage => stage.stage_key === stage_key);
}

function isKnownActivity(activity_key) {
  return QUIZ_STAGES.some(stage => stage.activity_key === activity_key);
}

function validateQuizPayload(body) {
  const title = String(body.title || '').trim();
  const prompt = String(body.prompt || '').trim();
  const options = Array.isArray(body.options) ? body.options : [];
  const normalizedOptions = options
    .map(option => ({
      label: String(option.label || '').trim(),
      is_correct: Boolean(option.is_correct),
    }))
    .filter(option => option.label);

  if (!title) return { error: '请填写检测名称' };
  if (normalizedOptions.length < 2) return { error: '至少需要两个选项' };
  if (normalizedOptions.filter(option => option.is_correct).length !== 1) {
    return { error: '请设置且仅设置一个正确答案' };
  }

  return { title, prompt, options: normalizedOptions };
}

// GET /company/:company_id
router.get('/company/:company_id', async (req, res) => {
  try {
    res.json(db.getQuizStagesForCompany(req.params.company_id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /:stage_key/submissions
router.post('/:stage_key/submissions', async (req, res) => {
  try {
    if (!isKnownQuestion(req.params.stage_key)) {
      return res.status(404).json({ error: '检测题不存在' });
    }
    const { company_id, option_id } = req.body;
    if (!company_id || !option_id) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const submission = db.submitQuizAnswer(company_id, req.params.stage_key, option_id);
    if (!submission) return res.status(400).json({ error: '无效的答案' });
    res.status(201).json(submission);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin [adminAuth]
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const activity_key = String(req.body.activity_key || '').trim();
    if (!isKnownActivity(activity_key)) {
      return res.status(400).json({ error: '无效的活动类型' });
    }
    const payload = validateQuizPayload(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });
    const stage = db.createQuizQuestion(activity_key, payload.title, payload.prompt, payload.options);
    res.status(201).json(stage);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin [adminAuth]
router.get('/admin', adminAuth, async (req, res) => {
  try {
    res.json(db.getAdminQuizStages());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /admin/:stage_key [adminAuth]
router.put('/admin/:stage_key', adminAuth, async (req, res) => {
  try {
    if (!isKnownQuestion(req.params.stage_key) && !isKnownStage(req.params.stage_key)) {
      return res.status(404).json({ error: '检测题不存在' });
    }
    const payload = validateQuizPayload(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });
    const stage = db.saveQuizQuestion(req.params.stage_key, payload.title, payload.prompt, payload.options);
    res.json(stage);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /admin/:stage_key [adminAuth]
router.delete('/admin/:stage_key', adminAuth, async (req, res) => {
  try {
    if (!isKnownQuestion(req.params.stage_key)) {
      return res.status(404).json({ error: '检测题不存在' });
    }
    db.deleteQuizQuestion(req.params.stage_key);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.validateQuizPayload = validateQuizPayload;

module.exports = router;
