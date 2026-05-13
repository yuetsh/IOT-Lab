'use strict';

const QUIZ_STAGES = [
  { stage_key: 'check1', activity_key: 'check1', title: '检测一' },
  { stage_key: 'check2', activity_key: 'check2', title: '检测二' },
];

function bool(value) {
  return value === true || value === 1;
}

function buildQuizStages({ questions = [], optionsByQuestion = new Map(), submissions = [], includeAnswers = false }) {
  const questionByStage = new Map(questions.map(question => [question.stage_key, question]));
  const submissionByQuestion = new Map(submissions.map(submission => [Number(submission.question_id), submission]));
  const orderedQuestions = QUIZ_STAGES.flatMap(stage => {
    const primaryQuestion = questionByStage.get(stage.stage_key) || stage;
    const extraQuestions = questions.filter(question => (
      question.stage_key !== stage.stage_key
      && (question.activity_key || question.stage_key) === stage.activity_key
    ));
    return [primaryQuestion, ...extraQuestions];
  });

  return orderedQuestions.map(question => {
    const options = question.id ? optionsByQuestion.get(Number(question.id)) || [] : [];
    const submission = question.id ? submissionByQuestion.get(Number(question.id)) || null : null;

    return {
      stage_key: question.stage_key,
      activity_key: question.activity_key || question.stage_key,
      title: question.title,
      prompt: question.prompt || '',
      options: options.map(option => {
        const result = {
          id: option.id,
          label: option.label,
        };
        if (includeAnswers) {
          result.is_correct = bool(option.is_correct);
        }
        return result;
      }),
      submission: submission ? {
        selected_option_id: submission.selected_option_id,
        is_correct: bool(submission.is_correct),
        submitted_at: submission.submitted_at,
      } : null,
    };
  });
}

module.exports = {
  QUIZ_STAGES,
  buildQuizStages,
};
