import { ImageSourcePropType } from 'react-native';

import { Archetype, JobBranch, JobTier } from '../game/combat';

// AI 畫的戰鬥場景背景:對照 game/sprites/backgrounds.ts 註解表的場景命名。
// 1 階兩分支共用(跟 JOB_TITLES「1 階兩個分支共用同一稱號」呼應),2~5 階各分支獨立一張。
// 目前缺 magicSupport A 分支(診間/溫馨諮商室/中藥鋪/仙醫殿堂 4 張)還沒生成,
// getBackgroundArt() 對這個組合會回傳 undefined,呼叫端 fallback 回程式產生的背景。
export interface BackgroundArt {
  source: ImageSourcePropType;
  aspectRatio: number;
}

const TIER1_BACKGROUND_ART: Partial<Record<Archetype, BackgroundArt>> = {
  physicalMelee: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_tier1.png'), aspectRatio: 210 / 137 },
  physicalRanged: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_tier1.png'), aspectRatio: 224 / 137 },
  physicalSupport: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_tier1.png'), aspectRatio: 270 / 137 },
  magicMelee: { source: require('../assets/sprites/backgrounds/ai/magicMelee_tier1.png'), aspectRatio: 227 / 137 },
  magicRanged: { source: require('../assets/sprites/backgrounds/ai/magicRanged_tier1.png'), aspectRatio: 214 / 137 },
  magicSupport: { source: require('../assets/sprites/backgrounds/ai/magicSupport_tier1.png'), aspectRatio: 309 / 98 },
};

const TIER2TO5_BACKGROUND_ART: Partial<Record<string, BackgroundArt>> = {
  physicalMelee_A_2: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_A_tier2.png'), aspectRatio: 273 / 98 },
  physicalMelee_A_3: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_A_tier3.png'), aspectRatio: 273 / 98 },
  physicalMelee_A_4: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_A_tier4.png'), aspectRatio: 235 / 98 },
  physicalMelee_A_5: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_A_tier5.png'), aspectRatio: 282 / 98 },
  physicalMelee_B_2: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_B_tier2.png'), aspectRatio: 348 / 96 },
  physicalMelee_B_3: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_B_tier3.png'), aspectRatio: 306 / 96 },
  physicalMelee_B_4: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_B_tier4.png'), aspectRatio: 414 / 96 },
  physicalMelee_B_5: { source: require('../assets/sprites/backgrounds/ai/physicalMelee_B_tier5.png'), aspectRatio: 310 / 96 },
  physicalRanged_A_2: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_A_tier2.png'), aspectRatio: 338 / 89 },
  physicalRanged_A_3: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_A_tier3.png'), aspectRatio: 318 / 89 },
  physicalRanged_A_4: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_A_tier4.png'), aspectRatio: 373 / 89 },
  physicalRanged_A_5: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_A_tier5.png'), aspectRatio: 349 / 89 },
  physicalRanged_B_2: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_B_tier2.png'), aspectRatio: 348 / 87 },
  physicalRanged_B_3: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_B_tier3.png'), aspectRatio: 327 / 87 },
  physicalRanged_B_4: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_B_tier4.png'), aspectRatio: 362 / 87 },
  physicalRanged_B_5: { source: require('../assets/sprites/backgrounds/ai/physicalRanged_B_tier5.png'), aspectRatio: 341 / 87 },
  physicalSupport_A_2: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_A_tier2.png'), aspectRatio: 325 / 84 },
  physicalSupport_A_3: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_A_tier3.png'), aspectRatio: 322 / 84 },
  physicalSupport_A_4: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_A_tier4.png'), aspectRatio: 367 / 84 },
  physicalSupport_A_5: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_A_tier5.png'), aspectRatio: 364 / 84 },
  physicalSupport_B_2: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_B_tier2.png'), aspectRatio: 329 / 80 },
  physicalSupport_B_3: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_B_tier3.png'), aspectRatio: 329 / 80 },
  physicalSupport_B_4: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_B_tier4.png'), aspectRatio: 330 / 80 },
  physicalSupport_B_5: { source: require('../assets/sprites/backgrounds/ai/physicalSupport_B_tier5.png'), aspectRatio: 390 / 80 },
  magicMelee_A_2: { source: require('../assets/sprites/backgrounds/ai/magicMelee_A_tier2.png'), aspectRatio: 324 / 81 },
  magicMelee_A_3: { source: require('../assets/sprites/backgrounds/ai/magicMelee_A_tier3.png'), aspectRatio: 320 / 81 },
  magicMelee_A_4: { source: require('../assets/sprites/backgrounds/ai/magicMelee_A_tier4.png'), aspectRatio: 364 / 81 },
  magicMelee_A_5: { source: require('../assets/sprites/backgrounds/ai/magicMelee_A_tier5.png'), aspectRatio: 370 / 81 },
  magicMelee_B_2: { source: require('../assets/sprites/backgrounds/ai/magicMelee_B_tier2.png'), aspectRatio: 335 / 82 },
  magicMelee_B_3: { source: require('../assets/sprites/backgrounds/ai/magicMelee_B_tier3.png'), aspectRatio: 311 / 82 },
  magicMelee_B_4: { source: require('../assets/sprites/backgrounds/ai/magicMelee_B_tier4.png'), aspectRatio: 345 / 82 },
  magicMelee_B_5: { source: require('../assets/sprites/backgrounds/ai/magicMelee_B_tier5.png'), aspectRatio: 387 / 82 },
  magicRanged_A_2: { source: require('../assets/sprites/backgrounds/ai/magicRanged_A_tier2.png'), aspectRatio: 323 / 76 },
  magicRanged_A_3: { source: require('../assets/sprites/backgrounds/ai/magicRanged_A_tier3.png'), aspectRatio: 334 / 76 },
  magicRanged_A_4: { source: require('../assets/sprites/backgrounds/ai/magicRanged_A_tier4.png'), aspectRatio: 332 / 76 },
  magicRanged_A_5: { source: require('../assets/sprites/backgrounds/ai/magicRanged_A_tier5.png'), aspectRatio: 389 / 76 },
  magicRanged_B_2: { source: require('../assets/sprites/backgrounds/ai/magicRanged_B_tier2.png'), aspectRatio: 311 / 71 },
  magicRanged_B_3: { source: require('../assets/sprites/backgrounds/ai/magicRanged_B_tier3.png'), aspectRatio: 346 / 71 },
  magicRanged_B_4: { source: require('../assets/sprites/backgrounds/ai/magicRanged_B_tier4.png'), aspectRatio: 392 / 71 },
  magicRanged_B_5: { source: require('../assets/sprites/backgrounds/ai/magicRanged_B_tier5.png'), aspectRatio: 329 / 71 },
  magicSupport_B_2: { source: require('../assets/sprites/backgrounds/ai/magicSupport_B_tier2.png'), aspectRatio: 299 / 69 },
  magicSupport_B_3: { source: require('../assets/sprites/backgrounds/ai/magicSupport_B_tier3.png'), aspectRatio: 364 / 69 },
  magicSupport_B_4: { source: require('../assets/sprites/backgrounds/ai/magicSupport_B_tier4.png'), aspectRatio: 336 / 69 },
  magicSupport_B_5: { source: require('../assets/sprites/backgrounds/ai/magicSupport_B_tier5.png'), aspectRatio: 379 / 69 },
};

export function getBackgroundArt(archetype: Archetype, branch: JobBranch, tier: JobTier): BackgroundArt | undefined {
  if (tier === 1) return TIER1_BACKGROUND_ART[archetype];
  return TIER2TO5_BACKGROUND_ART[`${archetype}_${branch}_${tier}`];
}
