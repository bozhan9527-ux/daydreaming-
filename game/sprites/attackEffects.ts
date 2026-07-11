import { Archetype } from '../combat';
import { getSkillIcon } from './skillIcons';

// 攻擊特效改成直接沿用 skillIcons.ts 的招式圖示(爆擊一擊/連續多重射擊/治療光環等六款各自造型),
// 不再用「近戰/遠程/輔助 x 物理/魔法」四套共用樣板——同一招式在技能面板的圖示跟戰鬥畫面動畫長得
// 一樣,玩家才認得出「這隻怪剛剛是被哪招打的」。
export interface AttackEffectData {
  frame: string[];
  palette: Record<string, string>;
}

export function getAttackEffect(archetype: Archetype): AttackEffectData {
  return getSkillIcon(archetype, 'active1', 1);
}
