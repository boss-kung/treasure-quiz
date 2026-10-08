import { useMemo, useState } from 'react';
import type { ChestDraft, GameConfigSnapshot, HostActionCaller, QuestionDraft, RewardDraft, RoundSettings } from '../../domain/types';
import { defaultRoundSettings, resizeQuestionsForSettings, validateChestSettings, validateRewardCatalog } from '../../lib/setup';
import QuestionEditor, { questionEditorHasErrors } from './QuestionEditor';
import ChestSettingsEditor from './ChestSettingsEditor';
import RewardCatalogEditor from './RewardCatalogEditor';

interface HostSetupScreenProps {
  initialQuestions: QuestionDraft[];
  initialChests: ChestDraft[];
  initialRewards?: RewardDraft[];
  initialRoundSettings?: RoundSettings[];
  pinError?: string;
  action: HostActionCaller;
  onCreated?: (game: { id: string }) => void;
}

export default function HostSetupScreen({ initialQuestions, initialChests, initialRewards = [], initialRoundSettings = defaultRoundSettings(), pinError, action, onCreated }: HostSetupScreenProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [roundSettings, setRoundSettings] = useState(initialRoundSettings);
  const [chests, setChests] = useState(initialChests);
  const [rewards, setRewards] = useState(initialRewards);
  const [removedChestKeys, setRemovedChestKeys] = useState<string[]>([]);
  const [removedRewardIds, setRemovedRewardIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const questionInvalid = questionEditorHasErrors(questions, roundSettings);
  const chestErrors = validateChestSettings(chests);
  const rewardErrors = validateRewardCatalog(rewards);
  const invalid = questionInvalid || chestErrors.length > 0 || rewardErrors.length > 0;
  const summary = useMemo(() => `${questions.length} คำถาม · ${chests.length} หีบ · ${rewards.length} รางวัล`, [questions.length, chests.length, rewards.length]);

  const updateRoundSettings = (next: RoundSettings[]) => {
    setRoundSettings(next);
    setQuestions((current) => resizeQuestionsForSettings(current, next));
  };

  const addChest = () => {
    const usedKeys = new Set(chests.map((chest) => chest.key));
    const letter = Array.from({ length: 26 }, (_, index) => String.fromCharCode(97 + index)).find((value) => !usedKeys.has(`custom_${value}`)) ?? 'z';
    setChests((current) => [...current, { key: `custom_${letter}`, name: 'หีบใหม่', goldCost: 100, gemCost: 0, rewardTable: [{ amountSatang: 1, weight: 100 }] }]);
  };

  const removeChest = (key: string) => {
    setChests((current) => current.filter((chest) => chest.key !== key));
    if (!key.startsWith('custom_')) setRemovedChestKeys((current) => [...new Set([...current, key])]);
  };

  const addReward = () => setRewards((current) => [...current, { title: '', rewardKind: 'cash', costSatang: 100 }]);
  const removeReward = (id?: string, title?: string) => {
    setRewards((current) => current.filter((reward) => id ? reward.id !== id : reward.title !== title));
    if (id) setRemovedRewardIds((current) => [...new Set([...current, id])]);
  };

  const createGame = async () => {
    if (invalid || saving) return;
    setSaving(true);
    setError('');
    try {
      const configSnapshot: GameConfigSnapshot = { roundSettings };
      const response = await action<{ game?: { id: string } }>('create_game', { questions, chests, rewards, configSnapshot, removedChestKeys, removedRewardIds });
      if (response.game) onCreated?.(response.game);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกการตั้งค่าไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const saveSettings = async () => {
    if (invalid || saving) return;
    setSaving(true);
    setError('');
    try {
      for (const question of questions) await action('save_question', question);
      for (const chest of chests) await action('save_chest_type', chest);
      for (const reward of rewards) await action('save_reward_item', reward);
      for (const key of removedChestKeys) await action('delete_chest_type', { key });
      for (const id of removedRewardIds) await action('delete_reward_item', { id });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกการตั้งค่าไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  return <main className="host-screen setup-screen">
    <header className="screen-header"><div><p className="eyebrow">TREASURE QUIZ · SETUP</p><h1>จัดโต๊ะสมบัติ</h1><p className="lead">{summary}</p></div><span className="live-badge">PRIVATE DUEL</span></header>
    {pinError || error ? <p className="inline-error banner-error" role="alert">{pinError ?? error}</p> : null}
    <div className="setup-stack"><QuestionEditor questions={questions} onChange={setQuestions} settings={roundSettings} onSettingsChange={updateRoundSettings} /><ChestSettingsEditor chests={chests} onChange={setChests} onRemove={removeChest} onAdd={addChest} /><RewardCatalogEditor rewards={rewards} onChange={setRewards} onRemove={removeReward} onAdd={addReward} /></div>
    <footer className="setup-footer"><p className="muted">กดสร้างเกมเพื่อบันทึกกติกาแต่ละรอบพร้อมคำถาม หีบ และรางวัลทั้งหมด</p><button className="primary-button" onClick={createGame} disabled={invalid || saving}>{saving ? 'กำลังบันทึก…' : 'สร้างเกม'}</button><button className="secondary-button" onClick={saveSettings} disabled={invalid || saving}>บันทึกคำถามและคลังรางวัล</button></footer>
  </main>;
}
