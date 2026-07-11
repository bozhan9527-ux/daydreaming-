// 「學生」期(Lv1-29,見 lib/storage.ts 的 hasChosenJob)專屬技能樹:玩家還沒選定主職業,
// 不能借用 game/skillTree.ts 那套 Record<Archetype, ...> 的職業技能樹,所以獨立一份。
// 結構完全比照既有 SkillSlotId(passive1/passive2/active1~active4)框架,但只有「一套」
// (不分職業),分 tier1(Lv1,新生)/tier2(Lv10,模範生)兩組敘述,呼應「10級做一組,共兩組」。
//
// 升級花費/觸發間隔/被動加成/主動效果數值全部直接沿用 game/skillTree.ts 的既有公式,
// 不重新發明——學生樹只是「繫在不同的等級軌道上」,機制跟職業樹完全一樣。
import {
  ActiveEffectKind,
  ActiveSkillSlotId,
  ACTIVE_SLOT_IDS,
  activeSkillTriggerIntervalSeconds,
  getBonusCoinsAmount,
  getExpBoostAmount,
  getPassiveBonusValue,
  getPassiveEffectKind,
  isPassiveSlot,
  PassiveEffectKind,
  skillSlotUpgradeBookCost,
  SkillSlotId,
} from './skillTree';

export type { ActiveEffectKind, PassiveEffectKind };
export {
  activeSkillTriggerIntervalSeconds,
  getBonusCoinsAmount,
  getExpBoostAmount,
  getPassiveBonusValue,
  getPassiveEffectKind,
  skillSlotUpgradeBookCost,
};

export function createInitialStudentSkillTreeLevels(): Record<SkillSlotId, number> {
  return { passive1: 0, passive2: 0, active1: 0, active2: 0, active3: 0, active4: 0 };
}

// 學生沒有 JobTier 概念,等級上限直接開一個新常數,對齊職業樹 tier1 的封頂(2級),
// 呼應「學生期能練到的技能深度跟職業tier1差不多」的定位(新制沿用舊制「學生封頂60剛好等於
// 舊制tier1封頂60」的對應關係)。
export const STUDENT_SKILL_LEVEL_CAP = 2;

export function canUpgradeStudentSkillSlot(level: number, skillBooks: number): boolean {
  return level < STUDENT_SKILL_LEVEL_CAP && skillBooks >= skillSlotUpgradeBookCost(level);
}

export function upgradeStudentSkillSlot(level: number): number {
  return Math.min(STUDENT_SKILL_LEVEL_CAP, level + 1);
}

// 職業樹的 4 個主動格效果順序依 subtype 決定(見 skillTree.ts 的 rotatedKinds),學生沒有
// subtype,直接固定寫死一個順序:active1=額外經驗、active2=額外金幣、active3=雙倍獎勵、
// active4=瞬間結束。
export const STUDENT_ACTIVE_KIND_ORDER: ActiveEffectKind[] = ['expBoost', 'bonusCoins', 'doubleReward', 'instantFinish'];

export function getStudentActiveEffectKind(slot: ActiveSkillSlotId): ActiveEffectKind {
  const index = (ACTIVE_SLOT_IDS as SkillSlotId[]).indexOf(slot);
  return STUDENT_ACTIVE_KIND_ORDER[index];
}

export interface StudentSkillFlavor {
  name: string;
  description: string;
}

// tier1(Lv1,剛入學的「新生」)/tier2(Lv10,已經打出名號的「風雲人物」)兩組敘述,
// 呼應「10級做一組,共兩組」的需求,語氣走國高中生校園情境,不重複職業樹 tier1 的
// 「工讀生」系列上班族梗。
export const STUDENT_SKILL_FLAVOR: Record<1 | 2, Record<SkillSlotId, StudentSkillFlavor>> = {
  1: {
    passive1: {
      name: '新生的求知欲',
      description: '剛入學什麼都好奇,上課特別認真抄重點,經驗值吸收得更快。',
    },
    passive2: {
      name: '早餐店熟客價',
      description: '早餐店老闆記得你的臉,順手多找一點零錢回來。',
    },
    active1: {
      name: '抄筆記抄出心得',
      description: '筆記抄出自己的一套心得,額外進帳一筆經驗值。',
    },
    active2: {
      name: '福利社前撿到零錢',
      description: '福利社前低頭一看撿到一枚硬幣,額外進帳一筆金幣。',
    },
    active3: {
      name: '小考超常發揮',
      description: '這次小考超常發揮,這次擊殺的經驗與金幣獎勵直接翻倍。',
    },
    active4: {
      name: '打鐘下課',
      description: '鐘聲一響立刻收拾書包衝出教室,直接讓下一場戰鬥瞬間結束。',
    },
  },
  2: {
    passive1: {
      name: '模範生的讀書法',
      description: '摸出一套自己的讀書方法,經驗值吸收得更快。',
    },
    passive2: {
      name: '班費幹部精算術',
      description: '當上班費幹部練出的精算功力,順手多幫班上多存一點。',
    },
    active1: {
      name: '重點整理神技',
      description: '一份重點整理筆記傳遍全班,額外進帳一筆經驗值。',
    },
    active2: {
      name: '校慶擺攤賺一筆',
      description: '校慶園遊會擺攤生意興隆,額外進帳一筆金幣。',
    },
    active3: {
      name: '段考奪冠',
      description: '這次段考全班奪冠,這次擊殺的經驗與金幣獎勵直接翻倍。',
    },
    active4: {
      name: '風雲人物人氣爆棚',
      description: '風雲人物人氣爆棚,一聲令下全場歡呼收場,直接讓下一場戰鬥瞬間結束。',
    },
  },
};

// level < 1 用 tier1(新生)內容,level >= 1 用 tier2(風雲人物)內容——新制封頂只有2級,
// 格子很少、每一級都珍貴,練過一次升級就換一套敘述,呼應舊制「10級做一組」按比例縮小後的分界。
export function getStudentSkillFlavor(level: number, slot: SkillSlotId): StudentSkillFlavor {
  return STUDENT_SKILL_FLAVOR[level >= 1 ? 2 : 1][slot];
}

// 依目前技能等級組成一句人看得懂的說明,對照 game/skillTree.ts 的 getSkillSlotBonusDescription,
// 差別只在主動效果順序改吃 getStudentActiveEffectKind(不吃 archetype/subtype)。
export function getStudentSkillSlotBonusDescription(slot: SkillSlotId, level: number): string {
  if (isPassiveSlot(slot)) {
    const kind = getPassiveEffectKind(slot);
    const pct = Math.round(getPassiveBonusValue(level) * 1000) / 10;
    return kind === 'expMastery' ? `永久經驗獲取 +${pct}%` : `永久金幣獲取 +${pct}%`;
  }
  const kind = getStudentActiveEffectKind(slot as ActiveSkillSlotId);
  const seconds = activeSkillTriggerIntervalSeconds(slot as ActiveSkillSlotId, level);
  if (kind === 'instantFinish') return `每 ${seconds} 秒觸發一次,下一場戰鬥直接瞬間結束`;
  if (kind === 'doubleReward') return `每 ${seconds} 秒觸發一次,這次擊殺的經驗與金幣翻倍`;
  if (kind === 'bonusCoins') return `每 ${seconds} 秒觸發一次,額外獲得 ${getBonusCoinsAmount()} 金幣`;
  return `每 ${seconds} 秒觸發一次,額外獲得 ${getExpBoostAmount()} 經驗`;
}
