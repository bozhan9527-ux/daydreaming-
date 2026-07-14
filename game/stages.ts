// 關卡系統:300 大關 x 10 小關 = 3000 關,每小關固定擊敗 5 隻怪晉級,第 10 小關是魔王,
// 第 300 關第 10 小關是大魔王。破完整組(含大魔王)直接循環回第 1 關第 1 小關,呼應放置遊戲
// 「數值持續看玩家等級成長、關卡只是不斷重複的包裝」的定位——見 getStageDifficultyMultiplier。
// (原本是 5 大關,拉到 300 大關純粹是延長內容長度,兩層晉級結構跟魔王判定規則完全沒變。)
export const STAGE_COUNT = 300;
export const SUBSTAGES_PER_STAGE = 10;
export const KILLS_PER_SUBSTAGE = 5;

export interface StageProgress {
  stage: number; // 1..STAGE_COUNT
  subStage: number; // 1..SUBSTAGES_PER_STAGE
  killsInSubStage: number; // 0..KILLS_PER_SUBSTAGE-1,擊殺滿 KILLS_PER_SUBSTAGE 隻才晉級
}

export function createInitialStageProgress(): StageProgress {
  return { stage: 1, subStage: 1, killsInSubStage: 0 };
}

export function isBossSubStage(subStage: number): boolean {
  return subStage === SUBSTAGES_PER_STAGE;
}

export function isFinalBossStage(stage: number, subStage: number): boolean {
  return stage === STAGE_COUNT && isBossSubStage(subStage);
}

// 每擊殺一隻怪呼叫一次:累計到 KILLS_PER_SUBSTAGE 就晉級小關;小關滿 SUBSTAGES_PER_STAGE
// 就晉級大關;大關滿 STAGE_COUNT(等於剛打完大魔王)直接循環回第 1 關第 1 小關。
// 魔王小關(第10小關)是例外:只需要擊敗那一隻魔王/大魔王本體就晉級,不像一般小關要湊滿
// KILLS_PER_SUBSTAGE 隻——魔王關本來就該是「打贏這隻就過」的單場戰鬥,不是刷5隻同樣的魔王。
export function advanceStageProgress(progress: StageProgress): StageProgress {
  const killsInSubStage = progress.killsInSubStage + 1;
  const killsNeeded = isBossSubStage(progress.subStage) ? 1 : KILLS_PER_SUBSTAGE;
  if (killsInSubStage < killsNeeded) {
    return { ...progress, killsInSubStage };
  }

  const subStage = progress.subStage + 1;
  if (subStage <= SUBSTAGES_PER_STAGE) {
    return { stage: progress.stage, subStage, killsInSubStage: 0 };
  }

  const stage = progress.stage + 1;
  if (stage <= STAGE_COUNT) {
    return { stage, subStage: 1, killsInSubStage: 0 };
  }

  return createInitialStageProgress();
}

// 關卡疊加的難度/獎勵倍率:每高一大關 +1%,同一大關內每高一小關再 +0.2%,
// 魔王額外 x2.5、大魔王額外 x5,跟玩家等級的數值成長是各自獨立的兩條軸線。
// (STAGE_COUNT 從 5 拉到 300 時這兩個 STEP 常數有跟著往下調——沿用舊的 15%/3% 直接線性
// 拉長 60 倍會讓終局倍率從原本封頂約 9.35x 暴衝到 230x,換算下來滿等玩家單場戰鬥可能要打
// 超過一天,關卡系統末端會直接卡死。調整後終局大魔王倍率約 20x,對齊副本系統(game/dungeon.ts)
// 已經校準過的 Lv500 封頂倍率(約19x),兩套「後期硬檢驗」內容的難度量級才會一致。)
const STAGE_MULTIPLIER_STEP = 0.01;
const SUBSTAGE_MULTIPLIER_STEP = 0.002;
const BOSS_MULTIPLIER = 2.5;
const FINAL_BOSS_MULTIPLIER = 5;

// 輪迴週期加成(cycleCount,見 game/ascension.ts 的 getCycleCount):每破完一輪整組
// 3000關,下一輪的難度整體 +3%——跟第1-300關本身的難度曲線是「這一輪內部」的軸線不同,
// 這裡是「輪與輪之間」的第三條軸線。由於這個倍率也是 calcKillReward 的
// difficultyMultiplier(見 game/battle.ts),經驗/金幣獎勵會跟著同步變多,不是單純
// 「更難但沒有回報」——避免轉生加成樹點滿(第63輪前後)之後,後續每一輪都在重複一模一樣
// 的內容跟數值,失去繼續玩下去的理由。63輪時約 1+63*0.03=2.89x,不會失控暴衝。
const CYCLE_DIFFICULTY_STEP = 0.03;

// 給 UI(AscensionPanel.tsx)顯示用:算出「輪次加成」本身佔多少百分比,不用讓呼叫端
// 自己重新計算一次公式或碰觸 CYCLE_DIFFICULTY_STEP 這個內部常數。
export function getCycleDifficultyBonusPct(cycleCount: number): number {
  return Math.round(cycleCount * CYCLE_DIFFICULTY_STEP * 100);
}

export function getStageDifficultyMultiplier(progress: StageProgress, cycleCount: number = 0): number {
  const base = 1 + (progress.stage - 1) * STAGE_MULTIPLIER_STEP + (progress.subStage - 1) * SUBSTAGE_MULTIPLIER_STEP;
  const cycleMultiplier = 1 + cycleCount * CYCLE_DIFFICULTY_STEP;
  if (isFinalBossStage(progress.stage, progress.subStage)) return base * FINAL_BOSS_MULTIPLIER * cycleMultiplier;
  if (isBossSubStage(progress.subStage)) return base * BOSS_MULTIPLIER * cycleMultiplier;
  return base * cycleMultiplier;
}
