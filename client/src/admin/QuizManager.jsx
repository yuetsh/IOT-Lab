import { useEffect, useState } from 'react';
import { Button, Input, TextArea, RadioGroup, Radio, Card, CardContent, CardHeader } from '@heroui/react';
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
              <Button color="primary" onPress={() => handleCreate(activity)}>
                新增检测题
              </Button>
            </div>
            {forms.filter(form => form.activity_key === activity.activity_key).map(form => (
              <Card key={form.stage_key}>
                <CardHeader>
                  <div className="flex-1">
                    <span className="block text-xs text-blue-400 font-extrabold mb-1">{activity.label}</span>
                    <h2 className="text-lg font-bold text-white m-0">{form.title}</h2>
                  </div>
                  {savedKey === form.stage_key && <strong className="text-teal-300 text-sm">已保存</strong>}
                </CardHeader>
                <CardContent>
                  <form onSubmit={e => handleSave(e, form)} className="flex flex-col gap-4">
                    <Input
                      label="检测名称"
                      value={form.title}
                      onValueChange={v => updateForm(form.stage_key, { title: v })}
                    />
                    <TextArea
                      label="题干"
                      value={form.prompt}
                      onValueChange={v => updateForm(form.stage_key, { prompt: v })}
                      placeholder="输入单选题题干"
                    />
                    <RadioGroup
                      label="正确答案"
                      value={String(form.options.findIndex(option => option.is_correct))}
                      onValueChange={v => setCorrectOption(form.stage_key, Number(v))}
                    >
                      {form.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                          <Radio value={String(index)} aria-label={`设置选项 ${index + 1} 为正确答案`} />
                          <Input
                            className="flex-1"
                            value={option.label}
                            onValueChange={v => updateOption(form.stage_key, index, { label: v })}
                            placeholder={`选项 ${index + 1}`}
                          />
                          <Button
                            color="danger"
                            size="sm"
                            onPress={() => removeOption(form.stage_key, index)}
                            isDisabled={form.options.length <= 2}
                          >
                            删除
                          </Button>
                        </div>
                      ))}
                    </RadioGroup>
                    <div className="flex justify-end gap-3 flex-wrap">
                      <Button variant="flat" onPress={() => addOption(form.stage_key)}>
                        添加选项
                      </Button>
                      <Button color="primary" type="submit">
                        保存检测题
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
