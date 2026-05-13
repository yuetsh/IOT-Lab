'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '../data/lab.db'));
db.pragma('foreign_keys = ON');

// ─── Clear all data ──────────────────────────────────────────────────────────────
console.log('Clearing existing data...');
db.exec(`
  DELETE FROM quiz_submissions;
  DELETE FROM quiz_options;
  DELETE FROM quiz_questions;
  DELETE FROM screenshots;
  DELETE FROM progress;
  DELETE FROM checklist_items;
  DELETE FROM devices;
  DELETE FROM companies;
`);

// ─── Companies: IoT device inspection teams ──────────────────────────────────────
const companies = [
  '智能家居检测组',
  '工业物联网检测组',
  '车联网安全检测组',
  '智慧农业检测组',
  '环境监测检测组',
  '智慧医疗检测组',
];

const insertCompany = db.prepare('INSERT INTO companies (name) VALUES (?)');
const companyIds = companies.map(name => {
  const r = insertCompany.run(name);
  return Number(r.lastInsertRowid);
});
console.log(`  Inserted ${companies.length} companies`);

// ─── Devices: IoT equipment ──────────────────────────────────────────────────────
const devices = [
  { name: '边缘网关', sort: 0 },
  { name: '工业路由器', sort: 1 },
  { name: 'PLC控制器', sort: 2 },
  { name: '物联网传感器', sort: 3 },
  { name: '网络摄像头', sort: 4 },
];

const insertDevice = db.prepare('INSERT INTO devices (name, sort_order) VALUES (?, ?)');
const getDevice = db.prepare('SELECT * FROM devices WHERE id = ?');
const deviceIds = devices.map(d => {
  const r = insertDevice.run(d.name, d.sort);
  return Number(r.lastInsertRowid);
});
console.log(`  Inserted ${devices.length} devices`);

// ─── Checklist items per device ──────────────────────────────────────────────────
const deviceChecklists = [
  // 边缘网关
  ['固件版本核查', '安全策略审计', '网络连通性测试', '日志采集验证', '冗余切换测试'],
  // 工业路由器
  ['端口配置检查', 'VPN隧道验证', '流量整形测试', 'QoS策略核验', '固件升级检查'],
  // PLC控制器
  ['程序版本校验', 'I/O模块检测', '通信协议测试', '故障恢复验证'],
  // 物联网传感器
  ['数据采集精度', '传输时延测试', '低功耗模式验证', '环境耐受检测', '校准参数核查'],
  // 网络摄像头
  ['视频流稳定性', '夜视功能检测', '运动检测灵敏度', '存储回放验证'],
];

const insertItem = db.prepare('INSERT INTO checklist_items (device_id, label, sort_order) VALUES (?, ?, ?)');
const checklistIds = [];

deviceChecklists.forEach((items, di) => {
  const did = deviceIds[di];
  const ids = items.map((label, idx) => {
    const r = insertItem.run(did, label, idx);
    return Number(r.lastInsertRowid);
  });
  checklistIds.push(ids);
});

const totalItems = checklistIds.flat().length;
console.log(`  Inserted ${totalItems} checklist items`);

// ─── Progress: realistic completion patterns ─────────────────────────────────────
const insertProgress = db.prepare('INSERT OR IGNORE INTO progress (company_id, checklist_item_id) VALUES (?, ?)');

// Completion profiles for each company (percentage of items completed)
// company index -> completion percentage
const profiles = [0.85, 0.60, 0.35, 0.72, 0.50, 0.92];

const allItemIds = checklistIds.flat();

profiles.forEach((pct, ci) => {
  const cid = companyIds[ci];
  // Shuffle items and take the first pct% as completed
  const shuffled = [...allItemIds].sort(() => Math.random() - 0.5);
  const take = Math.round(allItemIds.length * pct);
  const completed = shuffled.slice(0, take);
  completed.forEach(itemId => {
    insertProgress.run(cid, itemId);
  });
  console.log(`  Company ${companies[ci]}: ${completed.length}/${allItemIds.length} items completed (${Math.round(pct * 100)}%)`);
});

// ─── Screenshots: some realistic records ─────────────────────────────────────────
const insertScreenshot = db.prepare(
  "INSERT INTO screenshots (company_id, device_id, filename, original_name) VALUES (?, ?, ?, ?)"
);

const screenshotRecords = [
  { ci: 0, di: 0, fn: '2026-05-10_gateway_config.png', orig: '网关配置截图.png' },
  { ci: 0, di: 4, fn: '2026-05-10_camera_preview.png', orig: '摄像头预览.png' },
  { ci: 1, di: 1, fn: '2026-05-11_router_port.png', orig: '路由器端口检测.png' },
  { ci: 1, di: 2, fn: '2026-05-11_plc_program.png', orig: 'PLC程序版本.png' },
  { ci: 2, di: 3, fn: '2026-05-12_sensor_data.png', orig: '传感器数据采集.png' },
  { ci: 3, di: 0, fn: '2026-05-09_gateway_log.png', orig: '网关日志.png' },
  { ci: 3, di: 3, fn: '2026-05-09_sensor_calib.png', orig: '传感器校准.png' },
  { ci: 3, di: 4, fn: '2026-05-09_camera_night.png', orig: '夜视效果.png' },
  { ci: 4, di: 0, fn: '2026-05-12_gateway_audit.png', orig: '安全审计.png' },
  { ci: 4, di: 2, fn: '2026-05-12_plc_io.png', orig: 'PLC_IO模块.png' },
  { ci: 5, di: 0, fn: '2026-05-13_gateway_final.png', orig: '网关最终验收.png' },
  { ci: 5, di: 1, fn: '2026-05-13_router_vpn.png', orig: 'VPN隧道验证.png' },
  { ci: 5, di: 2, fn: '2026-05-13_plc_recovery.png', orig: '故障恢复测试.png' },
  { ci: 5, di: 3, fn: '2026-05-13_sensor_precision.png', orig: '精度测试.png' },
  { ci: 5, di: 4, fn: '2026-05-13_camera_motion.png', orig: '运动检测.png' },
];

screenshotRecords.forEach(({ ci, di, fn, orig }) => {
  insertScreenshot.run(companyIds[ci], deviceIds[di], fn, orig);
});
console.log(`  Inserted ${screenshotRecords.length} screenshots`);

// ─── Quiz seeds ──────────────────────────────────────────────────────────────────

const quizQuestions = [
  // 检测一
  {
    stage_key: 'check1-lzck5n-8a3f2e',
    activity_key: 'check1',
    title: '边缘网关安全配置',
    prompt: '在对边缘网关进行安全策略审计时，以下哪项应优先检查？',
    sort_order: 1,
    options: [
      { label: '防火墙规则是否默认拒绝', is_correct: 1 },
      { label: '设备外壳是否有划痕', is_correct: 0 },
      { label: '网线颜色是否统一', is_correct: 0 },
      { label: '设备摆放位置是否美观', is_correct: 0 },
    ],
  },
  {
    stage_key: 'check1-mc8pv2-7b1d9c',
    activity_key: 'check1',
    title: '传感器数据采集',
    prompt: '物联网传感器精确度测试中，采集值与标准值偏差超过多少时应重新校准？',
    sort_order: 2,
    options: [
      { label: '±5%', is_correct: 1 },
      { label: '±30%', is_correct: 0 },
      { label: '±50%', is_correct: 0 },
      { label: '任意偏差都无需校准', is_correct: 0 },
    ],
  },
  {
    stage_key: 'check1-nd3qr9-5f2a1b',
    activity_key: 'check1',
    title: 'PLC通信协议',
    prompt: '检测PLC控制器通信协议时，Modbus TCP默认使用的端口号是？',
    sort_order: 3,
    options: [
      { label: '502', is_correct: 1 },
      { label: '8080', is_correct: 0 },
      { label: '21', is_correct: 0 },
      { label: '3306', is_correct: 0 },
    ],
  },
  {
    stage_key: 'check1-pg7xt4-2e6c8d',
    activity_key: 'check1',
    title: '摄像头视频流检测',
    prompt: '检测网络摄像头视频流稳定性时，下列哪个指标最能反映传输质量？',
    sort_order: 4,
    options: [
      { label: '帧率与丢包率', is_correct: 1 },
      { label: '摄像头品牌知名度', is_correct: 0 },
      { label: '安装支架的材质', is_correct: 0 },
      { label: '电源适配器颜色', is_correct: 0 },
    ],
  },
  // 检测二
  {
    stage_key: 'check2-kt1rz5-9d4b3f',
    activity_key: 'check2',
    title: '固件漏洞处置',
    prompt: '设备固件版本核查发现已知漏洞后，正确的处理流程是？',
    sort_order: 1,
    options: [
      { label: '记录漏洞信息，升级固件后复测', is_correct: 1 },
      { label: '忽略漏洞继续使用', is_correct: 0 },
      { label: '直接断开设备电源', is_correct: 0 },
      { label: '仅口头告知操作人员', is_correct: 0 },
    ],
  },
  {
    stage_key: 'check2-mv4wb8-3a7e1f',
    activity_key: 'check2',
    title: 'VPN隧道检测',
    prompt: '对工业路由器进行VPN隧道验证时，以下哪项检测内容是不必要的？',
    sort_order: 2,
    options: [
      { label: '测试路由器的Wi-Fi信号覆盖范围', is_correct: 1 },
      { label: '验证加密算法强度', is_correct: 0 },
      { label: '测试隧道建立时延', is_correct: 0 },
      { label: '检查证书有效期', is_correct: 0 },
    ],
  },
  {
    stage_key: 'check2-nx6cy1-4b8f2a',
    activity_key: 'check2',
    title: 'QoS策略核验',
    prompt: '工业路由器QoS策略核验中，对实时控制指令流量的优先级应设为？',
    sort_order: 3,
    options: [
      { label: '最高优先级', is_correct: 1 },
      { label: '最低优先级', is_correct: 0 },
      { label: '与网页浏览相同', is_correct: 0 },
      { label: '无需设置优先级', is_correct: 0 },
    ],
  },
  {
    stage_key: 'check2-ph8dv3-6c1a9e',
    activity_key: 'check2',
    title: '故障恢复验证',
    prompt: 'PLC控制器故障恢复验证中，设备从故障状态恢复到正常运行的时间应不超过？',
    sort_order: 4,
    options: [
      { label: '30秒', is_correct: 1 },
      { label: '30分钟', is_correct: 0 },
      { label: '4小时', is_correct: 0 },
      { label: '24小时', is_correct: 0 },
    ],
  },
];

const insertQuizQuestion = db.prepare(`
  INSERT INTO quiz_questions (stage_key, activity_key, title, prompt, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);
const insertQuizOption = db.prepare(`
  INSERT INTO quiz_options (question_id, label, is_correct, sort_order)
  VALUES (?, ?, ?, ?)
`);

quizQuestions.forEach(q => {
  const r = insertQuizQuestion.run(q.stage_key, q.activity_key, q.title, q.prompt, q.sort_order);
  const questionId = Number(r.lastInsertRowid);
  q.options.forEach((opt, idx) => {
    insertQuizOption.run(questionId, opt.label, opt.is_correct, idx);
  });
});
console.log(`  Seeded ${quizQuestions.length} quiz questions`);

console.log('\nDone! Database seeded with IoT device inspection mock data.');
db.close();
