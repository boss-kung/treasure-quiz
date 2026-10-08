import type { RoundSettings } from '../../domain/types';
import { QUESTION_TYPE_LABELS } from '../../lib/setup';

interface QuestionSettingsEditorProps {
  settings: RoundSettings[];
  onChange: (settings: RoundSettings[]) => void;
}

export default function QuestionSettingsEditor({ settings, onChange }: QuestionSettingsEditorProps) {
  const update = (roundNo: number, patch: Partial<RoundSettings>) => {
    onChange(settings.map((setting) => setting.roundNo === roundNo ? { ...setting, ...patch } : setting));
  };

  return <div className="question-settings" aria-labelledby="question-settings-title">
    <div className="section-heading"><div><p className="eyebrow">QUESTION SETTINGS</p><h3 id="question-settings-title">กติกาแต่ละรอบ</h3></div><span className="muted">ปรับได้ก่อนสร้างเกม</span></div>
    <div className="round-settings-list">
      {settings.map((setting) => <article className="round-settings-card" key={setting.roundNo}>
        <div className="round-settings-title"><strong>รอบ {setting.roundNo}</strong><span>{setting.timingMode === 'total' ? `รวม ${setting.timeLimitSec} วินาที` : `${setting.timeLimitSec} วินาที/ข้อ`}</span></div>
        <label>รูปแบบ<select value={setting.questionType} onChange={(event) => update(setting.roundNo, { questionType: event.target.value as RoundSettings['questionType'], noMistake: event.target.value === 'no_mistake' })}>{Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>จำนวนข้อ<input type="number" min={1} max={10} value={setting.questionCount} onChange={(event) => update(setting.roundNo, { questionCount: Number(event.target.value) })} /></label>
        <label>โหมดเวลา<select value={setting.timingMode} onChange={(event) => update(setting.roundNo, { timingMode: event.target.value as RoundSettings['timingMode'] })}><option value="per_question">ต่อข้อ</option><option value="total">เวลารวมทั้งรอบ</option></select></label>
        <label>เวลา (วินาที)<input type="number" min={1} max={600} value={setting.timeLimitSec} onChange={(event) => update(setting.roundNo, { timeLimitSec: Number(event.target.value) })} /></label>
        <label className="checkbox-field"><input type="checkbox" checked={setting.noMistake} onChange={(event) => update(setting.roundNo, { noMistake: event.target.checked, questionType: event.target.checked ? 'no_mistake' : setting.questionType === 'no_mistake' ? 'multiple_choice' : setting.questionType })} /> ห้ามผิดเลย</label>
      </article>)}
    </div>
  </div>;
}
