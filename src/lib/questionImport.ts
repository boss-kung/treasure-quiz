import type { QuestionDraft, QuestionType, RoundSettings } from '../domain/types';
import { questionChoices } from './setup';

export const QUESTION_IMPORT_COLUMNS = [
  'round_no',
  'position',
  'question_type',
  'prompt',
  'keyword',
  'choices',
  'correct_answer',
  'difficulty',
] as const;

const QUESTION_TYPES: QuestionType[] = ['true_false', 'multiple_choice', 'time_bank', 'no_mistake'];

export interface QuestionImportResult {
  questions: QuestionDraft[];
  roundSettings: RoundSettings[];
  errors: string[];
}

export interface QuestionImportFileResult extends QuestionImportResult {
  fileName: string;
}

async function loadXlsx() {
  return import('xlsx');
}

function normalizedKey(value: string): string {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function rowValue(row: Record<string, unknown>, key: string): unknown {
  const entry = Object.entries(row).find(([name]) => normalizedKey(name) === key);
  return entry?.[1];
}

function textValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function integerValue(value: unknown): number | null {
  const text = textValue(value);
  if (!text || !/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function choiceValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean);
  return textValue(value).split('|').map((choice) => choice.trim()).filter(Boolean);
}

function deriveRoundSettings(currentSettings: RoundSettings[], questions: QuestionDraft[]): RoundSettings[] {
  const byRound = new Map<number, QuestionDraft[]>();
  for (const question of questions) byRound.set(question.roundNo, [...(byRound.get(question.roundNo) ?? []), question]);
  return currentSettings.map((setting) => {
    const roundQuestions = byRound.get(setting.roundNo) ?? [];
    const type = roundQuestions[0]?.questionType ?? setting.questionType;
    return {
      ...setting,
      questionCount: roundQuestions.length || setting.questionCount,
      questionType: type,
      noMistake: type === 'no_mistake',
    };
  });
}

export function parseQuestionRows(rows: Array<Record<string, unknown>>, currentSettings: RoundSettings[]): QuestionImportResult {
  const errors: string[] = [];
  const questions: QuestionDraft[] = [];
  const positions = new Set<string>();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const values = Object.values(rawRow).map(textValue);
    if (values.every((value) => !value)) return;

    const roundNo = integerValue(rowValue(rawRow, 'round_no'));
    const position = integerValue(rowValue(rawRow, 'position'));
    const questionType = textValue(rowValue(rawRow, 'question_type')) as QuestionType;
    const prompt = textValue(rowValue(rawRow, 'prompt'));
    const keyword = textValue(rowValue(rawRow, 'keyword'));
    const choices = choiceValues(rowValue(rawRow, 'choices'));
    const correctAnswer = textValue(rowValue(rawRow, 'correct_answer'));
    const difficulty = integerValue(rowValue(rawRow, 'difficulty')) ?? 1;
    const rowErrors: string[] = [];

    if (roundNo === null || roundNo < 1 || roundNo > 8) rowErrors.push('รอบต้องเป็นเลข 1–8');
    if (position === null || position < 1) rowErrors.push('ตำแหน่งต้องเป็นจำนวนเต็มเริ่มจาก 1');
    if (!QUESTION_TYPES.includes(questionType)) rowErrors.push('ชนิดคำถามไม่ถูกต้อง');
    if (!prompt) rowErrors.push('ต้องมีโจทย์');
    if (!keyword) rowErrors.push('ต้องมี keyword');
    if (choices.length < 2) rowErrors.push('ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก');
    if (new Set(choices).size !== choices.length) rowErrors.push('ตัวเลือกซ้ำกัน');
    if (questionType === 'true_false' && choices.length !== 2) rowErrors.push('แบบใช่/ไม่ใช่ต้องมีตัวเลือก 2 ตัวเลือก');
    if (!correctAnswer) rowErrors.push('ต้องมีคำตอบที่ถูกต้อง');
    else if (!choices.includes(correctAnswer)) rowErrors.push('คำตอบที่ถูกต้องต้องอยู่ในตัวเลือก');
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) rowErrors.push('difficulty ต้องอยู่ระหว่าง 1–5');

    if (roundNo !== null && position !== null) {
      const key = `${roundNo}:${position}`;
      if (positions.has(key)) rowErrors.push(`ตำแหน่งรอบ ${roundNo} ข้อ ${position} ซ้ำ`);
      positions.add(key);
    }
    if (rowErrors.length > 0) {
      errors.push(`แถว ${rowNumber}: ${rowErrors.join(' · ')}`);
      return;
    }

    questions.push({ roundNo: roundNo!, position: position!, questionType, prompt, keyword, choices, correctAnswer, difficulty });
  });

  const byRound = new Map<number, QuestionDraft[]>();
  for (const question of questions) byRound.set(question.roundNo, [...(byRound.get(question.roundNo) ?? []), question]);
  for (let roundNo = 1; roundNo <= 8; roundNo += 1) {
    const roundQuestions = (byRound.get(roundNo) ?? []).sort((a, b) => a.position - b.position);
    if (roundQuestions.length === 0) {
      errors.push(`รอบ ${roundNo}: ไม่มีคำถาม`);
      continue;
    }
    if (roundQuestions.length > 10) errors.push(`รอบ ${roundNo}: มีคำถามเกิน 10 ข้อ`);
    if (new Set(roundQuestions.map((question) => question.questionType)).size > 1) errors.push(`รอบ ${roundNo}: ชนิดคำถามต้องเหมือนกันทั้งรอบ`);
    roundQuestions.forEach((question, index) => {
      if (question.position !== index + 1) errors.push(`รอบ ${roundNo}: ตำแหน่งต้องเรียงต่อเนื่อง 1–${roundQuestions.length}`);
    });
  }

  questions.sort((a, b) => a.roundNo - b.roundNo || a.position - b.position);
  return { questions, roundSettings: deriveRoundSettings(currentSettings, questions), errors: [...new Set(errors)] };
}

export function parseQuestionFile(file: File, currentSettings: RoundSettings[]): Promise<QuestionImportFileResult> {
  const readFile = (): Promise<ArrayBuffer> => {
    if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error('อ่านไฟล์ไม่สำเร็จ'));
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    });
  };
  return Promise.all([readFile(), loadXlsx()]).then(([data, XLSX]) => {
    const workbook = XLSX.read(data, { type: 'array', raw: false });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) throw new Error('ไม่พบ worksheet ในไฟล์');
    const sheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
    return { ...parseQuestionRows(rows, currentSettings), fileName: file.name };
  });
}

export function buildQuestionTemplateRows(settings: RoundSettings[]): Array<Record<(typeof QUESTION_IMPORT_COLUMNS)[number], string | number>> {
  return settings.flatMap((setting) => Array.from({ length: setting.questionCount }, (_, index) => {
    const choices = questionChoices(setting.questionType);
    return {
      round_no: setting.roundNo,
      position: index + 1,
      question_type: setting.questionType,
      prompt: `ใส่โจทย์รอบ ${setting.roundNo} ข้อ ${index + 1}`,
      keyword: `keyword-${setting.roundNo}-${index + 1}`,
      choices: choices.join('|'),
      correct_answer: choices[0],
      difficulty: 1,
    };
  }));
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function createQuestionTemplateBlob(format: 'csv' | 'xlsx', settings: RoundSettings[]): Promise<Blob> {
  const rows = buildQuestionTemplateRows(settings);
  if (format === 'csv') {
    const csv = [QUESTION_IMPORT_COLUMNS.join(','), ...rows.map((row) => QUESTION_IMPORT_COLUMNS.map((column) => csvCell(row[column])).join(','))].join('\n');
    return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  }
  const XLSX = await loadXlsx();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...QUESTION_IMPORT_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
