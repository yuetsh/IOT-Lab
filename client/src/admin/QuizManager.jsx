import { useEffect, useState } from 'react';
import { api } from '../api';

function createFallbackOptions() {
  return [
    { label: '', is_correct: true },
    { label: '', is_correct: false },
    { label: '', is_correct: false },
    { label: '', is_correct: false },
  ];
}

function toForm(stage) {
  const options = stage.options?.length
    ? stage.options.map(option => ({ label: option.label, is_correct: Boolean(option.is_correct) }))
    : createFallbackOptions();
  return {
    stage_key: stage.stage_key,
    activity_key: stage.activity_key || stage.stage_key,
    title: stage.title || '',
    prompt: stage.prompt || '',
    options,
  };
}

const ACTIVITY_GROUPS = [
  { activity_key: 'check1', label: '活动一之后', defaultTitle: '检测一' },
  { activity_key: 'check2', label: '活动二之后', defaultTitle: '检测二' },
];

export default function QuizManager() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    let alive = true;
    api.adminGetQuizzes()
      .then(stages => {
        if (alive) setForms(stages.map(toForm));
      })
      .catch(e => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function updateForm(stageKey, patch) {
    setForms(prev => prev.map(form => (
      form.stage_key === stageKey ? { ...form, ...patch } : form
    )));
  }

  function updateOption(stageKey, index, patch) {
    setForms(prev => prev.map(form => {
      if (form.stage_key !== stageKey) return form;
      return {
        ...form,
        options: form.options.map((option, optionIndex) => (
          optionIndex === index ? { ...option, ...patch } : option
        )),
      };
    }));
  }

  function setCorrectOption(stageKey, index) {
    setForms(prev => prev.map(form => {
      if (form.stage_key !== stageKey) return form;
      return {
        ...form,
        options: form.options.map((option, optionIndex) => ({
          ...option,
          is_correct: optionIndex === index,
        })),
      };
    }));
  }

  function addOption(stageKey) {
    setForms(prev => prev.map(form => (
      form.stage_key === stageKey
        ? { ...form, options: [...form.options, { label: '', is_correct: false }] }
        : form
    )));
  }

  function removeOption(stageKey, index) {
    setForms(prev => prev.map(form => {
      if (form.stage_key !== stageKey || form.options.length <= 2) return form;
      const options = form.options.filter((_, optionIndex) => optionIndex !== index);
      if (!options.some(option => option.is_correct)) {
        options[0] = { ...options[0], is_correct: true };
      }
      return { ...form, options };
    }));
  }

  async function handleSave(e, form) {
    e.preventDefault();
    setError('');
    setSavedKey('');
    try {
      let saved;
      if (form.isNew) {
        saved = await api.adminCreateQuiz(form.activity_key, form.title, form.prompt, form.options);
        setForms(prev => prev.map(item => (item.stage_key === form.stage_key ? toForm(saved) : item)));
      } else {
        saved = await api.adminUpdateQuiz(form.stage_key, form.title, form.prompt, form.options);
        setForms(prev => prev.map(item => (item.stage_key === saved.stage_key ? toForm(saved) : item)));
      }
      setSavedKey(saved.stage_key);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(form) {
    if (!confirm(`确定要删除检测题「${form.title}」吗？此操作不可恢复。`)) return;
    setError('');
    try {
      await api.adminDeleteQuiz(form.stage_key);
      setForms(prev => prev.filter(item => item.stage_key !== form.stage_key));
    } catch (e) {
      setError(e.message);
    }
  }

  function handleCreate(activity) {
    setForms(prev => [...prev, {
      stage_key: `__new__${activity.activity_key}__${Date.now()}`,
      activity_key: activity.activity_key,
      title: activity.defaultTitle,
      prompt: '',
      options: createFallbackOptions(),
      isNew: true,
    }]);
  }

  if (loading) return <div className="center-msg">加载检测题...</div>;

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <p>活动检测题</p>
          <h1>检测题管理</h1>
        </div>
      </header>
      {error && <p className="admin-error">{error}</p>}
      <div className="quiz-manager-list">
        {ACTIVITY_GROUPS.map(activity => (
          <section key={activity.activity_key} className="quiz-manager-group">
            <div className="quiz-manager-group-head">
              <h2>{activity.label}</h2>
              <button className="admin-btn primary" type="button" onClick={() => handleCreate(activity)}>
                新增检测题
              </button>
            </div>
            {forms.filter(form => form.activity_key === activity.activity_key).map(form => (
              <form key={form.stage_key} className="quiz-editor-card" onSubmit={e => handleSave(e, form)}>
            <div className="quiz-editor-head">
              <div>
                <span>{activity.label}</span>
                <h2>{form.title}</h2>
              </div>
              {savedKey === form.stage_key && <strong>已保存</strong>}
            </div>
            <label className="admin-field">
              <span>检测名称</span>
              <input
                className="admin-input wide"
                value={form.title}
                onChange={e => updateForm(form.stage_key, { title: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>题干（选填）</span>
              <textarea
                className="admin-textarea"
                value={form.prompt}
                onChange={e => updateForm(form.stage_key, { prompt: e.target.value })}
                placeholder="可填写题目说明，也可以留空"
              />
            </label>
            <div className="quiz-option-list">
              {form.options.map((option, index) => (
                <div key={index} className={`quiz-option-row${option.is_correct ? ' is-correct' : ''}`}>
                  <input
                    className="admin-input wide"
                    value={option.label}
                    onChange={e => updateOption(form.stage_key, index, { label: e.target.value })}
                    placeholder={`选项 ${index + 1}`}
                  />
                  <label className="quiz-correct-toggle">
                    <input
                      type="radio"
                      name={`${form.stage_key}-correct`}
                      checked={option.is_correct}
                      onChange={() => setCorrectOption(form.stage_key, index)}
                      aria-label={`设置第 ${index + 1} 个选项为正确答案`}
                    />
                    <span>{option.is_correct ? '正确答案' : '设为正确'}</span>
                  </label>
                  <button
                    className="admin-btn danger sm"
                    type="button"
                    onClick={() => removeOption(form.stage_key, index)}
                    disabled={form.options.length <= 2}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
            <div className="quiz-editor-actions">
              <button className="admin-btn" type="button" onClick={() => addOption(form.stage_key)}>
                添加选项
              </button>
              <button className="admin-btn primary" type="submit">
                保存检测题
              </button>
              <button className="admin-btn danger" type="button" onClick={() => handleDelete(form)}>
                  删除检测题
                </button>
            </div>
              </form>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
