export type EquipmentSlot =
  | 'back'
  | 'bottom'
  | 'top'
  | 'belt'
  | 'headwear'
  | 'face'
  | 'gloves'
  | 'offhand'
  | 'mainhand';

export type EquipmentBonusStat = 'exp' | 'coins' | 'speed';

export interface EquipmentBonus {
  stat: EquipmentBonusStat;
  value: number;
}

export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  color: string;
  price: number;
  bonus: EquipmentBonus;
  twoHanded?: boolean;
}

// 每插槽固定一種加成類型(此插槽兩款只差數值),數值 = 百分比加成(0.02 = +2%):
// 免費款(-01)給小加成,付費款(-02)給大加成,呼應現有定價邏輯。
// back/bottom/face/mainhand = speed(縮短戰鬥時間);top/headwear/gloves = exp;belt/offhand = coins。
export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'back-01', slot: 'back', name: '素色披風', color: '#6b6678', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'back-02', slot: 'back', name: '厚重斗篷', color: '#4a4456', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'bottom-01', slot: 'bottom', name: '粗布長褲', color: '#5c5468', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'bottom-02', slot: 'bottom', name: '皮革護腿', color: '#3a3542', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'top-01', slot: 'top', name: '亞麻上衣', color: '#8b8698', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'top-02', slot: 'top', name: '皮甲背心', color: '#7a7488', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'belt-01', slot: 'belt', name: '麻繩腰帶', color: '#c9a94f', price: 0, bonus: { stat: 'coins', value: 0.02 } },
  { id: 'belt-02', slot: 'belt', name: '鉚釘皮帶', color: '#9c8a3f', price: 60, bonus: { stat: 'coins', value: 0.05 } },
  { id: 'headwear-01', slot: 'headwear', name: '布帽', color: '#8b8698', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'headwear-02', slot: 'headwear', name: '鐵盔', color: '#7a7488', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'face-01', slot: 'face', name: '眼罩', color: '#3a3542', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  { id: 'face-02', slot: 'face', name: '護目鏡', color: '#6ab0e0', price: 60, bonus: { stat: 'speed', value: 0.05 } },
  { id: 'gloves-01', slot: 'gloves', name: '布手套', color: '#8b8698', price: 0, bonus: { stat: 'exp', value: 0.02 } },
  { id: 'gloves-02', slot: 'gloves', name: '皮革手套', color: '#6b6678', price: 60, bonus: { stat: 'exp', value: 0.05 } },
  { id: 'offhand-01', slot: 'offhand', name: '木盾', color: '#8b8698', price: 0, bonus: { stat: 'coins', value: 0.02 } },
  { id: 'offhand-02', slot: 'offhand', name: '厚重書冊', color: '#b389e0', price: 60, bonus: { stat: 'coins', value: 0.05 } },
  { id: 'mainhand-01', slot: 'mainhand', name: '短劍', color: '#d9c9b8', price: 0, bonus: { stat: 'speed', value: 0.02 } },
  {
    id: 'mainhand-02',
    slot: 'mainhand',
    name: '雙手大劍',
    color: '#d9c9b8',
    price: 60,
    bonus: { stat: 'speed', value: 0.05 },
    twoHanded: true,
  },
];

export type EquipmentLoadout = Partial<Record<EquipmentSlot, string>>;

export function createEmptyLoadout(): EquipmentLoadout {
  return {};
}

export function getItemById(id: string): EquipmentItem | undefined {
  return EQUIPMENT_ITEMS.find((item) => item.id === id);
}

export function getItemsForSlot(slot: EquipmentSlot): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter((item) => item.slot === slot);
}

// 雙手武器裝備時副手鎖死清空;反過來裝備副手時,若目前主手是雙手武器也一併清空。
export function equipItem(loadout: EquipmentLoadout, itemId: string): EquipmentLoadout {
  const item = getItemById(itemId);
  if (!item) return loadout;

  const next: EquipmentLoadout = { ...loadout, [item.slot]: item.id };

  if (item.slot === 'mainhand' && item.twoHanded) {
    delete next.offhand;
  }

  if (item.slot === 'offhand') {
    const currentMainhand = next.mainhand ? getItemById(next.mainhand) : undefined;
    if (currentMainhand?.twoHanded) delete next.mainhand;
  }

  return next;
}

export function unequipSlot(loadout: EquipmentLoadout, slot: EquipmentSlot): EquipmentLoadout {
  const next = { ...loadout };
  delete next[slot];
  return next;
}

// 解鎖狀態:price 為 0 的起始裝一律視為已解鎖,不需要出現在清單裡。
export type UnlockedItemIds = string[];

export function createEmptyUnlockedItems(): UnlockedItemIds {
  return [];
}

export function isItemUnlocked(unlocked: UnlockedItemIds, itemId: string): boolean {
  const item = getItemById(itemId);
  if (!item) return false;
  return item.price === 0 || unlocked.includes(itemId);
}

export function unlockItem(unlocked: UnlockedItemIds, itemId: string): UnlockedItemIds {
  if (unlocked.includes(itemId)) return unlocked;
  return [...unlocked, itemId];
}

// 性別不做獨立身體變體,改用預設裝備組合(頭飾/下身/上身)區分外觀,對應 CLAUDE.md 規格。
export type Gender = 'male' | 'female';

export const GENDER_DEFAULT_LOADOUT: Record<Gender, Partial<Record<EquipmentSlot, string>>> = {
  male: { headwear: 'headwear-02', top: 'top-02', bottom: 'bottom-02' },
  female: { headwear: 'headwear-01', top: 'top-01', bottom: 'bottom-01' },
};

// 切換性別只覆蓋頭飾/上身/下身三格,武器、副手、腰帶等其餘裝備維持玩家原有選擇。
export function applyGenderDefault(loadout: EquipmentLoadout, gender: Gender): EquipmentLoadout {
  return { ...loadout, ...GENDER_DEFAULT_LOADOUT[gender] };
}

// 換性別是角色設定,不是商店消費;對應性別的頭飾/上身/下身即使原本要收費也強制免費解鎖。
export function getGenderUnlockItems(gender: Gender): string[] {
  return Object.values(GENDER_DEFAULT_LOADOUT[gender]);
}

// 座標系對應 game/sprites/heroSilhouette.ts 的原生 20 欄 x 24 列網格,
// 僅以「normal」體型的輪廓比例校準;thin/fat 選擇時疊圖會有些微不貼合,
// 屬於這個架構驗證階段可接受的簡化,尚未做到依體型即時縮放錨點。
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SLOT_ANCHORS: Record<EquipmentSlot, Rect[]> = {
  back: [{ x: 3, y: 9, w: 14, h: 6 }],
  bottom: [{ x: 6, y: 15, w: 8, h: 5 }],
  top: [{ x: 5, y: 9, w: 10, h: 5 }],
  belt: [{ x: 5, y: 14, w: 10, h: 1 }],
  headwear: [{ x: 5, y: 1, w: 10, h: 3 }],
  face: [{ x: 6, y: 4, w: 8, h: 2 }],
  gloves: [
    { x: 4, y: 11, w: 1, h: 2 },
    { x: 15, y: 11, w: 1, h: 2 },
  ],
  offhand: [{ x: 1, y: 10, w: 3, h: 4 }],
  mainhand: [{ x: 15, y: 8, w: 3, h: 6 }],
};

// 疊圖繪製順序,對應 CLAUDE.md 文件的 z-order:背飾→下身→上身→腰帶→頭飾→面飾→手套→副手→主手武器。
export const SLOT_Z_ORDER: EquipmentSlot[] = [
  'back',
  'bottom',
  'top',
  'belt',
  'headwear',
  'face',
  'gloves',
  'offhand',
  'mainhand',
];

export interface EquipmentOverlay {
  rect: Rect;
  color: string;
}

export function getEquippedOverlays(loadout: EquipmentLoadout): EquipmentOverlay[] {
  const overlays: EquipmentOverlay[] = [];
  for (const slot of SLOT_Z_ORDER) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;
    for (const rect of SLOT_ANCHORS[slot]) {
      overlays.push({ rect, color: item.color });
    }
  }
  return overlays;
}

export interface EquipmentBonusTotals {
  exp: number;
  coins: number;
  speed: number;
}

// 裝備加成總和(百分比),供 game/battle.ts 換算成擊殺獎勵/戰鬥時長的乘數;只算目前已裝備的項目。
export function getEquipmentBonusTotals(loadout: EquipmentLoadout): EquipmentBonusTotals {
  const totals: EquipmentBonusTotals = { exp: 0, coins: 0, speed: 0 };
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;
    totals[item.bonus.stat] += item.bonus.value;
  }
  return totals;
}
