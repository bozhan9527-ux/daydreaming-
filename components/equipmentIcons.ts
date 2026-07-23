import { ImageSourcePropType } from 'react-native';

import { Archetype, getCurrentTier, JobBranch, JobTier } from '../game/combat';
import { EquipmentItem, EquipmentSlot } from '../game/equipment';

// AI 畫的裝備圖示(武器以外的8個插槽:背/下身/上身/腰帶/頭飾/面飾/手套/副手),跟
// weaponIcons.ts 的主手武器圖示同一批素材、同一套資料形狀——裝備清單畫面(裝備/背包)
// 有 AI 圖示就顯示 AI 圖,查不到(理論上不會發生,8槽x6職業x5階都有配圖)就由呼叫端
// (ItemIcon.tsx)自行 fallback 回 game/sprites/equipmentIcons.ts 的程式產生圖示。
export interface EquipmentIconData {
  source: ImageSourcePropType;
  aspectRatio: number;
}

type NonWeaponSlot = Exclude<EquipmentSlot, 'mainhand'>;
type SlotIconSet = Partial<Record<NonWeaponSlot, EquipmentIconData>>;
// A/B兩key:tier1兩分支尚未分岔,A/B共用同一張圖(見 game/combat.ts 的 JOB_TITLES 說明);
// tier2起才是兩張不同構圖的圖(檔名 _b 後綴 = 分支B專屬)。
type BranchIconSet = Record<JobBranch, SlotIconSet>;

const PHYSICAL_MELEE_EQUIPMENT_ICONS: Record<JobTier, BranchIconSet> = {
  1: {
    A: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_back.png'), aspectRatio: 254 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_bottom.png'), aspectRatio: 251 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_top.png'), aspectRatio: 286 / 369 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_belt.png'), aspectRatio: 400 / 393 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_headwear.png'), aspectRatio: 400 / 335 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_face.png'), aspectRatio: 397 / 344 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_gloves.png'), aspectRatio: 343 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_offhand.png'), aspectRatio: 399 / 373 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_back.png'), aspectRatio: 254 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_bottom.png'), aspectRatio: 251 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_top.png'), aspectRatio: 286 / 369 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_belt.png'), aspectRatio: 400 / 393 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_headwear.png'), aspectRatio: 400 / 335 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_face.png'), aspectRatio: 397 / 344 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_gloves.png'), aspectRatio: 343 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_offhand.png'), aspectRatio: 399 / 373 },
    },
  },
  2: {
    A: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_back.png'), aspectRatio: 400 / 375 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_bottom.png'), aspectRatio: 231 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_top.png'), aspectRatio: 391 / 400 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_belt.png'), aspectRatio: 400 / 309 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_headwear.png'), aspectRatio: 400 / 351 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_face.png'), aspectRatio: 400 / 339 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_gloves.png'), aspectRatio: 323 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_offhand.png'), aspectRatio: 400 / 388 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_back_b.png'), aspectRatio: 400 / 311 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_bottom_b.png'), aspectRatio: 400 / 355 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_top_b.png'), aspectRatio: 292 / 400 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_belt_b.png'), aspectRatio: 382 / 133 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_headwear_b.png'), aspectRatio: 400 / 215 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_face_b.png'), aspectRatio: 400 / 268 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_gloves_b.png'), aspectRatio: 400 / 208 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_offhand_b.png'), aspectRatio: 400 / 399 },
    },
  },
  3: {
    A: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_back.png'), aspectRatio: 308 / 383 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_bottom.png'), aspectRatio: 171 / 375 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_top.png'), aspectRatio: 329 / 400 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_belt.png'), aspectRatio: 377 / 400 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_headwear.png'), aspectRatio: 400 / 310 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_face.png'), aspectRatio: 312 / 400 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_gloves.png'), aspectRatio: 304 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_offhand.png'), aspectRatio: 400 / 307 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_back_b.png'), aspectRatio: 400 / 251 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_bottom_b.png'), aspectRatio: 224 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_top_b.png'), aspectRatio: 385 / 400 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_belt_b.png'), aspectRatio: 320 / 389 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_headwear_b.png'), aspectRatio: 278 / 400 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_face_b.png'), aspectRatio: 400 / 166 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_gloves_b.png'), aspectRatio: 346 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_offhand_b.png'), aspectRatio: 353 / 400 },
    },
  },
  4: {
    A: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_back.png'), aspectRatio: 365 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_bottom.png'), aspectRatio: 400 / 379 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_top.png'), aspectRatio: 400 / 292 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_belt.png'), aspectRatio: 238 / 296 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_headwear.png'), aspectRatio: 357 / 400 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_face.png'), aspectRatio: 328 / 376 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_gloves.png'), aspectRatio: 296 / 292 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_offhand.png'), aspectRatio: 162 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_back_b.png'), aspectRatio: 329 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_bottom_b.png'), aspectRatio: 309 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_top_b.png'), aspectRatio: 344 / 400 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_belt_b.png'), aspectRatio: 400 / 168 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_headwear_b.png'), aspectRatio: 308 / 400 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_face_b.png'), aspectRatio: 280 / 372 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_gloves_b.png'), aspectRatio: 306 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_offhand_b.png'), aspectRatio: 264 / 400 },
    },
  },
  5: {
    A: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_back.png'), aspectRatio: 329 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_bottom.png'), aspectRatio: 205 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_top.png'), aspectRatio: 327 / 357 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_belt.png'), aspectRatio: 400 / 233 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_headwear.png'), aspectRatio: 354 / 371 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_face.png'), aspectRatio: 400 / 141 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_gloves.png'), aspectRatio: 400 / 229 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_offhand.png'), aspectRatio: 271 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_back_b.png'), aspectRatio: 221 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_bottom_b.png'), aspectRatio: 328 / 400 },
      top: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_top_b.png'), aspectRatio: 338 / 400 },
      belt: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_belt_b.png'), aspectRatio: 400 / 155 },
      headwear: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_headwear_b.png'), aspectRatio: 400 / 241 },
      face: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_face_b.png'), aspectRatio: 400 / 284 },
      gloves: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_gloves_b.png'), aspectRatio: 400 / 376 },
      offhand: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_offhand_b.png'), aspectRatio: 245 / 299 },
    },
  },
};

const PHYSICAL_RANGED_EQUIPMENT_ICONS: Record<JobTier, BranchIconSet> = {
  1: {
    A: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_back.png'), aspectRatio: 386 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_bottom.png'), aspectRatio: 281 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_top.png'), aspectRatio: 261 / 400 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_belt.png'), aspectRatio: 400 / 332 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_headwear.png'), aspectRatio: 383 / 400 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_face.png'), aspectRatio: 400 / 214 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_gloves.png'), aspectRatio: 296 / 338 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_offhand.png'), aspectRatio: 208 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_back.png'), aspectRatio: 386 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_bottom.png'), aspectRatio: 281 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_top.png'), aspectRatio: 261 / 400 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_belt.png'), aspectRatio: 400 / 332 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_headwear.png'), aspectRatio: 383 / 400 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_face.png'), aspectRatio: 400 / 214 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_gloves.png'), aspectRatio: 296 / 338 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_offhand.png'), aspectRatio: 208 / 400 },
    },
  },
  2: {
    A: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_back.png'), aspectRatio: 339 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_bottom.png'), aspectRatio: 273 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_top.png'), aspectRatio: 398 / 369 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_belt.png'), aspectRatio: 400 / 245 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_headwear.png'), aspectRatio: 400 / 334 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_face.png'), aspectRatio: 400 / 130 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_gloves.png'), aspectRatio: 400 / 383 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_offhand.png'), aspectRatio: 330 / 305 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_back_b.png'), aspectRatio: 400 / 381 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_bottom_b.png'), aspectRatio: 400 / 333 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_top_b.png'), aspectRatio: 400 / 369 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_belt_b.png'), aspectRatio: 400 / 314 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_headwear_b.png'), aspectRatio: 400 / 314 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_face_b.png'), aspectRatio: 400 / 273 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_gloves_b.png'), aspectRatio: 375 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_offhand_b.png'), aspectRatio: 400 / 333 },
    },
  },
  3: {
    A: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_back.png'), aspectRatio: 346 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_bottom.png'), aspectRatio: 226 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_top.png'), aspectRatio: 396 / 400 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_belt.png'), aspectRatio: 400 / 123 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_headwear.png'), aspectRatio: 400 / 331 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_face.png'), aspectRatio: 400 / 359 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_gloves.png'), aspectRatio: 270 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_offhand.png'), aspectRatio: 400 / 390 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_back_b.png'), aspectRatio: 379 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_bottom_b.png'), aspectRatio: 262 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_top_b.png'), aspectRatio: 400 / 365 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_belt_b.png'), aspectRatio: 400 / 323 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_headwear_b.png'), aspectRatio: 400 / 393 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_face_b.png'), aspectRatio: 400 / 160 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_gloves_b.png'), aspectRatio: 316 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_offhand_b.png'), aspectRatio: 400 / 241 },
    },
  },
  4: {
    A: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_back.png'), aspectRatio: 358 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_bottom.png'), aspectRatio: 255 / 359 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_top.png'), aspectRatio: 337 / 400 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_belt.png'), aspectRatio: 400 / 339 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_headwear.png'), aspectRatio: 400 / 353 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_face.png'), aspectRatio: 354 / 338 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_gloves.png'), aspectRatio: 400 / 318 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_offhand.png'), aspectRatio: 379 / 299 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_back_b.png'), aspectRatio: 400 / 312 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_bottom_b.png'), aspectRatio: 376 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_top_b.png'), aspectRatio: 400 / 379 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_belt_b.png'), aspectRatio: 400 / 395 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_headwear_b.png'), aspectRatio: 209 / 400 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_face_b.png'), aspectRatio: 400 / 170 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_gloves_b.png'), aspectRatio: 400 / 299 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_offhand_b.png'), aspectRatio: 257 / 321 },
    },
  },
  5: {
    A: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_back.png'), aspectRatio: 293 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_bottom.png'), aspectRatio: 242 / 395 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_top.png'), aspectRatio: 205 / 400 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_belt.png'), aspectRatio: 400 / 393 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_headwear.png'), aspectRatio: 284 / 369 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_face.png'), aspectRatio: 397 / 400 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_gloves.png'), aspectRatio: 400 / 340 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_offhand.png'), aspectRatio: 254 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_back_b.png'), aspectRatio: 251 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_bottom_b.png'), aspectRatio: 355 / 400 },
      top: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_top_b.png'), aspectRatio: 359 / 400 },
      belt: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_belt_b.png'), aspectRatio: 400 / 357 },
      headwear: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_headwear_b.png'), aspectRatio: 400 / 265 },
      face: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_face_b.png'), aspectRatio: 400 / 325 },
      gloves: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_gloves_b.png'), aspectRatio: 347 / 394 },
      offhand: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_offhand_b.png'), aspectRatio: 327 / 400 },
    },
  },
};

const PHYSICAL_SUPPORT_EQUIPMENT_ICONS: Record<JobTier, BranchIconSet> = {
  1: {
    A: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_back.png'), aspectRatio: 329 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_bottom.png'), aspectRatio: 168 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_top.png'), aspectRatio: 355 / 400 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_belt.png'), aspectRatio: 400 / 327 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_headwear.png'), aspectRatio: 400 / 322 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_face.png'), aspectRatio: 400 / 210 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_gloves.png'), aspectRatio: 354 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_offhand.png'), aspectRatio: 348 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_back.png'), aspectRatio: 329 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_bottom.png'), aspectRatio: 168 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_top.png'), aspectRatio: 355 / 400 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_belt.png'), aspectRatio: 400 / 327 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_headwear.png'), aspectRatio: 400 / 322 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_face.png'), aspectRatio: 400 / 210 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_gloves.png'), aspectRatio: 354 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_offhand.png'), aspectRatio: 348 / 400 },
    },
  },
  2: {
    A: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_back.png'), aspectRatio: 313 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_bottom.png'), aspectRatio: 147 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_top.png'), aspectRatio: 172 / 254 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_belt.png'), aspectRatio: 400 / 365 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_headwear.png'), aspectRatio: 340 / 184 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_face.png'), aspectRatio: 400 / 198 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_gloves.png'), aspectRatio: 229 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_offhand.png'), aspectRatio: 400 / 159 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_back_b.png'), aspectRatio: 237 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_bottom_b.png'), aspectRatio: 400 / 168 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_top_b.png'), aspectRatio: 400 / 376 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_belt_b.png'), aspectRatio: 379 / 306 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_headwear_b.png'), aspectRatio: 364 / 400 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_face_b.png'), aspectRatio: 400 / 274 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_gloves_b.png'), aspectRatio: 400 / 343 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_offhand_b.png'), aspectRatio: 400 / 396 },
    },
  },
  3: {
    A: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_back.png'), aspectRatio: 400 / 382 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_bottom.png'), aspectRatio: 243 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_top.png'), aspectRatio: 309 / 400 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_belt.png'), aspectRatio: 181 / 400 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_headwear.png'), aspectRatio: 400 / 321 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_face.png'), aspectRatio: 400 / 213 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_gloves.png'), aspectRatio: 181 / 338 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_offhand.png'), aspectRatio: 354 / 356 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_back_b.png'), aspectRatio: 348 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_bottom_b.png'), aspectRatio: 400 / 374 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_top_b.png'), aspectRatio: 298 / 400 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_belt_b.png'), aspectRatio: 400 / 245 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_headwear_b.png'), aspectRatio: 273 / 400 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_face_b.png'), aspectRatio: 400 / 176 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_gloves_b.png'), aspectRatio: 400 / 284 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_offhand_b.png'), aspectRatio: 400 / 320 },
    },
  },
  4: {
    A: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_back.png'), aspectRatio: 268 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_bottom.png'), aspectRatio: 343 / 292 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_top.png'), aspectRatio: 391 / 400 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_belt.png'), aspectRatio: 400 / 218 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_headwear.png'), aspectRatio: 400 / 253 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_face.png'), aspectRatio: 400 / 162 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_gloves.png'), aspectRatio: 241 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_offhand.png'), aspectRatio: 260 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_back_b.png'), aspectRatio: 331 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_bottom_b.png'), aspectRatio: 357 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_top_b.png'), aspectRatio: 360 / 400 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_belt_b.png'), aspectRatio: 400 / 362 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_headwear_b.png'), aspectRatio: 400 / 181 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_face_b.png'), aspectRatio: 400 / 177 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_gloves_b.png'), aspectRatio: 289 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_offhand_b.png'), aspectRatio: 400 / 135 },
    },
  },
  5: {
    A: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_back.png'), aspectRatio: 292 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_bottom.png'), aspectRatio: 264 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_top.png'), aspectRatio: 376 / 302 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_belt.png'), aspectRatio: 400 / 383 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_headwear.png'), aspectRatio: 400 / 342 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_face.png'), aspectRatio: 361 / 400 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_gloves.png'), aspectRatio: 269 / 400 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_offhand.png'), aspectRatio: 193 / 187 },
    },
    B: {
      back: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_back_b.png'), aspectRatio: 365 / 400 },
      bottom: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_bottom_b.png'), aspectRatio: 326 / 400 },
      top: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_top_b.png'), aspectRatio: 400 / 301 },
      belt: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_belt_b.png'), aspectRatio: 400 / 142 },
      headwear: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_headwear_b.png'), aspectRatio: 400 / 297 },
      face: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_face_b.png'), aspectRatio: 400 / 196 },
      gloves: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_gloves_b.png'), aspectRatio: 400 / 352 },
      offhand: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_offhand_b.png'), aspectRatio: 400 / 309 },
    },
  },
};

const MAGIC_MELEE_EQUIPMENT_ICONS: Record<JobTier, BranchIconSet> = {
  1: {
    A: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_back.png'), aspectRatio: 325 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_bottom.png'), aspectRatio: 231 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_top.png'), aspectRatio: 399 / 400 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_belt.png'), aspectRatio: 400 / 163 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_headwear.png'), aspectRatio: 166 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_face.png'), aspectRatio: 350 / 235 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_gloves.png'), aspectRatio: 400 / 396 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_offhand.png'), aspectRatio: 275 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_back.png'), aspectRatio: 325 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_bottom.png'), aspectRatio: 231 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_top.png'), aspectRatio: 399 / 400 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_belt.png'), aspectRatio: 400 / 163 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_headwear.png'), aspectRatio: 166 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_face.png'), aspectRatio: 350 / 235 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_gloves.png'), aspectRatio: 400 / 396 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_offhand.png'), aspectRatio: 275 / 400 },
    },
  },
  2: {
    A: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_back.png'), aspectRatio: 251 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_bottom.png'), aspectRatio: 239 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_top.png'), aspectRatio: 273 / 324 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_belt.png'), aspectRatio: 400 / 319 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_headwear.png'), aspectRatio: 224 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_face.png'), aspectRatio: 370 / 400 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_gloves.png'), aspectRatio: 293 / 400 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_offhand.png'), aspectRatio: 358 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_back_b.png'), aspectRatio: 400 / 266 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_bottom_b.png'), aspectRatio: 298 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_top_b.png'), aspectRatio: 400 / 320 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_belt_b.png'), aspectRatio: 400 / 192 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_headwear_b.png'), aspectRatio: 274 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_face_b.png'), aspectRatio: 240 / 400 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_gloves_b.png'), aspectRatio: 400 / 198 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_offhand_b.png'), aspectRatio: 365 / 400 },
    },
  },
  3: {
    A: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_back.png'), aspectRatio: 207 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_bottom.png'), aspectRatio: 236 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_top.png'), aspectRatio: 273 / 400 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_belt.png'), aspectRatio: 168 / 324 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_headwear.png'), aspectRatio: 400 / 298 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_face.png'), aspectRatio: 124 / 400 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_gloves.png'), aspectRatio: 277 / 400 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_offhand.png'), aspectRatio: 93 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_back_b.png'), aspectRatio: 383 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_bottom_b.png'), aspectRatio: 400 / 278 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_top_b.png'), aspectRatio: 383 / 400 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_belt_b.png'), aspectRatio: 400 / 186 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_headwear_b.png'), aspectRatio: 400 / 91 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_face_b.png'), aspectRatio: 190 / 400 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_gloves_b.png'), aspectRatio: 373 / 84 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_offhand_b.png'), aspectRatio: 400 / 246 },
    },
  },
  4: {
    A: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_back.png'), aspectRatio: 400 / 335 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_bottom.png'), aspectRatio: 232 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_top.png'), aspectRatio: 358 / 400 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_belt.png'), aspectRatio: 386 / 174 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_headwear.png'), aspectRatio: 321 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_face.png'), aspectRatio: 400 / 168 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_gloves.png'), aspectRatio: 321 / 398 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_offhand.png'), aspectRatio: 338 / 376 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_back_b.png'), aspectRatio: 400 / 316 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_bottom_b.png'), aspectRatio: 400 / 373 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_top_b.png'), aspectRatio: 400 / 333 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_belt_b.png'), aspectRatio: 400 / 210 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_headwear_b.png'), aspectRatio: 400 / 317 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_face_b.png'), aspectRatio: 400 / 164 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_gloves_b.png'), aspectRatio: 400 / 385 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_offhand_b.png'), aspectRatio: 400 / 330 },
    },
  },
  5: {
    A: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_back.png'), aspectRatio: 194 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_bottom.png'), aspectRatio: 209 / 400 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_top.png'), aspectRatio: 165 / 400 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_belt.png'), aspectRatio: 400 / 321 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_headwear.png'), aspectRatio: 388 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_face.png'), aspectRatio: 234 / 400 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_gloves.png'), aspectRatio: 400 / 240 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_offhand.png'), aspectRatio: 381 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_back_b.png'), aspectRatio: 380 / 400 },
      bottom: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_bottom_b.png'), aspectRatio: 400 / 323 },
      top: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_top_b.png'), aspectRatio: 400 / 361 },
      belt: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_belt_b.png'), aspectRatio: 400 / 277 },
      headwear: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_headwear_b.png'), aspectRatio: 291 / 400 },
      face: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_face_b.png'), aspectRatio: 400 / 300 },
      gloves: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_gloves_b.png'), aspectRatio: 400 / 369 },
      offhand: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_offhand_b.png'), aspectRatio: 400 / 391 },
    },
  },
};

const MAGIC_RANGED_EQUIPMENT_ICONS: Record<JobTier, BranchIconSet> = {
  1: {
    A: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_back.png'), aspectRatio: 315 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_bottom.png'), aspectRatio: 214 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_top.png'), aspectRatio: 295 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_belt.png'), aspectRatio: 281 / 400 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_headwear.png'), aspectRatio: 352 / 400 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_face.png'), aspectRatio: 400 / 172 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_gloves.png'), aspectRatio: 357 / 400 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_offhand.png'), aspectRatio: 349 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_back.png'), aspectRatio: 315 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_bottom.png'), aspectRatio: 214 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_top.png'), aspectRatio: 295 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_belt.png'), aspectRatio: 281 / 400 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_headwear.png'), aspectRatio: 352 / 400 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_face.png'), aspectRatio: 400 / 172 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_gloves.png'), aspectRatio: 357 / 400 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_offhand.png'), aspectRatio: 349 / 400 },
    },
  },
  2: {
    A: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_back.png'), aspectRatio: 338 / 379 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_bottom.png'), aspectRatio: 181 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_top.png'), aspectRatio: 337 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_belt.png'), aspectRatio: 128 / 400 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_headwear.png'), aspectRatio: 262 / 400 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_face.png'), aspectRatio: 400 / 175 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_gloves.png'), aspectRatio: 348 / 400 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_offhand.png'), aspectRatio: 227 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_back_b.png'), aspectRatio: 400 / 337 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_bottom_b.png'), aspectRatio: 400 / 381 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_top_b.png'), aspectRatio: 400 / 320 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_belt_b.png'), aspectRatio: 400 / 277 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_headwear_b.png'), aspectRatio: 400 / 349 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_face_b.png'), aspectRatio: 400 / 158 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_gloves_b.png'), aspectRatio: 400 / 260 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_offhand_b.png'), aspectRatio: 400 / 318 },
    },
  },
  3: {
    A: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_back.png'), aspectRatio: 329 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_bottom.png'), aspectRatio: 173 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_top.png'), aspectRatio: 219 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_belt.png'), aspectRatio: 400 / 352 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_headwear.png'), aspectRatio: 400 / 188 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_face.png'), aspectRatio: 400 / 196 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_gloves.png'), aspectRatio: 311 / 400 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_offhand.png'), aspectRatio: 333 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_back_b.png'), aspectRatio: 386 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_bottom_b.png'), aspectRatio: 400 / 189 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_top_b.png'), aspectRatio: 376 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_belt_b.png'), aspectRatio: 295 / 400 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_headwear_b.png'), aspectRatio: 400 / 279 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_face_b.png'), aspectRatio: 400 / 147 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_gloves_b.png'), aspectRatio: 400 / 311 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_offhand_b.png'), aspectRatio: 400 / 371 },
    },
  },
  4: {
    A: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_back.png'), aspectRatio: 260 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_bottom.png'), aspectRatio: 203 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_top.png'), aspectRatio: 301 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_belt.png'), aspectRatio: 400 / 152 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_headwear.png'), aspectRatio: 400 / 269 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_face.png'), aspectRatio: 299 / 382 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_gloves.png'), aspectRatio: 268 / 400 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_offhand.png'), aspectRatio: 391 / 318 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_back_b.png'), aspectRatio: 400 / 208 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_bottom_b.png'), aspectRatio: 358 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_top_b.png'), aspectRatio: 400 / 323 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_belt_b.png'), aspectRatio: 400 / 283 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_headwear_b.png'), aspectRatio: 327 / 400 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_face_b.png'), aspectRatio: 400 / 336 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_gloves_b.png'), aspectRatio: 400 / 292 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_offhand_b.png'), aspectRatio: 400 / 338 },
    },
  },
  5: {
    A: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_back.png'), aspectRatio: 325 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_bottom.png'), aspectRatio: 214 / 400 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_top.png'), aspectRatio: 350 / 400 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_belt.png'), aspectRatio: 400 / 138 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_headwear.png'), aspectRatio: 375 / 287 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_face.png'), aspectRatio: 400 / 161 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_gloves.png'), aspectRatio: 400 / 381 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_offhand.png'), aspectRatio: 331 / 384 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_back_b.png'), aspectRatio: 275 / 400 },
      bottom: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_bottom_b.png'), aspectRatio: 400 / 350 },
      top: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_top_b.png'), aspectRatio: 400 / 202 },
      belt: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_belt_b.png'), aspectRatio: 400 / 358 },
      headwear: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_headwear_b.png'), aspectRatio: 400 / 397 },
      face: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_face_b.png'), aspectRatio: 400 / 160 },
      gloves: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_gloves_b.png'), aspectRatio: 400 / 357 },
      offhand: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_offhand_b.png'), aspectRatio: 251 / 264 },
    },
  },
};

const MAGIC_SUPPORT_EQUIPMENT_ICONS: Record<JobTier, BranchIconSet> = {
  1: {
    A: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_back.png'), aspectRatio: 359 / 400 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_bottom.png'), aspectRatio: 259 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_top.png'), aspectRatio: 283 / 400 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_belt.png'), aspectRatio: 400 / 264 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_headwear.png'), aspectRatio: 295 / 279 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_face.png'), aspectRatio: 400 / 259 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_gloves.png'), aspectRatio: 325 / 363 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_offhand.png'), aspectRatio: 385 / 400 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_back.png'), aspectRatio: 359 / 400 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_bottom.png'), aspectRatio: 259 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_top.png'), aspectRatio: 283 / 400 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_belt.png'), aspectRatio: 400 / 264 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_headwear.png'), aspectRatio: 295 / 279 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_face.png'), aspectRatio: 400 / 259 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_gloves.png'), aspectRatio: 325 / 363 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_offhand.png'), aspectRatio: 385 / 400 },
    },
  },
  2: {
    A: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_back.png'), aspectRatio: 308 / 400 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_bottom.png'), aspectRatio: 208 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_top.png'), aspectRatio: 246 / 400 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_belt.png'), aspectRatio: 187 / 388 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_headwear.png'), aspectRatio: 400 / 326 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_face.png'), aspectRatio: 400 / 230 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_gloves.png'), aspectRatio: 260 / 400 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_offhand.png'), aspectRatio: 400 / 292 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_back_b.png'), aspectRatio: 400 / 338 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_bottom_b.png'), aspectRatio: 250 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_top_b.png'), aspectRatio: 379 / 400 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_belt_b.png'), aspectRatio: 394 / 400 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_headwear_b.png'), aspectRatio: 400 / 286 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_face_b.png'), aspectRatio: 400 / 147 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_gloves_b.png'), aspectRatio: 400 / 278 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_offhand_b.png'), aspectRatio: 400 / 187 },
    },
  },
  3: {
    A: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_back.png'), aspectRatio: 395 / 400 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_bottom.png'), aspectRatio: 201 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_top.png'), aspectRatio: 400 / 392 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_belt.png'), aspectRatio: 239 / 400 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_headwear.png'), aspectRatio: 400 / 241 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_face.png'), aspectRatio: 400 / 186 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_gloves.png'), aspectRatio: 400 / 307 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_offhand.png'), aspectRatio: 318 / 286 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_back_b.png'), aspectRatio: 400 / 366 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_bottom_b.png'), aspectRatio: 372 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_top_b.png'), aspectRatio: 400 / 370 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_belt_b.png'), aspectRatio: 352 / 400 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_headwear_b.png'), aspectRatio: 384 / 400 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_face_b.png'), aspectRatio: 400 / 235 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_gloves_b.png'), aspectRatio: 400 / 398 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_offhand_b.png'), aspectRatio: 400 / 374 },
    },
  },
  4: {
    A: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_back.png'), aspectRatio: 380 / 235 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_bottom.png'), aspectRatio: 158 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_top.png'), aspectRatio: 308 / 347 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_belt.png'), aspectRatio: 400 / 180 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_headwear.png'), aspectRatio: 343 / 270 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_face.png'), aspectRatio: 400 / 189 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_gloves.png'), aspectRatio: 296 / 395 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_offhand.png'), aspectRatio: 400 / 359 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_back_b.png'), aspectRatio: 400 / 223 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_bottom_b.png'), aspectRatio: 400 / 374 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_top_b.png'), aspectRatio: 400 / 324 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_belt_b.png'), aspectRatio: 400 / 121 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_headwear_b.png'), aspectRatio: 367 / 400 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_face_b.png'), aspectRatio: 400 / 147 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_gloves_b.png'), aspectRatio: 400 / 372 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_offhand_b.png'), aspectRatio: 400 / 258 },
    },
  },
  5: {
    A: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_back.png'), aspectRatio: 400 / 362 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_bottom.png'), aspectRatio: 171 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_top.png'), aspectRatio: 261 / 400 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_belt.png'), aspectRatio: 400 / 139 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_headwear.png'), aspectRatio: 400 / 309 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_face.png'), aspectRatio: 268 / 400 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_gloves.png'), aspectRatio: 322 / 366 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_offhand.png'), aspectRatio: 271 / 264 },
    },
    B: {
      back: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_back_b.png'), aspectRatio: 400 / 325 },
      bottom: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_bottom_b.png'), aspectRatio: 400 / 400 },
      top: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_top_b.png'), aspectRatio: 400 / 376 },
      belt: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_belt_b.png'), aspectRatio: 400 / 196 },
      headwear: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_headwear_b.png'), aspectRatio: 400 / 306 },
      face: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_face_b.png'), aspectRatio: 400 / 277 },
      gloves: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_gloves_b.png'), aspectRatio: 388 / 400 },
      offhand: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_offhand_b.png'), aspectRatio: 400 / 172 },
    },
  },
};

const EQUIPMENT_ICONS: Partial<Record<Archetype, Record<JobTier, BranchIconSet>>> = {
  physicalMelee: PHYSICAL_MELEE_EQUIPMENT_ICONS,
  physicalRanged: PHYSICAL_RANGED_EQUIPMENT_ICONS,
  physicalSupport: PHYSICAL_SUPPORT_EQUIPMENT_ICONS,
  magicMelee: MAGIC_MELEE_EQUIPMENT_ICONS,
  magicRanged: MAGIC_RANGED_EQUIPMENT_ICONS,
  magicSupport: MAGIC_SUPPORT_EQUIPMENT_ICONS,
};

// 學生/舊起始款(item.archetype === undefined,見 game/equipment.ts 的 LEGACY_EQUIPMENT_ITEMS
// /STUDENT_TIER2_EQUIPMENT_ITEMS):不分職業、不分分支,只有一套共用圖,呼應「還沒選職業」
// 的身分——主手武器另有 legacy_sword.png(見 weaponIcons.ts),這裡只管其餘8槽。
const STUDENT_EQUIPMENT_ICONS: SlotIconSet = {
  back: { source: require('../assets/sprites/items/student_back.png'), aspectRatio: 314 / 400 },
  bottom: { source: require('../assets/sprites/items/student_bottom.png'), aspectRatio: 310 / 400 },
  top: { source: require('../assets/sprites/items/student_top.png'), aspectRatio: 373 / 400 },
  belt: { source: require('../assets/sprites/items/student_belt.png'), aspectRatio: 400 / 203 },
  headwear: { source: require('../assets/sprites/items/student_headwear.png'), aspectRatio: 324 / 251 },
  face: { source: require('../assets/sprites/items/student_face.png'), aspectRatio: 400 / 158 },
  gloves: { source: require('../assets/sprites/items/student_gloves.png'), aspectRatio: 299 / 308 },
  offhand: { source: require('../assets/sprites/items/student_offhand.png'), aspectRatio: 341 / 389 },
};

// 查某個裝備項目有沒有 AI 圖示可用——主手武器一律回傳 undefined(見 weaponIcons.ts 另外
// 一條查詢路徑),其餘8槽:archetype undefined(學生/舊起始款)查 STUDENT_EQUIPMENT_ICONS,
// 有 archetype 就用 requiredLevel 換算出目前階級(見 game/combat.ts 的 getCurrentTier)+
// branch(tier1或未設定一律當A)查對應職業/階級/分支那張圖——只依 tier 決定用哪張圖,
// 不管同一階裡是哪個 bracket(等級檔)的道具,跟 weaponIcons.ts 只依 tier 不依 bracket 同一套邏輯。
export function getEquipmentIconForItem(item: EquipmentItem): EquipmentIconData | undefined {
  if (item.slot === 'mainhand') return undefined;
  const slot = item.slot;
  if (!item.archetype) return STUDENT_EQUIPMENT_ICONS[slot];
  const tier = getCurrentTier(item.requiredLevel ?? 1);
  const branch: JobBranch = item.branch ?? 'A';
  return EQUIPMENT_ICONS[item.archetype]?.[tier]?.[branch]?.[slot];
}
