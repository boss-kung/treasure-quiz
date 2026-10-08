import { describe, expect, it } from 'vitest';
import type { ChestDraft, QuestionDraft, RewardDraft } from '../domain/types';
import {
  defaultRoundSettings,
  resizeQuestionsForSettings,
  validateChestSettings,
  validateRewardCatalog,
} from './setup';

function question(roundNo: number, position: number): QuestionDraft {
  return {
    roundNo,
    position,
    questionType: roundNo <= 2 ? 'true_false' : 'multiple_choice',
    prompt: `Q${roundNo}-${position}`,
    keyword: `K${roundNo}-${position}`,
    choices: roundNo <= 2 ? ['ใช่', 'ไม่ใช่'] : ['A', 'B', 'C'],
    correctAnswer: roundNo <= 2 ? 'ใช่' : 'A',
    difficulty: 1,
  };
}

describe('setup settings', () => {
  it('starts with the eight approved round formats', () => {
    const settings = defaultRoundSettings();
    expect(settings.map(({ questionType, questionCount, timingMode, timeLimitSec }) => ({ questionType, questionCount, timingMode, timeLimitSec }))).toEqual([
      { questionType: 'true_false', questionCount: 10, timingMode: 'per_question', timeLimitSec: 10 },
      { questionType: 'true_false', questionCount: 10, timingMode: 'per_question', timeLimitSec: 10 },
      { questionType: 'multiple_choice', questionCount: 5, timingMode: 'per_question', timeLimitSec: 10 },
      { questionType: 'multiple_choice', questionCount: 5, timingMode: 'per_question', timeLimitSec: 10 },
      { questionType: 'time_bank', questionCount: 5, timingMode: 'total', timeLimitSec: 30 },
      { questionType: 'time_bank', questionCount: 5, timingMode: 'total', timeLimitSec: 30 },
      { questionType: 'no_mistake', questionCount: 5, timingMode: 'per_question', timeLimitSec: 15 },
      { questionType: 'no_mistake', questionCount: 5, timingMode: 'per_question', timeLimitSec: 15 },
    ]);
  });

  it('resizes a round while preserving existing questions and creating blanks', () => {
    const current = [question(1, 1), question(1, 2)];
    const settings = defaultRoundSettings().map((item) => item.roundNo === 1 ? { ...item, questionCount: 3 } : item);
    const resized = resizeQuestionsForSettings(current, settings);
    expect(resized.filter((item) => item.roundNo === 1)).toHaveLength(3);
    expect(resized[2]).toMatchObject({ roundNo: 1, position: 3, prompt: '', keyword: '' });
    expect(resized[2].choices).toEqual(['ใช่', 'ไม่ใช่']);
  });

  it('rejects chest tables that do not total 100 percent', () => {
    const chest: ChestDraft = { key: 'copper', name: 'ทองแดง', goldCost: 100, gemCost: 0, rewardTable: [{ amountSatang: 1, weight: 99 }] };
    expect(validateChestSettings([chest])).toContain('ทองแดง: เปอร์เซ็นต์รางวัลต้องรวม 100%');
  });

  it('rejects reward entries without a title or positive cost', () => {
    const reward: RewardDraft = { title: '', rewardKind: 'cash', costSatang: 0 };
    expect(validateRewardCatalog([reward])).toEqual(['รางวัลรายการที่ 1 ต้องมีชื่อ', 'รางวัลรายการที่ 1 ต้องมีราคามากกว่า 0 สตางค์']);
  });
});
