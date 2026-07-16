import { ImageSourcePropType } from 'react-native';

// AI 畫的怪物美術:12 種怪物原型(對照 game/monsters.ts 的 ARCHETYPE_CATALOG)裡目前只有
// 11 種有圖(serpent/巨蟒還沒生成),外加 5 大關魔王 + 大魔王共 6 款。每款都是同一張三聯圖裁出
// 的三個姿勢(idle/windup/strike),跟角色/武器同一套「去背裁切、原生比例」做法。缺圖的原型
// (目前只有 serpent)呼叫端會拿到 undefined,自行 fallback 回 game/sprites/monsters.ts 的
// 程式產生圖示——所有稀有度共用同一張圖(不像程式版本會依稀有度換色),這是暫時的簡化,
// 之後如果要讓稀有度也有視覺差異,再另外生成變體圖。
export interface MonsterArt {
  idle: ImageSourcePropType;
  windup: ImageSourcePropType;
  strike: ImageSourcePropType;
  idleAspectRatio: number;
  windupAspectRatio: number;
  strikeAspectRatio: number;
}

const MONSTER_ART: Partial<Record<string, MonsterArt>> = {
  blob: {
    idle: require('../assets/sprites/monsters/ai/blob_open.png'),
    windup: require('../assets/sprites/monsters/ai/blob_middle.png'),
    strike: require('../assets/sprites/monsters/ai/blob_click.png'),
    idleAspectRatio: 376 / 308,
    windupAspectRatio: 401 / 203,
    strikeAspectRatio: 538 / 255,
  },
  flying: {
    idle: require('../assets/sprites/monsters/ai/flying_open.png'),
    windup: require('../assets/sprites/monsters/ai/flying_middle.png'),
    strike: require('../assets/sprites/monsters/ai/flying_click.png'),
    idleAspectRatio: 543 / 249,
    windupAspectRatio: 382 / 252,
    strikeAspectRatio: 594 / 292,
  },
  biped: {
    idle: require('../assets/sprites/monsters/ai/biped_open.png'),
    windup: require('../assets/sprites/monsters/ai/biped_middle.png'),
    strike: require('../assets/sprites/monsters/ai/biped_click.png'),
    idleAspectRatio: 336 / 453,
    windupAspectRatio: 584 / 359,
    strikeAspectRatio: 428 / 380,
  },
  fungal: {
    idle: require('../assets/sprites/monsters/ai/fungal_open.png'),
    windup: require('../assets/sprites/monsters/ai/fungal_middle.png'),
    strike: require('../assets/sprites/monsters/ai/fungal_click.png'),
    idleAspectRatio: 413 / 374,
    windupAspectRatio: 401 / 312,
    strikeAspectRatio: 496 / 307,
  },
  undead: {
    idle: require('../assets/sprites/monsters/ai/undead_open.png'),
    windup: require('../assets/sprites/monsters/ai/undead_middle.png'),
    strike: require('../assets/sprites/monsters/ai/undead_click.png'),
    idleAspectRatio: 402 / 560,
    windupAspectRatio: 358 / 494,
    strikeAspectRatio: 548 / 455,
  },
  construct: {
    idle: require('../assets/sprites/monsters/ai/construct_open.png'),
    windup: require('../assets/sprites/monsters/ai/construct_middle.png'),
    strike: require('../assets/sprites/monsters/ai/construct_click.png'),
    idleAspectRatio: 374 / 430,
    windupAspectRatio: 442 / 393,
    strikeAspectRatio: 461 / 469,
  },
  dragon: {
    idle: require('../assets/sprites/monsters/ai/dragon_open.png'),
    windup: require('../assets/sprites/monsters/ai/dragon_middle.png'),
    strike: require('../assets/sprites/monsters/ai/dragon_click.png'),
    idleAspectRatio: 344 / 462,
    windupAspectRatio: 365 / 453,
    strikeAspectRatio: 508 / 411,
  },
  quadruped: {
    idle: require('../assets/sprites/monsters/ai/quadruped_open.png'),
    windup: require('../assets/sprites/monsters/ai/quadruped_middle.png'),
    strike: require('../assets/sprites/monsters/ai/quadruped_click.png'),
    idleAspectRatio: 383 / 306,
    windupAspectRatio: 454 / 303,
    strikeAspectRatio: 465 / 301,
  },
  insect: {
    idle: require('../assets/sprites/monsters/ai/insect_open.png'),
    windup: require('../assets/sprites/monsters/ai/insect_middle.png'),
    strike: require('../assets/sprites/monsters/ai/insect_click.png'),
    idleAspectRatio: 419 / 323,
    windupAspectRatio: 479 / 344,
    strikeAspectRatio: 488 / 371,
  },
  aquatic: {
    idle: require('../assets/sprites/monsters/ai/aquatic_open.png'),
    windup: require('../assets/sprites/monsters/ai/aquatic_middle.png'),
    strike: require('../assets/sprites/monsters/ai/aquatic_click.png'),
    idleAspectRatio: 434 / 429,
    windupAspectRatio: 426 / 428,
    strikeAspectRatio: 471 / 390,
  },
  elemental: {
    idle: require('../assets/sprites/monsters/ai/elemental_open.png'),
    windup: require('../assets/sprites/monsters/ai/elemental_middle.png'),
    strike: require('../assets/sprites/monsters/ai/elemental_click.png'),
    idleAspectRatio: 364 / 603,
    windupAspectRatio: 462 / 628,
    strikeAspectRatio: 494 / 596,
  },
  boss_tier1: {
    idle: require('../assets/sprites/monsters/ai/boss_tier1_open.png'),
    windup: require('../assets/sprites/monsters/ai/boss_tier1_middle.png'),
    strike: require('../assets/sprites/monsters/ai/boss_tier1_click.png'),
    idleAspectRatio: 373 / 425,
    windupAspectRatio: 437 / 514,
    strikeAspectRatio: 517 / 388,
  },
  boss_tier2: {
    idle: require('../assets/sprites/monsters/ai/boss_tier2_open.png'),
    windup: require('../assets/sprites/monsters/ai/boss_tier2_middle.png'),
    strike: require('../assets/sprites/monsters/ai/boss_tier2_click.png'),
    idleAspectRatio: 402 / 481,
    windupAspectRatio: 429 / 445,
    strikeAspectRatio: 553 / 407,
  },
  boss_tier3: {
    idle: require('../assets/sprites/monsters/ai/boss_tier3_open.png'),
    windup: require('../assets/sprites/monsters/ai/boss_tier3_middle.png'),
    strike: require('../assets/sprites/monsters/ai/boss_tier3_click.png'),
    idleAspectRatio: 436 / 583,
    windupAspectRatio: 489 / 695,
    strikeAspectRatio: 471 / 502,
  },
  boss_tier4: {
    idle: require('../assets/sprites/monsters/ai/boss_tier4_open.png'),
    windup: require('../assets/sprites/monsters/ai/boss_tier4_middle.png'),
    strike: require('../assets/sprites/monsters/ai/boss_tier4_click.png'),
    idleAspectRatio: 359 / 577,
    windupAspectRatio: 538 / 560,
    strikeAspectRatio: 491 / 471,
  },
  boss_tier5: {
    idle: require('../assets/sprites/monsters/ai/boss_tier5_open.png'),
    windup: require('../assets/sprites/monsters/ai/boss_tier5_middle.png'),
    strike: require('../assets/sprites/monsters/ai/boss_tier5_click.png'),
    idleAspectRatio: 384 / 637,
    windupAspectRatio: 505 / 634,
    strikeAspectRatio: 494 / 574,
  },
  boss_final: {
    idle: require('../assets/sprites/monsters/ai/boss_final_open.png'),
    windup: require('../assets/sprites/monsters/ai/boss_final_middle.png'),
    strike: require('../assets/sprites/monsters/ai/boss_final_click.png'),
    idleAspectRatio: 405 / 757,
    windupAspectRatio: 502 / 740,
    strikeAspectRatio: 500 / 593,
  },
};

// 怪物 id 格式是 `${archetype}-${slot}`(一般怪,見 game/monsters.ts 的 buildMonsterCatalog)
// 或 `stage_boss_tier${1-5}` / `final_boss`(魔王,同檔案的 STAGE_BOSS_MONSTERS/FINAL_BOSS_MONSTER)。
function getMonsterArtKey(monsterId: string): string {
  if (monsterId === 'final_boss') return 'boss_final';
  if (monsterId.startsWith('stage_boss_tier')) return monsterId.replace('stage_boss_', 'boss_');
  return monsterId.split('-')[0];
}

export function getMonsterArt(monsterId: string): MonsterArt | undefined {
  return MONSTER_ART[getMonsterArtKey(monsterId)];
}
