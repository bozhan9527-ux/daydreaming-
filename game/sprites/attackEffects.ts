import { DamageType, Subtype } from '../combat';

// 六大職業的攻擊視覺:近戰(揮砍)/遠程(投射物)/輔助(光環)三種造型,
// 物理一律灰階、魔法一律用色,兩兩交叉正好對應 combat.ts 的 6 個 Archetype。
const PHYSICAL_COLOR = '#8b8698';
const MAGIC_COLOR = '#b389e0';
const RANGED_MAGIC_COLOR = '#6ab0e0';
const SUPPORT_MAGIC_COLOR = '#c9a94f';

const SLASH_FRAME = [
  '.......XX.',
  '......XX..',
  '.....XX...',
  '....XX....',
  '...XX.....',
  '..XX......',
  '.XX.......',
  'XX........',
  '..........',
  '..........',
];

const ARROW_FRAME = ['....X.....', '....XX....', 'XXXXXXXX..', '....XX....', '....X.....', '..........'];

const ORB_FRAME = ['...XXXX...', '..XXXXXX..', '.XXXXXXXX.', '..XXXXXX..', '...XXXX...', '..........'];

const AURA_FRAME = [
  '...XXXX...',
  '..X....X..',
  '.X......X.',
  'X........X',
  'X........X',
  'X........X',
  'X........X',
  '.X......X.',
  '..X....X..',
  '...XXXX...',
];

export interface AttackEffectData {
  frame: string[];
  palette: Record<string, string>;
}

export function getAttackEffect(subtype: Subtype, damageType: DamageType): AttackEffectData {
  if (subtype === 'melee') {
    return { frame: SLASH_FRAME, palette: { X: damageType === 'magic' ? MAGIC_COLOR : PHYSICAL_COLOR } };
  }
  if (subtype === 'ranged') {
    if (damageType === 'magic') return { frame: ORB_FRAME, palette: { X: RANGED_MAGIC_COLOR } };
    return { frame: ARROW_FRAME, palette: { X: PHYSICAL_COLOR } };
  }
  return { frame: AURA_FRAME, palette: { X: damageType === 'magic' ? SUPPORT_MAGIC_COLOR : PHYSICAL_COLOR } };
}
