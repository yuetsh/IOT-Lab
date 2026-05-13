# Frontend Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark, company-focused dashboard redesign for the student and admin experiences, including backend summary endpoints and admin charts.

**Architecture:** Add pure dashboard summary builders first, expose them through new Express aggregate endpoints, then consume those endpoints from focused React dashboard components. Keep the existing SQLite schema and current workflows intact while moving dashboard aggregation out of route components and duplicated frontend code.

**Tech Stack:** React 19, Vite, React Router 7, HeroUI, CSS modules by existing stylesheet files, Express 5, better-sqlite3, Node built-in `node:test`.

---

## Pre-Flight Notes

- The current worktree already contains unrelated uncommitted changes in client files. Before editing, run `rtk git status --short` and inspect any file before modifying it.
- Do not delete or revert user changes.
- Do not commit `.superpowers/` visual brainstorming files.
- Use two-space indentation in JavaScript and CSS.
- Keep screenshots company-level. Do not add device-level screenshot UI.

## File Map

Create:

- `server/dashboardSummary.js`: pure summary and chart data builders shared by DB helpers.
- `server/tests/dashboardSummary.test.js`: Node built-in tests for summary rules.
- `client/src/student/StudentDashboard.jsx`: selected-company dashboard shell.
- `client/src/student/ProgressSummary.jsx`: total progress and screenshot count card.
- `client/src/student/DeviceProgressGrid.jsx`: device card grid.
- `client/src/student/DeviceProgressCard.jsx`: one device card with checklist controls.
- `client/src/student/CompanyScreenshotPanel.jsx`: company-level screenshot upload panel.
- `client/src/admin/AdminDashboard.jsx`: admin overview page.
- `client/src/admin/AdminSummaryCards.jsx`: top KPI cards.
- `client/src/admin/CompletionDonut.jsx`: CSS donut chart.
- `client/src/admin/CompanyRankChart.jsx`: company completion ranking bars.
- `client/src/admin/ScreenshotBarChart.jsx`: screenshot count bars.
- `client/src/admin/DeviceBottleneckChart.jsx`: device completion bars.
- `client/src/admin/CompanyProgressCards.jsx`: company-focused detail cards.
- `client/src/dashboardMetrics.js`: shared percentage/status helpers for frontend display.

Modify:

- `server/package.json`: replace the default failing test script with `node --test tests/*.test.js`.
- `server/db.js`: add aggregate helper exports using `dashboardSummary.js`.
- `server/routes/progress.js`: add `/company/:company_id/summary` and `/admin/overview`.
- `client/src/api.js`: add `getCompanySummary()` and `adminGetOverview()`.
- `client/src/student/StudentApp.jsx`: route selected company to `StudentDashboard`.
- `client/src/student/CompanySelect.jsx`: adopt dark dashboard entry styling.
- `client/src/student/ScreenshotUpload.jsx`: support `onUploaded` callback and clearer company-level upload status.
- `client/src/student/student.css`: replace light student layout with dark dashboard system.
- `client/src/admin/AdminApp.jsx`: add dashboard route and default redirect.
- `client/src/admin/admin.css`: replace light admin layout with dark console and chart styles.
- `client/src/index.css`: add root-level reset and dark background support if needed.

Validation:

- `rtk npm test --prefix server`
- `rtk npm run lint --prefix client`
- `rtk npm run build`

---

### Task 1: Add Pure Dashboard Summary Builders

**Files:**

- Create: `server/dashboardSummary.js`
- Create: `server/tests/dashboardSummary.test.js`
- Modify: `server/package.json`

- [ ] **Step 1: Write failing tests for dashboard rules**

Create `server/tests/dashboardSummary.test.js` with this content:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculatePercent,
  getCompanyStatus,
  buildCompanySummary,
  buildAdminOverview,
} = require('../dashboardSummary');

const devices = [
  {
    id: 1,
    name: '设备 1',
    sort_order: 1,
    checklist_items: [
      { id: 11, device_id: 1, label: '连接电源', sort_order: 1 },
      { id: 12, device_id: 1, label: '配置网络', sort_order: 2 },
    ],
  },
  {
    id: 2,
    name: '设备 2',
    sort_order: 2,
    checklist_items: [
      { id: 21, device_id: 2, label: '启动服务', sort_order: 1 },
    ],
  },
];

test('calculatePercent rounds safely and handles zero totals', () => {
  assert.equal(calculatePercent(0, 0), 0);
  assert.equal(calculatePercent(1, 3), 33);
  assert.equal(calculatePercent(2, 3), 67);
  assert.equal(calculatePercent(3, 3), 100);
});

test('getCompanyStatus follows complete, in_progress, and not_started rules', () => {
  assert.equal(getCompanyStatus(0, 0), 'not_started');
  assert.equal(getCompanyStatus(0, 3), 'not_started');
  assert.equal(getCompanyStatus(1, 3), 'in_progress');
  assert.equal(getCompanyStatus(3, 3), 'complete');
});

test('buildCompanySummary returns company-level screenshot and device progress', () => {
  const summary = buildCompanySummary({
    company: { id: 7, name: '星河科技' },
    devices,
    completedItemIds: [11, 21],
    screenshots: [
      { id: 2, company_id: 7, filename: 'b.png', original_name: 'b.png', uploaded_at: '2026-05-13 10:00:00' },
      { id: 1, company_id: 7, filename: 'a.png', original_name: 'a.png', uploaded_at: '2026-05-13 09:00:00' },
    ],
  });

  assert.equal(summary.company.id, 7);
  assert.equal(summary.total_items, 3);
  assert.equal(summary.completed_items, 2);
  assert.equal(summary.completion_percent, 67);
  assert.equal(summary.status, 'in_progress');
  assert.equal(summary.screenshot_count, 2);
  assert.equal(summary.latest_screenshot.filename, 'b.png');
  assert.deepEqual(
    summary.devices.map(device => ({
      name: device.name,
      completed_items: device.completed_items,
      total_items: device.total_items,
      completion_percent: device.completion_percent,
    })),
    [
      { name: '设备 1', completed_items: 1, total_items: 2, completion_percent: 50 },
      { name: '设备 2', completed_items: 1, total_items: 1, completion_percent: 100 },
    ]
  );
  assert.equal(summary.devices[0].checklist_items[0].completed, true);
  assert.equal(summary.devices[0].checklist_items[1].completed, false);
});

test('buildAdminOverview emphasizes company completion and chart data', () => {
  const companies = [
    { id: 1, name: '航点智能' },
    { id: 2, name: '云启网络' },
    { id: 3, name: '锐联实验组' },
  ];
  const progressByCompany = new Map([
    [1, [11, 12, 21]],
    [2, [11]],
    [3, []],
  ]);
  const screenshots = [
    { id: 1, company_id: 1, filename: 'one.png', uploaded_at: '2026-05-13 09:00:00' },
    { id: 2, company_id: 1, filename: 'two.png', uploaded_at: '2026-05-13 09:10:00' },
    { id: 3, company_id: 2, filename: 'three.png', uploaded_at: '2026-05-13 09:20:00' },
  ];

  const overview = buildAdminOverview({ companies, devices, progressByCompany, screenshots });

  assert.equal(overview.summary.company_count, 3);
  assert.equal(overview.summary.device_count, 2);
  assert.equal(overview.summary.checklist_item_count, 3);
  assert.equal(overview.summary.screenshot_count, 3);
  assert.equal(overview.summary.complete_company_count, 1);
  assert.equal(overview.summary.in_progress_company_count, 1);
  assert.equal(overview.summary.not_started_company_count, 1);
  assert.equal(overview.summary.average_completion_percent, 44);
  assert.deepEqual(
    overview.status_distribution.map(row => [row.status, row.count]),
    [['complete', 1], ['in_progress', 1], ['not_started', 1]]
  );
  assert.deepEqual(
    overview.company_rankings.map(row => [row.company_name, row.completion_percent]),
    [['航点智能', 100], ['云启网络', 33], ['锐联实验组', 0]]
  );
  assert.deepEqual(
    overview.screenshot_chart.map(row => [row.company_name, row.screenshot_count]),
    [['航点智能', 2], ['云启网络', 1], ['锐联实验组', 0]]
  );
  assert.deepEqual(
    overview.device_bottlenecks.map(row => [row.device_name, row.completion_percent]),
    [['设备 1', 50], ['设备 2', 33]]
  );
});
```

- [ ] **Step 2: Update the server test script**

Modify `server/package.json` so the scripts block is exactly:

```json
"scripts": {
  "dev": "node --watch index.js",
  "test": "node --test tests/*.test.js"
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
rtk npm test --prefix server
```

Expected: FAIL because `server/dashboardSummary.js` does not exist or does not export the required functions.

- [ ] **Step 4: Implement pure summary builders**

Create `server/dashboardSummary.js`:

```js
'use strict';

function calculatePercent(completed, total) {
  if (!total || total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function getCompanyStatus(completed, total) {
  if (!total || completed <= 0) return 'not_started';
  if (completed >= total) return 'complete';
  return 'in_progress';
}

function normalizeCompletedIds(completedItemIds) {
  if (completedItemIds instanceof Set) return completedItemIds;
  return new Set((completedItemIds || []).map(Number));
}

function sortScreenshots(screenshots) {
  return [...(screenshots || [])].sort((a, b) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || '')));
}

function buildCompanySummary({ company, devices, completedItemIds, screenshots }) {
  const completedSet = normalizeCompletedIds(completedItemIds);
  const deviceSummaries = (devices || []).map(device => {
    const items = device.checklist_items || [];
    const checklistItems = items.map(item => ({
      ...item,
      completed: completedSet.has(Number(item.id)),
    }));
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => item.completed).length;

    return {
      id: device.id,
      name: device.name,
      sort_order: device.sort_order,
      total_items: totalItems,
      completed_items: completedItems,
      completion_percent: calculatePercent(completedItems, totalItems),
      status: getCompanyStatus(completedItems, totalItems),
      checklist_items: checklistItems,
    };
  });

  const totalItems = deviceSummaries.reduce((sum, device) => sum + device.total_items, 0);
  const completedItems = deviceSummaries.reduce((sum, device) => sum + device.completed_items, 0);
  const orderedScreenshots = sortScreenshots(screenshots);

  return {
    company,
    total_items: totalItems,
    completed_items: completedItems,
    completion_percent: calculatePercent(completedItems, totalItems),
    status: getCompanyStatus(completedItems, totalItems),
    screenshot_count: orderedScreenshots.length,
    latest_screenshot: orderedScreenshots[0] || null,
    devices: deviceSummaries,
  };
}

function buildScreenshotCounts(companies, screenshots) {
  const counts = new Map((companies || []).map(company => [Number(company.id), 0]));
  for (const screenshot of screenshots || []) {
    const companyId = Number(screenshot.company_id);
    counts.set(companyId, (counts.get(companyId) || 0) + 1);
  }
  return counts;
}

function buildAdminOverview({ companies, devices, progressByCompany, screenshots }) {
  const screenshotCounts = buildScreenshotCounts(companies, screenshots);
  const companyCards = (companies || []).map(company => {
    const companyScreenshots = (screenshots || []).filter(screenshot => Number(screenshot.company_id) === Number(company.id));
    const summary = buildCompanySummary({
      company,
      devices,
      completedItemIds: progressByCompany.get(Number(company.id)) || [],
      screenshots: companyScreenshots,
    });

    return {
      company_id: company.id,
      company_name: company.name,
      total_items: summary.total_items,
      completed_items: summary.completed_items,
      completion_percent: summary.completion_percent,
      status: summary.status,
      screenshot_count: screenshotCounts.get(Number(company.id)) || 0,
      unfinished_items: Math.max(summary.total_items - summary.completed_items, 0),
      devices: summary.devices.map(device => ({
        device_id: device.id,
        device_name: device.name,
        total_items: device.total_items,
        completed_items: device.completed_items,
        completion_percent: device.completion_percent,
        status: device.status,
      })),
    };
  });

  const totalItems = (devices || []).reduce((sum, device) => sum + (device.checklist_items || []).length, 0);
  const averageCompletion = companyCards.length
    ? Math.round(companyCards.reduce((sum, company) => sum + company.completion_percent, 0) / companyCards.length)
    : 0;

  const statusCounts = {
    complete: companyCards.filter(company => company.status === 'complete').length,
    in_progress: companyCards.filter(company => company.status === 'in_progress').length,
    not_started: companyCards.filter(company => company.status === 'not_started').length,
  };

  const deviceBottlenecks = (devices || []).map(device => {
    const itemIds = new Set((device.checklist_items || []).map(item => Number(item.id)));
    const totalPossible = itemIds.size * (companies || []).length;
    let completed = 0;

    for (const itemIdsForCompany of progressByCompany.values()) {
      for (const itemId of itemIdsForCompany) {
        if (itemIds.has(Number(itemId))) completed += 1;
      }
    }

    return {
      device_id: device.id,
      device_name: device.name,
      total_items: totalPossible,
      completed_items: completed,
      completion_percent: calculatePercent(completed, totalPossible),
    };
  }).sort((a, b) => a.completion_percent - b.completion_percent || String(a.device_name).localeCompare(String(b.device_name), 'zh-Hans-CN'));

  return {
    summary: {
      company_count: (companies || []).length,
      device_count: (devices || []).length,
      checklist_item_count: totalItems,
      screenshot_count: (screenshots || []).length,
      average_completion_percent: averageCompletion,
      complete_company_count: statusCounts.complete,
      in_progress_company_count: statusCounts.in_progress,
      not_started_company_count: statusCounts.not_started,
    },
    status_distribution: [
      { status: 'complete', label: '已完成', count: statusCounts.complete },
      { status: 'in_progress', label: '进行中', count: statusCounts.in_progress },
      { status: 'not_started', label: '未开始', count: statusCounts.not_started },
    ],
    company_rankings: [...companyCards]
      .sort((a, b) => b.completion_percent - a.completion_percent || String(a.company_name).localeCompare(String(b.company_name), 'zh-Hans-CN'))
      .map(company => ({
        company_id: company.company_id,
        company_name: company.company_name,
        completion_percent: company.completion_percent,
        status: company.status,
      })),
    screenshot_chart: companyCards.map(company => ({
      company_id: company.company_id,
      company_name: company.company_name,
      screenshot_count: company.screenshot_count,
    })),
    device_bottlenecks: deviceBottlenecks,
    company_cards: companyCards,
  };
}

module.exports = {
  calculatePercent,
  getCompanyStatus,
  buildCompanySummary,
  buildAdminOverview,
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
rtk npm test --prefix server
```

Expected: PASS with four passing tests.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
rtk git status --short
rtk git add server/package.json server/dashboardSummary.js server/tests/dashboardSummary.test.js
rtk git commit -m "Add dashboard summary builders"
```

Expected: Commit includes only these three files.

---

### Task 2: Expose Dashboard Summary APIs

**Files:**

- Modify: `server/db.js`
- Modify: `server/routes/progress.js`
- Modify: `client/src/api.js`
- Test: `server/tests/dashboardSummary.test.js`

- [ ] **Step 1: Add route-level tests for endpoint data shape through helper functions**

Append this test to `server/tests/dashboardSummary.test.js`:

```js
test('buildAdminOverview returns stable empty-state data', () => {
  const overview = buildAdminOverview({
    companies: [],
    devices: [],
    progressByCompany: new Map(),
    screenshots: [],
  });

  assert.deepEqual(overview.summary, {
    company_count: 0,
    device_count: 0,
    checklist_item_count: 0,
    screenshot_count: 0,
    average_completion_percent: 0,
    complete_company_count: 0,
    in_progress_company_count: 0,
    not_started_company_count: 0,
  });
  assert.deepEqual(overview.status_distribution, [
    { status: 'complete', label: '已完成', count: 0 },
    { status: 'in_progress', label: '进行中', count: 0 },
    { status: 'not_started', label: '未开始', count: 0 },
  ]);
  assert.deepEqual(overview.company_rankings, []);
  assert.deepEqual(overview.screenshot_chart, []);
  assert.deepEqual(overview.device_bottlenecks, []);
  assert.deepEqual(overview.company_cards, []);
});
```

- [ ] **Step 2: Run tests**

Run:

```bash
rtk npm test --prefix server
```

Expected: PASS. This locks the empty-state behavior before wiring routes.

- [ ] **Step 3: Add DB aggregate helper functions**

Modify `server/db.js`:

1. Add this require near the existing requires:

```js
const { buildCompanySummary, buildAdminOverview } = require('./dashboardSummary');
```

2. Add this prepared statement to `stmts` after `getProgressForCompany`:

```js
  getProgressRowsForCompany: db.prepare(
    'SELECT checklist_item_id FROM progress WHERE company_id = ?'
  ),
```

3. Add these helper functions after `getStats()`:

```js
function getCompanyDashboardSummary(company_id) {
  const company = getCompany(company_id);
  if (!company) return null;

  return buildCompanySummary({
    company,
    devices: getDevicesWithItems(),
    completedItemIds: stmts.getProgressRowsForCompany.all(company_id).map(row => row.checklist_item_id),
    screenshots: getScreenshotsForCompany(company_id),
  });
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
```

4. Add these names to `module.exports` under the Admin exports:

```js
  getCompanyDashboardSummary,
  getAdminOverview,
```

- [ ] **Step 4: Add progress summary routes**

Modify `server/routes/progress.js`:

1. Insert this route before `/admin/all`:

```js
// GET /admin/overview [adminAuth]
router.get('/admin/overview', adminAuth, async (req, res) => {
  try {
    const overview = db.getAdminOverview();
    res.json(overview);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

2. Insert this route before `/:company_id`:

```js
// GET /company/:company_id/summary
router.get('/company/:company_id/summary', async (req, res) => {
  try {
    const summary = db.getCompanyDashboardSummary(req.params.company_id);
    if (!summary) return res.status(404).json({ error: 'Company not found' });
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

Route order must be:

```js
router.get('/admin/overview', adminAuth, async (req, res) => {});
router.get('/admin/all', adminAuth, async (req, res) => {});
router.get('/admin/stats', adminAuth, async (req, res) => {});
router.get('/company/:company_id/summary', async (req, res) => {});
router.get('/:company_id', async (req, res) => {});
```

- [ ] **Step 5: Add frontend API helpers**

Modify `client/src/api.js`:

1. Add this public method near `getProgress`:

```js
  getCompanySummary: (companyId) => request('GET', `/progress/company/${companyId}/summary`),
```

2. Add this admin method near `adminGetStats`:

```js
      adminGetOverview: () => adminRequest('GET', '/progress/admin/overview'),
```

- [ ] **Step 6: Run backend tests**

Run:

```bash
rtk npm test --prefix server
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
rtk git status --short
rtk git add server/db.js server/routes/progress.js client/src/api.js server/tests/dashboardSummary.test.js
rtk git commit -m "Add dashboard overview APIs"
```

Expected: Commit includes the API wiring and the updated summary test file.

---

### Task 3: Build Shared Frontend Metric Helpers

**Files:**

- Create: `client/src/dashboardMetrics.js`

- [ ] **Step 1: Create display helper module**

Create `client/src/dashboardMetrics.js`:

```js
export function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function statusLabel(status) {
  const labels = {
    complete: '已完成',
    in_progress: '进行中',
    not_started: '未开始',
  };
  return labels[status] || '未开始';
}

export function statusTone(status) {
  if (status === 'complete') return 'complete';
  if (status === 'in_progress') return 'progress';
  return 'idle';
}

export function formatCount(current, total) {
  return `${Number(current) || 0}/${Number(total) || 0}`;
}
```

- [ ] **Step 2: Run client lint**

Run:

```bash
rtk npm run lint --prefix client
```

Expected: PASS or only pre-existing lint failures unrelated to `client/src/dashboardMetrics.js`. If lint fails in this new file, fix it before continuing.

- [ ] **Step 3: Commit Task 3**

Run:

```bash
rtk git add client/src/dashboardMetrics.js
rtk git commit -m "Add dashboard metric helpers"
```

Expected: Commit includes only `client/src/dashboardMetrics.js`.

---

### Task 4: Build Student Dashboard Components

**Files:**

- Create: `client/src/student/StudentDashboard.jsx`
- Create: `client/src/student/ProgressSummary.jsx`
- Create: `client/src/student/DeviceProgressGrid.jsx`
- Create: `client/src/student/DeviceProgressCard.jsx`
- Create: `client/src/student/CompanyScreenshotPanel.jsx`
- Modify: `client/src/student/StudentApp.jsx`
- Modify: `client/src/student/ScreenshotUpload.jsx`
- Modify: `client/src/student/student.css`
- Modify: `client/src/student/CompanySelect.jsx`

- [ ] **Step 1: Update screenshot upload to notify parent after upload**

Modify `client/src/student/ScreenshotUpload.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { Alert, Button } from '@heroui/react';
import { api } from '../api';
import './student.css';

export default function ScreenshotUpload({ companyId, deviceId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(e) {
    const nextFile = e.target.files[0] || null;
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
    setStatus('');
    setMessage('');
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      const result = await api.uploadScreenshot(companyId, deviceId, file);
      setStatus('success');
      setMessage('上传成功');
      setFile(null);
      setPreview(null);
      onUploaded?.(result);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  return (
    <div className="screenshot-upload">
      {preview && (
        <div className="upload-preview">
          <img src={preview} alt="预览" />
        </div>
      )}
      <div className="upload-controls">
        <input
          key={status === 'success' ? 'reset' : 'active'}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button
          className="upload-btn"
          onPress={handleUpload}
          isDisabled={!file || status === 'uploading'}
        >
          {status === 'uploading' ? '上传中...' : '上传截图'}
        </Button>
      </div>
      {message && (
        <Alert className="upload-msg" status={status === 'success' ? 'success' : 'danger'}>
          <Alert.Content>
            <Alert.Description>{message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create student progress summary**

Create `client/src/student/ProgressSummary.jsx`:

```jsx
import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './student.css';

export default function ProgressSummary({ summary }) {
  const percent = clampPercent(summary.completion_percent);
  const tone = statusTone(summary.status);

  return (
    <section className={`student-panel progress-summary ${tone}`}>
      <div>
        <p className="panel-label">总体完成率</p>
        <div className="progress-number">{percent}%</div>
        <p className="panel-muted">
          已完成 {formatCount(summary.completed_items, summary.total_items)} 项 · {statusLabel(summary.status)}
        </p>
      </div>
      <div className="summary-meter" aria-label={`总体完成率 ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create student device progress card**

Create `client/src/student/DeviceProgressCard.jsx`:

```jsx
import { Chip } from '@heroui/react';
import ChecklistItem from './ChecklistItem';
import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './student.css';

export default function DeviceProgressCard({ device, onToggle }) {
  const percent = clampPercent(device.completion_percent);
  const tone = statusTone(device.status);

  return (
    <article className={`student-panel device-progress-card ${tone}`}>
      <header className="device-progress-head">
        <div>
          <p className="panel-label">设备</p>
          <h3>{device.name}</h3>
        </div>
        <Chip className="progress-badge" color="accent" variant="soft" size="sm">
          {formatCount(device.completed_items, device.total_items)}
        </Chip>
      </header>
      <div className="device-meter" aria-label={`${device.name} 完成率 ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="panel-muted">{percent}% · {statusLabel(device.status)}</p>
      <div className="checklist">
        {device.checklist_items.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            checked={Boolean(item.completed)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Create student device grid**

Create `client/src/student/DeviceProgressGrid.jsx`:

```jsx
import DeviceProgressCard from './DeviceProgressCard';
import './student.css';

export default function DeviceProgressGrid({ devices, onToggle }) {
  if (!devices.length) {
    return (
      <section className="student-panel empty-panel">
        <p>暂无设备清单，请联系教师添加。</p>
      </section>
    );
  }

  return (
    <section className="device-progress-grid">
      {devices.map(device => (
        <DeviceProgressCard key={device.id} device={device} onToggle={onToggle} />
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Create company screenshot panel**

Create `client/src/student/CompanyScreenshotPanel.jsx`:

```jsx
import ScreenshotUpload from './ScreenshotUpload';
import './student.css';

export default function CompanyScreenshotPanel({ companyId, summary, onUploaded }) {
  return (
    <section className="student-panel screenshot-panel">
      <div className="panel-heading-row">
        <div>
          <p className="panel-label">公司截图凭证</p>
          <h2>上传实验截图</h2>
        </div>
        <strong>{summary.screenshot_count || 0} 张</strong>
      </div>
      <p className="panel-muted">截图按公司归档，教师后台会按公司查看提交情况。</p>
      {summary.latest_screenshot && (
        <p className="latest-shot">
          最近上传：{summary.latest_screenshot.original_name || summary.latest_screenshot.filename}
        </p>
      )}
      <ScreenshotUpload companyId={companyId} onUploaded={onUploaded} />
    </section>
  );
}
```

- [ ] **Step 6: Create student dashboard shell**

Create `client/src/student/StudentDashboard.jsx`:

```jsx
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from '@heroui/react';
import { api } from '../api';
import ProgressSummary from './ProgressSummary';
import DeviceProgressGrid from './DeviceProgressGrid';
import CompanyScreenshotPanel from './CompanyScreenshotPanel';
import './student.css';

export default function StudentDashboard({ company, onChangeCompany }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState(new Set());

  const loadSummary = useCallback(() => {
    setLoading(true);
    setError('');
    return api.getCompanySummary(company.id)
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [company.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function handleToggle(itemId, checked) {
    if (pendingIds.has(itemId) || !summary) return;

    setPendingIds(prev => new Set(prev).add(itemId));
    setSummary(prev => updateSummaryItem(prev, itemId, checked));

    try {
      if (checked) {
        await api.addProgress(company.id, itemId);
      } else {
        await api.removeProgress(company.id, itemId);
      }
      await loadSummary();
    } catch (e) {
      setError(e.message);
      setSummary(prev => updateSummaryItem(prev, itemId, !checked));
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="student-shell center-msg">
        <Spinner size="lg" />
        <span>加载实验数据...</span>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="student-shell">
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>加载失败</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    );
  }

  return (
    <main className="student-shell">
      <header className="student-hero">
        <div>
          <p className="project-eyebrow">设备调试实验平台</p>
          <h1>{company.name} 实验驾驶舱</h1>
          <p className="project-intro">勾选设备调试清单并上传公司实验截图，进度会同步到教师后台。</p>
        </div>
        <Button className="link-btn" variant="ghost" size="sm" onPress={onChangeCompany}>
          切换公司
        </Button>
      </header>

      {error && (
        <Alert className="dashboard-alert" status="danger">
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="student-dashboard-grid">
        <ProgressSummary summary={summary} />
        <CompanyScreenshotPanel
          companyId={company.id}
          summary={summary}
          onUploaded={loadSummary}
        />
      </div>
      <DeviceProgressGrid devices={summary.devices || []} onToggle={handleToggle} />
    </main>
  );
}

function updateSummaryItem(summary, itemId, checked) {
  if (!summary) return summary;
  return {
    ...summary,
    devices: summary.devices.map(device => ({
      ...device,
      checklist_items: device.checklist_items.map(item => (
        item.id === itemId ? { ...item, completed: checked } : item
      )),
    })),
  };
}
```

- [ ] **Step 7: Route selected company to the new dashboard**

Modify `client/src/student/StudentApp.jsx`:

```jsx
import { useState } from 'react';
import CompanySelect from './CompanySelect';
import StudentDashboard from './StudentDashboard';

export default function StudentApp() {
  const [company, setCompany] = useState(() => {
    const id = localStorage.getItem('selectedCompanyId');
    const name = localStorage.getItem('selectedCompanyName');
    return id && name ? { id: Number(id), name } : null;
  });

  function handleSelect(c) {
    localStorage.setItem('selectedCompanyId', c.id);
    localStorage.setItem('selectedCompanyName', c.name);
    setCompany(c);
  }

  function handleChange() {
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyName');
    setCompany(null);
  }

  if (!company) return <CompanySelect onSelect={handleSelect} />;
  return <StudentDashboard company={company} onChangeCompany={handleChange} />;
}
```

- [ ] **Step 8: Run client lint**

Run:

```bash
rtk npm run lint --prefix client
```

Expected: PASS or lint failures from pre-existing dirty files. Fix all lint errors introduced by Task 4.

- [ ] **Step 9: Commit Task 4**

Run:

```bash
rtk git add client/src/student/StudentDashboard.jsx client/src/student/ProgressSummary.jsx client/src/student/DeviceProgressGrid.jsx client/src/student/DeviceProgressCard.jsx client/src/student/CompanyScreenshotPanel.jsx client/src/student/StudentApp.jsx client/src/student/ScreenshotUpload.jsx
rtk git commit -m "Add student experiment dashboard"
```

Expected: Commit contains student dashboard components and the upload callback change.

---

### Task 5: Build Admin Dashboard And Charts

**Files:**

- Create: `client/src/admin/AdminDashboard.jsx`
- Create: `client/src/admin/AdminSummaryCards.jsx`
- Create: `client/src/admin/CompletionDonut.jsx`
- Create: `client/src/admin/CompanyRankChart.jsx`
- Create: `client/src/admin/ScreenshotBarChart.jsx`
- Create: `client/src/admin/DeviceBottleneckChart.jsx`
- Create: `client/src/admin/CompanyProgressCards.jsx`
- Modify: `client/src/admin/AdminApp.jsx`
- Modify: `client/src/admin/admin.css`

- [ ] **Step 1: Create summary cards**

Create `client/src/admin/AdminSummaryCards.jsx`:

```jsx
import './admin.css';

const CARDS = [
  ['company_count', '公司总数'],
  ['average_completion_percent', '平均完成率', '%'],
  ['complete_company_count', '全部完成'],
  ['screenshot_count', '截图总数'],
];

export default function AdminSummaryCards({ summary }) {
  return (
    <section className="admin-summary-grid">
      {CARDS.map(([key, label, suffix = '']) => (
        <article key={key} className="admin-kpi-card">
          <span>{label}</span>
          <strong>{summary[key] ?? 0}{suffix}</strong>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Create completion donut chart**

Create `client/src/admin/CompletionDonut.jsx`:

```jsx
import './admin.css';

const COLORS = {
  complete: '#14b8a6',
  in_progress: '#f59e0b',
  not_started: '#64748b',
};

export default function CompletionDonut({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const stops = data.map(item => {
    const start = total ? (cursor / total) * 100 : 0;
    cursor += item.count;
    const end = total ? (cursor / total) * 100 : 0;
    return `${COLORS[item.status]} ${start}% ${end}%`;
  }).join(', ');

  return (
    <section className="admin-chart-card">
      <div className="chart-heading">
        <span>完成状态占比</span>
        <strong>{total} 家</strong>
      </div>
      <div className="donut-row">
        <div
          className="completion-donut"
          style={{ background: total ? `conic-gradient(${stops})` : '#1e293b' }}
          aria-label="公司完成状态占比"
        >
          <span>{total}</span>
        </div>
        <div className="donut-legend">
          {data.map(item => (
            <div key={item.status}>
              <i style={{ backgroundColor: COLORS[item.status] }} />
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create company rank chart**

Create `client/src/admin/CompanyRankChart.jsx`:

```jsx
import { clampPercent, statusTone } from '../dashboardMetrics';
import './admin.css';

export default function CompanyRankChart({ data }) {
  return (
    <section className="admin-chart-card rank-chart">
      <div className="chart-heading">
        <span>公司完成率排行</span>
      </div>
      {data.length === 0 ? (
        <p className="admin-empty-inline">暂无公司数据</p>
      ) : (
        <div className="bar-list">
          {data.map(company => {
            const percent = clampPercent(company.completion_percent);
            return (
              <div key={company.company_id} className="bar-row">
                <span>{company.company_name}</span>
                <div className="bar-track">
                  <i className={statusTone(company.status)} style={{ width: `${percent}%` }} />
                </div>
                <strong>{percent}%</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create screenshot bar chart**

Create `client/src/admin/ScreenshotBarChart.jsx`:

```jsx
import './admin.css';

export default function ScreenshotBarChart({ data }) {
  const max = Math.max(0, ...data.map(item => item.screenshot_count));

  return (
    <section className="admin-chart-card screenshot-chart">
      <div className="chart-heading">
        <span>截图提交量</span>
      </div>
      {max === 0 ? (
        <p className="admin-empty-inline">暂无截图提交</p>
      ) : (
        <div className="vertical-bars">
          {data.map(item => {
            const height = max ? Math.max(8, Math.round((item.screenshot_count / max) * 100)) : 0;
            return (
              <div key={item.company_id} className="vertical-bar">
                <span>{item.screenshot_count}</span>
                <i style={{ height: `${height}%` }} />
                <strong>{item.company_name}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Create device bottleneck chart**

Create `client/src/admin/DeviceBottleneckChart.jsx`:

```jsx
import { clampPercent } from '../dashboardMetrics';
import './admin.css';

export default function DeviceBottleneckChart({ data }) {
  return (
    <section className="admin-chart-card">
      <div className="chart-heading">
        <span>设备瓶颈</span>
      </div>
      {data.length === 0 ? (
        <p className="admin-empty-inline">暂无设备数据</p>
      ) : (
        <div className="bar-list compact">
          {data.map(device => {
            const percent = clampPercent(device.completion_percent);
            return (
              <div key={device.device_id} className="bar-row">
                <span>{device.device_name}</span>
                <div className="bar-track">
                  <i className={percent >= 80 ? 'complete' : percent > 0 ? 'progress' : 'idle'} style={{ width: `${percent}%` }} />
                </div>
                <strong>{percent}%</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Create company progress cards**

Create `client/src/admin/CompanyProgressCards.jsx`:

```jsx
import { clampPercent, formatCount, statusLabel, statusTone } from '../dashboardMetrics';
import './admin.css';

export default function CompanyProgressCards({ companies }) {
  if (!companies.length) {
    return (
      <section className="admin-chart-card">
        <p className="admin-empty-inline">暂无公司，请先添加公司。</p>
      </section>
    );
  }

  return (
    <section className="company-card-grid">
      {companies.map(company => {
        const percent = clampPercent(company.completion_percent);
        return (
          <article key={company.company_id} className={`company-progress-card ${statusTone(company.status)}`}>
            <header>
              <div>
                <h3>{company.company_name}</h3>
                <p>{statusLabel(company.status)} · 未完成 {company.unfinished_items} 项 · 截图 {company.screenshot_count} 张</p>
              </div>
              <strong>{percent}%</strong>
            </header>
            <div className="company-meter">
              <i style={{ width: `${percent}%` }} />
            </div>
            <div className="company-device-list">
              {company.devices.map(device => {
                const devicePercent = clampPercent(device.completion_percent);
                return (
                  <div key={device.device_id}>
                    <span>{device.device_name}</span>
                    <div className="mini-track">
                      <i className={statusTone(device.status)} style={{ width: `${devicePercent}%` }} />
                    </div>
                    <em>{formatCount(device.completed_items, device.total_items)}</em>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 7: Create admin dashboard shell**

Create `client/src/admin/AdminDashboard.jsx`:

```jsx
import { useEffect, useState } from 'react';
import AdminSummaryCards from './AdminSummaryCards';
import CompletionDonut from './CompletionDonut';
import CompanyRankChart from './CompanyRankChart';
import ScreenshotBarChart from './ScreenshotBarChart';
import DeviceBottleneckChart from './DeviceBottleneckChart';
import CompanyProgressCards from './CompanyProgressCards';
import { api } from '../api';
import './admin.css';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.adminGetOverview()
      .then(data => { if (alive) setOverview(data); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="center-msg">加载中...</div>;
  if (error) return <div className="center-msg admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div>
          <p>教师管理后台</p>
          <h1>各家公司完成情况</h1>
        </div>
      </header>

      <AdminSummaryCards summary={overview.summary} />

      <div className="admin-chart-grid">
        <CompletionDonut data={overview.status_distribution} />
        <CompanyRankChart data={overview.company_rankings} />
        <ScreenshotBarChart data={overview.screenshot_chart} />
        <DeviceBottleneckChart data={overview.device_bottlenecks} />
      </div>

      <div className="admin-section-head">
        <h2>公司完成卡</h2>
        <p>按公司查看总完成率、截图数和各设备完成情况。</p>
      </div>
      <CompanyProgressCards companies={overview.company_cards} />
    </div>
  );
}
```

- [ ] **Step 8: Add admin route**

Modify `client/src/admin/AdminApp.jsx`:

```jsx
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CompanyManager from './CompanyManager';
import DeviceManager from './DeviceManager';
import ProgressOverview from './ProgressOverview';
import ScreenshotGallery from './ScreenshotGallery';
import './admin.css';

const TABS = [
  { path: '/admin/dashboard', label: '完成看板' },
  { path: '/admin/companies', label: '公司管理' },
  { path: '/admin/devices', label: '设备管理' },
  { path: '/admin/progress', label: '完成矩阵' },
  { path: '/admin/screenshots', label: '截图管理' },
];

export default function AdminApp() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">教师管理后台</h2>
        <nav>
          {TABS.map(t => (
            <NavLink
              key={t.path}
              to={t.path}
              className={({ isActive }) => `sidebar-btn${isActive ? ' active' : ''}`}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="companies" element={<CompanyManager />} />
          <Route path="devices" element={<DeviceManager />} />
          <Route path="progress" element={<ProgressOverview />} />
          <Route path="screenshots" element={<ScreenshotGallery />} />
        </Routes>
      </main>
    </div>
  );
}
```

- [ ] **Step 9: Run client lint**

Run:

```bash
rtk npm run lint --prefix client
```

Expected: PASS or lint failures from pre-existing dirty files. Fix all lint errors introduced by Task 5.

- [ ] **Step 10: Commit Task 5**

Run:

```bash
rtk git add client/src/admin/AdminDashboard.jsx client/src/admin/AdminSummaryCards.jsx client/src/admin/CompletionDonut.jsx client/src/admin/CompanyRankChart.jsx client/src/admin/ScreenshotBarChart.jsx client/src/admin/DeviceBottleneckChart.jsx client/src/admin/CompanyProgressCards.jsx client/src/admin/AdminApp.jsx
rtk git commit -m "Add admin completion dashboard"
```

Expected: Commit contains admin dashboard components and route changes.

---

### Task 6: Apply Dark Control Console Styling

**Files:**

- Modify: `client/src/index.css`
- Modify: `client/src/student/student.css`
- Modify: `client/src/admin/admin.css`
- Modify: `client/src/student/CompanySelect.jsx`

- [ ] **Step 1: Add global dark base**

Modify `client/src/index.css`:

```css
@import "tailwindcss";
@import "@heroui/styles";

* { box-sizing: border-box; }

:root {
  color: #e5eefb;
  background: #08111f;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #08111f;
}

button,
input {
  font: inherit;
}
```

- [ ] **Step 2: Replace student stylesheet with console dashboard styling**

Modify `client/src/student/student.css` to include these class groups:

```css
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #08111f; color: #e5eefb; }

.student-shell, .page { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 42px; }
.center-msg { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; text-align: center; color: #94a3b8; }
.empty-msg { color: #94a3b8; text-align: center; padding: 2rem; }

.project-header, .student-hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 22px; padding: 20px; border: 1px solid #233044; border-radius: 10px; background: linear-gradient(135deg, #0d1728, #101b2d); }
.project-eyebrow { margin: 0 0 0.45rem; color: #38bdf8; font-size: 0.82rem; font-weight: 800; }
.project-header h1, .student-hero h1 { margin: 0 0 0.7rem; color: #f8fafc; font-size: clamp(1.7rem, 4vw, 2.6rem); line-height: 1.1; }
.project-intro { max-width: 740px; margin: 0; color: #a8b5c8; line-height: 1.7; }

.page-title { font-size: 1rem; margin: 0 0 1rem; color: #dbeafe; }
.company-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.company-card { min-height: 104px; justify-content: center; background: #111827; border: 1px solid #263244; border-radius: 8px; padding: 1.5rem 1rem; color: #f8fafc; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: border-color 0.2s, transform 0.2s, background 0.2s; }
.company-card:hover { border-color: #14b8a6; background: #132235; transform: translateY(-2px); }

.student-dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr); gap: 16px; margin-bottom: 16px; }
.student-panel { background: #111827; border: 1px solid #263244; border-radius: 10px; padding: 18px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22); }
.student-panel.complete { border-color: rgba(20, 184, 166, 0.7); }
.student-panel.progress { border-color: rgba(245, 158, 11, 0.65); }
.student-panel.idle { border-color: #334155; }
.panel-label { margin: 0 0 0.45rem; color: #38bdf8; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; }
.panel-muted { margin: 0; color: #94a3b8; line-height: 1.6; }
.panel-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 10px; }
.panel-heading-row h2 { margin: 0; color: #f8fafc; font-size: 1.1rem; }
.panel-heading-row strong { color: #5eead4; font-size: 1.45rem; }

.progress-number { color: #f8fafc; font-size: clamp(3rem, 10vw, 5.2rem); font-weight: 900; line-height: 1; margin-bottom: 12px; }
.summary-meter, .device-meter, .company-meter, .mini-track { height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; }
.summary-meter span, .device-meter span, .company-meter i, .mini-track i { display: block; height: 100%; background: #14b8a6; border-radius: inherit; }
.device-progress-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.device-progress-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 12px; }
.device-progress-head h3 { margin: 0; color: #f8fafc; font-size: 1.15rem; }
.progress-badge { font-weight: 800; }

.checklist { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 12px; }
.checklist-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; cursor: pointer; padding: 0.65rem; border-radius: 7px; background: #0f172a; color: #dbeafe; transition: background 0.15s; }
.checklist-item:hover { background: #172033; }

.screenshot-upload { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 14px; }
.upload-preview { display: inline-block; }
.upload-preview img { max-width: 240px; max-height: 160px; object-fit: contain; border-radius: 8px; border: 1px solid #334155; background: #0f172a; }
.upload-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.upload-controls input { color: #cbd5e1; max-width: 100%; }
.upload-btn { background: #0f766e; color: #fff; font-size: 0.9rem; }
.upload-msg { max-width: 420px; }
.latest-shot { margin: 10px 0 0; color: #cbd5e1; font-size: 0.9rem; }
.dashboard-alert { margin-bottom: 16px; }
.link-btn { color: #93c5fd; font-size: 0.9rem; }

@media (max-width: 760px) {
  .student-shell, .page { width: min(100% - 24px, 1180px); padding-top: 18px; }
  .project-header, .student-hero { flex-direction: column; }
  .student-dashboard-grid { grid-template-columns: 1fr; }
  .company-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Add admin dashboard styling**

Append these styles to `client/src/admin/admin.css`, then reconcile duplicates so each selector has one clear definition:

```css
.admin-layout { display: flex; min-height: 100vh; background: #08111f; color: #e5eefb; }
.admin-sidebar { width: 220px; background: #0f172a; color: #fff; padding: 1.5rem 0; flex-shrink: 0; border-right: 1px solid #263244; }
.sidebar-title { font-size: 1rem; font-weight: 800; padding: 0 1.2rem 1.5rem; border-bottom: 1px solid #263244; color: #f8fafc; }
.sidebar-btn { display: block; width: 100%; padding: 0.85rem 1.2rem; background: none; border: none; color: #94a3b8; text-align: left; cursor: pointer; font-size: 0.9rem; transition: background 0.15s, color 0.15s; text-decoration: none; }
.sidebar-btn:hover, .sidebar-btn.active { background: #172033; color: #f8fafc; }
.sidebar-btn.active { border-left: 3px solid #14b8a6; }
.admin-main { flex: 1; padding: 24px; background: #08111f; overflow-y: auto; }
.admin-page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 18px; }
.admin-page-header p { margin: 0 0 0.4rem; color: #38bdf8; font-size: 0.8rem; font-weight: 800; }
.admin-page-header h1 { margin: 0; color: #f8fafc; font-size: clamp(1.6rem, 3vw, 2.35rem); }
.section-title { font-size: 1.4rem; margin: 0 0 1.5rem; color: #f8fafc; }
.admin-error { color: #fca5a5; margin-bottom: 1rem; }
.center-msg { text-align: center; padding: 4rem; color: #94a3b8; }

.admin-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 12px; margin-bottom: 14px; }
.admin-kpi-card, .admin-chart-card, .company-progress-card, .item-row, .device-manager-item, .stat-card, .screenshot-thumb { background: #111827; border: 1px solid #263244; border-radius: 8px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2); }
.admin-kpi-card { padding: 16px; }
.admin-kpi-card span { display: block; color: #94a3b8; font-size: 0.8rem; margin-bottom: 10px; }
.admin-kpi-card strong { color: #f8fafc; font-size: 2rem; line-height: 1; }
.admin-chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
.admin-chart-card { padding: 16px; min-width: 0; }
.chart-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: #cbd5e1; font-weight: 800; margin-bottom: 14px; }
.chart-heading strong { color: #5eead4; }
.donut-row { display: flex; gap: 18px; align-items: center; }
.completion-donut { width: 132px; height: 132px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; }
.completion-donut span { width: 72px; height: 72px; display: grid; place-items: center; border-radius: 50%; background: #111827; color: #f8fafc; font-size: 1.7rem; font-weight: 900; }
.donut-legend { display: grid; gap: 9px; min-width: 130px; }
.donut-legend div { display: grid; grid-template-columns: 12px 1fr auto; gap: 8px; align-items: center; color: #cbd5e1; font-size: 0.9rem; }
.donut-legend i { width: 10px; height: 10px; border-radius: 3px; }
.bar-list { display: grid; gap: 10px; }
.bar-list.compact { gap: 9px; }
.bar-row { display: grid; grid-template-columns: minmax(78px, 130px) 1fr 46px; gap: 10px; align-items: center; color: #cbd5e1; font-size: 0.9rem; }
.bar-track { height: 9px; background: #1e293b; border-radius: 999px; overflow: hidden; }
.bar-track i { display: block; height: 100%; border-radius: inherit; }
.bar-track i.complete, .mini-track i.complete { background: #14b8a6; }
.bar-track i.progress, .mini-track i.progress { background: #f59e0b; }
.bar-track i.idle, .mini-track i.idle { background: #64748b; }
.vertical-bars { display: flex; align-items: end; gap: 12px; min-height: 180px; overflow-x: auto; padding-top: 8px; }
.vertical-bar { width: 52px; min-width: 52px; height: 168px; display: grid; grid-template-rows: 20px 1fr 34px; justify-items: center; align-items: end; color: #94a3b8; font-size: 0.75rem; }
.vertical-bar i { width: 22px; min-height: 8px; background: #14b8a6; border-radius: 4px 4px 0 0; }
.vertical-bar strong { max-width: 52px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #cbd5e1; }
.admin-empty-inline { margin: 0; color: #94a3b8; padding: 1rem 0; }
.admin-section-head { display: flex; justify-content: space-between; gap: 1rem; align-items: end; margin: 10px 0 12px; }
.admin-section-head h2 { margin: 0; color: #f8fafc; font-size: 1.2rem; }
.admin-section-head p { margin: 0; color: #94a3b8; }
.company-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }
.company-progress-card { padding: 16px; }
.company-progress-card.complete { border-color: rgba(20, 184, 166, 0.72); }
.company-progress-card.progress { border-color: rgba(245, 158, 11, 0.72); }
.company-progress-card.idle { border-color: #475569; }
.company-progress-card header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 12px; }
.company-progress-card h3 { margin: 0 0 0.3rem; color: #f8fafc; font-size: 1.1rem; }
.company-progress-card p { margin: 0; color: #94a3b8; font-size: 0.84rem; }
.company-progress-card header strong { color: #f8fafc; font-size: 2rem; line-height: 1; }
.company-meter { height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; margin-bottom: 12px; }
.company-meter i { display: block; height: 100%; background: #14b8a6; border-radius: inherit; }
.company-device-list { display: grid; gap: 8px; }
.company-device-list > div { display: grid; grid-template-columns: 86px 1fr 42px; gap: 8px; align-items: center; color: #cbd5e1; font-size: 0.82rem; }
.mini-track { height: 7px; }
.company-device-list em { color: #94a3b8; font-style: normal; text-align: right; }

@media (max-width: 900px) {
  .admin-layout { flex-direction: column; }
  .admin-sidebar { width: 100%; padding: 1rem 0; }
  .admin-sidebar nav { display: flex; overflow-x: auto; }
  .sidebar-btn { width: auto; white-space: nowrap; }
  .admin-main { padding: 16px; }
  .admin-summary-grid, .admin-chart-grid { grid-template-columns: 1fr; }
  .company-card-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4: Run client build**

Run:

```bash
rtk npm run build
```

Expected: Vite production build completes successfully.

- [ ] **Step 5: Commit Task 6**

Run:

```bash
rtk git add client/src/index.css client/src/student/student.css client/src/admin/admin.css client/src/student/CompanySelect.jsx
rtk git commit -m "Apply dark dashboard styling"
```

Expected: Commit contains stylesheet changes and any student company-select markup adjustment.

---

### Task 7: Final Verification And Manual QA

**Files:**

- Modify only files needed for fixes discovered during verification.

- [ ] **Step 1: Run backend tests**

Run:

```bash
rtk npm test --prefix server
```

Expected: PASS.

- [ ] **Step 2: Run client lint**

Run:

```bash
rtk npm run lint --prefix client
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
rtk npm run build
```

Expected: PASS and Vite reports built assets in `client/dist`.

- [ ] **Step 4: Start the app for manual QA**

Run:

```bash
rtk npm run dev
```

Expected: Express server and Vite client start. Use the Vite URL printed by the command.

- [ ] **Step 5: Verify student flow**

Manual checks:

- Open the student route.
- Select a company.
- Confirm the dashboard shows company name, total completion rate, device cards, and company screenshot panel.
- Check one checklist item.
- Confirm the percent updates after save.
- Uncheck the same item.
- Upload a valid image.
- Confirm screenshot count updates.

- [ ] **Step 6: Verify admin dashboard**

Manual checks:

- Open `/admin/dashboard`.
- Confirm the title is `各家公司完成情况`.
- Confirm summary cards render.
- Confirm donut chart renders company status counts.
- Confirm company completion ranking renders companies by percent.
- Confirm screenshot bar chart renders company screenshot counts or an empty state.
- Confirm device bottleneck chart renders devices sorted from lowest completion to highest.
- Confirm company cards show each company's percent, screenshot count, unfinished count, and per-device mini bars.

- [ ] **Step 7: Verify existing admin routes**

Manual checks:

- `/admin/companies` lists, adds, and deletes companies.
- `/admin/devices` lists devices and checklist items.
- `/admin/progress` still shows the progress matrix.
- `/admin/screenshots` still groups screenshots by company and opens the lightbox.

- [ ] **Step 8: Stop dev server**

If the dev server is still running in an exec session, stop it with Ctrl-C through `write_stdin`.

- [ ] **Step 9: Commit final fixes**

If verification required fixes, run:

```bash
rtk git status --short
rtk git add client/src/admin/admin.css client/src/student/student.css client/src/admin/AdminDashboard.jsx client/src/student/StudentDashboard.jsx server/db.js server/routes/progress.js
rtk git commit -m "Fix dashboard verification issues"
```

Expected: Remove any unchanged paths from the `git add` command before running it. Commit contains only files changed to fix verification failures. If no fixes were needed, skip this commit.

---

## Self-Review

- Spec coverage: The plan covers the confirmed dark dashboard direction, company-level screenshots, student company dashboard, admin company-focused charts, two summary endpoints, empty/error states, and validation commands.
- Placeholder scan: The plan contains exact file paths, exact route names, concrete code blocks, and exact commands.
- Type consistency: Backend summary fields match frontend API consumers: `summary`, `status_distribution`, `company_rankings`, `screenshot_chart`, `device_bottlenecks`, and `company_cards`. Student summary fields match `ProgressSummary`, `DeviceProgressGrid`, and `CompanyScreenshotPanel`.
