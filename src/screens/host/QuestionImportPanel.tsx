import { useRef, useState } from 'react';
import type { QuestionDraft, RoundSettings } from '../../domain/types';
import { createQuestionTemplateBlob, parseQuestionFile, type QuestionImportFileResult } from '../../lib/questionImport';

interface QuestionImportPanelProps {
  settings: RoundSettings[];
  onApply: (questions: QuestionDraft[], settings: RoundSettings[]) => void;
}

async function downloadTemplate(format: 'csv' | 'xlsx', settings: RoundSettings[]): Promise<void> {
  const blob = await createQuestionTemplateBlob(format, settings);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `treasure-quiz-question-template.${format}`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export default function QuestionImportPanel({ settings, onApply }: QuestionImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<QuestionImportFileResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      if (file.size > 2_000_000) throw new Error('ไฟล์ใหญ่เกิน 2 MB');
      setPreview(await parseQuestionFile(file, settings));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'อ่านไฟล์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const applyPreview = () => {
    if (!preview || preview.errors.length > 0) return;
    onApply(preview.questions, preview.roundSettings);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return <section className="question-import-panel setup-section" aria-labelledby="question-import-title">
    <div className="section-heading">
      <div><p className="eyebrow">QUESTION IMPORT</p><h3 id="question-import-title">นำเข้าคำถามจากไฟล์</h3></div>
      <span className="muted">แทนที่ทั้งชุด · สูงสุด 80 ข้อ</span>
    </div>
    <p className="muted">ดาวน์โหลด template แล้วกรอกข้อมูล จากนั้นอัปโหลดเพื่อดู preview ก่อนแทนที่คำถามเดิม</p>
    <div className="import-actions">
      <button type="button" className="secondary-button compact-button" onClick={() => { void downloadTemplate('csv', settings); }}>ดาวน์โหลด template CSV</button>
      <button type="button" className="secondary-button compact-button" onClick={() => { void downloadTemplate('xlsx', settings); }}>ดาวน์โหลด template Excel</button>
      <label className="file-input-button primary-button" htmlFor="question-file">{busy ? 'กำลังอ่านไฟล์…' : 'เลือกไฟล์คำถาม'}<input ref={inputRef} id="question-file" aria-label="ไฟล์คำถาม" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" disabled={busy} onChange={(event) => { void handleFile(event.target.files?.[0]); }} /></label>
    </div>
    {error ? <p className="inline-error" role="alert">{error}</p> : null}
    {preview ? <div className="import-preview" aria-live="polite">
      <div className="import-preview-heading"><strong>{`ไฟล์ ${preview.fileName}`}</strong><span className={preview.errors.length === 0 ? 'weight-ok' : 'inline-error'}>{preview.errors.length === 0 ? `พบคำถาม ${preview.questions.length} ข้อ · พร้อมนำเข้า` : `พบข้อผิดพลาด ${preview.errors.length} รายการ`}</span></div>
      <div className="import-round-summary">{preview.roundSettings.map((setting) => <span key={setting.roundNo}>{`รอบ ${setting.roundNo}: ${setting.questionCount} ข้อ`}</span>)}</div>
      {preview.errors.length > 0 ? <div className="validation-list">{preview.errors.slice(0, 8).map((message) => <p className="inline-error" key={message}>{message}</p>)}{preview.errors.length > 8 ? <p className="muted">และอีก {preview.errors.length - 8} รายการ…</p> : null}</div> : <button type="button" className="primary-button" onClick={applyPreview}>ยืนยันนำเข้าและแทนที่ชุดเดิม</button>}
    </div> : null}
  </section>;
}
