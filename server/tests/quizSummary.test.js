'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildQuizStages } = require('../quizSummary');

test('buildQuizStages returns fixed stages and hides answers for students', () => {
  const stages = buildQuizStages({
    questions: [
      { id: 10, stage_key: 'check1', activity_key: 'check1', title: '检测一', prompt: '设备清单完成后应做什么？' },
    ],
    optionsByQuestion: new Map([
      [10, [
        { id: 101, question_id: 10, label: '保存记录', is_correct: 1, sort_order: 0 },
        { id: 102, question_id: 10, label: '删除记录', is_correct: 0, sort_order: 1 },
      ]],
    ]),
    submissions: [
      { question_id: 10, selected_option_id: 101, is_correct: 1, submitted_at: '2026-05-13 09:00:00' },
    ],
    includeAnswers: false,
  });

  assert.deepEqual(stages.map(stage => stage.stage_key), ['check1', 'check2']);
  assert.deepEqual(stages.map(stage => stage.activity_key), ['check1', 'check2']);
  assert.equal(stages[0].title, '检测一');
  assert.equal(stages[0].prompt, '设备清单完成后应做什么？');
  assert.deepEqual(
    stages[0].options,
    [
      { id: 101, label: '保存记录' },
      { id: 102, label: '删除记录' },
    ]
  );
  assert.deepEqual(stages[0].submission, {
    selected_option_id: 101,
    is_correct: true,
    submitted_at: '2026-05-13 09:00:00',
  });
  assert.equal(stages[1].title, '检测二');
  assert.equal(stages[1].prompt, '');
  assert.deepEqual(stages[1].options, []);
  assert.equal(stages[1].submission, null);
});

test('buildQuizStages includes answer flags for admins', () => {
  const stages = buildQuizStages({
    questions: [
      { id: 20, stage_key: 'check2', activity_key: 'check2', title: '检测二', prompt: '截图上传后应确认什么？' },
    ],
    optionsByQuestion: new Map([
      [20, [
        { id: 201, question_id: 20, label: '截图已成功提交', is_correct: 1, sort_order: 0 },
        { id: 202, question_id: 20, label: '关闭页面即可', is_correct: 0, sort_order: 1 },
      ]],
    ]),
    submissions: [],
    includeAnswers: true,
  });

  assert.deepEqual(
    stages[1].options,
    [
      { id: 201, label: '截图已成功提交', is_correct: true },
      { id: 202, label: '关闭页面即可', is_correct: false },
    ]
  );
});

test('buildQuizStages supports multiple questions after one activity', () => {
  const stages = buildQuizStages({
    questions: [
      { id: 10, stage_key: 'check1', activity_key: 'check1', title: '检测一 A', prompt: '第一题？' },
      { id: 11, stage_key: 'check1-extra', activity_key: 'check1', title: '检测一 B', prompt: '第二题？' },
      { id: 20, stage_key: 'check2', activity_key: 'check2', title: '检测二', prompt: '第三题？' },
    ],
    optionsByQuestion: new Map([
      [10, [
        { id: 101, question_id: 10, label: 'A', is_correct: 1, sort_order: 0 },
        { id: 102, question_id: 10, label: 'B', is_correct: 0, sort_order: 1 },
      ]],
      [11, [
        { id: 111, question_id: 11, label: 'C', is_correct: 0, sort_order: 0 },
        { id: 112, question_id: 11, label: 'D', is_correct: 1, sort_order: 1 },
      ]],
      [20, [
        { id: 201, question_id: 20, label: 'E', is_correct: 1, sort_order: 0 },
        { id: 202, question_id: 20, label: 'F', is_correct: 0, sort_order: 1 },
      ]],
    ]),
    submissions: [
      { question_id: 11, selected_option_id: 112, is_correct: 1, submitted_at: '2026-05-13 10:00:00' },
    ],
    includeAnswers: false,
  });

  assert.deepEqual(
    stages.map(stage => [stage.stage_key, stage.activity_key, stage.title, stage.submission?.selected_option_id || null]),
    [
      ['check1', 'check1', '检测一 A', null],
      ['check1-extra', 'check1', '检测一 B', 112],
      ['check2', 'check2', '检测二', null],
    ]
  );
});
