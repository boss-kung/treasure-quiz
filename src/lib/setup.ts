import type { ChestDraft, QuestionDraft, QuestionType, RewardDraft, RoundSettings } from '../domain/types';

const ROUND_COUNT = 8;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  true_false: 'ใช่ / ไม่ใช่',
  multiple_choice: 'หลายตัวเลือก',
  time_bank: 'ตอบเร็ว · เวลารวม',
  no_mistake: 'ห้ามผิดเลย',
};

export function defaultRoundSettings(): RoundSettings[] {
  return [
    ...[1, 2].map((roundNo) => ({ roundNo, questionType: 'true_false' as const, questionCount: 10, timingMode: 'per_question' as const, timeLimitSec: 10, noMistake: false })),
    ...[3, 4].map((roundNo) => ({ roundNo, questionType: 'multiple_choice' as const, questionCount: 5, timingMode: 'per_question' as const, timeLimitSec: 10, noMistake: false })),
    ...[5, 6].map((roundNo) => ({ roundNo, questionType: 'time_bank' as const, questionCount: 5, timingMode: 'total' as const, timeLimitSec: 30, noMistake: false })),
    ...[7, 8].map((roundNo) => ({ roundNo, questionType: 'no_mistake' as const, questionCount: 5, timingMode: 'per_question' as const, timeLimitSec: 15, noMistake: true })),
  ];
}

export function questionChoices(questionType: QuestionType): string[] {
  return questionType === 'true_false' ? ['ใช่', 'ไม่ใช่'] : ['A', 'B', 'C'];
}

export function blankQuestion(roundNo: number, position: number, questionType: QuestionType): QuestionDraft {
  const choices = questionChoices(questionType);
  return {
    roundNo,
    position,
    questionType,
    prompt: '',
    keyword: '',
    choices,
    correctAnswer: choices[0],
    difficulty: 1,
  };
}

export function resizeQuestionsForSettings(questions: QuestionDraft[], settings: RoundSettings[]): QuestionDraft[] {
  const byRound = new Map<number, QuestionDraft[]>();
  for (const question of questions) {
    const list = byRound.get(question.roundNo) ?? [];
    list.push(question);
    byRound.set(question.roundNo, list);
  }

  return settings.flatMap((setting) => {
    const existing = (byRound.get(setting.roundNo) ?? []).slice(0, setting.questionCount);
    const next = Array.from({ length: setting.questionCount }, (_, index) => {
      const current = existing[index];
      if (current) {
        const choices = current.questionType === setting.questionType ? current.choices : questionChoices(setting.questionType);
        return { ...current, roundNo: setting.roundNo, position: index + 1, questionType: setting.questionType, choices, correctAnswer: choices.includes(current.correctAnswer) ? current.correctAnswer : choices[0] };
      }
      return blankQuestion(setting.roundNo, index + 1, setting.questionType);
    });
    return next;
  });
}

export function validateRoundSettings(settings: RoundSettings[]): string[] {
  const errors: string[] = [];
  if (settings.length !== ROUND_COUNT) errors.push('ต้องมีการตั้งค่าครบ 8 รอบ');
  for (const setting of settings) {
    if (!Number.isInteger(setting.questionCount) || setting.questionCount < 1 || setting.questionCount > 10) errors.push(`รอบ ${setting.roundNo}: จำนวนข้อต้องอยู่ระหว่าง 1–10`);
    if (!Number.isInteger(setting.timeLimitSec) || setting.timeLimitSec < 1 || setting.timeLimitSec > 600) errors.push(`รอบ ${setting.roundNo}: เวลาต้องอยู่ระหว่าง 1–600 วินาที`);
  }
  return errors;
}

export function validateChestSettings(chests: ChestDraft[]): string[] {
  const errors: string[] = [];
  if (chests.length === 0) return ['ต้องมีหีบอย่างน้อย 1 แบบ'];
  for (const chest of chests) {
    const total = chest.rewardTable.reduce((sum, reward) => sum + reward.weight, 0);
    if (!chest.name.trim()) errors.push(`${chest.key}: ต้องมีชื่อหีบ`);
    if (!Number.isInteger(chest.goldCost) || chest.goldCost < 0) errors.push(`${chest.name || chest.key}: ทองต้องเป็นจำนวนเต็มไม่ติดลบ`);
    if (!Number.isInteger(chest.gemCost) || chest.gemCost < 0) errors.push(`${chest.name || chest.key}: เพชรต้องเป็นจำนวนเต็มไม่ติดลบ`);
    if (chest.goldCost === 0 && chest.gemCost === 0 && chest.key !== 'consolation') errors.push(`${chest.name || chest.key}: ต้องใช้ทองหรือเพชรอย่างน้อยหนึ่งอย่าง`);
    if (chest.rewardTable.length === 0) errors.push(`${chest.name || chest.key}: ต้องมีรางวัลอย่างน้อย 1 รายการ`);
    if (chest.rewardTable.some((reward) => !Number.isInteger(reward.amountSatang) || reward.amountSatang <= 0)) errors.push(`${chest.name || chest.key}: เงินรางวัลต้องมากกว่า 0 สตางค์`);
    if (chest.rewardTable.some((reward) => !Number.isInteger(reward.weight) || reward.weight <= 0)) errors.push(`${chest.name || chest.key}: เปอร์เซ็นต์ต้องมากกว่า 0`);
    if (total !== 100) errors.push(`${chest.name || chest.key}: เปอร์เซ็นต์รางวัลต้องรวม 100%`);
  }
  return errors;
}

export function validateRewardCatalog(rewards: RewardDraft[]): string[] {
  const errors: string[] = [];
  rewards.forEach((reward, index) => {
    if (!reward.title.trim()) errors.push(`รางวัลรายการที่ ${index + 1} ต้องมีชื่อ`);
    if (!Number.isInteger(reward.costSatang) || reward.costSatang <= 0) errors.push(`รางวัลรายการที่ ${index + 1} ต้องมีราคามากกว่า 0 สตางค์`);
  });
  return errors;
}
