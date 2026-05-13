import { useState } from 'react';
import { Button, RadioGroup, Radio } from '@heroui/react';
import { api } from '../api';

export default function QuizPanel({ companyId, quiz, onSubmitted }) {
  const [selectedId, setSelectedId] = useState(quiz.submission?.selected_option_id || '');
  const [submitting, setSubmitting] = useState(false);
  const hasQuestion = Boolean(quiz.prompt && quiz.options.length);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedId || submitting) return;
    setSubmitting(true);
    try {
      await api.submitQuizAnswer(quiz.stage_key, companyId, Number(selectedId));
      await onSubmitted();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="student-panel quiz-panel">
      <div className="panel-heading-row">
        <div>
          <p className="panel-label">{quiz.title}</p>
          <h2>单选检测题</h2>
        </div>
        {quiz.submission && (
          <strong className="quiz-pass">已提交</strong>
        )}
      </div>

      {!hasQuestion ? (
        <p className="panel-muted">教师尚未设置此检测题。</p>
      ) : (
        <form className="quiz-form" onSubmit={handleSubmit}>
          <p className="quiz-prompt">{quiz.prompt}</p>
          <RadioGroup
            value={String(selectedId)}
            onValueChange={setSelectedId}
          >
            {quiz.options.map(option => (
              <Radio key={option.id} value={String(option.id)}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
          <div className="quiz-actions">
            <Button color="success" type="submit" isDisabled={!selectedId || submitting}>
              {submitting ? '提交中...' : quiz.submission ? '重新提交' : '提交答案'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
