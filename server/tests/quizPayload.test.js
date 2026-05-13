'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const quizzesRouter = require('../routes/quizzes');

test('validateQuizPayload allows an empty prompt', () => {
  const result = quizzesRouter.validateQuizPayload({
    title: '检测一',
    prompt: '',
    options: [
      { label: '完成检测记录', is_correct: true },
      { label: '跳过记录', is_correct: false },
    ],
  });

  assert.deepEqual(result, {
    title: '检测一',
    prompt: '',
    options: [
      { label: '完成检测记录', is_correct: true },
      { label: '跳过记录', is_correct: false },
    ],
  });
});
