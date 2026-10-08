import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { defaultRoundSettings } from '../../lib/setup';
import { buildQuestionTemplateRows, QUESTION_IMPORT_COLUMNS } from '../../lib/questionImport';
import QuestionImportPanel from './QuestionImportPanel';

afterEach(() => cleanup());

describe('QuestionImportPanel', () => {
  it('offers CSV and Excel template downloads', () => {
    render(<QuestionImportPanel settings={defaultRoundSettings()} onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ดาวน์โหลด template CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ดาวน์โหลด template Excel/i })).toBeInTheDocument();
  });

  it('previews a valid file and applies it only after confirmation', async () => {
    const onApply = vi.fn();
    const rows = buildQuestionTemplateRows(defaultRoundSettings());
    const csv = [QUESTION_IMPORT_COLUMNS.join(','), ...rows.map((row) => QUESTION_IMPORT_COLUMNS.map((column) => row[column]).join(','))].join('\n');
    render(<QuestionImportPanel settings={defaultRoundSettings()} onApply={onApply} />);
    const file = new File([csv], 'questions.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/ไฟล์คำถาม/i), { target: { files: [file] } });
    expect(await screen.findByText(/พบคำถาม 50 ข้อ/)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /ยืนยันนำเข้า/i }));
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(onApply.mock.calls[0][0]).toHaveLength(50);
  });
});
