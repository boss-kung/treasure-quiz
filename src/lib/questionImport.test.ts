import { describe, expect, it } from 'vitest';
import { defaultRoundSettings } from './setup';
import { createQuestionTemplateBlob, parseQuestionFile, parseQuestionRows, QUESTION_IMPORT_COLUMNS, buildQuestionTemplateRows } from './questionImport';

describe('question import', () => {
  it('parses rows and derives round counts while preserving timing settings', () => {
    const result = parseQuestionRows([
      { round_no: 1, position: 1, question_type: 'true_false', prompt: 'จริงไหม', keyword: 'แมว', choices: 'ใช่|ไม่ใช่', correct_answer: 'ใช่', difficulty: 2 },
      { round_no: 2, position: 1, question_type: 'multiple_choice', prompt: 'เลือก', keyword: 'สี', choices: 'แดง|เขียว|ฟ้า', correct_answer: 'แดง', difficulty: 1 },
    ], defaultRoundSettings());

    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('รอบ 3')]));
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].choices).toEqual(['ใช่', 'ไม่ใช่']);
    expect(result.roundSettings[0]).toMatchObject({ questionCount: 1, timeLimitSec: 10 });
  });

  it('reports row-level errors for invalid type, duplicate position, and missing prompt', () => {
    const result = parseQuestionRows([
      { round_no: 1, position: 1, question_type: 'unknown', prompt: '', keyword: 'x', choices: 'A|B', correct_answer: 'A' },
      { round_no: 1, position: 1, question_type: 'true_false', prompt: 'ซ้ำ', keyword: 'x', choices: 'ใช่|ไม่ใช่', correct_answer: 'ใช่' },
    ], defaultRoundSettings());

    expect(result.errors.join('\n')).toMatch(/แถว 2/);
    expect(result.errors.join('\n')).toMatch(/ชนิดคำถาม/);
    expect(result.errors.join('\n')).toMatch(/ซ้ำ/);
    expect(result.errors.join('\n')).toMatch(/โจทย์/);
  });

  it('rejects a missing correct answer and mixed question types within one round', () => {
    const result = parseQuestionRows([
      { round_no: 1, position: 1, question_type: 'true_false', prompt: 'หนึ่ง', keyword: 'x', choices: 'ใช่|ไม่ใช่', correct_answer: 'ใช่' },
      { round_no: 1, position: 2, question_type: 'multiple_choice', prompt: 'สอง', keyword: 'y', choices: 'A|B|C', correct_answer: 'A' },
      { round_no: 2, position: 1, question_type: 'true_false', prompt: 'สาม', keyword: 'z', choices: 'ใช่|ไม่ใช่', correct_answer: '' },
      ...buildQuestionTemplateRows(defaultRoundSettings()).filter((row) => Number(row.round_no) > 1),
    ], defaultRoundSettings());

    expect(result.errors.join('\n')).toMatch(/คำตอบที่ถูกต้อง/);
    expect(result.errors.join('\n')).toMatch(/ชนิดคำถาม.*รอบ 1|รอบ 1.*ชนิดคำถาม/);
  });

  it('creates a complete editable template with the shared columns', () => {
    const rows = buildQuestionTemplateRows(defaultRoundSettings());
    expect(Object.keys(rows[0])).toEqual(QUESTION_IMPORT_COLUMNS);
    expect(rows).toHaveLength(50);
    expect(rows[0].round_no).toBe(1);
    expect(rows[rows.length - 1]?.round_no).toBe(8);
  });

  it('reads an Excel template through the same import path', async () => {
    const blob = await createQuestionTemplateBlob('xlsx', defaultRoundSettings());
    const result = await parseQuestionFile(new File([blob], 'questions.xlsx'), defaultRoundSettings());
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(50);
  });
});
