// 關卡系統:5 大關 x 10 小關,每小關固定擊敗 5 隻怪晉級,第 10 小關是魔王,
// 第 5 關第 10 小關是大魔王。破完整組(含大魔王)直接循環回第 1 關第 1 小關,呼應放置遊戲
// 「數值持續看玩家等級成長、關卡只是不斷重複的包裝」的定位——見 getStageDifficultyMultiplier。
export const STAGE_COUNT = 5;
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
export function advanceStageProgress(progress: StageProgress): StageProgress {
  const killsInSubStage = progress.killsInSubStage + 1;
  if (killsInSubStage < KILLS_PER_SUBSTAGE) {
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

// 關卡疊加的難度/獎勵倍率:每高一大關 +15%,同一大關內每高一小關再 +3%,
// 魔王額外 x2.5、大魔王額外 x5,跟玩家等級的數值成長是各自獨立的兩條軸線。
const STAGE_MULTIPLIER_STEP = 0.15;
const SUBSTAGE_MULTIPLIER_STEP = 0.03;
const BOSS_MULTIPLIER = 2.5;
const FINAL_BOSS_MULTIPLIER = 5;

export function getStageDifficultyMultiplier(progress: StageProgress): number {
  const base = 1 + (progress.stage - 1) * STAGE_MULTIPLIER_STEP + (progress.subStage - 1) * SUBSTAGE_MULTIPLIER_STEP;
  if (isFinalBossStage(progress.stage, progress.subStage)) return base * FINAL_BOSS_MULTIPLIER;
  if (isBossSubStage(progress.subStage)) return base * BOSS_MULTIPLIER;
  return base;
}
