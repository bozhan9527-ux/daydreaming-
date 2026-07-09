import { Archetype, getCurrentTier, getJobTitle } from './combat';

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
  // undefined = 不限職業(起始/性別預設款);有值 = 職業鎖裝,只有該職業能裝備。
  archetype?: Archetype;
  // undefined = 無等級限制;有值 = 要練到這個等級才能購買/裝備。
  requiredLevel?: number;
}

// 每插槽固定一種加成類型(此插槽兩款只差數值),數值 = 百分比加成(0.02 = +2%):
// 免費款(-01)給小加成,付費款(-02)給大加成,呼應現有定價邏輯。
// back/bottom/face/mainhand = speed(縮短戰鬥時間);top/headwear/gloves = exp;belt/offhand = coins。
// 這 18 款不限職業、不限等級,主要作為起始裝備跟性別預設外觀(見 GENDER_DEFAULT_LOADOUT),
// 在下方生成式的職業鎖裝目錄開放之前(Lv10 起)先讓角色有基礎樣貌跟些微加成。
const LEGACY_EQUIPMENT_ITEMS: EquipmentItem[] = [
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

// ---- 職業鎖裝生成式目錄 ----
// 9 個槽位(主手拆成單手/雙手兩條線)各自 50 個等級檔(Lv10~500,每 10 等一檔) × 6 職業,
// 單一槽位剛好 300 款,主手單手 300 款 + 雙手 300 款。用生成而非手打,避免 3000 筆物件字面量。
const ARCHETYPES: Archetype[] = [
  'physicalMelee',
  'physicalRanged',
  'physicalSupport',
  'magicMelee',
  'magicRanged',
  'magicSupport',
];

const BRACKET_COUNT = 50;
const LEVELS_PER_BRACKET = 10;

function bracketRequiredLevel(bracket: number): number {
  return bracket * LEVELS_PER_BRACKET;
}

// 前快後慢(對數收斂):bracket=1(Lv10)貼近舊制免費款的 2%,bracket=50(Lv500)收斂到上限 30%。
const MIN_BONUS = 0.02;
const MAX_BONUS = 0.3;

// log(bracket)/log(50) 讓 bracket=1 精準落在 0(=MIN_BONUS)、bracket=50 精準落在 1(=MAX_BONUS),
// 不會像 log(1+bracket) 那樣在 bracket=1 就已經吃掉一大截成長量。
function bracketBonusValue(bracket: number): number {
  const t = Math.log(bracket) / Math.log(BRACKET_COUNT);
  const raw = MIN_BONUS + t * (MAX_BONUS - MIN_BONUS);
  return Math.round(raw * 1000) / 1000;
}

// 雙手武器犧牲副手格,單件加成用倍率補償,呼應「雙手武器賭大加成」的取捨。
const TWO_HANDED_BONUS_MULTIPLIER = 1.8;
const TWO_HANDED_PRICE_MULTIPLIER = 1.6;

const PRICE_BASE = 20;
const PRICE_EXPONENT = 1.6;

function bracketPrice(bracket: number): number {
  return Math.round(PRICE_BASE * Math.pow(bracket, PRICE_EXPONENT));
}

const SLOT_STAT: Record<EquipmentSlot, EquipmentBonusStat> = {
  back: 'speed',
  bottom: 'speed',
  face: 'speed',
  mainhand: 'speed',
  top: 'exp',
  headwear: 'exp',
  gloves: 'exp',
  belt: 'coins',
  offhand: 'coins',
};

const SLOT_BASE_NOUN: Partial<Record<EquipmentSlot, string>> = {
  back: '披風',
  bottom: '護腿',
  top: '戰袍',
  belt: '腰帶',
  headwear: '頭飾',
  face: '面罩',
  gloves: '護手',
  offhand: '副手飾品',
};

// 主手武器名稱呼應各職業既有的稱號世界觀(見 game/combat.ts 的 JOB_TITLES)。
const WEAPON_NOUNS: Record<Archetype, { oneHanded: string; twoHanded: string }> = {
  physicalMelee: { oneHanded: '工作手套', twoHanded: '鐵鎚' },
  physicalRanged: { oneHanded: '飛鏢', twoHanded: '長弓' },
  physicalSupport: { oneHanded: '急救箱', twoHanded: '擔架' },
  magicMelee: { oneHanded: '符咒短刀', twoHanded: '降魔大劍' },
  magicRanged: { oneHanded: '法術鍵盤', twoHanded: '法杖' },
  magicSupport: { oneHanded: '藥瓶', twoHanded: '藥箱權杖' },
};

const ARCHETYPE_BASE_COLOR: Record<Archetype, string> = {
  physicalMelee: '#8b8698',
  physicalRanged: '#7a9e7e',
  physicalSupport: '#c9a94f',
  magicMelee: '#b389e0',
  magicRanged: '#6ab0e0',
  magicSupport: '#e0a0c0',
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

// 等級檔越高,顏色越往亮部靠(視覺上暗示「越後期越華麗」),幅度封頂在 35%。
function shiftColorForBracket(baseHex: string, bracket: number): string {
  const [r, g, b] = hexToRgb(baseHex);
  const t = (bracket - 1) / (BRACKET_COUNT - 1);
  const brighten = t * 0.35;
  return rgbToHex(r + (255 - r) * brighten, g + (255 - g) * brighten, b + (255 - b) * brighten);
}

function jobTitleAtLevel(archetype: Archetype, level: number): string {
  return getJobTitle(archetype, 'A', getCurrentTier(level));
}

function generateRegularSlotItems(slot: EquipmentSlot): EquipmentItem[] {
  const baseNoun = SLOT_BASE_NOUN[slot];
  if (!baseNoun) return [];
  const stat = SLOT_STAT[slot];
  const items: EquipmentItem[] = [];
  for (const archetype of ARCHETYPES) {
    const baseColor = ARCHETYPE_BASE_COLOR[archetype];
    for (let bracket = 1; bracket <= BRACKET_COUNT; bracket++) {
      const requiredLevel = bracketRequiredLevel(bracket);
      const title = jobTitleAtLevel(archetype, requiredLevel);
      items.push({
        id: `${slot}-${archetype}-${bracket}`,
        slot,
        name: `${title}${baseNoun}·Lv${requiredLevel}`,
        color: shiftColorForBracket(baseColor, bracket),
        price: bracketPrice(bracket),
        bonus: { stat, value: bracketBonusValue(bracket) },
        archetype,
        requiredLevel,
      });
    }
  }
  return items;
}

function generateMainhandItems(): EquipmentItem[] {
  const stat = SLOT_STAT.mainhand;
  const items: EquipmentItem[] = [];
  for (const archetype of ARCHETYPES) {
    const baseColor = ARCHETYPE_BASE_COLOR[archetype];
    const nouns = WEAPON_NOUNS[archetype];
    for (let bracket = 1; bracket <= BRACKET_COUNT; bracket++) {
      const requiredLevel = bracketRequiredLevel(bracket);
      const title = jobTitleAtLevel(archetype, requiredLevel);
      const color = shiftColorForBracket(baseColor, bracket);
      const oneHandedBonus = bracketBonusValue(bracket);
      const price = bracketPrice(bracket);

      items.push({
        id: `mainhand-1h-${archetype}-${bracket}`,
        slot: 'mainhand',
        name: `${title}${nouns.oneHanded}·Lv${requiredLevel}`,
        color,
        price,
        bonus: { stat, value: oneHandedBonus },
        archetype,
        requiredLevel,
      });

      items.push({
        id: `mainhand-2h-${archetype}-${bracket}`,
        slot: 'mainhand',
        name: `${title}${nouns.twoHanded}·Lv${requiredLevel}(雙手)`,
        color,
        price: Math.round(price * TWO_HANDED_PRICE_MULTIPLIER),
        bonus: { stat, value: Math.round(oneHandedBonus * TWO_HANDED_BONUS_MULTIPLIER * 1000) / 1000 },
        archetype,
        requiredLevel,
        twoHanded: true,
      });
    }
  }
  return items;
}

const GENERATED_REGULAR_SLOTS: EquipmentSlot[] = [
  'back',
  'bottom',
  'top',
  'belt',
  'headwear',
  'face',
  'gloves',
  'offhand',
];

const GENERATED_EQUIPMENT_ITEMS: EquipmentItem[] = [
  ...GENERATED_REGULAR_SLOTS.flatMap((slot) => generateRegularSlotItems(slot)),
  ...generateMainhandItems(),
];

export const EQUIPMENT_ITEMS: EquipmentItem[] = [...LEGACY_EQUIPMENT_ITEMS, ...GENERATED_EQUIPMENT_ITEMS];

export type EquipmentLoadout = Partial<Record<EquipmentSlot, string>>;

export function createEmptyLoadout(): EquipmentLoadout {
  return {};
}

// 目錄有 3000+ 筆,查找一律走 Map,避免每次都線性掃描整個陣列。
const EQUIPMENT_ITEMS_BY_ID = new Map(EQUIPMENT_ITEMS.map((item) => [item.id, item]));
const EQUIPMENT_ITEMS_BY_SLOT = new Map<EquipmentSlot, EquipmentItem[]>();
for (const item of EQUIPMENT_ITEMS) {
  const list = EQUIPMENT_ITEMS_BY_SLOT.get(item.slot);
  if (list) list.push(item);
  else EQUIPMENT_ITEMS_BY_SLOT.set(item.slot, [item]);
}

export function getItemById(id: string): EquipmentItem | undefined {
  return EQUIPMENT_ITEMS_BY_ID.get(id);
}

export function getItemsForSlot(slot: EquipmentSlot): EquipmentItem[] {
  return EQUIPMENT_ITEMS_BY_SLOT.get(slot) ?? [];
}

export function isArchetypeCompatible(item: EquipmentItem, archetype: Archetype): boolean {
  return item.archetype === undefined || item.archetype === archetype;
}

export function isLevelSufficient(item: EquipmentItem, level: number): boolean {
  return item.requiredLevel === undefined || level >= item.requiredLevel;
}

export function canEquipItem(item: EquipmentItem, archetype: Archetype, level: number): boolean {
  return isArchetypeCompatible(item, archetype) && isLevelSufficient(item, level);
}

// 只回傳目前職業能穿的款式(不限職業的舊起始款 + 對應職業的鎖裝款),給 UI 篩選用。
export function getEquippableItemsForSlot(slot: EquipmentSlot, archetype: Archetype): EquipmentItem[] {
  return getItemsForSlot(slot).filter((item) => isArchetypeCompatible(item, archetype));
}

// 切職業後,原本裝備的職業鎖裝若跟新職業不符就直接卸下,不限職業的款式不受影響。
export function filterLoadoutForArchetype(loadout: EquipmentLoadout, archetype: Archetype): EquipmentLoadout {
  const next: EquipmentLoadout = {};
  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (item && isArchetypeCompatible(item, archetype)) next[slot] = itemId;
  }
  return next;
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
  // 比其他槽位大,給武器外型(game/sprites/weapons.ts)足夠的像素空間畫出可辨識的形狀。
  mainhand: [{ x: 14, y: 8, w: 6, h: 10 }],
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
  slot: EquipmentSlot;
  item: EquipmentItem;
}

export function getEquippedOverlays(loadout: EquipmentLoadout): EquipmentOverlay[] {
  const overlays: EquipmentOverlay[] = [];
  for (const slot of SLOT_Z_ORDER) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;
    for (const rect of SLOT_ANCHORS[slot]) {
      overlays.push({ rect, color: item.color, slot, item });
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
