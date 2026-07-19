import { Archetype } from '../game/combat';
import { EquipmentBonusStat, EquipmentItem, getIdentifyCost, ItemInstanceData, SubstatType } from '../game/equipment';

// 裝備/背包/工坊面板共用的文字格式化——原本各自在 EquipmentPanel.tsx/InventoryPanel.tsx
// 重複定義一份,抽出來避免兩邊各自維護一份容易漂移的翻譯表跟格式邏輯。

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

export const STAT_LABELS: Record<EquipmentBonusStat, string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

export const SUBSTAT_LABELS: Record<SubstatType, string> = {
  critRate: '爆擊率',
  resistance: '抗性',
  physicalResistance: '物理抗性',
  magicResistance: '魔法抗性',
  physicalCritRate: '物理爆擊率',
  physicalCritDamage: '物理爆擊傷害',
  magicCritRate: '魔法爆擊率',
  magicCritDamage: '魔法爆擊傷害',
  physicalAttack: '物理攻擊力',
  magicAttack: '魔法攻擊力',
  lifesteal: '吸血',
  hpRegen: '自動回血',
};

export function formatBonus(stat: EquipmentBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

export function formatSubstat(stat: SubstatType, value: number): string {
  return `${SUBSTAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

export function formatItemStats(item: EquipmentItem, instance: ItemInstanceData | undefined): string {
  const lines = [item.name, `主加成:${formatBonus(item.bonus.stat, item.bonus.value)}`];
  if (instance) {
    lines.push(`隨機素質:${formatSubstat(instance.randomSubstat.type, instance.randomSubstat.value)}`);
    lines.push(
      instance.identified
        ? `隱藏素質:${formatSubstat(instance.hiddenSubstat.type, instance.hiddenSubstat.value)}`
        : `隱藏素質:未鑑定(花 ${getIdentifyCost(item)} 金幣鑑定)`
    );
  }
  if (item.requiredLevel !== undefined) lines.push(`需求等級:Lv${item.requiredLevel}`);
  if (item.archetype !== undefined) lines.push(`限定職業:${ARCHETYPE_LABELS[item.archetype]}`);
  if (item.twoHanded) lines.push('雙手武器,裝備後會清空副手');
  return lines.join('\n');
}
