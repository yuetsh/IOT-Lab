import { useState } from 'react';
import { Button } from '@heroui/react';
import { api } from '../api';
import './student.css';

export default function QuizPanel({ companyId, quiz, onSubmitted }) {
  const [selectedId, setSelectedId] = useState(quiz.submission?.selected_option_id || '');
  const [submitting, setSubmitting] = useState(false);
  const hasQuestion = Boolean(quiz.options.length);

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
          {quiz.prompt && <p className="quiz-prompt">{quiz.prompt}</p>}
          <div className="quiz-options">
            {quiz.options.map(option => (
              <label
                key={option.id}
                className={`quiz-choice${Number(selectedId) === Number(option.id) ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name={quiz.stage_key}
                  value={option.id}
                  checked={Number(selectedId) === Number(option.id)}
                  onChange={e => setSelectedId(e.target.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <div className="quiz-actions">
            <Button className="upload-btn" type="submit" isDisabled={!selectedId || submitting}>
              {submitting ? '提交中...' : quiz.submission ? '重新提交' : '提交答案'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
