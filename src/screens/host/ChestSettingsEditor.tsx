import type { ChestDraft, RewardChance } from '../../domain/types';
import { validateChestSettings } from '../../lib/setup';

interface ChestSettingsEditorProps {
  chests: ChestDraft[];
  onChange: (chests: ChestDraft[]) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
}

export default function ChestSettingsEditor({ chests, onChange, onRemove, onAdd }: ChestSettingsEditorProps) {
  const updateChest = (key: string, patch: Partial<ChestDraft>) => onChange(chests.map((chest) => chest.key === key ? { ...chest, ...patch } : chest));
  const updateReward = (key: string, index: number, patch: Partial<RewardChance>) => onChange(chests.map((chest) => chest.key === key ? { ...chest, rewardTable: chest.rewardTable.map((reward, rewardIndex) => rewardIndex === index ? { ...reward, ...patch } : reward) } : chest));
  const addReward = (key: string) => onChange(chests.map((chest) => chest.key === key ? { ...chest, rewardTable: [...chest.rewardTable, { amountSatang: 1, weight: 1 }] } : chest));
  const removeReward = (key: string, index: number) => onChange(chests.map((chest) => chest.key === key ? { ...chest, rewardTable: chest.rewardTable.filter((_, rewardIndex) => rewardIndex !== index) } : chest));

  return <section className="setup-section" aria-labelledby="chests-title">
    <div className="section-heading"><div><p className="eyebrow">02 · CHEST ROOM</p><h2 id="chests-title">ตั้งค่าหีบและโอกาสรางวัล</h2></div><div className="editor-actions"><span className="count-pill">{chests.length} แบบ</span><button type="button" className="secondary-button compact-button" onClick={onAdd}>+ เพิ่มหีบ</button></div></div>
    <div className="chest-list editable-chest-list">{chests.map((chest) => {
      const errors = validateChestSettings([chest]);
      const total = chest.rewardTable.reduce((sum, reward) => sum + reward.weight, 0);
      return <article className="chest-editor-card" key={chest.key}>
        <div className="chest-editor-heading"><div><strong>{chest.name || 'หีบใหม่'}</strong><small>รหัส {chest.key} · รวม {total}%</small></div><button type="button" className="text-button danger-button" onClick={() => onRemove(chest.key)}>ลบหีบ</button></div>
        <div className="chest-edit-grid">
          <label>ชื่อหีบ<input value={chest.name} onChange={(event) => updateChest(chest.key, { name: event.target.value })} /></label>
          <label>ใช้ทอง<input type="number" min={0} value={chest.goldCost} onChange={(event) => updateChest(chest.key, { goldCost: Number(event.target.value) })} /></label>
          <label>ใช้เพชร<input type="number" min={0} value={chest.gemCost} onChange={(event) => updateChest(chest.key, { gemCost: Number(event.target.value) })} /></label>
        </div>
        <div className="reward-table-heading"><strong>ตารางเงินรางวัล</strong><button type="button" className="text-button" onClick={() => addReward(chest.key)}>+ เพิ่มช่องรางวัล</button></div>
        <div className="reward-table">{chest.rewardTable.map((reward, index) => <div className="reward-edit-row" key={`${chest.key}-${index}`}>
          <label>เงิน (สตางค์)<input type="number" min={1} value={reward.amountSatang} onChange={(event) => updateReward(chest.key, index, { amountSatang: Number(event.target.value) })} /></label>
          <label>โอกาส (%)<input type="number" min={1} max={100} value={reward.weight} onChange={(event) => updateReward(chest.key, index, { weight: Number(event.target.value) })} /></label>
          <button type="button" className="text-button danger-button" onClick={() => removeReward(chest.key, index)}>ลบ</button>
        </div>)}</div>
        <p className={total === 100 ? 'weight-ok' : 'inline-error'}>รวมโอกาส {total}% {total === 100 ? '✓' : '· ต้องเท่ากับ 100%'}</p>
        {errors.filter((error) => !error.includes('เปอร์เซ็นต์รางวัล')).slice(0, 2).map((error) => <p className="inline-error" key={error}>{error}</p>)}
      </article>;
    })}</div>
  </section>;
}
