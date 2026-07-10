// 怪物像素美術,跟 heroSilhouette.ts 同一套「半寬參數 + 中心對稱」產生手法,
// 差別是每種怪物的半寬序列(rows)手工設計,做出不同輪廓,而不是共用同一套身體。
// 配合勇者本體密度提升,getMonsterFrame 輸出時整張放大3倍,形狀本身不重新設計。
import { upscaleFrame } from './spriteScale';

const SCALE = 3;

export interface MonsterRowSpec {
  halfWidth: number;
  fill: string;
  eyes?: boolean;
}

interface MonsterVisualSpec {
  width: number;
  centerLeft: number;
  centerRight: number;
  outline: string;
  rows: (MonsterRowSpec | null)[];
  palette: Record<string, string>;
}

function buildRow(width: number, centerLeft: number, centerRight: number, spec: MonsterRowSpec | null, outline: string): string {
  if (spec === null) return '.'.repeat(width);
  // 每個 cell 只能塞一個字元,palette key 一定要是單一字元,不然拼出來的 row 長度會跑掉。
  if (spec.fill.length !== 1) throw new Error(`fill must be a single character, got "${spec.fill}"`);
  if (outline.length !== 1) throw new Error(`outline must be a single character, got "${outline}"`);
  const cells = new Array(width).fill('.');
  const fillLeft = centerLeft - spec.halfWidth + 1;
  const fillRight = centerRight + spec.halfWidth - 1;
  for (let c = fillLeft; c <= fillRight; c++) cells[c] = spec.fill;
  if (fillLeft - 1 >= 0) cells[fillLeft - 1] = outline;
  if (fillRight + 1 < width) cells[fillRight + 1] = outline;
  if (spec.eyes && spec.halfWidth >= 2) {
    cells[fillLeft + 1] = outline;
    cells[fillRight - 1] = outline;
  }
  return cells.join('');
}

function buildMonsterFrame(spec: MonsterVisualSpec): { frame: string[]; palette: Record<string, string> } {
  const frame = spec.rows.map((row) => buildRow(spec.width, spec.centerLeft, spec.centerRight, row, spec.outline));
  return { frame, palette: spec.palette };
}

const K = 'K'; // 預設外框色,深灰,跟勇者身上的 K 同色階

const MONSTER_VISUALS: Record<string, MonsterVisualSpec> = {
  slime: {
    width: 12,
    centerLeft: 5,
    centerRight: 6,
    outline: K,
    palette: { K: '#3a3542', G: '#8a9a86', D: '#5f6f56' },
    rows: [
      null,
      { halfWidth: 1, fill: 'G' },
      { halfWidth: 3, fill: 'G' },
      { halfWidth: 4, fill: 'G' },
      { halfWidth: 5, fill: 'G', eyes: true },
      { halfWidth: 5, fill: 'G' },
      { halfWidth: 5, fill: 'G' },
      { halfWidth: 5, fill: 'G' },
      { halfWidth: 4, fill: 'G' },
      { halfWidth: 3, fill: 'G' },
      { halfWidth: 2, fill: 'G' },
      { halfWidth: 1, fill: 'D' },
      null,
    ],
  },
  bat: {
    width: 12,
    centerLeft: 5,
    centerRight: 6,
    outline: K,
    palette: { K: '#3a3542', B: '#6b6678', W: '#4a4456' },
    rows: [
      null,
      { halfWidth: 1, fill: 'B' },
      { halfWidth: 2, fill: 'B', eyes: true },
      { halfWidth: 4, fill: 'W' },
      { halfWidth: 6, fill: 'W' },
      { halfWidth: 5, fill: 'W' },
      { halfWidth: 3, fill: 'B' },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 1, fill: 'B' },
      null,
      null,
      null,
    ],
  },
  goblin: {
    width: 14,
    centerLeft: 6,
    centerRight: 7,
    outline: K,
    palette: { K: '#3a3542', S: '#7a8a6a', A: '#6b5a3a' },
    rows: [
      null,
      { halfWidth: 1, fill: 'S' },
      { halfWidth: 2, fill: 'S', eyes: true },
      { halfWidth: 1, fill: 'S' },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 3, fill: 'S' },
      { halfWidth: 2, fill: 'S' },
      { halfWidth: 3, fill: 'A' },
      { halfWidth: 2, fill: 'A' },
      null,
      null,
      null,
    ],
  },
  mushroom: {
    width: 14,
    centerLeft: 6,
    centerRight: 7,
    outline: K,
    palette: { K: '#3a3542', C: '#a05a52', T: '#c9c4b0' },
    rows: [
      null,
      { halfWidth: 3, fill: 'C' },
      { halfWidth: 6, fill: 'C' },
      { halfWidth: 7, fill: 'C', eyes: true },
      { halfWidth: 6, fill: 'C' },
      { halfWidth: 4, fill: 'C' },
      { halfWidth: 2, fill: 'C' },
      { halfWidth: 1, fill: 'T' },
      { halfWidth: 2, fill: 'T' },
      { halfWidth: 2, fill: 'T' },
      { halfWidth: 2, fill: 'T' },
      { halfWidth: 1, fill: 'T' },
      null,
      null,
    ],
  },
  skeleton: {
    width: 16,
    centerLeft: 7,
    centerRight: 8,
    outline: K,
    palette: { K: '#3a3542', B: '#d9c9b8' },
    rows: [
      null,
      { halfWidth: 1, fill: 'B' },
      { halfWidth: 3, fill: 'B', eyes: true },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 1, fill: 'B' },
      { halfWidth: 5, fill: 'B' },
      { halfWidth: 3, fill: 'B' },
      { halfWidth: 5, fill: 'B' },
      { halfWidth: 3, fill: 'B' },
      { halfWidth: 2, fill: 'B' },
      { halfWidth: 3, fill: 'B' },
      { halfWidth: 1, fill: 'B' },
      { halfWidth: 1, fill: 'B' },
      null,
      null,
      null,
    ],
  },
  golem: {
    width: 16,
    centerLeft: 7,
    centerRight: 8,
    outline: K,
    palette: { K: '#3a3542', S: '#8b8698', C: '#e0955a' },
    rows: [
      null,
      { halfWidth: 2, fill: 'S' },
      { halfWidth: 5, fill: 'S', eyes: true },
      { halfWidth: 7, fill: 'S' },
      { halfWidth: 6, fill: 'S' },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 5, fill: 'C' },
      { halfWidth: 5, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 4, fill: 'S' },
      { halfWidth: 3, fill: 'S' },
      null,
      null,
      null,
      null,
    ],
  },
  dragon: {
    width: 20,
    centerLeft: 9,
    centerRight: 10,
    outline: 'Y',
    palette: { Y: '#c9a94f', D: '#6b4a4a', W: '#4a3a3a', F: '#e8a23a' },
    rows: [
      null,
      { halfWidth: 1, fill: 'D' },
      { halfWidth: 2, fill: 'D' },
      { halfWidth: 3, fill: 'D', eyes: true },
      { halfWidth: 2, fill: 'D' },
      { halfWidth: 3, fill: 'D' },
      { halfWidth: 8, fill: 'W' },
      { halfWidth: 10, fill: 'W' },
      { halfWidth: 9, fill: 'W' },
      { halfWidth: 6, fill: 'W' },
      { halfWidth: 5, fill: 'D' },
      { halfWidth: 5, fill: 'D' },
      { halfWidth: 5, fill: 'D' },
      { halfWidth: 4, fill: 'D' },
      { halfWidth: 3, fill: 'D' },
      { halfWidth: 2, fill: 'D' },
      { halfWidth: 2, fill: 'F' },
      { halfWidth: 1, fill: 'F' },
      null,
      null,
    ],
  },
};

export type MonsterSpriteId = keyof typeof MONSTER_VISUALS;

export interface MonsterFrameData {
  frame: string[];
  palette: Record<string, string>;
}

// 魔王/大魔王不沿用上面「半寬序列」產生器(那套只做得出對稱的圓潤/獸型輪廓),
// 改用跟 equipmentIcons.ts/skillIcons.ts 同一套「座標點列表 → 固定尺寸網格」手法,
// 才能刻出「寬肩+雙角+斗篷」這種非對稱細節、且保證每列寬度一致不會拼歪。
interface Mark {
  x: number;
  y: number;
  c: string;
}

function buildMarkFrame(size: number, marks: Mark[]): string[] {
  const grid: string[][] = Array.from({ length: size }, () => new Array(size).fill('.'));
  for (const { x, y, c } of marks) {
    if (x >= 0 && x < size && y >= 0 && y < size) grid[y][x] = c;
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

// 5 款關卡魔王依玩家目前的職業階級(JobTier)分開造型,呼應主畫面背景(backgrounds.ts)本來就
// 依階級由樸素到華麗遞進的視覺基調——不再是全部關卡共用同一隻「關卡魔王」。體型都比一般怪物
// (最大 20 寬的幼龍)更壯碩醒目,但輪廓/配色各自設計出區別(角/獠牙/披風/翅膀/皇冠依序遞增)。

const BOSS_TIER1_CANVAS = 20;

// Tier1 荒地首領:雙角、寬肩斗篷、紅色發光雙眼——最初階、造型最簡樸的魔王。
const BOSS_TIER1_MARKS: Mark[] = [
  ...rect(5, 0, 6, 1, 'K'),
  ...rect(13, 0, 14, 1, 'K'),
  ...rect(6, 2, 13, 6, 'H'),
  { x: 8, y: 4, c: 'R' },
  { x: 11, y: 4, c: 'R' },
  ...rect(7, 7, 12, 7, 'K'),
  ...rect(2, 8, 17, 10, 'C'),
  ...rect(6, 8, 13, 10, 'B'),
  ...rect(6, 10, 13, 15, 'B'),
  ...rect(6, 16, 8, 19, 'B'),
  ...rect(11, 16, 13, 19, 'B'),
  ...rect(6, 18, 8, 19, 'K'),
  ...rect(11, 18, 13, 19, 'K'),
];

const BOSS_TIER1_PALETTE: Record<string, string> = {
  K: '#2a1a1a',
  H: '#7a4a4a',
  R: '#e05050',
  C: '#4a2a3a',
  B: '#6b3a4a',
};

const BOSS_TIER2_CANVAS = 20;

// Tier2 窖藏獸王:寬臉獠牙、毛皮肩甲,獸化路線,棕橙色調跟 tier1 的暗紅拉開差異。
const BOSS_TIER2_MARKS: Mark[] = [
  ...rect(4, 1, 5, 2, 'K'),
  ...rect(14, 1, 15, 2, 'K'),
  ...rect(5, 2, 14, 7, 'H'),
  { x: 7, y: 5, c: 'R' },
  { x: 12, y: 5, c: 'R' },
  { x: 7, y: 7, c: 'W' },
  { x: 12, y: 7, c: 'W' },
  ...rect(3, 8, 16, 10, 'C'),
  ...rect(5, 10, 14, 16, 'B'),
  ...rect(5, 17, 8, 19, 'B'),
  ...rect(11, 17, 14, 19, 'B'),
  ...rect(5, 18, 8, 19, 'K'),
  ...rect(11, 18, 14, 19, 'K'),
];

const BOSS_TIER2_PALETTE: Record<string, string> = {
  K: '#241c14',
  H: '#8a6a42',
  R: '#e0a050',
  C: '#4a3a24',
  B: '#6b5230',
  W: '#f2ead8',
};

const BOSS_TIER3_CANVAS = 22;

// Tier3 鏽甲督軍:尖刺頭盔、方正護肩、鏽蝕金屬色,走「重裝軍將」路線。
const BOSS_TIER3_MARKS: Mark[] = [
  ...rect(9, 0, 12, 1, 'K'),
  ...rect(7, 1, 14, 6, 'H'),
  { x: 9, y: 4, c: 'R' },
  { x: 12, y: 4, c: 'R' },
  ...rect(8, 5, 13, 5, 'K'),
  ...rect(2, 7, 19, 9, 'C'),
  ...rect(4, 7, 7, 9, 'M'),
  ...rect(14, 7, 17, 9, 'M'),
  ...rect(7, 9, 14, 16, 'B'),
  ...rect(9, 10, 12, 12, 'M'),
  ...rect(7, 17, 10, 21, 'B'),
  ...rect(11, 17, 14, 21, 'B'),
  ...rect(7, 19, 10, 21, 'K'),
  ...rect(11, 19, 14, 21, 'K'),
];

const BOSS_TIER3_PALETTE: Record<string, string> = {
  K: '#1c1a18',
  H: '#7a5a4a',
  R: '#e07a40',
  C: '#3a3632',
  B: '#5a4438',
  M: '#9a6a48',
};

const BOSS_TIER4_CANVAS = 22;

// Tier4 幽夜魔君:雙翼展開、下半身化為虛影,深紫色調,走「幽冥系」路線。
const BOSS_TIER4_MARKS: Mark[] = [
  { x: 8, y: 0, c: 'K' },
  { x: 13, y: 0, c: 'K' },
  ...rect(8, 1, 13, 6, 'H'),
  { x: 9, y: 4, c: 'R' },
  { x: 12, y: 4, c: 'R' },
  ...rect(0, 6, 6, 10, 'W'),
  ...rect(15, 6, 21, 10, 'W'),
  ...rect(7, 7, 14, 9, 'K'),
  ...rect(6, 9, 15, 15, 'B'),
  ...rect(8, 10, 13, 12, 'C'),
  ...rect(8, 16, 13, 18, 'B'),
  ...rect(9, 19, 12, 21, 'B'),
];

const BOSS_TIER4_PALETTE: Record<string, string> = {
  K: '#140a1c',
  H: '#3a1e4a',
  R: '#c060f0',
  W: '#241436',
  B: '#2a1638',
  C: '#4a2860',
};

const BOSS_TIER5_CANVAS = 24;

// Tier5 巔峰宗師:皇冠、寬幅披風、金白配色,循環進度最頂端的魔王——比 tier1~4 更華麗,
// 但走「聖騎士式的莊嚴」路線,跟大魔王(FINAL_BOSS_MARKS 的雙翼魔王路線)刻意做出區隔。
const BOSS_TIER5_MARKS: Mark[] = [
  ...rect(10, 0, 13, 1, 'Y'),
  { x: 9, y: 1, c: 'Y' },
  { x: 14, y: 1, c: 'Y' },
  { x: 11, y: 0, c: 'W' },
  { x: 12, y: 0, c: 'W' },
  ...rect(9, 2, 14, 7, 'H'),
  { x: 10, y: 4, c: 'R' },
  { x: 13, y: 4, c: 'R' },
  ...rect(1, 8, 22, 13, 'C'),
  ...rect(4, 8, 19, 12, 'B'),
  ...rect(9, 8, 14, 16, 'B'),
  ...rect(10, 9, 13, 9, 'Y'),
  ...rect(10, 14, 13, 14, 'Y'),
  ...rect(8, 17, 11, 22, 'B'),
  ...rect(12, 17, 15, 22, 'B'),
  ...rect(8, 20, 11, 22, 'K'),
  ...rect(12, 20, 15, 22, 'K'),
];

const BOSS_TIER5_PALETTE: Record<string, string> = {
  K: '#241c10',
  H: '#8a7248',
  R: '#f2d675',
  C: '#3a3020',
  B: '#5a4a2a',
  Y: '#c9a94f',
  W: '#f2ead8',
};

const FINAL_BOSS_CANVAS = 24;

// 大魔王:在魔王的基礎上加金冠、雙翼,配色改金黑對比,體型再放大一圈,一眼看得出是整組循環的最終王。
const FINAL_BOSS_MARKS: Mark[] = [
  ...rect(10, 0, 13, 1, 'Y'),
  { x: 9, y: 1, c: 'Y' },
  { x: 14, y: 1, c: 'Y' },
  ...rect(8, 2, 15, 6, 'H'),
  { x: 10, y: 4, c: 'R' },
  { x: 13, y: 4, c: 'R' },
  ...rect(9, 7, 14, 7, 'K'),
  ...rect(0, 8, 6, 12, 'W'),
  ...rect(17, 8, 23, 12, 'W'),
  ...rect(6, 8, 17, 12, 'C'),
  ...rect(9, 8, 14, 12, 'B'),
  ...rect(8, 12, 15, 18, 'B'),
  ...rect(8, 19, 11, 23, 'B'),
  ...rect(12, 19, 15, 23, 'B'),
  ...rect(8, 22, 11, 23, 'K'),
  ...rect(12, 22, 15, 23, 'K'),
];

const FINAL_BOSS_PALETTE: Record<string, string> = {
  K: '#1a1410',
  H: '#3a3020',
  R: '#f2d675',
  C: '#2a2015',
  B: '#4a3a1a',
  W: '#2a2015',
  Y: '#c9a94f',
};

const CUSTOM_MONSTER_FRAMES: Record<string, MonsterFrameData> = {
  stage_boss_tier1: { frame: buildMarkFrame(BOSS_TIER1_CANVAS, BOSS_TIER1_MARKS), palette: BOSS_TIER1_PALETTE },
  stage_boss_tier2: { frame: buildMarkFrame(BOSS_TIER2_CANVAS, BOSS_TIER2_MARKS), palette: BOSS_TIER2_PALETTE },
  stage_boss_tier3: { frame: buildMarkFrame(BOSS_TIER3_CANVAS, BOSS_TIER3_MARKS), palette: BOSS_TIER3_PALETTE },
  stage_boss_tier4: { frame: buildMarkFrame(BOSS_TIER4_CANVAS, BOSS_TIER4_MARKS), palette: BOSS_TIER4_PALETTE },
  stage_boss_tier5: { frame: buildMarkFrame(BOSS_TIER5_CANVAS, BOSS_TIER5_MARKS), palette: BOSS_TIER5_PALETTE },
  final_boss: { frame: buildMarkFrame(FINAL_BOSS_CANVAS, FINAL_BOSS_MARKS), palette: FINAL_BOSS_PALETTE },
};

export function getMonsterFrame(id: string): MonsterFrameData {
  const custom = CUSTOM_MONSTER_FRAMES[id];
  if (custom) return { frame: upscaleFrame(custom.frame, SCALE), palette: custom.palette };
  const spec = MONSTER_VISUALS[id];
  if (!spec) throw new Error(`No monster visual defined for id: ${id}`);
  const built = buildMonsterFrame(spec);
  return { frame: upscaleFrame(built.frame, SCALE), palette: built.palette };
}

export function hasMonsterVisual(id: string): boolean {
  return id in MONSTER_VISUALS || id in CUSTOM_MONSTER_FRAMES;
}
