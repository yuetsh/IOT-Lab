'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

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
`);

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

function createDevice(name, sort_order = 0) {
  const result = stmts.createDevice.run(name, sort_order);
  return stmts.getDevice.get(result.lastInsertRowid);
}

function updateDevice(id, name, sort_order) {
  stmts.updateDevice.run(name, sort_order, id);
  return stmts.getDevice.get(id);
}

function deleteDevice(id) {
  return stmts.deleteDevice.run(id);
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
  // Screenshots
  createScreenshot,
  getScreenshots,
  getScreenshotsForCompany,
  deleteScreenshot,
};
