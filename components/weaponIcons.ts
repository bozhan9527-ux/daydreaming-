import { ImageSourcePropType } from 'react-native';

import { Archetype, getCurrentTier, JobTier } from '../game/combat';
import { EquipmentItem } from '../game/equipment';

// AI 畫的武器圖示,跟角色美術(HeroWalkSprite)共用同一份資料——武器清單畫面(裝備/背包)
// 也用這份,主手武器有 AI 圖示就顯示 AI 圖,沒有的槽位/職業繼續用 game/sprites/equipmentIcons.ts
// 的程式產生圖示(呼叫端自行 fallback,這裡只負責「有沒有 AI 圖」的查詢)。
export interface WeaponIconData {
  source: ImageSourcePropType;
  aspectRatio: number;
}

// 5 階各一組單手/雙手,對應 game/equipment.ts 的 WEAPON_NOUNS_BY_TIER physicalMelee 那份
// 命名(工作手套/鐵鎚 → 突擊步槍),裁自同一張 2x5 網格生成圖,部分工具原始生成方向朝左,
// 已鏡像成統一朝右(跟角色慣用的攻擊方向一致)。
const PHYSICAL_MELEE_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_1h.png'), aspectRatio: 293 / 262 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_2h.png'), aspectRatio: 282 / 281 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_1h.png'), aspectRatio: 285 / 232 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_2h.png'), aspectRatio: 307 / 297 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_1h.png'), aspectRatio: 394 / 254 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_2h.png'), aspectRatio: 408 / 292 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_1h.png'), aspectRatio: 280 / 307 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_2h.png'), aspectRatio: 355 / 307 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_1h.png'), aspectRatio: 375 / 228 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_2h.png'), aspectRatio: 387 / 218 },
  },
};

const PHYSICAL_RANGED_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_1h.png'), aspectRatio: 244 / 247 },
    twoHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t1_2h.png'), aspectRatio: 241 / 266 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_1h.png'), aspectRatio: 314 / 275 },
    twoHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t2_2h.png'), aspectRatio: 343 / 236 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_1h.png'), aspectRatio: 249 / 289 },
    twoHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t3_2h.png'), aspectRatio: 351 / 299 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_1h.png'), aspectRatio: 249 / 242 },
    twoHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t4_2h.png'), aspectRatio: 390 / 300 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_1h.png'), aspectRatio: 298 / 253 },
    twoHanded: { source: require('../assets/sprites/items/physicalRanged/physicalRanged_t5_2h.png'), aspectRatio: 414 / 257 },
  },
};

const PHYSICAL_SUPPORT_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_1h.png'), aspectRatio: 276 / 255 },
    twoHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t1_2h.png'), aspectRatio: 253 / 292 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_1h.png'), aspectRatio: 214 / 211 },
    twoHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t2_2h.png'), aspectRatio: 321 / 176 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_1h.png'), aspectRatio: 242 / 265 },
    twoHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t3_2h.png'), aspectRatio: 152 / 293 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_1h.png'), aspectRatio: 260 / 198 },
    twoHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t4_2h.png'), aspectRatio: 424 / 191 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_1h.png'), aspectRatio: 272 / 210 },
    twoHanded: { source: require('../assets/sprites/items/physicalSupport/physicalSupport_t5_2h.png'), aspectRatio: 288 / 258 },
  },
};

const MAGIC_MELEE_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_1h.png'), aspectRatio: 276 / 265 },
    twoHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t1_2h.png'), aspectRatio: 312 / 277 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_1h.png'), aspectRatio: 304 / 297 },
    twoHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t2_2h.png'), aspectRatio: 353 / 307 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_1h.png'), aspectRatio: 304 / 282 },
    twoHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t3_2h.png'), aspectRatio: 358 / 267 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_1h.png'), aspectRatio: 292 / 300 },
    twoHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t4_2h.png'), aspectRatio: 258 / 307 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_1h.png'), aspectRatio: 286 / 273 },
    twoHanded: { source: require('../assets/sprites/items/magicMelee/magicMelee_t5_2h.png'), aspectRatio: 304 / 273 },
  },
};

const MAGIC_RANGED_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_1h.png'), aspectRatio: 386 / 271 },
    twoHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t1_2h.png'), aspectRatio: 369 / 251 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_1h.png'), aspectRatio: 405 / 280 },
    twoHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t2_2h.png'), aspectRatio: 368 / 262 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_1h.png'), aspectRatio: 348 / 244 },
    twoHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t3_2h.png'), aspectRatio: 196 / 307 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_1h.png'), aspectRatio: 337 / 244 },
    twoHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t4_2h.png'), aspectRatio: 233 / 255 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_1h.png'), aspectRatio: 301 / 216 },
    twoHanded: { source: require('../assets/sprites/items/magicRanged/magicRanged_t5_2h.png'), aspectRatio: 300 / 251 },
  },
};

const MAGIC_SUPPORT_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_1h.png'), aspectRatio: 160 / 244 },
    twoHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t1_2h.png'), aspectRatio: 282 / 283 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_1h.png'), aspectRatio: 260 / 250 },
    twoHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t2_2h.png'), aspectRatio: 156 / 278 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_1h.png'), aspectRatio: 250 / 256 },
    twoHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t3_2h.png'), aspectRatio: 358 / 241 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_1h.png'), aspectRatio: 276 / 234 },
    twoHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t4_2h.png'), aspectRatio: 232 / 257 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_1h.png'), aspectRatio: 302 / 251 },
    twoHanded: { source: require('../assets/sprites/items/magicSupport/magicSupport_t5_2h.png'), aspectRatio: 371 / 287 },
  },
};

const WEAPON_ICONS: Partial<Record<Archetype, Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }>>> = {
  physicalMelee: PHYSICAL_MELEE_WEAPON_ICONS,
  physicalRanged: PHYSICAL_RANGED_WEAPON_ICONS,
  physicalSupport: PHYSICAL_SUPPORT_WEAPON_ICONS,
  magicMelee: MAGIC_MELEE_WEAPON_ICONS,
  magicRanged: MAGIC_RANGED_WEAPON_ICONS,
  magicSupport: MAGIC_SUPPORT_WEAPON_ICONS,
};

// 不限職業的通用起始武器(LEGACY_EQUIPMENT_ITEMS,見 game/equipment.ts),名稱本來就是
// 「短劍/雙手大劍」,套職業武器組(工作手套/鐵鎚)的圖不對——直接照 item id 對到最初測試
// 用的那張劍圖示,比對 archetype+tier+twoHanded 那條路徑優先權更高。
const LEGACY_SWORD_ICON: WeaponIconData = {
  source: require('../assets/sprites/items/legacy_sword.png'),
  aspectRatio: 996 / 1014,
};
const ITEM_ID_WEAPON_ICON_OVERRIDES: Partial<Record<string, WeaponIconData>> = {
  'mainhand-01': LEGACY_SWORD_ICON,
  'mainhand-02': LEGACY_SWORD_ICON,
};

// 查某個裝備項目有沒有 AI 圖示可用——只有主手武器、且是 physicalMelee 職業鎖裝(或上面
// 那兩把通用劍)才有,其餘一律回傳 undefined,呼叫端自行 fallback 回程式產生圖示。
export function getWeaponIconForItem(item: EquipmentItem): WeaponIconData | undefined {
  if (item.slot !== 'mainhand') return undefined;
  const override = ITEM_ID_WEAPON_ICON_OVERRIDES[item.id];
  if (override) return override;
  if (!item.archetype) return undefined;
  return WEAPON_ICONS[item.archetype]?.[getCurrentTier(item.requiredLevel ?? 1)][item.twoHanded ? 'twoHanded' : 'oneHanded'];
}
