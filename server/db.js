'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { buildCompanySummary, buildAdminOverview } = require('./dashboardSummary');
const { QUIZ_STAGES, buildQuizStages } = require('./quizSummary');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'lab.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables in FK-safe order
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    completed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(company_id, checklist_item_id)
  );

  CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    original_name TEXT,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_key TEXT NOT NULL UNIQUE,
    activity_key TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quiz_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quiz_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES quiz_options(id) ON DELETE SET NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    submitted_at TEXT DEFAULT (datetime('now')),
    UNIQUE(company_id, question_id)
  );
`);

const quizQuestionColumns = db.prepare('PRAGMA table_info(quiz_questions)').all();
if (!quizQuestionColumns.some(column => column.name === 'activity_key')) {
  db.exec("ALTER TABLE quiz_questions ADD COLUMN activity_key TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE quiz_questions SET activity_key = stage_key WHERE activity_key = ''");
}

const deviceColumns = db.prepare('PRAGMA table_info(devices)').all();
if (!deviceColumns.some(col => col.name === 'video_filename')) {
  db.exec('ALTER TABLE devices ADD COLUMN video_filename TEXT');
}

const seedQuizStage = db.prepare(`
  INSERT OR IGNORE INTO quiz_questions (stage_key, activity_key, title, prompt, sort_order)
  VALUES (?, ?, ?, '', ?)
`);

QUIZ_STAGES.forEach((stage, index) => {
  seedQuizStage.run(stage.stage_key, stage.activity_key, stage.title, index);
});

// ─── Prepared statements ────────────────────────────────────────────────────

const stmts = {
  // Companies
  getCompanies: db.prepare('SELECT * FROM companies ORDER BY name'),
  getCompany: db.prepare('SELECT * FROM companies WHERE id = ?'),
  createCompany: db.prepare('INSERT INTO companies (name) VALUES (?)'),
  deleteCompany: db.prepare('DELETE FROM companies WHERE id = ?'),

  // Devices
  getDevices: db.prepare('SELECT * FROM devices ORDER BY sort_order'),
  getDevice: db.prepare('SELECT * FROM devices WHERE id = ?'),
  createDevice: db.prepare('INSERT INTO devices (name, sort_order) VALUES (?, ?)'),
  updateDevice: db.prepare('UPDATE devices SET name = ?, sort_order = ? WHERE id = ?'),
  deleteDevice: db.prepare('DELETE FROM devices WHERE id = ?'),
  updateDeviceVideo: db.prepare('UPDATE devices SET video_filename = ? WHERE id = ?'),
  clearDeviceVideo: db.prepare('UPDATE devices SET video_filename = NULL WHERE id = ?'),

  // Checklist items
  getItemsForDevice: db.prepare(
    'SELECT * FROM checklist_items WHERE device_id = ? ORDER BY sort_order'
  ),
  createChecklistItem: db.prepare(
    'INSERT INTO checklist_items (device_id, label, sort_order) VALUES (?, ?, ?)'
  ),
  updateChecklistItem: db.prepare(
    'UPDATE checklist_items SET label = ?, sort_order = ? WHERE id = ?'
  ),
  deleteChecklistItem: db.prepare('DELETE FROM checklist_items WHERE id = ?'),

  // Progress
  getProgressForCompany: db.prepare(
    'SELECT checklist_item_id FROM progress WHERE company_id = ?'
  ),
  getProgressRowsForCompany: db.prepare(
    'SELECT checklist_item_id FROM progress WHERE company_id = ?'
  ),
  addProgress: db.prepare(
    'INSERT OR IGNORE INTO progress (company_id, checklist_item_id) VALUES (?, ?)'
  ),
  removeProgress: db.prepare(
    'DELETE FROM progress WHERE company_id = ? AND checklist_item_id = ?'
  ),

  // Admin: full matrix
  getAllProgress: db.prepare(`
    SELECT
      c.id   AS company_id,
      c.name AS company_name,
      d.id   AS device_id,
      d.name AS device_name,
      ci.id  AS checklist_item_id,
      ci.label,
      CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END AS completed
    FROM companies c
    CROSS JOIN checklist_items ci
    JOIN devices d ON d.id = ci.device_id
    LEFT JOIN progress p
      ON p.company_id = c.id AND p.checklist_item_id = ci.id
    ORDER BY c.name, d.sort_order, ci.sort_order
  `),

  // Screenshots
  createScreenshot: db.prepare(
    'INSERT INTO screenshots (company_id, device_id, filename, original_name) VALUES (?, ?, ?, ?)'
  ),
  getScreenshots: db.prepare(`
    SELECT s.*, c.name AS company_name, d.name AS device_name
    FROM screenshots s
    JOIN companies c ON c.id = s.company_id
    LEFT JOIN devices d ON d.id = s.device_id
    ORDER BY s.uploaded_at DESC
  `),
  getScreenshotsForCompany: db.prepare(`
    SELECT s.*, c.name AS company_name, d.name AS device_name
    FROM screenshots s
    JOIN companies c ON c.id = s.company_id
    LEFT JOIN devices d ON d.id = s.device_id
    WHERE s.company_id = ?
    ORDER BY s.uploaded_at DESC
  `),
  deleteScreenshot: db.prepare('DELETE FROM screenshots WHERE id = ? RETURNING filename'),

  // Quizzes
  getQuizQuestions: db.prepare('SELECT * FROM quiz_questions ORDER BY sort_order, id'),
  getQuizQuestionByStage: db.prepare('SELECT * FROM quiz_questions WHERE stage_key = ?'),
  getQuizMaxSortForActivity: db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM quiz_questions WHERE activity_key = ?'),
  getQuizOptions: db.prepare('SELECT * FROM quiz_options ORDER BY question_id, sort_order, id'),
  getQuizSubmissionsForCompany: db.prepare(`
    SELECT question_id, selected_option_id, is_correct, submitted_at
    FROM quiz_submissions
    WHERE company_id = ?
  `),
  getQuizOption: db.prepare('SELECT * FROM quiz_options WHERE id = ?'),
  upsertQuizQuestion: db.prepare(`
    INSERT INTO quiz_questions (stage_key, activity_key, title, prompt, sort_order)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(stage_key) DO UPDATE SET
      activity_key = excluded.activity_key,
      title = excluded.title,
      prompt = excluded.prompt,
      sort_order = excluded.sort_order
  `),
  createQuizQuestion: db.prepare(`
    INSERT INTO quiz_questions (stage_key, activity_key, title, prompt, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `),
  deleteQuizOptionsForQuestion: db.prepare('DELETE FROM quiz_options WHERE question_id = ?'),
  deleteQuizSubmissionsForQuestion: db.prepare('DELETE FROM quiz_submissions WHERE question_id = ?'),
  createQuizOption: db.prepare(`
    INSERT INTO quiz_options (question_id, label, is_correct, sort_order)
    VALUES (?, ?, ?, ?)
  `),
  upsertQuizSubmission: db.prepare(`
    INSERT INTO quiz_submissions (company_id, question_id, selected_option_id, is_correct)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(company_id, question_id) DO UPDATE SET
      selected_option_id = excluded.selected_option_id,
      is_correct = excluded.is_correct,
      submitted_at = datetime('now')
  `),
};

// ─── Helper functions ────────────────────────────────────────────────────────

// Companies
function getCompanies() {
  return stmts.getCompanies.all();
}

function getCompany(id) {
  return stmts.getCompany.get(id);
}

function createCompany(name) {
  const result = stmts.createCompany.run(name);
  return stmts.getCompany.get(result.lastInsertRowid);
}

function deleteCompany(id) {
  return stmts.deleteCompany.run(id);
}

// Devices
function getDevicesWithItems() {
  const devices = stmts.getDevices.all();
  return devices.map(device => ({
    ...device,
    checklist_items: stmts.getItemsForDevice.all(device.id),
  }));
}

function getDevice(id) {
  return stmts.getDevice.get(id);
}

const createDeviceTransaction = db.transaction((name, sort_order) => {
  const result = stmts.createDevice.run(name, sort_order);
  const id = result.lastInsertRowid;
  stmts.createChecklistItem.run(id, '外观检查', 0);
  stmts.createChecklistItem.run(id, '功能检查', 1);
  return stmts.getDevice.get(id);
});

function createDevice(name, sort_order = 0) {
  return createDeviceTransaction(name, sort_order);
}

function updateDevice(id, name, sort_order) {
  stmts.updateDevice.run(name, sort_order, id);
  return stmts.getDevice.get(id);
}

function deleteDevice(id) {
  return stmts.deleteDevice.run(id);
}

function setDeviceVideo(id, filename) {
  stmts.updateDeviceVideo.run(filename, id);
  return stmts.getDevice.get(id);
}

function clearDeviceVideo(id) {
  stmts.clearDeviceVideo.run(id);
  return stmts.getDevice.get(id);
}

// Checklist Items
function createChecklistItem(device_id, label, sort_order = 0) {
  const result = stmts.createChecklistItem.run(device_id, label, sort_order);
  return { id: result.lastInsertRowid, device_id, label, sort_order };
}

function updateChecklistItem(id, label, sort_order) {
  stmts.updateChecklistItem.run(label, sort_order, id);
  return db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id);
}

function deleteChecklistItem(id) {
  return stmts.deleteChecklistItem.run(id);
}

// Progress
function getProgressForCompany(company_id) {
  return stmts.getProgressForCompany.all(company_id).map(r => r.checklist_item_id);
}

function addProgress(company_id, checklist_item_id) {
  return stmts.addProgress.run(company_id, checklist_item_id);
}

function removeProgress(company_id, checklist_item_id) {
  return stmts.removeProgress.run(company_id, checklist_item_id);
}

// Admin views
function getAllProgress() {
  return stmts.getAllProgress.all();
}

function getStats() {
  const devices = stmts.getDevices.all();
  const companies = stmts.getCompanies.all();

  return devices.map(device => {
    const items = stmts.getItemsForDevice.all(device.id);
    const total_items = items.length;
    const total_companies = companies.length;

    // Count companies that have completed ALL items for this device
    let completed_count = 0;
    if (total_items > 0) {
      const itemIds = items.map(i => i.id);
      const countStmt = db.prepare(
        `SELECT COUNT(*) AS cnt FROM progress
         WHERE company_id = ? AND checklist_item_id IN (${itemIds.map(() => '?').join(',')})`
      );
      for (const company of companies) {
        const completedItems = countStmt.get(company.id, ...itemIds);
        if (completedItems.cnt === total_items) {
          completed_count++;
        }
      }
    }

    return {
      device_id: device.id,
      device_name: device.name,
      total_items,
      total_companies,
      completed_count,
    };
  });
}

function getCompanyDashboardSummary(company_id) {
  const company = getCompany(company_id);
  if (!company) return null;

  const summary = buildCompanySummary({
    company,
    devices: getDevicesWithItems(),
    completedItemIds: stmts.getProgressRowsForCompany.all(company_id).map(row => row.checklist_item_id),
    screenshots: getScreenshotsForCompany(company_id),
  });
  return {
    ...summary,
    quizzes: getQuizStagesForCompany(company_id),
  };
}

function getAdminOverview() {
  const companies = getCompanies();
  const devices = getDevicesWithItems();
  const screenshots = getScreenshots();
  const progressByCompany = new Map(companies.map(company => [
    Number(company.id),
    stmts.getProgressRowsForCompany.all(company.id).map(row => row.checklist_item_id),
  ]));

  return buildAdminOverview({
    companies,
    devices,
    progressByCompany,
    screenshots,
  });
}

// Screenshots
function createScreenshot(company_id, device_id, filename, original_name) {
  const result = stmts.createScreenshot.run(company_id, device_id, filename, original_name);
  return result.lastInsertRowid;
}

function getScreenshots() {
  return stmts.getScreenshots.all();
}

function getScreenshotsForCompany(company_id) {
  return stmts.getScreenshotsForCompany.all(company_id);
}

function deleteScreenshot(id) {
  const row = stmts.deleteScreenshot.get(id);
  return row ? row.filename : null;
}

// Quizzes
function getOptionsByQuestion() {
  const optionsByQuestion = new Map();
  for (const option of stmts.getQuizOptions.all()) {
    const questionId = Number(option.question_id);
    if (!optionsByQuestion.has(questionId)) {
      optionsByQuestion.set(questionId, []);
    }
    optionsByQuestion.get(questionId).push(option);
  }
  return optionsByQuestion;
}

function getQuizStagesForCompany(company_id) {
  return buildQuizStages({
    questions: stmts.getQuizQuestions.all(),
    optionsByQuestion: getOptionsByQuestion(),
    submissions: stmts.getQuizSubmissionsForCompany.all(company_id),
    includeAnswers: false,
  });
}

function getAdminQuizStages() {
  return buildQuizStages({
    questions: stmts.getQuizQuestions.all(),
    optionsByQuestion: getOptionsByQuestion(),
    submissions: [],
    includeAnswers: true,
  });
}

function getKnownActivity(activityKey) {
  return QUIZ_STAGES.find(stage => stage.activity_key === activityKey);
}

function createQuizStageKey(activityKey) {
  return `${activityKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const saveQuizQuestionTransaction = db.transaction((stage_key, activity_key, title, prompt, options) => {
  const stageIndex = QUIZ_STAGES.findIndex(stage => stage.stage_key === stage_key);
  const sortOrder = stageIndex >= 0
    ? stageIndex
    : Number(stmts.getQuizQuestionByStage.get(stage_key)?.sort_order ?? 0);
  stmts.upsertQuizQuestion.run(stage_key, activity_key, title, prompt, sortOrder);
  const question = stmts.getQuizQuestionByStage.get(stage_key);
  stmts.deleteQuizSubmissionsForQuestion.run(question.id);
  stmts.deleteQuizOptionsForQuestion.run(question.id);
  options.forEach((option, index) => {
    stmts.createQuizOption.run(question.id, option.label, option.is_correct ? 1 : 0, index);
  });
  return question;
});

function saveQuizQuestion(stage_key, title, prompt, options) {
  const existing = stmts.getQuizQuestionByStage.get(stage_key);
  saveQuizQuestionTransaction(stage_key, existing?.activity_key || stage_key, title, prompt, options);
  return getAdminQuizStages().find(stage => stage.stage_key === stage_key);
}

const createQuizQuestionTransaction = db.transaction((activity_key, title, prompt, options) => {
  const stageKey = createQuizStageKey(activity_key);
  const maxSort = stmts.getQuizMaxSortForActivity.get(activity_key).max_sort;
  stmts.createQuizQuestion.run(stageKey, activity_key, title, prompt, Number(maxSort) + 1);
  const question = stmts.getQuizQuestionByStage.get(stageKey);
  options.forEach((option, index) => {
    stmts.createQuizOption.run(question.id, option.label, option.is_correct ? 1 : 0, index);
  });
  return question;
});

function createQuizQuestion(activity_key, title, prompt, options) {
  if (!getKnownActivity(activity_key)) return null;
  const question = createQuizQuestionTransaction(activity_key, title, prompt, options);
  return getAdminQuizStages().find(stage => stage.stage_key === question.stage_key);
}

function submitQuizAnswer(company_id, stage_key, option_id) {
  const question = stmts.getQuizQuestionByStage.get(stage_key);
  if (!question || !question.prompt) return null;

  const option = stmts.getQuizOption.get(option_id);
  if (!option || Number(option.question_id) !== Number(question.id)) return null;

  stmts.upsertQuizSubmission.run(company_id, question.id, option.id, option.is_correct ? 1 : 0);
  return {
    selected_option_id: option.id,
    is_correct: Boolean(option.is_correct),
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  db,
  // Companies
  getCompanies,
  getCompany,
  createCompany,
  deleteCompany,
  // Devices
  getDevicesWithItems,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  setDeviceVideo,
  clearDeviceVideo,
  // Checklist Items
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  // Progress
  getProgressForCompany,
  addProgress,
  removeProgress,
  // Admin
  getAllProgress,
  getStats,
  getCompanyDashboardSummary,
  getAdminOverview,
  // Screenshots
  createScreenshot,
  getScreenshots,
  getScreenshotsForCompany,
  deleteScreenshot,
  // Quizzes
  getQuizStagesForCompany,
  getAdminQuizStages,
  createQuizQuestion,
  saveQuizQuestion,
  submitQuizAnswer,
};
