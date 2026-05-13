'use strict';

const QUIZ_STAGES = [
  { stage_key: 'check1', activity_key: 'check1', title: '检测一' },
  { stage_key: 'check2', activity_key: 'check2', title: '检测二' },
];

function bool(value) {
  return value === true || value === 1;
}

function buildQuizStages({ questions = [], optionsByQuestion = new Map(), submissions = [], includeAnswers = false }) {
  const submissionByQuestion = new Map(submissions.map(submission => [Number(submission.question_id), submission]));
  const orderedQuestions = QUIZ_STAGES.flatMap(stage => {
    return questions.filter(question => (
      (question.activity_key || question.stage_key) === stage.activity_key
    ));
  });

  return orderedQuestions.map(question => {
    return {
      stage_key: question.stage_key,
      activity_key: question.activity_key || question.stage_key,
      title: question.title,
      prompt: question.prompt || '',
      options: (optionsByQuestion.get(Number(question.id)) || []).map(option => {
        const result = { id: option.id, label: option.label };
        if (includeAnswers) result.is_correct = bool(option.is_correct);
        return result;
      }),
      submission: (() => {
        const sub = submissionByQuestion.get(Number(question.id));
        return sub ? {
          selected_option_id: sub.selected_option_id,
          is_correct: bool(sub.is_correct),
          submitted_at: sub.submitted_at,
        } : null;
      })(),
    };
  });
}

module.exports = {
  QUIZ_STAGES,
  buildQuizStages,
};
