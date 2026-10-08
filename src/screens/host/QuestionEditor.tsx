import type { QuestionDraft, RoundSettings } from '../../domain/types';
import { defaultRoundSettings, QUESTION_TYPE_LABELS, validateRoundSettings } from '../../lib/setup';
import QuestionSettingsEditor from './QuestionSettingsEditor';

interface QuestionEditorProps {
  questions: QuestionDraft[];
  onChange: (questions: QuestionDraft[]) => void;
  settings?: RoundSettings[];
  onSettingsChange?: (settings: RoundSettings[]) => void;
}

export default function QuestionEditor({ questions, onChange, settings = defaultRoundSettings(), onSettingsChange = () => undefined }: QuestionEditorProps) {
  const roundCounts = new Map<number, number>();
  for (const question of questions) roundCounts.set(question.roundNo, (roundCounts.get(question.roundNo) ?? 0) + 1);
  const invalidQuestions = questions.flatMap((question) => {
    const errors: string[] = [];
    if (!question.prompt.trim()) errors.push(`ข้อ ${question.position} ต้องมีโจทย์`);
    if (!question.keyword.trim()) errors.push(`ข้อ ${question.position} ต้องมี keyword`);
    if (new Set(question.choices).size !== question.choices.length) errors.push(`ข้อ ${question.position} มีตัวเลือกซ้ำ`);
    if (!question.choices.includes(question.correctAnswer)) errors.push(`ข้อ ${question.position} ต้องมีคำตอบที่ถูกในตัวเลือก`);
    if (question.questionType === 'true_false' && question.choices.length !== 2) errors.push(`ข้อ ${question.position} แบบใช่/ไม่ใช่ต้องมี 2 ตัวเลือก`);
    if (question.questionType !== 'true_false' && question.choices.length < 2) errors.push(`ข้อ ${question.position} ต้องมีอย่างน้อย 2 ตัวเลือก`);
    return errors;
  });

  const updateQuestion = (index: number, field: keyof QuestionDraft, value: string) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value } as QuestionDraft;
    onChange(next);
  };

  const updateChoices = (index: number, value: string) => {
    const next = [...questions];
    next[index] = { ...next[index], choices: value.split('|').map((choice) => choice.trim()) };
    onChange(next);
  };

  return <section className="setup-section" aria-labelledby="questions-title">
    <div className="section-heading"><div><p className="eyebrow">01 · QUESTION BANK</p><h2 id="questions-title">คำถามตามกติกา</h2></div><span className="count-pill">{`${questions.length} ข้อ`}</span></div>
    <QuestionSettingsEditor settings={settings} onChange={onSettingsChange} />
    <div className="round-grid">
      {settings.map((setting) => <div className="round-chip" key={setting.roundNo}><span>{`รอบ ${setting.roundNo} · ${roundCounts.get(setting.roundNo) ?? 0}/${setting.questionCount} ข้อ`}</span><small>{QUESTION_TYPE_LABELS[setting.questionType]} · {setting.timingMode === 'total' ? `${setting.timeLimitSec} วิรวม` : `${setting.timeLimitSec} วิ/ข้อ`}</small></div>)}
    </div>
    <div className="validation-list" aria-live="polite">
      {validateRoundSettings(settings).map((error) => <p className="inline-error" key={error}>{error}</p>)}
      {invalidQuestions.slice(0, 4).map((error) => <p className="inline-error" key={error}>{error}</p>)}
    </div>
    <div className="question-list">
      {questions.map((question, index) => <details key={question.id ?? `${question.roundNo}-${question.position}`} open={index === 0}>
        <summary><span>ข้อ {index + 1} · รอบ {question.roundNo}</span><small>{question.keyword || 'ยังไม่มี keyword'}</small></summary>
        <div className="question-fields">
          <label>โจทย์<input value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} /></label>
          <label>Keyword<input value={question.keyword} onChange={(event) => updateQuestion(index, 'keyword', event.target.value)} /></label>
          <label>ตัวเลือก (คั่นด้วย |)<input value={question.choices.join(' | ')} onChange={(event) => updateChoices(index, event.target.value)} /></label>
          <label>คำตอบที่ถูก<input value={question.correctAnswer} onChange={(event) => updateQuestion(index, 'correctAnswer', event.target.value)} /></label>
        </div>
      </details>)}
    </div>
  </section>;
}

export function questionEditorHasErrors(questions: QuestionDraft[], settings = defaultRoundSettings()): boolean {
  const counts = new Map<number, number>();
  for (const question of questions) counts.set(question.roundNo, (counts.get(question.roundNo) ?? 0) + 1);
  return validateRoundSettings(settings).length > 0
    || settings.some((setting) => (counts.get(setting.roundNo) ?? 0) !== setting.questionCount)
    || questions.some((question) => !question.prompt.trim() || !question.keyword.trim() || new Set(question.choices).size !== question.choices.length || !question.choices.includes(question.correctAnswer) || (question.questionType === 'true_false' && question.choices.length !== 2) || (question.questionType !== 'true_false' && question.choices.length < 2));
}
