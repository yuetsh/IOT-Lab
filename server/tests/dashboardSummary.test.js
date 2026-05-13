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
