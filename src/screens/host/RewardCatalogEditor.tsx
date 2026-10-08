import type { RewardDraft } from '../../domain/types';
import { validateRewardCatalog } from '../../lib/setup';

interface RewardCatalogEditorProps {
  rewards: RewardDraft[];
  onChange: (rewards: RewardDraft[]) => void;
  onRemove: (id?: string, title?: string) => void;
  onAdd: () => void;
}

export default function RewardCatalogEditor({ rewards, onChange, onRemove, onAdd }: RewardCatalogEditorProps) {
  const update = (index: number, patch: Partial<RewardDraft>) => onChange(rewards.map((reward, rewardIndex) => rewardIndex === index ? { ...reward, ...patch } : reward));
  const errors = validateRewardCatalog(rewards);
  return <section className="setup-section" aria-labelledby="rewards-title">
    <div className="section-heading"><div><p className="eyebrow">03 · REWARD SHOP</p><h2 id="rewards-title">รางวัลแลกจริง</h2></div><button type="button" className="secondary-button compact-button" onClick={onAdd}>+ เพิ่มรางวัล</button></div>
    <p className="muted">กำหนดเป็นสตางค์ เช่น 10000 = 100 บาท</p>
    <div className="reward-catalog-editor">{rewards.map((reward, index) => <article className="reward-catalog-edit-card" key={reward.id ?? `${reward.title}-${index}`}>
      <div className="reward-edit-grid">
        <label>ชื่อรางวัล<input value={reward.title} onChange={(event) => update(index, { title: event.target.value })} /></label>
        <label>ประเภท<select value={reward.rewardKind} onChange={(event) => update(index, { rewardKind: event.target.value as RewardDraft['rewardKind'] })}><option value="cash">เงินสด</option><option value="experience">ของรางวัล/ประสบการณ์</option></select></label>
        <label>ราคา (สตางค์)<input type="number" min={1} value={reward.costSatang} onChange={(event) => update(index, { costSatang: Number(event.target.value) })} /></label>
      </div>
      <button type="button" className="text-button danger-button" onClick={() => onRemove(reward.id, reward.title)}>ลบรางวัล</button>
    </article>)}</div>
    {errors.slice(0, 3).map((error) => <p className="inline-error" key={error}>{error}</p>)}
  </section>;
}
