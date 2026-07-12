import { STAGE_COUNT } from './stages';

// 輪迴/轉生系統:破完一整輪 3000 關(打贏第 300 大關的大魔王)會拿到「轉生點數」,
// 花在一棵小型永久加成樹上——同時解決兩個問題:(1) 破完一輪之後 stageProgress 會無痕跡
// 繞回第 1 關,玩家原本感覺不到「我又破完一輪」這件事,現在有轉生點數可以累積/兌換;
// (2) 練到滿等(Lv500)之後金幣沒有新的長期消耗管道,轉生點數是另一條獨立的後期成長軸,
// 不吃金幣,滿等玩家還是有東西可以投資。
//
// 輪次數(cycleCount)不另外存檔——直接用永不歸零的 totalStagesCleared(見 game/stages.ts
// 的擴充+game/achievements.ts 的關卡里程碑成就)除以 STAGE_COUNT 反推,兩邊共用同一個
// 事實來源,不會有「兩個計數器算出不同輪次」的不一致風險。
export function getCycleCount(totalStagesCleared: number): number {
  return Math.floor(totalStagesCleared / STAGE_COUNT);
}

// 每破完一輪固定發放,不隨輪次遞增/遞減——每一輪的「工作量」(破 3000 關)本身就是固定的,
// 點數產出沒有理由因為玩家破的是第 1 輪還是第 50 輪而不同。
export const ASCENSION_POINTS_PER_CYCLE = 10;

export type AscensionUpgradeId = 'exp' | 'coins' | 'speed';

export interface AscensionUpgradeDef {
  id: AscensionUpgradeId;
  label: string;
  description: string;
  maxLevel: number;
  bonusPerLevel: number; // 每級 +N% (小數,例如 0.01 = +1%)
}

// 3 個節點刻意跟裝備/寵物坐騎既有的三圍加成同一組(經驗/金幣/戰鬥速度),玩家不用學新概念——
// 差別只在於這是「破輪迴」換來的,永久疊加在所有其他加成之上,不會因為換裝/換寵物而消失。
// 封頂20級、每級+1%,單一節點滿級+20%,三個都滿+20%/+20%/+20%,對照 Lv500 封頂玩家原本
// 的加成量級(裝備/寵物/被動疊起來通常也是幾十趴等級),不會讓轉生加成獨自蓋過其他系統。
export const ASCENSION_UPGRADES: AscensionUpgradeDef[] = [
  { id: 'exp', label: '恆常經驗', description: '永久提升經驗獲取,不受裝備/寵物坐騎更換影響', maxLevel: 20, bonusPerLevel: 0.01 },
  { id: 'coins', label: '恆常財富', description: '永久提升金幣獲取,不受裝備/寵物坐騎更換影響', maxLevel: 20, bonusPerLevel: 0.01 },
  { id: 'speed', label: '恆常迅捷', description: '永久提升戰鬥速度,不受裝備/寵物坐騎更換影響', maxLevel: 20, bonusPerLevel: 0.01 },
];

export function getAscensionUpgradeDef(id: AscensionUpgradeId): AscensionUpgradeDef {
  const def = ASCENSION_UPGRADES.find((upgrade) => upgrade.id === id);
  if (!def) throw new Error(`No ascension upgrade defined for id: ${id}`);
  return def;
}

// 升級成本刻意訂成「目前等級+1」的線性遞增(1級花1點、2級花2點...20級花20點),單一節點
// 封頂總花費 1+2+...+20=210 點,三個都點滿共 630 點——對照 ASCENSION_POINTS_PER_CYCLE=10,
// 要 63 輪才能全部點滿,每輪本身就要重新打完 3000 關(約 13800 次擊殺),刻意設計成
// 深度後期內容的長期消耗標的,不是短期就能點滿的東西。
export function ascensionUpgradeCost(currentLevel: number): number {
  return currentLevel + 1;
}

export function canUpgradeAscension(
  id: AscensionUpgradeId,
  upgrades: Partial<Record<AscensionUpgradeId, number>>,
  points: number
): boolean {
  const currentLevel = upgrades[id] ?? 0;
  const def = getAscensionUpgradeDef(id);
  if (currentLevel >= def.maxLevel) return false;
  return points >= ascensionUpgradeCost(currentLevel);
}

export function getAscensionBonusTotal(id: AscensionUpgradeId, upgrades: Partial<Record<AscensionUpgradeId, number>>): number {
  const currentLevel = upgrades[id] ?? 0;
  return currentLevel * getAscensionUpgradeDef(id).bonusPerLevel;
}
