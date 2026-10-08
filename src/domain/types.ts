export type QuestionType = 'true_false' | 'multiple_choice' | 'time_bank' | 'no_mistake';
export type TimingMode = 'per_question' | 'total';
export type BetType = 'safe' | 'gold' | 'diamond';
export type HostActionName =
  | 'get_setup' | 'save_question' | 'save_chest_type' | 'delete_chest_type' | 'save_reward_item' | 'delete_reward_item' | 'create_game'
  | 'start_game' | 'open_briefing' | 'start_round' | 'reveal_round'
  | 'advance_phase' | 'pause_game' | 'resume_game'
  | 'get_redemptions'
  | 'complete_redemption' | 'cancel_redemption' | 'adjust_wallet';

export interface QuestionDraft {
  id?: string;
  roundNo: number;
  position: number;
  questionType: QuestionType;
  prompt: string;
  keyword: string;
  choices: string[];
  correctAnswer: string;
  difficulty: number;
}

export interface RoundSettings {
  roundNo: number;
  questionType: QuestionType;
  questionCount: number;
  timingMode: TimingMode;
  timeLimitSec: number;
  noMistake: boolean;
}

export interface RewardChance {
  amountSatang: number;
  weight: number;
}

export interface ChestDraft {
  key: string;
  name: string;
  goldCost: number;
  gemCost: number;
  rewardTable: RewardChance[];
}

export interface RewardDraft {
  id?: string;
  title: string;
  rewardKind: 'cash' | 'experience';
  costSatang: number;
}

export interface GameConfigSnapshot {
  roundSettings: RoundSettings[];
}

export interface HostActionCaller {
  <T = unknown>(action: HostActionName, payload?: unknown): Promise<T>;
}

export interface PlayerActionCaller {
  <T = unknown>(action: string, payload?: unknown, pin?: string): Promise<T>;
}

export interface GameSnapshot {
  id: string;
  phase: string;
  current_round?: number;
  gold?: number;
  gems?: number;
  player_profile_id?: string;
  [key: string]: unknown;
}
