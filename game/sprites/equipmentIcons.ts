import { EquipmentItem, EquipmentSlot } from '../equipment';
import { getWeaponFrame } from './weapons';

// 非武器 8 槽位的通用圖示,12x12 跟 tabIcons/skillIcons 同一套畫布尺寸。武器(mainhand)另外
// 用 game/sprites/weapons.ts 依職業給專屬造型;這裡的 8 個槽位圖示是「這個槽位類型長什麼樣」,
// 同一槽位所有職業/等級檔共用同一個外型,顏色仍吃該裝備自己的 item.color。
const CANVAS = 12;

interface Mark {
  x: number;
  y: number;
  c: string;
}

function buildFrame(marks: Mark[]): string[] {
  const grid: string[][] = Array.from({ length: CANVAS }, () => new Array(CANVAS).fill('.'));
  for (const { x, y, c } of marks) {
    if (x >= 0 && x < CANVAS && y >= 0 && y < CANVAS) grid[y][x] = c;
  }
  return grid.map((row) => row.join(''));
}

function rect(x0: number, y0: number, x1: number, y1: number, c: string): Mark[] {
  const marks: Mark[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) marks.push({ x, y, c });
  }
  return marks;
}

const FILL = 'E';

// 背飾:背包本體 + 兩條肩帶。
const BACK_MARKS: Mark[] = [
  ...rect(3, 3, 8, 9, FILL),
  { x: 4, y: 1, c: FILL },
  { x: 4, y: 2, c: FILL },
  { x: 7, y: 1, c: FILL },
  { x: 7, y: 2, c: FILL },
];

// 下身:腰頭 + 分岔兩條褲管。
const BOTTOM_MARKS: Mark[] = [
  ...rect(3, 2, 8, 4, FILL),
  ...rect(3, 5, 5, 9, FILL),
  ...rect(6, 5, 8, 9, FILL),
];

// 上身:立領 + 軀幹 + 兩側短袖。
const TOP_MARKS: Mark[] = [
  { x: 5, y: 1, c: FILL },
  { x: 6, y: 1, c: FILL },
  ...rect(4, 2, 7, 9, FILL),
  ...rect(2, 3, 3, 5, FILL),
  ...rect(8, 3, 9, 5, FILL),
];

// 腰帶:一條橫帶 + 中間方形扣環。
const BELT_MARKS: Mark[] = [...rect(1, 5, 10, 6, FILL), ...rect(5, 4, 6, 7, FILL)];

// 頭飾:圓頂帽形 + 帽緣。
const HEADWEAR_MARKS: Mark[] = [
  { x: 5, y: 2, c: FILL },
  { x: 6, y: 2, c: FILL },
  ...rect(4, 3, 7, 4, FILL),
  ...rect(3, 5, 8, 6, FILL),
  ...rect(2, 7, 9, 7, FILL),
];

// 面飾:兩片鏡片 + 中間鼻樑橋。
const FACE_MARKS: Mark[] = [...rect(2, 5, 4, 7, FILL), ...rect(7, 5, 9, 7, FILL), { x: 5, y: 6, c: FILL }, { x: 6, y: 6, c: FILL }];

// 手套:掌心方塊 + 拇指凸起。
const GLOVES_MARKS: Mark[] = [...rect(4, 4, 8, 9, FILL), ...rect(2, 6, 3, 7, FILL)];

// 副手飾品:小掛包本體 + 上蓋 + 背帶。
const OFFHAND_MARKS: Mark[] = [
  ...rect(3, 5, 8, 9, FILL),
  ...rect(3, 3, 8, 4, FILL),
  { x: 5, y: 1, c: FILL },
  { x: 6, y: 1, c: FILL },
  { x: 5, y: 2, c: FILL },
  { x: 6, y: 2, c: FILL },
];

const SLOT_ICON_MARKS: Partial<Record<EquipmentSlot, Mark[]>> = {
  back: BACK_MARKS,
  bottom: BOTTOM_MARKS,
  top: TOP_MARKS,
  belt: BELT_MARKS,
  headwear: HEADWEAR_MARKS,
  face: FACE_MARKS,
  gloves: GLOVES_MARKS,
  offhand: OFFHAND_MARKS,
};

export interface EquipmentIconData {
  frame: string[];
  fillKey: string;
}

export function getEquipmentSlotIcon(slot: EquipmentSlot): EquipmentIconData {
  const marks = SLOT_ICON_MARKS[slot] ?? [];
  return { frame: buildFrame(marks), fillKey: FILL };
}

// 給裝備清單用的統一入口:主手武器吃 game/sprites/weapons.ts 的職業造型,其餘槽位吃這裡的通用圖示。
export function getItemIcon(item: EquipmentItem): EquipmentIconData {
  if (item.slot === 'mainhand') {
    const weapon = getWeaponFrame(item.archetype, item.twoHanded);
    return { frame: weapon.frame, fillKey: weapon.fillKey };
  }
  return getEquipmentSlotIcon(item.slot);
}
